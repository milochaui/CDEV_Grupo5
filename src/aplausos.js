// Aplausos y gritos del público al terminar cada tema.
// No usan archivos de audio: los "fabricamos" con el navegador (Web Audio), como un
// sintetizador. Todo sale de ruido blanco (un sonido al azar, como el "shhh" de una
// radio mal sintonizada) pasado por filtros:
//  - Palmas: cientos de golpecitos de ruido muy cortos, cada uno con un filtro distinto.
//  - Grito de la multitud: ruido largo con un filtro que va cambiando ("uuuuh-aaah").
//  - Silbidos: tonos agudos que suben y bajan.
// El sonido sale de en medio del público y baja con la distancia igual que la música.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const DURACION = 6; // segundos que dura la ovación de un tema conocido
const PALMAS_POR_SEGUNDO = 70; // en el momento más fuerte
const VOLUMEN_PALMAS = 0.5;
const VOLUMEN_GRITO = 0.35;
const VOLUMEN_SILBIDOS = 0.06;
const CANTIDAD_SILBIDOS = 5; // con un tema conocido

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

// Forma de la ovación en el tiempo: u va de 0 (empieza) a 1 (termina).
// Sube rápido (en el primer 10 %) y después se va apagando de a poco.
function forma(u) {
  if (u < 0 || u > 1) {
    return 0;
  }
  if (u < 0.1) {
    return u / 0.1;
  }
  return Math.pow(1 - (u - 0.1) / 0.9, 1.5);
}

/**
 * Crea los aplausos de un escenario.
 *
 * @param {THREE.AudioListener} oyente  Los "oídos" del jugador
 * @returns {{ sonido: THREE.PositionalAudio, aplaudir: (intensidad: number) => void,
 *             actualizarVolumen: (volumen: number) => void, intensidad: () => number }}
 */
export function crearAplausos(oyente) {
  const contexto = oyente.context; // el "motor" de sonido del navegador

  // --- Ruido blanco ---
  // Un buffer es un pedazo de sonido guardado en memoria: una lista de números entre −1 y 1
  // (sampleRate números por segundo). Si son todos al azar, suena a ruido.
  const ruido = contexto.createBuffer(1, contexto.sampleRate * 2, contexto.sampleRate);
  const datos = ruido.getChannelData(0);
  for (let i = 0; i < datos.length; i++) {
    datos[i] = Math.random() * 2 - 1;
  }

  // Todos los sonidos del público se juntan en "entrada", y de ahí van a un PositionalAudio
  // (como la música): así el sonido viene del lado del público y baja con la distancia.
  const entrada = contexto.createGain();
  const sonido = new THREE.PositionalAudio(oyente);
  sonido.setDistanceModel('linear');
  sonido.setRolloffFactor(0); // el volumen por distancia lo ponemos nosotros (actualizarVolumen)
  sonido.setNodeSource(entrada);

  // Para saber qué tan fuerte está la ovación en cada momento (ver intensidad()).
  let inicio = -100; // en segundos del reloj del sonido (contexto.currentTime)
  let duracion = 1;
  let fuerza = 0;

  // Una palma: un golpecito de ruido de 60 milésimas, que arranca en "momento".
  function palma(momento, volumen) {
    const fuente = contexto.createBufferSource();
    fuente.buffer = ruido;
    // Filtro "pasabanda": deja pasar solo las frecuencias cerca de "frequency".
    // Cada palma con una frecuencia distinta: unas más graves, otras más agudas.
    const filtro = contexto.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = mezclar(900, 2600, Math.random());
    filtro.Q.value = 1.5;
    // El volumen arranca arriba y cae casi a cero enseguida: eso es un "clap".
    const volumenPalma = contexto.createGain();
    volumenPalma.gain.setValueAtTime(volumen, momento);
    volumenPalma.gain.exponentialRampToValueAtTime(0.001, momento + 0.06);

    fuente.connect(filtro);
    filtro.connect(volumenPalma);
    volumenPalma.connect(entrada);
    // Arranca en un lugar al azar del ruido, para que no suenen todas iguales.
    fuente.start(momento, Math.random() * 1.9, 0.07);
  }

  // El grito de la multitud: ruido con un filtro que se mueve, como una vocal larga.
  function grito(ahora, intensidad) {
    const fuente = contexto.createBufferSource();
    fuente.buffer = ruido;
    fuente.loop = true; // el ruido dura 2 s: lo repetimos mientras haga falta

    const filtro = contexto.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 0.8;
    // "uuuh" (grave) → "aaah" (más agudo) → baja de nuevo
    filtro.frequency.setValueAtTime(450, ahora);
    filtro.frequency.linearRampToValueAtTime(950, ahora + 0.6);
    filtro.frequency.linearRampToValueAtTime(600, ahora + duracion);

    const volumen = contexto.createGain();
    volumen.gain.setValueAtTime(0, ahora);
    volumen.gain.linearRampToValueAtTime(VOLUMEN_GRITO * intensidad, ahora + 0.4);
    volumen.gain.linearRampToValueAtTime(0, ahora + duracion);

    fuente.connect(filtro);
    filtro.connect(volumen);
    volumen.connect(entrada);
    fuente.start(ahora);
    fuente.stop(ahora + duracion);
  }

  // Un silbido: un tono puro (onda "seno") agudo que sube y baja.
  function silbido(momento) {
    const oscilador = contexto.createOscillator();
    oscilador.type = 'sine';
    const nota = mezclar(1800, 2600, Math.random());
    oscilador.frequency.setValueAtTime(nota * 0.8, momento);
    oscilador.frequency.linearRampToValueAtTime(nota, momento + 0.15);
    oscilador.frequency.linearRampToValueAtTime(nota * 0.9, momento + 0.6);

    const volumen = contexto.createGain();
    volumen.gain.setValueAtTime(0, momento);
    volumen.gain.linearRampToValueAtTime(VOLUMEN_SILBIDOS, momento + 0.05);
    volumen.gain.linearRampToValueAtTime(0, momento + 0.6);

    oscilador.connect(volumen);
    volumen.connect(entrada);
    oscilador.start(momento);
    oscilador.stop(momento + 0.65);
  }

  /**
   * Arranca una ovación.
   * @param {number} intensidad  De 0 a 1: con 1 (tema conocido) es más larga y más fuerte
   */
  function aplaudir(intensidad) {
    const ahora = contexto.currentTime;
    inicio = ahora;
    duracion = DURACION * mezclar(0.5, 1, intensidad);
    fuerza = intensidad;

    // Palmas: recorremos la ovación en pasitos y en cada uno, según la forma (más palmas
    // al principio, menos al final), decidimos al azar si hay una palma.
    // Las programamos todas ahora: Web Audio las hace sonar en el momento justo.
    const paso = 1 / PALMAS_POR_SEGUNDO;
    for (let t = 0; t < duracion; t += paso) {
      if (Math.random() < forma(t / duracion) * mezclar(0.4, 1, intensidad)) {
        palma(ahora + t + Math.random() * paso, VOLUMEN_PALMAS * mezclar(0.5, 1, Math.random()));
      }
    }

    grito(ahora, intensidad);

    const silbidos = Math.round(CANTIDAD_SILBIDOS * intensidad);
    for (let i = 0; i < silbidos; i++) {
      silbido(ahora + Math.random() * duracion * 0.5);
    }
  }

  // Volumen según la distancia (0 a 1). Lo calcula la música del escenario (ver main.js).
  function actualizarVolumen(volumen) {
    sonido.setVolume(volumen);
  }

  // Qué tan fuerte está la ovación ahora, de 0 a 1. La usa el público para levantar los brazos.
  function intensidad() {
    return forma((contexto.currentTime - inicio) / duracion) * fuerza;
  }

  return { sonido, aplaudir, actualizarVolumen, intensidad };
}
