// La carpa: un escenario chico e íntimo adentro de una carpa de lona a rayas, como "La
// Casita del Blues" del Cosquín Rock. Tocan artistas más de nicho, con menos gente pero
// más apretada. Adentro hay guirnaldas de lamparitas, una bola de espejos, una alfombra
// sobre la tarima y fardos de paja para sentarse.
//
// crearCarpa(config) devuelve un grupo con el mismo userData que un escenario (ver
// escenario.js): así main.js, la grilla, el aguante, la chica y todo lo demás la tratan
// igual que a los escenarios grandes. Además deja userData.estaAdentro(posicion), para
// saber si el jugador entró (adentro la música de afuera se escucha amortiguada, y al revés).
import * as THREE from 'three';
import { crearMusica } from './musica.js';
import { crearPublico } from './publico.js';
import { crearBanda } from './artistas.js';
import { crearAplausos } from './aplausos.js';
import { crearProgramacion, crearMaterialTrapo, DISENOS_TRAPO } from './escenario.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// El nombre todavía no está decidido: se cambia acá y listo (sale en los carteles y en la grilla).
export const NOMBRE_CARPA = 'La Carpita';

// --- Medidas, en metros (el frente, con la entrada, mira hacia +Z) ---
const ANCHO = 20; // de pared a pared (de −10 a 10 en X)
const LARGO = 26; // del fondo a la entrada (de −13 a 13 en Z)
const ALTO_PAREDES = 4;
const ALTO_CUMBRERA = 8; // la punta del techo, en el medio
const ANCHO_ENTRADA = 5;
const ALTO_ENTRADA = 3.2;
const GROSOR_PARED = 0.4; // solo para las colisiones: las lonas son planas

// --- Tarima (al fondo) ---
const ANCHO_TARIMA = 9;
const PROFUNDIDAD_TARIMA = 4.5;
const ALTO_TARIMA = 0.8;
const Z_FONDO_TARIMA = -LARGO / 2 + 0.4; // casi contra la pared del fondo
const Z_FRENTE_TARIMA = Z_FONDO_TARIMA + PROFUNDIDAD_TARIMA;
const Z_BANDA = Z_FONDO_TARIMA + 0.6; // dónde va el "cero" de la banda (el cantante queda más adelante)

// --- Público: menos gente que en los escenarios grandes, pero más apretada ---
const FORMA_PUBLICO = {
  cantidad: 90,
  distanciaValla: 1.2, // no hay valla: la primera fila está casi pegada a la tarima
  profundidad: 14,
  anchoAdelante: 12,
  anchoAtras: 17,
  separacion: 0.42, // más juntos que afuera (0.5)
  enHombros: 2,
  banderas: 0,
  rondas: [{ x: 0, z: 6, radio: 2.5 }], // una sola ronda de pogo, chiquita
};

// --- Sonido: la música llena la carpa y afuera se apaga rápido ---
const DISTANCIAS_SONIDO = { completo: 14, silencio: 45 };

// --- Colores ---
const COLOR_CARPA = 0xd9a441; // dorado: el color de la carpa en la grilla
const RAYA_ROJA = '#a3202a';
const RAYA_CREMA = '#efe3c4';
const COLOR_LAMPARITA = new THREE.Color(1, 0.72, 0.38); // amarilla cálida

// --- Luces ---
const CANTIDAD_GUIRNALDAS = 5; // cruzan la carpa de pared a pared
const SEPARACION_LAMPARITAS = 0.8;
const CAIDA_GUIRNALDA = 0.8; // cuánto cuelgan en el medio
const BRILLO_LAMPARITAS = 1.1; // más de 1: el bloom (ver main.js) les hace un halo
const BRILLO_LAMPARITAS_GOLPE = 0.9; // lo que suma cada golpe grave
const INTENSIDAD_LUZ_CALIDA = 25; // la luz amarilla que ilumina toda la carpa
const INTENSIDAD_SPOT = 190; // los dos focos que apuntan a la banda
const INTENSIDAD_SPOT_GOLPE = 280;
const GIRO_BOLA_TRANQUI = 0.25; // radianes por segundo que gira la bola de espejos...
const GIRO_BOLA_CONOCIDO = 0.9; // ...y con los temas conocidos, más rápido
const CANTIDAD_DESTELLOS = 70; // los reflejos de la bola que dan vueltas por la carpa
const SENSIBILIDAD_PULSO = 12; // como en luces.js
const CAIDA_PULSO = 5;

/**
 * Crea la carpa con su escenario chico, su público, su música y su programación.
 *
 * @param {object} config
 * @param {{x: number, z: number}} config.posicion  Dónde va en el predio (el centro de la carpa)
 * @param {{x: number, z: number}} config.mirarHacia  Hacia dónde mira la entrada
 * @param {THREE.AudioListener} config.oyente
 * @param {Array<object>} config.lineup  Igual que en crearEscenario (ver escenario.js)
 * @returns {THREE.Group}
 */
export function crearCarpa(config) {
  const carpa = new THREE.Group();
  carpa.userData.nombreEscenario = NOMBRE_CARPA;
  carpa.userData.color = COLOR_CARPA;
  carpa.userData.colisiones = [];

  crearLonas(carpa);
  crearPisoYTarima(carpa);
  crearDecoracion(carpa);
  crearFardos(carpa);
  const escribirCartel = crearCarteles(carpa);
  const lucesDeLaCarpa = crearLucesDeLaCarpa(carpa);

  // Música: sale de los amplificadores, en el frente de la tarima.
  const musica = crearMusica(config.oyente, DISTANCIAS_SONIDO);
  musica.sonido.position.set(0, 2, Z_FRENTE_TARIMA);
  carpa.add(musica.sonido);
  carpa.userData.musica = musica;

  // Aplausos: en el medio del público.
  const aplausos = crearAplausos(config.oyente);
  aplausos.sonido.position.set(0, 2, 2);
  carpa.add(aplausos.sonido);
  carpa.userData.aplausos = aplausos;
  musica.alTerminarTema((tema) => {
    aplausos.aplaudir(tema.conocido ? 1 : 0.5);
  });

  // Público: desde el frente de la tarima hacia la entrada.
  const publico = crearPublico(musica, aplausos, FORMA_PUBLICO);
  publico.grupo.position.z = Z_FRENTE_TARIMA;
  carpa.add(publico.grupo);
  carpa.userData.publico = publico;

  // Una banda (con sus trapos) por cada show, como en escenario.js.
  const shows = config.lineup.map((datos) => {
    const banda = crearBanda(datos.banda, musica);
    banda.grupo.position.set(0, ALTO_TARIMA, Z_BANDA);
    banda.grupo.visible = false;
    carpa.add(banda.grupo);

    const trapos = crearTrapos(datos.trapos);
    trapos.visible = false;
    carpa.add(trapos);
    return { datos, banda, trapos };
  });
  carpa.userData.banda = shows[0].banda;

  // La programación es la misma de los escenarios grandes.
  carpa.userData.programacion = crearProgramacion({ escenario: carpa, shows, musica, publico, escribirCartel });

  // Las luces de la carpa (guirnaldas, focos y bola de espejos) se mueven con la música.
  carpa.userData.luces = crearShowDeLaCarpa(lucesDeLaCarpa, musica);

  // La carpa no tiene pantalla ni fuegos artificiales, pero main.js les habla a todos los
  // escenarios igual. Les dejamos objetos que "no hacen nada" con las mismas funciones.
  carpa.userData.pantalla = { ponerColor() {}, filmar() {} };
  carpa.userData.fuegos = { actualizar() {}, lanzar() {} };

  // Ubicamos y giramos la carpa como un escenario (ver crearEscenario).
  carpa.position.set(config.posicion.x, 0, config.posicion.z);
  const angulo = Math.atan2(config.mirarHacia.x - config.posicion.x, config.mirarHacia.z - config.posicion.z);
  carpa.rotation.y = angulo;
  for (const caja of carpa.userData.colisiones) {
    caja.centroX = config.posicion.x;
    caja.centroZ = config.posicion.z;
    caja.angulo = angulo;
  }

  // ¿Esa posición del predio está adentro de la carpa? Hacemos la misma cuenta que las
  // colisiones (ver jugador.js): la pasamos a coordenadas de la carpa, "derecha" y con
  // el centro en (0, 0), y miramos si cae entre las paredes.
  const coseno = Math.cos(angulo);
  const seno = Math.sin(angulo);
  carpa.userData.estaAdentro = (posicion) => {
    const dx = posicion.x - config.posicion.x;
    const dz = posicion.z - config.posicion.z;
    const localX = dx * coseno - dz * seno;
    const localZ = dx * seno + dz * coseno;
    return Math.abs(localX) < ANCHO / 2 && Math.abs(localZ) < LARGO / 2;
  };

  return carpa;
}

// Guarda una caja de colisión (como agregarColision en escenario.js).
function agregarColision(carpa, x, z, ancho, profundidad) {
  carpa.userData.colisiones.push({
    minX: x - ancho / 2,
    maxX: x + ancho / 2,
    minZ: z - profundidad / 2,
    maxZ: z + profundidad / 2,
  });
}

// ---------------------------------------------------------------------------
// Las lonas: paredes, techo a dos aguas y la entrada
// ---------------------------------------------------------------------------

// Una textura de rayas rojas y crema. "verticales" dice para qué lado van las rayas
// en la imagen, y "repetir" cuántas veces se repite el dibujo (RepeatWrapping).
function crearTexturaRayas(verticales, repetirX, repetirY) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = RAYA_CREMA;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = RAYA_ROJA;
  if (verticales) {
    ctx.fillRect(0, 0, 32, 64); // mitad izquierda roja
  } else {
    ctx.fillRect(0, 0, 64, 32); // mitad de arriba roja
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(repetirX, repetirY);
  return textura;
}

// Material de lona. DoubleSide: se ve de los dos lados (de afuera y de adentro).
// Con un poquito de "emissive" parece iluminada desde adentro (se nota de noche).
function materialLona(textura) {
  return new THREE.MeshStandardMaterial({
    map: textura,
    side: THREE.DoubleSide,
    roughness: 0.95,
    emissive: 0xffffff,
    emissiveMap: textura,
    emissiveIntensity: 0.08,
  });
}

function crearLonas(carpa) {
  // Cada raya mide 1 m de ancho: en 1 m entran media "repetición" del dibujo (que tiene dos rayas).
  const rayasParedLarga = materialLona(crearTexturaRayas(true, LARGO / 2, 1));
  const rayasParedCorta = materialLona(crearTexturaRayas(true, ANCHO / 2, 1));

  // --- Paredes de los costados (x = ±10) ---
  for (const lado of [-1, 1]) {
    const pared = new THREE.Mesh(new THREE.PlaneGeometry(LARGO, ALTO_PAREDES), rayasParedLarga);
    pared.rotation.y = Math.PI / 2; // de canto, a lo largo de Z
    pared.position.set(lado * ANCHO / 2, ALTO_PAREDES / 2, 0);
    carpa.add(pared);
    agregarColision(carpa, lado * ANCHO / 2, 0, GROSOR_PARED, LARGO);
  }

  // --- Pared del fondo ---
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO_PAREDES), rayasParedCorta);
  fondo.position.set(0, ALTO_PAREDES / 2, -LARGO / 2);
  carpa.add(fondo);
  agregarColision(carpa, 0, -LARGO / 2, ANCHO, GROSOR_PARED);

  // --- Pared del frente, con el hueco de la entrada en el medio ---
  const anchoCostado = (ANCHO - ANCHO_ENTRADA) / 2;
  const rayasCostado = materialLona(crearTexturaRayas(true, anchoCostado / 2, 1));
  for (const lado of [-1, 1]) {
    const x = lado * (ANCHO_ENTRADA / 2 + anchoCostado / 2);
    const costado = new THREE.Mesh(new THREE.PlaneGeometry(anchoCostado, ALTO_PAREDES), rayasCostado);
    costado.position.set(x, ALTO_PAREDES / 2, LARGO / 2);
    carpa.add(costado);
    agregarColision(carpa, x, LARGO / 2, anchoCostado, GROSOR_PARED);
  }
  // Arriba de la entrada, la lona sigue (la puerta no llega hasta el techo).
  const altoDintel = ALTO_PAREDES - ALTO_ENTRADA;
  const rayasDintel = materialLona(crearTexturaRayas(true, ANCHO_ENTRADA / 2, 1));
  const dintel = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_ENTRADA, altoDintel), rayasDintel);
  dintel.position.set(0, ALTO_ENTRADA + altoDintel / 2, LARGO / 2);
  carpa.add(dintel);

  // --- Los triángulos de adelante y de atrás, entre las paredes y la punta del techo ---
  // Shape: dibujamos el triángulo con sus 3 puntas y ShapeGeometry lo rellena.
  const triangulo = new THREE.Shape();
  triangulo.moveTo(-ANCHO / 2, 0);
  triangulo.lineTo(ANCHO / 2, 0);
  triangulo.lineTo(0, ALTO_CUMBRERA - ALTO_PAREDES);
  triangulo.closePath();
  const geometriaTriangulo = new THREE.ShapeGeometry(triangulo);
  // ShapeGeometry usa las coordenadas en metros como coordenadas de la textura:
  // con repetir = 0.5, cada raya mide 1 m (como en las paredes).
  const rayasTriangulo = materialLona(crearTexturaRayas(true, 0.5, 0.25));
  for (const z of [-LARGO / 2, LARGO / 2]) {
    const punta = new THREE.Mesh(geometriaTriangulo, rayasTriangulo);
    punta.position.set(0, ALTO_PAREDES, z);
    carpa.add(punta);
  }

  // --- Techo a dos aguas: dos lonas inclinadas que se juntan en la cumbrera ---
  const subida = ALTO_CUMBRERA - ALTO_PAREDES; // 4 m
  const inclinacion = Math.atan2(subida, ANCHO / 2); // el ángulo del techo
  const largoFaldon = Math.hypot(subida, ANCHO / 2) + 0.4; // un poco más: sobresale de las paredes
  // En el techo cada raya va de la pared a la punta, y se van alternando a lo largo de Z.
  // En la cara de arriba de una caja, el "alto" de la imagen queda a lo largo de Z: por eso
  // acá usamos rayas horizontales en la imagen. Una raya por metro, como en las paredes.
  const rayasTecho = materialLona(crearTexturaRayas(false, 1, (LARGO + 0.6) / 2));
  for (const lado of [-1, 1]) {
    const faldon = new THREE.Mesh(new THREE.BoxGeometry(largoFaldon, 0.06, LARGO + 0.6), rayasTecho);
    // El centro del faldón, a mitad de camino entre la pared y la cumbrera
    faldon.position.set(lado * ANCHO / 4, ALTO_PAREDES + subida / 2, 0);
    faldon.rotation.z = -lado * inclinacion; // del lado izquierdo sube hacia el medio, y al revés
    carpa.add(faldon);
  }

  // --- Palos de madera: en las esquinas, a lo largo de las paredes y la cumbrera ---
  const madera = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.8 });
  const geometriaPalo = new THREE.CylinderGeometry(0.09, 0.11, ALTO_PAREDES, 8);
  for (const x of [-ANCHO / 2, ANCHO / 2]) {
    for (let z = -LARGO / 2; z <= LARGO / 2 + 0.01; z += LARGO / 4) {
      const palo = new THREE.Mesh(geometriaPalo, madera);
      palo.position.set(x, ALTO_PAREDES / 2, z);
      carpa.add(palo);
    }
  }
  // Los dos palos de la entrada
  for (const lado of [-1, 1]) {
    const palo = new THREE.Mesh(geometriaPalo, madera);
    palo.position.set(lado * ANCHO_ENTRADA / 2, ALTO_PAREDES / 2, LARGO / 2);
    carpa.add(palo);
  }
  const cumbrera = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, LARGO + 0.6), madera);
  cumbrera.position.set(0, ALTO_CUMBRERA, 0);
  carpa.add(cumbrera);

  // Un banderín arriba de cada punta del techo
  const geometriaMastil = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
  const geometriaBanderin = new THREE.ConeGeometry(0.3, 0.9, 3);
  const rojo = new THREE.MeshStandardMaterial({ color: 0xc0182a, side: THREE.DoubleSide });
  for (const z of [-LARGO / 2, LARGO / 2]) {
    const mastil = new THREE.Mesh(geometriaMastil, madera);
    mastil.position.set(0, ALTO_CUMBRERA + 0.8, z);
    carpa.add(mastil);
    const banderin = new THREE.Mesh(geometriaBanderin, rojo);
    banderin.rotation.z = -Math.PI / 2; // acostado: la punta hacia un costado
    banderin.scale.set(1, 1, 0.15); // finito, como una tela
    banderin.position.set(0.45, ALTO_CUMBRERA + 1.35, z);
    carpa.add(banderin);
  }
}

// ---------------------------------------------------------------------------
// Piso, tarima y lo que hay arriba de la tarima
// ---------------------------------------------------------------------------

function crearPisoYTarima(carpa) {
  // Piso de tablones: lo dibujamos en un canvas (tablas de distintos marrones).
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const marrones = ['#6e4a2c', '#5f3f25', '#7a5332', '#664429'];
  const altoTabla = 256 / 8;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = marrones[i % marrones.length];
    ctx.fillRect(0, i * altoTabla, 256, altoTabla);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // la junta entre tabla y tabla
    ctx.fillRect(0, i * altoTabla, 256, 2);
    ctx.fillRect(((i * 97) % 256), i * altoTabla, 2, altoTabla); // un corte en cada tabla
  }
  const texturaPiso = new THREE.CanvasTexture(canvas);
  texturaPiso.colorSpace = THREE.SRGBColorSpace;
  texturaPiso.wrapS = THREE.RepeatWrapping;
  texturaPiso.wrapT = THREE.RepeatWrapping;
  texturaPiso.repeat.set(ANCHO / 4, LARGO / 4); // cada dibujo cubre 4 x 4 m
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(ANCHO, LARGO),
    new THREE.MeshStandardMaterial({ map: texturaPiso, roughness: 0.85 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = 0.02; // apenas arriba del pasto, para que no "titile" con el piso del predio
  carpa.add(piso);

  // Tarima: una caja de madera oscura.
  const zTarima = (Z_FONDO_TARIMA + Z_FRENTE_TARIMA) / 2;
  const tarima = new THREE.Mesh(
    new THREE.BoxGeometry(ANCHO_TARIMA, ALTO_TARIMA, PROFUNDIDAD_TARIMA),
    new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.7 })
  );
  tarima.position.set(0, ALTO_TARIMA / 2, zTarima);
  carpa.add(tarima);
  agregarColision(carpa, 0, zTarima, ANCHO_TARIMA, PROFUNDIDAD_TARIMA);

  // Alfombra "persa" arriba de la tarima: rectángulos uno adentro del otro y un rombo.
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 160;
  const c = lienzo.getContext('2d');
  const capas = ['#5c1218', '#c9a24a', '#7a1a22', '#1d2f55', '#8a2028'];
  capas.forEach((color, i) => {
    c.fillStyle = color;
    const margen = i * 14;
    c.fillRect(margen, margen, 256 - margen * 2, 160 - margen * 2);
  });
  c.fillStyle = '#c9a24a';
  c.beginPath();
  c.moveTo(128, 50);
  c.lineTo(170, 80);
  c.lineTo(128, 110);
  c.lineTo(86, 80);
  c.closePath();
  c.fill();
  const texturaAlfombra = new THREE.CanvasTexture(lienzo);
  texturaAlfombra.colorSpace = THREE.SRGBColorSpace;
  const alfombra = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 3.1),
    new THREE.MeshStandardMaterial({ map: texturaAlfombra, roughness: 1 })
  );
  alfombra.rotation.x = -Math.PI / 2;
  alfombra.position.set(0, ALTO_TARIMA + 0.01, zTarima + 0.3);
  carpa.add(alfombra);

  // Telón de terciopelo bordó detrás de la banda, con pliegues (un degradé que se repite).
  const lienzoTelon = document.createElement('canvas');
  lienzoTelon.width = 64;
  lienzoTelon.height = 8;
  const t = lienzoTelon.getContext('2d');
  const pliegue = t.createLinearGradient(0, 0, 64, 0);
  pliegue.addColorStop(0, '#2a0508');
  pliegue.addColorStop(0.5, '#6a0f18');
  pliegue.addColorStop(1, '#2a0508');
  t.fillStyle = pliegue;
  t.fillRect(0, 0, 64, 8);
  const texturaTelon = new THREE.CanvasTexture(lienzoTelon);
  texturaTelon.colorSpace = THREE.SRGBColorSpace;
  texturaTelon.wrapS = THREE.RepeatWrapping;
  texturaTelon.repeat.set(14, 1); // 14 pliegues
  const telon = new THREE.Mesh(
    new THREE.PlaneGeometry(ANCHO_TARIMA + 1, ALTO_PAREDES - 0.1),
    new THREE.MeshStandardMaterial({ map: texturaTelon, roughness: 0.9 })
  );
  telon.position.set(0, (ALTO_PAREDES - 0.1) / 2, -LARGO / 2 + 0.08);
  carpa.add(telon);
}

// Amplificadores, un velador de living sobre la tarima y unas plantas: onda "sala de estar".
function crearDecoracion(carpa) {
  const negro = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
  const rejilla = new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 1 });
  const dorado = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.5, roughness: 0.4 });

  // Dos amplificadores viejos a los costados de la tarima
  for (const lado of [-1, 1]) {
    const ampli = new THREE.Group();
    const caja = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.55), negro);
    caja.position.y = 0.6;
    ampli.add(caja);
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.8), rejilla); // la tela del parlante
    frente.position.set(0, 0.5, 0.28);
    ampli.add(frente);
    const perillas = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.02), dorado);
    perillas.position.set(0, 1.05, 0.28);
    ampli.add(perillas);
    ampli.position.set(lado * 3.7, ALTO_TARIMA, Z_FONDO_TARIMA + 0.8);
    ampli.rotation.y = -lado * 0.25; // un poco girados hacia el medio
    carpa.add(ampli);
  }

  // Velador de pie: un palo y una pantalla de tela que brilla cálida
  const velador = new THREE.Group();
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), dorado);
  pie.position.y = 0.75;
  velador.add(pie);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 12), dorado);
  velador.add(base);
  const pantallaVelador = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 0.35, 12, 1, true), // abierta arriba y abajo
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.85, 0.45), side: THREE.DoubleSide })
  );
  pantallaVelador.position.y = 1.55;
  velador.add(pantallaVelador);
  velador.position.set(-3.9, ALTO_TARIMA, Z_FRENTE_TARIMA - 0.7);
  carpa.add(velador);

  // Dos plantas en macetas, en las esquinas de adelante de la tarima
  const maceta = new THREE.MeshStandardMaterial({ color: 0x8a4a2a, roughness: 0.9 });
  const hojas = new THREE.MeshStandardMaterial({ color: 0x2f6b2a, roughness: 0.9, flatShading: true });
  for (const lado of [-1, 1]) {
    const planta = new THREE.Group();
    const tacho = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.45, 8), maceta);
    tacho.position.y = 0.22;
    planta.add(tacho);
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), hojas);
    copa.position.y = 0.8;
    copa.scale.set(1, 1.3, 1);
    planta.add(copa);
    planta.position.set(lado * (ANCHO_TARIMA / 2 + 0.6), 0, Z_FRENTE_TARIMA - 0.4);
    carpa.add(planta);
    agregarColision(carpa, lado * (ANCHO_TARIMA / 2 + 0.6), Z_FRENTE_TARIMA - 0.4, 0.6, 0.6);
  }
}

// Fardos de paja cerca de la entrada, a los costados: para sentarse a descansar.
function crearFardos(carpa) {
  // Paja: amarillo con rayitas más oscuras
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#a8822f' : '#e0c06a';
    ctx.fillRect(Math.random() * 64, Math.random() * 64, 6 + Math.random() * 10, 1);
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  const paja = new THREE.MeshStandardMaterial({ map: textura, roughness: 1 });
  const geometria = new THREE.BoxGeometry(1.2, 0.5, 0.6);

  // [x, z, cuántos apilados, giro]
  const fardos = [
    [-8.6, 8.5, 1, Math.PI / 2],
    [-8.6, 10, 2, Math.PI / 2],
    [8.6, 8.5, 2, Math.PI / 2],
    [8.6, 10, 1, Math.PI / 2],
    [-6.2, 11.6, 1, 0.1],
    [6.2, 11.6, 1, -0.1],
  ];
  for (const [x, z, pisos, giro] of fardos) {
    for (let i = 0; i < pisos; i++) {
      const fardo = new THREE.Mesh(geometria, paja);
      fardo.position.set(x, 0.25 + i * 0.5, z);
      fardo.rotation.y = giro + i * 0.2; // el de arriba, un poco torcido
      carpa.add(fardo);
    }
    agregarColision(carpa, x, z, 0.8, 0.8);
  }
}

// Los trapos de los fans, colgados en las paredes de los costados (adentro).
// Devuelve un grupo con todos: la programación los muestra o los esconde juntos.
function crearTrapos(trapos) {
  const grupo = new THREE.Group();
  const geometria = new THREE.PlaneGeometry(2.8, 1);
  trapos.forEach((texto, i) => {
    const material = crearMaterialTrapo(texto, DISENOS_TRAPO[i % DISENOS_TRAPO.length]);
    const trapo = new THREE.Mesh(geometria, material);
    // Uno en cada pared, alternando: izquierda, derecha, izquierda...
    const lado = i % 2 === 0 ? -1 : 1;
    trapo.position.set(lado * (ANCHO / 2 - 0.05), 2.6, -4 + Math.floor(i / 2) * 5);
    trapo.rotation.y = -lado * Math.PI / 2; // mirando hacia adentro de la carpa
    grupo.add(trapo);
  });
  return grupo;
}

// ---------------------------------------------------------------------------
// Carteles: uno adentro (arriba del telón) y otro afuera (arriba de la entrada)
// ---------------------------------------------------------------------------

function crearCarteles(carpa) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  // Un poco gris (0xcccccc): si no, el texto blanco brilla tanto que el bloom lo borronea.
  const material = new THREE.MeshBasicMaterial({ map: textura, color: 0xcccccc });
  const geometria = new THREE.PlaneGeometry(6.4, 2.4); // misma proporción que el canvas

  // Adentro: en el triángulo del fondo, mirando al público.
  const adentro = new THREE.Mesh(geometria, material);
  adentro.position.set(0, ALTO_PAREDES + 1.3, -LARGO / 2 + 0.06);
  carpa.add(adentro);
  // Afuera: en el triángulo del frente, mirando hacia afuera (+Z).
  const afuera = new THREE.Mesh(geometria, material);
  afuera.position.set(0, ALTO_PAREDES + 1.3, LARGO / 2 + 0.06);
  carpa.add(afuera);

  // Lamparitas alrededor del cartel de afuera, como en una marquesina de teatro.
  // Las prende y apaga crearShowDeLaCarpa (de a una, como si corrieran).
  const lamparitas = [];
  for (let x = -3.2; x <= 3.21; x += 0.4) {
    lamparitas.push([x, 1.2], [x, -1.2]);
  }
  for (let y = -0.8; y <= 0.81; y += 0.4) {
    lamparitas.push([-3.2, y], [3.2, y]);
  }
  const marquesina = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    lamparitas.length
  );
  const ubicacion = new THREE.Object3D();
  lamparitas.forEach(([x, y], i) => {
    ubicacion.position.set(x, ALTO_PAREDES + 1.3 + y, LARGO / 2 + 0.12);
    ubicacion.updateMatrix();
    marquesina.setMatrixAt(i, ubicacion.matrix);
    marquesina.setColorAt(i, COLOR_LAMPARITA);
  });
  carpa.add(marquesina);
  carpa.userData.marquesina = marquesina; // la usa crearLucesDeLaCarpa

  /**
   * Dibuja los carteles: arriba el nombre de la carpa, en el medio la banda y abajo
   * "EN VIVO" o el subtítulo (por ejemplo "A CONTINUACIÓN · 19:55").
   * Es la misma idea que el cartel de escenario.js (la llama crearProgramacion).
   */
  function escribir(nombre, subtitulo) {
    // Fondo de madera oscura con un marco dorado
    ctx.fillStyle = '#1e120a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const anchoMaximo = canvas.width - 90;
    ctx.fillStyle = '#e8c46a';
    ctx.font = 'italic bold 64px Georgia';
    ctx.fillText('✦ ' + NOMBRE_CARPA + ' ✦', canvas.width / 2, 78, anchoMaximo);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px Arial';
    ctx.fillText(nombre, canvas.width / 2, 196, anchoMaximo);

    if (subtitulo) {
      ctx.fillStyle = '#e8c46a';
      ctx.font = 'bold 44px Arial';
      ctx.fillText(subtitulo, canvas.width / 2, 300, anchoMaximo);
    } else {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 44px Arial';
      ctx.fillText('● EN VIVO', canvas.width / 2, 300, anchoMaximo);
    }
    textura.needsUpdate = true;
  }
  return escribir;
}

// ---------------------------------------------------------------------------
// Luces de la carpa
// ---------------------------------------------------------------------------

// Arma las luces (todavía quietas). Las mueve crearShowDeLaCarpa.
function crearLucesDeLaCarpa(carpa) {
  // --- Guirnaldas de lamparitas: cruzan la carpa de pared a pared, colgando en el medio ---
  const puntos = []; // dónde va cada lamparita
  const cables = new THREE.Group();
  const materialCable = new THREE.LineBasicMaterial({ color: 0x222222 });
  for (let i = 0; i < CANTIDAD_GUIRNALDAS; i++) {
    const z = -LARGO / 2 + 3 + i * ((LARGO - 6) / (CANTIDAD_GUIRNALDAS - 1));
    const puntosCable = [];
    for (let x = -ANCHO / 2; x <= ANCHO / 2 + 0.01; x += SEPARACION_LAMPARITAS) {
      // Una parábola: arriba en las paredes y más abajo en el medio.
      const t = x / (ANCHO / 2); // de −1 a 1
      const y = ALTO_PAREDES - 0.1 - CAIDA_GUIRNALDA * (1 - t * t);
      puntosCable.push(new THREE.Vector3(x, y, z));
      puntos.push(new THREE.Vector3(x, y - 0.08, z)); // la lamparita cuelga un poquito del cable
    }
    cables.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntosCable), materialCable));
  }
  carpa.add(cables);

  // Todas las lamparitas en un solo InstancedMesh (una sola "pieza" para el navegador).
  // MeshBasicMaterial: brillan solas, no necesitan luz.
  const materialLamparitas = new THREE.MeshBasicMaterial({ color: COLOR_LAMPARITA.clone() });
  const lamparitas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), materialLamparitas, puntos.length);
  const ubicacion = new THREE.Object3D();
  puntos.forEach((punto, i) => {
    ubicacion.position.copy(punto);
    ubicacion.updateMatrix();
    lamparitas.setMatrixAt(i, ubicacion.matrix);
  });
  carpa.add(lamparitas);

  // --- Una luz cálida que ilumina toda la carpa (como la que darían las lamparitas) ---
  // PointLight(color, intensidad, distancia máxima, cómo se apaga con la distancia)
  const luzCalida = new THREE.PointLight(0xffb066, INTENSIDAD_LUZ_CALIDA, 30, 2);
  // No muy cerca del techo: si no, le hace una mancha blanca encima.
  luzCalida.position.set(0, 4.6, 0);
  carpa.add(luzCalida);

  // --- Dos focos colgados del techo que apuntan a la banda (uno ámbar y uno violeta) ---
  const spots = [];
  for (const [color, x] of [[0xffc070, -5], [0xd080ff, 5]]) {
    const luz = new THREE.SpotLight(color, INTENSIDAD_SPOT, 25, Math.PI / 7, 0.6);
    luz.position.set(x, ALTO_PAREDES + 1, -2);
    luz.target.position.set(0, ALTO_TARIMA + 0.6, Z_BANDA + 2.5); // al cuerpo, no a la cara (si no, la quema)
    carpa.add(luz);
    carpa.add(luz.target);
    spots.push(luz);
  }

  // --- Bola de espejos colgada en el medio ---
  // flatShading: cada carita del icosaedro brilla por separado, como los espejitos.
  const bola = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 2),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.15, flatShading: true, emissive: 0x333333 })
  );
  const ALTO_BOLA = ALTO_CUMBRERA - 2.2;
  bola.position.set(0, ALTO_BOLA, -1);
  carpa.add(bola);
  const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, ALTO_CUMBRERA - ALTO_BOLA), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  hilo.position.set(0, (ALTO_CUMBRERA + ALTO_BOLA) / 2, -1);
  carpa.add(hilo);

  // Destellos: puntitos de luz que salen de la bola hacia las paredes y el piso.
  // Están en un grupo pegado a la bola: cuando ella gira, ellos dan vueltas por la carpa.
  const posiciones = [];
  for (let i = 0; i < CANTIDAD_DESTELLOS; i++) {
    // Una dirección al azar, casi siempre hacia abajo o de costado (no hacia el techo)
    const angulo = Math.random() * Math.PI * 2;
    const bajada = -0.1 - Math.random() * 0.6; // cuánto apunta hacia abajo
    const direccion = new THREE.Vector3(Math.cos(angulo), bajada, Math.sin(angulo)).normalize();
    // Que lleguen hasta cerca de las paredes (4 a 8.5 m de la bola)
    direccion.multiplyScalar(4 + Math.random() * 4.5);
    posiciones.push(direccion.x, direccion.y, direccion.z);
  }
  const geometriaDestellos = new THREE.BufferGeometry();
  geometriaDestellos.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  // Cada destello es un puntito redondo que se difumina en los bordes (un degradé en un
  // canvas). Sin esta textura, los Points se dibujan como cuadrados.
  const lienzo = document.createElement('canvas');
  lienzo.width = 32;
  lienzo.height = 32;
  const c = lienzo.getContext('2d');
  const brillo = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  brillo.addColorStop(0, 'rgba(255, 255, 255, 1)');
  brillo.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  brillo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  c.fillStyle = brillo;
  c.fillRect(0, 0, 32, 32);
  const materialDestellos = new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(lienzo),
    color: 0xfff4e0,
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending, // se suman a lo que hay atrás: parecen luz
    depthWrite: false,
  });
  const destellos = new THREE.Points(geometriaDestellos, materialDestellos);
  destellos.position.copy(bola.position);
  carpa.add(destellos);

  return { lamparitas, materialLamparitas, luzCalida, spots, bola, destellos, materialDestellos, marquesina: carpa.userData.marquesina };
}

/**
 * Mueve las luces de la carpa con la música (la misma idea que luces.js):
 *  - las lamparitas laten con cada golpe grave;
 *  - los focos flashean más fuerte con los temas conocidos;
 *  - la bola de espejos gira (más rápido con los temas conocidos);
 *  - la marquesina de afuera "corre" (se prenden de a una, como en los teatros).
 * @returns {{ actualizar: (delta: number) => void, apagar: () => void }}
 */
function crearShowDeLaCarpa(luces, musica) {
  let pulso = 0;
  let promedioGraves = 0;
  let reloj = 0;
  let apagada = false;
  const colorMarquesina = new THREE.Color();

  function actualizar(delta) {
    if (apagada) {
      return;
    }
    reloj += delta;

    // Pulso: salta con cada golpe grave y se apaga enseguida (como en luces.js).
    pulso = Math.max(0, pulso - CAIDA_PULSO * delta);
    if (musica.estaSonando()) {
      const graves = musica.graves();
      pulso = Math.max(pulso, Math.min(1, Math.max(0, graves - promedioGraves) * SENSIBILIDAD_PULSO));
      promedioGraves += (graves - promedioGraves) * Math.min(1, delta * 2);
    }
    const conocido = musica.hayShow() && musica.temaActual().conocido;

    // Lamparitas: el color se multiplica por el brillo (más de 1 = el bloom les hace halo).
    const brillo = BRILLO_LAMPARITAS + pulso * BRILLO_LAMPARITAS_GOLPE;
    luces.materialLamparitas.color.copy(COLOR_LAMPARITA).multiplyScalar(brillo);

    // Focos: más fuertes con los temas conocidos.
    for (const spot of luces.spots) {
      spot.intensity = INTENSIDAD_SPOT + pulso * INTENSIDAD_SPOT_GOLPE * (conocido ? 1 : 0.3);
    }

    // Bola de espejos y sus destellos (que giran con ella, un poquito más lento)
    const giro = (conocido ? GIRO_BOLA_CONOCIDO : GIRO_BOLA_TRANQUI) * delta;
    luces.bola.rotation.y += giro;
    luces.destellos.rotation.y += giro;
    // Los destellos titilan un poco (sin show casi no se ven)
    const hayShow = musica.hayShow() ? 1 : 0.15;
    luces.materialDestellos.opacity = hayShow * (0.55 + 0.3 * Math.sin(reloj * 7) + pulso * 0.3);

    // Marquesina: cada lamparita prende cuando le "pasa" una ola que da vueltas.
    const cantidad = luces.marquesina.count;
    for (let i = 0; i < cantidad; i++) {
      const prendida = Math.sin(reloj * 6 - i * 1.3) > 0;
      colorMarquesina.copy(COLOR_LAMPARITA).multiplyScalar(prendida ? 1.6 : 0.25);
      luces.marquesina.setColorAt(i, colorMarquesina);
    }
    luces.marquesina.instanceColor.needsUpdate = true; // avisamos que cambiaron los colores
  }

  // Terminó el festival (ver main.js): se apaga todo.
  function apagar() {
    apagada = true;
    luces.materialLamparitas.color.setScalar(0.05);
    luces.luzCalida.intensity = 0;
    for (const spot of luces.spots) {
      spot.intensity = 0;
    }
    luces.destellos.visible = false;
    for (let i = 0; i < luces.marquesina.count; i++) {
      luces.marquesina.setColorAt(i, colorMarquesina.setScalar(0.05));
    }
    luces.marquesina.instanceColor.needsUpdate = true;
  }

  return { actualizar, apagar };
}
