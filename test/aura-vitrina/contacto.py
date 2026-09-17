# -*- coding: utf-8 -*-
"""Hoja de contacto de los candidatos .glb. L-0029/35/37: Chrome instalado, con
ventana, al frente, y la GPU comprobada antes de creerse nada."""
import base64, json, os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.abspath(os.path.join(RAIZ, '..', '..')), 'Renders', 'aura-s2')
URL = 'http://127.0.0.1:8777/test/aura-vitrina/contacto.html'

os.makedirs(SALIDA, exist_ok=True)
with sync_playwright() as p:
    nav = p.chromium.launch(channel='chrome', headless=False,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx = nav.new_context(viewport={'width': 1400, 'height': 800},
                          device_scale_factor=1, reduced_motion='reduce')
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append('JS: ' + str(e)))
    pg.on('console', lambda m: err.append('console.error: ' + m.text) if m.type == 'error' else None)
    pg.on('response', lambda r: err.append('HTTP %d %s' % (r.status, r.url)) if r.status >= 400 else None)
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()                                   # L-0037

    # Un timeout pelado no dice QUE fallo. Si la pagina no llega a LISTO se
    # imprime lo que el navegador ya habia gritado, que es lo unico accionable.
    try:
        pg.wait_for_function('window.LISTO === true', timeout=30000)
    except Exception:
        print(u'\n\U0001F534 la pagina no llego a LISTO. Lo que dijo el navegador:')
        for e in err[:20]:
            print('   ', e)
        if not err:
            print('    (nada: el modulo ni se ejecuto, o el fallo es de red)')
        nav.close()
        raise SystemExit(1)

    gpu = pg.evaluate("""() => { const c=document.createElement('canvas').getContext('webgl2');
        const d=c.getExtension('WEBGL_debug_renderer_info');
        return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?'; }""")
    print('GPU:', gpu)
    if 'SwiftShader' in gpu:
        print(u'  \U0001F534 SwiftShader: TODA medida que siga es falsa (L-0029)')
        nav.close()
        raise SystemExit(1)

    for modo in ('original', 'piezas'):
        r = pg.evaluate("(m) => window.CONTACTO(m, 1400, 620)", modo)
        ruta = os.path.join(SALIDA, 'contacto-' + modo + '.png')
        with open(ruta, 'wb') as f:
            f.write(base64.b64decode(r['png'].split(',', 1)[1]))
        print('  %-10s -> %s  (%.0f KB)' % (modo, ruta, os.path.getsize(ruta) / 1024))
        if modo == 'original':
            with open(os.path.join(SALIDA, 'contacto-piezas.json'), 'w', encoding='utf-8') as f:
                json.dump(r['info'], f, ensure_ascii=False, indent=1)
            for m in r['info']:
                print('\n  === %s   dims %s' % (m['modelo'], m['dims']))
                for pz in m['piezas']:
                    print('      %-30s mat=%-12s y %5.2f-%5.2f  ancho %5.2f  tris %6d  alpha %.2f'
                          % (str(pz['malla'])[:30], str(pz['mat'])[:12], pz['y0'], pz['y1'],
                             pz['ancho'], pz['tris'], pz['alpha']))
    if err:
        print(u'\n\U0001F534 ERRORES:')
        for e in err[:15]:
            print('   ', e)
    nav.close()
