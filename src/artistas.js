// Los artistas arriba de cada escenario: la banda que toca, armada con formas simples
// (cajas y cilindros, estilo low-poly), tratando de respetar el look de cada músico.
//
// Las bandas de la noche:
//  - Ciro y los Persas: Ciro con su tapado negro largo y la armónica.
//  - Las Pastillas del Abuelo: el Piti con lentes de sol chiquitos y un vaso de fernet,
//    el guitarrista barbudo y el saxo.
//  - Andrés Calamaro: sombrero, lentes oscuros, barba canosa y traje negro.
// Las que tocan antes (de la tarde):
//  - Guasones: Facundo con melena negra, campera de cuero y pañuelo rojo al cuello,
//    cantando con la guitarra colgada. Rock stone.
//  - Callejeros: Pato con el micrófono en la mano y el puño en alto, y el vientista que
//    toca el bandoneón en los temas tranquilos y el saxo en los de pogo.
//  - Turf: Levinton con traje setentoso beige, polera negra, lentes naranjas, colgante
//    y pantalón oxford, bailando como loco.
//  - Intoxicados: el Pity con su gorro de lana rasta (rojo, amarillo y verde) y la guitarra.
//  - No Te Va Gustar: Emiliano con barba y guitarra criolla, y la sección de vientos
//    (trompeta, trombón y saxo).
//  - La Vela Puerca: los dos cantantes saltando juntos adelante (el Enano con gorro y
//    barba, el Cebolla con la celeste), con trompeta y saxo.
//
// Qué banda se ve lo decide la programación de cada escenario (ver escenario.js).
// Los músicos se mueven con los graves del tema, y algunos cambian según el tema sea
// de pogo (conocido) o tranqui. Cuando el jugador llena el aguante-metro, el cantante
// se da vuelta y lo saluda.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// Los artistas son un poco más grandes que una persona real (1.15 veces),
// así se distinguen bien desde el público.
const ESCALA_ARTISTAS = 1.15;

// "Pulso": un valor de 0 a 1 que salta con cada golpe grave del tema y se apaga enseguida.
// Con él los músicos cabecean y el baterista pega.
const SENSIBILIDAD_PULSO = 12; // más grande = reaccionan más fuerte a cada golpe
const CAIDA_PULSO = 4; // por segundo: después de un golpe tarda 1/4 de segundo en apagarse

const BALANCEO = 0.04; // cuánto se mecen de costado (radianes, 0.04 ≈ 2°)
const CABECEO = 0.25; // cuánto bajan la cabeza con cada golpe (radianes)

// --- Saludo del cantante (cuando el jugador llena el aguante-metro) ---
const VELOCIDAD_SALUDO = 2; // con 2 tarda medio segundo en darse vuelta y levantar el brazo
const GIRO_MAXIMO_SALUDO = 1; // radianes (≈ 57°): no se da vuelta más que esto
const Z_CANTANTE = 2.8; // dónde está parado el cantante en la tarima

// ---------------------------------------------------------------------------
// Medidas del cuerpo, en metros (antes de aplicar la escala)
// ---------------------------------------------------------------------------
const ALTO_PIERNAS = 0.85;
const ALTO_TORSO = 0.62;
const ALTO_CUELLO = ALTO_PIERNAS + ALTO_TORSO; // 1.47: donde termina el torso
const ALTO_HOMBROS = ALTO_CUELLO - 0.05;
const LARGO_BRAZO = 0.3; // del hombro al codo
const LARGO_ANTEBRAZO = 0.28; // del codo a la muñeca
const POSICION_MANO = -(LARGO_ANTEBRAZO + 0.05); // centro de la mano, medido desde el codo

// ---------------------------------------------------------------------------
// Colores y materiales
// ---------------------------------------------------------------------------
const PIEL_CLARA = 0xf0c8a0;
const PIEL_MEDIA = 0xd9a066;
const PIEL_TRIGUENA = 0xb07850;
const NEGRO = 0x111111;
const GRIS_OSCURO = 0x2a2a2a;
const GRIS = 0x666666;
const BLANCO = 0xeeeeee;
const JEAN = 0x34507a;
const PELO_NEGRO = 0x151010;
const PELO_CASTANO = 0x4a2e1a;
const MADERA = 0x6b4226;
const MADERA_CLARA = 0xc68a3c;
const BEIGE = 0xc8b48a; // el traje setentoso de Levinton
const ROJO = 0xc0182a;
const AMARILLO = 0xf2c300;
const VERDE = 0x1f8a3a;
const CELESTE_URUGUAY = 0x7bb6e8; // la camiseta de la selección uruguaya
const PELO_CASTANO_CLARO = 0x6b4a2a;

// Guardamos un material por color y lo reusamos en todas las piezas de ese color:
// así el navegador tiene menos trabajo.
const materialesPorColor = {};
function material(color) {
  if (!materialesPorColor[color]) {
    materialesPorColor[color] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
  }
  return materialesPorColor[color];
}

// Materiales especiales (brillantes)
const MATERIAL_CROMADO = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.3 });
const MATERIAL_DORADO = new THREE.MeshStandardMaterial({ color: 0xe0a920, metalness: 0.4, roughness: 0.3 });
const MATERIAL_LENTES = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 });
// Cuero negro: más liso (menos "roughness") que la tela, así brilla un poco con las luces.
const MATERIAL_CUERO = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.35, metalness: 0.1 });
// Lentes naranjas: brillan un poco solos (emissive), como si les pegaran las luces del escenario.
const MATERIAL_LENTES_NARANJA = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0x662200, roughness: 0.15 });

// ---------------------------------------------------------------------------
// Ayudas para armar piezas
// ---------------------------------------------------------------------------

// Crea una pieza (Mesh), la ubica en (x, y, z) y la agrega a "padre".
// "aspecto" puede ser un color (por ejemplo 0x111111) o un material ya creado.
function pieza(padre, geometria, aspecto, x, y, z) {
  const mat = typeof aspecto === 'number' ? material(aspecto) : aspecto;
  const malla = new THREE.Mesh(geometria, mat);
  malla.position.set(x, y, z);
  padre.add(malla);
  return malla;
}

function caja(ancho, alto, profundidad) {
  return new THREE.BoxGeometry(ancho, alto, profundidad);
}

// Pocos lados = estilo low-poly y más liviano de dibujar.
function cilindro(radioArriba, radioAbajo, alto, lados = 10) {
  return new THREE.CylinderGeometry(radioArriba, radioAbajo, alto, lados);
}

// ---------------------------------------------------------------------------
// Una persona
// ---------------------------------------------------------------------------

/**
 * Arma una persona mirando hacia +Z, con los pies en y = 0.
 * (También la usa barra.js para el barman.)
 * Su izquierda queda hacia +X y su derecha hacia −X.
 *
 * @param {object} aspecto
 * @param {number} aspecto.piel
 * @param {number} aspecto.remera     Color del torso (remera, camisa o saco)
 * @param {number} [aspecto.mangas]   Si tiene manga larga, el color de las mangas
 * @param {number} aspecto.pantalon
 * @param {number} [aspecto.pelo]     Sin pelo = pelado
 * @param {boolean} [aspecto.peloLargo]
 * @param {number} [aspecto.barba]    Sin barba = afeitado
 * @param {boolean} [aspecto.barbaLarga]
 * @returns {{ grupo, cabeza, izq: {brazo, antebrazo, lado}, der: {brazo, antebrazo, lado} }}
 */
export function crearPersona(aspecto) {
  const grupo = new THREE.Group();

  // --- Piernas y zapatos ---
  for (const lado of [-1, 1]) {
    pieza(grupo, caja(0.17, ALTO_PIERNAS, 0.19), aspecto.pantalon, lado * 0.11, ALTO_PIERNAS / 2, 0);
    pieza(grupo, caja(0.17, 0.08, 0.28), NEGRO, lado * 0.11, 0.04, 0.05);
  }

  // --- Torso ---
  pieza(grupo, caja(0.46, ALTO_TORSO, 0.26), aspecto.remera, 0, ALTO_PIERNAS + ALTO_TORSO / 2, 0);

  // --- Cabeza ---
  // Es un grupo con su punto de giro en el cuello: así puede cabecear.
  // Medidas desde el cuello: la cara va de 0.05 (mentón) a 0.33 (coronilla)
  // y su frente queda en z = 0.125.
  const cabeza = new THREE.Group();
  cabeza.position.y = ALTO_CUELLO;
  grupo.add(cabeza);
  pieza(cabeza, caja(0.1, 0.06, 0.1), aspecto.piel, 0, 0.03, 0); // cuello
  pieza(cabeza, caja(0.24, 0.28, 0.25), aspecto.piel, 0, 0.19, 0); // cara

  if (aspecto.pelo) {
    pieza(cabeza, caja(0.26, 0.07, 0.27), aspecto.pelo, 0, 0.345, -0.005); // arriba
    pieza(cabeza, caja(0.26, 0.2, 0.05), aspecto.pelo, 0, 0.24, -0.12); // nuca
    if (aspecto.peloLargo) {
      // Melena: atrás hasta los hombros y a los costados de la cara
      pieza(cabeza, caja(0.3, 0.36, 0.08), aspecto.pelo, 0, 0.16, -0.12);
      for (const lado of [-1, 1]) {
        pieza(cabeza, caja(0.04, 0.28, 0.2), aspecto.pelo, lado * 0.135, 0.19, -0.03);
      }
    }
  }

  if (aspecto.barba) {
    if (aspecto.barbaLarga) {
      // Barba larga: tapa la mandíbula y cae sobre el pecho
      pieza(cabeza, caja(0.25, 0.28, 0.1), aspecto.barba, 0, 0.03, 0.1);
    } else {
      pieza(cabeza, caja(0.25, 0.12, 0.04), aspecto.barba, 0, 0.1, 0.12);
    }
  }

  // --- Brazos ---
  // Cada brazo tiene dos partes: brazo (hombro → codo) y antebrazo (codo → mano).
  // Las dos son grupos con su punto de giro en la articulación. Girados 0, cuelgan.
  // Con manga corta, el brazo es del color de la remera y el antebrazo de la piel.
  const colorBrazo = aspecto.mangas ?? aspecto.remera;
  const colorAntebrazo = aspecto.mangas ?? aspecto.piel;

  function crearBrazo(lado) {
    const brazo = new THREE.Group();
    brazo.position.set(lado * 0.29, ALTO_HOMBROS, 0);
    grupo.add(brazo);
    pieza(brazo, caja(0.11, LARGO_BRAZO, 0.11), colorBrazo, 0, -LARGO_BRAZO / 2, 0);

    const antebrazo = new THREE.Group();
    antebrazo.position.y = -LARGO_BRAZO; // el codo, en la punta del brazo
    brazo.add(antebrazo);
    pieza(antebrazo, caja(0.1, LARGO_ANTEBRAZO, 0.1), colorAntebrazo, 0, -LARGO_ANTEBRAZO / 2, 0);
    pieza(antebrazo, caja(0.08, 0.1, 0.08), aspecto.piel, 0, POSICION_MANO, 0); // mano

    return { brazo, antebrazo, lado };
  }

  return {
    grupo,
    cabeza,
    izq: crearBrazo(1),
    der: crearBrazo(-1),
  };
}

/**
 * Pone un brazo en una posición. Todos los ángulos en radianes:
 *  - adelante: cuánto se levanta el brazo hacia el frente (π/2 = horizontal)
 *  - afuera: cuánto se abre hacia el costado (negativo = hacia adentro, cruzando el cuerpo)
 *  - codo: cuánto se dobla el antebrazo hacia adelante
 */
export function posar(brazo, adelante, afuera, codo) {
  brazo.brazo.rotation.x = -adelante;
  // Para el brazo izquierdo (lado = 1) "afuera" es girar hacia +X; para el derecho, hacia −X.
  brazo.brazo.rotation.z = afuera * brazo.lado;
  brazo.antebrazo.rotation.x = -codo;
}

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

// Saludo del cantante. "pose" es la posición normal del brazo [adelante, afuera, codo]
// y "cantidad" va de 0 (no saluda) a 1 (brazo bien arriba, moviéndose de lado a lado).
// También gira el cuerpo hacia el jugador (saludo.angulo, lo calcula crearBanda).
function saludar(persona, brazo, pose, reloj, saludo) {
  persona.grupo.rotation.y = saludo.angulo * saludo.cantidad;
  const vaiven = Math.sin(reloj * 8) * 0.35;
  posar(
    brazo,
    mezclar(pose[0], 2.7, saludo.cantidad),
    mezclar(pose[1], 0.3 + vaiven, saludo.cantidad),
    mezclar(pose[2], 0.2, saludo.cantidad)
  );
}

// Ropa abierta adelante (una campera o un saco): dos paneles a los costados del torso y uno
// en la espalda, un poquito más grandes que el torso, así lo tapan. En el medio queda a la
// vista la remera de abajo. "abertura" es el ancho de esa parte del medio, en metros.
// "aspecto" puede ser un color o un material (como en pieza).
function ponerCampera(persona, aspecto, abertura) {
  const anchoPanel = (0.48 - abertura) / 2;
  const alto = ALTO_TORSO + 0.02;
  const y = ALTO_PIERNAS + ALTO_TORSO / 2;
  for (const lado of [-1, 1]) {
    pieza(persona.grupo, caja(anchoPanel, alto, 0.28), aspecto, lado * (abertura / 2 + anchoPanel / 2), y, 0);
    // Solapa: una tira sobre el pecho, más abierta arriba que abajo
    const solapa = pieza(persona.grupo, caja(0.05, 0.24, 0.012), aspecto, lado * (abertura / 2 + 0.03), ALTO_CUELLO - 0.13, 0.146);
    solapa.rotation.z = -lado * 0.25;
  }
  pieza(persona.grupo, caja(0.48, alto, 0.02), aspecto, 0, y, -0.14); // espalda
}

// Movimiento que comparten todos: se mecen de costado y cabecean con cada golpe.
// "fase" hace que cada músico se meza a su propio tiempo.
function balancear(persona, reloj, pulso, fase) {
  persona.grupo.rotation.z = BALANCEO * Math.sin(reloj * 2 + fase);
  persona.cabeza.rotation.x = 0.05 + pulso * CABECEO; // positivo = cabeza hacia adelante
}

// ---------------------------------------------------------------------------
// Instrumentos y accesorios
// ---------------------------------------------------------------------------

// Pie de micrófono. El cantante va detrás (hacia −Z), así que el micrófono apunta para ese lado.
function crearPieDeMicrofono(alto) {
  const pie = new THREE.Group();
  pieza(pie, cilindro(0.16, 0.16, 0.03), NEGRO, 0, 0.015, 0); // base
  pieza(pie, cilindro(0.015, 0.015, alto, 6), MATERIAL_CROMADO, 0, alto / 2, 0); // caño

  // El micrófono: un grupo inclinado hacia la boca del cantante.
  const microfono = new THREE.Group();
  microfono.position.y = alto;
  microfono.rotation.x = -1.2; // gira el "arriba" del micrófono hacia −Z
  pie.add(microfono);
  pieza(microfono, cilindro(0.022, 0.018, 0.16, 8), NEGRO, 0, 0.08, 0); // mango
  pieza(microfono, new THREE.SphereGeometry(0.038, 8, 6), GRIS, 0, 0.18, 0); // reja
  return pie;
}

// Guitarra (o bajo, con el mástil más largo). Se arma parada: el cuerpo abajo en (0, 0, 0)
// y el mástil hacia arriba. Las caras del cuerpo miran hacia +Z.
function crearGuitarra(color, largoMastil) {
  const guitarra = new THREE.Group();

  // Cuerpo con "forma de ocho": dos cilindros chatos, girados para mirar al frente.
  const abajo = pieza(guitarra, cilindro(0.2, 0.2, 0.07, 12), color, 0, 0, 0);
  abajo.rotation.x = Math.PI / 2;
  const arriba = pieza(guitarra, cilindro(0.15, 0.15, 0.07, 12), color, 0, 0.2, 0);
  arriba.rotation.x = Math.PI / 2;
  pieza(guitarra, caja(0.16, 0.04, 0.02), NEGRO, 0, -0.05, 0.04); // puente

  // Mástil y clavijero
  pieza(guitarra, caja(0.06, largoMastil, 0.035), MADERA, 0, 0.3 + largoMastil / 2, 0.01);
  pieza(guitarra, caja(0.09, 0.16, 0.035), NEGRO, 0, 0.38 + largoMastil, 0.01);
  return guitarra;
}

// Parche del bombo con el nombre de la banda (como en las baterías de verdad).
// Lo dibujamos en un <canvas> redondo, igual que el cartel del escenario.
// Los nombres de varias palabras van en varios renglones ("LA / VELA / PUERCA").
function crearParcheConNombre(texto, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // Parche negro (uno blanco, con los reflectores encima, se ve como una mancha de luz)
  // con un aro del color de la batería y el nombre en letras claras.
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = new THREE.Color(color).getStyle();
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.stroke();

  const renglones = texto.split(' ');
  const alto = renglones.length === 1 ? 64 : 50; // con varios renglones, letra más chica
  ctx.font = 'bold ' + alto + 'px Arial';
  ctx.fillStyle = '#eeeeee';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  renglones.forEach((renglon, i) => {
    // Centramos el bloque de renglones: el del medio queda en y = 128.
    const y = 128 + (i - (renglones.length - 1) / 2) * alto;
    ctx.fillText(renglon, 128, y, 190);
  });

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  // CircleGeometry: un disco que mira hacia +Z (justo para el frente del bombo).
  return new THREE.Mesh(
    new THREE.CircleGeometry(0.27, 16),
    // Brilla un poco solo (emissive), así el nombre se lee de noche.
    new THREE.MeshStandardMaterial({ map: textura, emissive: 0xffffff, emissiveMap: textura, emissiveIntensity: 0.2 })
  );
}

// Batería, vista desde el baterista: él está en (0, 0, 0) y los tambores hacia +Z.
// Con "nombre", el parche de adelante del bombo lleva el nombre de la banda.
function crearBateria(color, nombre) {
  const bateria = new THREE.Group();

  // Bombo: un cilindro acostado que mira al público, con el parche de adelante blanco.
  const bombo = pieza(bateria, cilindro(0.3, 0.3, 0.4, 14), color, 0, 0.3, 0.65);
  bombo.rotation.x = Math.PI / 2;
  if (nombre) {
    const parche = crearParcheConNombre(nombre, color);
    parche.position.set(0, 0.3, 0.856);
    bateria.add(parche);
  } else {
    const parche = pieza(bateria, cilindro(0.27, 0.27, 0.01, 14), BLANCO, 0, 0.3, 0.855);
    parche.rotation.x = Math.PI / 2;
  }

  // Tambores: [radio, alto, x, y, z]. La izquierda del baterista es +X.
  const tambores = [
    [0.17, 0.14, 0.22, 0.62, 0.32], // redoblante (entre las rodillas)
    [0.13, 0.16, 0.14, 0.72, 0.6], // tom 1 (sobre el bombo)
    [0.14, 0.17, -0.16, 0.72, 0.6], // tom 2
    [0.2, 0.35, -0.48, 0.42, 0.32], // tom de piso
  ];
  for (const [radio, alto, x, y, z] of tambores) {
    pieza(bateria, cilindro(radio, radio, alto, 12), color, x, y, z);
    pieza(bateria, cilindro(radio * 0.95, radio * 0.95, 0.01, 12), BLANCO, x, y + alto / 2, z); // parche
  }

  // Platillos: [radio, x, y, z, inclinación]. Discos dorados finitos sobre un caño.
  const platillos = [
    [0.18, 0.5, 0.82, 0.3, 0], // hi-hat
    [0.24, 0.55, 1.25, 0.65, 0.3], // crash
    [0.26, -0.6, 1.1, 0.6, -0.3], // ride
  ];
  for (const [radio, x, y, z, inclinacion] of platillos) {
    pieza(bateria, cilindro(0.01, 0.01, y, 6), MATERIAL_CROMADO, x, y / 2, z); // caño
    const platillo = pieza(bateria, cilindro(radio, radio, 0.012, 14), MATERIAL_DORADO, x, y, z);
    platillo.rotation.z = inclinacion;
  }
  return bateria;
}

// Teclado sobre su soporte. El tecladista va detrás (hacia −Z).
function crearTeclado() {
  const teclado = new THREE.Group();
  // Soporte en "X" a cada costado
  for (const x of [-0.42, 0.42]) {
    for (const giro of [-0.5, 0.5]) {
      const pata = pieza(teclado, caja(0.04, 1.05, 0.04), NEGRO, x, 0.46, 0);
      pata.rotation.x = giro;
    }
  }
  pieza(teclado, caja(1.15, 0.08, 0.36), NEGRO, 0, 0.95, 0); // el teclado
  pieza(teclado, caja(1.05, 0.025, 0.14), BLANCO, 0, 1.0, -0.09); // teclas blancas
  return teclado;
}

// Saxo: un tubo dorado con la campana hacia arriba. (0, 0, 0) es la boquilla.
function crearSaxo() {
  const saxo = new THREE.Group();
  pieza(saxo, cilindro(0.045, 0.035, 0.6, 8), MATERIAL_DORADO, 0, -0.32, 0); // tubo principal
  const curva = pieza(saxo, cilindro(0.05, 0.05, 0.18, 8), MATERIAL_DORADO, 0, -0.62, 0.06);
  curva.rotation.x = Math.PI / 2; // acostado: une el tubo con la campana
  pieza(saxo, cilindro(0.1, 0.05, 0.26, 10), MATERIAL_DORADO, 0, -0.49, 0.13); // campana
  const tudel = pieza(saxo, cilindro(0.015, 0.02, 0.12, 6), MATERIAL_DORADO, 0, 0.0, -0.05);
  tudel.rotation.x = -1.1; // el caño finito que va a la boca
  return saxo;
}

// Guitarra criolla (acústica, la de Emiliano en No Te Va Gustar): más grande y gruesa que
// la eléctrica, de madera clara y con la "boca" (el agujero redondo) en el medio.
// Se arma igual que crearGuitarra: parada, con el cuerpo en (0, 0, 0).
function crearGuitarraCriolla() {
  const guitarra = new THREE.Group();
  const abajo = pieza(guitarra, cilindro(0.25, 0.25, 0.11, 14), MADERA_CLARA, 0, 0, 0);
  abajo.rotation.x = Math.PI / 2;
  const arriba = pieza(guitarra, cilindro(0.19, 0.19, 0.11, 14), MADERA_CLARA, 0, 0.25, 0);
  arriba.rotation.x = Math.PI / 2;
  const boca = pieza(guitarra, cilindro(0.065, 0.065, 0.01, 12), NEGRO, 0, 0.14, 0.056);
  boca.rotation.x = Math.PI / 2;
  pieza(guitarra, caja(0.18, 0.035, 0.02), MADERA, 0, -0.09, 0.06); // puente

  pieza(guitarra, caja(0.06, 0.5, 0.035), MADERA, 0, 0.4 + 0.25, 0.01); // mástil
  pieza(guitarra, caja(0.09, 0.16, 0.035), MADERA, 0, 0.4 + 0.5 + 0.08, 0.01); // clavijero
  return guitarra;
}

// Micrófono de mano. Va pegado a la mano (en el antebrazo), armado a lo largo de +Z:
// el mango sale de la mano y la reja queda en la punta.
// Devuelve la función apuntar(), que gira el micrófono para que la reja mire a la boca.
// Hay que llamarla en cada cuadro, después de mover el brazo: así, aunque el cantante
// baile o salte, el micrófono sigue frente a la boca.
function crearMicrofonoDeMano(persona, brazo) {
  const microfono = new THREE.Group();
  microfono.position.y = POSICION_MANO;
  brazo.antebrazo.add(microfono);
  const mango = pieza(microfono, cilindro(0.022, 0.018, 0.14, 8), NEGRO, 0, 0, 0.05);
  mango.rotation.x = Math.PI / 2; // acostado a lo largo de Z
  pieza(microfono, new THREE.SphereGeometry(0.038, 8, 6), GRIS, 0, 0, 0.14); // reja

  // Un punto invisible (Object3D) en la boca, pegado a la cabeza: es a donde apunta.
  const boca = new THREE.Object3D();
  boca.position.set(0, 0.12, 0.125);
  persona.cabeza.add(boca);
  const posicionBoca = new THREE.Vector3(); // la reusamos en cada cuadro

  function apuntar() {
    // lookAt gira un objeto para que su frente (+Z) mire hacia un punto del mundo.
    boca.getWorldPosition(posicionBoca);
    microfono.lookAt(posicionBoca);
  }
  return apuntar;
}
// [adelante, afuera, codo] del brazo que tiene el micrófono de mano: el brazo va hacia
// adelante y hacia adentro (cruzando el pecho) y el codo doblado deja la mano frente a la cara.
const POSE_MICROFONO = [1.0, -0.9, 1.4];

// Trompeta: (0, 0, 0) es la boquilla y el tubo va hacia adelante (+Z), con la campana al final.
// Los cilindros nacen parados (a lo largo de Y); girados π/2 en X quedan acostados hacia +Z
// (y su "arriba", el radio de arriba, queda adelante).
function crearTrompeta() {
  const trompeta = new THREE.Group();
  const tubo = pieza(trompeta, cilindro(0.016, 0.016, 0.4, 6), MATERIAL_DORADO, 0, 0, 0.2);
  tubo.rotation.x = Math.PI / 2;
  const campana = pieza(trompeta, cilindro(0.075, 0.018, 0.14, 12), MATERIAL_DORADO, 0, 0, 0.47);
  campana.rotation.x = Math.PI / 2;
  // Los tres pistones, paraditos arriba del tubo
  for (const z of [0.15, 0.2, 0.25]) {
    pieza(trompeta, cilindro(0.014, 0.014, 0.09, 6), MATERIAL_DORADO, 0, 0.04, z);
  }
  // El segundo tubo, por debajo y en paralelo
  const tuboDeAbajo = pieza(trompeta, cilindro(0.014, 0.014, 0.26, 6), MATERIAL_DORADO, 0, -0.05, 0.2);
  tuboDeAbajo.rotation.x = Math.PI / 2;
  return trompeta;
}

// Trombón: igual que la trompeta pero más largo, y con la "vara": el tubo doble de abajo
// que el músico estira y encoge con la mano. La vara es un grupo aparte para poder moverla.
// Devuelve { grupo, vara }.
function crearTrombon() {
  const grupo = new THREE.Group();
  // Tubo de la campana, un poco hacia la izquierda del músico (+X)
  const tubo = pieza(grupo, cilindro(0.018, 0.018, 0.5, 6), MATERIAL_DORADO, 0.06, 0, 0.25);
  tubo.rotation.x = Math.PI / 2;
  const campana = pieza(grupo, cilindro(0.11, 0.02, 0.18, 12), MATERIAL_DORADO, 0.06, 0, 0.58);
  campana.rotation.x = Math.PI / 2;

  // La vara: dos tubos finitos paralelos, unidos adelante por una curva (una cajita).
  const vara = new THREE.Group();
  vara.position.y = -0.08;
  grupo.add(vara);
  for (const x of [-0.03, 0.03]) {
    const tuboVara = pieza(vara, cilindro(0.012, 0.012, 0.55, 6), MATERIAL_DORADO, x, 0, 0.3);
    tuboVara.rotation.x = Math.PI / 2;
  }
  pieza(vara, caja(0.08, 0.025, 0.025), MATERIAL_DORADO, 0, 0, 0.58);
  return { grupo, vara };
}

// Bandoneón: dos tapas de madera negra con botones y el fuelle en el medio.
// Se arma acostado, con las tapas a la izquierda y a la derecha. abrir(apertura) estira el
// fuelle: "apertura" es su ancho en metros. Devuelve { grupo, abrir }.
function crearBandoneon() {
  const grupo = new THREE.Group();

  // El fuelle mide 1 m de ancho y lo "escalamos" en X al ancho que queremos.
  // Las tiras blancas son los pliegues: al escalar, se separan entre ellas.
  const fuelle = new THREE.Group();
  grupo.add(fuelle);
  pieza(fuelle, caja(1, 0.19, 0.19), NEGRO, 0, 0, 0);
  for (const x of [-0.3, -0.1, 0.1, 0.3]) {
    pieza(fuelle, caja(0.06, 0.2, 0.2), BLANCO, x, 0, 0);
  }

  const tapas = [];
  for (const lado of [-1, 1]) {
    const tapa = new THREE.Group();
    grupo.add(tapa);
    pieza(tapa, caja(0.06, 0.23, 0.23), NEGRO, 0, 0, 0);
    // Botones (nácar): una grillita de 3 x 3 del lado de afuera
    for (const y of [-0.06, 0, 0.06]) {
      for (const z of [-0.06, 0, 0.06]) {
        pieza(tapa, caja(0.01, 0.025, 0.025), BLANCO, lado * 0.035, y, z);
      }
    }
    tapas.push({ tapa, lado });
  }

  function abrir(apertura) {
    fuelle.scale.x = apertura;
    for (const { tapa, lado } of tapas) {
      tapa.position.x = lado * (apertura / 2 + 0.03);
    }
  }
  abrir(0.2);
  return { grupo, abrir };
}

// ---------------------------------------------------------------------------
// Músicos genéricos (los integrantes de cada banda)
// Cada función devuelve { grupo, animar(reloj, pulso, saludo, tema) }. El grupo lo ubica la
// banda; animar se llama en cada cuadro. Solo los cantantes usan "saludo", y "tema" (el que
// está sonando: tema.conocido dice si es de pogo) lo usan los que cambian según el tema.
// ---------------------------------------------------------------------------

// Guitarrista o bajista: el instrumento cuelga delante de la cadera y
// la mano derecha rasguea más fuerte con cada golpe.
function crearGuitarrista(aspecto, colorGuitarra, esBajo, fase) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  grupo.add(persona.grupo);

  const guitarra = crearGuitarra(colorGuitarra, esBajo ? 0.75 : 0.5);
  guitarra.position.set(0.03, 1.0, 0.18);
  guitarra.rotation.z = -1.1; // mástil hacia la izquierda del músico, apuntando un poco arriba
  persona.grupo.add(guitarra); // va pegada al cuerpo: se mece con él

  posar(persona.izq, 0.55, 0.45, 0.9); // mano en el mástil
  posar(persona.der, 0.3, 0.05, 1.0); // mano en las cuerdas

  function animar(reloj, pulso) {
    balancear(persona, reloj, pulso, fase);
    // Rasgueo: el antebrazo sube y baja rápido; con cada golpe, más fuerte.
    const rasgueo = Math.sin(reloj * 14 + fase) * (0.1 + pulso * 0.2);
    persona.der.antebrazo.rotation.x = -(1.0 + rasgueo);
  }
  return { grupo, animar };
}

// Baterista: sentado detrás de la batería. Pega con la derecha en cada golpe
// y con la izquierda lleva el ritmo en el hi-hat.
// Con "nombre", el bombo lleva el nombre de la banda (ver crearBateria).
function crearBaterista(aspecto, colorBateria, nombre) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  // Como está sentado, lo hundimos en la tarima de la batería: las piernas quedan
  // escondidas adentro y desde el público se ve el torso detrás de los tambores.
  persona.grupo.position.y = -0.4;
  grupo.add(persona.grupo);
  grupo.add(crearBateria(colorBateria, nombre));

  // Palillos: un cilindro finito en cada mano, apuntando hacia adelante y abajo.
  for (const brazo of [persona.izq, persona.der]) {
    const geometriaPalillo = cilindro(0.012, 0.012, 0.4, 5);
    geometriaPalillo.translate(0, 0.2, 0); // que arranque en la mano
    const palillo = pieza(brazo.antebrazo, geometriaPalillo, 0xd8b98a, 0, POSICION_MANO, 0);
    palillo.rotation.x = 2.2;
  }

  posar(persona.izq, 0.5, 0.35, 0.9);
  posar(persona.der, 0.5, 0.45, 0.9);

  function animar(reloj, pulso) {
    persona.cabeza.rotation.x = 0.05 + pulso * CABECEO;
    // Con el pulso en 1 (el golpe) el palillo está abajo; mientras se apaga, sube.
    persona.der.antebrazo.rotation.x = -(0.6 + (1 - pulso) * 0.6);
    persona.izq.antebrazo.rotation.x = -(0.9 + Math.sin(reloj * 14) * 0.2);
  }
  return { grupo, animar };
}

// Tecladista: las manos "tocan" subiendo y bajando sobre las teclas.
function crearTecladista(aspecto, fase) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  grupo.add(persona.grupo);
  const teclado = crearTeclado();
  teclado.position.z = 0.55;
  grupo.add(teclado);

  posar(persona.izq, 0.5, 0.1, 0.7);
  posar(persona.der, 0.5, 0.1, 0.7);

  function animar(reloj, pulso) {
    balancear(persona, reloj, pulso, fase);
    persona.izq.antebrazo.rotation.x = -(0.7 + Math.sin(reloj * 9) * 0.08);
    persona.der.antebrazo.rotation.x = -(0.7 + Math.sin(reloj * 11 + 1) * 0.08);
  }
  return { grupo, animar };
}

// Saxofonista: el saxo va en la boca y se tira para atrás con cada golpe.
function crearSaxofonista(aspecto, fase) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  grupo.add(persona.grupo);

  const saxo = crearSaxo();
  saxo.position.set(0, ALTO_CUELLO + 0.12, 0.2); // la boquilla, frente a la boca
  saxo.rotation.set(-0.2, 0, -0.15); // la campana hacia adelante y un poco a la derecha del músico
  persona.grupo.add(saxo);

  posar(persona.izq, 0.6, -0.9, 1.3); // mano de arriba
  posar(persona.der, 0.3, -0.4, 1.0); // mano de abajo

  function animar(reloj, pulso) {
    balancear(persona, reloj, pulso, fase);
    persona.grupo.rotation.x = -pulso * 0.08; // negativo = se tira para atrás
  }
  return { grupo, animar };
}

// Trompetista o trombonista ("instrumento": 'trompeta' o 'trombon'). Los dos brazos
// sostienen el instrumento frente a la boca, y con cada golpe lo levantan (y tiran la
// cabeza para atrás), como cuando los vientos meten un "¡pa-pa!" fuerte.
// El trombonista además estira y encoge la vara.
function crearVientista(aspecto, instrumento, fase) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  grupo.add(persona.grupo);

  // El instrumento va en un grupo con su punto de giro en la boca: así sube y baja desde ahí.
  const soporte = new THREE.Group();
  soporte.position.set(0, ALTO_CUELLO + 0.12, 0.14);
  persona.grupo.add(soporte);
  let vara = null; // solo el trombón tiene vara
  if (instrumento === 'trompeta') {
    soporte.add(crearTrompeta());
  } else {
    const trombon = crearTrombon();
    soporte.add(trombon.grupo);
    vara = trombon.vara;
  }

  // Las dos manos sobre el instrumento, frente a la cara
  posar(persona.izq, 1.25, -0.35, 1.3);
  posar(persona.der, 1.25, -0.35, 1.3);

  function animar(reloj, pulso) {
    balancear(persona, reloj, pulso, fase);
    // Negativo = la campana para arriba. La cabeza acompaña al instrumento.
    soporte.rotation.x = -0.05 - pulso * 0.2;
    persona.cabeza.rotation.x = soporte.rotation.x;
    if (vara !== null) {
      // La vara va y viene (de 0 a 0.3 m) y la mano derecha la sigue:
      // cuanto más estirada, más adelante el brazo y más derecho el codo.
      const estirada = 0.15 + 0.15 * Math.sin(reloj * 2.5 + fase);
      vara.position.z = estirada;
      posar(persona.der, 1.65, -0.15, 0.5 - estirada * 1.2);
    }
  }
  return { grupo, animar };
}

// Bandoneón y saxo (el vientista de Callejeros): en los temas tranquilos toca el bandoneón,
// estirando y cerrando el fuelle despacio y con la cabeza gacha; en los de pogo agarra el saxo.
function crearBandoneonistaYSaxofonista(aspecto, fase) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  grupo.add(persona.grupo);

  // El saxo, igual que en crearSaxofonista
  const saxo = crearSaxo();
  saxo.position.set(0, ALTO_CUELLO + 0.12, 0.2);
  saxo.rotation.set(-0.2, 0, -0.15);
  persona.grupo.add(saxo);

  // El bandoneón, a la altura de la panza y un poco adelante
  const bandoneon = crearBandoneon();
  bandoneon.grupo.position.set(0, 1.22, 0.5);
  persona.grupo.add(bandoneon.grupo);

  function animar(reloj, pulso, saludo, tema) {
    const conSaxo = tema.conocido;
    saxo.visible = conSaxo;
    bandoneon.grupo.visible = !conSaxo;
    balancear(persona, reloj, pulso, fase);

    if (conSaxo) {
      posar(persona.izq, 0.6, -0.9, 1.3);
      posar(persona.der, 0.3, -0.4, 1.0);
      persona.grupo.rotation.x = -pulso * 0.08; // se tira para atrás con cada golpe
      return;
    }

    persona.grupo.rotation.x = 0;
    persona.cabeza.rotation.x = 0.35; // mirando el bandoneón
    // El fuelle se abre y se cierra despacio: entre 0.1 y 0.34 m.
    const apertura = 0.22 + 0.12 * Math.sin(reloj * 1.6 + fase);
    bandoneon.abrir(apertura);
    // Cada mano agarra una tapa. Las tapas están a "apertura / 2 + 0.06" del centro y los
    // hombros a 0.29: hay que cerrar el brazo hacia adentro. Con el codo así doblado, la mano
    // queda a 0.505 m del hombro (medido a lo largo del brazo), así que el ángulo hacia afuera
    // sale de: seno(ángulo) = cuánto hay que moverse / 0.505. Math.asin hace la cuenta al revés.
    const afuera = Math.asin((apertura / 2 + 0.06 - 0.29) / 0.505);
    posar(persona.izq, 0.75, afuera, 0.9);
    posar(persona.der, 0.75, afuera, 0.9);
  }
  return { grupo, animar };
}

// ---------------------------------------------------------------------------
// Los cantantes: cada uno con su look
// ---------------------------------------------------------------------------

// Ciro: tapado negro largo, pelo negro corto, armónica en la mano izquierda
// y la derecha agarrando el micrófono.
function crearCiro() {
  const grupo = new THREE.Group();
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: GRIS_OSCURO,
    mangas: NEGRO, // las mangas del tapado
    pantalon: NEGRO,
    pelo: PELO_NEGRO,
  });
  grupo.add(persona.grupo);

  // El tapado: una "caja" que se ensancha hacia abajo, de los hombros hasta las rodillas.
  // Es un cilindro de 4 lados (una pirámide cortada) girado 45° para que sus caras
  // queden al frente y a los costados, y aplastado de adelante hacia atrás.
  const altoTapado = 1.12;
  const geometriaTapado = cilindro(0.36, 0.46, altoTapado, 4);
  geometriaTapado.rotateY(Math.PI / 4);
  geometriaTapado.scale(1, 1, 0.6);
  pieza(persona.grupo, geometriaTapado, NEGRO, 0, ALTO_CUELLO - altoTapado / 2, 0);
  // Cuello del tapado levantado, detrás de la nuca
  pieza(persona.grupo, caja(0.34, 0.16, 0.06), NEGRO, 0, ALTO_CUELLO + 0.04, -0.11);
  // Abertura del tapado: se ve la camisa oscura en el pecho
  pieza(persona.grupo, caja(0.1, 0.3, 0.01), GRIS_OSCURO, 0, ALTO_CUELLO - 0.17, 0.165);

  // Armónica en la mano izquierda, del lado de la cara
  pieza(persona.izq.antebrazo, caja(0.11, 0.03, 0.035), MATERIAL_CROMADO, 0, POSICION_MANO, 0.06);

  const microfono = crearPieDeMicrofono(1.5);
  microfono.position.z = 0.5;
  grupo.add(microfono);

  posar(persona.der, 0.9, -0.5, 1.2); // mano en el micrófono

  function animar(reloj, pulso, saludo) {
    balancear(persona, reloj, pulso, 0);
    // Saluda con la mano de la armónica. Sin saludo, la armónica queda en la boca.
    saludar(persona, persona.izq, [1.0, -0.95, 2.1], reloj, saludo);
  }
  return { grupo, animar };
}

// El Piti (Las Pastillas del Abuelo): lentes de sol chiquitos y redondos,
// vaso de fernet en la mano derecha.
function crearPiti() {
  const grupo = new THREE.Group();
  const persona = crearPersona({
    piel: PIEL_MEDIA,
    remera: 0x2f3b2a, // campera verde oscuro
    mangas: 0x2f3b2a,
    pantalon: JEAN,
    pelo: PELO_CASTANO,
  });
  grupo.add(persona.grupo);

  // Lentes chiquitos: dos cilindros finitos (redondos) mirando al frente y un puente
  for (const lado of [-1, 1]) {
    const lente = pieza(persona.cabeza, cilindro(0.032, 0.032, 0.012, 10), MATERIAL_LENTES, lado * 0.055, 0.2, 0.13);
    lente.rotation.x = Math.PI / 2;
  }
  pieza(persona.cabeza, caja(0.05, 0.008, 0.008), MATERIAL_CROMADO, 0, 0.205, 0.134);

  // Vaso de fernet: fernet con coca (marrón oscuro) y la espuma clarita arriba.
  // Está en un grupo propio para poder mantenerlo derecho aunque el brazo se mueva.
  const vaso = new THREE.Group();
  vaso.position.y = POSICION_MANO;
  persona.der.antebrazo.add(vaso);
  pieza(vaso, cilindro(0.045, 0.038, 0.13, 10), 0x2b1408, 0, 0, 0);
  pieza(vaso, cilindro(0.046, 0.046, 0.03, 10), 0xc9a27a, 0, 0.075, 0);

  const microfono = crearPieDeMicrofono(1.5);
  microfono.position.z = 0.5;
  grupo.add(microfono);

  posar(persona.izq, 0.9, -0.5, 1.2); // mano en el micrófono

  function animar(reloj, pulso, saludo) {
    balancear(persona, reloj, pulso, 1);
    // El vaso sube y baja despacio, como cuando acompaña el tema con el brazo.
    // Para saludar, levanta el vaso bien alto: un brindis con el jugador.
    const adelante = 0.45 + 0.15 * Math.sin(reloj * 1.5);
    saludar(persona, persona.der, [adelante, 0.15, 1.2], reloj, saludo);
    // El vaso queda derecho: lo giramos para el otro lado lo mismo que se inclinaron
    // el brazo y el antebrazo (posar los gira con ángulos negativos).
    vaso.rotation.x = -(persona.der.brazo.rotation.x + persona.der.antebrazo.rotation.x);
  }
  return { grupo, animar };
}

// Andrés Calamaro: sombrero, lentes oscuros, barba canosa y traje negro con camisa blanca.
function crearCalamaro() {
  const grupo = new THREE.Group();
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: NEGRO, // el saco
    mangas: NEGRO,
    pantalon: NEGRO,
    pelo: 0x4a4540, // oscuro con canas
    peloLargo: true,
    barba: 0x9a958e, // canosa
  });
  grupo.add(persona.grupo);

  // Camisa blanca: se ve en la abertura del saco
  pieza(persona.grupo, caja(0.12, 0.28, 0.01), BLANCO, 0, ALTO_CUELLO - 0.14, 0.131);

  // Lentes oscuros, más grandes y rectangulares
  for (const lado of [-1, 1]) {
    pieza(persona.cabeza, caja(0.09, 0.055, 0.015), MATERIAL_LENTES, lado * 0.055, 0.2, 0.13);
  }
  pieza(persona.cabeza, caja(0.03, 0.01, 0.01), MATERIAL_LENTES, 0, 0.21, 0.13); // puente

  // Sombrero: el ala (un disco finito), la copa y una cinta gris
  const sombrero = new THREE.Group();
  sombrero.position.y = 0.34;
  persona.cabeza.add(sombrero);
  pieza(sombrero, cilindro(0.25, 0.25, 0.015, 14), NEGRO, 0, 0, 0);
  pieza(sombrero, cilindro(0.16, 0.19, 0.15, 12), NEGRO, 0, 0.075, 0);
  pieza(sombrero, cilindro(0.192, 0.192, 0.03, 12), GRIS, 0, 0.02, 0);

  const microfono = crearPieDeMicrofono(1.5);
  microfono.position.z = 0.5;
  grupo.add(microfono);

  posar(persona.der, 0.9, -0.5, 1.2); // mano en el micrófono

  function animar(reloj, pulso, saludo) {
    balancear(persona, reloj, pulso, 2);
    // Con la mano izquierda va marcando el tema, como cuando canta. Con esa misma saluda.
    saludar(persona, persona.izq, [0.6 + 0.25 * Math.sin(reloj * 1.2), 0.2, 0.8], reloj, saludo);
  }
  return { grupo, animar };
}

// --- Cantantes de la tarde ---

// Cantante que toca la guitarra (Facundo, el Pity y Emiliano): la guitarra colgada como un
// guitarrista y el pie de micrófono adelante. Saluda con la mano del rasgueo.
// Recibe la persona ya vestida y la guitarra ya armada.
function crearCantanteConGuitarra(persona, guitarra, fase) {
  const grupo = new THREE.Group();
  grupo.add(persona.grupo);

  guitarra.position.set(0.03, 1.0, 0.2);
  guitarra.rotation.z = -1.1;
  persona.grupo.add(guitarra);

  const microfono = crearPieDeMicrofono(1.5);
  microfono.position.z = 0.55;
  grupo.add(microfono);

  posar(persona.izq, 0.55, 0.45, 0.9); // mano en el mástil

  function animar(reloj, pulso, saludo) {
    balancear(persona, reloj, pulso, fase);
    saludar(persona, persona.der, [0.3, 0.05, 1.0], reloj, saludo);
    // Rasgueo (como en crearGuitarrista). Mientras saluda, deja de rasguear.
    const rasgueo = Math.sin(reloj * 14 + fase) * (0.1 + pulso * 0.2);
    persona.der.antebrazo.rotation.x -= rasgueo * (1 - saludo.cantidad);
  }
  return { grupo, animar };
}

// Cantante con el micrófono en la mano, que salta con cada golpe en los temas de pogo y
// levanta el puño (Pato en Callejeros y los dos de La Vela Puerca).
// "manoMicrofono" y "manoLibre" son persona.der / persona.izq (o al revés).
function crearCantanteSaltarin(persona, manoMicrofono, manoLibre, fase) {
  const grupo = new THREE.Group();
  grupo.add(persona.grupo);
  const apuntarMicrofono = crearMicrofonoDeMano(persona, manoMicrofono);
  posar(manoMicrofono, ...POSE_MICROFONO); // los "..." pasan los 3 valores de la lista

  function animar(reloj, pulso, saludo, tema) {
    balancear(persona, reloj, pulso, fase);
    let pose;
    if (tema.conocido) {
      // Puño en alto: el brazo arriba y el codo se estira de golpe con cada golpe.
      pose = [2.5, 0.25, 0.1 + (1 - pulso) * 0.9];
      persona.grupo.position.y = pulso * 0.1; // un saltito
    } else {
      // Tranqui: el brazo va y viene despacio, como marcando la letra.
      pose = [0.7 + 0.25 * Math.sin(reloj * 1.3 + fase), 0.3, 1.0];
      persona.grupo.position.y = 0;
    }
    saludar(persona, manoLibre, pose, reloj, saludo);
    apuntarMicrofono();
  }
  return { grupo, animar };
}

// Facundo (Guasones): melena negra, campera de cuero negra abierta sobre remera blanca,
// pañuelo rojo atado al cuello, y la guitarra colgada. Bien rolinga.
function crearFacundo() {
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: BLANCO,
    mangas: MATERIAL_CUERO, // las mangas de la campera
    pantalon: NEGRO,
    pelo: PELO_NEGRO,
    peloLargo: true,
  });
  ponerCampera(persona, MATERIAL_CUERO, 0.12);

  // Pañuelo rojo: el nudo alrededor del cuello y la punta que cae sobre el pecho
  // (un cono de 3 lados con la punta para abajo, aplastado para que quede pegado al pecho).
  pieza(persona.cabeza, caja(0.13, 0.05, 0.13), ROJO, 0, 0.03, 0);
  const geometriaPunta = cilindro(0.08, 0.005, 0.14, 3);
  geometriaPunta.scale(1, 1, 0.35);
  pieza(persona.grupo, geometriaPunta, ROJO, 0, ALTO_CUELLO - 0.06, 0.14);

  return crearCantanteConGuitarra(persona, crearGuitarra(0xd2a253, 0.5), 0); // guitarra color manteca
}

// Pato (Callejeros): pelo negro corto, barba corta, remera negra y jean.
// Micrófono en la derecha y el puño izquierdo arriba en los temas de pogo.
function crearPato() {
  const persona = crearPersona({
    piel: PIEL_MEDIA,
    remera: NEGRO,
    pantalon: JEAN,
    pelo: PELO_NEGRO,
    barba: PELO_NEGRO,
  });
  return crearCantanteSaltarin(persona, persona.der, persona.izq, 0);
}

// Levinton (Turf): traje beige setentoso (saco abierto), polera negra de cuello alto,
// colgante dorado, lentes grandes naranjas, pantalón oxford y la melena con rulos.
// Baila sin parar: revolea el brazo, mueve la cadera y salta.
function crearLevinton() {
  const grupo = new THREE.Group();
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: NEGRO, // la polera
    mangas: BEIGE, // las mangas del saco
    pantalon: BEIGE,
    pelo: PELO_CASTANO_CLARO,
    peloLargo: true,
  });
  grupo.add(persona.grupo);
  ponerCampera(persona, BEIGE, 0.14);
  pieza(persona.cabeza, caja(0.14, 0.09, 0.14), NEGRO, 0, 0.035, 0); // cuello alto de la polera

  // Pantalón oxford: abajo de cada pierna, una "campana" que se abre hacia el piso
  for (const lado of [-1, 1]) {
    pieza(persona.grupo, cilindro(0.095, 0.14, 0.32, 8), BEIGE, lado * 0.11, 0.2, 0);
  }

  // Colgante: la medalla dorada sobre la polera y la cadenita (dos tiritas en V)
  const medalla = pieza(persona.grupo, cilindro(0.04, 0.04, 0.012, 12), MATERIAL_DORADO, 0, ALTO_CUELLO - 0.25, 0.138);
  medalla.rotation.x = Math.PI / 2;
  for (const lado of [-1, 1]) {
    const cadena = pieza(persona.grupo, caja(0.008, 0.22, 0.008), MATERIAL_DORADO, lado * 0.03, ALTO_CUELLO - 0.13, 0.136);
    cadena.rotation.z = lado * 0.25;
  }

  // Lentes grandes y cuadrados, naranjas, con el puente dorado
  for (const lado of [-1, 1]) {
    pieza(persona.cabeza, caja(0.1, 0.075, 0.015), MATERIAL_LENTES_NARANJA, lado * 0.058, 0.2, 0.13);
  }
  pieza(persona.cabeza, caja(0.02, 0.012, 0.012), MATERIAL_DORADO, 0, 0.215, 0.13);

  // Rulos: unos bloques de pelo de más alrededor de la cabeza le dan volumen a la melena
  const rulos = [
    [0.15, 0.3, 0.02], [-0.15, 0.3, 0.02], [0.16, 0.14, -0.07], [-0.16, 0.14, -0.07],
    [0.08, 0.39, 0.02], [-0.08, 0.39, -0.04], [0, 0.32, -0.17],
  ];
  for (const [x, y, z] of rulos) {
    const rulo = pieza(persona.cabeza, caja(0.1, 0.1, 0.1), PELO_CASTANO_CLARO, x, y, z);
    rulo.rotation.set(x * 4, 0.5, z * 4); // cada uno un poco torcido
  }

  const apuntarMicrofono = crearMicrofonoDeMano(persona, persona.der);
  posar(persona.der, ...POSE_MICROFONO);

  function animar(reloj, pulso, saludo, tema) {
    // En los temas de pogo baila con todo; en los tranquis, a media máquina.
    const energia = tema.conocido ? 1 : 0.4;
    persona.cabeza.rotation.x = 0.05 + pulso * CABECEO;
    persona.cabeza.rotation.z = Math.sin(reloj * 3 + 1) * 0.15 * energia;
    persona.grupo.rotation.z = Math.sin(reloj * 3) * 0.12 * energia; // se menea de costado
    persona.grupo.position.y = tema.conocido ? pulso * 0.15 : 0; // salta con los golpes

    // Brazo libre: en los de pogo lo revolea (sube y baja rápido y se abre y se cierra);
    // en los tranquis lo tiene arriba, ondeando despacio.
    const pose = tema.conocido
      ? [1.6 + Math.sin(reloj * 5) * 1.1, 0.4 + 0.3 * Math.sin(reloj * 2.5), 0.4]
      : [2.0 + 0.4 * Math.sin(reloj * 1.5), 0.5, 0.6];
    saludar(persona, persona.izq, pose, reloj, saludo);
    // La cadera: gira de un lado al otro (saludar ya dejó el giro hacia el jugador; le sumamos
    // el meneo, que se apaga mientras saluda).
    persona.grupo.rotation.y += Math.sin(reloj * 2) * 0.35 * energia * (1 - saludo.cantidad);
    apuntarMicrofono();
  }
  return { grupo, animar };
}

// El Pity (Intoxicados): melena negra larga y su gorro de lana rasta, con franjas roja,
// amarilla y verde, que se infla hacia arriba y hacia atrás. Barba corta y guitarra eléctrica.
function crearPity() {
  const persona = crearPersona({
    piel: PIEL_MEDIA,
    remera: 0x1a1a1a,
    pantalon: JEAN,
    pelo: PELO_NEGRO,
    peloLargo: true,
    barba: PELO_NEGRO,
  });

  // El gorro: franjas (cilindros) cada vez más anchas, inclinado hacia atrás.
  // rotation.x negativo = la parte de arriba se va hacia atrás (−Z).
  const gorro = new THREE.Group();
  gorro.position.set(0, 0.29, -0.02);
  gorro.rotation.x = -0.25;
  persona.cabeza.add(gorro);
  // [color, radio de arriba, radio de abajo, y]
  const franjas = [
    [ROJO, 0.2, 0.19, 0.03],
    [AMARILLO, 0.215, 0.2, 0.09],
    [VERDE, 0.2, 0.215, 0.15],
  ];
  for (const [color, radioArriba, radioAbajo, y] of franjas) {
    pieza(gorro, cilindro(radioArriba, radioAbajo, 0.06, 12), color, 0, y, 0);
  }
  pieza(gorro, cilindro(0.1, 0.2, 0.05, 12), ROJO, 0, 0.205, 0); // la "tapa" de arriba

  return crearCantanteConGuitarra(persona, crearGuitarra(0x8b1a1a, 0.5), 1);
}

// Emiliano (No Te Va Gustar): pelo corto, barba corta, camisa azul y guitarra criolla.
function crearEmiliano() {
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: 0x2c3e5c,
    mangas: 0x2c3e5c, // camisa de manga larga
    pantalon: JEAN,
    pelo: PELO_CASTANO,
    barba: PELO_CASTANO,
  });
  return crearCantanteConGuitarra(persona, crearGuitarraCriolla(), 2);
}

// El Enano (La Vela Puerca): gorro de lana oscuro y barba larga. Micrófono en la derecha.
function crearEnano() {
  const persona = crearPersona({
    piel: PIEL_CLARA,
    remera: 0x3b3b3b,
    pantalon: JEAN,
    pelo: PELO_CASTANO,
    barba: PELO_CASTANO,
    barbaLarga: true,
  });
  // Gorro de lana: un cilindro que tapa la cabeza desde la frente, con la parte de arriba
  // redondeada (media esfera) y el doblez de abajo un poco más grueso.
  pieza(persona.cabeza, cilindro(0.19, 0.195, 0.12, 12), 0x24243a, 0, 0.32, -0.005);
  pieza(persona.cabeza, cilindro(0.2, 0.2, 0.05, 12), 0x24243a, 0, 0.285, -0.005); // doblez
  const copa = pieza(persona.cabeza, new THREE.SphereGeometry(0.19, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x24243a, 0, 0.38, -0.005);
  copa.scale.y = 0.5;
  return crearCantanteSaltarin(persona, persona.der, persona.izq, 0);
}

// El Cebolla (La Vela Puerca): pelo corto negro y la celeste de Uruguay.
// Micrófono en la izquierda (así los dos cantantes quedan "en espejo").
function crearCebolla() {
  const persona = crearPersona({
    piel: PIEL_MEDIA,
    remera: CELESTE_URUGUAY,
    pantalon: NEGRO,
    pelo: PELO_NEGRO,
  });
  // El cuello blanco de la camiseta
  pieza(persona.grupo, caja(0.16, 0.03, 0.2), BLANCO, 0, ALTO_CUELLO - 0.01, 0.03);
  return crearCantanteSaltarin(persona, persona.izq, persona.der, 1.5);
}

// ---------------------------------------------------------------------------
// La banda completa
// ---------------------------------------------------------------------------

/**
 * Crea la banda de un escenario.
 * Se arma con el frente hacia +Z, con y = 0 en el piso de la tarima
 * (ver escenario.js, que la ubica arriba de la tarima y la muestra cuando le toca tocar).
 *
 * Todas siguen el mismo orden, así la pantalla en vivo (pantalla.js) encuentra a cada uno:
 * cantante adelante en el medio, guitarra a la izquierda (x = −4.5), bajo a la derecha
 * (x = 4.5), los extras más afuera y la batería al fondo.
 *
 * @param {string} clave  Qué banda: 'ciro', 'pastillas', 'calamaro', 'guasones', 'callejeros',
 *                        'turf', 'intoxicados', 'ntvg' o 'velapuerca'
 * @param {object} musica  La música del escenario (ver crearMusica en musica.js)
 * @returns {{ grupo: THREE.Group, actualizar: (delta: number) => void,
 *             saludar: (posicionMundo: THREE.Vector3) => void }}
 */
export function crearBanda(clave, musica) {
  const grupo = new THREE.Group();
  grupo.scale.setScalar(ESCALA_ARTISTAS);

  const musicos = [];

  // Ubica un músico en la tarima. "giro" lo hace mirar un poco hacia el centro.
  function agregar(musico, x, z, giro = 0) {
    musico.grupo.position.x = x;
    musico.grupo.position.z = z;
    musico.grupo.rotation.y = giro;
    grupo.add(musico.grupo);
    musicos.push(musico);
  }

  // Tarima de la batería: el baterista va al fondo, un poco más alto.
  const ALTO_TARIMA_BATERIA = 0.5;
  pieza(grupo, caja(3.5, ALTO_TARIMA_BATERIA, 3), 0x222222, 0, ALTO_TARIMA_BATERIA / 2, -3);
  function agregarBaterista(musico) {
    agregar(musico, 0, -3.6);
    musico.grupo.position.y = ALTO_TARIMA_BATERIA;
  }

  if (clave === 'ciro') {
    agregar(crearCiro(), 0, Z_CANTANTE);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: NEGRO, pantalon: JEAN, pelo: PELO_CASTANO }, 0x8b1a1a, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: GRIS, pantalon: NEGRO, pelo: PELO_NEGRO, peloLargo: true }, NEGRO, true, 2.5), 4.5, 1.8, -0.3);
    agregarBaterista(crearBaterista({ piel: PIEL_TRIGUENA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x7a1010));
  } else if (clave === 'pastillas') {
    agregar(crearPiti(), 0, Z_CANTANTE);
    // El guitarrista barbudo: barba larga y pelo largo
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: 0x5a3a22, mangas: 0x5a3a22, pantalon: JEAN, pelo: PELO_CASTANO, peloLargo: true, barba: PELO_CASTANO, barbaLarga: true }, 0xb5651d, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x1c3f7a, true, 2.5), 4.5, 1.8, -0.3);
    agregar(crearSaxofonista({ piel: PIEL_TRIGUENA, remera: 0x1f2f4a, pantalon: NEGRO, pelo: PELO_NEGRO }, 0.5), -7.5, 0.5, 0.4);
    agregarBaterista(crearBaterista({ piel: PIEL_MEDIA, remera: GRIS_OSCURO, pantalon: NEGRO, pelo: PELO_CASTANO }, 0x1a1a1a));
  } else if (clave === 'calamaro') {
    agregar(crearCalamaro(), 0, Z_CANTANTE);
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: NEGRO, pantalon: NEGRO, pelo: 0x3a2a1a, peloLargo: true }, 0xe8e2d0, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: 0x5a1020, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x7a4a20, true, 2.5), 4.5, 1.8, -0.3);
    agregar(crearTecladista({ piel: PIEL_CLARA, remera: GRIS_OSCURO, pantalon: JEAN, pelo: GRIS }, 1.5), 7.5, 0, -0.4);
    agregarBaterista(crearBaterista({ piel: PIEL_TRIGUENA, remera: BLANCO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x0f2a4a));
  } else if (clave === 'guasones') {
    agregar(crearFacundo(), 0, Z_CANTANTE);
    // El guitarrista, también bien stone: melena, remera negra y guitarra roja oscura
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO, peloLargo: true }, 0x7a1515, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: 0x5a1020, pantalon: JEAN, pelo: PELO_CASTANO }, NEGRO, true, 2.5), 4.5, 1.8, -0.3);
    agregarBaterista(crearBaterista({ piel: PIEL_TRIGUENA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x5a0f0f, 'GUASONES'));
  } else if (clave === 'callejeros') {
    agregar(crearPato(), 0, Z_CANTANTE);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: 0x3a3a3a, pantalon: JEAN, pelo: PELO_NEGRO }, 0xe8e2d0, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_TRIGUENA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO, barba: PELO_NEGRO }, 0x1c3f7a, true, 2.5), 4.5, 1.8, -0.3);
    agregar(crearBandoneonistaYSaxofonista({ piel: PIEL_CLARA, remera: 0x6a6a72, mangas: 0x6a6a72, pantalon: NEGRO, pelo: PELO_CASTANO, barba: PELO_CASTANO }, 0.5), -7.5, 0.5, 0.4);
    agregarBaterista(crearBaterista({ piel: PIEL_MEDIA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x1a1a1a, 'CALLEJEROS'));
  } else if (clave === 'turf') {
    agregar(crearLevinton(), 0, Z_CANTANTE);
    // Guitarrista con camisa violeta setentosa y guitarra dorada
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: 0x6a2a5a, mangas: 0x6a2a5a, pantalon: NEGRO, pelo: PELO_CASTANO, peloLargo: true }, 0xd8b030, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: BLANCO, pantalon: JEAN, pelo: PELO_NEGRO }, ROJO, true, 2.5), 4.5, 1.8, -0.3);
    agregar(crearTecladista({ piel: PIEL_CLARA, remera: 0x2a5a7a, pantalon: JEAN, pelo: PELO_CASTANO }, 1.5), 7.5, 0, -0.4);
    agregarBaterista(crearBaterista({ piel: PIEL_CLARA, remera: 0xd06a1a, pantalon: NEGRO, pelo: PELO_CASTANO_CLARO }, 0xd06a1a, 'TURF'));
  } else if (clave === 'intoxicados') {
    agregar(crearPity(), 0, Z_CANTANTE);
    agregar(crearGuitarrista({ piel: PIEL_TRIGUENA, remera: 0x2d5a27, pantalon: JEAN, pelo: PELO_NEGRO, peloLargo: true }, NEGRO, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: NEGRO, pantalon: NEGRO, pelo: PELO_CASTANO }, 0x7a4a20, true, 2.5), 4.5, 1.8, -0.3);
    agregarBaterista(crearBaterista({ piel: PIEL_TRIGUENA, remera: AMARILLO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x1f5a2a, 'INTOXICADOS'));
  } else if (clave === 'ntvg') {
    agregar(crearEmiliano(), 0, Z_CANTANTE);
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: NEGRO, pantalon: JEAN, pelo: PELO_CASTANO }, 0x1c1c1c, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: 0x5a5a5a, pantalon: NEGRO, pelo: PELO_NEGRO, barba: PELO_NEGRO }, 0xe8e2d0, true, 2.5), 4.5, 1.8, -0.3);
    // La sección de vientos: saxo a la izquierda, trompeta y trombón a la derecha
    agregar(crearSaxofonista({ piel: PIEL_MEDIA, remera: 0x1f2f4a, pantalon: NEGRO, pelo: PELO_NEGRO }, 0.5), -7.5, 0.5, 0.4);
    agregar(crearVientista({ piel: PIEL_CLARA, remera: BLANCO, pantalon: JEAN, pelo: PELO_CASTANO }, 'trompeta', 1.2), 6.8, 0.6, -0.4);
    agregar(crearVientista({ piel: PIEL_TRIGUENA, remera: 0x5a1020, pantalon: NEGRO, pelo: PELO_NEGRO, barba: PELO_NEGRO }, 'trombon', 2.1), 8.6, -0.3, -0.5);
    agregarBaterista(crearBaterista({ piel: PIEL_CLARA, remera: CELESTE_URUGUAY, pantalon: NEGRO, pelo: PELO_CASTANO }, 0x0f2a4a, 'NTVG'));
  } else if (clave === 'velapuerca') {
    // Los dos cantantes adelante, uno al lado del otro
    agregar(crearEnano(), -0.9, Z_CANTANTE, 0.1);
    agregar(crearCebolla(), 0.9, Z_CANTANTE, -0.1);
    agregar(crearGuitarrista({ piel: PIEL_CLARA, remera: 0x6a3a1a, pantalon: JEAN, pelo: PELO_CASTANO, peloLargo: true, barba: PELO_CASTANO }, NEGRO, false, 1), -4.5, 1.8, 0.3);
    agregar(crearGuitarrista({ piel: PIEL_MEDIA, remera: NEGRO, pantalon: JEAN, pelo: PELO_NEGRO }, 0xb5651d, true, 2.5), 4.5, 1.8, -0.3);
    agregar(crearSaxofonista({ piel: PIEL_TRIGUENA, remera: 0x3a4a2a, pantalon: NEGRO, pelo: PELO_NEGRO }, 0.5), -7.5, 0.5, 0.4);
    agregar(crearVientista({ piel: PIEL_CLARA, remera: CELESTE_URUGUAY, pantalon: JEAN, pelo: PELO_CASTANO }, 'trompeta', 1.2), 7.5, 0.5, -0.4);
    agregarBaterista(crearBaterista({ piel: PIEL_MEDIA, remera: GRIS_OSCURO, pantalon: NEGRO, pelo: PELO_NEGRO }, 0x3a1a0a, 'LA VELA PUERCA'));
  }

  // --- Estado para el pulso ---
  let reloj = 0;
  let promedioGraves = 0;
  let pulso = 0;

  // --- Estado del saludo ---
  // cantidad: 0 = no saluda, 1 = saluda del todo. angulo: cuánto gira el cantante hacia el jugador.
  const saludo = { cantidad: 0, angulo: 0 };
  let pidieronSaludo = false;
  const jugadorLocal = new THREE.Vector3(); // dónde está el jugador, medido desde la banda

  /**
   * Pide que el cantante salude al jugador. Hay que llamarla en cada cuadro mientras
   * tenga que saludar (ver main.js): cuando se deja de llamar, baja el brazo.
   * @param {THREE.Vector3} posicionMundo  Dónde está el jugador en el predio
   */
  function saludar(posicionMundo) {
    pidieronSaludo = true;
    // worldToLocal deshace el movimiento, el giro y la escala del escenario y de la banda.
    jugadorLocal.copy(posicionMundo);
    grupo.worldToLocal(jugadorLocal);
  }

  /**
   * Mueve a los músicos. Se llama en cada cuadro de la animación (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    // El pulso se va apagando solo...
    pulso = Math.max(0, pulso - CAIDA_PULSO * delta);

    if (musica.estaSonando()) {
      // ...y salta cuando los graves suben por encima de cómo venían sonando
      // (la misma idea que usa el público en publico.js).
      const graves = musica.graves();
      const subida = Math.max(0, graves - promedioGraves);
      pulso = Math.max(pulso, Math.min(1, subida * SENSIBILIDAD_PULSO));
      promedioGraves += (graves - promedioGraves) * Math.min(1, delta * 2);
    }

    // Saludo: la cantidad se acerca de a poco a 1 (si lo pidieron) o a 0.
    const objetivoSaludo = pidieronSaludo ? 1 : 0;
    pidieronSaludo = false; // el pedido vale para este cuadro nada más
    const pasoSaludo = VELOCIDAD_SALUDO * delta;
    if (saludo.cantidad < objetivoSaludo) {
      saludo.cantidad = Math.min(objetivoSaludo, saludo.cantidad + pasoSaludo);
    } else {
      saludo.cantidad = Math.max(objetivoSaludo, saludo.cantidad - pasoSaludo);
    }
    if (objetivoSaludo === 1) {
      // Ángulo para mirar al jugador desde el lugar del cantante (como en escenario.js).
      const angulo = Math.atan2(jugadorLocal.x, jugadorLocal.z - Z_CANTANTE);
      saludo.angulo = Math.min(GIRO_MAXIMO_SALUDO, Math.max(-GIRO_MAXIMO_SALUDO, angulo));
    }

    // El tema que suena: algunos músicos cambian si es de pogo o tranqui.
    const tema = musica.temaActual();
    for (const musico of musicos) {
      musico.animar(reloj, pulso, saludo, tema);
    }
  }

  return { grupo, actualizar, saludar };
}
