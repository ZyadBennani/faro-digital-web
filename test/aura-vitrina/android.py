# -*- coding: utf-8 -*-
"""
ANDROID REAL · la puerta que la emulacion no puede cerrar
=========================================================
La emulacion movil de Chrome comparte el motor pero NO el compositor de Android
ni su gestion de gestos — y la gestion de gestos es justo lo que esta pieza pone
a prueba: que el scroll de la pagina no se bloquee nunca. Por eso esta puerta
existe aparte y no se da por buena con la emulacion.

QUE HACE FALTA (y a dia de 18-sep-2026 falta el ultimo punto):
  1. `adb` instalado                           ✅ platform-tools 37.0.1
  2. un movil Android con depuracion USB       ⬜ ninguno conectado
  3. el movil y este PC en la misma red, o `adb reverse` para llegar al 8777

COMO SE CORRE, con el movil enchufado y la depuracion USB dada:
    python -m http.server 8777 --bind 0.0.0.0      (desde faro-digital-web/)
    python android.py

QUE MIDE, y por que cada cosa:
  · que el scroll de la pagina se mueve con un gesto vertical SOBRE el lienzo
  · que se mueve tambien EN MITAD de un giro — el caso que rompe las piezas 3D
  · fps reales del dispositivo mientras se gira
  · el control negativo: quitando `touch-action`, el scroll TIENE que bloquearse.
    Sin ese control, los dos verdes de arriba los firma igual una pagina que no
    escucha nada (L-0052).
"""
import json, os, subprocess, sys, time
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.abspath(os.path.join(RAIZ, '..', '..')), 'Renders', 'aura-s3')
PUERTO = 8777
RUTA = '/test/aura-vitrina/'
ROJO, VERDE = '\U0001F534', '✅'

CANDIDATOS_ADB = [
    os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\WinGet\Packages'
                       r'\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe'
                       r'\platform-tools\adb.exe'),
    os.path.expandvars(r'%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe'),
    'adb',
]


def buscar_adb():
    for c in CANDIDATOS_ADB:
        try:
            r = subprocess.run([c, 'version'], capture_output=True, timeout=25)
            if r.returncode == 0:
                return c
        except Exception:
            continue
    return None


def main():
    adb = buscar_adb()
    if not adb:
        print(ROJO + ' adb no esta instalado.')
        print('   winget install --id Google.PlatformTools')
        raise SystemExit(1)
    print('adb: ' + adb)

    sal = subprocess.run([adb, 'devices'], capture_output=True, text=True, timeout=40).stdout
    equipos = [l.split('\t')[0] for l in sal.splitlines()[1:]
               if l.strip() and l.strip().endswith('device')]
    if not equipos:
        print(ROJO + ' adb funciona pero NO HAY NINGUN MOVIL CONECTADO.')
        print('   La puerta de Android real queda ABIERTA, y no se da por buena')
        print('   con la emulacion: comparte el motor, no el compositor ni los gestos.')
        print('   Para cerrarla:')
        print('     1. enchufar el movil por USB')
        print('     2. Ajustes > Opciones de desarrollador > Depuracion por USB')
        print('     3. aceptar la huella en la pantalla del movil')
        print('     4. volver a correr `python android.py`')
        with open(os.path.join(SALIDA, 'android.json'), 'w', encoding='utf-8') as f:
            json.dump({'estado': 'sin dispositivo', 'adb': adb,
                       'fecha': time.strftime('%Y-%m-%d %H:%M')}, f, ensure_ascii=False, indent=2)
        raise SystemExit(2)

    equipo = equipos[0]
    modelo = subprocess.run([adb, '-s', equipo, 'shell', 'getprop', 'ro.product.model'],
                            capture_output=True, text=True, timeout=30).stdout.strip()
    print('movil: %s (%s)' % (modelo, equipo))

    # `adb reverse` hace que el 8777 del movil salga a este PC: no hace falta
    # que esten en la misma wifi, ni abrir el puerto a la red.
    subprocess.run([adb, '-s', equipo, 'reverse', 'tcp:%d' % PUERTO, 'tcp:%d' % PUERTO],
                   capture_output=True, timeout=40)

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        nav = p.chromium.connect_over_cdp('http://127.0.0.1:9222') \
            if os.environ.get('AURA_CDP') else None
        if nav is None:
            print('\nAbre Chrome en el movil en:  http://localhost:%d%s' % (PUERTO, RUTA))
            print('y luego, en este PC:  AURA_CDP=1 python android.py')
            print('(el puente de depuracion remota se abre con:')
            print('  %s -s %s forward tcp:9222 localabstract:chrome_devtools_remote)' % (adb, equipo))
            raise SystemExit(0)
        pg = nav.contexts[0].pages[0]
        pg.wait_for_function('window.AURA_LISTO === true', timeout=60000)
        res = {'modelo': modelo, 'serie': equipo, 'modo': pg.evaluate('window.AURA_MODO')}
        res['touch_action'] = pg.evaluate(
            "() => getComputedStyle(document.getElementById('lienzo')).touchAction")
        print(json.dumps(res, ensure_ascii=False, indent=2))
        with open(os.path.join(SALIDA, 'android.json'), 'w', encoding='utf-8') as f:
            json.dump(res, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
