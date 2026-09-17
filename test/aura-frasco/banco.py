# -*- coding: utf-8 -*-
"""
BANCO AURA · guion de renders
=============================
Conduce /test/aura-frasco/ con el CHROME INSTALADO y con VENTANA, y guarda los
PNG y su parametros.json.

Por que asi, y no de cualquier otra forma — son tres lecciones ya pagadas:

  L-0029  El Chromium sin pantalla no tiene tarjeta grafica y cae a SwiftShader:
          el shader se ejecuta en la CPU. Medir WebGL ahi no mide la pagina,
          mide la tarjeta que no hay.
  L-0035  El vidrio y cualquier medida de pintado se miden con el Chrome
          instalado (channel="chrome"), no con el Chromium del banco.
  L-0037  Con la ventana ocluida el navegador deja de pintar: 1 fps y capturas
          colgadas. bring_to_front() tras el goto, y UNA ventana a la vez.

Uso:
    python banco.py                 # los 5 renders + control negativo + vitrina
    python banco.py --medir         # solo la medicion (KB, fps CPU x4, primer frame)
    python banco.py --uno familia   # un encuadre suelto
"""
import argparse, base64, json, os, sys, time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
SALIDA = os.path.join(REPO, 'Renders', 'aura-s1')
URL = 'http://127.0.0.1:8777/test/aura-frasco/'

ENCUADRES = ['serum-frontal', 'crema-frontal', 'bruma-frontal', 'familia', 'detalle-base']
VITRINA = ['vitrina-reposo', 'vitrina-serum']


def guardar_png(data_url, ruta):
    cab, b64 = data_url.split(',', 1)
    with open(ruta, 'wb') as f:
        f.write(base64.b64decode(b64))
    return os.path.getsize(ruta)


def abrir(p, ancho=1280, alto=900):
    """Chrome instalado, con ventana, al frente. No se negocia."""
    nav = p.chromium.launch(channel='chrome', headless=False,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx = nav.new_context(viewport={'width': ancho, 'height': alto},
                          device_scale_factor=1, reduced_motion='reduce')
    pg = ctx.new_page()
    errores = []
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.on('console', lambda m: errores.append('console.' + m.type + ': ' + m.text)
          if m.type == 'error' else None)
    # Un 404 en la consola no dice QUE falto. Sin la URL, el aviso solo sirve
    # para preocupar: se anota la ruta, que es lo unico accionable.
    pg.on('response', lambda r: errores.append('HTTP %d  %s' % (r.status, r.url))
          if r.status >= 400 else None)
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()                      # L-0037
    pg.wait_for_function('window.AURA_LISTO === true', timeout=60000)
    return nav, ctx, pg, errores


def gpu_real(pg):
    """Control: si esto dice SwiftShader, TODO lo que siga es una medida falsa."""
    return pg.evaluate("""() => {
      const c = document.createElement('canvas').getContext('webgl2');
      const d = c.getExtension('WEBGL_debug_renderer_info');
      return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'desconocido';
    }""")


def renders(pg, lista, errores):
    os.makedirs(SALIDA, exist_ok=True)
    hechos = []
    for nombre in lista:
        r = pg.evaluate("(n) => { const r = window.AURA.render(n); return r; }", nombre)
        ruta = os.path.join(SALIDA, nombre + '.png')
        kb = guardar_png(r['url'], ruta) / 1024
        par = pg.evaluate("(n) => window.AURA.parametros(n)", nombre)
        with open(os.path.join(SALIDA, nombre + '.parametros.json'), 'w', encoding='utf-8') as f:
            json.dump(par, f, ensure_ascii=False, indent=2)
        hechos.append((nombre, r['w'], r['h'], round(kb)))
        print('  %-18s %4d x %4d  %6.0f KB' % (nombre, r['w'], r['h'], kb))
    return hechos


def control_negativo(pg):
    """L-0052. El caso que TIENE que salir distinto. Si sale igual, el vidrio
    no esta haciendo nada y los otros cinco renders no valen."""
    r = pg.evaluate("""async () => {
        const r = await window.AURA.renderControlNegativo();
        return r;
    }""")
    ruta = os.path.join(SALIDA, 'control-negativo.png')
    kb = guardar_png(r['url'], ruta) / 1024
    par = pg.evaluate("(n) => window.AURA.parametros(n)", 'control-negativo')
    par['que_es'] = ('Control negativo de L-0052: transmission 0 y thickness 0. '
                     'Si un jurado no distingue este render del bueno, la transmision '
                     'no esta funcionando y el vidrio es una suposicion.')
    with open(os.path.join(SALIDA, 'control-negativo.parametros.json'), 'w', encoding='utf-8') as f:
        json.dump(par, f, ensure_ascii=False, indent=2)
    print('  %-18s %4d x %4d  %6.0f KB   (el que DEBE verse peor)'
          % ('control-negativo', r['w'], r['h'], kb))
    return kb


def medir(pg):
    """KB de three.js, primer frame y fps con CPU x4. Con ventana visible."""
    pesos = pg.evaluate("""async () => {
      const f = ['tres/three.module.min.js','tres/three.core.min.js','frasco.js','escena.js','perfiles-aura.json'];
      const out = {};
      for (const n of f) { const r = await fetch(n); out[n] = (await r.arrayBuffer()).byteLength; }
      return out;
    }""")
    primer = pg.evaluate("""() => {
      const t0 = performance.now();
      window.AURA.renderer.render(window.AURA.escena, window.AURA.camara);
      return performance.now() - t0;
    }""")
    cdp = pg.context.new_cdp_session(pg)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    fps = pg.evaluate("""() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      function paso(){ window.AURA.renderer.render(window.AURA.escena, window.AURA.camara);
        n++; if (performance.now() - t0 < 2000) requestAnimationFrame(paso);
        else res(n / ((performance.now() - t0) / 1000)); }
      requestAnimationFrame(paso);
    })""")
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    return pesos, primer, fps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--medir', action='store_true')
    ap.add_argument('--uno')
    ap.add_argument('--vitrina', action='store_true')
    a = ap.parse_args()

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        nav, ctx, pg, errores = abrir(p)
        try:
            gpu = gpu_real(pg)
            print('GPU: ' + gpu)
            if 'SwiftShader' in gpu or 'llvmpipe' in gpu:
                print('🔴 SwiftShader: sin tarjeta real. L-0029 — parar aqui.')
                return 2

            estado = pg.evaluate("() => ({papel: window.AURA.ultimaCalibracion, etiquetas: window.AURA.notas})")
            pa = estado['papel']
            print('Papel: %s vs %s · desvio %s/255 · albedo %s · emisiva %s%s' % (
                pa['leido'], pa['objetivo'], pa['desvio'], pa.get('albedo'), pa.get('emisiva'),
                '  <-- LAVA LA SOMBRA' if (pa.get('emisiva') or 0) > 0.05 else ''))
            for n in estado['etiquetas']:
                print('Etiqueta %-6s %s · desvio %s %%' % (n['etiqueta'], 'OK' if n['ok'] else '🔴 FUENTE MAL', n['desvio']))

            if a.medir:
                pesos, primer, fps = medir(pg)
                total = sum(pesos.values())
                print('\n--- MEDICION ---')
                for k, v in pesos.items():
                    print('  %-28s %6.1f KB' % (k, v / 1024))
                print('  %-28s %6.1f KB' % ('TOTAL', total / 1024))
                print('  primer frame                %6.1f ms' % primer)
                print('  fps con CPU x4              %6.1f' % fps)
                json.dump({'pesos_bytes': pesos, 'total_KB': round(total / 1024, 1),
                           'primer_frame_ms': round(primer, 1), 'fps_cpu_x4': round(fps, 1),
                           'gpu': gpu},
                          open(os.path.join(SALIDA, 'medicion.json'), 'w', encoding='utf-8'),
                          ensure_ascii=False, indent=2)
            elif a.uno:
                renders(pg, [a.uno], errores)
            elif a.vitrina:
                renders(pg, VITRINA, errores)
            else:
                print('\n--- RENDERS ---')
                renders(pg, ENCUADRES, errores)
                control_negativo(pg)
                renders(pg, VITRINA, errores)

            if errores:
                print('\n🔴 ERRORES EN LA PAGINA:')
                for e in errores[:10]:
                    print('   ' + e)
                return 1
        finally:
            ctx.close()
            nav.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
