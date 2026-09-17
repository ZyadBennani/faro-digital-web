# Vitrina de Aura · `/test/aura-vitrina/`

**Sesión 2 · 17/18-sep-2026 · `noindex` · publicado en
https://faro-digital.pages.dev/test/aura-vitrina/**

Tres frascos **reales** de Sketchfab, en un solo lienzo, sobre el papel de la
página. El elegido se acerca y gira en todas direcciones.

`portfolio/caso-2-ecommerce-aura.html` **no se ha tocado**.

---

## 1 · El material, y sus derechos

Zyad dejó **cinco** `.glb` en `Biblioteca-Referencias\Web\`. Están movidos a
`...\Web\Aura-3D\`, con `LICENCIAS.md` al lado. Los originales **no entran en
este repo**: al repo va solo la versión comprimida.

| Archivo | KB | Autor | Licencia | Destino |
|---|---:|---|---|---|
| `cosmetic_bottle_12.glb` | 2.276 | Iron_bound | **CC BY 4.0** | → **ALBA**, sérum |
| `cosmetic_bottle_3.glb` | 564 | Iron_bound | **CC BY 4.0** | → **VELO**, crema |
| `cosmetic_bottle_1.glb` | 165 | Iron_bound | **CC BY 4.0** | → **ROCÍO**, bruma |
| `free_3d_cosmetic_serum_bottle.glb` | 3.192 | B1Blender | CC BY 4.0 | descartado por pieza |
| `cosmetic_serum_bottle.glb` | 2.429 | NeeravRajput | 🔴 **SKETCHFAB Standard** | **descartado por derechos** |

### 🔴 Uno de los cinco no se podía usar

`cosmetic_serum_bottle.glb` —**el que se llama literalmente «serum bottle»**, el
candidato obvio para el producto estrella— no es CC BY ni CC0: es la licencia
estándar de Sketchfab, que **prohíbe redistribuir el modelo como archivo
suelto**. Y eso es exactamente lo que hace una web que sirve un `.glb`: el
archivo se descarga y se queda en el disco de quien visita la página. La
atribución no levanta esa prohibición.

Los datos no salen de la memoria de nadie: se leyeron de `asset.extras` dentro
de cada GLB, que es donde Sketchfab los escribe y donde siguen cuando ya nadie
recuerda de qué pestaña salió la descarga. El comando está en `LICENCIAS.md`.

**La CC BY obliga a nombrar al autor.** El crédito —*Frascos 3D: Iron_bound
(Sketchfab) · CC BY 4.0*— va en **la página de créditos de Aura, no en la
vitrina**: una vitrina de producto con una atribución encima deja de ser una
vitrina. Viaja además dentro de cada `.glb` publicado, en `asset.extras.credito`.

Lección [[L-0071]].

### El cuarto, descartado por pieza

`free_3d_cosmetic_serum_bottle.glb` está bien de derechos y fuera por tres
motivos, y bastaba el primero: **la silueta no se lee** (un cilindro alto sobre
un tarro achatado; no dice si es frasco o tapa), 112.364 triángulos, y usa
`KHR_materials_pbrSpecularGlossiness`, una extensión archivada que three.js ya
no trae. Se ve en `Renders/aura-s2/contacto-piezas.png`.

---

## 2 · La familia, y de dónde sale cada número

| | ALBA · sérum | VELO · crema | ROCÍO · bruma |
|---|---|---|---|
| Silueta | cuentagotas | hombro redondo | vaporizador con sobretapa |
| Volumen | 30 ml · 48 € | 50 ml · 39 € | 75 ml · 32 € |
| **Alto** | **10,90 cm** | **9,12 cm** | **16,11 cm** |
| Radio | 1,45 cm | 1,91 cm | 2,00 cm |
| Pared **medida** | 6,46 % | 8,34 % | 🔴 1,23 % → **decidida** en 5,5 % |
| Triángulos | 14.276 (de 82.432) | 10.998 (de 20.352) | 8.990 (de 4.988 + líquido) |
| Peso publicado | 46,2 KB (gz 43,4) | 32,6 KB (gz 29,7) | 24,6 KB (gz 20,4) |

**El reparto de papeles no es una heurística.** Qué malla es el vidrio y cuál el
tapón se leyó en una hoja de contacto con las piezas pintadas de colores planos
(`Renders/aura-s2/contacto-piezas.png`) y está escrito a mano en `familia.json`.
Un clasificador por nombre habría acertado a veces.

**La altura sale del volumen, no del gusto.** Se integra el perfil interior del
cuerpo, se multiplica por el nivel de llenado y se resuelve la escala que da los
ml declarados. Por eso ROCÍO es casi el doble de alto que VELO: es lo que mide
un frasco de 75 ml de esa silueta.

🔵 **ROCÍO es de 75 ml, no de 100.** Los 100 venían de la sesión 1; el caso vivo
de Aura dice 75 («Bálsamo limpiador · 75 ml») y el encargo lo repetía. **Manda lo
que ya ve el cliente.** Se ve en el ANTES del comparativo.

🔴 **La única cifra que no sale de una medida está dicha:** el cuerpo de ROCÍO es
de pared única —29 lados, y el `rmin` que devuelve la sonda es la faceta del
polígono, no un grosor: `cos(π/29) = 0,9941` da exactamente esos 0,1509 contra
0,1518—. Ahí el grosor se **decide** en 5,5 %, el que miden los otros dos.

---

## 3 · Lo que costó, y lo que enseñó

### El líquido no venía en ningún modelo

Los cinco son envases vacíos. El líquido se **tornea** del perfil interior
medido, y su radio es `min(exterior × (1 − pared), interior × 0,985)`: coge la
pared real donde la hay y el retranqueo donde el cuerpo es de pared única. Cada
anillo del torno toma el **mínimo** del tramo que resume — la media dejaría que
un anillo se comiera un estrechamiento y el líquido asomaría por la pared justo
donde el frasco se cierra, que es [[L-0069]] otra vez por remuestreo.

### Menos lleno, más vidrio

Con el frasco lleno hasta arriba de producto blanco no hay vidrio que ver: es un
sólido blanco. Lo que dice «esto es vidrio» es **el hueco de arriba**. Los
niveles bajaron a 0,70 / 0,62 / 0,68 y los tres cambiaron de material aparente
sin tocar un solo parámetro de material. Y no miente sobre los ml: el frasco
crece para seguir teniendo los mismos, que es lo que pasa con un envase con
cámara de aire.

### La etiqueta se lee contra el líquido, no contra el vidrio

ALBA salía **«AL»**. Se midió la geometría de la banda —arco, radio, ángulo de
partida— y estaba perfecta: de −61,2° a +61,2°, centrada en la cámara con 0,2°
de error. El problema era que la banda cae **entera dentro del ámbar**, y la
tinta era oscura. Ahora la tinta se decide con la luminancia del líquido ya
mezclado con el papel: claro sobre oscuro, oscuro sobre claro — que es lo que
hace un envase de verdad. Lección [[L-0076]].

### Avanzar hacia la cámara no es elevarse

El elegido avanzaba por el eje de la cámara y, como la cámara está 9° por encima
del horizonte, **subía**: se despegaba del papel y su sombra se quedaba abajo. Un
producto flotando sobre su propia sombra es exactamente lo que la sesión 1 quitó
de la vitrina vieja. Ahora avanza solo en +Z, sobre el plano.

### El bucle se podía quedar congelado para siempre

Dos observadores —pantalla y pestaña— escribían **la misma bandera**. Gana el
último: la pestaña se iba a segundo plano, ponía `false`, y al volver nadie lo
deshacía. Y lo peor es cómo falla: **una vitrina congelada se ve exactamente
igual que su propio póster de reserva**. Cada señal tiene ya su variable y el
bucle se rearranca desde cualquiera. `window.AURA_BUCLE()` dice en qué estado
está, y el banco lo comprueba. Lección [[L-0075]].

### Tres hipótesis contra un fantasma

La puerta de fps pasó de 60 a 41 y se declaró roja. Se probó que era el encuadre
(alejar la cámara un 19 %: **2 fps**, dentro del ruido), que era el relleno
(mitad de píxeles: **0,9 fps**) y que era el objetivo de transmisión (5 de 19).
No era ninguna: **eran las otras instancias de Chrome que el propio banco había
lanzado**. Ocho pasadas seguidas sobre la misma página dan de 37,1 a 47,7. El
banco mide ya la mediana de tres y publica la horquilla. Lección [[L-0073]].

---

## 4 · Las puertas, con su valor real

Chrome instalado, ventana al frente, GPU comprobada
(*ANGLE · AMD Radeon · D3D11*). Móvil **sin ventana** ([[L-0040]]).

| Puerta | Meta | Real | |
|---|---|---|---|
| Peso de la sección (gzip) | ≤ 1.400 KB | **417,8 KB** | ✅ |
| … y en disco | informativo | 1.242,7 KB | ✅ también |
| LCP | ≤ 2.500 ms | **244 ms** | ✅ |
| fps CPU ×4 · reposo (mediana de 3) | ≥ 55 | **60,1** [60,1–60,1] | ✅ |
| fps CPU ×4 · girando | ≥ 55 | **60,1** | ✅ |
| INP tocando y girando | ≤ 200 ms | **48 ms** | ✅ |
| Móvil · scroll vertical sobre el lienzo | se mueve | 0 → 700 px | ✅ |
| Móvil · scroll **durante** un giro | se mueve | 0 → 520 px | ✅ |
| Móvil · `touch-action` | `pan-y` | `pan-y` | ✅ |
| Azimut libre | sin límite | 457° | ✅ |
| Polar, topes | 15° / 100° | **15,0 / 100,0** | ✅ |
| Vuelve a reposo a los 3 s | sí | 0° | ✅ |
| Solo gira el elegido | sí | sí | ✅ |
| Táctil vertical sobre el frasco | NO gira | 0 | ✅ |
| Táctil horizontal fuera del frasco | NO gira | 0 | ✅ |
| Táctil a dos dedos | NO gira | 0 | ✅ |
| *control +*: táctil horizontal **sí** gira | > 0 | 4,0 | ✅ |
| Costura lienzo/página (12 bordes) | ≤ 2/255 | **1/255** | ✅ |
| Papel medido en el lienzo | `#F5EFE4` | **`#F5EFE4`** (0/255) | ✅ |
| Emisiva del papel | ≤ 0,05 | 0,012 | ✅ |
| Etiquetas con la fuente real | desvío < 8 % | 0,4 / 2,0 / 2,4 % | ✅ |
| **Android real (adb)** | scroll nunca bloqueado | **NO MEDIDO** | 🔴 |

🔴 **`adb` no está instalado en esta máquina.** Es la única puerta del §3 sin
medir, y no se da por buena: la emulación móvil de Chrome comparte el motor pero
no el compositor de Android ni su gestión de gestos, que es justo lo que esta
pieza pone a prueba. Para cerrarla hacen falta *Android Platform Tools* y un
móvil con depuración USB; el banco ya tiene el gesto escrito y solo hay que
apuntarlo al dispositivo.

### Desglose del peso (gzip, que es lo que viaja)

| | gzip | disco |
|---|---:|---:|
| three.js (core + module) | 183,1 KB | 733,4 KB |
| decodificador Draco (wasm + envoltorio + loader) | 76,3 KB | 257,4 KB |
| **3 modelos** | **93,5 KB** | 103,4 KB |
| GLTFLoader | 13,4 KB | 44,6 KB |
| `vitrina.js` + `estudio.js` + `familia.json` | 23,7 KB | 68,5 KB |
| `poster.jpg` | 26,6 KB | 27,3 KB |
| `index.html` | 4,0 KB | 13,2 KB |

**Draco gana, y se midió:** 93,5 KB + 76,3 de decodificador = **170 KB**, contra
**328 KB** del mismo modelo solo cuantizado sin decodificador. En disco Draco
gana de calle (104 contra 505), pero **comparar en disco decide por el número
equivocado**: los datos de Draco ya están comprimidos y no se encogen más,
mientras que un GLB cuantizado es casi todo enteros con patrón. Y el
decodificador se pesa entero y solo lo paga Draco.

**No hay ni una textura.** Los cinco modelos vienen sin ellas, y la etiqueta de
Aura se dibuja en ejecución desde un SVG con la tipografía de `base.css`. Así
que WebP y KTX2 no pintan nada aquí: cuestan cero bytes de descarga.

---

## 5 · Los controles negativos ([[L-0052]])

| Control | Qué debe pasar | Qué pasó |
|---|---|---|
| **Sin sombra de contacto** | verse peor | **pico 131/255**, el 1 % de la franja de apoyo cambia ≥ 6/255 → `CONTROL-sombra.png` |
| **Sin `touch-action`** | el scroll se bloquea | **se bloquea** ✅ la regla hace algo |
| **GLB sin comprimir** | el presupuesto falla | 🔴 **NO falla** — ver abajo |

🔴 **El tercer control no distingue, y eso es un hallazgo sobre la puerta.**
Los mismos tres modelos sin comprimir pesan 643,9 KB (gz 394,9) y **pasan las
tres puertas de peso**: 180–262 KB por modelo (meta 400), 644 KB los tres (meta
1.000) y 712 KB de sección en gzip (meta 1.400). Es decir: **la puerta de peso
del §3 no puede detectar modelos sin comprimir.** Lo que protege el peso aquí no
es la puerta, es la tubería. Una puerta que muerda de verdad para esta pieza
estaría en **≤ 60 KB por modelo** —Draco da 46/33/25 y sin comprimir falla
180/201/262—, y ese es el número que propongo para el catálogo.

El control de la sombra **también fue un aviso sobre el medidor**: la primera
versión promediaba el tercio bajo de la imagen entero y devolvía 0,4/255, o sea
«la sombra no hace nada». Promediar diluyó un efecto local 25 veces. Lección
[[L-0074]].

---

## 6 · Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | la página: composición aprobada en la sesión 1, con lienzo en vez de PNG |
| `vitrina.js` | escena, selección, giro libre, gestos, calibración del papel, costura |
| `estudio.js` | **el plató de la sesión 1**, extraído por rango de líneas de `frasco.js` |
| `familia.json` | los tres productos: papeles, volúmenes, niveles, etiquetas, materiales |
| `preparar.mjs` | `_crudo/*.glb` → `modelos/*.glb`: hornea, mide, tornea el líquido, escala, simplifica, comprime |
| `banco.py` | las puertas del §3, los controles negativos y las capturas |
| `poster.py` | la reserva estática, del mismo plató y con su cabecera JPEG comprobada |
| `hojas.py` | `ANTES-DESPUES.png` y `CONTROL-sombra.png` |
| `publicar.py` | copia al árbol vivo **la lista que el navegador pidió**, y verifica el destino |
| `contacto.py` / `contacto.html` | la hoja de contacto con la que se eligieron los tres |
| `parametros-materiales.json` | los materiales **aplicados**, volcados de la escena viva |
| `modelos/informe.json` | cada paso de la preparación, con sus números |

`estudio.js` **no se toca**: es lo que costó seis rondas y tres lecciones en la
sesión 1 ([[L-0066]] líquido opaco, [[L-0067]] estudio oscuro, [[L-0068]] dos
sombras). Se extrajo por rango de líneas —1-127, 185-611, 740-785— y no
reescribiendo, para que no pueda haber deriva. Lo único que se dejó fuera es el
frasco procedural, que aquí lo sustituyen los `.glb`.

### Cómo se corre

```bash
cd C:\Users\zyadb\Desktop\IA\faro-digital-web && python -m http.server 8777 --bind 127.0.0.1
```

```bash
cd C:\Users\zyadb\Desktop\IA\faro-digital-web\test\aura-vitrina && node preparar.mjs && python banco.py
```

`preparar.mjs` necesita `npm i` en esta carpeta (`node_modules/` está en
`.gitignore`: es herramienta, no pieza).

---

## 7 · Lo que NO está resuelto, dicho claro

1. **`adb` sin instalar**: la puerta de Android real sigue abierta. Es la única.
2. **ROCÍO no se lee como vidrio, y no es un fallo de material.** Se probó bajar
   la distancia de atenuación a 3,6 para que el tinte verde se leyera en los
   cuerpos anchos: metió un velo amarillo-verdoso en el hueco vacío y empeoró los
   tres. Revertido a los 8,5 calibrados. **Su silueta es la de un envase de
   plástico con vaporizador** —cilindro recto, bomba y funda— y ningún material
   arregla una forma. Si tiene que ser vidrio, hay que cambiar el modelo.
3. **ROCÍO es casi el doble de alto que VELO** (16,1 contra 9,1) porque los ml
   mandan. Es lo que se ve en una estantería real, pero desequilibra la fila. Si
   no gusta, se cambia `volumen_ml` en `familia.json` y la altura se recalcula
   sola: a 50 ml bajaría a 14,1 cm.
4. **three.js entero, 183 KB gzip.** Un build a medida —sin animación, sin
   loaders que no se usan, sin post-proceso— ahorraría cerca de la mitad. Estaba
   apuntado desde la sesión 1 y sigue sin hacerse: cabe de sobra en el
   presupuesto, así que no era urgente.
5. **La cáustica sigue siendo falsa**, heredada de la sesión 1: una textura
   radial con anillo. Tiene la forma correcta y está dentro de la sombra, pero no
   la calcula nadie.
6. **La reserva tiene un póster, no tres.** Sin WebGL2 la selección por fila
   sigue funcionando —enciende la fila, cambia el botón, anuncia el producto— pero
   la imagen no cambia. Tres pósters más costarían ~60 KB; se puede hacer si la
   reserva importa más de lo que parece.

---

## Puerta

Zyad puntúa **en escritorio y en su móvil**. Meta **≥ 8**.
Y una pregunta que no es de nota: **en reposo, ¿cuál parece más caro?** Si no es
ALBA —el de 48 €— la vitrina está contando mal el precio, por bien que gire.
