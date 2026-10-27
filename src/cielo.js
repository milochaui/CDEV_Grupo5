// Cielo que pasa del atardecer a la noche mientras dura el festival.
// Cambian de a poco el color del cielo (y de la niebla), las luces generales y
// la altura del sol, que se esconde detrás del horizonte. Al oscurecer aparecen las estrellas.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

const DURACION = 180; // segundos de juego (sin contar las pausas) hasta que es de noche cerrada

// Momentos del cielo, en orden. t va de 0 (arranque) a 1 (noche cerrada).
// Entre un momento y el siguiente, los colores y las intensidades se mezclan de a poco.
const MOMENTOS = [
  {
    t: 0, // atardecer
    cielo: 0xf28c50, // naranja
    luzCielo: 0xffc890, // la luz general que viene de arriba
    intensidadGeneral: 1.6,
    luzDirecta: 0xffa060, // la luz del sol
    intensidadDirecta: 1.4,
  },
  {
    t: 0.5, // anochecer
    cielo: 0x5a2d6b, // violeta
    luzCielo: 0x8a6aa8,
    intensidadGeneral: 1.3,
    luzDirecta: 0xd07090,
    intensidadDirecta: 0.8,
  },
  {
    t: 1, // noche (los valores que tenía el simulador antes)
    cielo: 0x0a0a23, // azul muy oscuro
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

// Mezcla dos valores: con t = 0 da a, con t = 1 da b, y en el medio, algo intermedio.
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Crea el cielo que va del atardecer a la noche.
 *
 * @param {object} opciones
 * @param {THREE.Scene} opciones.escena  Su background y su fog cambian de color
 * @param {THREE.HemisphereLight} opciones.luzGeneral
 * @param {THREE.DirectionalLight} opciones.luzDirecta  El sol, que de noche pasa a ser la luna
 * @returns {{ actualizar: (delta: number) => void }}
 */
export function crearCielo({ escena, luzGeneral, luzDirecta }) {
  // El sol: MeshBasicMaterial no depende de las luces (brilla solo), y con fog: false
  // la niebla no lo tapa aunque esté tan lejos.
  const sol = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb060, fog: false })
  );
  escena.add(sol);

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

  let tiempo = 0; // segundos de juego

  /**
   * Avanza el atardecer. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    tiempo += delta;
    const t = Math.min(1, tiempo / DURACION); // de 0 a 1, y ahí se queda

    // Buscamos entre qué dos momentos estamos...
    let i = 0;
    while (i < MOMENTOS.length - 2 && t > MOMENTOS[i + 1].t) {
      i++;
    }
    const desde = MOMENTOS[i];
    const hasta = MOMENTOS[i + 1];
    // ...y cuánto avanzamos de uno al otro (0 = en "desde", 1 = en "hasta").
    const avance = (t - desde.t) / (hasta.t - desde.t);

    // Cielo y niebla del mismo color (así el piso se sigue fundiendo con el horizonte).
    // lerpColors mezcla dos colores como mezclar() mezcla dos números.
    escena.background.lerpColors(colorA.setHex(desde.cielo), colorB.setHex(hasta.cielo), avance);
    escena.fog.color.copy(escena.background);

    // Luces generales
    luzGeneral.color.lerpColors(colorA.setHex(desde.luzCielo), colorB.setHex(hasta.luzCielo), avance);
    luzGeneral.intensity = mezclar(desde.intensidadGeneral, hasta.intensidadGeneral, avance);
    luzDirecta.color.lerpColors(colorA.setHex(desde.luzDirecta), colorB.setHex(hasta.luzDirecta), avance);
    luzDirecta.intensity = mezclar(desde.intensidadDirecta, hasta.intensidadDirecta, avance);

    // El sol baja hasta esconderse. Después lo apagamos (visible = false): ya no hace falta dibujarlo.
    const bajada = Math.min(1, t / T_PUESTA_SOL);
    sol.position.set(POSICION_SOL.x, mezclar(ALTURA_SOL_INICIO, ALTURA_SOL_FINAL, bajada), POSICION_SOL.z);
    sol.visible = bajada < 1;

    // Estrellas: aparecen de a poco (opacidad de 0 a 1) mientras oscurece.
    const aparicion = (t - T_APARECEN_ESTRELLAS) / (T_TODAS_LAS_ESTRELLAS - T_APARECEN_ESTRELLAS);
    materialEstrellas.opacity = Math.min(1, Math.max(0, aparicion));
    estrellas.visible = materialEstrellas.opacity > 0; // invisibles no hace falta dibujarlas
  }

  // Lo llamamos una vez para que el cielo ya arranque con los colores del atardecer.
  actualizar(0);

  return { actualizar };
}
