/* `/test/faro` · comportamiento de la página (copiado del test B11).
   La pieza firma vive aparte, en `pieza.js`: aquí no se toca.
   Cinco cosas y ninguna más:
   1. El vídeo del hero se reproduce solo mientras está en pantalla.
   2. El botón «Menú» abre y cierra la lista de enlaces en móvil.
   3. (Paso 2) Los textos del hero se desvanecen en los primeros 60 vh de scroll.
   4. (Paso 2) Los cuatro bloques aparecen cuando el testigo entra en pantalla.
   5. (Paso 3) Cada sección revela sus filas en cascada al 15 % visible, una vez. */
(function () {
  'use strict';

  var video = document.querySelector('.hero-video');
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* v3 · el vídeo del hero ya no existe (el poster fijo es lo que queda con
     prefers-reduced-motion); el null-check de abajo lo cubre. */
  if (video && !quieto) video = null;

  if (video && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          var p = video.play();
          if (p && p.catch) p.catch(function () { /* autoplay bloqueado: se queda el poster */ });
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    io.observe(video);
  }

  /* (Paso 4) El vídeo del cierre: preload="none", así no pide ni un byte hasta
     que se acerca al viewport (200 px antes). Pausa al salir. Con
     prefers-reduced-motion no se toca: se queda el poster. */
  /* En ≤ 640 px el vídeo del cierre no tiene ninguna fuente que coincida: no se
     observa siquiera, para no pedirle que reproduzca lo que no existe. */
  var cierre = document.querySelector('.cierre-video');
  if (cierre && !cierre.querySelector('source[src]:not([media*="min-width"])') && matchMedia('(max-width: 640px)').matches) {
    cierre = null;
  }
  if (cierre && !quieto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          var p = cierre.play();
          if (p && p.catch) p.catch(function () { /* autoplay bloqueado: se queda el poster */ });
        } else {
          cierre.pause();
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0 }).observe(cierre);
  }

  var boton = document.querySelector('.hero-menu');
  var menu = document.getElementById('menuMovil');
  if (boton && menu) {
    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      boton.textContent = abierto ? 'Menú' : 'Cerrar';
      menu.hidden = abierto;
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        boton.setAttribute('aria-expanded', 'false');
        boton.textContent = 'Menú';
        menu.hidden = true;
      }
    });
  }

  /* 3. Desvanecido de los textos del hero: opacidad 1 → 0 entre 0 y 60 vh de
        scroll. Solo en la escena fija (≥ 769 px); en móvil no hay nada que
        desvanecer porque el hero se va con el scroll. */
  var hero = document.querySelector('.hero');
  var fijo = matchMedia('(min-width: 769px)');
  var pendiente = false;
  function alScroll() {
    pendiente = false;
    if (!hero) return;
    if (!fijo.matches) {
      hero.style.setProperty('--k-desvanece', 1);
      hero.classList.remove('sin-texto');
      return;
    }
    var v = 1 - Math.min(window.scrollY / (window.innerHeight * 0.6), 1);
    hero.style.setProperty('--k-desvanece', v.toFixed(3));
    hero.classList.toggle('sin-texto', v <= 0);
  }
  window.addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); }
  }, { passive: true });
  window.addEventListener('resize', alScroll);
  alScroll();

  /* 4. Los cuatro bloques: cascada de 120 ms (en CSS) cuando el testigo, puesto
        a 160 vh del inicio, entra por abajo del viewport, es decir, a 60 vh de
        scroll. Al subir por encima, se van en la salida corta. */
  var oferta = document.querySelector('.oferta');
  var marca = document.querySelector('.escena-marca');
  if (oferta && marca && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var pasado = e.boundingClientRect.top < 0; // el testigo ya quedó arriba
        oferta.classList.toggle('es-visible', e.isIntersecting || pasado);
      });
    }).observe(marca);
  }

  /* 5. (Ronda 3) La cabecera se retira al bajar y vuelve al subir. Mientras el
        hero sigue en pantalla no se retira nunca: ahí es parte de la portada.
        Solo en escritorio; en móvil la cabecera es absoluta y se va con el scroll. */
  var cabecera = document.querySelector('.hero-arriba');
  if (cabecera && hero) {
    var ultimaY = window.scrollY;
    var pendienteCab = false;
    function cabeceraAlScroll() {
      pendienteCab = false;
      var y = window.scrollY;
      if (y === ultimaY) return;      // v3: un scroll que no se mueve no es «subir»: la cabecera no vuelve sola
      var baja = y > ultimaY;
      ultimaY = y;
      if (!fijo.matches) { cabecera.classList.remove('oculta'); return; }
      // El hero es sticky: mientras su borde inferior siga dentro del viewport,
      // la cabecera se queda.
      if (hero.getBoundingClientRect().bottom > 0) { cabecera.classList.remove('oculta'); return; }
      cabecera.classList.toggle('oculta', baja);
    }
    window.addEventListener('scroll', function () {
      if (!pendienteCab) { pendienteCab = true; requestAnimationFrame(cabeceraAlScroll); }
    }, { passive: true });
    window.addEventListener('resize', cabeceraAlScroll);
  }

  /* 6. Secciones 3-6: al 15 % visible (el umbral de motion.css), una sola vez.
        Sin IntersectionObserver, o sin JavaScript, el CSS no oculta nada que no
        pueda revelarse: html.js no interviene aquí, así que se fuerza visible. */
  var secciones = document.querySelectorAll('.seccion, .pie');
  if ('IntersectionObserver' in window) {
    var ioSecciones = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('es-visible');
          ioSecciones.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    secciones.forEach(function (s) { ioSecciones.observe(s); });
  } else {
    secciones.forEach(function (s) { s.classList.add('es-visible'); });
  }
})();
