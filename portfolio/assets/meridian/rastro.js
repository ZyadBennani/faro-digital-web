(function () {
  "use strict";

  var raiz = document.getElementById("rastro");
  if (!raiz) return;

  var botones = [].slice.call(raiz.querySelectorAll(".fuente"));
  var texto = raiz.querySelector(".resp-texto");
  var cuenta = raiz.querySelector(".resp-cuenta");
  if (!botones.length || !texto || !cuenta) return;

  var frags = {};
  [].forEach.call(texto.querySelectorAll(".frag"), function (f) {
    frags[f.getAttribute("data-f") || ("v:" + f.getAttribute("data-var"))] = f;
  });

  if (frags["v:vacio"]) {
    frags["v:vacio"].textContent =
      "No tengo información suficiente sobre consultoras boutique para empresas medianas.";
  }
  if (frags["v:sinnombre"]) {
    frags["v:sinnombre"].textContent =
      "Hay firmas boutique que trabajan con empresas medianas, pero ninguna fuente clara que citar por su nombre.";
  }

  var PESOS = [0, 2, 1, 2, 2, 1];
  var TOPE = 15;

  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var estado = botones.map(function () { return false; });
  var relojes = [];
  var jugado = false;

  function limpiar() { relojes.forEach(clearTimeout); relojes = []; }
  function luego(fn, ms) { relojes.push(setTimeout(fn, ms)); }

  var mostrado = 0, tween = 0;

  function haciaCuenta(fin) {
    if (reducido) { mostrado = fin; cuenta.textContent = fin + " de " + TOPE; return; }
    var ini = mostrado, t0 = performance.now(), dur = 380;
    cancelAnimationFrame(tween);
    (function paso(ms) {
      var p = Math.min((ms - t0) / dur, 1);
      p = 1 - Math.pow(1 - p, 3);
      mostrado = Math.round(ini + (fin - ini) * p);
      cuenta.textContent = mostrado + " de " + TOPE;
      if (p < 1) tween = requestAnimationFrame(paso);
    })(t0);
  }

  function fragmento(el, si) {
    if (!el) return;
    var estaba = el.getAttribute("data-on") !== "0";
    if (si === estaba && el.getAttribute("data-on")) return;
    if (si) {
      el.hidden = false;
      if (reducido) { el.setAttribute("data-on", "1"); return; }
      requestAnimationFrame(function () { el.setAttribute("data-on", "1"); });
    } else {
      el.setAttribute("data-on", "0");
      if (reducido) { el.hidden = true; return; }
      setTimeout(function () { if (el.getAttribute("data-on") === "0") el.hidden = true; }, 260);
    }
  }

  function pintar() {
    var activas = estado.filter(Boolean).length;
    var puerta = estado[0];

    botones.forEach(function (b, i) { b.setAttribute("aria-pressed", estado[i] ? "true" : "false"); });

    fragmento(frags["v:vacio"], activas === 0);
    fragmento(frags["v:sinnombre"], activas > 0 && !puerta);
    for (var i = 0; i < estado.length; i++) fragmento(frags[i], puerta && estado[i]);

    var n = 0;
    if (puerta) { n = 1; for (var j = 1; j < estado.length; j++) if (estado[j]) n += PESOS[j]; }
    haciaCuenta(n);
    raiz.setAttribute("data-estado", activas === 0 ? "vacio" : (activas === estado.length ? "lleno" : "medio"));
  }

  function poner(lista) { estado = lista.slice(); pintar(); }

  function secuencia() {
    if (jugado) return;
    jugado = true;
    if (reducido) { poner(estado.map(function () { return true; })); abrirVoz(); return; }
    poner(estado.map(function () { return false; }));
    for (var i = 0; i < estado.length; i++) {
      (function (k) {
        luego(function () {
          estado[k] = true;
          pintar();
          if (k === estado.length - 1) luego(abrirVoz, 500);
        }, 760 + k * 420);
      })(i);
    }
  }

  function abrirVoz() { texto.setAttribute("aria-live", "polite"); }

  raiz.addEventListener("click", function (e) {
    var b = e.target.closest(".fuente");
    if (b) {
      limpiar(); jugado = true; abrirVoz();
      var i = parseInt(b.getAttribute("data-f"), 10);
      estado[i] = !estado[i];
      pintar();
      return;
    }
    var p = e.target.closest("[data-preset]");
    if (p) {
      limpiar(); jugado = true; abrirVoz();
      var v = p.getAttribute("data-preset") === "1";
      poner(estado.map(function () { return v; }));
    }
  });

  function eco(b, si) {
    var f = frags[parseInt(b.getAttribute("data-f"), 10)];
    if (f) f.classList.toggle("eco", si);
  }
  botones.forEach(function (b) {
    b.addEventListener("mouseenter", function () { eco(b, true); });
    b.addEventListener("mouseleave", function () { eco(b, false); });
    b.addEventListener("focus", function () { eco(b, true); });
    b.addEventListener("blur", function () { eco(b, false); });
  });

  poner(estado.map(function () { return false; }));
  raiz.setAttribute("data-listo", "si");

  if ("IntersectionObserver" in window) {
    function umbralFaro() {
      var v = parseFloat(getComputedStyle(document.documentElement)
                         .getPropertyValue("--m-umbral"));
      return (v > 0 && v <= 1) ? v : 0.15;
    }
    var ojo = new IntersectionObserver(function (f) {
      if (!f[0].isIntersecting) return;
      ojo.disconnect();
      secuencia();
    }, { threshold: umbralFaro() });
    ojo.observe(raiz);
  } else {
    poner(estado.map(function () { return true; }));
    abrirVoz();
  }
})();
