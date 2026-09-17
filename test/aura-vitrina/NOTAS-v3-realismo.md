# Vitrina de Aura · v3 — la corrección de realismo

**Sesión 3 · 18-sep-2026 · `noindex` · publicada en
https://faro-digital.pages.dev/test/aura-vitrina/**

Notas de Zyad a la v2: **movimiento 8 · selección 8 · diseño 6,5.**
Y la frase que dirigió toda la sesión:

> *«faltan detalles como el líquido que se va moviendo cuando mueves el frasco,
> esto no es realista»*

Tenía razón, y era el fallo más caro de los tres — porque no es un ajuste mal
puesto, es **una mentira física**: un líquido cuya superficie se inclina con el
envase no es un líquido, es un sólido pintado del color del líquido. El ojo lo
caza sin saber qué caza, y deja bajo sospecha todo lo demás.

`portfolio/caso-2-ecommerce-aura.html` sigue **sin tocar**.

---

## 0 · La otra respuesta de Zyad, que también contaba

**«¿Cuál parece más caro?» → ALBA.** Es el producto de 48 €, el que la tienda
quiere vender. **La vitrina cuenta bien el precio**, y eso no había que
arreglarlo. No se vuelve a preguntar.

---

## 1 · El líquido se queda nivelado

**Lo que se hizo.** La superficie del líquido ya no es geometría: es un **plano
de mundo**. La malla llega hasta el borde del frasco y el vertex shader aplasta
contra el plano todo lo que sobresale.

**Tres decisiones que no son evidentes:**

**No se recorta con `clippingPlanes`.** Recortar deja la malla abierta y hay que
taparla con stencil — y three.js dibuja la pasada de `transmission` contra un
objetivo **sin buffer de stencil**. La tapa existiría mirando el líquido de
frente y desaparecería justo **al mirarlo a través del vidrio**, que es como se
mira siempre. Aplastar en el vértice no tiene ese problema: la malla sigue
cerrada, así que vale igual en la pasada de transmisión, en el mapa de sombras
y en cualquier pasada futura.

**El plano pasa por el punto del eje a la altura del nivel**, no a una altura
fija. Para un cilindro inclinado, el volumen bajo un plano horizontal que pasa
por ese punto es exactamente πr²h **se incline lo que se incline**: el frasco no
gana ni pierde producto al girarlo. Es la diferencia entre un truco y física.

**La inercia no se anima: se equilibra.** Cada fotograma el normal recibe parte
del giro del frasco —el arrastre— y se le tira hacia la vertical con el
`lerp 0,05` del encargo. Eso es chapoteo. Una animación con duración sería un
gesto, y se notaría.

| Control negativo | |
|---|---|
| **Pico 184/255**, 1,6 % de la imagen, frasco inclinado 40° | `Renders/aura-s3/CONTROL-liquido.png` |

Y el tope: el chapoteo no pasa de **12°**. Más que eso deja de leerse como
inercia y se lee como un fallo.

---

## 2 · El entorno es una habitación de verdad

| | |
|---|---|
| **Brown Photostudio 02** · Sergej Majboroda · **CC0** | https://polyhaven.com/a/brown_photostudio_02 |
| Original 1k | 1.610 KB · 1024×512 |
| Publicado | `entorno.png` · 384×192 · **179 KB** |
| Rango conservado | máximo **76,8** decodificado contra 76,74 escrito — **0,08 %** |

**No se sirve el `.hdr`**: 1.610 KB para una sección cuyo presupuesto entero son
1.400. Se remuestrea **en lineal** —promediar en sRGB apagaría las ventanas— y
se guarda como **PNG con codificación RGBE**. PNG y no JPEG porque **el alfa es
un exponente**: un bit mal ahí multiplica o divide el píxel por dos, y JPEG es
con pérdida justo donde no cabe ninguna.

El decodificador **comprueba el máximo contra el JSON**. Un decodificador de
exponentes equivocado en el signo o el sesgo devuelve una imagen que *se ve*
bien y sin un solo valor por encima de 1 — y el vidrio saldría de plástico sin
que nadie supiera por qué ([[L-0065]], [[L-0067]]).

| Control negativo | |
|---|---|
| **Pico 204/255**, 13,3 % de la imagen | `Renders/aura-s3/CONTROL-entorno.png` |

🔵 **El papel NO usa el HDRI.** Con la habitación real como entorno de escena, el
papel empezó a recoger la estructura de su suelo y la costura con la página se
abrió de 1/255 a 11/255 — la caja. El fondo y el producto no hacen el mismo
trabajo: el producto refleja la habitación, el fondo tiene que casar con la
página al píxel. El papel se queda con el entorno procedural, que es liso por
construcción.

---

## 3 · Imperfecciones

| Qué | Dónde | Valor |
|---|---|---|
| Ruido de rugosidad, vidrio | base + **barniz** | 0,02-0,075 · barniz 0,055-0,165 |
| Ruido de rugosidad, tapón | base | 0,40-0,68 |
| `dispersion` | vidrio | **1,6** — r185 sí la trae, comprobado |
| Grano | sobre el lienzo | **1,5 %** (3,8/255) |

**El ruido va en el shader, no en una textura**, y hay una razón medida:
**ninguno de los tres modelos trae UV** — sus primitivas solo tienen POSITION y
NORMAL. Un `roughnessMap` sin UV no pinta nada, y generar UV cilíndricas mete
una costura vertical justo en el canto del frasco, que es donde más se mira. Un
ruido de posición no tiene costura porque no tiene parametrización. Y no pesa.

🔴 **Dos cosas que el control negativo cazó y que se habrían publicado como
ciertas:**

1. **La escala del ruido era 22 sobre centímetros**, o sea celdas de **0,45 mm**
   — más pequeñas que un píxel. Eso no es textura: es aliasing, y aliasing
   promediado es una constante. Pico **6/255**. Con escala 1,4-2,6: pico **45**.
2. **En el vidrio había que tocar el BARNIZ.** Con `clearcoat: 1` y
   `transmission: 1`, lo que se ve es el especular del barniz; perturbar la base
   no cambia un píxel.

| Controles | pico | superficie | criterio |
|---|---:|---:|---|
| ruido | 45/255 | 0,36 % | pico ≥ 12 · 0,3 % |
| grano | 4/255 | 2,4 % | pico ≥ 3 · 1,5 % |

🔵 **Cada control con su criterio, y esto no es una concesión.** Los cuatro se
juzgaban con la misma regla y el grano suspendía con pico 4 — pero 4 sobre 255
**es** el 1,5 % pedido. Una sombra cambia mucho en poca superficie; un grano
cambia poco en casi toda. Una sola regla mide bien una forma y difama la otra.

---

## 4 · ROCÍO sale de la familia

El encargo decía: sustituirlo por otro modelo CC BY del mismo autor con silueta
de **vidrio**; si no lo hay, dejar dos productos antes que uno de plástico.

**Se miraron los 16 frascos CC BY descargables de Iron_bound, uno a uno**
(`Renders/aura-s3/CANDIDATOS-rocio.png`). **Los dieciséis son dispensadores con
bomba o vaporizador.** El único de la serie con silueta de vidrio es el que ya
usa VELO, porque es el único con tapa de rosca lisa.

### Hay recambio, está identificado, y necesita a Zyad

> **Protein Supplement Jar** · Iron_bound · CC BY 4.0 · 60.800 caras
> https://sketchfab.com/3d-models/protein-supplement-jar-252a7ae0ee194f03a0e545f0c44d0d0a

Un **tarro ancho con tapa de rosca**: la silueta de un bálsamo en vidrio. Y
encaja con el caso vivo de Aura, cuyo tercer producto es exactamente **«Bálsamo
limpiador · 75 ml»**. La API de Sketchfab devuelve **401** sin credenciales, así
que el archivo tiene que bajarlo él. Con el `.glb` en `_crudo/`, recuperar el
tercer producto es mover un bloque en `familia.json` y correr `preparar.mjs`.

### Alturas

| | VELO | ALBA | ratio |
|---|---:|---:|---:|
| Alto | 9,12 cm | 10,90 cm | **1,195** |

Tope **1,4×**, comprobado en la tubería. En la v2 ROCÍO salía a 16,11 contra
9,12 —**1,77×**— porque la altura se derivaba del volumen. **Los ml ya no mandan
sobre la fila.**

---

## 5 · Las puertas, con su valor real

Chrome instalado, ventana al frente, GPU comprobada. Móvil sin ventana.

| Puerta | Meta | Real | |
|---|---|---|---|
| Peso de la sección (gzip) | ≤ 1.400 KB | **586,8 KB** | ✅ |
| … y en disco | informativo | 1.431,8 KB | |
| LCP | ≤ 2.500 ms | **372 ms** | ✅ |
| fps CPU ×4 · reposo (mediana de 3) | ≥ 55 | **60,1** [60,0-60,1] | ✅ |
| fps CPU ×4 · girando | ≥ 55 | **60,1** | ✅ |
| INP tocando y girando | ≤ 200 ms | **48 ms** | ✅ |
| Móvil · scroll vertical sobre el lienzo | se mueve | 0 → 700 px | ✅ |
| Móvil · scroll **durante** un giro | se mueve | 0 → 520 px | ✅ |
| Móvil · `touch-action` | `pan-y` | `pan-y` | ✅ |
| Azimut libre | sin límite | 457° | ✅ |
| Polar, topes | 15° / 100° | **15,0 / 100,0** | ✅ |
| Vuelve a reposo a los 3 s | sí | 0° | ✅ |
| Solo gira el elegido | sí | sí | ✅ |
| Táctil vertical / fuera / dos dedos | NO gira | 0 · 0 · 0 | ✅ |
| *control +*: táctil horizontal sí gira | > 0 | 4,0 | ✅ |
| **CAJA · salto al cruzar el canto** | ≤ 2/255 | **2/255** (160 pares) | ✅ |
| sensor: costura del framebuffer | ≤ 3/255 | 2/255 | ✅ |
| Papel medido en el lienzo | `#F5EFE4` | `#F4EFE5` (0,8/255) | ✅ |
| Emisiva del papel | ≤ 0,05 | **0** | ✅ |
| Cada modelo comprimido | ≤ 60 KB | 47,4 · 33,1 | ✅ |
| Alturas | ≤ 1,4× | **1,195×** | ✅ |
| **Android real (adb)** | scroll nunca bloqueado | **SIN MEDIR** | 🔴 |

🔴 **`adb` ya está instalado** (platform-tools 37.0.1) y `android.py` está
escrito. **Falta el móvil**: no hay ninguno conectado. Enchufarlo por USB, dar
depuración USB y correr `python android.py`. Es la única puerta abierta, y sigue
sin darse por buena con la emulación: comparte el motor, no el compositor ni la
gestión de gestos, que es justo lo que esta pieza pone a prueba.

### Dónde se va el peso

| | gzip |
|---|---:|
| `entorno.png` (el HDRI) | **179,4 KB** |
| three.js (core + module) | 183,1 KB |
| decodificador Draco | 76,3 KB |
| 2 modelos | 74,9 KB |
| GLTFLoader | 13,4 KB |
| JS propio + JSON + póster | ~60 KB |

**El HDRI es ahora la pieza más cara de la sección.** Cabe de sobra, y a cambio
el vidrio refleja una habitación. Si algún día aprieta, bajar a 256×128 cuesta
84 KB en vez de 179.

---

## 6 · La puerta de peso se mudó a la tubería

En la v2, el control negativo demostró que **la puerta de peso no servía**: los
modelos sin comprimir pasaban las tres puertas igual que los comprimidos. Lo que
protegía el peso no era la puerta, era la tubería.

Ahora `preparar.mjs` **para el build** si un modelo pasa de **60 KB** comprimido
o si las alturas se salen de 1,4×. Probado en las dos direcciones, y el código
de salida leído **sin tubería** ([[L-0034]]):

```
tope 20 KB (control negativo) -> exit 1, y nombra los dos modelos
tope 60 KB (el real)          -> exit 0
```

---

## 7 · Lo que NO está resuelto

1. **La puerta de Android**, por falta de móvil. Es la única.
2. **Dos productos, no tres**, hasta que Zyad baje el tarro.
3. **three.js entero, 183 KB gzip.** Un build a medida ahorraría cerca de la
   mitad — y ahora que el HDRI pesa 179, empieza a tener sentido. Sigue sin ser
   urgente: 587 de 1.400.
4. **La cáustica sigue siendo falsa**, heredada de la sesión 1.
5. **La caché del borde de Cloudflare** puede servir a un visitante normal un
   archivo viejo durante horas — se vio con `bruma.glb`, que respondía 200 con
   `Age: 4264` cuando ya no existía. Se arregla purgando la caché, no
   redesplegando. `verificar.py` lo detecta porque pregunta con rompe-caché.

---

## Qué hay de nuevo aquí

| Archivo | Qué es |
|---|---|
| `realismo.js` | nivelado del líquido, ruido de rugosidad, carga del HDRI |
| `realismo.py` | los cuatro controles con y sin, cada uno con su criterio |
| `hdri.html` + `hdri.py` | el `.hdr` de Poly Haven → `entorno.png` en RGBE |
| `android.py` | la puerta de Android real, lista para cuando haya móvil |
| `verificar.py` | lo publicado, con rompe-caché, y **lo que no debe estar** |
| `antes-despues.py` | captura la v2 **de producción** antes de pisarla |

---

## Puerta

Zyad vuelve a puntuar **movimiento, selección y diseño**, en escritorio y en su
móvil. El número que importa esta vez es **el de diseño**: venía de 6,5 y toda
la sesión ha ido a eso.
