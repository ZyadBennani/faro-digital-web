# faro-digital-web — contexto para Claude

## ⭐ 0-CERO · LO PRIMERO, ANTES DE CUALQUIER OTRA COSA

1. **Leer `C:\Users\zyadb\Desktop\IA\Marketing Digital\_Sistema\00-Metodologia\LECCIONES.md`** — al menos su índice de tags. 50 fallos ya pagados, con la regla de cada uno. Vive en el otro repositorio y manda igual aquí.
2. **Leer las 5 últimas entradas de `C:\Users\zyadb\Desktop\IA\Marketing Digital\00-Siguiente-Paso.md`.**

**Antes de tocar nada, buscar en LECCIONES los tags de la tarea.** Los que más muerden en este repo: `#despliegue` `#publicado` `#video` `#scrub` `#capturas` `#chrome` `#gpu` `#webgl` `#banco` `#privacidad`.

**Al descubrir un fallo: la lección se escribe EN EL MOMENTO** en ese LECCIONES.md, con tag y coste. Después, `python "…\_Sistema\herramientas\lecciones-indice.py"`.

**Al cerrar: una línea fechada en `00-Siguiente-Paso.md`** — *hecho · queda · la siguiente sesión empieza por*.

---

## 🔴 0-BIS · LAS TRES COSAS QUE HACEN DAÑO EN ESTE REPO

### 1. Este repo es PÚBLICO y **no es el que se publica**

| | |
|---|---|
| **El sitio vivo** | sale de `Marketing Digital\Freelance-Internacional\Sitio-Web\` → `faro-digital.pages.dev` |
| **Este repo** | es un **espejo público** de un host **caído** (`faro-digital.netlify.app`, 503 por cuota agotada) |
| **Cuánto difieren** | el `index.html` de aquí tiene 1.923 líneas contra las 3.196 del publicado: **2.731 líneas distintas** |

> **Editar aquí no publica nada.** Para publicar se toca `Sitio-Web/`. Lección [[L-0002]] y [[L-0042]].

Y al revés: **nada de lo que entre aquí es privado.** Antes de commitear cualquier cosa nueva, mirar si nombra a un cliente, una URL de vista previa o un dato interno.

### 2. El material de origen de la pieza firma cuesta dinero

`test/faro/media/olas/_original/`, `_banco/` y `_v3/` son clips de Kling **comprados con créditos**. Están en `.gitignore` a propósito, pero **tienen copia completa y versionada** en el repo privado:

```
Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\Material-Origen-Pieza-Firma\
```

Comparados archivo a archivo en los dos sentidos el 15-sep-2026: **25 de 25, cero diferencias**. Si alguna vez se borran de aquí, se recuperan de ahí.

> ⚠️ **`pieza.js:89` construye la ruta en ejecución** (`'media/olas/' + nombre + '.' + formato`). El nombre de los clips **no está escrito en ningún sitio**: un detector de huérfanos por nombre los borraría. No correr limpiezas automáticas sobre `media/`.

### 3. Lo que se sirve no es lo que hay en la carpeta

El 11-sep se descubrió que **6 archivos `.bak`, `wrangler.toml` y `Datos/` se servían en producción con 200**. El constructor copiaba por carpeta sin excluir por forma del nombre. Arreglado, pero **queda purgar la caché de Cloudflare**. Lección [[L-0015]] y [[L-0042]].

---

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `index.html`, `signal*.html`, `hola-*.html`, `portfolio/` | el espejo del sitio |
| `test/faro/` | **la pieza firma**, v3 desde el 10-sep. Estado real en `test/faro/NOTAS-pieza.md` |
| `test/faro-v1/` | la v1 congelada (6,7 de Zyad) |
| `test/kaito/` | el test B11, **cerrado y archivado** el 4-sep con 7,29: no sustituye la home. Ver `test/kaito/DECISION.md` |
| `functions/api/` | las funciones de medición |

**La Regla nº 1 de marca se mantiene: nunca se dibuja un faro literal.** Solo se permite como pieza firma en `/test` y en campaña — y los dos jurados del test Kaito lo ratificaron: la foto del faro se leyó como cliché literal del nombre.

**Antes de construir una web N3**, el guion es `Marketing Digital\_Sistema\03-Recursos-Internos\Biblioteca-Referencias\Web\PROCEDIMIENTO-N3.md`. 14 pasos con tiempos reales. Se sigue; si algo no encaja, se cambia el procedimiento y se dice por qué, no se improvisa por fuera.
