// Punto de entrada del simulador.
// Arma la escena: predio, cielo (del atardecer a la noche), iluminación, cámara y los tres escenarios.
import * as THREE from 'three';
// Postprocesado: efectos que se aplican a la imagen ya dibujada (ver "Bloom" más abajo).
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { crearEscenario } from './escenario.js';
import { crearJugador } from './jugador.js';
import { crearAcciones } from './acciones.js';
import { crearCielo } from './cielo.js';
import { crearAguanteMetro } from './aguante.js';
import { crearBarra, crearPedidos } from './barra.js';
import { crearPiso, crearBanderines } from './predio.js';

// --- Escena ---
// La escena es el "mundo" donde ponemos todos los objetos 3D.
const escena = new THREE.Scene();

// Niebla: hace que el piso se "funda" con el horizonte. Su color lo va cambiando
// cielo.js para que siempre sea el del horizonte (el cielo es una esfera, ver cielo.js).
escena.fog = new THREE.Fog(0x0a0a23, 50, 300);

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

// --- Bloom: el resplandor de las luces ---
// En vez de dibujar la escena directo en pantalla, la dibujamos en una imagen intermedia
// y le aplicamos efectos antes de mostrarla. Eso lo hace el EffectComposer, que va
// pasando la imagen por una cadena de "pasadas":
//  1. RenderPass: dibuja la escena como siempre.
//  2. UnrealBloomPass: a lo que brilla mucho (reflectores, pantallas, fuegos, celulares,
//     el sol) le agrega un halo de luz alrededor, como se ve en las fotos de un recital.
//  3. OutputPass: corrige los colores para la pantalla (lo que antes hacía el renderer solo).
// Si anda lento en una compu, se puede apagar con USAR_BLOOM = false.
const USAR_BLOOM = true;
const BLOOM_FUERZA = 0.7; // cuánto halo agrega
const BLOOM_RADIO = 0.4; // qué tan desparramado es el halo
const BLOOM_UMBRAL = 0.6; // desde qué brillo (0 a 1) algo empieza a tener halo

// La imagen intermedia: HalfFloatType deja guardar brillos mayores a 1 (más blancos que
// el blanco), y samples: 4 le pone antialias (sin eso los bordes quedan serruchados).
const imagenIntermedia = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
  samples: 4,
});
const composer = new EffectComposer(renderer, imagenIntermedia);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(escena, camara));
// UnrealBloomPass(tamaño, fuerza, radio, umbral)
composer.addPass(
  new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), BLOOM_FUERZA, BLOOM_RADIO, BLOOM_UMBRAL)
);
composer.addPass(new OutputPass());

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

// --- Cielo: del atardecer a la noche ---
// Cambia el color del cielo, de la niebla y de las dos luces de arriba, y baja el sol.
// Al atardecer, luzLuna hace de luz del sol (naranja) y de a poco pasa a ser la luna.
const cielo = crearCielo({ escena, luzGeneral, luzDirecta: luzLuna });

// El predio es un cuadrado de 500 x 500 metros (el piso se arma más abajo, ver "Piso").
const TAMANO_PREDIO = 500;

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
    banda: 'ciro', // los artistas que tocan arriba (ver artistas.js)
    trapos: ['AGUANTE CIRO', 'LANÚS PRESENTE', 'LOS PERSAS', 'MORÓN', 'LA PLATA'], // colgados en la valla
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
    banda: 'pastillas', // los artistas que tocan arriba (ver artistas.js)
    trapos: ['AGUANTE LAS PASTILLAS', 'QUILMES PRESENTE', 'EL PITI', 'SAN JUSTO', 'ROSARIO'], // colgados en la valla
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
    banda: 'calamaro', // los artistas que tocan arriba (ver artistas.js)
    trapos: ['AGUANTE EL SALMÓN', 'CÓRDOBA PRESENTE', 'CALAMARO', 'MAR DEL PLATA', 'TANDIL'], // colgados en la valla
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

// --- Barra de fernet y choripán ---
// Detrás del lugar donde arranca el jugador, entre los escenarios de Las Pastillas y
// de Calamaro, mirando al centro del predio.
const POSICION_BARRA = { x: 0, z: 40 };
const barra = crearBarra({ posicion: POSICION_BARRA, mirarHacia: CENTRO_PREDIO });
escena.add(barra.grupo);

// --- Piso (el predio) ---
// Pasto con tierra pisada delante de cada escenario y caminos al centro (ver predio.js).
const piso = crearPiso({
  tamano: TAMANO_PREDIO,
  escenarios: escenarios.map((escenario) => ({ x: escenario.position.x, z: escenario.position.z })),
  barra: POSICION_BARRA,
  // La anisotropía hace que el dibujo del piso no se vea borroso cuando lo miramos de costado.
  anisotropia: renderer.capabilities.getMaxAnisotropy(),
});
escena.add(piso);

// --- Banderines ---
// Guirnaldas de banderines y lamparitas en ronda alrededor del centro del predio.
const banderines = crearBanderines();
escena.add(banderines.grupo);

// --- Jugador ---
// Le pasamos las zonas sólidas de los tres escenarios, de la barra y de los postes de
// los banderines, y el borde del predio.
// flatMap junta las listas de colisiones de cada escenario en una sola lista;
// los "..." agregan las de la barra y los postes a esa misma lista.
const jugador = crearJugador(camara, document.body, {
  colisiones: [
    ...escenarios.flatMap((escenario) => escenario.userData.colisiones),
    ...barra.colisiones,
    ...banderines.colisiones,
  ],
  limitePredio: TAMANO_PREDIO / 2, // el predio va de -250 a 250 en X y en Z
});

// --- Acciones del recital (brazos, salto, cantar y pogo) ---
const acciones = crearAcciones({ camara, jugador, escenarios });

// --- Aguante-metro (la barra abajo a la derecha) ---
const aguante = crearAguanteMetro({ acciones, escenarioMasFuerte });

// --- Pedidos en la barra (fernet y choripán en la mano) ---
const pedidos = crearPedidos({ barra, acciones, jugador, camara });

// --- Pantalla de inicio, pausa y mira ---
// El mismo cartel sirve de pantalla de inicio y de pantalla de pausa:
// solo le cambiamos el título y el texto de abajo.
const pantallaInicio = document.getElementById('pantalla-inicio');
const tituloCartel = document.getElementById('titulo-cartel');
const textoClic = document.getElementById('texto-clic');
const mira = document.getElementById('mira');
const cartelAguante = document.getElementById('aguante');

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
  cartelAguante.style.display = 'block';
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
  cartelAguante.style.display = 'none';
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

// Devuelve el escenario cuya música se escucha más fuerte en este momento,
// o null si todavía no arrancó la música o si no se escucha ninguna.
// La usan el indicador, el aguante-metro y las pantallas en vivo.
function escenarioMasFuerte() {
  if (!musicaArrancada) {
    return null;
  }
  let masFuerte = null;
  let mayorVolumen = 0; // si ninguna banda supera 0 (no se oye nada), masFuerte queda en null
  for (const escenario of escenarios) {
    const volumen = escenario.userData.musica.volumen();
    if (volumen > mayorVolumen) {
      mayorVolumen = volumen;
      masFuerte = escenario;
    }
  }
  return masFuerte;
}

function actualizarIndicador() {
  const masFuerte = escenarioMasFuerte();

  let texto = '';
  if (masFuerte !== null) {
    // crearEscenario deja guardado el nombre de la banda en userData.
    const banda = masFuerte.userData.nombre;
    texto = '♪ ' + banda + ' — ' + masFuerte.userData.musica.temaActual().titulo;
  }

  // Solo tocamos la página si el texto cambió (cambiarla en cada cuadro es trabajo de más).
  if (indicadorTema.textContent !== texto) {
    indicadorTema.textContent = texto;
    indicadorTema.style.display = texto ? 'block' : 'none';
    // El borde del cartel toma el color de la banda (la variable --color-banda del CSS, ver index.html).
    if (masFuerte !== null) {
      const color = '#' + new THREE.Color(masFuerte.userData.color).getHexString();
      indicadorTema.style.setProperty('--color-banda', color);
    }
  }
}

// --- Ajuste al cambiar el tamaño de la ventana ---
window.addEventListener('resize', () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
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
  // Y cada público (con su banda y su show de luces) reacciona a la música de su escenario, salvo en pausa:
  // si el mouse no está capturado no lo actualizamos y queda congelado.
  // Lo mismo con las acciones del jugador. Van antes que el público, así el
  // contagio que le mandan se nota en este mismo cuadro.
  const enPausa = !jugador.controles.isLocked;
  if (!enPausa) {
    pedidos.actualizar(delta); // antes que acciones: cambia el gesto de llevar a la boca
    acciones.actualizar(delta);
    cielo.actualizar(delta);
  }
  for (const escenario of escenarios) {
    escenario.userData.musica.actualizarVolumen(camara.position);
    // Los aplausos bajan con la distancia igual que la música. En pausa no se escuchan.
    escenario.userData.aplausos.actualizarVolumen(enPausa ? 0 : escenario.userData.musica.volumen());
    if (!enPausa) {
      escenario.userData.publico.actualizar(delta);
      escenario.userData.banda.actualizar(delta);
      escenario.userData.luces.actualizar(delta);
      escenario.userData.fuegos.actualizar(delta);
    }
  }
  actualizarIndicador();
  if (!enPausa) {
    aguante.actualizar(delta);
    // Con el aguante-metro lleno, el cantante que más se escucha se da vuelta y saluda.
    const masFuerte = escenarioMasFuerte();
    if (aguante.lleno() && masFuerte !== null) {
      masFuerte.userData.banda.saludar(camara.position);
    }
  }

  // Pantallas en vivo: filmamos solo el escenario que más se escucha, porque filmar es
  // dibujar la escena otra vez (hacerlo con los tres sería pesado). Las otras dos muestran
  // el color de su banda. En pausa no filmamos: queda congelada la última imagen.
  const filmado = escenarioMasFuerte();
  for (const escenario of escenarios) {
    if (escenario !== filmado) {
      escenario.userData.pantalla.ponerColor(renderer);
    } else if (!enPausa) {
      escenario.userData.pantalla.filmar(renderer, escena, delta);
    }
  }

  // Dibujamos el cuadro: con bloom pasa por el composer, sin bloom va directo a la pantalla.
  if (USAR_BLOOM) {
    composer.render(delta);
  } else {
    renderer.render(escena, camara);
  }
}
requestAnimationFrame(animar);
