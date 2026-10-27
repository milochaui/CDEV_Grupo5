// Barra de fernet y choripán: un puesto en el predio con su barman y su parrilla.
// Parado frente a la barra, el jugador pide un fernet (R) o un choripán (C) y lo ve en
// su mano. Con clic toma un trago o da un mordisco, hasta que se termina.
import * as THREE from 'three';
import { crearPersona, posar } from './artistas.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const TECLA_FERNET = 'KeyR';
const TECLA_CHORI = 'KeyC';
const DISTANCIA_PARA_PEDIR = 4; // metros desde el frente de la barra
const TRAGOS_POR_FERNET = 4;
const MORDISCOS_POR_CHORI = 3;
const DURACION_BOCADO = 0.9; // segundos: llevar a la boca y volver

// --- Medidas del puesto, en metros ---
const ANCHO_PUESTO = 7;
const ALTO_MOSTRADOR = 1.1;
const ALTO_TECHO = 2.8;
const FONDO_PUESTO = 2.4; // desde el frente del mostrador hasta la pared de atrás

// ---------------------------------------------------------------------------
// El puesto
// ---------------------------------------------------------------------------

/**
 * Crea el puesto. Se arma con el frente (donde se pide) hacia +Z y después se gira
 * para mirar hacia "mirarHacia", igual que los escenarios.
 *
 * @param {object} config
 * @param {{x: number, z: number}} config.posicion
 * @param {{x: number, z: number}} config.mirarHacia
 * @returns {{ grupo: THREE.Group, colisiones: Array, frente: THREE.Vector3 }}
 *          frente: el lugar del predio donde se para el que pide (ver crearPedidos)
 */
export function crearBarra(config) {
  const grupo = new THREE.Group();

  const madera = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
  const maderaClara = new THREE.MeshStandardMaterial({ color: 0x9c6b3f, roughness: 0.9 });
  const oscuro = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Agrega una caja al puesto: (ancho, alto, profundidad) y su centro (x, y, z).
  function caja(material, ancho, alto, profundidad, x, y, z) {
    const malla = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, profundidad), material);
    malla.position.set(x, y, z);
    grupo.add(malla);
    return malla;
  }

  // --- Mostrador, pared de atrás, techo y postes ---
  caja(madera, ANCHO_PUESTO - 1, ALTO_MOSTRADOR, 0.8, 0, ALTO_MOSTRADOR / 2, 0);
  caja(maderaClara, ANCHO_PUESTO - 0.8, 0.06, 1, 0, ALTO_MOSTRADOR + 0.03, 0); // tabla de arriba
  caja(oscuro, ANCHO_PUESTO, ALTO_TECHO, 0.15, 0, ALTO_TECHO / 2, -FONDO_PUESTO);
  caja(madera, ANCHO_PUESTO + 0.4, 0.15, FONDO_PUESTO + 1.2, 0, ALTO_TECHO, -FONDO_PUESTO / 2 + 0.3);
  const geometriaPoste = new THREE.CylinderGeometry(0.08, 0.08, ALTO_TECHO, 6);
  for (const x of [-ANCHO_PUESTO / 2, ANCHO_PUESTO / 2]) {
    for (const z of [0.6, -FONDO_PUESTO]) {
      const poste = new THREE.Mesh(geometriaPoste, madera);
      poste.position.set(x, ALTO_TECHO / 2, z);
      grupo.add(poste);
    }
  }

  // --- Guirnalda de lamparitas en el borde del techo ---
  // MeshBasicMaterial: brillan solas, sin necesitar una luz de verdad (más liviano).
  const geometriaLamparita = new THREE.SphereGeometry(0.07, 8, 6);
  const materialLamparita = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  for (let i = 0; i <= 12; i++) {
    const lamparita = new THREE.Mesh(geometriaLamparita, materialLamparita);
    lamparita.position.set(-ANCHO_PUESTO / 2 + (ANCHO_PUESTO * i) / 12, ALTO_TECHO - 0.15, 0.85);
    grupo.add(lamparita);
  }

  // --- Cartel ---
  crearCartelBarra(grupo);

  // --- Botellas de fernet y vasos servidos sobre el mostrador ---
  const vidrioOscuro = new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 0.2 });
  const etiqueta = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  for (const x of [-2.4, -2.15, -1.9]) {
    const y = ALTO_MOSTRADOR + 0.06;
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), vidrioOscuro);
    cuerpo.position.set(x, y + 0.14, -0.2);
    const pico = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.1, 6), vidrioOscuro);
    pico.position.set(x, y + 0.33, -0.2);
    const papel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.01), etiqueta);
    papel.position.set(x, y + 0.14, -0.145);
    grupo.add(cuerpo, pico, papel);
  }
  const fernet = new THREE.MeshStandardMaterial({ color: 0x2b1408 });
  const espuma = new THREE.MeshStandardMaterial({ color: 0xc9a27a });
  for (const x of [-1.4, -1.2]) {
    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.13, 10), fernet);
    vaso.position.set(x, ALTO_MOSTRADOR + 0.125, 0.2);
    const tope = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.025, 10), espuma);
    tope.position.set(x, ALTO_MOSTRADOR + 0.2, 0.2);
    grupo.add(vaso, tope);
  }

  // --- Parrilla con choripanes ---
  caja(oscuro, 1.6, 0.9, 0.7, 1.7, 0.45, -1.4);
  // Brasas: una tabla naranja que brilla (emissive)
  const brasas = new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff5500, emissiveIntensity: 0.8 });
  caja(brasas, 1.4, 0.05, 0.55, 1.7, 0.93, -1.4);
  const chorizo = new THREE.MeshStandardMaterial({ color: 0x7a2e1a, roughness: 0.6 });
  const geometriaChorizo = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8);
  geometriaChorizo.rotateZ(Math.PI / 2); // acostado
  for (let i = 0; i < 5; i++) {
    const chori = new THREE.Mesh(geometriaChorizo, chorizo);
    chori.position.set(1.2 + i * 0.25, 0.99, -1.4 + (i % 2) * 0.12);
    grupo.add(chori);
  }

  // --- Barman ---
  // Reusamos la persona de artistas.js: remera negra y delantal (una caja blanca adelante).
  const barman = crearPersona({ piel: 0xd9a066, remera: 0x111111, pantalon: 0x34507a, pelo: 0x151010, barba: 0x151010 });
  barman.grupo.position.set(-0.8, 0, -1);
  posar(barman.izq, 0.6, 0.1, 0.9); // manos apoyadas hacia el mostrador
  posar(barman.der, 0.6, 0.1, 0.9);
  const delantal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.02), etiqueta);
  delantal.position.set(0, 1.05, 0.14);
  barman.grupo.add(delantal);
  grupo.add(barman.grupo);

  // --- Lugar y giro en el predio (como en escenario.js) ---
  grupo.position.set(config.posicion.x, 0, config.posicion.z);
  const angulo = Math.atan2(config.mirarHacia.x - config.posicion.x, config.mirarHacia.z - config.posicion.z);
  grupo.rotation.y = angulo;
  grupo.updateMatrixWorld(); // para que localToWorld use ya el lugar y el giro nuevos

  // Zona sólida: todo el puesto (mostrador, parrilla, barman). Mismo formato que las
  // colisiones de los escenarios (ver jugador.js).
  const colisiones = [
    {
      minX: -ANCHO_PUESTO / 2,
      maxX: ANCHO_PUESTO / 2,
      minZ: -FONDO_PUESTO - 0.1,
      maxZ: 0.7, // hasta los postes de adelante
      centroX: config.posicion.x,
      centroZ: config.posicion.z,
      angulo: angulo,
    },
  ];

  // El frente: 1.5 m delante del mostrador, en coordenadas del predio.
  const frente = grupo.localToWorld(new THREE.Vector3(0, 0, 1.5));

  return { grupo, colisiones, frente };
}

// Cartel arriba del techo, dibujado en un <canvas> como el de los escenarios.
function crearCartelBarra(grupo) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7a1010'; // rojo oscuro
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FERNET · CHORIPÁN', canvas.width / 2, canvas.height / 2, canvas.width - 60);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  const cartel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.12, 1), // misma proporción que el canvas
    new THREE.MeshBasicMaterial({ map: textura })
  );
  cartel.position.set(0, ALTO_TECHO + 0.6, 0.85);
  grupo.add(cartel);
}

// ---------------------------------------------------------------------------
// Lo que el jugador tiene en la mano
// ---------------------------------------------------------------------------

// Igual que los brazos en primera persona (ver acciones.js): se dibujan siempre por
// encima del resto (depthTest: false) y después de los objetos transparentes.
function crearMaterialEnMano(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.25, // un brillo suave para que se vea de noche
    roughness: 0.8,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
}

// Crea una pieza para la mano, con renderOrder alto: va después de los brazos (100 y 101).
function piezaEnMano(geometria, color) {
  const malla = new THREE.Mesh(geometria, crearMaterialEnMano(color));
  malla.renderOrder = 102;
  return malla;
}

// Vaso de fernet. Devuelve el grupo y una función para cambiar cuánto queda (de 0 a 1).
function crearFernetEnMano() {
  const grupo = new THREE.Group();
  grupo.position.set(-0.07, -0.04, 0); // al lado de la mano, del lado de adentro
  const altoVaso = 0.13;

  // El líquido con la base en y = 0: así, al achicarlo en alto, baja desde arriba.
  const geometriaLiquido = new THREE.CylinderGeometry(0.045, 0.038, altoVaso, 12);
  geometriaLiquido.translate(0, altoVaso / 2, 0);
  const liquido = piezaEnMano(geometriaLiquido, 0x2b1408);
  const espuma = piezaEnMano(new THREE.CylinderGeometry(0.046, 0.046, 0.025, 12), 0xc9a27a);
  espuma.renderOrder = 103; // encima del líquido
  grupo.add(liquido, espuma);

  function cambiarCuantoQueda(fraccion) {
    liquido.scale.y = Math.max(0.01, fraccion);
    espuma.position.y = altoVaso * fraccion + 0.0125; // la espuma va arriba del líquido
  }
  cambiarCuantoQueda(1);
  return { grupo, cambiarCuantoQueda };
}

// Choripán: pan y chorizo, a lo largo hacia el centro de la pantalla.
function crearChoriEnMano() {
  const grupo = new THREE.Group();
  grupo.position.set(0, 0.07, 0); // apoyado arriba de la mano

  // Las piezas van de x = 0 (la mano) hacia x negativo (el centro de la pantalla).
  // Así, al achicar el grupo en x, el choripán se acorta desde la punta: los mordiscos.
  const geometriaPan = new THREE.BoxGeometry(0.24, 0.07, 0.08);
  geometriaPan.translate(-0.12, 0, 0);
  const geometriaChorizo = new THREE.CylinderGeometry(0.027, 0.027, 0.28, 10);
  geometriaChorizo.rotateZ(Math.PI / 2); // acostado
  geometriaChorizo.translate(-0.12, 0.025, 0);
  const pan = piezaEnMano(geometriaPan, 0xd9a45b);
  const chori = piezaEnMano(geometriaChorizo, 0x7a2e1a);
  chori.renderOrder = 103;
  grupo.add(pan, chori);

  function cambiarCuantoQueda(fraccion) {
    grupo.scale.x = Math.max(0.01, fraccion);
  }
  return { grupo, cambiarCuantoQueda };
}

// ---------------------------------------------------------------------------
// Pedir, tomar y comer
// ---------------------------------------------------------------------------

/**
 * Maneja los pedidos en la barra y lo que el jugador tiene en la mano.
 *
 * @param {object} opciones
 * @param {object} opciones.barra  Lo que devuelve crearBarra
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (la mano y el gesto)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para saber si hay pausa)
 * @param {THREE.Camera} opciones.camara  Para saber dónde está el jugador
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearPedidos({ barra, acciones, jugador, camara }) {
  const aviso = document.getElementById('aviso-barra');

  let enMano = null; // { tipo: 'fernet' o 'chori', grupo, cambiarCuantoQueda } o null
  let quedan = 0; // tragos o mordiscos que quedan
  let tiempoBocado = -1; // segundos desde que empezó el trago o mordisco (−1 = no está)
  let yaConsumio = false; // si en este bocado ya restamos uno
  let cerca = false;

  // Saca lo que tenga en la mano (si tiene algo).
  function vaciarMano() {
    if (enMano !== null) {
      acciones.manoDerecha.remove(enMano.grupo);
      enMano = null;
    }
  }

  function pedir(tipo) {
    vaciarMano();
    enMano = tipo === 'fernet' ? crearFernetEnMano() : crearChoriEnMano();
    enMano.tipo = tipo;
    quedan = tipo === 'fernet' ? TRAGOS_POR_FERNET : MORDISCOS_POR_CHORI;
    acciones.manoDerecha.add(enMano.grupo);
  }

  document.addEventListener('keydown', (event) => {
    if (!jugador.controles.isLocked || !cerca || tiempoBocado >= 0) {
      return;
    }
    if (event.code === TECLA_FERNET) pedir('fernet');
    if (event.code === TECLA_CHORI) pedir('chori');
  });

  // Clic (botón izquierdo = 0): tomar un trago o dar un mordisco.
  document.addEventListener('mousedown', (event) => {
    if (event.button === 0 && jugador.controles.isLocked && enMano !== null && tiempoBocado < 0) {
      tiempoBocado = 0;
      yaConsumio = false;
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

  /**
   * Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // ¿Está frente a la barra? Medimos la distancia en el piso (sin contar la altura).
    cerca = Math.hypot(camara.position.x - barra.frente.x, camara.position.z - barra.frente.z) < DISTANCIA_PARA_PEDIR;

    // --- Trago o mordisco en curso ---
    if (tiempoBocado >= 0) {
      tiempoBocado += delta;
      const avance = tiempoBocado / DURACION_BOCADO; // de 0 a 1
      // La mano va a la boca y vuelve: un seno de 0 a π sube de 0 a 1 y vuelve a 0.
      acciones.gesto.boca = Math.sin(Math.PI * Math.min(1, avance));

      // En la mitad (con la mano en la boca) se toma o se come un poco.
      if (avance >= 0.5 && !yaConsumio) {
        yaConsumio = true;
        quedan--;
        const total = enMano.tipo === 'fernet' ? TRAGOS_POR_FERNET : MORDISCOS_POR_CHORI;
        enMano.cambiarCuantoQueda(quedan / total);
      }
      if (avance >= 1) {
        tiempoBocado = -1;
        acciones.gesto.boca = 0;
        if (quedan === 0) {
          vaciarMano(); // se terminó
        }
      }
    }

    // --- Aviso en pantalla ---
    let texto = '';
    if (cerca) {
      texto = 'R: pedir un fernet   ·   C: pedir un choripán';
    } else if (enMano !== null) {
      texto = enMano.tipo === 'fernet'
        ? 'Clic: tomar un trago (quedan ' + quedan + ')'
        : 'Clic: dar un mordisco (quedan ' + quedan + ')';
    }
    mostrar(texto);
  }

  return { actualizar };
}
