# `/test/faro` — la pieza firma

Aquí va la portada firma con shader: la que sí puede usar el faro como imagen, porque es **pieza de campaña y no identidad de la home** (ver la nota del 4-sep-2026 bajo la Regla nº 1 de `Marca/SISTEMA-MARCA.md`).

## Lo que ya vive aquí

**El scroll ligado al vídeo (paso 5 del test B11) se construye en esta pieza, no en la home.** Llegó del test «método Kaito», donde quedó descrito y con el material listo pero sin ejecutar, porque en aquella página solo afectaba a escritorio y allí el problema estaba en el móvil.

- `SPEC-paso-5.md` — cómo se liga `video.currentTime` al scroll con `requestAnimationFrame` y lerp 0.08, dónde se activa, el criterio de parada y qué se mide.
- `media/scrub/` — `hero-1280.mp4` y `hero-1280.webm` ya reencodificados con un keyframe cada 0,5 s (`-g 15 -keyint_min 15`), que es lo que hace que el scrub no dé tirones.

**El coste ya está medido, no estimado:** el mp4 pasa de 145,4 a 276,1 KB y el WebM de 64,7 a 186,6 KB. Ese salto es el precio del gesto, y hay que decidirlo con el presupuesto de esta pieza delante, no con el de la home.

## De dónde viene el resto del material

El test que lo produjo está archivado en `../kaito/`: `DECISION.md` cuenta por qué no sustituyó la home, y `NOTAS-paso-1.md` a `NOTAS-B12.md` guardan lo que se midió en cada paso. Las recetas reutilizables están en el sistema, en `Biblioteca-Referencias/Web/Recetas/hero-video-spec.md` y `Gestos/`.
