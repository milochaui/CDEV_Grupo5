// Evento de la chica que pide subirse a los hombros.
// Cuando el jugador está metido entre el público y empieza un tema tranqui (no conocido),
// aparece una chica adelante y le pregunta si la sube a los hombros.
// Se responde con 1 (sí) o 2 (no). Si dice que sí, va sentada en los hombros del jugador
// hasta que termina el tema: en primera persona se ven sus piernas colgando, y en tercera
// persona (tecla V, ver terceraPersona.js) se la ve entera.
import * as THREE from 'three';
import { escenarioEntreElPublico } from './acciones.js';
import { geometriaPiernaSentada, SEPARACION_PIERNAS } from './publico.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Teclas (event.code: la tecla física) ---
const TECLA_SI = 'Digit1';
const TECLA_NO = 'Digit2';

// --- Cuándo pregunta ---
// Pregunta durante los primeros segundos del tema tranqui. Así, si el jugador llega al
// público un ratito después de que empezó, también le pregunta.
const SEGUNDOS_PARA_PEDIR = 40;
const SEGUNDOS_PARA_RESPONDER = 12; // si no contesta en este tiempo, se va
const SEGUNDOS_MENSAJE = 3; // lo que dura en pantalla un mensaje después de responder
const DISTANCIA_CHICA = 1.3; // metros adelante del jugador donde aparece

// --- Colores ---
const COLOR_REMERA = 0x8e44ad; // violeta
const COLOR_JEAN = 0x3b5b8c;
const COLOR_PIEL = 0xf1c27d;
const COLOR_PELO = 0x4a2a12; // castaño
const COLOR_ZAPATILLAS = 0xeeeeee;

// ---------------------------------------------------------------------------
// La chica parada (la que aparece para preguntar)
// ---------------------------------------------------------------------------

// Arma a la chica con cajas, mirando hacia +Z y con los pies en y = 0 (como el público).
// Devuelve el grupo y su brazo derecho, que es el que mueve para saludar.
function crearChicaParada() {
  const chica = new THREE.Group();

  // Una caja de un color, centrada en (x, y, z).
  function caja(ancho, alto, profundidad, color, x, y, z) {
    const malla = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, profundidad),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 })
    );
    malla.position.set(x, y, z);
    chica.add(malla);
    return malla;
  }

  caja(0.34, 0.72, 0.22, COLOR_JEAN, 0, 0.36, 0); // piernas
  caja(0.38, 0.55, 0.22, COLOR_REMERA, 0, 0.995, 0); // torso
  caja(0.22, 0.25, 0.22, COLOR_PIEL, 0, 1.4, 0); // cabeza
  caja(0.26, 0.06, 0.26, COLOR_PELO, 0, 1.54, 0); // pelo de arriba
  caja(0.26, 0.45, 0.08, COLOR_PELO, 0, 1.3, -0.13); // pelo largo, por la espalda

  // Brazo izquierdo colgando (está en +X, porque mira hacia +Z).
  caja(0.09, 0.55, 0.09, COLOR_PIEL, 0.24, 0.98, 0);

  // Brazo derecho: un grupo con el punto de giro en el hombro, para poder saludar.
  const brazoDerecho = new THREE.Group();
  brazoDerecho.position.set(-0.24, 1.24, 0);
  const brazo = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.55, 0.09),
    new THREE.MeshStandardMaterial({ color: COLOR_PIEL, roughness: 0.9 })
  );
  brazo.position.y = 0.275; // hacia arriba desde el hombro
  brazoDerecho.add(brazo);
  chica.add(brazoDerecho);

  return { chica, brazoDerecho };
}

// ---------------------------------------------------------------------------
// La chica sentada en los hombros (para la tercera persona)
// ---------------------------------------------------------------------------

// Arma a la chica sentada, como los que van en hombros en el público (ver publico.js):
// el punto (0, 0, 0) es su cadera, el torso va para arriba y las piernas salen hacia
// adelante (+Z) y cuelgan. Devuelve el grupo y sus dos brazos, que mueve para festejar.
function crearChicaSentada() {
  const chica = new THREE.Group();

  // Una caja de un color, centrada en (x, y, z).
  function caja(ancho, alto, profundidad, color, x, y, z) {
    const malla = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, profundidad),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 })
    );
    malla.position.set(x, y, z);
    chica.add(malla);
    return malla;
  }

  caja(0.38, 0.55, 0.22, COLOR_REMERA, 0, 0.275, 0); // torso
  caja(0.22, 0.25, 0.22, COLOR_PIEL, 0, 0.68, 0); // cabeza
  caja(0.26, 0.06, 0.26, COLOR_PELO, 0, 0.82, 0); // pelo de arriba
  caja(0.26, 0.45, 0.08, COLOR_PELO, 0, 0.58, -0.13); // pelo largo, por la espalda

  // Piernas: la misma forma que las del público, de jean. Van bien separadas para
  // pasar a los costados de la cabeza del jugador.
  const materialJean = new THREE.MeshStandardMaterial({ color: COLOR_JEAN, roughness: 0.9 });
  for (const x of [SEPARACION_PIERNAS, -SEPARACION_PIERNAS]) {
    const pierna = new THREE.Mesh(geometriaPiernaSentada, materialJean);
    pierna.position.x = x;
    chica.add(pierna);
  }

  // Brazos: el punto de giro en el hombro; la caja va hacia arriba desde ahí.
  function brazo(x) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0.5, 0);
    const malla = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.55, 0.09),
      new THREE.MeshStandardMaterial({ color: COLOR_PIEL, roughness: 0.9 })
    );
    malla.position.y = 0.275;
    grupo.add(malla);
    chica.add(grupo);
    return grupo;
  }
  const brazoIzquierdo = brazo(0.24);
  const brazoDerecho = brazo(-0.24);

  chica.scale.setScalar(0.9); // un poco más chica que el jugador
  return { chica, brazoIzquierdo, brazoDerecho };
}

// ---------------------------------------------------------------------------
// Las piernas de la chica sobre los hombros (en primera persona)
// ---------------------------------------------------------------------------

// Como los brazos del jugador (ver acciones.js): se dibujan siempre por encima del resto.
function crearMaterialEncima(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: 0x1a1410, // un brillo propio muy suave, para que no queden negras de noche
    roughness: 0.9,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
}

// Arma una pierna. Medidas desde la cámara: x a la derecha, y hacia arriba, −z hacia adelante.
// El muslo va apoyado sobre el hombro del jugador, de atrás hacia adelante, y desde la
// rodilla cuelga el resto de la pierna. Devuelve la parte que cuelga, para hamacarla.
function crearPierna(x, materialJean, materialZapatilla) {
  const pierna = new THREE.Group();

  const muslo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.4), materialJean);
  muslo.position.set(x, -0.2, -0.1);
  muslo.renderOrder = 90; // antes que los brazos (100): si los levantamos, quedan delante
  pierna.add(muslo);

  // Lo que cuelga gira desde la rodilla.
  const debajoRodilla = new THREE.Group();
  debajoRodilla.position.set(x, -0.2, -0.3);
  const canilla = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.11), materialJean);
  canilla.position.y = -0.21; // hacia abajo desde la rodilla
  canilla.renderOrder = 90;
  const zapatilla = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), materialZapatilla);
  zapatilla.position.set(0, -0.44, -0.04); // en la punta, un poco hacia adelante
  zapatilla.renderOrder = 91;
  debajoRodilla.add(canilla, zapatilla);
  pierna.add(debajoRodilla);

  return { pierna, debajoRodilla };
}

/**
 * Crea el evento de la chica.
 *
 * @param {object} opciones
 * @param {THREE.Scene} opciones.escena
 * @param {THREE.PerspectiveCamera} opciones.camara  La cámara del jugador (tiene que estar en la escena)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (ver jugador.js)
 * @param {Array<THREE.Group>} opciones.escenarios  Los escenarios (con su música y su público)
 * @param {THREE.Object3D} opciones.hombros  Los hombros del cuerpo del jugador en tercera
 *        persona (ver terceraPersona.js): ahí se sienta
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearChica({ escena, camara, jugador, escenarios, hombros }) {
  // --- La chica parada ---
  const { chica, brazoDerecho } = crearChicaParada();
  chica.visible = false; // aparece recién cuando pregunta
  escena.add(chica);

  // --- Las piernas sobre los hombros (hijas de la cámara, como los brazos) ---
  const materialJean = crearMaterialEncima(COLOR_JEAN);
  const materialZapatilla = crearMaterialEncima(COLOR_ZAPATILLAS);
  const piernaDerecha = crearPierna(0.24, materialJean, materialZapatilla);
  const piernaIzquierda = crearPierna(-0.24, materialJean, materialZapatilla);
  const piernas = new THREE.Group();
  piernas.add(piernaDerecha.pierna, piernaIzquierda.pierna);
  piernas.visible = false;
  camara.add(piernas);

  // --- La chica sentada en los hombros (se ve en tercera persona) ---
  const sentada = crearChicaSentada();
  sentada.chica.visible = false;
  hombros.add(sentada.chica);

  // --- Cartelito (está en index.html) ---
  const dialogo = document.getElementById('dialogo-chica');

  // --- Estado ---
  // 'esperando': todavía no pasa nada. 'preguntando': la chica espera la respuesta.
  // 'en hombros': la subimos y está arriba hasta que termine el tema.
  let estado = 'esperando';
  let reloj = 0; // segundos de juego (sin contar las pausas)
  let escenarioDelPedido = null; // en qué escenario pasó
  let numeroDelTema = 0; // qué vez del tema era (ver numeroDeTema en musica.js)
  let finDePregunta = 0; // hasta cuándo espera la respuesta
  let finDeMensaje = 0; // hasta cuándo se ve el mensaje del cartelito

  // Para preguntar una sola vez por tema: por cada escenario guardamos el número del
  // último tema en el que ya preguntó. Un Map es como un objeto donde la "clave"
  // puede ser cualquier cosa (acá, el escenario).
  const yaPreguntoEn = new Map();

  // Muestra un texto en el cartelito. Con "segundos", se borra solo después de ese tiempo.
  function mostrar(texto, segundos) {
    dialogo.textContent = texto;
    dialogo.style.display = 'block';
    finDeMensaje = segundos ? reloj + segundos : Infinity; // Infinity: no se borra solo
  }

  // La chica aparece adelante del jugador, mirándolo, y pregunta.
  function preguntar(escenario) {
    estado = 'preguntando';
    escenarioDelPedido = escenario;
    numeroDelTema = escenario.userData.musica.numeroDeTema();
    yaPreguntoEn.set(escenario, numeroDelTema);
    finDePregunta = reloj + SEGUNDOS_PARA_RESPONDER;

    // Hacia dónde mira el jugador, sin subir ni bajar (como al caminar).
    const adelante = new THREE.Vector3();
    camara.getWorldDirection(adelante);
    adelante.y = 0;
    adelante.normalize();
    chica.position.set(
      camara.position.x + adelante.x * DISTANCIA_CHICA,
      0,
      camara.position.z + adelante.z * DISTANCIA_CHICA
    );
    // Que mire al jugador (atan2 da el ángulo para mirar en esa dirección, como en publico.js).
    chica.rotation.y = Math.atan2(camara.position.x - chica.position.x, camara.position.z - chica.position.z);
    chica.visible = true;

    mostrar('👧 «¡Ey! ¿Me subís a tus hombros?»\n[1] Sí     [2] No');
  }

  // Respuesta: sí. La chica desaparece del piso y aparecen sus piernas sobre los hombros.
  function aceptar() {
    estado = 'en hombros';
    chica.visible = false;
    piernas.visible = true;
    sentada.chica.visible = true;
    mostrar('👧 «¡Gracias! ¡Desde acá se ve todo!»', SEGUNDOS_MENSAJE);
  }

  // Respuesta: no (o no contestó a tiempo). La chica se va.
  function rechazar(texto) {
    estado = 'esperando';
    chica.visible = false;
    mostrar(texto, SEGUNDOS_MENSAJE);
  }

  // Termina el tema: la chica se baja.
  function bajar() {
    estado = 'esperando';
    piernas.visible = false;
    sentada.chica.visible = false;
    mostrar('👧 «¡Qué temazo! Gracias por subirme»', SEGUNDOS_MENSAJE);
  }

  // --- Teclado: 1 = sí, 2 = no (solo mientras pregunta y se está jugando) ---
  document.addEventListener('keydown', (event) => {
    if (estado !== 'preguntando' || !jugador.controles.isLocked) {
      return;
    }
    if (event.code === TECLA_SI) {
      aceptar();
    } else if (event.code === TECLA_NO) {
      rechazar('👧 «Bueno, no pasa nada»');
    }
  });

  /**
   * Revisa si la chica tiene que aparecer, irse o bajarse, y mueve lo que haga falta.
   * Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    if (estado === 'esperando') {
      // ¿Está metido entre el público de algún escenario?
      const escenario = escenarioEntreElPublico(escenarios, camara.position);
      if (escenario !== null) {
        const musica = escenario.userData.musica;
        const esTranqui = musica.estaSonando() && !musica.temaActual().conocido;
        const recienEmpezo = musica.segundosDelTema() < SEGUNDOS_PARA_PEDIR;
        const yaPregunto = yaPreguntoEn.get(escenario) === musica.numeroDeTema();
        if (esTranqui && recienEmpezo && !yaPregunto) {
          preguntar(escenario);
        }
      }
    } else if (estado === 'preguntando') {
      // Saluda con el brazo derecho levantado, moviéndolo de un lado al otro mientras espera.
      // Con giro 0 el brazo apunta derecho para arriba; con giro positivo se inclina hacia afuera.
      brazoDerecho.rotation.z = 0.3 + Math.sin(reloj * 8) * 0.3;
      if (reloj > finDePregunta) {
        rechazar('👧 La chica se cansó de esperar y se fue');
      }
    } else if (estado === 'en hombros') {
      // Las piernas se hamacan un poco, cada una para un lado (como al balancearse).
      const hamaca = Math.sin(reloj * 2) * 0.15;
      piernaDerecha.debajoRodilla.rotation.x = hamaca;
      piernaIzquierda.debajoRodilla.rotation.x = -hamaca;
      // Sentada, festeja con los brazos arriba, moviéndolos de un lado al otro.
      // Con giro 0 apuntan derecho para arriba; cada uno se abre hacia su lado.
      const festejo = 0.35 + Math.sin(reloj * 3) * 0.2;
      sentada.brazoIzquierdo.rotation.z = -festejo;
      sentada.brazoDerecho.rotation.z = festejo;
      // Si cambió el tema en ese escenario (terminó el tranqui), se baja.
      if (escenarioDelPedido.userData.musica.numeroDeTema() !== numeroDelTema) {
        bajar();
      }
    }

    // Borramos el mensaje cuando se le acaba el tiempo.
    if (reloj > finDeMensaje) {
      dialogo.style.display = 'none';
      finDeMensaje = Infinity;
    }
  }

  return { actualizar };
}
