# -*- coding: utf-8 -*-
"""
BANCO DE LA VITRINA DE AURA · sesion 2
======================================
Mide /test/aura-vitrina/ contra las puertas del §3 del encargo, y guarda las
capturas del antes/despues.

TRES LECCIONES YA PAGADAS QUE MANDAN EN COMO SE MIDE:

  L-0029  El Chromium sin pantalla cae a SwiftShader: el shader se ejecuta en la
          CPU. Medir WebGL ahi no mide la pagina. El banco COMPRUEBA la GPU
          antes de creerse un solo numero, y se para si sale software.
  L-0035  El LCP y el pintado se miden con el CHROME INSTALADO, no con el
          Chromium que trae Playwright.
  L-0037  Con la ventana ocluida el navegador deja de pintar: 1 fps y capturas
          colgadas. bring_to_front() tras el goto, y UNA ventana a la vez.
  L-0040  En emulacion movil con ventana los numeros salen absurdos (86 s por
          fotograma). Movil se mide SIN ventana.

Y una de esta sesion, que aparecio a los cinco minutos: la primera lectura de
la costura dio 41/255 y la segunda 1/255. La calibracion del papel necesita
varios fotogramas para converger. **Una medida tomada antes de que la pagina se
asiente mide la pagina a medio hacer.** Por eso `asentar()` existe y se llama
antes de cada bloque de medidas.

Uso:
    python banco.py                 # todo: puertas + capturas + controles
    python banco.py --puertas       # solo las medidas del §3
    python banco.py --capturas      # solo 1440 y 390 + antes/despues
    python banco.py --controles     # solo los tres controles negativos
"""
import argparse, base64, gzip, json, os, re, sys, time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..'))
SALIDA = os.path.join(REPO, 'Renders', 'aura-s2')
URL = 'http://127.0.0.1:8777/test/aura-vitrina/'

VERDE, ROJO = '✅', '\U0001F534'


# ══════════════════════════════════════════════════════════════════════════
# 1 · PESO DE LA SECCION
#     Se mide EN GZIP y en disco. El servidor de pruebas no comprime, asi que
#     comprimir aqui y decirlo es mas honesto que leer `encodedBodySize` de un
#     servidor que no representa a Cloudflare.
# ══════════════════════════════════════════════════════════════════════════
def peso(pedidos):
    filas, crudo, gz = [], 0, 0
    for u in sorted(set(pedidos)):
        rel = u.split('/test/aura-vitrina/')[-1].split('?')[0]
        # La URL de la seccion acaba en '/': el archivo es index.html, y si no
        # se traduce aqui el HTML no entra en el peso. 13 KB que no se contaban.
        if rel == '':
            rel = 'index.html'
        f = os.path.join(RAIZ, rel.replace('/', os.sep))
        if not os.path.isfile(f):
            continue
        b = open(f, 'rb').read()
        g = len(gzip.compress(b, 9))
        filas.append((rel, len(b) / 1024, g / 1024))
        crudo += len(b); gz += g
    return filas, crudo / 1024, gz / 1024


# ══════════════════════════════════════════════════════════════════════════
# 2 · NAVEGADOR
# ══════════════════════════════════════════════════════════════════════════
def abrir(p, ancho=1440, alto=950, movil=False, con_ventana=None):
    """Chrome instalado. Con ventana en escritorio; SIN ventana en movil (L-0040)."""
    sin_ventana = (not con_ventana) if con_ventana is not None else movil
    nav = p.chromium.launch(channel='chrome', headless=sin_ventana,
                            args=['--force-color-profile=srgb',
                                  '--disable-features=CalculateNativeWinOcclusion'])
    ctx_args = dict(viewport={'width': ancho, 'height': alto}, device_scale_factor=1)
    if movil:
        ctx_args.update(is_mobile=True, has_touch=True, device_scale_factor=2,
                        user_agent='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36'
                                   ' (KHTML, like Gecko) Chrome/125 Mobile Safari/537.36')
    ctx = nav.new_context(**ctx_args)
    pg = ctx.new_page()
    pg.err = []
    pg.pedidos = []
    pg.on('pageerror', lambda e: pg.err.append('JS: ' + str(e)))
    pg.on('console', lambda m: pg.err.append('console.error: ' + m.text)
           if m.type == 'error' and 'favicon' not in m.text
           and 'Failed to load resource' not in m.text else None)
    pg.on('request', lambda r: pg.pedidos.append(r.url))
    pg.on('response', lambda r: pg.err.append('HTTP %d %s' % (r.status, r.url))
           if r.status >= 400 and not r.url.endswith('/favicon.ico') else None)
    # El 404 del favicon lo pide el navegador, no la pagina. Se filtra tambien
    # de la consola, y SOLO ese: el mensaje de consola no trae la URL, asi que
    # se cruza con la lista de respuestas para no callar un 404 de verdad.

    return nav, ctx, pg


def gpu_real(pg):
    return pg.evaluate("""() => { const c=document.createElement('canvas').getContext('webgl2');
        if(!c) return 'sin webgl2';
        const d=c.getExtension('WEBGL_debug_renderer_info');
        return d ? String(c.getParameter(d.UNMASKED_RENDERER_WEBGL)) : 'desconocido'; }""")


def esperar(pg, t=45000):
    pg.wait_for_function('window.AURA_LISTO === true', timeout=t)


def asentar(pg, fotogramas=30):
    """🔴 La calibracion del papel converge en varios fotogramas. Medir antes de
    que se asiente es medir la pagina a medio hacer: la primera lectura de la
    costura del 17-sep dio 41/255 y la siguiente 1/255, sin tocar nada."""
    pg.evaluate("""(n) => new Promise(ok => { let i = 0;
        const paso = () => (++i >= n) ? ok(true) : requestAnimationFrame(paso);
        requestAnimationFrame(paso); })""", fotogramas)


# ══════════════════════════════════════════════════════════════════════════
# 3 · MEDIDAS
# ══════════════════════════════════════════════════════════════════════════
JS_FPS = """(ms) => new Promise(ok => {
  const t = []; let fin = performance.now() + ms;
  const paso = (n) => { t.push(n); if (n < fin) requestAnimationFrame(paso);
    else { const d = []; for (let i=1;i<t.length;i++) d.push(t[i]-t[i-1]);
      d.sort((a,b)=>a-b);
      ok({ fps: +(1000/(d.reduce((a,b)=>a+b,0)/d.length)).toFixed(1),
           p95_ms: +d[Math.floor(d.length*0.95)].toFixed(1), n: d.length }); } };
  requestAnimationFrame(paso); })"""

JS_INP = """() => { window.__inp = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries())
      if (e.duration > window.__inp) window.__inp = e.duration; })
    .observe({ type: 'event', durationThreshold: 16, buffered: true });
  return true; }"""


def girar(pg, sel='#lienzo', pasos=26, dx=13, dy=2):
    """Un arrastre de raton sobre el lienzo: el gesto de giro de verdad."""
    caja = pg.query_selector(sel).bounding_box()
    x = caja['x'] + caja['width'] * 0.5
    y = caja['y'] + caja['height'] * 0.58
    pg.mouse.move(x, y)
    pg.mouse.down()
    for i in range(pasos):
        pg.mouse.move(x + dx * (i + 1), y + dy * (i + 1))
        pg.wait_for_timeout(16)
    pg.mouse.up()


def fps_fiable(pg, pasadas=3):
    """🔴 UNA SOLA PASADA DE FPS NO ES UNA MEDIDA.

    Medido el 17-sep sobre esta misma pagina, sin tocar una linea: ocho pasadas
    seguidas dieron de 37,1 a 47,7 (desviacion 3,1). Y peor: una tanda entera
    dio 41 de mediana con otras instancias de Chrome recien cerradas por el
    banco, y 60,1 un rato despues con la maquina quieta. Se llego a dar por
    ROJA una puerta que estaba verde, y a buscarle la causa en el encuadre —
    que no tenia nada que ver: alejar la camara un 19 % movio los fps 2, dentro
    del ruido.

        Un banco que lanza navegadores no puede medir fps justo despues de
        lanzarlos. Es [[L-0037]] un paso mas alla: no basta con una ventana a
        la vez, hace falta una MAQUINA a la vez.

    Asi que: mediana de tres pasadas, y el informe lleva el minimo y el maximo
    al lado. Si la horquilla se abre mas de 8 fps, el numero no vale y se dice.
    """
    v = []
    for _ in range(pasadas):
        v.append(pg.evaluate(JS_FPS, 1500))
        asentar(pg, 8)
    fps = sorted(x['fps'] for x in v)
    med = fps[len(fps) // 2]
    horquilla = fps[-1] - fps[0]
    return {'fps': med, 'min': fps[0], 'max': fps[-1], 'horquilla': round(horquilla, 1),
            'fiable': horquilla <= 8, 'pasadas': len(fps),
            'p95_ms': v[len(v) // 2]['p95_ms']}


def medir_puertas(p, args):
    res = {}
    nav, ctx, pg = abrir(p, 1440, 950)
    cdp = ctx.new_cdp_session(pg)

    # ── LCP con Chrome instalado (L-0035) ──────────────────────────────────
    pg.add_init_script("""window.__lcp = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
        .observe({ type: 'largest-contentful-paint', buffered: true });""")
    t0 = time.time()
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()                      # L-0037
    esperar(pg)
    pg.evaluate(JS_INP)
    asentar(pg)

    gpu = gpu_real(pg)
    res['gpu'] = gpu
    if 'SwiftShader' in gpu or 'software' in gpu.lower():
        print(ROJO + ' GPU = ' + gpu + '. TODO lo que siga seria falso (L-0029).')
        nav.close(); raise SystemExit(2)

    res['modo'] = pg.evaluate('window.AURA_MODO')
    res['lcp_ms'] = round(pg.evaluate('window.__lcp'))
    res['listo_ms'] = round((time.time() - t0) * 1000)
    res['papel'] = pg.evaluate('window.AURA.papelInforme')
    c = pg.evaluate('(() => { const c = window.AURA.costura(); return {peor: c.peor_desvio_255, donde: c.donde, n: c.puntos}; })()')
    res['costura'] = c
    res['etiquetas'] = pg.evaluate('window.AURA.etiquetaChk')

    # ── peso de la seccion ────────────────────────────────────────────────
    filas, crudo, gz = peso(pg.pedidos)
    res['peso'] = {'archivos': [{'f': f, 'kb': round(k, 1), 'gz': round(g, 1)} for f, k, g in filas],
                   'total_kb': round(crudo, 1), 'total_gz_kb': round(gz, 1)}

    # ── fps con CPU x4, en reposo y girando ───────────────────────────────
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    asentar(pg, 20)
    res['fps_reposo'] = fps_fiable(pg)

    # girando: se lanza el arrastre y se mide a la vez
    pg.evaluate("""() => { window.__m = null;
        const el = document.getElementById('lienzo');
        const r = el.getBoundingClientRect();
        const x = r.left + r.width/2, y = r.top + r.height*0.58;
        el.dispatchEvent(new PointerEvent('pointerdown', {pointerId:1, pointerType:'mouse', clientX:x, clientY:y, bubbles:true}));
        window.__gira = (i) => el.dispatchEvent(new PointerEvent('pointermove',
            {pointerId:1, pointerType:'mouse', clientX:x+i*9, clientY:y+i*1.5, bubbles:true}));
        window.__suelta = () => el.dispatchEvent(new PointerEvent('pointerup', {pointerId:1, pointerType:'mouse', bubbles:true}));
    }""")
    res['fps_girando'] = pg.evaluate("""(ms) => new Promise(ok => {
      const t = []; const fin = performance.now() + ms; let i = 0;
      const paso = (n) => { t.push(n); window.__gira(++i);
        if (n < fin) requestAnimationFrame(paso);
        else { window.__suelta();
          const d = []; for (let k=1;k<t.length;k++) d.push(t[k]-t[k-1]);
          d.sort((a,b)=>a-b);
          ok({ fps:+(1000/(d.reduce((a,b)=>a+b,0)/d.length)).toFixed(1),
               p95_ms:+d[Math.floor(d.length*0.95)].toFixed(1), n:d.length }); } };
      requestAnimationFrame(paso); })""", 1800)

    # ── INP: tocar una fila y girar, con la CPU aun a x4 ───────────────────
    pg.click('.fila[data-p="bruma"]')
    pg.wait_for_timeout(350)
    girar(pg, pasos=18)
    pg.wait_for_timeout(500)
    res['inp_ms'] = round(pg.evaluate('window.__inp'), 1)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})

    # 🔴 LOS PARAMETROS QUE SE GUARDAN SON LOS APLICADOS, NO LOS ESCRITOS.
    #    Copiar familia.json a parametros-materiales.json seria guardar la
    #    intencion. Lo que permite reconstruir un render —y lo que delata una
    #    deriva entre el JSON y lo que three.js acabo poniendo— es leer los
    #    materiales de la escena viva.
    par = pg.evaluate("""() => { const v = window.AURA, out = {
        fecha: new Date().toISOString().slice(0,19),
        three: (window.__THREE_REV__ || 'r185'),
        papel: v.papelInforme, camara: v.cfg.camara, entorno: v.cfg.entorno,
        luz: v.cfg.luz, movimiento: window.AURA_MOV, frascos: {} };
      for (const id in v.frascos) {
        const c = v.frascos[id], f = c.userData.frasco, ms = {};
        f.traverse(o => { if (!o.isMesh) return;
          const m = o.material, b = m.userData.base || {};
          ms[o.name] = { color: '#' + (b.col || m.color).getHexString(),
            transmission: m.transmission, thickness: m.thickness, ior: m.ior,
            roughness: +m.roughness.toFixed(3), metalness: +m.metalness.toFixed(3),
            clearcoat: m.clearcoat, clearcoatRoughness: m.clearcoatRoughness,
            attenuationColor: m.attenuationColor ? '#' + m.attenuationColor.getHexString() : null,
            attenuationDistance: m.attenuationDistance,
            envMapIntensity: b.env !== undefined ? b.env : m.envMapIntensity,
            opacity: m.opacity, transparent: m.transparent,
            triangulos: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count)/3 };
        });
        out.frascos[id] = { producto: c.userData.def.nombre, volumen: c.userData.def.volumen,
          origen: c.userData.def.archivo, credito: c.userData.def.credito,
          alto_cm: +f.userData.alto.toFixed(3), radio_cm: +f.userData.radio.toFixed(3),
          nivel_liquido: c.userData.def.nivel_liquido,
          etiqueta: Object.assign({}, c.userData.def.etiqueta, {comprobacion: v.etiquetaChk[id]}),
          materiales: ms };
      }
      return out; }""")
    with open(os.path.join(RAIZ, 'parametros-materiales.json'), 'w', encoding='utf-8') as f:
        json.dump(par, f, ensure_ascii=False, indent=2)
    res['parametros'] = 'parametros-materiales.json escrito desde la escena viva'

    res['errores'] = pg.err[:12]
    res['aviso_pagina'] = pg.evaluate('window.AURA.aviso')
    nav.close()
    return res


# ══════════════════════════════════════════════════════════════════════════
# 3-BIS · LA INTERACCION
#     🔴 ESTO NO SE PUEDE MEDIR EN UN PANEL DE VISTA PREVIA. El panel del
#     navegador integrado devuelve `document.hidden === true` con la pagina
#     DELANTE, asi que el bucle de render se para —correctamente— y el banco
#     lee «0 fotogramas» y canta una pieza rota que no lo esta. Es L-0040 otra
#     vez: un numero absurdo es del medidor hasta que se demuestre lo
#     contrario. Con Chrome instalado y ventana al frente, hidden es false.
# ══════════════════════════════════════════════════════════════════════════
JS_GESTOS = """() => new Promise(async ok => {
  const v = window.AURA, el = document.getElementById('lienzo');
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width*0.5, cy = r.top + r.height*0.62;
  const ev = (t,o,id,tipo) => el.dispatchEvent(new PointerEvent(t,
      Object.assign({pointerId:id||1, pointerType:tipo||'mouse', bubbles:true}, o)));
  const esperar = ms => new Promise(k => setTimeout(k, ms));
  const out = { bucle: window.AURA_BUCLE() };

  // A · azimut sin limite
  v.giro.az = 0;
  ev('pointerdown',{clientX:cx,clientY:cy});
  for (let i=1;i<=40;i++) ev('pointermove',{clientX:cx+i*14,clientY:cy});
  ev('pointerup',{});
  out.az_40_pasos = +(v.giro.az*180/Math.PI).toFixed(0);

  // B · vuelve a reposo por el camino corto
  await esperar(5200);
  out.az_tras_5s = +(v.giro.az*180/Math.PI).toFixed(2);
  out.volvio_a_reposo = Math.abs(v.giro.az) < 0.05 && Math.abs(v.giro.incl) < 0.05;

  // C · topes en polar
  ev('pointerdown',{clientX:cx,clientY:cy});
  for (let i=1;i<=80;i++) ev('pointermove',{clientX:cx,clientY:cy+i*14});
  ev('pointerup',{}); v.paso(performance.now());
  out.polar_min = +(90 - 9 - v.giro.incl*180/Math.PI).toFixed(1);
  ev('pointerdown',{clientX:cx,clientY:cy});
  for (let i=1;i<=160;i++) ev('pointermove',{clientX:cx,clientY:cy-i*14});
  ev('pointerup',{}); v.paso(performance.now());
  out.polar_max = +(90 - 9 - v.giro.incl*180/Math.PI).toFixed(1);
  v.giro.az = v.giro.incl = 0; v.paso(performance.now());

  // D · solo gira el elegido
  const rot = {}; for (const id in v.frascos)
    rot[id] = +(v.frascos[id].userData.frasco.rotation.y*180/Math.PI).toFixed(2);
  out.sel = v.sel;
  out.solo_gira_el_elegido = Object.keys(rot).every(id =>
    id === v.sel || Math.abs(rot[id]) < 0.01);

  // E · TACTIL. Cuatro casos, y los tres primeros tienen que dar CERO.
  const tactil = (dx, dy, x0, y0, id) => { v.giro.az = 0; v.giro.incl = 0;
    ev('pointerdown',{clientX:x0,clientY:y0},id,'touch');
    for (let i=1;i<=12;i++) ev('pointermove',{clientX:x0+i*dx, clientY:y0+i*dy},id,'touch');
    ev('pointerup',{},id,'touch');
    return +(Math.abs(v.giro.az)+Math.abs(v.giro.incl)).toFixed(3); };
  out.t_vertical_sobre_el_frasco = tactil(2, 22, cx, cy, 30);
  out.t_horizontal_fuera_del_frasco = tactil(22, 2, r.left+10, r.top+10, 31);
  // dos dedos
  v.giro.az = 0; v.giro.incl = 0;
  ev('pointerdown',{clientX:cx,clientY:cy},40,'touch');
  ev('pointerdown',{clientX:cx+60,clientY:cy},41,'touch');
  for (let i=1;i<=12;i++) ev('pointermove',{clientX:cx+i*22,clientY:cy},40,'touch');
  ev('pointerup',{},40,'touch'); ev('pointerup',{},41,'touch');
  out.t_dos_dedos = +(Math.abs(v.giro.az)*180/Math.PI).toFixed(2);
  // control POSITIVO: horizontal sobre el frasco SI gira. Sin esto, los tres
  // ceros de arriba los firma igual una pieza que no escucha nada (L-0052).
  out.t_horizontal_sobre_el_frasco = tactil(22, 2, cx, cy, 42);

  v.giro.az = v.giro.incl = 0;
  ok(out);
})"""


def medir_gestos(p):
    nav, ctx, pg = abrir(p, 1440, 950)
    pg.goto(URL, wait_until='load')
    pg.bring_to_front()
    esperar(pg)
    asentar(pg)
    r = pg.evaluate(JS_GESTOS)
    r['errores'] = pg.err[:6]
    nav.close()
    return r


def medir_movil(p):
    """L-0040: SIN ventana. Y la prueba que de verdad importa: que el scroll
    nunca se bloquee, ni siquiera en mitad de un giro."""
    res = {}
    nav, ctx, pg = abrir(p, 390, 844, movil=True)
    pg.goto(URL, wait_until='load')
    esperar(pg)
    asentar(pg)
    res['modo'] = pg.evaluate('window.AURA_MODO')
    res['touch_action'] = pg.evaluate(
        "() => getComputedStyle(document.getElementById('lienzo')).touchAction")

    # hay que poder desplazar: la pagina tiene que ser mas alta que la ventana
    pg.evaluate("() => { document.body.style.paddingBottom = '1400px'; }")

    # ── el scroll, DURANTE un giro ────────────────────────────────────────
    caja = pg.query_selector('#lienzo').bounding_box()
    cx, cy = caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] * 0.6
    pg.touchscreen.tap(cx, cy)          # asegura seleccion
    pg.wait_for_timeout(400)
    antes = pg.evaluate('window.scrollY')
    # gesto horizontal (giro) y, sin soltar del todo, rueda vertical
    pg.evaluate("""([x,y]) => { const el=document.getElementById('lienzo');
        el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
        for (let i=1;i<=8;i++) el.dispatchEvent(new PointerEvent('pointermove',
            {pointerId:7,pointerType:'touch',clientX:x+i*12,clientY:y,bubbles:true}));
    }""", [cx, cy])
    pg.mouse.wheel(0, 520)
    pg.wait_for_timeout(450)
    res['scroll_durante_giro'] = {'antes': antes, 'despues': pg.evaluate('window.scrollY')}
    res['scroll_se_movio'] = res['scroll_durante_giro']['despues'] > antes + 50
    pg.evaluate("""() => document.getElementById('lienzo').dispatchEvent(
        new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',bubbles:true}))""")

    # ── scroll vertical normal sobre el lienzo ────────────────────────────
    pg.evaluate('window.scrollTo(0,0)')
    pg.wait_for_timeout(250)
    antes = pg.evaluate('window.scrollY')
    pg.mouse.move(cx, cy)
    pg.mouse.wheel(0, 700)
    pg.wait_for_timeout(450)
    res['scroll_vertical'] = {'antes': antes, 'despues': pg.evaluate('window.scrollY')}
    res['scroll_vertical_ok'] = res['scroll_vertical']['despues'] > antes + 100
    res['errores'] = pg.err[:8]
    nav.close()
    return res


# ══════════════════════════════════════════════════════════════════════════
# 4 · CONTROLES NEGATIVOS (L-0052)
#     Una comprobacion que solo se prueba con el caso que pasa no se ha
#     probado. Cada uno de estos TIENE que salir peor o fallar.
# ══════════════════════════════════════════════════════════════════════════
def controles(p):
    out = {}
    os.makedirs(SALIDA, exist_ok=True)

    # (a) sin sombra de contacto: el frasco debe FLOTAR, y se guarda la prueba
    nav, ctx, pg = abrir(p, 1100, 700)
    pg.goto(URL, wait_until='load'); pg.bring_to_front(); esperar(pg); asentar(pg)
    pg.screenshot(path=os.path.join(SALIDA, 'control-con-sombra.png'), clip=_clip(pg))
    pg.evaluate("""() => { for (const id in window.AURA.frascos) {
        const d = window.AURA.frascos[id].userData.frasco.userData.calcos;
        d.userData.sombra.visible = false; d.userData.caustica.visible = false; } }""")
    asentar(pg, 10)
    pg.screenshot(path=os.path.join(SALIDA, 'control-sin-sombra.png'), clip=_clip(pg))
    out['sombra'] = 'control-con-sombra.png / control-sin-sombra.png guardadas'
    nav.close()

    # (b) sin touch-action: el scroll TIENE que bloquearse. Si no se bloquea,
    #     la regla no esta haciendo nada y el verde de arriba no vale.
    nav, ctx, pg = abrir(p, 390, 844, movil=True)
    pg.goto(URL, wait_until='load'); esperar(pg); asentar(pg)
    pg.evaluate("""() => { document.body.style.paddingBottom='1400px';
        document.getElementById('lienzo').style.touchAction='none';
        /* y ademas se traga el gesto, que es lo que pasaria de verdad si el
           canvas capturara todos los punteros */
        document.getElementById('lienzo').addEventListener('wheel', e => e.preventDefault(), {passive:false});
        document.getElementById('lienzo').addEventListener('touchmove', e => e.preventDefault(), {passive:false}); }""")
    caja = pg.query_selector('#lienzo').bounding_box()
    pg.evaluate('window.scrollTo(0,0)')
    antes = pg.evaluate('window.scrollY')
    pg.mouse.move(caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] / 2)
    pg.mouse.wheel(0, 700)
    pg.wait_for_timeout(420)
    despues = pg.evaluate('window.scrollY')
    out['sin_touch_action'] = {'antes': antes, 'despues': despues,
                               'se_bloqueo': despues <= antes + 10}
    nav.close()

    # (c) presupuesto de peso con los GLB sin comprimir
    crudo = os.path.join(RAIZ, 'modelos', '_control')
    if os.path.isdir(crudo):
        kb = sum(os.path.getsize(os.path.join(crudo, f)) for f in os.listdir(crudo)) / 1024
        gz = sum(len(gzip.compress(open(os.path.join(crudo, f), 'rb').read(), 9))
                 for f in os.listdir(crudo)) / 1024
        out['glb_sin_comprimir'] = {'kb': round(kb, 1), 'gz_kb': round(gz, 1)}
    return out


def _clip(pg):
    b = pg.query_selector('#estante').bounding_box()
    return {'x': b['x'], 'y': b['y'], 'width': b['width'], 'height': b['height']}


# ══════════════════════════════════════════════════════════════════════════
# 5 · CAPTURAS
# ══════════════════════════════════════════════════════════════════════════
def capturas(p):
    os.makedirs(SALIDA, exist_ok=True)
    hechas = []
    for ancho, alto, movil, etq in ((1440, 950, False, '1440'), (390, 844, True, '390')):
        nav, ctx, pg = abrir(p, ancho, alto, movil=movil)
        pg.goto(URL, wait_until='load')
        if not movil:
            pg.bring_to_front()
        esperar(pg)
        asentar(pg, 40)
        # 🔴 «reposo» tiene que ser reposo DE VERDAD. La pagina arranca con ALBA
        #    elegido, asi que capturar sin tocar nada daba una foto titulada
        #    «reposo» que era en realidad «ALBA elegido» — y las dos capturas del
        #    antes/despues del 17-sep salieron practicamente iguales por eso.
        #    Un estado no es el que dice el nombre del archivo: es el que se pone.
        for estado, quien in (('reposo', None), ('serum', 'serum')):
            pg.evaluate('(id) => window.AURA_ELEGIR(id)', quien)
            asentar(pg, 45)          # que termine la transicion de 600 ms
            f = os.path.join(SALIDA, 'vitrina-%s-%s.png' % (estado, etq))
            pg.screenshot(path=f, clip=_clip(pg))
            hechas.append(os.path.basename(f))
        # la seccion entera
        f = os.path.join(SALIDA, 'seccion-%s.png' % etq)
        pg.screenshot(path=f, clip=_clip_seccion(pg))
        hechas.append(os.path.basename(f))
        # 🔴 Y EL BLOQUE `.vitrina` SUELTO, que es lo que se compara en el
        #    antes/despues. La captura del 17-sep es el bloque `.vitrina` del
        #    caso vivo; ponerla al lado de una SECCION entera compara dos
        #    encuadres, no dos vitrinas, y la nueva sale pequena por el
        #    reescalado. Lo que se compara tiene que ser lo mismo.
        pg.evaluate('() => window.AURA_ELEGIR(null)')
        asentar(pg, 40)
        f = os.path.join(SALIDA, 'bloque-%s.png' % etq)
        b = pg.query_selector('.vitrina').bounding_box()
        # 6 px de margen: el glifo del euro sobresale de la caja del elemento y
        # sin margen la captura lo corta justo por la mitad.
        pg.screenshot(path=f, clip={'x': max(0, b['x'] - 6), 'y': max(0, b['y'] - 6),
                                    'width': b['width'] + 12, 'height': b['height'] + 12})
        hechas.append(os.path.basename(f))
        nav.close()
    return hechas


def _clip_seccion(pg):
    b = pg.query_selector('#seccion').bounding_box()
    return {'x': max(0, b['x'] - 8), 'y': max(0, b['y'] - 8),
            'width': b['width'] + 16, 'height': b['height'] + 16}


# ══════════════════════════════════════════════════════════════════════════
def tabla(r, m, g=None):
    """Las puertas del §3, con su valor real al lado. Una fila por puerta."""
    P = []
    pz = r['peso']['total_gz_kb']
    P.append(('Peso de la seccion (gzip)', '<= 1400 KB', '%.1f KB' % pz, pz <= 1400))
    P.append(('  ... y en disco', '(informativo)', '%.1f KB' % r['peso']['total_kb'], None))
    P.append(('LCP', '<= 2500 ms', '%d ms' % r['lcp_ms'], r['lcp_ms'] <= 2500))
    fr = r['fps_reposo']
    P.append(('fps CPU x4 · reposo (mediana de %d)' % fr.get('pasadas', 1), '>= 55',
              '%.1f  [%.1f-%.1f]' % (fr['fps'], fr.get('min', fr['fps']), fr.get('max', fr['fps'])),
              fr['fps'] >= 55 and fr.get('fiable', True)))
    P.append(('fps CPU x4 · girando', '>= 55', '%.1f' % r['fps_girando']['fps'], r['fps_girando']['fps'] >= 55))
    P.append(('INP tocando y girando', '<= 200 ms', '%.1f ms' % r['inp_ms'], r['inp_ms'] <= 200))
    if m:
        P.append(('Movil · scroll vertical sobre el lienzo', 'se mueve',
                  '%d -> %d px' % (m['scroll_vertical']['antes'], m['scroll_vertical']['despues']),
                  m['scroll_vertical_ok']))
        P.append(('Movil · scroll DURANTE un giro', 'se mueve',
                  '%d -> %d px' % (m['scroll_durante_giro']['antes'], m['scroll_durante_giro']['despues']),
                  m['scroll_se_movio']))
        P.append(('Movil · touch-action del lienzo', 'pan-y', m['touch_action'],
                  m['touch_action'] == 'pan-y'))
    if g:
        P.append(('Bucle corriendo (pagina delante)', 'si',
                  str(g['bucle']['corriendo']), g['bucle']['corriendo'] is True))
        P.append(('Azimut libre', 'sin limite', '%d grados' % g['az_40_pasos'], abs(g['az_40_pasos']) > 360))
        P.append(('Polar, tope inferior', '15 grados', '%s' % g['polar_min'], abs(g['polar_min'] - 15) < 0.6))
        P.append(('Polar, tope superior', '100 grados', '%s' % g['polar_max'], abs(g['polar_max'] - 100) < 0.6))
        P.append(('Vuelve a reposo a los 3 s', 'si', '%s grados' % g['az_tras_5s'], g['volvio_a_reposo']))
        P.append(('Solo gira el elegido', 'si', str(g['solo_gira_el_elegido']), g['solo_gira_el_elegido']))
        P.append(('Tactil vertical sobre el frasco', 'NO gira', str(g['t_vertical_sobre_el_frasco']),
                  g['t_vertical_sobre_el_frasco'] == 0))
        P.append(('Tactil horizontal fuera del frasco', 'NO gira', str(g['t_horizontal_fuera_del_frasco']),
                  g['t_horizontal_fuera_del_frasco'] == 0))
        P.append(('Tactil a dos dedos', 'NO gira', str(g['t_dos_dedos']), g['t_dos_dedos'] == 0))
        P.append(('  control +: tactil horizontal SI gira', '> 0', str(g['t_horizontal_sobre_el_frasco']),
                  g['t_horizontal_sobre_el_frasco'] > 0))
    P.append(('Costura lienzo/pagina (12 bordes)', '<= 2/255',
              '%s/255' % r['costura']['peor'], r['costura']['peor'] <= 2))
    P.append(('Papel medido en el lienzo', '#F5EFE4',
              '%s (desvio %s/255)' % (r['papel']['leido'], r['papel']['desvio_255']),
              r['papel']['desvio_255'] <= 2))
    P.append(('Emisiva del papel', '<= 0,05 (L-0068)', str(r['papel']['emisiva']),
              r['papel']['emisiva'] <= 0.05))
    return P


def imprimir(P):
    print('\n' + '=' * 78)
    print('%-42s %-14s %-14s' % ('PUERTA', 'META', 'REAL'))
    print('=' * 78)
    fallos = 0
    for nombre, meta, real, ok in P:
        marca = '' if ok is None else ('  ' + (VERDE if ok else ROJO))
        if ok is False:
            fallos += 1
        print('%-42s %-14s %-14s%s' % (nombre[:42], meta, real, marca))
    print('=' * 78)
    print(('TODAS EN VERDE' if not fallos else '%d PUERTA(S) EN ROJO' % fallos))
    return fallos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--puertas', action='store_true')
    ap.add_argument('--capturas', action='store_true')
    ap.add_argument('--controles', action='store_true')
    args = ap.parse_args()
    todo = not (args.puertas or args.capturas or args.controles)
    os.makedirs(SALIDA, exist_ok=True)
    from playwright.sync_api import sync_playwright

    salida = {}
    with sync_playwright() as p:
        if todo or args.puertas:
            print('─ puertas, escritorio 1440 (Chrome instalado, con ventana) ─')
            r = medir_puertas(p, args)
            print('  GPU: ' + r['gpu'])
            print('─ movil 390 (SIN ventana, L-0040) ─')
            m = medir_movil(p)
            print('- gestos, escritorio (Chrome con ventana: hidden=false) -')
            g = medir_gestos(p)
            salida['escritorio'], salida['movil'], salida['gestos'] = r, m, g
            fallos = imprimir(tabla(r, m, g))
            salida['fallos'] = fallos
            if r['errores']:
                print('\n' + ROJO + ' errores de pagina:')
                for e in r['errores']:
                    print('   ', e)
        if todo or args.controles:
            print('\n─ controles negativos (L-0052) ─')
            c = controles(p)
            salida['controles'] = c
            if 'sin_touch_action' in c:
                ok = c['sin_touch_action']['se_bloqueo']
                print('  sin touch-action, el scroll SE BLOQUEA: %s %s'
                      % (ok, VERDE if ok else ROJO + ' (la regla no hace nada)'))
            if 'glb_sin_comprimir' in c:
                print('  GLB sin comprimir: %.1f KB (gz %.1f) — contra 104 KB comprimidos'
                      % (c['glb_sin_comprimir']['kb'], c['glb_sin_comprimir']['gz_kb']))
            print('  ' + str(c.get('sombra', '')))
        if todo or args.capturas:
            print('\n─ capturas ─')
            for f in capturas(p):
                print('  ' + f)

    # 🔴 UN MODO SUELTO NO PUEDE BORRAR LO QUE MIDIO EL OTRO. `--puertas`
    #    escribia banco.json entero y se llevaba por delante los controles
    #    negativos medidos diez minutos antes; luego `--controles` hacia lo
    #    mismo con las puertas. El informe siempre tenia la mitad, y la mitad
    #    que faltaba era justo la que no se acababa de mirar.
    ruta = os.path.join(SALIDA, 'banco.json')
    previo = {}
    if os.path.isfile(ruta):
        try:
            previo = json.load(open(ruta, encoding='utf-8'))
        except Exception:
            previo = {}
    previo.update(salida)
    previo['fecha'] = time.strftime('%Y-%m-%d %H:%M')
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(previo, f, ensure_ascii=False, indent=2)
    print('\n→ ' + os.path.join(SALIDA, 'banco.json'))


if __name__ == '__main__':
    main()
