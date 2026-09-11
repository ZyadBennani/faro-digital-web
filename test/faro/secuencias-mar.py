# -*- coding: utf-8 -*-
"""Secuencias limpias (sin texto encima) del mar: el cruce del bucle de tormenta y el fundido calma→tormenta.
Chrome real + clips de banco (keyframes densos) por interceptacion, modo captura de la pieza."""
import functools, http.server, socketserver, sys, threading, time, pathlib, io
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RAIZ = pathlib.Path(r"C:\Users\zyadb\Desktop\IA\faro-digital-web")
BANCO = RAIZ / "test" / "faro" / "media" / "olas" / "_banco"
SAL = RAIZ / "test" / "faro" / "_capturas" / "v21" / "frames"
class S(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(S, directory=str(RAIZ)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = "http://127.0.0.1:%d/test/faro/" % srv.server_address[1]
from playwright.sync_api import sync_playwright
def paso(pg, dt):
    pg.evaluate("dt => document.querySelector('.pieza').pieza.avanzar(dt)", dt)
    for _ in range(200):
        if pg.evaluate("document.querySelector('.pieza').pieza.listo()"): break
        time.sleep(0.01)
    pg.evaluate("document.querySelector('.pieza').pieza.dibujar()")
def foto(pg):
    return Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", headless=False)
    pg = nav.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1).new_page()
    pg.route("**/media/olas/*-1280.*", lambda r: r.fulfill(path=str(BANCO / (r.request.url.rsplit("/", 1)[-1].split("-")[0] + "-g6.mp4")), content_type="video/mp4"))
    pg.goto(base, wait_until="load")
    for _ in range(40):
        time.sleep(0.25)
        e = pg.evaluate("(c => c.pieza ? c.pieza.estado() : null)(document.querySelector('.pieza'))")
        if e and e["clips"].get("tormenta") and e["clips"]["calma"]["ready"][0] >= 3 and e["clips"]["tormenta"]["ready"][0] >= 3: break
    time.sleep(1)
    pg.add_style_tag(content="main, .hero-arriba { opacity: 0 !important }")
    pg.evaluate("document.querySelector('.pieza').pieza.captura(true)")
    # 1 · el cruce del bucle de tormenta: tormenta = 1, avanzar el clip hasta 4,4 s y capturar cada 1/12 s hasta 5,4 s
    pg.evaluate("document.querySelector('.pieza').pieza.forzar(1)")
    paso(pg, 0.01)
    t = 0
    while t < 4.4: paso(pg, 0.2); t += 0.2
    fr = []
    for i in range(13):
        paso(pg, 1/12); fr.append(foto(pg).crop((330, 380, 1130, 880)).resize((400, 250)))
    est = pg.evaluate("document.querySelector('.pieza').pieza.estado()")["clips"]["tormenta"]
    hoja = Image.new("RGB", (400*7, 250*2)); [hoja.paste(f, ((k%7)*400, (k//7)*250)) for k, f in enumerate(fr)]
    hoja.save(SAL / "cruce-bucle-tormenta-limpio.png"); print("cruce guardado; estado tormenta:", est)
    # 2 · el fundido calma → tormenta: tormenta forzada de 0,30 a 0,70 en 4 s (a 1/6 s por captura, 12 fotos)
    fr = []
    for i in range(12):
        pg.evaluate("v => document.querySelector('.pieza').pieza.forzar(v)", 0.30 + 0.40 * i / 11)
        paso(pg, 1/3); fr.append(foto(pg).crop((0, 380, 1440, 900)).resize((480, 173)))
    hoja = Image.new("RGB", (480*4, 173*3)); [hoja.paste(f, ((k%4)*480, (k//4)*173)) for k, f in enumerate(fr)]
    hoja.save(SAL / "fundido-calma-tormenta-limpio.png"); print("fundido guardado")
    # 3 · dos fotogramas a tamaño real: calma (tormenta 0) y el pico de la tormenta (clip en 3,7 s)
    pg.evaluate("document.querySelector('.pieza').pieza.forzar(0)"); paso(pg, 0.5); foto(pg).save(SAL / "calma-limpio-1440.png")
    pg.evaluate("document.querySelector('.pieza').pieza.forzar(1)")
    for _ in range(30): paso(pg, 0.2)
    e = pg.evaluate("document.querySelector('.pieza').pieza.estado()")["clips"]["tormenta"]; t = e["t"][e["activo"]]
    while abs(t - 3.7) > 0.1:
        paso(pg, 0.1); e = pg.evaluate("document.querySelector('.pieza').pieza.estado()")["clips"]["tormenta"]; t = e["t"][e["activo"]]
    foto(pg).save(SAL / "tormenta-pico-limpio-1440.png"); print("pico en", t)
    nav.close()
srv.shutdown()
