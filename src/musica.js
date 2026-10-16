// Música de un escenario: un "parlante" 3D que reproduce una lista de temas en orden.
// El volumen baja con la distancia y el sonido se ubica en el espacio (izquierda/derecha)
// según hacia dónde mira el jugador.
import * as THREE from 'three';

// --- Cómo baja el volumen con la distancia (tres zonas) ---
// 1. Hasta DISTANCIA_VOLUMEN_COMPLETO: suena al 100 %.
// 2. Entre DISTANCIA_VOLUMEN_COMPLETO y DISTANCIA_SILENCIO: baja de a poco, en línea recta.
// 3. Más allá de DISTANCIA_SILENCIO: silencio total.
// Con estos valores: a 20 m = 100 %, a 50 m ≈ 73 %, a 75 m = 50 %, a 100 m ≈ 27 %,
// a 120 m ≈ 9 % y desde 130 m = 0 %.
const DISTANCIA_VOLUMEN_COMPLETO = 20; // metros
const DISTANCIA_SILENCIO = 130; // metros

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
  // El modelo 'linear' es el único que llega a silencio total: el volumen baja en
  // línea recta desde la distancia de referencia (refDistance) hasta la máxima (maxDistance).
  //   volumen = 1 − (distancia − refDistance) / (maxDistance − refDistance)
  sonido.setDistanceModel('linear');
  sonido.setRefDistance(DISTANCIA_VOLUMEN_COMPLETO);
  sonido.setMaxDistance(DISTANCIA_SILENCIO);
  // Con rolloffFactor = 1 el volumen llega justo a 0 en maxDistance.
  sonido.setRolloffFactor(1);

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
