// Punto de entrada del simulador.
// Arma la escena: predio, cielo de noche, iluminación, cámara y el primer escenario.
import * as THREE from 'three';
import { crearEscenario } from './escenario.js';
import { crearJugador } from './jugador.js';

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
// Posición inicial del jugador: parado en el público, unos 30 metros delante
// del escenario 1, mirando hacia la pantalla. La altura (1.7 m, los ojos de
// una persona) la fija el jugador en jugador.js.
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
const TAMANO_PREDIO = 500;
const geometriaPiso = new THREE.PlaneGeometry(TAMANO_PREDIO, TAMANO_PREDIO);
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

// --- Jugador ---
// Le pasamos las zonas sólidas de los escenarios y el borde del predio.
const jugador = crearJugador(camara, document.body, {
  colisiones: [...escenario1.userData.colisiones],
  limitePredio: TAMANO_PREDIO / 2, // el predio va de -250 a 250 en X y en Z
});

// --- Pantalla de inicio y mira ---
const pantallaInicio = document.getElementById('pantalla-inicio');
const mira = document.getElementById('mira');

// Al hacer clic en el cartel capturamos el mouse y empieza el juego.
pantallaInicio.addEventListener('click', () => {
  jugador.controles.lock();
});

// Mouse capturado: escondemos el cartel y mostramos la mira.
jugador.controles.addEventListener('lock', () => {
  pantallaInicio.style.display = 'none';
  mira.style.display = 'block';
});

// Mouse liberado (por ejemplo, con Esc): vuelve el cartel y se esconde la mira.
jugador.controles.addEventListener('unlock', () => {
  pantallaInicio.style.display = 'flex';
  mira.style.display = 'none';
});

// --- Ajuste al cambiar el tamaño de la ventana ---
window.addEventListener('resize', () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Bucle de animación ---
// Se ejecuta unas 60 veces por segundo: mueve al jugador y vuelve a dibujar la escena.

// El Timer mide cuánto tiempo pasa entre un cuadro y el siguiente.
const timer = new THREE.Timer();

function animar(tiempo) {
  requestAnimationFrame(animar);

  timer.update(tiempo);
  // Segundos desde el cuadro anterior. Lo limitamos a 0.1 s: si la pestaña estuvo
  // en segundo plano, el delta sería enorme y el jugador "saltaría" de golpe.
  const delta = Math.min(timer.getDelta(), 0.1);

  jugador.actualizar(delta);
  renderer.render(escena, camara);
}
requestAnimationFrame(animar);
