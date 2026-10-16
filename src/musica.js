// Música de un escenario: un "parlante" 3D que reproduce una lista de temas en orden.
// El volumen baja con la distancia y el sonido se ubica en el espacio (izquierda/derecha)
// según hacia dónde mira el jugador.
import * as THREE from 'three';

// --- Cómo baja el volumen con la distancia (curva cuadrática) ---
// 1. Hasta DISTANCIA_VOLUMEN_COMPLETO: suena al 100 %.
// 2. Entre DISTANCIA_VOLUMEN_COMPLETO y DISTANCIA_SILENCIO: baja siguiendo una curva.
// 3. Más allá de DISTANCIA_SILENCIO: silencio total.
// Con estos valores: a 20 m = 100 %, a 40 m ≈ 93 %, a 60 m ≈ 73 %, a 80 m ≈ 39 %,
// a 92 m ≈ 12 % y desde 97 m = 0 %.
// Pensados para los tres escenarios en triángulo (ver main.js):
//  - frente a un escenario (a 20 m de su parlante) esa banda suena al 100 % y las otras
//    dos están a más de 140 m: no se escuchan.
//  - en el centro del predio los tres parlantes están a unos 92 m: las tres bandas
//    suenan al 12 %, bajito, de fondo.
const DISTANCIA_VOLUMEN_COMPLETO = 20; // metros
const DISTANCIA_SILENCIO = 97; // metros

// Vite sirve la carpeta public/audio en la dirección /audio
const CARPETA_AUDIO = '/audio/';

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
 * @param {THREE.AudioListener} oyente  Los "oídos" del jugador (van pegados a la cámara)
 * @param {Array<{archivo: string, titulo: string, conocido: boolean}>} temas  Lista de temas en orden
 * @returns {{ sonido: THREE.PositionalAudio, arrancar: () => void, temaActual: () => object,
 *             actualizarVolumen: (posicionJugador: THREE.Vector3) => void, volumen: () => number }}
 */
export function crearMusica(oyente, temas) {
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

  // Posición en la lista del tema que está sonando.
  let indice = 0;

  // Carga el tema de la posición "indice" y lo hace sonar.
  function reproducirTemaActual() {
    elemento.src = CARPETA_AUDIO + temas[indice].archivo;
    elemento.play();
  }

  // Cuando termina un tema pasamos al siguiente. El % (resto de la división) hace que
  // después del último volvamos al primero: con 2 temas, (1 + 1) % 2 = 0.
  elemento.addEventListener('ended', () => {
    indice = (indice + 1) % temas.length;
    reproducirTemaActual();
  });

  // Empieza la lista desde el primer tema. Se llama con el clic del jugador,
  // porque los navegadores no dejan reproducir sonido sin una interacción.
  function arrancar() {
    indice = 0;
    reproducirTemaActual();
  }

  // Devuelve el tema que está sonando ahora: { archivo, titulo, conocido }
  function temaActual() {
    return temas[indice];
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

  return { sonido, arrancar, temaActual, actualizarVolumen, volumen };
}
