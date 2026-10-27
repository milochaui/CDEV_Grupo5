// Aguante-metro: una barra en pantalla que se llena cuando el jugador "deja todo" cerca
// de un escenario (levanta los brazos, canta, salta, hace pogo) y se vacía de a poco si
// se queda quieto. Con los temas conocidos se llena más rápido.
// Al llenarse aparece "¡AGUANTE!" (y el cantante saluda al jugador, ver main.js).

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// Puntos por segundo que suma cada acción (la barra va de 0 a 100).
const PUNTOS_BRAZOS = 2;
const PUNTOS_CANTAR = 2;
const PUNTOS_SALTAR = 3; // mientras está en el aire
const PUNTOS_POGO = 5;
const PUNTOS_QUE_BAJA = 2; // los que pierde siempre, haga lo que haga

// Las acciones valen más o menos según el tema.
// Ejemplo: solo con pogo en un tema conocido suma 5 × 1.5 − 2 = 5.5 por segundo
// (se llena en unos 18 s). Con todo junto, en unos 6 s.
const FACTOR_TEMA_CONOCIDO = 1.5;
const FACTOR_TEMA_TRANQUI = 0.5;

// Para que cuente hay que estar cerca de un escenario: escucharlo al menos a este volumen.
const VOLUMEN_MINIMO = 0.5;

const AGUANTE_LLENO = 95; // desde acá se muestra "¡AGUANTE!"

/**
 * Crea el aguante-metro. La barra está en index.html.
 *
 * @param {object} opciones
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (ver acciones.js)
 * @param {() => THREE.Group | null} opciones.escenarioMasFuerte  Devuelve el escenario que
 *        más se escucha (o null si no se escucha ninguno). Está en main.js.
 * @returns {{ actualizar: (delta: number) => void, lleno: () => boolean }}
 */
export function crearAguanteMetro({ acciones, escenarioMasFuerte }) {
  const cartel = document.getElementById('aguante');
  const texto = document.getElementById('aguante-texto');
  const relleno = document.getElementById('aguante-relleno');

  let aguante = 0; // de 0 a 100

  /**
   * Actualiza la barra. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    // --- 1. Cuánto suma lo que está haciendo el jugador ---
    let suma = 0;
    const escenario = escenarioMasFuerte();
    const cercaDeUnEscenario =
      escenario !== null &&
      escenario.userData.musica.estaSonando() &&
      escenario.userData.musica.volumen() >= VOLUMEN_MINIMO;

    if (cercaDeUnEscenario) {
      const estado = acciones.estado;
      if (estado.brazos) suma += PUNTOS_BRAZOS;
      if (estado.cantando) suma += PUNTOS_CANTAR;
      if (estado.saltando) suma += PUNTOS_SALTAR;
      if (estado.pogo) suma += PUNTOS_POGO;
      suma *= escenario.userData.musica.temaActual().conocido ? FACTOR_TEMA_CONOCIDO : FACTOR_TEMA_TRANQUI;
    }

    // --- 2. Sube lo que suma, baja lo que pierde, y queda entre 0 y 100 ---
    aguante += (suma - PUNTOS_QUE_BAJA) * delta;
    aguante = Math.min(100, Math.max(0, aguante));

    // --- 3. Barra en pantalla ---
    relleno.style.width = aguante + '%';
    const estaLleno = lleno();
    const textoNuevo = estaLleno ? '¡AGUANTE!' : 'Aguante';
    // Solo tocamos la página si el texto cambió.
    if (texto.textContent !== textoNuevo) {
      texto.textContent = textoNuevo;
      // La clase "lleno" activa la animación del CSS (ver index.html).
      cartel.classList.toggle('lleno', estaLleno);
    }
  }

  // true si la barra está llena (desde AGUANTE_LLENO).
  function lleno() {
    return aguante >= AGUANTE_LLENO;
  }

  return { actualizar, lleno };
}
