// Punto de entrada del simulador.
// Por ahora solo arma una escena básica: piso verde, cielo de noche y una cámara.
import * as THREE from 'three';

// --- Escena ---
// La escena es el "mundo" donde ponemos todos los objetos 3D.
const escena = new THREE.Scene();

// Cielo de noche: un color azul muy oscuro de fondo.
const colorCielo = new THREE.Color(0x0a0a23);
escena.background = colorCielo;

// Niebla del mismo color que el cielo: hace que el piso se "funda" con el horizonte.
escena.fog = new THREE.Fog(colorCielo, 50, 300);

// --- Cámara ---
// PerspectiveCamera(campo de visión en grados, proporción ancho/alto, distancia mínima, distancia máxima)
const camara = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// La ubicamos a la altura de los ojos de una persona (1.7 metros)
// y un poco hacia atrás, mirando hacia adelante y levemente hacia el piso.
camara.position.set(0, 1.7, 10);
camara.lookAt(0, 0, 0);

// --- Renderer ---
// El renderer es el que "dibuja" la escena vista desde la cámara en un <canvas>.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- Luces ---
// Luz ambiente: ilumina todo un poco, para que nada quede totalmente negro.
const luzAmbiente = new THREE.AmbientLight(0x6070a0, 0.6);
escena.add(luzAmbiente);

// Luz de luna: una luz direccional (como el sol, pero más tenue y azulada).
const luzLuna = new THREE.DirectionalLight(0xaabbff, 0.8);
luzLuna.position.set(-50, 100, 50);
escena.add(luzLuna);

// --- Piso (el predio) ---
// Un plano de 500 x 500 metros.
const geometriaPiso = new THREE.PlaneGeometry(500, 500);
const materialPiso = new THREE.MeshStandardMaterial({ color: 0x2e7d32 }); // verde pasto
const piso = new THREE.Mesh(geometriaPiso, materialPiso);
// Los planos se crean "parados" (verticales); lo rotamos 90° para que quede acostado.
piso.rotation.x = -Math.PI / 2;
escena.add(piso);

// --- Ajuste al cambiar el tamaño de la ventana ---
window.addEventListener('resize', () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Bucle de animación ---
// Se ejecuta unas 60 veces por segundo y vuelve a dibujar la escena.
function animar() {
  requestAnimationFrame(animar);
  renderer.render(escena, camara);
}
animar();
