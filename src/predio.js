// Decoración del predio: el piso (pasto con la tierra pisada donde está la gente y los
// caminos) y las guirnaldas de banderines con lamparitas que cruzan la zona central.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Piso ---
const PIXELES_PISO = 1024; // tamaño del dibujo del piso (1024 x 1024 píxeles para todo el predio)
const DISTANCIA_PUBLICO = 26; // metros del centro del escenario al centro de la zona del público
const LARGO_ZONA_PUBLICO = 24; // metros (de la valla hacia atrás, la mitad)
const ANCHO_ZONA_PUBLICO = 28; // metros (de costado, la mitad)
const ANCHO_CAMINO = 5; // metros
const RADIO_PLAZA_CENTRAL = 14; // la ronda de tierra en el centro del predio

// --- Banderines ---
const CANTIDAD_POSTES = 6; // en ronda alrededor del centro
const RADIO_POSTES = 22; // metros del centro a cada poste
const ALTO_POSTE = 7; // metros
const CAIDA_GUIRNALDA = 1.5; // cuánto cuelga la guirnalda en el medio (metros)
const SEPARACION_BANDERINES = 0.7; // metros entre un banderín y el siguiente
const CADA_CUANTOS_LAMPARITA = 2; // una lamparita cada 2 banderines
const COLORES_BANDERINES = [0xff3355, 0xff9900, 0x33aaff, 0xffdd33, 0xffffff, 0x33cc66];

/**
 * Crea el piso del predio, con un dibujo hecho en un <canvas>: pasto, la tierra pisada
 * delante de cada escenario, una ronda en el centro y caminos que van a cada escenario
 * y a la barra.
 *
 * @param {object} opciones
 * @param {number} opciones.tamano  Lado del predio en metros (es cuadrado)
 * @param {Array<{x: number, z: number}>} opciones.escenarios  Dónde está cada escenario
 * @param {{x: number, z: number}} opciones.barra  Dónde está la barra
 * @param {number} opciones.anisotropia  Ver main.js: hace que el piso se vea nítido a lo lejos
 * @returns {THREE.Mesh}
 */
export function crearPiso({ tamano, escenarios, barra, anisotropia }) {
  const canvas = document.createElement('canvas');
  canvas.width = PIXELES_PISO;
  canvas.height = PIXELES_PISO;
  const ctx = canvas.getContext('2d');

  // Pasamos de metros del predio a píxeles del canvas. El predio va de -tamano/2 a tamano/2;
  // el canvas, de 0 a PIXELES_PISO. (Arriba del canvas queda el fondo del predio, z negativo.)
  const pixelesPorMetro = PIXELES_PISO / tamano;
  const aPixel = (metros) => (metros + tamano / 2) * pixelesPorMetro;

  // --- 1. Pasto: un verde de fondo con miles de manchitas de otros verdes ---
  ctx.fillStyle = '#2f6b2a';
  ctx.fillRect(0, 0, PIXELES_PISO, PIXELES_PISO);
  manchitas(ctx, 40000, ['#2a6125', '#357a2f', '#3b8434', '#27571f', '#41893a'], 1, 3);

  // --- 2. Tierra pisada ---
  // Usamos un color de tierra un poco transparente para que se vea algo del pasto debajo.
  const tierra = 'rgba(122, 98, 64, 0.85)';
  const tierraSuave = 'rgba(122, 98, 64, 0)';

  // Caminos: líneas gruesas desde el centro hasta cada escenario y hasta la barra.
  ctx.strokeStyle = 'rgba(122, 98, 64, 0.7)';
  ctx.lineWidth = ANCHO_CAMINO * pixelesPorMetro;
  ctx.lineCap = 'round';
  for (const destino of [...escenarios, barra]) {
    ctx.beginPath();
    ctx.moveTo(aPixel(0), aPixel(0));
    ctx.lineTo(aPixel(destino.x), aPixel(destino.z));
    ctx.stroke();
  }

  // Ronda central: un círculo con borde difuso (degradé "radial" de tierra a transparente).
  const radioPlaza = RADIO_PLAZA_CENTRAL * pixelesPorMetro;
  const plaza = ctx.createRadialGradient(aPixel(0), aPixel(0), 0, aPixel(0), aPixel(0), radioPlaza);
  plaza.addColorStop(0.6, tierra);
  plaza.addColorStop(1, tierraSuave);
  ctx.fillStyle = plaza;
  ctx.fillRect(aPixel(0) - radioPlaza, aPixel(0) - radioPlaza, radioPlaza * 2, radioPlaza * 2);

  // Delante de cada escenario, donde salta la gente: un óvalo de tierra.
  for (const escenario of escenarios) {
    // Dirección del escenario hacia el centro del predio (la misma hacia donde mira).
    const distancia = Math.hypot(escenario.x, escenario.z);
    const haciaCentroX = -escenario.x / distancia;
    const haciaCentroZ = -escenario.z / distancia;
    const centroX = escenario.x + haciaCentroX * DISTANCIA_PUBLICO;
    const centroZ = escenario.z + haciaCentroZ * DISTANCIA_PUBLICO;

    // Para dibujar un óvalo girado movemos y giramos el "lápiz" del canvas (translate y
    // rotate), lo estiramos (scale) y dibujamos un círculo, que estirado queda óvalo.
    ctx.save();
    ctx.translate(aPixel(centroX), aPixel(centroZ));
    ctx.rotate(Math.atan2(haciaCentroZ, haciaCentroX));
    ctx.scale(LARGO_ZONA_PUBLICO / ANCHO_ZONA_PUBLICO, 1);
    const radio = ANCHO_ZONA_PUBLICO * pixelesPorMetro;
    const zona = ctx.createRadialGradient(0, 0, 0, 0, 0, radio);
    zona.addColorStop(0.55, tierra);
    zona.addColorStop(1, tierraSuave);
    ctx.fillStyle = zona;
    ctx.fillRect(-radio, -radio, radio * 2, radio * 2);
    ctx.restore();
  }

  // Unas piedritas y matas de pasto sueltas encima de todo (le dan textura a la tierra).
  manchitas(ctx, 6000, ['rgba(90, 70, 45, 0.5)', 'rgba(160, 135, 95, 0.5)'], 1, 2);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = anisotropia;

  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(tamano, tamano),
    new THREE.MeshStandardMaterial({ map: textura, roughness: 1 })
  );
  // Los planos se crean "parados" (verticales); lo rotamos 90° para que quede acostado.
  piso.rotation.x = -Math.PI / 2;
  return piso;
}

// Dibuja muchos cuadraditos de colores al azar por todo el canvas.
function manchitas(ctx, cantidad, colores, tamanoMinimo, tamanoMaximo) {
  for (let i = 0; i < cantidad; i++) {
    ctx.fillStyle = colores[Math.floor(Math.random() * colores.length)];
    const lado = tamanoMinimo + Math.random() * (tamanoMaximo - tamanoMinimo);
    ctx.fillRect(Math.random() * ctx.canvas.width, Math.random() * ctx.canvas.height, lado, lado);
  }
}

/**
 * Crea una ronda de postes alrededor del centro del predio, unidos por guirnaldas
 * de banderines de colores y lamparitas.
 *
 * @returns {{ grupo: THREE.Group, colisiones: Array }}
 *          colisiones: una caja chica por poste, para no atravesarlos (ver jugador.js)
 */
export function crearBanderines() {
  const grupo = new THREE.Group();
  const colisiones = [];

  // --- Postes ---
  const materialPoste = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.5 });
  const geometriaPoste = new THREE.CylinderGeometry(0.1, 0.14, ALTO_POSTE, 8);
  const postes = []; // la punta de cada poste, donde se atan las guirnaldas
  for (let i = 0; i < CANTIDAD_POSTES; i++) {
    // Los repartimos en ronda, uno cada 60°. Los escenarios están a 30°, 150° y 270°
    // (mirando desde el centro), así que ningún poste queda en el camino hacia uno.
    const angulo = (i / CANTIDAD_POSTES) * Math.PI * 2;
    const x = Math.cos(angulo) * RADIO_POSTES;
    const z = Math.sin(angulo) * RADIO_POSTES;

    const poste = new THREE.Mesh(geometriaPoste, materialPoste);
    poste.position.set(x, ALTO_POSTE / 2, z);
    grupo.add(poste);
    postes.push(new THREE.Vector3(x, ALTO_POSTE - 0.2, z));

    colisiones.push({ minX: -0.3, maxX: 0.3, minZ: -0.3, maxZ: 0.3, centroX: x, centroZ: z, angulo: 0 });
  }

  // --- Guirnaldas ---
  // Primero calculamos dónde va cada banderín y cada lamparita; después los creamos todos
  // juntos con InstancedMesh (una sola malla que se dibuja muchas veces: es mucho más liviano).
  const banderines = []; // { posicion, giro }
  const lamparitas = []; // posiciones
  const materialHilo = new THREE.LineBasicMaterial({ color: 0x222222 });

  for (let i = 0; i < CANTIDAD_POSTES; i++) {
    const desde = postes[i];
    const hasta = postes[(i + 1) % CANTIDAD_POSTES]; // el último se une con el primero

    // El hilo: una línea que cuelga en forma de "U" suave (una parábola).
    // En el punto s (0 = un poste, 1 = el otro) cae 4·s·(1−s) veces CAIDA_GUIRNALDA:
    // nada en las puntas y CAIDA_GUIRNALDA justo en el medio.
    const puntoDelHilo = (s) => {
      const punto = new THREE.Vector3().lerpVectors(desde, hasta, s);
      punto.y -= CAIDA_GUIRNALDA * 4 * s * (1 - s);
      return punto;
    };
    const puntos = [];
    for (let s = 0; s <= 1.0001; s += 0.05) puntos.push(puntoDelHilo(s));
    grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), materialHilo));

    // Banderines colgados a lo largo del hilo, girados para quedar en la misma dirección.
    const giro = Math.atan2(-(hasta.z - desde.z), hasta.x - desde.x);
    const cantidad = Math.floor(desde.distanceTo(hasta) / SEPARACION_BANDERINES);
    for (let j = 1; j < cantidad; j++) {
      const s = j / cantidad;
      if (j % CADA_CUANTOS_LAMPARITA === 0) {
        lamparitas.push(puntoDelHilo(s));
      } else {
        banderines.push({ posicion: puntoDelHilo(s), giro });
      }
    }
  }

  // Un banderín: un triángulo con la punta para abajo (como los de los cumpleaños).
  const geometriaBanderin = new THREE.BufferGeometry();
  geometriaBanderin.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-0.3, 0, 0, 0.3, 0, 0, 0, -0.55, 0], 3)
  );
  geometriaBanderin.computeVertexNormals();
  const mallaBanderines = new THREE.InstancedMesh(
    geometriaBanderin,
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), // se ve de los dos lados
    banderines.length
  );
  const ubicacion = new THREE.Object3D(); // nos ayuda a armar la posición y el giro de cada copia
  const color = new THREE.Color();
  banderines.forEach((banderin, i) => {
    ubicacion.position.copy(banderin.posicion);
    ubicacion.rotation.set(0, banderin.giro, 0);
    ubicacion.updateMatrix();
    mallaBanderines.setMatrixAt(i, ubicacion.matrix);
    mallaBanderines.setColorAt(i, color.setHex(COLORES_BANDERINES[i % COLORES_BANDERINES.length]));
  });
  grupo.add(mallaBanderines);

  // Lamparitas: esferas chiquitas que brillan solas (MeshBasicMaterial no depende de las luces).
  // multiplyScalar(2) las hace "más brillantes que el blanco": así el bloom les pone un halo (ver main.js).
  const mallaLamparitas = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcc77).multiplyScalar(2) }),
    lamparitas.length
  );
  lamparitas.forEach((posicion, i) => {
    ubicacion.position.copy(posicion);
    ubicacion.position.y -= 0.1; // cuelgan un poquito debajo del hilo
    ubicacion.rotation.set(0, 0, 0);
    ubicacion.updateMatrix();
    mallaLamparitas.setMatrixAt(i, ubicacion.matrix);
  });
  grupo.add(mallaLamparitas);

  return { grupo, colisiones };
}
