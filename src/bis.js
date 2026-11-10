// El bis: cuando una banda termina su último tema, se baja del escenario y el público pide
// "¡otra, otra!" un rato (eso lo maneja la programación, ver escenario.js). Si el jugador
// está cerca y la pide de verdad, cantando (Q) o con los brazos arriba (E), la banda vuelve
// y toca otra vez su tema conocido. Si nadie la pide, se va y sube la que sigue.

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const VOLUMEN_MINIMO = 0.5; // para estar "cerca": como en el aguante-metro (ver aguante.js)
const SEGUNDOS_PARA_PEDIR = 3; // cuánto hay que cantar o tener los brazos arriba
const SEGUNDOS_ENTRE_APLAUSOS = 3; // mientras piden, el público aplaude y grita cada tanto
const INTENSIDAD_APLAUSOS = 0.6; // de 0 a 1 (ver aplausos.js)
const SEGUNDOS_MENSAJE_BIS = 3; // cuánto se ve el "¡Volvieron!"

/**
 * Crea el bis.
 *
 * @param {object} opciones
 * @param {THREE.Group[]} opciones.escenarios  Los escenarios (y la carpa)
 * @param {object} opciones.acciones  Lo que devuelve crearAcciones (para saber si canta o levanta los brazos)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para esconder el aviso en pausa)
 * @param {() => void} opciones.alConseguir  Se llama cuando el jugador consigue un bis
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearBis({ escenarios, acciones, jugador, alConseguir }) {
  const aviso = document.getElementById('aviso-bis');

  // Segundos que el jugador lleva pidiendo el bis en cada escenario (escenario → segundos).
  const pedido = new Map();
  let cuentaAplausos = 0; // segundos que faltan para el próximo aplauso
  let tiempoMensajeBis = 0; // segundos que le quedan al "¡Volvieron!"

  function mostrar(texto) {
    if (aviso.textContent !== texto) {
      aviso.textContent = texto;
      aviso.style.display = texto ? 'block' : 'none';
    }
  }

  // En pausa escondemos el aviso (al volver, actualizar lo muestra otra vez).
  jugador.controles.addEventListener('unlock', () => mostrar(''));

  /**
   * Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    tiempoMensajeBis = Math.max(0, tiempoMensajeBis - delta);
    cuentaAplausos -= delta;
    const tocaAplaudir = cuentaAplausos <= 0;
    if (tocaAplaudir) {
      cuentaAplausos = SEGUNDOS_ENTRE_APLAUSOS;
    }

    let texto = tiempoMensajeBis > 0 ? '🔥 ¡Volvieron! Ahí va el bis' : '';

    for (const escenario of escenarios) {
      const programacion = escenario.userData.programacion;
      if (!programacion.estaPidiendoBis()) {
        pedido.delete(escenario); // por si quedó algo de una vez anterior
        continue;
      }

      // El público pide: aplausos y gritos cada tanto (se escuchan según la distancia).
      if (tocaAplaudir) {
        escenario.userData.aplausos.aplaudir(INTENSIDAD_APLAUSOS);
      }

      // ¿El jugador está cerca y lo está pidiendo?
      if (escenario.userData.musica.volumen() < VOLUMEN_MINIMO) {
        continue; // está lejos: no lo escuchan
      }
      const loPide = acciones.estado.cantando || acciones.estado.brazos;
      const segundos = (pedido.get(escenario) ?? 0) + (loPide ? delta : 0);
      pedido.set(escenario, segundos);

      if (segundos >= SEGUNDOS_PARA_PEDIR) {
        // ¡Lo consiguió! La banda vuelve y el público explota.
        programacion.darBis();
        escenario.userData.aplausos.aplaudir(1);
        pedido.delete(escenario);
        tiempoMensajeBis = SEGUNDOS_MENSAJE_BIS;
        texto = '🔥 ¡Volvieron! Ahí va el bis';
        alConseguir();
      } else {
        // Cuánto le falta, como porcentaje: así se ve que pedirlo sirve.
        const porcentaje = Math.round((segundos / SEGUNDOS_PARA_PEDIR) * 100);
        texto = '🙌 ¡Otra, otra! Cantá (Q) o levantá los brazos (E) para pedir el bis · ' + porcentaje + '%';
      }
    }
    mostrar(texto);
  }

  return { actualizar };
}
