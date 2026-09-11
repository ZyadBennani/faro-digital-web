# SPEC · Secciones 3-6 de `/test/kaito` · Paso 3 [FABLE escribe · FABLE construye · OPUS corrige]

**Fecha:** 03-sep-2026 · **Estado:** revisada por Fable en Big Project, cuatro cambios de Zyad aplicados (marcados «R1»), **construida desde esta versión sin cambiar nada más.**

Todo el copy es el de la home actual (`Sitio-Web/index.html`, 2-sep-2026), palabra por palabra, incluidas negritas. Ni una frase nueva, ni una cifra que no esté en la home o en la página del caso.

## 0 · Reglas comunes a las cuatro secciones

1. **Fondo** `rgb(25 38 34)` (el color medio del vídeo, ya es `--k-fondo`) en las cuatro. Entre la sección 2 y la 3, **degradado de 20 vh** de transparente a sólido: una franja absoluta en los últimos 20 vh de la escena de 200vh, `linear-gradient(to bottom, transparent, rgb(25 38 34))`, por encima del vídeo y por debajo de la cabecera. Desde ahí el vídeo no vuelve hasta el cierre (paso 4).
2. **Escala (R1): cinco tamaños y ninguno más.** **Display** = el del H1 (clamp 2.75-4.5rem calculado desde el ancho libre hasta la torre; en móvil `min(…, 10.1vw)`), Frank Ruhl 700, solo para los títulos de sección. **Título de fila** = 2.25rem, Frank Ruhl 700, line-height 1.05: nombres de fase, titulares de caso, precios y las cuatro respuestas del cierre; es el que ya existe en la sección 2 (titulares de bloque). **Párrafo** = 1.0625rem / 1.5. **UI** = 0.8125rem, mayúsculas, .06em, peso 500. **Micro** = 0.75rem / 1.4, crema al 60 %. Las tres cifras de caso van en Párrafo con Frank Ruhl 700, ninguna en Display. Para que el recuento de `font-size` computados dé exactamente cinco, la sección 2 se ajusta a la misma escala: «Qué ofrecemos» a Display, titulares de bloque a 2.25rem fijos (antes `clamp(1.5rem, 2.4vw, 2.25rem)`), descripciones a Párrafo (antes 1rem).
3. **Rejilla** de 12 columnas, gap 1.5rem, márgenes del hero (1.5 / 2.5 / 3.5rem). Cada sección: `padding-block` 6rem en escritorio, 4rem en móvil. La píldora sigue fija arriba: la cabecera entera (`.hero-arriba`) pasa a `position: fixed` en escritorio, con la misma rejilla y márgenes; en móvil sigue en la parte alta del hero y se va con el scroll.
4. **Líneas finas horizontales** `1px rgb(245 239 228 / .25)` para separar filas. Ningún borde de caja, ninguna sombra, ningún círculo numerado; los «01-06», «1-5» y los números van como texto en UI, crema al 60 %.
5. **Un solo gesto de motion:** cada fila entra con el fade en cascada del paso 2 (transición, 700 ms, 10 px, 120 ms por índice, `.es-visible` puesta por un IntersectionObserver al 15 % visible, una sola vez). Nada más se mueve. Sin hover salvo el subrayado de los enlaces.
6. **Colores del texto:** crema; descripciones crema al 85 %; etiquetas y micro al 60 %. Ningún color de acento. Las únicas imágenes además del vídeo son las seis miniaturas de Trabajo (R1).
7. **Anclas:** `#servicios` (la sección 2, R1: ya lo lleva), `#metodo`, `#trabajo`, `#precios`, `#contacto`, para que la píldora y el enlace de la cabecera funcionen.
8. **Presupuesto acumulado** ≤ 1,2 MB con el vídeo de cierre. Hoy 236 KB; estas secciones añaden ~12 KB de HTML y CSS y las seis miniaturas WebP de 480 (79 KB, con `loading="lazy"`); el paso 4 añade cierre-1280.webm (121 KB) + poster. Previsión: ~460 KB.

## 3 · Método (`#metodo`)

1. **Contenido:** kicker «EL MÉTODO» (UI). Título «OAE-360 — un método, cinco fases» (Display). Cinco fases, texto exacto: 1 Objetivos · Qué necesita el negocio. / 2 Auditoría 360 · Dónde está hoy, canal por canal. / 3 Mapa de oportunidades · Qué se hace primero y por qué. / 4 Plan de acción · Cómo se ejecuta y cómo se mide. / 5 Ejecución · Mes a mes.
2. **Composición:** título en columnas 1-7. Debajo, cinco filas separadas por línea fina: número en UI (col 1), nombre de la fase en Título de fila (cols 2-7) (R1), descripción en Párrafo alineada a la línea base del nombre (cols 8-12).
3. Filas a `padding-block` 1.5rem; la última también cierra con línea.
4. **Móvil:** número y nombre en una línea, descripción debajo.
5. **Motion:** cascada de las cinco filas al entrar la sección (índices 0-4).
6. Sin la frase «Lo que nos diferencia…» de la sección a sangre de la home: no es una de las cuatro secciones pedidas. Queda apuntada en NOTAS-paso-3.md.
7. Sin la barra de avance ni la escena fija de la home (C25): aquí el único gesto es el fade.
8. Enlace: ninguno (la home no tiene enlace en esta sección).

## 4 · Trabajo (`#trabajo`)

1. **Contenido:** kicker «TRABAJO». Título «Seis proyectos». Seis filas, en el orden de la home, cada una con: número (01-06), la etiqueta de la home (p. ej. «Proyecto de muestra · Servicios locales»), la miniatura de la home (R1), el titular exacto de la tarjeta de la home, las **tres cifras de la página del caso** con su pie, y el enlace «Ver el proyecto →» a la URL que usa la home.
2. **Cifras:** se copian con un script desde cada `Portfolio/Caso-*.html` (los pares `span.cifra` + `span.pie`), no de memoria; NOTAS-paso-3.md lo confirma con el listado extraído. Los seis casos tienen tres cifras: no falta ninguna.
3. **Composición de cada fila (R1)** (línea fina arriba; la última también abajo): col 1 número UI y, debajo, la etiqueta UI al 60 %; **cols 2-4 la miniatura** (WebP de 480 de la home, `width: 100%`, sin borde ni radio, con el `alt` de la home, `loading="lazy"`); **cols 5-8 el titular en Título de fila** con el enlace «Ver el proyecto →» en UI subrayado debajo; **cols 9-12 las tres cifras**, apiladas, cada una con el número en Párrafo Frank Ruhl 700 y el pie en Micro.
4. Las miniaturas se copian a `media/casos/` (seis archivos, 79 KB) para que la página sea autocontenida en la publicación.
5. Sin la rúbrica desplegable de la home (7/9, 2/5, AA, 1,24 s, 0,0006): son cifras del sitio, no del caso, y piden un control interactivo que no es el gesto permitido.
6. Cierre de la sección: la frase de dos enlaces de la home, en UI subrayado: «Ver el portfolio completo (6 casos) →» (a /portfolio/) · «Los tres niveles de web, con demos que funcionan →» (a /levels.html).
7. **Móvil:** número + etiqueta, miniatura a todo el ancho, titular, las tres cifras apiladas, enlace.
8. **Motion:** cascada de las seis filas (índices 0-5).

## 5 · Precios (`#precios`)

1. **Contenido:** kicker «PRECIOS». Título «Los precios, publicados». Dos grupos con su contexto en Micro: «Tu web, una vez» · «Una web de agencia en Barcelona va de 1.300 € a 6.000 €.» y «Y cada mes, si quieres» · «Una pyme española paga entre 400 € y 1.500 € al mes de agencia.»
2. **Planes, texto exacto de la home**, tres filas por grupo separadas por línea fina: Presencia · «Para el que necesita existir bien y que le encuentren.» · 890 € · Una página larga, pensada para el móvil / Tu ficha de Google conectada / Medición desde el primer día, sin cookies. Catálogo («La más elegida») · «Para el que tiene carta, servicios o tarifas.» · 1.290 € · Todo lo de Presencia / **Una página por servicio, generada desde un solo listado**: cambias un precio y se actualizan la web, la carta en PDF y las plataformas / Reserva integrada / Datos que los buscadores con IA saben leer. Motor · «Para el que quiere que la web le traiga clientes.» · 1.790 € · Todo lo de Catálogo / Landings de campaña / El contenido inicial escrito / **Tres meses de ajustes** con los datos delante. Al día · «Que tu ficha y tus reseñas no se queden atrás.» · 300 € al mes · Tu ficha de Google trabajada / Motor de reseñas: pedirlas y responderlas / Informe mensual. En marcha («La más elegida») · «Que además haya algo nuevo cada semana.» · 600 € al mes · Todo lo de Al día / **Cuatro piezas de contenido al mes** / Recordatorios de cita por WhatsApp / **Tu visibilidad en buscadores con IA, medida cada mes**. A fondo · «Que no tengas que acordarte de nada.» · 900 € al mes · Todo lo de En marcha / **Ocho piezas al mes** / Mantenimiento de la web / Posicionamiento local y revisión trimestral con los datos.
3. **Composición de cada fila de plan:** cols 1-3 nombre del plan en UI y, si lo tiene, «La más elegida» en Micro debajo; cols 4-7 la frase «Para el que…» en Párrafo; cols 8-9 el precio en Título de fila (R1) («al mes» en UI debajo); cols 10-12 la lista en Párrafo al 85 %, un renglón por punto, sin viñetas, con las negritas de la home.
4. Título del grupo en UI (crema al 100 %) con su contexto en Micro a la derecha, en la misma línea, sobre la primera línea fina del grupo.
5. **Tras el primer grupo, las dos tiras de la home como dos filas más:** «Antes de nada, la **Foto del Día 0** — gratis» · «Miramos tu web, tu ficha de Google, tu Instagram y tus reseñas desde fuera, y te lo contamos en 20 minutos.» · enlace «Pídela» (UI subrayado, a `#contacto`); y «¿Prefieres el mapa entero antes de decidir?» · «El **Diagnóstico + Plan** son los ocho canales auditados y un plan priorizado, con responsable y fecha por acción.» · 690 € en Título de fila (R1). Los dos titulares de tira en Párrafo con Frank Ruhl 700.
6. Pie de la sección en Micro: «Precios sin IVA · los servicios mensuales tienen permanencia de 3 meses y después se cancelan avisando con 30 días.» (es la letra pequeña del pie de la home, aquí junto a los precios porque es de ellos).
7. **Móvil:** nombre + precio en una línea, frase debajo, lista debajo.
8. **Motion:** cascada por filas dentro de cada grupo (índices 0-2, y 0-1 en las tiras).

## 6 · Cierre (`#contacto`)

1. **Contenido:** título «Empecemos por tu Foto del Día 0» (Display, cols 1-8). Párrafo «Dinos qué negocio tienes y dónde está. Lo miramos como lo ve alguien que aún no te conoce.»
2. **Las cuatro preguntas de la home**, cuatro columnas de tres (cols 1-3, 4-6, 7-9, 10-12) sobre una línea fina: «Qué recibes» · Una página con tres huecos concretos · Siete comprobaciones, y **la captura de lo que ChatGPT responde hoy cuando le preguntan por un negocio como el tuyo**. / «Cuánto tarda» · Dos días laborables · Con fecha antes de empezar. / «Qué pasa después» · Te llamamos 20 minutos · Para explicártelo. Si no te encaja, no volvemos a escribir. / «Qué necesitamos de ti» · Ni una contraseña · Todo con **información pública**: lo mismo que ve cualquier cliente tuyo. Etiqueta en UI al 60 %, respuesta en Título de fila (R1), detalle en Micro.
3. Debajo: «**Gratis y sin compromiso.** Preferimos empezar enseñando algo, no pidiéndolo.» en Párrafo.
4. **El CTA (R1):** bajo esa línea, un solo enlace en UI subrayado «Pedir mi Foto del Día 0 →», alineado a la izquierda en columnas 1-4, que lleva al formulario real de la home (`/#contacto`); debajo, la nota del formulario de la home en Micro: «**Sin accesos. Sin compromiso.** Respondemos en dos días laborables. No te apuntamos a ninguna lista.» **El formulario no se reconstruye en el test**: es de Formspree y recibe contactos reales; una página de prueba con noindex no debe generar envíos.
5. Composición: título y párrafo arriba (cols 1-8); las cuatro columnas; «Gratis…» (cols 1-6); el enlace (cols 1-4); la nota (cols 1-6).
6. Esta sección es la que en el paso 4 recibe `cierre-1280` de fondo y se funde con el pie; aquí se construye sobre el fondo sólido y con un `padding-block` mayor (8rem) para dejar sitio al vídeo.
7. **Móvil:** todo apilado; las cuatro preguntas en una columna con línea fina entre ellas.
8. **Motion:** cascada de título, párrafo, las cuatro columnas, «Gratis…» y el CTA (índices 0-7).

## Lo que va a NOTAS-paso-3.md al construir
- Cifras: listado extraído por script de los seis `Caso-*.html` (confirmación de que no se han copiado de memoria).
- Fuera a propósito: rúbrica desplegable, frase a sangre, testimonios (comentados en la home), sección «Una persona, y da la cara», formulario.
- Medidas pedidas por Zyad: peso total y LCP en 4G + CPU ×4; `font-size` computados distintos (5); CLS; fps en el scroll de las secciones 3-6 con CPU ×4; contraste de crema al 85 % y al 60 % sobre rgb(25,38,34); altura total en pantallas a 1440 y 390; palabras frente a la home actual.
