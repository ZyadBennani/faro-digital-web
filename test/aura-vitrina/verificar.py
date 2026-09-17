# -*- coding: utf-8 -*-
"""
VERIFICAR LO PUBLICADO · y la unica forma de que la respuesta sea del despliegue

🔴 UNA URL DE PRODUCCION SIN ROMPE-CACHE NO MIDE EL DESPLIEGUE: MIDE LA CACHE.

Medido el 18-sep, y es la cara opuesta de [[L-0077]]. Al quitar ROCIO de la
familia, `modelos/bruma.glb` dejo de existir en el build y de subirse. Aun asi
respondia **200** en faro-digital.pages.dev — con `CF-Cache-Status: HIT` y
`Age: 4264`, o sea 71 minutos de un despliegue anterior. Con `?nocache=…`
devolvia 404, y en la URL propia del despliegue nuevo tambien.

    En L-0077 un 404 recien desplegado era propagacion, y la respuesta fue
    REINTENTAR. Aqui reintentar habria devuelto 200 tres veces seguidas y
    habria confirmado, con tres medidas coincidentes, algo que era falso.

    Reintentar no distingue una cache de una verdad: las dos son estables.
    Lo que distingue es PREGUNTAR POR DONDE LA CACHE NO PUEDE CONTESTAR.

Asi que toda comprobacion lleva `?v=<aleatorio>` y, ademas, se comprueba lo que
NO debe estar — que es la mitad que nadie mira.

Uso:
    python verificar.py
    python verificar.py --url https://<id>.faro-digital.pages.dev
"""
import argparse, json, os, random, sys, urllib.request, urllib.error
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
BANCO = os.path.join(os.path.abspath(os.path.join(RAIZ, '..', '..')),
                     'Renders', 'aura-s2', 'banco.json')
BASE = 'https://faro-digital.pages.dev/test/aura-vitrina/'
ROJO, VERDE = '\U0001F534', '✅'

# Lo que NO puede estar. Un archivo que sobra no rompe la pagina, y por eso no
# se descubre nunca: hay que preguntarle por su nombre.
NO_DEBE_ESTAR = [
    'modelos/bruma.glb',            # ROCIO salio de la familia el 18-sep
    '_crudo/cosmetic_bottle_1.glb', 'modelos/_control/serum-sin-comprimir.glb',
    'banco.py', 'preparar.mjs', 'realismo.py', 'publicar.py', 'hdri.py',
    'hdri.html', 'contacto.html', 'android.py', 'verificar.py',
    'node_modules/three/package.json', 'familia.json.bak',
]


def pedir(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'faro-verificador'})
    try:
        r = urllib.request.urlopen(req, timeout=45)
        return r.getcode(), len(r.read()), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, 0, dict(e.headers)
    except Exception as e:
        return 0, 0, {'error': str(e)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default=BASE)
    args = ap.parse_args()
    base = args.url if args.url.endswith('/') else args.url + '/'

    if not os.path.isfile(BANCO):
        print(ROJO + ' falta banco.json: correr `python banco.py --puertas`')
        raise SystemExit(1)
    lista = sorted(a['f'] for a in json.load(open(BANCO, encoding='utf-8'))
                   ['escritorio']['peso']['archivos'])

    fallos = 0
    print('DEBE ESTAR (%d archivos), preguntado con rompe-cache:' % len(lista))
    for f in lista:
        rel = '' if f == 'index.html' else f
        cod, n, h = pedir(base + rel + '?v=%d' % random.randint(1, 10 ** 9))
        ok = cod == 200
        fallos += 0 if ok else 1
        print('  %-34s %s %d  %6d B  cache=%s' % (f, VERDE if ok else ROJO, cod, n,
                                                  h.get('CF-Cache-Status', '-')))

    print('\nNO DEBE ESTAR (%d), tambien con rompe-cache:' % len(NO_DEBE_ESTAR))
    for f in NO_DEBE_ESTAR:
        cod, n, h = pedir(base + f + '?v=%d' % random.randint(1, 10 ** 9))
        ok = cod != 200
        fallos += 0 if ok else 1
        print('  %-40s %s %d' % (f, VERDE if ok else ROJO + ' SE SIRVE', cod))

    # y el noindex, que es una de las dos cosas que prometimos
    cod, n, h = pedir(base + '?v=%d' % random.randint(1, 10 ** 9))
    req = urllib.request.Request(base + '?v=%d' % random.randint(1, 10 ** 9),
                                 headers={'User-Agent': 'faro-verificador'})
    html = urllib.request.urlopen(req, timeout=45).read().decode('utf-8', 'replace')
    tiene = 'content="noindex,nofollow"' in html
    fallos += 0 if tiene else 1
    print('\nnoindex en la pagina servida: %s' % (VERDE if tiene else ROJO))

    print('\n' + ('TODO CORRECTO' if not fallos else '%s %d COMPROBACION(ES) EN ROJO' % (ROJO, fallos)))
    print('\nNota: la cache del borde puede seguir sirviendo a un visitante normal')
    print('un archivo viejo durante horas. Eso se arregla purgando la cache de')
    print('Cloudflare, no volviendo a desplegar.')
    raise SystemExit(1 if fallos else 0)


if __name__ == '__main__':
    main()
