# Sonidos de carrera

Actualmente no se requieren archivos: todos los sonidos son originales y generados mediante Web Audio en `audio.js`.

Volúmenes centrales: `RaceAudioSettings.masterVolume = .45`, `engineVolume = .18`, `effectsVolume = .32`.

Para incorporar grabaciones propias o con licencia, guardar aquí `engine`, `drift`, `boost`, `impact`, `checkpoint`, `lap` y `victory` en formatos compatibles con los navegadores objetivo (por ejemplo WAV o MP3; no depender exclusivamente de OGG para Safari antiguo).

Puntos de sustitución en `audio.js`:

- `init()`: cambiar los osciladores del motor y el ruido continuo de neumáticos por AudioBufferSourceNode con `loop = true`, manteniendo las ganancias compartidas.
- `update()`: controlar `playbackRate` del motor en lugar de `frequency` de los dos osciladores.
- `play(event)`: sustituir la síntesis del evento por un AudioBufferSourceNode con el buffer correspondiente. Mantener el límite de voces, cooldown, conexión al volumen general y limpieza de `onended`.
- Precargar/decodificar los buffers una vez, con fallback a síntesis; no descargar ni decodificar cada vez que se produzca un evento.

No basta con copiar un archivo: hay que conectar estos puntos de sustitución. Se mantienen la autorización por gesto del usuario y `resume()` dentro de `unlock()`.
