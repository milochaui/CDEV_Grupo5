// Control del jugador en primera persona.
// Mira con el mouse (puntero capturado), camina con WASD o las flechas
// y corre manteniendo Shift. No deja salir del predio ni atravesar obstáculos.
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Configuración del jugador ---
const ALTURA_OJOS = 1.7; // metros: a esta altura va la cámara
const VELOCIDAD_CAMINAR = 5; // metros por segundo
const VELOCIDAD_CORRER = 10; // metros por segundo (con Shift)
// El jugador ocupa un círculo de este radio en el piso. Sirve para que la cámara
// no quede "pegada" a las paredes y se vea el interior de los objetos.
const RADIO_JUGADOR = 0.4;

/**
 * Crea el control del jugador.
 *
 * @param {THREE.PerspectiveCamera} camara  La cámara que hace de "ojos" del jugador
 * @param {HTMLElement} elemento            Elemento de la página que captura el mouse
 * @param {object} opciones
 * @param {Array} opciones.colisiones  Cajas {minX, maxX, minZ, maxZ} que no se pueden atravesar
 * @param {number} opciones.limitePredio  Distancia máxima al centro del predio (en X y en Z)
 * @returns {{ controles: PointerLockControls, actualizar: (delta: number) => void }}
 */
export function crearJugador(camara, elemento, opciones) {
  // PointerLockControls (viene con Three.js) se encarga de:
  //  - capturar el puntero cuando llamamos a controles.lock()
  //  - girar la cámara cuando se mueve el mouse
  //  - avisar con los eventos 'lock' y 'unlock' cuando se captura o se suelta
  //    (por ejemplo, el navegador lo suelta solo cuando se aprieta Esc).
  const controles = new PointerLockControls(camara, elemento);

  camara.position.y = ALTURA_OJOS;

  // --- Teclado ---
  // Guardamos qué teclas están apretadas en este momento.
  // Usamos event.code (la tecla física) y no event.key (la letra), así funciona
  // igual con cualquier distribución de teclado.
  const teclas = {};

  document.addEventListener('keydown', (event) => {
    teclas[event.code] = true;
  });
  document.addEventListener('keyup', (event) => {
    teclas[event.code] = false;
  });

  // Si se suelta el mouse (Esc) con una tecla apretada, nunca nos llega su "keyup".
  // Para que el jugador no siga caminando solo, olvidamos todas las teclas.
  controles.addEventListener('unlock', () => {
    for (const codigo in teclas) {
      teclas[codigo] = false;
    }
  });

  // Devuelve true si el jugador, parado en (x, z), se mete en alguna caja de colisión.
  // Agrandamos cada caja con el radio del jugador: es como chequear un círculo contra la caja.
  function chocaConAlgo(x, z) {
    for (const caja of opciones.colisiones) {
      const adentroEnX = x > caja.minX - RADIO_JUGADOR && x < caja.maxX + RADIO_JUGADOR;
      const adentroEnZ = z > caja.minZ - RADIO_JUGADOR && z < caja.maxZ + RADIO_JUGADOR;
      if (adentroEnX && adentroEnZ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mueve al jugador según las teclas apretadas. Se llama en cada cuadro de la animación.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // Si el mouse no está capturado (pantalla de inicio), el jugador no se mueve.
    if (!controles.isLocked) {
      return;
    }

    // Dirección pedida por el teclado: +1 hacia adelante/derecha, -1 hacia atrás/izquierda.
    let adelante = 0;
    let derecha = 0;
    if (teclas['KeyW'] || teclas['ArrowUp']) adelante += 1;
    if (teclas['KeyS'] || teclas['ArrowDown']) adelante -= 1;
    if (teclas['KeyD'] || teclas['ArrowRight']) derecha += 1;
    if (teclas['KeyA'] || teclas['ArrowLeft']) derecha -= 1;

    if (adelante === 0 && derecha === 0) {
      return;
    }

    // En diagonal (por ejemplo W + D) iríamos más rápido que derecho.
    // Dividimos por el largo del vector para que la velocidad sea siempre la misma.
    const largo = Math.hypot(adelante, derecha);
    adelante /= largo;
    derecha /= largo;

    const corriendo = teclas['ShiftLeft'] || teclas['ShiftRight'];
    const velocidad = corriendo ? VELOCIDAD_CORRER : VELOCIDAD_CAMINAR;
    // distancia = velocidad × tiempo. Así se mueve igual en una compu rápida o lenta.
    const distancia = velocidad * delta;

    // Recordamos dónde estábamos antes de movernos.
    const posicion = camara.position;
    const anteriorX = posicion.x;
    const anteriorZ = posicion.z;

    // Movemos la cámara según hacia dónde mira (sin subir ni bajar).
    controles.moveForward(adelante * distancia);
    controles.moveRight(derecha * distancia);

    // --- Límites del predio ---
    // Si se pasa del borde, lo dejamos justo en el borde.
    const limite = opciones.limitePredio - RADIO_JUGADOR;
    posicion.x = Math.min(Math.max(posicion.x, -limite), limite);
    posicion.z = Math.min(Math.max(posicion.z, -limite), limite);

    // --- Colisiones ---
    // Revisamos cada eje por separado: si al moverse en X choca, deshacemos solo X.
    // Así, al caminar en diagonal contra una pared, el jugador "se desliza" a lo largo
    // de ella en vez de quedarse trabado.
    const nuevaX = posicion.x;
    const nuevaZ = posicion.z;
    if (chocaConAlgo(nuevaX, anteriorZ)) {
      posicion.x = anteriorX;
    }
    if (chocaConAlgo(posicion.x, nuevaZ)) {
      posicion.z = anteriorZ;
    }

    // La altura siempre queda fija a la altura de los ojos.
    posicion.y = ALTURA_OJOS;
  }

  return { controles, actualizar };
}
