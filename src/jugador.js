// Control del jugador en primera persona.
// Mira con el mouse (puntero capturado), camina con WASD o las flechas
// y corre manteniendo Shift. No deja salir del predio ni atravesar obstáculos.
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Configuración del jugador ---
// La exportamos porque la usa el salto (ver acciones.js).
export const ALTURA_OJOS = 1.7; // metros: a esta altura va la cámara
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
 * @param {Array} opciones.colisiones  Cajas {minX, maxX, minZ, maxZ, centroX, centroZ, angulo}
 *        que no se pueden atravesar (las arma escenario.js)
 * @param {number} opciones.limitePredio  Distancia máxima al centro del predio (en X y en Z)
 * @param {{ancho: number, largo: number}} opciones.entrada  El pasillo de la entrada, del lado
 *        de afuera de la valla del frente (+Z): ahí también se puede caminar (ver vallas.js)
 * @returns {{ controles: PointerLockControls, actualizar: (delta: number) => void,
 *             desplazar: (dx: number, dz: number) => void,
 *             acotarAlPredio: (posicion: THREE.Vector3, anteriorZ: number) => void }}
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
      // Las cajas están medidas desde el centro de su escenario y sin girar, pero el
      // escenario en el predio está movido y girado. En vez de mover y girar la caja,
      // hacemos lo contrario con el jugador:
      //  1. le restamos el centro del escenario (queda medido desde ese centro)
      //  2. lo giramos el mismo ángulo pero para el otro lado (deshace el giro)
      // Así jugador y caja quedan "derechos" y alcanza con comparar mínimos y máximos.
      const dx = x - caja.centroX;
      const dz = z - caja.centroZ;
      const coseno = Math.cos(caja.angulo);
      const seno = Math.sin(caja.angulo);
      const localX = dx * coseno - dz * seno;
      const localZ = dx * seno + dz * coseno;

      const adentroEnX = localX > caja.minX - RADIO_JUGADOR && localX < caja.maxX + RADIO_JUGADOR;
      const adentroEnZ = localZ > caja.minZ - RADIO_JUGADOR && localZ < caja.maxZ + RADIO_JUGADOR;
      if (adentroEnX && adentroEnZ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Si una posición quedó afuera del predio, la deja justo en el borde.
   * La usa desplazar (acá abajo) y también la cámara de tercera persona (ver terceraPersona.js).
   * @param {THREE.Vector3} posicion  La posición a corregir (la cambia)
   * @param {number} anteriorZ  Dónde estaba antes en Z (para saber si viene del pasillo de la entrada)
   */
  function acotarAlPredio(posicion, anteriorZ) {
    // Si se pasa del borde, lo dejamos justo en el borde.
    // Adelante (+Z) el borde está más lejos: hasta el fondo del pasillo de la entrada.
    const limite = opciones.limitePredio - RADIO_JUGADOR;
    const limiteAdelante = opciones.limitePredio + opciones.entrada.largo - RADIO_JUGADOR;
    posicion.x = Math.min(Math.max(posicion.x, -limite), limite);
    posicion.z = Math.min(Math.max(posicion.z, -limite), limiteAdelante);

    // Pasando la línea de la valla del frente, solo se puede estar dentro del pasillo.
    const mitadPasillo = opciones.entrada.ancho / 2 - RADIO_JUGADOR;
    if (posicion.z > limite && Math.abs(posicion.x) > mitadPasillo) {
      if (anteriorZ > limite) {
        // Ya estaba en el pasillo: choca con las vallas de los costados.
        posicion.x = Math.min(Math.max(posicion.x, -mitadPasillo), mitadPasillo);
      } else {
        // Venía de adentro del predio, al lado de la puerta: choca con la valla del frente.
        posicion.z = limite;
      }
    }
  }

  /**
   * Mueve al jugador (dx, dz) metros en el predio, sin dejarlo salir del borde
   * ni atravesar obstáculos. La usa la caminata y también los empujones del pogo.
   * @param {number} dx  Metros a moverse en X
   * @param {number} dz  Metros a moverse en Z
   */
  function desplazar(dx, dz) {
    // Recordamos dónde estábamos antes de movernos.
    const posicion = camara.position;
    const anteriorX = posicion.x;
    const anteriorZ = posicion.z;

    posicion.x += dx;
    posicion.z += dz;

    // --- Límites del predio ---
    acotarAlPredio(posicion, anteriorZ);

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

    // Movemos la cámara según hacia dónde mira (sin subir ni bajar) y medimos
    // cuánto se movió. Después la volvemos a donde estaba y hacemos ese mismo
    // movimiento con desplazar(), que revisa los bordes y las colisiones.
    const posicion = camara.position;
    const anteriorX = posicion.x;
    const anteriorZ = posicion.z;
    controles.moveForward(adelante * distancia);
    controles.moveRight(derecha * distancia);
    const dx = posicion.x - anteriorX;
    const dz = posicion.z - anteriorZ;
    posicion.x = anteriorX;
    posicion.z = anteriorZ;
    desplazar(dx, dz);

    // La altura de los ojos (y el salto) la maneja acciones.js.
  }

  return { controles, actualizar, desplazar, acotarAlPredio };
}
