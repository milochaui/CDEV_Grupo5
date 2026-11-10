// El ladrón: un pibe con buzo oscuro y la capucha puesta. Arranca escondido; lo hace
// aparecer, caminar y correr robo.js. Acá solo está su cuerpo, cómo mueve los brazos y la
// marca roja que lleva arriba de la cabeza mientras lo perseguís.
import * as THREE from 'three';
import { crearPersona, posar } from './artistas.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------
const COLOR_BUZO = 0x26262c;
const PASOS_POR_METRO = 0.7; // cuantos más metros por segundo, más rápido mueve los brazos
const VELOCIDAD_CORRIENDO = 6; // metros por segundo: desde acá mueve los brazos como corriendo
const BALANCEO_BRAZOS = 0.5; // radianes que van y vienen los brazos al caminar...
const BALANCEO_BRAZOS_CORRIENDO = 1; // ...y al correr
const REBOTE_CORRIENDO = 0.08; // metros que sube y baja con cada paso al correr
const ALTO_MARCA = 2.8; // metros: la marca va flotando arriba de la cabeza

/**
 * Crea al ladrón (escondido). Mira hacia +Z, con los pies en y = 0, como todas las personas.
 * @returns {{ grupo: THREE.Group, animar: (delta: number, velocidad: number) => void,
 *             marcar: (visible: boolean) => void }}
 *  - animar: mueve los brazos (y el cuerpo, si corre) según a qué velocidad va.
 *  - marcar: muestra o esconde la marca roja de arriba de la cabeza (en la persecución).
 */
export function crearLadron() {
  const persona = crearPersona({
    piel: 0xc68e5e,
    remera: COLOR_BUZO,
    mangas: COLOR_BUZO, // manga larga: es un buzo
    pantalon: 0x1d2433,
  });

  // La capucha: arriba, atrás y a los costados de la cabeza (las medidas son desde el
  // cuello, igual que el pelo en crearPersona de artistas.js). La cara queda a la vista.
  const material = new THREE.MeshStandardMaterial({ color: COLOR_BUZO, roughness: 0.9 });
  const piezas = [
    // [ancho, alto, profundidad, x, y, z]
    [0.3, 0.08, 0.31, 0, 0.36, -0.01], // arriba
    [0.3, 0.34, 0.06, 0, 0.19, -0.145], // atrás
    [0.04, 0.3, 0.29, -0.145, 0.2, -0.01], // costado derecho
    [0.04, 0.3, 0.29, 0.145, 0.2, -0.01], // costado izquierdo
  ];
  for (const [ancho, alto, profundidad, x, y, z] of piezas) {
    const capucha = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, profundidad), material);
    capucha.position.set(x, y, z);
    persona.cabeza.add(capucha);
  }

  // La marca: un triángulo rojo con la punta para abajo, arriba de la cabeza. Así no lo
  // perdés de vista entre la gente. depthTest: false hace que se dibuje aunque haya algo
  // adelante (se ve a través de la gente), y MeshBasicMaterial, que brille sin luz.
  const marca = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.7, 3),
    new THREE.MeshBasicMaterial({ color: 0xff2a2a, depthTest: false })
  );
  marca.rotation.x = Math.PI; // dado vuelta: la punta hacia abajo
  marca.position.y = ALTO_MARCA;
  marca.renderOrder = 10; // que se dibuje después de la gente
  marca.visible = false;
  persona.grupo.add(marca);

  persona.grupo.visible = false;

  let fase = 0; // en qué momento del paso está (un ángulo que va creciendo)

  /**
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   * @param {number} velocidad  Metros por segundo a los que se está moviendo (0 = quieto)
   */
  function animar(delta, velocidad) {
    fase += delta * velocidad * PASOS_POR_METRO * Math.PI * 2;
    const corriendo = velocidad >= VELOCIDAD_CORRIENDO;
    const balanceo = Math.sin(fase) * (corriendo ? BALANCEO_BRAZOS_CORRIENDO : BALANCEO_BRAZOS);
    // Los brazos van para adelante y para atrás, cada uno al revés que el otro.
    // Corriendo, además, doblan más los codos.
    const codo = corriendo ? 1.4 : 0.3;
    posar(persona.izq, balanceo, 0.05, codo);
    posar(persona.der, -balanceo, 0.05, codo);
    // Corriendo rebota un poco con cada paso. Math.abs: siempre para arriba.
    persona.grupo.position.y = corriendo ? Math.abs(Math.sin(fase)) * REBOTE_CORRIENDO : 0;
    marca.rotation.y += delta * 3; // la marca gira, para que llame la atención
  }

  function marcar(visible) {
    marca.visible = visible;
  }

  return { grupo: persona.grupo, animar, marcar };
}
