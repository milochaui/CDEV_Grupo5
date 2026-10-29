// Cielo que pasa del atardecer a la noche siguiendo la hora del festival (de 18:00 a 21:00).
// Cambian de a poco los colores del cielo (y de la niebla), las luces generales y
// la altura del sol, que se esconde detrás del horizonte. Al oscurecer aparecen las estrellas.
//
// El cielo es un degradé: oscuro arriba y más claro en el horizonte, con un resplandor
// del lado donde se pone el sol. Lo dibujamos en un <canvas> y lo pegamos por dentro de
// una esfera gigante que envuelve todo el predio (como una cúpula de planetario).
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// El cielo sigue la hora del reloj del festival (ver grilla.js), en minutos desde la medianoche.
const HORA_ATARDECER = 18 * 60; // 18:00, cuando empiezan las primeras bandas
const HORA_NOCHE = 21 * 60; // 21:00, noche cerrada: arrancan las bandas de la noche

// Momentos del cielo, en orden. t va de 0 (atardecer) a 1 (noche cerrada).
// Entre un momento y el siguiente, los colores y las intensidades se mezclan de a poco.
// arriba / medio / horizonte: los tres colores del degradé del cielo.
const MOMENTOS = [
  {
    t: 0, // atardecer
    arriba: 0x2b3f7a, // azul profundo
    medio: 0xc76a7a, // rosado
    horizonte: 0xffa64d, // naranja dorado
    luzCielo: 0xffc890, // la luz general que viene de arriba
    intensidadGeneral: 1.6,
    luzDirecta: 0xffa060, // la luz del sol
    intensidadDirecta: 1.4,
  },
  {
    t: 0.5, // anochecer
    arriba: 0x120f38,
    medio: 0x4a2a6b, // violeta
    horizonte: 0xc0506a, // rosa fuerte
    luzCielo: 0x8a6aa8,
    intensidadGeneral: 1.3,
    luzDirecta: 0xd07090,
    intensidadDirecta: 0.8,
  },
  {
    t: 1, // noche
    arriba: 0x03030f, // casi negro
    medio: 0x0a0a28,
    horizonte: 0x1c1a45, // azul oscuro (el resplandor de la ciudad)
    luzCielo: 0x4a5a99,
    intensidadGeneral: 1.2,
    luzDirecta: 0xaabbff, // ya es la luz de la luna
    intensidadDirecta: 0.6,
  },
];

// --- Sol ---
// Una esfera naranja lejos, a la izquierda del escenario de Ciro (que es lo primero que
// se ve al entrar). Va bajando hasta quedar debajo del horizonte: ahí lo tapa el piso.
const POSICION_SOL = { x: -150, z: -400 };
const ALTURA_SOL_INICIO = 40; // metros
const ALTURA_SOL_FINAL = -30; // metros (bajo el horizonte)
const T_PUESTA_SOL = 0.5; // en qué momento termina de esconderse (a mitad del anochecer)

// --- Estrellas ---
const CANTIDAD_ESTRELLAS = 700;
const RADIO_CIELO = 450; // metros: las estrellas están sobre una esfera enorme alrededor del predio
const T_APARECEN_ESTRELLAS = 0.4; // empiezan a verse en pleno anochecer...
const T_TODAS_LAS_ESTRELLAS = 1; // ...y se ven del todo con la noche cerrada

// --- Resplandor del atardecer ---
// Una mancha de luz en el horizonte, del lado del sol. Se apaga a medida que anochece.
const T_SIN_RESPLANDOR = 0.7;

// Radio de la esfera del cielo: más grande que todo lo demás (el predio llega a 250 m
// del centro y las estrellas están a 450 m), pero menos que lo que ve la cámara (1000 m).
const RADIO_ESFERA_CIELO = 480;

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Crea el cielo que va del atardecer a la noche.
 *
 * @param {object} opciones
 * @param {THREE.Scene} opciones.escena  Le agregamos el cielo, y su niebla cambia de color
 * @param {THREE.HemisphereLight} opciones.luzGeneral
 * @param {THREE.DirectionalLight} opciones.luzDirecta  El sol, que de noche pasa a ser la luna
 * @returns {{ actualizar: (minutos: number) => void }}
 */
export function crearCielo({ escena, luzGeneral, luzDirecta }) {
  // --- Fondo: un degradé dibujado en un <canvas> ---
  // El canvas se "envuelve" alrededor de la esfera como un mapamundi: de arriba a abajo
  // va del cenit (justo arriba nuestro) al suelo, y de izquierda a derecha da toda la vuelta.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const texturaCielo = new THREE.CanvasTexture(canvas);
  texturaCielo.colorSpace = THREE.SRGBColorSpace;

  const esferaCielo = new THREE.Mesh(
    new THREE.SphereGeometry(RADIO_ESFERA_CIELO, 32, 16),
    new THREE.MeshBasicMaterial({
      map: texturaCielo,
      side: THREE.BackSide, // la vemos desde adentro
      fog: false, // la niebla no la tapa
      depthWrite: false, // no tapa nada: todo lo demás se dibuja por encima
    })
  );
  esferaCielo.renderOrder = -1; // se dibuja primero que todo
  escena.add(esferaCielo);

  // En qué columna del canvas queda el sol. La esfera reparte la vuelta completa
  // (2π radianes) a lo ancho del canvas; atan2 nos da en qué ángulo está el sol.
  let anguloSol = Math.atan2(POSICION_SOL.z, -POSICION_SOL.x);
  if (anguloSol < 0) anguloSol += Math.PI * 2; // lo pasamos a un ángulo entre 0 y 2π
  const columnaSol = (anguloSol / (Math.PI * 2)) * canvas.width;

  // Colores del degradé que reusamos en cada cuadro
  const arriba = new THREE.Color();
  const medio = new THREE.Color();
  const horizonte = new THREE.Color();

  // Dibuja el cielo con los colores actuales. "resplandor" va de 0 a 1.
  function dibujarCielo(resplandor) {
    const mitad = canvas.height / 2; // la fila del horizonte
    const degrade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    degrade.addColorStop(0, arriba.getStyle()); // cenit
    degrade.addColorStop(0.32, medio.getStyle());
    degrade.addColorStop(0.5, horizonte.getStyle()); // horizonte
    degrade.addColorStop(1, horizonte.getStyle()); // debajo del horizonte (lo tapa el piso)
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Resplandor: un círculo de luz (degradé "radial") en el horizonte, del lado del sol.
    // Lo dibujamos también una vuelta antes y una después por si cae en el borde del canvas.
    if (resplandor > 0) {
      for (const x of [columnaSol - canvas.width, columnaSol, columnaSol + canvas.width]) {
        const brillo = ctx.createRadialGradient(x, mitad, 0, x, mitad, 160);
        brillo.addColorStop(0, 'rgba(255, 200, 120, ' + 0.9 * resplandor + ')');
        brillo.addColorStop(1, 'rgba(255, 140, 80, 0)');
        ctx.fillStyle = brillo;
        ctx.fillRect(x - 160, mitad - 160, 320, 320);
      }
    }
    texturaCielo.needsUpdate = true; // avisamos que la imagen cambió
  }

  // El sol: MeshBasicMaterial no depende de las luces (brilla solo), y con fog: false
  // la niebla no lo tapa aunque esté tan lejos.
  const sol = new THREE.Mesh(
    new THREE.SphereGeometry(16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe0a0, fog: false })
  );
  escena.add(sol);

  // Halo del sol: un Sprite (una imagen que siempre mira a la cámara) con un círculo
  // de luz que se desvanece hacia los bordes.
  const canvasHalo = document.createElement('canvas');
  canvasHalo.width = 128;
  canvasHalo.height = 128;
  const ctxHalo = canvasHalo.getContext('2d');
  const degradeHalo = ctxHalo.createRadialGradient(64, 64, 0, 64, 64, 64);
  degradeHalo.addColorStop(0, 'rgba(255, 220, 150, 1)');
  degradeHalo.addColorStop(0.3, 'rgba(255, 170, 90, 0.5)');
  degradeHalo.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctxHalo.fillStyle = degradeHalo;
  ctxHalo.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvasHalo),
      blending: THREE.AdditiveBlending, // suma luz, como el sol
      depthWrite: false,
      fog: false,
    })
  );
  halo.scale.set(130, 130, 1); // metros
  escena.add(halo);

  // Las estrellas: una nube de puntos (THREE.Points), cada estrella es un punto.
  // Las repartimos al azar sobre la mitad de arriba de una esfera.
  const posicionesEstrellas = new Float32Array(CANTIDAD_ESTRELLAS * 3);
  const coloresEstrellas = new Float32Array(CANTIDAD_ESTRELLAS * 3);
  for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
    // Dirección al azar: un ángulo alrededor (giro) y una altura (h). Con h entre 0.05 y 1
    // quedan todas arriba del horizonte.
    const giro = Math.random() * Math.PI * 2;
    const h = 0.05 + Math.random() * 0.95;
    const radio = Math.sqrt(1 - h * h);
    posicionesEstrellas[i * 3] = Math.cos(giro) * radio * RADIO_CIELO;
    posicionesEstrellas[i * 3 + 1] = h * RADIO_CIELO;
    posicionesEstrellas[i * 3 + 2] = Math.sin(giro) * radio * RADIO_CIELO;
    // Unas más brillantes que otras (gris claro a blanco)
    const brillo = 0.4 + Math.random() * 0.6;
    coloresEstrellas.set([brillo, brillo, brillo], i * 3);
  }
  const geometriaEstrellas = new THREE.BufferGeometry();
  geometriaEstrellas.setAttribute('position', new THREE.BufferAttribute(posicionesEstrellas, 3));
  geometriaEstrellas.setAttribute('color', new THREE.BufferAttribute(coloresEstrellas, 3));
  const materialEstrellas = new THREE.PointsMaterial({
    size: 2, // en píxeles: con sizeAttenuation: false no se achican con la distancia
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true, // para poder ir subiendo la opacidad
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const estrellas = new THREE.Points(geometriaEstrellas, materialEstrellas);
  escena.add(estrellas);

  // Colores que reusamos para hacer las mezclas
  const colorA = new THREE.Color();
  const colorB = new THREE.Color();

  /**
   * Pone el cielo que corresponde a una hora. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} minutos  La hora del festival, en minutos desde la medianoche
   */
  function actualizar(minutos) {
    // t: qué parte del camino entre el atardecer y la noche ya pasó. Antes de las 18:00
    // da menos de 0 y después de las 21:00 más de 1: con min y max lo dejamos entre 0 y 1.
    const t = Math.min(1, Math.max(0, (minutos - HORA_ATARDECER) / (HORA_NOCHE - HORA_ATARDECER)));

    // Buscamos entre qué dos momentos estamos...
    let i = 0;
    while (i < MOMENTOS.length - 2 && t > MOMENTOS[i + 1].t) {
      i++;
    }
    const desde = MOMENTOS[i];
    const hasta = MOMENTOS[i + 1];
    // ...y cuánto avanzamos de uno al otro (0 = en "desde", 1 = en "hasta").
    const avance = (t - desde.t) / (hasta.t - desde.t);

    // Colores del cielo. lerpColors mezcla dos colores como mezclar() mezcla dos números.
    arriba.lerpColors(colorA.setHex(desde.arriba), colorB.setHex(hasta.arriba), avance);
    medio.lerpColors(colorA.setHex(desde.medio), colorB.setHex(hasta.medio), avance);
    horizonte.lerpColors(colorA.setHex(desde.horizonte), colorB.setHex(hasta.horizonte), avance);
    dibujarCielo(Math.max(0, 1 - t / T_SIN_RESPLANDOR));
    // La niebla, del color del horizonte: así el piso se funde con el cielo a lo lejos.
    escena.fog.color.copy(horizonte);

    // Luces generales
    luzGeneral.color.lerpColors(colorA.setHex(desde.luzCielo), colorB.setHex(hasta.luzCielo), avance);
    luzGeneral.intensity = mezclar(desde.intensidadGeneral, hasta.intensidadGeneral, avance);
    luzDirecta.color.lerpColors(colorA.setHex(desde.luzDirecta), colorB.setHex(hasta.luzDirecta), avance);
    luzDirecta.intensity = mezclar(desde.intensidadDirecta, hasta.intensidadDirecta, avance);

    // El sol baja hasta esconderse. Después lo apagamos (visible = false): ya no hace falta dibujarlo.
    const bajada = Math.min(1, t / T_PUESTA_SOL);
    sol.position.set(POSICION_SOL.x, mezclar(ALTURA_SOL_INICIO, ALTURA_SOL_FINAL, bajada), POSICION_SOL.z);
    sol.visible = bajada < 1;
    halo.position.copy(sol.position);
    halo.visible = sol.visible;

    // Estrellas: aparecen de a poco (opacidad de 0 a 1) mientras oscurece.
    const aparicion = (t - T_APARECEN_ESTRELLAS) / (T_TODAS_LAS_ESTRELLAS - T_APARECEN_ESTRELLAS);
    materialEstrellas.opacity = Math.min(1, Math.max(0, aparicion));
    estrellas.visible = materialEstrellas.opacity > 0; // invisibles no hace falta dibujarlas
  }

  // Lo llamamos una vez para que el cielo ya arranque con los colores del atardecer.
  // (main.js lo vuelve a llamar enseguida con la hora del reloj.)
  actualizar(HORA_ATARDECER);

  return { actualizar };
}
