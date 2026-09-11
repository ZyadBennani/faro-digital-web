# TRASPASO · Pieza firma «Faro» v3 + procedimiento reproducible

**Fila:** B17 · **Fecha:** 09-sep-2026 · **Para:** sesión nueva de claude.ai (este proyecto) y sesión nueva de Claude Code · **Modelos:** Fable 5.1 High construye (secciones 2-3), Opus 5 mide y documenta (secciones 1 y 4)

> Pega este archivo entero como primer mensaje en la sesión nueva de claude.ai. Para Claude Code, la primera línea está al final.

---

## 0 · Dónde estamos (para no volver a explicarlo)

- **La página:** https://faro-digital.pages.dev/test/faro/ (noindex). Es la página del test «método Kaito» (archivado, 7,29 en jurado) con la **pieza firma** en la portada: un faro fotográfico con el mar gobernado por el scroll. Código en `faro-digital-web/test/faro/` (`index.html`, `faro.js`, `pieza.js`, `kaito.css`, `media/`), notas en `NOTAS-pieza.md` (v1 → v2.4, todas las medidas), receta en `Recetas/pieza-firma-shader.md`, gesto en `Gestos/tormenta-que-sube-con-el-scroll.md`, escena fija con reservas de texto y secciones en dos columnas.
- **Material real (Kling, 5 s cada uno, 1272×724, cámara y faro quietos, marca de agua quitada, keyframe cada 6 fotogramas para scrub):** `media/olas/calma-scrub-1280.webm` (302 KB, oleaje suave), `subida-scrub-1280.webm` (339 KB, **empieza en el último fotograma exacto del de calma** y acaba con una ola subiendo por la torre), `tormenta-1280.webm` (ola rompiendo a mitad, ya no se usa en escritorio). Más los `.mp4` para Safari y los pósters. Originales en `media/olas/_original/`.
- **Cómo funciona la v2.4:** un parámetro `tormenta` ∈ [0,1] sale del scroll de toda la página; gobierna una **cadena de 10 s** (calma 0-5 s + subida 5-10 s) en **scrub** (`video.currentTime` fijado por el scroll, no por el reloj), con mapa no lineal (0-35 % de página → calma; 35-85 % → subida; 85-100 % → ola arriba quieta), lerp 0,12, cambio de `<video>` en la costura. Con `scrollY = 0`, calma en bucle a 0,8×. Fuera de la máscara del mar siempre la foto; nivel, rotura y rociada sintéticos ligados a `tormenta`. Fallbacks: sin WebGL2 o `reduced-motion` → foto; móvil (< 1024 px) → v1 (foto + rizo).
- **Lo que ya sabemos que NO funciona:** desplazar la foto con ruido (gelatina); los «vídeos» de Canva (son fotos codificadas: se mide antes de usar nada); reproducir los clips solos y que el scroll solo elija cuál (no se siente el mando); empezar el scrub a mitad de página.
- **Puertas que se mantienen:** página ≤ 1,2 MB en escritorio, 60 fps con CPU ×4, LCP ≤ 2,5 s, AA en todos los bloques con la tormenta al máximo, cinco tamaños de letra, cero librerías.

## 1 · Lo que Zyad ve hoy (el brief de la v3)

Nota de Zyad a la v2.4: **mejora, pero falta mucho.** Tres quejas, en sus palabras:
1. «La calidad de las olas: no se mueven como queremos.»
2. «Las olas **desaparecen** cuando scrolleas y **vuelven a aparecer en segundos**.»
3. «Queda mucho.»

Y una condición que manda tanto como la pieza: **guardar el procedimiento completo para llegar aquí otra vez sin esfuerzo y sin prueba y error.**

## 2 · Diagnóstico previo (Opus, 45 min, antes de tocar nada)

Medir, no suponer. Tres hipótesis para la queja 2, en orden de probabilidad; se confirma o descarta cada una con un número:

- **H-A · Búfer de red.** Los webm se cargan con `preload="auto"` pero **no enteros**; al hacer scrub a un tramo no descargado, el `seek` espera a la red y el shader, mientras `readyState < 3` o `seeking`, vuelve a la foto → «las olas desaparecen y vuelven en segundos». Prueba: `video.buffered` al cargar y durante el gesto; y repetir el gesto con red limitada a 4G. Si es esto, la solución es **descargar cada clip entero como Blob** (`fetch` → `URL.createObjectURL`) antes de activar el scrub, y hasta entonces bucle de calma; el scrub nunca arranca sobre un vídeo a medio cargar.
- **H-B · Fallback durante el seek.** Aunque el clip esté entero, cada `seek` pasa por `seeking = true` unos ms; si el shader cae a la foto en ese estado, parpadea. Prueba: contar frames con `seeking` durante 10 s de gesto y ver qué dibuja el shader en ellos. Solución: **nunca dibujar la foto por estado del vídeo**; conservar la última textura subida y solo actualizarla en `requestVideoFrameCallback` cuando hay fotograma nuevo.
- **H-C · Cuantización.** El scrub va a 24 fotogramas/s y un scroll rápido salta 4-5 fotogramas; en pantalla se lee como corte. Prueba: registrar el salto máximo de fotograma por tick. Solución: **mezcla entre fotogramas consecutivos** en el shader (dos texturas, peso = parte fraccionaria del tiempo) y lerp asimétrico (0,12 bajando, 0,08 subiendo).

Para la queja 1 (calidad): comparar en pantalla, a la misma velocidad de scroll, los clips originales de Kling (1272×724, sin comprimir) contra los servidos (crf 40). Si la diferencia se ve, el techo de peso se negocia (la pieza es N4, techo 2,5 MB); si no se ve, el problema es de material y va a la sección 3.

Salida del diagnóstico: `NOTAS-pieza.md` → «v3 · diagnóstico», tres hipótesis con su número y su veredicto.

`→ ZYAD: cambia a Fable 5.1 (High).`

## 3 · La v3 (Fable, una tarde)

Primera línea: «Motivo: pieza firma v3. Zyad: las olas desaparecen al hacer scroll y vuelven en segundos, y la calidad del movimiento no es la que queremos. Diagnóstico en NOTAS-pieza.md v3».

1. Aplicar lo que el diagnóstico confirme de H-A, H-B y H-C. Los tres cambios son compatibles entre sí y baratos; si el diagnóstico no es concluyente, se aplican los tres.
2. **Material:** si la calidad no da con los dos clips actuales, la vía es **más y mejor vídeo**, no más shader: (a) un tercer clip de Kling que empiece en el último fotograma de `subida` (ola arriba) y la deje **caer y retirarse** (5 s), para que la cadena sea de 15 s y el tramo final de la página tenga su propio movimiento; (b) si se contrata Kling o Higgsfield, un clip de **10 s** directo desde la foto con el prompt de subida, que sustituye a calma + subida con una sola costura menos. Prompts y comandos de ffmpeg en la sección 4 del procedimiento. **Regla:** todo clip nuevo se mide antes de usarse (diferencia media entre primer y último fotograma en la zona del mar > 5/255; un mar de 5 s pesa > 150 KB).
3. **Móvil:** decidir por fin. Opción mínima que ya funciona: bucle de calma con el nivel del mar ligado al scroll (sin scrub). Opción completa: scrub con `calma-scrub-720` (≤ 120 KB) solo si el móvil real lo mueve a 60 fps; se prueba en el de Zyad antes de publicar.
4. Entrega como siempre: vídeo del gesto (bajar despacio, parar 2 s, subir; 15 s), fps en tres puntos con CPU ×4, peso, retardo rueda → fotograma, `buffered` al activar el scrub, y tres líneas en `NOTAS-pieza.md`.

`→ ZYAD: cambia a Opus 5.`

## 4 · El procedimiento (Opus, 1 h) — la parte que no se negocia

Archivo: `Marketing Digital/_Sistema/03-Recursos-Internos/Biblioteca-Referencias/Web/PROCEDIMIENTO-PIEZA-FIRMA.md`. Escrito para que una sesión nueva, con una foto nueva de otro cliente (una brasa, una lluvia, una tela), llegue a una pieza equivalente **sin prueba y error**. Se reconstruye desde lo que pasó en B15-B17, con lo que salió mal y por qué. Estructura obligatoria, cada paso con quién / cuánto / entrada / salida / comando o prompt literal:

1. **Cuándo hacer una pieza firma y cuándo no** (una por sitio; solo si la marca la pide; presupuesto N4). Y la regla de marca de Faro (nunca el faro tópico).
2. **Dirección de arte** de la superficie que se va a mover: qué se mueve (agua, luz, humo), qué no (objeto, cámara), paleta, luz única. Prompt de imagen en inglés con instrucciones negativas (el real del faro).
3. **Imagen:** Canva 16:9 y 3:4, elección por «espacio vacío para el texto», descarga desde IA Canva → Historique, nunca desde capturas.
4. **Vídeo real, no foto animada:** Kling image-to-video (Canva no anima: se midió). Créditos y coste real (66/día gratis; 40 por clip a 1080p 5 s; 720p si baja). Los prompts literales de calma, tormenta y **continuación** (último fotograma del clip anterior como inicio: es lo que hace posible la cadena). Máximo dos intentos por clip.
5. **Medir el movimiento antes de nada** (el script de diferencia de fotogramas, con umbrales). La trampa de los 45 KB.
6. **Compresión:** los comandos exactos: `delogo` para la marca de agua sin recortar el encuadre, `-g 6 -keyint_min 6` para scrub, crf por uso (38-40 scrub webm; 20-22 mp4 Safari), pósters = primer fotograma exacto, y el peso que dio cada uno.
7. **Máscara y texturas:** cómo se hace la máscara del mar (umbral + retoque del borde del objeto), los dos canales (máscara y máscara desenfocada), las coordenadas de la luz.
8. **El shader:** fuera de la máscara la foto; dentro, el vídeo como textura; el parámetro único `tormenta`; nivel y rotura sintéticos como complemento, nunca como base; la rociada (lo que es más claro que la foto entra del vídeo); DPR ≤ 1,5; contrato de escena (IntersectionObserver, `visibilitychange`, pérdida de contexto).
9. **Scrub:** cadena de clips continuos, mapa scroll → tiempo no lineal, lerp, cambio de vídeo en la costura, **Blob completo antes de activar**, última textura conservada durante el seek, mezcla entre fotogramas. Con los retardos medidos.
10. **Página entera sobre la escena:** escena fija, columnas de mar vacío, reservas de texto con `backdrop-filter` y borde en degradado, contraste medido con la tormenta al máximo, ritmo (la tormenta es el cambio de ritmo).
11. **Fallbacks y móvil:** la tabla completa (reduced-motion, sin WebGL2, < 1024 px, Safari sin webm, primer frame > 80 ms).
12. **Medición:** el banco (`grabar-escena.py` y sus tres trampas corregidas: ventana ocluida, dos viajes por tick, LCP con scroll), qué se mide y con qué puertas.
13. **La puntuación de Zyad:** tres preguntas fijas (¿natural?, ¿el scroll manda?, ¿acompaña toda la página?), meta ≥ 8,5, una ronda por versión.
14. **Lo que salió mal y no debe repetirse:** la tabla v1 → v3 con causa y solución (gelatina, Canva, bucle autónomo, scrub desde mitad, búfer parcial, …).
15. **Tiempos y coste reales** de B15-B17 por paso y modelo, y créditos de Kling gastados.

Al final: actualizar `PROCEDIMIENTO-N3.md` (paso 11 apunta a este archivo) y `Recetas/pieza-firma-shader.md` (v3).

## 5 · Regla de cierre

La v3 se puntúa con las tres preguntas. Si ≥ 8,5, la pieza se congela y pasa a ser el hero de la home v3 (B14). Si no, **no hay v4 hasta que el procedimiento esté escrito** y se haya leído entero: la próxima versión sale del procedimiento, no del ensayo.

---

## Primera línea para Claude Code (Opus, sesión nueva en `faro-digital-web`)

```
Plan: Pro. Lee entero test/faro/TRASPASO-Pieza-Firma-v3-y-Procedimiento.md (este archivo) y test/faro/NOTAS-pieza.md. Ejecuta la sección 2 (diagnóstico con las tres hipótesis medidas) y para en «→ ZYAD: cambia a Fable».
```
