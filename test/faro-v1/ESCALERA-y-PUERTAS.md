# `/test/faro-v1` · Sección 3 · Puertas y escalera · [OPUS 5]

> **Esta es la escalera de la V1 CONGELADA, la que Zyad puntuó 6,7** (fila B15). Se conserva como registro. Cuando se midió, la v1 vivía en `/test/faro/`; hoy vive en **https://faro-digital.pages.dev/test/faro-v1/** y esa URL es la v2. La escalera vigente de `/test/faro/` está en `test/faro/ESCALERA-y-PUERTAS.md`.

**Fecha:** 04-sep-2026 · Medido sobre lo publicado, no sobre el archivo. Medidores corregidos: INP con umbral 16 ms, LCP sin scroll (mediana de 5 cargas), contraste sobre los píxeles de la captura.

---

## 1 · Las puertas

| | 1440×900 | 390×844 | Puerta N3 | |
|---|---|---|---|---|
| Peso total recorrido | **457 KB** | **327 KB** | ≤ 1,2 MB | ✅ 38 % del techo |
| Peso de la primera pantalla | 214 KB | 205 KB | — | |
| LCP en 4G + CPU ×4 (mediana de 5) | **1,72 s** | **1,68 s** | ≤ 2,5 s | ✅ |
| INP con CPU ×4 | **40 ms** | **40 ms** | < 200 ms | ✅ |
| CLS | **0,0021** | **0** | < 0,1 | ✅ |
| fps recorriendo la página, CPU ×4 | **60,1** · 0 frames > 50 ms | **60,0** · 0 | 60 | ✅ |
| fps con el gesto de la pieza, CPU ×4 | **60,2** | **60,2** | 60 | ✅ |
| Contraste, 27 bloques del cierre y del pie | **0 fallos**, peor 4,61 | **0 fallos**, peor 5,29 | AA | ✅ |
| Tamaños de letra distintos | **5** | **5** | 5 | ✅ |
| Recursos de terceros | **0** | **0** | 0 | ✅ |
| Imágenes con `alt` y dimensiones | 9 de 9 | 9 de 9 | todas | ✅ |
| La pieza (shader + textura + máscara) | 52,3 KB | 43,4 KB | ≤ 300 KB | ✅ 17 % |

**Todas las puertas técnicas pasan, y ninguna raspando.** La página pesa un tercio del techo con un shader dentro, y el LCP sobra por 0,8 s.

---

## 2 · La escalera N — los doce criterios del sistema

> Los criterios y umbrales son los de `FARO-WEB-SYSTEM-Referencias-y-Escalera-N3-N4-2026-09-02.md` §6, los mismos con los que se puntuó la web del restaurante el 3-sep. **Es la única escalera**: el prompt de B15 traía otra lista y se ha retirado (apartado 3).

Cada fila vale 0, 1 o 2. **N3 pide ≥ 20 y ninguna fila en 0.**

| # | Criterio | Hoy | Evidencia |
|:--:|---|:--:|---|
| 1 | Una idea y **un solo CTA** sobre el pliegue | **2** | Un solo CTA en los dos anchos. A 390 hay tres elementos tocables sobre el pliegue: marca, «Pide tu Foto del Día 0 — gratis» y «Menú». A 1440, la marca, cuatro enlaces de navegación y el mismo CTA |
| 2 | Disciplina tipográfica | **2** | Dos familias (Frank Ruhl Libre, Work Sans) y **cinco tamaños** en la página entera, contados por estilo computado en los dos anchos |
| 3 | Un solo acento de color | **2** | Toda la página es crema sobre verde `rgb(25 38 34)`. **El oro solo existe dentro del shader**, en la linterna y su reflejo: no hay ni un acento de color en el HTML |
| 4 | Ritmo y densidad | **1** | 🔴 Es la fila débil, y no es nueva: los dos jurados del test archivado la señalaron. **Un solo fondo oscuro de principio a fin.** La pieza da variedad en la portada; de la sección 3 en adelante la página no cambia de tono |
| 5 | Imágenes como contenido, bien servidas | **2** | 9 `<img>` reales, **las 9 con `alt` y con dimensiones**; las seis miniaturas de casos con `loading="lazy"`. El poster del hero es la misma textura que dibuja el shader |
| 6 | Movimiento con criterio | **2** | Tres gestos: la pieza (puntero/scroll), el revelado en cascada y el desvanecido del hero. `reduced-motion` los apaga y sirve el vídeo de 5 s. **60 fps con CPU ×4**, peor frame 17 ms. ⚠️ **No es un Android real** (ver el aviso de abajo) |
| 7 | El contenido que vende está en el DOM | **2** | Todo el copy es texto: precios, método, casos y cifras. Un asistente de IA puede citarlos |
| 8 | Peso y terceros bajo presupuesto | **2** | 457 KB de un techo de 1.200 · **cero recursos de terceros** |
| 9 | **Mide lo que importa** | **0** | 🔴 **La página no mide nada.** No lleva `medicion.js` ni ningún envío de eventos |
| 10 | Móvil de verdad | **2** | Verificado a 320, 360, 390, 430, 768 y 900: sin desbordamiento, con navegación y con la oferta sobre el pliegue |
| 11 | Toda afirmación es verificable | **2** | Las tres cifras de cada caso se extrajeron **por script** de su propia página, y el copy es el de la home palabra por palabra |
| 12 | Se encuentra | **0** | 🔴 `noindex,nofollow`, sin canonical y sin Open Graph. **A propósito**, porque es una página de prueba |

### Suma: **19 de 24**, con dos filas en 0

> ## No es N3, y por dos motivos que no son de calidad
>
> N3 pide ≥ 20 **y ninguna fila en 0**. Las dos que están en 0 —medir y ser encontrable— **son 0 porque esto es un test con `noindex`**, no porque la página esté mal hecha. Son las dos cosas que una página publicada de verdad tiene y una muestra interna no necesita.
>
> **Lo honesto es decir las dos cosas a la vez:** por la escalera del sistema, `/test/faro` **no se declara N3**; y si mañana esta misma página se publicara como página real, cerrar las filas 9 y 12 cuesta **medio día** (el `medicion.js` que ya existe, más canonical, Open Graph y quitar el `noindex`), y quedaría en 21 con la fila 4 todavía en 1.
>
> La fila que sí es de calidad, y la única, es la **4 · ritmo y densidad**. Es exactamente lo que el jurado del test archivado dijo con otras palabras: *una portada excelente y una página monótona*. La pieza firma no arregla eso: lo hace más visible, porque ahora la portada es aún mejor y las seis pantallas siguientes siguen igual.

### ⚠️ El asterisco de la fila 6

Los 60 fps están medidos en **Chrome con emulación móvil y CPU ×4, pero con la GPU de este PC** (AMD Radeon integrada vía ANGLE). El shader hace cuatro muestras de ruido y tres lecturas de textura por píxel a 585×1266. **El 60 fps en un Android real no está medido y no hay dispositivo.** El contrato de escena se protege solo —DPR a 1,5, y si el primer frame pasa de 80 ms la pieza no arranca y queda el poster—, pero eso es una red, no una medida. Es lo primero que hay que comprobar con el móvil en la mano.

Es la misma limitación que ya se declaró en la escalera del restaurante el 3-sep, y la conclusión de entonces sigue valiendo: **la regla del sistema debería admitir explícitamente la aproximación validada**, en vez de dejar una fila que no se puede cerrar nunca.

---

## 3 · Una sola escalera

El prompt de B15 traía **su propia lista de doce criterios**, con otros nombres y escala de 1 a 10. Se rellenó y se ha quitado: dos escaleras dan dos veredictos que dicen lo mismo con números que no se pueden comparar entre proyectos. **Manda la del sistema**, que es la de arriba y la misma con la que se puntuó la web del restaurante el 3-sep.

Por si sirve el dato, las dos coincidían: por la lista del prompt el criterio más bajo era un 5, en «prueba» y «coherencia», por debajo del 7 que pedía. Las dos notas bajas eran la misma cosa dicha dos veces —**falta que alguien de fuera mire la pieza**— y es justo lo que queda pendiente.

La regla queda escrita en el paso 8 de `PROCEDIMIENTO-N3.md`: **si un prompt de trabajo trae su propia lista de doce criterios, no se usa.**

---

## 4 · El test de dos pestañas

Capturas a 1280 px de `/test/faro` y de la home real, una encima de otra: `_capturas/dos-pestanas.png`.

> **No parecen del mismo sitio.**

Comparten el titular, el eslogan y la oferta. **No comparten nada más:** la home tiene barra crema, píldora dorada, kicker «MARKETING DIGITAL» y una escena vectorial del faro sobre fondo casi negro; el test es oscuro de borde a borde, sin oro, con la navegación en una píldora translúcida y una fotografía a sangre. Puestas una debajo de otra parecen dos agencias.

**Eso no es un defecto del test: es el dato que estaba buscando.** El test se construyó para saber si esa dirección era mejor, y ya se sabe que gana en portada y pierde en la página. Lo que este test de dos pestañas añade es que **la distancia entre las dos no se cierra con retoques**: o la home v3 (fila B14) adopta el sistema editorial del test, o el test se queda como pieza de campaña y la home sigue su camino. Las dos cosas a la vez no.

---

## Lo que queda para Zyad

**Cinco segundos con el ratón y con el móvil, y «gusta» o «no».** Es lo único de esta sección que no puedo medir yo, y es lo que decide si la pieza entra en el catálogo o se archiva con lo aprendido.

Los dos vídeos del gesto están en `_capturas/gesto-escritorio-1440.mp4` y `_capturas/gesto-movil-390.mp4`, pero el gesto real se juzga con el dedo, no con un vídeo.
