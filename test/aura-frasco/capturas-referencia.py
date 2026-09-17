# -*- coding: utf-8 -*-
"""
CAPTURAS DE CALIBRACION · la vitrina actual de Aura y el ancla del jurado.

UNA VENTANA A LA VEZ (L-0037) y con reduced_motion (L-0039): la vitrina vive
dentro de un `.marco.fx-in`, que vale opacity:0 hasta que el observador le pone
.visto — y una captura tomada durante ese fundido es exactamente el falso
diagnostico de «vitrina lavada» del 30-ago, que costo una rama entera de
three.js. Ver POR-QUE-ESTA-AQUI.md en Versiones-Anteriores.

DONDE VAN LOS ARCHIVOS, Y POR QUE NO AL REPO
El recorte de Truekind es una foto de producto de una marca real y este
repositorio es PUBLICO. La captura vive en el repo privado, en
Biblioteca-Referencias, y `Renders/` esta en .gitignore. Se usa solo como
calibracion interna: ni entra en una textura, ni se publica, ni se redistribuye.
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
SALIDA = os.path.join(REPO, 'Renders', 'aura-s1')
PRIVADO = os.path.abspath(os.path.join(
    REPO, '..', 'Marketing Digital', '_Sistema', '03-Recursos-Internos',
    'Biblioteca-Referencias', 'Web', 'Aura-Calibracion'))


def abrir(p, w, h):
    nav = p.chromium.launch(channel='chrome', headless=False,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx = nav.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                          reduced_motion='reduce')     # L-0039
    return nav, ctx, ctx.new_page()


def main():
    os.makedirs(SALIDA, exist_ok=True)
    os.makedirs(PRIVADO, exist_ok=True)
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        # ── 1 · La vitrina que hay hoy ──────────────────────────────────────
        nav, ctx, pg = abrir(p, 1440, 1000)
        try:
            pg.goto('http://127.0.0.1:8778/Caso-2-Ecommerce-Aura.html', wait_until='load')
            pg.bring_to_front()
            pg.wait_for_timeout(3500)
            caja = pg.query_selector('.vitrina')
            if caja:
                caja.scroll_into_view_if_needed()
                pg.wait_for_timeout(1800)
                caja.screenshot(path=os.path.join(SALIDA, '_vitrina-actual.png'))
                print('vitrina actual: OK')
            else:
                print('🔴 no encuentro .vitrina en la pagina')
        finally:
            ctx.close(); nav.close()

        # ── 2 · El ancla del jurado ─────────────────────────────────────────
        nav, ctx, pg = abrir(p, 1280, 1100)
        try:
            pg.goto('https://truekindskincare.com/products/kumkumadi-radiance-facial-oil',
                    wait_until='load', timeout=60000)
            pg.bring_to_front()
            pg.wait_for_timeout(12000)
            pg.screenshot(path=os.path.join(PRIVADO, 'truekind-ficha.png'))
            print('truekind: OK ->', PRIVADO)
        finally:
            ctx.close(); nav.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
