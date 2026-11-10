# Fuentes de los diagramas 1 a 4

Cada diagrama es una página HTML. Para regenerar el PNG después de cambiar algo, desde esta carpeta (en Mac, con Chrome instalado):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=2000 --force-device-scale-factor=2 --window-size=1240,1000 --screenshot=../1-plano-del-predio.png "file://$PWD/1-plano.html"
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=2000 --force-device-scale-factor=2 --window-size=1500,1040 --screenshot=../2-mapa-conceptual.png "file://$PWD/2-mapa-conceptual.html"
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=2000 --force-device-scale-factor=2 --window-size=1240,1540 --screenshot=../3-flujo-de-la-experiencia.png "file://$PWD/3-flujo.html"
"$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=2000 --force-device-scale-factor=2 --window-size=1640,1190 --screenshot=../4-arquitectura-tecnica.png "file://$PWD/4-arquitectura.html"
```

Si una página crece (más cajas o más texto), hay que agrandar el alto de `--window-size`. También se pueden abrir en el navegador para verlas.
