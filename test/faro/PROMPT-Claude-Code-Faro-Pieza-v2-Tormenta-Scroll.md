# PROMPT · Claude Code · `/test/faro` v2 · la tormenta que sube con el scroll, en toda la página

**Fila:** B16 · **Fecha:** 04-sep-2026 · **Duración:** una tarde larga · **Solo escritorio (≥ 1024 px)**; móvil se decide después · **Modelos:** Opus 5 (secciones 1 y 3), **Fable 5.1 High** (sección 2)

> **Por qué.** Zyad ha puntuado la v1 con 6,7 y ha dicho por qué, y las tres razones mandan sobre cualquier regla anterior de la pieza:
> 1. «Cuando mueves el ratón las olas van de arriba abajo, pero no es un movimiento natural de olas.»
> 2. «No bajan cuando haces scroll; solo se mueven con el ratón. Lo que queremos es que las olas suban y se rompan contra el faro cuando bajas, y que al subir vuelvan a ser tranquilas.»
> 3. «Este efecto tiene que estar en toda la web; ahora solo se ve en dos o tres pantallas y después es un fondo simple.»
>
> **La decisión técnica.** Desplazar una foto no da olas: da gelatina. Las olas reales ya existen: `hero-1280.webm` (5 s, el mar rompiendo contra la base, faro y cámara quietos). La v2 es **híbrida**: la foto con un rizo leve es el estado *calma*; el vídeo real es el estado *tormenta*; el scroll gobierna la mezcla, la velocidad del vídeo y el nivel del agua. Y la escena es **fija detrás de toda la página**: las secciones pasan por delante del faro.
>
> **La meta.** Zyad vuelve a puntuar. Objetivo ≥ 8,5. Se mide también con las puertas de siempre.

---

## 0 · Material

- `test/faro/` v1 completa (canvas, shader, máscaras, texturas, `NOTAS-pieza.md`, `Recetas/pieza-firma-shader.md`).
- `test/kaito/media/hero-1280.webm` (65 KB) y `.mp4` (145 KB): el vídeo de las olas. `test/faro/media/scrub/` (keyframes cada 0,5 s, 187 KB webm): sirve si hace falta saltar en el tiempo.
- Copy y secciones: las de la página, sin tocar una palabra.

---

## 1 · La página entera sobre la escena [OPUS, 45 min]

**1.1 Escena fija.** El `<canvas>` y el `<picture>` del poster pasan a `position: fixed; inset: 0; z-index: 0` detrás de todo el `<main>`. El faro está siempre en el mismo sitio de la pantalla, de la primera sección al pie. Se quita el fondo sólido `rgb(25,38,34)` de las secciones 3-6 y el degradado de 20 vh entre la 2 y la 3: ya no hay «después del vídeo».

**1.2 Dónde va el texto.** Toda la página usa la geometría del hero: el texto vive en las **columnas de mar vacío** a izquierda y derecha del faro (cols 1-5 y 8-12), nunca sobre la torre ni sobre la linterna. Las secciones que hoy ocupan las 12 columnas (Método, Trabajo, Precios) se **parten en dos columnas** con la misma receta: Método → fases 1-3 a la izquierda, 4-5 a la derecha; Trabajo → tres casos por lado, miniatura + titular + cifras apilados en 5 columnas; Precios → «Tu web, una vez» a la izquierda, «Y cada mes» a la derecha; Cierre → título y respuestas a la izquierda, CTA y pie a la derecha. Las líneas finas separan filas dentro de cada columna. Cinco tamaños, sin añadir ninguno.

**1.3 Reserva legible.** El agua tiene espuma clara y el texto no puede fallar AA en ningún punto del scroll. Detrás de cada bloque de texto va una **reserva**: `rgb(25 38 34 / 0.62)` con `backdrop-filter: blur(14px)` y bordes en degradado de 48 px (`mask-image`), sin borde ni radio visible; no es una tarjeta, es una sombra donde se posa el texto. Se mide el contraste con la tormenta al máximo (sección 6) en p98 y se sube la opacidad de la reserva hasta que los 27 bloques den AA.

**1.4 Ritmo.** El jurado penalizó «un solo fondo de principio a fin». Aquí el fondo cambia solo: calma arriba, tormenta abajo. Además, la **reserva alterna de lado** por sección (izquierda, derecha, izquierda…), y el pie va con la tormenta al máximo y la linterna reflejada. Nada más se añade.

**1.5 Fallbacks.** `prefers-reduced-motion` → poster fijo detrás de todo, mismas reservas. Sin WebGL2 → igual. El vídeo se carga con `preload="auto"` solo desde 1024 px y solo tras el LCP; hasta que `readyState ≥ 3`, la escena es la v1 (foto + rizo) para que nada quede negro.

`→ ZYAD: cambia a Fable 5.1 (High). Pega la sección 2 y test/faro/NOTAS-pieza.md.`

---

## 2 · La pieza v2 [FABLE 5.1 · techo 400 KB con vídeo · 60 fps con CPU ×4]

Primera línea: «Motivo: pieza firma v2, tormenta gobernada por scroll. Zyad puntuó la v1 6,7: olas no naturales, el scroll no manda, el efecto se acaba en la tercera pantalla».

**2.1 Un solo parámetro: `tormenta` ∈ [0, 1].** Sale del progreso de scroll de toda la página (0 arriba, 1 en el pie), con inercia asimétrica: sube con lerp 0,05 (la tormenta crece despacio) y baja con lerp 0,03 (calmarse tarda más). El ratón deja de gobernar: solo añade una deriva lateral leve del oleaje (`pointerX`, ±2 %) para que la pantalla responda. Sin scroll, respiración de 8 s en el estado que toque.

**2.2 Tres cosas que `tormenta` gobierna, a la vez:**
- **Mezcla foto → vídeo** dentro de la máscara del mar. El vídeo va como textura WebGL (`texImage2D` desde el `<video>` cada frame mientras `readyState ≥ 3`). `tormenta` 0 → 0,25: solo foto con rizo leve. 0,25 → 0,6: fundido al vídeo. > 0,6: vídeo puro. Fuera de la máscara, siempre la foto (el faro no se mueve, y así el vídeo tampoco lo mueve). El primer fotograma del vídeo es la foto, así que el fundido no salta.
- **Velocidad del vídeo.** `playbackRate` de 0,45 (calma, casi quieto) a 1,0 (tormenta). Bucle sin costura: dos `<video>` con el mismo clip, desfasados 2,5 s, y un crossfade de 0,4 s al final de cada uno en el shader; o `scrub/` con salto por `currentTime` si sale más limpio. Elige uno y anota por qué.
- **Nivel y rotura.** Desplazamiento vertical de la línea de agua de 0 a +7 % de la altura, con la atenuación en el horizonte que ya existe. En la **base de la torre** (radio de 12 % alrededor de la coordenada de la base en `direccion-arte.md`), un aumento de brillo y de rizo proporcional a `tormenta²`, con ruido de alta frecuencia y umbral, para que la espuma «rompa» ahí y no en todo el cuadro. Sin partículas ni sprites: brillo y umbral sobre el propio píxel.

**2.3 El rizo de calma, mejorado.** Para `tormenta` < 0,25, el rizo de la v1 pasa a **advección direccional**: las UV se arrastran hacia el faro (vector fijo, ~0,004/s) con dos fases desfasadas medio periodo y mezcla triangular, para que no se vea deslizar la textura. Es el único cambio al shader de la v1.

**2.4 La luz.** El reflejo de la linterna se deforma con la mezcla foto/vídeo (usa la misma UV desplazada) y su intensidad sube un 25 % con `tormenta`. La respiración del 3 % se mantiene.

**2.5 Contrato.** DPR ≤ 1,5; `requestAnimationFrame` solo con la pestaña visible (escena fija → siempre en viewport; pausa con `visibilitychange`); vídeo `muted playsinline loop`; si el `texImage2D` del vídeo baja de 55 fps sostenidos en CPU ×4, se reduce la textura de vídeo a 960 y se anota. Pérdida de contexto → poster.

**2.6 Prohibido.** Rayos, lluvia, partículas, segundo objeto, librerías, mover el faro, tocar el copy, un scroll secuestrado (nunca `scroll-snap`, nunca `preventDefault` sobre la rueda).

**2.7 Criterio de parada.** Si a las tres horas la mezcla foto/vídeo se nota (halo, doble imagen, salto de bucle), se entrega **vídeo puro dentro de la máscara** con `playbackRate` y nivel gobernados por `tormenta`, sin fundido a foto. Sigue siendo una v2 válida.

**2.8 Entrega.** Publicado; vídeo de 12 s del gesto en escritorio (scroll de arriba al pie y vuelta) con `grabar-escena.py`; fps con CPU ×4 en tres puntos (arriba, medio, pie); KB del vídeo cargado y de la página; contraste de los 27 bloques sobre la tormenta al máximo; y en `NOTAS-pieza.md`, v2: qué decidió, qué descartó, dónde se atascó, y **en qué se parece y en qué no a las olas de verdad**, mirando el vídeo del gesto, no los números.

`→ ZYAD: cambia a Opus 5.`

---

## 3 · Medir y puntuar [OPUS, 30 min]

- Puertas: peso (techo 1,2 MB), LCP, INP, CLS, fps en los tres puntos, contraste con tormenta al máximo, cinco tamaños.
- Test de dos pestañas contra la v1 (guardada como `/test/faro-v1/`): ¿cuál lee como agua? Una línea.
- `ZYAD`: baja hasta el pie despacio, sube despacio, y puntúa de 0 a 10 con una frase por cada una de sus tres quejas de la v1: ¿olas naturales?, ¿el scroll manda?, ¿el faro acompaña toda la página? Meta ≥ 8,5. Si queda entre 7,5 y 8,5, una ronda de cinco cambios dictada por Zyad y se cierra. Por debajo de 7,5, se anota qué falla y se decide si es de técnica o de imagen.

**Móvil:** no se toca hoy. La v1 sigue sirviendo en < 1024 px (foto + rizo + scroll manda el nivel). Se decide cuando la de escritorio esté aprobada.

---

## 4 · Lo que se guarda

- `Recetas/pieza-firma-shader.md` v2: la mezcla foto/vídeo como textura, el parámetro único `tormenta`, la inercia asimétrica, la reserva legible.
- `Gestos/tormenta-que-sube-con-el-scroll.md`.
- `PROCEDIMIENTO-N3.md`, paso 11: «la pieza se puntúa por quien la va a enseñar, con tres preguntas concretas, antes de darla por hecha».
