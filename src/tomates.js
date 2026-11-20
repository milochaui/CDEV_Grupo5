// Tomates: cuando al público no le gusta un tema (abucheo: true en la lista de temas de
// main.js), al terminar le tira tomates a la banda. Cada tomate sale de entre la gente,
// vuela en una parábola (como una pelota) y se revienta contra la tarima: ahí queda una
// mancha roja un rato. Por ahora solo los usa la carpa (ver carpa.js).
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const CANTIDAD = 30;
const SEGUNDOS_TIRANDO = 4; // no salen todos juntos: van saliendo durante este tiempo
const RADIO_TOMATE = 0.09; // metros
const COLOR_TOMATE = 0xc81e14;

// --- De dónde los tiran (medido como las personas de publico.js: x de izquierda a
// derecha, z desde el frente de la tarima hacia el fondo) ---
const ANCHO_TIRADORES = 5; // de −5 a 5 metros en x
const Z_TIRADORES_MIN = 1.5; // las primeras filas...
const Z_TIRADORES_MAX = 9; // ...hasta la mitad del público
const ALTURA_MANO = 1.9; // los tiran de arriba de la cabeza

// --- A dónde apuntan: alrededor del cantante ---
const DISPERSION_X = 2.5; // metros para cada lado
const DISPERSION_Z = 1; // metros para adelante y para atrás (así no caen fuera de la tarima)

// --- Vuelo ---
const SEGUNDOS_VUELO_MIN = 0.9;
const SEGUNDOS_VUELO_MAX = 1.4;
const GRAVEDAD = 9.8;
const VUELTAS = 8; // radianes por segundo que gira en el aire

// --- La mancha ---
const ANCHO_MANCHA = 2.2; // el tomate reventado: más ancho...
const ALTO_MANCHA = 0.2; // ...y aplastado
const SEGUNDOS_MANCHA = 25; // cuánto queda en la tarima
const SEGUNDOS_DESAPARECER = 2; // al final se achica de a poco

function alAzar(minimo, maximo) {
  return minimo + Math.random() * (maximo - minimo);
}

/**
 * Crea los tomates de un escenario.
 * @param {object} config
 * @param {number} config.alturaTarima  A qué altura está el piso de la tarima (metros)
 * @param {{x: number, z: number}} config.cantante  Dónde está el cantante (coordenadas del público)
 * @returns {{ malla: THREE.InstancedMesh, tirar: () => void, actualizar: (delta: number) => void }}
 *          malla: hay que agregarla al grupo del público (usa sus mismas coordenadas)
 */
export function crearTomates(config) {
  // Como los papelitos: una InstancedMesh dibuja todos los tomates de una sola vez.
  const malla = new THREE.InstancedMesh(
    new THREE.SphereGeometry(RADIO_TOMATE, 8, 6),
    new THREE.MeshStandardMaterial({ color: COLOR_TOMATE, roughness: 0.4 }),
    CANTIDAD
  );
  malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  malla.frustumCulled = false; // se mueven: la zona que calcula Three.js no serviría
  malla.visible = false; // hasta el primer abucheo no hay nada que dibujar

  // Cada tomate tiene un momento de salida, un punto de partida, una velocidad y un
  // lugar donde cae. Lo calculamos todo al tirarlo (ver tirar).
  const tomates = [];
  for (let i = 0; i < CANTIDAD; i++) {
    tomates.push({
      salida: 0, // segundos (desde que empezaron a tirar) en que sale de la mano
      duracionVuelo: 1,
      x: 0, y: 0, z: 0, // de dónde sale
      velocidadX: 0, velocidadY: 0, velocidadZ: 0,
      giroMancha: 0, // la mancha queda girada para cualquier lado
    });
  }

  let tiempo = 0; // segundos desde que empezaron a tirar
  const ubicacion = new THREE.Object3D(); // nos ayuda a armar la matriz de cada tomate

  // Empiezan a tirar. Para cada tomate elegimos de dónde sale, dónde cae y cuánto vuela,
  // y de ahí sacamos la velocidad con la que hay que tirarlo para que llegue justo.
  function tirar() {
    tiempo = 0;
    malla.visible = true;
    for (const tomate of tomates) {
      tomate.salida = alAzar(0, SEGUNDOS_TIRANDO);
      tomate.duracionVuelo = alAzar(SEGUNDOS_VUELO_MIN, SEGUNDOS_VUELO_MAX);
      tomate.x = alAzar(-ANCHO_TIRADORES, ANCHO_TIRADORES);
      tomate.y = ALTURA_MANO;
      tomate.z = alAzar(Z_TIRADORES_MIN, Z_TIRADORES_MAX);
      const destinoX = config.cantante.x + alAzar(-DISPERSION_X, DISPERSION_X);
      const destinoY = config.alturaTarima;
      const destinoZ = config.cantante.z + alAzar(-DISPERSION_Z, DISPERSION_Z);

      // Tiro oblicuo (como en Física): en x y en z va a velocidad constante, así que
      // velocidad = distancia / tiempo. En y la gravedad lo va frenando: para llegar a
      // destinoY en ese tiempo hay que sumarle GRAVEDAD · tiempo / 2 de velocidad para arriba.
      const t = tomate.duracionVuelo;
      tomate.velocidadX = (destinoX - tomate.x) / t;
      tomate.velocidadZ = (destinoZ - tomate.z) / t;
      tomate.velocidadY = (destinoY - tomate.y) / t + (GRAVEDAD * t) / 2;
      tomate.giroMancha = alAzar(0, Math.PI * 2);
    }
  }

  /**
   * Mueve los tomates. Solo hace cuentas mientras hay alguno volando o en la tarima.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    if (!malla.visible) {
      return;
    }
    tiempo += delta;
    let quedaAlguno = false;

    tomates.forEach((tomate, i) => {
      const t = tiempo - tomate.salida; // segundos desde que salió de la mano
      if (t < 0) {
        // Todavía no lo tiraron: escala 0 (no se ve).
        ubicacion.scale.setScalar(0);
        quedaAlguno = true;
      } else if (t < tomate.duracionVuelo) {
        // Volando: posición = salida + velocidad · t, y en y además la gravedad (− g·t²/2).
        ubicacion.position.set(
          tomate.x + tomate.velocidadX * t,
          tomate.y + tomate.velocidadY * t - (GRAVEDAD * t * t) / 2,
          tomate.z + tomate.velocidadZ * t
        );
        ubicacion.rotation.set(t * VUELTAS, t * VUELTAS * 0.7, 0); // da vueltas en el aire
        ubicacion.scale.setScalar(1);
        quedaAlguno = true;
      } else {
        // Se reventó: queda aplastado en el lugar donde cayó, como una mancha.
        const enLaTarima = t - tomate.duracionVuelo; // segundos desde que cayó
        const d = tomate.duracionVuelo;
        ubicacion.position.set(
          tomate.x + tomate.velocidadX * d,
          config.alturaTarima + 0.01, // apenas sobre el piso, para que no "titile"
          tomate.z + tomate.velocidadZ * d
        );
        ubicacion.rotation.set(0, tomate.giroMancha, 0);
        // Al final se achica hasta desaparecer (de 1 a 0 en los últimos segundos).
        const tamano = Math.max(0, Math.min(1, (SEGUNDOS_MANCHA - enLaTarima) / SEGUNDOS_DESAPARECER));
        ubicacion.scale.set(ANCHO_MANCHA * tamano, ALTO_MANCHA * tamano, ANCHO_MANCHA * tamano);
        if (tamano > 0) {
          quedaAlguno = true;
        }
      }
      ubicacion.updateMatrix();
      malla.setMatrixAt(i, ubicacion.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;

    // Ya se borraron todas las manchas: dejamos de dibujarlos.
    if (!quedaAlguno) {
      malla.visible = false;
    }
  }

  return { malla, tirar, actualizar };
}
