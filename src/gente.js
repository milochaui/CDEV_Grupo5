// Gente en el medio del predio, lejos de los escenarios:
//  - rondas de amigos charlando, parados en círculo;
//  - mantitas de chill en el piso, con gente sentada alrededor.
// Se mueven poquito (se balancean despacio): la música de los escenarios les llega bajita.
// Usan las mismas piezas que el público (ver publico.js), con InstancedMesh.
import * as THREE from 'three';
import {
  ALTO_CUERPO,
  geometriaCuerpo,
  geometriaCabeza,
  geometriaBrazo,
  materialPersona,
  COLORES_ROPA,
  COLORES_PIEL,
  ANGULO_BRAZO_ABAJO,
} from './publico.js';
import { crearRemeras, COLOR_REMERA, PROPORCION_REMERAS } from './remeras.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Dónde ---
// Los públicos de los escenarios empiezan a unos 36 m del centro (ver main.js y
// publico.js). La gente del medio va en un anillo alrededor del centro, sin taparlo:
// en el centro justo arranca el jugador.
const RADIO_MINIMO = 6; // metros desde el centro del predio
const RADIO_MAXIMO = 30; // metros desde el centro del predio
const SEPARACION_LUGARES = 5; // metros mínimos entre una ronda o mantita y otra
const DISTANCIA_A_OBSTACULOS = 3; // metros mínimos a cada obstáculo (los postes de los banderines)

// --- Cuántos ---
const CANTIDAD_RONDAS = 18; // grupos de gente parada
const PERSONAS_POR_RONDA_MIN = 2;
const PERSONAS_POR_RONDA_MAX = 5;
const CANTIDAD_MANTITAS = 12;
const PERSONAS_POR_MANTITA_MIN = 2;
const PERSONAS_POR_MANTITA_MAX = 4;

// --- Movimiento ---
const BALANCEO = 0.05; // cuánto se inclinan al mecerse (radianes)
const BALANCEOS_POR_SEGUNDO = 0.3;

// --- Mantita ---
const ANCHO_MANTITA = 2.2; // metros
const LARGO_MANTITA = 1.8; // metros
// Colores de las mantitas escocesas: [fondo, rayas].
const COLORES_MANTITA = [
  ['#b22222', '#1a1a1a'], // roja y negra
  ['#2e6b3a', '#d9a400'], // verde y amarilla
  ['#3b5b8c', '#eeeeee'], // azul y blanca
  ['#6b1f2e', '#d9a400'], // bordó y amarilla
];

// ---------------------------------------------------------------------------
// Forma de la gente sentada
// ---------------------------------------------------------------------------
// La gente parada usa el cuerpo del público (torso y piernas en una sola caja).
// Sentados, en cambio, el torso es más corto y las piernas van cruzadas adelante.

const ALTO_TORSO_SENTADO = 0.65;
const ALTURA_COLA = 0.05; // el torso arranca apenas por encima de la mantita

const geometriaTorsoSentado = new THREE.BoxGeometry(0.44, ALTO_TORSO_SENTADO, 0.26);
geometriaTorsoSentado.translate(0, ALTO_TORSO_SENTADO / 2 + ALTURA_COLA, 0); // la base en la cola

// Piernas cruzadas: una caja ancha y bajita adelante del torso (+Z, hacia donde mira).
const geometriaPiernasCruzadas = new THREE.BoxGeometry(0.5, 0.14, 0.4);
geometriaPiernasCruzadas.translate(0, 0.09, 0.2);

// Dónde van la cabeza y los hombros según si la persona está parada o sentada.
const FORMA_PARADO = {
  alturaPecho: 1.05, // dónde va el estampado de la remera (ver remeras.js)
  alturaCabeza: ALTO_CUERPO + 0.14,
  alturaHombros: ALTO_CUERPO - 0.05,
  brazosAdelante: 0, // los brazos cuelgan
};
const FORMA_SENTADO = {
  alturaPecho: ALTURA_COLA + ALTO_TORSO_SENTADO - 0.22,
  alturaCabeza: ALTURA_COLA + ALTO_TORSO_SENTADO + 0.14,
  alturaHombros: ALTURA_COLA + ALTO_TORSO_SENTADO - 0.05,
  brazosAdelante: -0.6, // los brazos van hacia adelante, apoyados en las piernas
};

// "Muñeco" de ayuda, como en publico.js: lo acomodamos como cada persona y copiamos
// las matrices de sus piezas a las InstancedMesh.
const muneco = new THREE.Object3D();
const munecoCabeza = new THREE.Object3D();
const munecoBrazoIzq = new THREE.Object3D();
const munecoBrazoDer = new THREE.Object3D();
muneco.add(munecoCabeza, munecoBrazoIzq, munecoBrazoDer);

// Elige un elemento al azar de una lista.
function alAzar(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Número entero al azar entre minimo y maximo (los dos incluidos).
function enteroAlAzar(minimo, maximo) {
  return minimo + Math.floor(Math.random() * (maximo - minimo + 1));
}

// Dibuja una mantita escocesa en un <canvas>: un fondo y rayas cruzadas medio transparentes.
function crearMaterialMantita([fondo, rayas]) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = rayas;
  ctx.globalAlpha = 0.5; // medio transparentes: donde se cruzan dos rayas queda más oscuro
  for (let i = 4; i < 64; i += 16) {
    ctx.fillRect(i, 0, 6, 64); // raya vertical
    ctx.fillRect(0, i, 64, 6); // raya horizontal
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: textura, roughness: 1 });
}
const materialesMantita = COLORES_MANTITA.map(crearMaterialMantita);
const geometriaMantita = new THREE.PlaneGeometry(ANCHO_MANTITA, LARGO_MANTITA);

/**
 * Crea a la gente del medio del predio.
 * @param {object} opciones
 * @param {Array} opciones.obstaculos  Cajas de colisión de cosas que hay en el medio
 *        (los postes de los banderines, ver predio.js). Nadie se pone encima de ellas:
 *        solo usamos su centro (centroX, centroZ).
 * @returns {{ grupo: THREE.Group, actualizar: (delta: number) => void }}
 */
export function crearGenteDelMedio({ obstaculos }) {
  const grupo = new THREE.Group();

  // --- 1. Lugares para las rondas y las mantitas ---
  // Puntos al azar en el anillo, que no queden muy cerca uno del otro.
  const lugares = [];
  let intentos = 0;
  while (lugares.length < CANTIDAD_RONDAS + CANTIDAD_MANTITAS && intentos < 2000) {
    intentos++;
    const angulo = Math.random() * Math.PI * 2;
    const radio = RADIO_MINIMO + Math.random() * (RADIO_MAXIMO - RADIO_MINIMO);
    const x = Math.cos(angulo) * radio;
    const z = Math.sin(angulo) * radio;
    const muyCerca = lugares.some((otro) => Math.hypot(otro.x - x, otro.z - z) < SEPARACION_LUGARES);
    const encimaDeAlgo = obstaculos.some(
      (caja) => Math.hypot(caja.centroX - x, caja.centroZ - z) < DISTANCIA_A_OBSTACULOS
    );
    if (!muyCerca && !encimaDeAlgo) {
      lugares.push({ x, z });
    }
  }
  // Los primeros lugares son para las rondas y el resto para las mantitas.
  const lugaresRondas = lugares.slice(0, CANTIDAD_RONDAS);
  const lugaresMantitas = lugares.slice(CANTIDAD_RONDAS);

  // --- 2. Personas ---
  // Cada persona: dónde está, hacia dónde mira y su ritmo para balancearse.
  // Agrega a una persona en un círculo alrededor de (centroX, centroZ), mirando al centro.
  function personaEnCirculo(lista, centroX, centroZ, angulo, radioX, radioZ) {
    const x = centroX + Math.cos(angulo) * radioX;
    const z = centroZ + Math.sin(angulo) * radioZ;
    lista.push({
      x,
      z,
      giro: Math.atan2(centroX - x, centroZ - z), // mira al centro (como en publico.js)
      escala: 0.9 + Math.random() * 0.2,
      fase: Math.random() * Math.PI * 2, // para que no se mezan todos juntos
    });
  }

  // Rondas: entre 2 y 5 personas en círculo, mirándose (charlando).
  const parados = [];
  for (const lugar of lugaresRondas) {
    const cantidad = enteroAlAzar(PERSONAS_POR_RONDA_MIN, PERSONAS_POR_RONDA_MAX);
    const giroRonda = Math.random() * Math.PI * 2; // para que no queden todas iguales
    const radio = 0.5 + cantidad * 0.12; // más gente, ronda más grande
    for (let i = 0; i < cantidad; i++) {
      // Repartidos parejo alrededor del círculo: una vuelta entera (2π) dividida entre todos.
      personaEnCirculo(parados, lugar.x, lugar.z, giroRonda + (i * Math.PI * 2) / cantidad, radio, radio);
    }
  }

  // Mantitas: una mantita en el piso y entre 2 y 4 personas sentadas en el borde,
  // mirando hacia el medio de la mantita.
  const sentados = [];
  for (const lugar of lugaresMantitas) {
    const mantita = new THREE.Mesh(geometriaMantita, alAzar(materialesMantita));
    mantita.rotation.x = -Math.PI / 2; // acostada, como el piso
    // Un poquito por encima del piso: si quedan a la misma altura, la placa de video
    // no sabe cuál dibujar adelante y "titilan".
    mantita.position.set(lugar.x, 0.02, lugar.z);
    grupo.add(mantita);

    const cantidad = enteroAlAzar(PERSONAS_POR_MANTITA_MIN, PERSONAS_POR_MANTITA_MAX);
    const giroGente = Math.random() * Math.PI * 2;
    for (let i = 0; i < cantidad; i++) {
      // En un óvalo un poco más chico que la mantita, para que queden sentados encima.
      personaEnCirculo(
        sentados, lugar.x, lugar.z, giroGente + (i * Math.PI * 2) / cantidad,
        ANCHO_MANTITA * 0.35, LARGO_MANTITA * 0.35
      );
    }
  }

  // --- 3. Piezas (InstancedMesh) ---
  // Crea las piezas de un tipo de persona, con una copia por persona.
  // "geometrias" es la lista de geometrías del cuerpo; además siempre van cabeza y brazos,
  // y los estampados de las remeras de bandas (a la altura del pecho de esta forma).
  function crearPiezas(geometrias, personas, forma) {
    const cantidad = personas.length;
    function pieza(geometria) {
      const malla = new THREE.InstancedMesh(geometria, materialPersona, cantidad);
      // Como en publico.js: se mueven, así que las dibujamos siempre.
      malla.frustumCulled = false;
      grupo.add(malla);
      return malla;
    }
    const piezas = {
      cuerpo: geometrias.map(pieza), // una o más piezas que se tiñen con el color de la ropa
      cabeza: pieza(geometriaCabeza),
      brazoIzq: pieza(geometriaBrazo),
      brazoDer: pieza(geometriaBrazo),
      remeras: crearRemeras(grupo, cantidad, forma.alturaPecho),
    };

    // Colores: ropa negra con estampado (remera de banda) o al azar; cabeza y brazos
    // con color de piel.
    const color = new THREE.Color();
    for (let i = 0; i < cantidad; i++) {
      if (Math.random() < PROPORCION_REMERAS) {
        personas[i].remera = piezas.remeras.ponerRemera();
        color.setHex(COLOR_REMERA);
      } else {
        personas[i].remera = null;
        color.setHex(alAzar(COLORES_ROPA));
      }
      for (const parte of piezas.cuerpo) {
        parte.setColorAt(i, color);
      }
      color.setHex(alAzar(COLORES_PIEL));
      piezas.cabeza.setColorAt(i, color);
      piezas.brazoIzq.setColorAt(i, color);
      piezas.brazoDer.setColorAt(i, color);
    }
    return piezas;
  }
  const piezasParados = crearPiezas([geometriaCuerpo], parados, FORMA_PARADO);
  const piezasSentados = crearPiezas([geometriaTorsoSentado, geometriaPiernasCruzadas], sentados, FORMA_SENTADO);

  // --- 4. Movimiento ---
  let reloj = 0;

  // Acomoda las piezas de un tipo de persona (paradas o sentadas) en este cuadro.
  function dibujar(personas, piezas, forma) {
    // Cabeza y hombros a la altura que corresponde a esta forma.
    munecoCabeza.position.set(0, forma.alturaCabeza, 0);
    munecoBrazoIzq.position.set(0.27, forma.alturaHombros, 0);
    munecoBrazoDer.position.set(-0.27, forma.alturaHombros, 0);
    // rotation.set(adelante, 0, costado): igual que en publico.js, cada brazo hacia su lado.
    munecoBrazoIzq.rotation.set(forma.brazosAdelante, 0, ANGULO_BRAZO_ABAJO);
    munecoBrazoDer.rotation.set(forma.brazosAdelante, 0, -ANGULO_BRAZO_ABAJO);

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      // Balanceo de costado: una onda lenta, con la fase propia de cada uno.
      const onda = Math.sin(reloj * Math.PI * 2 * BALANCEOS_POR_SEGUNDO + persona.fase);
      muneco.position.set(persona.x, 0, persona.z);
      muneco.rotation.set(0, persona.giro, BALANCEO * onda);
      muneco.scale.setScalar(persona.escala);
      muneco.updateMatrixWorld(true);

      for (const parte of piezas.cuerpo) {
        parte.setMatrixAt(i, muneco.matrixWorld);
      }
      piezas.cabeza.setMatrixAt(i, munecoCabeza.matrixWorld);
      piezas.brazoIzq.setMatrixAt(i, munecoBrazoIzq.matrixWorld);
      piezas.brazoDer.setMatrixAt(i, munecoBrazoDer.matrixWorld);
      if (persona.remera !== null) {
        piezas.remeras.mover(persona.remera, muneco.matrixWorld);
      }
    }

    // Avisamos que las matrices cambiaron.
    for (const parte of [...piezas.cuerpo, piezas.cabeza, piezas.brazoIzq, piezas.brazoDer]) {
      parte.instanceMatrix.needsUpdate = true;
    }
    piezas.remeras.avisarCambios();
  }

  /**
   * Mueve a la gente. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;
    dibujar(parados, piezasParados, FORMA_PARADO);
    dibujar(sentados, piezasSentados, FORMA_SENTADO);
  }

  // Una vez al principio, para que aparezcan en su lugar antes del primer cuadro.
  actualizar(0);

  return { grupo, actualizar };
}
