// El celular del jugador: con la tecla X lo saca (sube la mano con el celular, como
// cuando uno filma un recital) y con X otra vez lo guarda.
// Solo se puede sacar con la mano libre: si tiene un fernet o un choripán, primero
// tiene que terminarlo.
// Con el celular afuera, cada clic saca una foto: flash, ruido de obturador y la foto
// aparece un momento en la pantalla del celular. Las fotos quedan guardadas en una lista
// (mientras no se recargue la página).
// Si te lo roban (ver robo.js), te quedás sin celular y sin fotos.
import * as THREE from 'three';
import { piezaEnMano } from './barra.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const TECLA_CELULAR = 'KeyX';
const VELOCIDAD_SACAR = 3; // con 3 tarda 1/3 de segundo en subir o bajar la mano
const SEGUNDOS_AVISO = 2; // cuánto dura el aviso al apretar X sin poder sacarlo

// --- Fotos ---
// Las fotos son verticales, como se sostiene el celular: 9 de ancho por 16 de alto.
const ANCHO_FOTO = 270; // píxeles
const ALTO_FOTO = 480;
const CALIDAD_FOTO = 0.85; // de 0 a 1: calidad del JPG (más baja = ocupa menos memoria)
const MAXIMO_FOTOS = 30; // con más, se borra la más vieja
const SEGUNDOS_ENTRE_FOTOS = 0.5; // para que no saque 10 fotos por segundo
const SEGUNDOS_VISTA_PREVIA = 1.2; // cuánto se ve la foto en la pantalla del celular
const FUERZA_FLASH = 0.7; // de 0 a 1: qué tan blanco se pone la pantalla con el flash
const VELOCIDAD_FLASH = 3; // con 3, el flash se apaga en 1/3 de segundo

// --- Medidas del celular, en metros ---
const ANCHO_CELULAR = 0.075;
const ALTO_CELULAR = 0.15;
const GROSOR_CELULAR = 0.012;
const BORDE_PANTALLA = 0.005; // el marco negro alrededor de la pantalla

// ---------------------------------------------------------------------------
// La pantalla: un dibujo de la app de cámara
// ---------------------------------------------------------------------------

// Dibujamos la pantalla en un canvas 2D (como una imagen) y la usamos de textura.
// Normalmente muestra la app de cámara: un fondo oscuro, las esquinas del encuadre y el
// botón para sacar la foto. Al sacar una foto, muestra la foto un momento.
// La usan los dos celulares (primera y tercera persona).
const lienzoPantalla = document.createElement('canvas');
lienzoPantalla.width = 128;
lienzoPantalla.height = 256;
const texturaPantalla = new THREE.CanvasTexture(lienzoPantalla);
texturaPantalla.colorSpace = THREE.SRGBColorSpace; // los colores del canvas, tal como los dibujamos

function dibujarAppDeCamara() {
  const canvas = lienzoPantalla;
  const ctx = canvas.getContext('2d');

  // Fondo: un degradé de azul oscuro (arriba) a casi negro (abajo).
  const degrade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  degrade.addColorStop(0, '#2b3a67');
  degrade.addColorStop(1, '#0d0f1a');
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Esquinas del encuadre: cuatro "L" blancas.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  const margen = 16;
  const largo = 20;
  const abajo = canvas.height - 64; // el encuadre termina antes del botón
  const esquinas = [
    [margen, margen, 1, 1], // arriba a la izquierda (x, y, hacia dónde van las líneas)
    [canvas.width - margen, margen, -1, 1],
    [margen, abajo, 1, -1],
    [canvas.width - margen, abajo, -1, -1],
  ];
  for (const [x, y, dx, dy] of esquinas) {
    ctx.beginPath();
    ctx.moveTo(x + largo * dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + largo * dy);
    ctx.stroke();
  }

  // Botón para sacar la foto: un círculo blanco con un aro alrededor.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - 32, 19, 0, Math.PI * 2);
  ctx.stroke();

  texturaPantalla.needsUpdate = true; // avisa a Three.js que el dibujo cambió
}
dibujarAppDeCamara();

// Muestra una foto en la pantalla del celular (la vista previa).
function dibujarFotoEnPantalla(foto) {
  lienzoPantalla.getContext('2d').drawImage(foto, 0, 0, lienzoPantalla.width, lienzoPantalla.height);
  texturaPantalla.needsUpdate = true;
}

// Ruido del obturador: dos "clics" cortitos de ruido (como "chi-chik"). Lo armamos con
// números al azar en vez de usar un mp3: cada muestra es un valor de −1 a 1, y lo
// multiplicamos por una curva que se apaga rápido (exponencial), así suena como un golpe.
function crearSonidoObturador(contexto) {
  const duracion = 0.15; // segundos
  const muestras = Math.floor(contexto.sampleRate * duracion);
  const buffer = contexto.createBuffer(1, muestras, contexto.sampleRate); // 1 canal (mono)
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < muestras; i++) {
    const t = i / contexto.sampleRate; // segundos desde el principio
    let volumen = Math.exp(-t * 80); // primer clic
    if (t > 0.07) {
      volumen += 0.7 * Math.exp(-(t - 0.07) * 80); // segundo clic, un poco más suave
    }
    datos[i] = (Math.random() * 2 - 1) * volumen * 0.5;
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// Los dos modelos del celular
// ---------------------------------------------------------------------------

// Celular para la mano de primera persona. Como el vaso de fernet (ver barra.js), se dibuja
// siempre por encima del resto. La pantalla mira hacia +Z, o sea hacia la cámara.
function crearCelularEnMano() {
  const grupo = new THREE.Group();
  grupo.position.set(-0.03, 0.08, 0); // arriba de la mano, un poco hacia el centro

  const cuerpo = piezaEnMano(new THREE.BoxGeometry(ANCHO_CELULAR, ALTO_CELULAR, GROSOR_CELULAR), 0x1c1c22, 102);

  // La pantalla brilla sola (MeshBasicMaterial no depende de las luces), como un celular de verdad.
  const pantalla = new THREE.Mesh(
    new THREE.PlaneGeometry(ANCHO_CELULAR - BORDE_PANTALLA * 2, ALTO_CELULAR - BORDE_PANTALLA * 2),
    new THREE.MeshBasicMaterial({ map: texturaPantalla, depthTest: false, transparent: true })
  );
  pantalla.position.z = GROSOR_CELULAR / 2 + 0.001; // apenas delante del cuerpo
  pantalla.renderOrder = 103; // después del cuerpo, así queda encima

  // El pulgar, agarrando el celular del costado derecho (del lado de la mano).
  const pulgar = piezaEnMano(new THREE.BoxGeometry(0.018, 0.05, 0.02), 0xf1c27d, 104);
  pulgar.material.emissive.setHex(0x2a1a10); // el mismo brillo que la mano (ver acciones.js)
  pulgar.position.set(ANCHO_CELULAR / 2, -0.03, 0);

  grupo.add(cuerpo, pantalla, pulgar);
  return grupo;
}

/**
 * Crea un celular "normal" (que respeta lo que tiene delante), para el cuerpo de tercera
 * persona. La pantalla mira hacia −Z: hacia la cara de quien lo sostiene.
 * @returns {THREE.Group}
 */
export function crearCelularDelCuerpo() {
  const grupo = new THREE.Group();
  const cuerpo = new THREE.Mesh(
    new THREE.BoxGeometry(ANCHO_CELULAR, ALTO_CELULAR, GROSOR_CELULAR),
    new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.5 })
  );
  const pantalla = new THREE.Mesh(
    new THREE.PlaneGeometry(ANCHO_CELULAR - BORDE_PANTALLA * 2, ALTO_CELULAR - BORDE_PANTALLA * 2),
    new THREE.MeshBasicMaterial({ map: texturaPantalla })
  );
  pantalla.position.z = -GROSOR_CELULAR / 2 - 0.001;
  pantalla.rotation.y = Math.PI; // dada vuelta, para que mire hacia −Z
  grupo.add(cuerpo, pantalla);
  return grupo;
}

// ---------------------------------------------------------------------------
// Sacar y guardar el celular
// ---------------------------------------------------------------------------

/**
 * Maneja el celular del jugador.
 *
 * @param {object} opciones
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (la mano y el gesto)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para saber si puede actuar)
 * @param {THREE.PerspectiveCamera} opciones.camara  La cámara del jugador (la foto sale desde ahí)
 * @param {THREE.AudioListener} opciones.oyente  Los "oídos" del jugador (para el obturador)
 * @param {() => string} opciones.describirFoto  Devuelve el texto que va abajo de cada foto
 * @returns {{ actualizar: (delta: number) => void, soltar: () => void,
 *             camaraParaFoto: () => THREE.PerspectiveCamera | null,
 *             guardarFoto: (lienzo: HTMLCanvasElement) => void,
 *             fotos: () => Array<{imagen: string, descripcion: string}>, estaAfuera: () => boolean,
 *             robar: () => void, estaRobado: () => boolean }}
 *  - soltar: lo guarda de golpe, sin animación (al desmayarse).
 *  - camaraParaFoto y guardarFoto: para sacar la foto (ver el bucle de animación en main.js).
 *  - fotos: la lista de fotos, de la más vieja a la más nueva (la usa galeria.js).
 *  - estaAfuera: si el jugador tiene el celular afuera (lo usa robo.js).
 *  - robar: se lo sacan de la mano (lo llama robo.js). estaRobado: si ya se lo robaron.
 */
export function crearCelular({ acciones, jugador, camara, oyente, describirFoto }) {
  const aviso = document.getElementById('aviso-celular');
  const flash = document.getElementById('flash-foto');
  const celular = crearCelularEnMano();

  // La cámara de las fotos: se pone justo donde están los ojos del jugador. Solo ve la
  // capa 0 (las cámaras nuevas vienen así): no ve los brazos ni el celular, que están en la
  // capa de primera persona, ni el cuerpo de tercera persona (ver terceraPersona.js).
  const camaraFoto = new THREE.PerspectiveCamera();

  // Canvas 2D donde recortamos cada foto antes de guardarla.
  const lienzoFoto = document.createElement('canvas');
  lienzoFoto.width = ANCHO_FOTO;
  lienzoFoto.height = ALTO_FOTO;

  // El ruido del obturador. THREE.Audio (no posicional): suena igual desde cualquier lugar.
  // Pasa por el oyente, así que también lo apaga la tecla M.
  const obturador = new THREE.Audio(oyente);
  obturador.setBuffer(crearSonidoObturador(oyente.context));

  // Las fotos: cada una es { imagen, descripcion }. imagen es la foto en formato de texto
  // ("data URL"), que se puede poner directo en un <img>.
  const fotos = [];

  let afuera = false; // si el jugador quiere tenerlo afuera (lo cambia la tecla X)
  let subido = 0; // 0 = guardado, 1 = en alto. Va cambiando de a poco
  let robado = false; // si se lo robaron (ver robo.js)
  let textoAviso = ''; // aviso al apretar X sin poder sacarlo ("manos ocupadas", "te lo robaron")
  let tiempoAviso = 0; // segundos que le quedan a ese aviso
  let fotoPendiente = false; // hizo clic: la foto se saca al dibujar el próximo cuadro
  let tiempoDesdeFoto = SEGUNDOS_ENTRE_FOTOS; // segundos desde la última foto
  let tiempoVistaPrevia = 0; // segundos que le quedan a la foto en la pantalla del celular
  let brilloFlash = 0; // de 0 a 1

  // ¿Tiene el celular en la mano? (también mientras lo está subiendo o bajando)
  function enLaMano() {
    return celular.parent === acciones.manoDerecha;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== TECLA_CELULAR || event.repeat || !jugador.puedeActuar()) {
      return;
    }
    if (robado) {
      textoAviso = '😢 Te robaron el celu';
      tiempoAviso = SEGUNDOS_AVISO;
    } else if (afuera) {
      afuera = false; // lo guarda: baja la mano y, abajo del todo, lo sacamos (ver actualizar)
    } else if (enLaMano() || acciones.manoDerecha.children.length === 0) {
      // Con la mano libre (o con el celular bajando todavía), lo saca.
      afuera = true;
      acciones.manoDerecha.add(celular);
    } else {
      // Tiene un fernet o un choripán en la mano.
      textoAviso = '✋ Tenés las manos ocupadas';
      tiempoAviso = SEGUNDOS_AVISO;
    }
  });

  // Clic (botón izquierdo = 0): sacar una foto, si el celular ya está en alto.
  document.addEventListener('mousedown', (event) => {
    if (event.button === 0 && jugador.puedeActuar() && afuera && subido === 1 &&
        tiempoDesdeFoto >= SEGUNDOS_ENTRE_FOTOS) {
      fotoPendiente = true;
    }
  });

  // En pausa escondemos el aviso (igual que los cartelitos de acciones.js).
  jugador.controles.addEventListener('unlock', () => mostrar(''));

  function mostrar(texto) {
    if (aviso.textContent !== texto) {
      aviso.textContent = texto;
      aviso.style.display = texto ? 'block' : 'none';
    }
  }

  // Si hay que sacar una foto, devuelve la cámara con la que hay que dibujarla
  // (puesta en los ojos del jugador); si no, null.
  function camaraParaFoto() {
    if (!fotoPendiente) {
      return null;
    }
    // Mismo campo de visión y proporción que la cámara del jugador, y en el mismo lugar.
    camaraFoto.fov = camara.fov;
    camaraFoto.aspect = camara.aspect;
    camaraFoto.near = camara.near;
    camaraFoto.far = camara.far;
    camaraFoto.updateProjectionMatrix();
    camara.getWorldPosition(camaraFoto.position);
    camara.getWorldQuaternion(camaraFoto.quaternion);
    return camaraFoto;
  }

  /**
   * Guarda la foto. Se llama justo después de dibujar el cuadro con camaraParaFoto, antes de
   * que el navegador muestre el cuadro (después, el canvas de WebGL se borra).
   * @param {HTMLCanvasElement} lienzo  El canvas donde dibuja Three.js
   */
  function guardarFoto(lienzo) {
    fotoPendiente = false;
    tiempoDesdeFoto = 0;

    // Recortamos el medio del cuadro con la forma de la foto (vertical) y lo achicamos.
    // drawImage(imagen, x, y, ancho, alto [lo que se recorta], 0, 0, ancho, alto [dónde va]).
    // Math.min: si la ventana es muy angosta, el recorte no puede ser más ancho que ella.
    const anchoRecorte = Math.min(lienzo.width, (lienzo.height * ANCHO_FOTO) / ALTO_FOTO);
    const altoRecorte = (anchoRecorte * ALTO_FOTO) / ANCHO_FOTO;
    const x = (lienzo.width - anchoRecorte) / 2;
    const y = (lienzo.height - altoRecorte) / 2;
    lienzoFoto.getContext('2d').drawImage(lienzo, x, y, anchoRecorte, altoRecorte, 0, 0, ANCHO_FOTO, ALTO_FOTO);

    fotos.push({ imagen: lienzoFoto.toDataURL('image/jpeg', CALIDAD_FOTO), descripcion: describirFoto() });
    if (fotos.length > MAXIMO_FOTOS) {
      fotos.shift(); // shift saca la primera de la lista: la más vieja
    }

    // Flash, ruido y vista previa en el celular.
    brilloFlash = 1;
    if (obturador.isPlaying) {
      obturador.stop(); // si todavía sonaba el anterior, lo cortamos para que vuelva a sonar
    }
    obturador.play();
    dibujarFotoEnPantalla(lienzoFoto);
    tiempoVistaPrevia = SEGUNDOS_VISTA_PREVIA;
  }

  // Se lo roban: desaparece de la mano y, con él, las fotos.
  function robar() {
    soltar();
    robado = true;
    fotos.length = 0; // vacía la lista
  }

  // Lo guarda de golpe, sin animación.
  function soltar() {
    afuera = false;
    fotoPendiente = false;
    subido = 0;
    acciones.gesto.celular = 0;
    acciones.manoDerecha.remove(celular);
  }

  /**
   * Se llama en cada cuadro, salvo en pausa (ver main.js). Antes que acciones.actualizar,
   * porque le cambia el gesto al brazo.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // La mano sube o baja de a poco (como los brazos en acciones.js).
    const paso = VELOCIDAD_SACAR * delta;
    subido = afuera ? Math.min(1, subido + paso) : Math.max(0, subido - paso);
    // Con la mano abajo del todo, el celular se guarda en el bolsillo.
    if (!afuera && subido === 0 && enLaMano()) {
      acciones.manoDerecha.remove(celular);
    }
    // smoothstep: arranca y frena despacio, en vez de moverse a velocidad pareja.
    acciones.gesto.celular = subido * subido * (3 - 2 * subido);

    // --- Fotos: tiempos, flash y vista previa ---
    tiempoDesdeFoto += delta;
    brilloFlash = Math.max(0, brilloFlash - VELOCIDAD_FLASH * delta);
    flash.style.opacity = brilloFlash * FUERZA_FLASH;
    if (tiempoVistaPrevia > 0) {
      tiempoVistaPrevia -= delta;
      if (tiempoVistaPrevia <= 0) {
        dibujarAppDeCamara(); // terminó la vista previa: vuelve la app de cámara
      }
    }

    // --- Aviso en pantalla ---
    tiempoAviso = Math.max(0, tiempoAviso - delta);
    let texto = '';
    if (tiempoAviso > 0) {
      texto = textoAviso;
    } else if (afuera) {
      texto = '📱 Clic: sacar foto (' + fotos.length + ')   ·   X: guardar el celu';
    }
    mostrar(texto);
  }

  return {
    actualizar, soltar, camaraParaFoto, guardarFoto, robar,
    fotos: () => fotos,
    estaAfuera: () => afuera,
    estaRobado: () => robado,
  };
}
