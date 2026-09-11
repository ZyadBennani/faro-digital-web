# DECISIÓN · Test «método Kaito» sobre la home de Faro · fila B11

**Fecha:** 03/04-sep-2026 · **Estado: CERRADO Y ARCHIVADO.** · **Jurado:** dos rondas a ciegas (escritorio y móvil), dos sesiones cada una, tres portadas (A, B, C), rúbrica Awwwards 40/30/20/10.

## El veredicto, tras las dos rondas

> **La portada del test NO sustituye a la home. Queda archivada.**
> Ronda 1 (escritorio y móvil juntos): **7,15**. Ronda B12 (solo móvil, tras corregir los cuatro fallos): media total **7,29**. La regla de B12 exigía **≥ 7,5**, y por debajo el archivo es definitivo.

| | Escritorio | Móvil | **Media total** |
|---|---|---|---|
| `/test/kaito` | 7,53 | **7,05** | **7,29** |
| Home actual | 7,00 | 6,85 | 6,93 |
| Referencia externa (Bureau) | 7,60 | 7,40 | 7,50 |

**La ronda B12 hizo lo que tenía que hacer y no bastó.** El móvil subió de 6,80 a 7,05 (+0,25) con los cuatro fallos corregidos, pero necesitaba llegar a 7,47. Faltaron **0,21 puntos** de media total.

Tres cosas que conviene no perder de vista al leer esto:

- **El test sigue siendo mejor que la home actual**, y por más margen que antes: 7,29 frente a 6,93 (+0,36). No se archiva por malo, se archiva por no llegar a un listón que se fijó a propósito por encima de lo que ya se tenía.
- **La referencia externa cae al 7,50 exacto** al entrar el móvil (7,60 en escritorio, 7,40 en móvil). El listón del test era el de un sitio bueno de verdad, y ni la referencia lo pasa con holgura.
- **Los tres bajan en móvil.** Test −0,48, home −0,15, referencia −0,20. No es un problema de esta portada: es que el móvil se juzga más duro, y aun así el test es el que más pierde.

## El veredicto de la primera ronda (03-sep), que se conserva

> Media 7,15, dentro de la franja 7,0-7,5 que la regla fijaba de antemano como «no sustituye».

La regla estaba escrita antes de conocer las notas, y se aplica tal cual:

| Puerta | Exigido | Medido | |
|---|---|---|---|
| Nota del jurado | ≥ 7,5 | **7,15** | 🔴 falta 0,35 |
| Mejor que la home actual | > 7,0 | **7,15** | ✅ +0,15 |
| Peso total | ≤ 1,5 MB | **509 KB** | ✅ |
| LCP en 4G con CPU ×4 | ≤ 2,5 s | **1,44 s** | ✅ |

Tres de las cuatro puertas se cumplen con holgura. La que decide, no. Por la regla: **se rescatan las recetas y se archiva el resto.**

## Las notas

| Portada | Sesión 1 | Sesión 2 | Media |
|---|---|---|---|
| Referencia externa (Bureau) | 7,5 | 7,7 | **7,60** |
| **`/test/kaito`** | 7,2 | 7,1 | **7,15** |
| Home actual de Faro | 7,0 | 7,0 | **7,00** |

Y el desglose que explica el resultado entero:

| `/test/kaito` | Sesión 1 | Sesión 2 | Media |
|---|---|---|---|
| Escritorio | 7,45 | 7,60 | **7,53** |
| Móvil | 7,00 | 6,60 | **6,80** |
| **Brecha** | 0,45 | 1,00 | **0,73** |

**En escritorio el test ya está en la franja que sustituye** (7,53 sobre un listón de 7,5). Lo que le falta no es diseño: es la versión móvil. Si el móvil hubiera empatado con el escritorio, la media habría sido 7,53 y la home se sustituiría hoy.

Las dos sesiones coinciden en el orden y en la distancia: la referencia externa por delante, el test en medio, la home detrás. La segunda sesión es más dura en móvil (6,6 frente a 7,0) y más generosa en escritorio (7,6 frente a 7,45), lo que deja la media global casi idéntica (7,2 y 7,1).

### ⬜ Falta el desglose por criterio, en las dos rondas

Las notas de diseño (40), usabilidad (30), creatividad (20) y contenido (10) **no están en este documento en ninguna de las dos rondas porque no me han llegado**: de la de escritorio ni de la de móvil. Los dos prompts las pedían criterio por criterio con una línea de motivo. Es el único hueco que queda en el expediente, y es el que diría *por qué* el móvil se quedó en 7,05 en vez de solo *cuánto*. Si aparecen, se pegan aquí.

Lo que sí llegó de las dos sesiones de móvil está en el apartado siguiente, que es de dónde sale la lista de la Home v3.

## Los cuatro fallos de móvil

Son los que las dos sesiones señalan, y los que la ronda B12 corrige. Van reconstruidos desde la ronda que dictó Zyad al leer los dos informes:

1. **En el hero móvil no hay CTA.** Solo se ve «Menú». La oferta —«Pide tu Foto del Día 0»— existe dentro del menú y en el cierre, pero no sobre el pliegue, que es donde la rúbrica la busca. Es el mismo fallo que la home real tenía en agosto y que se corrigió entonces: cero CTA sobre el pliegue puntúa igual de mal que tres.
2. **La sección «Qué ofrecemos» repite la foto del hero.** En móvil, bajo la portada, va una franja de 56vh con el mismo poster. Se lee como que la página no ha avanzado.
3. **La linterna del vídeo de cierre cae sobre las cuatro respuestas.** El vídeo es vertical y en móvil la torre iluminada queda justo detrás del texto.
4. **El CTA del cierre parte mal.** «Pedir mi Foto del Día 0 →» a 36 px no cabe en una línea a 390 px y deja «0 →» huérfano en la segunda.

El cuarto arrastra un quinto, de escritorio: el enlace de la cabecera se lee pequeño y su subrayado es demasiado fino.

## Las medidas finales

| | 1440×900 | 390×844 |
|---|---|---|
| Peso total recorrido | **509 KB** | 452 KB |
| LCP en 4G + CPU ×4 | **1,44 s** | 1,27 s |
| INP con CPU ×4 | **56 ms** | 40 ms |
| fps recorriendo la página con los dos vídeos | **60,1** | 60,1 |
| CLS | 0,0021 | 0 |
| Contraste | sin ningún fallo AA | sin ningún fallo AA |
| Tamaños de letra distintos | 5 | 5 |
| Altura | 8,58 pantallas (home 11,83) | 14,75 (home 13,01) |
| Palabras visibles | 1.031 (home 1.155) | 1.005 |

Ninguna puerta técnica se rompió en ningún momento del test. El presupuesto acabó en el 42 % del techo de 1,2 MB, con dos vídeos dentro.

## Las tres hipótesis

**H1 · Materia.** *Que un vídeo en bucle a sangre suba el jurado por encima de 7,0 sin romper el presupuesto.* **Cumplida a medias.** Sube: 7,15 frente a 7,0, y 7,53 en escritorio. No rompe el presupuesto ni de lejos (509 KB de 1.500). Pero no llega al 7,5, y el vídeo es justamente lo que hunde el móvil: repite el poster en la segunda sección y pone la linterna detrás del texto del cierre.

**H2 · Spec.** *Que un prompt al nivel de detalle del tutorial produzca en un día una portada de nivel N3 sin rondas de exploración.* **Cumplida.** Cero rondas de exploración: cada paso salió de una spec y se corrigió una sola vez. El día alcanzó para los cuatro pasos, las medidas y el jurado.

**H3 · Modelo.** Ver abajo.

## El coste (H3)

**Fable 5.1 en esfuerzo alto:** cuatro pasos, cuatro rondas de corrección de Zyad, **15-20 minutos por paso**, **cero rondas de exploración**. Construyó el hero desde la spec (paso 1), el vídeo fijo con los cuatro bloques (paso 2), y escribió y construyó la spec de las cuatro secciones (paso 3).

**Opus 5** entró donde el prompt maestro lo pedía y se quedó: ronda 3 del paso 3, paso 4 (cierre y pie sobre un solo vídeo), rondas 4 y 5, y el montaje del jurado.

Lo que separa a los dos modelos en este test no se ve en la calidad del código, que fue equivalente, sino en **qué encontraron sin que se lo pidieran**. Los cuatro hallazgos que cambiaron el resultado —que Chrome no emite LCP si el texto entra desde opacidad 0; que el contraste sobre vídeo hay que medirlo en dos percentiles y varios anchos; que un despliegue detrás de una tubería publica lo que el comprobador rechazó; y que una referencia externa servía una pantalla anti-bot que iba a entrar en el jurado como si fuera una web— salieron de medir, no de construir. **La diferencia de valor entre modelos estuvo en la instrumentación, no en la maquetación.**

## La lección que más vale

**El ancla externa fija la escala.** La referencia externa sacó 7,60, por encima de las dos portadas de la casa. Sin ella en la mesa, un 7,15 se lee como «casi excelente» y un 7,0 como «correcto». Con ella, los dos son lo que son: trabajo profesional por debajo del listón de premio. Un jurado de dos piezas propias se habría inflado, y la decisión de sustituir la home se habría tomado con un número que no medía nada.

## Lo que los dos jurados coinciden en pedir

Es lo único de este expediente que **no se archiva**: es la lista de condiciones de la Home v3 (fila B14). Sale de lo que las dos rondas señalan a la vez, no de una preferencia.

**Del test se rescata:**

1. **El hero.** La portada a sangre con un titular grande sobre un lado despejado es lo que puso al test en 7,53 en escritorio, por encima del listón. Eso se mantiene.
2. **El sistema editorial.** Cinco tamaños, rejilla de 12, líneas finas horizontales en vez de tarjetas, un solo gesto de motion, números como texto. Es lo que hace que la página se lea como una sola cosa.

**De la home actual se rescata:**

3. **La alternancia crema/verde.** El test es un solo fondo oscuro de principio a fin, y los dos jurados lo notan. La home cambia de tono entre secciones y eso le da ritmo.
4. **La escalera de CTAs.** Botón en el hero, y después una acción por servicio. El test tiene un solo enlace subrayado arriba y otro al final: entre medias no hay por dónde entrar.

**Y tres condiciones nuevas:**

5. **Cabecera móvil de logo + un botón + hamburguesa.** Ni la navegación entera envuelta ni un CTA a dos líneas en la esquina.
6. **Sin ilustración del faro.** Ver la nota del sistema de marca del 4-sep: la foto se leyó como cliché literal del nombre.
7. **Una página con cambios de ritmo, no un solo fondo oscuro.** Es la consecuencia del punto 3, dicha como criterio de aceptación.

Los puntos 3, 4 y 7 son la razón de fondo por la que el test se quedó en 7,29: **es una portada excelente y una página monótona.** El hero ganó y las seis pantallas siguientes no acompañaron.

## Qué pasa ahora

1. **La home no se toca** por este test. `/test/kaito` queda publicado con `noindex` como material de consulta.
2. **La fila B11 se cierra** y **B12 se cierra con ella**.
3. **Se abre B14, «Home v3»**, como propuesta sin ejecutar: se construye desde `SPEC-secciones.md` y `hero-video-spec.md`, con las siete condiciones de arriba, el hero sin faro literal (se decide en el taller de portada) y un jurado a ciegas de tres con Bureau como ancla. Sustituye la home si la media total llega a 7,5 y supera a la home actual.
4. **El paso 5 se muda a `test/faro/`**, con su spec y el material ya reencodificado: el scroll ligado al vídeo se construye allí, en la pieza firma, no aquí.
5. **B13 se ejecuta hoy**: la cabecera móvil de la home real, que tenía el mismo fallo que el jurado le marcó al test.

## Lo que este test deja al sistema

1. (Ronda 1) **La home no se toca** por este test.
2. (Ronda 1) **Se abre la fila B12** (`Ronda móvil de /test/kaito`): los cuatro fallos de arriba, una sola ronda, re-jurado solo de móvil en dos sesiones. Si la media total llega a 7,5, sustituye; si no, archivo definitivo. La lógica es aritmética: el escritorio ya está en 7,53, así que subir el móvil de 6,80 a 7,47 basta para cruzar el listón.
3. **Se abre una fila urgente y separada** (`Cabecera móvil de la home actual`): el primer fallo de móvil del test **también lo tiene la home en producción**, y esa sí está publicada y recibiendo visitas. Se arregla mañana, independientemente de lo que pase con el test.
4. **Se guarda lo que vale pase lo que pase**, según la sección 9 del prompt maestro: `Recetas/hero-video-spec.md` (once secciones), los dos gestos y la fórmula de prompt de vídeo.

