# PROCEDIMIENTO PIEZA FIRMA — de una foto de cliente a un fondo vivo gobernado por el scroll

**Escrito:** 11-sep-2026 · **Fuente:** B15 → B17 de `/test/faro` (v1 · v2 · v2.1 · v2.2 · v2.3 · v2.4 · diagnóstico · v3 · v3-corr), reconstruido desde los commits, las notas, las medidas y los archivos publicados, no desde los prompts.
**Para:** una sesión nueva de Claude Code, con un cliente nuevo y una foto nueva, que tiene que llegar a una pieza equivalente a `/test/faro` sin prueba y error y en horas presupuestables.
**Hermano mayor:** `PROCEDIMIENTO-N3.md` (la web entera). Esta pieza es su paso 11.

---

## Cómo se lee este archivo

Quince pasos, del 0 al 14. Cada uno con **quién · minutos reales · entrada · salida · herramienta**, el **comando o prompt literal** cuando existe, **qué se mide al acabar y con qué techo**, y **dónde para**.

Dos marcas, y hay que respetarlas:

- **`LITERAL`** — está copiado de una fuente del repositorio. Se pega tal cual.
- **`RECONSTRUIDO`** — la línea de comando exacta **no se guardó**. Lo que se da está derivado de los archivos que produjo (resolución, duración, fotogramas por segundo, intervalo de keyframe, peso), verificado con `ffprobe` sobre lo publicado. Reproduce el resultado; no es el histórico.

Lo que no se encontró en ninguna fuente está dicho como tal en el paso donde tocaba. No se ha rellenado ningún hueco con un comando plausible.

**Rutas absolutas** en todo el documento. Sustituye `faro-digital-web` por el repositorio del cliente y `/test/faro/` por su ruta.

---

# Paso 0 · Brief y regla de decisión

| | |
|---|---|
| **Quién** | Zyad |
| **Minutos reales** | 20 |
| **Entrada** | El cliente, su web, su copy |
| **Salida** | Un documento con los techos y la regla escrita |
| **Herramienta** | ninguna |

Se hace **antes de ver una sola imagen**. Si se escribe después, la regla se ajusta al resultado y deja de ser una regla.

Tiene que decir, sí o sí:

1. **El cliente y qué vende.** Nombre, ciudad, qué se compra en esa web.
2. **Cuál es la imagen.** La superficie que se va a mover (agua, brasa, lluvia, tela, humo) y el objeto que **no** se mueve nunca. Si no se puede separar una de otro con una máscara honesta, no hay pieza: hay vídeo de fondo (`Recetas/hero-video-spec.md` §13).
3. **Qué se mide.** Peso del recorrido, fps, LCP, INP, CLS, contraste.
4. **Qué nota sustituye a qué.** En B16: *la pieza se puntúa con las tres preguntas del paso 12; ≥ 8,5 la congela y pasa a ser el hero de la home; por debajo, no hay versión siguiente hasta que este procedimiento esté escrito.*
5. **Los techos**, con su número:

| Puerta | Techo | Lo que dio `/test/faro` v3-corr |
|---|---|---|
| Peso del recorrido, escritorio | **1,2 MB** (N3) · 2,5 MB (N4) | **589 KB** a 1440 px · 316 KB a 390 px |
| fps con **CPU ×4** | **60** | sin veredicto en el banco de esta máquina (paso 10); indicio 59,5 · 60,1 · 59,5 sin banderas, 0 fotogramas > 50 ms |
| LCP | **2,5 s** | **456 ms** a 1440 px DPR 1,5 · 368 ms a 390 px |
| Contraste AA con la intensidad **al máximo** | **4,5:1** en todos los bloques | 658 bloques en 4 anchos × 11 alturas: **0 fallos**, peor **5,97:1** |
| INP · CLS | 200 ms · 0,1 | **40 ms · 0** |
| Tamaños de letra · librerías | 5 · **cero** | 5 · cero |

> **La regla se cumple aunque duela.** El test B11 sacó 7,29 con todas las puertas técnicas cumplidas y siendo mejor que la home, y se archivó porque la regla decía 7,5. Cambiar la regla el día que se conoce el resultado la convierte en decoración.

**Se mide al acabar:** nada. Es un documento.
**Para en:** el documento escrito y leído por quien va a construir.

---

# Paso 1 · Dirección de arte

| | |
|---|---|
| **Quién** | Opus + Zyad |
| **Minutos reales** | 30 (B15: 4-sep 00:14 → 00:55, con el paso 6 dentro) |
| **Entrada** | El brief del paso 0 |
| **Salida** | `direccion-arte.md` en la carpeta de la pieza |
| **Herramienta** | ninguna, y luego Canva |

Cinco apartados, y ninguno es opinión: los colores se **muestrean de la imagen**, no se eligen.

1. **El material.** Qué textura, a qué resolución, con qué peso, y de qué archivo fuente sale. En B15: `faro-w.webp` 1600×912 q82 **33,2 KB**; `faro-m.webp` 672×900 q82 **24,6 KB**. La textura sale al **ancho nativo de la fuente**: el prompt pedía 1800 px y se quedó en 1600 porque subir interpola, pesa más y no añade detalle.
2. **La paleta, muestreada.** Cielo alto, cielo en el horizonte, superficie lejana, superficie cercana, espuma, piedra. En B15 la espuma se pintó hacia **RGB 57/80/71**, el 1 % más claro del agua de la propia foto, nunca hacia blanco: es de noche.
3. **Lo único que brilla.** Una fuente de luz, con centro en UV, radio y color de núcleo. En B15: linterna en **0,495 · 0,230**, radio **0,030**, núcleo `#FFFFDF` (escritorio); **0,500 · 0,125**, radio **0,055**, núcleo `#FFFF84` (móvil). El oro de marca `#C9A667` solo aquí: sobre fondo claro el oro es grafismo y nunca tinta.
4. **Lo prohibido**, por escrito: partículas, rayos, lluvia, niebla animada, un segundo objeto, cualquier librería, tocar el resto de la página, cambiar el copy, y pasar del techo de la pieza. **Nada se mueve fuera de la máscara.**
5. **Dos escenas no son la misma escena.** La 16:9 y la 3:4 se generan por separado y sus constantes son distintas: en B15 la piedra pasa de `#171A15` a `#40361D`. El shader lee de la tabla; no da por bueno un ajuste de una en la otra.

### El prompt de imagen — `LITERAL` (el de B11, el que produjo `faro-16x9.png`)

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

Tres partes, y la segunda es la que casi nadie escribe: **qué hay** · **dónde va el texto** (`leaving large calm areas left and right for text`) · **la lista de prohibiciones**. Sin la segunda, la imagen no sirve para una portada por bonita que sea.

**Se mide al acabar:** el peso de las cuatro piezas (dos texturas + dos máscaras). Techo en B15: 300 KB para la pieza entera. Dieron **61,4 KB**, un quinto.
**Para en:** `direccion-arte.md` escrito, con las coordenadas y la paleta medidas sobre las texturas generadas.

---

# Paso 2 · Imagen base

| | |
|---|---|
| **Quién** | Zyad |
| **Minutos reales** | 20 |
| **Entrada** | El prompt del paso 1 |
| **Salida** | Dos archivos: **16:9** (escritorio) y **3:4** (móvil) |
| **Herramienta** | Canva → «Générer une image» |

- **Un formato por uso.** La 16:9 recortada a un móvil deja media escena fuera. Se generan las dos en la misma sesión, con el mismo prompt, cambiando el formato.
- **Tres candidatas por formato**, y se elige con **un criterio escrito antes de generar**. El de B11: **«la que deje más mar vacío a los lados, porque ahí va el texto.»** No «la más bonita».
- **Coste, contado antes de gastar.** En Canva Pro las imágenes salen de una bolsa de **50 créditos**. Tres candidatas × dos formatos = **6 créditos**; con una repetición, 10. Afinar el prompt es más barato que repetir.
- 🔴 **La descarga es manual y es el archivo, no una captura.** Se entra en Canva → IA → *Historique* y se baja el PNG. **Una captura de pantalla —de Canva o de una conversación de Claude— no sirve como archivo fuente:** pierde resolución, y el día que haga falta otro recorte no hay original. En B16-corr el límite de resolución de la máscara (800×456 contra una textura de 1600×912) obligó a reescalar ×2 en vez de rehacerla: eso es exactamente lo que pasa cuando la fuente no se guarda al máximo tamaño.
- Es un paso de Zyad, no de Claude. No se automatiza ni se raspa.

**Se mide al acabar:** el ancho nativo del PNG descargado (es el techo de todo lo que venga después) y que la zona de texto esté vacía en las dos.
**Para en:** `faro-16x9.png` y `faro-3x4.png` en `media/` del proyecto.

---

# Paso 3 · Clips: dos estados

| | |
|---|---|
| **Quién** | Zyad |
| **Minutos reales** | 20 por estado, con la espera de render fuera |
| **Entrada** | La imagen 16:9 del paso 2 |
| **Salida** | Dos clips de 5 s, sin audio, mismo encuadre, cámara y objeto quietos |
| **Herramienta** | **Kling**, image-to-video |

**Dos estados y solo dos: calma e intensidad.** No tres, no una cadena. En B16 la cadena de tres clips se probó y se cerró (anexo, callejón 1).

### El prompt de vídeo — `LITERAL` (el de B11, image-to-video sobre `faro-16x9.png`)

```
Animate the sea only. Slow heavy swells roll toward the lighthouse and
break against its base with foam and spray, looping naturally. The
lighthouse, the pier and the camera do not move. No zoom in, no zoom out,
no pan, no change of light, no lightning, no rain, no people, no birds.
Smooth, realistic water with true depth of motion.
```

Para el estado de calma, el mismo prompt con `Extreme slow motion, almost still, the foam barely moves` añadido al final. `LITERAL`.

> ⚠️ **Los prompts exactos de `calma-1280` y `tormenta-1280` de la v2.1 no están en ninguna fuente del repositorio**, ni el de continuación que generó `subida-scrub-1280` a partir del último fotograma del de calma. Lo que queda escrito de ellos es su resultado medido, no su texto. Los dos de arriba son los de B11, que son los que sí están.

- **Máximo dos intentos por estado.** Si al segundo el generador sigue moviendo la cámara o cambiando la luz, se cambia de herramienta, no de prompt. No es prudencia: es aritmética. En Canva Pro el vídeo es un tope aparte de unos **5 clips al mes**; en Kling, 66 créditos diarios gratis y ~40 por clip de 5 s a 1080p.
- **Regla de aceptación:** si el objeto principal o la luz cambian entre el poster y el primer fotograma, se repite. Ese salto se ve al arrancar.
- **Marca de agua.** Kling la deja. Se quita con `delogo`, que interpola la zona, **y no con `crop`**, que recorta el encuadre y rompe la correspondencia UV con la foto. Los clips de B16 llegaron a `media/olas/_original/` ya a 1280×728 desde los 1272×724 nativos de Kling: **el comando concreto que quitó la marca de agua no se guardó en ninguna fuente.** La forma correcta, `RECONSTRUIDO`:

```bash
ffmpeg -i kling-crudo.mp4 -vf "delogo=x=W-160:y=H-48:w=150:h=40,scale=1280:-2" \
  -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -an -movflags +faststart calma-1280.mp4
```

### 🔴 Antes de construir nada: medir que el clip se mueve

Esto cerró dos días de trabajo en B16 y es el primer callejón del anexo. Un clip generado desde una imagen **puede salir estático**, y en una página no se nota porque el ojo pone el movimiento que espera.

Se mide la **desviación temporal por píxel** dentro de la zona que debe moverse, sobre todos los fotogramas:

| | `hero-1280.webm` (Canva) | El mismo, `.mp4` | máster 1920 |
|---|---|---|---|
| Desviación temporal por píxel, mediana | **0,35/255** | 0,11 | 0,00 |
| … p99 | 0,72 | 0,61 | 0,50 |
| Diferencia máxima con el fotograma 0 | **0,56/255** | 0,41 | 0,32 |

**Un mar moviéndose da entre 10 y 40.** Por debajo de **2/255** de mediana no es un vídeo: es una foto que pesa como un vídeo. Y el número ya estaba escrito una semana antes — *«la luminancia apenas varía, 0,0334 a 0,0335 en los 150 fotogramas»* — leído como «el vídeo es oscuro» cuando decía «el vídeo no se mueve».

### Qué se descartó, con su número

- **Canva como fuente de vídeo.** Sus clips son fotos codificadas (tabla de arriba). No se vuelve a usar para una superficie viva.
- **El clip de «subida» como bucle.** Está en calma **tres de sus cinco segundos**; como bucle respiraría calma → ola → calma. El de tormenta tiene actividad constante (**1,0/255 por fotograma en todo el clip**) y es el que lee como superficie encrespada. El bucle de intensidad sale del clip de tormenta, no del de subida.

**Se mide al acabar:** desviación temporal por píxel > 2/255 en la zona viva, y peso del crudo > 150 KB para 5 s.
**Para en:** dos `.mp4` en `media/olas/_original/`, 5,042 s, 24 fps, 1280×728, sin audio.

---

# Paso 4 · Bucle sin costura

| | |
|---|---|
| **Quién** | Sonnet (o cualquier modelo) |
| **Minutos reales** | 15 los dos bucles |
| **Entrada** | Los dos clips de 5,042 s del paso 3 |
| **Salida** | Dos másteres de **4,000 s exactos** (96 fotogramas a 24 fps) |
| **Herramienta** | ffmpeg, filtro `xfade` |

Un clip generado no cierra por sí solo: el último fotograma y el primero difieren. En la v2.1 se resolvió con **dos `<video>` en relevo y un disolvido de 0,4 s en el shader**, y costaba 0,4 s en los que dos espumas conviven. En la v3 se resuelve **antes, en el archivo**: el clip se funde consigo mismo y el resultado se reproduce con `loop` y sin ayuda.

La cuenta es una resta: **duración del bucle = duración del clip − solape**. Con el clip de Kling de 5,042 s y un bucle de 4,000 s, el solape real fue de **1,042 s**.

`RECONSTRUIDO` — la línea exacta no se guardó; ésta produce los másteres que hay en `media/olas/_v3/` (4,000 s, 24 fps, 1280×728):

```bash
ffmpeg -i calma-1280.mp4 -filter_complex \
  "[0:v]trim=0:4,setpts=PTS-STARTPTS[a]; \
   [0:v]trim=4:5.042,setpts=PTS-STARTPTS[b]; \
   [b][a]xfade=transition=fade:duration=1.042:offset=0[out]" \
  -map "[out]" -r 24 -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -an \
  -movflags +faststart media/olas/_v3/calma-bucle-master.mp4
```

### La verificación de costura, que es lo que manda

Se mide la **diferencia media de píxeles entre el último fotograma y el primero** del bucle, y se compara con la diferencia entre dos fotogramas consecutivos normales. Si la costura no es mayor que el latido normal del clip, no se ve.

| | Techo | calma | tormenta |
|---|---|---|---|
| Último → primer fotograma, cuadro entero | **3 %** | **0,31 %** | **0,35 %** |
| … solo dentro de la máscara | — | 0,52 % | 0,63 % |
| Entre dos fotogramas consecutivos normales | referencia | 0,13 % | 0,27 % |

**Se mide al acabar:** la tabla de arriba. Techo 3 %.
**Para en:** dos másteres de 4,000 s en `media/olas/_v3/`. Sin comprimir todavía.

---

# Paso 5 · Compresión

| | |
|---|---|
| **Quién** | Sonnet (o cualquier modelo) |
| **Minutos reales** | 10 |
| **Entrada** | Los másteres del paso 4 |
| **Salida** | `media/olas/` completa: webm + mp4 + poster, por uso |
| **Herramienta** | ffmpeg y Pillow |

Dos formatos siempre: **WebM/VP9 primero** en el `<source>` (pesa menos de la mitad) y **mp4/H.264 detrás**, que es el respaldo de Safari. Todo **sin audio** (`-an`) y todo con **`-pix_fmt yuv420p`**: sin eso, Safari y algunos Android no reproducen el mp4 y se quedan en el poster sin decir por qué.

**El keyframe es la decisión de peso.** Verificado con `ffprobe` sobre lo publicado: los bucles de la v3 llevan keyframe **en 0 y en 2,000 s**, es decir `-g 48` a 24 fps. Es lo normal, y por eso el códec trabaja bien. La v2.4 necesitaba **keyframe cada 6 fotogramas** para que el scrub pudiera buscar, y eso **duplicaba el peso** (290 + 321 KB frente a 116 + 158). El día que se quita el scrub, el peso cae solo.

`RECONSTRUIDO` — las líneas de la v3 no se guardaron; éstas reproducen los archivos publicados (1280×728 · 24 fps · keyframe cada 2 s · yuv420p · sin audio):

```bash
# BUCLE DE ESCRITORIO · webm primero, mp4 de respaldo
ffmpeg -i media/olas/_v3/calma-bucle-master.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 \
  -g 48 -keyint_min 48 -row-mt 1 -pix_fmt yuv420p -an  media/olas/calma.webm
ffmpeg -i media/olas/_v3/calma-bucle-master.mp4 -c:v libx264 -crf 26 -preset slow \
  -g 48 -keyint_min 48 -sc_threshold 0 -pix_fmt yuv420p -an -movflags +faststart  media/olas/calma.mp4

# BUCLE MÓVIL · recorte central del de calma a 540×720, no un clip nuevo
ffmpeg -i media/olas/_v3/calma-bucle-master.mp4 -vf "crop=546:728:367:0,scale=540:720" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -g 48 -keyint_min 48 -row-mt 1 -pix_fmt yuv420p -an  media/olas/calma-m.webm

# POSTER = PRIMER FOTOGRAMA EXACTO DEL BUCLE, no una lámina parecida
ffmpeg -i media/olas/calma.webm -frames:v 1 media/olas/_v3/calma-primer-fotograma.png
python -c "from PIL import Image; Image.open('media/olas/_v3/calma-primer-fotograma.png').save('media/olas/poster-calma.webp','WEBP',quality=82,method=6)"
```

### Los pesos que dieron, medidos sobre lo publicado

| Archivo | webm | mp4 | Qué es |
|---|---|---|---|
| `calma` | **116,1 KB** | 251,4 KB | bucle de calma, 1280×728, 4 s |
| `tormenta` | **164,8 KB** | 306,4 KB | bucle de intensidad, tras el ajuste de tono del paso 7 (antes: 157,5 / 292,3) |
| `calma-m` | **52,1 KB** | 94,9 KB | bucle móvil, 540×720, 4 s |
| `poster-calma.webp` | 17,2 KB | | primer fotograma del bucle de escritorio |
| `poster-calma-m.webp` | 10,3 KB | | primer fotograma del bucle móvil |
| **Recorrido entero** | **589 KB** a 1440 px · **316 KB** a 390 px | | techo 1,2 MB |

**El poster es el primer fotograma exacto del bucle**, no una imagen parecida. Es lo que hace que el efecto se encienda sin que cambie un píxel, y que cuando no se enciende no se note. Es también el LCP (paso 8).

**Se mide al acabar:** peso por archivo y peso del recorrido entero contra el techo de 1,2 MB; keyframes con `ffprobe -select_streams v:0 -show_entries packet=pts_time,flags`.
**Para en:** `media/olas/` con los seis archivos y los dos posters.

---

# Paso 6 · Máscara

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 40 la primera vez (B15) · 20 la corrección (B16-corr, 11-sep 13:38) |
| **Entrada** | La textura del paso 1 y los polígonos del objeto |
| **Salida** | `mascara-w.png` y `mascara-m.png`, un canal, a la resolución de la textura |
| **Herramienta** | Python + Pillow + scipy (la que se usó) o ImageMagick |

**Blanco = lo que se mueve. Negro = lo que no se mueve nunca.**

### Cómo se construye, en tres decisiones

1. **Por posición, no por umbral.** El horizonte y los polígonos del objeto se leen sobre una rejilla UV dibujada encima de la imagen. El detector automático de horizonte acertó en la 16:9 (**0,527**) y falló en la 3:4: dio 0,737, que era el borde del espigón. Se leyó a mano: **0,575**.
2. **Refinado por luminancia solo dentro del polígono del objeto**, con un 3 % de margen.
3. 🔴 **La espuma es clara y es agua.** La primera máscara restaba todo lo claro dentro de una banda fija del 22 % al 78 % del ancho. En la 16:9 funcionó; en la 3:4 **se comió la espuma**, que es lo que más tiene que moverse, y dejó agujeros donde rompen las olas. Un umbral de brillo no distingue piedra de espuma; lo que las distingue es **dónde** están. Se vio superponiendo la máscara en rojo sobre la textura, no en los números: el porcentaje de agua salía razonable.

### La receta de la v3-corr — umbral, erosión, pluma solo en el horizonte

La pluma es la parte delicada. Una pluma **en todo el borde** mezcla el mar fijo de la foto con el mar del vídeo y deja **dos mares en la misma franja**: es el segundo callejón del anexo. La pluma va **solo en la línea del horizonte**, donde el desplazamiento vertical la necesita; **junto a la piedra, ninguna**.

**ImageMagick — la receta pedida, `RECONSTRUIDO`** (no había ImageMagick en la máquina, por eso no se ejecutó):

```bash
magick mascara-w.png -resize 1600x912 -threshold 50% \
  -morphology Erode Disk:6 -blur 0x0.7 mascara-dura.png
magick mascara-w.png -resize 1600x912 -threshold 50% \
  -morphology Erode Disk:6 -blur 0x8 mascara-plumada.png
magick mascara-dura.png mascara-plumada.png \
  \( -size 1600x912 xc:black -fill white -draw "rectangle 0,469 1600,493" \) \
  -composite mascara-w.png     # banda de 24 px centrada en y = 481 (0,527 × 912)
```

**scipy — la que se usó de verdad, `LITERAL`**, de `_capturas/v3-corr/bancos/mascara-v3.py`:

```python
def disco(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return (x * x + y * y) <= r * r

def receta(src, W, H, horizonte, nombre):
    m = np.asarray(Image.open(src).convert("L").resize((W, H), Image.BICUBIC), np.float32) / 255
    dura = m >= 0.5                                              # -threshold 50%
    ero = ndi.binary_erosion(dura, structure=disco(6))           # -morphology Erode Disk:6
    suave = ndi.gaussian_filter(ero.astype(np.float32), 0.7)     # -blur 0x0.7
    yh = int(round(horizonte * H))
    banda = np.zeros((H, W), np.float32); banda[max(yh - 12, 0):yh + 12, :] = 1.0
    plum = ndi.gaussian_filter(ero.astype(np.float32), 8.0)      # -blur 0x8
    out = np.clip(suave * (1 - banda) + plum * banda, 0, 1)
    Image.fromarray((out * 255).round().astype(np.uint8), "L").save(src, optimize=True)

receta(D / "mascara-w.png", 1600, 912, 0.527, "mascara-w")
receta(D / "mascara-m.png",  672, 900, 0.575, "mascara-m")
```

- **Erosión de 6 px hacia la superficie.** La máscara se come 6 px de mar, no de piedra. Resultado: el mar pasa del **34,9 % al 33,2 %** del cuadro (móvil: 24,4 → 22,2 %).
- **Pluma de 24 px solo en el horizonte**: banda de 24 px centrada en `y = 0,527 × 912 = 481`, gaussiana σ 8, compuesta encima de la máscara dura.
- **Ninguna pluma en la piedra.** σ 0,7 es antialias, no pluma.

> ⚠️ **Aviso de resolución.** La fuente de la máscara era de **800×456** y la textura de **1600×912**. No había forma de rehacerla a resolución completa, así que se reescaló ×2 con bicúbico y se umbralizó al 50 %. Funciona, pero **el borde no tiene más detalle del que tenía la fuente**. Con un cliente nuevo: la máscara se dibuja **a la resolución de la textura desde el principio**, y la fuente se guarda.

**Se mide al acabar:** porcentaje de superficie viva sobre el cuadro, antes y después de erosionar; y un recorte de control a 2× con el borde pintado en rojo sobre la foto.
**Para en:** las dos máscaras sobrescritas, las anteriores en `media/_mascara-anterior/`.

---

# Paso 7 · Tono

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 25 |
| **Entrada** | Los bucles del paso 5 y la máscara del paso 6 |
| **Salida** | El bucle de intensidad reencodado, si hace falta |
| **Herramienta** | `_capturas/v3-corr/bancos/tono-v3.py` + ffmpeg |

Aunque la máscara sea perfecta, si el vídeo y la foto no tienen el mismo color **el borde se ve como una línea**. Se mide, no se juzga a ojo.

**Cómo se mide.** Dos bandas de **12 px a cada lado del borde erodido**, por debajo del horizonte (la pluma del horizonte no es «borde con la piedra»): el lado foto es el mar de la foto que quedó fuera de la máscara, el lado vídeo son los 12 px de vídeo pegados al borde. **L\*a\*b\* medio en cada banda, por fotograma**, y **ΔE (CIE76)** entre las dos. Se toma la media y el máximo sobre los 96 fotogramas del bucle.

**Techo: ΔE ≤ 3 en los dos estados.**

| Estado | ΔE medio | ΔE máximo | Qué se hizo |
|---|---|---|---|
| Calma (mezcla 0) | 1,47 | 1,80 | nada |
| Intensidad (mezcla 1), antes | 1,97 | **3,01** | fuera de techo |
| Intensidad (mezcla 1), después | **0,93** | **2,07** | el filtro de abajo |

### El ajuste — `LITERAL`

```
eq=brightness=-0.006,colorbalance=gm=0.01:bm=-0.01
```

Se aplica al máster de 4 s y se reencoda con los mismos parámetros del paso 5. Coste: webm **157,5 → 164,8 KB** (+4,6 %), mp4 **292,3 → 306,4 KB** (+4,7 %). Es el precio de que el borde desaparezca, y se paga.

**Se mide al acabar:** ΔE medio y máximo por estado, con `tono-v3.py`. Techo 3.
**Para en:** el bucle corregido publicado, y el anterior guardado en `media/olas/_v3/tormenta-antes.webm`.

---

# Paso 8 · El hueco en la página

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 4-sep 01:54 → 18:15 (sesión entera de sección 1, con la maquetación de columnas dentro) |
| **Entrada** | La página ya cerrada |
| **Salida** | La página entera pasando por delante de la escena, con el texto legible |
| **Herramienta** | CSS a mano |

La pieza no es el hero: **es el fondo de toda la página**. Cinco decisiones, y las cinco costaron una medida.

**1 · Canvas fijo detrás de todo, primer hijo del `<body>`.** `LITERAL` de `faro.css`:

```css
.escena-fondo{ position: fixed; inset: 0; z-index: 0; overflow: hidden;
               background: var(--k-fondo); pointer-events: none; }
.escena-zoom{ position: absolute; inset: 0; transform-origin: 50% 60%; }
.pagina{ position: relative; z-index: 1; }
```

🔴 **`.pagina` lleva `z-index` y nada más.** Ni `isolation`, ni `filter`, ni `opacity`: cualquiera de los tres crea un *backdrop root*, y dentro de él un `backdrop-filter` solo ve lo que se pinta dentro del contenedor, no la escena de detrás. El zoom de entrada vive en una capa **de dentro** (`.escena-zoom`), no en el marco: con el `scale(1.06)` en el marco —que es quien recorta— aparecían **de 7 a 17 px de barra horizontal** por debajo de 769 px.

**2 · Fondos translúcidos o paneles, según el ancho.** De 1024 px en adelante, cada columna y cada cabecera de sección llevan su reserva en un `::before`; por debajo, el texto va a todo ancho y cada bloque lleva panel. `LITERAL`:

```css
:root{ --k-reserva: .35; --k-reserva-x: 3rem; --k-reserva-y: 4rem; }
.col::before{ inset: calc(var(--k-reserva-y) * -1) calc(var(--k-reserva-x) * -1);
              background: rgb(25 38 34 / var(--k-reserva)); }
@media (max-width: 1023px){
  .oferta-bloques, .seccion, .pie{ background: rgb(25 38 34 / .62); }
  .cierre-escena .seccion{ background: rgb(25 38 34 / .62); }
}
```

🔴 **La reserva no sube el contraste; aplana la textura.** Medido con y sin ella sobre el mismo fotograma: **8,04:1 sin reserva y 7,92:1 con ella** — el velo es casi del color del mar, sube el suelo tanto como baja el techo. Lo que sí hace es aplanar el agua: **σ 9,4 → 3,6**, y eso es la mitad del motivo por el que un texto sobre una superficie en movimiento se lee mal. Del salto de σ, el velo aporta 4,3-6,3 de diferencia RGB y el `blur(14px)` aporta 0,5-0,6: **si hay que quitar algo por fps, se quita el desenfoque, no el velo.** Y 0,62 con desenfoque, probado, dejaba la escena en un manchón plano justo debajo de las columnas, que es donde la página vive: por eso 0,35 sin desenfoque de 1024 px arriba.

**3 · La cabecera que se retira, y los 0,2 px que costaron un fallo AA.** La cabecera fija se oculta al bajar. Desplazarla exactamente su alto deja **una fila de subpíxel de su borde inferior asomando por arriba**, con el subrayado del CTA encima del titular: eso es el `1,53:1` que apareció en cinco versiones seguidas del medidor de contraste. `LITERAL`:

```css
.hero-arriba.oculta{ transform: translateY(calc(-100% - 4px)); }  /* los 4 px matan la fila de subpíxel */
```

Y en JavaScript, `LITERAL` de `faro.js`:

```js
if (y === ultimaY) return;   // un scroll que no se mueve no es «subir»: la cabecera no vuelve sola
```

Sin esa línea, un scroll programado que acaba con varios `scrollTo` al mismo píxel se lee como «sube» y la cabecera reaparece en medio del vídeo del gesto.

**4 · El poster es el LCP**, precargado por ancho, antes que fuentes y vídeo. `LITERAL` de `index.html`:

```html
<link rel="preload" as="image" type="image/webp" href="media/olas/poster-calma.webp"
      fetchpriority="high" media="(min-width: 768px)">
<link rel="preload" as="image" type="image/webp" href="media/olas/poster-calma-m.webp"
      fetchpriority="high" media="(max-width: 767px)">
```

Va en un `<picture>` real bajo el canvas, no en el atributo `poster` de un `<video>`: el atributo no admite `srcset` ni `fetchpriority`.

**5 · Los bucles de escritorio no se ven nunca.** Van a `opacity: 0` y **no a `display:none`**: un vídeo que no se pinta puede dejar de decodificar fotogramas, y entonces el lienzo dibuja siempre el mismo.

**Se mide al acabar:** contraste con la intensidad al máximo en todos los bloques (paso 10) y desbordamiento horizontal a 320, 360, 390, 430, 768, 900, 1024, 1440 y 1600 px.
**Para en:** la página maquetada, con la pieza todavía sin escribir.

---

# Paso 9 · Construcción

| | |
|---|---|
| **Quién** | **Fable 5.1 · High** |
| **Minutos reales** | v3: 10-sep 00:38 → 01:22, **44 min** desde el diagnóstico hasta la publicación medida |
| **Entrada** | Los bucles, la máscara, la página del paso 8, `direccion-arte.md` |
| **Salida** | `pieza.js` y la página publicada |
| **Herramienta** | Canvas 2D a mano. **Sin shader, sin librerías** |

Seis cosas fijan la pieza, y cada una tiene su fragmento.

**1 · El orden de pintado: vídeo → vídeo → recorte del objeto encima.** Éste es el cambio que mató la línea entre la superficie y la piedra. No se recorta el vídeo con la máscara (`destination-in`): se pinta el vídeo entero en su rectángulo y **encima** el recorte de la foto con la superficie transparente (`alfa = 1 − máscara`). Así cualquier resto de pluma funde **piedra → vídeo**, nunca mar fijo + mar móvil. `LITERAL` de `pieza.js`:

```js
function pintar() {
  var A = videos[0], B = videos[1];
  if (A.readyState < 2) return false;
  var kx = geo.dw / ESC.tw, ky = geo.dh / ESC.th;                  // foto → lienzo
  var dx = geo.ox + caja.sx * kx, dy = geo.oy + caja.sy * ky, dw = caja.sw * kx, dh = caja.sh * ky;
  var vx = caja.sx / ESC.tw * VW + OFFSET.x, vy = caja.sy / ESC.th * VH + OFFSET.y,
      vw = caja.sw / ESC.tw * VW, vh = caja.sh / ESC.th * VH;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(A, vx, vy, vw, vh, dx, dy, dw, dh);
  if (mezcla > 0.001 && B.readyState >= 2) {
    ctx.globalAlpha = mezcla; ctx.drawImage(B, vx, vy, vw, vh, dx, dy, dw, dh); ctx.globalAlpha = 1;
  }
  ctx.drawImage(recorte, caja.sx, caja.sy, caja.sw, caja.sh, dx, dy, dw, dh);
  pintados++;
  return true;
}
```

El recorte se calcula **una vez** al cargar, con `OffscreenCanvas` → `ImageBitmap` (y lienzo normal si no existe), y de paso sale la caja del rectángulo que hay que repintar. `LITERAL`:

```js
for (var i = 0, n = 0; i < m.length; i += 4, n++) {
  p[i + 3] = 255 - m[i];                                      // alfa = 1 − superficie
  if (m[i] > 2) { var x = n % W, y = (n - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x;
                  if (y < y0) y0 = y; if (y > y1) y1 = y; }
}
recorte = off.transferToImageBitmap ? off.transferToImageBitmap() : off;
caja = { sx: Math.max(x0 - 6, 0), sy: Math.max(y0 - 6, 0),
         sw: Math.min(x1 - x0 + 13, W), sh: Math.min(y1 - y0 + 13, H) };
```

**Alineación:** ventana de 200×200 px en la base del objeto, barrido ±6 px y correlación de fase. Dio **0 × 0 px** (diferencia mínima 3,14/255 en (0,0); a 1 px sube a 4,1). El vídeo se pinta con el **mismo rectángulo cover que la foto**; a 1280×728 la foto cae a esa altura exacta y a 727 o 729 la diferencia sube. `OFFSET` queda en el código para el día que un cliente dé otro número.

**2 · La mezcla ← scroll, con curva suave y lerp 0,06.** Un solo parámetro, `mezcla ∈ [0,1]`, del progreso de scroll **de todo el documento**. Nunca directo. `LITERAL`:

```js
var LERP = 0.06;
function suave(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
function progreso() {
  var fin = document.documentElement.scrollHeight - window.innerHeight;
  return fin > 0 ? Math.min(Math.max(window.scrollY / fin, 0), 1) : 0;
}
function marco() {
  raf = 0;
  if (!vivo || !visible) return;
  objetivo = forzada !== null ? forzada : suave(progreso());
  var antes = mezcla;
  mezcla += (objetivo - mezcla) * LERP;
  if (Math.abs(mezcla - objetivo) < 0.0005) mezcla = objetivo;
  if (videos[0]._sinRVFC) nuevo = true;
  if (nuevo || Math.abs(mezcla - antes) > 0.0002) { nuevo = false; pintar(); }
  raf = requestAnimationFrame(marco);
}
```

**Solo se repinta cuando hay fotograma nuevo o la mezcla ha cambiado.** El fotograma nuevo llega por `requestVideoFrameCallback`, no por rAF:

```js
if ('requestVideoFrameCallback' in v) {
  var cb = function () { nuevo = true; v._fotogramas = (v._fotogramas || 0) + 1; v.requestVideoFrameCallback(cb); };
  v.requestVideoFrameCallback(cb);
} else { v._sinRVFC = true; }
```

Y al cargar a mitad de página, la mezcla **arranca donde está el scroll**, no desde cero: `mezcla = suave(progreso());`.

**3 · Los `<video>`, en reproducción continua.** `muted`, `playsinline`, `loop`, `autoplay`, `preload="auto"`, `opacity: 0`. **`currentTime` no se usa nunca como control** — solo lo tocan los ganchos de medida.

**4 · El contrato de escena**, entero:

- **DPR ≤ 1,5** (`Math.min(window.devicePixelRatio || 1, 1.5)`).
- **`visibilitychange`**: pestaña oculta → ni rAF ni decodificación; los dos `<video>` en pausa.
- **Primer frame cronometrado**: si pasa de **80 ms**, se apaga y queda el poster.
- **Sin canvas 2D, textura que no llega o error de vídeo** → poster, y el motivo en `data-pieza`.
- **`prefers-reduced-motion`** → el archivo **no hace nada** y queda el poster, sin descargar un byte.
- **`resize` que cruza el breakpoint** → `location.reload()`. Es la forma barata y correcta.

`LITERAL`:

```js
var a = performance.now();
pintar();
var ms = performance.now() - a;
canvas.setAttribute('data-primer-frame-ms', ms.toFixed(1));
if (ms > 80) { apagar('primer-frame-lento'); return; }
vivo = true;
canvas.classList.add('viva');
canvas.setAttribute('data-pieza', 'viva:v3:' + formato);
```

**5 · Móvil (< 768 px): un bucle y un velo.** Un solo `<video>` fijo detrás de la página (el recorte central del bucle de calma, 540×720, 52 KB) y el scroll manda **solo un oscurecido lineal de 0 a 25 %**. Sin lienzo, un decodificador. `LITERAL`:

```js
var VELO_MAX = 0.25;
var obj = VELO_MAX * (forzada !== null ? forzada : progreso());   // lineal, como pide la spec
op += (obj - op) * LERP;
if (velo) velo.style.opacity = op.toFixed(3);
```

**6 · Arranque después del LCP.** `LITERAL`:

```js
var ARRANQUE_MS = 300;       // después de `load`, es decir, después del LCP
function despues() { setTimeout(iniciar, ARRANQUE_MS); }
if (document.readyState === 'complete') despues();
else window.addEventListener('load', despues, { once: true });
```

**7 · Los ganchos de medida van en la pieza, no en el banco.** Sin ellos el paso 10 no se puede hacer: `forzar(m)` fija la mezcla sin inercia, `congelar(seg)` deja los dos bucles parados en un fotograma concreto con la mezcla a 1 (es el peor caso del contraste), `reanudar()` deshace, `estado()` devuelve modo, formato, mezcla, fotogramas presentados y pintados, la caja y la geometría.

**Se mide al acabar:** el paso 10 entero.
**Para en:** publicado. **Publicar exige copiar a `Sitio-Web/`:**

```bash
python "C:\Users\zyadb\Desktop\IA\faro-digital-web\test\faro\sincronizar-publicacion.py"
npx wrangler pages deploy --project-name=faro-digital --branch=main --commit-dirty=true
```

---

# Paso 10 · Medición

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 30, más lo que cueste arreglar el banco |
| **Entrada** | La URL publicada |
| **Salida** | `medidas.json` y la tabla de puertas |
| **Herramienta** | Playwright + Chrome instalado, por CDP |

### Las puertas

| Puerta | Techo | Cómo |
|---|---|---|
| Peso del recorrido | 1,2 MB | suma del **cuerpo** de cada respuesta, no del `content-length`, que falta en muchas |
| LCP | 2,5 s | **sin tocar la página**: cualquier scroll lo recalcula. Con scroll, `/test/faro` daba 6.600 ms sobre una miniatura de caso; sin scroll, **456 ms** sobre el titular |
| INP | 200 ms | clics reales sobre enlaces, con `preventDefault` en los `<a>` |
| CLS | 0,1 | `PerformanceObserver` de `layout-shift`, descartando `hadRecentInput` |
| fps con CPU ×4 | 60 | ver calibración |
| Contraste AA con la intensidad al máximo | 4,5:1 | ver más abajo |
| Fotogramas únicos por segundo con la página parada | 24-30 | ver más abajo |

### 🔴 Calibración del banco de fps — se hace ANTES de medir la pieza

Un medidor de fps no vale nada si no se sabe cuál es su techo. **Antes de cada tanda, una página vacía tiene que dar más de 100 fps** con las banderas puestas. `LITERAL` de `fps-v3.py`:

```python
nav = pw.chromium.launch(channel="chrome", headless=False,
                         args=["--disable-frame-rate-limit", "--disable-gpu-vsync"])
pg0 = nav.new_page(); pg0.goto("about:blank"); pg0.bring_to_front(); time.sleep(0.5)
pg0.evaluate(C); time.sleep(3); techo = pg0.evaluate(L); pg0.close()
print("banco: página vacía %s fps%s" % (techo["fps"], "" if techo["fps"] > 100 else "  → NO VERIFICADO: sin veredicto"))
```

**Si da 57, el banco no vale.** En esta máquina dio 57,2 en dos pasadas de tres y 114 en la tercera, a ráfagas; con CPU ×1 y sin banderas topa a **30,4 fps**. Con un techo de 30 o de 57 Hz, «la pieza da 59» no dice nada: dice que el banco da 59. Entonces:

1. La puerta de 60 fps se declara **sin veredicto**. No «pasa».
2. Se anota el indicio en las dos condiciones: con banderas (185 · 271 · 201 de media, peor segundo 110 · 82 · 58) y sin ellas (59,5 · 60,1 · 59,5, 0 fotogramas > 50 ms).
3. **El veredicto se busca en un Android real**, por `adb` y Chrome remoto:

```bash
adb devices
adb shell am start -a android.intent.action.VIEW -d "https://faro-digital.pages.dev/test/faro/"
adb forward tcp:9222 localabstract:chrome_devtools_remote
# y desde el PC, Playwright/CDP contra http://localhost:9222
```

> Esta ruta **no se ejecutó en B15-B17**: el fps en Android real sigue sin medir desde la v1, y está anotado como tal en las notas de las dos versiones. Es el único número del contrato que esta máquina no puede dar.

**Dos trampas del banco, cerradas, que reaparecen:**

- **Ventana ocluida = 1 fps.** Chrome baja el rAF a 1/s si su ventana queda detrás de otra. Dio 1-2,6 fps con fotogramas de 1.016 ms, y no era la página. **`pg.bring_to_front()` después del `goto`, y un banco con ventana a la vez.**
- **Emulación móvil con ventana no pinta.** Fotogramas de 86 s y un INP de 99 s eran de la ventana emulada. El INP móvil se mide **en Chromium sin ventana**: 56 ms.

### El medidor de halo — mediana del perfil, no media

Para comprobar que no queda una línea entre la superficie y el objeto se toman **nueve recortes a 2×** (tres zonas del borde × mezcla 0, 0,5 y 1) y se mide la anchura del halo en píxeles.

**Un halo es una banda sistemática a lo largo del borde.** Para cada punto del borde se toma el perfil perpendicular (la normal de la máscara), y **se promedia por la MEDIANA sobre todos los puntos del borde**, no por la media: así la textura de la superficie y la de la piedra se cancelan. Las referencias son las medianas a 5-10 px de cada lado; el halo son las posiciones dentro de ±4 px cuya mediana queda fuera de `[min − 5, max + 5]`.

🔴 **La primera versión del medidor promediaba por la media y contaba la espuma pegada al borde: daba 1-4,5 px que no eran un halo.** Un medidor se prueba contra lo que **sí** debe marcar: se pinta una línea de 1, 2 y 3 px a lo largo del borde y tiene que dar 1, 3 y 5. Con eso, los nueve recortes dieron **0 px** (techo 2).

### Fotogramas únicos por segundo, con la página parada

Que la superficie siga viva sin tocar nada. Se lee `getImageData` de una franja en cada rAF durante 5 s, en tres alturas, y se cuentan hashes distintos. **Techo: 24-30 por segundo** (los bucles van a 24 fps, cada uno con su fase). La v3 dio **24-27**. Si sale 0, la pieza está congelada aunque los fps digan 60.

### Contraste, con el peor caso fabricado

Una escena viva no tiene un fondo: tiene un rango. Se fabrica el peor caso, se congela y se mide. `LITERAL`:

```bash
MSYS_NO_PATHCONV=1 python "C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\03-Recursos-Internos\Utilidades\contraste-sobre-escena.py" \
  "C:\Users\zyadb\Desktop\IA\faro-digital-web" --ruta /test/faro/ --ambito main \
  --anchos 390 1024 1440 1600 \
  --peor-caso "C:\Users\zyadb\Desktop\IA\faro-digital-web\test\faro\peor-caso-tormenta.js"
```

El peor caso pone la mezcla a 1 y para los dos bucles **en el fotograma más claro del bucle de intensidad** (el 77 de 96, 3,208 s, p98 75/255); en móvil, el bucle de calma en el suyo (el 73, 3,042 s). El `MSYS_NO_PATHCONV=1` es obligatorio desde Git Bash: sin él, `--ruta /test/faro/` se convierte en `C:/Program Files/Git/test/faro/`.

🔴 **`puertas.py` y `verificar-publicado.py` no pueden medir esto**: los dos componen alfas de colores de CSS y **se callan cuando el fondo es una foto, un vídeo o un lienzo**. En una página cuyo fondo entero es una escena viva, los dos dan verde sin haber mirado el único sitio donde puede fallar.

### El formato del `medidas.json`

Un archivo por tanda, con el techo del banco dentro. `LITERAL` de `_capturas/v3-corr/bancos/puertas-v3corr.json`:

```json
{
 "techo_pantalla": { "fps": 56.5, "dtP50": 16.7, "dtP95": 16.8, "dtMax": 33.3, "largos": 0, "n": 167 },
 "1440": {
  "peso_primera_KB": 192.8,
  "peso_total_KB": 588.8,
  "archivos": 19,
  "top": [ [164.8, "tormenta.webm"], [116.1, "calma.webm"], [49.1, "WorkSans-latin.woff2"] ],
  "lcp_ms": 6600,
  "lcp_elemento": "IMG.caso-foto aura-480.webp",
  "cls": 0,
  "inp_ms": 40,
  "fps": { "arriba": { "fps": 59.5, "dtP50": 16.7, "dtP95": 16.8, "dtMax": 33.4, "largos": 0 } }
 }
}
```

**Tres reglas del formato:** el **techo del banco va en el mismo archivo** que la medida, o el número no se puede leer dentro de un mes; **`lcp_elemento` siempre**, porque un LCP bueno sobre el elemento equivocado no es un LCP bueno; y **`top` con los archivos más pesados**, que es lo que se mira cuando el peso sube.

**Se mide al acabar:** todo lo de arriba.
**Para en:** `medidas.json` escrito y la tabla de puertas en las notas, con «sin veredicto» donde corresponda.

---

# Paso 11 · Ronda de corrección

| | |
|---|---|
| **Quién** | Zyad dicta · Fable ejecuta |
| **Minutos reales** | v3-corr: 11-sep 13:38 → 13:49, **11 min** de la primera máscara al commit |
| **Entrada** | La versión publicada y medida |
| **Salida** | La misma versión con cinco cambios |
| **Herramienta** | la que toque |

**Una ronda por versión. Cinco cambios, numerados, sin justificar.** Zyad escribe qué está mal; no escribe por qué ni cómo se arregla. Si hacen falta más de cinco, no es una ronda de corrección: es la versión siguiente, y entonces manda el paso 12.

La de la v3-corr, como plantilla de lo que es una ronda bien escrita:

> Motivo: línea clara entre el mar y la piedra (torre, base y espigón).
> 1. Máscara dura y erodida.
> 2. El vídeo abajo, la piedra arriba.
> 3. Alineación.
> 4. Tono.
> 5. Nueve recortes a 2× y la anchura del halo medida sobre ellos.

Cada cambio se cierra con **su número** (0 px de halo, ΔE 0,93/2,07, 0 px de desplazamiento). Un cambio sin número no está cerrado: está hecho.

**Se mide al acabar:** las mismas puertas del paso 10, y el número propio de cada uno de los cinco cambios.
**Para en:** publicado, y a la puntuación.

---

# Paso 12 · La puntuación de Zyad

| | |
|---|---|
| **Quién** | Zyad, con el vídeo del gesto delante |
| **Minutos reales** | 10 |
| **Entrada** | La página publicada y `_capturas/gesto-<versión>-escritorio-1440.mp4` |
| **Salida** | Tres notas y una decisión |
| **Herramienta** | el ratón y el móvil |

**Las tres preguntas, y no cambian entre versiones** — `LITERAL`, de la entrega de la v2:

> Baja hasta el pie despacio, sube despacio, y puntúa de 0 a 10 con una frase por cada una:
> 1. **¿Olas naturales?**
> 2. **¿El scroll manda?**
> 3. **¿El faro acompaña toda la página?**

**Las reglas:**

- **Meta ≥ 8,5.**
- **El criterio más bajo marca el nivel.** No se promedia. Un 9 / 9 / 7 es un 7: la pieza tiene tres trabajos y falla uno.
- Entre **7,5 y 8,5**: una ronda de cinco cambios dictada por Zyad (paso 11) y se cierra.
- Por debajo de **7,5**: se anota qué falla y se decide si es **de técnica o de imagen**. Si es de imagen, la salida no es apretar la técnica: es volver al paso 2 o al 3.
- 🔴 **No hay v(n+1) sin el procedimiento de v(n) escrito y leído entero.** La versión siguiente sale del procedimiento, no del ensayo.
- Se puntúa **mirando el gesto**, no los números. El vídeo se graba en tiempo real con el grabador de Playwright: una captura fotograma a fotograma con el reloj parado no puede parar un bucle que se reproduce solo, y lo dejaría acelerado.

**El histórico:** la v1 sacó **6,7** con las tres quejas que gobernaron todo lo demás — «las olas no son naturales», «el scroll no manda», «el efecto se acaba en la tercera pantalla». La v2.4 fue «mejora, pero falta mucho». La v3 y la v3-corr están publicadas **a la espera de puntuación**.

**Se mide al acabar:** tres números.
**Para en:** la decisión escrita en las notas.

---

# Paso 13 · Lo que se guarda

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 20 |
| **Entrada** | Todo lo anterior |
| **Salida** | Tres archivos del sistema actualizados |
| **Herramienta** | ninguna |

Pase lo que pase con la pieza. **Los errores se guardan igual que los aciertos y valen más:** la capacidad la copia cualquiera, la regla que evita repetir el error no.

| Qué | Dónde | Qué tiene que decir |
|---|---|---|
| **La receta** | `Biblioteca-Referencias/Web/Recetas/pieza-firma-bucles.md` | Dos bucles reales en lienzo 2D con la mezcla por scroll: el orden de pintado, el xfade y su verificación de costura, la máscara erodida con pluma solo en el horizonte, el ΔE del borde, los pesos. Convive con `pieza-firma-shader.md`, que sigue siendo la receta del estado de calma sintético; **no lo sustituye, lo continúa** |
| **El gesto** | `Biblioteca-Referencias/Web/Gestos/mar-que-se-encrespa-con-el-scroll.md` | Qué se siente y dónde falla: la mezcla continua entre dos estados, el lerp 0,06, que parar no congela nada porque los bucles siguen vivos, y el móvil con un bucle y velo. Sustituye en la práctica a `mar-que-sube-con-el-scroll.md`, que es el gesto de la v1 (el shader con el puntero) y se conserva |
| **La regla de elección** | `Biblioteca-Referencias/Web/Recetas/hero-video-spec.md` §13 | La sección pasa de **«cuándo vídeo y cuándo shader»** a **«cuándo vídeo, cuándo bucle, cuándo shader»**, con la fila nueva: **bucle** cuando lo que se mueve es una superficie con textura que un shader no inventa, y lo que hace falta del usuario es **intensidad, no posición**. Vídeo → forma que cambia. Shader → superficie con control de posición. Bucle → superficie con control de intensidad, que es lo que un `<video>` sí puede dar a 60 fps y en 116 KB |

Y la línea que cierra la sección 13, medida en B16: **ligar un vídeo a la posición del scroll cuesta +252 KB de keyframes y no llega a pantalla** (paso 10 del anexo). Ligarlo a la **intensidad** no cuesta nada: los bucles se reproducen solos y el scroll solo mueve un `globalAlpha`.

**Se mide al acabar:** que `PROCEDIMIENTO-N3.md` paso 11 apunte a este archivo.
**Para en:** los tres archivos escritos.

---

# Paso 14 · Tiempos reales y coste

| | |
|---|---|
| **Quién** | Opus |
| **Minutos reales** | 15 |
| **Entrada** | Los commits y las marcas de tiempo de los archivos |
| **Salida** | La tabla de abajo |

> **Qué son estos minutos.** Los cronómetros por paso **no se registraron en B15-B17**. La tabla es la **ventana entre entregas**: del commit o la captura anterior al commit o la captura de esa versión, en el repositorio `Marketing Digital`. Es tiempo de reloj, no de trabajo puro — pero es lo que hay que presupuestar, porque incluye los atascos del banco, que son la mitad del gasto real.

| Versión | Quién | Ventana real | Reloj | Qué pasó dentro |
|---|---|---|---|---|
| **Preparación** (dirección de arte, texturas, máscaras, el hueco del canvas) | **Opus 5** | 4-sep 00:14 → 00:59 | **45 min** | Pasos 1, 2 y 6. Un fallo propio corregido: la máscara se comía la espuma en la 3:4 |
| **v1** · shader WebGL2, control por puntero | **Fable 5.1 High** | 4-sep 00:59 → 01:26 | **~27 min** de escritura de archivos; la sesión entera no está cronometrada | Dos atascos, los dos vistos **mirando**, no midiendo: el agua cortada contra la piedra y los bloques derretidos del espigón en móvil. **Zyad: 6,7** |
| **v2 · sección 1** · la página entera sobre la escena | **Opus 5** | 4-sep 01:54 → **18:15** | sesión larga | Columnas, reservas, `contraste-sobre-escena.py` nuevo (los medidores heredados no podían medir texto sobre lienzo) |
| **v2 · sección 2** · tormenta en el shader | **Fable 5.1 High** | 4-sep 18:15 → **19:01** | **46 min** | Se descubrió que el vídeo de Canva era una foto. Se rehízo la tormenta entera en el shader |
| **v2.1** · olas reales de Kling | **Fable 5.1 High** | 4-sep 19:01 → **20:13** | **72 min** | Dos atascos de banco: `texSubImage2D` que mataba el rAF sin ruido, y los clips de Kling con un solo keyframe |
| **v2.2** · la tormenta en scrub | **Fable 5.1 High** | 4-sep 20:13 → **23:13** | **180 min** | El banco dio 1-2,6 fps por ventana ocluida; y el primer medidor de retardo daba medianas imposibles de 6 ms |
| **v2.3** · el scroll manda desde el primer píxel | **Fable 5.1 High** | 4-sep 23:13 → **23:35** | **22 min** | Sin atascos. La corrección más barata de toda la serie |
| **v2.4** · cadena de dos clips en scrub | **Fable 5.1 High** | 6-sep, cierre el 7-sep 00:03-00:15 | sesión no cronometrada | Los webm entregados buscaban en 17-57 ms: hubo que recodificarlos con libvpx `-g 6 row-mt` para bajar a 4-9 ms |
| **Traspaso + diagnóstico** | **Opus 5** | 10-sep 00:01 → **00:38** | **37 min** | Tres hipótesis medidas contra la URL publicada, sin tocar un archivo. Mató el scrub |
| **v3** · dos bucles reales, sin scrub | **Fable 5.1 High** | 10-sep 00:38 → **01:22** | **44 min** | Pasos 4, 5, 9 y 10 completos. El banco de fps quedó sin veredicto |
| **v3-corr** · la línea entre el mar y la piedra | **Fable 5.1 High** | 11-sep 13:38 → **13:49** | **11 min** | Cinco cambios numerados (pasos 6, 7, 9) |

### Lo que se presupuesta

| | |
|---|---|
| **Opus, total** | **~2 h de reloj** repartidas en tres entradas (preparación, sección 1, diagnóstico) + la sección 1, que es la más larga |
| **Fable, total** | **~6 h de reloj** en ocho entregas |
| **Sesiones de Fable** | **Ocho entregas marcadas `[FABLE 5.1 · High]`.** Cuántas sesiones distintas fueron **no está registrado**; las cuatro del 4-sep por la tarde (v2 §2, v2.1, v2.2, v2.3, entre las 18:15 y las 23:35) pudieron ser una o dos. **Para presupuestar, cuéntalas como entregas y reserva 4-6 sesiones de Fable** para una pieza completa con dos correcciones |
| **Créditos de imagen** | 6 de la bolsa de 50 de Canva Pro (tres candidatas × dos formatos) |
| **Créditos de vídeo** | Kling: 66/día gratis, ~40 por clip de 5 s a 1080p → **dos clips al día**, y la regla de dos intentos por estado es aritmética, no prudencia |
| **Lo que costó de verdad** | De las ~8 h de reloj, **tres se fueron en el banco de pruebas** (ventana ocluida, techo de refresco, emulación móvil, dos medidores que mintieron) y no en la pieza. Un presupuesto que no reserve un tercio para instrumentación se queda corto |

### El presupuesto de la siguiente, con este procedimiento delante

| Paso | Quién | Presupuesto |
|---|---|---|
| 0 · Brief y regla | Zyad | 20 min |
| 1 · Dirección de arte | Opus | 30 min |
| 2 · Imagen | Zyad | 20 min |
| 3 · Clips (2 estados) | Zyad | 40 min + espera de render |
| 4 · Bucle sin costura | Sonnet | 15 min |
| 5 · Compresión | Sonnet | 10 min |
| 6 · Máscara | Opus | 40 min |
| 7 · Tono | Opus | 25 min |
| 8 · Hueco en la página | Opus | 2 h |
| 9 · Construcción | **Fable** | **1 sesión** |
| 10 · Medición | Opus | 1 h (30 min si el banco ya está calibrado) |
| 11 · Ronda de corrección | Fable | 30 min |
| 12 · Puntuación | Zyad | 10 min |
| 13 · Lo que se guarda | Opus | 20 min |
| 14 · Tiempos | Opus | 15 min |
| | | **~7 h de reloj · 1-2 sesiones de Fable · 6 créditos de imagen · 2 clips** |

Sin este procedimiento costó **ocho entregas de Fable y cuatro versiones desechadas**. La diferencia entera son los cuatro callejones del anexo.

---

# ANEXO · Callejones sin salida

Cuatro. Cada uno con el número que lo cerró. **No se vuelven a abrir sin un número mejor que ése.**

### 1 · Scrub por scroll — ligar `currentTime` a la posición del scroll

Se probó en la v2.2, v2.3 y v2.4: el scroll fija el fotograma del clip, la ola sube y baja con la rueda. Se siente perfecto en teoría y en pantalla se congela.
**Lo cerró:** la búsqueda termina en 2,6-4,2 ms, pero de ahí al fotograma pintado pasan **315 ms de mediana y hasta 2.622 ms**; de los 242 fotogramas de la cadena, una bajada lenta enseña **25**, y se piden **199 búsquedas para que aparezcan esos 25**. El vídeo tiene el fotograma que la pantalla no muestra durante el **55-60 % de la bajada**. No es la red (búfer 100 % en las 27 búsquedas muestreadas) ni la CPU (con ×4 los huecos son iguales).
**Lo que se hace en su lugar:** dos bucles que se reproducen solos y un `globalAlpha` gobernado por el scroll. El scroll manda la **intensidad**, no la **posición**.

### 2 · Pluma de 24 px en todo el borde de la máscara

La pluma que suaviza el horizonte, aplicada también junto a la piedra, para que el borde no se vea duro.
**Lo cerró:** en la franja de pluma conviven **el mar fijo de la foto y el mar en movimiento del vídeo** — dos mares en la misma banda, y el ojo lee una línea. Erosionar 6 px hacia la superficie y dejar la pluma **solo en la banda de 24 px centrada en el horizonte** (y = 481) bajó el mar del **34,9 % al 33,2 %** del cuadro y el halo a **0 px en los nueve recortes** (techo 2). Antes de eso, el halo medido daba 1-4,5 px.
**Lo que se hace en su lugar:** máscara dura erodida + el recorte del objeto pintado **encima** del vídeo, para que cualquier resto funda piedra → vídeo y nunca mar fijo + mar móvil.

### 3 · Canva como fuente de vídeo

`hero-1280.webm`, 5 s, «el mar rompiendo contra la base». La v2 entera se diseñó alrededor de mezclar la foto con ese clip.
**Lo cerró:** dentro de la máscara, la desviación temporal por píxel es de **0,35/255 de mediana** (p99 0,72) y la diferencia máxima con el fotograma 0 en todo el clip, **0,56/255**. Un mar moviéndose da **entre 10 y 40**. El fotograma 0 y el 133, 4,4 s después, son la misma ola congelada. Lo mismo el `.mp4`, el máster de 1920 y la copia con keyframes.
**Lo que se hace en su lugar:** Kling image-to-video, y **se mide la desviación temporal antes de construir nada encima**. Por debajo de 2/255 no es un vídeo: es una foto que pesa como un vídeo.

### 4 · Creerse el banco de fps

Tres tandas seguidas dieron números que parecían buenos y no lo eran.
**Lo cerró:** una **página vacía** da **30,4 fps** con CPU ×1 y sin banderas, y **57,2 fps** con `--disable-frame-rate-limit --disable-gpu-vsync` en dos pasadas de tres (114 en la tercera). Con un techo de 30 o 57 Hz, «la pieza da 59» mide el banco, no la pieza. Y con la ventana ocluida, **1-2,6 fps con fotogramas de 1.016 ms**; con emulación móvil y ventana, fotogramas de 86 s e INP de 99 s.
**Lo que se hace en su lugar:** calibrar contra `about:blank` antes de cada tanda y exigir **> 100 fps**; si no, la puerta se declara **sin veredicto** (no «pasa») y el veredicto se busca en un Android real por `adb` + Chrome remoto. `bring_to_front()` tras el `goto`, un banco con ventana a la vez, y el móvil sin ventana.

---

## La comprobación final, antes de decir que está

- ⬜ Las siete puertas del paso 0, medidas, con **«sin veredicto» escrito donde el banco no valga**
- ⬜ Costura de cada bucle ≤ 3 %, y el número escrito
- ⬜ ΔE del borde ≤ 3 en los dos estados
- ⬜ Halo 0-2 px en los nueve recortes, con el medidor probado contra una línea de 1, 2 y 3 px
- ⬜ Fotogramas únicos por segundo entre 24 y 30 con la página **parada**
- ⬜ Contraste AA con la intensidad al máximo, con el peor caso **fabricado y congelado**
- ⬜ Vídeo del gesto grabado **en tiempo real**, no fotograma a fotograma
- ⬜ Las tres preguntas del paso 12 contestadas, y el criterio más bajo escrito como nota
- ⬜ Receta, gesto y `hero-video-spec.md` §13 actualizados
- ⬜ Nada interno publicado: ni `.md` de trabajo, ni carpetas `_`, ni capturas, ni bancos
