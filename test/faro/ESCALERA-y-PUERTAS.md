# `/test/faro` v2 · Sección 3 · Puertas y escalera · [OPUS 5]

**Fecha:** 04-sep-2026 · **Fila:** B16 · Medido sobre lo publicado en **https://faro-digital.pages.dev/test/faro/**, contra **https://faro-digital.pages.dev/test/faro-v1/**, y no sobre el archivo.

> **Con el Chrome instalado y su GPU, no con el navegador sin pantalla.** Un Chromium headless cae a SwiftShader y ejecuta el shader en la CPU: los fps de una página con WebGL medidos ahí no se pueden leer contra la puerta (`pintado.py` lo tiene escrito desde el 1-sep). El renderizador de todas las medidas de abajo es `ANGLE (AMD Radeon, Direct3D11)`.
>
> La escalera de la v1 —la que Zyad puntuó 6,7— se conserva entera en `test/faro-v1/ESCALERA-y-PUERTAS.md`. Esta la sustituye para la v2.

---

## 1 · Las puertas

| | v2 · 1440×900 | v2 · 390×844 | v1 · 1440×900 | Puerta N3 | |
|---|---|---|---|---|---|
| **Peso total recorrido** | **313,1 KB** | 348,8 KB | 456,7 KB | ≤ 1,2 MB | ✅ 26 % del techo |
| Peso de la primera pantalla | 235,6 KB | 226,7 KB | 213,5 KB | — | +22,0 KB sobre la v1 |
| **LCP** en 4G + CPU ×4 (mediana de 5 cargas, sin scroll) | **908 ms** | 864 ms | 852 ms | ≤ 2,5 s | ✅ sobra 1,6 s |
| Elemento del LCP | `SPAN.hero-reveal` | igual | igual | — | el H1, no la foto |
| **INP** con CPU ×4 (10 interacciones, umbral 16 ms) | **120 ms** | 88 ms | **120 ms** | < 200 ms | ✅ igual que la v1 |
| **CLS** | **0,0022** | 0,0000 | 0,0022 | < 0,1 | ✅ |
| **fps con el gesto, en los tres puntos**, CPU ×4 | **59,0 · 59,7 · 60,1** · 0 frames > 50 ms | — | — | 60 | ✅ |
| fps recorriendo la página entera, CPU ×4 (mediana de 3) | 56,6 | — | 55,7 | 60 | ⚠️ ver abajo |
| **Contraste con la tormenta al máximo** · 512 bloques × 3 anchos × 11 alturas | **0 fallos**, peor **6,83:1** | — | — | AA | ✅ ×1,5 de margen |
| … los 27 bloques del cierre y del pie | peor **9,07:1** | — | — | AA | ✅ |
| **Tamaños de letra distintos** | **5** | **5** | 5 | 5 | ✅ |
| Recursos de terceros | **0** | 0 | 0 | 0 | ✅ |
| Imágenes con `alt` y con dimensiones | 9 de 9 | 9 de 9 | 9 de 9 | todas | ✅ |
| Desbordamiento horizontal (320-1600 px) | igual que la v1 en los nueve anchos | | | 0 | ✅ |
| **La pieza** (`pieza.js` + textura + máscara) | **60,9 KB** | 52,0 KB | 52,3 KB | ≤ 400 | ✅ 15 % |
| Primer frame del shader | 0,1 ms | 0,1 ms | 0,1 ms | ≤ 80 ms | ✅ |

**Todas las puertas pasan.** La página pesa **un cuarto del techo** con el shader dibujando en todo el scroll, y **143,6 KB menos que la v1** en el recorrido completo: entra el código de la v2 (+22,0 KB entre CSS, JS y HTML) y se van los 165,6 KB del vídeo vertical del cierre, que ya no pinta nada.

### ⚠️ Los fps del recorrido completo: el número que hay que leer con cuidado

La primera pasada dio **v2 59,3 con un frame de 50 ms** y **v1 60,0 con ninguno**, y parecía una regresión de la v2. Con **tres pasadas de cada una, seguidas y en la misma máquina**, el resultado es otro:

| | pasada 1 | 2 | 3 | mediana | frames > 50 ms |
|---|---|---|---|---|---|
| v2 | 56,6 | 57,2 | 54,7 | **56,6** | 2 · 1 · 4 |
| v1 | 57,0 | 54,7 | 55,7 | **55,7** | 0 · 3 · 2 |

**Las dos están en el mismo sitio, y la varianza entre pasadas es mayor que la diferencia entre versiones.** Una sola pasada no distingue una regresión de la carga de la máquina — es la misma lección que `pintado.py` ya tenía escrita para las tareas largas. El número que sí es estable y comparable contra la puerta es el del gesto en los tres puntos, medido en un solo contexto y sin nada más corriendo: **59,0 / 59,7 / 60,1 con cero frames largos**.

---

## 2 · La escalera N — los doce criterios del sistema

> Criterios y umbrales de `FARO-WEB-SYSTEM-Referencias-y-Escalera-N3-N4-2026-09-02.md` §6, sin tocar. **Es la única escalera.** El prompt de la v2 no trae otra, que es como debe ser desde el paso 8 de `PROCEDIMIENTO-N3.md`.

Cada fila vale 0, 1 o 2. **N3 pide ≥ 20 y ninguna fila en 0.**

| # | Criterio | v1 | **v2** | Evidencia |
|:--:|---|:--:|:--:|---|
| 1 | Una idea y **un solo CTA** sobre el pliegue | 2 | **2** | Sin cambios: un solo CTA en los dos anchos |
| 2 | Disciplina tipográfica | 2 | **2** | Dos familias y **cinco tamaños**, contados por estilo computado tras recorrer la página entera, a 1440 y a 390. Las dos columnas no añadieron ni un tamaño |
| 3 | Un solo acento de color | 2 | **2** | Crema sobre verde. **El oro sigue existiendo solo dentro del shader**, en la linterna y su reflejo |
| 4 | **Ritmo y densidad** | **1** | **2** | 🟢 **La fila que la v2 venía a arreglar.** Ver abajo |
| 5 | Imágenes como contenido, bien servidas | 2 | **2** | 9 `<img>` reales, las 9 con `alt` y dimensiones. La miniatura de caso se limita a 480 px para no ampliarse en una columna de 539 |
| 6 | Movimiento con criterio | 2 | **2** | Cuatro gestos: la tormenta por scroll, el revelado en cascada, el desvanecido del hero y la respiración de la linterna. `reduced-motion` apaga la pieza y deja el poster fijo, sin descargar ni un byte de vídeo. **60 fps con CPU ×4 y GPU real.** ⚠️ El Android real sigue sin medir (mismo asterisco que la v1) |
| 7 | El contenido que vende está en el DOM | 2 | **2** | Todo el copy es texto, **idéntico palabra por palabra** al de la v1: 6.019 caracteres de texto visible, verificado comparando los dos árboles |
| 8 | Peso y terceros bajo presupuesto | 2 | **2** | 313 KB de 1.200 · cero terceros |
| 9 | **Mide lo que importa** | **0** | **0** | 🔴 La página no lleva `medicion.js` ni envía un evento. **A propósito: es una prueba con `noindex`** |
| 10 | Móvil de verdad | 2 | **2** | Verificado a 320, 360, 390, 430, 768, 900, 1024, 1440 y 1600: el desbordamiento es **el mismo que el de la v1 en los nueve anchos**, y por debajo de 1024 px la página es la v1 con el alto idéntico al píxel |
| 11 | Toda afirmación es verificable | 2 | **2** | Sin cambios: las cifras de cada caso salieron por script de su propia página |
| 12 | **Se encuentra** | **0** | **0** | 🔴 `noindex,nofollow`, sin canonical ni Open Graph. **A propósito** |
| | **Suma** | **19** | **20** | de 24 |

### Sube de 19 a 20, y la que sube es la única que era de calidad

> **No se declara N3, y por los dos mismos motivos que la v1:** N3 pide ≥ 20 **y ninguna fila en 0**, y las filas 9 y 12 están en 0 **porque esto es una prueba con `noindex`**, no porque la página esté mal hecha. Publicada de verdad, cerrarlas cuesta medio día y la deja en **24 de 24**.

**La fila 4 era la única baja por calidad, y la v2 se construyó para ella.** El veredicto de los dos jurados sobre la v1 fue *«una portada excelente y una página monótona: un solo fondo oscuro de principio a fin»*. Lo que cambió, medido:

- **El fondo ya no es un color.** De la sección 3 al pie, la v1 era verde `rgb(25 38 34)` plano; la v2 es el mar, y el mar **cambia solo**: la luminancia media de las cuatro pantallas de control (0 · 30 · 60 · 90 %) recorre **14,8 puntos en la v2 contra 8,5 en la v1**.
- **Ninguna pantalla vacía ni saturada**, que es lo que pide el criterio: `pantalla-muerta.py` a 1440 px con 12 pantallazos da **cero muertas** en las dos, y en la v2 la desviación típica por pantalla va de 20,1 a 79,3 —hero abierto, casos densos, precios y cierre medios— contra 18,0 a 67,7 en la v1.
- **La densidad alterna a propósito**: hero abierto → dos columnas densas con miniaturas → precios → cierre, con la cabecera de sección saltando de lado (Método izquierda, Trabajo derecha, Precios izquierda) y la reserva con ella.
- Las dos tiras de control están en `_capturas/v2/ritmo-v2.png` y `ritmo-v1.png`, una debajo de la otra.

**Y lo que queda dentro de esa fila, dicho sin maquillar:** de Método a Cierre las cuatro pantallas comparten **una sola composición** —dos columnas de texto con el faro en medio—. La variedad la pone hoy el agua, no la maqueta. Es un 2 por el criterio («ninguna pantalla vacía ni saturada») y sigue siendo el sitio por donde esta página se puede mejorar.

---

## 3 · El test de dos pestañas

Las dos publicadas, a 1440 px, en las mismas dos alturas, con seis fotogramas seguidos del agua a 1:1 en cada una, porque **«lee como agua» es una propiedad del movimiento y un fotograma no la enseña**. En `_capturas/v2/`: `dos-pestanas-arriba.png`, `dos-pestanas-hondo.png` y `dos-pestanas-agua.png`.

| Píxeles del agua que cambian en 0,6 s | arriba (scroll 0) | hondo (90 %) |
|---|---|---|
| v1 | **18,1 %** | **0,0 %** |
| v2 | **9,5 %** | **9,4 %** |

> ### La línea
>
> **La v2, y arriba gana moviéndose la mitad: la v1 sube y baja el 18 % del agua y se lee como una foto que alguien empuja; la v2 mueve el 9,5 % y se lee como mar en calma — y es la única de las dos que abajo sigue teniendo agua.**

Los tres números dicen las tres quejas de Zyad de un tirón: **más movimiento no era más agua** (queja 1), el 9,5 → 9,4 constante de la v2 es el scroll gobernando en toda la página (queja 2), y el **0,0 % de la v1 abajo** es exactamente *«el efecto se acaba en la tercera pantalla»* (queja 3).

---

## 4 · Lo que queda, y es solo de Zyad

Cinco minutos con el ratón, en https://faro-digital.pages.dev/test/faro/ · **baja despacio hasta el pie y sube despacio.** Y al lado, en otra pestaña, https://faro-digital.pages.dev/test/faro-v1/

Una frase y un número por cada una de las tres quejas de la v1:

```
1 · ¿Olas naturales?              [0-10]  ______   «                              »
2 · ¿El scroll manda?             [0-10]  ______   «                              »
3 · ¿El faro acompaña la página?  [0-10]  ______   «                              »

NOTA GLOBAL  [0-10] ______
```

- **≥ 8,5** → se cierra: se escribe la sección 4 del prompt (la receta v2, el gesto y el paso 11 de `PROCEDIMIENTO-N3.md`) y la pieza entra en el catálogo.
- **7,5 – 8,5** → una ronda de **cinco cambios dictados por Zyad**, y se cierra.
- **< 7,5** → se anota qué falla y se decide si es **de técnica o de imagen**. Y hay una respuesta ya preparada para el caso más probable: si lo que falta son olas de verdad, el camino no es apretar el shader sino **generar un clip que se mueva** desde `faro-16x9.png` — el hueco está marcado en `pieza.js` («AQUÍ IRÍA EL VÍDEO») con la transformación de UV ya medida.

**Lo que yo no puedo puntuar** es lo único que decide esto: si el mar de la v2 **se lee como agua con el ratón en la mano**. Los 512 bloques de contraste, los 60 fps y los 313 KB dicen que la página está bien construida; no dicen si la pieza emociona.

**Móvil:** no se ha tocado, como dice el prompt. Por debajo de 1024 px sigue sirviendo la v1 (foto + rizo + el scroll manda el nivel), verificado con el alto de página idéntico al píxel a 900, 768 y 390. Se decide cuando la de escritorio esté aprobada.
