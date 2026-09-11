# -*- coding: utf-8 -*-
"""v2.4 · El retardo entre un tick de rueda y el cambio de fotograma del clip de subida (al 60 % de la página).

Chrome real. A mitad de página (tormenta ~0,5, el clip en scrub), se manda UN tick de
rueda y se lee en la propia página cuándo se subió a la GPU el siguiente fotograma
nuevo del clip (`estado().clips.tormenta.subidaEn`, un performance.now() de la página),
contra el performance.now() del evento `wheel`. Diez ticks alternos, con CPU x1 y x4.
Tambien se anota cuanto tarda cada busqueda (`busquedaMs`, del `currentTime` al `seeked`).

    python medir-retardo.py [--url ...] [--json ...]
"""
import argparse, functools, http.server, json, pathlib, socketserver, statistics, sys, threading, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RAIZ = pathlib.Path(r"C:\Users\zyadb\Desktop\IA\faro-digital-web")
class S(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--url"); ap.add_argument("--json"); a = ap.parse_args()
    srv = None
    if a.url: base = a.url
    else:
        srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(S, directory=str(RAIZ)))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = "http://127.0.0.1:%d/test/faro/" % srv.server_address[1]
    from playwright.sync_api import sync_playwright
    res = {}
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome", headless=False)
        ctx = nav.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg)
        pg.add_init_script("addEventListener('wheel', () => { window.__rueda = performance.now(); }, { passive: true });")
        pg.goto(base, wait_until="load"); pg.bring_to_front()   # ocluida, Chrome baja el rAF a 1/s
        for _ in range(60):
            e = pg.evaluate("(c => c.pieza ? c.pieza.estado() : null)(document.querySelector('.pieza'))")
            if e and e["clips"].get("subida") and e["clips"]["subida"]["ready"][0] >= 3: break
            time.sleep(0.25)
        alto = pg.evaluate("document.documentElement.scrollHeight")
        for cpu in (1, 4):
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": cpu})
            pg.evaluate("y => scrollTo(0, y)", (alto - 900) * 0.6); pg.mouse.move(400, 450); time.sleep(2.5)
            retardos, busquedas, fotos = [], [], []
            for i in range(10):
                # tres ticks seguidos hacia abajo y tres hacia arriba, como una rueda de verdad
                pg.mouse.wheel(0, 120 if (i // 3) % 2 == 0 else -120)
                time.sleep(1.5)
                # todo se lee en la página: el instante del `wheel` y el registro de subidas
                # [cuándo, fotograma]; el retardo es la primera subida posterior al tick con un
                # fotograma DISTINTO del último subido antes del tick
                r = pg.evaluate("""(() => {
                    const s = document.querySelector('.pieza').pieza.estado();
                    const reg = s.clips.subida.registro || [], w = window.__rueda;
                    let antes = null, d = null, f0 = null, f1 = null;
                    for (const [t, f] of reg) { if (t <= w) antes = f; }
                    for (const [t, f] of reg) { if (t > w && f !== antes) { d = t - w; f0 = antes; f1 = f; break; } }
                    return { d, f0, f1, busq: s.clips.subida.busquedaMs, n: reg.length };
                })()""")
                retardos.append(round(r["d"], 1) if r["d"] is not None else None)
                busquedas.append(r["busq"]); fotos.append((r["f0"], r["f1"]))
            ok = [r for r in retardos if r is not None]
            res["cpu_x%d" % cpu] = {"retardos_ms": retardos, "mediana": statistics.median(ok) if ok else None, "max": max(ok) if ok else None,
                                   "busqueda_ms": busquedas, "fotogramas": fotos}
            print("CPU x%d · rueda → fotograma nuevo: mediana %s ms · max %s ms · %d/10 medidos · búsquedas %s ms" %
                  (cpu, res["cpu_x%d" % cpu]["mediana"], res["cpu_x%d" % cpu]["max"], len(ok), busquedas))
            print("        fotogramas (antes → después):", fotos)
        nav.close()
    if srv: srv.shutdown()
    if a.json: pathlib.Path(a.json).write_text(json.dumps(res, indent=1), encoding="utf-8")
main()
