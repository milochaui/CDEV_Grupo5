// Las rondas de pogo, como en un recital de verdad. Se arman solas con los "booms" de cada
// tema: los momentos en que la canción explota (están en las listas de temas de main.js).
//
// Cada público pasa por estas fases:
//  - 'tranquilo': no hay ronda.
//  - 'armando': faltan unos segundos para el boom. Dos rockeros van al medio revoleando la
//    remera y empiezan a dar vueltas. La gente se corre para atrás y va quedando un círculo vacío.
//  - 'pogo': explotó el tema. Todos entran al círculo a saltar y a chocarse.
//  - 'cerrando': se terminó el pogo. Cada uno vuelve a su lugar.
//
// Este archivo solo decide dónde está cada persona y qué está haciendo. El que la dibuja es
// publico.js, que lee estos datos de cada persona:
//   ahoraX, ahoraZ, giroAhora: dónde está y hacia dónde mira en este momento.
//   enRonda: true si la ronda maneja sus saltos (alturaRonda) y su ladeo (ladeoRonda).
//   brazosArriba: true si tiene que levantar los brazos, por lo que pasa en la ronda.
//   revolea: true si está revoleando la remera (ver crearPinta).
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constantes para ajustar
// ---------------------------------------------------------------------------

// Dónde se arman las rondas, en metros, medidos como las personas de publico.js:
// x de izquierda a derecha, z desde la valla hacia el fondo. Adelante hay más gente.
const RONDAS = [
  { x: -6, z: 10, radio: 4.5 },
  { x: 6.5, z: 12, radio: 3.5 },
];
const MARGEN_EMPUJADOS = 2.5; // metros: hasta acá afuera del círculo la gente se tiene que correr
const MARGEN_POGUEROS = 1.5; // metros: los que estén hasta acá afuera del círculo se suman al pogo
const PROPORCION_POGUEROS = 0.8; // el resto se queda en el borde mirando
const ROCKEROS_POR_RONDA = 2;
const Z_MINIMA = 2; // metros: la gente empujada no se mete en la valla

// --- Tiempos ---
const SEGUNDOS_ANTES_DEL_BOOM = 8; // cuánto antes del boom empiezan los rockeros
const MINIMO_PARA_ARMAR = 3; // si faltan menos segundos no llegan a armarla: solo saltan todos
const SEGUNDOS_POGO = 25; // cuánto dura el pogo después del boom

// --- Armando ---
const VELOCIDAD_ABRIRSE = 2.5; // metros por segundo que camina la gente al correrse
const VELOCIDAD_ROCKERO = 3.5; // metros por segundo
const VUELTAS_ROCKERO = 1.2; // radianes por segundo que dan alrededor del centro
const RADIO_VUELTA_ROCKERO = 2; // metros, con el círculo ya abierto
const SALTO_ROCKERO = 0.25; // metros
const SALTOS_ROCKERO_POR_SEGUNDO = 1.5;

// --- Pogo ---
const ACELERACION_POGO = 14; // metros por segundo, cada segundo: qué tan rápido arrancan
const VELOCIDAD_MAXIMA_POGO = 3.5; // metros por segundo
const FRENADO_POGO = 2.5; // más grande = se frenan antes
const DISTANCIA_CHOQUE = 0.6; // metros: más cerca que esto, dos personas se chocan
const REBOTE_CHOQUE = 3; // metros por segundo que sale despedido cada uno al chocarse
const TIEMPO_ENTRE_RUMBOS_MIN = 0.4; // segundos que corre hacia un punto antes de cambiar de idea
const TIEMPO_ENTRE_RUMBOS_MAX = 1.2;
const SALTO_POGO = 0.4; // metros
const SALTOS_POGO_POR_SEGUNDO = 1.3;
const LADEO_POGO = 0.3; // radianes
const VELOCIDAD_GIRO = 8; // radianes por segundo

// --- Volver ---
const VELOCIDAD_VOLVER = 2; // metros por segundo

// --- La pinta del rockero ---
const COLOR_JEAN_GASTADO = 0x2f3b52;
const COLOR_PELO = 0x1a120c;
const COLOR_VINCHA = 0xb22222;
const COLOR_REMERA_REVOLEADA = 0x111111;
const VUELTAS_REMERA = 11; // radianes por segundo

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

// Número al azar entre dos valores.
function azarEntre(minimo, maximo) {
  return minimo + Math.random() * (maximo - minimo);
}

// Sube suavemente de 0 a 1 mientras "valor" va de "desde" a "hasta".
function suave(valor, desde, hasta) {
  return THREE.MathUtils.smoothstep(valor, desde, hasta);
}

// Mueve a una persona hacia un punto, como mucho "paso" metros. Devuelve true si llegó.
function moverHacia(persona, x, z, paso) {
  const dx = x - persona.ahoraX;
  const dz = z - persona.ahoraZ;
  const distancia = Math.hypot(dx, dz);
  if (distancia <= paso) {
    persona.ahoraX = x;
    persona.ahoraZ = z;
    return true;
  }
  persona.ahoraX += (dx / distancia) * paso;
  persona.ahoraZ += (dz / distancia) * paso;
  return false;
}

// Gira a una persona hacia un ángulo, como mucho "paso" radianes.
function girarHacia(persona, objetivo, paso) {
  // La diferencia entre dos ángulos, por el camino más corto (entre −π y π).
  const diferencia = objetivo - persona.giroAhora;
  const corta = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
  persona.giroAhora += Math.max(-paso, Math.min(paso, corta));
}

/**
 * La pinta del rockero: en cuero (publico.js le pinta el cuerpo del color de la piel), jean
 * gastado, pelo largo, vincha y la remera en la mano para revolearla.
 * @param {THREE.Group} grupo  El grupo del público
 * @returns {{ mover: Function }}
 */
function crearPinta(grupo) {
  function pieza(geometria, color, x, y, z) {
    const malla = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 }));
    malla.position.set(x, y, z);
    return malla;
  }

  // Lo que va pegado al cuerpo. Medidas desde los pies, como el cuerpo de publico.js.
  const cuerpo = new THREE.Group();
  cuerpo.add(
    pieza(new THREE.BoxGeometry(0.46, 0.8, 0.28), COLOR_JEAN_GASTADO, 0, 0.4, 0), // el jean
    pieza(new THREE.BoxGeometry(0.28, 0.42, 0.08), COLOR_PELO, 0, 1.38, -0.14), // melena, por la espalda
    pieza(new THREE.BoxGeometry(0.27, 0.07, 0.27), COLOR_PELO, 0, 1.63, 0), // pelo de arriba
    pieza(new THREE.BoxGeometry(0.26, 0.05, 0.26), COLOR_VINCHA, 0, 1.56, 0) // vincha
  );

  // La remera revoleada: da vueltas alrededor de la mano.
  const remera = new THREE.Group();
  remera.add(pieza(new THREE.BoxGeometry(0.5, 0.02, 0.3), COLOR_REMERA_REVOLEADA, 0.28, 0, 0));
  remera.visible = false;

  // Sus matrices las armamos nosotros en cada cuadro, copiando las del muñeco de publico.js.
  cuerpo.matrixAutoUpdate = false;
  remera.matrixAutoUpdate = false;
  grupo.add(cuerpo, remera);

  const giro = new THREE.Matrix4();

  // matrizCuerpo y matrizMano: dónde quedaron el cuerpo y la mano derecha en este cuadro.
  function mover(matrizCuerpo, matrizMano, reloj, revolea) {
    cuerpo.matrix.copy(matrizCuerpo);
    cuerpo.matrixWorldNeedsUpdate = true;

    remera.visible = revolea;
    if (revolea) {
      // Primero la hacemos girar sobre sí misma y después la llevamos a la mano.
      giro.makeRotationY(reloj * VUELTAS_REMERA);
      remera.matrix.multiplyMatrices(matrizMano, giro);
      remera.matrixWorldNeedsUpdate = true;
    }
  }

  return { mover };
}

// ---------------------------------------------------------------------------
// Las rondas de un público
// ---------------------------------------------------------------------------

/**
 * Crea las rondas de un público. Hay que llamarla con la gente ya creada y con las banderas
 * repartidas: el que tiene bandera no se mete al pogo.
 *
 * @param {object} opciones
 * @param {Array<object>} opciones.personas  La gente del público (ver publico.js)
 * @param {object} opciones.musica  La música del escenario (ver musica.js)
 * @param {THREE.Group} opciones.grupo  El grupo del público
 * @returns {{ actualizar: (delta: number) => void, rockeros: Array<object>,
 *             hayBoom: () => boolean, fase: () => string,
 *             faseCerca: (x: number, z: number, margen: number) => string | null }}
 */
export function crearRondas({ personas, musica, grupo }) {
  // --- Quién está en cada ronda (se decide una sola vez) ---
  const enElPiso = personas.filter((persona) => persona.base === null);
  const rondas = RONDAS.map((datos) => ({ ...datos, miembros: [], pogueros: [], rockeros: [] }));
  const todosLosRockeros = [];

  function distanciaAlCentro(persona, ronda) {
    return Math.hypot(persona.x - ronda.x, persona.z - ronda.z);
  }

  // Rockeros: los más cercanos al centro de cada ronda, entre los que tienen las manos libres
  // y no llevan remera de banda (la de ellos es la que van a revolear).
  for (const ronda of rondas) {
    const candidatos = enElPiso
      .filter((p) => p.bandera === null && p.hombros === null && p.remera === null && p.pinta === null)
      .sort((a, b) => distanciaAlCentro(a, ronda) - distanciaAlCentro(b, ronda));
    for (const persona of candidatos.slice(0, ROCKEROS_POR_RONDA)) {
      persona.pinta = crearPinta(grupo);
      ronda.rockeros.push(persona);
      ronda.pogueros.push(persona); // cuando explota, son los primeros en meterse
      todosLosRockeros.push(persona);
    }
  }

  // El resto: cada uno pertenece a la ronda que le queda más cerca, si está al alcance.
  for (const persona of enElPiso) {
    if (persona.pinta !== null) {
      continue;
    }
    for (const ronda of rondas) {
      const distancia = distanciaAlCentro(persona, ronda);
      if (distancia >= ronda.radio + MARGEN_EMPUJADOS) {
        continue;
      }
      // Guardamos su distancia y su dirección desde el centro: por ahí lo van a correr.
      persona.distanciaRonda = distancia;
      persona.direccionX = distancia > 0 ? (persona.x - ronda.x) / distancia : 1;
      persona.direccionZ = distancia > 0 ? (persona.z - ronda.z) / distancia : 0;
      ronda.miembros.push(persona);
      // ¿Se suma al pogo? No si tiene las manos ocupadas o lleva a alguien en los hombros.
      const estaCerca = distancia < ronda.radio + MARGEN_POGUEROS;
      if (estaCerca && persona.bandera === null && persona.hombros === null && Math.random() < PROPORCION_POGUEROS) {
        ronda.pogueros.push(persona);
      }
      break;
    }
  }

  // --- Estado ---
  let fase = 'tranquilo';
  let reloj = 0;
  let tiempoEnFase = 0;
  let segundosParaArmar = 0; // cuánto faltaba para el boom cuando empezó a armarse
  let finDelPogo = 0;
  let boomEnEsteCuadro = false;
  // Para saber si el tema pasó por un boom: en qué segundo y en qué tema estaba el cuadro anterior.
  let segundosAnteriores = 0;
  let temaAnterior = 0;

  function cambiarFase(nueva) {
    fase = nueva;
    tiempoEnFase = 0;
  }

  // --- Cada fase ---

  // La gente se corre del centro, y el círculo se va abriendo de a poco.
  function moverArmando(delta) {
    const apertura = suave(tiempoEnFase, 1, segundosParaArmar * 0.8); // 0 = cerrado, 1 = abierto

    for (const ronda of rondas) {
      const radioAbierto = ronda.radio * apertura;
      for (const persona of ronda.miembros) {
        // Cuánto tiene que alejarse del centro: al borde del círculo, pero sin que nadie le pase
        // por encima al de atrás (los de más lejos quedan más lejos). Si ya está más lejos, no se mueve.
        const lugarEnElBorde = radioAbierto + (persona.distanciaRonda / (ronda.radio + MARGEN_EMPUJADOS)) * MARGEN_EMPUJADOS * apertura;
        const distancia = Math.max(persona.distanciaRonda, lugarEnElBorde);
        const x = ronda.x + persona.direccionX * distancia;
        const z = Math.max(Z_MINIMA, ronda.z + persona.direccionZ * distancia);
        moverHacia(persona, x, z, VELOCIDAD_ABRIRSE * delta);

        // Los que quedaron en el borde miran al centro y arengan con los brazos arriba.
        if (apertura > 0.2 && distancia > persona.distanciaRonda) {
          girarHacia(persona, Math.atan2(ronda.x - persona.ahoraX, ronda.z - persona.ahoraZ), VELOCIDAD_GIRO * delta);
          persona.brazosArriba = true;
        }
      }

      // Los rockeros dan vueltas por adentro del círculo, uno de cada lado, saltando.
      ronda.rockeros.forEach((rockero, i) => {
        const angulo = reloj * VUELTAS_ROCKERO + (i * Math.PI * 2) / ronda.rockeros.length;
        const radioVuelta = RADIO_VUELTA_ROCKERO * apertura;
        moverHacia(
          rockero,
          ronda.x + Math.cos(angulo) * radioVuelta,
          ronda.z + Math.sin(angulo) * radioVuelta,
          VELOCIDAD_ROCKERO * delta
        );
        // Miran hacia afuera: le están pidiendo a la gente que se abra.
        girarHacia(rockero, Math.atan2(rockero.ahoraX - ronda.x, rockero.ahoraZ - ronda.z), VELOCIDAD_GIRO * delta);
        rockero.enRonda = true;
        rockero.revolea = true;
        rockero.brazosArriba = true;
        rockero.alturaRonda = Math.abs(Math.sin(reloj * Math.PI * SALTOS_ROCKERO_POR_SEGUNDO + i)) * SALTO_ROCKERO;
      });
    }
  }

  // Explotó el tema: los pogueros se largan.
  function empezarPogo() {
    cambiarFase('pogo');
    finDelPogo = reloj + SEGUNDOS_POGO;
    for (const ronda of rondas) {
      for (const persona of ronda.pogueros) {
        persona.enRonda = true;
        persona.brazosArriba = false;
        persona.velocidadX = 0;
        persona.velocidadZ = 0;
        persona.proximoRumbo = 0; // elige para dónde correr en el próximo cuadro
        persona.faseSalto = Math.random() * Math.PI * 2; // para que no salten todos juntos
      }
    }
  }

  // Cada poguero corre hacia un punto del círculo, y al rato cambia de idea. Si se choca con
  // otro, salen despedidos los dos: eso es lo que hace que parezca un pogo.
  function moverPogo(delta) {
    for (const ronda of rondas) {
      const pogueros = ronda.pogueros;

      // 1. Choques: revisamos cada pareja una sola vez (j arranca después de i).
      for (let i = 0; i < pogueros.length; i++) {
        for (let j = i + 1; j < pogueros.length; j++) {
          const a = pogueros[i];
          const b = pogueros[j];
          const dx = b.ahoraX - a.ahoraX;
          const dz = b.ahoraZ - a.ahoraZ;
          const distancia = Math.hypot(dx, dz);
          if (distancia > 0 && distancia < DISTANCIA_CHOQUE) {
            // (dx, dz) / distancia: la dirección de "a" hacia "b". Cada uno sale para su lado.
            a.velocidadX = (-dx / distancia) * REBOTE_CHOQUE;
            a.velocidadZ = (-dz / distancia) * REBOTE_CHOQUE;
            b.velocidadX = (dx / distancia) * REBOTE_CHOQUE;
            b.velocidadZ = (dz / distancia) * REBOTE_CHOQUE;
          }
        }
      }

      // 2. Cada uno corre, salta y se sacude.
      for (const persona of pogueros) {
        if (reloj >= persona.proximoRumbo) {
          // Un punto al azar del círculo. La raíz cuadrada reparte parejo (si no, se amontonan
          // en el centro).
          const angulo = Math.random() * Math.PI * 2;
          const radio = Math.sqrt(Math.random()) * ronda.radio;
          persona.rumboX = ronda.x + Math.cos(angulo) * radio;
          persona.rumboZ = ronda.z + Math.sin(angulo) * radio;
          persona.proximoRumbo = reloj + azarEntre(TIEMPO_ENTRE_RUMBOS_MIN, TIEMPO_ENTRE_RUMBOS_MAX);
        }

        // La velocidad cambia de a poco hacia el rumbo: arrancan y frenan, no se teletransportan.
        const haciaX = persona.rumboX - persona.ahoraX;
        const haciaZ = persona.rumboZ - persona.ahoraZ;
        const distanciaRumbo = Math.max(0.01, Math.hypot(haciaX, haciaZ));
        persona.velocidadX += (haciaX / distanciaRumbo) * ACELERACION_POGO * delta;
        persona.velocidadZ += (haciaZ / distanciaRumbo) * ACELERACION_POGO * delta;
        const frenado = Math.max(0, 1 - FRENADO_POGO * delta);
        persona.velocidadX *= frenado;
        persona.velocidadZ *= frenado;
        const velocidad = Math.hypot(persona.velocidadX, persona.velocidadZ);
        if (velocidad > VELOCIDAD_MAXIMA_POGO) {
          persona.velocidadX *= VELOCIDAD_MAXIMA_POGO / velocidad;
          persona.velocidadZ *= VELOCIDAD_MAXIMA_POGO / velocidad;
        }
        persona.ahoraX += persona.velocidadX * delta;
        persona.ahoraZ = Math.max(Z_MINIMA, persona.ahoraZ + persona.velocidadZ * delta);

        // Mira para donde corre.
        girarHacia(persona, Math.atan2(persona.velocidadX, persona.velocidadZ), VELOCIDAD_GIRO * delta);

        // Salta (el Math.abs hace que siempre vaya para arriba) y se ladea para los costados.
        const onda = reloj * Math.PI * SALTOS_POGO_POR_SEGUNDO * 2 + persona.faseSalto;
        persona.alturaRonda = Math.abs(Math.sin(onda)) * SALTO_POGO;
        persona.ladeoRonda = Math.sin(onda * 0.5) * LADEO_POGO;
      }
    }
  }

  function empezarACerrar() {
    cambiarFase('cerrando');
    for (const ronda of rondas) {
      for (const persona of [...ronda.miembros, ...ronda.rockeros]) {
        persona.enRonda = false;
        persona.revolea = false;
        persona.brazosArriba = false;
        persona.ladeoRonda = 0;
      }
    }
  }

  // Cada uno vuelve a su lugar. Cuando llegaron todos, se terminó.
  function moverCerrando(delta) {
    let llegaronTodos = true;
    for (const ronda of rondas) {
      for (const persona of [...ronda.miembros, ...ronda.rockeros]) {
        girarHacia(persona, persona.giro, VELOCIDAD_GIRO * delta);
        if (!moverHacia(persona, persona.x, persona.z, VELOCIDAD_VOLVER * delta)) {
          llegaronTodos = false;
        }
      }
    }
    if (llegaronTodos) {
      cambiarFase('tranquilo');
    }
  }

  /**
   * Avanza las rondas. Se llama en cada cuadro desde publico.js, antes de dibujar a la gente.
   * @param {number} delta  Segundos que pasaron desde el cuadro anterior
   */
  function actualizar(delta) {
    reloj += delta;
    tiempoEnFase += delta;
    boomEnEsteCuadro = false;

    const booms = musica.temaActual().booms ?? [];
    const segundos = musica.segundosDelTema();
    const mismoTema = musica.numeroDeTema() === temaAnterior;
    const sonando = musica.estaSonando();

    // ¿El tema acaba de pasar por un boom? Comparamos con el cuadro anterior.
    boomEnEsteCuadro =
      sonando && mismoTema && booms.some((boom) => segundosAnteriores < boom && boom <= segundos);
    segundosAnteriores = segundos;
    temaAnterior = musica.numeroDeTema();

    // Si el tema se cortó o cambió, la ronda se desarma aunque no le haya llegado el boom.
    if ((fase === 'armando' || fase === 'pogo') && (!sonando || !mismoTema)) {
      empezarACerrar();
    }

    if (fase === 'tranquilo' && sonando) {
      // ¿Falta poco para el próximo boom? find da el primero de la lista que todavía no pasó.
      const proximo = booms.find((boom) => boom > segundos);
      if (proximo !== undefined) {
        const falta = proximo - segundos;
        if (falta <= SEGUNDOS_ANTES_DEL_BOOM && falta >= MINIMO_PARA_ARMAR) {
          cambiarFase('armando');
          segundosParaArmar = falta;
        }
      }
    }

    if (boomEnEsteCuadro) {
      if (fase === 'armando') {
        empezarPogo();
      } else if (fase === 'pogo') {
        finDelPogo = reloj + SEGUNDOS_POGO; // otro boom con el pogo andando: sigue un rato más
      }
    }

    if (fase === 'armando') {
      moverArmando(delta);
    } else if (fase === 'pogo') {
      moverPogo(delta);
      if (reloj >= finDelPogo) {
        empezarACerrar();
      }
    } else if (fase === 'cerrando') {
      moverCerrando(delta);
    }
  }

  // true solo en el cuadro en que el tema explota.
  function hayBoom() {
    return boomEnEsteCuadro;
  }

  // Si hay una ronda activa cerca de un punto, devuelve su fase ('armando' o 'pogo'); si no, null.
  // (x, z) medido como las personas. margen: metros afuera del círculo que también cuentan.
  function faseCerca(x, z, margen) {
    if (fase !== 'armando' && fase !== 'pogo') {
      return null;
    }
    for (const ronda of rondas) {
      if (Math.hypot(x - ronda.x, z - ronda.z) < ronda.radio + margen) {
        return fase;
      }
    }
    return null;
  }

  return { actualizar, rockeros: todosLosRockeros, hayBoom, fase: () => fase, faseCerca };
}
