# -*- coding: utf-8 -*-
"""El gesto de la v2.1 en vídeo: 12 s, de arriba al pie y vuelta, a 30 fps, en
escritorio. Fotogramas REALES de la página, uno a uno, con DOS relojes
controlados: el del navegador (page.clock, para las transiciones y el resto del
JavaScript) y el de los clips (el gancho `canvas.pieza.avanzar/listo/dibujar`,
que pausa los <video> y les pide con `currentTime` el fotograma exacto que les
toca). Sin el segundo, los clips correrían en tiempo real mientras el banco
captura a 3-5 fps, y el mar saldría acelerado.

🔴 Los clips publicados tienen UN keyframe (Kling). Buscar fotograma a fotograma
en ellos obliga a decodificar desde el principio en cada búsqueda. El script
intercepta la petición de cada clip y sirve la copia de `media/olas/_banco/`
(los mismos clips con keyframe cada 6 fotogramas, H.264 crf 22). La página
publicada no cambia; lo que cambia es el banco.

    python gesto-olas.py [--segundos 12] [--fps 30] [--ancho 1440] [--alto 900] [--gpu]

--gpu: el Chrome instalado con ventana (H.264 y shader en la GPU). Sin él,
Chromium sin pantalla, que NO decodifica H.264: se sirven los `.webm` de banco.
"""
import argparse, functools, http.server, pathlib, shutil, socketserver, subprocess, sys, tempfile, threading, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RAIZ = pathlib.Path(r"C:\Users\zyadb\Desktop\IA\faro-digital-web")
BANCO = RAIZ / "test" / "faro" / "media" / "olas" / "_banco"
SAL = RAIZ / "test" / "faro" / "_capturas"


class S(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def suave(x):   # --m-continua: simétrica, se puede parar a mitad
    return 4 * x * x * x if x < .5 else 1 - ((-2 * x + 2) ** 3) / 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--segundos", type=float, default=15)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--ancho", type=int, default=1440)
    ap.add_argument("--alto", type=int, default=900)
    ap.add_argument("--ruta", default="/test/faro/")
    ap.add_argument("--salida", default=str(SAL / "gesto-v24-cadena-escritorio-1440.mp4"))
    ap.add_argument("--gpu", action="store_true")
    a = ap.parse_args()
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(S, directory=str(RAIZ)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    total = int(a.segundos * a.fps)
    paso = 1000.0 / a.fps
    dt = 1.0 / a.fps
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="gesto_"))
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome", headless=False) if a.gpu else pw.chromium.launch(args=["--enable-unsafe-swiftshader"])
        pg = nav.new_context(viewport={"width": a.ancho, "height": a.alto}, device_scale_factor=1).new_page()

        def banco(ruta):
            nombre = ruta.request.url.rsplit("/", 1)[-1].split("-")[0]      # calma | tormenta
            ext = "mp4" if a.gpu else "webm"
            f = BANCO / ("%s-g6.%s" % (nombre, ext))
            ruta.fulfill(path=str(f), content_type="video/" + ext)
        # v2.4: nada que interceptar, los clips publicados ya llevan keyframe cada 6

        pg.clock.install()
        pg.goto("http://127.0.0.1:%d%s" % (port, a.ruta), wait_until="load")
        if a.gpu: pg.bring_to_front()   # ocluida, Chrome no compone y la captura se cuelga
        # el arranque de la pieza es load + 300 ms; después piden los clips (red real)
        for _ in range(30):
            pg.clock.run_for(100)
        for _ in range(200):
            e = pg.evaluate("(c => c.pieza ? c.pieza.estado() : null)(document.querySelector('.pieza'))")
            if e and e["clips"].get("subida") and e["clips"]["calma"]["ready"][0] >= 3 and e["clips"]["subida"]["ready"][0] >= 3:
                break
            time.sleep(0.1)
            pg.clock.run_for(100)
        print("pieza:", e and e["pieza"], "· formato:", e and e["formato"], "· clips:", e and {k: v["ready"] for k, v in e["clips"].items()})
        # el fundido de arranque (0,6 s) y un poco de calma antes de empezar
        for _ in range(12):
            pg.clock.run_for(100)
        pg.evaluate("document.querySelector('.pieza').pieza.captura(true)")
        alto_doc = pg.evaluate("document.documentElement.scrollHeight")
        recorrido = alto_doc - a.alto
        mitad = total // 2
        t_ini = time.time()
        esperas = 0
        # v2.4 · el gesto: bajar despacio hasta el pie (0-9 s), parar 2 s (9-11) y subir (11-15)
        def progreso(seg):
            if seg < 9: return suave(seg / 9)
            if seg < 11: return 1.0
            return 1 - suave(min((seg - 11) / 4, 1))
        for i in range(total):
            y = recorrido * progreso(i / a.fps)
            pg.evaluate("y => window.scrollTo(0, y)", y)
            pg.clock.run_for(int(round(paso * (i + 1))) - int(round(paso * i)))
            pg.evaluate("dt => document.querySelector('.pieza').pieza.avanzar(dt)", dt)
            for _ in range(150):
                if pg.evaluate("document.querySelector('.pieza').pieza.listo()"):
                    break
                time.sleep(0.01)
                esperas += 1
            pg.evaluate("document.querySelector('.pieza').pieza.dibujar()")
            pg.screenshot(path=str(tmp / ("f%05d.png" % i)))
            if i % 60 == 0:
                e = pg.evaluate("document.querySelector('.pieza').pieza.estado()")
                print("   %3d/%d  scroll %5d  tormenta %.3f  %s  T %.3f  cual %d  vid %.2f  calma %s  subida %s  (%.0f s)"
                      % (i, total, y, e["tormenta"], "bucle" if e["enBucle"] else "scrub", e["T"], e["cual"], e["vid"], e["clips"]["calma"]["t"], e["clips"]["subida"]["t"], time.time() - t_ini))
        pg.evaluate("document.querySelector('.pieza').pieza.captura(false)")
        nav.close()
    srv.shutdown()
    salida = pathlib.Path(a.salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(a.fps), "-i", str(tmp / "f%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", str(salida)], check=True)
    for n, i in (("ini", 0), ("mitad", int(4.5 * a.fps)), ("pie", int(10 * a.fps)), ("fin", total - 1)):
        shutil.copy(tmp / ("f%05d.png" % i), salida.with_name(salida.stem + "-" + n + ".png"))
    # una hoja de contacto de 12 fotogramas, para mirar la secuencia sin reproducir
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "f%05d.png"),
                    "-vf", "select='not(mod(n\\,%d))',scale=480:-1,tile=4x3" % max(1, total // 12), "-frames:v", "1",
                    str(salida.with_name(salida.stem + "-hoja.png"))], check=False)
    shutil.rmtree(tmp, ignore_errors=True)
    print("-> %s  (%.0f KB, %d fotogramas a %d fps, %.0f s de captura, %d esperas de búsqueda)"
          % (salida, salida.stat().st_size / 1024, total, a.fps, time.time() - t_ini, esperas))


main()
