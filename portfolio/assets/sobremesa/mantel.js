window.sobremesaMantel = function (opciones) {
  "use strict";
  var op = opciones || {};
  var caja = document.querySelector(op.caja || "#mantel");
  if (!caja) return false;
  var cv = caja.querySelector("canvas");
  if (!cv) return false;
  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return false;

  var CREMA = op.crema || "#F5EFE6";
  var TINTA = op.tinta || "#241F1C";
  var VINO = op.vino || "#6B2737";
  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dado(semilla) {
    var s = semilla >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function tejer(w, h, dpr) {
    var off = document.createElement("canvas");
    off.width = Math.ceil(w * dpr); off.height = Math.ceil(h * dpr);
    var c = off.getContext("2d");
    if (!c) return null;
    c.scale(dpr, dpr);
    var r = dado(20260825);

    c.fillStyle = CREMA;
    c.fillRect(0, 0, w, h);

    var paso = 6.4;                       /* separación entre hilos */
    var i, x, y, a;

    for (y = 0; y < h + paso; y += paso) {
      a = 0.022 + r() * 0.052;
      c.strokeStyle = "rgba(120,100,78," + a.toFixed(3) + ")";
      c.lineWidth = 2.4 + r() * 1.5;
      c.beginPath();
      c.moveTo(0, y + (r() - .5) * 1.2);
      c.lineTo(w, y + (r() - .5) * 1.2);
      c.stroke();
    }
    for (x = 0; x < w + paso; x += paso) {
      a = 0.012 + r() * 0.030;
      c.strokeStyle = "rgba(120,100,78," + a.toFixed(3) + ")";
      c.lineWidth = 2.0 + r() * 1.2;
      c.beginPath();
      c.moveTo(x + (r() - .5) * 1.2, 0);
      c.lineTo(x + (r() - .5) * 1.2, h);
      c.stroke();
    }

    var cols = Math.ceil(w / paso), fils = Math.ceil(h / paso), cx, cy;
    c.fillStyle = "rgba(255,252,246,.030)";
    for (cy = 0; cy < fils; cy++) {
      for (cx = 0; cx < cols; cx++) {
        if ((cx + cy) % 2) continue;
        c.fillRect(cx * paso + 1, cy * paso + 1.6, paso - 2.4, paso * .34);
      }
    }

    c.fillStyle = "rgba(90,74,58,.05)";
    for (i = 0; i < (w * h) / 260; i++) c.fillRect(r() * w, r() * h, 1, 1);

    var ox = w * 0.60, oy = h * 0.80, rad = Math.min(w, h) * 0.10;
    c.save();
    c.translate(ox, oy); c.scale(1, 0.42);
    c.strokeStyle = "rgba(107,39,55,.10)"; c.lineWidth = rad * 0.15;
    c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "rgba(107,39,55,.055)"; c.lineWidth = rad * 0.07;
    c.beginPath(); c.arc(0, 0, rad * 0.72, 0, Math.PI * 2); c.stroke();
    c.restore();

    var mx = w * 0.22, my = h * 0.86;
    for (i = 0; i < 9; i++) {
      var d = (r() - .5) * w * 0.15, e = (r() - .5) * h * 0.16;
      var t = 0.9 + r() * 1.7;
      c.fillStyle = "rgba(88,68,48," + (0.10 + r() * 0.13).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(mx + d, my + e, t, t * (0.6 + r() * 0.5), r() * 3.1, 0, Math.PI * 2);
      c.fill();
    }
    return off;
  }

  var tela = null, medW = 0, medH = 0, dprUsado = 1, t0 = 0;

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
      tela = tejer(w, h, dpr);
      medW = w; medH = h; dprUsado = dpr;
    }
    if (!tela) return;

    if (!t0) t0 = ms;
    var seg = Math.max(0, (ms - t0) / 1000);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tela, 0, 0, w, h);

    var u = reducido ? 0.34 : (seg / 96) % 1;
    var lx = w * (0.16 + 0.72 * u);
    var ly = h * (0.20 + 0.16 * Math.sin(u * Math.PI * 2));
    var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.78);
    g.addColorStop(0, "rgba(255,250,236,.60)");
    g.addColorStop(.45, "rgba(255,247,232,.22)");
    g.addColorStop(1, "rgba(255,247,232,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    var g2 = ctx.createLinearGradient(lx, ly, w - lx * .3, h);
    g2.addColorStop(0, "rgba(96,78,58,0)");
    g2.addColorStop(1, "rgba(96,78,58,.14)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
  }

  var vivo = false, dentro = true, pedido = 0, salida = 0;

  var MIN_MS = 1000 / 5, ultimoPintado = -1e9;

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
