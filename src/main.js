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
import { crearGrilla } from './grilla.js';
import { crearChica } from './chica.js';
import { crearGenteDelMedio } from './gente.js';
import { crearVallas } from './vallas.js';
import { crearPortal } from './portal.js';
import { crearTerceraPersona } from './terceraPersona.js';

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
// La posición inicial del jugador (en la entrada del predio) se pone más abajo,
// junto con las vallas: ver "Vallas y entrada".
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
// La guardamos en una variable para poder cambiarle la cámara (ver la vista en tercera persona).
const pasadaEscena = new RenderPass(escena, camara);
composer.addPass(pasadaEscena);
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

// El piso es un cuadrado de 500 x 500 metros (se arma más abajo, ver "Piso"). Es más
// grande que el predio, que termina en las vallas: así del otro lado también se ve pasto.
const TAMANO_PREDIO = 500;

// --- Escenarios ---
// Como en un festival real, los tres escenarios forman un triángulo y todos miran
// hacia una zona central, el centro del predio (0, 0).
// Sus centros están a 80 m de ese punto y separados 120° entre sí (un triángulo equilátero):
//  - Escenario Rojo al frente (cierra Ciro y los Persas):                    (0, -80)
//  - Escenario Ámbar atrás a la izquierda (cierran Las Pastillas del Abuelo): (-69, 40)
//  - Escenario Celeste atrás a la derecha (cierra Andrés Calamaro):          (69, 40)
// Así hay unos 140 m de un escenario a otro. Caminando (5 m/s) se tarda unos 20 segundos
// en ir del público de un escenario al del otro, y corriendo (Shift) la mitad.
const CENTRO_PREDIO = { x: 0, z: 0 };

// --- Vallas y entrada ---
// El predio es un cuadrado cerrado por vallas, de -120 a 120 m en X y en Z.
// Los escenarios (con su parte de atrás) llegan hasta unos 87 m del centro: quedan
// más de 30 m de pasto detrás de cada uno.
const LIMITE_VALLAS = 120; // metros desde el centro hasta las vallas
// La entrada: un hueco en el medio de la valla del frente (+Z, entre los escenarios Ámbar
// y Celeste), con el portal del festival arriba. Del lado de afuera hay un pasillo vallado.
const ENTRADA = { ancho: 12, largo: 24 }; // metros: ancho del hueco (y del pasillo) y largo del pasillo
escena.add(crearVallas(LIMITE_VALLAS, ENTRADA));
const portal = crearPortal({ z: LIMITE_VALLAS, anchoPuerta: ENTRADA.ancho });
escena.add(portal.grupo);

// Posición inicial del jugador: afuera, en el pasillo de la entrada, a 18 m del portal y
// mirándolo (detrás se ve el predio). Quedan 6 m hasta el fondo del pasillo: lugar para la
// cámara de tercera persona, que va atrás del jugador. La altura (1.7 m, los ojos de una
// persona) la fija el jugador en jugador.js.
camara.position.set(0, 1.7, LIMITE_VALLAS + ENTRADA.largo - 6);
camara.lookAt(0, 6, LIMITE_VALLAS);

// --- Programación de cada escenario (la grilla del festival, tecla G) ---
// En cada escenario tocan tres bandas, una después de la otra (ver crearProgramacion en
// escenario.js). Cada banda sube cuando el reloj llega a su "inicio" y se baja cuando
// termina su último tema; "fin" es el horario que muestra la grilla.
// Las de la tarde tocan dos temas: uno tranqui y uno para el pogo (conocido: true).
// La banda de la noche (la última) repite su lista sin parar.
// Los mp3 van en public/audio con estos nombres de archivo (ver el README).
const escenarios = [
  crearEscenario({
    nombre: 'Escenario Rojo',
    color: 0xff3355, // rojo
    posicion: { x: 0, z: -80 },
    mirarHacia: CENTRO_PREDIO,
    oyente: oyente,
    lineup: [
      {
        banda: 'guasones', // los artistas que suben (ver crearBanda en artistas.js)
        nombre: 'Guasones',
        inicio: '18:00',
        fin: '19:15',
        temas: [
          { archivo: 'guasones_tranqui_pasanlashoras.mp3', titulo: 'Pasan las horas', conocido: false },
          { archivo: 'guasones_conocido_reyesdelanoche.mp3', titulo: 'Reyes de la noche', conocido: true },
        ],
        trapos: ['GUASONES', 'LA PLATA PRESENTE', 'ROCK STONE', 'BERISSO', 'ENSENADA'], // colgados en la valla
      },
      {
        banda: 'callejeros',
        nombre: 'Callejeros',
        inicio: '19:30',
        fin: '20:45',
        temas: [
          { archivo: 'callejeros_tranqui_unanuevanochefria.mp3', titulo: 'Una nueva noche fría', conocido: false },
          { archivo: 'callejeros_conocido_rocanrolessindestino.mp3', titulo: 'Rocanroles sin destino', conocido: true },
        ],
        trapos: ['CALLEJEROS', 'VILLA CELINA', 'ROCK BARRIAL', 'LA MATANZA', 'CIUDADELA'],
        // Sin fuegos artificiales en el show de Callejeros, por respeto a las víctimas de Cromañón.
        fuegos: false,
      },
      {
        banda: 'ciro',
        nombre: 'Ciro y los Persas',
        inicio: '21:00',
        fin: '23:00',
        temas: [
          { archivo: 'ciro_conocido_astros.mp3', titulo: 'Astros', conocido: true },
          { archivo: 'ciro_tranqui_servidor.mp3', titulo: 'Servidor', conocido: false },
        ],
        trapos: ['AGUANTE CIRO', 'LANÚS PRESENTE', 'LOS PERSAS', 'MORÓN', 'LA PLATA'],
      },
    ],
  }),
  crearEscenario({
    nombre: 'Escenario Ámbar',
    color: 0xff9900, // ámbar
    posicion: { x: -69, z: 40 },
    mirarHacia: CENTRO_PREDIO,
    oyente: oyente,
    lineup: [
      {
        banda: 'turf',
        nombre: 'Turf',
        inicio: '18:10',
        fin: '19:25',
        temas: [
          { archivo: 'turf_tranqui_locounpoco.mp3', titulo: 'Loco un poco', conocido: false },
          { archivo: 'turf_conocido_pasosalcostado.mp3', titulo: 'Pasos al costado', conocido: true },
        ],
        trapos: ['TURF', 'BELGRANO PRESENTE', 'LEVINTON', 'NÚÑEZ', 'LOCOS UN POCO'],
      },
      {
        banda: 'intoxicados',
        nombre: 'Intoxicados',
        inicio: '19:40',
        fin: '20:55',
        temas: [
          { archivo: 'intoxicados_tranqui_nuncaquise.mp3', titulo: 'Nunca quise', conocido: false },
          { archivo: 'intoxicados_conocido_quierenrock.mp3', titulo: 'Quieren rock', conocido: true },
        ],
        trapos: ['INTOXICADOS', 'QUE SEA ROCK', 'EL PITY', 'LUGANO', 'MATADEROS'],
      },
      {
        banda: 'pastillas',
        nombre: 'Las Pastillas del Abuelo',
        inicio: '21:10',
        fin: '23:10',
        temas: [
          { archivo: 'pastillas_conocido_viejokarma.mp3', titulo: 'Viejo Karma', conocido: true },
          { archivo: 'pastillas_tranqui_mejuegoelcorazon.mp3', titulo: 'Me juego el corazón', conocido: false },
        ],
        trapos: ['AGUANTE LAS PASTILLAS', 'QUILMES PRESENTE', 'EL PITI', 'SAN JUSTO', 'ROSARIO'],
      },
    ],
  }),
  crearEscenario({
    nombre: 'Escenario Celeste',
    color: 0x33aaff, // celeste
    posicion: { x: 69, z: 40 },
    mirarHacia: CENTRO_PREDIO,
    oyente: oyente,
    lineup: [
      {
        banda: 'ntvg',
        nombre: 'No Te Va Gustar',
        inicio: '18:20',
        fin: '19:35',
        temas: [
          { archivo: 'ntvg_tranqui_alasnueve.mp3', titulo: 'A las nueve', conocido: false },
          { archivo: 'ntvg_conocido_chau.mp3', titulo: 'Chau', conocido: true },
        ],
        trapos: ['NO TE VA GUSTAR', 'URUGUAY PRESENTE', 'NTVG', 'MONTEVIDEO', 'EL CERRO'],
        // Las bandas uruguayas: en el público flamean banderas de Uruguay (ver publico.js).
        banderas: ['uruguay', 'uruguay', 'argentina'],
      },
      {
        banda: 'velapuerca',
        nombre: 'La Vela Puerca',
        inicio: '19:50',
        fin: '21:05',
        temas: [
          { archivo: 'velapuerca_tranqui_llenosdemagia.mp3', titulo: 'Llenos de magia', conocido: false },
          { archivo: 'velapuerca_conocido_zafar.mp3', titulo: 'Zafar', conocido: true },
        ],
        trapos: ['LA VELA PUERCA', 'VAMO ARRIBA', 'MONTEVIDEO', 'LA VELA', 'URUGUAY'],
        banderas: ['uruguay', 'uruguay', 'argentina'],
      },
      {
        banda: 'calamaro',
        nombre: 'Andrés Calamaro',
        inicio: '21:20',
        fin: '23:20',
        temas: [
          { archivo: 'calamaro_conocido_sindocumentos.mp3', titulo: 'Sin documentos', conocido: true },
          { archivo: 'calamaro_medio_todaviaunacanciondeamor.mp3', titulo: 'Todavía una canción de amor', conocido: false },
          { archivo: 'calamaro_tranqui_buenasuerteyhastaluego.mp3', titulo: 'Buena suerte y hasta luego', conocido: false },
        ],
        trapos: ['AGUANTE EL SALMÓN', 'CÓRDOBA PRESENTE', 'CALAMARO', 'MAR DEL PLATA', 'TANDIL'],
      },
    ],
  }),
];

for (const escenario of escenarios) {
  escena.add(escenario);
}

// --- Barra de fernet y choripán ---
// Entre la entrada y el centro del predio (entre los escenarios Ámbar y Celeste),
// mirando al centro.
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

// --- Gente en el medio del predio (rondas de amigos y mantitas de chill) ---
// Le pasamos los postes de los banderines para que nadie quede encima de uno.
const genteDelMedio = crearGenteDelMedio({ obstaculos: banderines.colisiones });
escena.add(genteDelMedio.grupo);

// --- Jugador ---
// Le pasamos las zonas sólidas de los tres escenarios, de la barra, de los postes de
// los banderines y de las columnas del portal, y el borde del predio (las vallas y
// el pasillo de la entrada).
// flatMap junta las listas de colisiones de cada escenario en una sola lista;
// los "..." agregan las de la barra y los postes a esa misma lista.
const jugador = crearJugador(camara, document.body, {
  colisiones: [
    ...escenarios.flatMap((escenario) => escenario.userData.colisiones),
    ...barra.colisiones,
    ...banderines.colisiones,
    ...portal.colisiones,
  ],
  limitePredio: LIMITE_VALLAS, // no puede pasar las vallas: de -120 a 120 en X y en Z...
  entrada: ENTRADA, // ...salvo por la puerta, hacia el pasillo de la entrada
});

// --- Acciones del recital (brazos, salto, cantar y pogo) ---
const acciones = crearAcciones({ camara, jugador, escenarios });

// --- Aguante-metro (la barra abajo a la derecha) ---
const aguante = crearAguanteMetro({ acciones, escenarioMasFuerte });

// --- Pedidos en la barra (fernet y choripán en la mano) ---
const pedidos = crearPedidos({ barra, acciones, jugador, camara });

// --- Reloj del festival y grilla de horarios (tecla G) ---
// El reloj manda: con su hora cada escenario sube a la banda que toca y el cielo oscurece.
const grilla = crearGrilla(jugador, escenarios);
cielo.actualizar(grilla.minutos()); // el cielo arranca con la hora del reloj

// --- Vista en tercera persona (tecla V) ---
// El cuerpo del jugador y una cámara que lo filma desde atrás.
const terceraPersona = crearTerceraPersona({ escena, camara, jugador, acciones });

// --- La chica que pide subirse a los hombros (con los temas tranquis) ---
// En tercera persona se sienta en los hombros del cuerpo del jugador.
const chica = crearChica({ escena, camara, jugador, escenarios, hombros: terceraPersona.hombros });

// --- Pantalla de inicio, pausa y mira ---
// El mismo cartel sirve de pantalla de inicio y de pantalla de pausa:
// solo le cambiamos el título y el texto de abajo.
const pantallaInicio = document.getElementById('pantalla-inicio');
const tituloCartel = document.getElementById('titulo-cartel');
const textoClic = document.getElementById('texto-clic');
const mira = document.getElementById('mira');
const cartelAguante = document.getElementById('aguante');

// Al hacer clic en el cartel capturamos el mouse y empieza el juego.
pantallaInicio.addEventListener('click', () => {
  jugador.controles.lock();
  // Los navegadores no dejan reproducir sonido hasta que el usuario interactúa con
  // la página. Por eso el sonido se activa acá, con el clic. (La música empieza cuando
  // sube la primera banda: eso lo decide la programación de cada escenario.)
  oyente.context.resume(); // el sonido del navegador empieza "suspendido"
});

// Mouse capturado: se juega. Escondemos el cartel, mostramos la mira y la música
// de los tres escenarios sigue desde donde quedó (si no estaba tocando nadie, no pasa nada).
jugador.controles.addEventListener('lock', () => {
  pantallaInicio.style.display = 'none';
  mira.style.display = 'block';
  cartelAguante.style.display = 'block';
  for (const escenario of escenarios) {
    escenario.userData.musica.reanudar();
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
// o null si no se escucha ninguna. Solo cuentan los escenarios donde hay una banda
// tocando (entre una banda y otra, el escenario está vacío).
// La usan el indicador, el aguante-metro y las pantallas en vivo.
function escenarioMasFuerte() {
  let masFuerte = null;
  let mayorVolumen = 0; // si ninguna banda supera 0 (no se oye nada), masFuerte queda en null
  for (const escenario of escenarios) {
    if (!escenario.userData.musica.hayShow()) {
      continue; // no toca nadie: lo salteamos
    }
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
    // La programación deja guardado en userData el nombre de la banda que toca.
    const banda = masFuerte.userData.nombre;
    const musica = masFuerte.userData.musica;
    texto = '♪ ' + banda + ' — ' + musica.temaActual().titulo;
    // Si falta el mp3, lo avisamos (la banda "toca" en silencio un rato, ver musica.js).
    if (musica.faltaAudio()) {
      texto += ' (falta el mp3)';
    }
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
    grilla.actualizar(delta); // avanza el reloj...
    cielo.actualizar(grilla.minutos()); // ...y con su hora, el cielo
    for (const escenario of escenarios) {
      // ...y la programación: si es la hora, sube la banda que sigue.
      escenario.userData.programacion.actualizar(grilla.minutos());
    }
    chica.actualizar(delta);
    genteDelMedio.actualizar(delta);
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

  // Cuerpo del jugador y cámara de tercera persona (también en pausa: así la vista no se rompe).
  terceraPersona.actualizar(delta);

  // Dibujamos el cuadro con la cámara de la vista elegida (primera o tercera persona):
  // con bloom pasa por el composer, sin bloom va directo a la pantalla.
  const camaraVista = terceraPersona.camaraActiva();
  if (USAR_BLOOM) {
    pasadaEscena.camera = camaraVista;
    composer.render(delta);
  } else {
    renderer.render(escena, camaraVista);
  }
}
requestAnimationFrame(animar);
