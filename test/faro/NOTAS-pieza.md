# `/test/faro` · v3-corr · La línea entre el mar y la piedra · [FABLE 5.1 · High]

**Fecha:** 11-sep-2026 · **Fila:** B16 · **Estado: publicada** en https://faro-digital.pages.dev/test/faro/ · a la espera de la puntuación de Zyad.

Motivo: línea clara entre el mar y la piedra (torre, base y espigón). Causa: máscara con pluma de 24 px mezclando el mar fijo de la foto con el mar del vídeo, y borde blando del clip junto a la piedra. Cinco cambios, en orden.

1. **Máscara dura y erodida.** Sin ImageMagick en la máquina y sin fuente mayor de 800×456 (la textura es 1600×912): la receta exacta en scipy a 1600×912, sobre la máscara reescalada ×2 y umbralizada al 50 % (umbral, erosión con disco de 6 px, gaussiana σ 0,7) y la pluma de 24 px solo en el horizonte (banda de 24 px centrada en y = 481, gaussiana σ 8, compuesta encima). El mar pasa del 34,9 % al 33,2 % del cuadro. Misma receta para `mascara-m.png` (24,4 → 22,2 %). Las anteriores, en `media/_mascara-anterior/`.
2. **El vídeo abajo, la piedra arriba.** Al cargar, una vez, el recorte de la foto con el mar transparente (alfa = 1 − máscara, `OffscreenCanvas` → `ImageBitmap`, con lienzo normal si no existe). Por fotograma: calma, tormenta con `globalAlpha = mezcla`, y el recorte encima; solo en el rectángulo del mar. Ya no hay `destination-in` ni lienzo auxiliar.
3. **Alineación.** Ventana de 200×200 px en la base de la torre, barrido ±6 px y correlación de fase: **desplazamiento 0 × 0 px** (diferencia mínima 3,14/255 en (0,0); a 1 px ya sube a 4,1). El vídeo se pinta con el mismo rectángulo cover que la foto: 1280×728 es la foto a esa altura exacta (a 727 o 729 la diferencia sube).
4. **Tono.** Bandas de 12 px a cada lado del borde erodido, por debajo del horizonte, L*a*b* medio por fotograma. Calma: ΔE 1,47 medio / 1,80 máximo, sin tocar. Tormenta: 1,97 / 3,01 → con `eq=brightness=-0.006,colorbalance=gm=0.01:bm=-0.01` queda en **0,93 / 2,07** en el webm publicado. Reencodada con los mismos parámetros: webm 158 → 165 KB (+4,6 %), mp4 292 → 306 KB (+4,7 %).
5. **Nueve recortes a 2×** en `_capturas/v3-corr/` (base de la torre, espigón izquierdo, espigón derecho × mezcla 0, 0,5 y 1) y la anchura del halo medida sobre ellos: **0 px en los nueve** (techo 2). El medidor mide la banda sistemática a lo largo del borde (mediana del perfil perpendicular sobre 187-214 perfiles por recorte, para que la textura del agua no cuente como halo) y está probado contra lo que sí debe marcar: una línea de 1, 2 y 3 px pintada a lo largo del borde da 1, 3 y 5. La primera versión del medidor contaba la espuma junto al borde y daba 1-4,5 px que no eran un halo.

## Los números

| | v3-corr | v3 |
|---|---|---|
| **ΔE en la banda del borde** (12 px a cada lado, por fotograma) | mezcla 0: **1,47 medio · 1,81 máximo** · mezcla 1: **0,93 · 2,07** (techo 3; antes de corregir la tormenta, 1,97 · 3,01) | — |
| **Halo en los nueve recortes** (`_capturas/v3-corr/`) | **0 px** en todos (techo 2) | — |
| **Desplazamiento de alineación aplicado** | **0 px** (mínimo de diferencia y correlación de fase en (0, 0); 1 px de error ya sube la diferencia de 3,1 a 4,1) | — |
| **KB de cada bucle** | calma 116 webm / 251 mp4 (sin tocar) · **tormenta 165 webm / 306 mp4** (+4,6 / +4,7 %) · calma-m 52 / 95 · máscara 4,4 | 158 / 292 |
| **Peso del recorrido** | **1440 px: 589 KB** · **390 px: 316 KB** | 578 / 315 |
| **fps con CPU ×4** | banco sin veredicto (vacía 57 fps con banderas). Con banderas 185 · 271 · 201 de media, peor segundo 110 · 82 · 58, 4 fotogramas > 50 ms en el medio; sin banderas 59,5 · 60,1 · 59,5, 0 fotogramas > 50 ms | igual |
| **Peor contraste con mezcla = 1** | 658 bloques en 390, 1024, 1440 y 1600 px: **cero fallos, peor 5,97:1** sobre 4,5 | 5,97 |
| INP · CLS | 40 / 32 ms · 0 | 56 · 0 |

---
---

# `/test/faro` · v3 · Dos bucles reales, el scroll manda la intensidad · [FABLE 5.1 · High]

**Fecha:** 10-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**, a la espera de la puntuación de Zyad.

Motivo: pieza firma del faro, v3. El diagnóstico de la v2.4 (`DIAGNOSTICO-v2.4.md`) probó que el scrub no es reparable a 60 fps: seeking→seeked 3 ms, seeked→fotograma pintado 315 ms p50 / 2.326 p95, 25 de 242 fotogramas pintados en la bajada lenta. Se elimina, no se optimiza.

## Las tres líneas

**Qué decidí.** Lienzo 2D fijo detrás de toda la página a cualquier ancho; dos `<video>` en bucle continuo (`calma` y `tormenta`, 4 s cada uno con la costura fundida por xfade) y, en cada fotograma nuevo, `drawImage(calma)` + `drawImage(tormenta)` con `globalAlpha = mezcla` recortado por la máscara del mar (`destination-in`) y la foto fija fuera. Solo se repinta el rectángulo del mar y solo cuando hay fotograma nuevo (`requestVideoFrameCallback`) o la mezcla ha cambiado. La mezcla sale del progreso de scroll con la curva `suave` y lerp 0,06. **El bucle de tormenta sale del clip Kling de tormenta de la v2.1** (`_original/tormenta-1280.mp4`), no del de subida: el de subida está en calma tres de sus cinco segundos y como bucle respiraría calma → ola → calma; el de tormenta tiene actividad constante (1,0/255 por fotograma en todo el clip) y es lo que lee como mar encrespado. Los bucles pesan 116 + 158 KB en webm porque con keyframes normales (cada 2 s) el códec trabaja como debe; la v2.4 necesitaba keyframe cada 6 fotogramas para el scrub y eso costaba el doble. **Móvil (< 768 px)**: un solo `<video>` fijo (`calma-m`, recorte central del bucle de calma a 540×720, 52 KB) y el scroll manda un velo negro de 0 a 25 %; sin lienzo, un decodificador. **Fondos por bloque**: de 1024 px en adelante, las reservas de columna de la v2 (0,35) sin tocar; por debajo, panel translúcido 0,62 del color del fondo en las cuatro piezas de la oferta, las secciones 3-6, el cierre y el pie, y el hero sin panel. El vídeo del cierre y la franja móvil con el poster se van: el mar pasa por detrás. **Poster** = primer fotograma exacto de cada bucle (17 y 10 KB), precargado como LCP.

**Qué descarté.** Un shader o cualquier mezcla fuera del lienzo 2D (prohibido y no hace falta). Repintar la foto entera cada fotograma: se pinta una vez y luego solo el rectángulo de la máscara (filas 380-728 del vídeo). Un fundido calma ↔ tormenta por tramos: la mezcla continua ya es el fundido. El puntero.

**Dónde me atasqué.** En el banco, no en la pieza. **El banco de fps no se deja verificar en esta máquina**: con `--disable-frame-rate-limit --disable-gpu-vsync` una página vacía da 57 fps en dos pasadas de tres y 114 en la tercera (a ráfagas), así que la puerta de 60 queda **sin veredicto**; con esas mismas banderas la pieza mide 181 · 149 · 264 fps de media y 106 · 68 · 58 en el peor segundo con CPU ×4, y sin banderas (techo 60 Hz) 60 · 60 · 60 con 0 fotogramas largos; se dan como indicio, no como veredicto. Y **la emulación móvil con ventana no pinta a tiempo**: los fotogramas de 86 s y un INP de 99 s eran de la ventana emulada, no de la página; el INP móvil se midió en Chromium sin ventana (56 ms). Un tercero de la construcción: la franja móvil de la oferta apuntaba a posters que ya no se publican y `construir.py` se negó (dos referencias rotas) hasta quitarla. Y **el fallo de contraste de siempre tenía una causa de 0,2 px**: la cabecera oculta se desplazaba exactamente su alto y dejaba una fila de subpíxel de su borde inferior, con el subrayado del CTA, asomando por arriba; ahora se desplaza 4 px más. Y en el vídeo del gesto la cabecera volvía a aparecer en la parada de 3 s: el scroll programado acababa con varios `scrollTo` al mismo píxel y `faro.js` leía «no baja» como «sube»; ahora un scroll que no se mueve no cambia el estado de la cabecera.

## Los números

| | v3 | v2.4 |
|---|---|---|
| **Costura de cada bucle** (último → primer fotograma, media de píxeles) | **calma 0,31 % · tormenta 0,35 %** (en el mar 0,52 / 0,63; entre dos fotogramas consecutivos normales, 0,13 / 0,27) | — |
| **KB de cada bucle** | calma **116** webm / 251 mp4 · tormenta **158** webm / 292 mp4 · calma-m **52** webm / 95 mp4 · posters 17 + 10 | 290 + 321 |
| **Peso del recorrido** | **1440 px: 578 KB** de 1.200 · **390 px: 315 KB** | 943 / 315 |
| **fps con CPU ×4** | banco **sin veredicto** (página vacía a 57 fps con las banderas). Indicio: con banderas 181 · 149 · 264 de media, peor segundo 106 · 68 · 58, 1 fotograma > 50 ms; sin banderas 60,0 · 59,9 · 59,7 (peor segundo 59 · 30 · 30), 0 fotogramas > 50 ms | 56-60 |
| **LCP** (≤ 2,5 s) | **456 ms** a 1440 px DPR 1,5 · 284 a DPR 1 · **368** a 390 px (el titular del hero) | 680 |
| **INP** | **56 ms** (390 y 1440, Chromium sin ventana) · 96 ms con ventana a 1440 | 72 |
| **CLS** | **0** a 1440 y 390 | 0,0022 |
| **Fotogramas únicos por segundo en el lienzo, página parada** (5 s en tres alturas) | **24-27 por segundo** (19 de media contando el primer segundo incompleto): los dos bucles a 24 fps, cada uno con su fase | — |
| Contraste AA, mezcla = 1, fotograma más claro del bucle (el 77, 3,208 s, p98 75/255) | **658 bloques en 390, 1024, 1440 y 1600 px × 11 alturas: cero fallos**. Peor de todos **5,97:1** sobre 4,5 (390 px, método); hero (19 bloques) peor **7,43:1**; cierre y pie (127 bloques) peor **8,93:1**; a 1024 px el bloque de siempre pasa a 6,87 con la cabecera arreglada | 6,22 |
| Vídeos del gesto | `_capturas/gesto-v3-escritorio-1440.mp4` y `gesto-v3-movil-390.mp4`, 6,6 s: bajar a la mitad, 3 s parado con el mar vivo, bajar al pie; grabados en tiempo real con el grabador de Playwright (`grabar-escena.py` captura fotograma a fotograma con reloj parado y no puede parar un bucle que se reproduce solo) | |

Para repetirlo: `fps-v3.py`, `unicos-v3.py`, `puertas2-v24.py`, `lcp-fps-v24.py`, `inp-movil-headless.py` y `grabar-v3.py` en el scratchpad de la sesión (copias en `_capturas/v3/bancos/`), y el contraste con `contraste-sobre-escena.py --peor-caso peor-caso-tormenta.js` contra la URL publicada.

---
---

# `/test/faro` · v2.4 · Cadena de dos clips reales en scrub · [FABLE 5.1 · High]

**Fecha:** 06-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**.

Motivo: cadena de dos clips reales en scrub. `calma-scrub-1280` (5 s, oleaje suave) + `subida-scrub-1280` (5 s, empieza en el último fotograma exacto de la calma y acaba con la ola subiendo por la torre), keyframe cada 6 fotogramas. Medido: costura 2,4/255; primer y último fotograma de calma, 4,1/255; el fotograma más claro de la cadena es el último (p98 68/255) y su rociada se sale de la máscara por la izquierda hasta x = 0,15 y por arriba hasta y = 0,15.

## Las tres líneas

**Qué decidí.** Una cadena de 10 s en scrub con cambio de textura en la costura (`uCual`), sin fundido: el `<video>` que no manda espera en su frontera ya decodificado (la calma en su último fotograma, la subida en el primero). Mapa scroll → tiempo a trozos: 0-35 % de la página → calma entera, 35-85 % → 5-9,5 s, 85-100 % → los últimos 0,5 s. Arriba del todo, el bucle de calma a 0,8 con el relevo de dos `<video>`; al primer píxel el scrub arranca **desde el fotograma en que estaba el bucle** (`origen`): el primer tramo del mapa va de `origen` a 5 s, así no vuelve a 0. De vuelta arriba, el bucle se reanuda tras 1 s parado **y solo cuando el scrub ha vuelto a `origen`** (tormenta < 0,003): si no, arrancaría desde otro fotograma y se vería el salto (pasó en el banco: T saltaba de 5 a 0,4). La rotura sintética a un tercio (`uRot`), nivel y espuma a la mitad como estaban, y la región de la rociada ensanchada a x = base ± 0,30 y desde y = 0,05, con el umbral bajado a 0,03-0,10 para que la ola que sube por la torre no salga translúcida. **Safari (sin VP9): modo bucle** con `calma-1280.mp4` (287 KB), sin scrub, con el nivel y la rotura del shader ligados al scroll como en la v2.1. El criterio es solo el techo: los mp4 de la cadena pesan 1,09 + 1,14 MB y la página se iría a 2,5 MB, el doble de 1,2; si un día caben, se quita la rama. Los mp4 de la cadena no se publican.

**Qué descarté.** Un fundido en la costura (los clips son continuos, y un fundido enseñaría dos mares a mitad de gesto). Que el bucle siga corriendo mientras se hace scrub (el scrub es el propio `<video>` del bucle, parado y buscado: un solo clip de calma, no dos). Y el clip de tormenta de la v2.2/v2.3, que deja de cargarse y de publicarse.

**Dónde me atasqué.** Dos veces, y las dos en los clips y no en la pieza. **Los webm entregados buscaban lento**: `currentTime` → `seeked` tardaba 17-57 ms (alternando), y el retardo rueda → fotograma salía en 158 / 128 ms (CPU ×1 / ×4), tres veces el de la v2.2. Recodificados desde sus mp4 con libvpx-vp9 (crf 40, keyframe cada 6, row-mt): 289 + 321 KB (los entregados, 309 + 347), PSNR 48,5 / 46,7 dB (48,2 / 46,4) y búsquedas de 4-9 ms; los entregados quedan en `media/olas/_original/*-entregado.webm`. La regla que sale: **un clip para scrub se recodifica siempre con libvpx y se mide `busquedaMs` antes de publicarlo**, porque el peso y los keyframes no dicen cuánto tarda una búsqueda. Y el banco otra vez: los fps de la segunda tanda salieron a 30 y luego a 1 exactos (pantalla apagada o ventana ocluida a estas horas), así que los fps que valen son los de la primera tanda, medidos con la ventana al frente.

## Los números

| | v2.4 (1440×900) | v2.3 |
|---|---|---|
| Clips descargados (webm) | **611 KB** (290 calma-scrub + 321 subida-scrub); Safari: 287 (calma-1280.mp4) | 621 |
| **Página, recorrido entero** | **943 KB** de 1.200 (Safari, modo bucle: ~600) | 955 |
| **Retardo rueda → fotograma nuevo**, 10 ticks al 60 % de la página (dentro de la subida) | **mediana 67 ms (CPU ×1) · 83 ms (×4)** · máximo 101 / 136 ms · búsquedas 4-9 ms | 50 / 59 (v2.2) |
| **fps con CPU ×4, Chrome real con GPU** | **arriba 56,1 · medio 57,4 · pie 60,1** · peor 117 / 67 / 18 ms · 4 / 2 / 0 frames > 50 ms | 60,1 / 59,6 / 60,0 |
| Contraste, tormenta = 1 (el último fotograma de la cadena, el más claro), 513 bloques, 3 anchos × 11 alturas | **0 fallos reales** · peor **6,22:1** sobre 3,0 («Un solo sistema.», 72 px, 1440) · cierre y pie: peor 8,21 · el 1,53 de 1024 px es el subrayado de la cabecera fija de siempre | 6,69 |
| Vídeo del gesto | `_capturas/gesto-v24-cadena-escritorio-1440.mp4`, 15 s: bajar despacio hasta el pie (9 s), parar 2 s, subir (4 s) | |

**Sobre los fps de arriba.** Los cuatro fotogramas largos (117 ms) son del gesto de prueba, que menea la rueda alrededor del principio de la página: cada vuelta arriba reanuda el `<video>` del bucle (`play()` tras las búsquedas), y con la CPU a ×4 eso cuesta 100 ms una vez por vuelta. En la v2.3 la calma seguía decodificando 5 s en gracia; en la v2.4 no puede, porque el bucle y el scrub son el mismo `<video>`, parado para buscar. Se ve al volver arriba del todo, una vez, y no al bajar. **Los fps de esta tabla son de la primera tanda, con los webm entregados**; con los recodificados no se pudo repetir la medida (banco a 30 y 1 fps: pantalla ocupada), y decodificar no es lo que cuesta en el gesto, buscar sí, y buscar va más rápido.

Para repetirlo, desde esta carpeta: `python medir-retardo.py --json ...`, `python medir-fps.py --json ...` (con la ventana de Chrome al frente), `python grabar-gesto.py --gpu`, `python peso-olas.py` y el contraste con `contraste-sobre-escena.py --peor-caso peor-caso-tormenta.js` (`MSYS_NO_PATHCONV=1` desde Git Bash). El modo bucle de Safari se comprueba anulando `canPlayType` de VP9 en el Chrome real: llega `calma-1280.mp4` (287 KB), se reproduce (35 fotogramas en 2 s) y a mitad de página sigue en bucle.

## En qué se parece a las olas de verdad, y en qué no

*(Mirando `gesto-v24-cadena-escritorio-1440.mp4`.)* **Ahora es una sola ola que se hace en diez segundos, y el scroll es su reloj.** Arriba, el mar respira solo; al primer giro de rueda sigue desde ese mismo fotograma (no hay salto: el bucle estaba en 0,3 s y el scrub arranca en 0,3 s) y va subiendo despacio hasta el 35 % de la página; a partir de ahí la ola se forma, avanza y rompe contra la torre, sube por ella y al pie está arriba del todo, con la espuma por delante de la torre hasta la galería; parar la deja ahí los 2 s; subir la deshace por el mismo camino y, arriba, tras un segundo, el mar vuelve a respirar. La costura entre los dos clips no se ve (2,4/255 de diferencia, cambio de textura sin fundido). Lo que no es el mar: sigue siendo una ola sola, y con la página parada a mitad del recorrido la ola queda congelada a medio subir, que es lo que se pidió; y si Zyad quiere que abajo del todo el mar siga vivo, la salida es un tercer clip corto en bucle a partir del último fotograma, no volver al bucle antiguo. Con Safari sin VP9 se ve la calma en bucle y el nivel del shader, sin la ola: es la rama pobre, y es a propósito.

---
---

# `/test/faro` · v2.3 · El scroll manda desde el primer píxel · [FABLE 5.1 · High]

**Fecha:** 04-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**.

Motivo: Zyad, sobre la v2.2: «el efecto de scroll aparece desde la mitad hacia abajo; quiero controlar las olas desde el inicio hasta el final».

## Las tres líneas

**Qué decidí.** El scrub arranca en el primer píxel: ya no hay fase de calma intermedia. El bucle de calma solo se ve con `scrollY = 0`; en cuanto se baja se funde en 0,4 s al fotograma 0 de la tormenta (que es la misma foto, así que el fundido es entre el mar respirando y el mar quieto), y al volver arriba del todo la calma vuelve tras 1 s parado. El mapa scroll → clip es a trozos (`curvaClip`): el 20 % primero de la página recorre el 30 % primero del clip, el 20-70 % recorre el 30-85 % (donde crece y rompe) y el 70-100 % el 85-100 % (la ola rota). Y el scrub admite dos clips seguidos como un solo tiempo: cada `<video>` tiene su textura, el que no manda espera en su frontera (último fotograma de a, primero de b) ya decodificado, y en la costura se cambia de textura sin fundido (`uCual`). El segundo, `media/olas/tormenta-b-1280.webm`, es un hueco: se pide una vez en el formato elegido y, si da 404, la cadena es de uno.

**Qué descarté.** Un fundido en la costura de la cadena: si los dos clips son continuos no hace falta, y si no lo son un fundido de 0,4 s enseñaría dos olas a la vez a mitad de gesto; mejor exigir clips continuos (el fotograma 0 de b = el último de a). Y sondear el hueco en los dos formatos: una petición y punto.

**Dónde me atasqué.** En nada de la pieza. Un aviso: mientras `tormenta-b` no exista, cada carga deja un 404 en la consola (una petición de ~1 KB). Es el precio del hueco; cuando llegue el clip, desaparece solo.

## Los números

| | v2.3 (1440×900) | v2.2 |
|---|---|---|
| **Página, recorrido entero** | **955 KB** de 1.200 (621 de clips + ~5 del 404 de `tormenta-b`) | 951 |
| **fps con CPU ×4, Chrome real con GPU** | **arriba 60.1 · medio 59.6 · pie 60** · peor 17 / 50 / 18 ms · 0 frames > 50 ms | 55,0 / 56,7 / 59,9 |
| Fotogramas de vídeo subidos a la GPU por segundo | 13.7 · 8.9 · 3 | |
| Contraste, tormenta a 0,833 (= fotograma 110 por la curva), 513 bloques, 3 anchos × 11 alturas | 0 fallos reales · peor 6,69:1 · el 1,53 de 1024 px es el subrayado de la cabecera fija de siempre | igual |
| Vídeo del gesto | `_capturas/gesto-v23-inicio-escritorio-1440.mp4`, 12 s: bajar despacio hasta la mitad (4 s), parar 2 s, seguir al pie (2 s), subir (4 s) | |

**Sobre los fps de «arriba»:** la primera pasada dio 53-55 fps con 5 fotogramas de 180-200 ms, y no era el gesto: era el arranque de la página (fuentes, revelados, primera decodificación) medido demasiado pronto con la CPU a ×4. Aislado con tres condiciones (tal cual · sin clips · sin pieza): las tres dan 60 fps y 17 ms si se espera 4 s antes de medir; `medir-fps.py` ahora espera. De paso, la calma sigue decodificando 5 s después de dejar de verse (`GRACIA_CALMA`), para que menear la rueda alrededor de arriba del todo no pause y reanude el `<video>` cada vez.

## En qué se parece a las olas de verdad, y en qué no

*(Mirando `gesto-v23-inicio-escritorio-1440.mp4`.)* **La ola empieza a subir con el primer giro de rueda**: en la primera pantalla, con el titular aún puesto, ya asoma la espuma en la base (a 1.930 px de scroll el clip va por 1,33 s, el 27 %); a mitad de página está rompiendo (3,1 s), se queda congelada los 2 s parados, y al pie está rota (4,96 s). La curva hace lo que pedía: la mitad central de la página es donde pasa casi todo y el último tercio apenas mueve la espuma que queda. Al subir se retira por el mismo camino y, arriba del todo, tras un segundo, el mar vuelve a respirar. Lo que no es el mar: lo mismo que en la v2.2, una ola sola y siempre la misma, y en el primer 20 % de la página el movimiento es pequeño a propósito (30 % del clip en un quinto del scroll), así que si se baja muy rápido esa parte se pasa en dos fotogramas. Y el hueco: cuando exista `tormenta-b`, la cadena la alarga sin tocar nada más.

---
---

# `/test/faro` · v2.2 · Las olas ligadas al scroll · [FABLE 5.1 · High]

**Fecha:** 04-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**.

Motivo: Zyad, sobre la v2.1: «mucho mejor, las olas son naturales, pero todavía no sientes que el scroll controla las olas». Diagnóstico: el scroll elegía el clip, pero los clips se reproducían solos y la inercia de bajada (0,03) tardaba ~3 s.

## Las tres líneas

**Qué decidí.** El clip de tormenta va en **scrub**: el scroll fija su `currentTime` (tormenta 0 → fotograma 0, tormenta 1 → el último; la ola rompe hacia la mitad de la página y queda rota al llegar al pie). Bajar la hace crecer y romper, parar la congela, subir la retira. Cada objetivo se cuantiza al fotograma (24/s) y solo hay una búsqueda en vuelo: si el objetivo cambia mientras tanto, se pide la última al acabar y las intermedias se saltan. La calma sigue en bucle autónomo hasta 0,25 y se funde a la tormenta entre 0,25 y 0,45, que ya está en el fotograma que le toca. Un solo lerp de 0,12 en los dos sentidos. **La respiración de reposo (±0,04 a partir de 3 s quieto) va solo al shader, no al scrub**: si moviera el fotograma, parar no congelaría la ola. Nivel, rotura y rociada, como en la v2.1.

**Qué descarté.** Los clips de Kling tal cual para el scrub: tienen un solo keyframe y cada búsqueda decodificaría desde el principio. El clip de tormenta se recodifica con keyframe cada 6 fotogramas (0,25 s): VP9 crf 38 → **391 KB** (PSNR 47,1 dB, la misma que tenía el webm de Kling) y H.264 crf 28 → 496 KB (47,6 dB). Y el playbackRate y el bucle de tormenta, que se van con el scrub (un solo `<video>` de tormenta; la calma conserva sus dos).

**Dónde me atasqué.** En el banco, otra vez: el medidor de fps dio 1-2,6 fps con fotogramas de 1.016 ms en los tres puntos. No era la página: la ventana de Chrome había quedado ocluida y Chrome baja el rAF a 1/s. `bring_to_front()` y volvió a los 55-60. Y la primera medida del retardo comparaba lecturas desde Python con dos viajes de ida y vuelta por tick, y daba medianas de 6 ms (imposibles) y máximos de 3 s: ahora el instante del `wheel` y el registro de subidas a la GPU [cuándo, fotograma] se leen en la propia página y el retardo se calcula allí.

## Los números

| | v2.2 (1440×900) | v2.1 |
|---|---|---|
| Clips descargados (webm) | **621 KB** (230 calma + 392 tormenta) · mp4: 795 | 515 |
| **Página, recorrido entero** | **951 KB** de 1.200 · a 1023 px: sin clips | 842 |
| **Retardo rueda → fotograma nuevo**, 10 ticks, Chrome real | **mediana 50 ms (CPU ×1) · 59 ms (×4)** · máximo 84 / 102 ms · 10/10 medidos | — |
| … de los que la búsqueda (`currentTime` → `seeked`) | 4-6 ms (×1) · 6-9 ms (×4) | — |
| **fps con CPU ×4, Chrome real con GPU** | **arriba 55 · medio 56.7 · pie 59.9** · peor 50 / 67 / 33 ms · 1 frame > 50 ms (medio) | 59,9 / 59,3 / 60,0 |
| Fotogramas de vídeo subidos a la GPU por segundo | 21 (calma) · 7.4 · 6.3 (scrub: solo cuando cambia el fotograma) | 20,6 · 49,6 · 25,1 |
| Contraste, tormenta a 0,917 y el clip en su fotograma más claro (el 110), 513 bloques, 3 anchos × 11 alturas | **0 fallos reales** · peor **6,69:1** sobre 4,5 · los 99 bloques del cierre y el pie: peor 8,31:1 · el 1,53 de 1024 px es el subrayado del CTA de la cabecera fija de siempre (11:1 a 1440 y 1600) | 0 fallos, peor 6,67 |
| Vídeo del gesto | `_capturas/gesto-v22-scrub-escritorio-1440.mp4`, 12 s: bajar despacio hasta la mitad (4 s), parar 2 s, seguir al pie (2 s), subir (4 s) | |

El retardo se mide a mitad de página, con un tick de rueda de 120 px (Δtormenta 0,016 → 2 fotogramas del clip): el lerp de 0,12 necesita 3 rAF para cruzar medio fotograma, y el resto es la búsqueda y la subida. Para repetirlo: `python medir-retardo.py --json ...`; el resto de bancos, como en la v2.1 (`grabar-gesto.py --gpu` intercepta ahora solo la calma: la tormenta publicada ya lleva keyframes densos).

## En qué se parece a las olas de verdad, y en qué no

*(Mirando `gesto-v22-scrub-escritorio-1440.mp4`.)* **Ahora el scroll es la ola.** Al bajar despacio la ola se levanta a la vez que la página (a 1.930 px de scroll el clip va por 0,875 s, a 3.861 por 2,5 s: la cresta a medio subir por delante de la torre); al parar, se queda ahí los 2 s enteros, sin respirar ni deslizarse; al seguir rompe y al llegar al pie está rota y la espuma extendida; al subir se retira por el mismo camino, y se nota que es el mismo camino. Lo que se pierde respecto a la v2.1: la tormenta ya no vive sola, así que quien llegue al pie y se quede ve una ola rota quieta (el mar de fondo sigue con el rizo y el nivel del shader, que es lo que impide que parezca una foto); y un scroll muy rápido de arriba abajo enseña la ola en 4-5 saltos de fotograma en vez de en un movimiento continuo, porque el lerp de 0,12 cruza el clip en medio segundo. Que la ligadura sea la que pedía Zyad lo decide él con el vídeo delante: el retardo medido dice que la respuesta está dentro de un fotograma y medio de rueda.

---
---

# `/test/faro` · v2.1 · La pieza con olas reales · [FABLE 5.1 · High]

**Fecha:** 04-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega (2.8)**.

Motivo: pieza firma v2, ahora con olas reales. Dos clips de Kling en `media/olas/` (calma y tormenta, 5 s, 1280×728, mismo encuadre) sustituyen al clip de Canva, que era una foto codificada como vídeo.

## Las tres líneas

**Qué decidí.** Dos estados reales gobernados por `tormenta`: clip de calma (velocidad 0,8 → 1,0) hasta 0,35, fundido calma → tormenta dentro de la máscara de 0,35 a 0,65, clip de tormenta desde ahí; la foto queda como poster, reduced-motion y todo lo de fuera de la máscara. Lo sintético de la v2 (nivel, tren de olas, espuma, rotura) sigue, **a la mitad**, porque la ola real ya rompe. **Bucle: dos `<video>` por clip en relevo, no desfasados 2,5 s** —con el desfase solo se vería la segunda mitad de cada clip a partir de la primera vuelta, y la ola de la tormenta nace en la primera—: el que manda se reproduce entero, a 0,4 s del final arranca el otro desde 0 y el shader los funde; el último fotograma y el primero difieren 7 y 9/255 en el agua, y el disolvido de 0,4 s lo tapa (`_capturas/v21/frames/cruce-bucle-tormenta-limpio.png`). **Y una salida de la máscara, a propósito: la rociada.** En el pico de la tormenta 13.000 píxeles de espuma suben por encima del horizonte y por delante de la torre; cortarlos dejaba la ola decapitada en línea recta. Cerca de la torre entra del vídeo solo lo que es más claro que la foto en > 0,05 de luminancia: la espuma pasa, la torre y el cielo (foto ± 0,5/255 de códec) no. `ROCIADA = 0` en `pieza.js` lo apaga.

**Qué descarté.** Las UV corregidas por altura: medido el fotograma 0 contra la foto reescalada a 1280×728, los bordes de la base de la torre (filas 420/426/496) y del espigón (522-525/651) caen en las mismas filas, así que uvVídeo = uvFoto y no hay offset que corregir (`_capturas/v21/clips/alineacion-base.png`). Los `.mp4` de Kling tal cual (809 + 877 KB, que en Safari rompían el techo de 1,2 MB): recodificados a crf 28 quedan en 287 + 314 KB con la misma calidad que el webm (PSNR 48,1 / 47,6 frente a 48,1 / 47,1 dB); los originales, en `media/olas/_original/`. Dos `<video>` con la misma URL: un `fetch` por clip y el blob a los dos, para que sea un solo download. Y la advección de calma con el vídeo puesto: el clip ya deriva solo.

**Dónde me atasqué.** Dos veces en el banco, no en la pieza. `texSubImage2D` en WebGL2 con un `<video>` exige ancho y alto y ningún `internalformat`; el error saltaba dentro de rAF y mataba el bucle sin ruido: el estado decía «vídeo 0,13, subidas 1» y ahí se quedaba. Y los clips de Kling tienen **un solo keyframe**, así que grabar el gesto fotograma a fotograma (`currentTime` por captura) obligaba a decodificar desde el principio en cada búsqueda: el grabador sirve por interceptación una copia de banco con keyframe cada 6 fotogramas (`media/olas/_banco/`, no se publica) y el reloj de los clips lo lleva el script (`canvas.pieza.captura / avanzar / listo / dibujar`). Un tercero de Git Bash: `--ruta /test/faro/` se convierte en `C:/Program Files/Git/test/faro/`; `MSYS_NO_PATHCONV=1` delante.

## Los números

| | v2.1 (1440×900) | v2 |
|---|---|---|
| Clips descargados (webm, Chrome/Firefox) | **515 KB** (230 + 286) · mp4: 587 | 0 |
| **Página, recorrido entero** | **842 KB** de 1.200 · a 1023 px: 493 sin clips | 313 |
| **fps con CPU ×4, Chrome real con GPU** | **arriba 59,9 · medio 59,3 · pie 60,0** · peor 17 / 67 / 17 ms · 1 frame > 50 ms (el arranque del segundo clip) | 59,0 / 59,7 / 60,1 |
| … lo mismo contra la URL publicada | 60,0 · 57,5 · 59,9 · peor 17 / 183 / 17 ms · 2 frames > 50 ms en el medio, donde arranca el clip de tormenta (decodificador nuevo con la CPU a ×4) | |
| Fotogramas de vídeo subidos a la GPU por segundo | 20,6 (calma a 0,8×) · 49,6 (los dos clips) · 25,1 | 0 |
| Contraste con la tormenta al máximo y el clip parado en su fotograma más claro (el 110), 513 bloques, 3 anchos × 11 alturas | **0 fallos reales** · peor **6,67:1** sobre 4,5 · los 36 del cierre y el pie: peor 8,30:1 | 6,83 / 9,07 |
| Vídeo del gesto | `_capturas/gesto-v21-olas-escritorio-1440.mp4`, 12 s a 30 fps, reloj de página y de clips controlados | |

Para repetirlo, desde esta carpeta: `python grabar-gesto.py --gpu` (el vídeo), `python medir-fps.py --json ...` (fps con CPU ×4 en el Chrome real), `python secuencias-mar.py` (las secuencias limpias del mar), y el contraste con `contraste-sobre-escena.py --peor-caso peor-caso-tormenta.js` (con `MSYS_NO_PATHCONV=1` si se lanza desde Git Bash). Ninguno se publica: `sincronizar-publicacion.py` copia solo lo que la página necesita.

El bloque a 1,53:1 de 1024 px es el mismo de la v2: el subrayado del CTA de la cabecera fija sobre «Tres restaurantes excelentes…» con el `scrollTo` del medidor (a 1440 y 1600 da 11:1). Sigue sin tocarse. Fallbacks comprobados: sin webm llega el mp4 y se reproduce (Chrome real); con reduced-motion y a 1023 px no se pide ningún clip.

## En qué se parece a las olas de verdad, y en qué no

*(Mirando `gesto-v21-olas-escritorio-1440.mp4`.)* Ahora **las olas llegan**: en la calma el mar respira de verdad y deriva, y al bajar la ola grande se forma, avanza, rompe contra la base y la espuma sube por delante de la torre y cae; el scroll sigue mandando y la tormenta se calma más despacio de lo que se enfureció. Lo que no es el mar: la ola grande es **siempre la misma ola** cada 5 s (el clip tiene una), y con la tormenta al máximo quieta durante un rato se nota el ciclo; y en el cruce del bucle hay 0,4 s en los que dos espumas conviven, que en la calma no se ve y en la tormenta se ve si se busca. El horizonte no se rompe. Que llegue al 8,5 lo decide Zyad con el vídeo delante.

---
---

# `/test/faro` · v2 · Sección 2 · La pieza · [FABLE 5.1 · High]

**Fecha:** 04-sep-2026 · **Fila:** B16 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ (la v1 congelada, en https://faro-digital.pages.dev/test/faro-v1/) · **parado en la entrega (2.8)**, como dice el prompt.

Motivo: pieza firma v2, tormenta gobernada por scroll. Zyad puntuó la v1 6,7: olas no naturales, el scroll no manda, el efecto se acaba en la tercera pantalla.

---

## 🔴 Lo primero: las «olas reales» no existen

El prompt lo daba por hecho: *«Desplazar una foto no da olas: da gelatina. Las olas reales ya existen: `hero-1280.webm` (5 s, el mar rompiendo contra la base)»*. Antes de escribir el shader, medí el clip. **Es una fotografía codificada como vídeo.**

| Medido sobre los 150 fotogramas, dentro de la máscara del mar | `hero-1280.webm` | `.mp4` | máster 1920 | `scrub/` |
|---|---|---|---|---|
| Desviación temporal de un píxel, mediana | **0,35/255** | 0,11 | 0,00 | 0,40 |
| … p99 | 0,72 | 0,61 | 0,50 | 1,15 |
| Diferencia máxima con el fotograma 0, en todo el clip | **0,56/255** | 0,41 | 0,32 | 0,81 |

Un mar moviéndose da entre 10 y 40. El fotograma 0 y el 133 (4,4 s después) son la misma ola congelada en la base, píxel a píxel salvo ruido del códec (`_capturas/v2/frames/ola-f0-f133.png`). **Y ya estaba medido**: las notas del paso 4 del test Kaito dicen *«la luminancia del vídeo apenas varía (0,0334 a 0,0335 en los 150 fotogramas)»* — se leyó como «el vídeo es oscuro y uniforme» cuando decía «el vídeo no se mueve».

Lo que eso tira: la mezcla foto → vídeo (2.2), el `playbackRate` (no gobierna nada), el bucle sin costura (no hay nada que cerrar) y el plan B del 2.7 (*«vídeo puro dentro de la máscara»* dejaría el mar quieto, peor que la v1). **Lo que se queda en pie es todo lo demás**, y con eso se ha construido la v2: la tormenta la hace el shader. Cuando exista un clip que se mueva de verdad, la mezcla entra en el sitio marcado «AQUÍ IRÍA EL VÍDEO» en `pieza.js`, con la transformación ya medida: **el fotograma 0 del clip es la foto escalada a 1280×730 y recortada desde y = 5**, o sea `uvVideo.y = uvFoto.y · 1,0139 − 0,0069`, x igual (diferencia media 3,2/255, la del reescalado).

> Zyad tiene que decidir si se genera ese clip (imagen a vídeo desde `faro-16x9.png`, que es la textura) o si la v2 se queda como shader. La v2 de hoy no lo necesita para puntuarse.

---

## Qué decidí

**Un solo parámetro, `tormenta`.** El progreso de scroll de toda la página (0 arriba, 1 en el pie), con la inercia asimétrica del prompt: sube con lerp 0,05 y baja con 0,03. El ratón ya no gobierna: solo desplaza el patrón del oleaje ±2 % en horizontal (el patrón, no la foto). Sin scroll durante 3 s, respira ±0,04 en 8 s alrededor del estado que toque. Y al cargar a mitad de página la tormenta **arranca donde está el scroll**, no desde cero.

**Lo que `tormenta` gobierna a la vez**, en un mismo shader:

- **El nivel**: 0 → +7 % de la altura, con la atenuación del horizonte de la v1 (la máscara al cuadrado por su degradado de 24 px) y una nueva: el desplazamiento **nunca lee por debajo del borde de la textura** (`d.y = min(d.y, 1 − uv.y)`); se limita, no se anula, para que la última franja no quede quieta.
- **Un tren de olas que converge en la torre.** La fase es la distancia real a la base (`sin(r·14 + t·1,1)`: la fase crece con el tiempo, así una cresta de fase constante baja en r, o sea *viene hacia la torre*). Dos ruidos lentos curvan las crestas y desigualan su altura: sin ellos serían anillos. El desplazamiento va **a lo largo de la dirección hacia la base**, ×0,012·tormenta·profundidad.
- **Espuma por umbral sobre el propio píxel**, sin partículas: solo lo alto de cada cresta (`smoothstep(.55,.95)`), rota por un ruido **estirado a lo largo de la cresta** (fino en la dirección de avance, largo en la perpendicular) y **nacida donde la foto ya tiene espuma** (`espFoto`, el umbral de luminancia de la escena): en agua profunda apenas asoma. El píxel se aclara hacia el color de la espuma real de la textura —**RGB 57/80/71, medido en el 1 % más claro del agua**— en proporción y conservando su textura, nunca hacia blanco: es de noche.
- **La rotura en la base**: radio 12 % alrededor de (0,50 · 0,73), ∝ tormenta², con el rizo ×2,8 ahí. El radio va con el eje X estirado (`length((uv−base)·vec2(1, 1,4))`), porque el radio circular en coordenadas de aspecto caía justo sobre el espigón (piedra, máscara negra) y no llegaba al agua de sus dos lados.
- **La luz**: el reflejo de la linterna sigue la misma UV desplazada que el agua y sube un 25 % con `tormenta`. La respiración del 3 % se mantiene.

**La advección de calma (2.3).** Para `tormenta` < 0,25, las UV se arrastran hacia el faro a 0,004/s en dos fases desfasadas medio periodo con mezcla triangular: cada fase salta al principio justo cuando su peso es cero, y el salto no se ve. Periodo 4 s y no más largo: el fantasma máximo entre las dos fases es la mitad del recorrido, y a 4 s son 0,8 % del ancho (13 px a 1600), que en agua se disuelve; a 8 s serían 26 px y se veía doble. Se apaga entre 0,15 y 0,35 de tormenta, donde el tren de olas ya manda.

**Por debajo de 1024 px no cambia nada.** Los términos nuevos entran con `uTor = 0` y `uAdv = 0`, y el shader se reduce **línea por línea** al de la v1, con su control de siempre (el puntero, o el scroll de la escena en táctil). Un shader, no dos.

**La reserva de la sección 1 baja de 0,62 a 0,35 y pierde el desenfoque.** La sección 1 lo dejó escrito para decidirlo aquí, con la tormenta real delante. A 0,62 con `blur(14px)` la tormenta era un manchón plano **justo debajo de las columnas, que es donde la página vive** (a mitad de página los píxeles que cambiaban en 0,4 s eran el 0,2 %, contra el 3 % arriba y el 6 % en el pie). A 0,35 sin desenfoque el mar se ve a través del texto y AA aguanta con margen (tabla de abajo). No lo pedían los fps —58,8-60,1 con los nueve `backdrop-filter` puestos—, lo pedía la pieza.

## Qué descarté

- **La mezcla con el vídeo** y todo lo que colgaba de ella (arriba).
- **Foam isótropo.** La primera espuma usaba un ruido normal a 38×70: daba **celdas**, y las celdas se leen como cáusticas de piscina, no como espuma (`_capturas/v2/sec-izq-T100.png`, primera versión). Se ve en la secuencia, no en un fotograma.
- **El desplazamiento del tren a 0,022.** Estiraba la textura en bandas horizontales: gelatina, que es justo lo que el prompt temía. A 0,012 la altura de la ola la vende el brillo, no el estirón.
- **Aplanar el píxel hacia un color de espuma** (`max(col·1,7, espuma)`): dejaba manchas planas. Ahora se mezcla en proporción y el píxel conserva su textura.
- **La banda de atenuación junto a la piedra al 3 %.** Con el nivel a +7 % (antes +5 %), la cizalla entre el agua pegada al espigón (quieta) y la de tres puntos más allá dejaba una costura. Al 4,5 % se reparte.

## Dónde me atasqué

Dos veces, y las dos se vieron mirando la secuencia y no un fotograma: las celdas de la espuma y las bandas del desplazamiento. Los números (fps, píxeles que cambian, primer frame) daban bien en las dos.

Y una tercera que no era mía pero costó media hora: el medidor de contraste heredado de la sección 1 y su falso positivo con la cabecera fija (abajo).

---

## Los números

| | Escritorio 1440×900 |
|---|---|
| **La pieza** (`pieza.js` + textura + máscara) | **60,9 KB** de 400 (25,7 + 33,2 + 2,0) |
| Vídeo cargado | **0 KB** (no hay clip que valga; el `<video>` sigue en el DOM con `preload="none"` y no pide nada) |
| Página, primera pantalla | 298,0 KB |
| **Página, recorrido entero** | **313,1 KB** (la v1: 456,7 — se van los 165,6 KB del cierre) |
| Primer frame del shader | 0,1 ms |
| **fps con CPU ×4, Chrome real con GPU**, 4 s de rueda en cada punto | **arriba 59,0 · medio 59,7 · pie 60,1** · 0 frames > 50 ms · peor 33 / 50 / 17 ms |
| Contraste con la tormenta al máximo, 512 bloques, 3 anchos × 11 alturas | **0 fallos** · peor **6,83:1** sobre 4,5 (×1,5) |
| … los 27 del cierre y del pie | peor **9,07:1** |
| Píxeles que cambian en 0,4 s | arriba 3,0 % · pie 6,1 % (la v1 en reposo: 2,0 %) |

**Sobre los fps:** medidos en el Chrome instalado con ventana y la GPU de este PC (AMD integrada), con `Emulation.setCPUThrottlingRate(4)` por CDP y 4 s de rueda de ratón de verdad en cada punto. El Chromium sin pantalla cae a SwiftShader y mide el shader en la CPU: no es la página, es el banco de pruebas (`pintado.py` lo tiene escrito).

**Sobre el contraste:** se mide con `contraste-sobre-escena.py` y el peor caso `peor-caso-tormenta.js`, que ahora fuerza `tormenta = 1` por el gancho de medida (`canvas.pieza.forzar`) en las 33 combinaciones. **Un bloque sale por debajo de AA en la tabla cruda** («Tres restaurantes excelentes…», 1,53:1 a 1024 px) y no es del mar: es **el subrayado del CTA de la cabecera fija** pintado encima del titular cuando ese bloque asoma por el borde de arriba con la cabecera visible. La cabecera está fuera de `<main>` y el medidor no la borra. Con una rueda de verdad la cabecera se retira al bajar y el choque no ocurre; con el `scrollTo` del medidor, no. Es el mismo choque cabecera/texto que la sección 1 dejó anotado como defecto de la v1, y sigue sin tocarse.

**Sobre el contrato de escena (2.5):** DPR ≤ 1,5, `visibilitychange` para el rAF, contexto perdido → poster, primer frame > 80 ms → poster: todo como en la v1. La regla del `texImage2D` a 960 no aplica: no hay textura de vídeo.

---

## La entrega

- Publicado: https://faro-digital.pages.dev/test/faro/ (v2) y https://faro-digital.pages.dev/test/faro-v1/ (v1 congelada, para el test de dos pestañas de la sección 3). El despliegue sube `publicar/` entera, que antes de tocarla coincidía con producción en las 15 páginas (`comparar-publicado.py`): lo único nuevo son las dos carpetas de test.
- **Vídeo del gesto**: `_capturas/gesto-v2-escritorio-1440.mp4`, 12 s a 30 fps, de arriba al pie (6 s) y vuelta (6 s) con la curva continua. Fotogramas reales de la página con el reloj del navegador **controlado** (`page.clock`): cada fotograma avanza exactamente 1/30 s de tiempo de página, así el agua va a la velocidad a la que va en pantalla y no a la de SwiftShader. Tres fotogramas sueltos `-ini`, `-pie`, `-fin`.
- Medidas: `_capturas/v2/fps-v2-final.json`, `_capturas/v2/contraste-tormenta-v2.json`, y las secuencias `sec2-izq-T100.png` (tormenta) y `calma-izq-T000.png` (calma).

## En qué se parece a las olas de verdad, y en qué no

*(Mirando el vídeo del gesto, no los números.)*

**Se parece** en tres cosas, y son las tres que Zyad echaba de menos. **El scroll manda**: al bajar el mar sube —la ola de la base crece, el agua trepa por el espigón, la espuma rompe contra la torre— y al subir se calma, y se calma más despacio de lo que se enfureció (en el vídeo: a 1.144 px de scroll, 0,147 bajando y 0,153 subiendo por la inercia asimétrica). **El movimiento tiene dirección**: ya no es un temblor de arriba abajo; la ola de la base se hincha y se retira con un ritmo lento y pesado, y en la calma el agua deriva hacia el faro. **Y el faro acompaña la página entera**: el mismo mar bajo las seis secciones y el pie, sin corte ni degradado, con la tormenta al máximo justo donde está el CTA.

**No se parece** en lo que una foto no puede dar por mucho que se la empuje: **las crestas no viajan ni nacen nuevas**. En el mar de verdad una ola se forma lejos, avanza, se curva, rompe y su espuma se esparce y se disuelve; aquí la ola de la base es siempre *la misma ola* —la que la foto tiene congelada— que se hincha, brilla y se retira en el sitio. El tren de olas que converge en la torre se nota como un oleaje que respira hacia ella, no como olas que llegan. Y la textura, a tormenta plena, sigue teniendo en el agua abierta ese aire de **vidrio líquido** (bandas que ondulan) que delata que debajo hay una imagen desplazada, aunque a 0,012 sea la mitad de gelatina que con 0,022. El horizonte no se mueve nunca, y en un temporal de verdad el horizonte se rompe.

Lo honesto: **es una fotografía de tormenta cobrando vida, no el mar.** Está a medio camino entre el temblor de la v1 y un clip real. Que ese medio camino valga un 8,5 o un 7 lo decide Zyad con el vídeo delante —`_capturas/gesto-v2-escritorio-1440.mp4`— y no yo con los números; y si no llega, la salida no es apretar más el shader: es el clip que se mueva de verdad, para el que el hueco ya está marcado.

---

`→ ZYAD: cambia a Opus 5.`

---
---

# `/test/faro` · v2 · Sección 1 · La página entera sobre la escena · [OPUS 5]

**Fecha:** 04-sep-2026 · **Fila:** B16 · **Estado: hecha y medida, sin publicar.** La v1 queda congelada en `faro-digital-web/test/faro-v1/`.

> **Lo que pedía la sección 1, y lo que hay.** El `<canvas>` y el poster salen del hero y pasan a ser un marco fijo detrás de todo `<main>`; las seis secciones se parten en dos columnas de mar vacío; detrás de cada bloque va una reserva legible; y por debajo de 1024 px la página sigue siendo la v1, píxel a píxel. Todo comprobado con medidas, no de vista.

---

## 1 · Lo que se ha hecho

**1.1 · La escena fija.** `.escena-fondo` es ahora el primer hijo del `<body>`, `position: fixed; inset: 0; z-index: 0`, con `<main class="pagina">` por delante en `z-index: 1`. El faro está en el mismo sitio de la pantalla desde el hero hasta el pie. Se han quitado, a partir de 1024 px: el fondo sólido de las secciones 3-6, el degradado de 20 vh entre la 2 y la 3, el fondo del cierre y la franja de 20 vh que había sobre el pie. **Y con ellos se ha ido el vídeo vertical del cierre**, que ya no pinta nada: son 165,6 KB menos (121,0 del `.webm` y 44,6 del poster).

Tres decisiones que no estaban en el prompt y hacían falta:

- **`.pagina` lleva `z-index` y nada más.** Ni `isolation`, ni `filter`, ni `opacity`: cualquiera de los tres crea un *backdrop root*, y dentro de él un `backdrop-filter` solo ve lo que se pinta dentro del contenedor, no el mar de detrás. Por lo mismo se le ha quitado `isolation: isolate` a `.cierre-escena`, que lo llevaba desde el paso 4 de la v1 — con él puesto, las reservas del cierre y del pie desenfocaban la nada.
- **El zoom de entrada se ha mudado a una capa de dentro** (`.escena-zoom`), y el marco recorta. Con el `scale(1.06)` en el propio marco —que es quien recorta— por debajo de 769 px, donde el marco es absoluto, la foto se salía de la pantalla: **de 7 a 17 px de barra horizontal** que la v1 no tenía. De paso, `pieza.js` vuelve a medir un rectángulo sin transformar; midiendo el marco escalado, el lienzo salía un 3,9 % más grande durante los primeros 9 s.
- **El hero se queda sin `overflow: hidden` ni `isolation`.** Los dos existían para contener el `z-index: -1` del fondo, y ya no hay fondo dentro.

**1.2 · Dónde va el texto.** Doce columnas; el texto vive en la 1-5 y en la 8-12, y nunca sobre la torre. El margen está medido, no supuesto: el borde izquierdo de la torre es `--k-torre` = `min(50vw − 6.02dvh, 46.6vw)`, que a 1440 cae en **666 px** con la columna 5 acabando en 595, y a 1024 en **458** con la columna acabando en 422.

| Sección | Columna izquierda | Columna derecha |
|---|---|---|
| Método | cabecera + fases 1-3 | fases 4-5 |
| Trabajo | casos 01-03 | **cabecera** + casos 04-06 + los dos enlaces |
| Precios | cabecera + «Tu web, una vez» | «Y cada mes» + la letra pequeña |
| Cierre | cabecera + las cuatro respuestas | «Gratis y sin compromiso» + CTA |
| Pie | *(vacía: mar)* | los tres bloques + la línea legal |

**El orden del DOM no se ha tocado**: la cabecera va primero, y luego 1-2-3-4-5-6. Las columnas solo **colocan**. Por eso la cabecera puede irse a la derecha en Trabajo sin que el orden de lectura ni el de tabulación se inviertan — no hay nada enfocable dentro de una cabecera de sección. La columna que no lleva la cabecera empieza arriba del todo, y eso es lo que da el zigzag que pedía el punto 1.4.

Y una simplificación que hacía falta antes de poder escribir nada de esto: **la fila apilada pasa a ser la forma por defecto** —es la que vale dentro de una columna de 5 y la que ya se usaba en móvil— y la rejilla ancha de 12 columnas de la v1 vive ahora en un único sitio, la banda `769-1023 px`. Antes estaba escrita dos veces, una en el cuerpo del archivo y otra invertida en el corte de 768, y las dos tenían que cambiar a la vez.

**1.3 · La reserva legible.** `rgb(25 38 34 / .62)` con `backdrop-filter: blur(14px)` y los bordes fundidos en 48 px por `mask-image` + `mask-composite: intersect`. Sin borde, sin radio. Va en un `::before` de cada `.col` y de cada `.seccion-cab`; **cuando la cabecera y su columna caen del mismo lado, las dos reservas se tocan justo en el centro del hueco de 3 rem, sin solaparse** —dos capas translúcidas superpuestas dejan una banda más oscura— y sin fundido en el borde por el que se juntan. Se leen como una sola sombra.

**1.4 · Ritmo.** El fondo cambia solo (lo hará la sección 2: calma arriba, tormenta abajo) y la reserva alterna de lado: Método a la izquierda, Trabajo a la derecha, Precios a la izquierda, y el cierre a la izquierda con su CTA y el pie de contrapeso a la derecha — que es lo que fija el punto 1.2. Nada más se ha añadido.

**1.5 · Fallbacks.** Comprobados uno a uno, mirando qué se descarga:

| | Lienzo | Poster | Vídeo del mar | Vídeo del cierre |
|---|---|---|---|---|
| 1440 normal | `viva:w` | `faro-w.webp` | listo, sin pedir (lo enciende la §2) | — |
| 1440 `reduced-motion` | apagado | `faro-16x9.webp` | **ni un byte** | **ni un byte** |
| 1440 sin WebGL2 | apagado, queda el poster | `faro-w.webp` | — | — |
| 1024 | `viva:w` | `faro-w.webp` | listo | — |
| **1023** | `viva:w` | `faro-w.webp` | **ni un byte** | `cierre-1280.webm` |
| 390 | `viva:m` | `faro-m.webp` | ni un byte | ni un byte |

El corte es exacto: a 1024 la página es la v2 y a 1023 es la v1. Lo garantizan dos cosas a la vez, no una: `preload="none"` en el `<video>` y `media="(min-width: 1024px) and (prefers-reduced-motion: no-preference)"` en sus dos `<source>`, así que **por debajo de 1024 no hay fuente que coincida y no se descarga nada aunque JavaScript llame a `load()`**.

---

## 2 · Los números

**Contraste, contra las olas de verdad en su fotograma más claro.** 512 bloques de texto medidos a 1024, 1440 y 1600 px, en once alturas de scroll cada uno:

| | Bloques | Peor | Pide | Fallos |
|---|---|---|---|---|
| 1024 px | 170 | **8,07:1** | 4,5 | 0 |
| 1440 px | 171 | **8,06:1** | 4,5 | 0 |
| 1600 px | 171 | **8,18:1** | 4,5 | 0 |

**Cero fallos, con 1,8 veces de margen sobre AA.** El peor bloque es el párrafo del cuarto bloque de la oferta, que no lleva reserva.

Se mide con una herramienta nueva, `Utilidades/contraste-sobre-escena.py`, porque **ni `puertas.py` ni `verificar-publicado.py` podían medir esto**: los dos reutilizan `ILEGIBLE`, que compone alfas de colores de CSS y **se calla cuando el fondo es una foto, un vídeo o un lienzo**. En una página cuyo fondo entero es una escena viva, las dos daban verde sin haber mirado el único sitio donde puede fallar. El peor caso se fabrica con `test/faro/peor-caso-tormenta.js`: pone `hero-1280.webm` a pantalla completa y lo para en su fotograma con más espuma de los cinco segundos. Es **una cota superior** de lo que hará la sección 2, que solo mete el vídeo dentro de la máscara del mar.

**🔴 Y un dato que la sección 2 tiene que tener delante antes de tocar la reserva: la reserva no está subiendo el contraste.** Medido con y sin ella sobre el mismo fotograma: **8,04:1 sin reserva y 7,92:1 con ella.** El velo `rgb(25 38 34 / .62)` es casi del color del mar de esta fotografía, así que sube el suelo tanto como baja el techo. Lo que sí hace, y se ve en la desviación típica de los píxeles de detrás de un bloque del pie, es **aplanar la textura del agua: σ 9,4 → 3,6**. Eso no lo mide WCAG y es la mitad del motivo por el que un texto sobre agua en movimiento se lee mal.

Y el desglose de lo que cuesta, por si en la sección 2 los fps aprietan: del salto de σ, **el velo aporta 4,3-6,3 de diferencia RGB y el `blur(14px)` aporta 0,5-0,6**. Si hay que quitar algo, **se quita el desenfoque, no el velo** — y eso es una medida, no una opinión.

**Peso.** A 1440 px, recorriendo la página entera:

| | Archivos de media | KB |
|---|---|---|
| v1 | 10 | **278,4** |
| v2 (hoy) | 8 | **112,7** |
| v2 con el vídeo del mar encendido (§2) | 9 | **178,9** |

Se van los 165,6 KB del cierre y entra el `hero-1280.webm` de 66,2: **99 KB menos que la v1**, con la tormenta dentro.

**La v2 no ha empeorado nada por debajo de 1024 px.** Con el shader apagado y las transiciones apagadas, capturando la página entera y comparando píxel a píxel contra la v1:

| Ancho | Alto de la página | Píxeles distintos |
|---|---|---|
| 900 px | idéntico (8.407) | 0,065 % |
| 768 px | idéntico (11.501) | 0,009 % |
| 390 px | idéntico (12.068) | 0,043 % |

Las diferencias que quedan están todas dentro de la primera pantalla y son del propio poster (un píxel de desplazamiento por el redondeo del `object-position` en una caja fija en vez de absoluta). Ni un bloque de texto se mueve. Y el desbordamiento horizontal, medido a 320, 360, 390, 430, 768, 900, 1024, 1440 y 1600: **igual que la v1 en los nueve** (los 13 px de 320 px son el botón «Menú», que ya venían de la v1).

---

## 3 · Lo que he encontrado y NO he tocado

**🔴 La cabecera fija pisa el texto de la sección 2, y ya pasaba en la v1.** A 1440 px, con la página a 1390 px de scroll, «Faro Digital» cae encima de «Web que mide» y «Pide tu Foto del Día 0 — gratis» encima de «Los ocho canales». **Es idéntico en `/test/faro-v1/` y en `/test/faro/`** — está en la captura `_capturas/v2/cabecera-choque-1390.png`, la v1 arriba y la v2 abajo. La causa es que la rejilla de `.oferta` reserva `--k-cabecera` = 2,25 rem para la cabecera y la cabecera real mide unos 91 px con su margen.

No lo he arreglado a propósito: es un defecto de la v1, arreglarlo obliga a tocar la rejilla de la portada —lo único que en la v1 ya gustaba— y no está en el encargo de la sección 1. Queda decidido por Zyad, y el arreglo es una línea.

**Y un falso positivo que conviene conocer antes de creerse un número.** La primera pasada del medidor daba un bloque por debajo de AA a 1024 px («Tres restaurantes excelentes…», 1,54:1). No era el mar: era **el subrayado del CTA de la cabecera fija**, que queda por encima de ese titular cuando el bloque asoma por el borde de arriba de la pantalla. Con una rueda de ratón de verdad la cabecera se retira al bajar —comprobado, y en la v1 igual— y el choque no ocurre; con el `scrollTo` del medidor, no. Se anota porque el medidor mide con `--ambito main` y **la cabecera está fuera de `main`**: cualquier capa fija cuenta como fondo, que es correcto, pero hay que leerlo sabiéndolo.

---

## 4 · Lo que la sección 2 se encuentra hecho

1. **El `<video class="mar-video">` ya está en el DOM**, dentro de `.escena-fondo`, con las dos fuentes (`hero-1280.webm` 66,2 KB y `.mp4` 148,9 KB) y `preload="none"`. Está a `opacity: 0` y **no a `display:none` ni `visibility:hidden`, a propósito**: un vídeo que no se pinta puede dejar de decodificar fotogramas, y entonces `texImage2D` sube siempre el mismo. Falta encenderlo: `load()` después del LCP y el fundido cuando `readyState >= 3`.
2. **`pieza.js` sigue siendo el de la v1**, con tres cambios mínimos para que no se apagara: mide y observa `.escena-fondo` en vez del hero, y añade `visibilitychange`. El punto 2.1 (`tormenta`) y todo lo demás está por hacer.
3. **La opacidad de la reserva es un token**, `--k-reserva`, en `:root` de `faro.css`. Con la tormenta real medida, se sube ahí y en ningún otro sitio.
4. **El peor caso y el medidor están escritos y probados.** Para repetir la medida:

```bash
python "C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\03-Recursos-Internos\Utilidades\contraste-sobre-escena.py" "C:\Users\zyadb\Desktop\IA\faro-digital-web" --ruta /test/faro/ --ambito main --anchos 1024 1440 1600 --peor-caso "C:\Users\zyadb\Desktop\IA\faro-digital-web\test\faro\peor-caso-tormenta.js"
```

5. **⚠️ El riesgo que hay que medir en la sección 2:** hay **nueve `backdrop-filter: blur(14px)`** sobre un lienzo WebGL que ahora dibuja en toda la pantalla y en todo el scroll. Es el candidato número uno a comerse los 60 fps con CPU ×4, y por eso está arriba el desglose de qué aporta el velo y qué aporta el desenfoque.
6. **Publicar exige copiar a `Sitio-Web/`.** `python faro-digital-web/test/faro/sincronizar-publicacion.py` para la v2 y `python faro-digital-web/test/faro-v1/sincronizar-publicacion.py` para la v1 congelada, que hace falta publicada en `/test/faro-v1/` para el test de dos pestañas de la sección 3. Después, desde `Sitio-Web/`: `npx wrangler pages deploy --project-name=faro-digital --branch=main --commit-dirty=true`.

---
---

# `/test/faro` · v1 · Sección 2 · La pieza · [FABLE 5.1 · High]

> **Esta es la v1, la que Zyad puntuó 6,7.** Se conserva entera: es el registro de cómo se construyó el shader que la v2 sigue usando como estado de calma. La página congelada vive en `test/faro-v1/`.

**Fecha:** 04-sep-2026 · **Fila:** B15 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**, como dice el prompt.

Motivo: pieza firma del faro sobre la página del test. Techo 300 KB (texturas incluidas), 60 fps en Android de gama media, DPR ≤ 1,5.

## Las tres líneas que pide la entrega

**Qué decidí.** El poster del hero pasa a ser **la misma textura que dibuja el shader** (`faro-w` / `faro-m`), y no el fotograma del vídeo: así cuando el canvas se enciende no cambia ni un píxel, y si no se enciende nunca lo que queda es la pieza quieta. La máscara sube a la GPU con **dos canales**: R la máscara tal cual, G la misma desenfocada (radio 3 % del ancho, calculada en JavaScript al cargar), que el shader usa como «distancia a la estructura» para que el agua pegada a la torre y al espigón apenas se mueva. Y el ruido evoluciona **en el sitio**: cada capa son dos muestras que viajan en sentidos opuestos y se promedian, en vez de una sola que se traslada.

**Qué descarté.** Tocar el resto de la página (ni un selector fuera del fondo del hero). Cualquier ruido 3D o FBM de más capas: dos capas 2D bastan y a 60 fps con CPU ×4 no había motivo para gastar más. El nivel del mar al +6 %: se queda en **+5 %**, porque el sexto por ciento solo servía para forzar la costura del espigón que la atenuación por distancia acababa de quitar. Y el plan B: no hizo falta.

**Dónde me atasqué.** Dos veces, y las dos se vieron mirando, no midiendo. La primera versión desplazaba el agua con la misma fuerza hasta el borde mismo del espigón, y **el agua se cortaba contra la piedra**: una costura, y el oleaje leía como textura deslizando. La segunda, en móvil, **derretía los bloques de piedra del borde del espigón**, porque el polígono de la máscara era más estrecho que el espigón real en la parte baja (0,255-0,750 cuando la piedra llega de 0,10 a 0,90). Los fps, el primer frame y el porcentaje de píxeles que cambian daban bien en las dos.

## Qué hay

**Un plano y un shader.** WebGL2 a mano, sin librerías, 17,1 KB de JavaScript. Un triángulo que cubre la pantalla, dos texturas, y un fragment shader con:

- **Oleaje** (periodo 6 s) y **rizo** (1,2 s), ruido simplex 2D escrito en el propio shader. Desplazan las UV solo donde la máscara es blanca; fuera, la foto se dibuja tal cual. **El faro, el espigón y el cielo no se mueven nunca**, y se comprueba así: el desplazamiento se multiplica por la máscara al cuadrado y por la distancia a la estructura, y además se recorta a cero si en el destino la máscara es negra.
- **Nivel**: de −3 % a +5 % de la altura, atenuado en la franja del horizonte por el degradado de 24 px de la máscara.
- **Espuma**: donde la foto ya es clara (luminancia > 0,34 en escritorio, > 0,40 en móvil), el rizo va ×1,6. No se pinta espuma nueva.
- **Reflejo de la linterna**: una columna de oro `#C9A667` anclada a la x de la linterna de `direccion-arte.md`, que se ensancha y se apaga al alejarse del horizonte y se rompe con el oleaje. La linterna respira al 3 % en 8 s con la curva continua del sistema. Es lo único que brilla.

**Control.** Escritorio: el puntero, abajo = mar alto y rizo ×2,5, con una deriva lateral leve. Móvil y táctil: el progreso de scroll de la escena de 200vh (o hasta el final de la sección 2 donde no hay escena sticky). Sin ninguno durante 3 s: respiración de 8 s. Todo con inercia, lerp 0,06 por frame, nunca directo.

**Contrato de escena, cumplido y comprobable.** DPR ≤ 1,5 (el canvas mide 585×1266 en un móvil de DPR 3). `requestAnimationFrame` solo con el hero en viewport, por `IntersectionObserver`. Arranca **tras `load` + 300 ms**. El primer frame se cronometra con `gl.finish()` y se escribe en `data-primer-frame-ms`: si pasa de 80 ms, se queda el poster. Sin WebGL2, shader que no compila, texturas que no llegan o contexto perdido → se queda el poster y el motivo queda en `data-pieza`. Con `prefers-reduced-motion` este archivo no hace nada y manda el `<video>` de 5 s.

**Las dos escenas tienen constantes distintas**, leídas de `direccion-arte.md`: la de móvil (torre clara, olas grandes) lleva rizo mayor, reflejo menor y umbral de espuma más alto.

## Los números

| | Escritorio 1440×900 | Móvil 390×844 |
|---|---|---|
| **La pieza** (js + textura + máscara) | **52,3 KB** de 300 | **43,4 KB** de 300 |
| Página, primera pantalla | 214 KB | 205 KB |
| Página, total recorrido | 457 KB | 327 KB |
| Primer frame del shader | 0,5 ms | 0,4 ms |
| **fps con CPU ×4**, 4 s moviendo el puntero / el scroll | **60,2** · 0 frames > 50 ms | **60,2** · 0 frames > 50 ms |
| fps recorriendo la página entera, CPU ×4 | 60,1 | 60,1 |
| LCP en 4G + CPU ×4 | 1,91 s | 1,68 s |
| INP con CPU ×4 | 48 ms | 48 ms |
| CLS | 0,0021 | 0 |
| Contraste del cierre | — | 17 bloques, cero fallos |
| Tamaños de letra distintos | 5 | 5 |
| Píxeles del hero que cambian cada 0,4 s (agua en reposo) | 2,0 % | 1,8 % |

**Sobre el «Android de gama media».** Los fps se han medido en el Chrome instalado con emulación móvil y **CPU ×4**, pero la GPU es la de este PC (AMD Radeon integrada, vía ANGLE/D3D11). El shader hace 4 muestras de ruido y 3 lecturas de textura por píxel a 585×1266: es ligero, pero **el 60 fps en un Android real no está medido**. Es lo primero que debe comprobar Zyad en la sección 3, con el móvil en la mano. Si no va, el contrato ya recorta solo el DPR a 1,5 y el primer frame lento apaga la pieza.

## La entrega

- Publicado: https://faro-digital.pages.dev/test/faro/ (verificado en vivo: página, `pieza.js`, las dos texturas y las dos máscaras, todo 200).
- Vídeos del gesto, 6 s a 30 fps, fotogramas reales del hero con el mismo método que `grabar-escena.py` (un gesto por fotograma) y el Chrome con GPU real:
  - `_capturas/gesto-escritorio-1440.mp4` (634 KB): el ratón baja de arriba a abajo.
  - `_capturas/gesto-movil-390.mp4` (1.000 KB): el scroll baja una pantalla.
  - Y tres fotogramas sueltos de cada uno (`-ini`, `-mitad`, `-fin`) para mirar sin reproducir.
- Fotogramas de estado: `_capturas/pieza-1440x900-puntero-{arriba,medio,abajo}.png` y `pieza-390x844-scroll-{0,medio,1}.png`.
- Medidas: `_capturas/prueba-pieza.json` (la pieza) y `_capturas/medidas-pieza.json` (la página).

## Lo que la sección 3 tendrá que juzgar, y yo no puedo

Si **lee como agua** a ojo humano, con el ratón y con el dedo. Mi criterio de parada era «gelatina o textura deslizando»: las dos cosas aparecieron en la primera versión y las dos están corregidas en los fotogramas, pero un fotograma no es un gesto. Los dos vídeos están para eso, y el móvil real, para los fps.

---

## ⬜ Android real — lo rellena Zyad

Es el único número del contrato de escena que no se puede medir aquí: no hay dispositivo. Todo lo demás está comprobado.

**Cómo:** abrir https://faro-digital.pages.dev/test/faro/ en el móvil, y **bajar despacio desde arriba** para ver subir el mar alrededor del faro. Cinco segundos bastan.

```
Android real:  [modelo]  ·  [fluido / tirones]
```

Si dice **tirones**, no hay que tocar el shader a ciegas: el contrato ya recorta el DPR a 1,5 y apaga la pieza si el primer frame pasa de 80 ms. Lo que hay que hacer es leer `data-pieza` y `data-primer-frame-ms` del `<canvas>` en ese teléfono, que dicen si la pieza llegó a arrancar y cuánto tardó. Si arrancó y va a tirones, la salida es bajar el rizo (la capa fina de ruido es la cara) antes que quitar nada.
