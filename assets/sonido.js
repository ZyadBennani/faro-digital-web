(function () {
  'use strict';

  var CLAVE = 'faro-sonido';
  var reducido = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function encendido() {
    try {
      var v = localStorage.getItem(CLAVE);
      return v === null ? true : v === '1';   /* sin decisión previa: encendido */
    } catch (e) { return true; }
  }
  function guardar(v) {
    try { localStorage.setItem(CLAVE, v ? '1' : '0'); } catch (e) {}
  }

  var ctx = null;
  function motor() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }

  function tono(frec, ms, vol, forma) {
    var c = motor();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    var t = c.currentTime;
    var osc = c.createOscillator();
    var gan = c.createGain();
    osc.type = forma || 'sine';
    osc.frequency.setValueAtTime(frec, t);
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gan); gan.connect(c.destination);
    osc.start(t); osc.stop(t + ms / 1000 + 0.02);
  }

  var SONIDOS = {
    tic:   function () { tono(760, 110, 0.28, 'triangle'); },
    tirar: function () { tono(470, 130, 0.26, 'triangle'); },
    hecho: function () { tono(620, 140, 0.30, 'triangle');
                         setTimeout(function () { tono(930, 190, 0.26, 'triangle'); }, 95); }
  };

  window.faroSonido = function (nombre) {
    if (reducido || !encendido()) return;
    var s = SONIDOS[nombre];
    if (s) { try { s(); } catch (e) {} }
  };

  function pintarInterruptor() {
    var barra = document.querySelector('.legal .wrap-legal');
    if (!barra || document.getElementById('faro-son')) return;
    if (reducido) return;   /* a quien pide menos estímulo no se le ofrece más */

    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'faro-son';
    b.className = 'son-int';
    b.setAttribute('aria-pressed', encendido() ? 'true' : 'false');

    function rotular() {
      var on = encendido();
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '♪ Sonido activado' : '♪ Sonido';
      b.title = on ? 'Apagar los sonidos de la interfaz'
                   : 'Tres sonidos muy discretos al pulsar.';
    }
    rotular();

    b.addEventListener('click', function () {
      var nuevo = !encendido();
      guardar(nuevo);
      rotular();
      if (nuevo) { motor(); SONIDOS.tic(); }   /* se oye lo que acabas de activar */
    });

    barra.appendChild(b);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.rub-eje')) window.faroSonido('tic');
    else if (e.target.closest('.filtros button, .indice a, .work-card')) window.faroSonido('tic');
    else if (e.target.closest('#ck-btn')) window.faroSonido('tic');
  }, true);

  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('[class*="tirador"], [class*="antes-despues"]')) window.faroSonido('tirar');
  }, true);

  document.addEventListener('faro:check-listo', function () { window.faroSonido('hecho'); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pintarInterruptor);
  } else {
    pintarInterruptor();
  }
})();
