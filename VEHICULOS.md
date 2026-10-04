# Vehículos y showroom

Abrir `index.html` con acceso a Internet (Three.js 0.180.0 conserva los CDN originales). Los archivos nuevos usan rutas relativas y scripts clásicos: funcionan con hosting estático, incluido GitHub Pages, sin build ni npm. No se publicó el proyecto.

## Referencias inspeccionadas

Todos los archivos PNG de `references/` se revisaron antes de programar:

| Hora del archivo | Referencia |
| --- | --- |
| 04_35_14 | Galactic Rocket Kart |
| 04_35_21 | Junkyard Racer |
| 04_35_28 | Desert Rally Buggy |
| 04_35_34 | Retro Muscle Mini |
| 04_35_41 | Copia idéntica de la referencia Galactic |

No había imagen cyber. Neon Cyber Racer sigue la descripción solicitada. Las referencias no se cargan en el juego, no son sprites ni texturas.

## Modelos y arquitectura

`createVehicleLibrary(THREE)` en `vehicles.js` expone cinco fábricas que devuelven `THREE.Group`:

- `createJunkyardKart()`: carro ancho con paneles naranja/azul/metal, tornillos, desgaste geométrico, motor y admisión abiertos, escapes y alerón asimétrico.
- `createCyberKart()`: cuña baja blanca/negra, cabina aerodinámica, entradas laterales, difusor y alerón ancho; cyan/magenta emissive sin postprocesado.
- `createDesertBuggy()`: ruedas con tacos, carrocería alta, dos asientos, jaula tubular abierta, suspensión visible, cuatro focos superiores, defensas y repuesto trasero.
- `createRetroMuscleKart()`: capó largo, cabina trapezoidal, rojo con franjas blancas geométricas, toma de aire, parrilla, ruedas traseras anchas, alerón pequeño y escapes dobles.
- `createGalacticKart()`: cuerpo redondeado, asiento abierto, parabrisas estilizado, propulsores dobles, aletas moradas, detalles dorados y estrellas extruidas pequeñas.

Cada raíz tiene `userData.parts`: `body`, `cabin`, `frontLeftWheel`, `frontRightWheel`, `rearLeftWheel`, `rearRightWheel` y grupos de equipamiento según el modelo (`engine`, `spoiler`, `rollCage`, `suspension`, `rockets`, etc.). También están nombrados en la jerarquía. Cada rueda tiene un grupo `spin` dentro de su pivote de dirección.

`userData.rig` conecta con `animateKart()`: las ruedas usan su radio propio, las delanteras orientan el pivote y el chasis conserva su balanceo. Ningún modelo modifica objetos de física ni estadísticas. Los rivales conservan sus modelos y lógica anteriores.

Geometrías base y materiales se comparten. `finish()` fusiona piezas estáticas hermanas del mismo material, conservando los grupos animables. Los cinco modelos se construyen una vez; cambiar de vehículo no crea nuevos recursos GPU. Solo el modelo seleccionado se dibuja en el showroom. No hay luces puntuales por faro, bloom, texturas de coches ni transparencias costosas.

## Selector y controles

`createShowroom()` en `showroom.js` administra una escena y cámara independientes usando el mismo renderer. Al abrir, `race.phase` permanece en `ready`; la rotación del showroom no avanza la carrera. La cámara encuadra el modelo a tres cuartos sobre una plataforma.

- A/D o flechas: anterior/siguiente; Enter (también Espacio): comenzar.
- Click o toque en las flechas y en COMENZAR CARRERA.
- Stick izquierdo o D-Pad: anterior/siguiente. Hay que volver al centro/soltar para cambiar otra vez. Botón A: comenzar.
- El modelo elegido se mueve del showroom a la escena de carrera: es el mismo Group, no otra representación.
- Durante carrera no se puede seleccionar otro vehículo. Reiniciar conserva la elección.
- Pausar con Esc/Menu/PAUSA, o terminar la carrera, muestra CAMBIAR VEHÍCULO. También se puede pulsar C en teclado o X en gamepad estando en pausa/final. Ese botón limpia carrera, objetos e inputs y vuelve al showroom para una carrera nueva.
- Para probar los cinco, recorre las cinco posiciones del contador y comienza con cada uno; vuelve mediante pausa → CAMBIAR VEHÍCULO.

## Verificación

`node tests/run.mjs` (Node 18+, sin dependencias) permite repetir las comprobaciones. En este entorno no hay Node; el mismo arnés y scripts se ejecutaron en V8 mediante las herramientas disponibles.

Pasaron: sintaxis, comparación exacta del bloque de simulación con la versión anterior, creación de cinco modelos/grupos, transformaciones finitas, selector circular, teclado y repetición, clicks, entradas simuladas de gamepad con debounce, entradas táctiles simultáneas, inicio con cada modelo, bloqueo de cambios en carrera, ruedas, IA, HUD, pausa/reanudación, reinicio conservando vehículo y regreso al showroom desde pausa y final. Una carrera con piloto automático de prueba completó tres vueltas y parciales. Se ejecutó en configuraciones de escritorio y móvil.

El arnés usa dobles de DOM y Three.js: verifica integración y lógica, no render GPU ni distribución CSS. Se revisaron también las siluetas con una proyección geométrica diagnóstica; no equivale a una captura del juego.

Chrome no pudo iniciar: `setsockopt: Operation not permitted` y salida 133. Siguen pendientes una prueba real en Firefox/Chrome/Safari, mando físico, iPhone y medición de FPS. No se afirma que esos dispositivos hayan sido probados.

## Límites visuales

Son interpretaciones low-poly, con vidrios opacos estilizados, sin interiores complejos, reflejos reales, óxido texturizado ni partículas de propulsión. El buggy recoge mejor la referencia por su jaula, focos, suspensión y ruedas; cyber no tuvo imagen disponible. Las cajas de colisión se conservan, aunque cambien anchuras y tamaños visuales.

`~/three-kart-racing` permanece intacto. No se hizo git push ni publicación.

## Actualización: rivales y Sierra Pradera

Los rivales ahora utilizan `createVehicle(type, variant)` y los mismos diseños que el jugador, con pinturas alternativas. La pista y el controlador de IA se actualizaron; la comparación de simulación idéntica indicada en la etapa anterior ya no aplica al bloque completo. Se conservan las ecuaciones de conducción. Detalles actuales: `CIRCUITO.md`.
