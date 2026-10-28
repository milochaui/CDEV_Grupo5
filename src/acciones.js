// Acciones del jugador en el recital: levantar los brazos, saltar, cantar y hacer pogo.
// También dibuja los brazos en primera persona y "contagia" al público cercano:
// cuando el jugador participa, la gente de alrededor se pone más eufórica.
import * as THREE from 'three';
import { ALTURA_OJOS } from './jugador.js';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// --- Teclas (event.code: la tecla física, como en jugador.js) ---
const TECLA_SALTAR = 'Space';
const TECLA_BRAZOS = 'KeyE'; // mantener
const TECLA_CANTAR = 'KeyQ'; // mantener
const TECLA_POGO = 'KeyF'; // mantener

// --- Brazos en primera persona ---
// Ángulo hacia adelante de cada brazo (radianes). 0 = derecho para arriba;
// cuanto más negativo, más se inclina hacia adelante (y más abajo queda la mano).
const ANGULO_BRAZOS_REPOSO = -1.42; // casi fuera de la vista: apenas asoman las manos
const ANGULO_BRAZOS_ARRIBA = -0.45; // levantados: se ven a los costados de la pantalla
const VELOCIDAD_LEVANTAR = 4; // con 4 tardan 1/4 de segundo en subir o bajar del todo
const AGITE_BRAZOS = 0.15; // cuánto se agitan levantados (radianes)
const AGITES_POR_SEGUNDO = 2.5;
const INERCIA_SALTO_BRAZOS = 0.03; // al saltar, los brazos "se quedan atrás" un poco

// --- Algo en la mano derecha (un fernet o un choripán, ver barra.js) ---
const ANGULO_SOSTENER = -1.05; // en reposo, el brazo derecho más arriba para que se vea lo que tiene
const ANGULO_BOCA = -0.5; // brazo levantado hacia la cara (tomar o comer)
const COSTADO_BOCA = 0.5; // y hacia el centro de la pantalla

// --- Salto ---
// Con estos valores el salto sube unos 85 cm y dura unos 0.75 segundos.
const VELOCIDAD_SALTO = 4.5; // metros por segundo hacia arriba al despegar
const GRAVEDAD = 12; // metros por segundo, cada segundo (la real es 9.8; más alta se siente más ágil)

// --- Cantar ---
const INCLINACION_CANTAR = 0.12; // cuánto mira hacia arriba la cámara (radianes, 0.12 ≈ 7°)
const VELOCIDAD_INCLINAR = 3; // con 3 tarda 1/3 de segundo en inclinarse del todo

// --- Pogo ---
const RADIO_ENTRE_PUBLICO = 2.5; // metros alrededor del jugador en los que contamos gente...
const PERSONAS_PARA_POGO = 3; // ...y con al menos esta cantidad, está "entre el público"
const SACUDIDA_ALTURA = 0.08; // metros que rebota la cámara
const SACUDIDA_COSTADO = 0.06; // radianes que se ladea de costado
const SACUDIDAS_POR_SEGUNDO = 3;
const BRAZOS_POGO = 0.35; // cuánto se van los brazos hacia adelante con el pogo (radianes)
const VELOCIDAD_EMPUJON = 2.5; // metros por segundo al recibir un empujón
const FRENADO_EMPUJON = 6; // más grande = se frena antes. Cada empujón mueve unos 2.5 / 6 ≈ 40 cm
const TIEMPO_ENTRE_EMPUJONES_MIN = 0.4; // segundos
const TIEMPO_ENTRE_EMPUJONES_MAX = 1.2; // segundos

// --- Contagio al público ---
// Euforia extra que suma cada acción a la gente pegada al jugador
// (la euforia del tema va de 0 = tranquilos a 1 = euforia total).
const CONTAGIO_BRAZOS = 0.25;
const CONTAGIO_CANTAR = 0.25;
const CONTAGIO_POGO = 0.4;
// El contagio se multiplica por esto según el tema que suena en ese escenario.
const FACTOR_TEMA_CONOCIDO = 1;
const FACTOR_TEMA_TRANQUI = 0.4;
const RADIO_CONTAGIO = 6; // metros alrededor del jugador a los que llega el contagio
const MULTIPLICADOR_SALTO_POGO = 1.6; // con pogo, los de al lado saltan hasta 1.6 veces más alto
const SEGUNDOS_CONTAGIO = 1; // lo que tarda el contagio en aparecer (o irse) del todo

// ---------------------------------------------------------------------------
// Forma de los brazos
// ---------------------------------------------------------------------------

// Cada brazo es un antebrazo y una mano (dos cajas). Los armamos "parados": el hombro
// (punto de giro) abajo y la mano arriba. Después los giramos hacia adelante.
const LARGO_ANTEBRAZO = 0.55;
const geometriaAntebrazo = new THREE.BoxGeometry(0.09, LARGO_ANTEBRAZO, 0.09);
geometriaAntebrazo.translate(0, LARGO_ANTEBRAZO / 2, 0); // el punto de giro queda en la punta de abajo
const geometriaMano = new THREE.BoxGeometry(0.1, 0.12, 0.06);

// Los brazos se dibujan siempre por encima del resto (como en los juegos en primera persona):
//  - depthTest: false → no se fija si hay algo delante, así no atraviesan las paredes.
//  - transparent: true (con opacidad 1, o sea que no se ven transparentes) → Three.js los
//    dibuja junto con los objetos transparentes, que van después de los sólidos. Si no,
//    los haces de luz del escenario (que son transparentes) se dibujarían encima.
//  - renderOrder alto (ver crearBrazo) → entre los transparentes, van últimos.
// El emissive (un brillo propio muy suave) hace que no queden negros de noche.
function crearMaterialPiel(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: 0x2a1a10,
    roughness: 0.9,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
}
const materialAntebrazo = crearMaterialPiel(0xe0ac69);
const materialMano = crearMaterialPiel(0xf1c27d);

// Crea un brazo con el hombro en (x, y, z), medido desde la cámara.
function crearBrazo(x, y, z) {
  const brazo = new THREE.Group();
  brazo.position.set(x, y, z);

  const antebrazo = new THREE.Mesh(geometriaAntebrazo, materialAntebrazo);
  antebrazo.renderOrder = 100;
  const mano = new THREE.Mesh(geometriaMano, materialMano);
  mano.position.y = LARGO_ANTEBRAZO + 0.06; // en la punta del antebrazo
  mano.renderOrder = 101; // la mano después del antebrazo, para que quede delante
  brazo.add(antebrazo, mano);
  return brazo;
}

// Mezcla dos valores: con t = 0 da a, con t = 1 da b (igual que en publico.js).
function mezclar(a, b, t) {
  return a + (b - a) * t;
}

// Acerca un valor a un objetivo, sin pasarse, como mucho "paso" por llamada.
function acercar(valor, objetivo, paso) {
  if (valor < objetivo) {
    return Math.min(objetivo, valor + paso);
  }
  return Math.max(objetivo, valor - paso);
}

/**
 * Crea las acciones del jugador.
 *
 * @param {object} opciones
 * @param {THREE.PerspectiveCamera} opciones.camara  La cámara del jugador (tiene que estar en la escena)
 * @param {object} opciones.jugador  Lo que devuelve crearJugador (ver jugador.js)
 * @param {Array<THREE.Group>} opciones.escenarios  Los escenarios (con su música y su público en userData)
 * @returns {{ actualizar: (delta: number) => void,
 *             estado: {brazos: boolean, cantando: boolean, pogo: boolean, saltando: boolean},
 *             manoDerecha: THREE.Group, gesto: {boca: number} }}
 *  - estado dice qué está haciendo el jugador en este momento (lo usa aguante.js).
 *  - manoDerecha: lo que se agregue a este grupo aparece en la mano derecha (ver barra.js).
 *  - gesto.boca: de 0 a 1, cuánto lleva la mano derecha a la boca (lo cambia barra.js).
 */
export function crearAcciones({ camara, jugador, escenarios }) {
  // --- Brazos ---
  // Son hijos de la cámara: se mueven y giran con ella, siempre en el mismo lugar de la pantalla.
  // La cámara mira hacia -Z: x positivo es la derecha, y negativo es abajo.
  const brazoDerecho = crearBrazo(0.35, -0.55, -0.1);
  const brazoIzquierdo = crearBrazo(-0.35, -0.55, -0.1);
  camara.add(brazoDerecho, brazoIzquierdo);
  // Arrancan en reposo (si no, hasta el primer cuadro de juego quedarían para arriba).
  // Los ángulos de costado (0.1 y −0.1) son los mismos que usa actualizar() en reposo.
  brazoDerecho.rotation.set(ANGULO_BRAZOS_REPOSO, 0, 0.1);
  brazoIzquierdo.rotation.set(ANGULO_BRAZOS_REPOSO, 0, -0.1);

  // Mano derecha: un grupo vacío en la punta del brazo derecho. Lo que se le agregue
  // (un vaso, un choripán) se mueve con el brazo.
  const manoDerecha = new THREE.Group();
  manoDerecha.position.y = LARGO_ANTEBRAZO + 0.06; // donde está la mano
  brazoDerecho.add(manoDerecha);
  const gesto = { boca: 0 };

  // --- Cartelitos en pantalla (están en index.html) ---
  const indicador = document.getElementById('indicador-acciones');
  const avisoPogo = document.getElementById('aviso-pogo');

  // --- Estado ---
  let reloj = 0; // segundos de juego (sin contar las pausas)
  let levantado = 0; // brazos: 0 = abajo, 1 = arriba
  let alturaSalto = 0; // metros por encima del piso
  let velocidadVertical = 0; // metros por segundo (positivo = subiendo)
  let cantar = 0; // 0 a 1: cuánto está inclinada la cámara para cantar
  let pogo = 0; // 0 a 1: cuánto se nota el pogo (sacudida, brazos)
  let proximoEmpujon = 0; // momento del próximo empujón
  const empujon = { x: 0, z: 0 }; // velocidad del empujón actual (metros por segundo)
  let contagio = 0; // euforia extra que estamos contagiando ahora
  let contagioPogo = 0; // 0 a 1: cuánto del "salto más alto" del pogo contagiamos

  // Qué está haciendo el jugador. Lo completamos en cada cuadro y lo lee el aguante-metro.
  const estado = { brazos: false, cantando: false, pogo: false, saltando: false };

  // Inclinación de la cámara que pusimos en el cuadro anterior (radianes).
  let inclinacionAplicada = 0; // hacia arriba (cantar)
  let costadoAplicado = 0; // de costado (pogo)

  // --- Teclado ---
  const teclas = {};
  document.addEventListener('keydown', (event) => {
    teclas[event.code] = true;

    // Saltar: solo al apretar (no al mantener) y si está en el piso.
    // event.repeat es true cuando la tecla quedó apretada y el navegador la "repite".
    if (event.code === TECLA_SALTAR && !event.repeat && jugador.controles.isLocked && alturaSalto === 0) {
      velocidadVertical = VELOCIDAD_SALTO;
    }
  });
  document.addEventListener('keyup', (event) => {
    teclas[event.code] = false;
  });

  // En pausa olvidamos las teclas (igual que en jugador.js) y escondemos los cartelitos.
  // Todo lo demás (brazos, salto, sacudida) queda quieto porque en pausa no llamamos a actualizar().
  jugador.controles.addEventListener('unlock', () => {
    for (const codigo in teclas) {
      teclas[codigo] = false;
    }
    mostrar(indicador, '');
    mostrar(avisoPogo, '');
  });

  // Cambia la inclinación extra de la cámara sin pelearse con el mouse.
  // El giro de la cámara lo maneja PointerLockControls. Si solo sumáramos la inclinación
  // en cada cuadro, se acumularía. Por eso primero deshacemos la del cuadro anterior
  // (en el orden inverso) y después ponemos la nueva.
  // rotateX gira la cámara hacia arriba/abajo y rotateZ la ladea, sobre sus propios ejes.
  function inclinarCamara(inclinacion, costado) {
    camara.rotateZ(-costadoAplicado);
    camara.rotateX(-inclinacionAplicada);
    camara.rotateX(inclinacion);
    camara.rotateZ(costado);
    inclinacionAplicada = inclinacion;
    costadoAplicado = costado;
  }

  // true si hay suficiente gente alrededor del jugador en alguno de los escenarios.
  function estaEntreElPublico() {
    for (const escenario of escenarios) {
      const cantidad = escenario.userData.publico.contarPersonasCerca(camara.position, RADIO_ENTRE_PUBLICO);
      if (cantidad >= PERSONAS_PARA_POGO) {
        return true;
      }
    }
    return false;
  }

  // Muestra u oculta un cartelito, y le pone el texto. Solo toca la página si algo cambió.
  function mostrar(elemento, texto) {
    if (elemento.textContent !== texto) {
      elemento.textContent = texto;
      elemento.style.display = texto ? 'block' : 'none';
    }
  }

  /**
   * Anima las acciones. Se llama en cada cuadro, salvo en pausa (ver main.js).
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;

    // --- ¿Qué está haciendo el jugador? ---
    const conBrazosArriba = teclas[TECLA_BRAZOS] === true;
    const cantando = teclas[TECLA_CANTAR] === true;
    const quierePogo = teclas[TECLA_POGO] === true;
    // Solo contamos gente si apretó F (así no hacemos cuentas de más).
    const haciendoPogo = quierePogo && estaEntreElPublico();

    // --- 1. Salto ---
    // La gravedad le resta velocidad hacia arriba; con la velocidad cambia la altura.
    if (alturaSalto > 0 || velocidadVertical > 0) {
      velocidadVertical -= GRAVEDAD * delta;
      alturaSalto += velocidadVertical * delta;
      if (alturaSalto <= 0) {
        // Tocó el piso.
        alturaSalto = 0;
        velocidadVertical = 0;
      }
    }

    // --- 2. Valores que cambian de a poco (0 a 1) ---
    levantado = acercar(levantado, conBrazosArriba ? 1 : 0, VELOCIDAD_LEVANTAR * delta);
    cantar = acercar(cantar, cantando ? 1 : 0, VELOCIDAD_INCLINAR * delta);
    pogo = acercar(pogo, haciendoPogo ? 1 : 0, VELOCIDAD_INCLINAR * delta);

    // --- 3. Pogo: sacudida y empujones ---
    // Una onda (seno) rápida para el rebote y otra más lenta para ladearse de costado.
    const onda = Math.sin(reloj * Math.PI * 2 * SACUDIDAS_POR_SEGUNDO);
    const rebote = Math.abs(onda) * SACUDIDA_ALTURA * pogo; // Math.abs: siempre para arriba
    const ladeo = Math.sin(reloj * Math.PI * SACUDIDAS_POR_SEGUNDO * 0.7) * SACUDIDA_COSTADO * pogo;

    if (haciendoPogo && reloj >= proximoEmpujon) {
      // Empujón en una dirección al azar (un ángulo de 0 a 360°).
      const angulo = Math.random() * Math.PI * 2;
      empujon.x = Math.cos(angulo) * VELOCIDAD_EMPUJON;
      empujon.z = Math.sin(angulo) * VELOCIDAD_EMPUJON;
      proximoEmpujon = reloj + mezclar(TIEMPO_ENTRE_EMPUJONES_MIN, TIEMPO_ENTRE_EMPUJONES_MAX, Math.random());
    }
    // El empujón nos mueve (sin atravesar nada: desplazar revisa las colisiones) y se va frenando.
    jugador.desplazar(empujon.x * delta, empujon.z * delta);
    const frenado = Math.max(0, 1 - FRENADO_EMPUJON * delta);
    empujon.x *= frenado;
    empujon.z *= frenado;

    // --- 4. Cámara: altura (salto + rebote) e inclinación (cantar + ladeo) ---
    camara.position.y = ALTURA_OJOS + alturaSalto + rebote;
    inclinarCamara(INCLINACION_CANTAR * cantar, ladeo);

    // --- 5. Brazos ---
    // Ángulo hacia adelante: de reposo a arriba según "levantado", más los extras.
    const agite = Math.sin(reloj * Math.PI * 2 * AGITES_POR_SEGUNDO) * AGITE_BRAZOS * levantado;
    let anguloAdelante = mezclar(ANGULO_BRAZOS_REPOSO, ANGULO_BRAZOS_ARRIBA, levantado);
    anguloAdelante += pogo * (BRAZOS_POGO + onda * 0.15); // con pogo van hacia adelante y rebotan
    anguloAdelante -= velocidadVertical * INERCIA_SALTO_BRAZOS; // al subir bajan un poco, y al revés
    // Ángulo de costado: en reposo apuntan un poco hacia el centro; arriba, un poco hacia afuera.
    const anguloCostado = mezclar(0.1, -0.1, levantado);

    // El derecho y el izquierdo son espejos: el giro de costado va con signo contrario.
    // El agite se suma igual a los dos: se mueven juntos de un lado al otro, como en los recitales.
    // rotation.set(adelante, 0, costado): x inclina hacia adelante, z hacia los costados.
    // El derecho, si tiene algo en la mano, sube un poco para que se vea (salvo que ya
    // esté levantado con E). Y con gesto.boca se va hacia la cara.
    const sostiene = manoDerecha.children.length > 0;
    let adelanteDerecho = anguloAdelante;
    if (sostiene) {
      adelanteDerecho += (ANGULO_SOSTENER - ANGULO_BRAZOS_REPOSO) * (1 - levantado);
    }
    adelanteDerecho = mezclar(adelanteDerecho, ANGULO_BOCA, gesto.boca);
    const costadoDerecho = mezclar(anguloCostado + agite, COSTADO_BOCA, gesto.boca);
    brazoDerecho.rotation.set(adelanteDerecho, 0, costadoDerecho);
    brazoIzquierdo.rotation.set(anguloAdelante, 0, -anguloCostado + agite);
    // Lo que tiene en la mano queda derecho: lo giramos al revés que el brazo.
    // Al llevarlo a la boca lo dejamos inclinar un poco (como al tomar de un vaso).
    manoDerecha.rotation.x = -adelanteDerecho * (1 - 0.5 * gesto.boca);

    // --- 6. Contagio al público ---
    let objetivoContagio = 0;
    if (conBrazosArriba) objetivoContagio += CONTAGIO_BRAZOS;
    if (cantando) objetivoContagio += CONTAGIO_CANTAR;
    if (haciendoPogo) objetivoContagio += CONTAGIO_POGO;
    const pasoContagio = delta / SEGUNDOS_CONTAGIO;
    contagio = acercar(contagio, objetivoContagio, pasoContagio);
    contagioPogo = acercar(contagioPogo, haciendoPogo ? 1 : 0, pasoContagio);

    // A cada público le pasamos el contagio según el tema que suena en su escenario.
    // Solo se nota en la gente que está cerca del jugador (ver contagiar en publico.js).
    for (const escenario of escenarios) {
      const factorTema = escenario.userData.musica.temaActual().conocido
        ? FACTOR_TEMA_CONOCIDO
        : FACTOR_TEMA_TRANQUI;
      escenario.userData.publico.contagiar(
        camara.position,
        contagio * factorTema,
        RADIO_CONTAGIO,
        mezclar(1, MULTIPLICADOR_SALTO_POGO, contagioPogo)
      );
    }

    // --- 7. Estado para el aguante-metro ---
    estado.brazos = conBrazosArriba;
    estado.cantando = cantando;
    estado.pogo = haciendoPogo;
    estado.saltando = alturaSalto > 0; // está en el aire

    // --- 8. Cartelitos ---
    const partes = [];
    if (cantando) partes.push('🎤 Cantando');
    if (haciendoPogo) partes.push('🤘 Pogo');
    mostrar(indicador, partes.join('   '));
    mostrar(avisoPogo, quierePogo && !haciendoPogo ? 'Metete entre el público para hacer pogo' : '');
  }

  return { actualizar, estado, manoDerecha, gesto };
}
