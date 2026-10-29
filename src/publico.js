// Público de un escenario: muchas personas low-poly que reaccionan a la música.
// Con un tema conocido se ponen eufóricas (saltan alto, brazos arriba) y con uno
// menos conocido están tranquilas (se balancean y muchos levantan el celular con la
// linterna prendida). Los saltos siguen los golpes graves del tema, que sacamos
// analizando el audio en tiempo real (ver graves() en musica.js).
// Además, algunos ondean banderas y otros están subidos a los hombros de alguien.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crearRemeras, COLOR_REMERA, PROPORCION_REMERAS } from './remeras.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Cantidad y lugar ---
const PERSONAS_POR_ESCENARIO = 200; // recomendado: entre 150 y 250
const DISTANCIA_VALLA = 3; // metros entre el frente de la tarima y la primera fila
const PROFUNDIDAD_PUBLICO = 35; // metros desde la primera fila hasta el fondo
const ANCHO_ADELANTE = 28; // ancho de la zona del público en la primera fila (metros)
const ANCHO_ATRAS = 44; // ancho de la zona del público al fondo (metros)
const SEPARACION_MINIMA = 0.5; // dos personas nunca quedan más cerca que esto (metros)
const PERSONAS_EN_HOMBROS = 6; // de las 200, cuántas van subidas a los hombros de otra
const BANDERAS_POR_ESCENARIO = 8; // cuántas personas ondean una bandera

// --- Reacción según el tema (valores de "tranquilos" y de "euforia") ---
const SEGUNDOS_TRANSICION = 4; // lo que tarda en pasar de tranquilos a euforia (o al revés)
const PROPORCION_SALTAN_TRANQUI = 0.1; // 10 % de la gente salta
const PROPORCION_SALTAN_EUFORIA = 0.85; // 85 % de la gente salta
const ALTURA_SALTO_TRANQUI = 0.15; // metros
const ALTURA_SALTO_EUFORIA = 0.5; // metros
const PROPORCION_BRAZOS_ARRIBA_TRANQUI = 0.05;
const PROPORCION_BRAZOS_ARRIBA_EUFORIA = 0.75;
const BALANCEO_TRANQUI = 0.1; // cuánto se inclinan al mecerse (radianes, 0.1 ≈ 6°)
const BALANCEO_EUFORIA = 0.03;
const BALANCEOS_POR_SEGUNDO = 0.4; // ida y vuelta completa cada 2.5 segundos
const VELOCIDAD_BRAZOS = 3; // con 3 tardan 1/3 de segundo en subir o bajar del todo
const PROPORCION_BRAZOS_OVACION = 0.8; // al terminar un tema, en lo más fuerte de los aplausos

// --- Celulares con la linterna prendida (en los temas tranquilos) ---
const PROPORCION_CELULAR_TRANQUI = 0.3; // 30 % de la gente levanta el celular
const PROPORCION_CELULAR_EUFORIA = 0; // con euforia nadie: están saltando
const ANGULO_BRAZO_CELULAR = 2.7; // el brazo derecho bien arriba
const VAIVEN_CELULAR = 0.3; // cuánto lo mueven de lado a lado (radianes)
const VAIVENES_POR_SEGUNDO = 0.35; // ida y vuelta completa cada 3 segundos, despacio
const VELOCIDAD_CELULAR = 1.5; // con 1.5 tardan 2/3 de segundo en levantarlo o bajarlo

// --- Ritmo: cómo detectamos los golpes y cómo son los saltos ---
// graves() mide en decibeles, así que una diferencia fija equivale a "tantas veces más fuerte".
// Con 0.05 (y el rango de 60 dB que usa el analizador) un golpe es un salto de unos 3 dB.
// Probado con los 7 temas: detecta entre 70 y 130 golpes por minuto, como el tempo de un rock.
// En esos temas graves() anda casi siempre entre 0.3 y 0.5.
const SENSIBILIDAD_GOLPE = 0.05; // más chico = detecta más golpes
const GRAVES_MINIMOS = 0.2; // por debajo de esto (partes muy suaves o silencio) no hay golpes
const TIEMPO_ENTRE_GOLPES = 0.3; // segundos mínimos entre un golpe y el siguiente
const DURACION_SALTO = 0.4; // segundos que dura un salto (subir y bajar)
const RETRASO_MAXIMO_SALTO = 0.12; // cada persona arranca su salto con un retraso de 0 a esto

// --- Banderas ---
const ANCHO_BANDERA = 1.1; // metros
const ALTO_BANDERA = 0.7; // metros
const LARGO_PALO = 1.9; // metros (sobresale 0.3 por debajo de la mano)
const ONDAS_TELA_POR_SEGUNDO = 1.2; // qué tan rápido corren las ondas por la tela
const AMPLITUD_TELA = 0.12; // metros que se mueve la punta de la tela hacia adelante y atrás
const AGITE_PALO = 0.35; // cuánto inclina el palo de un lado al otro (radianes, 0.35 ≈ 20°)
const AGITES_PALO_POR_SEGUNDO = 0.6;

// ---------------------------------------------------------------------------
// Forma de cada persona (compartida por todos los escenarios)
// ---------------------------------------------------------------------------
// Las que llevan "export" también las usa la gente del medio del predio (ver gente.js).

// Medidas en metros. Cada persona se arma con 4 cajas: cuerpo, cabeza y dos brazos.
export const ALTO_CUERPO = 1.35; // torso y piernas en una sola caja
export const LARGO_BRAZO = 0.6;

// Cuerpo: lo subimos la mitad de su alto para que los pies queden en y = 0.
// Así, al girar a la persona para que se balancee, gira desde los pies.
export const geometriaCuerpo = new THREE.BoxGeometry(0.44, ALTO_CUERPO, 0.26);
geometriaCuerpo.translate(0, ALTO_CUERPO / 2, 0);

export const geometriaCabeza = new THREE.BoxGeometry(0.24, 0.26, 0.24);

// Brazo: lo bajamos la mitad de su largo para que su punto de giro sea el hombro
// (la punta de arriba). Girado 0 cuelga hacia abajo.
export const geometriaBrazo = new THREE.BoxGeometry(0.1, LARGO_BRAZO, 0.1);
geometriaBrazo.translate(0, -LARGO_BRAZO / 2, 0);

// --- El que va subido a los hombros ---
// Va sentado: la cadera apoyada sobre los hombros del de abajo, justo detrás de su cabeza,
// y las piernas pasan a los costados de la cabeza y cuelgan sobre su pecho.
// Del cuerpo se ve solo el torso (la parte de la caja que va de la cadera para arriba)
// y las piernas son otra pieza, dobladas en la rodilla.
export const ALTURA_CADERA = 0.75; // metros desde los pies (el torso va de acá hasta ALTO_CUERPO)
// Dónde se apoya la cadera del de arriba, medido desde los pies del de abajo:
// apenas por encima de sus hombros y un poco hacia atrás (−Z), para no meterse en su cabeza.
export const POSICION_HOMBROS = new THREE.Vector3(0, ALTO_CUERPO + 0.02, -0.22);
export const SEPARACION_PIERNAS = 0.21; // de la cadera a cada pierna, para los costados (pasan junto a la cabeza)
const LARGO_MUSLO = 0.55;
const LARGO_CANILLA = 0.5;

// Pierna sentada: el muslo va hacia adelante (+Z) desde la cadera, la canilla cuelga desde
// la rodilla y abajo va el pie. La armamos con tres cajas y las juntamos en una sola
// geometría con mergeGeometries (viene con Three.js). El punto de giro es la cadera.
const muslo = new THREE.BoxGeometry(0.14, 0.14, LARGO_MUSLO);
muslo.translate(0, 0, LARGO_MUSLO / 2);
const canilla = new THREE.BoxGeometry(0.12, LARGO_CANILLA, 0.12);
canilla.translate(0, -LARGO_CANILLA / 2, LARGO_MUSLO - 0.06);
const pie = new THREE.BoxGeometry(0.12, 0.08, 0.22);
pie.translate(0, -LARGO_CANILLA, LARGO_MUSLO + 0.02);
export const geometriaPiernaSentada = mergeGeometries([muslo, canilla, pie]);

// El que carga a alguien lo agarra de los tobillos: brazos hacia adelante (giro en X,
// negativo = adelante) y un poco hacia adentro (giro en Z, ver ANGULO_BRAZO_ABAJO).
export const BRAZOS_AGARRAN_ADELANTE = -0.55;
export const BRAZOS_AGARRAN_ADENTRO = -0.15;

// Un solo material blanco para todo: el color de cada persona lo pone setColorAt,
// que "tiñe" cada copia por separado.
export const materialPersona = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

// Celular: una cajita blanca. MeshBasicMaterial no depende de las luces:
// siempre se ve encendido, como la linterna en la oscuridad.
const geometriaCelular = new THREE.BoxGeometry(0.07, 0.13, 0.015);
const materialCelular = new THREE.MeshBasicMaterial({ color: 0xf2f6ff });
// Brillo de la linterna: una esfera transparente alrededor del celular. Como es redonda,
// se ve igual desde cualquier lado. La mezcla "aditiva" suma su color a lo que hay
// detrás, como la luz de verdad (igual que los haces de los reflectores).
const geometriaBrillo = new THREE.SphereGeometry(0.15, 8, 6);
const materialBrillo = new THREE.MeshBasicMaterial({
  color: 0xdde8ff,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  depthWrite: false, // evita que el brillo "tape" otros objetos transparentes
});

// Colores de ropa: mucho negro (como en todo recital de rock) y algo de color.
export const COLORES_ROPA = [
  0x111111, 0x111111, 0x1a1a1a, 0x222222, // negros (más veces = más probable)
  0x3b5b8c, // jean
  0x555555, // gris
  0xb22222, // rojo
  0xeeeeee, // blanco
  0x2e6b3a, // verde
  0x6b1f2e, // bordó
  0x4a90c8, // celeste
  0xd9a400, // amarillo
];
export const COLORES_PIEL = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
// Pantalones de jean de los que van sentados en hombros: así sus piernas se distinguen
// de la remera del que los carga (que suele ser negra).
const COLORES_JEAN = [0x3b5b8c, 0x2a3f66, 0x4a6fa5];

// Ángulo de los brazos (en radianes): casi colgando o casi verticales, un poco abiertos.
export const ANGULO_BRAZO_ABAJO = 0.15;
const ANGULO_BRAZO_ARRIBA = 2.8; // π sería derecho para arriba

// "Muñeco" de ayuda: un Object3D invisible con la cabeza y los brazos como hijos.
// Para cada persona lo acomodamos (posición, giro, brazos) y Three.js calcula la matriz
// de cada pieza; nosotros solo la copiamos a la InstancedMesh que corresponde.
// Así no hacemos a mano las cuentas de rotaciones.
const muneco = new THREE.Object3D();
const munecoCabeza = new THREE.Object3D();
munecoCabeza.position.set(0, ALTO_CUERPO + 0.14, 0);
// La persona se arma mirando hacia +Z, así que su izquierda queda en +X y su derecha en −X.
const munecoBrazoIzq = new THREE.Object3D();
munecoBrazoIzq.position.set(0.27, ALTO_CUERPO - 0.05, 0); // hombro izquierdo
const munecoBrazoDer = new THREE.Object3D();
munecoBrazoDer.position.set(-0.27, ALTO_CUERPO - 0.05, 0); // hombro derecho
muneco.add(munecoCabeza, munecoBrazoIzq, munecoBrazoDer);
// El celular va en la mano derecha, en la punta del brazo, y sigue el largo del brazo:
// con el brazo levantado, queda parado arriba de la mano.
const munecoCelular = new THREE.Object3D();
munecoCelular.position.set(0, -LARGO_BRAZO - 0.06, 0);
munecoBrazoDer.add(munecoCelular);
// Mano derecha: en la punta del brazo. Ahí agarran el palo los que tienen bandera.
const munecoManoDer = new THREE.Object3D();
munecoManoDer.position.set(0, -LARGO_BRAZO, 0);
munecoBrazoDer.add(munecoManoDer);
// Hombros: el lugar donde se "sienta" el que va subido (ver POSICION_HOMBROS).
const munecoHombros = new THREE.Object3D();
munecoHombros.position.copy(POSICION_HOMBROS);
muneco.add(munecoHombros);
// Para el que va subido: el torso es la caja del cuerpo achicada en alto, desde la cadera
// hasta arriba (scale.y: qué parte del alto queda)...
const munecoTorso = new THREE.Object3D();
munecoTorso.position.y = ALTURA_CADERA;
munecoTorso.scale.y = (ALTO_CUERPO - ALTURA_CADERA) / ALTO_CUERPO;
// ...y las piernas salen de la cadera, una a cada lado.
const munecoPiernaIzq = new THREE.Object3D();
munecoPiernaIzq.position.set(SEPARACION_PIERNAS, ALTURA_CADERA, 0);
const munecoPiernaDer = new THREE.Object3D();
munecoPiernaDer.position.set(-SEPARACION_PIERNAS, ALTURA_CADERA, 0);
muneco.add(munecoTorso, munecoPiernaIzq, munecoPiernaDer);

// Matriz con escala 0: la copia que la usa no se ve. Se la damos a las piernas
// sentadas de la gente que no va subida a nadie.
const MATRIZ_OCULTA = new THREE.Matrix4().makeScale(0, 0, 0);
// Lo reusa el que va subido para calcular dónde va (ver actualizar).
const desplazamientoCadera = new THREE.Vector3();

// Ángulo del brazo que sostiene la bandera: casi derecho para arriba.
const ANGULO_BRAZO_BANDERA = 2.95;

// ---------------------------------------------------------------------------
// Banderas (compartidas por todos los escenarios)
// ---------------------------------------------------------------------------

// Diseños: franjas horizontales de arriba hacia abajo. La argentina, además, lleva el sol;
// la uruguaya, el sol en un cuadrado blanco pegado al palo (el "cantón").
const DISENOS_BANDERA = {
  argentina: { franjas: ['#74acdf', '#ffffff', '#74acdf'], sol: 'centro' },
  // Uruguay: 9 franjas, empezando y terminando en blanco.
  uruguay: {
    franjas: ['#ffffff', '#0038a8', '#ffffff', '#0038a8', '#ffffff', '#0038a8', '#ffffff', '#0038a8', '#ffffff'],
    sol: 'canton',
  },
  rojinegra: { franjas: ['#b22222', '#111111'] },
  blanquinegra: { franjas: ['#ffffff', '#111111'] },
  verdiblanca: { franjas: ['#2e6b3a', '#ffffff'] },
};

// Las banderas que lleva el público si la banda no pide otras (ver cambiarBanderas).
// La argentina aparece dos veces para que salga más seguido.
const BANDERAS_COMUNES = ['argentina', 'argentina', 'rojinegra', 'blanquinegra', 'verdiblanca'];

// Por cada diseño, un material con la bandera dibujada en un <canvas> (como el cartel
// del escenario). DoubleSide: la tela se ve de los dos lados.
// La x = 0 del canvas queda del lado del palo (ver crearBandera).
const materialesBandera = {};
for (const nombre in DISENOS_BANDERA) {
  const diseno = DISENOS_BANDERA[nombre];
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  const altoFranja = canvas.height / diseno.franjas.length;
  diseno.franjas.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * altoFranja, canvas.width, altoFranja);
  });
  ctx.fillStyle = '#f6b40e'; // amarillo del sol
  if (diseno.sol === 'centro') {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (diseno.sol === 'canton') {
    // El cantón ocupa el alto de las primeras 5 franjas y es cuadrado.
    const lado = altoFranja * 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#f6b40e';
    ctx.beginPath();
    ctx.arc(lado / 2, lado / 2, lado * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  materialesBandera[nombre] = new THREE.MeshStandardMaterial({ map: textura, side: THREE.DoubleSide, roughness: 0.9 });
}

// Elige al azar el material de una de las banderas de la lista (por ejemplo BANDERAS_COMUNES).
function materialBanderaAlAzar(nombres) {
  return materialesBandera[alAzar(nombres)];
}

// Palo: un cilindro finito. Lo subimos para que la mano lo agarre 0.3 m arriba de la punta de abajo.
const geometriaPalo = new THREE.CylinderGeometry(0.02, 0.02, LARGO_PALO, 5);
geometriaPalo.translate(0, LARGO_PALO / 2 - 0.3, 0);
const materialPalo = new THREE.MeshStandardMaterial({ color: 0x8b6b3d });

/**
 * Crea una bandera: un palo y una tela. La tela está dividida en cuadraditos
 * (8 a lo ancho, 3 a lo alto) para poder doblarla y que ondee.
 * Cada bandera tiene su propia geometría de tela, porque cada una ondea distinto.
 */
function crearBandera() {
  const bandera = new THREE.Group();
  bandera.add(new THREE.Mesh(geometriaPalo, materialPalo));

  const geometriaTela = new THREE.PlaneGeometry(ANCHO_BANDERA, ALTO_BANDERA, 8, 3);
  // Corremos la tela para que su esquina de arriba a la izquierda quede pegada al palo.
  geometriaTela.translate(ANCHO_BANDERA / 2, -ALTO_BANDERA / 2, 0);
  const tela = new THREE.Mesh(geometriaTela, materialBanderaAlAzar(BANDERAS_COMUNES));
  tela.position.y = LARGO_PALO - 0.3; // en la punta de arriba del palo
  bandera.add(tela);

  bandera.userData.tela = tela;
  bandera.userData.fase = Math.random() * Math.PI * 2; // para que no ondeen todas juntas
  return bandera;
}

/**
 * Hace ondear la tela: a cada punto le damos una profundidad (z) que sigue una onda
 * que corre a lo largo de la tela. Cerca del palo casi no se mueve y en la punta, mucho.
 */
function ondearTela(bandera, reloj) {
  const posiciones = bandera.userData.tela.geometry.attributes.position;
  for (let i = 0; i < posiciones.count; i++) {
    const x = posiciones.getX(i); // 0 en el palo, ANCHO_BANDERA en la punta
    const onda = Math.sin(x * 5 - reloj * Math.PI * 2 * ONDAS_TELA_POR_SEGUNDO + bandera.userData.fase);
    posiciones.setZ(i, onda * AMPLITUD_TELA * (x / ANCHO_BANDERA));
  }
  posiciones.needsUpdate = true; // avisamos que cambiaron los puntos
  // Recalculamos hacia dónde "mira" cada parte de la tela, para que la luz la ilumine bien.
  bandera.userData.tela.geometry.computeVertexNormals();
}

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

// Elige un elemento al azar de una lista.
function alAzar(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

/**
 * Crea el público de un escenario.
 * El grupo que devuelve se arma con el escenario hacia -Z: la primera fila queda cerca
 * de z = 0 y el fondo hacia +Z. Hay que ubicarlo en el frente de la tarima (ver escenario.js).
 *
 * @param {object} musica  La música del escenario (ver crearMusica en musica.js)
 * @param {object} aplausos  Los aplausos del escenario (ver crearAplausos en aplausos.js)
 * @returns {{ grupo: THREE.Group, actualizar: (delta: number) => void,
 *             contagiar: Function, contarPersonasCerca: Function,
 *             cambiarBanderas: (nombres?: string[]) => void }}
 */
export function crearPublico(musica, aplausos) {
  const grupo = new THREE.Group();

  // --- Las 8 InstancedMesh ---
  // Una InstancedMesh dibuja muchas copias de la misma forma en UNA sola llamada a la
  // placa de video. Con 8 (cuerpo, cabeza, cada brazo, el celular, su brillo y las dos
  // piernas de los que van sentados en hombros) dibujamos a todo el público.
  // Mucho más rápido que 1600 Mesh sueltas.
  function crearPieza(geometria, material = materialPersona) {
    const pieza = new THREE.InstancedMesh(geometria, material, PERSONAS_POR_ESCENARIO);
    // Le avisamos que las posiciones van a cambiar en cada cuadro.
    pieza.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Three.js no dibuja lo que queda fuera de la vista, pero para una InstancedMesh
    // calcula esa zona una sola vez, y la gente se mueve. Lo apagamos: se dibuja siempre.
    pieza.frustumCulled = false;
    grupo.add(pieza);
    return pieza;
  }
  const cuerpos = crearPieza(geometriaCuerpo);
  const cabezas = crearPieza(geometriaCabeza);
  const brazosIzq = crearPieza(geometriaBrazo);
  const brazosDer = crearPieza(geometriaBrazo);
  const celulares = crearPieza(geometriaCelular, materialCelular);
  const brillos = crearPieza(geometriaBrillo, materialBrillo);
  const piernasIzq = crearPieza(geometriaPiernaSentada);
  const piernasDer = crearPieza(geometriaPiernaSentada);

  // Estampados de las remeras de bandas (ver remeras.js). En el muñeco, el pecho queda
  // a 1.05 m de los pies: en el medio del torso, también en los que van sentados.
  const remeras = crearRemeras(grupo, PERSONAS_POR_ESCENARIO, 1.05);

  // --- Repartimos a la gente ---
  const personas = [];
  const color = new THREE.Color(); // lo reusamos para no crear uno por persona

  // Agrega una persona parada en (x, z) a la lista y le pinta la ropa y la piel.
  function agregarPersona(x, z) {
    const persona = {
      x,
      z,
      // Giro para mirar al escenario (al centro del frente de la tarima, que está en 0, 0).
      // Igual que en escenario.js: atan2(dx, dz) da el ángulo para mirar en esa dirección.
      giro: Math.atan2(-x, -z),
      escala: mezclar(0.9, 1.1, Math.random()), // unos más altos, otros más bajos
      // Números al azar fijos de cada persona. Por ejemplo, si el 40 % de la gente salta,
      // saltan los que tienen ganasSaltar menor que 0.4. Al subir la euforia se van sumando.
      ganasSaltar: Math.random(),
      ganasBrazos: Math.random(),
      aperturaBrazos: mezclar(-0.25, 0.15, Math.random()), // unos los abren más que otros
      faseBalanceo: Math.random() * Math.PI * 2, // para que no se mezan todos juntos
      velocidadBalanceo: mezclar(0.8, 1.2, Math.random()),
      brazos: 0, // 0 = abajo, 1 = arriba (va cambiando de a poco)
      ganasCelular: Math.random(),
      faseVaiven: Math.random() * Math.PI * 2, // para que no muevan el celular todos juntos
      celular: 0, // 0 = guardado, 1 = levantado (va cambiando de a poco)
      inicioSalto: -100, // en qué momento empezó (o empieza) su último salto
      alturaSalto: 0,
      ladeo: 0, // cuánto está inclinada de costado en este cuadro (radianes)
      base: null, // si va subida a los hombros de alguien: la persona que la carga
      hombros: null, // si carga a alguien: dónde están sus hombros (un Vector3)
      bandera: null, // si ondea una bandera: el grupo de la bandera
      remera: null, // si lleva remera de banda: su estampado (ver remeras.js)
    };
    personas.push(persona);

    // Colores: ropa negra con estampado (remera de banda) o al azar; cabeza y brazos
    // (remera de manga corta) con color de piel. Las piernas sentadas, de jean.
    const indice = personas.length - 1;
    if (Math.random() < PROPORCION_REMERAS) {
      persona.remera = remeras.ponerRemera();
      color.setHex(COLOR_REMERA);
    } else {
      color.setHex(alAzar(COLORES_ROPA));
    }
    cuerpos.setColorAt(indice, color);
    color.setHex(alAzar(COLORES_JEAN));
    piernasIzq.setColorAt(indice, color);
    piernasDer.setColorAt(indice, color);
    color.setHex(alAzar(COLORES_PIEL));
    cabezas.setColorAt(indice, color);
    brazosIzq.setColorAt(indice, color);
    brazosDer.setColorAt(indice, color);
    return persona;
  }

  // Primero la gente parada en el piso: todos menos los que van a ir en hombros.
  const personasEnElPiso = PERSONAS_POR_ESCENARIO - PERSONAS_EN_HOMBROS;
  let intentos = 0;
  while (personas.length < personasEnElPiso && intentos < PERSONAS_POR_ESCENARIO * 50) {
    intentos++;

    // Distancia a la valla: profundidad × (azar al cuadrado).
    // Al elevar al cuadrado un número entre 0 y 1 se achica (0.5² = 0.25), así que salen
    // muchas distancias chicas: la gente se amontona adelante y queda dispersa al fondo.
    const azar = Math.random();
    const distancia = PROFUNDIDAD_PUBLICO * azar * azar;
    // La zona se ensancha hacia atrás, como un abanico.
    const ancho = mezclar(ANCHO_ADELANTE, ANCHO_ATRAS, distancia / PROFUNDIDAD_PUBLICO);
    const x = (Math.random() - 0.5) * ancho;
    const z = DISTANCIA_VALLA + distancia;

    // Si quedó encima de alguien, probamos otro lugar.
    const encimado = personas.some(
      (otra) => Math.hypot(otra.x - x, otra.z - z) < SEPARACION_MINIMA
    );
    if (encimado) {
      continue;
    }
    agregarPersona(x, z);
  }

  // Después, los que van en hombros. Elegimos al azar a quién se suben y los agregamos
  // al final de la lista: así, en cada cuadro, primero se mueve el que carga y después
  // el de arriba, que necesita saber dónde quedaron los hombros del de abajo.
  const cantidadEnElPiso = personas.length;
  for (let i = 0; i < PERSONAS_EN_HOMBROS; i++) {
    const base = personas[Math.floor(Math.random() * cantidadEnElPiso)];
    if (base.hombros !== null) {
      continue; // ya carga a alguien: esta vez no sumamos a nadie
    }
    base.hombros = new THREE.Vector3();
    const arriba = agregarPersona(base.x, base.z);
    arriba.base = base;
    arriba.giro = base.giro; // mira para el mismo lado que el que lo carga
    arriba.escala = mezclar(0.8, 0.9, Math.random()); // un poco más chico (más liviano)
    arriba.ganasBrazos = 0; // allá arriba casi siempre está con los brazos levantados
  }

  // Por último, las banderas: se las damos a gente al azar (también a los de arriba,
  // pero no a los que cargan a alguien, que tienen las manos ocupadas).
  for (let i = 0; i < BANDERAS_POR_ESCENARIO; i++) {
    const persona = alAzar(personas);
    if (persona.hombros !== null || persona.bandera !== null) {
      continue;
    }
    persona.bandera = crearBandera();
    grupo.add(persona.bandera);
  }

  // Si no entraron todos (por falta de lugar), solo dibujamos los que sí.
  for (const pieza of [cuerpos, cabezas, brazosIzq, brazosDer, celulares, brillos, piernasIzq, piernasDer]) {
    pieza.count = personas.length;
  }

  // --- Estado del público ---
  let euforia = 0; // 0 = tranquilos, 1 = euforia total
  let reloj = 0; // segundos desde que empezó el juego
  let promedioGraves = 0; // cómo vienen sonando los graves últimamente
  let ultimoGolpe = -100; // momento del último golpe detectado

  // --- Contagio del jugador ---
  // Lo manda acciones.js en cada cuadro con contagiar(). La gente cerca del jugador
  // suma euforia extra, más cuanto más cerca está.
  const jugadorLocal = new THREE.Vector3(); // posición del jugador medida desde el público
  let extraEuforia = 0; // euforia que suma alguien pegado al jugador
  let radioContagio = 1; // metros: más lejos que esto no hay contagio
  let multiplicadorSaltoCerca = 1; // con pogo, los de al lado saltan más alto

  // Pasa una posición del predio a coordenadas del público (medida desde la valla,
  // con el escenario hacia -Z), que es como guardamos x y z de cada persona.
  // worldToLocal deshace el movimiento y el giro del escenario.
  function aCoordenadasDelPublico(posicionMundo, resultado) {
    resultado.copy(posicionMundo);
    grupo.worldToLocal(resultado);
    return resultado;
  }

  /**
   * Guarda el contagio del jugador para los próximos cuadros (ver acciones.js).
   * @param {THREE.Vector3} posicionMundo  Dónde está el jugador en el predio
   * @param {number} extra  Euforia que suma la gente pegada al jugador
   * @param {number} radio  Metros alrededor del jugador a los que llega el contagio
   * @param {number} multiplicadorSalto  Cuánto más alto saltan los de al lado (1 = igual)
   */
  function contagiar(posicionMundo, extra, radio, multiplicadorSalto) {
    aCoordenadasDelPublico(posicionMundo, jugadorLocal);
    extraEuforia = extra;
    radioContagio = radio;
    multiplicadorSaltoCerca = multiplicadorSalto;
  }

  const posicionConsulta = new THREE.Vector3(); // la reusa contarPersonasCerca

  /**
   * Cuenta cuántas personas hay a menos de "radio" metros de una posición del predio.
   * La usa el pogo para saber si el jugador está metido entre la gente.
   * @param {THREE.Vector3} posicionMundo
   * @param {number} radio  Metros
   * @returns {number}
   */
  function contarPersonasCerca(posicionMundo, radio) {
    aCoordenadasDelPublico(posicionMundo, posicionConsulta);
    let cantidad = 0;
    for (const persona of personas) {
      if (persona.base !== null) {
        continue; // los que van en hombros no ocupan lugar en el piso
      }
      if (Math.hypot(persona.x - posicionConsulta.x, persona.z - posicionConsulta.z) < radio) {
        cantidad++;
      }
    }
    return cantidad;
  }

  /**
   * Mueve al público. Se llama en cada cuadro de la animación (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    // --- 1. Euforia según el tema ---
    // Objetivo: 1 si suena un tema conocido, 0 si no (o si todavía no suena nada).
    const objetivo = musica.estaSonando() && musica.temaActual().conocido ? 1 : 0;
    // La euforia se acerca al objetivo de a poco, siempre a la misma velocidad:
    // en SEGUNDOS_TRANSICION segundos recorre el camino completo de 0 a 1.
    const paso = delta / SEGUNDOS_TRANSICION;
    if (euforia < objetivo) {
      euforia = Math.min(objetivo, euforia + paso);
    } else {
      euforia = Math.max(objetivo, euforia - paso);
    }

    // --- 2. ¿Hubo un golpe grave? ---
    // Un golpe es cuando los graves suben de repente por encima de cómo venían sonando.
    let hayGolpe = false;
    if (musica.estaSonando()) {
      const graves = musica.graves();
      hayGolpe =
        graves > promedioGraves + SENSIBILIDAD_GOLPE &&
        graves > GRAVES_MINIMOS &&
        reloj - ultimoGolpe > TIEMPO_ENTRE_GOLPES;
      // Promedio "lento": en cada cuadro se acerca un poquito al valor actual.
      // Así recuerda más o menos el último segundo de música.
      promedioGraves = mezclar(promedioGraves, graves, Math.min(1, delta * 2));
      if (hayGolpe) {
        ultimoGolpe = reloj;
      }
    }

    // Ovación: al terminar un tema, mientras aplauden, mucha gente levanta los brazos.
    const ovacion = aplausos.intensidad();

    // --- 3. Cada persona ---
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];

      // Contagio: cercanía al jugador, de 1 (pegado) a 0 (en el borde del radio o más lejos).
      const distanciaJugador = Math.hypot(persona.x - jugadorLocal.x, persona.z - jugadorLocal.z);
      const cercania = Math.max(0, 1 - distanciaJugador / radioContagio);
      // Euforia propia de esta persona: la del tema más el contagio.
      // Puede pasar de 1: así, aun con un tema conocido (euforia ya en 1), los que
      // están cerca del jugador se ponen más eufóricos que el resto.
      const euforiaPersona = euforia + extraEuforia * cercania;

      // Valores de esta persona, entre "tranquilos" y "euforia".
      // Con euforiaPersona mayor que 1, mezclar se pasa un poco de los valores de euforia
      // (salta más alto, más brazos arriba).
      const proporcionSaltan = mezclar(PROPORCION_SALTAN_TRANQUI, PROPORCION_SALTAN_EUFORIA, euforiaPersona);
      const proporcionBrazos = Math.max(
        mezclar(PROPORCION_BRAZOS_ARRIBA_TRANQUI, PROPORCION_BRAZOS_ARRIBA_EUFORIA, euforiaPersona),
        ovacion * PROPORCION_BRAZOS_OVACION
      );
      const alturaSalto =
        mezclar(ALTURA_SALTO_TRANQUI, ALTURA_SALTO_EUFORIA, euforiaPersona) *
        mezclar(1, multiplicadorSaltoCerca, cercania); // con pogo, los de al lado saltan más
      // El balanceo baja con la euforia; Math.max evita que dé negativo.
      const balanceo = Math.max(0, mezclar(BALANCEO_TRANQUI, BALANCEO_EUFORIA, euforiaPersona));

      // Saltos: con cada golpe, los que saltan (y no están en el aire) arrancan un salto,
      // cada uno con su pequeño retraso: así no saltan todos exactamente juntos.
      // Ni el que va en hombros ni el que lo carga saltan.
      const enHombros = persona.base !== null;
      const cargaAAlguien = persona.hombros !== null;
      const puedeSaltar = !enHombros && !cargaAAlguien;
      const estaEnElAire = reloj < persona.inicioSalto + DURACION_SALTO;
      if (hayGolpe && puedeSaltar && !estaEnElAire && persona.ganasSaltar < proporcionSaltan) {
        persona.inicioSalto = reloj + Math.random() * RETRASO_MAXIMO_SALTO;
        persona.alturaSalto = alturaSalto * mezclar(0.7, 1.3, Math.random());
      }

      // Altura del salto: una parábola. p va de 0 (despega) a 1 (aterriza);
      // 4·p·(1 − p) vale 0 en las puntas y 1 en el medio (p = 0.5, lo más alto).
      let altura = 0;
      const tiempoSalto = reloj - persona.inicioSalto;
      if (tiempoSalto >= 0 && tiempoSalto <= DURACION_SALTO) {
        const p = tiempoSalto / DURACION_SALTO;
        altura = persona.alturaSalto * 4 * p * (1 - p);
      }

      // Brazos: van de a poco hacia arriba (1) o hacia abajo (0).
      // El que carga a alguien los tiene abajo: le está agarrando las piernas.
      const objetivoBrazos = !cargaAAlguien && persona.ganasBrazos < proporcionBrazos ? 1 : 0;
      const pasoBrazos = VELOCIDAD_BRAZOS * delta;
      if (persona.brazos < objetivoBrazos) {
        persona.brazos = Math.min(objetivoBrazos, persona.brazos + pasoBrazos);
      } else {
        persona.brazos = Math.max(objetivoBrazos, persona.brazos - pasoBrazos);
      }
      const anguloBrazos = mezclar(
        ANGULO_BRAZO_ABAJO,
        ANGULO_BRAZO_ARRIBA + persona.aperturaBrazos,
        persona.brazos
      );

      // Balanceo de costado: una onda (seno) que va de −1 a 1, con el ritmo propio de cada uno.
      const onda = Math.sin(
        reloj * Math.PI * 2 * BALANCEOS_POR_SEGUNDO * persona.velocidadBalanceo + persona.faseBalanceo
      );

      // Acomodamos el muñeco como esta persona...
      // El que va en hombros se balancea junto con el de abajo.
      persona.ladeo = enHombros ? persona.base.ladeo : balanceo * onda;
      muneco.rotation.set(0, persona.giro, persona.ladeo);
      muneco.scale.setScalar(persona.escala);
      if (enHombros) {
        // Sentado en los hombros del de abajo: su cadera (no sus pies) va donde quedaron
        // esos hombros en este cuadro. Desde ahí bajamos la altura de la cadera, girada y
        // escalada igual que el muñeco (applyEuler gira un vector con los giros del muñeco).
        desplazamientoCadera.set(0, -ALTURA_CADERA * persona.escala, 0).applyEuler(muneco.rotation);
        muneco.position.copy(persona.base.hombros).add(desplazamientoCadera);
      } else {
        muneco.position.set(persona.x, altura, persona.z);
      }
      // Cada brazo gira hacia afuera: el de +X con ángulo positivo, el de −X con negativo.
      // El que carga a alguien, en cambio, los lleva hacia adelante: lo agarra de los tobillos.
      if (cargaAAlguien) {
        munecoBrazoIzq.rotation.set(BRAZOS_AGARRAN_ADELANTE, 0, BRAZOS_AGARRAN_ADENTRO);
        munecoBrazoDer.rotation.set(BRAZOS_AGARRAN_ADELANTE, 0, -BRAZOS_AGARRAN_ADENTRO);
      } else {
        munecoBrazoIzq.rotation.set(0, 0, anguloBrazos);
        munecoBrazoDer.rotation.x = 0; // el giro en Z del brazo derecho se pone más abajo
      }

      // Celular: con un tema tranquilo, algunos lo levantan con la mano derecha y lo
      // mueven despacio de lado a lado. Igual que los brazos, sube y baja de a poco.
      // (Antes de que arranque la música nadie lo levanta.)
      // Los que tienen bandera o cargan a alguien no: tienen las manos ocupadas.
      const manosOcupadas = persona.bandera !== null || cargaAAlguien;
      const proporcionCelular = mezclar(PROPORCION_CELULAR_TRANQUI, PROPORCION_CELULAR_EUFORIA, euforiaPersona);
      const objetivoCelular =
        !manosOcupadas && musica.estaSonando() && persona.ganasCelular < proporcionCelular ? 1 : 0;
      const pasoCelular = VELOCIDAD_CELULAR * delta;
      if (persona.celular < objetivoCelular) {
        persona.celular = Math.min(objetivoCelular, persona.celular + pasoCelular);
      } else {
        persona.celular = Math.max(objetivoCelular, persona.celular - pasoCelular);
      }
      const vaiven =
        VAIVEN_CELULAR * Math.sin(reloj * Math.PI * 2 * VAIVENES_POR_SEGUNDO + persona.faseVaiven);
      if (cargaAAlguien) {
        // Nada: el brazo derecho ya quedó agarrando al de arriba (ver más arriba).
      } else if (persona.bandera !== null) {
        // El que tiene bandera la sostiene con el brazo derecho bien arriba.
        munecoBrazoDer.rotation.z = -ANGULO_BRAZO_BANDERA;
      } else {
        // El brazo derecho va del ángulo de siempre al de "celular arriba", según cuánto lo levantó.
        const anguloBrazoDer = mezclar(anguloBrazos, ANGULO_BRAZO_CELULAR + vaiven, persona.celular);
        munecoBrazoDer.rotation.z = -anguloBrazoDer;
      }
      // El celular aparece (crece) a medida que lo levanta: con escala 0 no se ve.
      munecoCelular.scale.setScalar(persona.celular);
      muneco.updateMatrixWorld(true);

      // Si carga a alguien, guardamos dónde quedaron sus hombros (los usa el de arriba).
      // setFromMatrixPosition saca la posición de la matriz que calculó Three.js.
      if (cargaAAlguien) {
        persona.hombros.setFromMatrixPosition(munecoHombros.matrixWorld);
      }

      // Si tiene bandera: el palo va en su mano, se agita de un lado al otro y la tela ondea.
      if (persona.bandera !== null) {
        persona.bandera.position.setFromMatrixPosition(munecoManoDer.matrixWorld);
        const agitePalo = Math.sin(reloj * Math.PI * 2 * AGITES_PALO_POR_SEGUNDO + persona.faseBalanceo);
        persona.bandera.rotation.set(0, persona.giro, agitePalo * AGITE_PALO);
        ondearTela(persona.bandera, reloj);
      }

      // ...y copiamos la matriz de cada pieza a su InstancedMesh.
      // El que va en hombros usa solo el torso y sus piernas sentadas; los demás, el cuerpo
      // entero, y sus piernas sentadas quedan ocultas.
      if (enHombros) {
        cuerpos.setMatrixAt(i, munecoTorso.matrixWorld);
        piernasIzq.setMatrixAt(i, munecoPiernaIzq.matrixWorld);
        piernasDer.setMatrixAt(i, munecoPiernaDer.matrixWorld);
      } else {
        cuerpos.setMatrixAt(i, muneco.matrixWorld);
        piernasIzq.setMatrixAt(i, MATRIZ_OCULTA);
        piernasDer.setMatrixAt(i, MATRIZ_OCULTA);
      }
      cabezas.setMatrixAt(i, munecoCabeza.matrixWorld);
      brazosIzq.setMatrixAt(i, munecoBrazoIzq.matrixWorld);
      brazosDer.setMatrixAt(i, munecoBrazoDer.matrixWorld);
      celulares.setMatrixAt(i, munecoCelular.matrixWorld);
      brillos.setMatrixAt(i, munecoCelular.matrixWorld); // el brillo va donde está el celular
      // El estampado de la remera se mide desde los pies, como el cuerpo entero.
      if (persona.remera !== null) {
        remeras.mover(persona.remera, muneco.matrixWorld);
      }
    }

    // Avisamos que las matrices cambiaron, para que se manden a la placa de video.
    for (const pieza of [cuerpos, cabezas, brazosIzq, brazosDer, celulares, brillos, piernasIzq, piernasDer]) {
      pieza.instanceMatrix.needsUpdate = true;
    }
    remeras.avisarCambios();
  }

  /**
   * Cambia las banderas que ondea el público. La llama el escenario cuando sube una
   * banda nueva (ver escenario.js): para las uruguayas, por ejemplo, salen banderas de Uruguay.
   * @param {string[]} [nombres]  Diseños de DISENOS_BANDERA. Sin lista, las de siempre.
   */
  function cambiarBanderas(nombres = BANDERAS_COMUNES) {
    for (const persona of personas) {
      if (persona.bandera !== null) {
        persona.bandera.userData.tela.material = materialBanderaAlAzar(nombres);
      }
    }
  }

  // Lo llamamos una vez para que la gente aparezca en su lugar antes del primer cuadro.
  actualizar(0);

  return { grupo, actualizar, contagiar, contarPersonasCerca, cambiarBanderas };
}
