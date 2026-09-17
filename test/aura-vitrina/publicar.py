# -*- coding: utf-8 -*-
"""
PUBLICAR /test/aura-vitrina/ en el arbol vivo (Sitio-Web/), que es el que sube a
faro-digital.pages.dev.

🔴 LA LISTA DE LO QUE SE COPIA NO SE ESCRIBE A MANO: SE MIDE.
Se toma de `Renders/aura-s2/banco.json`, que guarda **lo que el navegador pidio
de verdad** al cargar la pagina. Una lista escrita a mano se queda corta cuando
alguien anade un archivo, y se queda larga cuando alguien quita otro — y las dos
formas de equivocarse ya han pasado aqui:

  L-0042  6 archivos .bak, wrangler.toml y Datos/ servidos con 200.
  L-0015  el constructor copiaba por carpeta sin excluir por forma.
  Y tres veces (21-ago, 1-sep, 4-sep) una carpeta que «no se publicaba» segun
  su propio README acabo publicada. Un nombre no es una exclusion.

Ademas se comprueba DESPUES de copiar que en el destino no hay nada que no
estuviera en la lista. Copiar bien y no mirar es como se publica una carpeta de
mas.

Uso:
    python publicar.py            # copia y verifica
    python publicar.py --seco     # dice que haria, sin tocar nada
"""
import argparse, json, os, shutil, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
BANCO = os.path.join(REPO, 'Renders', 'aura-s2', 'banco.json')
VIVO = os.path.abspath(os.path.join(
    REPO, '..', 'Marketing Digital', 'Freelance-Internacional', 'Sitio-Web',
    'test', 'aura-vitrina'))

ROJO, VERDE = '\U0001F534', '✅'


def lista_medida():
    """Lo que el navegador pidio. Nada mas, y nada menos."""
    d = json.load(open(BANCO, encoding='utf-8'))
    return sorted(a['f'] for a in d['escritorio']['peso']['archivos'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seco', action='store_true')
    args = ap.parse_args()

    if not os.path.isfile(BANCO):
        print(ROJO + ' falta banco.json: correr `python banco.py --puertas` primero')
        raise SystemExit(1)

    archivos = lista_medida()
    print('Lista MEDIDA (lo que la pagina pide): %d archivos' % len(archivos))
    for f in archivos:
        print('   ' + f)

    # el noindex se comprueba en el archivo que se va a copiar, no en la memoria
    html = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    if 'name="robots" content="noindex' not in html:
        print(ROJO + ' index.html NO lleva noindex. No se publica.')
        raise SystemExit(1)
    print(VERDE + ' noindex comprobado en index.html')

    if args.seco:
        print('\n(en seco: no se ha copiado nada) destino ' + VIVO)
        return

    if os.path.isdir(VIVO):
        shutil.rmtree(VIVO)
    for rel in archivos:
        origen = os.path.join(RAIZ, rel.replace('/', os.sep))
        destino = os.path.join(VIVO, rel.replace('/', os.sep))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copy2(origen, destino)

    # ── y AHORA se mira lo que hay en el destino ─────────────────────────────
    puestos = []
    for base, _, fs in os.walk(VIVO):
        for f in fs:
            puestos.append(os.path.relpath(os.path.join(base, f), VIVO).replace(os.sep, '/'))
    sobra = sorted(set(puestos) - set(archivos))
    falta = sorted(set(archivos) - set(puestos))
    kb = sum(os.path.getsize(os.path.join(VIVO, f.replace('/', os.sep))) for f in puestos) / 1024

    print('\nEn el destino: %d archivos · %.1f KB' % (len(puestos), kb))
    if sobra:
        print(ROJO + ' SOBRA en el destino: ' + ', '.join(sobra))
    if falta:
        print(ROJO + ' FALTA en el destino: ' + ', '.join(falta))
    if not sobra and not falta:
        print(VERDE + ' el destino contiene EXACTAMENTE la lista medida')
    print('\n→ ' + VIVO)
    print('\nPara subirlo, desde Sitio-Web/:')
    print('   npx wrangler pages deploy --project-name=faro-digital --branch=main --commit-dirty=true')


if __name__ == '__main__':
    main()
