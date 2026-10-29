// Reloj del festival y grilla de horarios.
// El reloj muestra la hora "del festival": arranca a las HORA_INICIO y avanza más rápido
// que el tiempo real (VELOCIDAD_RELOJ), sin contar las pausas. Con esa hora cada escenario
// decide cuándo sube la banda que sigue (ver la programación en escenario.js).
// La grilla es un cartel que se abre y se cierra con la tecla G y muestra quién toca
// en cada escenario y a qué hora, marcando la banda que está tocando ahora.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const TECLA_GRILLA = 'KeyG';

// Hora a la que arranca el juego: un ratito antes de que toquen las primeras bandas.
// (Para ir directo a las bandas de la noche, probar con '20:58'.)
const HORA_INICIO = '17:58';

// Cuántos minutos del festival pasan por cada minuto real. Con 10, las 3 horas que van
// de las 18:00 a las 21:00 duran 18 minutos de juego.
const VELOCIDAD_RELOJ = 10;

// ---------------------------------------------------------------------------
// Ayudas para las horas
// ---------------------------------------------------------------------------

// Pasa "21:20" a minutos desde la medianoche: 21 × 60 + 20 = 1280.
// Así comparar horas es comparar números. (También la usa escenario.js.)
export function aMinutos(textoHora) {
  const [horas, minutos] = textoHora.split(':').map(Number);
  return horas * 60 + minutos;
}

// Lo contrario: 1280 → "21:20". padStart agrega el 0 de adelante ("9" → "09").
// El % 24 hace que después de las 23:59 vuelva a las 00:00.
function aTextoHora(minutosTotales) {
  const horas = Math.floor(minutosTotales / 60) % 24;
  const minutos = Math.floor(minutosTotales % 60);
  return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
}

/**
 * Crea el reloj y la grilla. Los elementos de la página están en index.html.
 *
 * @param {object} jugador  Lo que devuelve crearJugador (para saber si está en pausa)
 * @param {THREE.Group[]} escenarios  Los escenarios: de su programación sale la grilla
 * @returns {{ actualizar: (delta: number) => void, minutos: () => number }}
 */
export function crearGrilla(jugador, escenarios) {
  const reloj = document.getElementById('reloj');
  const cartelGrilla = document.getElementById('grilla');
  const horaGrilla = document.getElementById('grilla-hora');
  const columnas = document.getElementById('grilla-columnas');

  // Minutos del festival (con decimales: los segundos van sumando de a poco).
  let minutosFestival = aMinutos(HORA_INICIO);

  // --- Armamos la grilla una sola vez ---
  // Por cada escenario, una columna con su nombre y una "tarjeta" por banda.
  // Guardamos cada tarjeta con su escenario y su número de show para después
  // preguntarle a la programación si ya tocó o si está tocando.
  const tarjetas = [];
  for (const escenario of escenarios) {
    const programacion = escenario.userData.programacion;
    // El color del escenario pasado a texto CSS, por ejemplo 0xff3355 → "#ff3355".
    const color = '#' + new THREE.Color(escenario.userData.color).getHexString();

    const columna = document.createElement('div');
    columna.className = 'grilla-columna';
    columna.style.borderTopColor = color; // la raya de arriba, del color del escenario

    const titulo = document.createElement('h3');
    titulo.textContent = escenario.userData.nombreEscenario;
    titulo.style.color = color;
    columna.appendChild(titulo);

    programacion.lineup.forEach((show, numero) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'grilla-show';
      tarjeta.innerHTML =
        '<span class="grilla-horario">' + show.inicio + ' – ' + show.fin + '</span>' +
        '<span class="grilla-banda">' + show.nombre + '</span>';
      columna.appendChild(tarjeta);
      tarjetas.push({ elemento: tarjeta, programacion, numero });
    });
    columnas.appendChild(columna);
  }

  // Marca cada tarjeta según lo que pasa en el escenario: "ya tocó", "tocando ahora"
  // o nada (todavía no tocó). No sale de la hora sino de la programación: si una banda
  // se atrasa, la grilla lo muestra.
  // classList.toggle(clase, condición) agrega la clase si la condición es true y la saca si no.
  function marcarTarjetas() {
    for (const { elemento, programacion, numero } of tarjetas) {
      const estado = programacion.estadoDe(numero);
      elemento.classList.toggle('ya-toco', estado === 'ya-toco');
      elemento.classList.toggle('ahora', estado === 'ahora');
    }
  }

  // Muestra la hora en el reloj y en la grilla. Solo toca la página si cambió el minuto.
  function mostrarHora() {
    const texto = aTextoHora(minutosFestival);
    if (horaGrilla.textContent !== texto) {
      reloj.textContent = '🕘 ' + texto;
      horaGrilla.textContent = texto;
    }
  }
  mostrarHora();

  // --- Abrir y cerrar ---
  let abierta = false;
  function abrir(abrirla) {
    abierta = abrirla;
    cartelGrilla.style.display = abierta ? 'block' : 'none';
    if (abierta) {
      marcarTarjetas();
    }
  }

  document.addEventListener('keydown', (event) => {
    // Solo mientras se juega (no en el cartel de inicio ni en pausa).
    if (event.code === TECLA_GRILLA && !event.repeat && jugador.controles.isLocked) {
      abrir(!abierta);
    }
  });

  // El reloj se ve mientras se juega. En pausa se esconde, junto con la grilla.
  jugador.controles.addEventListener('lock', () => {
    reloj.style.display = 'block';
  });
  jugador.controles.addEventListener('unlock', () => {
    reloj.style.display = 'none';
    abrir(false);
  });

  /**
   * Hace avanzar el reloj. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // delta está en segundos y el reloj cuenta minutos: delta / 60 minutos reales,
    // que en el festival son VELOCIDAD_RELOJ veces más.
    minutosFestival += (delta / 60) * VELOCIDAD_RELOJ;
    mostrarHora();
    // Con la grilla abierta, la vamos marcando: así se ve en el momento cuando una banda
    // termina o empieza.
    if (abierta) {
      marcarTarjetas();
    }
  }

  // La hora del festival, en minutos desde la medianoche (por ejemplo 1080 = 18:00).
  function minutos() {
    return minutosFestival;
  }

  return { actualizar, minutos };
}
