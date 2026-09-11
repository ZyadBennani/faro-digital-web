# Ronda B12 · Móvil de `/test/kaito` · [OPUS 5]

**Fecha:** 03-sep-2026 · **Estado:** cuatro cambios aplicados en una pasada, medidos y publicados · jurado de móvil montado y sin lanzar · **parado.**

Contexto: el test cerró en 7,15 con **7,53 en escritorio y 6,80 en móvil** (`DECISION.md`). Toda la distancia al listón de 7,5 está en el móvil. La regla de B12: una ronda, re-jurado solo de móvil en dos sesiones, media total ≥ 7,5 sustituye la home; por debajo, archivo definitivo.

## Los cuatro cambios

1. **CTA en el hero móvil.** «Pide tu Foto del Día 0 — gratis» arriba a la derecha, junto a «Menú», en UI y con el mismo subrayado que en escritorio. El texto mide 249 px y solo quedaban 202 junto a la marca y al «Menú», así que **reparte en dos líneas alineadas a la derecha** en vez de encogerse: el estilo y el texto son los mismos que arriba. Cabecera de 58 px, el 6,8 % del viewport; no solapa con la marca ni con el «Menú» a 320, 360, 390, 430, 600 ni 768 px.
2. **La sección 2 ya no repite la foto del hero.** Fuera la franja de 56vh con el poster; va sobre `rgb(25 38 34)` con la misma línea fina de 1 px al 25 % que abre las secciones siguientes.
3. **Encuadre del vídeo de cierre en móvil.** Ver abajo.
4. **CTA del cierre sin huérfano**, y el enlace de cabecera en escritorio a 0.875rem con subrayado de 1,5 px.

## El cambio 3, con el dato que lo decide

En móvil el contenedor del cierre mide 390×2024 y el vídeo (960×1280) se escala a **1518×2024**: sobran 1128 px de ancho y **cero de alto**. Es decir, **el recorte es horizontal y el porcentaje vertical del `object-position` no mueve nada**. La torre solo se puede sacar por un lado.

Barrido de valores, midiendo el contraste real sobre el fotograma más claro:

| `object-position` | Fallos AA | Peor bloque | Margen |
|---|---|---|---|
| `50% 35%` (el anterior) | 0 | 4,61 | +0,11 |
| `15% 35%` | 0 | 4,68 | +0,18 |
| `0% 35%` | 0 | 4,90 | +0,40 |
| `85% 35%` | **1** | 4,32 | −0,18 |
| **`100% 35%`** (elegido) | **0** | **5,42** | **+0,92** |

Contraste del cierre a 390 px tras el cambio: **17 bloques medidos, cero fallos**, el peor a 5,40 sobre un umbral de 4,5.

| Bloque | Ratio |
|---|---|
| Título del cierre | 12,45 |
| Intro | 12,28 |
| Respuestas 1 a 4 | 12,12 · 12,64 · 13,22 · 13,27 |
| Detalles 1 a 4 | 5,42 · 5,58 · 5,71 · 5,71 |
| Etiquetas 1 a 4 | 5,40 · 5,49 · 5,65 · 5,71 |
| «Gratis y sin compromiso» | 13,44 |
| CTA del cierre | 13,28 |
| Nota del cierre | 7,41 |

### 🔴 Y el efecto colateral, que hay que decidir

Con el encuadre al 100 %, **la torre sale entera del cuadro y en móvil el cierre es cielo y mar liso**: prácticamente indistinguible del fondo sólido. Comparación de los tres encuadres sin texto en `_capturas/b12-encuadres-cierre.png`. El cambio cumple lo que se pidió —la linterna fuera de las cuatro respuestas y de la nota— y da el mejor contraste, pero **el vídeo del cierre ya no aporta nada en móvil y sigue costando 121 KB**. Las salidas son de diseño, no técnicas: aceptarlo y no cargar el vídeo en móvil (−121 KB), o reencuadrar el vídeo de origen para que la torre quede baja y el texto pueda ir arriba.

## Las medidas, antes y después

| | Antes de B12 | Después | |
|---|---|---|---|
| Peso total recorrido · 1440 | 509 KB | **511 KB** | ✅ techo 1,2 MB |
| Peso total recorrido · 390 | 452 KB | **454 KB** | ✅ |
| LCP 4G + CPU ×4 · 1440 | 1,44 s | **1,75 s** (mediana de 4 cargas) | ✅ puerta 2,5 s |
| LCP 4G + CPU ×4 · 390 | 1,27 s | **1,59 s** | ✅ |
| INP con CPU ×4 | 56 / 40 ms | **56 / 40 ms** | ✅ puerta 200 ms |
| fps recorriendo la página | 60,1 | **60,1 / 60,0**, cero frames > 50 ms | ✅ |
| CLS | 0,0021 / 0 | **0,0021 / 0** | ✅ |
| Contraste | sin fallos | **sin fallos** | ✅ |
| Altura · 390 | 14,75 pantallas | **14,30** | |

**El LCP sube 0,31 s y es real, no ruido**: cuatro cargas seguidas dan 2032, 1640, 1688 y 1752 ms en escritorio. Sigue a 0,75 s de la puerta, así que no se ha tocado nada por ello, pero queda anotado.

## 🔴 Dos cosas que quedan fuera de norma

1. **Seis tamaños de letra en escritorio**, no cinco: 68,54 · 36 · 17 · **14** · 13 · 12 px. El 14 px es el `0.875rem` que pidió el cambio 4 para el enlace de cabecera. En móvil siguen siendo cinco, porque ahí ese enlace vuelve a 13 px. La regla de los cinco tamaños era una condición de la spec de secciones; esto la rompe a propósito y por orden, pero conviene saberlo antes del jurado.
2. **El vídeo del cierre en móvil ya no se ve** (arriba).

## El jurado de móvil, montado y sin lanzar

- `_capturas/jurado-movil/` y `_capturas/jurado-movil-2/`, esta última con **A y C intercambiadas**.
- **12 PNG por carpeta**: tres portadas × 390×844 × cuatro vistas (arriba, una pantalla, dos pantallas, página entera cosida). Todo a **DPR 2**, PNG sin optimizar, sin barra de navegador ni favicon.
- Pantallas cosidas: home actual 14, test 15, referencia 11. Las tres con scroll nativo y DPR efectivo 2,0.
- `PROMPT-Jurado-movil.md` en las dos carpetas, con el texto acordado y nada más.
- La clave está **fuera**, en `test/kaito/CLAVE-jurado.md`, con el mismo reparto de letras que el jurado de escritorio para poder comparar las dos rondas sin traducir nada.

**La aritmética de la decisión:** con el escritorio en 7,53, el móvil tiene que subir de 6,80 a **7,47** para que la media llegue a 7,5.

---

## Cierre de B12 · tres cambios, una pasada · publicado

1. **El vídeo del cierre no se carga en ≤ 640 px.** Las dos fuentes llevan ahora `(min-width: 641px)`, así que en móvil no coincide ninguna y queda el poster WebP; `kaito.js` ni siquiera observa el elemento. Desde 641 px se carga igual que antes. Verificado recorriendo la página entera: en móvil el único recurso «cierre» pedido es `poster-cierre.webp`, con `currentSrc` vacío y `networkState 3`; en escritorio sigue pidiéndose `cierre-1280.webm`.
2. **El enlace de cabecera vuelve a 0.8125rem**, con el subrayado de 1,5 px. La página vuelve a **cinco tamaños** en los dos anchos.
3. **El CTA de cabecera en móvil se queda a dos líneas.** El copy no se toca.

### El ahorro, y lo demás

| | Antes del cierre | Después |
|---|---|---|
| Peso total recorrido · 390 | 454,4 KB | **334,1 KB** (**−120,3 KB**) |
| Peso total recorrido · 1440 | 511,1 KB | 511,7 KB |
| Tamaños de letra · 1440 | 6 (68,54 · 36 · 17 · **14** · 13 · 12) | **5** (68,54 · 36 · 17 · 13 · 12) |
| Tamaños de letra · 390 | 5 | **5** |
| LCP · 1440 (mediana de 5 cargas) | 1,75 s | **1,69 s** |
| LCP · 390 | 1,59 s | **1,61 s** |
| INP · 1440 / 390 | 56 / 40 ms | **40 / 40 ms** |
| fps · CLS · contraste | 60 · 0,0021/0 · sin fallos | **iguales** |

El móvil baja de 454 a 334 KB, un 26 % menos, quitando lo único que no se veía.

### 🔴 Un medidor mío que mintió, y la regla

Midiendo el LCP tras estos cambios me salió **6,2 s** a 1440. No era la página: en la misma pasada estaba recorriendo la página para comprobar qué recursos se pedían, y **el LCP sigue admitiendo candidatos mientras no hay interacción del usuario**, así que los títulos de sección que aparecen al bajar se convertían en el elemento más grande. Sin scroll, la mediana de cinco cargas es 1,69 s.

> **El LCP se mide sin tocar la página.** Cualquier scroll programado durante la medida la invalida, y el número que sale es creíble: no falla, empeora.

Es el tercer medidor propio que da un número falso en este test (los otros dos: el INP con umbral inválido y el cosido que no cortaba con un vídeo detrás). Todos daban resultados que parecían buenos datos.

## Paso 5 · preparado y sin ejecutar

`SPEC-paso-5.md` escrita, y el material ya reencodificado en `media/scrub/` con un keyframe cada 0,5 s. El coste ya no es una estimación: **+130,6 KB el mp4 y +122,0 KB el webm**, que es el que se sirve en escritorio. Con el paso 5, el peso a 1440 pasaría de 511,7 KB a unos 634 KB. Cabe en el techo, pero es el único paso del test que empeora una medida para mejorar una sensación, y afecta solo a escritorio, que es justo donde la portada ya iba bien.
