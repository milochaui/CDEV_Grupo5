# SDD — Textos corregidos para que coincidan con el simulador

Cada sección de abajo reemplaza **completa** a la sección del SDD que tiene el mismo número. Las líneas que empiezan con **"Nota:"** son aclaraciones para el equipo: **no se pegan** en el SDD.

Para que las tablas y las negritas se peguen bien en Google Docs: *Herramientas → Preferencias → Habilitar Markdown*, y después *Editar → Pegar desde Markdown*.

---

## 1. Introducción (solo los dos primeros párrafos)

> Nota: el nombre pasa a ser el que muestra el portal del juego ("Salve Salve Rockanrol"). Si prefieren "Salve Salve Rock & Roll", hay que cambiarlo en el SDD y en `src/portal.js`. El resto de la introducción (la tabla de dimensiones) queda igual.

**Salve Salve Rockanrol** es un simulador en primera persona de un festival de rock al aire libre, donde **lo que el usuario ve, escucha y siente depende de dónde se para, de la hora y de lo que hace**. No hay un menú para elegir shows: hay un predio cerrado con tres escenarios que tocan al mismo tiempo, una grilla de horarios en la que las bandas se van sucediendo, un cielo que pasa del atardecer a la noche y un público que reacciona a cada tema. Caminar es elegir.

El proyecto toma como referente al Cosquín Rock, que en su edición 2026 reunió a más de 100 artistas en seis escenarios en el Aeródromo de Santa María de Punilla, Córdoba. De ese festival tomamos la lógica espacial (escenarios simultáneos, sonido que se cruza entre ellos, zonas de público, barras de comida, una grilla de horarios que obliga a elegir) y el ritual del público (los trapos en la valla, las remeras de las bandas, las banderas, el pogo, los celulares en alto en los temas lentos). El festival, el predio y su ambientación son una ficción propia del equipo. Las nueve bandas que tocan en el prototipo son reales del rock argentino y uruguayo (Guasones, Callejeros, Turf, Intoxicados, No Te Va Gustar y La Vela Puerca a la tarde; Ciro y los Persas, Las Pastillas del Abuelo y Andrés Calamaro como cierre de cada escenario), y sus temas se usan solo con fines académicos.

---

## 3.2 Problema, necesidad y motivación (solo la tabla de emociones)

> Nota: cambian las filas de FOMO, Pertenencia y Contemplación.

| Emoción | Dónde aparece en el festival real | Cómo la trabajamos en el prototipo |
|---|---|---|
| Euforia colectiva | El estribillo cantado por miles | 200 personas por escenario que saltan con los golpes graves del tema, levantan los brazos y hacen pogo con el usuario |
| Miedo a perderse algo (FOMO) | Dos bandas favoritas a la misma hora | Los tres escenarios tocan al mismo tiempo y la grilla (tecla G) muestra quién toca en cada uno: mientras mirás a una banda, en otro escenario está tocando otra. Desde el centro del predio se escuchan las tres de fondo y hay que elegir a cuál ir |
| Descubrimiento | Frenar frente a una banda que no conocías | Tres escenarios con colores distintos y nueve bandas con estilos distintos (rock barrial, rock stone, rock uruguayo con vientos); el sonido de uno se filtra mientras caminás hacia otro |
| Pertenencia | Los trapos del barrio, la remera de la banda, el fernet con amigos | Trapos de los fans de cada banda en la valla, remeras de las bandas y banderas en el público, rondas de amigos y mantitas en el medio del predio, barra de fernet y choripán, banderines en la plaza central |
| Contemplación | El atardecer entre show y show | El cielo sigue la hora del festival: entre las 18:00 y las 21:00 pasa del atardecer a la noche, el sol se esconde y aparecen las estrellas |

---

## 3.4 Características generales

| Característica | Definición |
|---|---|
| Género | Simulación de experiencia, exploración libre en primera persona (con vista opcional en tercera persona) |
| Plataforma | Navegador web en PC, con teclado y mouse. No requiere instalación |
| Duración de una sesión | Libre. El reloj del festival arranca a las 17:58 y corre 10 veces más rápido que el tiempo real: las tres horas que van del atardecer (18:00) a la noche cerrada (21:00) duran 18 minutos de juego. Desde las 21:00 tocan las bandas principales, que repiten su lista sin parar |
| Escenarios | 3 escenarios en triángulo, a unos 140 m entre sí, con una plaza central y una barra de comida, dentro de un predio cerrado por vallas con una entrada |
| Bandas | 9 bandas, 3 por escenario, una después de la otra según la grilla: 6 bandas de la tarde (dos temas cada una, uno tranquilo y uno conocido) y 3 bandas principales a la noche. 19 temas en total |
| Regla central | La banda que se escucha depende de la distancia a cada escenario; qué banda toca en cada escenario depende de la hora del festival; y la energía del público depende de si el tema que suena es conocido o no |
| Modo de juego | Un jugador. El objetivo es llenar el **aguante-metro** participando del recital; no hay final ni condición de derrota |

---

## 3.6 Mapa conceptual del diseño (texto)

El usuario controla **dónde está** y **qué hace**; el reloj del festival controla **cuándo**. La hora define qué banda toca en cada escenario y cómo se ve el cielo; la distancia a cada escenario define qué banda escucha; el tema que suena define la energía del público; las acciones del usuario contagian a la gente de alrededor y llenan el aguante-metro; y la respuesta del mundo (el cantante que lo saluda, los aplausos, los fuegos artificiales, la chica que le pide subirse a los hombros) es la que lo invita a seguir participando o a caminar hacia otro escenario.

---

## 4.2 Actores del entorno

> Nota: el SDD decía "el barman y el parrillero", pero en el prototipo hay un solo barman y una parrilla con choripanes.

**Dentro del mundo virtual:**

- **Las bandas:** nueve, tres por escenario, que suben a la tarima en su horario y se bajan al terminar su set. Cada músico está caracterizado de forma reconocible con pocas formas: Ciro con tapado negro y armónica; el Piti con lentes chiquitos y un vaso de fernet; Calamaro con sombrero, lentes oscuros y barba canosa; Facundo de Guasones con melena, campera de cuero y pañuelo rojo; Pato de Callejeros con el puño en alto y el bandoneón en los temas tranquilos; Levinton de Turf con traje setentoso y lentes naranjas; el Pity de Intoxicados con su gorro rasta; Emiliano de No Te Va Gustar con guitarra criolla y vientos; y los dos cantantes de La Vela Puerca saltando juntos. El nombre de cada banda aparece en el bombo. Se mueven con los golpes graves del tema y el cantante se da vuelta para saludar al usuario cuando llena el aguante-metro.
- **El público:** 200 personas por escenario que reaccionan al tema (euforia con los conocidos, celulares con linterna en los tranquilos), aplauden al terminar cada tema y se contagian de lo que hace el usuario. Más de la mitad lleva remeras de las bandas del festival; en cada escenario, 8 personas ondean banderas (de Uruguay en los shows de No Te Va Gustar y La Vela Puerca) y 6 van subidas a los hombros de otra.
- **La chica del público:** cuando el usuario está metido entre la gente y empieza un tema tranquilo, una chica se le pone adelante y le pide que la suba a los hombros. El usuario puede decir que sí o que no.
- **La gente del medio del predio:** rondas de amigos charlando y mantitas con gente sentada alrededor de la plaza central, lejos de los escenarios.
- **El barman:** atiende la barra de fernet y choripán, con su parrilla.
- **El camarógrafo virtual:** una cámara que filma a la banda y la muestra en la pantalla gigante del escenario, cambiando de toma cada 6 segundos.

**Fuera del mundo virtual:** (queda igual)

---

## 5.1 Narrativa digital (storytelling)

SSR no cuenta una historia con personajes y diálogos: **la historia es la noche que arma cada usuario**. Es una narrativa emergente, que surge de sus decisiones y de cómo responde el mundo. El reloj del festival funciona como reloj narrativo: marca qué banda toca en cada escenario y cómo se ve el cielo, y divide la experiencia en tres actos:

> Nota: si mantienen una sigla, con el nombre nuevo queda "SSR". Si no, reemplazar "SSR" por "el simulador" en todo el documento.

| Acto | Qué pasa en el mundo | Qué vive el usuario |
|---|---|---|
| **1. Llegada (17:58, atardecer)** | El usuario está afuera, en el pasillo vallado de la entrada, frente al portal con el cartel del festival. Los escenarios todavía están vacíos y sus carteles anuncian a las primeras bandas, que suben a las 18:00 | Cruza el portal, se orienta, abre la grilla y elige hacia dónde ir |
| **2. La tarde (18:00 a 21:00, anochecer)** | En cada escenario se suceden dos bandas de la tarde. Entre una y otra, el cartel anuncia a la que sigue y en la valla aparecen los trapos de sus fans. El sol se esconde y los reflectores empiezan a dominar | Se mete entre la gente, salta, canta, hace pogo, llena el aguante y el cantante lo saluda; sube (o no) a la chica a los hombros; va de un escenario a otro siguiendo la grilla |
| **3. La noche (desde las 21:00, noche cerrada)** | Estrellas. Suben las bandas principales y tocan sin parar. Fuegos artificiales al terminar los temas conocidos y celulares con linterna en los tranquilos | Elige con quién cerrar la noche, pasa por la barra, arma su propio cierre |

Cada usuario termina con una versión distinta: quién vio a Guasones, Callejeros y Ciro sin moverse del escenario rojo, quién fue de un escenario a otro con la grilla en la mano, quién terminó con un fernet en la barra.

---

## 5.2 Inmersión, agencia y transformación (Janet Murray)

> Nota: cambian la fila de Agencia y el párrafo de la limitación. El resto de la tabla queda igual.

| Propiedad | Definición (Murray) | Cómo aparece en el simulador |
|---|---|---|
| **Agencia** | La posibilidad de tomar decisiones con consecuencias visibles | Elegir a qué escenario ir (y a qué hora) cambia lo que se escucha y se ve; levantar los brazos, cantar o hacer pogo contagia al público cercano; el aguante-metro se llena con la participación y el cantante responde saludando; subir a la chica a los hombros cambia cómo se vive el tema |

Como limitación, el prototipo no tiene finales múltiples ni una historia ramificada: la transformación se da en el estado del mundo (la hora, la banda que toca, la energía del público) y del usuario. Lo que sí cambia de una partida a otra es el recorrido: con nueve bandas repartidas en una grilla, ningún usuario puede verlo todo, y cada noche es distinta.

---

## 5.3 Perspectiva del usuario (flujo y POV)

**Punto de vista:** primera persona, a 1,7 m de altura, con los brazos visibles en la parte inferior de la pantalla (como en los juegos en primera persona) y una mira en el centro. Con la tecla V se pasa a una vista en tercera persona: la cámara se ubica 4 m detrás del jugador y se ve su cuerpo (y a la chica, si la subió a los hombros). Con V otra vez se vuelve a la primera persona.

**Flujo de la experiencia:**

1. **Pantalla de inicio:** título, cartel con las bandas (las tres principales destacadas y las de la tarde abajo) y todos los controles. Clic para entrar; con ese clic se habilita el sonido.
2. **Entrada:** el usuario aparece afuera del predio, en el pasillo vallado, mirando el portal con el cartel del festival. Arriba a la izquierda, el reloj marca las 17:58; a las 18:00 (unos 12 segundos reales después) suben las primeras bandas.
3. **Plaza central:** cruza el portal, pasa junto a la barra y llega al centro del predio, entre banderines, rondas de amigos y mantitas. Escucha las tres bandas de fondo. Con G puede abrir la grilla para ver quién toca en cada escenario.
4. **Elección:** camina hacia un escenario. La banda elegida crece en volumen, las otras se apagan y un indicador muestra la banda y el tema que suena.
5. **Entrar al público:** se mete entre la gente. Puede saltar, levantar los brazos, cantar y hacer pogo. Si empieza un tema tranquilo, una chica puede pedirle que la suba a los hombros (1: sí / 2: no).
6. **Aguante:** al llenar el aguante-metro aparece "¡AGUANTE!" y el cantante se da vuelta para saludarlo.
7. **Fin del tema:** aplausos y gritos; si era un tema conocido, fuegos artificiales detrás del escenario (salvo en el show de Callejeros).
8. **Cambio de banda:** cuando una banda de la tarde termina su set, se baja; el cartel anuncia a la que sigue y en la valla aparecen los trapos de sus fans. A las 21:00 suben las bandas principales.
9. **Recorrido libre:** otro escenario, la barra (fernet o choripán) o volver a la plaza. Con Esc o P se pausa todo en cualquier momento, también el reloj.

---

## 6.1 Estética visual

- **Estilo low-poly:** todo el mundo está armado con formas simples (cajas y cilindros). Es una decisión estética y técnica: se lee bien de lejos, es liviano para el navegador y permite caracterizar a los músicos con pocos rasgos reconocibles.
- **Paleta por escenario:** cada escenario tiene su color en la pantalla, los reflectores y el cartel: **rojo** para el escenario que cierra Ciro y los Persas, **ámbar** para el de Las Pastillas del Abuelo y **celeste** para el de Andrés Calamaro. Así cada escenario se identifica desde lejos; el indicador del tema que suena y la columna de la grilla toman el mismo color.
- **Ciclo de luz:** el cielo es un degradé que, siguiendo la hora del festival, va del azul profundo, rosado y naranja del atardecer (18:00) a la noche cerrada (21:00) con 700 estrellas. La niebla toma el color del horizonte para que el predio se funda con el cielo.
- **Resplandor (bloom):** las luces, las pantallas, los fuegos artificiales y las linternas de los celulares tienen un halo de luz, como en las fotos de un recital.
- **Ambientación del predio:** pasto con tierra pisada donde está el público y caminos entre escenarios; guirnaldas de banderines con lamparitas en la plaza central; un vallado de malla metálica que cierra el predio y un portal en la entrada con el nombre del festival. En la valla de cada escenario cuelgan los trapos de los fans de la banda que toca, que cambian con cada show ("AGUANTE CIRO", "LANÚS PRESENTE", "VILLA CELINA", "URUGUAY PRESENTE", "CÓRDOBA PRESENTE", entre otros).
- **El público:** remeras negras con el nombre de las bandas del festival, banderas argentinas y de dos colores como las de los clubes (de Uruguay en los shows uruguayos) y gente subida a los hombros.
- **Interfaz:** menú de inicio y pausa con tipografía de cartel de festival y degradé de colores; reloj del festival arriba a la izquierda; grilla de horarios con una columna por escenario que marca la banda que está tocando; y carteles chicos en pantalla para el tema que suena, las acciones activas, el aguante-metro y el diálogo con la chica.

---

## 6.3 Tipos y diseño de dispositivos de interacción

La interacción usa **teclado y mouse**, con el esquema estándar de los juegos en primera persona para que sea familiar. Las acciones del recital se **mantienen apretadas**, como un gesto sostenido en el cuerpo.

| Dispositivo | Entrada | Acción |
|---|---|---|
| Mouse | Movimiento | Mirar alrededor |
| Mouse | Clic | Entrar al juego, continuar después de la pausa, tomar o comer |
| Teclado | W A S D o flechas | Caminar |
| Teclado | Shift (mantener) | Correr |
| Teclado | Espacio | Saltar |
| Teclado | E (mantener) | Levantar los brazos |
| Teclado | Q (mantener) | Cantar |
| Teclado | F (mantener) | Pogo (solo metido entre el público) |
| Teclado | R / C | En la barra: pedir fernet o choripán |
| Teclado | G | Abrir o cerrar la grilla de horarios |
| Teclado | V | Cambiar entre primera y tercera persona |
| Teclado | 1 / 2 | Responder que sí o que no cuando la chica pide subirse a los hombros |
| Teclado | Esc o P | Pausa (se detienen la música y el reloj, y el público se congela) |
| Teclado | M | Silenciar o activar el sonido |

---

## 6.4 Diseño sonoro

El sonido es el centro de la experiencia: **es lo que hace que el usuario decida a dónde ir**.

- **Audio posicional:** la música sale del frente de cada escenario. El volumen depende de la distancia y el sonido se ubica a la izquierda o a la derecha según hacia dónde mira el usuario.
- **Tres zonas de volumen:** hasta 20 m del escenario se escucha al 100 %; entre 20 y 78 m baja siguiendo una curva cuadrática (se mantiene fuerte cerca y cae rápido a media distancia); más allá de 78 m hay silencio. Con esto, metido en el público de un escenario, los parlantes de los otros dos quedan a más de 95 m y no se escuchan; en la plaza central los tres parlantes están a unos 74 m y las tres bandas suenan al 13 %, bajito y de fondo.
- **Escenario en silencio entre bandas:** cuando una banda de la tarde termina su set, el escenario queda en silencio hasta el horario de la siguiente, como en un cambio de banda real.
- **Análisis del ritmo en tiempo real:** el audio de cada escenario se analiza mientras suena para detectar los golpes graves (40 a 150 Hz). Esos golpes marcan los saltos del público, el cabeceo de los músicos y los flashes de las luces.
- **Aplausos sintetizados:** entre tema y tema hay 6 segundos de ovación (palmas, gritos y silbidos) generados por código a partir de ruido, sin archivos de audio. Son más fuertes al terminar un tema conocido.
- **Pausa y silencio:** con la pausa se detiene la música de los tres escenarios; con M se silencia todo sin pausar.

**Grilla y lista de temas:**

| Escenario | Banda (horario) | Tema | Tipo |
|---|---|---|---|
| Rojo | Guasones (18:00) | Pasan las horas | Tranquilo |
| Rojo | Guasones | Reyes de la noche | Conocido |
| Rojo | Callejeros (19:30) | Una nueva noche fría | Tranquilo |
| Rojo | Callejeros | Rocanroles sin destino | Conocido |
| Rojo | Ciro y los Persas (21:00) | Astros | Conocido |
| Rojo | Ciro y los Persas | Servidor | Tranquilo |
| Ámbar | Turf (18:10) | Loco un poco | Tranquilo |
| Ámbar | Turf | Pasos al costado | Conocido |
| Ámbar | Intoxicados (19:40) | Nunca quise | Tranquilo |
| Ámbar | Intoxicados | Quieren rock | Conocido |
| Ámbar | Las Pastillas del Abuelo (21:10) | Viejo Karma | Conocido |
| Ámbar | Las Pastillas del Abuelo | Me juego el corazón | Tranquilo |
| Celeste | No Te Va Gustar (18:20) | A las nueve | Tranquilo |
| Celeste | No Te Va Gustar | Chau | Conocido |
| Celeste | La Vela Puerca (19:50) | Llenos de magia | Tranquilo |
| Celeste | La Vela Puerca | Zafar | Conocido |
| Celeste | Andrés Calamaro (21:20) | Sin documentos | Conocido |
| Celeste | Andrés Calamaro | Todavía una canción de amor | Tranquilo |
| Celeste | Andrés Calamaro | Buena suerte y hasta luego | Tranquilo |

---

## 7. Diseño narrativo del entorno

El predio cuenta su propia historia a través de cómo está organizado:

- **La entrada:** el usuario llega desde afuera, por un pasillo vallado, y entra al predio por un portal con el nombre del festival. Es el umbral entre la vida cotidiana y el festival.
- **Distribución en triángulo:** los tres escenarios están a 80 m del centro y separados 120° entre sí, todos mirando hacia la plaza central. Hay unos 140 m de un escenario a otro: caminando se tarda unos 20 segundos y corriendo la mitad. Esa distancia genera la sensación de predio grande y hace que la elección de escenario tenga un costo.
- **El vallado:** el predio es un cuadrado de 240 m de lado cerrado por vallas de malla metálica, como en los festivales reales. Detrás de cada escenario quedan más de 30 m de pasto hasta la valla.
- **La plaza central:** una ronda de tierra con guirnaldas de banderines, rondas de amigos y mantitas con gente sentada. Es el punto de encuentro desde donde se escuchan las tres bandas.
- **Las zonas de público:** la gente está más amontonada cerca de la valla y más dispersa hacia atrás, como en un recital real. El usuario elige si mira desde lejos o se mete adelante.
- **La barra:** un puesto de fernet y choripán entre la entrada y la plaza central, en el camino de llegada: la primera parada y la pausa entre shows.
- **Las huellas del público:** la tierra pisada frente a cada escenario, los caminos marcados entre ellos y los trapos colgados en la valla, que cambian con cada banda, cuentan que por ahí pasó (y pasa) mucha gente.

### 7.1 Interacción (agencia)

Cada acción del usuario tiene una respuesta visible del mundo:

| Acción del usuario | Respuesta del mundo |
|---|---|
| Caminar hacia un escenario | Esa banda sube de volumen y las otras se apagan; el indicador muestra la banda y el tema que suena |
| Abrir la grilla (G) | Ve qué banda toca en cada escenario, cuáles ya tocaron y cuál sigue, con la que está tocando marcada |
| Levantar los brazos o cantar | El público cercano (6 m alrededor) se contagia y aumenta su euforia; con un tema conocido el efecto es mayor |
| Hacer pogo entre la gente | La cámara se sacude, el usuario recibe empujones y la gente de alrededor salta hasta 1,6 veces más alto |
| Participar (brazos, cantar, saltar, pogo) | El aguante-metro se llena, más rápido con los temas conocidos; si el usuario se queda quieto, se vacía de a poco |
| Llenar el aguante-metro | Aparece "¡AGUANTE!" y el cantante se da vuelta para saludar al usuario |
| Responder a la chica (1 / 2) | Con "sí", la chica sube a los hombros del usuario hasta que termina el tema ("¡Desde acá se ve todo!"); con "no", se va |
| Cambiar de vista (V) | El usuario ve su propio cuerpo desde atrás, en el medio del público |
| Pedir en la barra (R / C) y hacer clic | El fernet o el choripán aparece en la mano; cada clic es un trago o un mordisco |
| Pausar (Esc / P) | La música y el reloj se detienen y todo el predio se congela hasta volver |

---

## 8.2 Módulos del sistema

El código está dividido en módulos, uno por responsabilidad:

| Módulo | Responsabilidad |
|---|---|
| `main.js` | Punto de entrada: arma la escena, los tres escenarios con su programación (bandas, horarios y temas), la barra, las vallas y el bucle de animación |
| `escenario.js` | Construye un escenario reutilizable a partir de una configuración (color, posición y bandas) y maneja su programación: qué banda sube y cuándo |
| `musica.js` | Reproduce el set de la banda que toca con audio posicional y analiza los graves |
| `publico.js` | Las 200 personas por escenario, con banderas y gente en hombros, y su reacción a la música |
| `remeras.js` | Los estampados de las remeras de bandas que lleva la gente |
| `artistas.js` | Los músicos de las nueve bandas, con su look, sus instrumentos y sus animaciones |
| `luces.js` | El show de luces: barrido de reflectores y flashes con los golpes |
| `pantalla.js` | La pantalla en vivo que filma a la banda |
| `aplausos.js` | La ovación sintetizada al terminar cada tema |
| `fuegos.js` | Los fuegos artificiales al terminar los temas conocidos |
| `grilla.js` | El reloj del festival y la grilla de horarios |
| `cielo.js` | El ciclo del atardecer a la noche (según la hora del reloj), el sol y las estrellas |
| `jugador.js` | Movimiento en primera persona y colisiones |
| `acciones.js` | Brazos, salto, cantar, pogo y contagio al público |
| `aguante.js` | El aguante-metro |
| `chica.js` | La chica que pide subirse a los hombros en los temas tranquilos |
| `terceraPersona.js` | La vista en tercera persona: el cuerpo del jugador y la cámara que lo sigue |
| `barra.js` | El puesto de fernet y choripán y los pedidos |
| `predio.js` | El piso, los caminos y los banderines |
| `gente.js` | La gente del medio del predio: rondas de amigos y mantitas |
| `vallas.js` | El vallado que cierra el predio, con el hueco de la entrada y su pasillo |
| `portal.js` | El portal de la entrada con el cartel del festival |

**Reutilización:** la función `crearEscenario(config)` arma un escenario completo (estructura, pantalla, valla, música, público, bandas, trapos, luces, aplausos, fuegos y programación) a partir de unos pocos datos. Agregar un cuarto escenario, o una banda más a la grilla, es agregar datos a la configuración.

---

## 8.3 Funcionamiento general

Un **bucle de animación** se ejecuta unas 60 veces por segundo. En cada cuadro:

1. Mueve al jugador y revisa colisiones (tarimas, torres de parlantes, barra, postes, columnas del portal y vallas).
2. Avanza el reloj del festival. Con su hora actualiza el cielo y la programación de cada escenario: si llegó el horario, sube la banda que sigue.
3. Actualiza los pedidos en la barra, las acciones del jugador y el contagio, la chica y la gente del medio.
4. Calcula el volumen de cada banda según la distancia del jugador.
5. Analiza los graves de cada tema y actualiza el público, los músicos, las luces y los fuegos.
6. Actualiza el indicador del tema y el aguante-metro (y, si está lleno, el saludo del cantante).
7. Filma la pantalla en vivo del escenario que más se escucha.
8. Actualiza el cuerpo del jugador y la cámara de tercera persona, dibuja la escena con la cámara de la vista elegida y le aplica el resplandor (bloom).

Todo el movimiento se calcula con el tiempo real entre cuadros, así funciona igual en una computadora rápida o lenta. Con la pausa, el bucle deja de actualizar el mundo y el reloj, y la música se detiene.

**Cadena de audio de cada escenario:** archivo mp3 → audio posicional en el frente del escenario → analizador de graves → volumen según distancia → oídos del jugador (pegados a la cámara).

---

## 8.4 Decisiones de rendimiento

Para que funcione fluido en una notebook común:

- **Instanciado:** las 600 personas del público, la gente del medio y los estampados de las remeras se dibujan con `InstancedMesh`, que dibuja muchas figuras iguales casi al costo de una sola.
- **Sin sombras:** ninguna luz proyecta sombras, que es lo más costoso de dibujar.
- **Una sola pantalla filmando:** filmar es volver a dibujar la escena, así que solo se filma la pantalla del escenario que más se escucha; las otras dos muestran el color de su banda. La imagen filmada es de 512 × 256 píxeles, suficiente vista de lejos.
- **Capas para las dos vistas:** los brazos del jugador solo los dibuja la cámara de primera persona y su cuerpo solo la de tercera persona, así ninguna dibuja de más.
- **Resplandor desactivable:** el bloom se puede apagar con una constante si una computadora no lo soporta.

---

## 9.2 Evolución del prototipo (fila nueva al final de la tabla)

| Fecha | Versión | Qué se agregó |
|---|---|---|
| 29/10 | Grilla y predio | Reloj del festival y grilla de horarios (G); nueve bandas, tres por escenario, cada una con su look, sus trapos y el nombre en el bombo; predio cerrado con vallas, portal y pasillo de entrada; gente en el medio del predio (rondas y mantitas); remeras de bandas, banderas y gente en hombros en el público; la chica que pide subirse a los hombros; vista en tercera persona (V) |

---

## 9.3 Iteraciones y aprendizajes

> Nota: los dos últimos ítems describen cambios que sí están en el código, pero el **motivo** lo deduje yo. Revisen que sea el que ustedes tuvieron y corríjanlo si no.

Las pruebas internas del equipo llevaron a varios cambios:

- **El sonido no se apagaba:** al alejarse mucho del escenario la música se seguía escuchando. Se pasó a un modelo con distancia máxima de silencio.
- **Demasiada mezcla en el centro:** con los tres escenarios, en la plaza central las tres bandas sonaban al 42 % cada una y se armaba ruido. Se separaron los escenarios (de 110 a 170 m) y se cambió a una curva de volumen cuadrática; en esa versión pasaron a sonar al 12 %, de fondo.
- **La pausa no frenaba nada:** la primera versión solo bajaba el volumen. Se implementó una pausa real que detiene la música y congela el predio.
- **Faltaba un objetivo:** recorrer y mirar no alcanzaba para sentir agencia. Se agregó el aguante-metro y la respuesta del cantante.
- **El tiempo no estaba conectado con los shows:** el cielo pasaba del atardecer a la noche en 3 minutos, sin relación con lo que pasaba en los escenarios. Se agregó un reloj del festival y una grilla: el cielo y la llegada de cada banda siguen la misma hora.
- **Predio cerrado:** al agregar las vallas y la entrada, se acercaron los escenarios al centro (de 98 a 80 m) y se ajustó la distancia de silencio (de 97 a 78 m) para conservar el mismo equilibrio: frente a un escenario se escucha solo esa banda y en el centro las tres suenan al 13 %.

**De la proyección al prototipo.** Al inicio del proyecto proyectamos una versión más ambiciosa. Al construir, recortamos y cambiamos varias decisiones para enfocarnos en la mecánica central:

| Proyección inicial | Prototipo | Por qué |
|---|---|---|
| Grilla horaria de 14 a 02 h, en 60 minutos reales | Grilla de 18:00 a 21:00 más las bandas principales desde las 21:00, con un reloj 10 veces más rápido (18 minutos de juego hasta la noche) | Permite vivir el paso de la tarde a la noche y la sucesión de bandas en una prueba de duración razonable |
| 5 escenarios y 25 bandas | 3 escenarios y 9 bandas | Foco en la mecánica central: elegir por el sonido y participar |
| Bandas y música originales | Bandas reales del rock argentino y uruguayo | Los temas conocidos generan la reacción emocional que queríamos probar |
| PC con extensión a realidad virtual | Navegador web | Se prueba en cualquier computadora y se comparte con un link |
| Sin condición de victoria | Aguante-metro como objetivo | Da propósito y hace visible la agencia |

---

## 9.5 Trailer (solo la última fila de la tabla)

| Tiempo | Imagen | Sonido / texto |
|---|---|---|
| 36–45 s | Vista general de los tres escenarios encendidos | Texto: "Salve Salve Rockanrol. El festival que armás vos." |

> Nota: como ahora el usuario arranca en la entrada, la toma de 0–5 s podría ser el pasillo vallado con el portal y el predio al atardecer detrás. Lo vemos cuando trabajemos el trailer (punto 3).

---

## 10. Conclusión (solo el segundo párrafo)

El principal aprendizaje del proceso fue que la proyección inicial era más grande de lo que podíamos construir y probar bien. Recortar a tres escenarios y enfocarnos en la mecánica central nos permitió llegar a algo que funciona y transmite la experiencia; sobre esa base pudimos sumar después una grilla horaria con nueve bandas, que devolvió al prototipo parte de la idea original. Como trabajo futuro quedan las pruebas con usuarios, más escenarios y bandas, compañeros virtuales y la versión en realidad virtual.

---

## 12. Anexos (solo el ítem "Cómo ejecutar el prototipo")

- **Cómo ejecutar el prototipo:** instalar Node.js, copiar los audios en `public/audio` (con los nombres de archivo que figuran en el README), ejecutar `npm install` y `npm run dev`, y abrir la dirección que muestra la consola. Sin los audios el simulador funciona igual, pero las bandas tocan en silencio.
