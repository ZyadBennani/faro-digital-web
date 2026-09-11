# Test «método Kaito» · Paso 2 · Vídeo fijo, texto a los lados · [FABLE]

**Fecha:** 03-sep-2026 · **Estado:** construido, medido y publicado en https://faro-digital.pages.dev/test/kaito/ · **parado en la ronda de corrección** (una, máximo cinco cambios).

Antes del paso, el ajuste de cierre del paso 1: H1 de escritorio con techo 4.5rem y factor 0,117 sobre el ancho disponible («Todos los ángulos.» en una línea). Medido: 1440×900 → 68,5 px, dos líneas, 53 px de aire hasta la torre; 1280×800 → 60 px, dos líneas, 49 px; 1024×768 → 45 px, dos líneas, 43 px. No llega a los 72 px del techo porque manda el ancho (42vw y la torre).

## Qué se ha construido (sección 4 del prompt, tal como está escrita)

- **Escena de 200vh** con dos capas sticky superpuestas: el hero (con el vídeo) y la capa de oferta, que lleva `margin-top: -100dvh`. El vídeo queda fijo mientras se baja una pantalla.
- **Los textos del hero se desvanecen** de 1 a 0 en los primeros 30 vh de scroll (`--k-desvanece`, escrito por kaito.js con requestAnimationFrame; a 0 se marcan `visibility: hidden` para que no queden enlaces invisibles pulsables).
- **Cuatro bloques sin tarjeta, sin fondo, sin overlay**: dos a la izquierda (columnas 1-5) y dos a la derecha (8-12) de la misma rejilla de 12 del hero; la torre queda entre las columnas 6 y 7. Etiqueta en UI (0.8125rem, crema al 60 %), titular Frank Ruhl 700 `clamp(1.5rem, 2.4vw, 2.25rem)`, descripción Work Sans 1rem crema al 85 %. Contenido: los cuatro de «Qué ofrecemos» de la home, texto exacto, incluidas las negritas («Gratis.», «Los ocho canales»); las etiquetas son sus números 01-04.
- **Titular de sección** «Qué ofrecemos» (el h2 de la sección de oferta de la home), centrado arriba, receta del H1 a `clamp(1.75rem, 3vw, 2.75rem)`.
- **Cascada de 120 ms** al entrar un testigo en pantalla (IntersectionObserver, sin librerías).
- **Móvil (≤ 768 px):** nada es sticky. Bajo el hero, una franja de 56vh con el mismo poster y los cuatro bloques apilados.

## Medidas (Chrome 152, Playwright)

| | 1440×900 | 390×844 |
|---|---|---|
| Peso cargado con vídeo (hero + sección 2) | **234 KB** | **178 KB** |
| Media nueva por la sección 2 | ninguna | ninguna (la franja reutiliza poster-hero-720.jpg, ya en caché) |
| Título «Qué ofrecemos» | 43 px, y 56-98 (la cúpula del faro empieza a 105) | 28 px |
| Bloques izquierda / derecha | x 56-595 / 845-1384 (torre 666-774) | apilados, 342 px de ancho |
| Filas de bloques | y 286-407 y 461-582 (cielo y mar oscuro, no la espuma) | 188-820 en la tercera pantalla |
| Descripciones | 2 líneas los cuatro | 3 líneas los cuatro |
| Estado intermedio (36 vh, +260 ms) | textos del hero a 0; bloques a 0,85 · 0,61 · 0,05 · 0 | franja del poster entrando |

Capturas: `_capturas/paso2-1440x900-{1-antes,2-mitad,3-bloques}.png` y `paso2-390x844-{1-antes,2-mitad,3-bloques}.png`.

## Decisiones que no cubría la spec

1. **Todo el hero se desvanece, cabecera incluida.** La spec dice «los textos del hero» sin excluir marca, píldora y enlace; se ha leído literal. Ventaja: el título «Qué ofrecemos» ocupa el hueco de la píldora, arriba y centrado, sobre el cielo, sin tapar la linterna (acaba a 98 px; la cúpula empieza a 105). Coste: mientras se está en la sección 2 no hay navegación ni CTA a la vista. Es exactamente lo que hace Kaito; en la home real habría que decidir si el CTA vuelve.
2. **La cascada va con transición, no con la animación `.hero-fade`.** Mismos valores (700 ms, 10 px, la curva estándar, retardo 120 ms × índice), pero al volver hacia arriba los bloques se van en la salida corta de motion.css (288 ms) en vez de desaparecer de golpe. Con la animación, al quitar la clase no hay salida.
3. **En móvil el hero no cambia.** «El vídeo deja de ser sticky y pasa a una franja de 56vh con el mismo poster» se ha aplicado a la sección 2: el hero sigue siendo su pantalla del paso 1, y debajo va una franja de 56vh con el poster (imagen, no vídeo: 0 KB nuevos) y los bloques apilados. La otra lectura (reducir el hero a 56vh en móvil) deshacía el paso 1.
4. El testigo del scroll está a 130vh, no a 135: así los bloques empiezan a aparecer justo a 30 vh, cuando los textos del hero acaban de irse. Orden de aparición: 01 y 02 a la izquierda, 03 y 04 a la derecha.

## Coste (H3)

Fable 5.1, una pasada. Dos autocorrecciones antes de enseñar, las dos por lo mismo: en móvil los bloques heredaban las columnas de escritorio (`.bloque:nth-child(n)` gana en especificidad a `.bloque`); la primera corrección no bastó por eso y la segunda sí. Cero rondas de Zyad. ~20 min de pared. Publicado en el mismo paso (`sincronizar-publicacion.py` → `construir.py` → wrangler).

## Para la ronda (lo que yo miraría)

- Sin cabecera en la sección 2: ¿vuelve el CTA, o se acepta como en Kaito?
- Bloque 03 «Presencia Local» y 04 a la derecha quedan sobre el cielo/mar más claros del lado derecho; se leen, pero el lado izquierdo tiene más contraste.
- La transición de 30 vh es corta: en un ratón con rueda son dos o tres tics. Kaito usa más recorrido.

**Parado.** Siguiente: paso 3 (sección 5 del prompt): spec de secciones en Fable, sin código, y `→ ZYAD: cambia a Opus 5` para construir.

---

## Ronda de corrección 2 (dictada por Zyad tras la revisión de Fable, aplicada en una pasada)

1. **Cabecera fija.** Marca, píldora, enlace y «Menú» salen de `.hero-textos` y van en una capa propia (`.hero-arriba`, absoluta) que no se desvanece: opacidad 1 en los tres estados, medida por estilo computado. Las dos rejillas de la escena reservan una primera fila de 2.25rem para no pisarla. **Consecuencia que no estaba en la lista y resolví yo:** con la píldora fija arriba, «Qué ofrecemos» ya no cabe centrado sin tapar la linterna; pasa a la izquierda, sobre los bloques 01-02, en su misma columna (y 254-297 a 1440×900). En móvil también a la izquierda.
2. **Transición en 60 vh** (antes 30) y testigo a 160vh (antes 130): los bloques empiezan a aparecer justo cuando los textos del hero llegan a 0.
3. **Bloques 03 y 04 alineados a la derecha**, número incluido: su borde derecho es el margen (1384 = 1440 − 56). En móvil, apilados, siguen a la izquierda: el motivo (el borde del bloque es el margen) no aplica.

| Tras la ronda 2 | 1440×900 | 390×844 |
|---|---|---|
| Peso cargado con vídeo | 236 KB | 179 KB |
| Estado intermedio (66 vh, +260 ms) | textos del hero a 0; bloques a 0,85 · 0,61 · 0,05 · 0 | franja del poster entrando |
| Bloques | filas y 321-442 y 496-617; izquierda x 56-595, derecha 845-1384 | apilados, 3 líneas |

Publicado en https://faro-digital.pages.dev/test/kaito/. Capturas: `_capturas/paso2-*.png` (sobrescriben las de la ronda 1).

## Entrada para `Recetas/hero-video-spec.md` (decisión 2 del paso 2)

**La cascada de revelado por scroll va con transición, no con animación.** Los valores son los de `.hero-fade` (700 ms, 10 px de subida, la curva estándar `cubic-bezier(.2,.7,.2,1)`, 120 ms por índice con `--k-i`), pero declarados como `transition` sobre `opacity` y `transform`, con el estado oculto como base y el visible bajo una clase (`.es-visible`) que pone un observador. Motivo: cuando el usuario vuelve hacia arriba y la clase se quita, una animación con `fill-mode: both` no tiene salida y el bloque desaparece de golpe; la transición vuelve al estado base en la salida corta de motion.css (`--m-salida-base`, 288 ms = 0,6×). Regla: **animación para lo que ocurre una vez al cargar; transición para lo que depende del scroll y puede deshacerse.**
