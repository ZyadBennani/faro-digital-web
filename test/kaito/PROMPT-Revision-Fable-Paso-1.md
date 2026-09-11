Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. Revisa el paso 1 y dime los siguientes pasos. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec de hero al detalle + vídeo de fondo en bucle + una sola ronda de corrección por paso + «reutiliza el estilo establecido»), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Al final se puntúa a ciegas contra la home real; si gana, la sustituye. Tres hipótesis: H1 un vídeo a sangre sube el jurado por encima de 7,0 sin romper el presupuesto (≤ 2,5 MB, meta 1,2 MB); H2 una spec al nivel de clase, retardo y breakpoint produce una portada N3 en un día; H3 Fable 5.1 High construye desde esa spec mejor que Opus 5.

Prompt maestro completo: C:\Users\zyadb\Desktop\IA\faro-digital-web\testkaitomedia\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (léelo entero; el paso 1 es la sección 3).

## Qué se ha hecho (paso 1, Fable 5.1 High, 3-sep-2026)
- Hero construido en C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\ (index.html, kaito.css, kaito.js). Notas, decisiones y medidas: NOTAS-paso-1.md en esa carpeta. Capturas en _capturas\ (hero-1440x900.png, hero-390x844.png, y las dos -reduced).
- Medidas con Chrome 152 instalado, 4G 1,6 Mbps / 150 ms y CPU ×4: escritorio 238 KB cargados con vídeo y LCP 1,47 s; móvil 167 KB y LCP 1,14 s. H1 a dos líneas en los dos, top 46 % exacto. Presupuesto del hero (≤ 1,4 MB) cumplido de sobra.
- Chrome no reporta como LCP una imagen que cubre todo el viewport (probado: al 60 % de ancho el poster sí sale). El LCP medido es la primera línea del H1; el poster llega a 1,45 s.

## Las tres decisiones que la spec no cubría
1. La home no tiene subtítulo desde el 1-sep. Bajada = primera frase del servicio 01: «Tu web, tu ficha de Google, tu Instagram y tus reseñas, mirados desde fuera.»
2. El poster es un <picture> bajo el vídeo, no el atributo poster (así tiene fetchpriority, poster de 720 en móvil y la imagen fija solo con prefers-reduced-motion). El poster es el primer fotograma del vídeo, no la lámina 16:9. La fuente del vídeo se elige con media= en cada <source>, sin JavaScript.
3. «Todos los ángulos.» a 44 px mide 375 px y el móvil de 390 deja 342: por debajo de 435 px el H1 baja a 10,1vw (39 px a 390, 36 px a 360) para quedarse en dos líneas.

Menores: las clases de animación van en kaito.css porque motion.css es generado; no existe superficie.css; píldora con 4 de los 5 enlaces de la home (fuera «Demos»); el enlace de la esquina lleva el texto exacto de la home «Pide tu Foto del Día 0 — gratis»; «Barcelona, 2026» aunque el año no está en la home.

## Lo que está abierto
- El H1 centrado a top 46 % cruza la base de la torre y el horizonte. La linterna queda libre, pero la frase de la spec «el faro entre el H1 y el borde inferior» es incompatible con el 46 % con una torre tan alta. Opciones vistas: subirlo al 30-34 % sobre el cielo, llevarlo a la izquierda sobre el mar vacío como Kaito, o dejarlo y que decida el jurado.
- La píldora de navegación sobre cielo casi negro es muy discreta.
- Coste H3: una pasada de Fable, dos correcciones propias antes de enseñar (H1 móvil a 3-4 líneas; script inline que elegía el vídeo tarde), cero rondas de Zyad, ~15 min.
- Despliegue: la carpeta está en faro-digital-web\ (espejo de GitHub). La fuente real es Marketing Digital\Freelance-Internacional\Sitio-Web\ y se publica con construir.py; para que /test/kaito exista en faro-digital.pages.dev hay que copiarla ahí.

## Lo que te pido
1. Mira las dos capturas y los tres archivos. Di si el hero cumple la spec y dónde no, con la línea exacta de la spec.
2. Dicta la ronda de corrección del paso 1: máximo cinco cambios, numerados, sin justificar, como en el tutorial. Si no hace falta ninguno, dilo.
3. Juzga las tres decisiones: ¿alguna va contra el espíritu del test o del copy «palabra por palabra»?
4. Siguientes pasos: ¿se sigue con el paso 2 tal como está escrito, se cambia algo del prompt maestro antes (por ejemplo la frase incompatible del faro, o el 96 px a 1440 que la clamp literal no da), y qué modelo hace cada cosa? Anota qué de lo aprendido en el paso 1 debería entrar ya en Recetas\hero-video-spec.md.
Responde corto. Primero el veredicto en una frase, luego las listas.
