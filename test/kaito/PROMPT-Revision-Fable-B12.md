Eres el revisor del test «método Kaito» de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. La ronda B12 está aplicada y publicada, y su jurado de móvil montado sin lanzar. Te paso los problemas abiertos para que decidas. No construyas nada.

## Dónde estamos

El test B11 cerró en **7,15** de media en dos jurados a ciegas (regla: 7,0-7,5 no sustituye la home). El desglose que lo explica: **7,53 en escritorio y 6,80 en móvil**. Decisión completa en `C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\DECISION.md`.

Se aprobó y ejecutó la ronda **B12**, solo de móvil: CTA en el hero, la sección 2 deja de repetir la foto del hero, el encuadre del vídeo de cierre se desplaza para sacar la linterna de detrás del texto, y el CTA del cierre deja de partirse mal. Notas y medidas: `test/kaito/NOTAS-B12.md`. Publicado en https://faro-digital.pages.dev/test/kaito/.

**La regla de B12, fijada antes de empezar:** una ronda, re-jurado solo de móvil en dos sesiones, **media total ≥ 7,5 → sustituye la home**; por debajo, **archivo definitivo**. Con el escritorio en 7,53, el móvil tiene que subir de 6,80 a **7,47**.

Medidas tras B12: 511 KB a 1440 y 454 KB a 390 (techo 1,2 MB) · LCP 1,75 s y 1,59 s en 4G con CPU ×4 (puerta 2,5 s) · INP 56 y 40 ms (puerta 200) · 60 fps sin frames largos · CLS 0,0021 y 0 · contraste sin ningún fallo AA, 17 bloques medidos en el cierre a 390.

## Los problemas, en orden de lo que cuesta equivocarse

**1. El vídeo del cierre ya no se ve en móvil, y sigue pesando 121 KB.** Para sacar la linterna de detrás de las cuatro respuestas hubo que llevar el `object-position` al 100 %, y con eso la torre sale entera del cuadro: en móvil el cierre es cielo y mar liso, indistinguible de un fondo sólido. La comparación de los tres encuadres sin texto está en `test/kaito/_capturas/b12-encuadres-cierre.png`. Es geometría, no gusto: en 390×2024 el vídeo se escala a 1518×2024, sobra ancho pero no alto, así que **el porcentaje vertical no mueve nada** y la torre solo sale por un lado. Decide: (a) aceptarlo y no cargar el vídeo en móvil, ahorrando 121 KB; (b) reencuadrar o regenerar el vídeo de cierre con la torre baja para que el texto vaya arriba; (c) volver a `50% 35%`, que conserva la torre pero deja el peor bloque en 4,61 sobre un umbral de 4,5, es decir sin margen.

**2. Seis tamaños de letra en escritorio, no cinco.** 68,54 · 36 · 17 · **14** · 13 · 12 px. El 14 px es el `0.875rem` que se pidió para el enlace de cabecera en la ronda B12. La regla de los cinco tamaños era una condición de la spec de secciones y de la escala de marca. Decide si se queda (y entonces la regla pasa a ser de seis y hay que escribirlo) o si ese enlace vuelve a 13 px con solo el subrayado más grueso.

**3. El LCP subió 0,31 s con la ronda B12** (de 1,44 a 1,75 s en escritorio; de 1,27 a 1,59 en móvil). Es real, no ruido: cuatro cargas dan 2032, 1640, 1688 y 1752 ms. Sigue a 0,75 s de la puerta, así que no se tocó nada. Di si merece investigarse antes del jurado o si se anota y se sigue.

**4. Falta el desglose por criterio del jurado de escritorio.** `DECISION.md` tiene el hueco marcado: solo llegaron las notas globales y por dispositivo, no las de diseño 40 / usabilidad 30 / creatividad 20 / contenido 10 con su línea de motivo, que es lo que dice *dónde* pierde el móvil. La ronda B12 se hizo sin ellas, apoyándose solo en los cuatro fallos. Di si el jurado de móvil debe repetir ese desglose y si merece recuperar el del escritorio.

**5. La cabecera móvil ahora tiene el CTA en dos líneas.** «Pide tu Foto del Día 0 — gratis» mide 249 px y solo quedaban 202 junto a la marca y al «Menú», así que reparte en dos líneas alineadas a la derecha. Cabecera de 58 px, el 6,8 % del viewport, sin solapes de 320 a 768 px. Funciona, pero un CTA a dos líneas en la esquina puede leerse como apretado. Di si se acepta o si el texto del enlace debe acortarse en móvil (lo que tocaría el copy, que hasta ahora era intocable).

**6. La regla nº 1 del sistema de marca sigue sin resolverse.** `Marca/SISTEMA-MARCA.md` dice «nunca se dibuja un faro literal», y esta portada es un faro literal en vídeo. Si el jurado de móvil da el 7,5 y la home se sustituye, esa regla se rompe el mismo día. Di si la regla cambia, con qué redacción, o si descalifica la sustitución pase lo que pase.

**7. Un documento interno está publicado en producción.** `https://faro-digital.pages.dev/PLAN-Web-Faro-Profundidad-Y-Casos.md` responde 200. `construir.py` excluye los `.py` y los archivos que empiezan por guion bajo, pero no los `.md`, así que cualquier documento de trabajo que viva en `Sitio-Web/` acaba servido. No es del test y no lo he tocado. Di si se arregla con una línea en `es_de_trabajo` o si hay `.md` que sí deban publicarse.

**8. La numeración de filas no vive en ningún sitio.** B7 a B11 se nombran en el prompt maestro y en la conversación, pero la tabla B de `Marketing Digital/00-Siguiente-Paso.md` solo llegaba a B6; B12 y B13 se acaban de añadir ahí. Si la numeración decide qué se hace, tiene que tener una única fuente.

## Lo que te pido

1. Decide el problema 1, que es el único que cambia lo que ve el jurado. Una línea.
2. Decide los problemas 2 y 5, que también afectan a la nota. Una línea cada uno.
3. Di si el jurado de móvil se lanza ya con lo que hay, o si antes hay que aplicar algo de lo anterior. Recuerda que B12 era **una sola ronda**: si se toca algo más, hay que decir en voz alta que se está ampliando la regla.
4. Ordena los problemas 3, 4, 6, 7 y 8 por lo que costaría equivocarse, y di cuál entra en el trabajo de mañana junto a B13 (cabecera móvil de la home actual, urgente, para publicar el 4-sep).
5. Y una pregunta de fondo: si el jurado de móvil se queda por debajo de 7,47, la regla dice archivo definitivo. ¿La mantienes, o hay algo en lo aprendido que justifique cambiarla antes de conocer el resultado? Contéstalo ahora, no después.

Responde corto. Primero el veredicto en una frase, luego las listas.
