// Construcción de un escenario de festival con formas simples (estilo low-poly).
// La función crearEscenario(config) se puede usar varias veces para armar
// distintos escenarios, cada uno con su banda, su color y su posición.
import * as THREE from 'three';

// --- Medidas del escenario, en metros ---
const ANCHO = 24; // de izquierda a derecha
const PROFUNDIDAD = 12; // de adelante hacia atrás
const ALTO_TARIMA = 2; // altura del piso donde toca la banda
const ALTO_ESTRUCTURA = 14; // altura de los travesaños del techo

// Lado de los travesaños (vigas cuadradas)
const GROSOR_VIGA = 0.6;

/**
 * Crea un escenario completo y lo devuelve como un THREE.Group.
 * Un Group junta muchos objetos para poder moverlos todos juntos como si fueran uno.
 * El frente del escenario mira hacia +Z.
 *
 * @param {object} config
 * @param {string} config.nombre    Nombre de la banda (se muestra en el cartel)
 * @param {number} config.color     Color principal en hexadecimal, por ejemplo 0xff3355
 * @param {{x: number, z: number}} config.posicion  Lugar del predio donde va el escenario
 *
 * Además, en escenario.userData.colisiones deja la lista de zonas sólidas
 * (tarima y torres de parlantes) que el jugador no puede atravesar.
 */
export function crearEscenario(config) {
  const escenario = new THREE.Group();

  // userData es un objeto libre que Three.js nos deja usar para guardar datos propios.
  // Acá vamos juntando las cajas de colisión a medida que creamos las partes.
  escenario.userData.colisiones = [];

  // Materiales compartidos: los creamos una sola vez y los reusamos en varias partes.
  // Así el navegador tiene menos trabajo (mejor rendimiento).
  const materiales = {
    tarima: new THREE.MeshStandardMaterial({ color: 0x3a3a3a }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.6, roughness: 0.4 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x111111 }),
  };

  // Cada función agrega una parte del escenario al grupo.
  crearTarima(escenario, materiales);
  crearEstructura(escenario, materiales);
  crearPantalla(escenario, materiales, config.color);
  crearTorresDeParlantes(escenario, materiales);
  crearReflectores(escenario, materiales, config.color);
  crearLuces(escenario, config.color);
  crearCartel(escenario, config.nombre, config.color);

  // Movemos todo el grupo al lugar del predio indicado.
  escenario.position.set(config.posicion.x, 0, config.posicion.z);

  // Las cajas de colisión se calcularon con el escenario en el origen (0, 0).
  // Les sumamos la posición para que queden en coordenadas del predio.
  for (const caja of escenario.userData.colisiones) {
    caja.minX += config.posicion.x;
    caja.maxX += config.posicion.x;
    caja.minZ += config.posicion.z;
    caja.maxZ += config.posicion.z;
  }
  return escenario;
}

// Guarda una caja de colisión vista "desde arriba" (un rectángulo en el piso).
// Como el jugador siempre camina por el piso, no hace falta tener en cuenta la altura.
// (x, z) es el centro del rectángulo.
function agregarColision(escenario, x, z, ancho, profundidad) {
  escenario.userData.colisiones.push({
    minX: x - ancho / 2,
    maxX: x + ancho / 2,
    minZ: z - profundidad / 2,
    maxZ: z + profundidad / 2,
  });
}

// ---------------------------------------------------------------------------
// Partes del escenario
// ---------------------------------------------------------------------------

// Tarima: una caja grande y chata donde se para la banda.
function crearTarima(escenario, materiales) {
  // BoxGeometry(ancho, alto, profundidad)
  const tarima = new THREE.Mesh(
    new THREE.BoxGeometry(ANCHO, ALTO_TARIMA, PROFUNDIDAD),
    materiales.tarima
  );
  // Los objetos se posicionan desde su centro: subimos la mitad de la altura
  // para que la caja quede apoyada sobre el piso.
  tarima.position.y = ALTO_TARIMA / 2;
  escenario.add(tarima);

  // La tarima es sólida. Le sumamos el grosor de las columnas de las esquinas
  // (que sobresalen un poco) para que tampoco se puedan atravesar.
  agregarColision(escenario, 0, 0, ANCHO + 0.6, PROFUNDIDAD + 0.6);
}

// Estructura metálica: 4 columnas en las esquinas y travesaños arriba formando un marco.
function crearEstructura(escenario, materiales) {
  // CylinderGeometry(radio arriba, radio abajo, altura, cantidad de lados)
  // Con solo 8 lados se ve "low-poly" y es muy liviano de dibujar.
  const geometriaColumna = new THREE.CylinderGeometry(0.3, 0.3, ALTO_ESTRUCTURA, 8);

  const esquinas = [
    [-ANCHO / 2, PROFUNDIDAD / 2], // adelante a la izquierda
    [ANCHO / 2, PROFUNDIDAD / 2], // adelante a la derecha
    [-ANCHO / 2, -PROFUNDIDAD / 2], // atrás a la izquierda
    [ANCHO / 2, -PROFUNDIDAD / 2], // atrás a la derecha
  ];
  for (const [x, z] of esquinas) {
    const columna = new THREE.Mesh(geometriaColumna, materiales.metal);
    columna.position.set(x, ALTO_ESTRUCTURA / 2, z);
    escenario.add(columna);
  }

  // Travesaños: cajas largas y finas que unen las columnas por arriba.
  const largoFrente = ANCHO + GROSOR_VIGA;
  const travesanos = [
    // [ancho, profundidad, x, z]
    [largoFrente, GROSOR_VIGA, 0, PROFUNDIDAD / 2], // adelante
    [largoFrente, GROSOR_VIGA, 0, -PROFUNDIDAD / 2], // atrás
    [GROSOR_VIGA, PROFUNDIDAD, -ANCHO / 2, 0], // costado izquierdo
    [GROSOR_VIGA, PROFUNDIDAD, ANCHO / 2, 0], // costado derecho
  ];
  for (const [ancho, profundidad, x, z] of travesanos) {
    const viga = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, GROSOR_VIGA, profundidad),
      materiales.metal
    );
    viga.position.set(x, ALTO_ESTRUCTURA, z);
    escenario.add(viga);
  }
}

// Pantalla: un rectángulo brillante al fondo, con una pared negra detrás.
function crearPantalla(escenario, materiales, color) {
  // Pared de fondo: va desde la tarima hasta los travesaños.
  const altoPared = ALTO_ESTRUCTURA - ALTO_TARIMA;
  const pared = new THREE.Mesh(
    new THREE.BoxGeometry(ANCHO, altoPared, 0.4),
    materiales.negro
  );
  pared.position.set(0, ALTO_TARIMA + altoPared / 2, -PROFUNDIDAD / 2 + 0.4);
  escenario.add(pared);

  // La pantalla usa "emissive": emite su propio color, así brilla aunque sea de noche
  // sin necesitar una luz que la ilumine.
  const materialPantalla = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: color,
    emissiveIntensity: 0.8,
  });
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), materialPantalla);
  pantalla.position.set(0, ALTO_TARIMA + 1 + 4, -PROFUNDIDAD / 2 + 0.7);
  escenario.add(pantalla);
}

// Torres de parlantes: una a cada costado, apoyadas en el piso, afuera de la tarima.
function crearTorresDeParlantes(escenario, materiales) {
  const anchoCaja = 3;
  const altoCaja = 2.5;
  const cajasPorTorre = 3;

  const geometriaCaja = new THREE.BoxGeometry(anchoCaja, altoCaja, anchoCaja);
  // Los "conos" de los parlantes son cilindros muy chatos de pocos lados.
  const geometriaCono = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 12);
  const materialCono = new THREE.MeshStandardMaterial({ color: 0x444444 });

  // Una torre a la izquierda (-1) y otra a la derecha (+1)
  for (const lado of [-1, 1]) {
    const x = lado * (ANCHO / 2 + anchoCaja / 2 + 1);
    const z = PROFUNDIDAD / 2 - anchoCaja / 2;

    // Toda la torre es sólida: una sola caja de colisión alcanza.
    agregarColision(escenario, x, z, anchoCaja, anchoCaja);

    for (let i = 0; i < cajasPorTorre; i++) {
      // Apilamos las cajas una arriba de la otra (con 0.1 m de separación).
      const y = altoCaja / 2 + i * (altoCaja + 0.1);
      const caja = new THREE.Mesh(geometriaCaja, materiales.negro);
      caja.position.set(x, y, z);
      escenario.add(caja);

      // Dos conos en el frente de cada caja.
      for (const desplazamiento of [-0.75, 0.75]) {
        const cono = new THREE.Mesh(geometriaCono, materialCono);
        // El cilindro nace "parado"; lo giramos 90° para que mire hacia adelante.
        cono.rotation.x = Math.PI / 2;
        cono.position.set(x + desplazamiento, y, z + anchoCaja / 2 + 0.05);
        escenario.add(cono);
      }
    }
  }
}

// Reflectores: 4 focos colgados del travesaño de adelante, apuntando a la tarima.
// Cada uno tiene un "haz de luz" falso: un cono transparente. No es una luz de verdad,
// por eso casi no afecta el rendimiento, pero se ve como el rayo de un reflector.
function crearReflectores(escenario, materiales, color) {
  // El cuerpo del foco: un cilindro corto. Lo giramos para que su eje apunte hacia +Z;
  // así después lookAt() lo orienta directo hacia el objetivo.
  const geometriaFoco = new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8);
  geometriaFoco.rotateX(Math.PI / 2);

  // Material del haz: color del escenario, muy transparente y con mezcla "aditiva"
  // (suma su color a lo que hay detrás, como hace la luz real).
  const materialHaz = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // evita que el haz "tape" otros objetos transparentes
    side: THREE.DoubleSide,
  });

  const posicionesX = [-9, -3, 3, 9];
  for (const x of posicionesX) {
    // Dónde está colgado el foco (justo debajo del travesaño de adelante).
    const origen = new THREE.Vector3(x, ALTO_ESTRUCTURA - 0.8, PROFUNDIDAD / 2);
    // A dónde apunta: un punto sobre la tarima. Los focos se cruzan hacia el centro.
    const objetivo = new THREE.Vector3(-x * 0.4, ALTO_TARIMA, 0);

    const foco = new THREE.Mesh(geometriaFoco, materiales.metal);
    foco.position.copy(origen);
    foco.lookAt(objetivo);
    escenario.add(foco);

    // El haz: un cono abierto con la punta en el foco y la base sobre la tarima.
    const largo = origen.distanceTo(objetivo);
    // ConeGeometry(radio de la base, altura, lados, segmentos de alto, abierto)
    const geometriaHaz = new THREE.ConeGeometry(1.8, largo, 16, 1, true);
    // Por defecto la punta del cono está arriba y el centro en el medio.
    // Lo movemos para que la punta quede en (0,0,0) y lo giramos para que la base
    // quede hacia +Z. Así lookAt() lo apunta igual que al foco.
    geometriaHaz.translate(0, -largo / 2, 0);
    geometriaHaz.rotateX(-Math.PI / 2);

    const haz = new THREE.Mesh(geometriaHaz, materialHaz);
    haz.position.copy(origen);
    haz.lookAt(objetivo);
    escenario.add(haz);
  }
}

// Luces reales del escenario: solo 2 SpotLight (luz tipo "linterna") y SIN sombras,
// para que corra fluido en cualquier notebook.
function crearLuces(escenario, color) {
  const luces = [
    { color: color, x: -6 }, // una del color de la banda
    { color: 0xffffff, x: 6 }, // y una blanca
  ];
  for (const datos of luces) {
    // SpotLight(color, intensidad, distancia máxima, ángulo de apertura, borde suave)
    const luz = new THREE.SpotLight(datos.color, 400, 40, Math.PI / 5, 0.5);
    luz.position.set(datos.x, ALTO_ESTRUCTURA - 1, PROFUNDIDAD / 2);
    // La luz apunta a su "target" (objetivo): el centro de la tarima.
    luz.target.position.set(0, ALTO_TARIMA, -1);
    escenario.add(luz);
    escenario.add(luz.target); // el target tiene que estar en la escena para que funcione
  }
}

// Cartel con el nombre de la banda, arriba del travesaño de adelante.
// Dibujamos el texto en un <canvas> 2D (como en una hoja) y lo usamos como textura.
function crearCartel(escenario, nombre, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const colorCss = new THREE.Color(color).getStyle(); // por ejemplo "rgb(255,51,85)"

  // Fondo oscuro con un borde del color de la banda
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = colorCss;
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Texto centrado
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nombre, canvas.width / 2, canvas.height / 2, canvas.width - 80);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace; // para que los colores se vean correctos

  // MeshBasicMaterial no depende de las luces: el cartel siempre se lee bien.
  const altoCartel = 3.5;
  const cartel = new THREE.Mesh(
    new THREE.PlaneGeometry(altoCartel * 4, altoCartel), // misma proporción que el canvas (4:1)
    new THREE.MeshBasicMaterial({ map: textura })
  );
  cartel.position.set(0, ALTO_ESTRUCTURA + GROSOR_VIGA / 2 + altoCartel / 2, PROFUNDIDAD / 2);
  escenario.add(cartel);
}
