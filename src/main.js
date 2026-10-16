// Punto de entrada del simulador.
// Arma la escena: predio, cielo de noche, iluminación, cámara y los tres escenarios.
import * as THREE from 'three';
import { crearEscenario } from './escenario.js';
import { crearJugador } from './jugador.js';
import { crearAcciones } from './acciones.js';

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
// Posición inicial del jugador: en el centro del predio, entre los tres escenarios,
// mirando hacia la pantalla de Ciro y los Persas. La altura (1.7 m, los ojos de
// una persona) la fija el jugador en jugador.js.
camara.position.set(0, 1.7, 0);
camara.lookAt(0, 7, -98);
// Agregamos la cámara a la escena para que se dibujen sus hijos: los brazos del
// jugador (ver acciones.js) van pegados a ella.
escena.add(camara);

// --- Sonido ---
// El AudioListener son los "oídos" del jugador. Lo pegamos a la cámara para que
// se mueva y gire con ella: así el sonido cambia según dónde estamos y hacia dónde miramos.
const oyente = new THREE.AudioListener();
camara.add(oyente);


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
// Como en un festival real, los tres escenarios forman un triángulo y todos miran
// hacia una zona central, el centro del predio (0, 0).
// Sus centros están a 98 m de ese punto y separados 120° entre sí (un triángulo equilátero):
//  - Ciro y los Persas al frente:                   (0, -98)
//  - Las Pastillas del Abuelo atrás a la izquierda: (-85, 49)
//  - Andrés Calamaro atrás a la derecha:            (85, 49)
// Así hay unos 170 m de un escenario a otro. Caminando (5 m/s) se tarda unos 25 segundos
// en ir del público de un escenario al del otro, y corriendo (Shift) la mitad.
// Los escenarios quedan a menos de 110 m del centro: el predio (de -250 a 250) sobra.
const CENTRO_PREDIO = { x: 0, z: 0 };

// En cada lista, los temas suenan en ese orden y al terminar la lista vuelve a empezar.
const escenarios = [
  crearEscenario({
    nombre: 'Ciro y los Persas',
    color: 0xff3355, // rojo
    posicion: { x: 0, z: -98 },
    mirarHacia: CENTRO_PREDIO,
    temas: [
      { archivo: 'ciro_conocido_astros.mp3', titulo: 'Astros', conocido: true },
      { archivo: 'ciro_tranqui_servidor.mp3', titulo: 'Servidor', conocido: false },
    ],
    oyente: oyente,
  }),
  crearEscenario({
    nombre: 'Las Pastillas del Abuelo',
    color: 0xff9900, // ámbar
    posicion: { x: -85, z: 49 },
    mirarHacia: CENTRO_PREDIO,
    temas: [
      { archivo: 'pastillas_conocido_viejokarma.mp3', titulo: 'Viejo Karma', conocido: true },
      { archivo: 'pastillas_tranqui_mejuegoelcorazon.mp3', titulo: 'Me juego el corazón', conocido: false },
    ],
    oyente: oyente,
  }),
  crearEscenario({
    nombre: 'Andrés Calamaro',
    color: 0x33aaff, // celeste
    posicion: { x: 85, z: 49 },
    mirarHacia: CENTRO_PREDIO,
    temas: [
      { archivo: 'calamaro_conocido_sindocumentos.mp3', titulo: 'Sin documentos', conocido: true },
      { archivo: 'calamaro_medio_todaviaunacanciondeamor.mp3', titulo: 'Todavía una canción de amor', conocido: false },
      { archivo: 'calamaro_tranqui_buenasuerteyhastaluego.mp3', titulo: 'Buena suerte y hasta luego', conocido: false },
    ],
    oyente: oyente,
  }),
];

for (const escenario of escenarios) {
  escena.add(escenario);
}

// --- Jugador ---
// Le pasamos las zonas sólidas de los tres escenarios y el borde del predio.
// flatMap junta las listas de colisiones de cada escenario en una sola lista.
const jugador = crearJugador(camara, document.body, {
  colisiones: escenarios.flatMap((escenario) => escenario.userData.colisiones),
  limitePredio: TAMANO_PREDIO / 2, // el predio va de -250 a 250 en X y en Z
});

// --- Acciones del recital (brazos, salto, cantar y pogo) ---
const acciones = crearAcciones({ camara, jugador, escenarios });

// --- Pantalla de inicio, pausa y mira ---
// El mismo cartel sirve de pantalla de inicio y de pantalla de pausa:
// solo le cambiamos el título y el texto de abajo.
const pantallaInicio = document.getElementById('pantalla-inicio');
const tituloCartel = document.getElementById('titulo-cartel');
const textoClic = document.getElementById('texto-clic');
const mira = document.getElementById('mira');

// Para no reiniciar la música en cada clic: solo arranca la primera vez.
let musicaArrancada = false;

// Al hacer clic en el cartel capturamos el mouse y empieza el juego.
pantallaInicio.addEventListener('click', () => {
  jugador.controles.lock();

  // Los navegadores no dejan reproducir sonido hasta que el usuario interactúa con
  // la página. Por eso la música arranca acá, con este primer clic.
  // Las tres bandas empiezan a tocar al mismo tiempo, como en un festival.
  if (!musicaArrancada) {
    oyente.context.resume(); // el sonido del navegador empieza "suspendido"
    for (const escenario of escenarios) {
      escenario.userData.musica.arrancar();
    }
    musicaArrancada = true;
  }
});

// Mouse capturado: se juega. Escondemos el cartel, mostramos la mira y la música
// de los tres escenarios sigue desde donde quedó.
// (La primera vez la música ya arrancó con el clic, y reanudar() no hace nada.)
jugador.controles.addEventListener('lock', () => {
  pantallaInicio.style.display = 'none';
  mira.style.display = 'block';
  if (musicaArrancada) {
    for (const escenario of escenarios) {
      escenario.userData.musica.reanudar();
    }
  }
});

// Mouse liberado (con Esc o con la tecla P): pausa. Se detiene la música de los
// tres escenarios y vuelve el cartel, ahora como cartel de pausa.
// El público se congela solo: en el bucle de animación no lo movemos si hay pausa.
jugador.controles.addEventListener('unlock', () => {
  pantallaInicio.style.display = 'flex';
  mira.style.display = 'none';
  tituloCartel.textContent = 'Pausa';
  textoClic.textContent = 'Hacé clic para continuar';
  for (const escenario of escenarios) {
    escenario.userData.musica.pausar();
  }
});

// --- Teclas P (pausa) y M (silencio) ---
const avisoSilencio = document.getElementById('aviso-silencio');
let silenciado = false;

document.addEventListener('keydown', (event) => {
  // P: pausa. Con Esc el navegador suelta el mouse solo; con P lo soltamos nosotros.
  // Al soltarlo se dispara el evento 'unlock' de arriba, que hace toda la pausa.
  if (event.code === 'KeyP' && jugador.controles.isLocked) {
    jugador.controles.unlock();
  }

  // M: silenciar o activar el sonido, sin pausar (la música sigue avanzando).
  // setMasterVolume cambia el volumen general de los "oídos" del jugador: 0 = mudo.
  if (event.code === 'KeyM') {
    silenciado = !silenciado; // ! da vuelta el valor: true pasa a false y al revés
    oyente.setMasterVolume(silenciado ? 0 : 1);
    avisoSilencio.style.display = silenciado ? 'block' : 'none';
  }
});

// --- Indicador del tema que suena ---
// Muestra la banda que más fuerte se escucha y el tema que está tocando.
// Si estamos tan lejos que no se escucha ninguna, el cartelito se esconde.
const indicadorTema = document.getElementById('tema-actual');

function actualizarIndicador() {
  // Buscamos el escenario cuya música tiene más volumen en este momento.
  let masFuerte = null;
  let mayorVolumen = 0; // si ninguna banda supera 0 (no se oye nada), masFuerte queda en null
  for (const escenario of escenarios) {
    const volumen = escenario.userData.musica.volumen();
    if (volumen > mayorVolumen) {
      mayorVolumen = volumen;
      masFuerte = escenario;
    }
  }

  let texto = '';
  if (musicaArrancada && masFuerte !== null) {
    // crearEscenario deja guardado el nombre de la banda en userData.
    const banda = masFuerte.userData.nombre;
    texto = '♪ ' + banda + ' — ' + masFuerte.userData.musica.temaActual().titulo;
  }

  // Solo tocamos la página si el texto cambió (cambiarla en cada cuadro es trabajo de más).
  if (indicadorTema.textContent !== texto) {
    indicadorTema.textContent = texto;
    indicadorTema.style.display = texto ? 'block' : 'none';
  }
}

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
  // El volumen de cada banda depende de dónde quedó parado el jugador.
  // Y cada público reacciona a la música de su escenario, salvo en pausa:
  // si el mouse no está capturado no lo actualizamos y queda congelado.
  // Lo mismo con las acciones del jugador. Van antes que el público, así el
  // contagio que le mandan se nota en este mismo cuadro.
  const enPausa = !jugador.controles.isLocked;
  if (!enPausa) {
    acciones.actualizar(delta);
  }
  for (const escenario of escenarios) {
    escenario.userData.musica.actualizarVolumen(camara.position);
    if (!enPausa) {
      escenario.userData.publico.actualizar(delta);
    }
  }
  actualizarIndicador();
  renderer.render(escena, camara);
}
requestAnimationFrame(animar);
