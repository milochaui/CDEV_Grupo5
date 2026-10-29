// Música de un escenario: un "parlante" 3D que reproduce el set de la banda que toca
// (su lista de temas, en orden).
// El volumen baja con la distancia y el sonido se ubica en el espacio (izquierda/derecha)
// según hacia dónde mira el jugador.
import * as THREE from 'three';

// --- Cómo baja el volumen con la distancia (curva cuadrática) ---
// 1. Hasta DISTANCIA_VOLUMEN_COMPLETO: suena al 100 %.
// 2. Entre DISTANCIA_VOLUMEN_COMPLETO y DISTANCIA_SILENCIO: baja siguiendo una curva.
// 3. Más allá de DISTANCIA_SILENCIO: silencio total.
// Con estos valores: a 20 m = 100 %, a 40 m ≈ 88 %, a 60 m ≈ 52 %, a 74 m ≈ 13 %
// y desde 78 m = 0 %.
// Pensados para los tres escenarios en triángulo (ver main.js):
//  - metido en el público de un escenario esa banda suena fuerte y los parlantes de las
//    otras dos están a más de 95 m: no se escuchan.
//  - en el centro del predio los tres parlantes están a unos 74 m: las tres bandas
//    suenan al 13 %, bajito, de fondo.
const DISTANCIA_VOLUMEN_COMPLETO = 20; // metros
const DISTANCIA_SILENCIO = 78; // metros

// Vite sirve la carpeta public/audio en la dirección /audio
const CARPETA_AUDIO = '/audio/';

// Silencio entre un tema y el siguiente: ahí el público aplaude (ver aplausos.js).
const SEGUNDOS_ENTRE_TEMAS = 6;

// Si falta el mp3 de un tema, la banda se queda este tiempo en el escenario (en silencio)
// antes de pasar al siguiente: más o menos lo que dura un tema. Así, aunque falten
// audios, cada banda ocupa su lugar en la grilla y no se adelanta la siguiente.
const SEGUNDOS_SIN_AUDIO = 240;

// Lo que devuelve temaActual() antes de que toque la primera banda.
const SIN_TEMA = { archivo: null, titulo: '', conocido: false };

/**
 * Calcula el volumen (de 0 a 1) que corresponde a una distancia, en metros.
 *
 * Usamos la curva  volumen = 1 − t²,  donde t va de 0 (volumen completo) a 1 (silencio).
 * Como t² es chiquito cuando t es chico, cerca del escenario el volumen casi no baja;
 * a media distancia t² crece cada vez más rápido y el volumen cae fuerte.
 * Por ejemplo: t = 0.25 → 94 %,  t = 0.5 → 75 %,  t = 0.75 → 44 %,  t = 1 → 0 %.
 * (En línea recta, como antes, t = 0.25 ya daba 75 %.)
 */
function volumenSegunDistancia(distancia) {
  if (distancia <= DISTANCIA_VOLUMEN_COMPLETO) {
    return 1;
  }
  if (distancia >= DISTANCIA_SILENCIO) {
    return 0;
  }
  // t: qué parte del camino entre "volumen completo" y "silencio" ya recorrimos (0 a 1).
  const t =
    (distancia - DISTANCIA_VOLUMEN_COMPLETO) / (DISTANCIA_SILENCIO - DISTANCIA_VOLUMEN_COMPLETO);
  return 1 - t * t;
}

/**
 * Crea la música de un escenario.
 *
 * Arranca en silencio: suena recién cuando alguien llama a tocarSet().
 *
 * @param {THREE.AudioListener} oyente  Los "oídos" del jugador (van pegados a la cámara)
 * @returns {{ sonido: THREE.PositionalAudio, tocarSet: (temas, repetir) => void,
 *             pausar: () => void, reanudar: () => void, temaActual: () => object,
 *             hayShow: () => boolean, faltaAudio: () => boolean,
 *             actualizarVolumen: (posicionJugador: THREE.Vector3) => void, volumen: () => number,
 *             estaSonando: () => boolean, graves: () => number,
 *             alTerminarTema: (funcion: (tema) => void) => void,
 *             segundosDelTema: () => number, numeroDeTema: () => number }}
 */
export function crearMusica(oyente) {
  // PositionalAudio es un sonido con posición en el mundo 3D: se agrega al escenario
  // como cualquier otro objeto. Por defecto usa el modelo 'HRTF', que simula cómo llega
  // el sonido a cada oído, y así se nota de qué lado viene.
  const sonido = new THREE.PositionalAudio(oyente);
  // Los modelos de distancia que trae el navegador ('linear', 'inverse' y 'exponential')
  // no tienen la curva que queremos, así que el volumen lo calculamos nosotros
  // (ver actualizarVolumen más abajo). Con rolloffFactor = 0 el navegador no baja
  // el volumen por la distancia: el PositionalAudio solo se ocupa de la dirección.
  sonido.setDistanceModel('linear');
  sonido.setRolloffFactor(0);

  // Un elemento <audio> de HTML reproduce el mp3. Lo conectamos al PositionalAudio para
  // que su sonido pase por el "parlante" 3D. Ventaja: el mp3 se va cargando mientras suena.
  const elemento = new Audio();
  sonido.setMediaElementSource(elemento);

  // --- Análisis del audio (para que el público salte con los golpes) ---
  // Un AnalyserNode "escucha" el sonido y nos dice cuánta energía hay en cada frecuencia.
  // Lo conectamos a sonido.source (el sonido del mp3 tal cual sale del <audio>), ANTES
  // del volumen por distancia y del volumen general. Así el público oye a su banda
  // igual de fuerte aunque el jugador esté lejos o en pausa.
  // (Un nodo puede conectarse a varios destinos: el sonido sigue llegando a los parlantes.)
  const analizador = sonido.context.createAnalyser();
  // fftSize = cuántas muestras usa para el análisis. Con 1024 obtenemos 512 "franjas"
  // de frecuencia, de unos 43 Hz cada una (depende de la placa de sonido).
  analizador.fftSize = 1024;
  // Rango que mide, en decibeles: de −60 dB (casi nada) a 0 dB (lo más fuerte posible).
  // Así un tema bien fuerte no llega al tope y todavía se notan los golpes.
  analizador.minDecibels = -60;
  analizador.maxDecibels = 0;
  // Suavizado entre una medición y la siguiente (de 0 a 1). Con poco suavizado
  // los golpes se notan más rápido.
  analizador.smoothingTimeConstant = 0.5;
  sonido.source.connect(analizador);

  // Lista donde el analizador nos deja la energía de cada franja (de 0 a 255).
  const datosFrecuencias = new Uint8Array(analizador.frequencyBinCount);
  // Qué franjas son "graves" (bombo y bajo): de unos 40 Hz a unos 150 Hz.
  const anchoFranja = sonido.context.sampleRate / analizador.fftSize; // Hz por franja
  const primeraFranjaGrave = Math.max(1, Math.floor(40 / anchoFranja));
  const ultimaFranjaGrave = Math.ceil(150 / anchoFranja);

  // --- El set que se está tocando ---
  // Un "set" es la lista de temas que toca una banda en su turno (ver tocarSet).
  let temas = []; // los temas del set, en orden
  let indice = 0; // posición en la lista del tema que está sonando
  let repetir = false; // true: al terminar el último tema vuelve a empezar (la banda de la noche)
  let enSet = false; // hay una banda tocando su set (también en los silencios entre temas)
  let sinAudio = false; // no se encontró el mp3 del tema actual

  let pausado = false; // el jugador puso pausa
  let entreTemas = false; // terminó un tema y todavía no empezó el siguiente
  let siguienteListo = false; // ya pasó el silencio entre temas
  const avisos = []; // funciones a las que avisamos cuando termina un tema
  // Cuántos temas empezaron a sonar desde que arrancó la música. A diferencia de "indice",
  // nunca vuelve a 0: sirve para distinguir una vez que suena un tema de la vez siguiente.
  let temasEmpezados = 0;

  // Carga el tema de la posición "indice" y lo hace sonar.
  function reproducirTemaActual() {
    sinAudio = false;
    elemento.src = CARPETA_AUDIO + temas[indice].archivo;
    // play() devuelve una "promesa" que falla si el archivo no existe. Ese caso lo
    // atendemos en el evento 'error' de más abajo; acá solo evitamos el error en la consola.
    elemento.play().catch(() => {});
    temasEmpezados++;
  }

  // Después del silencio entre temas: sigue con el próximo tema del set o, si era el
  // último (y no hay que repetir), el set termina y la banda se baja del escenario.
  // El % (resto de la división) hace que después del último volvamos al primero:
  // con 2 temas, (1 + 1) % 2 = 0.
  function avanzar() {
    entreTemas = false;
    siguienteListo = false;
    const eraElUltimo = indice === temas.length - 1;
    if (eraElUltimo && !repetir) {
      enSet = false;
      return;
    }
    indice = (indice + 1) % temas.length;
    reproducirTemaActual();
  }

  // Cuando termina un tema: esperamos un silencio y después avanzamos.
  // "segundos" es cuánto dura ese silencio.
  function terminarTema(segundos) {
    entreTemas = true;
    // setTimeout llama a la función después de esa cantidad de milisegundos.
    setTimeout(() => {
      siguienteListo = true;
      // Si justo está en pausa no avanzamos: lo hace reanudar() al volver.
      if (!pausado) {
        avanzar();
      }
    }, segundos * 1000);
  }

  // Terminó un tema: avisamos (para los aplausos y los fuegos artificiales) y,
  // después de un silencio, seguimos.
  elemento.addEventListener('ended', () => {
    for (const aviso of avisos) {
      aviso(temas[indice]);
    }
    terminarTema(SEGUNDOS_ENTRE_TEMAS);
  });

  // No se encontró el mp3 (todavía no lo copiaron a public/audio): la banda "toca" en
  // silencio un rato y sigue con el siguiente. Así la programación del festival no se
  // traba por un archivo que falta. No avisamos: nadie aplaude un tema que no sonó.
  elemento.addEventListener('error', () => {
    if (!enSet || entreTemas) {
      return;
    }
    console.warn('Falta el audio public/audio/' + temas[indice].archivo);
    sinAudio = true;
    terminarTema(SEGUNDOS_SIN_AUDIO);
  });

  /**
   * Empieza el set de una banda: toca la lista de temas en orden.
   * Lo llama la programación del escenario cuando le toca el turno (ver escenario.js).
   * @param {Array<{archivo: string, titulo: string, conocido: boolean}>} temasDelSet
   * @param {boolean} repetirSet  true: la lista se repite sin parar (la banda que cierra la noche)
   */
  function tocarSet(temasDelSet, repetirSet) {
    temas = temasDelSet;
    repetir = repetirSet;
    indice = 0;
    enSet = true;
    entreTemas = false;
    siguienteListo = false;
    reproducirTemaActual();
  }

  // Pausa el tema. El <audio> se acuerda en qué segundo quedó.
  function pausar() {
    pausado = true;
    elemento.pause();
  }

  // Sigue el tema desde donde quedó. Si ya está sonando no hace nada
  // (así no lo "reiniciamos" sin querer).
  function reanudar() {
    pausado = false;
    if (!enSet) {
      return; // no hay ninguna banda tocando: no hay nada que reanudar
    }
    if (entreTemas) {
      // Estábamos en el silencio entre temas: si ya terminó, avanzamos;
      // si no, lo hace el setTimeout de terminarTema cuando se cumpla el tiempo.
      if (siguienteListo) {
        avanzar();
      }
      return;
    }
    if (elemento.paused) {
      elemento.play().catch(() => {});
    }
  }

  /**
   * Guarda una función para llamarla cada vez que termina un tema.
   * La función recibe el tema que terminó: { archivo, titulo, conocido }.
   */
  function alTerminarTema(funcion) {
    avisos.push(funcion);
  }

  // Devuelve el tema que está sonando ahora: { archivo, titulo, conocido }.
  // Entre un set y otro devuelve el último que sonó (o SIN_TEMA si todavía no tocó nadie),
  // así quien pregunte "¿es conocido?" siempre tiene una respuesta.
  function temaActual() {
    return temas[indice] ?? SIN_TEMA;
  }

  // true si el tema está sonando (antes del primer set, por ejemplo, no suena).
  function estaSonando() {
    return !elemento.paused;
  }

  // true mientras una banda está tocando su set, incluidos los silencios entre temas.
  function hayShow() {
    return enSet;
  }

  // true si al tema actual le falta el mp3 (ver el evento 'error').
  function faltaAudio() {
    return sinAudio;
  }

  // Segundos que lleva sonando el tema actual (currentTime es en qué segundo va el <audio>).
  function segundosDelTema() {
    return elemento.currentTime;
  }

  // Número de la vez que está sonando: 1 el primer tema, 2 el segundo, y así
  // (si la lista vuelve a empezar, sigue sumando).
  function numeroDeTema() {
    return temasEmpezados;
  }

  // Energía de los graves en este momento, de 0 (nada) a 1 (al máximo).
  // Es el promedio de las franjas graves que mide el analizador.
  function graves() {
    analizador.getByteFrequencyData(datosFrecuencias);
    let suma = 0;
    for (let i = primeraFranjaGrave; i <= ultimaFranjaGrave; i++) {
      suma += datosFrecuencias[i];
    }
    const cantidad = ultimaFranjaGrave - primeraFranjaGrave + 1;
    return suma / cantidad / 255;
  }

  // Volumen actual (de 0 a 1) según dónde está el jugador.
  let volumenActual = 0;
  const posicionParlante = new THREE.Vector3(); // la reusamos en cada cuadro

  // Ajusta el volumen según la distancia entre el jugador y el parlante.
  // Se llama en cada cuadro de la animación (ver main.js).
  function actualizarVolumen(posicionJugador) {
    // getWorldPosition nos da la posición del parlante en coordenadas del predio.
    sonido.getWorldPosition(posicionParlante);
    const distancia = posicionJugador.distanceTo(posicionParlante);
    volumenActual = volumenSegunDistancia(distancia);
    sonido.setVolume(volumenActual);
  }

  // Devuelve el volumen actual: sirve para saber qué banda se escucha más fuerte.
  function volumen() {
    return volumenActual;
  }

  return {
    sonido, tocarSet, pausar, reanudar, temaActual, actualizarVolumen, volumen, estaSonando, graves,
    alTerminarTema, hayShow, faltaAudio,
    segundosDelTema, numeroDeTema,
  };
}
