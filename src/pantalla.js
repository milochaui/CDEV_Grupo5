// Pantalla en vivo: una cámara "filma" a la banda y lo que ve aparece en la pantalla
// del fondo del escenario, como en los festivales. Cada tantos segundos cambia de toma
// (primer plano del cantante, plano general, guitarrista...).
//
// La técnica se llama "render a textura": la escena se dibuja en una imagen guardada en
// la placa de video (un WebGLRenderTarget) en vez de en la ventana, y esa imagen se usa
// como textura de la pantalla.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// Tamaño de la imagen filmada, en píxeles. Misma proporción que la pantalla (16 x 8 m).
// Más chica = más liviano. Vista de lejos, 512 x 256 alcanza.
const ANCHO_IMAGEN = 512;
const ALTO_IMAGEN = 256;

const SEGUNDOS_POR_TOMA = 6;
const VAIVEN_CAMARA = 0.2; // metros que se mueve la cámara, como si la llevara un camarógrafo

// Tomas: dónde se pone la cámara y a dónde mira, en metros, medido desde el centro del
// escenario (sin girar, con el frente hacia +Z y el piso del predio en y = 0).
// La tarima está a 2 m de altura y la cámara va en el foso, entre la tarima y la valla.
// fov = campo de visión en grados: más chico = más zoom.
const TOMAS = [
  { posicion: [0.6, 3.8, 7], mira: [0, 3.75, 3.2], fov: 18 }, // primer plano del cantante
  { posicion: [0, 5, 8], mira: [0, 3.2, 0], fov: 55 }, // plano general
  { posicion: [-2.5, 3.5, 6.5], mira: [-5.2, 3.5, 2.1], fov: 24 }, // guitarrista (a la izquierda)
  { posicion: [1, 3.2, 6.5], mira: [0, 3.9, 3.2], fov: 28 }, // cantante, desde abajo
  { posicion: [2.5, 3.5, 6.5], mira: [5.2, 3.5, 2.1], fov: 24 }, // bajista (a la derecha)
];

/**
 * Convierte la pantalla de un escenario en una pantalla en vivo.
 *
 * @param {object} opciones
 * @param {THREE.Group} opciones.escenario
 * @param {THREE.Mesh} opciones.pantalla  La pantalla del fondo (ver crearPantalla en escenario.js)
 * @param {number} opciones.color  Color de la banda: se muestra cuando no se está filmando
 * @returns {{ filmar: (renderer, escena, delta) => void, ponerColor: (renderer) => void }}
 */
export function crearPantallaEnVivo({ escenario, pantalla, color }) {
  // La imagen donde dibuja la cámara de la pantalla
  const imagen = new THREE.WebGLRenderTarget(ANCHO_IMAGEN, ALTO_IMAGEN);

  // La pantalla emite (brilla con) lo que tenga esa imagen.
  // El emissive en blanco hace que se vean los colores de la imagen tal cual.
  pantalla.material.emissive.set(0xffffff);
  pantalla.material.emissiveMap = imagen.texture;

  // La cámara es hija del escenario: así las tomas se miden desde el escenario,
  // y se mueven y giran con él.
  const camara = new THREE.PerspectiveCamera(30, ANCHO_IMAGEN / ALTO_IMAGEN, 0.1, 200);
  escenario.add(camara);

  let reloj = 0;
  let mostrandoColor = false;
  const mira = new THREE.Vector3(); // lo reusamos en cada cuadro

  /**
   * Filma la banda y lo deja en la pantalla. Se llama en cada cuadro, antes de dibujar la
   * escena para el jugador (ver main.js).
   */
  function filmar(renderer, escena, delta) {
    reloj += delta;

    // Qué toma toca ahora: cambia cada SEGUNDOS_POR_TOMA y, al terminar la lista, vuelve a empezar.
    const toma = TOMAS[Math.floor(reloj / SEGUNDOS_POR_TOMA) % TOMAS.length];

    // Ubicamos la cámara, con un vaivén suave (dos senos de distinta velocidad).
    camara.position.set(
      toma.posicion[0] + Math.sin(reloj * 0.7) * VAIVEN_CAMARA,
      toma.posicion[1] + Math.sin(reloj * 1.1) * VAIVEN_CAMARA * 0.5,
      toma.posicion[2]
    );
    // Si cambiamos el fov hay que avisarle a la cámara que recalcule su "lente".
    if (camara.fov !== toma.fov) {
      camara.fov = toma.fov;
      camara.updateProjectionMatrix();
    }
    // lookAt pide el punto en coordenadas del predio: localToWorld hace la cuenta.
    mira.set(toma.mira[0], toma.mira[1], toma.mira[2]);
    escenario.localToWorld(mira);
    camara.lookAt(mira);

    // Escondemos la pantalla mientras filmamos: si no, la cámara la vería detrás de la
    // banda y estaríamos dibujando la imagen sobre sí misma (WebGL no lo permite).
    pantalla.visible = false;
    renderer.setRenderTarget(imagen); // de acá en adelante se dibuja en la imagen...
    renderer.render(escena, camara);
    renderer.setRenderTarget(null); // ...y desde acá, de nuevo en la ventana
    pantalla.visible = true;

    mostrandoColor = false;
  }

  /**
   * Pinta la pantalla entera del color de la banda (cuando no la estamos filmando).
   * Basta con hacerlo una vez: la imagen queda guardada hasta que se vuelva a filmar.
   */
  function ponerColor(renderer) {
    if (mostrandoColor) {
      return;
    }
    // Guardamos el color con el que el renderer "limpia", para dejarlo como estaba.
    const colorAnterior = renderer.getClearColor(new THREE.Color());
    const transparenciaAnterior = renderer.getClearAlpha();

    renderer.setRenderTarget(imagen);
    renderer.setClearColor(color, 1);
    renderer.clear(); // "limpiar" la imagen = pintarla toda de ese color
    renderer.setRenderTarget(null);

    renderer.setClearColor(colorAnterior, transparenciaAnterior);
    mostrandoColor = true;
  }

  return { filmar, ponerColor };
}
