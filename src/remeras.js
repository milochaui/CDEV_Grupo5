// Remeras de bandas: el estampado con el nombre de una banda, adelante y en la espalda.
// La remera en sí es la caja del cuerpo pintada de negro (como casi todas las remeras de
// rock); acá armamos solo el estampado, que va pegado encima del pecho y de la espalda.
// Como hay mucha gente, usamos InstancedMesh (como en publico.js): una por banda, con
// una copia del estampado por cada persona que tiene la remera de esa banda.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Color de la remera (la caja del cuerpo) de los que tienen remera de banda.
export const COLOR_REMERA = 0x111111;

// Qué parte de la gente lleva remera de banda (de 0 a 1).
export const PROPORCION_REMERAS = 0.6;

// Lo que dice cada estampado: el nombre en uno o dos renglones, y su color.
const ESTAMPADOS = [
  { renglones: ['CIRO', 'Y LOS PERSAS'], color: '#ff3355' },
  { renglones: ['LAS PASTILLAS', 'DEL ABUELO'], color: '#ff9900' },
  { renglones: ['CALAMARO'], color: '#33aaff' },
  { renglones: ['GUASONES'], color: '#eeeeee' },
  { renglones: ['CALLEJEROS'], color: '#d9a400' },
  { renglones: ['TURF'], color: '#ff66cc' },
  { renglones: ['INTOXICADOS'], color: '#66dd66' },
  { renglones: ['NO TE VA', 'GUSTAR'], color: '#4a90c8' },
  { renglones: ['LA VELA', 'PUERCA'], color: '#e05a2a' },
];

// --- Medidas, en metros ---
const LADO_ESTAMPADO = 0.3; // el estampado es un cuadrado de 30 cm
// Cuánto sobresale del cuerpo. La caja del cuerpo mide 0.26 de profundidad (0.13 para cada
// lado): si el estampado quedara justo encima, la placa de video no sabría cuál dibujar
// adelante y "titilaría". Medio centímetro alcanza.
const DISTANCIA_PECHO = 0.13 + 0.005;

// Dibuja un estampado en un <canvas>: fondo negro (del color de la remera), un círculo
// del color de la banda y el nombre adentro.
function crearMaterialEstampado({ renglones, color }) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.stroke();

  // Cada renglón centrado; con dos renglones, uno arriba y otro abajo del medio.
  ctx.fillStyle = color;
  ctx.font = 'bold 22px Impact, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const altoRenglon = 26;
  const primeraY = 64 - ((renglones.length - 1) * altoRenglon) / 2;
  renglones.forEach((renglon, i) => {
    ctx.fillText(renglon, 64, primeraY + i * altoRenglon, 100); // 100: ancho máximo
  });

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: textura, roughness: 0.9 });
}
const materialesEstampado = ESTAMPADOS.map(crearMaterialEstampado);

/**
 * Arma la forma del estampado: dos cuadrados, uno en el pecho y otro en la espalda,
 * medidos desde los pies de la persona (como el cuerpo en publico.js), que mira hacia +Z.
 * @param {number} alturaPecho  A qué altura va el medio del estampado (metros)
 */
function crearGeometriaEstampado(alturaPecho) {
  const adelante = new THREE.PlaneGeometry(LADO_ESTAMPADO, LADO_ESTAMPADO);
  adelante.translate(0, alturaPecho, DISTANCIA_PECHO);
  // El de la espalda lo damos vuelta (media vuelta, π) para que mire hacia atrás (−Z).
  const atras = new THREE.PlaneGeometry(LADO_ESTAMPADO, LADO_ESTAMPADO);
  atras.rotateY(Math.PI);
  atras.translate(0, alturaPecho, -DISTANCIA_PECHO);

  // mergeGeometries (viene con Three.js) junta las dos en una sola geometría:
  // así cada InstancedMesh dibuja pecho y espalda de una vez.
  return mergeGeometries([adelante, atras]);
}

/**
 * Crea los estampados de un grupo de personas.
 *
 * @param {THREE.Object3D} grupo  Donde se agregan las InstancedMesh
 * @param {number} capacidad  Cuántas personas puede haber como mucho
 * @param {number} alturaPecho  A qué altura (desde los pies) va el estampado
 * @returns {{ ponerRemera: () => object, mover: (remera, matriz) => void, avisarCambios: () => void }}
 */
export function crearRemeras(grupo, capacidad, alturaPecho) {
  const geometria = crearGeometriaEstampado(alturaPecho);

  // Una InstancedMesh por banda. Empiezan sin copias (count = 0): ponerRemera las va sumando.
  const estampados = materialesEstampado.map((material) => {
    const malla = new THREE.InstancedMesh(geometria, material, capacidad);
    malla.count = 0;
    malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // se mueven en cada cuadro
    malla.frustumCulled = false; // como en publico.js: la gente se mueve, se dibuja siempre
    grupo.add(malla);
    return malla;
  });

  // Le da a una persona la remera de una banda al azar.
  // Devuelve su "remera": en qué InstancedMesh quedó su estampado y en qué número de copia.
  function ponerRemera() {
    const malla = estampados[Math.floor(Math.random() * estampados.length)];
    const remera = { malla, indice: malla.count };
    malla.count++;
    return remera;
  }

  // Pone el estampado de una persona donde está su cuerpo en este cuadro.
  // "matriz" es la del cuerpo entero (la del muñeco en publico.js, medida desde los pies).
  function mover(remera, matriz) {
    remera.malla.setMatrixAt(remera.indice, matriz);
  }

  // Avisa que las posiciones cambiaron, para que se manden a la placa de video.
  function avisarCambios() {
    for (const malla of estampados) {
      malla.instanceMatrix.needsUpdate = true;
    }
  }

  return { ponerRemera, mover, avisarCambios };
}
