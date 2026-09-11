# -*- coding: utf-8 -*-
"""fps de la pieza v2.1 con CPU x4, en tres puntos (arriba, medio, pie), con el
Chrome instalado y su GPU de verdad (el Chromium sin pantalla cae a SwiftShader
y mide el shader en la CPU: no es la pagina, es el banco de pruebas).

En cada punto: 4 s de rueda de raton suave (el gesto real) mientras un contador
de requestAnimationFrame cuenta fotogramas y anota el peor. Y ademas cuantos
fotogramas de video se han subido a la GPU en esos 4 s: si es cero, el shader
va fluido pero el mar esta parado, que es justo lo que no se puede dar por bueno.

    python fps-olas.py [--ancho 1440] [--alto 900] [--cpu 4] [--url ...] [--json ...]
"""
import argparse, functools, http.server, json, pathlib, socketserver, sys, threading, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RAIZ = pathlib.Path(r"C:\Users\zyadb\Desktop\IA\faro-digital-web")

CONTADOR = """() => {
  window.__f = { n: 0, peor: 0, largos: 0, t0: performance.now(), ult: performance.now(), on: true,
                 sub0: document.querySelector('.pieza').pieza.estado().subidas };
  const paso = (t) => {
    if (!window.__f.on) return;
    const d = t - window.__f.ult; window.__f.ult = t; window.__f.n++;
    if (d > window.__f.peor) window.__f.peor = d;
    if (d > 50) window.__f.largos++;
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}"""
LEER = """() => { const f = window.__f; f.on = false;
  const s = (performance.now() - f.t0) / 1000;
  const e = document.querySelector('.pieza').pieza.estado();
  return { fps: +(f.n / s).toFixed(1), peorMs: Math.round(f.peor), largos: f.largos, seg: +s.toFixed(2),
           tormenta: document.querySelector('.pieza').dataset.tormenta, pieza: e.pieza, formato: e.formato,
           fase: e.cual, vid: e.vid, subidasPorSeg: +((e.subidas - f.sub0) / s).toFixed(1),
           calma: e.clips.calma && [e.enBucle ? 'bucle' : 'scrub', +e.T.toFixed(2)],
           tormentaClip: e.clips.subida && [e.clips.subida.necesario, e.clips.subida.busquedas] }; }"""


class S(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ancho", type=int, default=1440)
    ap.add_argument("--alto", type=int, default=900)
    ap.add_argument("--cpu", type=float, default=4)
    ap.add_argument("--url", default=None)
    ap.add_argument("--json", default=None)
    a = ap.parse_args()
    srv = None
    if a.url:
        base = a.url
    else:
        srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(S, directory=str(RAIZ)))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = "http://127.0.0.1:%d/test/faro/" % srv.server_address[1]
    from playwright.sync_api import sync_playwright
    res = {}
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome", headless=False)
        ctx = nav.new_context(viewport={"width": a.ancho, "height": a.alto}, device_scale_factor=1)
        pg = ctx.new_page()
        cdp = ctx.new_cdp_session(pg)
        pg.goto(base, wait_until="load"); pg.bring_to_front()   # ocluida, Chrome baja el rAF a 1/s
        for _ in range(60):
            e = pg.evaluate("(c => c.pieza ? c.pieza.estado() : null)(document.querySelector('.pieza'))")
            if e and e["clips"].get("subida") and e["clips"]["calma"]["ready"][0] >= 3 and (e["modo"] == "bucle" or e["clips"]["subida"]["ready"][0] >= 3):
                break
            time.sleep(0.25)
        time.sleep(4)   # v2.3: el arranque (fuentes, revelados, primera decodificación) daba fotogramas de 200 ms en «arriba» que no eran del gesto
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": a.cpu})
        alto_doc = pg.evaluate("document.documentElement.scrollHeight")
        print("CPU x%g · %dx%d · pieza: %s · clips: %s %s" % (a.cpu, a.ancho, a.alto, e["pieza"], e["formato"], {k: v["ready"] for k, v in e["clips"].items()}))
        for nombre, p in (("arriba", 0.0), ("medio", 0.5), ("pie", 1.0)):
            y = (alto_doc - a.alto) * p
            pg.evaluate("y => scrollTo(0, y)", y)
            pg.mouse.move(a.ancho * 0.3, a.alto * 0.5)
            pg.wait_for_timeout(2500)                  # que la inercia llegue y los clips arranquen
            pg.evaluate(CONTADOR)
            for i in range(25):
                pg.mouse.wheel(0, 120 if (i // 6) % 2 == 0 else -120)
                pg.wait_for_timeout(160)
            r = pg.evaluate(LEER)
            res[nombre] = r
            print("   %-7s fps %5.1f · peor frame %3d ms · frames > 50 ms: %d · tormenta %s · cual %d · vídeo %.2f · subidas/s %.1f · calma %s · subida %s" %
                  (nombre, r["fps"], r["peorMs"], r["largos"], r["tormenta"], r["fase"], r["vid"], r["subidasPorSeg"], r["calma"], r["tormentaClip"]))
        nav.close()
    if srv:
        srv.shutdown()
    if a.json:
        pathlib.Path(a.json).write_text(json.dumps(res, indent=1), encoding="utf-8")


main()
