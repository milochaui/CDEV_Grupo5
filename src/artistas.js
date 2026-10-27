// Los artistas arriba de cada escenario: la banda que toca, armada con formas simples
// (cajas y cilindros, estilo low-poly), tratando de respetar el look de cada músico:
//  - Ciro y los Persas: Ciro con su tapado negro largo y la armónica.
//  - Las Pastillas del Abuelo: el Piti con lentes de sol chiquitos y un vaso de fernet,
//    el guitarrista barbudo y el saxo.
//  - Andrés Calamaro: sombrero, lentes oscuros, barba canosa y traje negro.
// La banda aparece cuando empieza a sonar la música y se mueve con los graves del tema.
// Cuando el jugador llena el aguante-metro, el cantante se da vuelta y lo saluda.
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

// Batería, vista desde el baterista: él está en (0, 0, 0) y los tambores hacia +Z.
function crearBateria(color) {
  const bateria = new THREE.Group();

  // Bombo: un cilindro acostado que mira al público, con el parche de adelante blanco.
  const bombo = pieza(bateria, cilindro(0.3, 0.3, 0.4, 14), color, 0, 0.3, 0.65);
  bombo.rotation.x = Math.PI / 2;
  const parche = pieza(bateria, cilindro(0.27, 0.27, 0.01, 14), BLANCO, 0, 0.3, 0.855);
  parche.rotation.x = Math.PI / 2;

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

// ---------------------------------------------------------------------------
// Músicos genéricos (los integrantes de cada banda)
// Cada función devuelve { grupo, animar(reloj, pulso, saludo) }. El grupo lo ubica la banda;
// animar se llama en cada cuadro. Solo los cantantes usan "saludo".
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
function crearBaterista(aspecto, colorBateria) {
  const grupo = new THREE.Group();
  const persona = crearPersona(aspecto);
  // Como está sentado, lo hundimos en la tarima de la batería: las piernas quedan
  // escondidas adentro y desde el público se ve el torso detrás de los tambores.
  persona.grupo.position.y = -0.4;
  grupo.add(persona.grupo);
  grupo.add(crearBateria(colorBateria));

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

// ---------------------------------------------------------------------------
// La banda completa
// ---------------------------------------------------------------------------

/**
 * Crea la banda de un escenario.
 * Se arma con el frente hacia +Z, con y = 0 en el piso de la tarima
 * (ver escenario.js, que la ubica arriba de la tarima).
 *
 * @param {string} clave  Qué banda: 'ciro', 'pastillas' o 'calamaro'
 * @param {object} musica  La música del escenario (ver crearMusica en musica.js)
 * @returns {{ grupo: THREE.Group, actualizar: (delta: number) => void,
 *             saludar: (posicionMundo: THREE.Vector3) => void }}
 */
export function crearBanda(clave, musica) {
  const grupo = new THREE.Group();
  grupo.scale.setScalar(ESCALA_ARTISTAS);
  // Escondida hasta que empiece a sonar la música
  grupo.visible = false;

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
      // La banda aparece con la música y ya no se va (ni entre tema y tema).
      grupo.visible = true;
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

    for (const musico of musicos) {
      musico.animar(reloj, pulso, saludo);
    }
  }

  return { grupo, actualizar, saludar };
}
