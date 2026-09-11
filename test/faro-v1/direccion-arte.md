# Dirección de arte · `/test/faro` · la pieza firma

**Fecha:** 04-sep-2026 · **Fila:** B15 · Preparado en la sección 1 para que la sección 2 construya sin volver a medir nada.

Todo lo de aquí está **medido sobre las texturas ya generadas**, no estimado. Las coordenadas van en UV de 0 a 1, con el origen arriba a la izquierda, que es como las lee el shader.

---

## 1 · El material

| | Escritorio | Móvil |
|---|---|---|
| Textura | `media/faro-w.webp` · 1600×912 · calidad 82 · **33,2 KB** | `media/faro-m.webp` · 672×900 · calidad 82 · **24,6 KB** |
| Máscara | `media/mascara-w.png` · 800×456 · **2,0 KB** | `media/mascara-m.png` · 336×450 · **1,6 KB** |
| Techo del prompt | 140 KB + 30 KB | 70 KB + 30 KB |
| Fuente | `test/kaito/media/faro-16x9.png` | `test/kaito/media/faro-3x4.jpg` |

**Las cuatro suman 61,4 KB**, un quinto del techo de 300 KB de la pieza. Queda sitio de sobra para el shader.

**Una desviación del prompt, con motivo.** La textura de escritorio se pide «a 1800 px de ancho» y sale a **1600**, que es el ancho nativo de la fuente. Subir a 1800 interpola: añade peso y no añade detalle. Si algún día hace falta más resolución, el sitio para arreglarlo es la generación de la imagen, no el reescalado.

---

## 2 · La máscara: qué se mueve y qué no

**Blanco = agua**, y es lo único que el shader desplaza. **Negro = faro, espigón y cielo**, que no se mueven nunca.

| | Escritorio | Móvil |
|---|---|---|
| Horizonte (UV y) | **0,527** | **0,575** |
| Superficie de agua | 34,9 % del cuadro | 28,8 % |
| Degradado en el horizonte | 24 px de la textura, atenuación lineal | igual |

Cómo se construyó, por si hay que rehacerla con otra imagen:

1. **Por posición, no por umbral.** El horizonte y los dos polígonos (torre y espigón) se leyeron sobre una rejilla UV dibujada encima de cada imagen. El detector automático de horizonte acertó en la 16:9 (0,527) y **falló en la 3:4**: dio 0,737, que es el borde del espigón y no la línea del mar.
2. **Refinado por luminancia, solo dentro del espigón** y con un 3 % de margen, para recuperar el borde de piedra que el polígono deja fuera.
3. **Degradado de 24 px** en la línea del horizonte, para que el desplazamiento vertical no rompa la línea.

> 🔴 **La primera versión de la máscara restaba todo lo claro en una banda fija del 22 % al 78 %, y en la 3:4 se comió la espuma**, que es justo lo que más tiene que moverse: quedaron agujeros donde rompen las olas. **La espuma es clara y es agua.** Un umbral de brillo no distingue piedra de espuma; lo que las distingue es dónde están.

Los polígonos, en UV, por si hay que ajustarlos:

| | Torre | Espigón |
|---|---|---|
| Escritorio | (0,452 · 0,49) (0,548 · 0,49) (0,567 · 0,73) (0,433 · 0,73) | (0,433 · 0,67) (0,567 · 0,67) (0,740 · 1,02) (0,280 · 1,02) |
| Móvil | (0,432 · 0,54) (0,568 · 0,54) (0,607 · 0,74) (0,393 · 0,74) | (0,393 · 0,70) (0,607 · 0,70) (0,750 · 1,02) (0,255 · 1,02) |

---

## 3 · La linterna

Es **lo único que brilla**, y de ella cuelga el reflejo en el agua.

| | Centro (UV) | Radio del halo (UV) | Núcleo |
|---|---|---|---|
| Escritorio | **0,495 · 0,230** | **0,030** | `#FFFFDF` |
| Móvil | **0,500 · 0,125** | **0,055** | `#FFFF84` |

El reflejo va anclado a esa coordenada, cae en vertical sobre el agua y se deforma con el mismo ruido del oleaje. La linterna respira al 3 %.

---

## 4 · La paleta, muestreada de las texturas

No son los tokens de marca: son **los colores que ya están en la imagen**, para que lo que pinte el shader no desentone con lo que hay debajo.

| Zona | Escritorio | Móvil |
|---|---|---|
| Cielo alto | `#1C302D` | `#243C34` |
| Cielo en el horizonte | `#102221` | `#132A29` |
| Mar lejano | `#0B1617` | `#102625` |
| Mar cercano | `#1A2A27` | `#111413` |
| Espuma | `#182522` | `#253228` |
| Piedra de la torre | `#171A15` | `#40361D` |

Y los de la marca, que son los que manda el sistema para el texto encima: crema `rgb(245 239 228)`, verde profundo `#12291F`, y el **oro `#C9A667` solo en la linterna y su reflejo**. Sobre fondo claro el oro es grafismo y nunca tinta; aquí va sobre agua oscura, que es donde funciona.

**Las dos imágenes no son la misma escena.** La de escritorio es una torre oscura de piedra fría con mar abierto; la de móvil es una torre clara con olas rompiendo y mucha más espuma. Los valores de arriba lo confirman: la piedra pasa de `#171A15` a `#40361D`. El shader tiene que leer sus constantes de esta tabla y no dar por hecho que un ajuste vale para las dos.

---

## 5 · Lo prohibido

Partículas, rayos, lluvia, niebla animada, un segundo objeto, cualquier librería, tocar el resto de la página, cambiar el copy, y pasar de 300 KB. Nada se mueve fuera de la máscara: si el faro, el espigón o el cielo se mueven aunque sea un píxel, el efecto deja de leerse como agua y pasa a leerse como una imagen deslizándose.
