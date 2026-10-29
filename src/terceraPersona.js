// Vista en tercera persona: con la tecla V la cámara se va atrás del jugador y se ve su
// cuerpo (por ejemplo, con la chica subida a los hombros, ver chica.js). Con V otra vez
// vuelve a la primera persona.
//
// El jugador sigue siendo la cámara de siempre ("camara"): se mueve, mira y escucha igual.
// Acá armamos un cuerpo que la sigue y una segunda cámara que lo filma desde atrás.
// Para que cada cámara vea solo lo suyo usamos capas (layers) de Three.js: cada objeto
// está en una capa y cada cámara dibuja solo las capas que tiene activadas.
//  - Capa 0: todo el mundo (la ven las dos cámaras).
//  - CAPA_PRIMERA_PERSONA: lo que cuelga de la cámara (brazos, lo que tenés en la mano,
//    las piernas de la chica): solo la ve la cámara de primera persona.
//  - CAPA_TERCERA_PERSONA: el cuerpo del jugador: solo la ve la cámara de tercera persona.
import * as THREE from 'three';
import { ALTURA_OJOS } from './jugador.js';
import {
  ALTO_CUERPO,
  geometriaCuerpo,
  geometriaCabeza,
  geometriaBrazo,
  ANGULO_BRAZO_ABAJO,
  POSICION_HOMBROS,
  BRAZOS_AGARRAN_ADELANTE,
  BRAZOS_AGARRAN_ADENTRO,
} from './publico.js';
import { crearRemeras, COLOR_REMERA } from './remeras.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const TECLA_VISTA = 'KeyV';

const CAPA_PRIMERA_PERSONA = 1;
const CAPA_TERCERA_PERSONA = 2;

// --- Cámara de tercera persona ---
const DISTANCIA_CAMARA = 4; // metros detrás del jugador
const ALTURA_CAMARA = 1; // metros por encima de los ojos del jugador
const ALTURA_MINIMA_CAMARA = 0.5; // para que no se meta bajo el piso al mirar para arriba
const DISTANCIA_MIRADA = 3; // mira a un punto que está estos metros delante del jugador

// --- Brazos del cuerpo ---
const ANGULO_BRAZOS_ARRIBA = 2.8; // como el público (π sería derecho para arriba)
const VELOCIDAD_BRAZOS = 4; // como en acciones.js: 1/4 de segundo en subir o bajar

// Mezcla dos valores: con t = 0 da a, con t = 1 da b (igual que en publico.js).
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Crea el cuerpo del jugador y la cámara de tercera persona.
 *
 * @param {object} opciones
 * @param {THREE.Scene} opciones.escena
 * @param {THREE.PerspectiveCamera} opciones.camara  La cámara del jugador (primera persona)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para saber si se está jugando
 *        y para no sacar la cámara del predio)
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (para levantar los brazos)
 * @returns {{ actualizar: (delta: number) => void, camaraActiva: () => THREE.PerspectiveCamera,
 *             hombros: THREE.Object3D }}
 *          hombros: donde se sienta alguien que va subido (lo usa chica.js)
 */
export function crearTerceraPersona({ escena, camara, jugador, acciones }) {
  // --- El cuerpo: las mismas piezas que el público (ver publico.js) ---
  // Lo armamos mirando hacia +Z y con los pies en y = 0, como cada persona del público.
  const cuerpo = new THREE.Group();
  const materialRemera = new THREE.MeshStandardMaterial({ color: COLOR_REMERA, roughness: 0.9 });
  const materialPiel = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.9 });

  cuerpo.add(new THREE.Mesh(geometriaCuerpo, materialRemera));
  const cabeza = new THREE.Mesh(geometriaCabeza, materialPiel);
  cabeza.position.set(0, ALTO_CUERPO + 0.14, 0);
  cuerpo.add(cabeza);

  // Brazos: el punto de giro es el hombro (izquierdo en +X, derecho en −X, como en publico.js).
  const brazoIzq = new THREE.Mesh(geometriaBrazo, materialPiel);
  brazoIzq.position.set(0.27, ALTO_CUERPO - 0.05, 0);
  const brazoDer = new THREE.Mesh(geometriaBrazo, materialPiel);
  brazoDer.position.set(-0.27, ALTO_CUERPO - 0.05, 0);
  cuerpo.add(brazoIzq, brazoDer);

  // El jugador también tiene su remera de banda. Su estampado no se mueve solo: va pegado
  // al cuerpo, así que le damos la matriz "identidad" (sin mover ni girar nada).
  const remeras = crearRemeras(cuerpo, 1, 1.05);
  remeras.mover(remeras.ponerRemera(), new THREE.Matrix4());
  remeras.avisarCambios();

  // Hombros: ahí se sienta quien vaya subido (ver chica.js).
  const hombros = new THREE.Object3D();
  hombros.position.copy(POSICION_HOMBROS);
  cuerpo.add(hombros);

  escena.add(cuerpo);

  // --- La cámara de tercera persona ---
  // Con el mismo campo de visión y la misma proporción que la del jugador.
  const camaraTercera = new THREE.PerspectiveCamera(camara.fov, camara.aspect, camara.near, camara.far);
  // Cada cámara ve la capa 0 (viene activada) y además la suya.
  camara.layers.enable(CAPA_PRIMERA_PERSONA);
  camaraTercera.layers.enable(CAPA_TERCERA_PERSONA);

  window.addEventListener('resize', () => {
    camaraTercera.aspect = window.innerWidth / window.innerHeight;
    camaraTercera.updateProjectionMatrix();
  });

  // --- Tecla V: cambiar de vista (solo mientras se juega) ---
  let enTerceraPersona = false;
  document.addEventListener('keydown', (event) => {
    if (event.code === TECLA_VISTA && !event.repeat && jugador.controles.isLocked) {
      enTerceraPersona = !enTerceraPersona;
    }
  });

  // --- Estado ---
  let levantado = 0; // brazos: 0 = abajo, 1 = arriba (va cambiando de a poco)
  const direccion = new THREE.Vector3(); // hacia dónde mira el jugador
  const objetivo = new THREE.Vector3(); // el punto al que mira la cámara de tercera persona

  /**
   * Acomoda el cuerpo y la cámara de tercera persona. Se llama en cada cuadro, también
   * en pausa (así la vista no se rompe al pausar).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // Capas: lo que cuelga de la cámara, a la de primera persona; el cuerpo (y quien
    // tenga en los hombros), a la de tercera. Lo hacemos en cada cuadro porque se agregan
    // cosas en el camino (por ejemplo, el fernet en la mano). traverse recorre al objeto
    // y a todos sus hijos.
    for (const hijo of camara.children) {
      hijo.traverse((objeto) => objeto.layers.set(CAPA_PRIMERA_PERSONA));
    }
    cuerpo.traverse((objeto) => objeto.layers.set(CAPA_TERCERA_PERSONA));

    // El cuerpo va con los pies debajo de los ojos (si salta, la cámara sube y el cuerpo
    // también) y mira para el mismo lado que el jugador, solo girando en horizontal.
    // getWorldDirection da hacia dónde mira la cámara; atan2 lo pasa a un ángulo de giro.
    camara.getWorldDirection(direccion);
    cuerpo.position.set(camara.position.x, camara.position.y - ALTURA_OJOS, camara.position.z);
    cuerpo.rotation.y = Math.atan2(direccion.x, direccion.z);

    // Brazos: arriba con la E (como los de primera persona). Abajo cuelgan o, si lleva a
    // alguien en los hombros, lo agarran de los tobillos (como el público, ver publico.js).
    const paso = VELOCIDAD_BRAZOS * delta;
    const objetivoBrazos = acciones.estado.brazos ? 1 : 0;
    levantado = levantado < objetivoBrazos ? Math.min(1, levantado + paso) : Math.max(0, levantado - paso);
    const llevaAAlguien = hombros.children.some((hijo) => hijo.visible);
    const adelanteAbajo = llevaAAlguien ? BRAZOS_AGARRAN_ADELANTE : 0;
    const costadoAbajo = llevaAAlguien ? BRAZOS_AGARRAN_ADENTRO : ANGULO_BRAZO_ABAJO;
    const adelante = mezclar(adelanteAbajo, 0, levantado);
    const costado = mezclar(costadoAbajo, ANGULO_BRAZOS_ARRIBA, levantado);
    // Cada brazo gira hacia su lado: el izquierdo con ángulo positivo, el derecho con negativo.
    brazoIzq.rotation.set(adelante, 0, costado);
    brazoDer.rotation.set(adelante, 0, -costado);

    // Cámara de tercera persona: atrás del jugador (en la dirección contraria a la que
    // mira) y un poco más arriba, mirando a un punto delante de él.
    camaraTercera.position.copy(camara.position).addScaledVector(direccion, -DISTANCIA_CAMARA);
    camaraTercera.position.y = Math.max(ALTURA_MINIMA_CAMARA, camaraTercera.position.y + ALTURA_CAMARA);
    // Que no se vaya del otro lado de las vallas (por ejemplo, al fondo del pasillo de la
    // entrada): la frenamos en el borde, con la misma regla que al jugador.
    jugador.acotarAlPredio(camaraTercera.position, camara.position.z);
    objetivo.copy(camara.position).addScaledVector(direccion, DISTANCIA_MIRADA);
    camaraTercera.lookAt(objetivo);
  }

  // La cámara con la que hay que dibujar la escena ahora.
  function camaraActiva() {
    return enTerceraPersona ? camaraTercera : camara;
  }

  return { actualizar, camaraActiva, hombros };
}
