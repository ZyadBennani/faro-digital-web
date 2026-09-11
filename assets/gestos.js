(function () {
  "use strict";
  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function repartir(el) {
    var piezas = [];                      // string = palabra · null = <br>
    (function leer(nodo) {
      for (var n = nodo.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          var trozos = n.nodeValue.split(/\s+/);
          for (var t = 0; t < trozos.length; t++) {
            if (trozos[t]) piezas.push(trozos[t]);
          }
        } else if (n.nodeName === "BR") {
          piezas.push(null);
        } else if (n.nodeType === 1) {
          leer(n);
        }
      }
    })(el);
    if (!piezas.length) return false;
    el.textContent = "";
    var sondas = [];
    piezas.forEach(function (p, i) {
      if (p === null) { el.appendChild(document.createElement("br")); return; }
      var siguiente = piezas[i + 1];
      var s = document.createElement("span");
      s.textContent = p + (siguiente === undefined || siguiente === null ? "" : " ");
      el.appendChild(s);
      sondas.push(s);
    });
    var lineas = [], actual = null, tope = null;
    sondas.forEach(function (s) {
      var y = Math.round(s.getBoundingClientRect().top);
      if (tope === null || Math.abs(y - tope) > 3) { tope = y; actual = []; lineas.push(actual); }
      actual.push(s.textContent);
    });
    el.textContent = "";
    lineas.forEach(function (linea, i) {
      var caja = document.createElement("span");
      caja.className = "g-linea";
      var dentro = document.createElement("span");
      dentro.style.setProperty("--i", i);
      dentro.textContent = linea.join("");
      caja.appendChild(dentro);
      el.appendChild(caja);
    });
    return lineas.length > 0;
  }

  function titulares() {
    var todos = document.querySelectorAll(".g-titular");
    if (!todos.length) return;
    todos.forEach(function (el) {
      if (!repartir(el)) { el.setAttribute("data-visto", ""); return; }
      if (reducido || !("IntersectionObserver" in window)) {
        el.setAttribute("data-visto", "");
        return;
      }
      var ojo = new IntersectionObserver(function (filas) {
        filas.forEach(function (f) {
          if (!f.isIntersecting) return;
          f.target.setAttribute("data-visto", "");
          ojo.unobserve(f.target);
        });
      }, { threshold: 0.15 });
      ojo.observe(el);
      setTimeout(function () { el.setAttribute("data-visto", ""); }, 2500);
    });
    var anchoPrevio = innerWidth, temporizador;
    addEventListener("resize", function () {
      if (innerWidth === anchoPrevio) return;      // el teclado del móvil no cuenta
      anchoPrevio = innerWidth;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        todos.forEach(function (el) {
          var t = el.textContent.replace(/\s+/g, " ").trim();
          el.textContent = t;
          repartir(el);
          el.setAttribute("data-visto", "");
        });
      }, 180);
    });
  }

  function filas() {
    var conFoto = document.querySelectorAll(".g-fila[data-vista]");
    if (!conFoto.length || reducido) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var caja = document.createElement("div");
    caja.className = "g-vista";
    caja.setAttribute("aria-hidden", "true");
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    caja.appendChild(img);
    document.body.appendChild(caja);

    var x = 0, y = 0, dx = 0, dy = 0, corriendo = false;
    function paso() {
      dx += (x - dx) * 0.16;
      dy += (y - dy) * 0.16;
      caja.style.left = dx + "px";
      caja.style.top = dy + "px";
      if (Math.abs(x - dx) > 0.4 || Math.abs(y - dy) > 0.4) requestAnimationFrame(paso);
      else corriendo = false;
    }
    function seguir() { if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } }

    conFoto.forEach(function (fila) {
      function entra() {
        var fuente = fila.getAttribute("data-vista");
        if (img.getAttribute("src") !== fuente) img.setAttribute("src", fuente);
        var r = fila.getBoundingClientRect();
        dx = x = r.right + 150; dy = y = r.top + r.height / 2;
        caja.style.left = dx + "px"; caja.style.top = dy + "px";
        caja.setAttribute("data-viva", "");
      }
      function sale() { caja.removeAttribute("data-viva"); }
      fila.addEventListener("pointerenter", entra);
      fila.addEventListener("focus", entra);
      fila.addEventListener("pointerleave", sale);
      fila.addEventListener("blur", sale);
      fila.addEventListener("pointermove", function (e) {
        x = e.clientX + 170; y = e.clientY; seguir();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { titulares(); filas(); });
  } else { titulares(); filas(); }
})();
