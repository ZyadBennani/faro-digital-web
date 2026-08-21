/* ═══════════════════════════════════════════════════════════════════════════
   escena-faro.js — la escena N4 del faro, como componente reutilizable.

   🔴 POR QUÉ ES UN ARCHIVO Y NO CÓDIGO PEGADO EN CADA PÁGINA.
   El 2026-08-21 esta escena pasó a usarse en dos sitios: el bloque de Nivel 4
   de `levels.html` y el hero de la portada. Copiarla habría significado tener
   el shader escrito dos veces — que es EXACTAMENTE el fallo que se acababa de
   corregir dentro de ella misma (el ángulo del haz vivía en el GLSL y en el
   JavaScript a la vez).

       Se extrae antes de tener el problema, no después.

   Uso:  faroEscena({ caja: "#n4Escena", palabras: "#n4Palabras span" });

   Devuelve `true` si la escena arrancó. Si devuelve `false` la página tiene que
   seguir siendo legible por sí sola: el texto de reserva y las palabras están
   en el DOM, no aquí.
   ═══════════════════════════════════════════════════════════════════════════ */
window.faroEscena = function (opciones) {
  "use strict";
  var op = opciones || {};

/* ═══════════════════════════════════════════════════════════════════════════
   N4 · EL FARO — WebGL escrito a mano, sin three.js.
   2026-08-20. Tarea B2 del Sprint 1.

   ⭐ POR QUÉ SIN LIBRERÍA, otra vez.
   El catálogo asigna three.js al Nivel 4. La regla del sistema es que la
   dependencia se declara AL CONSTRUIR, y lleva 6 de 6 sin ganárselo. Aquí
   tampoco: no hay modelo que cargar, ni materiales, ni jerarquía de escena —
   hay UN plano y un fragment shader. three.js serviría para traer 150 KB y
   dibujar el mismo rectángulo.
   Se ganará su sitio el día que haya que cargar un glTF con materiales.

   ⭐ QUÉ HACE, Y POR QUÉ ESO Y NO OTRA COSA.
   El haz del faro barre y REVELA el texto a su paso. No es decoración: es lo
   que Faro vende — hacer visible lo que el negocio ya tiene. Y es el gesto
   que el propio logo contiene (misma conclusión que C27).

   🔴 TRES COSAS APRENDIDAS ROMPIÉNDOLAS ANTES, aplicadas aquí desde el inicio:
   · El primer fotograma se dibuja DIRECTO, no esperando a rAF   (C30)
   · El tamaño se mide dentro del bucle, no con ResizeObserver   (C23)
   · Si algo falla, el hueco NO queda vacío: la reserva visual   (C23/C28)
     está SIEMPRE debajo, no solo cuando hay error.
   ═══════════════════════════════════════════════════════════════════════════ */
  var caja = document.querySelector(op.caja || "#n4Escena");
  var cv = caja ? caja.querySelector("canvas") : null;
  if (!caja || !cv) return;

  /* Puerta 1 · quien pidió menos movimiento no recibe una escena que se mueve. */
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var gl = cv.getContext("webgl", { antialias: false, alpha: false });
  /* Puerta 2 · sin WebGL no se toca nada: la reserva visual ya está puesta. */
  if (!gl) return;

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";

  var FS = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_t; uniform float u_ang;",

    /* 🔴 AQUÍ VIVÍA UNA COPIA DE LA FÓRMULA DEL BARRIDO, y el JavaScript
       tenía la otra para revelar las palabras. La misma cuenta, en dos
       lenguajes, con un comentario que decía «si una cambia, cambian las dos».
       Eso no es una advertencia: es un aviso de que el diseño estaba mal.
       Ahora el ángulo se calcula UNA vez, en JavaScript, y llega como
       uniforme. El shader dibuja; no decide.
           Dos fuentes para el mismo hecho se desincronizan. Siempre.
       Y quitarlo abre lo que el nivel pedía: si el ángulo es un dato de
       entrada, el haz puede obedecer a algo que no sea el reloj. */

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  vec2 p  = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;",

    /* ── Cielo nocturno: un degradado, nada de negro plano ── */
    "  vec3 col = mix(vec3(0.015,0.055,0.040), vec3(0.040,0.105,0.080), uv.y);",

    /* ── El mar: una banda baja con brillo ── */
    "  float mar = smoothstep(0.30, 0.26, uv.y);",
    "  float onda = sin(p.x*22.0 + u_t*0.8)*0.004 + sin(p.x*41.0 - u_t*1.3)*0.002;",
    "  col = mix(col, vec3(0.020,0.050,0.045), mar);",

    /* ── La torre: la silueta del logo, en 2D sobre el plano ── */
    "  vec2 q = p - vec2(0.0, -0.16);",
    "  float ancho = mix(0.052, 0.026, clamp(q.y/0.34, 0.0, 1.0));",
    "  float torre = step(abs(q.x), ancho) * step(0.0, q.y) * step(q.y, 0.34);",
    "  float base  = step(abs(q.x), 0.085) * step(-0.035, q.y) * step(q.y, 0.0);",
    "  float silueta = clamp(torre + base, 0.0, 1.0);",

    /* ── La lámpara ── */
    "  vec2 lampara = vec2(0.0, 0.20);",
    "  float d = length(p - lampara);",
    "  float halo = exp(-d*d*130.0);",

    /* ── EL HAZ. Es el corazón de la escena y de la idea. ── */
    "  float ang = u_ang;",
    "  vec2 dir = vec2(sin(ang), cos(ang)*0.34);",
    "  vec2 rel = p - lampara;",
    "  float a = dot(normalize(rel + 1e-5), normalize(dir));",
    /* cono estrecho, y se apaga con la distancia para que no llene el cuadro */
    "  float cono = pow(clamp(a, 0.0, 1.0), 46.0);",
    "  float lejos = exp(-length(rel)*1.25);",
    "  float haz = cono * lejos * 0.85;",
    /* el haz solo existe hacia arriba-fuera, nunca dentro de la torre */
    "  haz *= (1.0 - silueta);",

    "  vec3 oro = vec3(0.788, 0.651, 0.404);",
    "  col += oro * (haz*0.75 + halo*1.35);",
    "  col = mix(col, vec3(0.055,0.115,0.090), silueta);",
    "  col += oro * halo * silueta * 0.25;",

    /* Viñeta suave: da volumen sin ensuciar */
    "  col *= 1.0 - 0.42*pow(length(uv-0.5)*1.25, 2.2);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compilar(tipo, fuente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      /* Un shader que no compila NO deja un hueco: se deja la reserva y fuera. */
      console.error("[N4] shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compilar(gl.VERTEX_SHADER, VS);
  var fs = compilar(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("[N4] link:", gl.getProgramInfoLog(prog));
    return false;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "u_res");
  var uT   = gl.getUniformLocation(prog, "u_t");
  var uAng = gl.getUniformLocation(prog, "u_ang");

  /* ⭐ EL REVELADO. Las palabras son <span> del DOM, no píxeles del shader:
     se seleccionan con el ratón, Ctrl+F las encuentra y Google las lee.
     Lo único que hace el JavaScript es subirles la opacidad cuando el haz
     pasa por su x. Si esto no se ejecutara, las palabras seguirían ahí. */
  var palabras = [].slice.call(caja.querySelectorAll(op.palabras || ".n4-palabras span"));

  /* ⭐ LA ÚNICA FUENTE DEL ÁNGULO. El shader lo recibe y el revelado lo usa:
     la luz que se pinta y las palabras que se encienden no pueden discrepar
     porque ya no hay dos cuentas. */
  var TOPE = 1.05;                       // hasta dónde llega el barrido
  function barrido(seg) { return Math.sin(seg * 0.55) * TOPE; }

  /* 🔴 EL REVELADO. Las palabras son <span> del DOM, no píxeles del shader:
     se seleccionan con el ratón, Ctrl+F las encuentra y Google las lee.
     Lo único que hace el JavaScript es subirles la opacidad cuando el haz
     pasa por su x. Si esto no se ejecutara, las palabras seguirían ahí. */
  function revelar(ang) {
    var hazX = 0.5 + Math.sin(ang) * 0.58;   // de ángulo a x dentro de la caja
    palabras.forEach(function (el) {
      var x = parseFloat(el.style.left) / 100;
      var cerca = 1 - Math.min(1, Math.abs(x - hazX) / 0.26);
      el.style.opacity = (0.10 + Math.pow(cerca, 1.6) * 0.90).toFixed(3);
    });
  }

  /* ⭐ EL HAZ OBEDECE AL CURSOR — y no es un adorno, es el argumento.
     Faro vende hacer visible lo que un negocio ya tiene. Aquí lo señalas tú:
     mueves el ratón y eso decide qué palabra se enciende. Un nivel llamado
     «experimental» que solo corre un reloj es una animación, no una escena.

     Tres decisiones:
     · En TÁCTIL no se activa. No hay «apuntar» sin puntero, y secuestrar el
       dedo en una página que se lee bajando es peor experiencia, no mejor.
     · Al salir NO se corta: el ángulo vuelve al barrido interpolando, así que
       no hay salto.
     · Con `prefers-reduced-motion` esto ni existe: la escena entera sale antes. */
  var angObjetivo = null;                // null = manda el reloj
  var angActual = 0;
  caja.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    var r = caja.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;                 // 0..1
    var s = Math.max(-1, Math.min(1, (x - 0.5) / 0.58));    // inversa de hazX
    angObjetivo = Math.max(-TOPE, Math.min(TOPE, Math.asin(s)));
  }, { passive: true });
  caja.addEventListener("pointerleave", function () { angObjetivo = null; }, { passive: true });

  var t0 = performance.now();
  var visible = true;

  function dibujar(ahora) {
    /* El tamaño se mide AQUÍ. ResizeObserver ha fallado dos veces en este
       sistema: existe, no da error y no llama nunca. */
    var w = Math.round(caja.clientWidth * Math.min(devicePixelRatio || 1, 2));
    var h = Math.round(caja.clientHeight * Math.min(devicePixelRatio || 1, 2));
    if (w > 0 && h > 0 && (cv.width !== w || cv.height !== h)) {
      cv.width = w; cv.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, cv.width, cv.height);
    var seg = (ahora - t0) / 1000;

    /* El ángulo, una vez: del cursor si hay cursor, del reloj si no.
       Se persigue el destino en vez de saltar a él, así que entrar y salir
       del recuadro no produce un tirón. */
    var destino = (angObjetivo === null) ? barrido(seg) : angObjetivo;
    angActual += (destino - angActual) * 0.12;

    gl.uniform1f(uT, seg);
    gl.uniform1f(uAng, angActual);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    revelar(angActual);
    if (visible) requestAnimationFrame(dibujar);
  }

  /* 🔴 El PRIMER fotograma, directo. En C30 se perdió una hora por dejarlo
     todo dentro de requestAnimationFrame: el canvas se quedaba en negro. */
  dibujar(performance.now());
  caja.classList.add("viva");
  requestAnimationFrame(dibujar);

  /* Fuera de pantalla no se pinta: es una escena en una página larga y no
     tiene por qué gastar batería mientras nadie la mira. */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (ent) {
      ent.forEach(function (e) {
        if (e.isIntersecting && !visible) { visible = true; requestAnimationFrame(dibujar); }
        else if (!e.isIntersecting) { visible = false; }
      });
    }, { threshold: 0.05 }).observe(caja);
  }

  return true;
};
