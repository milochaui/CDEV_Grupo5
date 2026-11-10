// Robo del celular: si el jugador tiene el celular afuera mucho tiempo, alguien se avivó
// y se lo viene a robar.
//
// Lo medimos con un número, el "riesgo", que va de 0 a 1:
//  - Sube mientras el celular está afuera. Sube más rápido si está metido entre el público,
//    si está en el pogo, si está borracho y si es de noche. Cada foto suma un poquito
//    (el flash llama la atención).
//  - Baja cuando lo guarda.
//
// Cuando el riesgo llega a RIESGO_LADRON aparece el ladrón (ver ladron.js) detrás del
// jugador y se le acerca caminando, con un aviso en pantalla. Lo que pasa después está
// en la variable "estado":
//  - 'nadie': no hay ladrón; el riesgo sube o baja.
//  - 'acercandose': viene caminando hacia el jugador.
//      · Si el jugador guarda el celular a tiempo → 'yendose'.
//      · Si lo alcanza con el celular afuera → le roba el celular y pasa a 'huyendo'.
//  - 'yendose': se va caminando. Lejos, desaparece y vuelve a 'nadie'.
//  - 'huyendo': se va corriendo con el celular, y el jugador lo puede perseguir. Corre un
//    poco más lento que el jugador con Shift, pero zigzaguea entre la gente.
//      · Si el jugador lo alcanza → recupera el celular y las fotos, y pasa a 'rajando'.
//      · Si se aleja mucho o pasa mucho tiempo → se pierde entre la gente: 'robado'.
//  - 'rajando': lo alcanzaste; suelta el celular y se va corriendo. Lejos, desaparece y
//    vuelve a 'nadie' (te lo pueden volver a robar).
//  - 'robado': ya no hay celular que robar; no pasa nada más.
import * as THREE from 'three';
import { escenarioEntreElPublico } from './acciones.js';
import { aMinutos } from './grilla.js';
import { crearLadron } from './ladron.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- El riesgo ---
// Con el celular afuera en un lugar tranquilo (sin gente alrededor), el riesgo tarda
// estos segundos en llegar de 0 a 1. Lo demás multiplica la velocidad.
const SEGUNDOS_RIESGO_BASE = 60;
const POR_ENTRE_EL_PUBLICO = 3; // entre el público sube 3 veces más rápido (20 s)...
const POR_POGO = 6; // ...y en el pogo, 6 veces (10 s): ahí no ves quién te mete la mano
const POR_BORRACHO = 1; // con la borrachera al máximo, el doble de rápido (1 + 1)
const POR_NOCHE = 1.5;
const HORA_NOCHE = '20:30'; // desde esta hora (y también la mañana siguiente) cuenta como noche
const RIESGO_POR_FOTO = 0.04;
// Con el celular guardado, el riesgo tarda estos segundos en bajar de 1 a 0.
const SEGUNDOS_RIESGO_BAJA = 20;
// Con este riesgo aparece el ladrón.
const RIESGO_LADRON = 0.6;

// --- El ladrón ---
const DISTANCIA_APARECE = 14; // metros detrás del jugador
const VELOCIDAD_ACERCARSE = 2; // metros por segundo (el jugador camina a 5)
const VELOCIDAD_IRSE = 1.8;
const VELOCIDAD_HUIR = 8; // corriendo con el celular (el jugador corre a 10: lo puede alcanzar)
const DISTANCIA_ROBO = 1; // metros: a esta distancia te lo saca de la mano
const DISTANCIA_CERCA = 6; // metros: desde acá el aviso se pone más urgente (3 s antes de que llegue)
const DISTANCIA_SE_RINDE = 35; // si el jugador se aleja tanto, lo pierde de vista y se va
const DISTANCIA_DESAPARECE = 40; // yéndose o huyendo, a esta distancia ya no lo vemos más
// Por si se traba contra algo (una valla) y nunca llega a alejarse: después de estos
// segundos desaparece igual.
const SEGUNDOS_MAXIMOS_YENDOSE = 25;
const SEGUNDOS_MAXIMOS_RAJANDO = 8;
const SEGUNDOS_MENSAJE = 3.5; // cuánto dura el cartel de "se fue" o "te robaron"

// --- La persecución ---
const DISTANCIA_ATRAPAR = 1.3; // metros: a esta distancia lo alcanzaste
// Como te roba al lado tuyo, al principio está a menos de DISTANCIA_ATRAPAR: le damos
// estos segundos de ventaja para que no lo "alcances" en el mismo instante en que te roba.
const SEGUNDOS_VENTAJA = 0.6;
const DISTANCIA_ESCAPA = 22; // si se aleja tanto, se te pierde entre la gente
const SEGUNDOS_PERSECUCION = 12; // y si en este tiempo no lo alcanzaste, también
const ZIGZAG = 0.45; // radianes que se desvía para cada lado al zigzaguear (≈ 25°)
const ZIGZAGS_POR_SEGUNDO = 0.8;

// Si el camino derecho está tapado (un escenario, la barra), prueba desviándose estos
// ángulos (en radianes, 0.7 ≈ 40°), en este orden.
const DESVIOS = [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1];

/**
 * Crea el riesgo de robo y al ladrón.
 *
 * @param {object} opciones
 * @param {THREE.Scene} opciones.escena  Para agregar al ladrón
 * @param {object} opciones.celular  Lo que devuelve crearCelular (si está afuera, las fotos, robarlo)
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (si está en el pogo)
 * @param {object} opciones.borrachera  Lo que devuelve crearBorrachera (cuánto tomó)
 * @param {object} opciones.grilla  Lo que devuelve crearGrilla (la hora del festival)
 * @param {Array<THREE.Group>} opciones.escenarios  Para saber si está entre el público
 * @param {THREE.Camera} opciones.camara  Dónde está el jugador
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para que el ladrón no
 *        atraviese cosas y para esconder el aviso en pausa)
 * @param {() => void} opciones.alRobar  Se llama justo cuando te roba el celular
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearRobo({ escena, celular, acciones, borrachera, grilla, escenarios, camara, jugador, alRobar }) {
  const aviso = document.getElementById('aviso-robo');
  const ladron = crearLadron();
  escena.add(ladron.grupo);

  let riesgo = 0; // de 0 a 1
  let estado = 'nadie';
  let tiempoEnEstado = 0; // segundos desde el último cambio de estado
  let mensaje = ''; // cartel que queda unos segundos ("se fue", "te robaron")
  let tiempoMensaje = 0;
  // La última foto en el cuadro anterior: si cambió, sacó una foto nueva. (No alcanza con
  // contarlas: con la memoria llena se borra la más vieja y la cantidad no cambia.)
  let ultimaFotoAntes = undefined;

  const direccion = new THREE.Vector3(); // hacia dónde mira el jugador (la reusamos)

  // En pausa escondemos el aviso (como los demás cartelitos).
  jugador.controles.addEventListener('unlock', () => mostrar(''));

  function mostrar(texto) {
    if (aviso.textContent !== texto) {
      aviso.textContent = texto;
      aviso.style.display = texto ? 'block' : 'none';
    }
  }

  function cambiarEstado(nuevo) {
    estado = nuevo;
    tiempoEnEstado = 0;
  }

  // Deja un cartel en pantalla unos segundos.
  function avisar(texto) {
    mensaje = texto;
    tiempoMensaje = SEGUNDOS_MENSAJE;
  }

  // Distancia en el piso (sin contar la altura) entre el ladrón y el jugador.
  function distanciaAlJugador() {
    return Math.hypot(camara.position.x - ladron.grupo.position.x, camara.position.z - ladron.grupo.position.z);
  }

  // ---------------------------------------------------------------------------
  // El riesgo
  // ---------------------------------------------------------------------------

  // Cuánto más rápido que lo normal sube el riesgo ahora (1 = normal).
  function multiplicador() {
    let veces = 1;
    if (acciones.estado.pogo || acciones.estado.enRonda) {
      veces *= POR_POGO;
    } else if (escenarioEntreElPublico(escenarios, camara.position) !== null) {
      veces *= POR_ENTRE_EL_PUBLICO;
    }
    veces *= 1 + borrachera.euforia() * POR_BORRACHO;
    if (grilla.minutos() >= aMinutos(HORA_NOCHE)) {
      veces *= POR_NOCHE;
    }
    return veces;
  }

  function actualizarRiesgo(delta) {
    // Con la galería abierta el celular sigue en la mano (estás mirando las fotos en el
    // celular), así que el riesgo también sube.
    if (celular.estaAfuera()) {
      riesgo += (delta / SEGUNDOS_RIESGO_BASE) * multiplicador();
    } else {
      riesgo -= delta / SEGUNDOS_RIESGO_BAJA;
    }
    // Cada foto nueva suma un poco. at(-1) es el último elemento de la lista (undefined si
    // está vacía).
    const ultimaFoto = celular.fotos().at(-1);
    if (ultimaFoto !== ultimaFotoAntes && ultimaFoto !== undefined) {
      riesgo += RIESGO_POR_FOTO;
    }
    ultimaFotoAntes = ultimaFoto;
    riesgo = Math.min(1, Math.max(0, riesgo)); // que quede entre 0 y 1
  }

  // ---------------------------------------------------------------------------
  // El ladrón
  // ---------------------------------------------------------------------------

  // Lo pone detrás del jugador, en un lugar libre, y lo hace visible.
  // Si justo atrás hay algo (o está la valla), prueba más a los costados y más cerca.
  // Si no encuentra ningún lugar libre, no aparece (lo vuelve a intentar en el próximo cuadro).
  function aparecer() {
    camara.getWorldDirection(direccion);
    // El ángulo hacia donde mira el jugador, en el piso. Le sumamos π (media vuelta): atrás.
    const anguloAtras = Math.atan2(direccion.x, direccion.z) + Math.PI;
    for (const distancia of [DISTANCIA_APARECE, DISTANCIA_APARECE * 0.6]) {
      for (const desvio of DESVIOS) {
        const angulo = anguloAtras + desvio;
        const x = camara.position.x + Math.sin(angulo) * distancia;
        const z = camara.position.z + Math.cos(angulo) * distancia;
        if (jugador.estaLibre(x, z)) {
          ladron.grupo.position.set(x, 0, z);
          ladron.grupo.visible = true;
          cambiarEstado('acercandose');
          return;
        }
      }
    }
  }

  function desaparecer() {
    ladron.grupo.visible = false;
  }

  /**
   * Mueve al ladrón hacia el jugador (sentido = 1) o alejándose de él (sentido = −1).
   * Si el camino derecho está tapado, se desvía (ver DESVIOS).
   * "zigzag" (opcional, en radianes): cuánto se va para un lado y para el otro mientras
   * corre, como esquivando gente. Así es más difícil seguirlo en línea recta.
   */
  function moverLadron(sentido, velocidad, delta, zigzag = 0) {
    const posicion = ladron.grupo.position;
    // El seno va y viene entre −1 y 1: un rato se desvía a la izquierda y otro a la derecha.
    const desvioZigzag = zigzag * Math.sin(tiempoEnEstado * ZIGZAGS_POR_SEGUNDO * Math.PI * 2);
    const anguloDerecho = Math.atan2(
      sentido * (camara.position.x - posicion.x),
      sentido * (camara.position.z - posicion.z)
    ) + desvioZigzag;
    const paso = velocidad * delta;
    for (const desvio of DESVIOS) {
      const angulo = anguloDerecho + desvio;
      const x = posicion.x + Math.sin(angulo) * paso;
      const z = posicion.z + Math.cos(angulo) * paso;
      if (jugador.estaLibre(x, z)) {
        posicion.x = x;
        posicion.z = z;
        ladron.grupo.rotation.y = angulo; // mira hacia donde camina (las personas miran a +Z)
        ladron.animar(delta, velocidad);
        return;
      }
    }
    ladron.animar(delta, 0); // trabado: se queda quieto
  }

  /**
   * Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    actualizarRiesgo(delta);
    tiempoEnEstado += delta;

    if (estado === 'nadie') {
      if (celular.estaAfuera() && riesgo >= RIESGO_LADRON) {
        aparecer();
      }
    } else if (estado === 'acercandose') {
      const distancia = distanciaAlJugador();
      if (!celular.estaAfuera()) {
        // Lo guardó a tiempo: se da cuenta y se va. Va a buscar a otro: el riesgo vuelve a 0.
        cambiarEstado('yendose');
        riesgo = 0;
        avisar('😮‍💨 Uff... se fue. Guardaste el celu a tiempo');
      } else if (distancia > DISTANCIA_SE_RINDE) {
        cambiarEstado('yendose'); // te alejaste mucho: te perdió de vista
        riesgo = 0;
      } else if (distancia < DISTANCIA_ROBO) {
        celular.robar();
        alRobar();
        cambiarEstado('huyendo');
        ladron.marcar(true); // la marca roja, para no perderlo de vista
      } else {
        moverLadron(1, VELOCIDAD_ACERCARSE, delta);
      }
    } else if (estado === 'yendose') {
      moverLadron(-1, VELOCIDAD_IRSE, delta);
      if (distanciaAlJugador() > DISTANCIA_DESAPARECE || tiempoEnEstado > SEGUNDOS_MAXIMOS_YENDOSE) {
        desaparecer();
        cambiarEstado('nadie');
      }
    } else if (estado === 'huyendo') {
      moverLadron(-1, VELOCIDAD_HUIR, delta, ZIGZAG);
      const distancia = distanciaAlJugador();
      if (distancia < DISTANCIA_ATRAPAR && tiempoEnEstado > SEGUNDOS_VENTAJA) {
        // ¡Lo alcanzó! Suelta el celular y se va corriendo.
        celular.recuperar();
        ladron.marcar(false);
        riesgo = 0;
        cambiarEstado('rajando');
        avisar('💪 ¡Lo alcanzaste! Recuperaste el celu y las fotos');
      } else if (distancia > DISTANCIA_ESCAPA || tiempoEnEstado > SEGUNDOS_PERSECUCION) {
        // Se le perdió entre la gente: chau celu.
        desaparecer();
        ladron.marcar(false);
        cambiarEstado('robado');
        avisar('💨 Se te perdió entre la gente... chau celu');
      }
    } else if (estado === 'rajando') {
      moverLadron(-1, VELOCIDAD_HUIR, delta);
      if (distanciaAlJugador() > DISTANCIA_DESAPARECE || tiempoEnEstado > SEGUNDOS_MAXIMOS_RAJANDO) {
        desaparecer();
        cambiarEstado('nadie');
      }
    }

    // --- Aviso en pantalla ---
    // Primero los mensajes que duran unos segundos; si no hay, el del ladrón que se acerca.
    tiempoMensaje = Math.max(0, tiempoMensaje - delta);
    let texto = '';
    if (estado === 'huyendo') {
      // Durante la persecución, a cuántos metros está (Math.round: sin decimales).
      texto = '😱 ¡Te robaron el celu! Corré al ladrón (Shift) · ' + Math.round(distanciaAlJugador()) + ' m';
    } else if (tiempoMensaje > 0) {
      texto = mensaje;
    } else if (estado === 'acercandose') {
      texto = distanciaAlJugador() < DISTANCIA_CERCA
        ? '😰 ¡Se te viene alguien encima! Guardá el celu (X)'
        : '👀 Sentís que alguien te está mirando...';
    }
    mostrar(texto);
  }

  return { actualizar };
}
