Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. La página está terminada (pasos 1 a 4, cuatro rondas de corrección) y el jurado a ciegas está montado sin lanzar. Revisa el montaje del jurado y di si se lanza. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec al detalle + vídeo de fondo en bucle + una ronda de corrección por paso), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Se puntúa a ciegas contra la home real; si gana, la sustituye.
Regla de decisión, fijada de antemano: jurado ≥ 7,5 Y mejor que la home actual Y ≤ 1,5 MB Y LCP ≤ 2,5 s → sustituye la home. 7,0-7,5 → se rescatan las recetas y se archiva. < 7,0 o > 2,5 MB → se archiva entero.

Prompt maestro: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (el jurado es la sección 8; lo que se guarda pase lo que pase, la 9).

## Dónde está todo
- Publicado, con noindex: https://faro-digital.pages.dev/test/kaito/
- Obra y notas: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\ (index.html, kaito.css, kaito.js, NOTAS-paso-1 a 4, SPEC-secciones.md).
- Material del jurado: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\_capturas\jurado\ — 24 PNG, PROMPT-Jurado.md y CLAVE.md.
- Receta acumulada del sistema: C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\Recetas\hero-video-spec.md (10 secciones).

## Estado final medido (Chrome 152; 4G 1,6 Mbps / 150 ms y CPU ×4)
- Peso total recorrido: 509 KB a 1440, 452 KB a 390. Puertas: 1,2 MB del test y 1,5 MB de la regla de decisión.
- LCP 1,44 s / 1,27 s. CLS 0,0021 / 0, y 0 al arrancar el vídeo del cierre. INP 56 ms / 40 ms (puerta < 200 ms). fps recorriendo la página con los dos vídeos: 60,1, cero frames de más de 50 ms.
- Cinco tamaños de letra en toda la página. Altura 8,58 pantallas a 1440 (home 11,83) y 14,75 a 390 (home 13,01). Palabras 1.031 (home 1.155).
- Contraste del pie tras la última ronda: 12 de 12 bloques en AA, con el mismo ratio en los dos anchos. Queda un fallo suelto fuera del pie: la nota en Micro del cierre a 390 px da 4,46 frente a 4,5, sobre el vídeo.

## Cómo está montado el jurado
Tres portadas (la home actual de Faro, la página del test y una referencia externa), cada una a 1440×900 y 390×844, en cuatro piezas: arriba, una pantalla de scroll, dos pantallas, y la página entera cosida pantalla a pantalla. Son capturas del viewport: sin barra de navegador ni favicon, y sin metadatos. Los archivos van como A-, B- y C-, repartidos al azar; la correspondencia está en CLAVE.md, dentro de la misma carpeta.
El prompt del jurado dice solo esto, sin más contexto: «Tres portadas de agencias web para pymes. Puntúa cada una con la rúbrica Awwwards (diseño 40, usabilidad 30, creatividad 20, contenido 10), criterio por criterio, una línea de motivo por criterio, y la nota final».

## Lo que te pido
1. Mira las 24 capturas como las vería el jurado. Di si alguna delata cuál es cuál: por el contenido visible, por el número de pantallas, por un artefacto de la captura o por cualquier otra cosa. No abras CLAVE.md.
2. Di si el prompt del jurado es suficiente o si le falta algo para que las notas sean comparables entre las tres.
3. Un riesgo del montaje: CLAVE.md está en la misma carpeta que las capturas. Di cómo lanzarlo para que siga siendo ciego.
4. Con los números de arriba, di qué puertas de la regla de decisión están ya cumplidas y cuáles dependen solo de la nota del jurado.
5. La pregunta de fondo: el sistema de marca de Faro tiene como regla nº 1 «nunca se dibuja un faro literal», y esta portada es un faro literal en vídeo. Di si eso descalifica la sustitución de la home aunque el jurado la puntúe alto, o si la regla debe cambiar y con qué redacción.
Responde corto. Primero el veredicto en una frase, luego las listas.
