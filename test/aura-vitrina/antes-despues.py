# -*- coding: utf-8 -*-
"""
ANTES / DESPUES · v2 publicada contra v3 local.

🔴 EL «ANTES» SE CAPTURA DE PRODUCCION, NO DE UNA COPIA LOCAL, Y SE HACE ANTES
DE DESPLEGAR. La v2 esta viva en faro-digital.pages.dev; en cuanto se suba la v3
deja de existir. Una comparativa hecha con «lo que creo que habia» no es una
comparativa.

Uso:  python antes-despues.py            (con el servidor local en 8777)
"""
import io as _io, os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
S3 = os.path.join(os.path.abspath(os.path.join(RAIZ, '..', '..')), 'Renders', 'aura-s3')
VIVO = 'https://faro-digital.pages.dev/test/aura-vitrina/'
LOCAL = 'http://127.0.0.1:8777/test/aura-vitrina/'
PAPEL = (245, 239, 228); TINTA = (23, 33, 28); SUAVE = (120, 128, 122)


def fuente(px, negrita=False):
    for n in (('georgiab.ttf' if negrita else 'georgia.ttf'), 'segoeui.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(n, px)
        except Exception:
            pass
    return ImageFont.load_default()


def capturar(p, url, ancho, alto, destino, movil=False):
    nav = p.chromium.launch(channel='chrome', headless=movil,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    a = dict(viewport={'width': ancho, 'height': alto}, device_scale_factor=1)
    if movil:
        a.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx = nav.new_context(**a)
    pg = ctx.new_page()
    pg.goto(url, wait_until='load')
    if not movil:
        pg.bring_to_front()
    pg.wait_for_function('window.AURA_LISTO === true', timeout=60000)
    # el mismo estado en las dos: ALBA elegido, todo asentado
    pg.evaluate("() => window.AURA_ELEGIR && window.AURA_ELEGIR('serum')")
    pg.evaluate("""() => new Promise(ok => { let i = 0;
        const paso = () => (++i >= 70) ? ok(true) : requestAnimationFrame(paso);
        requestAnimationFrame(paso); })""")
    b = pg.query_selector('#seccion').bounding_box()
    pg.screenshot(path=destino, clip={'x': b['x'], 'y': b['y'],
                                      'width': b['width'], 'height': b['height']})
    nav.close()
    return destino


def panel(ruta, w, titulo, pie):
    cab = 96
    im = Image.open(ruta).convert('RGB')
    k = w / im.width
    im = im.resize((w, max(1, int(im.height * k))), Image.LANCZOS)
    p = Image.new('RGB', (w, im.height + cab), PAPEL)
    p.paste(im, (0, cab))
    d = ImageDraw.Draw(p)
    d.text((18, 20), titulo, font=fuente(30, True), fill=TINTA)
    d.text((18, 60), pie, font=fuente(17), fill=SUAVE)
    return p


def hoja(a, b, etq, ancho_panel):
    pa = panel(a, ancho_panel, 'ANTES · v2',
               'Publicada el 18-sep · tres frascos, liquido solidario con el envase')
    pb = panel(b, ancho_panel, 'DESPUES · v3',
               'Liquido nivelado, entorno HDRI real, imperfecciones, dos productos')
    sep, alto = 26, max(pa.height, pb.height)
    cuerpo = Image.new('RGB', (ancho_panel * 2 + sep, alto), PAPEL)
    cuerpo.paste(pa, (0, 0)); cuerpo.paste(pb, (ancho_panel + sep, 0))
    cab = Image.new('RGB', (cuerpo.width, 104), PAPEL)
    d = ImageDraw.Draw(cab)
    d.text((22, 22), 'Vitrina de Aura · v2 contra v3', font=fuente(34, True), fill=TINTA)
    d.text((22, 64), 'Ancho %s px · notas de Zyad a la v2: movimiento 8 · seleccion 8 · diseno 6,5'
           % etq, font=fuente(17), fill=SUAVE)
    todo = Image.new('RGB', (cuerpo.width, cab.height + cuerpo.height), PAPEL)
    todo.paste(cab, (0, 0)); todo.paste(cuerpo, (0, cab.height))
    salida = os.path.join(S3, 'ANTES-DESPUES-%s.png' % etq)
    todo.save(salida)
    print('  ' + os.path.basename(salida) + '  %dx%d' % todo.size)
    return salida


def main():
    os.makedirs(S3, exist_ok=True)
    with sync_playwright() as p:
        for etq, w, h, movil, ancho_panel in (('1440', 1440, 950, False, 700),
                                              ('390', 390, 844, True, 390)):
            a = capturar(p, VIVO, w, h, os.path.join(S3, 'v2-%s.png' % etq), movil)
            b = capturar(p, LOCAL, w, h, os.path.join(S3, 'v3-%s.png' % etq), movil)
            hoja(a, b, etq, ancho_panel)

    x = Image.open(os.path.join(S3, 'ANTES-DESPUES-1440.png')).convert('RGB')
    y = Image.open(os.path.join(S3, 'ANTES-DESPUES-390.png')).convert('RGB')
    w = max(x.width, y.width)
    t = Image.new('RGB', (w, x.height + y.height + 30), PAPEL)
    t.paste(x, ((w - x.width) // 2, 0))
    t.paste(y, ((w - y.width) // 2, x.height + 30))
    t.save(os.path.join(S3, 'ANTES-DESPUES.png'))
    print('  ANTES-DESPUES.png  %dx%d' % t.size)


if __name__ == '__main__':
    main()
