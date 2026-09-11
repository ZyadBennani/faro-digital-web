# faro-digital.pages.dev — la web de Faro Digital, en abierto

El código de [la web en producción](https://faro-digital.pages.dev) de Faro Digital, estudio de marketing digital y desarrollo web para negocio local en Barcelona.

> **EN** — The production website of Faro Digital, a Barcelona web & digital-marketing studio, published as-is: no build step, no framework, semantic HTML with measured performance. Comments document the real decisions.

## Por qué está en abierto

Vendemos webs diciendo "verificamos antes de publicar" y "sin humo". La forma más honesta de sostenerlo es dejar que cualquiera lea el código de la nuestra: HTML semántico sin framework, CSS con las decisiones comentadas (los comentarios cuentan por qué, no qué), medición propia **sin cookies y sin datos personales** (`assets/medicion.js`), y schema.org/GEO aplicado en casa antes de venderlo.

## Cómo se trabaja esta web

- **Sin build en el navegador.** Lo que hay aquí es lo que se sirve. Un `construir.py` interno ensambla la carpeta de publicación y la **verifica** —páginas, funciones, idioma, recursos rotos— antes de promocionar nada a producción.
- **Este repositorio es un espejo, no la fuente.** Se regenera desde la carpeta que se despliega. `index.html` pesa aquí exactamente los mismos 112.805 bytes que devuelve la web en vivo; si un día no coinciden, manda la web.
- **Cada decisión, escrita.** Los comentarios largos del código no son ruido: son el registro de por qué las cosas son como son, incluidos los errores que motivaron cada regla.

Las herramientas de QA están publicadas en [faro-digital-toolkit](https://github.com/ZyadBennani/faro-digital-toolkit), con [demos en vivo](https://zyadbennani.github.io/faro-digital-toolkit/).

## Estructura

```
index.html                  portada
levels.html                 los 4 niveles de construcción web, con demos
audit.html · check.html     auditoría gratuita y comprobador
hola*.html                  páginas de entrada por sector
signal*.html                The Faro Signal — contenido educativo
privacidad.html · 404.html
portfolio/                  6 casos de muestra (proyectos spec, etiquetados como tales)
assets/medicion.js          medición sin cookies, comentada línea a línea
functions/api/              funciones de Cloudflare (formulario y medición)
test/                       experimentos de portada, con noindex — ver abajo
```

## Sobre `test/`

`test/faro/`, `test/faro-v1/` y `test/kaito/` son **experimentos de portada publicados con `noindex`**. Están aquí a propósito: el taller también se enseña.

- **`test/kaito/`** — cerrado y archivado el 4-sep-2026. El jurado le dio 7,29 y la regla pedía 7,5, así que no sustituyó a la portada. El veredicto entero está en `test/kaito/DECISION.md`.
- **`test/faro/`** — la pieza firma, en evaluación. Las notas de cada versión están en `NOTAS-pieza.md` y el procedimiento reproducible en `PROCEDIMIENTO-PIEZA-FIRMA.md`, incluida la tabla de lo que salió mal.

Lo que **no** está aquí, y es deliberado: las capturas del banco de pruebas y los clips sin comprimir. Pesaban 369 MB, se regeneran, y las del jurado incluían pantallazos de webs de terceros que no nos toca redistribuir.

## Historia

Hasta el 11-sep-2026 este repositorio era espejo de `faro-digital.netlify.app`, que dejó de servirse. El contenido anterior sigue accesible en el tag [`pre-limpieza-2026-09-11`](https://github.com/ZyadBennani/faro-digital-web/releases/tag/pre-limpieza-2026-09-11).

---

**Zyad Bennani** · Barcelona · zyadbennani2000@gmail.com

Este repo es un espejo de lo publicado: la fuente de verdad es la web en producción. Sin licencia de reutilización del contenido y el diseño de marca — el código, como referencia, se puede leer y aprender libremente.
