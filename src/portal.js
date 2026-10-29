// Portal de la entrada del predio: dos columnas a los costados de la puerta y, arriba,
// un cartel grande con el nombre del festival. Va sobre la valla del frente (ver vallas.js
// y main.js); el jugador arranca afuera, en el pasillo de la entrada, mirándolo.
import * as THREE from 'three';

// --- Medidas, en metros ---
const ANCHO_COLUMNA = 1.2;
const ALTO_COLUMNA = 7; // el cartel va apoyado arriba de las columnas
const ANCHO_CARTEL = 16; // más ancho que la puerta: sobresale a los costados
const ALTO_CARTEL = 4; // ANCHO_CARTEL / ALTO_CARTEL = 4, la misma proporción que el canvas
const PROFUNDIDAD_CARTEL = 0.6;

const NOMBRE_FESTIVAL = 'Salve Salve Rockanrol';

// Dibuja el nombre del festival en un <canvas> (como el cartel de los escenarios)
// y lo devuelve como textura.
function crearTexturaCartel() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fondo oscuro con un borde dorado
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffcc33';
  ctx.lineWidth = 28;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  // Texto centrado. El último número de fillText es el ancho máximo:
  // si no entra, el navegador lo angosta.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 230px Impact, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(NOMBRE_FESTIVAL, canvas.width / 2, canvas.height / 2, canvas.width - 160);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace; // para que los colores se vean correctos
  return textura;
}

/**
 * Crea el portal, centrado en x = 0 y parado sobre la línea z de la valla.
 * @param {object} opciones
 * @param {number} opciones.z  Dónde está la valla del frente (metros desde el centro del predio)
 * @param {number} opciones.anchoPuerta  Ancho del hueco de la valla (las columnas van en sus bordes)
 * @returns {{ grupo: THREE.Group, colisiones: Array }}
 *          colisiones: una caja por columna, para no atravesarlas (ver jugador.js)
 */
export function crearPortal({ z, anchoPuerta }) {
  const grupo = new THREE.Group();
  grupo.position.z = z;
  const colisiones = [];

  // --- Columnas: una a cada lado del hueco ---
  const materialColumna = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.6 });
  const geometriaColumna = new THREE.BoxGeometry(ANCHO_COLUMNA, ALTO_COLUMNA, ANCHO_COLUMNA);
  for (const lado of [-1, 1]) {
    // Centrada sobre el borde del hueco: lado = -1 a la izquierda, 1 a la derecha.
    // Así tapa la punta de la valla del frente y la del costado del pasillo, que se juntan ahí.
    const x = lado * (anchoPuerta / 2);
    const columna = new THREE.Mesh(geometriaColumna, materialColumna);
    columna.position.set(x, ALTO_COLUMNA / 2, 0);
    grupo.add(columna);

    // Mismo formato que las colisiones de los escenarios (ver jugador.js).
    const mitad = ANCHO_COLUMNA / 2;
    colisiones.push({ minX: -mitad, maxX: mitad, minZ: -mitad, maxZ: mitad, centroX: x, centroZ: z, angulo: 0 });
  }

  // --- Cartel: una caja con el nombre en la cara de adelante y en la de atrás ---
  // Así se lee desde afuera (al llegar) y desde adentro del predio (al irse).
  // BoxGeometry acepta un material por cara, en este orden: +X, −X, +Y, −Y, +Z, −Z.
  // MeshBasicMaterial no depende de las luces: el cartel se lee bien también de noche.
  // El color multiplica a la textura: con gris en vez de blanco, las letras quedan un poco
  // más oscuras. Si no, brillan más que el umbral del bloom (ver main.js), les sale un
  // halo y no se leen.
  const materialNombre = new THREE.MeshBasicMaterial({ map: crearTexturaCartel(), color: 0x9a9a9a });
  const materialCanto = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const cartel = new THREE.Mesh(
    new THREE.BoxGeometry(ANCHO_CARTEL, ALTO_CARTEL, PROFUNDIDAD_CARTEL),
    [materialCanto, materialCanto, materialCanto, materialCanto, materialNombre, materialNombre]
  );
  cartel.position.y = ALTO_COLUMNA + ALTO_CARTEL / 2; // apoyado arriba de las columnas
  grupo.add(cartel);

  return { grupo, colisiones };
}
