# Test «método Kaito» · Paso 3 · Método, Trabajo, Precios y Cierre · [FABLE spec + FABLE construye]

**Fecha:** 03-sep-2026 · **Estado:** construido desde `SPEC-secciones.md` (con los cuatro cambios R1 de Zyad, sin cambiar nada más), medido y publicado en https://faro-digital.pages.dev/test/kaito/ · **parado en la ronda de corrección, que hace Opus.**

## Cifras de los casos: copiadas por script, no de memoria

Las seis filas de Trabajo las genera un script que lee cada `Portfolio/Caso-*.html` y extrae los pares `span.cifra` + `span.pie`. El listado extraído está en `_cifras-extraidas.json` (misma carpeta). Los seis casos tienen exactamente tres cifras; no falta ninguna:

| Caso | Cifras extraídas |
|---|---|
| Caso-1-Local-Verbena | 202 KB · 1,0 s · 0 |
| Caso-2-Ecommerce-Aura | 5 · 21 · 2,0 s |
| Caso-3-Datos-Casa-Lumen | 184 KB · 1,8 s · 0 |
| Caso-4-B2B-Meridian | 8 · 191 KB · 1,7 s |
| Caso-5-Multilocal-Brasa-Sal | 3 · 295 KB · 2,0 s |
| Caso-6-Contenido-Sobremesa | 23 · 329 KB · 2,0 s |

Etiquetas, titulares, `alt` de las miniaturas y enlaces vienen de las tarjetas de la home (`#trabajo`), tal cual. Las miniaturas son los `card-thumb-480.webp` de `Portfolio/assets/`, copiados a `media/casos/`.

## Medidas (Chrome 152 instalado; 4G 1,6 Mbps / 150 ms y CPU ×4 donde se indica)

| | 1440×900 | 390×844 | Home actual |
|---|---|---|---|
| Peso al cargar (vídeo incluido, miniaturas aún no) | **258 KB** | **202 KB** | — |
| Peso total tras recorrer la página (con las 6 miniaturas) | **336 KB** | **279 KB** | — |
| FCP en 4G + CPU ×4 | 1,47 s (en vivo) · 1,5-2,1 s (local) | 1,14 s (en vivo) | — |
| Poster pintado (llegada del recurso, 4G + CPU ×4) | 1,36 s (en vivo) · 1,39 s (local) | 0,67 s | — |
| **LCP en 4G + CPU ×4** | **sin candidato** (ver abajo) | **sin candidato** | — |
| LCP en 4G sin CPU ×4 (en vivo) | 1,35 s (línea 1 del H1) | — | — |
| `font-size` computados distintos | **5** (68,5 · 36 · 17 · 13 · 12 px) | **5** (39,4 · 36 · 17 · 13 · 12 px) | — |
| CLS (carga + scroll programado) | **0,0021** | **0** | — |
| fps en el scroll de las secciones 3-6, CPU ×4 (4 s, 4.648 / 8.686 px) | **60,1** · 0 frames > 50 ms · peor 17 ms | **59,8** · 0 frames > 50 ms · peor 33 ms | — |
| Contraste crema 85 % sobre rgb(25,38,34) → rgb(212,209,199) | **10,24 : 1** | | |
| Contraste crema 60 % sobre rgb(25,38,34) → rgb(157,159,150) | **5,84 : 1** (AA en cualquier tamaño; AAA solo en grande) | | |
| Altura total en pantallas | **8,16** (7.348 px) | **13,87** (11.706 px) | 11,83 · 13,01 |
| Palabras visibles (innerText) | **1.031** | 1.005 | **1.155** |

**Sobre el LCP «sin candidato».** Con CPU ×4, Chrome no emite ninguna entrada de LCP para esta página: ni en el `PerformanceObserver` (esperando hasta 8 s) ni en la traza que lee Lighthouse (`largestContentfulPaint::Candidate`, cero eventos). Probado en local y en vivo, en escritorio y móvil. Causas comprobadas por bisección: el poster a pantalla completa no cuenta (regla de Chrome, ya anotada en el paso 1) y **todo el texto de la primera pantalla entra animado desde opacidad 0** (`.hero-reveal` y `.hero-fade`). Quitando cualquiera de las dos animaciones aparece un candidato a 1,47-1,52 s; sin CPU ×4 aparece con las animaciones (1,35 s). Con la página del paso 2, más ligera, sí aparecía con CPU ×4 (1,32 s): el umbral se ha cruzado al crecer el HTML y el CSS. **Consecuencia:** Lighthouse en móvil daría «LCP: sin datos» y la regla de decisión (LCP ≤ 2,5 s) no se puede comprobar con esta portada tal cual. Es lo primero para la ronda de Opus: la salida más barata es que la primera línea del H1 no parta de opacidad 0 (solo desplazamiento y desenfoque), o que el poster no cubra el 100 % del viewport. No se ha tocado porque no estaba en la spec ni en la ronda.

Capturas de página entera, cosidas pantalla a pantalla (la captura «full page» de Playwright superpone las dos capas sticky y triplica el móvil, así que no sirve para una escena fija): `_capturas/paso3-1440x900-pagina-entera.png` (9 pantallas) y `paso3-390x844-pagina-entera.png` (14 pantallas, a 2×).

## Cómo se ha construido (lo que decidí yo, dentro de la spec)

1. **La cabecera vive al final del `body`** con `position: fixed` en escritorio (spec §0.3): así se pinta encima de todo sin z-index entre capas. En móvil sigue en la parte alta del hero y se va con el scroll. Con el menú abierto pasa a fija también en móvil para que «Cerrar» no se pierda.
2. **La sección 2 se ajusta a la escala de cinco** (spec §0.2, consecuencia del R1): «Qué ofrecemos» a Display (68,5 px, antes 43), titulares de bloque a 2.25rem fijos (antes 34,6 px), descripciones a Párrafo (antes 16 px). Sin esto el recuento daba 8 tamaños.
3. **Display es un solo valor computado** para el H1 y los títulos de sección: `--k-display` en `:root`, calculado desde el ancho libre hasta la torre, con `min(…, 10.1vw)` en ≤ 640 px. Los títulos de sección miden exactamente lo que mide el H1 (68,54 px a 1440; 39,39 px a 390).
4. Trabajo: cada cifra va en una línea con su pie en Micro detrás (las tres apiladas en las columnas 9-12); los titulares de caso a 2.25rem ocupan 3-5 líneas en las columnas 5-8.
5. Precios: «al mes» en UI bajo el precio; «La más elegida» en Micro bajo el nombre del plan; los titulares de las dos tiras en Párrafo con Frank Ruhl 700; la letra pequeña del pie de la home («Precios sin IVA…») cierra la sección porque habla de los precios.
6. Cierre: el CTA enlaza al formulario real de la home (`/#contacto`); el formulario no se reconstruye (Formspree, contactos reales).
7. El degradado de 20 vh es una franja absoluta al final de la escena, por encima del vídeo y por debajo de la cabecera.
8. Reveal por sección: un IntersectionObserver al 15 % (el umbral de motion.css), una vez, con la misma transición del paso 2; en móvil, igual.

**Fuera a propósito** (no estaban en las cuatro secciones pedidas): rúbrica desplegable de los casos, frase a sangre («Lo que nos diferencia…»), testimonios (comentados en la home), sección «Una persona, y da la cara», formulario, pie legal (es del paso 4).

## Coste (H3)

Fable 5.1: spec en ~15 min; construcción en una pasada; cero autocorrecciones de página. Dos rondas de medición extra por la captura «full page» (que no sirve para sticky) y por el LCP (bisección de 12 variantes hasta encontrar la causa). ~45 min de pared con las medidas. Publicado (`sincronizar-publicacion.py` ahora copia también `media/casos/`).

## Para la ronda de Opus (lo que yo miraría, con números)

1. **LCP sin candidato con CPU ×4** (arriba). Es un bloqueo de la regla de decisión, no de estética.
2. Los titulares de caso a 2.25rem en 4 columnas: de 3 a 5 líneas; el de Casa Lumen («Cuatro tiendas, cuatro hojas de cálculo distintas — y ninguna decisión compartida») es el más largo.
3. La cabecera fija pasa por encima del texto de las secciones 3-6; solo la píldora tiene fondo (desenfoque), la marca y el enlace no.
4. En móvil la página mide 13,9 pantallas frente a 13,0 de la home; en escritorio 8,2 frente a 11,8.

**Parado.** Siguiente: ronda de corrección del paso 3 (Opus) y paso 4 (Opus): `cierre-1280` de fondo en el cierre y pie sin costura.
