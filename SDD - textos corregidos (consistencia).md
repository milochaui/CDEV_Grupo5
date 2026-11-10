# SDD — Textos corregidos para que coincidan con el simulador

Cada sección de abajo reemplaza **completa** a la sección del SDD que tiene el mismo número. Las líneas que empiezan con **"Nota:"** son aclaraciones para el equipo: **no se pegan** en el SDD.

Para que las tablas y las negritas se peguen bien en Google Docs: *Herramientas → Preferencias → Habilitar Markdown*, y después *Editar → Pegar desde Markdown*.

> Nota: actualizado al 10/11, con todo lo que se sumó después del 29/10: las rondas de pogo con papelitos, la borrachera con desmayo y la mañana siguiente, el choripán que baja la borrachera, el celular con fotos, el robo y la persecución, La Carpita, el bis y el resumen de la noche. También se corrigieron cuatro temas de la lista, que no coincidían con los que suenan en el juego.

---

## 1. Introducción (solo los dos primeros párrafos)

> Nota: el nombre es el que muestra el portal del juego ("Salve Salve Rockanrol"). Si prefieren "Salve Salve Rock & Roll", hay que cambiarlo en el SDD y en `src/portal.js`. El resto de la introducción (la tabla de dimensiones) queda igual.

**Salve Salve Rockanrol** es un simulador en primera persona de un festival de rock al aire libre, donde **lo que el usuario ve, escucha y siente depende de dónde se para, de la hora y de lo que hace**. No hay un menú para elegir shows: hay un predio cerrado con tres escenarios y una carpa que tocan al mismo tiempo, una grilla de horarios en la que las bandas se van sucediendo, un cielo que pasa del atardecer a la noche y un público que reacciona a cada tema. Caminar es elegir, y cada decisión (meterse en el pogo, tomar un fernet de más, sacar el celular entre la gente) tiene consecuencias.

El proyecto toma como referente al Cosquín Rock, que en su edición 2026 reunió a más de 100 artistas en seis escenarios en el Aeródromo de Santa María de Punilla, Córdoba. De ese festival tomamos la lógica espacial (escenarios simultáneos, sonido que se cruza entre ellos, una carpa chica para artistas de nicho como la Casita del Blues, zonas de público, barras de comida, una grilla de horarios que obliga a elegir) y el ritual del público (los trapos en la valla, las remeras de las bandas, las banderas, la ronda del pogo, el "¡otra, otra!", los celulares en alto en los temas lentos). El festival, el predio y su ambientación son una ficción propia del equipo. Las nueve bandas de los escenarios grandes son reales del rock argentino y uruguayo (Guasones, Callejeros, Turf, Intoxicados, No Te Va Gustar y La Vela Puerca a la tarde; Ciro y los Persas, Las Pastillas del Abuelo y Andrés Calamaro como cierre de cada escenario), y en la carpa tocan Lean Dotta, Pepi Gabrielli con Manu Viale, y Colo Giub. Los temas se usan solo con fines académicos.

> Nota: decidan cómo presentar a los artistas de la carpa (por ejemplo, "artistas emergentes" o "músicos amigos del equipo"). Al personaje de Lean Dotta le inventamos el look porque no encontramos fotos suyas.

---

## 3.2 Problema, necesidad y motivación (solo la tabla de emociones)

> Nota: respecto de la versión anterior, cambian las filas de Euforia, Descubrimiento y Pertenencia, y se suman Desborde y Riesgo.

| Emoción | Dónde aparece en el festival real | Cómo la trabajamos en el prototipo |
|---|---|---|
| Euforia colectiva | El estribillo cantado por miles, la ronda que explota | 200 personas por escenario que saltan con los golpes graves del tema, levantan los brazos y hacen pogo con el usuario. Unos segundos antes de que explote un tema conocido se abre la ronda; cuando explota, salta todo el público y vuelan papelitos desde la tarima |
| Miedo a perderse algo (FOMO) | Dos bandas favoritas a la misma hora | Los tres escenarios y la carpa tocan al mismo tiempo y la grilla (tecla G) muestra quién toca en cada uno. Desde el centro del predio se escuchan las tres bandas grandes de fondo y hay que elegir a cuál ir |
| Descubrimiento | Frenar frente a una banda que no conocías | Tres escenarios con colores distintos, nueve bandas con estilos distintos (rock barrial, rock stone, rock uruguayo con vientos) y una carpa escondida en una esquina del predio, con artistas de nicho (cuarteto, acústicos) que solo se escuchan al entrar |
| Pertenencia | Los trapos del barrio, la remera de la banda, el fernet con amigos, pedir el bis | Trapos de los fans de cada banda en la valla, remeras y banderas en el público, rondas de amigos y mantitas en el medio del predio, barra de fernet y choripán. Cuando una banda termina, el público pide "¡otra, otra!" y el usuario puede sumarse para conseguir el bis |
| Contemplación | El atardecer entre show y show | El cielo sigue la hora del festival: entre las 18:00 y las 21:00 pasa del atardecer a la noche, el sol se esconde y aparecen las estrellas |
| Desborde | El fernet de más, la mañana después | Cada fernet cambia la percepción (colores, luces que laten, mareo); con unos 5 el usuario se desmaya y se despierta a la mañana siguiente, con el predio vacío y la gente limpiando |
| Riesgo | Cuidar el celular entre la gente | Si saca mucho el celular para filmar o sacar fotos, sobre todo en el pogo o de noche, aparece un ladrón; si se lo roba, lo puede perseguir para recuperarlo |

---

## 3.4 Características generales

| Característica | Definición |
|---|---|
| Género | Simulación de experiencia, exploración libre en primera persona (con vista opcional en tercera persona) |
| Plataforma | Navegador web en PC, con teclado y mouse. No requiere instalación |
| Duración de una sesión | Libre. El reloj del festival arranca a las 17:58 y corre 10 veces más rápido que el tiempo real: las tres horas que van del atardecer (18:00) a la noche cerrada (21:00) duran 18 minutos de juego. Desde las 21:00 tocan las bandas principales, que repiten su lista sin parar. La noche termina si el usuario se desmaya: se despierta a las 07:00 del día siguiente y ve el resumen de su noche |
| Escenarios | 3 escenarios en triángulo, a unos 140 m entre sí, y **La Carpita**, una carpa chica en la esquina entre el Escenario Rojo y el Ámbar. Hay una plaza central y una barra de comida, dentro de un predio cerrado por vallas con una entrada |
| Bandas | 12 artistas, 3 por escenario y 3 en la carpa, uno después del otro según la grilla. Los de la tarde tocan dos temas (uno tranquilo y uno conocido) y pueden volver para un bis; los que cierran la noche repiten su lista. 25 temas en total |
| Regla central | La banda que se escucha depende de la distancia a cada escenario; qué banda toca en cada escenario depende de la hora del festival; y la energía del público depende de si el tema que suena es conocido o no |
| Modo de juego | Un jugador. El objetivo es llenar el **aguante-metro** participando del recital. No hay condición de derrota, pero las decisiones tienen consecuencias (la borrachera, el desmayo, el robo del celular) y, si la noche termina, el **resumen** muestra lo que hizo el usuario |

---

## 3.6 Mapa conceptual del diseño (texto)

El usuario controla **dónde está** y **qué hace**; el reloj del festival controla **cuándo**. La hora define qué banda toca en cada escenario y cómo se ve el cielo; la distancia a cada escenario define qué banda escucha; el tema que suena define la energía del público y cuándo se arma la ronda del pogo; las acciones del usuario contagian a la gente de alrededor y llenan el aguante-metro; y la respuesta del mundo (el cantante que lo saluda, los aplausos, los fuegos artificiales, el bis que consigue pidiéndolo, la chica que le pide subirse a los hombros) es la que lo invita a seguir participando o a caminar hacia otro escenario. Hay además dos tentaciones con costo: el fernet, que lo pone eufórico pero puede terminar en un desmayo, y el celular, que le deja guardar fotos pero atrae a un ladrón. Todo lo que hace queda anotado en el resumen de la noche.

---

## 4.2 Actores del entorno

**Dentro del mundo virtual:**

- **Las bandas:** nueve en los escenarios grandes, tres por escenario, que suben a la tarima en su horario y se bajan al terminar su set. Cada músico está caracterizado de forma reconocible con pocas formas: Ciro con tapado negro y armónica; el Piti con lentes chiquitos y un vaso de fernet; Calamaro con sombrero, lentes oscuros y barba canosa; Facundo de Guasones con melena, campera de cuero y pañuelo rojo; Pato de Callejeros con el puño en alto y el bandoneón en los temas tranquilos; Levinton de Turf con traje setentoso y lentes naranjas; el Pity de Intoxicados con su gorro rasta; Emiliano de No Te Va Gustar con guitarra criolla y vientos; y los dos cantantes de La Vela Puerca saltando juntos. El nombre de cada banda aparece en el bombo. Se mueven con los golpes graves del tema y el cantante se da vuelta para saludar al usuario cuando llena el aguante-metro.
- **Los artistas de la carpa:** Lean Dotta, con camisa de lentejuelas y el micrófono en la mano, baila el pasito cuartetero acompañado por un tecladista y un bajista; Pepi Gabrielli, grandote y ruludo, canta con el puño en alto, y Manu Viale, con mullet y camisa leñadora abierta, toca la guitarra "sufriendo", con la cabeza gacha; y Colo Giub, colorado, toca la guitarra criolla y canta.
- **El público:** 200 personas por escenario (90 en la carpa) que reaccionan al tema (euforia con los conocidos, celulares con linterna en los tranquilos), aplauden al terminar cada tema, piden "¡otra, otra!" cuando la banda se baja y se contagian de lo que hace el usuario. Más de la mitad lleva remeras de las bandas del festival; en cada escenario, 8 personas ondean banderas (de Uruguay en los shows de No Te Va Gustar y La Vela Puerca) y 6 van subidas a los hombros de otra.
- **Los rockeros de la ronda:** unos segundos antes de que explote un tema conocido, dos rockeros empiezan a dar vueltas y abren la ronda; la gente se corre y, cuando explota, la ronda se llena de gente chocándose.
- **La chica del público:** cuando el usuario está metido entre la gente y empieza un tema tranquilo, una chica se le pone adelante y le pide que la suba a los hombros. El usuario puede decir que sí o que no.
- **El ladrón:** un pibe con buzo oscuro y capucha. Si el usuario tiene el celular mucho tiempo afuera, se le acerca por detrás; si llega, se lo roba y sale corriendo entre la gente.
- **La gente del medio del predio:** rondas de amigos charlando y mantitas con gente sentada alrededor de la plaza central, lejos de los escenarios.
- **El barman:** atiende la barra de fernet y choripán, con su parrilla.
- **Los operarios de limpieza:** a la mañana siguiente, con mameluco naranja y bandas reflectivas, barren y juntan la basura del predio. Uno está al lado del usuario cuando se despierta y le habla.
- **El camarógrafo virtual:** una cámara que filma a la banda y la muestra en la pantalla gigante del escenario, cambiando de toma cada 6 segundos.

**Fuera del mundo virtual:** (queda igual)

---

## 5.1 Narrativa digital (storytelling)

Salve Salve Rockanrol no cuenta una historia con personajes y diálogos: **la historia es la noche que arma cada usuario**. Es una narrativa emergente, que surge de sus decisiones y de cómo responde el mundo. El reloj del festival funciona como reloj narrativo: marca qué banda toca en cada escenario y cómo se ve el cielo, y divide la experiencia en tres actos y un epílogo:

> Nota: si mantienen una sigla, con el nombre nuevo queda "SSR". Si no, reemplazar "SSR" por "el simulador" en todo el documento.

| Acto | Qué pasa en el mundo | Qué vive el usuario |
|---|---|---|
| **1. Llegada (17:58, atardecer)** | El usuario está afuera, en el pasillo vallado de la entrada, frente al portal con el cartel del festival. Los escenarios todavía están vacíos y sus carteles anuncian a las primeras bandas, que suben a las 18:00 | Cruza el portal, se orienta, abre la grilla y elige hacia dónde ir |
| **2. La tarde (18:00 a 21:00, anochecer)** | En cada escenario y en la carpa se suceden dos artistas de la tarde. Cuando uno termina, el público pide "¡otra, otra!"; después, el cartel anuncia al que sigue y en la valla aparecen los trapos de sus fans. Con los temas conocidos se arman las rondas de pogo. El sol se esconde y los reflectores empiezan a dominar | Se mete entre la gente, salta, canta, se mete en la ronda, llena el aguante y el cantante lo saluda; consigue (o no) el bis; sube (o no) a la chica a los hombros; saca fotos con el celular y lo cuida del ladrón; descubre la carpa; va de un escenario a otro siguiendo la grilla |
| **3. La noche (desde las 21:00, noche cerrada)** | Estrellas. Suben las bandas principales y tocan sin parar. Fuegos artificiales al terminar los temas conocidos y celulares con linterna en los tranquilos. De noche es más fácil que te roben | Elige con quién cerrar la noche, pasa por la barra, arma su propio cierre |
| **Epílogo: la mañana siguiente (solo si se desmaya)** | Pantalla en negro ("Horas después…"). A las 07:00 el predio está vacío, lleno de vasos y papeles, y los operarios limpian | Se despierta tirado en el pasto, uno de los que barre le habla, y aparece el resumen de su noche |

Cada usuario termina con una versión distinta: quién vio a Guasones, Callejeros y Ciro sin moverse del escenario rojo, quién fue de un escenario a otro con la grilla en la mano, quién descubrió la carpa, quién se quedó sin celular, quién terminó desmayado en el pasto. El resumen de la noche lo deja a la vista.

---

## 5.2 Inmersión, agencia y transformación (Janet Murray)

> Nota: cambian la fila de Agencia y el párrafo de la limitación. El resto de la tabla queda igual.

| Propiedad | Definición (Murray) | Cómo aparece en el simulador |
|---|---|---|
| **Agencia** | La posibilidad de tomar decisiones con consecuencias visibles | Elegir a qué escenario ir (y a qué hora) cambia lo que se escucha y se ve; levantar los brazos, cantar o hacer pogo contagia al público cercano; el aguante-metro se llena con la participación y el cantante responde saludando; pedir el bis hace volver a la banda; subir a la chica a los hombros cambia cómo se vive el tema; tomar fernet cambia cómo se ve y se oye todo, y puede terminar la noche; sacar el celular deja fotos, pero puede atraer a un ladrón, y alcanzarlo o no decide si se recuperan |

Como limitación, el prototipo no tiene una historia ramificada: la transformación se da en el estado del mundo (la hora, la banda que toca, la energía del público) y del usuario (borracho o sobrio, con o sin celular). Lo que sí cambia de una partida a otra es el recorrido y su final: con doce artistas repartidos en una grilla, ningún usuario puede verlo todo, y el resumen de la noche muestra que cada noche es distinta.

---

## 5.3 Perspectiva del usuario (flujo y POV)

**Punto de vista:** primera persona, a 1,7 m de altura, con los brazos visibles en la parte inferior de la pantalla (como en los juegos en primera persona) y una mira en el centro. Con la tecla V se pasa a una vista en tercera persona: la cámara se ubica 4 m detrás del jugador y se ve su cuerpo (y a la chica, si la subió a los hombros). Con V otra vez se vuelve a la primera persona.

**Flujo de la experiencia:**

1. **Pantalla de inicio:** título, cartel con las bandas (las tres principales destacadas, las de la tarde abajo y las de la carpa en otra línea) y todos los controles. Clic para entrar; con ese clic se habilita el sonido.
2. **Entrada:** el usuario aparece afuera del predio, en el pasillo vallado, mirando el portal con el cartel del festival. Arriba a la izquierda, el reloj marca las 17:58; a las 18:00 (unos 12 segundos reales después) suben las primeras bandas.
3. **Plaza central:** cruza el portal, pasa junto a la barra y llega al centro del predio, entre banderines, rondas de amigos y mantitas. Escucha las tres bandas de fondo. Con G puede abrir la grilla para ver quién toca en cada escenario y en la carpa.
4. **Elección:** camina hacia un escenario o hacia la carpa. La banda elegida crece en volumen, las otras se apagan y un indicador muestra la banda y el tema que suena.
5. **Entrar al público:** se mete entre la gente. Puede saltar, levantar los brazos, cantar y hacer pogo. Si empieza un tema tranquilo, una chica puede pedirle que la suba a los hombros (1: sí / 2: no).
6. **La ronda:** antes de que explote un tema conocido se abre la ronda; cuando explota, vuelan papelitos y, si el usuario está adentro, el pogo lo lleva puesto.
7. **Aguante:** al llenar el aguante-metro aparece "¡AGUANTE!" y el cantante se da vuelta para saludarlo.
8. **Fin del tema:** aplausos y gritos; si era un tema conocido, fuegos artificiales detrás del escenario (salvo en el show de Callejeros).
9. **El bis:** cuando una banda de la tarde termina su último tema, se baja y el público pide "¡otra, otra!" durante unos 12 segundos. Si el usuario está cerca y la pide cantando o con los brazos arriba, la banda vuelve y toca de nuevo su tema conocido.
10. **Cambio de banda:** sin bis (o después del bis), la banda se baja; el cartel anuncia a la que sigue y en la valla aparecen los trapos de sus fans. A las 21:00 suben las bandas principales.
11. **Recorrido libre:** otro escenario, la carpa, la barra (fernet o choripán) o volver a la plaza. En cualquier momento puede sacar el celular (X) para sacar fotos y verlas en la galería (Z), cuidándose del ladrón. Con Esc o P se pausa todo, también el reloj.
12. **Si se desmaya:** con unos 5 fernets cae al piso, la pantalla se pone en negro y se despierta a la mañana siguiente con los operarios limpiando. Cuando el que barre termina de hablarle, aparece el resumen de la noche (Enter para cerrarlo) y puede seguir caminando por el predio vacío.

---

## 6.1 Estética visual

- **Estilo low-poly:** todo el mundo está armado con formas simples (cajas y cilindros). Es una decisión estética y técnica: se lee bien de lejos, es liviano para el navegador y permite caracterizar a los músicos con pocos rasgos reconocibles.
- **Paleta por escenario:** cada escenario tiene su color en la pantalla, los reflectores y el cartel: **rojo** para el escenario que cierra Ciro y los Persas, **ámbar** para el de Las Pastillas del Abuelo y **celeste** para el de Andrés Calamaro. La carpa es **dorada**. Así cada escenario se identifica desde lejos; el indicador del tema que suena y la columna de la grilla toman el mismo color.
- **La carpa:** contrasta con los escenarios grandes por su calidez: lona a rayas rojas y crema, guirnaldas de lamparitas que laten con la música, una bola de espejos cuyos destellos dan vueltas por la carpa, alfombra, telón, velador, amplificadores, plantas y fardos de paja. Afuera, una marquesina con lamparitas anuncia quién toca.
- **Ciclo de luz:** el cielo es un degradé que, siguiendo la hora del festival, va del azul profundo, rosado y naranja del atardecer (18:00) a la noche cerrada (21:00) con 700 estrellas. La niebla toma el color del horizonte para que el predio se funda con el cielo.
- **Resplandor (bloom):** las luces, las pantallas, los fuegos artificiales y las linternas de los celulares tienen un halo de luz, como en las fotos de un recital.
- **Papelitos:** cuando explota un tema conocido, dos cañones de la tarima tiran 350 papelitos de colores que caen despacio sobre el público.
- **La borrachera:** con cada fernet los colores se saturan, las luces brillan más y laten con el bajo, la imagen se ondula y se ve doble, y la cámara se bambolea. Al desmayarse, los párpados se cierran desde arriba y desde abajo.
- **La mañana siguiente:** luz de día sobre un predio vacío, lleno de vasos y papeles tirados, con los operarios de mameluco naranja limpiando.
- **Ambientación del predio:** pasto con tierra pisada donde está el público y caminos entre escenarios (también hacia la carpa); guirnaldas de banderines con lamparitas en la plaza central; un vallado de malla metálica que cierra el predio y un portal en la entrada con el nombre del festival. En la valla de cada escenario cuelgan los trapos de los fans de la banda que toca, que cambian con cada show ("AGUANTE CIRO", "LANÚS PRESENTE", "VILLA CELINA", "URUGUAY PRESENTE", "CÓRDOBA PRESENTE", entre otros).
- **El público:** remeras negras con el nombre de las bandas del festival, banderas argentinas y de dos colores como las de los clubes (de Uruguay en los shows uruguayos) y gente subida a los hombros.
- **Interfaz:** menú de inicio y pausa con tipografía de cartel de festival y degradé de colores; reloj del festival arriba a la izquierda; grilla de horarios con una columna por escenario (y una para la carpa) que marca la banda que está tocando; galería de fotos y resumen de la noche como carteles al centro; y carteles chicos en pantalla para el tema que suena, las acciones activas, el aguante-metro, el pedido del bis, el ladrón y los diálogos.

---

## 6.3 Tipos y diseño de dispositivos de interacción

La interacción usa **teclado y mouse**, con el esquema estándar de los juegos en primera persona para que sea familiar. Las acciones del recital se **mantienen apretadas**, como un gesto sostenido en el cuerpo.

| Dispositivo | Entrada | Acción |
|---|---|---|
| Mouse | Movimiento | Mirar alrededor |
| Mouse | Clic | Entrar al juego, continuar después de la pausa, tomar o comer, sacar una foto |
| Teclado | W A S D o flechas | Caminar |
| Teclado | Shift (mantener) | Correr (también para perseguir al ladrón) |
| Teclado | Espacio | Saltar |
| Teclado | E (mantener) | Levantar los brazos (también sirve para pedir el bis) |
| Teclado | Q (mantener) | Cantar (también sirve para pedir el bis) |
| Teclado | F (mantener) | Pogo (metido entre el público o adentro de una ronda) |
| Teclado | R / C | En la barra: pedir fernet o choripán |
| Teclado | X | Sacar o guardar el celular |
| Teclado | Z | Abrir o cerrar la galería de fotos (← → para cambiar de foto) |
| Teclado | G | Abrir o cerrar la grilla de horarios |
| Teclado | T | Adelantar el reloj hasta que empieza la próxima banda (atajo para la demo) |
| Teclado | V | Cambiar entre primera y tercera persona |
| Teclado | 1 / 2 | Responder que sí o que no cuando la chica pide subirse a los hombros |
| Teclado | B | Bajar a la chica de los hombros |
| Teclado | Enter | Cerrar el resumen de la noche |
| Teclado | Esc o P | Pausa (se detienen la música y el reloj, y el público se congela) |
| Teclado | M | Silenciar o activar el sonido |

---

## 6.4 Diseño sonoro

El sonido es el centro de la experiencia: **es lo que hace que el usuario decida a dónde ir**.

- **Audio posicional:** la música sale del frente de cada escenario. El volumen depende de la distancia y el sonido se ubica a la izquierda o a la derecha según hacia dónde mira el usuario.
- **Tres zonas de volumen:** hasta 20 m del escenario se escucha al 100 %; entre 20 y 78 m baja siguiendo una curva cuadrática (se mantiene fuerte cerca y cae rápido a media distancia); más allá de 78 m hay silencio. Con esto, metido en el público de un escenario, los parlantes de los otros dos quedan a más de 95 m y no se escuchan; en la plaza central los tres parlantes están a unos 74 m y las tres bandas suenan al 13 %, bajito y de fondo.
- **La carpa suena distinto:** su música se escucha completa hasta 14 m y se apaga a los 45 m, porque es un lugar chico. Además, la lona amortigua el sonido: desde afuera, la carpa se escucha apagada (solo pasan los graves, por debajo de 450 Hz) y al 45 % del volumen; desde adentro, lo mismo pasa con los escenarios grandes.
- **Escenario en silencio entre bandas:** cuando una banda de la tarde termina su set (y no hay bis), el escenario queda en silencio hasta el horario de la siguiente, como en un cambio de banda real.
- **Análisis del ritmo en tiempo real:** el audio de cada escenario se analiza mientras suena para detectar los golpes graves (40 a 150 Hz). Esos golpes marcan los saltos del público, el cabeceo de los músicos, los flashes de las luces, las lamparitas de la carpa y el latido de la imagen cuando el usuario está borracho.
- **Los booms del pogo:** para cada tema conocido marcamos los segundos en los que el tema explota, midiendo dónde sube de golpe la energía del mp3. Ahí se arma la ronda.
- **Aplausos sintetizados:** entre tema y tema hay 6 segundos de ovación (palmas, gritos y silbidos) generados por código a partir de ruido, sin archivos de audio. Son más fuertes al terminar un tema conocido. Mientras el público pide el bis, aplaude cada 3 segundos, y explota cuando la banda vuelve.
- **El sonido de la borrachera:** con mucho alcohol todo se escucha un poco "ahogado"; al desmayarse, el sonido se va apagando hasta quedar solo los graves, y vuelve de a poco al despertarse.
- **El celular:** cada foto hace el ruido del obturador, también sintetizado.
- **Pausa y silencio:** con la pausa se detiene la música de todos los escenarios; con M se silencia todo sin pausar.

**Grilla y lista de temas:**

> Nota: se corrigieron cuatro temas tranquilos que no coincidían con los que suenan en el juego (Callejeros, Ciro, No Te Va Gustar y La Vela Puerca). Faltan los mp3 de la carpa y los dos temas de Pepi y Manu están "a definir".

| Escenario | Banda (horario) | Tema | Tipo |
|---|---|---|---|
| Rojo | Guasones (18:00) | Pasan las horas | Tranquilo |
| Rojo | Guasones | Reyes de la noche | Conocido |
| Rojo | Callejeros (19:30) | Canción de cuna | Tranquilo |
| Rojo | Callejeros | Rocanroles sin destino | Conocido |
| Rojo | Ciro y los Persas (21:00) | Astros | Conocido |
| Rojo | Ciro y los Persas | Al atardecer | Tranquilo |
| Ámbar | Turf (18:10) | Loco un poco | Tranquilo |
| Ámbar | Turf | Pasos al costado | Conocido |
| Ámbar | Intoxicados (19:40) | Nunca quise | Tranquilo |
| Ámbar | Intoxicados | Quieren rock | Conocido |
| Ámbar | Las Pastillas del Abuelo (21:10) | Viejo Karma | Conocido |
| Ámbar | Las Pastillas del Abuelo | Me juego el corazón | Tranquilo |
| Celeste | No Te Va Gustar (18:20) | Cielo de un solo color | Tranquilo |
| Celeste | No Te Va Gustar | Chau | Conocido |
| Celeste | La Vela Puerca (19:50) | Mi semilla | Tranquilo |
| Celeste | La Vela Puerca | Zafar | Conocido |
| Celeste | Andrés Calamaro (21:20) | Sin documentos | Conocido |
| Celeste | Andrés Calamaro | Todavía una canción de amor | Tranquilo |
| Celeste | Andrés Calamaro | Buena suerte y hasta luego | Tranquilo |
| La Carpita | Lean Dotta (18:30) | Cómo eran las cosas | Tranquilo |
| La Carpita | Lean Dotta | Superestrella (versión cuarteto) | Conocido |
| La Carpita | Pepi Gabrielli y Manu Viale (19:55) | A definir | Tranquilo |
| La Carpita | Pepi Gabrielli y Manu Viale | A definir | Conocido |
| La Carpita | Colo Giub (21:15) | Señorita (Ricardo Arjona) | Tranquilo |
| La Carpita | Colo Giub | Doctora II (Piti Fernández) | Conocido |

---

## 7. Diseño narrativo del entorno

El predio cuenta su propia historia a través de cómo está organizado:

- **La entrada:** el usuario llega desde afuera, por un pasillo vallado, y entra al predio por un portal con el nombre del festival. Es el umbral entre la vida cotidiana y el festival.
- **Distribución en triángulo:** los tres escenarios están a 80 m del centro y separados 120° entre sí, todos mirando hacia la plaza central. Hay unos 140 m de un escenario a otro: caminando se tarda unos 20 segundos y corriendo la mitad. Esa distancia genera la sensación de predio grande y hace que la elección de escenario tenga un costo.
- **La carpa:** está en una esquina, entre el Escenario Rojo y el Ámbar, a unos 100 m del centro, con la entrada mirando a la plaza y un camino de tierra que lleva hasta ella. Como su sonido no llega lejos, hay que ir a buscarla: es el lugar del descubrimiento, más chico, más cálido y con el público más apretado.
- **El vallado:** el predio es un cuadrado de 240 m de lado cerrado por vallas de malla metálica, como en los festivales reales. Detrás de cada escenario quedan más de 30 m de pasto hasta la valla.
- **La plaza central:** una ronda de tierra con guirnaldas de banderines, rondas de amigos y mantitas con gente sentada. Es el punto de encuentro desde donde se escuchan las tres bandas.
- **Las zonas de público:** la gente está más amontonada cerca de la valla y más dispersa hacia atrás, como en un recital real. El usuario elige si mira desde lejos o se mete adelante. En cada público hay dos lugares donde se abre la ronda del pogo.
- **La barra:** un puesto de fernet y choripán entre la entrada y la plaza central, en el camino de llegada: la primera parada y la pausa entre shows.
- **Las huellas del público:** la tierra pisada frente a cada escenario, los caminos marcados entre ellos y los trapos colgados en la valla, que cambian con cada banda, cuentan que por ahí pasó (y pasa) mucha gente. A la mañana siguiente, los vasos y papeles tirados por todo el predio cuentan que la noche ya pasó.

### 7.1 Interacción (agencia)

Cada acción del usuario tiene una respuesta visible del mundo:

| Acción del usuario | Respuesta del mundo |
|---|---|
| Caminar hacia un escenario o entrar a la carpa | Esa banda sube de volumen y las otras se apagan (o se escuchan apagadas a través de la lona); el indicador muestra la banda y el tema que suena |
| Abrir la grilla (G) | Ve qué banda toca en cada escenario y en la carpa, cuáles ya tocaron y cuál sigue, con la que está tocando marcada |
| Levantar los brazos o cantar | El público cercano (6 m alrededor) se contagia y aumenta su euforia; con un tema conocido el efecto es mayor |
| Hacer pogo entre la gente | La cámara se sacude, el usuario recibe empujones y la gente de alrededor salta hasta 1,6 veces más alto |
| Quedarse adentro de una ronda cuando explota el tema | El pogo lo lleva puesto, aunque no apriete nada |
| Participar (brazos, cantar, saltar, pogo) | El aguante-metro se llena, más rápido con los temas conocidos; si el usuario se queda quieto, se vacía de a poco |
| Llenar el aguante-metro | Aparece "¡AGUANTE!" y el cantante se da vuelta para saludar al usuario |
| Pedir el bis (cantar o levantar los brazos mientras el público pide "¡otra, otra!") | Un porcentaje muestra cuánto falta; a los 3 segundos la banda vuelve, el cartel dice "¡BIS!" y toca de nuevo su tema conocido |
| Responder a la chica (1 / 2) | Con "sí", la chica sube a los hombros del usuario hasta que termina el tema ("¡Desde acá se ve todo!"); con "no", se va |
| Cambiar de vista (V) | El usuario ve su propio cuerpo desde atrás, en el medio del público |
| Pedir en la barra (R / C) y hacer clic | El fernet o el choripán aparece en la mano; cada clic es un trago o un mordisco |
| Tomar fernet | Avisos ("Ya estás contento", "¡Estás re eufórico!", "Todo da vueltas"), la imagen y el sonido cambian, contagia más y llena más rápido el aguante; con unos 5 fernets se desmaya |
| Comer un choripán | Cada mordisco baja la borrachera ("El choripán te asienta…") |
| Desmayarse | Se despierta a las 07:00 con el predio vacío; un operario le habla y aparece el resumen de la noche |
| Sacar el celular (X) y hacer clic | Una foto vertical con la banda que suena y la hora; se ve un flash y suena el obturador. Con Z se ven en la galería |
| Tener el celular afuera mucho tiempo | Aparece un ladrón que se acerca por detrás; si lo guarda a tiempo, se va; si no, se lo roba con todas las fotos |
| Perseguir al ladrón (Shift) | Si lo alcanza antes de que le saque 22 m o pasen 12 segundos, recupera el celular y las fotos; si no, se pierde entre la gente |
| Pausar (Esc / P) | La música y el reloj se detienen y todo el predio se congela hasta volver |

---

## 7.2 Mecánicas de riesgo (sección nueva)

> Nota: es una sección nueva. Si no quieren agregarla, estos párrafos pueden ir al final de la 7.1.

**La borrachera.** Cada fernet tiene 4 tragos, y el alcohol se va bajando solo, a razón de medio fernet por minuto. Con más alcohol el usuario está más eufórico (contagia más al público y llena más rápido el aguante-metro), pero ve y escucha cada vez peor: los colores se saturan, las luces laten con la música, la imagen se ondula y se ve doble, la cámara se bambolea, camina tambaleándose y el sonido se oye ahogado. Con unos 5 fernets se desmaya: se cae, se le cierran los ojos y, con la pantalla en negro, termina el festival. Cada mordisco de choripán baja medio fernet (un choripán entero, un fernet y medio), así que comer es la forma de seguir la noche sin desmayarse.

**El robo del celular.** Mientras el celular está afuera, sube un "riesgo" de 0 a 1. En un lugar tranquilo tarda un minuto en llenarse; entre el público sube 3 veces más rápido, en el pogo 6 veces más, y también más rápido si el usuario está borracho o si es de noche (desde las 20:30). Cada foto suma un poco, porque el flash llama la atención. Con el riesgo en 0,6 aparece el ladrón 14 m detrás del usuario y se acerca caminando, con un aviso en pantalla. Si el usuario guarda el celular a tiempo, el ladrón se va. Si llega, se lo roba y sale corriendo a 8 m/s, zigzagueando entre la gente y con una marca roja sobre la cabeza para no perderlo de vista. El usuario corre a 10 m/s con Shift, así que solo lo alcanza corriendo y si reacciona rápido.

**El resumen de la noche.** Durante toda la partida se anotan las bandas que vio el usuario (las que escuchó de cerca al menos 20 segundos), el tiempo que cantó y que hizo pogo, las veces que lo saludó la banda, los bises que consiguió, las fotos, los fernets y choripanes, y qué pasó con su celular. A la mañana siguiente se muestra todo en un cartel.

---

## 8.2 Módulos del sistema

El código está dividido en módulos, uno por responsabilidad:

| Módulo | Responsabilidad |
|---|---|
| `main.js` | Punto de entrada: arma la escena, los tres escenarios y la carpa con su programación (bandas, horarios y temas), la barra, las vallas y el bucle de animación |
| `escenario.js` | Construye un escenario reutilizable a partir de una configuración (color, posición y bandas) y maneja su programación: qué banda sube, cuándo, y el bis |
| `carpa.js` | La Carpita: la carpa de lona, su escenario chico, sus luces cálidas, la bola de espejos, su decoración y su público. Reutiliza la programación de `escenario.js` |
| `musica.js` | Reproduce el set de la banda que toca con audio posicional, analiza los graves y amortigua el sonido a través de la lona de la carpa |
| `publico.js` | Las 200 personas por escenario (90 en la carpa), con banderas y gente en hombros, y su reacción a la música |
| `ronda.js` | Las rondas de pogo: los rockeros que las abren antes del boom del tema y el pogo cuando explota |
| `papelitos.js` | Los papelitos que vuelan sobre el público cuando explota un tema |
| `remeras.js` | Los estampados de las remeras de bandas que lleva la gente |
| `artistas.js` | Los músicos de las nueve bandas y de la carpa, con su look, sus instrumentos y sus animaciones |
| `luces.js` | El show de luces: barrido de reflectores y flashes con los golpes |
| `pantalla.js` | La pantalla en vivo que filma a la banda |
| `aplausos.js` | La ovación sintetizada al terminar cada tema |
| `fuegos.js` | Los fuegos artificiales al terminar los temas conocidos |
| `bis.js` | El "¡otra, otra!" del público y el usuario pidiendo el bis |
| `grilla.js` | El reloj del festival y la grilla de horarios |
| `cielo.js` | El ciclo del atardecer a la noche (según la hora del reloj), el sol y las estrellas |
| `jugador.js` | Movimiento en primera persona y colisiones |
| `acciones.js` | Brazos, salto, cantar, pogo y contagio al público |
| `aguante.js` | El aguante-metro |
| `chica.js` | La chica que pide subirse a los hombros en los temas tranquilos |
| `terceraPersona.js` | La vista en tercera persona: el cuerpo del jugador y la cámara que lo sigue |
| `barra.js` | El puesto de fernet y choripán, los pedidos y lo que el usuario tiene en la mano |
| `borrachera.js` | Los efectos del alcohol en la imagen, la cámara y el sonido, la euforia y el desmayo |
| `limpieza.js` | Los operarios que limpian y la basura, a la mañana siguiente |
| `celular.js` | El celular en la mano y las fotos |
| `galeria.js` | La galería para ver las fotos |
| `robo.js` | El riesgo de que roben el celular, el ladrón que se acerca y la persecución |
| `ladron.js` | El cuerpo del ladrón y la marca roja de la persecución |
| `resumen.js` | Anota lo que hace el usuario y muestra el resumen de la noche |
| `predio.js` | El piso, los caminos y los banderines |
| `gente.js` | La gente del medio del predio: rondas de amigos y mantitas |
| `vallas.js` | El vallado que cierra el predio, con el hueco de la entrada y su pasillo |
| `portal.js` | El portal de la entrada con el cartel del festival |

**Reutilización:** la función `crearEscenario(config)` arma un escenario completo (estructura, pantalla, valla, música, público, bandas, trapos, luces, aplausos, fuegos y programación) a partir de unos pocos datos. Agregar un escenario, o una banda más a la grilla, es agregar datos a la configuración. La carpa es un buen ejemplo: tiene otro edificio y otras luces, pero reutiliza la programación, la música, el público, los artistas y los trapos, así que se suma a la grilla, al aguante-metro, al bis y al resumen sin cambiar esos módulos.

---

## 8.3 Funcionamiento general

Un **bucle de animación** se ejecuta unas 60 veces por segundo. En cada cuadro:

1. Mueve al jugador y revisa colisiones (tarimas, torres de parlantes, paredes de la carpa, barra, postes, columnas del portal y vallas).
2. Actualiza lo que el usuario tiene en la mano (fernet, choripán o celular), la borrachera y las acciones del jugador con su contagio.
3. Avanza el reloj del festival. Con su hora actualiza el cielo y la programación de cada escenario: si llegó el horario, sube la banda que sigue; si una banda terminó, el público pide el bis.
4. Actualiza la chica, el robo del celular, la gente del medio, la limpieza de la mañana, el resumen de la noche y el pedido del bis.
5. Calcula el volumen de cada banda según la distancia del jugador, y si el sonido tiene que pasar a través de la lona de la carpa.
6. Analiza los graves de cada tema y actualiza el público (y sus rondas), los músicos, las luces y los fuegos.
7. Actualiza el indicador del tema y el aguante-metro (y, si está lleno, el saludo del cantante).
8. Filma la pantalla en vivo del escenario que más se escucha.
9. Actualiza el cuerpo del jugador y la cámara de tercera persona. Si el usuario sacó una foto, dibuja primero el cuadro desde sus ojos y lo guarda. Después dibuja la escena con la cámara de la vista elegida y le aplica el resplandor (bloom) y, si está borracho, el efecto de la borrachera.

Todo el movimiento se calcula con el tiempo real entre cuadros, así funciona igual en una computadora rápida o lenta. Con la pausa, el bucle deja de actualizar el mundo y el reloj, y la música se detiene.

**Cadena de audio de cada escenario:** archivo mp3 → filtro de la lona (solo si hay que escucharlo a través de la carpa) → audio posicional en el frente del escenario → volumen según distancia → oídos del jugador (pegados a la cámara) → filtro de la borrachera. El analizador de graves escucha el mp3 antes de los filtros y del volumen: así el público salta igual aunque el usuario esté lejos o borracho.

---

## 8.4 Decisiones de rendimiento

Para que funcione fluido en una notebook común:

- **Instanciado:** las 690 personas del público (600 en los escenarios y 90 en la carpa), la gente del medio, los estampados de las remeras, los papelitos, la basura de la mañana siguiente y las lamparitas de la carpa se dibujan con `InstancedMesh`, que dibuja muchas figuras iguales casi al costo de una sola.
- **Sin sombras:** ninguna luz proyecta sombras, que es lo más costoso de dibujar.
- **Una sola pantalla filmando:** filmar es volver a dibujar la escena, así que solo se filma la pantalla del escenario que más se escucha; las otras muestran el color de su banda. La imagen filmada es de 512 × 256 píxeles, suficiente vista de lejos.
- **Capas para las dos vistas:** los brazos del jugador solo los dibuja la cámara de primera persona y su cuerpo solo la de tercera persona, así ninguna dibuja de más.
- **Efectos que se apagan solos:** el efecto de la borrachera solo se calcula si el usuario tomó; sobrio, esa pasada no se dibuja.
- **Fotos livianas:** cada foto se guarda achicada (270 × 480 píxeles, en JPG) y se guardan como mucho 30; con más, se borra la más vieja.
- **Resplandor desactivable:** el bloom se puede apagar con una constante si una computadora no lo soporta.

---

## 9.2 Evolución del prototipo (filas nuevas al final de la tabla)

> Nota: la fila del 29/10 ya estaba en la versión anterior; las otras tres son nuevas.

| Fecha | Versión | Qué se agregó |
|---|---|---|
| 29/10 | Grilla y predio | Reloj del festival y grilla de horarios (G); nueve bandas, tres por escenario, cada una con su look, sus trapos y el nombre en el bombo; predio cerrado con vallas, portal y pasillo de entrada; gente en el medio del predio (rondas y mantitas); remeras de bandas, banderas y gente en hombros en el público; la chica que pide subirse a los hombros; vista en tercera persona (V) |
| 06/11 | Pogo y borrachera | Rondas de pogo que se abren antes del boom de cada tema conocido, con papelitos; borrachera con efectos en la imagen, la cámara y el sonido; desmayo y mañana siguiente con los operarios limpiando el predio |
| 09/11 | Celular y robo | Atajo para adelantar el reloj (T); celular con fotos y galería (X / Z); el ladrón que se acerca si el celular está mucho tiempo afuera |
| 10/11 | La Carpita y cierre de la noche | La Carpita, con tres artistas, luces cálidas y sonido amortiguado por la lona; persecución del ladrón para recuperar el celular; el bis; el choripán que baja la borrachera; el resumen de la noche |

---

## 9.3 Iteraciones y aprendizajes

> Nota: los ítems del 29/10 para atrás ya estaban. Los últimos cuatro salieron de las pruebas que hicimos mientras desarrollábamos la carpa, la persecución y el resumen. Revisen que el motivo sea el que ustedes tuvieron y corríjanlo si no.

Las pruebas internas del equipo llevaron a varios cambios:

- **El sonido no se apagaba:** al alejarse mucho del escenario la música se seguía escuchando. Se pasó a un modelo con distancia máxima de silencio.
- **Demasiada mezcla en el centro:** con los tres escenarios, en la plaza central las tres bandas sonaban al 42 % cada una y se armaba ruido. Se separaron los escenarios (de 110 a 170 m) y se cambió a una curva de volumen cuadrática; en esa versión pasaron a sonar al 12 %, de fondo.
- **La pausa no frenaba nada:** la primera versión solo bajaba el volumen. Se implementó una pausa real que detiene la música y congela el predio.
- **Faltaba un objetivo:** recorrer y mirar no alcanzaba para sentir agencia. Se agregó el aguante-metro y la respuesta del cantante.
- **El tiempo no estaba conectado con los shows:** el cielo pasaba del atardecer a la noche en 3 minutos, sin relación con lo que pasaba en los escenarios. Se agregó un reloj del festival y una grilla: el cielo y la llegada de cada banda siguen la misma hora.
- **Predio cerrado:** al agregar las vallas y la entrada, se acercaron los escenarios al centro (de 98 a 80 m) y se ajustó la distancia de silencio (de 97 a 78 m) para conservar el mismo equilibrio: frente a un escenario se escucha solo esa banda y en el centro las tres suenan al 13 %.
- **Las luces de la carpa quemaban la imagen:** con el resplandor, el cartel, el techo, las lentejuelas de Lean Dotta y la cara del Colo se veían blancos. Se bajaron las intensidades y se apuntaron los focos al cuerpo de los músicos.
- **El cartel del robo tapaba al ladrón:** el aviso estaba en el centro de la pantalla, justo donde mirás para perseguirlo. Se movió arriba y se agrandó la marca roja.
- **La persecución tenía que ser posible pero no regalada:** simulamos distintos tiempos de reacción. Con el ladrón a 8 m/s y el usuario a 10 m/s, si reacciona en menos de 2,5 segundos lo alcanza; si tarda 3 o no corre, lo pierde. También le dimos al ladrón 0,6 segundos de ventaja: como roba al lado del usuario, si no lo "atrapaba" en el mismo instante del robo.
- **Las bandas sin mp3 no contaban en el resumen:** al principio una banda contaba como "vista" solo si su audio sonaba, y a los temas de la carpa todavía les faltan los mp3. Se cambió para que cuente mientras la banda está tocando su set.

**De la proyección al prototipo.** Al inicio del proyecto proyectamos una versión más ambiciosa. Al construir, recortamos y cambiamos varias decisiones para enfocarnos en la mecánica central:

| Proyección inicial | Prototipo | Por qué |
|---|---|---|
| Grilla horaria de 14 a 02 h, en 60 minutos reales | Grilla de 18:00 a 21:00 más las bandas principales desde las 21:00, con un reloj 10 veces más rápido (18 minutos de juego hasta la noche) | Permite vivir el paso de la tarde a la noche y la sucesión de bandas en una prueba de duración razonable |
| 5 escenarios y 25 bandas | 3 escenarios y una carpa, con 12 artistas | Foco en la mecánica central: elegir por el sonido y participar. La carpa suma un espacio distinto sin multiplicar el trabajo |
| Bandas y música originales | Bandas reales del rock argentino y uruguayo | Los temas conocidos generan la reacción emocional que queríamos probar |
| PC con extensión a realidad virtual | Navegador web | Se prueba en cualquier computadora y se comparte con un link |
| Sin condición de victoria | Aguante-metro como objetivo, consecuencias (desmayo, robo) y un resumen al final | Da propósito, hace visible la agencia y le da un cierre a la noche |

---

## 9.5 Trailer (solo la última fila de la tabla)

| Tiempo | Imagen | Sonido / texto |
|---|---|---|
| 36–45 s | Vista general de los tres escenarios encendidos | Texto: "Salve Salve Rockanrol. El festival que armás vos." |

> Nota: como ahora el usuario arranca en la entrada, la toma de 0–5 s podría ser el pasillo vallado con el portal y el predio al atardecer detrás. También se podrían sumar tomas de la ronda explotando con papelitos, la carpa por dentro y la persecución del ladrón. Lo vemos cuando trabajemos el trailer.

---

## 10. Conclusión (solo el segundo párrafo)

El principal aprendizaje del proceso fue que la proyección inicial era más grande de lo que podíamos construir y probar bien. Recortar a tres escenarios y enfocarnos en la mecánica central nos permitió llegar a algo que funciona y transmite la experiencia; sobre esa base pudimos sumar después una grilla horaria con nueve bandas, una carpa con artistas de nicho y los rituales que hacen que una noche de festival sea única (el pogo, el bis, el fernet de más, cuidar el celular), que devolvieron al prototipo buena parte de la idea original. Como trabajo futuro quedan las pruebas con usuarios, más escenarios y bandas, compañeros virtuales y la versión en realidad virtual.

---

## 12. Anexos (solo el ítem "Cómo ejecutar el prototipo")

- **Cómo ejecutar el prototipo:** instalar Node.js, ejecutar `npm install` y `npm run dev`, y abrir la dirección que muestra la consola. Los audios ya están en el repositorio, en `public/audio` (la lista de archivos está en el README). Si falta algún mp3, el simulador funciona igual, pero esa banda toca en silencio.
