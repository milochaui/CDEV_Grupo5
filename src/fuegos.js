// Fuegos artificiales detrás de un escenario. Se lanzan al terminar cada tema conocido.
// Cada cohete sube, se va frenando y, arriba de todo, explota en muchas chispas que
// caen y se apagan.
//
// Todo se dibuja con un solo THREE.Points: una "nube de puntos" donde cada punto es un
// cohete o una chispa. Tenemos una lista fija de partículas (MAXIMO_PARTICULAS) y las
// vamos reusando: una partícula "muerta" (sin vida) queda libre para la próxima chispa.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const MAXIMO_PARTICULAS = 2000;
const COHETES_POR_LANZAMIENTO = 8;
const SEGUNDOS_ENTRE_COHETES = 0.5; // en promedio
const VELOCIDAD_COHETE_MIN = 25; // metros por segundo hacia arriba (explota a unos 35-50 m)
const VELOCIDAD_COHETE_MAX = 31;
const CHISPAS_POR_EXPLOSION = 140;
const VELOCIDAD_CHISPAS = 11; // metros por segundo al explotar
const VIDA_CHISPAS = 1.8; // segundos (más o menos)
const GRAVEDAD = 9.8; // la de los cohetes (la real)
const GRAVEDAD_CHISPAS = 3; // las chispas caen más despacio, como si flotaran
const FRENADO_CHISPAS = 1.2; // el aire las va frenando
const TAMANO_PUNTO = 1.2; // metros

// Colores de las explosiones (además del color de la banda)
const COLORES = [0xffffff, 0xffd700, 0xff3355, 0x33aaff, 0x66ff66, 0xff9900, 0xcc66ff];

/**
 * Crea los fuegos artificiales de un escenario.
 * Se arman con el escenario hacia +Z: los cohetes salen desde atrás (z negativo).
 *
 * @param {number} colorBanda  El color de la banda, para algunas explosiones
 * @returns {{ puntos: THREE.Points, lanzar: () => void, actualizar: (delta: number) => void }}
 */
export function crearFuegosArtificiales(colorBanda) {
  // --- Datos de cada partícula ---
  // Float32Array es una lista de números "compacta", que se puede mandar directo a la
  // placa de video. Para posiciones, velocidades y colores usamos 3 números por partícula.
  const posiciones = new Float32Array(MAXIMO_PARTICULAS * 3);
  const colores = new Float32Array(MAXIMO_PARTICULAS * 3); // el que se ve (se apaga de a poco)
  const coloresBase = new Float32Array(MAXIMO_PARTICULAS * 3); // el original
  const velocidades = new Float32Array(MAXIMO_PARTICULAS * 3);
  const vida = new Float32Array(MAXIMO_PARTICULAS); // segundos que le quedan (0 = libre)
  const vidaTotal = new Float32Array(MAXIMO_PARTICULAS);
  const esCohete = new Uint8Array(MAXIMO_PARTICULAS); // 1 = cohete (explota al morir)

  // --- La nube de puntos ---
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  geometria.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  const material = new THREE.PointsMaterial({
    size: TAMANO_PUNTO,
    vertexColors: true, // cada punto con su color
    transparent: true,
    blending: THREE.AdditiveBlending, // suman luz: un punto negro no se ve
    depthWrite: false,
    fog: false, // que la niebla no los apague de lejos
  });
  const puntos = new THREE.Points(geometria, material);
  puntos.frustumCulled = false; // las partículas se mueven: que se dibuje siempre

  const color = new THREE.Color(); // lo reusamos
  let siguienteLibre = 0;

  // Busca una partícula libre, dando la vuelta a la lista como las agujas de un reloj.
  // Devuelve −1 si están todas ocupadas.
  function buscarLibre() {
    for (let n = 0; n < MAXIMO_PARTICULAS; n++) {
      const i = (siguienteLibre + n) % MAXIMO_PARTICULAS;
      if (vida[i] <= 0) {
        siguienteLibre = (i + 1) % MAXIMO_PARTICULAS;
        return i;
      }
    }
    return -1;
  }

  // Prende una partícula en (x, y, z) con velocidad (vx, vy, vz).
  function crearParticula(x, y, z, vx, vy, vz, segundos, colorHex, cohete) {
    const i = buscarLibre();
    if (i === -1) {
      return;
    }
    posiciones.set([x, y, z], i * 3);
    velocidades.set([vx, vy, vz], i * 3);
    color.setHex(colorHex);
    coloresBase.set([color.r, color.g, color.b], i * 3);
    vida[i] = segundos;
    vidaTotal[i] = segundos;
    esCohete[i] = cohete ? 1 : 0;
  }

  function alAzar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  // Sale un cohete desde atrás del escenario. Su vida dura lo que tarda en llegar arriba
  // (velocidad / gravedad): cuando se le acaba, explota.
  function lanzarCohete() {
    const velocidad = VELOCIDAD_COHETE_MIN + Math.random() * (VELOCIDAD_COHETE_MAX - VELOCIDAD_COHETE_MIN);
    const colorCohete = Math.random() < 0.4 ? colorBanda : alAzar(COLORES);
    crearParticula(
      (Math.random() - 0.5) * 24, // x: a lo ancho del escenario
      2,
      -8 - Math.random() * 6, // z: detrás de la pantalla
      (Math.random() - 0.5) * 3, // un poco inclinado
      velocidad,
      (Math.random() - 0.5) * 2,
      (velocidad / GRAVEDAD) * 0.95,
      colorCohete,
      true
    );
  }

  // Explosión: muchas chispas que salen en todas direcciones desde el cohete "i".
  function explotar(i) {
    const x = posiciones[i * 3];
    const y = posiciones[i * 3 + 1];
    const z = posiciones[i * 3 + 2];
    color.setRGB(coloresBase[i * 3], coloresBase[i * 3 + 1], coloresBase[i * 3 + 2]);
    const colorExplosion = color.getHex();
    for (let n = 0; n < CHISPAS_POR_EXPLOSION; n++) {
      // Una dirección al azar en una esfera: un ángulo alrededor (giro) y una altura (h, de −1 a 1).
      const giro = Math.random() * Math.PI * 2;
      const h = Math.random() * 2 - 1;
      const radio = Math.sqrt(1 - h * h);
      const velocidad = VELOCIDAD_CHISPAS * (0.8 + Math.random() * 0.2);
      crearParticula(
        x, y, z,
        Math.cos(giro) * radio * velocidad,
        h * velocidad,
        Math.sin(giro) * radio * velocidad,
        VIDA_CHISPAS * (0.7 + Math.random() * 0.6),
        colorExplosion,
        false
      );
    }
  }

  // --- Lanzamientos programados ---
  let reloj = 0;
  const lanzamientos = []; // momentos (en segundos de "reloj") en que sale cada cohete

  // Programa una tanda de cohetes, uno detrás del otro.
  function lanzar() {
    let momento = reloj;
    for (let n = 0; n < COHETES_POR_LANZAMIENTO; n++) {
      momento += Math.random() * 2 * SEGUNDOS_ENTRE_COHETES;
      lanzamientos.push(momento);
    }
  }

  /**
   * Mueve las partículas. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    // ¿Sale algún cohete? (recorremos al revés porque vamos borrando de la lista)
    for (let k = lanzamientos.length - 1; k >= 0; k--) {
      if (reloj >= lanzamientos[k]) {
        lanzarCohete();
        lanzamientos.splice(k, 1); // splice saca el elemento k de la lista
      }
    }

    for (let i = 0; i < MAXIMO_PARTICULAS; i++) {
      if (vida[i] <= 0) {
        continue; // libre: no hay nada que mover
      }
      vida[i] -= delta;

      // Velocidad: la gravedad la tira para abajo; a las chispas además las frena el aire.
      if (esCohete[i]) {
        velocidades[i * 3 + 1] -= GRAVEDAD * delta;
      } else {
        velocidades[i * 3 + 1] -= GRAVEDAD_CHISPAS * delta;
        const frenado = Math.max(0, 1 - FRENADO_CHISPAS * delta);
        velocidades[i * 3] *= frenado;
        velocidades[i * 3 + 1] *= frenado;
        velocidades[i * 3 + 2] *= frenado;
      }
      // Posición: avanza según la velocidad.
      posiciones[i * 3] += velocidades[i * 3] * delta;
      posiciones[i * 3 + 1] += velocidades[i * 3 + 1] * delta;
      posiciones[i * 3 + 2] += velocidades[i * 3 + 2] * delta;

      // Brillo: el cohete brilla siempre; las chispas se apagan a medida que pierden vida
      // y titilan un poco (el número al azar).
      let brillo = 1;
      if (vida[i] <= 0) {
        brillo = 0; // se murió: la apagamos
        if (esCohete[i]) {
          explotar(i);
        }
      } else if (!esCohete[i]) {
        brillo = (vida[i] / vidaTotal[i]) * (0.7 + Math.random() * 0.3);
      }
      colores[i * 3] = coloresBase[i * 3] * brillo;
      colores[i * 3 + 1] = coloresBase[i * 3 + 1] * brillo;
      colores[i * 3 + 2] = coloresBase[i * 3 + 2] * brillo;
    }

    // Avisamos que cambiaron las posiciones y los colores, para que se manden a la placa de video.
    geometria.attributes.position.needsUpdate = true;
    geometria.attributes.color.needsUpdate = true;
  }

  return { puntos, lanzar, actualizar };
}
