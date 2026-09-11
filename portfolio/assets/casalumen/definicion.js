(function () {
  "use strict";

  var raiz = document.getElementById("definicion");
  if (!raiz) return;

  var tiendas = [].slice.call(raiz.querySelectorAll(".tienda"));
  var botones = [].slice.call(raiz.querySelectorAll("[data-d]"));
  var total = raiz.querySelector(".def-total b");
  if (!tiendas.length || !botones.length || !total) return;

  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function euros(n) {
    return n.toLocaleString("es-ES", { maximumFractionDigits: 0, useGrouping: true }) + " €";
  }
  function valores(d) {
    return tiendas.map(function (t) {
      return parseFloat((t.getAttribute("data-v") || "").split(",")[d] || "0");
    });
  }

  var tweens = new WeakMap();
  function hacia(el, fin) {
    var previo = tweens.get(el);
    if (previo) cancelAnimationFrame(previo);
    var ini = parseFloat(el.getAttribute("data-actual") || "0");
    el.setAttribute("data-actual", fin);
    if (reducido) { el.textContent = euros(fin); return; }
    var t0 = performance.now(), dur = 520;
    (function paso(ms) {
      var k = Math.min((ms - t0) / dur, 1);
      var v = ini + (fin - ini) * (1 - Math.pow(1 - k, 3));
      el.textContent = euros(Math.round(v));
      if (k < 1) tweens.set(el, requestAnimationFrame(paso));
    })(t0);
  }

  function poner(d) {
    var vs = valores(d), suma = 0;
    tiendas.forEach(function (t, i) {
      hacia(t.querySelector(".cifra"), vs[i]);
      suma += vs[i];
      var suya = String(t.getAttribute("data-usa")) === String(d);
      t.setAttribute("data-suya", suya ? "si" : "no");
      var marca = t.querySelector(".usa");
      if (marca) marca.textContent = suya ? "así lo contaba" : "";
    });
    hacia(total, suma);
    botones.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-d") === String(d) ? "true" : "false");
    });
    raiz.setAttribute("data-def", String(d));
  }

  raiz.addEventListener("click", function (e) {
    var b = e.target.closest("[data-d]");
    if (b) poner(parseInt(b.getAttribute("data-d"), 10));
  });

  var reportado = raiz.querySelector(".def-reportado b");
  if (reportado) {
    var suya = 0;
    tiendas.forEach(function (t) {
      var d = parseInt(t.getAttribute("data-usa"), 10);
      suya += parseFloat((t.getAttribute("data-v") || "").split(",")[d] || "0");
    });
    reportado.textContent = euros(suya);
  }

  tiendas.forEach(function (t) {
    t.querySelector(".cifra").setAttribute("data-actual", "0");
  });
  var antes = reducido;
  reducido = true;
  poner(0);
  reducido = antes;
  raiz.setAttribute("data-listo", "si");
})();
