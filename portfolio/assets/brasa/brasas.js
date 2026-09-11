window.brasaRescoldo = function (opciones) {
  "use strict";
  var op = opciones || {};
  var caja = document.querySelector(op.caja || "#rescoldo");
  if (!caja) return false;
  var cv = caja.querySelector("canvas");
  if (!cv) return false;
  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return false;

  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dado(semilla) {
    var s = semilla >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  var brasas = [], chispas = [], medW = 0, medH = 0, dprUsado = 1, t0 = 0;

  function sembrar(w, h) {
    var r = dado(20260825);
    brasas = [];
    var suelo = innerWidth < 900 ? 46 : 120;
    var n = Math.round(Math.min(340, Math.max(suelo, w * h / 3400)));
    for (var i = 0; i < n; i++) {
      var u = r();
      brasas.push({
        x: r() * w,
        y: h - (u * u) * h * 0.46,
        rad: 1.1 + r() * 3.6,
        base: 0.25 + r() * 0.75,
        vel: 0.4 + r() * 1.5,
        fase: r() * 6.283
      });
    }
    chispas = [];
    for (var j = 0; j < 12; j++) {
      chispas.push({ x: r() * w, y0: h * (0.86 + r() * 0.12),
                     vida: 3 + r() * 4, t: r() * 7, der: (r() - .5) * 40, rad: .8 + r() * 1.2 });
    }
  }

  function ascua(b) {
    var rr = Math.round(70 + 185 * b);
    var gg = Math.round(18 + 150 * b * b);
    var bb = Math.round(8 + 70 * b * b * b);
    return "rgb(" + rr + "," + gg + "," + bb + ")";
  }

  var cacheW = 0, cacheH = 0, medidoEn = -1e9;
  function pintar(ms) {
    if (ms - medidoEn > 500 || !medW) {
      var m = cv.getBoundingClientRect();
      medidoEn = ms;
      cacheW = Math.round(m.width); cacheH = Math.round(m.height);
    }
    var w = cacheW, h = cacheH;
    if (!w || !h) return;
    var dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.25 : 2);
    if (w !== medW || h !== medH || dpr !== dprUsado) {
      cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
      sembrar(w, h); medW = w; medH = h; dprUsado = dpr;
    }
    if (!t0) t0 = ms;
    var seg = Math.max(0, (ms - t0) / 1000);
    if (reducido) seg = 2.4;              /* un instante bonito, y quieto */

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var nivel = 0.78 + 0.22 * Math.sin(seg * 0.28);
    var g = ctx.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, h * 0.92);
    g.addColorStop(0, "rgba(210,112,58," + (0.30 * nivel).toFixed(3) + ")");
    g.addColorStop(0.42, "rgba(142,59,30," + (0.16 * nivel).toFixed(3) + ")");
    g.addColorStop(1, "rgba(20,16,14,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < brasas.length; i++) {
      var b = brasas[i];
      var v = b.base * (0.5 + 0.5 * Math.sin(seg * b.vel + b.fase)) * nivel;
      if (v < 0.04) continue;
      ctx.fillStyle = ascua(v);
      ctx.globalAlpha = 0.35 + 0.65 * v;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.rad * (0.75 + 0.35 * v), 0, Math.PI * 2); ctx.fill();
    }

    if (!reducido) {
      for (var k = 0; k < chispas.length; k++) {
        var c = chispas[k];
        var p = ((seg + c.t) % c.vida) / c.vida;
        var y = c.y0 - p * h * 0.72;
        var x = c.x + Math.sin(p * 5.4 + k) * c.der;
        var a = Math.max(0, (1 - p) * (1 - p)) * 0.9;
        if (a < 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = ascua(0.85);
        ctx.beginPath(); ctx.arc(x, y, c.rad, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  var vivo = false, dentro = true, pedido = 0, salida = 0;
  var MIN_MS = 1000 / 24, ultimoPintado = -1e9;

  function cuadro(ms) {
    pedido = 0;
    if (ms - ultimoPintado >= MIN_MS) { ultimoPintado = ms; pintar(ms); }
    if (vivo && dentro) pedido = requestAnimationFrame(cuadro);
    else salida = ms;
  }

  if (reducido) {
    pintar(performance.now());
    var re = 0;
    addEventListener("resize", function () {
      if (re) return;
      re = requestAnimationFrame(function () { re = 0; pintar(performance.now()); });
    }, { passive: true });
  } else {
    vivo = true;
    pintar(performance.now());
    pedido = requestAnimationFrame(cuadro);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (f) {
        dentro = f[0].isIntersecting;
        if (dentro && !pedido) {
          if (salida) { t0 += performance.now() - salida; salida = 0; }
          pedido = requestAnimationFrame(cuadro);
        }
      }, { threshold: 0 }).observe(cv);
    }
  }

  caja.setAttribute("data-vivo", "si");
  return true;
};
