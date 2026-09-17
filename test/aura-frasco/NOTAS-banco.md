# Banco `/test/aura-frasco/` — el frasco de Aura como objeto de luz

**Sesión 1 · 17-sep-2026 · `noindex` · nada de esto está publicado.**
No se ha tocado `portfolio/caso-2-ecommerce-aura.html`.

---

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | el banco: tres frascos en vivo, panel de parámetros, render a 2000 px, reserva sin WebGL |
| `perfiles-aura.json` | **los tres frascos, en puntos.** Cambiar un frasco es cambiar puntos de aquí |
| `frasco.js` | perfil → geometría, materiales físicos, entorno HDR, etiqueta SVG, calcomanías |
| `escena.js` | escena, calibración del papel, encuadres, estado de vitrina, `window.AURA` |
| `maqueta-vitrina.html` | la vitrina nueva compuesta con `base.css` de verdad, dos estados |
| `banco.py` | conduce el banco con Chrome instalado y escribe los PNG + su JSON |
| `hojas.py` | `COMPARATIVA.png` y `VITRINA-maqueta.png` |
| `capturas-referencia.py` | la vitrina de hoy y el ancla del jurado |
| `poster.jpg` | la reserva estática para quien no tenga WebGL2 |

Salida en `faro-digital-web/Renders/aura-s1/` — **está en `.gitignore`**, ver abajo.

### Cómo se corre

```bash
cd C:\Users\zyadb\Desktop\IA\faro-digital-web
python -m http.server 8777 --bind 127.0.0.1
```

```bash
cd C:\Users\zyadb\Desktop\IA\faro-digital-web\test\aura-frasco && python banco.py
```

`banco.py` sin argumentos hace los 5 renders, el control negativo y los dos estados de vitrina.
`--medir` da KB, primer fotograma y fps. `--uno <encuadre>` hace uno suelto.

---

## Las tres decisiones que sostienen todo lo demás

**1 · El entorno es flotante, y es oscuro.**
Un entorno de 8 bits no puede tener un reflejo más brillante que el blanco del papel, y sin ese reflejo el vidrio es plástico gris con un punto quemado encima — que es literalmente lo que archivó la rama de three.js del 30-ago. Aquí el equirectangular es `Float32` con valores hasta 26, y sobre todo: **el techo del plató es casi negro y la luz entra por dos ventanas altas**. Un frasco rodeado solo de claro no tiene nada que reflejar y se lee como un sólido blanco. [[L-0067]]

**2 · El líquido no es un segundo cristal.**
En three.js dos materiales transmisivos anidados no se ven entre sí. El líquido es materia sólida con el color del producto, y por eso se ve deformado a través del vidrio y de la base gruesa. [[L-0066]]

**3 · El papel se calibra midiendo el lienzo.**
`#F5EFE4` escrito en un material no sale `#F5EFE4` por pantalla. El banco lo ajusta en bucle hasta clavarlo, **leyendo el framebuffer por el que sale el PNG** — y el número se verifica después fuera del navegador. [[L-0065]]

---

## Lo que se midió, no lo que parece

| | |
|---|---|
| **GPU** | AMD Radeon, D3D11 — real. Si sale SwiftShader el guion para ([[L-0029]]) |
| **three.js autoalojado** | 733 KB crudos · **184 KB gzip** |
| **Total del banco** | 817 KB crudos · **211 KB gzip** |
| **Presupuesto sesión 2** | 450 KB → cabe, con margen, pero el margen es el que es |
| **Primer fotograma** | 2,8 ms |
| **fps con CPU ×4** | 58,5 |
| **Papel del PNG** | (245, 239, 228) contra el objetivo (245, 239, 228) · albedo 1,00 · emisiva 0,006 |
| **Costura render/página** | **1/255** en la maqueta de vitrina |
| **Etiquetas** | 3/3 con Frank Ruhl Libre, desvío 0,6 / 2,0 / 2,4 % |

---

## El control negativo (L-0052)

`control-negativo.png` es el mismo sérum con `transmission: 0` y `thickness: 0`.
**Sale blanco y opaco, sin líquido dentro y sin refracción.** Si un jurado no lo
distingue del bueno, la transmisión no está haciendo nada y los otros cinco
renders no valen. Se enciende, se renderiza y se apaga en la misma llamada, para
que no pueda quedarse puesto por accidente.

---

## Lo que NO está resuelto, dicho claro

1. **VELO y ROCÍO siguen leyéndose más cerca del plástico esmerilado que del vidrio.** ALBA funciona porque su ámbar oscuro le da rango tonal; los otros dos son claro sobre claro y ahí el vidrio tiene poco donde agarrarse. La salida probable es vidrio tintado en la familia, no más ajustes de luz.
2. **Las siluetas son correctas y poco distintivas.** Un tarro, un frasco de farmacia y un frasco alto. Funcionan como familia; no tienen todavía un rasgo propio.
3. **La cáustica es falsa** — una textura radial con anillo, dicha y firmada. Tiene la forma correcta y está dentro de la sombra, pero no la calcula nadie.
4. **En móvil el estante se queda pequeño**: la maqueta de 390 px reusa el encuadre de escritorio. En vivo habrá que encuadrar más cerca.
5. **El banco carga three.js entero.** Para la sesión 2 conviene un build a medida (sin animación, sin loaders, sin post-proceso).

---

## Por qué `Renders/` no entra en git

Este repositorio es **público**. En `Renders/aura-s1/` hay dos cosas que no deben
subir: los PNG a 2000 px (decenas de MB que se regeneran corriendo el banco) y,
sobre todo, el recorte de **Truekind**, que es fotografía de producto de una marca
real. La captura de calibración vive en el repo privado:

```
Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\Aura-Calibracion\
```

Se usa solo como calibración interna: no entra en ninguna textura, no se publica
y no se redistribuye. Misma regla que el material de Kling de la pieza firma.

---

## Puerta

Zyad puntúa los 5 renders y la maqueta de vitrina. **≥ 8** → jurado a ciegas con
Truekind de ancla. **≥ 8,5** → sesión 2: vitrina en vivo (450 KB, DPR 1,5, pausa
fuera de pantalla) y hero prerenderizado. **< 8 en dos rondas** → se decide entre
artista 3D externo o cerrar Aura con fotografía.
