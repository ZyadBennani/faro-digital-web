(function () {
  "use strict";

  var raiz = document.getElementById("semana");
  if (!raiz) return;

  var dias = [].slice.call(raiz.querySelectorAll(".dia"));
  var marcador = raiz.querySelector(".sem-cuenta");
  if (!dias.length) return;

  var ANTES = { 4: "Foto de plato", 5: "Foto de plato", 6: "Foto de plato" };

  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var relojes = [];
  var estado = "plan";
  var jugado = false;

  function limpiar() { relojes.forEach(clearTimeout); relojes = []; }
  function luego(f, ms) { relojes.push(setTimeout(f, ms)); }

  dias.forEach(function (d, i) {
    var hueco = d.querySelector(".post.antes");
    if (hueco && ANTES[i]) hueco.textContent = ANTES[i];
  });

  function poner(cual, escalonado) {
    estado = cual;
    raiz.setAttribute("data-estado", cual);
    dias.forEach(function (d, i) {
      var a = d.querySelector(".post.antes");
      var p = d.querySelector(".post.plan");
      var espera = escalonado ? i * 90 : 0;
      [[a, cual === "antes"], [p, cual === "plan"]].forEach(function (par) {
        var el = par[0], si = par[1];
        if (!el) return;
        var vacio = !el.textContent.trim();
        if (si && !vacio) {
          el.hidden = false;
          if (reducido || !escalonado) { el.setAttribute("data-on", "1"); return; }
          luego(function () { el.setAttribute("data-on", "1"); }, espera);
        } else {
          el.setAttribute("data-on", "0");
          if (reducido) { el.hidden = true; return; }
          setTimeout(function () {
            if (el.getAttribute("data-on") === "0") el.hidden = true;
          }, 260);
        }
      });
      var tiene = cual === "plan" && d.hasAttribute("data-pieza");
      d.disabled = !tiene;
      d.setAttribute("aria-expanded", "false");
    });
    if (marcador) {
      var n = 0;
      dias.forEach(function (d, i) {
        var flojo = parseFloat(d.getAttribute("data-sala") || "0") < 50;
        var hay = cual === "antes" ? !!ANTES[i] : d.hasAttribute("data-pieza");
        if (flojo && hay) n++;
      });
      marcador.textContent = n;
    }
    cerrarDetalle();
  }

  var detalles = [].slice.call(raiz.querySelectorAll(".detalle"));

  function cerrarDetalle() {
    detalles.forEach(function (x) { x.hidden = true; });
    dias.forEach(function (d) { d.setAttribute("aria-expanded", "false"); });
  }

  raiz.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sem]");
    if (b) {
      limpiar(); jugado = true;
      poner(b.getAttribute("data-sem") === "1" ? "plan" : "antes", false);
      return;
    }
    var d = e.target.closest(".dia");
    if (!d || d.disabled) return;
    var id = d.getAttribute("data-pieza");
    var abierto = d.getAttribute("aria-expanded") === "true";
    cerrarDetalle();
    if (abierto) return;
    var det = raiz.querySelector('.detalle[data-pieza="' + id + '"]');
    if (det) {
      det.hidden = false;
      d.setAttribute("aria-expanded", "true");
    }
  });

  function secuencia() {
    if (jugado) return;
    jugado = true;
    if (reducido) { poner("plan", false); return; }
    poner("antes", false);
    luego(function () { poner("plan", true); }, 1500);
  }

  poner("antes", false);
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
    poner("plan", false);
  }
})();
