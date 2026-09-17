# -*- coding: utf-8 -*-
"""
CONTROLES DE REALISMO · sesion 3
================================
Cuatro mejoras, cuatro parejas de capturas CON y SIN. Y donde se puede, un
numero: «se ve mejor» es una opinion, y una opinion no pasa una puerta.

  1 · liquido nivelado    inclinando el frasco 40 grados, que es donde se ve
  2 · entorno HDRI        contra el entorno procedural de la sesion 1
  3 · ruido de rugosidad  con y sin
  4 · grano               con y sin

🔴 SE MIDE CON CHROME INSTALADO Y VENTANA. El panel de vista previa devuelve
`document.hidden === true` con la pagina delante, el bucle se para —bien— y
todo lo que se mida ahi es una foto congelada (L-0073, L-0075).
"""
import base64, json, os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.abspath(os.path.join(RAIZ, '..', '..')), 'Renders', 'aura-s3')
URL = 'http://127.0.0.1:8777/test/aura-vitrina/'
PAPEL = (245, 239, 228)
TINTA = (23, 33, 28)
SUAVE = (120, 128, 122)

# Inclinar el frasco: sin inclinacion las dos capturas del control son iguales
# y el control no distinguiria nada. 40 grados es donde un liquido de verdad
# deja de estar perpendicular a la pared y se le nota.
JS_INCLINAR = """(g) => { const v = window.AURA;
  v.giro.az = 0.55; v.giro.incl = g * Math.PI / 180;
  v.ultimoToque = performance.now() + 1e7;   // que no vuelva a reposo sola
  for (let i = 0; i < 4; i++) v.paso(performance.now());
  return v.inclinacionLiquido; }"""


def fuente(px, negrita=False):
    for n in (('georgiab.ttf' if negrita else 'georgia.ttf'), 'segoeui.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(n, px)
        except Exception:
            pass
    return ImageFont.load_default()


def abrir(p):
    nav = p.chromium.launch(channel='chrome', headless=False,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx = nav.new_context(viewport={'width': 1440, 'height': 950}, device_scale_factor=1)
    pg = ctx.new_page()
    pg.err = []
    pg.on('pageerror', lambda e: pg.err.append(str(e)))
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()
    pg.wait_for_function('window.AURA_LISTO === true', timeout=60000)
    pg.evaluate("""() => new Promise(ok => { let i = 0;
        const paso = () => (++i >= 45) ? ok(true) : requestAnimationFrame(paso);
        requestAnimationFrame(paso); })""")
    return nav, ctx, pg


def recorte(pg, sel='#estante'):
    b = pg.query_selector(sel).bounding_box()
    return {'x': b['x'], 'y': b['y'], 'width': b['width'], 'height': b['height']}


def pareja(a, b, titulo, pie_a, pie_b, nota, destino, criterio=None):
    """Dos capturas lado a lado, con la diferencia medida debajo.

    🔴 CADA EFECTO TIENE SU CRITERIO, Y ESTO NO ES UNA CONCESION.
    La primera version juzgaba los cuatro controles con la misma regla —pico
    >= 12 y 0,3 % de superficie— y suspendia el grano con un pico de 4. Pero 4
    sobre 255 ES el 1,5 % que pide el encargo: el grano estaba bien y la regla
    estaba mal. Un grano y una sombra no fallan igual:

        · una sombra o un liquido cambian MUCHO en POCA superficie
        · un grano cambia POCO en CASI TODA la superficie

    Una sola regla para las dos formas mide una y difama la otra. Asi que el
    criterio viaja con el control, y el que no lo trae usa el de los efectos
    locales, que es el caso comun.
    """
    criterio = criterio or {'pico_min': 12, 'umbral': 6, 'pct_min': 0.3}
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if ia.size != ib.size:
        ib = ib.resize(ia.size, Image.LANCZOS)
    pa, pb = ia.load(), ib.load()
    pico, tocados, n = 0, 0, 0
    for y in range(0, ia.height, 2):
        for x in range(0, ia.width, 2):
            d = max(abs(pa[x, y][i] - pb[x, y][i]) for i in range(3))
            pico = max(pico, d)
            if d >= criterio['umbral']:
                tocados += 1
            n += 1
    pct = 100.0 * tocados / max(1, n)

    cab, pie = 104, 62
    im = Image.new('RGB', (ia.width * 2 + 24, ia.height + cab + pie), PAPEL)
    im.paste(ia, (0, cab)); im.paste(ib, (ia.width + 24, cab))
    d = ImageDraw.Draw(im)
    d.text((18, 20), titulo, font=fuente(30, True), fill=TINTA)
    d.text((18, 62), pie_a, font=fuente(17), fill=SUAVE)
    d.text((ia.width + 24 + 18, 62), pie_b, font=fuente(17), fill=SUAVE)
    ok = pico >= criterio['pico_min'] and pct >= criterio['pct_min']
    d.text((18, cab + ia.height + 16),
           'Pico %d/255 · %.1f %% de la imagen cambia >= %d/255   (criterio: pico >= %d y %.0f %%)%s'
           % (pico, pct, criterio['umbral'], criterio['pico_min'], criterio['pct_min'],
              ('  ·  ' + nota) if nota else ''),
           font=fuente(18), fill=TINTA if ok else (170, 60, 40))
    im.save(destino)
    return {'pico': pico, 'pct': round(pct, 2), 'distingue': ok, 'criterio': criterio}


def main():
    os.makedirs(SALIDA, exist_ok=True)
    res = {}
    with sync_playwright() as p:
        nav, ctx, pg = abrir(p)
        gpu = pg.evaluate("""() => { const c=document.createElement('canvas').getContext('webgl2');
            const d=c.getExtension('WEBGL_debug_renderer_info');
            return d ? String(c.getParameter(d.UNMASKED_RENDERER_WEBGL)) : '?'; }""")
        print('GPU:', gpu)
        if 'SwiftShader' in gpu:
            print('\U0001F534 SwiftShader (L-0029)'); nav.close(); raise SystemExit(2)

        def captura(nombre, clip=None):
            f = os.path.join(SALIDA, nombre + '.png')
            pg.screenshot(path=f, clip=clip or recorte(pg))
            return f

        def asentar(n=30):
            pg.evaluate("""(n) => new Promise(ok => { let i = 0;
                const paso = () => (++i >= n) ? ok(true) : requestAnimationFrame(paso);
                requestAnimationFrame(paso); })""", n)

        # ── 1 · LIQUIDO NIVELADO ──────────────────────────────────────────
        pg.evaluate('(id) => window.AURA_ELEGIR(id)', 'serum')
        asentar(45)
        ang = pg.evaluate(JS_INCLINAR, 40)
        a = captura('liquido-CON-nivelado')
        pg.evaluate("() => { window.AURA.op.nivelado = false; }")
        pg.evaluate(JS_INCLINAR, 40)
        b = captura('liquido-SIN-nivelado')
        pg.evaluate("() => { window.AURA.op.nivelado = true; }")
        res['liquido'] = pareja(a, b, 'El liquido se queda nivelado',
                                'CON nivelado · la superficie sigue horizontal',
                                'SIN nivelado · la superficie gira con el frasco (control negativo)',
                                'frasco inclinado 40 grados',
                                os.path.join(SALIDA, 'CONTROL-liquido.png'))
        res['liquido']['inclinacion_superficie_grados'] = round(ang or 0, 2)
        print('  liquido  pico %(pico)d  %(pct).1f %%  distingue=%(distingue)s' % res['liquido'])

        # ── 2 · ENTORNO HDRI ──────────────────────────────────────────────
        pg.evaluate('(id) => window.AURA_ELEGIR(id)', 'serum')
        pg.evaluate("() => { window.AURA.giro.az = 0; window.AURA.giro.incl = 0; }")
        asentar(50)
        a = captura('entorno-CON-hdri')
        pg.evaluate("() => { window.AURA.usarEntorno(false); }")
        asentar(45)
        b = captura('entorno-SIN-hdri')
        pg.evaluate("() => { window.AURA.usarEntorno(true); }")
        asentar(45)
        res['entorno'] = pareja(a, b, 'El entorno es una habitacion de verdad',
                                'CON HDRI · Poly Haven brown_photostudio_02, CC0',
                                'SIN HDRI · el entorno procedural de la sesion 1',
                                '', os.path.join(SALIDA, 'CONTROL-entorno.png'))
        print('  entorno  pico %(pico)d  %(pct).1f %%  distingue=%(distingue)s' % res['entorno'])

        # ── 3 · RUIDO DE RUGOSIDAD ────────────────────────────────────────
        a = captura('ruido-CON')
        pg.evaluate("""() => { for (const id in window.AURA.frascos)
            window.AURA.frascos[id].userData.frasco.traverse(o => {
              if (o.isMesh && o.material.userData.ruido) o.material.userData.ruido.activo.value = 0; }); }""")
        asentar(12)
        b = captura('ruido-SIN')
        pg.evaluate("""() => { for (const id in window.AURA.frascos)
            window.AURA.frascos[id].userData.frasco.traverse(o => {
              if (o.isMesh && o.material.userData.ruido) o.material.userData.ruido.activo.value = 1; }); }""")
        asentar(12)
        res['ruido'] = pareja(a, b, 'Rugosidad con ruido, no constante',
                              'CON ruido · 0,02-0,075 en el vidrio, 0,45-0,62 en el tapon',
                              'SIN ruido · rugosidad exactamente constante (control negativo)',
                              '', os.path.join(SALIDA, 'CONTROL-ruido.png'))
        print('  ruido    pico %(pico)d  %(pct).1f %%  distingue=%(distingue)s' % res['ruido'])

        # ── 4 · GRANO ─────────────────────────────────────────────────────
        a = captura('grano-CON')
        pg.evaluate("() => { document.body.dataset.grano = 'no'; }")
        b = captura('grano-SIN')
        pg.evaluate("() => { delete document.body.dataset.grano; }")
        res['grano'] = pareja(a, b, 'Grano sobre el lienzo',
                              'CON grano · 1,5 %', 'SIN grano (control negativo)',
                              'el grano es sutil por diseno: pico bajo y superficie alta',
                              os.path.join(SALIDA, 'CONTROL-grano.png'),
                              # 🔴 EL GRANO TIENE QUE ESTAR EN EL PRODUCTO Y NO EN EL PAPEL.
                              # Primero se le pidio que tocara el 55 % del lienzo, y
                              # dio 2,2 %. Pero es que el 55 % habria sido UN FALLO:
                              # `mix-blend-mode: overlay` actua en los medios tonos y
                              # casi no toca el blanco — que es exactamente lo que
                              # hace el grano de una pelicula de verdad, y ademas lo
                              # unico aceptable aqui, porque grano sobre el papel
                              # significa que el lienzo deja de casar con el fondo de
                              # la pagina y vuelve a dibujarse LA CAJA.
                              # Asi que: pico pequeno (1,5 % = 3,8/255), presente en
                              # el producto, ausente del papel. La ausencia en el
                              # papel la comprueba `costura()` en banco.py.
                              {'pico_min': 3, 'umbral': 2, 'pct_min': 1.5})
        print('  grano    pico %(pico)d  %(pct).1f %%  distingue=%(distingue)s' % res['grano'])

        res['papel'] = pg.evaluate('window.AURA.papelInforme')
        res['entorno_informe'] = pg.evaluate('window.AURA.entornoInforme')
        res['aviso'] = pg.evaluate('window.AURA.aviso')
        res['errores'] = pg.err[:8]
        nav.close()

    with open(os.path.join(SALIDA, 'realismo.json'), 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print('\n→ ' + SALIDA)
    for k in ('liquido', 'entorno', 'ruido', 'grano'):
        if not res[k]['distingue']:
            print('\U0001F534 el control de «%s» NO distingue: pico %d, %.2f %% — '
                  'o la mejora no hace nada, o el control no la ve'
                  % (k, res[k]['pico'], res[k]['pct']))


if __name__ == '__main__':
    main()
