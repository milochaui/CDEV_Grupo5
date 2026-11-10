// Borrachera: cada trago de fernet suma alcohol y el jugador se siente distinto.
//  - Se ve distinto: los colores se saturan, las luces brillan más y laten con la música,
//    la imagen se ondula y se ve doble, y la cámara se bambolea.
//  - Se mueve distinto: camina tambaleándose.
//  - Está más eufórico: contagia más al público y llena más rápido el aguante-metro
//    (lo leen acciones.js y aguante.js con euforia()).
// Con muchos fernets se desmaya. La secuencia tiene estos estados:
//   'normal' → 'cayendo' → 'inconsciente' → 'despertando' → 'normal'
// Mientras está inconsciente (con la pantalla en negro) termina el festival, y se despierta
// a la mañana siguiente con la gente que limpia el predio (lo arma main.js, con los avisos).
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Alcohol ---
const FERNETS_PARA_DESMAYO = 5;
const FERNETS_QUE_BAJAN_POR_MINUTO = 0.5; // se va pasando de a poco: un fernet cada 2 minutos
const VELOCIDAD_EFECTO = 0.1; // no pega de golpe: el efecto cambia como mucho esto por segundo
const SEGUNDOS_ANTES_DE_CAER = 1.5; // desde el último trago hasta que se empieza a caer

// Avisos en pantalla al pasar cada cantidad de fernets. El primero sale un poco antes del
// fernet entero porque, mientras se lo toma, el alcohol ya va bajando.
const AVISOS = [
  { fernets: 0.9, texto: '🍻 Ya estás contento' },
  { fernets: 2.5, texto: '🤩 ¡Estás re eufórico! Todo brilla' },
  { fernets: 4, texto: '🥴 Uy... todo da vueltas. No sé si otro fernet es buena idea' },
];
const SEGUNDOS_AVISO = 4;

// --- Efectos en la cámara (con el efecto al máximo) ---
const BAMBOLEO_COSTADO = 0.1; // radianes que se ladea (0.1 ≈ 6°)
const BAMBOLEO_ARRIBA = 0.05; // radianes que cabecea
const VARIACION_CAMPO_VISION = 4; // grados que "respira" el campo de visión
const VELOCIDAD_TAMBALEO = 1.2; // metros por segundo que lo lleva para un lado y para el otro

// --- Bloom: las luces brillan más y laten con los graves del tema ---
const BLOOM_EXTRA = 0.5;
const BLOOM_EXTRA_GOLPE = 1;
const SENSIBILIDAD_GOLPE = 12; // como el pulso de luces.js
const CAIDA_GOLPE = 4; // por segundo: después de un golpe tarda 1/4 de segundo en apagarse

// --- Desmayo ---
const DURACION_CAIDA = 3.5; // segundos
const DURACION_INCONSCIENTE = 6; // segundos con la pantalla en negro
const DURACION_DESPERTAR = 6; // segundos
const ALTURA_DE_LA_CAIDA = 1.45; // metros que baja la cámara: queda a 25 cm del piso
const LADEO_EN_EL_PISO = 1.35; // radianes: tirado de costado
const EFECTO_AL_DESPERTAR = 0.35; // se despierta medio mareado (se le va en unos segundos)

// --- Sonido ---
// Al desmayarse el sonido se apaga y se oye "ahogado": un filtro deja pasar solo los graves.
// El filtro se mueve entre estas dos frecuencias.
const FRECUENCIA_NORMAL = 22000; // Hz: deja pasar todo
const FRECUENCIA_AHOGADA = 250; // Hz: solo graves
const AHOGO_POR_EL_ALCOHOL = 0.25; // con el efecto al máximo, ya se oye un poco ahogado

// ---------------------------------------------------------------------------
// El efecto sobre la imagen
// ---------------------------------------------------------------------------

/**
 * Crea la pasada de la borrachera: un efecto que se aplica a la imagen ya dibujada
 * (como el bloom, ver main.js). Es un "shader": un programita que corre la placa de video
 * y calcula el color de cada píxel de la pantalla.
 * @returns {ShaderPass}
 */
export function crearPasadaBorrachera() {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, // la imagen de la pasada anterior (la pone el composer)
      efecto: { value: 0 }, // 0 = sobrio, 1 = al máximo
      golpe: { value: 0 }, // 0 a 1: salta con cada golpe grave de la música
      tiempo: { value: 0 }, // segundos, para que las ondas se muevan
      parpados: { value: 0 }, // 0 = ojos abiertos, 1 = cerrados
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float efecto;
      uniform float golpe;
      uniform float tiempo;
      uniform float parpados;
      varying vec2 vUv; // qué punto de la imagen estamos pintando (de 0 a 1 en cada eje)

      void main() {
        // 1. Ondas: en vez de leer la imagen justo en este punto, la leemos un poquito
        //    corrida, con un seno distinto según la altura. Así la imagen "se ondula".
        vec2 punto = vUv;
        punto.x += sin(vUv.y * 6.0 + tiempo * 1.1) * 0.006 * efecto;
        punto.y += cos(vUv.x * 5.0 + tiempo * 0.9) * 0.004 * efecto;

        // 2. Con cada golpe de la música la imagen se acerca apenas (late).
        punto = (punto - 0.5) * (1.0 - golpe * efecto * 0.012) + 0.5;

        // 3. Visión doble: mezclamos dos copias de la imagen, corridas para lados opuestos.
        //    La separación crece y se achica despacio. Sin efecto, las dos copias coinciden.
        float separacion = efecto * (0.009 + 0.006 * sin(tiempo * 0.7));
        vec2 corrimiento = vec2(separacion, separacion * 0.25 * sin(tiempo * 0.43));
        vec3 color = 0.5 * (texture2D(tDiffuse, punto - corrimiento).rgb
                          + texture2D(tDiffuse, punto + corrimiento).rgb);

        // 4. Colores más vivos: nos alejamos del gris, y más con cada golpe.
        float gris = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(gris), color, 1.0 + efecto * (0.45 + 0.4 * golpe));
        color = max(color, vec3(0.0)); // al alejarnos del gris un color puede dar negativo

        // 5. Un poco más cálido, y con los bordes de la pantalla más oscuros.
        color *= mix(vec3(1.0), vec3(1.08, 1.0, 0.9), efecto);
        float distanciaAlCentro = distance(vUv, vec2(0.5));
        color *= 1.0 - efecto * 0.8 * distanciaAlCentro * distanciaAlCentro;

        // 6. Párpados: una franja negra que se cierra desde arriba y desde abajo.
        //    El borde es curvo (más cerrado a los costados), como un ojo.
        float costado = vUv.x - 0.5;
        float borde = (1.0 - parpados) * 0.75 - costado * costado * 0.4;
        color *= 1.0 - smoothstep(borde - 0.1, borde, abs(vUv.y - 0.5));

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

// Acerca un valor a un objetivo, sin pasarse, como mucho "paso" por llamada (como en acciones.js).
function acercar(valor, objetivo, paso) {
  if (valor < objetivo) {
    return Math.min(objetivo, valor + paso);
  }
  return Math.max(objetivo, valor - paso);
}

// ---------------------------------------------------------------------------
// La borrachera
// ---------------------------------------------------------------------------

/**
 * Crea la borrachera del jugador.
 *
 * @param {object} opciones
 * @param {THREE.PerspectiveCamera} opciones.camara
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (ver jugador.js)
 * @param {THREE.AudioListener} opciones.oyente  Los "oídos" del jugador
 * @param {ShaderPass} opciones.pasada  Lo que devuelve crearPasadaBorrachera
 * @param {object} opciones.bloom  La pasada de bloom (ver main.js)
 * @param {() => THREE.Group | null} opciones.escenarioMasFuerte  Está en main.js
 * @param {() => void} opciones.alCaer  Se llama cuando empieza a caerse
 * @param {() => void} opciones.alDormirse  Se llama con la pantalla ya en negro
 * @param {() => void} opciones.alDespertar  Se llama cuando empieza a abrir los ojos
 * @returns {{ actualizar: (delta: number) => void, tomarTrago: (fernets: number) => void,
 *             euforia: () => number, volumen: () => number,
 *             mareo: {altura: number, inclinacion: number, costado: number} }}
 *  - mareo: lo que hay que sumarle a la cámara (lo lee acciones.js, que es quien la mueve).
 *  - euforia: de 0 a 1, cuánto se nota el alcohol.
 *  - volumen: de 0 a 1, el volumen general del sonido (al desmayarse se apaga).
 */
export function crearBorrachera({ camara, jugador, oyente, pasada, bloom, escenarioMasFuerte, alCaer, alDormirse, alDespertar }) {
  // --- Elementos de la página (están en index.html) ---
  const aviso = document.getElementById('aviso-borrachera');
  const textoDesmayo = document.getElementById('texto-desmayo');

  // --- Sonido: un filtro por el que pasa todo lo que escucha el jugador ---
  const filtro = oyente.context.createBiquadFilter();
  filtro.type = 'lowpass'; // pasa-bajos: deja pasar solo las frecuencias más bajas que la del filtro
  filtro.frequency.value = FRECUENCIA_NORMAL;
  oyente.setFilter(filtro);

  // --- Valores iniciales, para volver a ellos ---
  const campoDeVisionNormal = camara.fov;
  const bloomNormal = bloom.strength;

  // --- Estado ---
  let estado = 'normal';
  let tiempoEnEstado = 0; // segundos desde que empezó el estado actual
  let reloj = 0; // segundos de juego, para los bamboleos
  let fernets = 0; // alcohol en el cuerpo, medido en fernets
  let cuentaParaCaer = -1; // segundos que faltan para caerse (−1 = no se va a caer)
  let proximoAviso = 0; // cuál de los AVISOS sigue
  let finDeAviso = 0; // hasta cuándo se ve el aviso

  // Todo lo que se ve y se oye sale de estos cuatro valores, de 0 a 1:
  let efecto = 0; // cuánto se nota el alcohol
  let tirado = 0; // 0 = parado, 1 = tirado en el piso
  let parpados = 0; // 0 = ojos abiertos, 1 = cerrados
  let apagado = 0; // 0 = sonido normal, 1 = sin sonido

  // Lo que hay que sumarle a la cámara (ver acciones.js).
  const mareo = { altura: 0, inclinacion: 0, costado: 0 };

  // Para que la imagen lata con la música (la misma idea que el pulso de luces.js).
  let golpe = 0;
  let promedioGraves = 0;

  function cambiarEstado(nuevo) {
    estado = nuevo;
    tiempoEnEstado = 0;
  }

  /**
   * El jugador tomó un trago de fernet (lo llama barra.js).
   * @param {number} cantidad  Qué parte de un fernet tomó
   */
  function tomarTrago(cantidad) {
    fernets += cantidad;
    if (fernets >= FERNETS_PARA_DESMAYO && cuentaParaCaer < 0) {
      cuentaParaCaer = SEGUNDOS_ANTES_DE_CAER;
    }
  }

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.style.display = 'block';
    finDeAviso = reloj + SEGUNDOS_AVISO;
  }

  // --- Cada estado cambia los cuatro valores de arriba ---

  function actualizarNormal(delta) {
    // El alcohol baja de a poco, y el efecto lo sigue con retraso.
    fernets = Math.max(0, fernets - (FERNETS_QUE_BAJAN_POR_MINUTO / 60) * delta);
    efecto = acercar(efecto, Math.min(1, fernets / FERNETS_PARA_DESMAYO), VELOCIDAD_EFECTO * delta);

    // Tambaleo: lo lleva despacio para un lado y para el otro (desplazar revisa las
    // colisiones). Elevado al cuadrado para que recién se note con varios fernets.
    const tambaleo = VELOCIDAD_TAMBALEO * efecto * efecto * delta;
    jugador.desplazar(Math.cos(reloj * 0.5) * tambaleo, Math.sin(reloj * 0.37) * tambaleo);

    // Avisos: el siguiente de la lista, cuando llega a esa cantidad de fernets.
    if (proximoAviso < AVISOS.length && fernets >= AVISOS[proximoAviso].fernets) {
      mostrarAviso(AVISOS[proximoAviso].texto);
      proximoAviso++;
    }

    // ¿Tomó demasiado?
    if (cuentaParaCaer >= 0) {
      cuentaParaCaer -= delta;
      if (cuentaParaCaer < 0) {
        empezarACaer();
      }
    }
  }

  function empezarACaer() {
    cambiarEstado('cayendo');
    jugador.bloquear(true);
    aviso.style.display = 'none';
    finDeAviso = 0;
    // Esta clase esconde los carteles de la pantalla (ver index.html).
    document.body.classList.add('desmayado');
    alCaer();
  }

  function actualizarCayendo() {
    const avance = Math.min(1, tiempoEnEstado / DURACION_CAIDA); // de 0 a 1
    tirado = avance * avance; // al cuadrado: empieza despacio y termina de golpe
    // Los ojos se van cerrando, y con el seno intentan abrirse un par de veces.
    parpados = Math.min(1, avance * avance * avance + Math.abs(Math.sin(avance * 14)) * 0.35 * avance);
    apagado = avance;

    if (avance >= 1) {
      cambiarEstado('inconsciente');
      textoDesmayo.style.opacity = 1;
      // Se le fue el alcohol: arranca de cero (y el festival termina, ver main.js).
      fernets = 0;
      cuentaParaCaer = -1;
      proximoAviso = 0;
      efecto = 0;
      alDormirse();
    }
  }

  function actualizarInconsciente() {
    if (tiempoEnEstado >= DURACION_INCONSCIENTE) {
      cambiarEstado('despertando');
      textoDesmayo.style.opacity = 0;
      document.body.classList.remove('desmayado');
      alDespertar();
    }
  }

  function actualizarDespertando() {
    const avance = Math.min(1, tiempoEnEstado / DURACION_DESPERTAR); // de 0 a 1
    const { smoothstep } = THREE.MathUtils; // sube de 0 a 1 de forma suave entre dos valores

    // Abre los ojos despacio y parpadea una vez (entre el 40 % y el 50 % del despertar).
    const abriendo = 1 - smoothstep(avance, 0, 0.35);
    const parpadeo = Math.max(0, 1 - Math.abs(avance - 0.45) / 0.05);
    parpados = Math.max(abriendo, parpadeo);
    // Se queda un rato tirado y recién después se levanta.
    tirado = 1 - smoothstep(avance, 0.5, 1);
    apagado = 1 - smoothstep(avance, 0, 0.5);
    efecto = EFECTO_AL_DESPERTAR * (1 - avance);

    if (avance >= 1) {
      cambiarEstado('normal');
      jugador.bloquear(false);
    }
  }

  // --- Lo que se aplica siempre, a partir de los cuatro valores ---

  // Golpes de la música: como en luces.js, un golpe es cuando los graves suben de repente.
  function actualizarGolpe(delta) {
    golpe = Math.max(0, golpe - CAIDA_GOLPE * delta);
    const escenario = escenarioMasFuerte();
    if (escenario !== null && escenario.userData.musica.estaSonando()) {
      const musica = escenario.userData.musica;
      const graves = musica.graves() * musica.volumen(); // de lejos, late menos
      golpe = Math.max(golpe, Math.min(1, Math.max(0, graves - promedioGraves) * SENSIBILIDAD_GOLPE));
      promedioGraves += (graves - promedioGraves) * Math.min(1, delta * 2);
    }
  }

  function aplicar() {
    // Cámara: dos ondas de distinta velocidad para que el bamboleo no se sienta mecánico.
    mareo.altura = -ALTURA_DE_LA_CAIDA * tirado;
    mareo.costado =
      LADEO_EN_EL_PISO * tirado +
      efecto * BAMBOLEO_COSTADO * (Math.sin(reloj * 0.9) + 0.25 * Math.sin(reloj * 2.3));
    mareo.inclinacion = efecto * BAMBOLEO_ARRIBA * Math.sin(reloj * 0.6);

    // Campo de visión: si cambia hay que avisarle a la cámara (como en pantalla.js).
    const campoDeVision = campoDeVisionNormal + efecto * VARIACION_CAMPO_VISION * Math.sin(reloj * 0.8);
    if (camara.fov !== campoDeVision) {
      camara.fov = campoDeVision;
      camara.updateProjectionMatrix();
    }

    // Las luces y la imagen.
    bloom.strength = bloomNormal + efecto * (BLOOM_EXTRA + BLOOM_EXTRA_GOLPE * golpe);
    pasada.uniforms.efecto.value = efecto;
    pasada.uniforms.golpe.value = golpe;
    pasada.uniforms.tiempo.value = reloj;
    pasada.uniforms.parpados.value = parpados;
    // Sobrio y con los ojos abiertos, nos ahorramos la pasada.
    pasada.enabled = efecto > 0 || parpados > 0;

    // El sonido: la frecuencia baja de forma exponencial porque así lo percibe el oído.
    const ahogo = Math.max(apagado, efecto * AHOGO_POR_EL_ALCOHOL);
    const frecuencia = FRECUENCIA_NORMAL * Math.pow(FRECUENCIA_AHOGADA / FRECUENCIA_NORMAL, ahogo);
    filtro.frequency.setTargetAtTime(frecuencia, oyente.context.currentTime, 0.05);
  }

  /**
   * Se llama en cada cuadro, salvo en pausa (ver main.js). Va antes que las acciones:
   * así la cámara usa el mareo de este mismo cuadro.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;
    tiempoEnEstado += delta;

    if (estado === 'normal') {
      actualizarNormal(delta);
    } else if (estado === 'cayendo') {
      actualizarCayendo();
    } else if (estado === 'inconsciente') {
      actualizarInconsciente();
    } else {
      actualizarDespertando();
    }

    if (reloj > finDeAviso && aviso.style.display === 'block') {
      aviso.style.display = 'none';
    }

    actualizarGolpe(delta);
    aplicar();
  }

  // De 0 a 1, cuánto se nota el alcohol. Con la euforia al máximo, el jugador contagia
  // más al público y llena más rápido el aguante (ver acciones.js y aguante.js).
  function euforia() {
    return efecto;
  }

  // De 0 a 1, el volumen general del sonido.
  function volumen() {
    return 1 - apagado;
  }

  return { actualizar, tomarTrago, euforia, volumen, mareo };
}
