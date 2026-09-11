Eres el revisor del test «método Kaito» de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. La ronda B12 está cerrada y publicada, y su jurado de móvil está montado sin lanzar. Decide qué se hace ahora. No construyas nada.

## Dónde estamos

El test B11 cerró en **7,15** de media en dos jurados a ciegas (regla fijada de antemano: 7,0-7,5 no sustituye la home). El desglose que lo explica: **7,53 en escritorio y 6,80 en móvil**. Decisión completa en `C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\DECISION.md`.

Se aprobó y ejecutó la ronda **B12**, solo de móvil, y después sus tres cierres. Notas y medidas en `test/kaito/NOTAS-B12.md`. Publicado en https://faro-digital.pages.dev/test/kaito/.

**La regla de B12, fijada antes de empezar:** una ronda · re-jurado **solo de móvil** en dos sesiones · **media total ≥ 7,5 → sustituye la home**; por debajo, **archivo definitivo**. Con el escritorio en 7,53, el móvil tiene que subir de 6,80 a **7,47**.

## Qué se cambió, y qué mide ahora

Los cuatro cambios de B12: CTA visible en el hero móvil; la sección 2 deja de repetir la foto del hero y va sobre fondo sólido con línea fina; el encuadre del vídeo de cierre desplazado para sacar la linterna de detrás del texto; y el CTA del cierre sin partirse mal. Los tres cierres posteriores: el vídeo del cierre no se carga por debajo de 641 px, el enlace de cabecera vuelve al tamaño de UI, y el CTA de cabecera en móvil se acepta a dos líneas sin tocar el copy.

| | 1440×900 | 390×844 | Puerta |
|---|---|---|---|
| Peso total recorrido | 511,7 KB | **334,1 KB** | 1,2 MB del test · 1,5 MB de la regla |
| LCP en 4G + CPU ×4 (mediana de 5 cargas) | 1,69 s | 1,61 s | ≤ 2,5 s |
| INP con CPU ×4 | 40 ms | 40 ms | < 200 ms |
| fps recorriendo la página | 60,0 | 60,0 · cero frames > 50 ms | 60 |
| CLS | 0,0021 | 0 | < 0,1 |
| Contraste | sin fallos | **17 bloques del cierre, cero fallos**, peor 5,40 | AA |
| Tamaños de letra distintos | **5** | **5** | 5 |

El móvil bajó de 454 a 334 KB (−26 %) al dejar de cargar un vídeo que, con el encuadre nuevo, no se veía.

## El jurado de móvil, montado y sin lanzar

`_capturas/jurado-movil/` y `_capturas/jurado-movil-2/` (esta con A y C intercambiadas, para separar el efecto del orden). 12 PNG por carpeta: tres portadas × 390×844 × cuatro vistas, todo a DPR 2, sin barra de navegador ni favicon. `PROMPT-Jurado-movil.md` dentro de las dos. La clave está fuera, en `test/kaito/CLAVE-jurado.md`, con el mismo reparto de letras que el jurado de escritorio.

Comprobado que las capturas reflejan lo publicado: dos de las tres vistas son idénticas píxel a píxel a la página en producción y la tercera difiere un 0,18 %, que es el fotograma del vídeo del hero.

## Lo que queda abierto

**1. El paso 5 está preparado y sin ejecutar.** `test/kaito/SPEC-paso-5.md` describe cómo ligar `video.currentTime` al scroll con lerp 0.08, solo desde 1024 px. El material ya está reencodificado con un keyframe cada 0,5 s, así que **el coste es un dato medido, no una estimación**: el mp4 pasa de 145,4 a 276,1 KB y el WebM, que es lo que se sirve en escritorio, de 64,7 a 186,6 KB. El peso a 1440 pasaría de 511,7 a unos 634 KB. Cabe en el techo, pero es el único paso del test que empeora una medida para mejorar una sensación, y solo afecta a escritorio, que es donde la portada ya iba bien. Mi recomendación es no construirlo antes del jurado, porque B12 era una sola ronda.

**2. Falta el desglose por criterio del jurado de escritorio.** Solo llegaron las notas globales y por dispositivo, no las de diseño 40 / usabilidad 30 / creatividad 20 / contenido 10 con su línea de motivo. `DECISION.md` tiene el hueco marcado y la ronda B12 se hizo sin ellas.

**3. La regla nº 1 del sistema de marca sigue sin resolverse.** `Marca/SISTEMA-MARCA.md` dice «nunca se dibuja un faro literal», y esta portada es un faro literal en vídeo. Si el jurado de móvil da el 7,5, esa regla se rompe el mismo día en que la home se sustituye.

**4. Un documento interno está publicado en producción.** `https://faro-digital.pages.dev/PLAN-Web-Faro-Profundidad-Y-Casos.md` responde 200. `construir.py` excluye los `.py` y los archivos que empiezan por guion bajo, pero no los `.md`, así que cualquier documento de trabajo que viva en `Sitio-Web/` acaba servido. No es del test.

**5. La numeración de filas no tiene una fuente única.** B7 a B11 se nombran en el prompt maestro y en la conversación, pero la tabla B de `Marketing Digital/00-Siguiente-Paso.md` solo llegaba a B6; B12 y B13 se añadieron ahí.

**6. B13 sigue urgente**: la cabecera móvil de la home actual, para publicar hoy. El primer fallo de móvil que el jurado le marcó al test lo tiene también la home en producción, y esa sí recibe visitas.

**7. Tres medidores propios dieron números falsos durante este test**, y los tres parecían buenos datos: el INP con un `durationThreshold` inválido devolvía cero interacciones; el cosido de página entera no cortaba nunca con un vídeo detrás y producía 16 pantallas de una página de 9; y el LCP daba 6,2 s si la medida hacía scroll, porque sigue admitiendo candidatos mientras no hay interacción. Los tres están corregidos y escritos en `Recetas/hero-video-spec.md`.

## Lo que te pido

1. Di si el jurado de móvil se lanza **ya**, tal como está, o si algo de lo abierto tiene que resolverse antes. Recuerda que B12 era una sola ronda: si se toca la página otra vez, hay que decir en voz alta que se está ampliando la regla.
2. Decide el paso 5: se construye, se archiva con la spec escrita, o se deja condicionado al resultado del jurado. Una línea.
3. Ordena los puntos 2 a 5 por lo que costaría equivocarse, y di cuál entra en el trabajo de hoy junto a B13.
4. Sobre el punto 3, la regla de marca: dila resuelta. O cambia con una redacción concreta, o descalifica la sustitución pase lo que pase.
5. Y la pregunta de fondo, que hay que contestar **antes** de conocer el resultado: si el móvil se queda por debajo de 7,47, la regla dice archivo definitivo. ¿La mantienes? ¿Hay algo en lo aprendido que justifique cambiarla ahora?

Responde corto. Primero el veredicto en una frase, luego las listas.
