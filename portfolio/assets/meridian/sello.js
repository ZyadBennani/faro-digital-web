window.meridianSello = function (opciones) {
  "use strict";
  var op = opciones || {};
  var caja = document.querySelector(op.caja || "#sello");
  if (!caja) return false;
  var cv = caja.querySelector("canvas");
  if (!cv) return false;

  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return false;

  var TINTA = op.tinta || "#16181C";
  var ACENTO = op.acento || "#2A4E7C";
  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function trazo(c, R, k, ext, hueco, giro) {
    var a = R * (ext + hueco) / 2, b = R * (ext - hueco) / 2, w = k - 1;
    var pasos = 480, i, t, x, y;
    c.beginPath();
    for (i = 0; i <= pasos; i++) {
      t = (i / pasos) * Math.PI * 2 + giro;
      x = a * Math.cos(t) + b * Math.cos(w * t);
      y = a * Math.sin(t) - b * Math.sin(w * t);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    c.stroke();
  }

  function capa(R, dpr, tramas) {
    var lado = Math.ceil(2 * R * dpr);
    var off = document.createElement("canvas");
    off.width = lado; off.height = lado;
    var c = off.getContext("2d");
    if (!c) return null;
    c.scale(dpr, dpr);
    c.translate(R, R);
    c.lineJoin = "round";
    tramas.forEach(function (t) {
      c.strokeStyle = t.color;
      c.globalAlpha = t.alfa;
      c.lineWidth = t.grosor;
      var paso = (Math.PI * 2 / t.k) / t.copias;
      for (var i = 0; i < t.copias; i++) trazo(c, R, t.k, t.ext, t.hueco, i * paso);
    });
    return off;
  }

  function papel(lado, dpr) {
    var off = document.createElement("canvas");
    off.width = off.height = Math.ceil(lado * dpr);
    var c = off.getContext("2d");
    if (!c) return null;
    var img = c.createImageData(off.width, off.height);
    var d = img.data;
    var sem = 20260825;
    function az() { sem = (sem * 1664525 + 1013904223) % 4294967296; return sem / 4294967296; }
    for (var i = 0; i < d.length; i += 4) {
      var v = (az() * 0.62 + az() * 0.38 - 0.5) * 22;
      d[i] = 250 + v; d[i + 1] = 248 + v; d[i + 2] = 242 + v; d[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return off;
  }

  var capaA = null, capaB = null, hoja = null, medida = 0, radio = 0, dprUsado = 1;

  function preparar(ancho, dpr) {
    radio = ancho / 2;
    dprUsado = dpr;
    hoja = papel(ancho, dpr);
    capaA = capa(radio, dpr, [
      { k: 54, ext: 0.962, hueco: 0.815, copias: 30, color: TINTA, alfa: 0.10, grosor: 0.6 },
      { k: 53, ext: 0.735, hueco: 0.300, copias: 24, color: TINTA, alfa: 0.045, grosor: 0.5 }
    ]);
    capaB = capa(radio, dpr, [
      { k: 12, ext: 0.745, hueco: 0.360, copias: 22, color: ACENTO, alfa: 0.13, grosor: 0.7 }
    ]);
    medida = ancho;
  }

  var t0 = 0;

  var cacheAncho = 0, medidoEn = -1e9;

  function pintar(ms) {
    if (ms - medidoEn > 500 || !cacheAncho) {
      cacheAncho = Math.round(cv.getBoundingClientRect().width);
      medidoEn = ms;
    }
    var ancho = cacheAncho;
    if (!ancho) return;
    var dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.25 : 2);

    if (ancho !== medida || dpr !== dprUsado) {
      cv.width = Math.ceil(ancho * dpr);
      cv.height = Math.ceil(ancho * dpr);
      preparar(ancho, dpr);
    }
    if (!capaA || !capaB) return;

    if (!t0) t0 = ms;
    var seg = Math.max(0, (ms - t0) / 1000);

    var p = reducido ? 1 : Math.min(seg / 1.7, 1);
    p = 1 - Math.pow(1 - p, 3);

    var R = radio;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, ancho);
    ctx.save();
    ctx.beginPath();
    ctx.arc(R, R, R * p, 0, Math.PI * 2);
    ctx.clip();

    var gA = reducido ? 0 : seg * 0.042;
    var gB = reducido ? 0 : -seg * 0.030;

    if (hoja) ctx.drawImage(hoja, 0, 0, ancho, ancho);

    function conHuella(capa, giro) {
      ctx.save();
      ctx.translate(R, R); ctx.rotate(giro);
      ctx.globalAlpha = 0.30;
      ctx.drawImage(capa, -R + 1.1, -R + 1.1, 2 * R, 2 * R);
      ctx.globalAlpha = 1;
      ctx.drawImage(capa, -R, -R, 2 * R, 2 * R);
      ctx.restore();
    }
    conHuella(capaA, gA);
    conHuella(capaB, gB);

    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.30;
    ctx.beginPath(); ctx.arc(R, R, R * 0.985, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.arc(R, R, R * 0.945, 0, Math.PI * 2); ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.beginPath(); ctx.arc(R, R, R * 0.345, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.arc(R, R, R * 0.345, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
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
    var reAjuste = 0;
    addEventListener("resize", function () {
      if (reAjuste) return;
      reAjuste = requestAnimationFrame(function () { reAjuste = 0; pintar(performance.now()); });
    }, { passive: true });
  } else {
    vivo = true;
    pintar(performance.now());          /* el primer cuadro, directo */
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
