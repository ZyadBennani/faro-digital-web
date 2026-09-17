# -*- coding: utf-8 -*-
"""
EL POSTER · la version de reserva de la vitrina.

No es un marcador de posicion: es lo que ve quien no tiene WebGL2, quien tiene
`prefers-reduced-motion`, y todo el mundo durante los milisegundos que tarda en
montarse la escena. Asi que sale del MISMO plato, con el MISMO encuadre, en el
estado de reposo. Un poster dibujado aparte se nota en el salto.

Y pesa: en la primera medida del 17-sep el poster era un PNG de la sesion 1 con
la extension cambiada a .jpg —funcionaba porque el navegador olfatea el
contenido— y se comia 324 KB de los 714 de toda la seccion. El 45 % del peso de
una pieza de 3D en vivo era una imagen fija mal guardada.

Uso:  python poster.py            (con el servidor en 8777)
"""
import base64, io as _io, os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
URL = 'http://127.0.0.1:8777/test/aura-vitrina/'
ANCHO, ALTO = 1200, 750          # 16:10, el mismo `aspect-ratio` que el hueco


def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image

    with sync_playwright() as p:
        nav = p.chromium.launch(channel='chrome', headless=False,
                                args=['--force-color-profile=srgb',
                                      '--disable-features=CalculateNativeWinOcclusion'])
        ctx = nav.new_context(viewport={'width': 1500, 'height': 1000}, device_scale_factor=1)
        pg = ctx.new_page()
        pg.goto(URL, wait_until='load')
        pg.bring_to_front()
        pg.wait_for_function('window.AURA_LISTO === true', timeout=45000)

        # el lienzo a la medida exacta del poster, en reposo, y asentado
        pg.evaluate("""([w,h]) => { window.AURA_ELEGIR(null); window.AURA.medida(w,h); }""", [ANCHO, ALTO])
        pg.evaluate("""() => new Promise(ok => { let i=0;
            const paso = () => (++i>=60) ? ok(true) : requestAnimationFrame(paso);
            requestAnimationFrame(paso); })""")
        datos = pg.evaluate("""() => { window.AURA.paso(performance.now());
            return document.getElementById('lienzo').toDataURL('image/png'); }""")
        nav.close()

    crudo = base64.b64decode(datos.split(',', 1)[1])
    im = Image.open(_io.BytesIO(crudo)).convert('RGB')

    # JPEG de verdad, con su extension de verdad. 1200 px basta: el hueco mide
    # 700 px a 1440 de ancho de pagina, asi que hay margen para pantallas 2x.
    ruta = os.path.join(RAIZ, 'poster.jpg')
    im.save(ruta, 'JPEG', quality=84, optimize=True, progressive=True)
    kb = os.path.getsize(ruta) / 1024

    # Y el control que impide que vuelva a colarse un PNG disfrazado:
    with open(ruta, 'rb') as f:
        cab = f.read(3)
    assert cab == b'\xff\xd8\xff', 'poster.jpg NO es un JPEG: ' + repr(cab)

    print('poster.jpg  %d x %d  ·  %.1f KB  ·  JPEG comprobado por cabecera' % (im.width, im.height, kb))
    if kb > 90:
        print('\U0001F534 pesa mas de 90 KB: baja la calidad o el ancho')


if __name__ == '__main__':
    main()
