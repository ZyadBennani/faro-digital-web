window.faroEscena = function (opciones) {
  "use strict";
  var op = opciones || {};

  var caja = document.querySelector(op.caja || "#n4Escena");
  var cv = caja ? caja.querySelector("canvas") : null;
  if (!caja || !cv) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var gl = cv.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) return;

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";

  var FS = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_t; uniform float u_ang; uniform vec2 u_foco;",
    "uniform vec2 u_foco_uv;",
    "uniform float u_frente;",

    "float grano(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }",

    "float hash21(vec2 p){",
    "  vec3 q = fract(vec3(p.x, p.y, p.x) * 0.1031);",
    "  q += dot(q, q.yzx + 33.33);",
    "  return fract((q.x + q.y) * q.z);",
    "}",
    "float ruido(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f*f*(3.0-2.0*f);",
    "  return mix(mix(hash21(i),            hash21(i+vec2(1.0,0.0)), u.x),",
    "             mix(hash21(i+vec2(0.0,1.0)), hash21(i+vec2(1.0,1.0)), u.x), u.y);",
    "}",
    "float fbm3(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for (int k = 0; k < 3; k++){ v += a*ruido(p); p *= 2.03; a *= 0.5; }",
    "  return v;",
    "}",
    "float fbm2(vec2 p){ return 0.5*ruido(p) + 0.25*ruido(p*2.03); }",

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  vec2 p  = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;",

    "  vec3 fondo = mix(vec3(0.020,0.062,0.046), vec3(0.047,0.118,0.090), pow(uv.y,0.85));",
    "  vec3 col = fondo;",

    "  vec2 foco = u_foco;",
    "  vec2 rel = p - foco;",
    "  float d = length(rel);",

    "  float ang = u_ang;",
    "  vec2 dir = vec2(cos(ang), sin(ang));",
    "  vec2 rn = normalize(rel + 1e-5);",
    "  vec2 dn = normalize(dir);",
    "  float a  = dot(rn, dn);",
    "  float ai = dot(rn, -dn);",
    "  float apertura = mix(30.0, 7.0, clamp(d*0.85, 0.0, 1.0));",
    "  float lobulo  = pow(clamp(a , 0.0, 1.0), apertura);",
    "  float lobuloI = pow(clamp(ai, 0.0, 1.0), apertura);",
    "  float lejos = exp(-d*0.62);",
    "  float haz = (lobulo + lobuloI) * lejos;",

    "  vec2 lat = vec2(-dn.y, dn.x);",
    "  float t = dot(rel, dn);",
    "  float n = dot(rel, lat);",
    "  float polvo = 0.5;",
"  if (haz > 0.0025) polvo = fbm3(vec2(abs(t)*4.6 - u_t*0.19, n*15.0));",
    "  haz *= mix(0.62, 1.34, polvo);",

    "  float nucleo = exp(-d*d*1500.0);",
    "  float halo   = exp(-d*d*90.0)*0.55;",
    "  float aura   = exp(-d*d*9.0)*0.16;",

    "  float latido = 0.92 + 0.08*sin(u_t*1.15);",
    "  float flash = u_frente;",

    "  vec3 oro   = vec3(0.788, 0.651, 0.404);",
    "  vec3 calido= vec3(1.000, 0.945, 0.845);",

    "  vec3 tonoHaz = mix(oro, calido, clamp(1.0 - d*1.9, 0.0, 1.0));",
"  col += tonoHaz * haz * (0.52 + flash*0.22) * latido;",
    "  col += oro * (halo + aura) * latido * (1.0 + flash*1.9);",
    "  col += calido * nucleo * 1.15 * latido * (1.0 + flash*2.6);",

    "  float HOR = 0.38;",                     /* altura del horizonte, en uv */
    "  float enAgua = smoothstep(HOR + 0.012, HOR - 0.012, uv.y);",
    "  if (enAgua > 0.001) {",
    "    float prof = clamp((HOR - uv.y) / HOR, 0.0, 1.0);",
    "    float escalaY = mix(120.0, 15.0, prof);",
    "    float deriva = sin(uv.x*5.5 - u_t*0.22) * 0.055 + sin(uv.x*13.0 + u_t*0.15) * 0.022;",
    "    float onda  = fbm2(vec2(uv.x*3.2 + u_t*0.05, (uv.y + deriva)*escalaY - u_t*0.30));",
    "    float onda2 = ruido(vec2(uv.x*9.5 - u_t*0.08, (uv.y - deriva*0.6)*escalaY*2.1 + u_t*0.22));",
    "    float agua = onda*0.62 + onda2*0.38;",
"    agua = clamp((agua - 0.5) * 1.85 + 0.5, 0.0, 1.0);",
    "    float dx = abs(uv.x - u_foco_uv.x + (agua-0.5)*0.16*(0.30+prof));",
    "    float reflejo = exp(-dx*dx*62.0) * mix(1.15, 0.18, prof);",
"    col += calido * reflejo * haz * 0.72 * enAgua * latido;",
    "    col += oro * reflejo * 0.16 * enAgua * latido;",
    "    float cresta = smoothstep(0.70, 0.86, agua) * (0.42 + haz*2.8);",
    "    col += calido * cresta * 0.115 * enAgua * mix(1.0, 0.30, prof);",
    "    col = mix(col, col * vec3(0.62,0.78,0.80), enAgua * 0.42);",
    "  }",
    "  float linea = exp(-abs(uv.y - HOR)*760.0);",
    "  col += oro * linea * (0.05 + haz*0.30);",

    "  float alto = smoothstep(HOR + 0.10, 0.98, uv.y);",
    "  float polvoAlto = 0.0;",
    "  if (alto > 0.02 && haz > 0.002) polvoAlto = fbm2(vec2(uv.x*1.9 - u_t*0.014, uv.y*3.4 + u_t*0.010));",
"  col += mix(oro, calido, 0.55) * alto * haz * smoothstep(0.26,0.82,polvoAlto) * 1.15 * latido;",

    "  float franja = exp(-abs(uv.y - (HOR + 0.045)) * 26.0);",
    "  float niebla = 0.0;",
    "  if (franja > 0.004) niebla = fbm2(vec2(uv.x*2.3 + u_t*0.021, uv.y*9.0 - u_t*0.012));",
"  float nieblaBaja = franja * smoothstep(0.30, 0.85, niebla);",
    "  col += mix(oro, calido, 0.45) * nieblaBaja * haz * 0.85 * latido;",
    "  col += vec3(0.048,0.070,0.062) * nieblaBaja * 0.30;",

"  vec2 barco = vec2(0.905, HOR + 0.004);",
    "  float latidoB = 0.45 + 0.55*pow(max(0.0, sin(u_t*0.62)), 6.0);",
    "  float db = length((uv - barco) * vec2(u_res.x/u_res.y, 1.0));",
    "  col += vec3(1.0,0.93,0.80) * exp(-db*db*17000.0) * 1.25 * latidoB;",
    "  col += oro * exp(-db*db*900.0) * 0.16 * latidoB;",
    "  float dbx = abs(uv.x - barco.x);",
    "  float estela = exp(-dbx*dbx*2600.0) * smoothstep(HOR, HOR-0.075, uv.y);",
    "  col += vec3(0.85,0.80,0.66) * estela * 0.075 * latidoB;",

    "  float bruma = fbm2(p*1.55 + vec2(u_t*0.017, u_t*0.009));",
    "  col += vec3(0.055,0.085,0.070) * (bruma-0.5) * 0.32 * smoothstep(0.0,0.75,uv.y);",

    "  float estria = exp(-abs(rel.y)*115.0) * exp(-abs(rel.x)*9.5);",
    "  col += calido * estria * (0.22 + flash*0.34) * latido;",

    "  col *= 1.0 - 0.46*pow(length(uv-0.5)*1.22, 2.1);",
    "  float lum = dot(col, vec3(0.2126,0.7152,0.0722));",
    "  col += (grano(gl_FragCoord.xy) - 0.5) * 0.026 * (1.0 - clamp(lum*2.6,0.0,0.92));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compilar(tipo, fuente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
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
  var uFoco = gl.getUniformLocation(prog, "u_foco");
  var uFocoUv = gl.getUniformLocation(prog, "u_foco_uv");
  var uFrente = gl.getUniformLocation(prog, "u_frente");
  var frenteActual = 0;

  var palabras = [].slice.call(caja.querySelectorAll(op.palabras || ".n4-palabras span"));

  var VELOCIDAD = 0.42;
  var CENTRO = Math.PI;
  function barrido(seg) { return CENTRO + seg * VELOCIDAD; }

  var FOCO = { x: 0.72, y: 0.356 };          // en fracción de la caja
  var titular = null;

  function revelar(ang) {
    if (!titular) titular = document.querySelector(".hero h1");
    var w = caja.clientWidth || 1, h = caja.clientHeight || 1;
    var asp = w / h;
    caja.style.setProperty("--ang", (90 - ang * 57.29577951308232).toFixed(2) + "deg");
    caja.style.setProperty("--sx", Math.cos(ang).toFixed(3));
    caja.style.setProperty("--sy", (-Math.sin(ang)).toFixed(3));

    var fx = (FOCO.x - 0.5) * asp, fy = (0.5 - FOCO.y);

    if (titular) {
      var rt = titular.getBoundingClientRect(), rc = caja.getBoundingClientRect();
      var tx = ((rt.left + rt.width * 0.55) - rc.left) / w;
      var ty = ((rt.top + rt.height * 0.5) - rc.top) / h;
      var at = Math.atan2((0.5 - ty) - fy, (tx - 0.5) * asp - fx);
      var dt2 = Math.abs(((at - ang + Math.PI) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI) - Math.PI);
      var f = 1 - Math.min(1, dt2 / 0.17);
      frenteActual = f * f * f;
      caja.style.setProperty("--frente", frenteActual.toFixed(3));
    }
    palabras.forEach(function (el) {
      var px = (parseFloat(el.style.left) / 100 - 0.5) * asp;
      var py = (0.5 - parseFloat(el.style.top) / 100);
      var a = Math.atan2(py - fy, px - fx);
      var dif = Math.abs(((a - ang + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
      var cerca = 1 - Math.min(1, dif / 0.30);
      el.style.setProperty("--luz", (cerca * cerca * (3 - 2 * cerca)).toFixed(3));
    });
  }

  var angObjetivo = null;                // null = manda el reloj
  var angActual = CENTRO;
  var ZONA_MUERTA = 0.16;
  var pxSuave = 0, pySuave = 0, pxDest = 0, pyDest = 0, hayCursor = false;
  function parallax(dt) {
    var k = 1 - Math.exp(-dt * 3.2);
    pxSuave += (pxDest - pxSuave) * k;
    pySuave += (pyDest - pySuave) * k;
    caja.style.setProperty("--px", pxSuave.toFixed(4));
    caja.style.setProperty("--py", pySuave.toFixed(4));
  }

  caja.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    var r = caja.getBoundingClientRect();
    var asp = r.width / r.height;
    pxDest = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pyDest = ((e.clientY - r.top) / r.height - 0.5) * 2;
    hayCursor = true;
    var px = ((e.clientX - r.left) / r.width - 0.5) * asp;
    var py = (0.5 - (e.clientY - r.top) / r.height);
    var fx = (FOCO.x - 0.5) * asp, fy = (0.5 - FOCO.y);
    var dx = px - fx, dy = py - fy;
    if (dx * dx + dy * dy < ZONA_MUERTA * ZONA_MUERTA) return;
    angObjetivo = Math.atan2(dy, dx);
  }, { passive: true });
  caja.addEventListener("pointerleave", function () {
    angObjetivo = null; pxDest = 0; pyDest = 0; hayCursor = false;
  }, { passive: true });

  var t0 = performance.now();
  var tPrev = t0;
  var visible = true;

  function dibujar(ahora) {
    var tope = Math.min(devicePixelRatio || 1, 1.25);
    var w = Math.round(caja.clientWidth * tope);
    var h = Math.round(caja.clientHeight * tope);
    if (w > 0 && h > 0 && (cv.width !== w || cv.height !== h)) {
      cv.width = w; cv.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, cv.width, cv.height);
    var seg = (ahora - t0) / 1000;

    var destino = (angObjetivo === null) ? barrido(seg) : angObjetivo;
    var dd = ((destino - angActual + Math.PI) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI) - Math.PI;

    var dt = Math.min((ahora - tPrev) / 1000, 0.05); tPrev = ahora;
    parallax(dt);
    var paso = dd * (1 - Math.exp(-dt * 5.0));
    var tope = 2.2 * dt;
    if (paso >  tope) paso =  tope;
    if (paso < -tope) paso = -tope;
    angActual += paso;

    gl.uniform1f(uT, seg);
    var asp = cv.width / cv.height;
    gl.uniform2f(uFoco, (FOCO.x - 0.5) * asp, 0.5 - FOCO.y);
    gl.uniform2f(uFocoUv, FOCO.x, 1.0 - FOCO.y);
    gl.uniform1f(uFrente, frenteActual);
    gl.uniform1f(uAng, angActual);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    revelar(angActual);
    if (visible) requestAnimationFrame(dibujar);
  }

  dibujar(performance.now());
  caja.classList.add("viva");
  requestAnimationFrame(dibujar);

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
