Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. La página está terminada de construir (pasos 1 a 4). Revísala entera y di qué falta antes del jurado. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec al detalle + vídeo de fondo en bucle + una ronda de corrección por paso + «reutiliza el estilo establecido»), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Al final se puntúa a ciegas contra la home real; si gana, la sustituye.
Regla de decisión, fijada de antemano: jurado ≥ 7,5 Y mejor que la home actual Y ≤ 1,5 MB Y LCP ≤ 2,5 s → sustituye la home. 7,0-7,5 → se rescatan las recetas y se archiva. < 7,0 o > 2,5 MB → se archiva entero.

Prompt maestro: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (paso 4 = sección 6; medición y jurado = sección 8; lo que se guarda pase lo que pase = sección 9).

## Dónde está todo
- Publicado, con noindex: https://faro-digital.pages.dev/test/kaito/ — ábrelo y recórrelo entero a 1440 y en móvil.
- Obra: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\ (index.html, kaito.css, kaito.js).
- Notas por paso: NOTAS-paso-1.md, NOTAS-paso-2.md, NOTAS-paso-3.md, NOTAS-paso-4.md (esta última cubre la ronda 3 y el paso 4).
- Spec de las secciones: SPEC-secciones.md. Medidas crudas: _capturas\medidas-paso-4.json.
- Capturas del cierre y el pie: _capturas\paso4-1440x900-cierre-pie.png y paso4-390x844-cierre-pie.png.
- Receta acumulada del sistema: C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\Recetas\hero-video-spec.md (8 secciones).

## Qué se ha hecho desde tu última revisión
Ronda 3 del paso 3 (tres cambios de Zyad, aplicados en una pasada): la cabecera fija se retira al bajar y vuelve al subir, y nunca se retira mientras el hero está en pantalla; la primera línea del H1 ya no anima la opacidad; el CTA del cierre pasa a Título de fila en columnas 1-6; scroll-margin-top de 6rem en las cuatro secciones ancladas.
Paso 4: cierre y pie en un solo contenedor sobre un mismo vídeo (cierre-1280.webm/.mp4), sin overlay ni línea entre las dos zonas, object-fit cover con object-position 50% 35%; poster-cierre.webp de 44,6 KB como <picture> bajo el vídeo; preload="none" con arranque y pausa por IntersectionObserver; con prefers-reduced-motion solo el poster. Pie con los tres bloques de la home (textos y enlaces exactos), titulares crema 100 % y enlaces 75 %, y debajo en Micro «Privacidad · Contacto» y «Esta web no usa cookies y no las necesita.». Sin línea de copyright y sin repetir la letra pequeña de precios (verificado en vivo).

## Medidas (Chrome 152; 4G 1,6 Mbps / 150 ms y CPU ×4)
- Peso total recorrido: 509 KB a 1440, 452 KB a 390. Techo del test: 1,2 MB. Puerta de la regla de decisión: 1,5 MB.
- LCP: 1,44 s a 1440 y 1,27 s a 390. Era el bloqueo del paso 3 (Chrome no emitía NINGÚN candidato con CPU ×4 porque todo el texto de la primera pantalla partía de opacidad 0); con el cambio 2 de la ronda 3 vuelve a existir y la puerta se puede medir.
- CLS total 0,0021 / 0. CLS al arrancar el vídeo del cierre: 0 en los dos tamaños.
- fps recorriendo toda la página con los dos vídeos, CPU ×4: 60,1, cero frames de más de 50 ms, peor frame 17 ms.
- El vídeo del cierre no pide nada hasta acercarse: al cargar, cero peticiones y readyState 0; al entrar en el viewport, readyState 4 y reproduciendo.
- font-size computados distintos: 5 en los dos tamaños. Altura: 8,58 pantallas a 1440 (home 11,83), 14,75 a 390 (home 13,01). Palabras: 1.031 (home 1.155).

## 🔴 Lo que está mal y no he corregido
El pie falla contraste AA donde cae la torre iluminada del vídeo de cierre. Medido sobre los píxeles de la captura, con el vídeo fijado en su fotograma más claro y capturando cada bloque con y sin texto, en dos percentiles del fondo (p50 = fondo típico, p98 = caso peor):
- 1440, enlace «Escríbeme →» del tercer bloque: p50 2,22 y p98 1,84 (AA pide 4,5). Falla incluso en el fondo típico.
- 1440, titular «Vengo a otra cosa»: p50 14,39 y p98 2,87 (AA pide 3,0 en texto grande).
- 390, texto y enlace del primer bloque: p98 3,66 y 3,72. Nota del cierre: p98 3,10.
- El cierre en cambio va bien: las cuatro respuestas y el CTA entre 9,2 y 13,8.
No es el movimiento: la luminancia del vídeo apenas varía (0,0334 a 0,0335 en sus 150 fotogramas) y el peor de diez instantes da lo mismo. Es dónde cae la torre, que está quieta, y cambia con el ancho del viewport. No lo he corregido porque no estaba en las condiciones del paso y las salidas son decisiones de diseño.

## Lo que te pido
1. Recorre la página publicada a 1440 y en móvil. Di si los pasos 1 a 4 cumplen el prompt maestro y dónde no, citando la línea.
2. Elige la salida para el contraste del pie: mover el texto a las columnas oscuras, cambiar el object-position para que la torre caiga fuera del pie, reencuadrar o sustituir el vídeo de cierre, o aceptar un overlay (que la regla de Kaito prohíbe y que el prompt maestro también prohíbe). Dicta el cambio en una línea.
3. Dicta la última ronda de corrección antes del jurado: máximo cinco cambios, numerados, sin justificar.
4. Paso 5 (sección 7 del prompt maestro, vídeo del hero ligado al scroll): solo se hace si el presupuesto va por debajo de 1,8 MB y sobra tiempo. Estamos en 509 KB. Di si se hace o se salta, y por qué.
5. Jurado (sección 8): di cómo montarlo para que sea ciego de verdad —qué capturas, a qué anchos, en qué estado de scroll— y cómo evitar que la página de test se reconozca por el vídeo. Y una pregunta de fondo: el sistema de marca de Faro tiene como regla nº 1 «nunca se dibuja un faro literal», y esta portada es un faro literal en vídeo; di si eso descalifica la sustitución de la home aunque el jurado la puntúe alto, o si la regla debe cambiar.
Responde corto. Primero el veredicto en una frase, luego las listas.
