# Test «método Kaito» · Ronda 3 del paso 3 + Paso 4 · Cierre y pie sin costura · [OPUS 5]

**Fecha:** 03-sep-2026 · **Estado:** ronda 3 aplicada y paso 4 construido, medido y publicado en https://faro-digital.pages.dev/test/kaito/ · **parado.**

---

## Ronda 3 del paso 3 (tres cambios, una pasada)

1. **La cabecera se retira al bajar y vuelve al subir** (`translateY(-100%)`, 300 ms con la curva estándar). Mientras el hero sigue en pantalla no se retira nunca: se comprueba con `hero.getBoundingClientRect().bottom > 0`. Solo en escritorio; en móvil la cabecera es absoluta y se va con el scroll. Verificado por clase computada: arriba `hero-arriba`, dentro del hero `hero-arriba`, bajando `hero-arriba oculta`, subiendo `hero-arriba`.
2. **La primera línea del H1 ya no anima la opacidad** (`k-reveal-1`: solo `translateY` y `blur`, desde opacidad 1). El resto igual.
3. **CTA del cierre a Título de fila** (2.25rem, Frank Ruhl 700), subrayado fino, columnas 1-6, encima de la nota en Micro.
4. `scroll-margin-top: 6rem` en las cuatro secciones ancladas.

**El LCP vuelve a existir.** Era el bloqueo del paso 3: con CPU ×4 Chrome no emitía ningún candidato porque todo el texto de la primera pantalla partía de opacidad 0. Con el cambio 2, medido en 4G + CPU ×4:

| | 1440×900 | 390×844 |
|---|---|---|
| LCP (elemento: primera línea del H1) | **1,44 s** | **1,27 s** |

La puerta de la regla de decisión (LCP ≤ 2,5 s) queda cumplida y, sobre todo, **medible**.

---

## Paso 4 · Cierre + pie sobre un solo vídeo

Un contenedor `.cierre-escena` con el vídeo de fondo y dentro las dos zonas, sin línea divisoria y sin overlay. `object-fit: cover`, `object-position: 50% 35%`. Poster `poster-cierre.webp` (44,6 KB, por debajo del techo de 60) como `<picture>` bajo el vídeo, igual que el hero. `preload="none"`, arranque y pausa por IntersectionObserver con 200 px de margen; con `prefers-reduced-motion` las dos fuentes quedan fuera por `media=` y solo se sirve el poster. Pie con los tres bloques de la home, textos y enlaces exactos, titulares en crema al 100 % y enlaces al 75 %; debajo, en Micro, «Privacidad · Contacto» y «Esta web no usa cookies y no las necesita.». Sin línea de copyright (verificado en vivo: cero apariciones de «©») y sin repetir la letra pequeña de precios (una sola aparición, la de la sección de precios).

### Medidas (Chrome 152; 4G 1,6 Mbps / 150 ms y CPU ×4)

| | 1440×900 | 390×844 |
|---|---|---|
| Peso de la primera pantalla | 265 KB | 209 KB |
| **Peso total recorrido** | **509 KB** | **452 KB** |
| LCP | 1,44 s | 1,27 s |
| CLS total | 0,0021 | 0 |
| **CLS al arrancar el vídeo del cierre** | **0** | **0** |
| fps recorriendo toda la página con los dos vídeos | **60,1** · 0 frames > 50 ms · peor 17 ms | **60,1** · 0 · 17 ms |
| `font-size` computados distintos | 5 | 5 |
| Altura | 8,58 pantallas | 14,75 pantallas |

**El vídeo del cierre no descarga nada hasta acercarse.** Al cargar la página: cero peticiones con «cierre» en la URL, `readyState: 0`, `networkState: 1` (sin actividad de red). Al entrar en el viewport: `readyState: 4`, reproduciendo, `cierre-1280.webm` (121 KB). Confirmado en los dos tamaños.

Presupuesto: 509 KB de un techo de 1,2 MB. Queda holgura.

### 🔴 Contraste: el pie falla AA donde cae la torre iluminada

Medido sobre los píxeles de la captura (no sobre el fondo teórico), con el vídeo fijado en su fotograma más claro (t = 1,23 s, hallado recorriendo los 150 fotogramas con ffmpeg). Para cada bloque de texto se captura la zona **con y sin el texto**, y se mide el fondo real debajo en tres percentiles: p50 es el fondo típico, p98 el caso peor.

**El cierre va bien.** Las cuatro respuestas y el CTA, entre **9,2 y 13,8 : 1** en los dos tamaños.

**El pie no.** El vídeo es vertical (960×1280) y, recortado a un contenedor ancho, coloca la torre iluminada y la espuma justo detrás del texto del pie. Dónde cae depende del ancho:

| Zona | p50 (fondo típico) | p98 (caso peor) | Umbral AA | |
|---|---|---|---|---|
| 1440 · «Vengo a otra cosa» → enlace «Escríbeme →» | 2,22 | **1,84** | 4,5 | 🔴 falla incluso en el fondo típico |
| 1440 · titular «Vengo a otra cosa» | 14,39 | **2,87** | 3,0 (texto grande) | 🔴 falla en el brillo |
| 390 · texto y enlace de «Quiero empezar» | 8,3 / 8,0 | **3,66 / 3,72** | 4,5 | 🔴 falla en el brillo |
| 390 · nota del cierre | 5,40 | **3,10** | 4,5 | 🔴 falla en el brillo |

No es el movimiento: la luminancia del vídeo apenas varía (media 0,0334 a 0,0335 en los 150 fotogramas) y el peor de diez instantes da lo mismo que el fotograma más claro. Es **dónde cae la torre**, que está quieta.

Es exactamente lo que la regla de Kaito predice: sin overlay, el vídeo tiene que ser oscuro donde va el texto, y este no lo es. **No lo he corregido porque no estaba en las condiciones del paso** y las salidas posibles son decisiones de diseño: mover el texto del pie a las columnas oscuras, cambiar el `object-position` para que la torre caiga fuera del pie, usar un encuadre distinto del vídeo de cierre, o aceptar un overlay (que la regla prohíbe).

### Otro detalle visible en la captura de 1440

La captura del bloque cierre+pie muestra la cabecera fija superpuesta sobre la primera fila de etiquetas. Es un artefacto de capturar un elemento con `position: fixed` en la página, no un fallo de la página en uso normal; conviene comprobarlo en vivo antes de dictar nada sobre ello.

---

## Un fallo de proceso, y su regla

Al publicar el paso 4 la primera vez, `construir.py` avisó de **una referencia rota** (`media/poster-cierre.webp`, que mi `sincronizar-publicacion.py` no copiaba) y **aun así se desplegó**. La causa no fue el constructor, que hizo su trabajo: fue que encadené el despliegue detrás de un `grep`, y el `grep` sustituye el código de salida del constructor por el suyo. El despliegue se ejecutó sobre una carpeta que el propio comprobador había rechazado, y el poster daba 404 en producción.

> **Un comprobador encadenado detrás de una tubería ya no comprueba nada:** el código de salida que decide es el del último mandato de la tubería, no el del que comprueba.

Corregido: se guarda la salida en un archivo, se lee `$?` del constructor y solo se despliega si es 0. Con eso: 288 archivos, ninguna referencia rota, y el poster responde 200 en vivo.

---

## Coste (H3)

Opus 5: ronda 3 en una pasada; paso 4 en una pasada. Dos correcciones propias: la caja de contraste que se salía del viewport (el medidor, no la página) y el poster que faltaba en el script de sincronización. ~40 min de pared con todas las medidas.

**Parado.** Capturas: `_capturas/paso4-1440x900-cierre-pie.png` y `paso4-390x844-cierre-pie.png`. Medidas completas en `_capturas/medidas-paso-4.json`.

---

## Ronda 4 (última antes del jurado) · aplicada en una pasada

1. **El vídeo del cierre se acaba antes del pie.** Una franja de 20 vh (`.pie::before`) lleva de transparente a `rgb(25 38 34)` justo encima del pie, y el pie entero va sobre fondo sólido.
2. **El CTA del cierre a Título de fila desde 640 px: ya estaba.** Verificado a 360, 390, 600, 640, 700, 768, 1024 y 1440 px: 36 px, Frank Ruhl 700, sin transformar, en los ocho. Lo dejó así la ronda 3. No he tocado nada.
3. **INP medido con CPU ×4** y anotado en `_capturas/medidas-paso-4.json`.

### El contraste del pie, otra vez

| | 1440×900 | 390×844 |
|---|---|---|
| Bloques del pie que pasan AA | **12 de 12** | **12 de 12** |
| Peor ratio del pie | 5,84 (la línea legal) | 5,84 |
| Titulares / textos / enlaces del pie | 13,68 / 10,24 / 8,29 | iguales |

Antes de la ronda, el peor era 1,84. Ahora el fondo del pie es sólido, así que el ratio ya no depende de dónde caiga la torre ni del ancho: los tres bloques dan el mismo número en los dos tamaños, que es la señal de que el problema está resuelto de raíz y no tapado.

🔴 **Queda un fallo, fuera del pie:** la nota en Micro del cierre («Sin accesos. Sin compromiso…»), a 390 px, da **4,46** frente a 4,5. Está sobre el vídeo, no sobre el sólido, y falla por 0,04. A 1440 pasa (4,94). No lo he tocado porque el cambio 1 hablaba del pie; se arregla subiendo esa nota de crema al 60 % al 75 %, o bajándola dentro de la franja del degradado.

### INP con CPU ×4 (umbral del observador: 16 ms, el mínimo válido)

| | 1440×900 | 390×844 |
|---|---|---|
| Interacciones medidas | 10 | 12 |
| **INP (la peor)** | **56 ms** | **40 ms** |
| Puerta del prompt maestro | < 200 ms | ✅ |

El trabajo de la página en cada interacción es de 0 a 3 ms; el resto es retardo de presentación con la CPU frenada.

**Un fallo de medición, y su regla.** El primer intento dio «cero interacciones» en los dos tamaños. No era la página: `durationThreshold: 0` no es un valor válido para el observador de eventos, y Chrome no registra nada. Con 16, el mínimo que admite la especificación, aparecieron las diez. Un medidor que devuelve «no hay nada» tiene que probarse contra un caso que sí debe marcar antes de creerle.

---

## El jurado a ciegas (sección 8), listo para lanzar

Material en `_capturas/jurado/`: **24 PNG**, tres portadas × dos anchos (1440×900 y 390×844) × cuatro piezas (arriba, una pantalla de scroll, dos pantallas, y la página entera cosida pantalla a pantalla). Son capturas del viewport: no hay barra de navegador ni favicon. Los archivos van como `A-`, `B-` y `C-`, con las letras repartidas al azar (`random.SystemRandom`), y ninguno lleva metadatos.

El prompt está en `_capturas/jurado/PROMPT-Jurado.md` y dice solo lo acordado, sin las palabras test, vídeo, Kaito, Faro ni ninguna hipótesis.

La correspondencia está en `_capturas/jurado/CLAVE.md`. ⚠️ **Está dentro de la misma carpeta que las capturas**, como se pidió: si la sesión del jurado recibe la carpeta entera o puede leer archivos de ella, deja de ser ciego. Para lanzarlo, pasar solo los 24 PNG y el prompt, o mover la clave fuera antes.

**Un fallo del capturador, cazado a tiempo.** La primera tanda cosió 16 pantallas de una página que mide 9. El corte del bucle comparaba la firma de cada captura con la anterior, y **con un vídeo de fondo dos capturas del mismo punto nunca son iguales**, así que no cortaba nunca. Corregido congelando todos los vídeos antes de coser y cortando también cuando `scrollY` deja de avanzar. Comprobado contra la altura medida: 9 pantallas a 1440 (la página mide 8,58) y 15 a 390 (14,75).

**Parado.** Falta: lanzar el jurado, y decidir la nota del cierre a 390.

---

## Ronda 5 (previa al jurado) · aplicada en una pasada

1. **La nota en Micro del cierre, a crema al 70 %** (era 60 %). Es el único Micro que queda sobre el vídeo; el resto va sobre sólido y se queda al 60 %. Medido de nuevo sobre el fotograma más claro: **5,44 a 390 px** (era 4,46, y AA pide 4,5) y **6,13 a 1440**. Publicado.
2. **`CLAVE.md` movida** de `_capturas/jurado/` a `test/kaito/CLAVE-jurado.md`: ahora la carpeta del jurado se puede entregar entera sin romper el ciego.
3. **Las 24 capturas repetidas a device_scale_factor 2** en los dos anchos (antes 1440 iba a 1) y guardadas en PNG sin optimizar. Comprobado: DPR efectivo 2,0 en las seis cosidas, ninguna reescalada, y un recorte 1:1 de las tres a la misma escala en `_capturas/_nitidez-comparada.png`. La métrica automática de «bordes duros» daba 58 %, 53 % y 7 %, pero eso es contenido y no nitidez: la tercera abre con un degradado oscuro sin texto. El dato que vale es el DPR y el recorte.
4. **`PROMPT-Jurado.md` reescrito** con el texto nuevo (orden A→B→C, nota por dispositivo, escala de 7 a 9 con justificación obligatoria por encima de 9, y la advertencia de no premiar la longitud). Copiado también a la segunda carpeta.
5. **`_capturas/jurado-2/`**: las mismas 24 capturas con **A y C intercambiadas**, para comprobar que la nota no depende del orden. Anotado en la clave.

### 🔴 La tercera portada no pudo ser locomotive.ca

Ese dominio responde con una pantalla de verificación anti-bot («One moment, please… Please wait while your request is being verified»): el documento entero mide una pantalla y lo único capturable es esa espera. **No se ha intentado sortear la verificación.** En su lugar va **bureau-va.com**, la referencia 01 de la biblioteca del sistema, que carga entera y da 8 pantallas a 1440. Si se prefiere otra, Studio Freight (7,5 pantallas) y Symphony (16,9) también cargan; Metalab devuelve una sola pantalla.

**Y lo que más importa de este hallazgo:** la primera tanda de capturas de locomotive.ca daba 8 y 12 pantallas, y parecían correctas. Eran fotogramas de la animación de la pantalla de espera. Un capturador que no distingue la portada de una pantalla de verificación produce material inválido sin avisar, y ese material habría entrado en el jurado como si fuera una web de referencia. El capturador ahora aborta si detecta esa pantalla.

Un tropiezo menor del mismo día: el corte del cosido por posición de scroll no vale en sitios con scroll virtual, donde `scrollY` se queda en 0 y cortaba en la segunda pantalla. Ahora solo se aplica si el scroll resulta ser nativo.

**Parado.** El jurado está montado en dos carpetas y sin lanzar.
