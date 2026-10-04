# Sierra Pradera: circuito y rivales

## Circuito

`track.js` es la única fuente del trazado: 14 curvas diseñadas, suavizadas y remuestreadas en 640 puntos 3D equidistantes. Longitud aproximada: 1.004 unidades. Ancho: 13 (antes 15). El plano está en `tests/track-layout.svg` / `tests/track-layout.png`.

La meta está en la recta norte. En sentido de carrera: recta de salida; curvas 1–2 de radio medio; S rápida 3–4; subida a las curvas 4–5; giro en cresta 5–6; horquilla compuesta 7–8; bajada y recta corta hacia 9; curva larga 9–10 para derrapar; regreso por 11–14 a la recta final. Los números del plano cuentan cada cambio de dirección diseñado, incluidos ambos giros de la horquilla.

Alturas del centro: −1,70 a +15,61; desnivel de 17,30 unidades. Pendiente longitudinal máxima aproximada: 20,3 %, sin saltos ni escalones. Terreno, asfalto, karts, objetos, boosts, curbs, árboles y señales usan el mismo campo suave de elevación. Los coches siguen la inclinación longitudinal y transversal local; no se añadió física de saltos ni un peralte artificial independiente.

El terreno termina bajo los hombros de tierra con faldones laterales. Curbs en curvas de mayor curvatura y tramos cortos de guardarraíl exterior con postes de colisión; el resto mantiene escapatorias abiertas. Árboles y rocas se recolocan fuera del asfalto. Los boosts quedan en rectas y la curva amplia, lejos de entradas cerradas.

La cámara conserva distancia, seguimiento y suavizado. Ahora sigue la altura del coche y comprueba altura del terreno tanto en su posición como a lo largo de la línea de visión.

## IA y vehículos

`createVehicle(type, variant)` en `vehicles.js` sirve a showroom y rivales. Los tres rivales usan los tres diseños siguientes al elegido por el jugador, recorriendo circularmente los cinco modelos. No se repiten diseños entre los cuatro participantes. Si el jugador elige Junkyard, los rivales serán Cyber, Buggy y Muscle. Al elegir otros modelos también aparecen Galactic y Junkyard como rivales.

Cada diseño rival recibe una variante temática de pintura; los materiales se reutilizan y no alteran el original del showroom. Se conservan estadísticas, colisiones del kart y ecuaciones de aceleración, frenado, grip, derrape y turbo. Las ruedas de IA usan el mismo sistema de animación y radio que las del jugador.

La IA conserva el seguimiento hacia un punto adelantado y su límite de 29 unidades/s. La anticipación ahora se mide en distancia, examina curvatura hasta 38 unidades por delante y frena antes de curvas fuertes; en las más cerradas el objetivo puede bajar a 10. Retrasa el uso voluntario de turbo hasta una zona rápida. Estos cambios dependen de la pista, nunca del modelo de coche.

## Vueltas y minimapa

Se mantienen tres vueltas, ahora con 48 checkpoints secuenciales equidistantes. Meta, parrilla, heading inicial y minimapa salen del mismo recorrido. Pasar por meta sin los checkpoints, saltarlos o cruzarlos hacia atrás no añade una vuelta. El minimapa adapta la escala a los nuevos límites e incluye la meta real.

## Pruebas

Repetibles con Node 18+ sin npm: `node tests/run.mjs`. En este entorno se ejecutaron los mismos scripts y arneses mediante V8, porque no está instalado Node.

- Sintaxis de todos los scripts y `git diff --check`: correctos.
- Ecuaciones de conducción comparadas con la base: idénticas, salvo los límites exteriores del nuevo mapa.
- Cinco elecciones, teclado/click/gamepad/táctil simulados, debounce, inicio, pausa/reanudación, reinicio, cambio de coche, HUD y animación: correctos en configuraciones escritorio y móvil.
- Todos los rivales completan tres vueltas con la escenografía/obstáculos activos. Prueba adicional con 12 semillas de objetos: 36 rivales terminaron, sin cuadros fuera del asfalto.
- Jugador de prueba usando las entradas normales y piloto automático: completa tres vueltas y registra parciales.
- Checkpoints: secuencia completa, meta sin vuelta completa, saltos y marcha atrás verificados.
- Triángulos del asfalto orientados hacia arriba; sin cruces ni solapamientos entre tramos. Separación mínima medida entre tramos no adyacentes: 30,66 unidades.
- Cámara probada numéricamente en 1.000 posiciones: separación mínima de la línea de visión al terreno de aproximadamente 1,09 unidades.

El arnés de integración usa dobles de DOM/Three.js; no sustituye una prueba gráfica. Chrome sigue sin arrancar bajo las restricciones del entorno (`setsockopt: Operation not permitted`, salida 133). Quedan pendientes validación GPU, prueba manual de dificultad, FPS y Safari/iPhone físico. El plano es un diagrama del recorrido, no una captura de WebGL.

No se modificó `~/three-kart-racing`, no hubo push ni publicación.
