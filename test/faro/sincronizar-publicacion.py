"""Copia a Sitio-Web/test/faro/ SOLO lo que la pagina necesita para publicarse.

Fuera quedan, a proposito: los prompts y las specs (.md, material interno),
_capturas/, este mismo script, y media/scrub/ (el plan B, que solo se sube si
se llega a usar).
Uso:  python faro-digital-web/test/faro/sincronizar-publicacion.py
"""
import pathlib, shutil
RAIZ = pathlib.Path(__file__).resolve().parents[3]          # Desktop/IA
ORIGEN = RAIZ / "faro-digital-web" / "test" / "faro"
DESTINO = RAIZ / "Marketing Digital" / "Freelance-Internacional" / "Sitio-Web" / "test" / "faro"
PAGINA = ["index.html", "faro.css", "faro.js", "pieza.js"]
MEDIA = ["faro-w.webp", "mascara-w.png",
         "poster-hero.jpg",
         # v3 · los dos bucles de escritorio, el bucle móvil y sus posters (primer fotograma exacto).
         # `_original/`, `_banco/` y `_v3/` (másters) son material interno y no se suben.
         "olas/calma.webm", "olas/calma.mp4", "olas/tormenta.webm", "olas/tormenta.mp4",
         "olas/calma-m.webm", "olas/calma-m.mp4", "olas/poster-calma.webp", "olas/poster-calma-m.webp"]
if DESTINO.exists():
    shutil.rmtree(DESTINO)
(DESTINO / "media" / "casos").mkdir(parents=True)
(DESTINO / "media" / "olas").mkdir(parents=True)
total = 0
for n in PAGINA:
    shutil.copy2(ORIGEN / n, DESTINO / n); total += (ORIGEN / n).stat().st_size
for n in MEDIA:
    shutil.copy2(ORIGEN / "media" / n, DESTINO / "media" / n); total += (ORIGEN / "media" / n).stat().st_size
for n in sorted((ORIGEN / "media" / "casos").glob("*.webp")):
    shutil.copy2(n, DESTINO / "media" / "casos" / n.name); total += n.stat().st_size
print(f"OK {len(PAGINA)+len(MEDIA)} archivos + casos, {total/1024:.0f} KB -> {DESTINO}")
