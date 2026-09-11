# Test «método Kaito» · Paso 1 · Hero desde spec · [FABLE · High]

**Fecha:** 03-sep-2026 · **Estado:** construido y medido, **parado en la ronda de corrección de Zyad** (máximo cinco cambios, formato «1. … 2. …»).

Archivos: `index.html`, `kaito.css`, `kaito.js` en `faro-digital-web/test/kaito/`. Reutiliza `../../assets/fuentes.css` y `../../assets/motion.css` (copiado desde `Sitio-Web/assets/`, es el mismo archivo generado). Capturas y JSON de medidas en `_capturas/`.

## Medidas (Chrome 152 instalado, vía Playwright; red 4G 1,6 Mbps / 150 ms y CPU ×4, los valores de Lighthouse)

| | 1440×900 | 390×844 |
|---|---|---|
| Peso total cargado, vídeo incluido | **238 KB** | **167 KB** |
| Vídeo elegido | hero-1280.webm (65 KB) | hero-720.mp4 (44 KB) |
| Poster | poster-hero.jpg (59 KB) | poster-hero-720.jpg (9 KB) |
| Fuentes (2 woff2 latin) | 92 KB | 92 KB |
| LCP en 4G + CPU ×4 | **1,47 s** | **1,14 s** |
| Poster pintado (llegada del recurso, 4G) | 1,45 s | — |
| H1 | 93,6 px · 2 líneas · top 46,0 % | 39,4 px · 2 líneas · top 46,0 % |
| Bajada | 2 líneas, 360 px (34ch) | oculta |
| Reduced-motion | sin vídeo · faro-16x9.webp (43 KB) · 156 KB | sin vídeo · faro-3x4.webp (73 KB) · 187 KB |

Presupuesto del hero (≤ 1,4 MB con webm): **cumplido con 238 KB**. LCP ≤ 2,5 s: cumplido.

**Sobre «el LCP debe ser el poster».** Chrome no reporta como LCP una imagen que cubre todo el viewport: la trata como fondo. Probado: con el poster al 60 % de ancho sí sale como LCP (a 1,50 s); a tamaño completo, el elemento reportado es la primera línea del H1 (1,47 s). El poster llega a 1,45 s, así que a efectos prácticos son el mismo instante. El vídeo se descarga después y no lo bloquea. Lo que sí retrasa el poster son las dos fuentes precargadas, que compiten por el ancho de banda (llegan a 1,26 y 1,35 s). Se deja así: quitarlas de la precarga adelantaría el poster ~0,3 s a cambio de un cambio de fuente visible durante la revelación del H1.

## Las tres decisiones que no cubría la spec

1. **La bajada.** La home no tiene subtítulo desde el 1-sep (Zyad lo quitó; está en un comentario del HTML). Texto real más cercano, en la página hoy: la primera frase del servicio 01, «Tu web, tu ficha de Google, tu Instagram y tus reseñas, mirados desde fuera.» Cabe en dos líneas a 34ch.
2. **El poster es un `<picture>` debajo del vídeo, no el atributo `poster`.** El atributo no admite `fetchpriority`, ni `srcset`, ni media queries; el `<picture>` sí: poster de 1920 en escritorio, de 720 en ≤ 640 px, y con `prefers-reduced-motion` la imagen fija (faro-16x9 / faro-3x4 en WebP, generados a ≤ 200 KB: 43 y 73 KB) sin descargar poster ni vídeo. Siguiendo la instrucción de Zyad, el poster es el primer fotograma (poster-hero.jpg), no la lámina 16:9, para que el arranque del vídeo no dé salto. La elección de fuente del vídeo también va en HTML: `media=` en cada `<source>` (Chromium, Safari y Firefox lo respetan); con reduced-motion ninguna coincide y no se pide ni un byte de vídeo.
3. **El H1 en móvil baja de 44 px.** «Todos los ángulos.» en Frank Ruhl 700 a 44 px mide 375 px y el móvil de 390 deja 342 (el de 360, 312): a 44 px salían 3 y 4 líneas. Por debajo de 435 px el H1 va a 10,1vw (39 px a 390, 36 px a 360) y se queda en las dos líneas que manda la spec.

Otras, menores:
- Las clases `.hero-zoom`, `.hero-reveal` y `.hero-fade` viven en `kaito.css`, no en `motion.css`: ese archivo es generado («no se edita a mano»). Usan sus tokens: `--m-estandar` es exactamente `cubic-bezier(.2,.7,.2,1)` y `--m-lento` son los 900 ms. No existe `superficie.css` en el sitio.
- Píldora con 4 de los 5 enlaces de la home (Qué hacemos, Método, Trabajo, Precios; fuera «Demos»). El enlace de arriba a la derecha lleva el texto exacto de la home, «Pide tu Foto del Día 0 — gratis».
- La ciudad y el año: «Barcelona, 2026». El año no está en la home (el copyright no lo lleva).
- El botón «Menú» abre una lista plana con los 4 enlaces y la oferta, sin animación.
- `6.5vw` da 93,6 px a 1440, no los 96 que dice la nota de responsive de la spec; se ha respetado la fórmula literal.
- El tamaño «micro» (0.75rem) queda definido y sin usar: la spec no lo asigna a nada.

## Para la ronda de Zyad (lo que yo miraría)

- El H1 centrado cruza la base de la torre y el horizonte. La spec lo pide centrado a top 46 % y la linterna queda libre, pero el faro no queda «entre el H1 y el borde inferior»: con una torre tan alta, esa frase de la spec no se puede cumplir a la vez que la del 46 %.
- La píldora de navegación sobre el cielo casi negro: se ve, pero es muy discreta.

## Coste (H3)

Fable 5.1, una pasada. Dos correcciones propias antes de enseñar (H1 móvil a 3-4 líneas; selección del vídeo móvil hecha tarde por un script inline que esperaba a los CSS). Cero rondas de Zyad todavía. Tiempo de pared: ~15 min desde el prompt (14:10) hasta las capturas.

## Aviso de despliegue

Esta carpeta está en `faro-digital-web/` (el espejo público de GitHub). La fuente real del sitio es `Marketing Digital/Freelance-Internacional/Sitio-Web/` y se publica con `construir.py` → `publicar/` en faro-digital.pages.dev. Para que `/test/kaito` exista en la web habrá que copiar la carpeta a `Sitio-Web/test/kaito/` y comprobar que `construir.py` la incluye. Netlify (faro-digital.netlify.app) responde hoy 503 «usage exceeded».

---

## Ronda de corrección 1 (dictada por Zyad tras la revisión de Fable, aplicada en una pasada)

1. **H1 a la izquierda, sobre el mar vacío.** Fila central de la rejilla, centrado entre la píldora y el párrafo (a 1440×900: píldora acaba en 91, párrafo empieza en 793, bloque 324-560). Techo 5rem, hasta tres líneas. El ancho es `min(42vw, borde de la torre − margen − una columna)`: la torre no está en un porcentaje fijo porque `cover` recorta según la proporción del viewport, así que su borde se calcula (`50vw − 6.02dvh` en viewports más estrechos que 16:9, `46.6vw` en los más anchos) y el tamaño de letra sale de ese ancho (0,138 × ancho, «Un solo sistema.» en una línea). Medido: a 1440×900 tres líneas de 80 px, borde derecho 631 con la torre en 666; a 1024×768 tres líneas de 53 px, borde 438 con la torre en 466. En móvil sigue a 10,1vw a dos líneas y a todo el ancho; ahí la torre ocupa el centro y el H1 la cruza por fuerza.
2. **Píldora** a fondo 0,12, borde 0,28, texto crema al 100 %. Verificado por estilo computado.
3. **«Barcelona»**, sin año.
4. **Poster en WebP por ancho:** poster-hero-1920.webp (45 KB, q 90) desde 1281 px; poster-hero-1280.webp (27 KB) entre 641 y 1280; poster-hero-720.jpg (9 KB) hasta 640. Precargas con `type="image/webp"` y la misma media query. Verificado: 1440 → 1920.webp, 1000 → 1280.webp, 390 → 720.jpg.

| Tras la ronda | 1440×900 | 390×844 |
|---|---|---|
| Peso cargado con vídeo | **225 KB** | 168 KB |
| LCP en 4G + CPU ×4 | **1,32 s** | 1,12 s |
| H1 | 80 px · 3 líneas · 35 px de aire hasta la torre | 39 px · 2 líneas |

Capturas nuevas: `_capturas/hero-1440x900.png`, `hero-390x844.png` (y `hero-1024x768.png`, `-reduced`).

**Aviso sobre el prompt maestro.** Se han hecho las tres sustituciones dictadas en la sección 3 (Composición, Fuentes, Material). Quedan en esa sección dos frases que ahora contradicen la corrección y que no se han tocado porque no estaban en la lista: «Centro, ligeramente por debajo del centro óptico (top 46 %): H1 en DOS líneas, centrado» y, en Responsive, «H1: clamp cubre 44 px en 360 px de ancho y 96 px en 1440 px» y «el poster a faro-3x4.png». El archivo del prompt se ha movido de `testkaitomedia/` a `test/kaito/`, que es donde la sección 8 y el propio Zyad lo sitúan.

Receta guardada: `Marketing Digital/_Sistema/03-Recursos-Internos/Biblioteca-Referencias/Web/Recetas/hero-video-spec.md`.

**Parado.** Siguiente: paso 2 (sección 4 del prompt, vídeo fijo + cuatro bloques, Fable).
