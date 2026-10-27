// Show de luces de un escenario, al ritmo de la música:
//  - Los reflectores barren la tarima. Con los temas conocidos se mueven más rápido
//    y salen a barrer al público.
//  - Los haces, las luces de la tarima y la pantalla del fondo flashean con cada golpe grave.
//    Con los temas tranquilos el flash es mucho más suave.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const SEGUNDOS_TRANSICION = 3; // lo que tarda el show en pasar de tranquilo a euforia (o al revés)

// --- Barrido de los reflectores ---
const VELOCIDAD_BARRIDO_TRANQUI = 0.3; // más grande = barren más rápido
const VELOCIDAD_BARRIDO_EUFORIA = 1.2;
const ALCANCE_TRANQUI = 3; // metros que se mueve, para cada lado, el punto al que apunta cada foco
const ALCANCE_EUFORIA = 8;
const HACIA_PUBLICO_EUFORIA = 9; // metros hacia el público que se corre el barrido en euforia

// --- Flashes ---
const OPACIDAD_HAZ_TRANQUI = 0.08;
const OPACIDAD_HAZ_EUFORIA = 0.15;
const OPACIDAD_HAZ_GOLPE = 0.25; // lo que suma un golpe, con euforia total
const INTENSIDAD_LUZ = 400; // la intensidad que tienen las luces de la tarima (ver escenario.js)
const INTENSIDAD_LUZ_GOLPE = 1200; // lo que suma un golpe, con euforia total
const BRILLO_PANTALLA = 0.8; // el brillo que tiene la pantalla (ver escenario.js)
const BRILLO_PANTALLA_GOLPE = 0.8; // lo que suma un golpe, con euforia total
const FLASH_TRANQUI = 0.25; // con un tema tranquilo, los flashes tienen el 25 % de fuerza

// --- Pulso: la misma idea que en artistas.js ---
// Un valor de 0 a 1 que salta con cada golpe grave y se apaga enseguida.
const SENSIBILIDAD_PULSO = 12;
const CAIDA_PULSO = 5; // por segundo: después de un golpe tarda 1/5 de segundo en apagarse

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Crea el show de luces de un escenario.
 *
 * @param {object} partes  Las partes del escenario que se mueven (las arma escenario.js)
 * @param {THREE.Group} partes.escenario
 * @param {Array<{foco: THREE.Mesh, haz: THREE.Mesh, origen: THREE.Vector3,
 *                objetivo: THREE.Vector3, largo: number}>} partes.reflectores
 *        Para cada reflector: dónde está colgado, a dónde apunta quieto y el largo de su haz
 * @param {THREE.Material} partes.materialHaz  El material que comparten los 4 haces
 * @param {THREE.SpotLight[]} partes.luces  Las luces de la tarima
 * @param {THREE.MeshStandardMaterial} partes.materialPantalla
 * @param {object} musica  La música del escenario (ver crearMusica en musica.js)
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearShowDeLuces(partes, musica) {
  let reloj = 0;
  let energia = 0; // 0 = tema tranquilo, 1 = tema conocido (cambia de a poco)
  let pulso = 0;
  let promedioGraves = 0;

  // Los reusamos en cada cuadro para no crear vectores nuevos todo el tiempo.
  const objetivoLocal = new THREE.Vector3();
  const objetivoMundo = new THREE.Vector3();

  /**
   * Mueve las luces. Se llama en cada cuadro de la animación (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    // --- 1. Energía según el tema (igual que la euforia del público) ---
    const meta = musica.estaSonando() && musica.temaActual().conocido ? 1 : 0;
    const paso = delta / SEGUNDOS_TRANSICION;
    if (energia < meta) {
      energia = Math.min(meta, energia + paso);
    } else {
      energia = Math.max(meta, energia - paso);
    }

    // --- 2. Pulso ---
    pulso = Math.max(0, pulso - CAIDA_PULSO * delta);
    if (musica.estaSonando()) {
      const graves = musica.graves();
      const subida = Math.max(0, graves - promedioGraves);
      pulso = Math.max(pulso, Math.min(1, subida * SENSIBILIDAD_PULSO));
      promedioGraves += (graves - promedioGraves) * Math.min(1, delta * 2);
    }
    // Fuerza de los flashes: suave con temas tranquilos, completa con los conocidos.
    const flash = pulso * mezclar(FLASH_TRANQUI, 1, energia);

    // --- 3. Barrido de los reflectores ---
    const velocidad = mezclar(VELOCIDAD_BARRIDO_TRANQUI, VELOCIDAD_BARRIDO_EUFORIA, energia);
    const alcance = mezclar(ALCANCE_TRANQUI, ALCANCE_EUFORIA, energia);
    const haciaPublico = HACIA_PUBLICO_EUFORIA * energia;

    partes.reflectores.forEach((reflector, i) => {
      // Cada foco con su "fase": así no se mueven todos iguales.
      const fase = i * 1.7;
      // El punto al que apunta se mueve en X y en Z con dos ondas (senos) de distinta
      // velocidad: el haz dibuja una especie de ocho sobre la tarima (o sobre el público).
      objetivoLocal.set(
        reflector.objetivo.x + Math.sin(reloj * velocidad + fase) * alcance,
        reflector.objetivo.y,
        reflector.objetivo.z + haciaPublico + Math.sin(reloj * velocidad * 0.7 + fase * 2) * alcance * 0.6
      );

      // El haz se estira (o se acorta) para llegar justo hasta ese punto.
      // Lo armamos apuntando hacia +Z (ver crearReflectores), así que su largo es la escala en Z.
      reflector.haz.scale.z = reflector.origen.distanceTo(objetivoLocal) / reflector.largo;

      // lookAt necesita el punto en coordenadas del predio: el escenario está movido y girado.
      // localToWorld hace esa cuenta.
      objetivoMundo.copy(objetivoLocal);
      partes.escenario.localToWorld(objetivoMundo);
      reflector.foco.lookAt(objetivoMundo);
      reflector.haz.lookAt(objetivoMundo);
    });

    // --- 4. Flashes con cada golpe ---
    partes.materialHaz.opacity =
      mezclar(OPACIDAD_HAZ_TRANQUI, OPACIDAD_HAZ_EUFORIA, energia) + flash * OPACIDAD_HAZ_GOLPE;
    for (const luz of partes.luces) {
      luz.intensity = INTENSIDAD_LUZ + flash * INTENSIDAD_LUZ_GOLPE;
    }
    partes.materialPantalla.emissiveIntensity = BRILLO_PANTALLA + flash * BRILLO_PANTALLA_GOLPE;
  }

  return { actualizar };
}
