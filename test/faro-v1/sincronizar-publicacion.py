"""Copia a Sitio-Web/test/faro-v1/ SOLO lo que la pagina necesita para publicarse.

Esta es la V1 CONGELADA (fila B15, 6,7 de nota). Se publica aparte para poder
ponerla al lado de la v2 en el test de dos pestanas de la seccion 3. No se toca:
si hace falta cambiar algo, se cambia en test/faro/.

Fuera quedan, a proposito: los prompts y las specs (.md, material interno),
_capturas/, este mismo script, y media/scrub/ (el plan B, que solo se sube si
se llega a usar).
Uso:  python faro-digital-web/test/faro-v1/sincronizar-publicacion.py
"""
import pathlib, shutil
RAIZ = pathlib.Path(__file__).resolve().parents[3]          # Desktop/IA
ORIGEN = RAIZ / "faro-digital-web" / "test" / "faro-v1"
DESTINO = RAIZ / "Marketing Digital" / "Freelance-Internacional" / "Sitio-Web" / "test" / "faro-v1"
PAGINA = ["index.html", "faro.css", "faro.js", "pieza.js"]
MEDIA = ["faro-w.webp", "faro-m.webp", "mascara-w.png", "mascara-m.png",
         "hero-1280.webm", "hero-1280.mp4", "hero-720.mp4",
         "poster-hero.jpg", "poster-hero-720.jpg", "poster-hero-1280.webp", "poster-hero-1920.webp",
         "faro-16x9.webp", "faro-3x4.webp",
         "cierre-1280.webm", "cierre-1280.mp4", "poster-cierre.webp"]
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
print(f"OK {len(PAGINA)+len(MEDIA)} archivos + casos, {total/1024:.0f} KB -> {DESTINO}")
