# `/test/faro` · Sección 2 · La pieza · [FABLE 5.1 · High]

**Fecha:** 04-sep-2026 · **Fila:** B15 · **Estado: entregada y publicada** en https://faro-digital.pages.dev/test/faro/ · **parado en la entrega**, como dice el prompt.

Motivo: pieza firma del faro sobre la página del test. Techo 300 KB (texturas incluidas), 60 fps en Android de gama media, DPR ≤ 1,5.

## Las tres líneas que pide la entrega

**Qué decidí.** El poster del hero pasa a ser **la misma textura que dibuja el shader** (`faro-w` / `faro-m`), y no el fotograma del vídeo: así cuando el canvas se enciende no cambia ni un píxel, y si no se enciende nunca lo que queda es la pieza quieta. La máscara sube a la GPU con **dos canales**: R la máscara tal cual, G la misma desenfocada (radio 3 % del ancho, calculada en JavaScript al cargar), que el shader usa como «distancia a la estructura» para que el agua pegada a la torre y al espigón apenas se mueva. Y el ruido evoluciona **en el sitio**: cada capa son dos muestras que viajan en sentidos opuestos y se promedian, en vez de una sola que se traslada.

**Qué descarté.** Tocar el resto de la página (ni un selector fuera del fondo del hero). Cualquier ruido 3D o FBM de más capas: dos capas 2D bastan y a 60 fps con CPU ×4 no había motivo para gastar más. El nivel del mar al +6 %: se queda en **+5 %**, porque el sexto por ciento solo servía para forzar la costura del espigón que la atenuación por distancia acababa de quitar. Y el plan B: no hizo falta.

**Dónde me atasqué.** Dos veces, y las dos se vieron mirando, no midiendo. La primera versión desplazaba el agua con la misma fuerza hasta el borde mismo del espigón, y **el agua se cortaba contra la piedra**: una costura, y el oleaje leía como textura deslizando. La segunda, en móvil, **derretía los bloques de piedra del borde del espigón**, porque el polígono de la máscara era más estrecho que el espigón real en la parte baja (0,255-0,750 cuando la piedra llega de 0,10 a 0,90). Los fps, el primer frame y el porcentaje de píxeles que cambian daban bien en las dos.

## Qué hay

**Un plano y un shader.** WebGL2 a mano, sin librerías, 17,1 KB de JavaScript. Un triángulo que cubre la pantalla, dos texturas, y un fragment shader con:

- **Oleaje** (periodo 6 s) y **rizo** (1,2 s), ruido simplex 2D escrito en el propio shader. Desplazan las UV solo donde la máscara es blanca; fuera, la foto se dibuja tal cual. **El faro, el espigón y el cielo no se mueven nunca**, y se comprueba así: el desplazamiento se multiplica por la máscara al cuadrado y por la distancia a la estructura, y además se recorta a cero si en el destino la máscara es negra.
- **Nivel**: de −3 % a +5 % de la altura, atenuado en la franja del horizonte por el degradado de 24 px de la máscara.
- **Espuma**: donde la foto ya es clara (luminancia > 0,34 en escritorio, > 0,40 en móvil), el rizo va ×1,6. No se pinta espuma nueva.
- **Reflejo de la linterna**: una columna de oro `#C9A667` anclada a la x de la linterna de `direccion-arte.md`, que se ensancha y se apaga al alejarse del horizonte y se rompe con el oleaje. La linterna respira al 3 % en 8 s con la curva continua del sistema. Es lo único que brilla.

**Control.** Escritorio: el puntero, abajo = mar alto y rizo ×2,5, con una deriva lateral leve. Móvil y táctil: el progreso de scroll de la escena de 200vh (o hasta el final de la sección 2 donde no hay escena sticky). Sin ninguno durante 3 s: respiración de 8 s. Todo con inercia, lerp 0,06 por frame, nunca directo.

**Contrato de escena, cumplido y comprobable.** DPR ≤ 1,5 (el canvas mide 585×1266 en un móvil de DPR 3). `requestAnimationFrame` solo con el hero en viewport, por `IntersectionObserver`. Arranca **tras `load` + 300 ms**. El primer frame se cronometra con `gl.finish()` y se escribe en `data-primer-frame-ms`: si pasa de 80 ms, se queda el poster. Sin WebGL2, shader que no compila, texturas que no llegan o contexto perdido → se queda el poster y el motivo queda en `data-pieza`. Con `prefers-reduced-motion` este archivo no hace nada y manda el `<video>` de 5 s.

**Las dos escenas tienen constantes distintas**, leídas de `direccion-arte.md`: la de móvil (torre clara, olas grandes) lleva rizo mayor, reflejo menor y umbral de espuma más alto.

## Los números

| | Escritorio 1440×900 | Móvil 390×844 |
|---|---|---|
| **La pieza** (js + textura + máscara) | **52,3 KB** de 300 | **43,4 KB** de 300 |
| Página, primera pantalla | 214 KB | 205 KB |
| Página, total recorrido | 457 KB | 327 KB |
| Primer frame del shader | 0,5 ms | 0,4 ms |
| **fps con CPU ×4**, 4 s moviendo el puntero / el scroll | **60,2** · 0 frames > 50 ms | **60,2** · 0 frames > 50 ms |
| fps recorriendo la página entera, CPU ×4 | 60,1 | 60,1 |
| LCP en 4G + CPU ×4 | 1,91 s | 1,68 s |
| INP con CPU ×4 | 48 ms | 48 ms |
| CLS | 0,0021 | 0 |
| Contraste del cierre | — | 17 bloques, cero fallos |
| Tamaños de letra distintos | 5 | 5 |
| Píxeles del hero que cambian cada 0,4 s (agua en reposo) | 2,0 % | 1,8 % |

**Sobre el «Android de gama media».** Los fps se han medido en el Chrome instalado con emulación móvil y **CPU ×4**, pero la GPU es la de este PC (AMD Radeon integrada, vía ANGLE/D3D11). El shader hace 4 muestras de ruido y 3 lecturas de textura por píxel a 585×1266: es ligero, pero **el 60 fps en un Android real no está medido**. Es lo primero que debe comprobar Zyad en la sección 3, con el móvil en la mano. Si no va, el contrato ya recorta solo el DPR a 1,5 y el primer frame lento apaga la pieza.

## La entrega

- Publicado: https://faro-digital.pages.dev/test/faro/ (verificado en vivo: página, `pieza.js`, las dos texturas y las dos máscaras, todo 200).
- Vídeos del gesto, 6 s a 30 fps, fotogramas reales del hero con el mismo método que `grabar-escena.py` (un gesto por fotograma) y el Chrome con GPU real:
  - `_capturas/gesto-escritorio-1440.mp4` (634 KB): el ratón baja de arriba a abajo.
  - `_capturas/gesto-movil-390.mp4` (1.000 KB): el scroll baja una pantalla.
  - Y tres fotogramas sueltos de cada uno (`-ini`, `-mitad`, `-fin`) para mirar sin reproducir.
- Fotogramas de estado: `_capturas/pieza-1440x900-puntero-{arriba,medio,abajo}.png` y `pieza-390x844-scroll-{0,medio,1}.png`.
- Medidas: `_capturas/prueba-pieza.json` (la pieza) y `_capturas/medidas-pieza.json` (la página).

## Lo que la sección 3 tendrá que juzgar, y yo no puedo

Si **lee como agua** a ojo humano, con el ratón y con el dedo. Mi criterio de parada era «gelatina o textura deslizando»: las dos cosas aparecieron en la primera versión y las dos están corregidas en los fotogramas, pero un fotograma no es un gesto. Los dos vídeos están para eso, y el móvil real, para los fps.

---

## ⬜ Android real — lo rellena Zyad

Es el único número del contrato de escena que no se puede medir aquí: no hay dispositivo. Todo lo demás está comprobado.

**Cómo:** abrir https://faro-digital.pages.dev/test/faro/ en el móvil, y **bajar despacio desde arriba** para ver subir el mar alrededor del faro. Cinco segundos bastan.

```
Android real:  [modelo]  ·  [fluido / tirones]
```

Si dice **tirones**, no hay que tocar el shader a ciegas: el contrato ya recorta el DPR a 1,5 y apaga la pieza si el primer frame pasa de 80 ms. Lo que hay que hacer es leer `data-pieza` y `data-primer-frame-ms` del `<canvas>` en ese teléfono, que dicen si la pieza llegó a arrancar y cuánto tardó. Si arrancó y va a tirones, la salida es bajar el rizo (la capa fina de ruido es la cara) antes que quitar nada.
