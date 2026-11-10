// La gente que limpia el predio a la mañana siguiente, cuando el festival ya terminó.
// La ve el jugador cuando se despierta después de desmayarse (ver borrachera.js):
//  - Unos operarios barren o juntan basura, yendo y viniendo por donde estaba el público.
//  - Uno está barriendo al lado del jugador y le habla.
//  - El piso está lleno de vasos y papeles.
// Todo arranca escondido: aparecer() lo muestra.
import * as THREE from 'three';
import { crearPersona, posar } from './artistas.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Operarios ---
const COLOR_MAMELUCO = 0xff7a1a; // naranja
const COLOR_PANTALON = 0x2a3a55;
const COLOR_REFLECTIVO = 0xd8ff3a; // las bandas del mameluco
const COLORES_PIEL = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
const COLORES_PELO = [0x151010, 0x3a2412, 0x777777];

// Por dónde van y vienen: una línea de lado a lado del público de cada escenario.
// "distancia" son los metros desde el escenario hacia el centro del predio, y "largo"
// los metros que camina para cada lado.
const RECORRIDOS = [
  { distancia: 18, largo: 10 },
  { distancia: 28, largo: 14 },
  { distancia: 38, largo: 12 },
];
const VELOCIDAD_CAMINAR = 0.5; // metros por segundo: limpian sin apuro
const BARRIDAS_POR_SEGUNDO = 0.5;
const GIRO_ESCOBA = 0.35; // radianes que barre para cada lado

// El operario que está al lado del jugador cuando se despierta.
const DISTANCIA_AL_JUGADOR = 2.2; // metros
const DIRECCIONES_A_PROBAR = 8; // busca un lugar libre alrededor del jugador

// Lo que le dice. Cada mensaje se ve estos segundos.
const MENSAJES = [
  '🧹 «¡Eh! ¿Estás vivo? Mirá que el festival terminó hace horas...»',
  '🧹 «Dale, correte un poquito que tengo que barrer ahí.»',
  '🧹 «Y tomá agua, eh.»',
];
const SEGUNDOS_POR_MENSAJE = 4.5;

// --- Basura ---
const CANTIDAD_BASURA = 300; // vasos, y la misma cantidad de papeles
const BASURA_CERCA_DEL_JUGADOR = 30; // de esos, los que quedan alrededor de donde se despierta
const RADIO_CERCA_DEL_JUGADOR = 7; // metros
const COLORES_VASOS = [0xffffff, 0xcc2222, 0x2255cc];
const COLORES_PAPELES = [0xeeeeee, 0xd8c49a, 0x8fb8de, 0xe8a0a0];

// Elige un elemento al azar de una lista.
function alAzar(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// ---------------------------------------------------------------------------
// Un operario
// ---------------------------------------------------------------------------

// Una pieza simple de un color, para agregarle al operario.
function malla(geometria, color) {
  return new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 }));
}

// Una persona con mameluco naranja, bandas reflectivas y gorra.
function crearCuerpoDeOperario() {
  const persona = crearPersona({
    piel: alAzar(COLORES_PIEL),
    remera: COLOR_MAMELUCO,
    mangas: COLOR_MAMELUCO,
    pantalon: COLOR_PANTALON,
    pelo: alAzar(COLORES_PELO),
  });
  // Dos bandas alrededor del torso: cajas apenas más anchas que él.
  const geometriaBanda = new THREE.BoxGeometry(0.48, 0.05, 0.28);
  for (const y of [1.0, 1.18]) {
    const banda = malla(geometriaBanda, COLOR_REFLECTIVO);
    banda.position.y = y;
    persona.grupo.add(banda);
  }
  // La gorra: la cara y el pelo son medidas desde el cuello (ver crearPersona en artistas.js).
  const gorra = malla(new THREE.BoxGeometry(0.28, 0.07, 0.29), COLOR_MAMELUCO);
  gorra.position.set(0, 0.38, 0);
  const visera = malla(new THREE.BoxGeometry(0.2, 0.02, 0.12), COLOR_MAMELUCO);
  visera.position.set(0, 0.35, 0.18);
  persona.cabeza.add(gorra, visera);
  return persona;
}

// Operario con escoba, agarrada con las dos manos. Devuelve también con qué movimiento barre.
function crearOperarioConEscoba() {
  const persona = crearCuerpoDeOperario();
  posar(persona.izq, 0.9, -0.1, 0.5);
  posar(persona.der, 0.9, -0.1, 0.5);

  // La escoba cuelga de un grupo que está en las manos: al girar el grupo, barre.
  const escoba = new THREE.Group();
  escoba.position.set(0, 1.05, 0.42);
  // Inclinada hacia adelante: con este ángulo y este largo, la punta llega justo al piso.
  escoba.rotation.x = -0.5;
  const LARGO_PALO = 1.2;
  const palo = malla(new THREE.CylinderGeometry(0.018, 0.018, LARGO_PALO, 6), 0xb58a55);
  palo.position.y = -LARGO_PALO / 2;
  const cepillo = malla(new THREE.BoxGeometry(0.42, 0.07, 0.09), 0x222222);
  cepillo.position.y = -LARGO_PALO;
  escoba.add(palo, cepillo);
  persona.grupo.add(escoba);

  function moverse(reloj) {
    escoba.rotation.z = Math.sin(reloj * Math.PI * 2 * BARRIDAS_POR_SEGUNDO) * GIRO_ESCOBA;
  }
  return { persona, moverse };
}

// Operario con una bolsa de consorcio: la lleva en una mano y con la otra junta basura.
function crearOperarioConBolsa() {
  const persona = crearCuerpoDeOperario();
  posar(persona.der, 0.1, 0.1, 0.1);
  const bolsa = malla(new THREE.SphereGeometry(0.28, 10, 8), 0x111111);
  bolsa.scale.y = 1.25;
  bolsa.position.set(-0.36, 0.42, 0.05);
  persona.grupo.add(bolsa);

  function moverse(reloj) {
    // Levanta y baja el otro brazo, como agachándose a juntar algo.
    posar(persona.izq, 0.6 + Math.sin(reloj * Math.PI * 2 * BARRIDAS_POR_SEGUNDO) * 0.4, 0.1, 0.3);
  }
  return { persona, moverse };
}

// ---------------------------------------------------------------------------
// La cuadrilla y la basura
// ---------------------------------------------------------------------------

/**
 * Crea a la gente que limpia y la basura. Todo arranca escondido.
 *
 * @param {object} opciones
 * @param {Array<THREE.Group>} opciones.escenarios  Para saber dónde estaba el público
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para no poner nada adentro de otra cosa)
 * @param {THREE.PerspectiveCamera} opciones.camara  Para saber dónde está el jugador
 * @returns {{ grupo: THREE.Group, actualizar: (delta: number) => void,
 *             aparecer: () => THREE.Vector3, hablar: () => void }}
 */
export function crearLimpieza({ escenarios, jugador, camara }) {
  const grupo = new THREE.Group();
  grupo.visible = false;

  const dialogo = document.getElementById('dialogo-limpieza');

  // --- Los que van y vienen ---
  // Cada uno recorre una línea, de "centro − lado × largo" a "centro + lado × largo".
  const operarios = [];
  for (const escenario of escenarios) {
    // De qué lado queda el centro del predio, visto desde el escenario (una flecha de largo 1),
    // y "lado": la misma flecha girada 90°, que apunta de costado.
    const haciaElCentro = new THREE.Vector3(-escenario.position.x, 0, -escenario.position.z).normalize();
    const lado = new THREE.Vector3(-haciaElCentro.z, 0, haciaElCentro.x);

    RECORRIDOS.forEach((recorrido, i) => {
      // Dos con escoba y uno con bolsa.
      const operario = i === 1 ? crearOperarioConBolsa() : crearOperarioConEscoba();
      grupo.add(operario.persona.grupo);
      operarios.push({
        ...operario,
        centro: escenario.position.clone().addScaledVector(haciaElCentro, recorrido.distancia),
        lado,
        largo: recorrido.largo,
        fase: Math.random() * recorrido.largo * 4, // cada uno arranca en otro punto del recorrido
      });
    });
  }

  // --- El que está al lado del jugador (lo ubica aparecer) ---
  const vecino = crearOperarioConEscoba();
  grupo.add(vecino.persona.grupo);

  // --- La basura ---
  // Con InstancedMesh, como el público: una sola malla que se dibuja muchas veces.
  function crearBasura(geometria) {
    const basura = new THREE.InstancedMesh(
      geometria,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
      CANTIDAD_BASURA
    );
    basura.frustumCulled = false; // está desparramada por todo el predio
    grupo.add(basura);
    return basura;
  }
  const vasos = crearBasura(new THREE.CylinderGeometry(0.05, 0.04, 0.13, 8));
  const papeles = crearBasura(new THREE.BoxGeometry(0.22, 0.01, 0.15));
  const ubicacion = new THREE.Object3D(); // nos ayuda a armar la posición y el giro de cada copia

  // Deja un vaso tirado (acostado, con un giro al azar) y un papel en el piso.
  function tirarBasura(i, x, z, xPapel, zPapel) {
    ubicacion.position.set(x, 0.045, z);
    ubicacion.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI * 2);
    ubicacion.updateMatrix();
    vasos.setMatrixAt(i, ubicacion.matrix);

    ubicacion.position.set(xPapel, 0.015, zPapel);
    ubicacion.rotation.set(0, Math.random() * Math.PI * 2, 0);
    ubicacion.updateMatrix();
    papeles.setMatrixAt(i, ubicacion.matrix);
  }

  // Elige un lugar libre donde estaba el público de algún escenario.
  function lugarEnElPublico() {
    for (let intento = 0; intento < 20; intento++) {
      const escenario = alAzar(escenarios);
      // Un punto entre el escenario y el centro del predio, corrido al azar para los costados.
      const avance = 0.15 + Math.random() * 0.6; // qué parte del camino hacia el centro
      const costadoX = (Math.random() - 0.5) * 40;
      const costadoZ = (Math.random() - 0.5) * 40;
      const x = escenario.position.x * (1 - avance) + costadoX;
      const z = escenario.position.z * (1 - avance) + costadoZ;
      if (jugador.estaLibre(x, z)) {
        return { x, z };
      }
    }
    return { x: 0, z: 0 }; // no debería pasar: el centro del predio siempre está libre
  }

  const color = new THREE.Color();
  for (let i = 0; i < CANTIDAD_BASURA; i++) {
    const vaso = lugarEnElPublico();
    const papel = lugarEnElPublico();
    tirarBasura(i, vaso.x, vaso.z, papel.x, papel.z);
    vasos.setColorAt(i, color.setHex(alAzar(COLORES_VASOS)));
    papeles.setColorAt(i, color.setHex(alAzar(COLORES_PAPELES)));
  }

  // --- Estado ---
  let reloj = 0;
  let mensaje = -1; // número del mensaje que se ve (−1 = ninguno)
  let finDeMensaje = 0; // hasta cuándo se ve
  let alTerminarDeHablar = null; // función a la que avisamos después del último mensaje

  /**
   * Hace aparecer todo. El vecino queda al lado del jugador, en un lugar libre.
   * @returns {THREE.Vector3} A dónde mirar para ver al vecino (ver main.js): derecho hacia él,
   *          sin subir ni bajar la vista. Así se ve entero cuando el jugador se levanta.
   */
  function aparecer() {
    const posicion = camara.position;

    // Hacia dónde mira el jugador, como un ángulo sobre el piso (atan2, como en terceraPersona.js).
    const adelante = camara.getWorldDirection(new THREE.Vector3());
    const anguloAdelante = Math.atan2(adelante.x, adelante.z);

    // Probamos direcciones en ronda, empezando por la que está mirando: nos quedamos con
    // la primera libre (puede estar pegado a una pared).
    let x = posicion.x;
    let z = posicion.z;
    for (let i = 0; i < DIRECCIONES_A_PROBAR; i++) {
      const angulo = anguloAdelante + (i / DIRECCIONES_A_PROBAR) * Math.PI * 2;
      const prueba = {
        x: posicion.x + Math.sin(angulo) * DISTANCIA_AL_JUGADOR,
        z: posicion.z + Math.cos(angulo) * DISTANCIA_AL_JUGADOR,
      };
      if (jugador.estaLibre(prueba.x, prueba.z)) {
        x = prueba.x;
        z = prueba.z;
        break;
      }
    }
    vecino.persona.grupo.position.set(x, 0, z);
    vecino.persona.grupo.rotation.y = Math.atan2(posicion.x - x, posicion.z - z); // mira al jugador

    // Un poco de basura alrededor del jugador: las últimas copias, para que se vea enseguida.
    // (Solo donde se puede pisar, y si no, quedan donde estaban.)
    function cercaDelJugador() {
      const angulo = Math.random() * Math.PI * 2;
      const radio = 0.8 + Math.random() * (RADIO_CERCA_DEL_JUGADOR - 0.8);
      return { x: posicion.x + Math.cos(angulo) * radio, z: posicion.z + Math.sin(angulo) * radio };
    }
    for (let i = CANTIDAD_BASURA - BASURA_CERCA_DEL_JUGADOR; i < CANTIDAD_BASURA; i++) {
      const vaso = cercaDelJugador();
      const papel = cercaDelJugador();
      if (jugador.estaLibre(vaso.x, vaso.z) && jugador.estaLibre(papel.x, papel.z)) {
        tirarBasura(i, vaso.x, vaso.z, papel.x, papel.z);
      }
    }
    vasos.instanceMatrix.needsUpdate = true;
    papeles.instanceMatrix.needsUpdate = true;

    grupo.visible = true;
    return new THREE.Vector3(x, posicion.y, z);
  }

  // Empieza a hablarle al jugador (se llama cuando abre los ojos).
  // alTerminar: función que se llama cuando termina el último mensaje (main.js muestra
  // ahí el resumen de la noche).
  function hablar(alTerminar) {
    alTerminarDeHablar = alTerminar;
    mensaje = 0;
    finDeMensaje = reloj + SEGUNDOS_POR_MENSAJE;
    dialogo.textContent = MENSAJES[0];
    dialogo.style.display = 'block';
  }

  // En pausa se esconde el mensaje; al volver sigue.
  jugador.controles.addEventListener('unlock', () => {
    dialogo.style.display = 'none';
  });
  jugador.controles.addEventListener('lock', () => {
    if (mensaje >= 0) {
      dialogo.style.display = 'block';
    }
  });

  /**
   * Mueve a los operarios y pasa los mensajes. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    if (!grupo.visible) {
      return; // todavía no aparecieron
    }
    reloj += delta;

    // --- Los que van y vienen ---
    for (const operario of operarios) {
      // Una vuelta completa es ir de punta a punta (2 × largo) y volver: 4 × largo.
      // "camino" dice en qué parte de la vuelta está. En la primera mitad va, en la segunda vuelve.
      const vuelta = operario.largo * 4;
      const camino = (reloj * VELOCIDAD_CAMINAR + operario.fase) % vuelta;
      const yendo = camino < vuelta / 2;
      const desdeLaPunta = yendo ? camino : vuelta - camino; // de 0 a 2 × largo
      const cuerpo = operario.persona.grupo;
      cuerpo.position.copy(operario.centro).addScaledVector(operario.lado, desdeLaPunta - operario.largo);
      cuerpo.position.y = Math.abs(Math.sin(reloj * 4)) * 0.025; // un rebotecito al caminar
      // Mira para donde camina.
      const sentido = yendo ? 1 : -1;
      cuerpo.rotation.y = Math.atan2(operario.lado.x * sentido, operario.lado.z * sentido);
      operario.moverse(reloj);
    }

    // --- El que está al lado del jugador barre sin moverse del lugar ---
    vecino.moverse(reloj);

    // --- Mensajes ---
    if (mensaje >= 0 && reloj > finDeMensaje) {
      mensaje++;
      finDeMensaje = reloj + SEGUNDOS_POR_MENSAJE;
      if (mensaje < MENSAJES.length) {
        dialogo.textContent = MENSAJES[mensaje];
      } else {
        mensaje = -1; // no hay más
        dialogo.style.display = 'none';
        if (alTerminarDeHablar !== null) {
          alTerminarDeHablar();
        }
      }
    }
  }

  return { grupo, actualizar, aparecer, hablar };
}
