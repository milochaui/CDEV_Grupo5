// Resumen de la noche: durante el festival va anotando lo que hace el jugador (qué bandas
// vio, cuánto cantó y cuánto pogo hizo, las fotos, los fernets...). A la mañana siguiente,
// cuando el que barre termina de hablarle (ver limpieza.js), muestra un cartel con el balance.
// Con Enter se cierra y se puede seguir caminando por el predio.

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const TECLA_CERRAR = 'Enter';
// Para que una banda cuente como "vista" hay que escucharla de cerca (como en el
// aguante-metro, ver aguante.js) al menos estos segundos.
const VOLUMEN_MINIMO = 0.5;
const SEGUNDOS_PARA_VER_UNA_BANDA = 20;

// Pasa segundos a texto: 95 → "1:35".
function aMinutosYSegundos(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = Math.floor(segundos % 60);
  return minutos + ':' + String(resto).padStart(2, '0');
}

/**
 * Crea el resumen. El cartel está en index.html.
 *
 * @param {object} opciones
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (lo dejamos quieto con el cartel abierto)
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (para saber si canta o hace pogo)
 * @param {object} opciones.celular  Lo que devuelve crearCelular (para saber si se lo robaron)
 * @param {object} opciones.aguante  Lo que devuelve crearAguanteMetro (lleno = la banda te saluda)
 * @param {THREE.Group[]} opciones.escenarios  Para contar cuántas bandas tocan en total
 * @param {() => THREE.Group | null} opciones.escenarioMasFuerte  Está en main.js
 * @returns {{ actualizar: (delta: number) => void, anotar: (que: string) => void, mostrar: () => void }}
 *  - anotar: suma uno a 'fotos', 'fernets', 'choris' o 'bises' (lo llama main.js).
 */
export function crearResumen({ jugador, acciones, celular, aguante, escenarios, escenarioMasFuerte }) {
  const cartel = document.getElementById('resumen');
  const lista = document.getElementById('resumen-lista');

  // --- Lo que vamos anotando ---
  const segundosPorBanda = new Map(); // nombre de la banda → segundos que la escuchó de cerca
  let segundosCantando = 0;
  let segundosDePogo = 0;
  const contadores = { fotos: 0, fernets: 0, choris: 0, bises: 0, saludos: 0, robos: 0, recuperados: 0 };

  // Para darnos cuenta de cuándo algo "empieza" (antes era false y ahora es true).
  let llenoAntes = false;
  let robadoAntes = false;

  let abierto = false;

  /**
   * Va anotando. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // ¿Está cerca de alguna banda que está tocando? Le sumamos el tiempo a esa banda.
    // (escenarioMasFuerte solo devuelve escenarios con una banda arriba. No preguntamos si
    // suena el mp3: así cuenta igual una banda a la que todavía le falta el audio.)
    const escenario = escenarioMasFuerte();
    if (escenario !== null && escenario.userData.musica.volumen() >= VOLUMEN_MINIMO) {
      const banda = escenario.userData.nombre;
      // ?? 0: si la banda todavía no estaba en el Map, arranca de 0.
      segundosPorBanda.set(banda, (segundosPorBanda.get(banda) ?? 0) + delta);
    }

    // Cantar y pogo: contamos el tiempo (contar "veces" daría números raros, porque al
    // soltar y volver a apretar la tecla ya serían dos).
    if (acciones.estado.cantando) {
      segundosCantando += delta;
    }
    if (acciones.estado.pogo || acciones.estado.enRonda) {
      segundosDePogo += delta;
    }

    // Cada vez que se llena el aguante-metro, el cantante te saluda (ver main.js).
    const lleno = aguante.lleno() && escenario !== null;
    if (lleno && !llenoAntes) {
      contadores.saludos++;
    }
    llenoAntes = lleno;

    // El robo: si pasó de no robado a robado, te lo robaron; si volvió, lo recuperaste.
    const robado = celular.estaRobado();
    if (robado && !robadoAntes) contadores.robos++;
    if (!robado && robadoAntes) contadores.recuperados++;
    robadoAntes = robado;
  }

  function anotar(que) {
    contadores[que]++;
  }

  // Agrega un renglón al cartel: un emoji, qué es y el valor.
  function agregarRenglon(emoji, texto, valor) {
    const renglon = document.createElement('li');
    const nombre = document.createElement('span');
    nombre.textContent = emoji + ' ' + texto;
    const numero = document.createElement('b');
    numero.textContent = valor;
    renglon.append(nombre, numero);
    lista.appendChild(renglon);
  }

  // Arma el cartel con lo anotado y lo muestra.
  function mostrar() {
    lista.textContent = ''; // borra los renglones (por si se mostró antes)

    // Las bandas vistas: las que escuchó de cerca un rato.
    const vistas = [];
    for (const [banda, segundos] of segundosPorBanda) {
      if (segundos >= SEGUNDOS_PARA_VER_UNA_BANDA) {
        vistas.push(banda);
      }
    }
    // Cuántas bandas tocaban en total: la suma de los lineups de todos los escenarios.
    let total = 0;
    for (const escenario of escenarios) {
      total += escenario.userData.programacion.lineup.length;
    }
    agregarRenglon('🎸', 'Bandas que viste', vistas.length + ' de ' + total);
    if (vistas.length > 0) {
      const nombres = document.createElement('li');
      nombres.className = 'resumen-bandas';
      nombres.textContent = vistas.join(' · ');
      lista.appendChild(nombres);
    }

    agregarRenglon('🎤', 'Tiempo cantando', aMinutosYSegundos(segundosCantando));
    agregarRenglon('🤘', 'Tiempo de pogo', aMinutosYSegundos(segundosDePogo));
    agregarRenglon('🙌', 'Veces que te saludó la banda', contadores.saludos);
    agregarRenglon('🔁', 'Bises que conseguiste', contadores.bises);
    agregarRenglon('📸', 'Fotos que sacaste', contadores.fotos);
    agregarRenglon('🍹', 'Fernets', contadores.fernets);
    agregarRenglon('🌭', 'Choripanes', contadores.choris);

    // El celular: tres finales posibles.
    let celu = 'Sano y salvo';
    if (celular.estaRobado()) {
      celu = 'Te lo robaron 😢';
    } else if (contadores.recuperados > 0) {
      celu = 'Te lo robaron... ¡y lo recuperaste! 💪';
    }
    agregarRenglon('📱', 'El celu', celu);
    agregarRenglon('😵', 'Cómo terminaste', 'Desmayado en el pasto');

    abrir(true);
  }

  function abrir(abrirlo) {
    abierto = abrirlo;
    cartel.style.display = abierto ? 'block' : 'none';
    jugador.bloquear('resumen', abierto); // quieto mientras lee
  }

  // Enter: cerrar. (Abierto, el jugador está bloqueado: por eso no preguntamos puedeActuar.)
  document.addEventListener('keydown', (event) => {
    if (abierto && event.code === TECLA_CERRAR && jugador.controles.isLocked) {
      abrir(false);
    }
  });

  // En pausa se esconde, y al volver aparece otra vez (si no lo había cerrado).
  jugador.controles.addEventListener('unlock', () => {
    cartel.style.display = 'none';
  });
  jugador.controles.addEventListener('lock', () => {
    if (abierto) {
      cartel.style.display = 'block';
    }
  });

  return { actualizar, anotar, mostrar };
}
