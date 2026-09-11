(function () {
  "use strict";

  var CASOS = [
    { n: 1, arch: "Caso-1-Local-Verbena.html",  nombre: "Verbena",
      tit: "Un negocio al que quiere su barrio, invisible fuera de él" },
    { n: 2, arch: "Caso-2-Ecommerce-Aura.html",         nombre: "Aura Skincare",
      tit: "De una página de producto a una tienda que se puede tocar" },
    { n: 3, arch: "Caso-3-Datos-Casa-Lumen.html",        nombre: "Casa Lumen",
      tit: "Cuatro tiendas, cuatro hojas de cálculo y ninguna decisión compartida" },
    { n: 4, arch: "Caso-4-B2B-Meridian.html",   nombre: "Meridian Advisory",
      tit: "Doce años de reputación que la web deshacía antes de la primera llamada" },
    { n: 5, arch: "Caso-5-Multilocal-Brasa-Sal.html",   nombre: "Brasa & Sal",
      tit: "Tres restaurantes excelentes, compitiendo entre ellos sin querer" },
    { n: 6, arch: "Caso-6-Contenido-Sobremesa.html",    nombre: "Sobremesa",
      tit: "Lleno los viernes, vacío el resto de la semana" }
  ];

  var doc = document;
  var cuerpo = doc.body;
  var actual = parseInt(cuerpo.getAttribute("data-caso") || "0", 10);
  var reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function caso(n) { return CASOS[((n - 1) % CASOS.length + CASOS.length) % CASOS.length]; }

  function umbral() {
    var v = parseFloat(getComputedStyle(doc.documentElement)
                       .getPropertyValue("--m-umbral"));
    return (v > 0 && v <= 1) ? v : 0.15;
  }

  var aparecer = doc.querySelectorAll(".fx-in");
  if (!reducido && "IntersectionObserver" in window && aparecer.length) {
    var ojo = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        if (!f.isIntersecting) return;
        f.target.classList.add("visto");
        ojo.unobserve(f.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: umbral() });
    aparecer.forEach(function (el) { ojo.observe(el); });
  } else {
    aparecer.forEach(function (el) { el.classList.add("visto"); });
  }

  var barra = doc.querySelector(".fx-barra");
  if (barra) {
    var ultimo = 0, pedido = false;
    addEventListener("scroll", function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(function () {
        pedido = false;
        var y = scrollY;
        if (Math.abs(y - ultimo) > 8) {
          barra.setAttribute("data-oculta", (y > ultimo && y > 140) ? "si" : "no");
          ultimo = y;
        }
      });
    }, { passive: true });
  }

  var cierre = doc.querySelector(".fx-cierre");
  if (barra && cierre && "IntersectionObserver" in window) {
    new IntersectionObserver(function (f) {
      barra.setAttribute("data-sobre", f[0].isIntersecting ? "oscuro" : "claro");
    }, { rootMargin: "-" + (parseInt(getComputedStyle(doc.documentElement)
          .getPropertyValue("--fx-barra-alto")) || 56) + "px 0px -100% 0px" }).observe(cierre);
  }

  if (actual) {
    var sig = caso(actual + 1), ant = caso(actual - 1);

    var enBarra = doc.querySelector(".fx-barra .sig");
    if (enBarra) { enBarra.href = sig.arch; enBarra.textContent = "Siguiente"; }

    var cuenta = doc.querySelector(".fx-barra .cuenta");
    if (cuenta) cuenta.textContent = String(actual).padStart(2, "0") + " / " + String(CASOS.length).padStart(2, "0");

    var bloque = doc.querySelector(".fx-siguiente");
    if (bloque) {
      bloque.href = sig.arch;
      var et = bloque.querySelector(".et"), tit = bloque.querySelector(".tit");
      if (et) et.textContent = "Siguiente caso · " + sig.nombre;
      if (tit) tit.textContent = sig.tit;
    }

    addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var foco = doc.activeElement;
      if (foco && /^(INPUT|TEXTAREA|SELECT)$/.test(foco.tagName)) return;
      if (foco && foco.isContentEditable) return;
      if (e.key === "ArrowRight") location.href = sig.arch;
      else if (e.key === "ArrowLeft") location.href = ant.arch;
    });
  }
})();

(function () {
  "use strict";
  var doc = document;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var CONTENIDO = [
    "> .sello", "> h2", "> h3", "> .cuerpo > p", "> .lede", "> p.entradilla",
    "> figure", "> table", "> .dos-fotos", "> .datos", "> .items",
    "> .fx-ficha", "> blockquote", "> .cifras", "> .embudo", "> .hall"
  ];
  var ALZA = {TABLE: 1, "datos": 1, "cifras": 1, "hall": 1, "items": 1};

  function esAlza(el) {
    if (el.tagName === "TABLE") return true;
    var c = el.className || "";
    return /\b(datos|cifras|hall|items|embudo)\b/.test(c);
  }

  var marcados = [];
  doc.querySelectorAll(".seccion, .fx-cierre").forEach(function (sec) {
    var caja = sec.querySelector(".fx-ancho") || sec;
    var n = 0;
    CONTENIDO.forEach(function (_) {});
    Array.prototype.forEach.call(caja.children, function (el) {
      if (el.classList.contains("fx-in") || el.classList.contains("fx-sube") ||
          el.classList.contains("fx-alza") || el.id === "selector" ||
          el.classList.contains("rastro") || el.classList.contains("semana") ||
          el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      if (!el.textContent.trim() && !el.querySelector("img, svg, canvas")) return;
      el.classList.add(esAlza(el) ? "fx-alza" : "fx-sube");
      el.style.setProperty("--fx-i", String(Math.min(n, 4)));
      n++;
      marcados.push(el);
    });
  });

  doc.querySelectorAll(".seccion h2, .fx-cierre h2").forEach(function (h) {
    if (h.querySelector("i, img, svg")) return;      // ya tiene marcado dentro
    var txt = h.textContent.trim();
    if (!txt || txt.length > 90) return;             // titulares, no párrafos
    var frag = doc.createDocumentFragment();
    txt.split(/\s+/).forEach(function (p, i) {
      var w = doc.createElement("i");
      w.textContent = p;
      w.style.setProperty("--fx-w", String(i));
      frag.appendChild(w);
      frag.appendChild(doc.createTextNode(" "));
    });
    h.textContent = "";
    h.classList.add("fx-frase");
    h.appendChild(frag);
    if (marcados.indexOf(h) === -1) marcados.push(h);
  });

  doc.querySelectorAll("[data-circulo]").forEach(function (el) {
    var largo = 0;
    try { largo = el.getTotalLength(); } catch (e) { largo = 0; }
    if (!largo) return;
    el.style.setProperty("--fx-perim", String(Math.ceil(largo)));
    el.classList.add("fx-circulo");
    marcados.push(el);
  });

  function yaEsta(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (innerHeight || 0);
  }
  var pendientes = [];
  marcados.forEach(function (el) {
    if (yaEsta(el)) {
      el.style.transition = "none";
      el.classList.add("visto");
    } else {
      pendientes.push(el);
    }
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      marcados.forEach(function (el) { el.style.transition = ""; });
    });
  });

  var pidiendo = false, yPrev = scrollY;
  function soltar(el, sinAnimar) {
    if (sinAnimar) {
      el.style.transition = "none";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.transition = ""; });
      });
    }
    el.classList.add("visto");
    ojo.unobserve(el);
  }
  var saltando = 0;
  var ojo = new IntersectionObserver(function (filas) {
    filas.forEach(function (f) {
      if (!f.isIntersecting) return;
      soltar(f.target, Date.now() - saltando < 400);
      var k = pendientes.indexOf(f.target);
      if (k !== -1) pendientes.splice(k, 1);
    });
  }, {threshold: 0.08, rootMargin: "0px 0px -8% 0px"});
  pendientes.forEach(function (el) { ojo.observe(el); });

  function barrer() {
    pidiendo = false;
    var h = innerHeight || 0;
    var salto = Math.abs(scrollY - yPrev) > h;
    if (salto) saltando = Date.now();
    yPrev = scrollY;
    var alFinal = (scrollY + h) >= (document.documentElement.scrollHeight - h * 0.5);
    for (var i = pendientes.length - 1; i >= 0; i--) {
      var el = pendientes[i];
      if (alFinal || el.getBoundingClientRect().top < h) {
        soltar(el, salto || alFinal);
        pendientes.splice(i, 1);
      }
    }
    if (!pendientes.length) removeEventListener("scroll", alScroll);
  }
  function alScroll() {
    if (pidiendo) return;
    pidiendo = true;
    requestAnimationFrame(barrer);
  }
  if (pendientes.length) addEventListener("scroll", alScroll, {passive: true});
})();

(function () {
  "use strict";
  var tiras = document.querySelectorAll(".tira");
  if (!tiras.length) return;
  var suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HUECO = 14;                       /* el `gap` de .tira, en px */

  function montar(tira) {
    if (tira.scrollWidth <= tira.clientWidth + 4) return false;

    var caja = document.createElement("div");
    caja.className = "fx-carrusel";
    tira.parentNode.insertBefore(caja, tira);
    caja.appendChild(tira);

    var piezas = tira.children.length;
    var mando = document.createElement("div");
    mando.className = "fx-mando";
    mando.innerHTML =
      '<button class="fx-ir" type="button" data-ir="-1" aria-label="Pieza anterior">‹</button>' +
      '<span class="fx-pos" aria-live="polite">1 / ' + piezas + '</span>' +
      '<button class="fx-ir" type="button" data-ir="1" aria-label="Pieza siguiente">›</button>';

    var serie = tira.closest(".serie");
    var cab = serie && serie.querySelector(".serie-cab");
    var paso = cab && cab.querySelector(".paso");
    if (paso && /desliza/i.test(paso.textContent)) { paso.parentNode.replaceChild(mando, paso); }
    else if (cab) { cab.appendChild(mando); }
    else { mando.classList.add("suelto"); caja.parentNode.insertBefore(mando, caja); }

    var atras = mando.querySelector('[data-ir="-1"]');
    var alante = mando.querySelector('[data-ir="1"]');
    var pos = mando.querySelector(".fx-pos");

    function salto() {
      var uno = tira.children[0];
      return uno ? uno.getBoundingClientRect().width + HUECO : tira.clientWidth * 0.8;
    }
    function pintar() {
      var x = tira.scrollLeft, max = tira.scrollWidth - tira.clientWidth;
      caja.setAttribute("data-ini", x > 4 ? "si" : "no");
      caja.setAttribute("data-fin", x < max - 4 ? "si" : "no");
      atras.disabled = x <= 4;
      alante.disabled = x >= max - 4;
      pos.textContent = Math.min(piezas, Math.round(x / salto()) + 1) + " / " + piezas;
    }

    mando.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".fx-ir");
      if (!b || b.disabled) return;
      tira.scrollBy({ left: salto() * (+b.getAttribute("data-ir")),
                      behavior: suave ? "smooth" : "auto" });
    });
    var pidiendo = false;
    tira.addEventListener("scroll", function () {
      if (pidiendo) return;
      pidiendo = true;
      requestAnimationFrame(function () { pidiendo = false; pintar(); });
    }, { passive: true });
    addEventListener("resize", pintar);
    pintar();
    return true;
  }

  function todas() {
    Array.prototype.forEach.call(tiras, function (t) {
      if (!t.parentNode.classList.contains("fx-carrusel")) montar(t);
    });
  }
  todas();
  addEventListener("load", todas);
})();
