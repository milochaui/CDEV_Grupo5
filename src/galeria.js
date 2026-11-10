// Galería de fotos: con la tecla Z se abre un cartel con las fotos que sacó el jugador
// con el celular (ver celular.js). Con ← y → (o A y D) se pasa de una foto a otra, y con
// Z otra vez se cierra. Mientras está abierta, el jugador se queda quieto (si no, las
// flechas lo harían caminar).

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const TECLA_GALERIA = 'KeyZ';
const TECLAS_ANTERIOR = ['ArrowLeft', 'KeyA'];
const TECLAS_SIGUIENTE = ['ArrowRight', 'KeyD'];
// Lo que dice la galería sin fotos (\n = salto de línea).
const TEXTO_SIN_FOTOS = 'Todavía no sacaste fotos.\nSacá el celu con X y hacé clic.';
const TEXTO_ROBADO = '😢 Te robaron el celu...\ny con él, todas las fotos.';

/**
 * Crea la galería. Los elementos de la página están en index.html.
 *
 * @param {object} opciones
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (para saber si puede actuar
 *        y para dejarlo quieto mientras se ven las fotos)
 * @param {object} opciones.celular  Lo que devuelve crearCelular (de ahí salen las fotos)
 * @returns {{ cerrar: () => void }}
 */
export function crearGaleria({ jugador, celular }) {
  const cartel = document.getElementById('galeria');
  const imagen = document.getElementById('galeria-imagen');
  const descripcion = document.getElementById('galeria-descripcion');
  const numero = document.getElementById('galeria-numero');
  const vacia = document.getElementById('galeria-vacia');

  let abierta = false;
  let actual = 0; // posición en la lista de la foto que se está viendo

  // Muestra la foto número "actual" (o el aviso de que no hay fotos).
  function mostrarFoto() {
    const fotos = celular.fotos();
    const hayFotos = fotos.length > 0;
    imagen.style.display = hayFotos ? 'block' : 'none';
    vacia.style.display = hayFotos ? 'none' : 'block';
    if (!hayFotos) {
      vacia.textContent = celular.estaRobado() ? TEXTO_ROBADO : TEXTO_SIN_FOTOS;
      descripcion.textContent = '';
      numero.textContent = '';
      return;
    }
    const foto = fotos[actual];
    imagen.src = foto.imagen;
    descripcion.textContent = foto.descripcion;
    numero.textContent = (actual + 1) + ' / ' + fotos.length; // por ejemplo "3 / 7"
  }

  function abrir(abrirla) {
    abierta = abrirla;
    cartel.style.display = abierta ? 'block' : 'none';
    jugador.bloquear('galeria', abierta);
    if (abierta) {
      actual = celular.fotos().length - 1; // arranca por la última que sacó
      mostrarFoto();
    }
  }

  // Pasa a otra foto: paso = −1 (la anterior) o +1 (la siguiente).
  // Con el % da la vuelta: después de la última viene la primera, y al revés.
  function cambiarFoto(paso) {
    const cantidad = celular.fotos().length;
    if (cantidad === 0) {
      return;
    }
    actual = (actual + paso + cantidad) % cantidad;
    mostrarFoto();
  }

  document.addEventListener('keydown', (event) => {
    if (event.repeat) {
      return;
    }
    if (abierta) {
      // Abierta, el jugador está bloqueado (puedeActuar da false): por eso estas teclas
      // las revisamos antes de preguntar si puede actuar.
      if (event.code === TECLA_GALERIA) abrir(false);
      if (TECLAS_ANTERIOR.includes(event.code)) cambiarFoto(-1);
      if (TECLAS_SIGUIENTE.includes(event.code)) cambiarFoto(1);
    } else if (event.code === TECLA_GALERIA && jugador.puedeActuar()) {
      abrir(true);
    }
  });

  // En pausa se cierra (como la grilla).
  jugador.controles.addEventListener('unlock', () => {
    if (abierta) {
      abrir(false);
    }
  });

  // Cierra la galería (por ejemplo, si se desmaya con ella abierta).
  function cerrar() {
    if (abierta) {
      abrir(false);
    }
  }

  return { cerrar };
}
