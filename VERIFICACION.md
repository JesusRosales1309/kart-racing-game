# Pradera Kart — mejoras gráficas v2

Copia independiente de `~/three-kart-racing`. Abrir `index.html` en un navegador con WebGL 2 y conexión a Internet para cargar Three.js 0.180.0 desde los mismos CDN del original.

## Cambios

- Terreno continuo con variaciones de pasto, hombros de tierra y colinas fuera del área de conducción. La pista original es plana y conserva su altura y recorrido.
- Asfalto continuo con textura procedural de 128 × 128, líneas laterales, curbs rojo/blanco en curvas y meta a cuadros con letrero.
- Luz hemisférica, sol cálido, cielo degradado y niebla suave. Sombras locales alrededor del jugador: 1024 × 1024 en escritorio y 512 × 512 en móvil. Resolución móvil limitada a DPR 1.
- Árboles, rocas, vallas y montañas con InstancedMesh; señales de curva. Los obstáculos originales conservan posiciones y radios. Los nuevos adornos no añaden colisiones.
- Ruedas con neumáticos, rines y radios, rotación sobre el eje correcto, dirección delantera y balanceo del chasis. La animación no modifica la física y las ruedas se detienen al pausar.
- No se añadieron dependencias ni descargas de imágenes.

## Comprobaciones realizadas

- Sintaxis de ambos scripts validada con el motor JavaScript V8.
- Comparación exacta con el original: simulación, controles de teclado/táctil/gamepad, HUD, reinicio, pausa y manejo del viewport permanecen idénticos.
- Simulación ejecutada: cuenta regresiva, aceleración, pausa, turbo y carrera con piloto automático de prueba completando las tres vueltas y registrando parciales; estados numéricos finitos.
- Geometría de carretera: 384 triángulos, ancho de 15 unidades, caras orientadas hacia arriba. Prueba matemática ejecutada con objetos mínimos que almacenan los datos de geometría, sin renderizar Three.js.
- Animación: giro de ruedas, orientación delantera, ruedas traseras rectas y pausa. Prueba de la función de animación con objetos mínimos, sin renderizar Three.js.
- `git diff --check` sin errores.
- SHA-256 del archivo original antes y después: `96bf452f1db0ec69fbc893a43106af38976d901ebe3fcc8eeb12b531772a26ad`.

## Validación pendiente en dispositivos

No fue posible realizar una prueba gráfica en este entorno: las restricciones impiden arrancar Chrome/Firefox y resolver el CDN. No se han medido FPS ni validado shaders en GPU, Safari o un iPhone físico. Las comprobaciones anteriores no sustituyen esa prueba.

En PC: iniciar carrera, acelerar/girar/frenar/reversa, derrapar, usar objetos, pausar/reanudar y reiniciar; comprobar un mando conectado y completar tres vueltas. Revisar consola y continuidad del terreno, sombras, curbs y ruedas.

En iPhone: repetir con dos dedos sobre acelerador y dirección, probar derrape/objeto, rotar entre vertical y horizontal y volver a la app tras ponerla en segundo plano. Comprobar fluidez y que los botones no se queden pulsados.

No se ejecutó git push.

## Actualización: cinco vehículos y selector

Se añadió el sistema modular de vehículos y el showroom. El bloque de simulación sigue idéntico; los manejadores de entrada ahora distinguen showroom/carrera. Por tanto, la comparación exacta de controles indicada arriba corresponde a la etapa gráfica anterior, no a estos nuevos manejadores. Detalles y pruebas actuales: `VEHICULOS.md` y `tests/run.mjs`.

## Actualización: circuito Sierra Pradera

El óvalo fue sustituido por un circuito de 14 curvas con elevación. Cambiaron trazado, checkpoints, spawn, seguimiento de IA y adaptación visual al terreno. La prueba de conservación actual compara las ecuaciones de conducción, excluyendo los nuevos límites del mapa. Resultados y limitaciones vigentes: `CIRCUITO.md`.
