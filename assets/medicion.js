(function () {
  "use strict";

  var CONFIG = {

    endpoint: "/api/evento",
    sitio: "faro-web",
    debug: false
  };

  if (navigator.webdriver) return;

  var REGLAS = [
    { evento: "clic_hablemos",        selector: 'a[href*="#contacto"], a[href$="/#contacto"]',
      soloEn: /^\/portfolio\//, detalle: origenCorto },
    { evento: "clic_cta_auditoria",   selector: 'a[href*="#contact"], a[href*="/audit"], a[href*="audit.html"]' },
    { evento: "clic_check_gratuito",  selector: 'a[href="/check"], a[href*="check.html"]' },
    { evento: "clic_demo_dashboard",  selector: 'a[href*="dashboard-demo"]' },
    { evento: "clic_caso_portfolio",  selector: 'a[href*="Caso-"], a[href*="/portfolio/caso-"]' },
    { evento: "clic_newsletter",      selector: 'a[href*="signal"]' },
    { evento: "clic_email",           selector: 'a[href^="mailto:"]' }
  ];

  var FORMULARIOS = {
    contactForm:     "envio_contacto",
    newsletterForm:  "envio_newsletter",
    "check-form":    "uso_check_gratuito",
    "fd-audit-form": "envio_auditoria"
  };

  function registrar(evento, detalle) {
    var dato = {
      sitio: CONFIG.sitio,
      evento: evento,
      pagina: location.pathname,
      detalle: detalle || null
    };

    if (CONFIG.debug) console.log("[medición]", evento, detalle || "");

    try {
      navigator.sendBeacon(CONFIG.endpoint, JSON.stringify(dato));
    } catch (e) {
    }
  }

  function origenCorto() {
    var t = location.pathname.replace(/\/$/, "").split("/").pop();
    return t && t !== "portfolio" ? t.slice(0, 48) : "indice";
  }

  function nombreCorto(url) {
    var n = "";
    try {
      n = String(url || "")
        .split("?")[0].split("#")[0]
        .replace(/\.html?$/i, "")
        .replace(/^.*\//, "")
        .toLowerCase();
    } catch (e) { n = ""; }
    if (!n || n.length > 48 || !/^[a-z0-9-]+$/.test(n)) return null;
    return n;
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href], [data-medir]") : null;
    if (!a) return;

    var explicito = a.getAttribute("data-medir");
    if (explicito) { registrar(explicito, nombreCorto(a.getAttribute("href"))); return; }

    for (var i = 0; i < REGLAS.length; i++) {
      var R = REGLAS[i];
      if (R.soloEn && !R.soloEn.test(location.pathname)) continue;
      if (a.matches(R.selector)) {
        registrar(R.evento, R.detalle ? R.detalle() : nombreCorto(a.getAttribute("href")));
        return;                                  // un clic, un evento
      }
    }
  }, true);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || !f.id) return;
    var evento = FORMULARIOS[f.id];
    if (evento) registrar(evento, null);
  }, true);

  var HITOS = [25, 50, 75, 100], vistos = {};

  function porcentaje() {
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    if (alto <= 0) return null;                  // la página cabe entera
    return ((window.scrollY || window.pageYOffset) / alto) * 100;
  }

  function mirarScroll() {
    var pct = porcentaje();
    if (pct === null) return;
    for (var i = 0; i < HITOS.length; i++) {
      var h = HITOS[i];
      if (!vistos[h] && pct >= (h === 100 ? 99.5 : h)) {
        vistos[h] = 1;
        registrar("scroll_" + h, null);
      }
    }
    if (vistos[100]) window.removeEventListener("scroll", mirarScroll);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var pct = porcentaje();
      if (pct !== null && pct > 1) {
        for (var i = 0; i < HITOS.length; i++) {
          if (pct >= (HITOS[i] === 100 ? 99.5 : HITOS[i])) vistos[HITOS[i]] = 1;
        }
      }
      window.addEventListener("scroll", mirarScroll, { passive: true });
    });
  });

  var visibleDesde = document.visibilityState === "visible" ? Date.now() : 0;
  var acumulado = 0, enviado = false;

  function tramo(seg) {
    if (seg < 10) return "0-10s";
    if (seg < 30) return "10-30s";
    if (seg < 60) return "30-60s";
    if (seg < 180) return "1-3min";
    return "3min+";
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      visibleDesde = Date.now();
    } else if (visibleDesde) {
      acumulado += Date.now() - visibleDesde;
      visibleDesde = 0;
    }
  });

  if (document.body && document.body.getAttribute("data-error") === "404") {
    registrar("vista_404", null);
  }

  window.addEventListener("pagehide", function () {
    if (enviado) return;                         // pagehide puede repetirse
    enviado = true;
    if (visibleDesde) acumulado += Date.now() - visibleDesde;
    var seg = Math.round(acumulado / 1000);
    if (seg >= 2) registrar("tiempo_pagina", tramo(seg));
  });

  if (!CONFIG.endpoint) {
    console.warn("[medición] Sin endpoint configurado: NO se está guardando nada.");
  }
})();
