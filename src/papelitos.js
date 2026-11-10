// Papelitos: cuando el tema explota (ver ronda.js), dos cañones al frente de la tarima tiran
// una nube de papelitos de colores sobre el público. Salen rápido, el aire los frena enseguida
// y después caen despacio, dando vueltas, hasta quedar en el piso.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const CANTIDAD = 350;
const SEGUNDOS_EN_PANTALLA = 18; // desde que salen hasta que desaparecen
const SEGUNDOS_DESAPARECER = 2; // al final se achican de a poco

// --- Cañones: en el frente de la tarima, a los dos lados (coordenadas del público) ---
const X_CANIONES = 8; // metros del centro a cada cañón
const ALTURA_CANIONES = 2;

// --- Velocidad de salida, en metros por segundo ---
const VELOCIDAD_ARRIBA_MIN = 18;
const VELOCIDAD_ARRIBA_MAX = 36;
const VELOCIDAD_ADELANTE_MAX = 45; // hacia el público (los lentos caen cerca, los rápidos lejos)
const VELOCIDAD_COSTADO_MAX = 14; // para cada lado

// --- Vuelo ---
const FRENADO_DEL_AIRE = 1.8; // más grande = se frenan antes
const GRAVEDAD = 9.8;
const VELOCIDAD_CAIDA = 1.1; // metros por segundo: un papel no cae más rápido que esto
const VAIVEN = 0.5; // metros por segundo que se mueven de costado al caer

// Con color un poco apagado: si son muy brillantes, el bloom (ver main.js) los vuelve manchas.
const COLORES = [0xd8d8d8, 0x74acdf, 0xd9a400, 0xc8324a, 0x3fa35a, 0xc060c0];

function alAzar(minimo, maximo) {
  return minimo + Math.random() * (maximo - minimo);
}

/**
 * Crea los papelitos de un escenario.
 * @returns {{ malla: THREE.InstancedMesh, tirar: () => void, actualizar: (delta: number) => void }}
 *          malla: hay que agregarla al grupo del público (usa sus mismas coordenadas)
 */
export function crearPapelitos() {
  // Como la gente: una InstancedMesh dibuja todos los papelitos de una sola vez.
  const malla = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.1, 0.07),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), // se ven de los dos lados
    CANTIDAD
  );
  malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  malla.frustumCulled = false; // se mueven: la zona que calcula Three.js no serviría
  malla.visible = false; // hasta el primer boom no hay nada que dibujar

  const color = new THREE.Color();
  const papelitos = [];
  for (let i = 0; i < CANTIDAD; i++) {
    malla.setColorAt(i, color.setHex(COLORES[i % COLORES.length]));
    papelitos.push({
      x: 0, y: 0, z: 0, // dónde está
      velocidadX: 0, velocidadY: 0, velocidadZ: 0,
      giroX: 0, giroZ: 0, // cómo está dado vuelta
      vueltasX: alAzar(2, 7), vueltasZ: alAzar(2, 7), // qué tan rápido gira
      fase: alAzar(0, Math.PI * 2), // para que cada uno se hamaque a su ritmo
    });
  }

  let tiempo = 0; // segundos desde el último tiro
  const ubicacion = new THREE.Object3D(); // nos ayuda a armar la matriz de cada papelito

  // Dispara los dos cañones. Cada papelito sale de uno de los dos, con su propia velocidad.
  function tirar() {
    tiempo = 0;
    malla.visible = true;
    papelitos.forEach((papelito, i) => {
      papelito.x = i % 2 === 0 ? -X_CANIONES : X_CANIONES;
      papelito.y = ALTURA_CANIONES;
      papelito.z = 0.5;
      papelito.velocidadX = alAzar(-VELOCIDAD_COSTADO_MAX, VELOCIDAD_COSTADO_MAX);
      papelito.velocidadY = alAzar(VELOCIDAD_ARRIBA_MIN, VELOCIDAD_ARRIBA_MAX);
      papelito.velocidadZ = alAzar(0, VELOCIDAD_ADELANTE_MAX);
    });
  }

  /**
   * Mueve los papelitos. Solo hace cuentas mientras están en el aire o en el piso.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    if (!malla.visible) {
      return;
    }
    tiempo += delta;
    if (tiempo > SEGUNDOS_EN_PANTALLA) {
      malla.visible = false;
      return;
    }

    // Al final se achican hasta desaparecer (de 1 a 0 en los últimos segundos).
    const tamano = Math.min(1, (SEGUNDOS_EN_PANTALLA - tiempo) / SEGUNDOS_DESAPARECER);
    // El aire les saca velocidad: en cada cuadro les queda una parte de la que tenían.
    const frenado = Math.max(0, 1 - FRENADO_DEL_AIRE * delta);

    papelitos.forEach((papelito, i) => {
      if (papelito.y > 0.03) {
        // En el aire: gravedad y frenado. Math.max: el papel no pasa de su velocidad de caída.
        papelito.velocidadX *= frenado;
        papelito.velocidadZ *= frenado;
        papelito.velocidadY = Math.max(-VELOCIDAD_CAIDA, papelito.velocidadY * frenado - GRAVEDAD * delta);

        // Se mueve, y al caer se hamaca un poco de costado (una onda, como el balanceo del público).
        const vaiven = Math.sin(tiempo * 2 + papelito.fase) * VAIVEN;
        papelito.x += (papelito.velocidadX + vaiven) * delta;
        papelito.y = Math.max(0.03, papelito.y + papelito.velocidadY * delta);
        papelito.z += papelito.velocidadZ * delta;

        // Da vueltas mientras vuela. Si llegó al piso, queda acostado.
        papelito.giroX = papelito.y > 0.03 ? papelito.giroX + papelito.vueltasX * delta : -Math.PI / 2;
        papelito.giroZ = papelito.y > 0.03 ? papelito.giroZ + papelito.vueltasZ * delta : 0;
      }

      ubicacion.position.set(papelito.x, papelito.y, papelito.z);
      ubicacion.rotation.set(papelito.giroX, 0, papelito.giroZ);
      ubicacion.scale.setScalar(tamano);
      ubicacion.updateMatrix();
      malla.setMatrixAt(i, ubicacion.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;
  }

  return { malla, tirar, actualizar };
}
