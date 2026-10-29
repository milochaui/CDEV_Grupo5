# Simulador de Festival

Trabajo final de la materia **Creatividad y Desarrollo en Entornos Virtuales** — UTN FRC.

Simulador 3D en primera persona de un festival de música con tres escenarios, hecho con Three.js. El jugador recorre el predio y, a medida que se acerca a cada escenario, escucha la música de la banda que toca ahí: el sonido es posicional, así que cerca de un escenario se escucha fuerte y desde el centro del predio las bandas suenan de fondo. Frente a cada escenario hay público que reacciona al tema y salta con los graves, con más fuerza en los temas más conocidos. Mucha gente lleva remeras de las bandas del festival, y entre el público hay quienes ondean banderas y otros subidos a los hombros de alguien. En el medio del predio hay rondas de amigos y gente sentada en mantitas, y todo el predio está cerrado por vallas. El jugador arranca afuera, en la entrada, frente al portal con el cartel del festival: **Salve Salve Rockanrol**. Si estás metido entre el público cuando empieza un tema tranqui, una chica te pide que la subas a tus hombros y podés decirle que sí o que no. Con la tecla V se pasa a una vista en tercera persona, donde se ve el cuerpo del jugador (y a la chica, si la subiste).

Arriba de cada escenario toca la banda, con show de luces, pantalla en vivo y fuegos artificiales al terminar los temas conocidos. El público aplaude al final de cada tema y prende la linterna del celular en los temas tranquis. El cielo pasa del atardecer a la noche, y hay una barra de fernet y choripán. Cuanto más participa el jugador cerca de un escenario, más se llena el aguante-metro; lleno, el cantante lo saluda.

Arriba a la izquierda hay un reloj con la hora del festival, y con la tecla G se abre la grilla con los horarios de cada escenario. El festival arranca a las 17:58 y el reloj corre 10 veces más rápido que el tiempo real (las 3 horas de la tarde duran 18 minutos de juego). En cada escenario tocan tres bandas, una después de la otra: cada una sube cuando llega su horario, toca un tema tranqui y uno para el pogo, y se baja. Entre banda y banda el cartel anuncia a la que sigue. A las 21:00, ya de noche, suben las bandas principales, que tocan sin parar. Cada banda tiene su look arriba del escenario, el nombre en el bombo, los trapos de sus fans en la valla y, las uruguayas, banderas de Uruguay en el público.

Programación:

| Hora | Escenario Rojo | Escenario Ámbar | Escenario Celeste |
|---|---|---|---|
| Tarde | Guasones (18:00) | Turf (18:10) | No Te Va Gustar (18:20) |
| Atardecer | Callejeros (19:30) | Intoxicados (19:40) | La Vela Puerca (19:50) |
| Noche | **Ciro y los Persas** (21:00) | **Las Pastillas del Abuelo** (21:10) | **Andrés Calamaro** (21:20) |

En el show de Callejeros no hay fuegos artificiales, por respeto a las víctimas de Cromañón.

## Tecnología

- [Vite](https://vite.dev/) + JavaScript
- [Three.js](https://threejs.org/)
- Corre en el navegador

## Instalación y ejecución

Hace falta tener [Node.js](https://nodejs.org/) instalado.

```bash
npm install
npm run dev
```

Después abrir en el navegador la dirección que muestra la consola (normalmente http://localhost:5173) y hacer clic en la pantalla para entrar.

> **Antes de correrlo, copiar los audios** (ver la sección siguiente). Sin los mp3 el simulador abre y las bandas suben igual a su horario, pero tocan en silencio (el cartel del tema dice "falta el mp3").

## Audios (importante)

Los archivos mp3 **no están en el repositorio**: la carpeta `public/audio` está en el `.gitignore`. Hay que copiarlos a mano en `public/audio/`, con **exactamente** estos nombres de archivo (son los que usa `src/main.js`):

| Banda | Archivo | Tema |
|---|---|---|
| Guasones | `guasones_tranqui_pasanlashoras.mp3` | Pasan las horas |
| Guasones | `guasones_conocido_reyesdelanoche.mp3` | Reyes de la noche |
| Callejeros | `callejeros_tranqui_unanuevanochefria.mp3` | Una nueva noche fría |
| Callejeros | `callejeros_conocido_rocanrolessindestino.mp3` | Rocanroles sin destino |
| Ciro y los Persas | `ciro_conocido_astros.mp3` | Astros |
| Ciro y los Persas | `ciro_tranqui_servidor.mp3` | Servidor |
| Turf | `turf_tranqui_locounpoco.mp3` | Loco un poco |
| Turf | `turf_conocido_pasosalcostado.mp3` | Pasos al costado |
| Intoxicados | `intoxicados_tranqui_nuncaquise.mp3` | Nunca quise |
| Intoxicados | `intoxicados_conocido_quierenrock.mp3` | Quieren rock |
| Las Pastillas del Abuelo | `pastillas_conocido_viejokarma.mp3` | Viejo Karma |
| Las Pastillas del Abuelo | `pastillas_tranqui_mejuegoelcorazon.mp3` | Me juego el corazón |
| No Te Va Gustar | `ntvg_tranqui_alasnueve.mp3` | A las nueve |
| No Te Va Gustar | `ntvg_conocido_chau.mp3` | Chau |
| La Vela Puerca | `velapuerca_tranqui_llenosdemagia.mp3` | Llenos de magia |
| La Vela Puerca | `velapuerca_conocido_zafar.mp3` | Zafar |
| Andrés Calamaro | `calamaro_conocido_sindocumentos.mp3` | Sin documentos |
| Andrés Calamaro | `calamaro_medio_todaviaunacanciondeamor.mp3` | Todavía una canción de amor |
| Andrés Calamaro | `calamaro_tranqui_buenasuerteyhastaluego.mp3` | Buena suerte y hasta luego |

La carpeta tiene que quedar así:

```
public/
└── audio/
    ├── calamaro_conocido_sindocumentos.mp3
    ├── calamaro_medio_todaviaunacanciondeamor.mp3
    ├── calamaro_tranqui_buenasuerteyhastaluego.mp3
    ├── callejeros_conocido_rocanrolessindestino.mp3
    ├── callejeros_tranqui_unanuevanochefria.mp3
    ├── ciro_conocido_astros.mp3
    ├── ciro_tranqui_servidor.mp3
    ├── guasones_conocido_reyesdelanoche.mp3
    ├── guasones_tranqui_pasanlashoras.mp3
    ├── intoxicados_conocido_quierenrock.mp3
    ├── intoxicados_tranqui_nuncaquise.mp3
    ├── ntvg_conocido_chau.mp3
    ├── ntvg_tranqui_alasnueve.mp3
    ├── pastillas_conocido_viejokarma.mp3
    ├── pastillas_tranqui_mejuegoelcorazon.mp3
    ├── turf_conocido_pasosalcostado.mp3
    ├── turf_tranqui_locounpoco.mp3
    ├── velapuerca_conocido_zafar.mp3
    └── velapuerca_tranqui_llenosdemagia.mp3
```

## Controles

| Tecla | Acción |
|---|---|
| Mouse | Mirar alrededor |
| W A S D o flechas | Caminar |
| Shift (mantener) | Correr |
| Espacio | Saltar |
| E (mantener) | Levantar los brazos |
| Q (mantener) | Cantar |
| F (mantener) | Pogo (solo metido entre el público) |
| R / C (frente a la barra) | Pedir un fernet / un choripán |
| Clic (con algo en la mano) | Tomar un trago / dar un mordisco |
| G | Abrir / cerrar la grilla de horarios |
| V | Cambiar entre primera y tercera persona |
| 1 / 2 | Responder que sí / que no (cuando la chica pide subirse a los hombros) |
| Esc o P | Pausa (se detiene la música y el público se congela) |
| M | Silenciar / activar el sonido |
| Clic | Entrar al juego / continuar después de la pausa |

## Estructura del código

- `index.html`: página, cartel de inicio/pausa e indicadores en pantalla.
- `src/main.js`: arma la escena, los tres escenarios con su programación (bandas, horarios y temas) y las teclas de pausa y silencio.
- `src/escenario.js`: construcción de cada escenario y su programación (qué banda sube y cuándo).
- `src/musica.js`: reproducción del set de cada banda con sonido posicional.
- `src/publico.js`: el público frente a cada escenario y su reacción a la música.
- `src/jugador.js`: control en primera persona y colisiones.
- `src/acciones.js`: acciones del recital (brazos en primera persona, salto, cantar y pogo) y su contagio al público.
- `src/artistas.js`: los músicos de las nueve bandas, cada uno con su look y sus instrumentos.
- `src/luces.js`: show de luces de cada escenario, al ritmo de la música.
- `src/pantalla.js`: pantalla en vivo que filma a la banda.
- `src/fuegos.js`: fuegos artificiales al terminar los temas conocidos.
- `src/aplausos.js`: aplausos y gritos sintetizados al terminar cada tema.
- `src/cielo.js`: cielo del atardecer a la noche (sigue la hora del reloj), con sol y estrellas.
- `src/predio.js`: piso del predio (pasto, tierra pisada y caminos) y guirnaldas de banderines.
- `src/barra.js`: barra de fernet y choripán.
- `src/aguante.js`: el aguante-metro.
- `src/grilla.js`: reloj del festival y grilla de horarios.
- `src/chica.js`: la chica que pide subirse a los hombros durante los temas tranquis.
- `src/gente.js`: la gente del medio del predio (rondas de gente parada y mantitas con gente sentada).
- `src/vallas.js`: el vallado que cierra el predio, con el hueco de la entrada y su pasillo.
- `src/portal.js`: el portal de la entrada, con el cartel del festival.
- `src/terceraPersona.js`: la vista en tercera persona (el cuerpo del jugador y la cámara que lo sigue).
- `src/remeras.js`: los estampados de las remeras de bandas que lleva la gente.
