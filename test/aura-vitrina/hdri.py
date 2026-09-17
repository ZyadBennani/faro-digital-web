# -*- coding: utf-8 -*-
"""Conduce hdri.html y guarda el equirectangular compacto en tres tamanos.
Elige el mayor que quepa en el presupuesto y lo deja como `entorno.png`."""
import base64, gzip, os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.abspath(__file__))
URL = 'http://127.0.0.1:8777/test/aura-vitrina/hdri.html'
TOPE_GZ_KB = 260      # lo que estoy dispuesto a pagar por el fondo de reflejos

with sync_playwright() as p:
    nav = p.chromium.launch(channel='chrome', headless=False,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx = nav.new_context(viewport={'width': 1200, 'height': 800}, device_scale_factor=1)
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()
    pg.wait_for_function('window.HDRI_LISTO === true', timeout=90000)
    if pg.evaluate('window.HDRI_ERROR'):
        print('\U0001F534 ' + pg.evaluate('window.HDRI_ERROR'))
        nav.close(); raise SystemExit(1)
    print(pg.inner_text('#log'))
    salidas = pg.evaluate('window.HDRI')
    nav.close()

elegido = None
for clave in ('512x256', '384x192', '256x128'):
    s = salidas[clave]
    b = base64.b64decode(s['url'].split(',', 1)[1])
    gz = len(gzip.compress(b, 9)) / 1024
    marca = ''
    if elegido is None and gz <= TOPE_GZ_KB:
        elegido = (clave, b, gz, s)
        marca = '  <- elegido'
    print('  %-9s %7.1f KB  (gz %6.1f)  max %s%s' % (clave, len(b)/1024, gz, s['max'], marca))
    with open(os.path.join(RAIZ, '_crudo', 'entorno-%s.png' % clave), 'wb') as f:
        f.write(b)

if not elegido:
    print('\U0001F534 ninguno cabe bajo %d KB gzip' % TOPE_GZ_KB)
    raise SystemExit(1)

clave, b, gz, s = elegido
ruta = os.path.join(RAIZ, 'entorno.png')
with open(ruta, 'wb') as f:
    f.write(b)
# el tamano viaja en el nombre no, en un JSON al lado: el decodificador lo necesita
import json
with open(os.path.join(RAIZ, 'entorno.json'), 'w', encoding='utf-8') as f:
    json.dump({'archivo': 'entorno.png', 'ancho': s['W'], 'alto': s['H'],
               'codificacion': 'RGBE (mantisa en RGB, exponente+128 en alfa)',
               'maximo': s['max'],
               'origen': 'Poly Haven · brown_photostudio_02 · 1k · CC0',
               'autor': 'Sergej Majboroda',
               'url': 'https://polyhaven.com/a/brown_photostudio_02'}, f,
              ensure_ascii=False, indent=2)
print('\n→ entorno.png  %s  %.1f KB (gz %.1f)' % (clave, len(b)/1024, gz))
