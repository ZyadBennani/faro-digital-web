# faro-digital.netlify.app — la web de Faro Digital, en abierto

El código de [la web en producción](https://faro-digital.netlify.app) de [Faro Digital](https://faro-digital.netlify.app), estudio de marketing digital y desarrollo web para negocio local en Barcelona.

> **EN** — The production website of Faro Digital, a Barcelona web & digital-marketing studio, published as-is: no build step, no framework, semantic HTML with measured performance. Comments document the real decisions.

## Por qué está en abierto

Vendemos webs diciendo "verificamos antes de publicar" y "sin humo". La forma más honesta de sostenerlo es dejar que cualquiera lea el código de la nuestra: HTML semántico sin framework ni build, CSS con las decisiones comentadas (los comentarios cuentan por qué, no qué), medición propia **sin cookies y sin datos personales** (`assets/medicion.js`), y schema.org/GEO aplicado en casa antes de venderlo.

## Cómo se trabaja esta web

- **Sin build.** Lo que ves es lo que se sirve. Un `construir.py` interno ensambla el borrador y lo **verifica** (páginas, funciones, idioma, recursos rotos) antes de promocionar nada a producción.
- **Vigilancia nocturna.** Un robot comprueba cada noche la web publicada — disponibilidad, canonical, Open Graph, recursos rotos y hasta que ningún comentario filtre datos que no debe — y abre un aviso si algo se rompe.
- **Cada decisión, escrita.** Los comentarios largos del código no son ruido: son el registro de por qué las cosas son como son, incluidos los errores que motivaron cada regla.

Las herramientas de QA que se citan arriba están publicadas en [faro-digital-toolkit](https://github.com/ZyadBennani/faro-digital-toolkit), con [demos en vivo](https://zyadbennani.github.io/faro-digital-toolkit/).

## Estructura

```
index.html              # portada (español, un solo CTA)
levels.html             # los 4 niveles de construcción web, con demos
audit.html · check.html # auditoría gratuita y comprobador
signal*.html            # The Faro Signal — contenido educativo
portfolio/              # casos de muestra (proyectos spec, etiquetados como tales)
assets/medicion.js      # medición sin cookies, comentada línea a línea
netlify/functions/      # funciones serverless del formulario
```

---

**Zyad Bennani** · Barcelona · zyadbennani2000@gmail.com

Este repo es un espejo de lo publicado: la fuente de verdad es la web en producción. Sin licencia de reutilización del contenido y el diseño de marca — el código, como referencia, se puede leer y aprender libremente.
