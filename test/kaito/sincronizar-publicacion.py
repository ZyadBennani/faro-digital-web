"""Copia a Sitio-Web/test/kaito/ SOLO lo que la pagina necesita para publicarse.

Fuera quedan, a proposito: el prompt maestro y las notas (.md: material interno),
_capturas/ y medidas, el script de sincronizacion, y los originales pesados que
la pagina no usa (faro-16x9.png 944 KB, faro-3x4.jpg 1,8 MB, hero-1920.mp4).
Uso:  python faro-digital-web/test/kaito/sincronizar-publicacion.py
"""
import pathlib, shutil
RAIZ = pathlib.Path(__file__).resolve().parents[3]          # Desktop/IA
ORIGEN = RAIZ / "faro-digital-web" / "test" / "kaito"
DESTINO = RAIZ / "Marketing Digital" / "Freelance-Internacional" / "Sitio-Web" / "test" / "kaito"
PAGINA = ["index.html", "kaito.css", "kaito.js"]
MEDIA = ["hero-1280.webm", "hero-1280.mp4", "hero-720.mp4",
         "poster-hero.jpg", "poster-hero-720.jpg", "poster-hero-1280.webp", "poster-hero-1920.webp",
         "faro-16x9.webp", "faro-3x4.webp",
         "cierre-1280.webm", "cierre-1280.mp4", "poster-cierre.jpg", "poster-cierre.webp"]
if DESTINO.exists():
    shutil.rmtree(DESTINO)
(DESTINO / "media" / "casos").mkdir(parents=True)
total = 0
for n in PAGINA:
    shutil.copy2(ORIGEN / n, DESTINO / n); total += (ORIGEN / n).stat().st_size
for n in MEDIA:
    shutil.copy2(ORIGEN / "media" / n, DESTINO / "media" / n); total += (ORIGEN / "media" / n).stat().st_size
for n in sorted((ORIGEN / "media" / "casos").glob("*.webp")):
    shutil.copy2(n, DESTINO / "media" / "casos" / n.name); total += n.stat().st_size
print(f"✅ {len(PAGINA)+len(MEDIA)} archivos, {total/1024:.0f} KB -> {DESTINO}")
