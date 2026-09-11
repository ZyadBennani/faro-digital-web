# `/test/faro` v2.4 · Por qué «las olas desaparecen y vuelven a aparecer en segundos»

**Fecha:** 10-sep-2026 · **Medido contra** https://faro-digital.pages.dev/test/faro/ (v2.4 publicada), Chrome headful, DPR 1,5, desde Playwright/CDP. **Ningún archivo del repo se modificó**: todo es lectura. Crudo en `medidas-v2.4.json`.

| Hipótesis | Veredicto | El número que lo prueba |
|---|---|---|
| **H1 · Búfer parcial** | **Descartada** | Los tres `<video>` llegan a **100 % bufferizados 1,0-1,9 s después de `load`**, y en el instante de cada búsqueda el búfer es **100 % (mínimo y mediana)** en las 27 búsquedas muestreadas. Cero peticiones de red durante las pasadas: Cloudflare sirve los clips en **una respuesta 200 completa** (296.557 y 328.943 B), y devuelve el archivo entero **también con `Range: bytes=0-65535`**, así que no hay 206 ni trozos. |
| **H2 · Fallback durante el seek** | **Descartada** | El póster manda en **0 de 336 muestras de capa** (0 ms por pasada, tramo continuo 0 ms), en las tres pasadas y los tres perfiles. Póster y lienzo están **los dos a opacidad 1 siempre**: el lienzo es opaco y va delante, así que no hay cambio de capa que ver. |
| **H3 · Cuantización** | **Confirmada** | La cadena tiene 242 fotogramas y la bajada lenta enseña **25 (10,3 %)**; la rápida y el salto, **7 (2,9 %)**. Son **0,32 y 0,09 fotogramas únicos por cada 100 px de scroll**, con saltos de **8,5 fotogramas de media y hasta 116** entre uno visible y el siguiente. Los huecos sin fotograma nuevo miden **p50 100 ms, p95 766 ms y máximo 2.631 ms**, con 10 huecos por encima de 300 ms en una sola bajada. |

El agujero no lo abre la red ni el decodificador: lo abre la entrega a pantalla. La búsqueda en el vídeo termina en 2,6-4,2 ms de mediana y como mucho 207 ms, y el vídeo pasa solo 335 ms de 11.056 en estado de búsqueda, el 3 % del recorrido. Pero desde que el vídeo tiene el fotograma hasta que ese fotograma se sube a la textura pasan **315 ms de mediana y hasta 2.622 ms**. Durante el **55-60 % de la bajada el vídeo ya tiene un fotograma que la pantalla no está mostrando**, con desfases de hasta 118 fotogramas, casi cinco segundos de clip.

Se piden **199 búsquedas y solo 25 fotogramas llegan a verse**: ocho búsquedas por cada fotograma que aparece. El resultado en pantalla es el síntoma literal de Zyad: el mar se queda clavado en un fotograma, la ola que estaba subiendo se congela, y cuando por fin entra el siguiente ya ha avanzado medio clip, así que no continúa el movimiento sino que salta a otra forma. Con huecos de dos segundos y medio y saltos de tres a cinco segundos de clip, eso se lee exactamente como una ola que desaparece y vuelve.

Dos avisos sobre el alcance. **A 390 px no ocurre**, porque ahí la pieza es la v1 (`viva:m:v1`) y no descarga ningún clip: el síntoma es solo de escritorio, de 1024 px en adelante. Y **la CPU no lo causa**: con CPU ×4 los huecos son parecidos (p50 166 ms, máximo 870 ms) y el desfase vídeo-pantalla sube al 60 % del tiempo, igual que sin limitar.

## Las seis puertas

| Puerta | Medido | |
|---|---|---|
| Peso del recorrido, 1440 px (techo 1,2 MB) | **920,5 KB** (18 archivos; clips 611 KB) | **pasa** |
| Peso del recorrido, 390 px | **328,2 KB** (sin clips: la pieza es la v1) | **pasa** |
| LCP (≤ 2,5 s) | **680 ms** a 1440 px, 412 ms a 390 px, el titular del hero | **pasa** |
| INP | **72 ms** a 1440 px, 56 ms a 390 px | **pasa** |
| CLS | **0,0022** a 1440 px, 0 a 390 px | **pasa** |
| fps con CPU ×4 (60) | **no evaluable en esta máquina**: el banco topa a 30 Hz (una página vacía con CPU ×1 da 30,4 fps y 33,3 ms de fotograma). Con y sin pieza da lo mismo, 29,5 fps, y el peor fotograma es mejor con la pieza puesta (66,7 ms) que sin ella (100,2 ms) | **sin veredicto** |
| Contraste AA con la tormenta al máximo | 513 bloques, **un fallo: 1,53:1** en «Tres restaurantes excelentes…» a 1024 px, que es el subrayado del CTA de la cabecera fija sobre el titular, defecto heredado de la v1 y ya anotado; a 1440 y 1600 el mismo bloque da 11:1. El peor bloque real, **6,22:1** sobre 3,0 | **pasa salvo el defecto conocido** |
