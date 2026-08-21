/*
 * medicion.js — medición del sitio propio de Faro Digital
 * ===========================================================================
 * POR QUÉ EXISTE, y conviene decirlo sin adornos:
 * el 2026-08-20, auditando el sitio con la propia herramienta de Faro
 * (`qa-web`), salió que las 13 páginas en producción NO median absolutamente
 * nada. Faro vende marketing basado en datos y no sabía de dónde le llegaban
 * sus propios contactos. Este archivo cierra ese agujero.
 *
 * DE DÓNDE SALE: es la adaptación del `medicion.js` que ya funciona en la web
 * de un cliente real. Mismo patrón, mismo endpoint propio, misma decisión de privacidad.
 *
 * PRIVACIDAD — y esto no es un extra, es el diseño:
 *   · Ni una cookie. Ni un identificador. Ni un dato personal.
 *   · No se guarda IP, ni user-agent, ni referrer, ni nada que permita
 *     reconocer a una persona entre dos visitas.
 *   · Solo se cuenta QUÉ pasó y EN QUÉ PÁGINA.
 *   · Por eso no hace falta banner de cookies — y por eso es argumento de
 *     venta: "nuestra web no rastrea a nadie, y la tuya tampoco tendrá que
 *     hacerlo para saber si funciona".
 *   Si algún día se añade cualquier identificador, esto deja de ser cierto y
 *   hay que rehacer el análisis legal desde cero.
 *
 * CÓMO SE INSTRUMENTA: por PATRÓN DE ENLACE, no marcando el HTML a mano.
 * Una sola línea por página y cero cambios en el marcado — que es justo donde
 * se rompen estas cosas cuando alguien rehace una sección y olvida el atributo.
 * Si hace falta marcar algo explícitamente: <a data-medir="nombre_evento">
 * ===========================================================================
 */
(function () {
  "use strict";

  var CONFIG = {
    // Función del propio Netlify que ya aloja este sitio. No es una herramienta
    // de terceros: sin cuenta nueva, sin coste, sin subencargado que documentar
    // en el registro de RGPD, y los datos se quedan donde ya está la web.
    endpoint: "/.netlify/functions/save-event",
    sitio: "faro-web",
    // true = además escribe cada evento en la consola. Útil al verificar.
    debug: false
  };

  /* Los eventos que importan, ordenados por valor para el negocio.
     No se mide "todo por si acaso": cada uno responde a una pregunta concreta. */
  var REGLAS = [
    // ¿Cuántos llegan a pedir la auditoría? — es LA métrica del negocio
    { evento: "clic_cta_auditoria",   selector: 'a[href*="#contact"], a[href*="/audit"], a[href*="audit.html"]' },
    // ¿La herramienta gratuita atrae, o se ignora?
    { evento: "clic_check_gratuito",  selector: 'a[href="/check"], a[href*="check.html"]' },
    // ¿El panel en vivo (el diferenciador frente a la competencia) se usa?
    { evento: "clic_demo_dashboard",  selector: 'a[href*="dashboard-demo"]' },
    // ¿Qué caso del portfolio interesa de verdad?
    { evento: "clic_caso_portfolio",  selector: 'a[href*="Caso-"], a[href*="/portfolio/caso-"]' },
    // ¿El contenido educativo retiene?
    { evento: "clic_newsletter",      selector: 'a[href*="signal"]' },
    // Contacto directo: el que ya decidió
    { evento: "clic_email",           selector: 'a[href^="mailto:"]' }
  ];

  /* Formularios: el envío es la conversión real, no el clic. */
  var FORMULARIOS = {
    contactForm:     "envio_contacto",
    newsletterForm:  "envio_newsletter",
    "check-form":    "uso_check_gratuito",
    "fd-audit-form": "envio_auditoria"
  };

  // -----------------------------------------------------------------------
  function registrar(evento, detalle) {
    var dato = {
      sitio: CONFIG.sitio,
      evento: evento,
      pagina: location.pathname,
      detalle: detalle || null
      // La marca de tiempo la pone el SERVIDOR: el reloj del visitante puede
      // venir en cualquier año y ensuciaría la serie para siempre.
    };

    if (CONFIG.debug) console.log("[medición]", evento, detalle || "");

    try {
      // sendBeacon sobrevive a que la pestaña se cierre al navegar fuera.
      // Imprescindible: casi todos estos clics llevan a otra página.
      navigator.sendBeacon(CONFIG.endpoint, JSON.stringify(dato));
    } catch (e) {
      /* la medición NUNCA puede romper la navegación de nadie */
    }
  }

  /* Nombre corto de la página o del recurso, para saber QUÉ se pulsó.
     Blindado: si sale algo que no parece un nombre razonable, se descarta
     antes que meter basura en el informe. */
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

  // -----------------------------------------------------------------------
  // Un solo escuchador en el documento, en fase de captura. Así funciona
  // también con enlaces que se añadan después, sin volver a enganchar nada.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href], [data-medir]") : null;
    if (!a) return;

    // Marcado explícito: manda sobre cualquier regla
    var explicito = a.getAttribute("data-medir");
    if (explicito) { registrar(explicito, nombreCorto(a.getAttribute("href"))); return; }

    for (var i = 0; i < REGLAS.length; i++) {
      if (a.matches(REGLAS[i].selector)) {
        registrar(REGLAS[i].evento, nombreCorto(a.getAttribute("href")));
        return;                                  // un clic, un evento
      }
    }
  }, true);

  // -----------------------------------------------------------------------
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || !f.id) return;
    var evento = FORMULARIOS[f.id];
    if (evento) registrar(evento, null);
  }, true);

  // -----------------------------------------------------------------------
  // Lectura real: llegar al 75 % separa "entró y se fue" de "leyó".
  var marcado = false;
  function mirarScroll() {
    if (marcado) return;
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    if (alto <= 0) return;                       // la página cabe entera
    if ((window.scrollY || window.pageYOffset) / alto >= 0.75) {
      marcado = true;
      registrar("scroll_75", null);
      window.removeEventListener("scroll", mirarScroll);
    }
  }
  window.addEventListener("scroll", mirarScroll, { passive: true });

  // -----------------------------------------------------------------------
  // Aviso en consola si esto se queda a medias. El fallo más caro de una
  // medición es el silencioso: parece instalada y no escribe en ningún sitio.
  // Ya pasó en la web de un cliente — endpoint vacío y depuración apagada, cero rastro.
  if (!CONFIG.endpoint) {
    console.warn("[medición] Sin endpoint configurado: NO se está guardando nada.");
  }
})();
