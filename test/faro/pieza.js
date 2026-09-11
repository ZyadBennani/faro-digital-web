/* `/test/faro` · LA PIEZA FIRMA v3 · fila B16 · Fable 5.1 · 10-sep-2026
 *
 * Motivo: pieza firma del faro, v3. Sustituye el scrub por dos bucles reales en
 * reproducción continua; el scroll solo manda la intensidad. El diagnóstico de
 * la v2.4 (DIAGNOSTICO-v2.4.md) probó que el scrub no es reparable a 60 fps:
 * seeking→seeked 3 ms, pero seeked→fotograma pintado 315 ms p50 / 2.326 p95, y
 * 25 de 242 fotogramas pintados en la bajada lenta. Se elimina, no se optimiza.
 *
 * QUÉ ES LA V3
 *   · FONDO FIJO de toda la página: el lienzo vive en `.escena-fondo` (fixed,
 *     inset 0, detrás de <main>) a cualquier ancho. La página scrollea encima.
 *   · DOS BUCLES, no una cadena: `calma` y `tormenta` (4 s cada uno, costura
 *     fundida con xfade; salto medido 0,31 % y 0,35 %). Dos <video> muted,
 *     playsinline, loop, autoplay, en reproducción continua desde load + 300 ms.
 *     Nunca se usa currentTime como control.
 *   · MEZCLA EN EL LIENZO (2D, sin shader): cada fotograma nuevo, drawImage(calma)
 *     y encima drawImage(tormenta) con globalAlpha = mezcla, y ENCIMA DE LOS DOS el
 *     recorte de la foto con el mar transparente (alfa = 1 − máscara): la piedra,
 *     la torre y el cielo tapan el vídeo, y cualquier resto de pluma funde piedra
 *     → vídeo, nunca mar fijo + mar móvil (v3-corr, paso 2). La máscara
 *     (`mascara-w.png`, 1600×912) es dura y erodida 6 px, con pluma de 24 px
 *     solo en el horizonte (paso 1). Solo se repinta el rectángulo del mar, y
 *     solo cuando hay fotograma nuevo (requestVideoFrameCallback) o la mezcla
 *     ha cambiado. Desplazamiento vídeo ↔ foto medido en la base de la torre:
 *     0 px (paso 3); el vídeo se pinta con el mismo cover que la foto.
 *   · CONTROL: mezcla ← progreso de scroll de todo el documento (0 arriba, 1 en
 *     el pie) con la curva `suave` y lerp 0,06 por fotograma, nunca directo. Sin
 *     scroll, el mar sigue vivo en el bucle que toque. El puntero no hace nada.
 *   · MÓVIL (< 768 px): un solo bucle (`calma-m`, 540×720) como <video> fijo
 *     detrás de la página, y el scroll manda solo un oscurecido lineal de 0 a
 *     25 % (`.mar-velo`). Un decodificador, no dos. Sin lienzo.
 *
 * CONTRATO DE ESCENA: DPR ≤ 1,5 · rAF y vídeos en pausa con la pestaña oculta
 * (el lienzo es fijo: no hay IntersectionObserver de sección) · con
 * prefers-reduced-motion este archivo no hace nada y queda el poster (el
 * primer fotograma exacto del bucle de calma) · sin canvas 2D o primer frame
 * > 80 ms → poster · arranque después del LCP (load + 300 ms).
 *
 * PROHIBIDO (y cumplido): scrub, currentTime como control, shader, librerías,
 * tocar el copy, partículas o niebla, más de 1,2 MB, mover el faro. */
(function () {
  'use strict';

  var canvas = document.querySelector('.pieza');
  var fondo = document.querySelector('.escena-fondo');
  if (!canvas || !fondo) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var movil = matchMedia('(max-width: 767px)');
  var LERP = 0.06;             // la inercia de la mezcla, por fotograma
  var VELO_MAX = 0.25;         // móvil: oscurecido máximo en el pie
  var ARRANQUE_MS = 300;       // después de `load`, es decir, después del LCP

  /* ---------- La escena de escritorio: la foto y la máscara, medidas en direccion-arte.md ---------- */
  var ESC = { tex: 'media/faro-w.webp', mask: 'media/mascara-w.png', tw: 1600, th: 912, anclaY: 0.60 };
  var VW = 1280, VH = 728;     // los bucles: mismo encuadre que la foto (uvVídeo = uvFoto, medido en la v2.1)

  /* ---------- Estado ---------- */
  var ctx = null, foto = null, recorte = null;             // `recorte`: la foto con el mar transparente
  var vivo = false, listo = false, visible = !document.hidden, raf = 0;
  var videos = null, formato = null, modo = null;
  var mezcla = 0, objetivo = 0, forzada = null, nuevo = true, pintados = 0, cuadros = 0;
  var caja = { sx: 0, sy: 0, sw: ESC.tw, sh: ESC.th };    // el rectángulo del mar, en píxeles de la FOTO (por la máscara)
  var OFFSET = { x: 0, y: 0 };                            // v3-corr paso 3: desplazamiento vídeo ↔ foto medido, en px de vídeo
  var geo = { W: 0, H: 0, ox: 0, oy: 0, dw: 0, dh: 0 };   // cover de la foto en el lienzo

  function suave(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  function progreso() {
    var fin = document.documentElement.scrollHeight - window.innerHeight;
    return fin > 0 ? Math.min(Math.max(window.scrollY / fin, 0), 1) : 0;
  }
  function cargar(src) {
    return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; });
  }
  function apagar(motivo) {
    vivo = false;
    canvas.classList.remove('viva');
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (videos) videos.forEach(function (v) { v.pause(); });
    canvas.setAttribute('data-pieza', motivo);
  }

  /* ---------- Los <video> ---------- */
  function crearVideo(nombre) {
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('loop', ''); v.setAttribute('aria-hidden', 'true');
    v.tabIndex = -1; v.className = 'mar-video'; v.width = VW; v.height = VH;
    v.src = 'media/olas/' + nombre + '.' + formato;
    v.addEventListener('error', function () { apagar('video:' + nombre); });
    /* un fotograma nuevo del bucle → hay que repintar el mar */
    if ('requestVideoFrameCallback' in v) {
      var cb = function () { nuevo = true; v._fotogramas = (v._fotogramas || 0) + 1; v.requestVideoFrameCallback(cb); };
      v.requestVideoFrameCallback(cb);
    } else { v._sinRVFC = true; }
    fondo.querySelector('.escena-zoom').appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay silenciado: no debería fallar */ });
    return v;
  }

  /* ---------- Medir: cover de la foto con el mismo anclaje que el poster (50 % / 60 %) ---------- */
  function medir() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = fondo.getBoundingClientRect();
    var W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    var s = Math.max(W / ESC.tw, H / ESC.th);
    var dw = ESC.tw * s, dh = ESC.th * s;
    geo = { W: W, H: H, ox: (W - dw) * 0.5, oy: (H - dh) * ESC.anclaY, dw: dw, dh: dh };
    ctx.drawImage(foto, geo.ox, geo.oy, geo.dw, geo.dh);        // la foto entera, una vez; luego solo el mar
    nuevo = true;
  }

  /* ---------- Pintar: solo el rectángulo del mar, y en este orden: calma, tormenta
     encima con la mezcla, y la piedra (el recorte de la foto) encima de los dos ---------- */
  function pintar() {
    var A = videos[0], B = videos[1];
    if (A.readyState < 2) return false;
    var kx = geo.dw / ESC.tw, ky = geo.dh / ESC.th;                  // foto → lienzo
    var dx = geo.ox + caja.sx * kx, dy = geo.oy + caja.sy * ky, dw = caja.sw * kx, dh = caja.sh * ky;
    var vx = caja.sx / ESC.tw * VW + OFFSET.x, vy = caja.sy / ESC.th * VH + OFFSET.y, vw = caja.sw / ESC.tw * VW, vh = caja.sh / ESC.th * VH;   // el mismo rectángulo, en píxeles de vídeo
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(A, vx, vy, vw, vh, dx, dy, dw, dh);
    if (mezcla > 0.001 && B.readyState >= 2) { ctx.globalAlpha = mezcla; ctx.drawImage(B, vx, vy, vw, vh, dx, dy, dw, dh); ctx.globalAlpha = 1; }
    ctx.drawImage(recorte, caja.sx, caja.sy, caja.sw, caja.sh, dx, dy, dw, dh);
    pintados++;
    return true;
  }

  /* ---------- El bucle ---------- */
  function marco() {
    raf = 0;
    if (!vivo || !visible) return;
    objetivo = forzada !== null ? forzada : suave(progreso());
    var antes = mezcla;
    mezcla += (objetivo - mezcla) * LERP;
    if (Math.abs(mezcla - objetivo) < 0.0005) mezcla = objetivo;
    if (videos[0]._sinRVFC) nuevo = true;                   // sin rVFC (Firefox viejo): se pinta cada rAF
    if (nuevo || Math.abs(mezcla - antes) > 0.0002) { nuevo = false; pintar(); }
    if ((++cuadros & 15) === 0) canvas.setAttribute('data-mezcla', mezcla.toFixed(3));
    raf = requestAnimationFrame(marco);
  }
  function arrancarBucle() { if (vivo && visible && !raf) raf = requestAnimationFrame(marco); }

  /* ---------- Arranque de escritorio: después del LCP ---------- */
  function iniciarEscritorio() {
    modo = 'lienzo';
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) { apagar('sin-canvas-2d'); return; }
    formato = document.createElement('video').canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';
    Promise.all([cargar(ESC.tex), cargar(ESC.mask)]).then(function (ims) {
      foto = ims[0];
      /* v3-corr paso 2 · UNA VEZ: el recorte de la foto con el mar transparente
         (alfa = 1 − máscara), a la resolución de la foto. Es lo que se pinta ENCIMA
         del vídeo. La máscara ya viene dura y erodida (paso 1). */
      var W = ESC.tw, H = ESC.th;
      var mk = document.createElement('canvas'); mk.width = W; mk.height = H;
      var mx = mk.getContext('2d', { willReadFrequently: true });
      mx.drawImage(ims[1], 0, 0, W, H);
      var m = mx.getImageData(0, 0, W, H).data;
      var off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, H) : document.createElement('canvas');
      if (!off.width) { off.width = W; off.height = H; }
      var o = off.getContext('2d', { willReadFrequently: true });
      o.drawImage(foto, 0, 0, W, H);
      var pd = o.getImageData(0, 0, W, H), p = pd.data;
      var x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (var i = 0, n = 0; i < m.length; i += 4, n++) {
        p[i + 3] = 255 - m[i];                                      // alfa = 1 − mar
        if (m[i] > 2) { var x = n % W, y = (n - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      o.putImageData(pd, 0, 0);
      recorte = off.transferToImageBitmap ? off.transferToImageBitmap() : off;
      caja = { sx: Math.max(x0 - 6, 0), sy: Math.max(y0 - 6, 0), sw: Math.min(x1 - x0 + 13, W), sh: Math.min(y1 - y0 + 13, H) };
      medir();
      videos = [crearVideo('calma'), crearVideo('tormenta')];
      mezcla = suave(progreso());                                // recargar a mitad de página no arranca desde la calma
      /* el primer fotograma, cronometrado, en cuanto el bucle de calma tiene imagen */
      var esperas = 0;
      (function primero() {
        if (videos[0].readyState >= 2) {
          var a = performance.now();
          pintar();
          var ms = performance.now() - a;
          canvas.setAttribute('data-primer-frame-ms', ms.toFixed(1));
          if (ms > 80) { apagar('primer-frame-lento'); return; }
          vivo = true;
          canvas.classList.add('viva');
          canvas.setAttribute('data-pieza', 'viva:v3:' + formato);
          arrancarBucle();
        } else if (++esperas < 600) { setTimeout(primero, 50); }
        else apagar('video-sin-fotograma');
      })();
    }).catch(function () { apagar('texturas'); });
  }

  /* ---------- Móvil: un bucle fijo y el velo ---------- */
  function iniciarMovil() {
    modo = 'movil';
    canvas.setAttribute('data-pieza', 'movil');
    var v = fondo.querySelector('.mar-movil'), velo = fondo.querySelector('.mar-velo');
    if (!v) return;
    v.preload = 'auto'; v.load();
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    videos = [v];
    var op = 0;
    function paso() {
      raf = 0;
      if (!visible) return;
      var obj = VELO_MAX * (forzada !== null ? forzada : progreso());     // lineal, como pide la spec
      op += (obj - op) * LERP;
      if (velo) velo.style.opacity = op.toFixed(3);
      if ((++cuadros & 15) === 0) canvas.setAttribute('data-mezcla', (op / VELO_MAX).toFixed(3));
      raf = requestAnimationFrame(paso);
    }
    vivo = true;
    arrancarBucle = function () { if (visible && !raf) raf = requestAnimationFrame(paso); };
    arrancarBucle();
  }

  function iniciar() {
    if (listo) return; listo = true;
    if (movil.matches) iniciarMovil(); else iniciarEscritorio();
  }

  /* pestaña oculta: ni rAF ni decodificación */
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (!visible) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (videos) videos.forEach(function (v) { v.pause(); });
    } else {
      if (videos) videos.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      nuevo = true; arrancarBucle();
    }
  });

  window.addEventListener('resize', function () {
    if (!vivo) return;
    if ((modo === 'movil') !== movil.matches) { location.reload(); return; }   // cambia de escena entera: la forma barata y correcta
    if (modo === 'lienzo') medir();
  });

  /* Ganchos de medida. `forzar(m)` fija la mezcla (0..1) sin inercia; `forzar(null)`
     devuelve el mando al scroll. `congelar(seg)` deja los dos bucles parados con la
     tormenta en el segundo `seg` y la mezcla en 1: es el peor caso del contraste.
     `reanudar()` deshace. `estado()` cuenta fotogramas presentados y pintados. */
  canvas.pieza = {
    forzar: function (m) { forzada = (typeof m === 'number') ? Math.min(Math.max(m, 0), 1) : null; if (forzada !== null) mezcla = forzada; nuevo = true; },
    congelar: function (seg) {
      if (!videos) return Promise.resolve(false);
      videos.forEach(function (v) { v.pause(); });
      var v = modo === 'movil' ? videos[0] : videos[1];        // móvil: el bucle de calma; escritorio: el de tormenta
      if (modo !== 'movil') { forzada = 1; mezcla = 1; }
      return new Promise(function (ok) {
        var hecho = false;
        function fin() {
          if (hecho) return; hecho = true;
          if (modo !== 'movil') { pintar(); pintar(); }
          ok(Math.abs(v.currentTime - seg) < 0.05);
        }
        v.addEventListener('seeked', fin, { once: true });
        setTimeout(fin, 4000);                                  // por si `seeked` no llega
        v.currentTime = seg;
      });
    },
    reanudar: function () { forzada = null; if (videos) videos.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); nuevo = true; },
    estado: function () {
      return { modo: modo, formato: formato, vivo: vivo, mezcla: +mezcla.toFixed(3), objetivo: +objetivo.toFixed(3), pintados: pintados, cuadros: cuadros,
               caja: caja, offset: OFFSET, geo: { W: geo.W, H: geo.H },
               videos: videos ? videos.map(function (v) { return { t: +v.currentTime.toFixed(3), rs: v.readyState, paused: v.paused, fotogramas: v._fotogramas || 0, src: (v.currentSrc || '').split('/').pop() }; }) : null };
    }
  };

  function despues() { setTimeout(iniciar, ARRANQUE_MS); }
  if (document.readyState === 'complete') despues();
  else window.addEventListener('load', despues, { once: true });
})();
