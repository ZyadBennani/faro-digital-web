# PROMPT · Claude Code · `/test/faro` · el faro interactivo (ratón, scroll y móvil) + procedimiento N3 reproducible

**Fila:** B15 · **Fecha:** 04-sep-2026 · **Duración:** una tarde (pieza) + una hora (procedimiento) · **Ruta:** `/test/faro`, `noindex` · **Modelos:** Opus 5 prepara (secciones 1 y 4), **Fable 5.1 High** construye la pieza (sección 2), Opus escribe el procedimiento (sección 5)

> **Qué es.** La página del test (`/test/kaito`, archivada tal cual) se copia a `/test/faro` y su vídeo de portada se sustituye por la **pieza firma**: la misma imagen del faro, con el mar que sube, baja y se riza según el ratón en escritorio y según el scroll en móvil, y la linterna reflejada en el agua. Nada más cambia. Al acabar, la página es la muestra N3 de Faro y el procedimiento para hacer la siguiente queda escrito paso a paso.
>
> **Qué no es.** No es la home: la regla nº 1 de marca sigue (la foto del faro solo como pieza firma en `/test` y campaña). No se vuelve a pasar por el jurado hoy; se mide con las puertas de N3 y con la escalera de 12 criterios.

---

## 0 · Material que ya existe (no se regenera nada)

- `test/kaito/` completo: `index.html`, `kaito.css`, `kaito.js`, `SPEC-secciones.md`, `NOTAS-paso-1..4.md`, `NOTAS-B12.md`, `DECISION.md`.
- `test/kaito/media/`: `faro-16x9.png` (944 KB, fuente de la textura de escritorio), `faro-3x4.jpg` (1,8 MB, fuente de la textura móvil), `hero-1280.webm/.mp4`, `hero-720.mp4`, `poster-hero.jpg`, los WebP de poster ya generados.
- `test/faro/SPEC-paso-5.md` y `test/faro/media/scrub/` (vídeo con keyframes cada 0,5 s): es el **plan B** si el shader no lee como agua.
- `Recetas/hero-video-spec.md` (12 secciones) y `Sistema-Movimiento-Faro.md` (curvas, tokens, contrato de escena).

---

## 1 · Preparación [OPUS, 40 min]

**1.1 Copia.** `test/kaito/` → `test/faro/` (todo menos `_capturas/`, `DECISION.md` y los `NOTAS-*`). Título y `<meta>` iguales; `noindex`. Enlaces internos de la página apuntan a los mismos destinos que en el test.

**1.2 Texturas.** Desde `faro-16x9.png` y `faro-3x4.jpg`:
- `faro-w.webp` a 1800 px de ancho (escritorio) y `faro-m.webp` a 900 px de alto (móvil), calidad 82. Techo: 140 KB + 70 KB.
- **Máscara del mar** para cada una, `mascara-w.png` y `mascara-m.png`, en escala de grises a la mitad de resolución: blanco = agua (mar y espuma), negro = faro, espigón y cielo. Se genera por umbral de luminancia y posición (todo lo que está por debajo del horizonte y no es piedra), y se retoca a mano el borde del espigón y la base de la torre. Degradado de 24 px en la línea del horizonte. Techo: 30 KB cada una.
- Coordenadas de la linterna en cada textura (centro y radio, en UV 0-1) → `test/faro/direccion-arte.md`, junto con la paleta (verde-negro, crema, oro solo en la linterna).

**1.3 El hueco.** En `index.html` el `<video>` del hero se sustituye por un `<canvas class="pieza">` con el mismo tamaño y posición, y el `<picture>` del poster queda debajo tal cual (sigue siendo el LCP y el fallback). Todo lo demás del hero (H1 a la izquierda, píldora, bloque inferior, escena sticky de la sección 2) no se toca.

**Al terminar:** `→ ZYAD: cambia a Fable 5.1 (High). Pega la sección 2, test/faro/direccion-arte.md y Sistema-Movimiento-Faro.md.`

---

## 2 · La pieza [FABLE 5.1 · una tarde · techo 300 KB para la pieza · 60 fps en Android]

Primera línea: «Motivo: pieza firma del faro sobre la página del test. Techo 300 KB (texturas incluidas), 60 fps en Android de gama media, DPR ≤ 1,5».

**2.1 Un plano, un shader.** WebGL2 a mano, sin three.js ni ninguna librería. Un cuadrilátero a pantalla completa del canvas con dos texturas: `faro` y `mascara`. El fragment shader:
- Desplaza las UV **solo donde la máscara es blanca**, con dos capas de ruido: una lenta y ancha (oleaje, periodo ~6 s) y una fina (rizo, ~1,2 s). Fuera de la máscara la imagen se dibuja tal cual: **el faro, el espigón y el cielo no se mueven nunca**.
- Desplaza verticalmente la línea de agua con `nivel`: el mar sube hasta +6 % de la altura y baja hasta −3 %. En la franja del horizonte (el degradado de la máscara) el desplazamiento se atenúa para que no se rompa.
- Reflejo de la linterna: gradiente radial-vertical anclado a la coordenada de la linterna de `direccion-arte.md`, en oro, que se deforma con el mismo ruido del oleaje. Es lo único que brilla. La linterna respira al 3 % con la curva `suave`.
- Espuma: donde la máscara es blanca y la luminancia de la textura es alta, el rizo es ×1,6. No se pinta espuma nueva.

**2.2 Control.**
- **Escritorio (puntero):** `pointerY` normalizado → `nivel` (arriba = mar bajo, abajo = mar alto) y `amplitud` (rizo ×1 arriba, ×2,5 abajo). `pointerX` → deriva lateral leve. Siempre con inercia: lerp 0,06 por frame. Nunca directo.
- **Móvil y táctil:** sin puntero. `nivel` y `amplitud` los manda el **progreso de scroll del hero y la escena de la sección 2** (0 = arriba del todo, 1 = con los cuatro bloques visibles), misma inercia. Así, al bajar, el mar sube alrededor del faro mientras entra «Qué ofrecemos». El toque sobre el canvas no hace nada (no se secuestra el scroll).
- **Sin puntero ni scroll:** respiración automática de 8 s.

**2.3 Contrato de escena** (Faro Base y `Sistema-Movimiento-Faro.md`): DPR ≤ 1,5; `requestAnimationFrame` solo mientras la sección está en viewport (`IntersectionObserver`, pausa fuera); `prefers-reduced-motion` → sin canvas, el `<video>` de 5 s en bucle que ya existe (`hero-1280.webm`) sobre el poster; sin WebGL2 o si el primer frame tarda > 80 ms → poster fijo; pérdida de contexto WebGL → poster fijo. El canvas arranca **después** del LCP (tras `load` + 300 ms), nunca antes.

**2.4 Prohibido.** Partículas, rayos, lluvia, niebla animada, un segundo objeto, cualquier librería, tocar el resto de la página, cambiar el copy, más de 300 KB.

**2.5 Criterio de parada.** A las tres horas, si el mar no lee como agua (lee como gelatina o como textura deslizando), se escribe en una línea en `NOTAS-pieza.md` y se pasa al **plan B**: `SPEC-paso-5.md` (vídeo ligado al scroll en escritorio, bucle en móvil) sobre la misma página. No se gasta la tarde forzando el shader.

**2.6 Entrega.** Publicado en `faro-digital.pages.dev/test/faro/`; vídeo de 6 s del gesto en escritorio (ratón arriba → abajo) y otro en móvil (scroll) con `grabar-escena.py`; fps en Android con CPU ×4; KB de la pieza (shader + texturas + máscaras) y de la página; y tres líneas en `NOTAS-pieza.md`: qué decidió, qué descartó, dónde se atascó.

`→ ZYAD: cambia a Opus 5.`

---

## 3 · Puertas y escalera [OPUS, 30 min]

Sobre `/test/faro`, con los medidores ya corregidos:
- Peso total recorrido a 1440 y 390 (techo N3: 1,2 MB), LCP, INP, CLS, fps con CPU ×4, contraste (17 bloques del cierre y pie), tamaños de letra (5).
- **Escalera N, los 12 criterios**, uno por línea con nota 1-10 y una frase: idea de página, dirección de arte previa, receta, tipografía, composición, materia, motion, UX operable, prueba, coherencia, jurado (se hereda: 7,53 escritorio / 7,05 móvil del test, con la pieza sin puntuar), presupuesto. **El criterio más bajo marca el nivel.** Si el más bajo es ≥ 7, la página es N3 y se declara como muestra N3 de Faro.
- Test de dos pestañas: `/test/faro` junto a la home real. ¿Mismo sitio? Una línea.

`ZYAD: cinco segundos con el ratón y con el móvil, y «gusta» o «no».`

---

## 4 · Lo que se guarda (Opus, 20 min)

- `Recetas/pieza-firma-shader.md`: el shader, la máscara, los controles, el contrato de escena, los pesos y los fps. Si se fue al plan B, se guarda el plan B con el motivo.
- `Gestos/mar-que-sube-con-el-scroll.md`.
- `Recetas/hero-video-spec.md`: sección 13, «cuándo vídeo y cuándo shader»: vídeo cuando la escena tiene movimiento propio que un shader no da (gente, humo, fuego); shader cuando lo que se mueve es una superficie (agua, tela, luz) y hace falta control.

---

## 5 · El procedimiento N3, paso a paso [OPUS, 1 h]

Archivo: `Marketing Digital/_Sistema/03-Recursos-Internos/Biblioteca-Referencias/Web/PROCEDIMIENTO-N3.md`. Escrito para que **cualquier sesión nueva** de Claude Code lo ejecute con un cliente nuevo sin haber visto este chat. Cada paso con: quién (Zyad / Opus / Fable / Sonnet), cuánto (minutos), entrada, salida, herramienta, y el comando o prompt literal cuando lo hay. Se reconstruye desde lo que pasó de verdad en B11-B15, no desde lo que el prompt maestro decía que pasaría.

**Estructura obligatoria:**

0. **Brief y regla de decisión** (Zyad, 20 min): datos del cliente, copy fuente, qué se mide, qué nota sustituye qué, techos de peso. La regla se escribe **antes** de ver nada.
1. **Dirección de arte** (Opus + Zyad, 30 min): paleta, luz, lo prohibido, un prompt de imagen en inglés con instrucciones negativas. Incluye el prompt real del faro como ejemplo.
2. **Imagen** (Zyad en Canva, 20 min): formato por uso (16:9 hero, 3:4 móvil), tres candidatas, criterio de elección («mar vacío a los lados para el texto»), descarga desde IA Canva → Historique. Con el aviso de que las capturas de Claude no sirven como archivo.
3. **Vídeo** (Zyad en Canva, 20 min): lienzo del mismo formato, «Crear un clip de vídeo», prompt de instrucciones negativas (el real), 5 s, máximo dos intentos, alternativa Kling y su recorte de marca de agua.
4. **Compresión** (Sonnet o Claude en chat, 10 min): los seis comandos de ffmpeg tal cual se usaron, con los pesos que dieron, y la regla «posters = primer fotograma exacto».
5. **Spec del hero** (Opus, 30 min): la plantilla de spec al nivel de clase, retardo y breakpoint, con las lecciones: `<picture>` bajo el vídeo, `100dvh`, texto colocado respecto al objeto y no por porcentaje, H1 en vw bajo 435 px, el `<source media>` sin JS.
6. **Construcción por pasos** (Fable, un día): hero → escena con los bloques → spec de secciones → construcción → cierre + pie. Para cada paso: qué recibe, dónde para, qué captura. Con el A/B de modelos como opción.
7. **Ronda de corrección** (Zyad dicta, Opus aplica): una por paso, máximo cinco cambios numerados sin justificar. Con la lista de errores que se cobró el jurado (CTA de texto partido, cabecera fija sin retirarse, servicios sin enlace, fondo sin cambios de ritmo) como checklist previa.
8. **Medición** (Opus, 30 min): los medidores corregidos (INP, cosido, LCP sin scroll), qué se mide y con qué puertas, formato del `medidas.json`.
9. **Jurado a ciegas** (Zyad lanza, 2 sesiones): tres candidatas con **ancla externa** (Bureau VA; Locomotive no se captura), capturas a DPR 2 en cuatro vistas, clave fuera de la carpeta, lanzamiento desde claude.ai sin proyecto, el prompt literal con la escala 7/8/9, orden invertido en la segunda sesión, media.
10. **Decisión** (Opus): `DECISION.md` con la tabla, la regla aplicada y «lo que los jurados coinciden en pedir». Sin excepciones a la regla el mismo día.
11. **Pieza firma** (Fable, una tarde): solo si la página pasa o si es muestra propia; el shader y su plan B.
12. **Lo que se guarda**: recetas, gestos, fuentes, y esta lista actualizada con lo que cambió.

Al final, una tabla de tiempos reales de B11-B15 por paso y modelo, y el coste de ración de Fable (sesiones) para que el siguiente N3 se presupueste en horas y no en intuición.

---

## 6 · Orden del día

1. Sección 1 (Opus) → cambio a Fable → sección 2 → cambio a Opus → secciones 3 y 4 → sección 5.
2. Si a media tarde el shader va al plan B, las secciones 3-5 se hacen igual sobre el plan B.
3. Mañana: restaurante, con `PROCEDIMIENTO-N3.md` como guion.
