window.casaLumenTirada = function (opciones) {
  "use strict";
  var op = opciones || {};
  var caja = document.querySelector(op.caja || "#tirada");
  if (!caja) return false;
  var cv = caja.querySelector("canvas");
  if (!cv) return false;
  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return false;

  var PAPEL = op.papel || "#F7F3EA";
  var TINTA = op.tinta || "#1F1B16";
  var DATO = op.dato || "#B8521E";
  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SERIE = [38, 34, 41, 45, 42, 39, 33, 30, 46, 58, 71, 92,
               35, 33, 44, 49, 47, 42, 36, 32, 51, 63, 78, 97];

  function enX(t) {
    var p = t * (SERIE.length - 1);
    var i = Math.floor(p), f = p - i;
    var a = SERIE[Math.max(i, 0)], b = SERIE[Math.min(i + 1, SERIE.length - 1)];
    return (a + (b - a) * (f * f * (3 - 2 * f))) / 100;
  }

  function plancha(w, h, dpr, color, celda, angulo, alfa) {
    var off = document.createElement("canvas");
    off.width = Math.ceil(w * dpr); off.height = Math.ceil(h * dpr);
    var c = off.getContext("2d");
    if (!c) return null;
    c.scale(dpr, dpr);
    c.fillStyle = color;
    c.globalAlpha = alfa;

    var co = Math.cos(angulo), si = Math.sin(angulo);
    var diag = Math.sqrt(w * w + h * h);
    var base = h * 1.02, alto = h * 0.46;
    for (var gy = -diag; gy < diag; gy += celda) {
      for (var gx = -diag; gx < diag; gx += celda) {
        var x = gx * co - gy * si + w / 2;
        var y = gx * si + gy * co + h / 2;
        if (x < -celda || x > w + celda || y < -celda || y > h + celda) continue;
        var techo = base - enX(Math.min(Math.max(x / w, 0), 1)) * alto;
        var cob = (y - techo) / (celda * 2.2);
        cob = Math.max(0, Math.min(1, cob));
        if (y > base) cob *= Math.max(0, 1 - (y - base) / (celda * 1.5));
        if (cob <= 0.01) continue;
        var r = (celda * 0.44) * Math.sqrt(cob);
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }
    return off;
  }

  function granoPapel(w, h, dpr) {
    var off = document.createElement("canvas");
    off.width = Math.ceil(w * dpr); off.height = Math.ceil(h * dpr);
    var c = off.getContext("2d");
    if (!c) return null;
    c.scale(dpr, dpr);
    c.fillStyle = PAPEL; c.fillRect(0, 0, w, h);
    var s = 20260825 >>> 0;
    function r() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    c.fillStyle = "rgba(120,104,80,.055)";
    for (var i = 0; i < (w * h) / 190; i++) c.fillRect(r() * w, r() * h, 1, 1);
    c.fillStyle = "rgba(255,252,244,.5)";
    for (var j = 0; j < (w * h) / 900; j++) c.fillRect(r() * w, r() * h, 1, 1);
    return off;
  }

  var papel = null, pTinta = null, pDato = null;
  var medW = 0, medH = 0, dprUsado = 1, t0 = 0, hecho = false;

  function preparar(w, h, dpr) {
    papel = granoPapel(w, h, dpr);
    var celda = Math.max(5, Math.min(w, h) / 116);
    pTinta = plancha(w, h, dpr, TINTA, celda, 0.262, 0.13);   /* 15° */
    pDato  = plancha(w, h, dpr, DATO,  celda, 0.785, 0.17);   /* 45° */
    medW = w; medH = h; dprUsado = dpr;
  }

  function pintar(ms) {
    var m = cv.getBoundingClientRect();
    var w = Math.round(m.width), h = Math.round(m.height);
    if (!w || !h) return;
    var dpr = Math.min(devicePixelRatio || 1, 2);
    if (w !== medW || h !== medH || dpr !== dprUsado) {
      cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
      preparar(w, h, dpr);
      t0 = 0; hecho = false;
    }
    if (!papel) return;

    if (!t0) t0 = ms;
    var seg = Math.max(0, (ms - t0) / 1000);   /* recortado: ver C34 */

    var suave = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
    var aT = reducido ? 1 : suave(seg / 0.42);
    var aD = reducido ? 1 : suave((seg - 0.26) / 0.46);
    var d = 2 + 4 * (1 - aD);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(papel, 0, 0, w, h);
    if (pTinta) { ctx.globalAlpha = aT; ctx.drawImage(pTinta, 0, 0, w, h); }
    if (pDato) { ctx.globalAlpha = aD; ctx.drawImage(pDato, d, d * 0.66, w, h); }
    ctx.globalAlpha = 1;

    if (aT >= 1 && aD >= 1) hecho = true;
  }

  function cuadro(ms) {
    pintar(ms);
    if (!hecho) requestAnimationFrame(cuadro);
  }

  var reAjuste = 0;
  addEventListener("resize", function () {
    if (reAjuste) return;
    reAjuste = requestAnimationFrame(function () {
      reAjuste = 0;
      medW = 0;                       /* fuerza el reprensado y una tirada nueva */
      pintar(performance.now());
      if (!hecho) requestAnimationFrame(cuadro);
    });
  }, { passive: true });

  pintar(performance.now());
  if (!hecho) requestAnimationFrame(cuadro);

  caja.setAttribute("data-vivo", "si");
  return true;
};
