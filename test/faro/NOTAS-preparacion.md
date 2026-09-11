# `/test/faro` · Sección 1 · Preparación · [OPUS 5]

**Fecha:** 04-sep-2026 · **Fila:** B15 · **Estado: terminada. La página está lista para que la sección 2 construya la pieza.** No se ha publicado: la entrega es de la sección 2.

---

## 1.1 · La copia

`test/kaito/` → `test/faro/`, sin `_capturas/`, `DECISION.md` ni los `NOTAS-*`, que son el expediente del test archivado y no la página.

Lo copiado: `index.html`, la hoja de estilo, el script, `SPEC-secciones.md` y toda la media que la página usa (vídeos del hero y del cierre, posters, WebP de reduced-motion y las seis miniaturas de los casos).

**Un cambio que no estaba pedido y conviene saber:** los archivos pasan de `kaito.css` / `kaito.js` a **`faro.css` / `faro.js`**, con las referencias del HTML actualizadas. Llamar «kaito» a los archivos de una pieza que ya no es ese test se presta a error en cuanto alguien abra la carpeta dentro de un mes. El contenido es idéntico salvo las cabeceras de comentario.

Título, `<meta>`, `noindex`, copy, rejilla, escala de cinco tamaños, secciones y enlaces internos: **sin tocar**. Verificado en el navegador: el H1 es el mismo, las cuatro secciones están, y ni una petición falla.

## 1.2 · Texturas y máscaras

| | Escritorio | Móvil |
|---|---|---|
| Textura | `faro-w.webp` 1600×912 q82 · **33,2 KB** (techo 140) | `faro-m.webp` 672×900 q82 · **24,6 KB** (techo 70) |
| Máscara | `mascara-w.png` 800×456 · **2,0 KB** (techo 30) | `mascara-m.png` 336×450 · **1,6 KB** (techo 30) |
| Horizonte (UV y) | 0,527 | 0,575 |
| Superficie de agua | 34,9 % | 28,8 % |

**Las cuatro suman 61,4 KB**, un quinto del techo de 300 KB de la pieza. Todo lo demás lo puede gastar el shader.

Coordenadas, polígonos y paleta muestreada: **`direccion-arte.md`**, que es lo que hay que pegarle a la sección 2 junto al prompt.

### Dos desviaciones, con motivo

1. **La textura de escritorio sale a 1600 px de ancho y no a 1800.** 1600 es el ancho nativo de `faro-16x9.png`: subir a 1800 interpola, añade peso y no añade detalle. Si hace falta más resolución, se arregla al generar la imagen, no al reescalarla.
2. **El horizonte de la 3:4 se leyó a mano.** El detector automático dio 0,737, que es el borde del espigón y no la línea del mar. Los dos horizontes y los cuatro polígonos salen de leer una rejilla UV dibujada sobre cada imagen, no de un umbral.

### 🔴 Y un fallo propio, corregido

La primera versión de la máscara restaba **todo lo claro** dentro de una banda fija del 22 % al 78 % del ancho, para quitar la piedra del espigón. En la 16:9 funcionó; en la 3:4 **se comió la espuma**, que es justo lo que más tiene que moverse, y dejó agujeros donde rompen las olas. Se vio al superponer la máscara en rojo sobre la textura, no en los números: el porcentaje de agua salía razonable.

> **La espuma es clara y es agua.** Un umbral de brillo no distingue piedra de espuma; lo que las distingue es **dónde** están.

Ahora el refinado solo mira dentro del propio polígono del espigón, con un 3 % de margen, y el horizonte de la 3:4 subió de 0,600 a 0,575 para que las olas que rompen por encima entren en la máscara.

**Las dos imágenes no son la misma escena**, y eso importa para el shader: la de escritorio es una torre oscura con mar abierto, la de móvil una torre clara con olas grandes. La piedra pasa de `#171A15` a `#40361D`. Las constantes del shader tienen que leerse de la tabla de `direccion-arte.md`, no darse por buenas de una a otra.

## 1.3 · El hueco

El `<video>` del hero lo sustituye **`<canvas class="pieza">`**, con el mismo tamaño y la misma posición: medido a 1440 y a 390, el canvas y el poster ocupan el mismo rectángulo al píxel. El `<picture>` del poster queda debajo tal cual y **sigue siendo el LCP y el fallback de todo**.

Tres detalles del montaje:

- **El canvas nace con `opacity: 0`** y solo lo enciende la clase `viva`. Así el poster no parpadea mientras la pieza arranca, y si la pieza no arranca nunca no se nota nada.
- **El vídeo del hero se queda en el HTML, pero solo para `prefers-reduced-motion`**: sus `<source>` llevan ahora `(prefers-reduced-motion: reduce)`. Con movimiento normal no coincide ninguna fuente y **no se descarga ni un byte**; eso es lo que deja sitio a la pieza dentro del techo. Verificado: con movimiento normal el vídeo está oculto y sin fuente; con reduced-motion se muestra y reproduce `hero-1280.webm` sobre `faro-16x9.webp`.
- **`pieza.js` existe y está vacío a propósito**, con el contrato de escena y los números escritos dentro. Se carga aparte de `faro.js` para que un fallo suyo no arrastre al resto de la página.

Comprobado en tres modos (escritorio, móvil y reduced-motion): cero errores de consola y cero peticiones fallidas, también tras recorrer la página entera.

## Lo que la sección 2 recibe hecho

- La página completa y funcionando en `test/faro/`, con el hueco del canvas en su sitio.
- `direccion-arte.md` con texturas, máscaras, horizontes, polígonos, linterna y paleta, todo medido.
- `pieza.js` con el contrato de escena ya escrito.
- `sincronizar-publicacion.py` propio, listo para el día que se publique.
- El plan B intacto por si el shader no lee como agua: `SPEC-paso-5.md` y `media/scrub/`.

**Lo que la sección 2 tendrá que decidir y aquí no se ha tocado:** el ruido del oleaje y del rizo, la amplitud del desplazamiento, cómo se ancla el reflejo de la linterna, y las constantes distintas para cada una de las dos escenas.
