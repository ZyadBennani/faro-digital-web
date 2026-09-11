Eres el revisor del test «método Kaito» (fila B11) de Faro Digital. Sesión limpia: no asumas nada que no esté aquí o en los archivos que cito. Revisa la SPEC de secciones del paso 3 antes de que se construya. No construyas nada.

## Qué es el test
Copiamos el MÉTODO del tutorial de Kaito (spec al detalle + vídeo de fondo en bucle + una ronda de corrección por paso + «reutiliza el estilo establecido»), no su stack ni su estética. Stack de Faro: HTML/CSS/JS a mano, sin librerías. Copy de la home actual palabra por palabra. Al final se puntúa a ciegas contra la home real; si gana, la sustituye. Regla de decisión: jurado ≥ 7,5, > home actual, ≤ 1,5 MB, LCP ≤ 2,5 s.

Prompt maestro: C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\PROMPT-Claude-Code-Faro-Test-Metodo-Kaito.md (el paso 3 es la sección 5).

## Estado
- Pasos 1 y 2 cerrados con dos rondas de corrección de Zyad, publicados en https://faro-digital.pages.dev/test/kaito/ (noindex). Ábrelo y haz scroll: es el estilo ya establecido que las secciones 3-6 tienen que continuar. 236 KB en escritorio, LCP 1,32 s en 4G.
- Notas: NOTAS-paso-1.md y NOTAS-paso-2.md en C:\Users\zyadb\Desktop\IA\faro-digital-web\test\kaito\.
- Reparto del paso 3, cambiado por Zyad: Fable escribe la spec Y construye desde ella sin cambiarla; Opus queda para la ronda de corrección y el paso 4 (vídeo de cierre + pie).
- Zyad fijó siete condiciones para la spec: fondo rgb(25,38,34) en todas las secciones y degradado de 20 vh entre la 2 y la 3, sin vídeo hasta el cierre; la misma escala de cuatro tamaños del hero sin añadir ninguno, rejilla de 12 y márgenes del hero, píldora fija; líneas finas horizontales en vez de tarjetas, sin bordes ni sombras ni círculos numerados, los 01-04 como texto; un solo gesto de motion (fade en cascada); cuatro secciones en este orden con el copy de la home palabra por palabra: Método, Trabajo, Precios, cierre con el CTA de la Foto del Día 0; en Trabajo cada caso con sus cifras tal como están en la página del caso, sin inventar; presupuesto acumulado ≤ 1,2 MB con el vídeo de cierre.
- Un dato de marca: SISTEMA-MARCA.md tiene como regla nº 1 «nunca se dibuja un faro literal», y este test es un faro literal en vídeo. Si el test gana, esa regla tiene que cambiar.

## Lo que te pido
1. Lee la spec (abajo) contra la sección 5 del prompt maestro y contra las siete condiciones de Zyad. Di dónde no cumple, citando la línea.
2. Busca copy que no esté en la home: cualquier frase, etiqueta o cifra que la spec haya añadido o cambiado. La fuente es C:\Users\zyadb\Desktop\IA\Marketing Digital\Freelance-Internacional\Sitio-Web\index.html (secciones #metodo, #trabajo, #precios y el footer #contacto) y las seis páginas de C:\Users\zyadb\Desktop\IA\Marketing Digital\Freelance-Internacional\Portfolio\Caso-*.html para las cifras.
3. Juzga las tres decisiones de la spec que más pesan: (a) Trabajo sin miniaturas de los casos; (b) los titulares de caso a tamaño Párrafo con Frank Ruhl 700 porque a tamaño Display no caben y la regla es cuatro tamaños; (c) el cierre con un solo enlace al formulario real de la home en vez de reconstruir el formulario. Y una cuarta: la primera cifra de cada caso en Display y las otras dos en Párrafo.
4. Dicta los cambios a la spec antes de construir: máximo cinco, numerados, sin justificar. Si no hay que cambiar nada, dilo y se construye tal cual.
5. Di qué debe medirse al acabar el paso 3 para que la ronda de corrección de Opus tenga números y no opiniones.
Responde corto. Primero el veredicto en una frase, luego las listas.

---

# LA SPEC (copia literal de test/kaito/SPEC-secciones.md)

# SPEC · Secciones 3-6 de `/test/kaito` · Paso 3 [FABLE escribe · FABLE construye · OPUS corrige]

**Fecha:** 03-sep-2026 · **Estado:** spec escrita, sin código · **parada para revisión de Zyad antes de construir.**

Todo el copy es el de la home actual (`Sitio-Web/index.html`, 2-sep-2026), palabra por palabra, incluidas negritas. Ni una frase nueva, ni una cifra que no esté en la home o en la página del caso.

## 0 · Reglas comunes a las cuatro secciones

1. **Fondo** `rgb(25 38 34)` (el color medio del vídeo, ya es `--k-fondo`) en las cuatro. Entre la sección 2 y la 3, **degradado de 20 vh** de transparente a sólido: una franja absoluta en los últimos 20 vh de la escena de 200vh, `linear-gradient(to bottom, transparent, rgb(25 38 34))`, por encima del vídeo y por debajo de la cabecera. Desde ahí el vídeo no vuelve hasta el cierre (paso 4).
2. **Escala:** solo los cuatro tamaños del hero. **Display** = `--k-h1` (clamp 2.75-4.5rem, Frank Ruhl 700, line-height .98, letter-spacing −.015em): títulos de sección y la única pieza grande de cada fila. **Párrafo** = 1.0625rem / 1.5. **UI** = 0.8125rem, mayúsculas, .06em, peso 500. **Micro** = 0.75rem / 1.4, crema al 60 %. Ningún otro tamaño: los dos tamaños intermedios que introdujo la spec del paso 2 (2.75rem y 2.25rem) no se usan aquí.
3. **Rejilla** de 12 columnas, gap 1.5rem, márgenes del hero (1.5 / 2.5 / 3.5rem). Cada sección: `padding-block` 6rem en escritorio, 4rem en móvil. La píldora sigue fija arriba (la capa `.hero-arriba` pasa a `position: fixed` desde la sección 3, con la misma rejilla y márgenes).
4. **Líneas finas horizontales** `1px rgb(245 239 228 / .25)` para separar filas. Ningún borde de caja, ninguna sombra, ningún círculo numerado; los «01-06», «1-5» y los números van como texto en UI, crema al 60 %.
5. **Un solo gesto de motion:** cada fila entra con el fade en cascada del paso 2 (transición, 700 ms, 10 px, 120 ms por índice, `.es-visible` puesta por un IntersectionObserver al 15 % visible, una sola vez). Nada más se mueve. Sin hover salvo el subrayado de los enlaces.
6. **Colores del texto:** crema; descripciones crema al 85 %; etiquetas y micro al 60 %. Ningún color de acento, ninguna imagen.
7. **Anclas:** `#metodo`, `#trabajo`, `#precios`, `#contacto`, para que la píldora y el enlace de la cabecera funcionen.
8. **Presupuesto acumulado** ≤ 1,2 MB con el vídeo de cierre. Hoy 236 KB; estas cuatro secciones no añaden ningún archivo (solo HTML y CSS, ~10 KB); el paso 4 añade cierre-1280.webm (121 KB) + poster. Previsión: ~380 KB.

## 3 · Método (`#metodo`)

1. **Contenido:** kicker «EL MÉTODO» (UI). Título «OAE-360 — un método, cinco fases» (Display). Cinco fases, texto exacto: 1 Objetivos · Qué necesita el negocio. / 2 Auditoría 360 · Dónde está hoy, canal por canal. / 3 Mapa de oportunidades · Qué se hace primero y por qué. / 4 Plan de acción · Cómo se ejecuta y cómo se mide. / 5 Ejecución · Mes a mes.
2. **Composición:** título en columnas 1-7. Debajo, cinco filas separadas por línea fina: número en UI (col 1), nombre de la fase en Display (cols 2-7), descripción en Párrafo alineada a la línea base del nombre (cols 8-12).
3. Filas a `padding-block` 1.5rem; la última también cierra con línea.
4. **Móvil:** número y nombre en una línea (nombre a `min(--k-h1, 10.1vw)` como el H1), descripción debajo.
5. **Motion:** cascada de las cinco filas al entrar la sección (índices 0-4).
6. Sin la frase «Lo que nos diferencia…» de la sección a sangre de la home: no es una de las cuatro secciones pedidas. Queda apuntada en NOTAS-paso-3.md.
7. Sin la barra de avance ni la escena fija de la home (C25): aquí el único gesto es el fade.
8. Enlace: ninguno (la home no tiene enlace en esta sección).

## 4 · Trabajo (`#trabajo`)

1. **Contenido:** kicker «TRABAJO». Título «Seis proyectos». Seis filas, en el orden de la home, cada una con: número (01-06), la etiqueta de la home (p. ej. «Proyecto de muestra · Servicios locales»), el titular exacto de la tarjeta de la home, las **tres cifras de la página del caso** con su pie, y el enlace «Ver el proyecto →» a la URL publicada del caso.
2. **Cifras, tal como están en cada caso:** Verbena: 202 KB pesa la página entera, con su portada animada dentro · 1,0 s tarda en pintarse el titular en un móvil de gama media · 0 recursos de terceros: ni una fuente, ni un script, ni un píxel de fuera. Aura: 5 pantallas de tienda funcionando dentro de esta página, no en un vídeo · 21 controles que se pueden tocar sin salir del caso · 2,0 s tarda en pintarse el titular en un móvil de gama media, con el 3D dentro. Casa Lumen: 184 KB pesa la página entera, panel incluido · 1,8 s tarda en pintarse el titular en un móvil de gama media · 0 imágenes: todo lo que se ve está dibujado por el navegador. Meridian: 8 controles que se pueden tocar para ver el antes y el después · 191 KB pesa la página entera · 1,7 s tarda en pintarse el titular en un móvil de gama media. Brasa & Sal: 3 locales que se cambian sin recargar, en el selector de la página · 295 KB pesa la página entera, con la portada de brasas dentro · 2,0 s tarda en pintarse el titular en un móvil de gama media. Sobremesa: 23 piezas de contenido reales dentro de la página, no descritas · 329 KB pesa la página entera, con las 23 piezas · 2,0 s tarda en pintarse el titular en un móvil de gama media. **Ningún caso sin cifra**: no hay nada que listar como faltante.
3. **Composición de cada fila** (línea fina arriba; la última también abajo): col 1 número UI; cols 1-2 etiqueta UI al 60 % debajo del número; cols 3-6 titular en Párrafo con Frank Ruhl 700 (es el texto largo de la tarjeta: a Display no cabe); cols 7-12 las tres cifras en tres columnas de dos: la **primera cifra en Display**, las otras dos en Párrafo con Frank Ruhl 700; los pies en Micro debajo de cada cifra. Enlace «Ver el proyecto →» en UI subrayado, bajo el titular.
4. Sin miniaturas: la home las lleva, pero aquí la única imagen de la página es el vídeo; las seis miniaturas (79 KB en WebP de 480) quedan fuera a propósito y se apunta en NOTAS-paso-3.md por si Zyad las quiere.
5. Sin la rúbrica desplegable de la home (7/9, 2/5, AA, 1,24 s, 0,0006): son cifras del sitio, no del caso, y piden un control interactivo que no es el gesto permitido.
6. Cierre de la sección: la frase de dos enlaces de la home, en UI subrayado: «Ver el portfolio completo (6 casos) →» (a /portfolio/) · «Los tres niveles de web, con demos que funcionan →» (a /levels.html).
7. **Móvil:** número + etiqueta, titular, las tres cifras en una fila de tres (Display la primera), enlace.
8. **Motion:** cascada de las seis filas (índices 0-5).

## 5 · Precios (`#precios`)

1. **Contenido:** kicker «PRECIOS». Título «Los precios, publicados». Dos grupos con su contexto en Micro: «Tu web, una vez» · «Una web de agencia en Barcelona va de 1.300 € a 6.000 €.» y «Y cada mes, si quieres» · «Una pyme española paga entre 400 € y 1.500 € al mes de agencia.»
2. **Planes, texto exacto de la home**, tres filas por grupo separadas por línea fina: Presencia · «Para el que necesita existir bien y que le encuentren.» · 890 € · Una página larga, pensada para el móvil / Tu ficha de Google conectada / Medición desde el primer día, sin cookies. Catálogo («La más elegida») · «Para el que tiene carta, servicios o tarifas.» · 1.290 € · Todo lo de Presencia / **Una página por servicio, generada desde un solo listado**: cambias un precio y se actualizan la web, la carta en PDF y las plataformas / Reserva integrada / Datos que los buscadores con IA saben leer. Motor · «Para el que quiere que la web le traiga clientes.» · 1.790 € · Todo lo de Catálogo / Landings de campaña / El contenido inicial escrito / **Tres meses de ajustes** con los datos delante. Al día · «Que tu ficha y tus reseñas no se queden atrás.» · 300 € al mes · Tu ficha de Google trabajada / Motor de reseñas: pedirlas y responderlas / Informe mensual. En marcha («La más elegida») · «Que además haya algo nuevo cada semana.» · 600 € al mes · Todo lo de Al día / **Cuatro piezas de contenido al mes** / Recordatorios de cita por WhatsApp / **Tu visibilidad en buscadores con IA, medida cada mes**. A fondo · «Que no tengas que acordarte de nada.» · 900 € al mes · Todo lo de En marcha / **Ocho piezas al mes** / Mantenimiento de la web / Posicionamiento local y revisión trimestral con los datos.
3. **Composición de cada fila de plan:** cols 1-3 nombre del plan en UI y, si lo tiene, «La más elegida» en Micro debajo; cols 4-7 la frase «Para el que…» en Párrafo; cols 8-9 el precio en Display («al mes» en UI debajo); cols 10-12 la lista en Párrafo al 85 %, un renglón por punto, sin viñetas, con las negritas de la home.
4. Título del grupo en UI (crema al 100 %) con su contexto en Micro a la derecha, en la misma línea, sobre la primera línea fina del grupo.
5. **Tras el primer grupo, las dos tiras de la home como dos filas más:** «Antes de nada, la **Foto del Día 0** — gratis» · «Miramos tu web, tu ficha de Google, tu Instagram y tus reseñas desde fuera, y te lo contamos en 20 minutos.» · enlace «Pídela» (UI subrayado, a `#contacto`); y «¿Prefieres el mapa entero antes de decidir?» · «El **Diagnóstico + Plan** son los ocho canales auditados y un plan priorizado, con responsable y fecha por acción.» · 690 € en Display.
6. Pie de la sección en Micro: «Precios sin IVA · los servicios mensuales tienen permanencia de 3 meses y después se cancelan avisando con 30 días.» (es la letra pequeña del pie de la home, aquí junto a los precios porque es de ellos).
7. **Móvil:** nombre + precio en una línea, frase debajo, lista debajo.
8. **Motion:** cascada por filas dentro de cada grupo (índices 0-2, y 0-1 en las tiras).

## 6 · Cierre (`#contacto`)

1. **Contenido:** título «Empecemos por tu Foto del Día 0» (Display, cols 1-8). Párrafo «Dinos qué negocio tienes y dónde está. Lo miramos como lo ve alguien que aún no te conoce.»
2. **Las cuatro preguntas de la home**, cuatro columnas de tres (cols 1-3, 4-6, 7-9, 10-12) sobre una línea fina: «Qué recibes» · Una página con tres huecos concretos · Siete comprobaciones, y **la captura de lo que ChatGPT responde hoy cuando le preguntan por un negocio como el tuyo**. / «Cuánto tarda» · Dos días laborables · Con fecha antes de empezar. / «Qué pasa después» · Te llamamos 20 minutos · Para explicártelo. Si no te encaja, no volvemos a escribir. / «Qué necesitamos de ti» · Ni una contraseña · Todo con **información pública**: lo mismo que ve cualquier cliente tuyo. Etiqueta en UI al 60 %, valor en Párrafo con Frank Ruhl 700, detalle en Micro.
3. Debajo: «**Gratis y sin compromiso.** Preferimos empezar enseñando algo, no pidiéndolo.» en Párrafo, y la nota del formulario de la home: «**Sin accesos. Sin compromiso.** Respondemos en dos días laborables. No te apuntamos a ninguna lista.» en Micro.
4. **El CTA:** un solo enlace en UI subrayado, texto del botón de la home «Pedir mi Foto del Día 0», que lleva al formulario real de la home (`/#contacto`). **El formulario no se reconstruye en el test**: es de Formspree y recibe contactos reales; una página de prueba con noindex no debe generar envíos. Se apunta en NOTAS-paso-3.md.
5. Composición: título y párrafo arriba (cols 1-8); las cuatro columnas; la línea de «Gratis…»; el enlace CTA a la derecha (cols 10-12, alineado a la derecha) en la misma fila que la nota.
6. Esta sección es la que en el paso 4 recibe `cierre-1280` de fondo y se funde con el pie; aquí se construye sobre el fondo sólido y con un `padding-block` mayor (8rem) para dejar sitio al vídeo.
7. **Móvil:** todo apilado; las cuatro preguntas en una columna con línea fina entre ellas.
8. **Motion:** cascada de título, párrafo, las cuatro columnas y el CTA (índices 0-6).

## Lo que va a NOTAS-paso-3.md al construir
- Cifras: ninguna falta (los seis casos tienen tres).
- Fuera a propósito: miniaturas de los casos, rúbrica desplegable, frase a sangre, testimonios (comentados en la home), sección «Una persona, y da la cara», formulario.
- Peso y LCP tras construir; comprobación de que la escala sigue en cuatro tamaños (contar los `font-size` distintos en la página).
