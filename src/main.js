// Punto de entrada del simulador.
// Arma la escena: predio, cielo de noche, iluminación, cámara y el primer escenario.
import * as THREE from 'three';
import { crearEscenario } from './escenario.js';

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
// Cámara fija, como una persona parada en el público: a la altura de los ojos
// (1.7 metros), unos 30 metros delante del escenario 1, mirando hacia la pantalla.
camara.position.set(-60, 1.7, -10);
camara.lookAt(-60, 7, -40);

// --- Renderer ---
// El renderer es el que "dibuja" la escena vista desde la cámara en un <canvas>.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// En pantallas de muy alta densidad limitamos a 2x: se ve igual de bien y es más liviano.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- Iluminación general ---
// Ninguna luz proyecta sombras: las sombras son lo más pesado de dibujar.

// Luz hemisférica: ilumina desde arriba con un color (cielo) y desde abajo con otro (suelo).
// Hace que la noche se vea oscura pero sin que nada quede totalmente negro.
// HemisphereLight(color del cielo, color del suelo, intensidad)
const luzGeneral = new THREE.HemisphereLight(0x4a5a99, 0x1a3311, 1.2);
escena.add(luzGeneral);

// Luz de luna: una luz direccional (como el sol, pero más tenue y azulada).
const luzLuna = new THREE.DirectionalLight(0xaabbff, 0.6);
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

// --- Escenarios ---
// Escenario 1, hacia la izquierda del predio.
// Dejamos lugar libre en el centro y a la derecha para los otros dos.
const escenario1 = crearEscenario({
  nombre: 'Ciro y los Persas',
  color: 0xff3355,
  posicion: { x: -60, z: -40 },
});
escena.add(escenario1);

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
