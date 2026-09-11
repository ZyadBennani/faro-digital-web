(function () {
  "use strict";

  var raiz = document.getElementById("campo");
  if (!raiz) return;
  var cosas = [].slice.call(raiz.querySelectorAll(".cosa"));
  if (!cosas.length) return;

  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  raiz.setAttribute("data-listo", "si");

  var radio = 0, cajas = [], caja = null;

  function medir() {
    caja = raiz.getBoundingClientRect();
    radio = Math.max(150, Math.min(caja.width, caja.height) * 0.42);
    cajas = cosas.map(function (c) {
      var r = c.getBoundingClientRect();
      return { x: r.left - caja.left + r.width / 2, y: r.top - caja.top + r.height / 2 };
    });
  }

  function alumbrar(x, y) {
    raiz.style.setProperty("--lx", x.toFixed(1) + "px");
    raiz.style.setProperty("--ly", y.toFixed(1) + "px");
    for (var i = 0; i < cosas.length; i++) {
      var d = Math.hypot(cajas[i].x - x, cajas[i].y - y);
      var v = 1 - Math.min(d / radio, 1);
      v = v * v * (3 - 2 * v);
      cosas[i].style.setProperty("--v", (0.34 + 0.66 * v).toFixed(3));
    }
  }

  function apagar() {
    for (var i = 0; i < cosas.length; i++) cosas[i].style.setProperty("--v", "0.34");
    raiz.style.setProperty("--lx", "-999px");
  }

  var pendiente = false, ultimo = null;
  function mover(e) {
    ultimo = e;
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      if (!caja) medir();
      var r = raiz.getBoundingClientRect();
      alumbrar(ultimo.clientX - r.left, ultimo.clientY - r.top);
    });
  }

  raiz.addEventListener("pointermove", mover);
  raiz.addEventListener("pointerdown", mover);   /* en táctil, la luz se coloca */
  raiz.addEventListener("pointerleave", function () {
    if (matchMedia("(hover: hover)").matches) apagar();
  });

  cosas.forEach(function (c, i) {
    c.setAttribute("tabindex", "0");
    c.addEventListener("focus", function () {
      if (!caja) medir();
      alumbrar(cajas[i].x, cajas[i].y);
    });
  });

  addEventListener("resize", function () { caja = null; }, { passive: true });

  var jugado = false;
  function pasada() {
    if (jugado) return;
    jugado = true;
    medir();
    if (reducido) {
      cosas.forEach(function (c) { c.style.setProperty("--v", "1"); });
      raiz.setAttribute("data-todo", "si");
      return;
    }
    var t0 = performance.now(), dur = 2600;
    (function paso(ms) {
      var k = Math.min((ms - t0) / dur, 1);
      var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      alumbrar(caja.width * (0.12 + 0.76 * e), caja.height * (0.16 + 0.68 * e));
      if (k < 1) requestAnimationFrame(paso);
      else if (matchMedia("(hover: hover)").matches) apagar();
    })(t0);
  }

  apagar();
  if ("IntersectionObserver" in window) {
    function umbralFaro() {
      var v = parseFloat(getComputedStyle(document.documentElement)
                         .getPropertyValue("--m-umbral"));
      return (v > 0 && v <= 1) ? v : 0.15;
    }
    var ojo = new IntersectionObserver(function (f) {
      if (!f[0].isIntersecting) return;
      ojo.disconnect();
      pasada();
    }, { threshold: umbralFaro() });
    ojo.observe(raiz);
  } else {
    cosas.forEach(function (c) { c.style.setProperty("--v", "1"); });
  }
})();
