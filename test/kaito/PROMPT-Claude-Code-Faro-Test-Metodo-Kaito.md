# PROMPT · Claude Code · Faro · Test «método Kaito» sobre la home

**Fila:** B11 · **Fecha:** 03-sep-2026 · **Duración:** un día (Zyad: 1 h de preparación la tarde anterior) · **Ruta:** `/test/kaito` con `noindex` · **Modelo de arranque:** Fable 5.1 con esfuerzo *High* (Zyad: `/model` y elige Fable; en Pro va con créditos, cuenta ~2 sesiones de Fable de la ración semanal)

> **Regla de la sesión:** este test copia el **método** del tutorial de Kaito (spec de hero al detalle + vídeos de fondo en bucle + rondas cortas de corrección + «reutiliza el estilo establecido»), no su stack ni su estética. Se construye en el stack de Faro (HTML/CSS/JS a mano, sin framework, Netlify), con la identidad de Faro (tormenta contenida verde-negro, crema, linterna cálida, Frank Ruhl Libre + Work Sans) y con el copy actual de la home. Al final se puntúa a ciegas contra la home real. Si gana, sustituye a la home.

---

## 0 · Qué estamos probando (léelo antes de tocar nada)

Tres hipótesis, en orden de valor:

1. **H1 · Materia.** Que un vídeo en bucle a sangre en la portada (la de Faro hoy no tiene ni foto) sube el jurado de la home por encima de 7,0 sin romper el presupuesto.
2. **H2 · Spec.** Que un prompt escrito al nivel de detalle del tutorial (clases, tamaños, retardos de animación, breakpoints, `100dvh`, «match every detail below exactly») produce en **un día** una portada de nivel N3 sin rondas de exploración.
3. **H3 · Modelo.** Que Fable 5.1 en *High* construye desde esa spec mejor que Opus 5. Se compara con la portada por duplicado del día 4 del restaurante; aquí solo se anota tiempo, tokens y número de correcciones.

Lo que **no** se importa del tutorial, con motivo:

- **React 18 + Vite + Tailwind.** Su hero pesa más en JS que toda la web de Faro (103 KB). Un negocio local necesita HTML servido, no una SPA.
- **Tres MP4 de 10 s a 1080p.** Son 3-10 MB. El techo de este test es **2,5 MB por página con vídeos incluidos** (techo N4), y la meta es quedar en N3 (1,2 MB).
- **Pinterest como dirección de arte.** Ya tenemos lámina y paleta. El tutorial acaba con «bordes que se ven AI-coded» dos veces porque no la tiene.
- **Marca inventada.** Aquí el contenido es real y ya escrito; no se inventa ni una frase.

---

## 1 · Antes de abrir Claude Code (Zyad, ~1 h)

### 1.1 Imagen 16:9 del faro

En Canva, misma sesión de «Générer une image», **Format 16:9**, este prompt (es el de la tormenta contenida con el hueco para el texto que pide Kaito):

```
Wide night photograph, 35mm film, fine grain, 16:9. A tall stone lighthouse
stands exactly in the center of the frame, its base and the stone pier in
the lower third, lantern room at the top lit with a warm golden light, the
only warm light in the scene. Wide empty dark sea and sky on both sides of
the lighthouse, leaving large calm areas left and right for text. Heavy
swells break against the base with cream-colored foam, but the lighthouse
stands still. Deep green-black sky and sea, dark and matte, no blue, no
lightning, no light rays, no sunset. Restrained, desaturated, editorial.
Photorealistic, no illustration, no text.
```

Genera 3, elige la que deje **más mar vacío a los lados** (ahí va el texto). Descarga PNG. Guárdala como `faro-16x9.png`. La 3:4 ya elegida se guarda como `faro-3x4.png` (será el poster y el vídeo móvil).

### 1.2 Dos vídeos de fondo

Herramienta: **Kling** (créditos diarios gratis) o **Higgsfield** (créditos de bienvenida). Sube `faro-16x9.png`, 5-10 s, 1080p, 16:9. Prompt, calcado de la fórmula del tutorial (instrucciones negativas):

```
Animate the sea only. Slow heavy swells roll toward the lighthouse and
break against its base with foam and spray, looping naturally. The
lighthouse, the pier and the camera do not move. No zoom in, no zoom out,
no pan, no change of light, no lightning, no rain, no people, no birds.
Smooth, realistic water with true depth of motion.
```

Segundo vídeo, para la sección final: sube `faro-3x4.png` (o la 16:9), mismo prompt pero añade `Extreme slow motion, almost still, the foam barely moves`. Descarga ambos.

Si el generador cambia el faro o la luz: repite, no lo aceptes. Ninguna toma con rayos.

### 1.3 Comprimir (Zyad, en PowerShell, con ffmpeg)

```
ffmpeg -i kling-hero.mp4 -t 8 -vf "scale=1280:-2" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart hero-1280.mp4
ffmpeg -i kling-hero.mp4 -t 8 -vf "scale=1280:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 -an hero-1280.webm
ffmpeg -i kling-hero.mp4 -t 8 -vf "scale=720:-2"  -c:v libx264 -crf 30 -preset slow -an -movflags +faststart hero-720.mp4
ffmpeg -i kling-cierre.mp4 -t 8 -vf "scale=1280:-2" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart cierre-1280.mp4
```

Objetivo: hero ≤ 1,2 MB en mp4 y ≤ 900 KB en webm; cierre ≤ 800 KB. Si el hero pasa de 1,5 MB, sube `-crf` a 30-31 antes de recortar segundos. Todo sin audio (`-an`).

Carpeta: `test/kaito/media/` con `faro-16x9.png`, `faro-3x4.png`, `hero-1280.mp4`, `hero-1280.webm`, `hero-720.mp4`, `cierre-1280.mp4`. Pega en la primera línea de Claude Code: «Plan: Max/Pro. Media en test/kaito/media/, pesos: …».

---

## 2 · Reglas para Claude Code

- **Stack:** HTML + CSS + JS a mano, como el resto de Faro. Cero librerías. Reutiliza `fuentes.css`, `motion.css` y `superficie.css`; no crees un sistema de tokens nuevo. Nada de Tailwind ni React aunque la spec use su vocabulario de tamaños: **traduce** `sm/md` y `text-5xl` a `clamp()` y media queries.
- **Ruta:** `/test/kaito/index.html`, `<meta name="robots" content="noindex,nofollow">`. No toques la home real.
- **Presupuesto:** ≤ 2,5 MB total con vídeos; meta 1,2 MB. LCP ≤ 2,5 s en 4G simulada, INP < 200 ms, 60 fps en Android. Todo `<video>` con `poster`, `muted playsinline loop preload="metadata"`, `<source>` webm y mp4, y `prefers-reduced-motion` → solo poster.
- **Copy:** el de la home actual, **palabra por palabra**. Si una sección de la spec no tiene copy en la home, se deja con el texto real más cercano, nunca inventado. Ni un «Lorem», ni una cifra que no exista.
- **Etiquetas de modelo:** cada paso empieza con `[FABLE]` u `[OPUS]`. Cuando toque cambiar, escribe la línea `→ ZYAD: cambia a …` y para.
- **Rondas:** máximo **una** ronda de corrección por paso, como en el tutorial. Si tras esa ronda no está, se anota y se sigue. Nada de pulir.
- **Prohibido:** overlays oscuros sobre el vídeo (Kaito lo prohíbe y tiene razón: si hace falta overlay, el vídeo es malo), tarjetas con borde y sombra, círculos numerados, degradados morados, partículas, iconos de librería, gradientes de «AI dark SaaS».

---

## 3 · Paso 1 · Hero desde spec [FABLE · High]

Este es el equivalente exacto del prompt de motionsize que Kaito pega. Está escrito con su mismo nivel de detalle. Pásalo entero.

```
Construye la portada a pantalla completa de Faro Digital en /test/kaito.
Haz coincidir cada detalle de abajo exactamente. Stack: HTML/CSS/JS a mano,
sin librerías, reutilizando fuentes.css, motion.css y superficie.css.

### Material
- Fondo: <video> a sangre, cubre 100 % del hero, object-fit: cover,
  object-position: 50% 60%. Fuentes: media/hero-1280.webm y
  media/hero-1280.mp4; en ≤ 640 px usa media/hero-720.mp4.
  <picture> bajo el vídeo con fetchpriority=high; el poster es el primer
  fotograma.
  Atributos: muted playsinline loop autoplay preload="metadata".
- SIN overlay de color. Ningún div oscuro sobre el vídeo. El contraste del
  texto se consigue colocándolo sobre las zonas de mar vacío, no oscureciendo.
- Altura: 100dvh (no 100vh) para que la barra del navegador móvil no
  recorte la sección. min-height: 560px.

### Fuentes (ya en fuentes.css)
- Titular: Frank Ruhl Libre 700. Cuerpo y UI: Work Sans 400/500.
- Escala del hero: exactamente 4 tamaños. H1 máximo 5rem; por debajo de 435 px, 10.1vw;
  con line-height 0.98 y letter-spacing -0.015em. Párrafo 1.0625rem /
  line-height 1.5. UI 0.8125rem con letter-spacing 0.06em y mayúsculas.
  Micro 0.75rem. Ningún otro tamaño en la sección.
- Color del texto: crema 245/239/228 sobre el vídeo. Sin blanco puro.

### Composición (rejilla de bordes, como Locomotive/Bureau, sin tarjetas)
- Arriba izquierda: marca «Faro Digital» en UI, mayúsculas.
- Arriba centro: píldora de navegación con 4 enlaces de la home actual,
  fondo rgba(245,239,228,0.08), borde 1px rgba(245,239,228,0.18),
  backdrop-filter: blur(8px), radio 999px, padding 0.5rem 1.25rem.
- Arriba derecha: enlace «Pide tu Foto del Día 0» en UI, subrayado fino
  1px a 0.35em, sin botón.
- Centro, ligeramente por debajo del centro óptico (top 46 %): H1 en DOS
  líneas, centrado, con el copy exacto del H1 de la home actual. Si el H1
  actual es una sola línea, pártelo por el verbo. El H1 va sobre el mar
  vacío del lado izquierdo; nunca cruza la torre ni tapa la linterna.
- Abajo izquierda: párrafo de 2 líneas máx (subtítulo actual de la home),
  ancho máx 34ch.
- Abajo derecha: bloque de 2 líneas en UI: «Sin accesos. Sin compromiso.»
  y debajo la ciudad y el año, alineado a la derecha.
- Márgenes: 1.5rem en móvil, 2.5rem desde 640 px, 3.5rem desde 1024 px.
  Todo en una rejilla de 12 columnas con gap 1.5rem.

### Animación (clases en motion.css; respeta prefers-reduced-motion)
- .hero-zoom en el poster/vídeo: scale 1.06 → 1.0 en 9s ease-out, una vez.
- Línea 1 del H1: .hero-reveal (opacity 0 → 1, translateY 18px → 0,
  filter blur(6px) → blur(0), 900 ms cubic-bezier(.2,.7,.2,1)),
  animation-delay 0.25s. Línea 2: igual con 0.42s.
- Párrafo abajo-izquierda: .hero-fade (opacity 0 → 1, translateY 10px → 0,
  700 ms), delay 0.7s. Bloque abajo-derecha: igual, delay 0.85s.
- Marca, píldora y enlace: .hero-fade con delay 1.0s.
- Nada más se mueve. Ningún hover en el hero en este paso.

### Responsive
- H1: clamp cubre 44 px en 360 px de ancho y 96 px en 1440 px.
- Píldora de navegación y enlace derecho: ocultos por debajo de 768 px;
  en su lugar un botón «Menú» arriba derecha (solo el texto, sin icono).
- Párrafo abajo-izquierda: oculto por debajo de 640 px.
- Bloque abajo-derecha: en móvil ocupa todo el ancho (left 1.5rem,
  right 1.5rem) alineado a la izquierda; desde 640 px vuelve a la derecha.
- En ≤ 640 px el vídeo cambia a hero-720.mp4 y el poster a faro-3x4.png;
  object-position: 50% 70%.

### Rendimiento
- El vídeo no bloquea el LCP: el LCP debe ser el poster. Mide y anótalo.
- fetchpriority="high" en el poster; el vídeo arranca por
  IntersectionObserver al entrar en viewport y se pausa al salir.
- Presupuesto del hero cargado: ≤ 1,4 MB con el vídeo webm.

Cuando acabes: captura a 1440×900 y 390×844, peso total, LCP, y una
lista de las tres cosas que has decidido tú porque la spec no las cubría.
```

**Ronda de corrección (una):** Zyad mira las capturas y dicta máximo cinco cambios, en el formato del tutorial («1. … 2. … 3. …»), sin justificar. Se aplican y se sigue.

---

## 4 · Paso 2 · Sección 2: vídeo fijo, texto a los lados [FABLE]

Calco del segundo prompt de Kaito, con contenido de Faro:

```
Construye la sección 2. El vídeo del hero se queda FIJO (position: sticky
o un contenedor pinned de 200vh) mientras el usuario hace scroll; los
textos del hero se desvanecen (opacity 1 → 0 en los primeros 30 vh de
scroll) y aparecen cuatro bloques de texto alrededor del faro, sin
tarjetas, sin fondo, sin overlay: dos a la izquierda y dos a la derecha,
alineados a la rejilla del hero.

Cada bloque: etiqueta en UI mayúsculas (0.8125rem, crema al 60 %),
titular en Frank Ruhl 700 clamp(1.5rem, 2.4vw, 2.25rem), y descripción
de 2 líneas en Work Sans 1rem, crema al 85 %. Los cuatro bloques son los
cuatro pilares de la oferta que ya están en la home actual (web, Google,
reseñas, contenido, con su texto exacto). Aparecen con .hero-fade en
cascada de 120 ms según el scroll (IntersectionObserver, no librerías).

Por encima de los cuatro bloques, centrado, un titular corto en la misma
receta del H1 del hero pero a clamp(1.75rem, 3vw, 2.75rem): usa el
titular de la sección de oferta de la home actual.

En móvil (≤ 768 px) los cuatro bloques se apilan bajo el vídeo, que deja
de ser sticky y pasa a una franja de 56vh con el mismo poster.
```

**Ronda de corrección (una).**

---

## 5 · Paso 3 · El resto de la página con el estilo ya establecido [FABLE → OPUS]

Aquí Kaito escribe «build the rest around 4-5 sections using the style we established… you can be creative». Es el paso que más se parece a lo que hace nuestro director de ronda. Se hace en dos mitades:

**[FABLE] Spec de secciones (15 min, sin código).** Fable escribe en `test/kaito/SPEC-secciones.md` cuatro secciones, cada una en 8 líneas: nombre, contenido exacto tomado de la home actual (método OAE-360, precios, casos, cierre), composición (rejilla, tamaños de la escala ya fijada, líneas finas en vez de tarjetas), y el único gesto de motion permitido (fade en cascada; nada más). Regla: **a partir de la sección 3 el vídeo desaparece**; el fondo pasa al **color medio del vídeo** (Kaito lo saca en Figma desenfocando; aquí: `ffmpeg -i hero-1280.mp4 -vf "scale=1:1" -frames:v 1 -f rawvideo -pix_fmt rgb24 -` o un canvas de 1×1 px sobre el poster) con una transición degradada de 20 vh de transparente a sólido entre la 2 y la 3.

`→ ZYAD: cambia a Opus 5.`

**[OPUS] Construcción.** Opus construye las cuatro secciones desde `SPEC-secciones.md` sin cambiar nada de la spec. Al acabar, captura de página completa y peso.

**Ronda de corrección (una), a lo Kaito:** «1. fondo de todas las secciones = color medio del vídeo; 2. quita todo borde de las tarjetas de precios, líneas finas horizontales en su lugar; 3. las líneas junto a las descripciones en gris crema al 25 %, no de color; 4. …».

---

## 6 · Paso 4 · Segundo vídeo: cierre + pie sin costura [OPUS]

```
Añade media/cierre-1280.mp4 como fondo de la última sección (CTA «Pide tu
Foto del Día 0») y haz que el MISMO vídeo cubra también el pie: un solo
contenedor con el vídeo y dentro las dos zonas, sin línea divisoria entre
CTA y pie, sin overlay. En el pie quita la última línea de copyright; deja
solo los tres bloques de enlaces (tres intenciones: hablar, ver casos,
Google) con sus titulares en crema puro para legibilidad y los enlaces en
crema al 75 %. poster = faro-3x4.png. Mismos atributos de vídeo que el
hero. El vídeo arranca solo cuando la sección entra en viewport.
```

---

## 7 · Paso 5 · Vídeo del hero ligado al scroll [FABLE, opcional]

Solo si el presupuesto va por debajo de 1,8 MB y queda tiempo. Es el «play on scroll» del final del vídeo 2 del tutorial:

```
En escritorio (≥ 1024 px y sin prefers-reduced-motion), liga el tiempo
del vídeo del hero al scroll de las secciones 1-2: video.currentTime =
progreso × duración, con requestAnimationFrame y un lerp de 0.08 para
que no dé tirones. Requiere el vídeo con keyframes cada 0,5 s: vuelve a
codificar hero-1280.mp4 con -g 15 -keyint_min 15. Si el vídeo no está
completamente cargado (readyState < 4), se queda en loop normal. En
móvil siempre loop normal.
```

Si a la primera no va suave en Android, se descarta sin segunda ronda.

---

## 8 · Medición y jurado (misma tarde o al día siguiente)

1. **Números:** peso total por breakpoint, LCP/INP en Lighthouse móvil 4G, fps en Android real. Tabla en `test/kaito/MEDIDAS.md`.
2. **Jurado C a ciegas** (skill `jurado-c` si existe; si no, sesión limpia de Fable con el procedimiento del B8): tres capturas sin nombre —home actual, `/test/kaito`, y cuando exista `/test/faro` (la pieza firma con shader)— con la rúbrica Awwwards 40/30/20/10 y ancla en las cinco referencias.
3. **Escalera N:** los 12 criterios; el más bajo marca el nivel.
4. **Coste:** tokens y minutos de Fable y de Opus, número de correcciones por paso. Va a `DECISION.md`.

**Regla de decisión, fijada ahora para no discutirla después:**

- Jurado ≥ 7,5 **y** > home actual **y** ≤ 1,5 MB **y** LCP ≤ 2,5 s → **sustituye a la home** esa misma semana. El hero pasa por el taller de portada solo para la pieza firma.
- 7,0-7,5 → no sustituye; se rescatan a `Recetas/` el hero-spec y el patrón «vídeo fijo + cuatro bloques», y se archiva el resto.
- < 7,0 o > 2,5 MB → se archiva entero con una línea en `DECISION.md` sobre qué falló. Sin segunda tarde.

---

## 9 · Lo que se guarda pase lo que pase

- `Recetas/hero-video-spec.md`: la spec del paso 3 tal como quedó tras la corrección, con las tres decisiones que tomó el modelo. Es la primera receta escrita al nivel del tutorial, y es lo que Kaito vende en motionsize.
- `Gestos/video-fijo-cuatro-bloques.md` y `Gestos/video-cta-pie-sin-costura.md`.
- `Fuentes.md`: entrada «Kaito / motionsize.ai» con esta lección en una línea: *el prompt bueno no es una idea, es una spec al nivel de clase, retardo y breakpoint; la idea la pone la lámina.*
- La fórmula de prompt de vídeo (instrucciones negativas) en `Recetas/video-fondo-prompt.md`.

---

## 10 · Día siguiente

Con `DECISION.md` cerrado, el restaurante hondureño (B10) hereda lo que haya pasado: si el hero-spec funcionó, el día 2 del restaurante se escribe con esa receta; si el vídeo pesó demasiado, el restaurante va con foto fija y la pieza firma en shader.
