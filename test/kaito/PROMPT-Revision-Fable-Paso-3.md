Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. Revisa el paso 3 (secciones Método, Trabajo, Precios y Cierre) y dicta la ronda de corrección. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec al detalle + vídeo de fondo en bucle + una ronda de corrección por paso + «reutiliza el estilo establecido»), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Al final se puntúa a ciegas contra la home real; si gana, la sustituye. Regla de decisión: jurado ≥ 7,5, > home actual, ≤ 1,5 MB, LCP ≤ 2,5 s.

Prompt maestro: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (el paso 3 es la sección 5; el paso 4, la sección 6).

## Dónde está todo
- Publicado, con noindex: https://faro-digital.pages.dev/test/kaito/ (ábrelo, haz scroll entero a 1440 y en móvil).
- Obra: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\ (index.html, kaito.css, kaito.js).
- La spec que se construyó, con tus cuatro cambios ya dentro (marcados R1): SPEC-secciones.md en esa carpeta. Se construyó sin cambiar nada más.
- Notas con medidas y decisiones: NOTAS-paso-3.md (y NOTAS-paso-1.md, NOTAS-paso-2.md).
- Capturas de página entera, cosidas pantalla a pantalla: _capturas\paso3-1440x900-pagina-entera.png (9 pantallas) y paso3-390x844-pagina-entera.png (14 pantallas).
- Cifras de los casos: extraídas por script de cada Portfolio\Caso-*.html, listado en _cifras-extraidas.json. Los seis casos tienen tres cifras.

## Medidas (Chrome 152; 4G 1,6 Mbps / 150 ms y CPU ×4 donde se indica)
- Peso: 1440 → 258 KB al cargar, 336 KB tras recorrer (con las 6 miniaturas lazy); 390 → 202 / 279 KB. Techo del test 1,2 MB acumulado.
- LCP en 4G + CPU ×4: SIN CANDIDATO, en escritorio y móvil, en local y en vivo, ni en PerformanceObserver (8 s) ni en la traza que lee Lighthouse. Sin CPU ×4, en vivo: 1,35 s (línea 1 del H1). FCP con CPU ×4: 1,47 s escritorio, 1,14 s móvil. Poster pintado: 1,36 s / 0,67 s.
- font-size computados distintos: 5 en los dos tamaños (68,5 · 36 · 17 · 13 · 12 px en 1440; 39,4 · 36 · 17 · 13 · 12 en 390).
- CLS: 0,0021 / 0. fps en el scroll de las secciones 3-6 con CPU ×4: 60,1 / 59,8, cero frames de más de 50 ms.
- Contraste sobre rgb(25,38,34): crema 85 % → 10,2:1; crema 60 % → 5,8:1.
- Altura: 8,2 pantallas en 1440 (home 11,8); 13,9 en 390 (home 13,0). Palabras visibles: 1.031 (home 1.155).

## El hallazgo que bloquea la regla de decisión
Con CPU ×4 Chrome no emite ningún candidato de LCP. Bisección en doce variantes: (a) el poster a pantalla completa no cuenta como LCP (regla de Chrome); (b) todo el texto de la primera pantalla entra animado desde opacidad 0 (.hero-reveal en el H1 y .hero-fade en el resto). Quitando cualquiera de las dos animaciones aparece un candidato a 1,5 s; sin CPU ×4 aparece con las animaciones (1,35 s). La página del paso 2, más ligera, sí daba LCP con CPU ×4 (1,32 s): al crecer HTML y CSS se ha cruzado el umbral. Lighthouse en móvil diría «LCP sin datos». No se ha tocado porque no estaba en la spec.

## Decisiones mías dentro de la spec
1. La cabecera vive al final del body con position: fixed en escritorio (encima de todo sin z-index); en móvil sigue en el hero y se va con el scroll.
2. La sección 2 se ajustó a la escala de cinco: «Qué ofrecemos» a Display (68,5 px, antes 43), titulares de bloque a 2.25rem (antes 34,6), texto a Párrafo (antes 16 px). Sin esto el recuento daba ocho.
3. Display es un solo valor computado para el H1 y los títulos de sección (calculado desde el ancho libre hasta la torre).
4. Trabajo: cada cifra en una línea con su pie en Micro detrás, apiladas en las columnas 9-12; titulares de caso a 2.25rem en las columnas 5-8 (3 a 5 líneas).
5. Cierre: el CTA enlaza al formulario real de la home (/#contacto); no se reconstruye el formulario (Formspree, contactos reales).
6. El degradado de 20 vh es una franja al final de la escena, sobre el vídeo y bajo la cabecera.

Fuera a propósito: rúbrica desplegable, frase a sangre, testimonios (comentados en la home), «Una persona, y da la cara», formulario, pie legal (paso 4).

## Lo que te pido
1. Abre la URL y recorre la página a 1440 y en móvil. Di si las secciones 3-6 cumplen SPEC-secciones.md (y las siete condiciones de Zyad que lleva dentro), citando la línea donde no.
2. Dicta la ronda de corrección del paso 3: máximo cinco cambios, numerados, sin justificar. Cuenta que la aplicará Opus 5.
3. Sobre el LCP sin candidato: di qué salida eliges para que la regla de decisión se pueda medir (que el H1 no parta de opacidad 0; que el poster no cubra el 100 %; medir sin CPU ×4 y declararlo; otra), y si entra en esta ronda o en el paso 4.
4. Juzga las seis decisiones. En especial la 2 (cambiar tamaños de la sección 2 para cumplir «cinco tamaños») y la 4 (titulares de caso a 3-5 líneas).
5. Paso 4 (sección 6 del prompt maestro, Opus): cierre-1280 de fondo en el cierre y pie sin costura. Di qué debe llevar sí o sí y qué medir al acabar, con el presupuesto acumulado (hoy 336 KB; cierre-1280.webm pesa 121 KB, poster-cierre.jpg 76 KB).
Responde corto. Primero el veredicto en una frase, luego las listas.
