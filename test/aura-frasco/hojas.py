# -*- coding: utf-8 -*-
"""
LAS DOS HOJAS QUE CIERRAN LA SESION
===================================
  COMPARATIVA.png    cada render al lado del ancla del jurado, a la misma escala
  VITRINA-maqueta.png  la vitrina nueva en reposo y con ALBA elegido, 1440 y 390,
                       al lado de la vitrina que hay hoy

Sin la primera, un render se juzga contra el recuerdo de una foto. Sin la
segunda, la vitrina se aprueba en vivo o no se aprueba: si la composicion no
gusta en estatico, en movimiento tampoco.
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
SALIDA = os.path.join(REPO, 'Renders', 'aura-s1')
PRIVADO = os.path.abspath(os.path.join(
    REPO, '..', 'Marketing Digital', '_Sistema', '03-Recursos-Internos',
    'Biblioteca-Referencias', 'Web', 'Aura-Calibracion'))
PAPEL = (245, 239, 228)
TINTA = (23, 33, 28)
SUAVE = (110, 118, 112)

FUENTES = os.path.join(REPO, 'assets', 'fuentes')


def tipo(px, display=False):
    """La tipografia del sitio, no la del sistema. Si no carga, se DICE."""
    import glob
    ruta = os.path.join(FUENTES, 'FrankRuhlLibre-latin.woff2' if display else 'WorkSans-latin.woff2')
    for cand in (ruta.replace('.woff2', '.ttf'),):
        if os.path.exists(cand):
            return ImageFont.truetype(cand, px)
    # woff2 no lo abre Pillow: se usa una del sistema y se avisa en el informe.
    for n in ('georgia.ttf' if display else 'segoeui.ttf', 'arial.ttf'):
        c = os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', n)
        if os.path.exists(c):
            return ImageFont.truetype(c, px)
    return ImageFont.load_default()


def rotulo(d, xy, txt, px=20, col=TINTA, display=False, mayus=False):
    f = tipo(px, display)
    d.text(xy, txt.upper() if mayus else txt, font=f, fill=col)


def encajar(im, w, h):
    """Contiene la imagen dentro de la caja, centrada, sobre papel."""
    im = im.convert('RGB')
    k = min(w / im.width, h / im.height)
    im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    base = Image.new('RGB', (w, h), PAPEL)
    base.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    return base


# ═══════════════════════════════════════════════════════════════════════════
def comparativa():
    ancla = os.path.join(PRIVADO, 'truekind-ficha.png')
    if not os.path.exists(ancla):
        print('🔴 falta el ancla; corre capturas-referencia.py'); return False
    tk = Image.open(ancla).convert('RGB')
    # El recorte del producto dentro de la ficha. Medido sobre la captura de
    # 1280x1100: el frasco ocupa el tercio izquierdo.
    tk = tk.crop((40, 250, 470, 790))

    filas = [('serum-frontal', 'ALBA · sérum'),
             ('crema-frontal', 'VELO · crema'),
             ('bruma-frontal', 'ROCÍO · bruma'),
             ('familia', 'los tres'),
             ('detalle-base', 'base y cáustica'),
             ('control-negativo', 'CONTROL NEGATIVO · transmission 0, thickness 0')]

    CW, CH, GAP, CAB, PIE = 430, 540, 26, 116, 74
    W = 26 + CW + GAP + CW + 26
    H = CAB + len(filas) * (CH + PIE) + 30
    hoja = Image.new('RGB', (W, H), PAPEL)
    d = ImageDraw.Draw(hoja)

    rotulo(d, (26, 28), 'Aura · sesión 1 contra el ancla del jurado', 30, TINTA, True)
    rotulo(d, (26, 72), 'IZQUIERDA: EL BANCO /TEST/AURA-FRASCO/  ·  DERECHA: TRUEKIND, MISMA ESCALA', 14, SUAVE)
    d.line([(26, 100), (W - 26, 100)], fill=(226, 217, 198), width=1)

    y = CAB
    for nombre, titulo in filas:
        p = os.path.join(SALIDA, nombre + '.png')
        if os.path.exists(p):
            hoja.paste(encajar(Image.open(p), CW, CH), (26, y))
        hoja.paste(encajar(tk, CW, CH), (26 + CW + GAP, y))
        rotulo(d, (26, y + CH + 12), titulo, 19, TINTA, True)
        rotulo(d, (26 + CW + GAP, y + CH + 12), 'Truekind · Kumkumadi Facial Oil', 19, SUAVE, True)
        rotulo(d, (26, y + CH + 40), 'RENDER · THREE.JS · 2000 PX', 12, SUAVE)
        rotulo(d, (26 + CW + GAP, y + CH + 40), 'FOTOGRAFÍA · REFERENCIA INTERNA, NO SE PUBLICA', 12, SUAVE)
        d.line([(26, y + CH + PIE - 12), (W - 26, y + CH + PIE - 12)], fill=(232, 224, 207), width=1)
        y += CH + PIE

    hoja.save(os.path.join(SALIDA, 'COMPARATIVA.png'))
    print('COMPARATIVA.png  %dx%d' % hoja.size)
    return True


# ═══════════════════════════════════════════════════════════════════════════
def maqueta():
    from playwright.sync_api import sync_playwright
    tmp = {}
    with sync_playwright() as p:
        nav = p.chromium.launch(channel='chrome', headless=False,
                                args=['--force-color-profile=srgb',
                                      '--disable-features=CalculateNativeWinOcclusion'])
        try:
            for ancho, alto in ((1440, 1100), (390, 1100)):
                ctx = nav.new_context(viewport={'width': ancho, 'height': alto},
                                      device_scale_factor=2, reduced_motion='reduce')
                pg = ctx.new_page()
                pg.goto('http://127.0.0.1:8777/test/aura-frasco/maqueta-vitrina.html',
                        wait_until='load')
                pg.bring_to_front()
                for estado, etiq in ((None, 'reposo'), ('serum', 'serum')):
                    pg.evaluate("(id) => window.ponerEstado(id)", estado)
                    pg.wait_for_timeout(900)
                    el = pg.query_selector('#seccion')
                    ruta = os.path.join(SALIDA, '_maq-%s-%d.png' % (etiq, ancho))
                    el.screenshot(path=ruta)
                    tmp['%s-%d' % (etiq, ancho)] = ruta
                    print('  maqueta %s a %d px' % (etiq, ancho))
                ctx.close()
        finally:
            nav.close()

    actual = os.path.join(SALIDA, '_vitrina-actual.png')
    ims = {k: Image.open(v).convert('RGB') for k, v in tmp.items()}
    A = 1360                                   # ancho de columna de la hoja
    def esc(im, w=A):
        return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)

    piezas = []
    if os.path.exists(actual):
        piezas.append(('LO QUE HAY HOY  ·  caja negra, dos productos desenfocados, pedestal, panel de casino',
                       esc(Image.open(actual).convert('RGB'))))
    piezas.append(('LA VITRINA NUEVA  ·  1440 px  ·  reposo', esc(ims['reposo-1440'])))
    piezas.append(('LA VITRINA NUEVA  ·  1440 px  ·  ALBA elegido', esc(ims['serum-1440'])))
    mov = Image.new('RGB', (A, max(ims['reposo-390'].height, ims['serum-390'].height) // 2 + 40), PAPEL)
    m1 = esc(ims['reposo-390'], 420); m2 = esc(ims['serum-390'], 420)
    mov = Image.new('RGB', (A, max(m1.height, m2.height) + 20), PAPEL)
    mov.paste(m1, (120, 10)); mov.paste(m2, (620, 10))
    piezas.append(('LA VITRINA NUEVA  ·  390 px  ·  reposo (izq.) y ALBA elegido (der.)', mov))

    CAB, PIE = 108, 52
    H = CAB + sum(im.height + PIE for _, im in piezas) + 24
    hoja = Image.new('RGB', (A + 52, H), PAPEL)
    d = ImageDraw.Draw(hoja)
    rotulo(d, (26, 26), 'La vitrina de Aura · el salto', 30, TINTA, True)
    rotulo(d, (26, 68), 'MAQUETA ESTÁTICA · SESIÓN 1 · SE APRUEBA ESTO ANTES DE CONSTRUIRLO EN VIVO', 14, SUAVE)
    d.line([(26, 96), (A + 26, 96)], fill=(226, 217, 198), width=1)
    y = CAB
    for tit, im in piezas:
        hoja.paste(im, (26, y))
        rotulo(d, (26, y + im.height + 14), tit, 15, TINTA)
        y += im.height + PIE
    hoja.save(os.path.join(SALIDA, 'VITRINA-maqueta.png'))
    print('VITRINA-maqueta.png  %dx%d' % hoja.size)


if __name__ == '__main__':
    comparativa()
    maqueta()
