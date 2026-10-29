// Vallas que cierran el predio: un vallado de malla metálica, como el de los festivales.
// Forman un cuadrado alrededor del centro del predio, con la entrada en el frente.
// Que el jugador no las pueda pasar lo controla jugador.js (con limitePredio y
// entrada, ver main.js).
import * as THREE from 'three';

// --- Medidas, en metros ---
const ALTO_VALLA = 2.2;
const ANCHO_PANEL = 2.5; // distancia entre un poste y el siguiente
const GROSOR_POSTE = 0.08;
const GROSOR_CANO = 0.05; // los caños horizontales de arriba y de abajo

// Materiales compartidos por los cuatro lados.
const materialMetal = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.6, roughness: 0.4 });

// La malla es un plano con una textura de alambres: los dibujamos en un <canvas>
// (como el cartel del escenario) y el resto del canvas queda transparente.
function crearMaterialMalla() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#b0b0b0';
  ctx.lineWidth = 4;
  // Un cuadrito de alambre: con la textura repetida forma la malla entera.
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  // RepeatWrapping: la textura se repite como baldosas en vez de estirarse.
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: textura,
    // alphaTest: lo transparente del canvas (los agujeros de la malla) no se dibuja.
    alphaTest: 0.5,
    side: THREE.DoubleSide, // la malla se ve de los dos lados
    metalness: 0.5,
    roughness: 0.5,
  });
}

/**
 * Arma un lado del vallado, a lo largo del eje X y centrado en x = 0.
 * @param {number} largo  Largo del lado, en metros
 * @param {THREE.Material} materialMalla
 * @returns {THREE.Group}
 */
function crearLado(largo, materialMalla) {
  const lado = new THREE.Group();

  // Malla: un plano parado del largo del lado. La textura se repite unas 8 veces por metro
  // a lo largo y a lo alto (cuadritos de unos 12 cm, como un alambrado).
  const geometriaMalla = new THREE.PlaneGeometry(largo, ALTO_VALLA);
  const uv = geometriaMalla.attributes.uv; // coordenadas de textura: van de 0 a 1
  for (let i = 0; i < uv.count; i++) {
    // Multiplicarlas hace que la textura se repita esa cantidad de veces.
    uv.setXY(i, uv.getX(i) * largo * 8, uv.getY(i) * ALTO_VALLA * 8);
  }
  const malla = new THREE.Mesh(geometriaMalla, materialMalla);
  malla.position.y = ALTO_VALLA / 2;
  lado.add(malla);

  // Caños horizontales: uno arriba y uno abajo, de punta a punta.
  for (const altura of [ALTO_VALLA, 0.1]) {
    const cano = new THREE.Mesh(new THREE.BoxGeometry(largo, GROSOR_CANO, GROSOR_CANO), materialMetal);
    cano.position.y = altura;
    lado.add(cano);
  }

  // Postes: uno cada ANCHO_PANEL metros. Son muchos, así que usamos una InstancedMesh
  // (como el público): todos se dibujan en una sola llamada a la placa de video.
  const cantidadPostes = Math.round(largo / ANCHO_PANEL) + 1;
  const geometriaPoste = new THREE.BoxGeometry(GROSOR_POSTE, ALTO_VALLA, GROSOR_POSTE);
  geometriaPoste.translate(0, ALTO_VALLA / 2, 0); // con la base en el piso
  const postes = new THREE.InstancedMesh(geometriaPoste, materialMetal, cantidadPostes);
  const ubicacion = new THREE.Matrix4();
  for (let i = 0; i < cantidadPostes; i++) {
    const x = -largo / 2 + (i * largo) / (cantidadPostes - 1);
    ubicacion.makeTranslation(x, 0, 0);
    postes.setMatrixAt(i, ubicacion);
  }
  lado.add(postes);

  return lado;
}

/**
 * Crea el vallado completo: un cuadrado de lado 2 × limite, centrado en (0, 0).
 * En el medio del lado del frente (+Z) queda el hueco de la entrada, y del lado de
 * afuera, un pasillo vallado: ahí arranca el jugador (ver main.js).
 * @param {number} limite  Distancia del centro del predio a cada lado del vallado (metros)
 * @param {{ancho: number, largo: number}} entrada  Ancho del hueco (y del pasillo) y largo del pasillo
 * @returns {THREE.Group}
 */
export function crearVallas(limite, entrada) {
  const vallas = new THREE.Group();
  const materialMalla = crearMaterialMalla();
  const largo = limite * 2;

  // El frente va en dos tramos, uno a cada lado del hueco de la entrada.
  const largoTramo = (largo - entrada.ancho) / 2;
  const centroTramo = entrada.ancho / 2 + largoTramo / 2; // distancia de x = 0 al medio de cada tramo

  // Cada pedazo es el mismo lado, con su largo, movido y girado.
  // Los de adelante y atrás van a lo largo de X; los de los costados, girados 90°.
  const lados = [
    { largo: largo, x: 0, z: -limite, giro: 0 }, // fondo
    { largo: largoTramo, x: -centroTramo, z: limite, giro: 0 }, // frente, a la izquierda de la entrada
    { largo: largoTramo, x: centroTramo, z: limite, giro: 0 }, // frente, a la derecha de la entrada
    { largo: largo, x: -limite, z: 0, giro: Math.PI / 2 }, // izquierda
    { largo: largo, x: limite, z: 0, giro: Math.PI / 2 }, // derecha
    // El pasillo de la entrada, del lado de afuera: sus dos costados y el fondo.
    { largo: entrada.largo, x: -entrada.ancho / 2, z: limite + entrada.largo / 2, giro: Math.PI / 2 },
    { largo: entrada.largo, x: entrada.ancho / 2, z: limite + entrada.largo / 2, giro: Math.PI / 2 },
    { largo: entrada.ancho, x: 0, z: limite + entrada.largo, giro: 0 },
  ];
  for (const datos of lados) {
    const lado = crearLado(datos.largo, materialMalla);
    lado.position.set(datos.x, 0, datos.z);
    lado.rotation.y = datos.giro;
    vallas.add(lado);
  }
  return vallas;
}
