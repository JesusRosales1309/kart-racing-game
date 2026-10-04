# Efectos y sonido

## Efectos

`effects.js` añade polvo marrón/gris fuera del asfalto, humo gris creciente en las ruedas traseras durante el derrape del jugador, chispas breves en impactos aceptados a velocidad superior a 4, estela cyan de turbo y líneas de velocidad en los bordes de la cámara. El FOV sube suavemente de 62° a 67° con turbo y vuelve al valor original.

El polvo de los rivales tiene una frecuencia menor. La frecuencia de humo aumenta moderadamente con `car.drift`. Las chispas reaccionan al sistema `race.hit`, que ya reconoce obstáculos, proyectiles y trampas. No se añadieron colisiones entre coches: el juego no tenía ese sistema.

Un único `THREE.Points` reutiliza arrays y 64 plazas en móvil / 96 en escritorio. Al llenarse, descarta nuevas emisiones; nunca amplía el pool. Duración: 0,22–0,65 segundos. Cada plaza almacena posición, velocidad, tamaño, crecimiento, vida y opacidad. No carga texturas, crea meshes por emisión ni calcula sombras de partículas.

Las líneas usan un `LineSegments` con 8 segmentos móviles / 12 de escritorio, sin tapar el centro de la vista. Se apagan al bajar de velocidad. Reiniciar o volver al showroom vacía el pool y restaura el FOV.

## Audio procedural

`audio.js` genera todos los sonidos, sin archivos externos:

- Motor: dos osciladores continuos filtrados; frecuencia y ganancia según velocidad/acelerador.
- Derrape: ruido en loop filtrado; volumen según intensidad, con entrada/salida suave.
- Turbo: tono ascendente y ruido breve.
- Impacto: ruido y tono grave; cooldown de 0,45 s más la inmunidad existente del juego.
- Checkpoints importantes: tono discreto cada ocho puertas (seis sectores por vuelta).
- Vuelta: tres notas; llegada: secuencia final de cuatro notas. En la última vuelta se prioriza la secuencia final para no superponer ambas.

El observador de eventos no modifica la conducción ni sus estadísticas. Usa los impactos aceptados, cambios reales de boost, checkpoints, vueltas y llegada. La pausa silencia loops y cancela sonidos breves. Volver al selector/reiniciar limpia eventos pendientes; ocultar la página o salir de ella también suspende el contexto.

Volúmenes centrales en `RaceAudioSettings`: `masterVolume .45`, `engineVolume .18`, `effectsVolume .32`.

## Autoplay e iPhone

No se construye AudioContext al cargar. Un `pointerdown` o `keydown` del usuario llama síncronamente a `unlock()` y `resume()`. Los loops permanecen a volumen cero hasta la carrera. No se crea un contexto por frame ni se intenta reproducir eventos anteriores al desbloqueo.

Un botón A de gamepad leído mediante polling no siempre cuenta como gesto autorizado para Web Audio. Si hace falta, se muestra **ACTIVAR SONIDO** para desbloquearlo mediante click/toque. También sirve tras una suspensión de Safari. Si Web Audio no está disponible, el juego continúa sin audio.

## Sustituir por grabaciones

Carpeta: `assets/audio/`. Consultar `assets/audio/README.md`: identifica los puntos `init()`, `update()` y `play(event)` para sustituir generadores por AudioBuffers. Añadir archivos por sí solo no los activa. No se descargó contenido ni se añadieron dependencias.

## Coste aproximado

- Hasta dos llamadas de dibujo adicionales: una para partículas y otra para líneas visibles.
- Bucle de actualización acotado a 64/96 plazas y 8/12 líneas; arrays pequeños, del orden de 10 KB o menos, más objetos/materiales de Three.js.
- Audio continuo: dos osciladores y una fuente de ruido en loop. Un buffer mono de ruido de un segundo ocupa aproximadamente 176–192 KB según frecuencia de muestreo.
- Sonidos breves: máximo 12 voces, con desconexión de nodos al finalizar. Sin reverberación, convolución, bloom ni motion blur.

Es una estimación estructural, no una medición de FPS o consumo en iPhone.

## Comprobaciones

`node tests/run.mjs` incluye `tests/feedback-checks.js`. En este entorno se ejecutaron los mismos scripts mediante V8 con dobles de Three/DOM/Web Audio, porque Node no está instalado.

Pasaron: generación/expiración y saturación del pool, humo creciente, chispas, FOV y líneas, ausencia de AudioContext al cargar, desbloqueo, pitch de motor, reutilización de nodos continuos, programación de los cinco sonidos breves, cooldown de impacto, límite/limpieza de voces y eventos sin duplicación. También pasaron las pruebas existentes de cinco vehículos, controles simulados, IA completando vueltas, selector, HUD y cámara.

No fue posible ejecutar Chrome: el entorno bloquea su arranque (`setsockopt: Operation not permitted`, salida 133). Por tanto, no se validaron shaders/consola WebGL, calidad acústica real, rendimiento medido ni Safari/iPhone físico. Para la prueba manual: iniciar con click/toque, acelerar y cambiar carga, salir al césped, derrapar, activar turbo, golpear una barrera, pasar sectores/completar vueltas, terminar, pausar/reanudar y alternar apps en iPhone.

El proyecto original permanece intacto. No se hizo git push ni publicación.
