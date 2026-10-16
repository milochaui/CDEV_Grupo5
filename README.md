# Simulador de Festival

Trabajo final de la materia **Creatividad y Desarrollo en Entornos Virtuales** — UTN FRC.

Simulador 3D en primera persona de un festival de música con tres escenarios, hecho con Three.js. El jugador recorre el predio y, a medida que se acerca a cada escenario, escucha la música de la banda que toca ahí: el sonido es posicional, así que cerca de un escenario se escucha fuerte y desde el centro del predio las bandas suenan de fondo. Frente a cada escenario hay público que reacciona al tema y salta con los graves, con más fuerza en los temas más conocidos.

Escenarios:

- **Ciro y los Persas**
- **Las Pastillas del Abuelo**
- **Andrés Calamaro**

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

> **Antes de correrlo, copiar los audios** (ver la sección siguiente). Sin los mp3 el simulador abre, pero los escenarios no suenan.

## Audios (importante)

Los archivos mp3 **no están en el repositorio**: la carpeta `public/audio` está en el `.gitignore`. Hay que copiarlos a mano en `public/audio/`, con **exactamente** estos nombres de archivo (son los que usa `src/main.js`):

| Escenario | Archivo | Tema |
|---|---|---|
| Ciro y los Persas | `ciro_conocido_astros.mp3` | Astros |
| Ciro y los Persas | `ciro_tranqui_servidor.mp3` | Servidor |
| Las Pastillas del Abuelo | `pastillas_conocido_viejokarma.mp3` | Viejo Karma |
| Las Pastillas del Abuelo | `pastillas_tranqui_mejuegoelcorazon.mp3` | Me juego el corazón |
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
    ├── ciro_conocido_astros.mp3
    ├── ciro_tranqui_servidor.mp3
    ├── pastillas_conocido_viejokarma.mp3
    └── pastillas_tranqui_mejuegoelcorazon.mp3
```

## Controles

| Tecla | Acción |
|---|---|
| Mouse | Mirar alrededor |
| W A S D o flechas | Caminar |
| Shift (mantener) | Correr |
| Esc o P | Pausa (se detiene la música y el público se congela) |
| M | Silenciar / activar el sonido |
| Clic | Entrar al juego / continuar después de la pausa |

## Estructura del código

- `index.html`: página, cartel de inicio/pausa e indicadores en pantalla.
- `src/main.js`: arma la escena, los tres escenarios con sus listas de temas y las teclas de pausa y silencio.
- `src/escenario.js`: construcción de cada escenario.
- `src/musica.js`: reproducción de los temas con sonido posicional.
- `src/publico.js`: el público frente a cada escenario y su reacción a la música.
- `src/jugador.js`: control en primera persona y colisiones.
