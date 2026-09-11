# SPEC · Paso 5 · El vídeo del hero ligado al scroll · [FABLE, opcional]

**Fecha:** 04-sep-2026 · **Estado:** spec escrita y material reencodificado. **NO ejecutada.** El prompt maestro marca este paso como opcional y con criterio de parada propio; la decisión de construirlo o no es de Zyad, y hay un dato nuevo que pesa en contra (ver el apartado del presupuesto).

Es el «play on scroll» del final del segundo vídeo del tutorial: mientras el usuario recorre la portada y la sección de oferta, **el vídeo no se reproduce solo, avanza con el scroll**.

## 1 · Qué hace, exactamente

El recorrido de la escena son `200vh`: la primera pantalla es el hero y la segunda la oferta. Ese recorrido se traduce a un progreso de 0 a 1, y ese progreso decide el fotograma:

```
progreso = scrollY / (altura de la escena − altura del viewport)      // 0 → 1, recortado
objetivo = progreso × video.duration
```

El vídeo queda **pausado siempre**; lo único que cambia es `currentTime`.

## 2 · El lerp, y por qué

Escribir `video.currentTime = objetivo` en cada evento de scroll da tirones: el scroll llega a golpes y el decodificador no salta limpio entre fotogramas lejanos. Se suaviza con una interpolación en un bucle de `requestAnimationFrame`:

```js
let actual = 0, objetivo = 0, corriendo = false;

function marco() {
  actual += (objetivo - actual) * 0.08;          // lerp 0.08
  if (Math.abs(objetivo - actual) < 0.005) {     // ya está: se para el bucle
    actual = objetivo; corriendo = false;
  } else {
    requestAnimationFrame(marco);
  }
  if (Math.abs(video.currentTime - actual) > 0.02) video.currentTime = actual;
}

function alScroll() {
  objetivo = progreso() * video.duration;
  if (!corriendo) { corriendo = true; requestAnimationFrame(marco); }
}
```

Tres detalles que no son opcionales:

- **El bucle se para solo** cuando alcanza el objetivo. Un `requestAnimationFrame` permanente gasta batería y aparece en el perfil como trabajo constante.
- **No se escribe `currentTime` si la diferencia es menor de 20 ms**: cada escritura fuerza un salto en el decodificador.
- El listener de scroll va con `{ passive: true }` y solo guarda el objetivo. Todo el trabajo vive en el bucle de fotogramas.

## 3 · Dónde se activa, y dónde no

| Condición | Comportamiento |
|---|---|
| `≥ 1024 px` **y** sin `prefers-reduced-motion` **y** `readyState === 4` | Ligado al scroll |
| `readyState < 4` (el vídeo no está entero) | **Loop normal**, sin tocar `currentTime` |
| `< 1024 px` | **Loop normal siempre** |
| `prefers-reduced-motion` | Ni vídeo ni scrub: solo el poster, como ahora |

La comprobación de `readyState` se hace **en el momento de activar**, y si no está listo se escucha `canplaythrough` una vez para reintentar. Si nunca llega, se queda en loop y no pasa nada: el usuario ve el vídeo moverse igual, solo que no atado a su dedo.

El paso al loop normal cuando se sale de la escena tiene que devolver el vídeo a `play()`, o el hero se queda congelado al volver arriba.

## 4 · El material, ya preparado

Un vídeo normal tiene un fotograma clave cada varios segundos: saltar a un instante cualquiera obliga a decodificar desde el anterior, y eso es lo que se ve como tirón. Para el scrub hace falta uno cada 0,5 s.

Reencodificado en `media/scrub/` con `-g 15 -keyint_min 15` (30 fps → un keyframe cada 15 fotogramas):

```
ffmpeg -i hero-1280.mp4  -c:v libx264 -crf 28 -preset slow -g 15 -keyint_min 15 -sc_threshold 0 -an -movflags +faststart scrub/hero-1280.mp4
ffmpeg -i hero-1280.webm -c:v libvpx-vp9 -crf 36 -b:v 0 -g 15 -keyint_min 15 -an scrub/hero-1280.webm
```

| Recurso | Keyframes | Original | Con keyframes | Diferencia |
|---|---|---|---|---|
| hero-1280.mp4 | 1 → **10** | 145,4 KB | **276,1 KB** | **+130,6 KB** (+90 %) |
| hero-1280.webm | 2 → **10** | 64,7 KB | **186,6 KB** | **+122,0 KB** (+189 %) |

## 5 · 🔴 El presupuesto, que es el argumento en contra

El scrub **no es gratis**: el WebM, que es lo que se sirve en escritorio, casi se triplica.

| | Ahora | Con el paso 5 |
|---|---|---|
| Peso total recorrido a 1440 | **511,7 KB** | **~634 KB** |
| Techo del test | 1,2 MB | 1,2 MB |
| Puerta de la regla de decisión | 1,5 MB | 1,5 MB |

Cabe. Pero el paso 5 **es lo único de todo el test que empeora una medida para mejorar una sensación**, y llega justo cuando el resultado del jurado dice que el problema de esta portada estaba en el móvil, que es precisamente donde este paso no se activa.

## 6 · El criterio de parada, tal como lo fija la sección 7 del prompt maestro

> *«Solo si el presupuesto va por debajo de 1,8 MB y queda tiempo.»* · *«Si a la primera no va suave en Android, se descarta sin segunda ronda.»*

En concreto, se descarta si al medir aparece cualquiera de estas:

1. **Menos de 55 fps** recorriendo el hero y la sección 2 con CPU ×4, o cualquier frame de más de 50 ms.
2. **Tirones visibles** en el vídeo al arrastrar en un Android real. Una sola pasada: si no va suave, fuera.
3. **El LCP empeora**, que hoy está en 1,69 s a 1440 y 1,61 s a 390.
4. El peso total pasa de **1,2 MB**.

Y una condición que no está en el prompt y añado: **el paso 5 no se construye antes del jurado de móvil**. La ronda B12 era una sola ronda y el jurado está montado; meter un cambio de escritorio ahora mezclaría dos cosas que se decidieron por separado.

## 7 · Qué se mide si se construye

Los mismos números de siempre, antes y después: peso total recorrido, LCP, INP, CLS y fps con CPU ×4, más uno propio del paso: **el retardo entre el dedo y el fotograma**, medido como la diferencia máxima entre `objetivo` y `video.currentTime` durante un recorrido completo. Si esa diferencia pasa de 0,15 s, el gesto se siente pegajoso aunque los fps salgan bien.

## 8 · Lo que ya se sabe sin construirlo

El material está reencodificado y medido, así que **el coste ya es un dato y no una estimación**: 252,6 KB más entre los dos archivos, 122 KB en el que de verdad se sirve. Si el paso 5 se descarta, esta spec y esa tabla son lo que queda, y es lo que evita que la próxima vez alguien vuelva a preguntarse cuánto costaría.
