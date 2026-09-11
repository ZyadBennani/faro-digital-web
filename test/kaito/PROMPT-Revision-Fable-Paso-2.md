Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. Revisa el estado completo (paso 1 cerrado, paso 2 construido) y dime los siguientes pasos. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec de hero al detalle + vídeo de fondo en bucle + una sola ronda de corrección por paso + «reutiliza el estilo establecido»), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Al final se puntúa a ciegas contra la home real; si gana, la sustituye. Tres hipótesis: H1 un vídeo a sangre sube el jurado por encima de 7,0 sin romper el presupuesto (≤ 2,5 MB, meta 1,2 MB); H2 una spec al nivel de clase, retardo y breakpoint produce una portada N3 en un día; H3 Fable 5.1 High construye desde esa spec mejor que Opus 5.

Prompt maestro: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (léelo entero; el paso 1 es la sección 3, el paso 2 la sección 4, el paso 3 la sección 5).

## Dónde está todo
- Obra: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\ (index.html, kaito.css, kaito.js).
- Publicado, con noindex: https://faro-digital.pages.dev/test/kaito/ (ábrelo y haz scroll: la transición no se juzga en captura).
- Notas con medidas y decisiones: NOTAS-paso-1.md y NOTAS-paso-2.md en esa carpeta.
- Capturas en _capturas\: hero-1440x900.png y hero-390x844.png (paso 1 tras la ronda), y paso2-{1440x900,390x844}-{1-antes,2-mitad,3-bloques}.png.
- Tu revisión anterior del paso 1 dio una ronda de cuatro cambios; los cuatro están aplicados, más un ajuste posterior de Zyad (H1 con techo 4.5rem, dos líneas).
- Receta ya escrita: C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\Recetas\hero-video-spec.md.

## Paso 1 (cerrado)
H1 a la izquierda sobre el mar vacío, dos líneas, sin tocar la torre en ninguna proporción (el ancho se calcula desde el borde de la torre en el fotograma, no por porcentaje fijo: 50vw − 6.02dvh o 46.6vw). 1440×900: 68,5 px, 53 px de aire; 1280×800: 60 px, 49 px. Píldora 0,12/0,28. «Barcelona» sin año. Poster como <picture> bajo el vídeo, WebP por ancho (1920 → 45 KB, 1280 → 27 KB, 720 jpg → 9 KB), imagen fija solo con prefers-reduced-motion. Peso cargado con vídeo: 225 KB escritorio, 168 KB móvil. LCP en 4G + CPU ×4: 1,32 s y 1,12 s. Chrome no reporta como LCP una imagen a viewport completo; el poster llega a 1,45 s.

## Paso 2 (construido, sin ronda todavía)
Escena de 200vh con dos capas sticky: el hero con el vídeo fijo y encima la capa de oferta. Los textos del hero pasan de 1 a 0 en los primeros 30 vh de scroll. «Qué ofrecemos» (h2 de la home) centrado arriba, sobre el cielo, sin tocar la cúpula (acaba a 98 px; la cúpula empieza a 105). Cuatro bloques sin tarjeta ni fondo ni overlay, con el texto exacto de los cuatro servicios de la home (01 Foto del Día 0, 02 Web que mide, 03 Presencia Local, 04 Diagnóstico + Plan), dos a la izquierda (columnas 1-5) y dos a la derecha (8-12), descripciones a dos líneas a 1440. Cascada de 120 ms por IntersectionObserver. Peso total con vídeo: 234 KB escritorio, 178 KB móvil; la sección 2 no añade ningún archivo. En móvil nada es sticky: bajo el hero, una franja de 56vh con el poster y los bloques apilados a tres líneas.

Decisiones mías que la spec no cubría:
1. Se desvanece TODO el hero, cabecera incluida (lectura literal de «los textos del hero»). Deja el hueco de arriba para el título, como Kaito; coste: en la sección 2 no hay navegación ni CTA a la vista.
2. La cascada va con transición (mismos valores que .hero-fade: 700 ms, 10 px, curva estándar, 120 ms por índice) y no con la animación, para que al subir los bloques se vayan en 288 ms en vez de desaparecer de golpe.
3. En móvil el hero no cambia (sigue siendo la pantalla del paso 1); la franja de 56vh con el poster es la sección 2. La otra lectura (reducir el hero a 56vh) deshacía el paso 1.
4. Testigo del scroll a 130vh: los bloques empiezan a aparecer justo cuando los textos del hero acaban de irse (30 vh).

Coste H3 del paso 2: Fable, una pasada, dos autocorrecciones por el mismo fallo (especificidad de .bloque:nth-child en móvil), cero rondas de Zyad, ~20 min.

Lo que yo miraría: si el CTA debe volver durante la sección 2; que 30 vh de transición son dos o tres tics de rueda, más corto que Kaito; y que los bloques de la derecha caen sobre el cielo y mar más claros.

## Lo que te pido
1. Abre la URL y haz scroll a 1440 y en un móvil real o emulado. Di si el paso 2 cumple la sección 4 y dónde no, citando la línea de la spec.
2. Dicta la ronda de corrección del paso 2: máximo cinco cambios, numerados, sin justificar. Si no hace falta ninguno, dilo.
3. Juzga las cuatro decisiones. En especial la 1: ¿la home real puede quedarse sin CTA a la vista durante una pantalla?
4. Paso 3 (sección 5): Fable escribe SPEC-secciones.md sin código y luego Opus construye. Di si mantienes ese reparto de modelos visto lo que ha dado Fable en los pasos 1 y 2, y qué debe llevar la spec de secciones sí o sí (el color medio del vídeo es rgb(25,38,34); la transición degradada de 20 vh entre la sección 2 y la 3 está en la spec).
5. Con lo que hay, ¿se sigue viendo alcanzable la regla de decisión (jurado ≥ 7,5, > home actual, ≤ 1,5 MB, LCP ≤ 2,5 s)? Si ves un riesgo que ya se pueda medir, nómbralo.
Responde corto. Primero el veredicto en una frase, luego las listas.
