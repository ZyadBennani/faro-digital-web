# -*- coding: utf-8 -*-
"""
HOJAS · ANTES-DESPUES.png y la comparacion de sombras.

El «antes» es la vitrina que hay hoy en el caso de Aura, capturada el 17-sep por
`test/aura-frasco/capturas-referencia.py`. El «despues» es esta.

Las dos van a la MISMA anchura de columna y con el MISMO papel detras, porque si
no se comparan dos encuadres en vez de dos vitrinas.
"""
import os, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
S1 = os.path.join(REPO, 'Renders', 'aura-s1')
S2 = os.path.join(REPO, 'Renders', 'aura-s2')
PAPEL = (245, 239, 228)
TINTA = (23, 33, 28)
SUAVE = (120, 128, 122)


def fuente(px, negrita=False):
    for n in (('georgiab.ttf' if negrita else 'georgia.ttf'), 'seguisb.ttf', 'segoeui.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(n, px)
        except Exception:
            pass
    return ImageFont.load_default()


def encajar(im, w, h):
    """Encaja dentro de (w,h) sin deformar, sobre papel."""
    lienzo = Image.new('RGB', (w, h), PAPEL)
    k = min(w / im.width, h / im.height)
    r = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    lienzo.paste(r, ((w - r.width) // 2, (h - r.height) // 2))
    return lienzo


def panel(ruta, w, h, titulo, pie):
    """🔴 A LA MISMA ANCHURA, CADA UNO CON SU PROPORCION.
    Encajar las dos capturas en una caja de proporcion fija hace que la que sea
    mas ancha y baja —la vitrina nueva, que es una fila— se reduzca para caber
    en el alto y salga pequena al lado de la vieja, que es casi cuadrada.
    Eso no compara dos vitrinas: compara dos recortes. Lo que tiene que ser
    igual es el ANCHO, que es lo que ocupan las dos en la pagina."""
    cab = 86
    if os.path.isfile(ruta):
        im = Image.open(ruta).convert('RGB')
        k = w / im.width
        im = im.resize((w, max(1, int(im.height * k))), Image.LANCZOS)
        alto = max(h, im.height)
        p = Image.new('RGB', (w, alto + cab), PAPEL)
        p.paste(im, (0, cab + (alto - im.height) // 2))
    else:
        p = Image.new('RGB', (w, h + cab), PAPEL)
        ImageDraw.Draw(p).text((22, cab + h // 2), 'FALTA ' + os.path.basename(ruta),
                               font=fuente(20), fill=(180, 60, 40))
    d = ImageDraw.Draw(p)
    d.text((22, 20), titulo, font=fuente(30, True), fill=TINTA)
    d.text((22, 58), pie, font=fuente(17), fill=SUAVE)
    return p


def rotulo(w, texto, sub):
    h = 104
    im = Image.new('RGB', (w, h), PAPEL)
    d = ImageDraw.Draw(im)
    d.text((22, 22), texto, font=fuente(34, True), fill=TINTA)
    d.text((22, 64), sub, font=fuente(17), fill=SUAVE)
    return im


def pegar_columna(trozos, w):
    alto = sum(t.height for t in trozos)
    im = Image.new('RGB', (w, alto), PAPEL)
    y = 0
    for t in trozos:
        im.paste(t, (0, y)); y += t.height
    return im


def antes_despues():
    for etq, ancho_panel, alto_panel in (('1440', 700, 470), ('390', 390, 470)):
        antes = os.path.join(S1, '_vitrina-actual.png')
        # el BLOQUE .vitrina, no la seccion: lo mismo que es el «antes»
        despues = os.path.join(S2, 'bloque-%s.png' % etq)
        pa = panel(antes, ancho_panel, alto_panel, 'ANTES',
                   'La vitrina del caso de Aura · captura del 17-sep-2026')
        pd = panel(despues, ancho_panel, alto_panel, 'DESPUES',
                   'Tres modelos reales en un solo lienzo, girables · sesion 2')
        sep = 26
        alto = max(pa.height, pd.height)
        cuerpo = Image.new('RGB', (ancho_panel * 2 + sep, alto), PAPEL)
        cuerpo.paste(pa, (0, 0)); cuerpo.paste(pd, (ancho_panel + sep, 0))
        cab = rotulo(cuerpo.width, 'Vitrina de Aura · antes y despues',
                     'Ancho de referencia %s px · mismo papel #F5EFE4 detras de las dos' % etq)
        salida = os.path.join(S2, 'ANTES-DESPUES-%s.png' % etq)
        pegar_columna([cab, cuerpo], cuerpo.width).save(salida)
        print('  ' + os.path.basename(salida) + '  %d x %d' % (cuerpo.width, cab.height + cuerpo.height))

    # la hoja unica que pide el encargo: las dos anchuras, una debajo de otra
    a = Image.open(os.path.join(S2, 'ANTES-DESPUES-1440.png')).convert('RGB')
    b = Image.open(os.path.join(S2, 'ANTES-DESPUES-390.png')).convert('RGB')
    w = max(a.width, b.width)
    hoja = Image.new('RGB', (w, a.height + b.height + 30), PAPEL)
    hoja.paste(a, ((w - a.width) // 2, 0))
    hoja.paste(b, ((w - b.width) // 2, a.height + 30))
    hoja.save(os.path.join(S2, 'ANTES-DESPUES.png'))
    print('  ANTES-DESPUES.png  %d x %d' % hoja.size)


def sombras():
    """El control negativo, con su diferencia MEDIDA. «Se ve peor» es una
    opinion; el porcentaje de pixeles que cambian en la franja de apoyo es un
    numero, y es el que dice si la sombra de contacto esta haciendo algo."""
    con = os.path.join(S2, 'control-con-sombra.png')
    sin = os.path.join(S2, 'control-sin-sombra.png')
    if not (os.path.isfile(con) and os.path.isfile(sin)):
        print('  (faltan las capturas del control: correr banco.py --controles)')
        return
    a = Image.open(con).convert('RGB'); b = Image.open(sin).convert('RGB')
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)
    # 🔴 LA MEDIA SOBRE UNA ZONA GRANDE NO MIDE UN EFECTO LOCAL.
    # La primera version promediaba el tercio bajo entero —casi todo papel
    # vacio— y devolvia 0,4/255 para una sombra que SI esta ahi. El numero era
    # correcto y la conclusion ('no hace nada') era falsa: la sombra de
    # contacto ocupa el 4 % de esa zona, asi que cualquier media la diluye 25
    # veces. Se mide donde el efecto ocurre: el MAXIMO, y cuanta superficie
    # cambia de verdad.
    y0 = int(a.height * 0.62)
    pa, pb = a.load(), b.load()
    dist, n, pico, tocados = 0, 0, 0, 0
    for y in range(y0, a.height, 2):
        for x in range(0, a.width, 2):
            d = max(abs(pa[x, y][i] - pb[x, y][i]) for i in range(3))
            dist += d; n += 1
            if d > pico:
                pico = d
            if d >= 6:
                tocados += 1
    media = dist / max(1, n)
    pct = 100.0 * tocados / max(1, n)

    sep = 20
    cuerpo = Image.new('RGB', (a.width * 2 + sep, a.height + 96), PAPEL)
    cuerpo.paste(a, (0, 96)); cuerpo.paste(b, (a.width + sep, 96))
    d = ImageDraw.Draw(cuerpo)
    d.text((16, 20), 'CON sombra de contacto', font=fuente(24, True), fill=TINTA)
    d.text((a.width + sep + 16, 20), 'SIN sombra de contacto  (control negativo)',
           font=fuente(24, True), fill=TINTA)
    d.text((16, 56), 'Pico %d/255 · %.1f %% de la franja cambia >= 6/255 · media %.2f (diluida)'
           % (pico, pct, media), font=fuente(17), fill=SUAVE)
    salida = os.path.join(S2, 'CONTROL-sombra.png')
    cuerpo.save(salida)
    print('  CONTROL-sombra.png · pico %d/255 · %.1f %% de la franja cambia >= 6/255 (media %.2f)'
          % (pico, pct, media))
    if pico < 12 or pct < 0.5:
        print('  ' + u'\U0001F534' + ' la sombra de contacto NO esta haciendo nada visible')
    else:
        print('  la sombra de contacto SI cambia la imagen: el control distingue')
    return {'pico': pico, 'pct': pct, 'media': media}


if __name__ == '__main__':
    os.makedirs(S2, exist_ok=True)
    print('─ antes / despues ─')
    antes_despues()
    print('─ control de sombra ─')
    sombras()
