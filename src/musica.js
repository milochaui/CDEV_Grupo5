// Música de un escenario: un "parlante" 3D que reproduce una lista de temas en orden.
// El volumen baja con la distancia y el sonido se ubica en el espacio (izquierda/derecha)
// según hacia dónde mira el jugador.
import * as THREE from 'three';

// --- Cómo baja el volumen con la distancia ---
// Con el modelo 'inverse' (el más parecido al sonido real) el volumen es:
//   volumen = DISTANCIA_REFERENCIA / (DISTANCIA_REFERENCIA + ATENUACION × (distancia − DISTANCIA_REFERENCIA))
// Con estos valores: a 30 m ≈ 57 %, a 60 m ≈ 25 %, a 100 m ≈ 14 %, a 200 m ≈ 7 %.
const DISTANCIA_REFERENCIA = 20; // metros: hasta acá suena al 100 %
const ATENUACION = 1.5; // qué tan rápido baja después (más alto = baja más rápido)

// Vite sirve la carpeta public/audio en la dirección /audio
const CARPETA_AUDIO = '/audio/';

/**
 * Crea la música de un escenario.
 *
 * @param {THREE.AudioListener} oyente  Los "oídos" del jugador (van pegados a la cámara)
 * @param {Array<{archivo: string, titulo: string, conocido: boolean}>} temas  Lista de temas en orden
 * @returns {{ sonido: THREE.PositionalAudio, arrancar: () => void, temaActual: () => object }}
 */
export function crearMusica(oyente, temas) {
  // PositionalAudio es un sonido con posición en el mundo 3D: se agrega al escenario
  // como cualquier otro objeto. Por defecto usa el modelo 'HRTF', que simula cómo llega
  // el sonido a cada oído, y así se nota de qué lado viene.
  const sonido = new THREE.PositionalAudio(oyente);
  sonido.setDistanceModel('inverse');
  sonido.setRefDistance(DISTANCIA_REFERENCIA);
  sonido.setRolloffFactor(ATENUACION);

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

  return { sonido, arrancar, temaActual };
}
