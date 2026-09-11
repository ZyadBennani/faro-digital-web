window.auraPieza = function (op) {
  "use strict";
  op = op || {};

  var caja = typeof op.caja === "string" ? document.querySelector(op.caja)
                                         : (op.caja || document.getElementById("bote-aura"));
  if (!caja) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var F = {
    cuerpo: op.cuerpo || [0.280, 0.460],
    cuello: op.cuello || [0.088, 0.235],
    hombro: op.hombro === undefined ? 0.400 : op.hombro,
    nivel:  op.nivel  === undefined ? 0.175 : op.nivel,
    tapa:   op.tapa || [0.700, 0.145]
  };

  var cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  var gl = cv.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) return;                       // sin WebGL se queda la foto de reserva
  caja.appendChild(cv);
  caja.classList.add("vivo");

  var movil = matchMedia("(max-width: 780px)").matches;
  var ESCALA = movil ? 0.75 : 1.00;          // punto de partida, no el definitivo
  var MIN_ESC = 0.42, MAX_ESC = movil ? 1.45 : 2.00;
  var TOPE_DPR = movil ? 1.35 : 2.0;
  var muestras = [], ultimoAjuste = 0;

  function texturaEtiqueta(rot, bajada, pie) {
    var L = document.createElement("canvas");
    L.width = 1024; L.height = 1024;
    var c = L.getContext("2d");
    c.clearRect(0, 0, 1024, 1024);

    c.fillStyle = "rgba(255,254,252,1.0)";
    c.fillRect(58, 96, 908, 832);
    c.strokeStyle = "rgba(156,107,74,0.32)"; c.lineWidth = 3;
    c.strokeRect(96, 134, 832, 756);

    c.textAlign = "center"; c.textBaseline = "middle";

    c.strokeStyle = "#9C6B4A"; c.lineCap = "round";
    c.lineWidth = 8; c.beginPath(); c.arc(512, 268, 82, -2.05, 2.20); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.arc(512, 268, 52, -1.75, 2.55); c.stroke();
    c.fillStyle = "#9C6B4A";
    c.beginPath(); c.arc(512, 268, 17, 0, 6.2832); c.fill();

    c.fillStyle = "#33251F";
    c.font = "600 154px 'Frank Ruhl Libre', Georgia, serif";
    c.letterSpacing = "18px";
    c.fillText(rot, 512, 470);

    c.fillStyle = "rgba(59,44,39,0.86)";
    c.font = "600 44px 'Work Sans', system-ui, sans-serif";
    c.letterSpacing = "16px";
    c.fillText(bajada, 512, 570);

    c.fillStyle = "#9C6B4A";
    c.fillRect(422, 640, 180, 6);

    c.fillStyle = "rgba(59,44,39,0.78)";
    c.font = "500 36px 'Work Sans', system-ui, sans-serif";
    c.letterSpacing = "7px";
    c.fillText(pie, 512, 706);

    c.fillStyle = "rgba(156,107,74,0.88)";
    c.font = "600 30px 'Work Sans', system-ui, sans-serif";
    c.letterSpacing = "13px";
    c.fillText("BARCELONA", 512, 810);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  var VS = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FS = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_giro; uniform float u_alt; uniform float u_t;",
    "uniform sampler2D u_etiq;",
    "uniform vec3 u_tinte;",
    "uniform vec2 u_cuerpo; uniform vec2 u_cuello;",
    "uniform float u_hombro; uniform float u_nivel; uniform vec2 u_tapa;",

    "float hsh(vec2 p){",
    "  vec3 q = fract(vec3(p.x, p.y, p.x) * 0.1031);",
    "  q += dot(q, q.yzx + 33.33);",
    "  return fract((q.x + q.y) * q.z);",
    "}",
    "float rui(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f*f*(3.0-2.0*f);",
    "  return mix(mix(hsh(i), hsh(i+vec2(1.0,0.0)), u.x),",
    "             mix(hsh(i+vec2(0.0,1.0)), hsh(i+vec2(1.0,1.0)), u.x), u.y);",
    "}",

    "float caja2(vec2 p, vec2 s, float r){",
    "  vec2 d = abs(p) - s + r;",
    "  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;",
    "}",
    "float smin(float a, float b, float k){",
    "  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);",
    "  return mix(b, a, h) - k*h*(1.0-h);",
    "}",

    "float perfil(vec2 q){",
    "  float cuerpo = caja2(q - vec2(0.0, -0.16), u_cuerpo, 0.055);",
    "  float cuello = caja2(q - vec2(0.0, u_hombro), u_cuello, 0.045);",
    "  return smin(cuerpo, cuello, 0.155);",
    "}",

    "float sdLiquido(vec3 p){",
    "  vec2 q = vec2(length(p.xz), p.y);",
    "  return max(perfil(q) + 0.026, p.y - u_nivel);",
    "}",

    "vec2 mapa(vec3 p){",
    "  vec2 q = vec2(length(p.xz), p.y);",
    "  float vidrio = perfil(q);",
    "  float azT = atan(p.x, p.z);",
    "  float lado = smoothstep(0.640, 0.664, q.y) * smoothstep(0.790, 0.766, q.y);",
    "  float estria = sin(azT * 34.0) * 0.0030 * lado;",
    "  float tapa = caja2(q - vec2(0.0, u_tapa.x), vec2(u_tapa.y, 0.098), 0.034) - estria;",
    "  vec2 r = vec2(vidrio, 1.0);",
    "  if (tapa < r.x) r = vec2(tapa, 2.0);",
    "  float suelo = p.y + 0.620;",
    "  if (suelo < r.x) r = vec2(suelo, 3.0);",
    "  return r;",
    "}",

    "vec3 normal(vec3 p){",
    "  vec2 e = vec2(1.0, -1.0) * 0.0011;",
    "  return normalize(e.xyy*mapa(p + e.xyy).x + e.yyx*mapa(p + e.yyx).x +",
    "                   e.yxy*mapa(p + e.yxy).x + e.xxx*mapa(p + e.xxx).x);",
    "}",
    "float sombra(vec3 o, vec3 d){",
    "  float r = 1.0, t = 0.05;",
    "  for (int i = 0; i < 15; i++){",
    "    float h = mapa(o + d*t).x;",
    "    if (h < 0.001) return 0.0;",
    "    r = min(r, 9.0*h/t); t += clamp(h, 0.035, 0.34);",
    "    if (t > 3.0) break;",
    "  }",
    "  return clamp(r, 0.0, 1.0);",
    "}",
    "float ao(vec3 p, vec3 n){",
    "  float s = 0.0, e = 1.0;",
    "  for (int i = 1; i <= 3; i++){",
    "    float d = 0.032 * float(i);",
    "    s += (d - mapa(p + n*d).x) * e; e *= 0.55;",
    "  }",
    "  return clamp(1.0 - 2.9*s, 0.0, 1.0);",
    "}",

    "vec3 estudio(vec3 d){",
    "  float y = d.y;",
    "  vec3 c = mix(vec3(0.300,0.268,0.262), vec3(0.620,0.585,0.575), smoothstep(-0.60, 0.35, y));",
    "  c = mix(c, vec3(0.470,0.415,0.400), smoothstep(0.02, -0.80, y));",
    "  float az = atan(d.x, d.z);",
    "  float alto = smoothstep(-0.80, 0.10, y);",
    "  float p1 = smoothstep(0.70, 0.10, abs(az + 2.30));",
    "  float p2 = smoothstep(0.34, 0.05, abs(az - 1.18));",
    "  c += vec3(1.0,0.995,0.985) * p1 * 1.55 * alto;",
    "  c += vec3(0.99,0.985,1.0) * p2 * 1.05 * alto;",
    "  c += vec3(1.0) * smoothstep(0.70, 0.99, y) * 0.55;",
    "  return c;",
    "}",

    "vec4 travesia(vec3 pin, vec3 rr, float sal, out vec3 salida){",
    "  vec3 tinte = vec3(0.0);",
    "  float menisco = 0.0;",
    "  salida = pin;",
    "  float antes = 0.0;",
    "  float paso = 0.030;",
    "  for (int i = 0; i < 36; i++){",
    "    vec3 s = pin + rr * ((float(i) + sal) * paso);",
    "    if (perfil(vec2(length(s.xz), s.y)) > 0.0) break;",
    "    salida = s;",   // ha salido del frasco
    "    float dl = sdLiquido(s);",
    "    float hondo = 1.0 + 0.55 * smoothstep(0.175, -0.48, s.y);",
    "    tinte += u_tinte * paso * hondo * smoothstep(0.012, -0.012, dl);",
    "    float lado = step(0.175, s.y) * 2.0 - 1.0;",
    "    if (antes * lado < 0.0 && perfil(vec2(length(s.xz), s.y)) < -0.018) menisco = 1.0;",
    "    antes = lado;",
    "  }",
    "  vec3 a = salida, bq = salida + rr * paso;",
    "  for (int k = 0; k < 3; k++){",
    "    vec3 m = (a + bq) * 0.5;",
    "    if (perfil(vec2(length(m.xz), m.y)) < 0.0) a = m; else bq = m;",
    "  }",
    "  salida = a;",
    "  return vec4(exp(-tinte * 1.35), clamp(menisco, 0.0, 1.0));",                             // Beer-Lambert
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;",
    "  float a = u_giro;",
    "  float alt = clamp(u_alt, -0.42, 0.55);",
    "  vec3 ro = vec3(sin(a)*3.55, 0.72 + alt, cos(a)*3.55);",
    "  vec3 ta = vec3(0.0, 0.06, 0.0);",
    "  vec3 ww = normalize(ta - ro);",
    "  vec3 uu = normalize(cross(ww, vec3(0.0,1.0,0.0)));",
    "  vec3 vv = cross(uu, ww);",
    "  vec3 rd = normalize(uv.x*uu + uv.y*vv + 2.35*ww);",

    "  float t = 0.0; vec2 h = vec2(-1.0);",
    "  for (int i = 0; i < 62; i++){",
    "    h = mapa(ro + rd*t);",
    "    if (h.x < 0.0008*t || t > 8.0) break;",
    "    t += h.x * 0.92;",
    "  }",

    "  vec3 col = vec3(0.0); float alfa = 0.0;",
    "  if (t < 8.0){",
    "    vec3 p = ro + rd*t;",
    "    vec3 n = normal(p);",
    "    vec3 luz = normalize(vec3(-0.50, 0.80, 0.55));",
    "    vec3 relleno = normalize(vec3(0.85, 0.25, -0.45));",
    "    float dif = clamp(dot(n, luz), 0.0, 1.0);",
    "    float sh  = sombra(p + n*0.014, luz);",
    "    float oc  = ao(p, n);",
    "    float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);",
    "    vec3 refl = estudio(reflect(rd, n));",
    "    vec3 hh = normalize(luz - rd);",
    "    float rim = pow(clamp(dot(n, normalize(vec3(0.30,0.35,-0.90))), 0.0, 1.0), 2.6);",

    "    if (h.y < 1.5){",
    "      vec3 rr = refract(rd, n, 1.0/1.46);",
    "      float sal = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);",
    "      vec3 pOut;",
    "      vec4 tr = travesia(p + rr*0.014, rr, sal, pOut);",
    "      vec3 pasa = tr.rgb;",
    "      float azO = atan(pOut.x, pOut.z);",
    "      vec2 uvO = vec2(azO / 2.62 + 0.5, (pOut.y + 0.480) / 0.615);",
    "      vec3 fondoEtiq = vec3(0.0); float hayFondo = 0.0;",
    "      if (uvO.x > 0.02 && uvO.x < 0.98 && uvO.y > 0.02 && uvO.y < 0.98){",
    "        vec4 eo = texture2D(u_etiq, uvO);",
    "        fondoEtiq = eo.rgb; hayFondo = eo.a * 0.92;",
    "      }",
    "      vec3 detras = estudio(rr) * 0.55 + vec3(0.99,0.86,0.74) * 0.45;",
    "      detras = mix(detras, fondoEtiq * 1.15, hayFondo);",
    "      vec3 dentro = detras * pasa;",
    "      float pica = rui(pOut.xy * 190.0 + pOut.z * 60.0);",
    "      dentro += vec3(0.968,0.898,0.888) * (0.09 + 0.15*dif*sh) * (0.96 + 0.08*pica);",
    "      vec3 nSup = vec3(0.0, 1.0, 0.0);",
    "      float briSup = pow(clamp(dot(reflect(rd, nSup), luz), 0.0, 1.0), 42.0);",
    "      vec3 sup = dentro * 1.16 + vec3(1.0,0.975,0.960) * briSup * 0.75;",
    "      sup += estudio(reflect(rd, nSup)) * 0.09;",
    "      dentro = mix(dentro, sup, tr.a * 0.85);",
    "      dentro *= mix(vec3(0.955,0.968,1.010), vec3(1.020,1.000,0.980), dif*sh);",
    "      float espejo = clamp(0.055 + 0.945*fres, 0.0, 1.0);",
    "      col = mix(dentro, refl * 0.92, espejo);",
    "      col += vec3(1.0) * pow(clamp(dot(n,hh),0.0,1.0), 210.0) * sh * 1.40;",
    "      col += vec3(1.0,0.985,0.975) * pow(clamp(dot(n,hh),0.0,1.0), 26.0) * sh * 0.24;",
    "      col += vec3(1.0,0.94,0.93) * rim * 0.30;",
    "      col *= mix(0.84, 1.0, oc);",

    "      float az2 = atan(p.x, p.z);",
    "      az2 = mod(az2 + 3.14159265, 6.28318531) - 3.14159265;",
    "      vec2 uvE = vec2(az2 / 2.62 + 0.5, (p.y + 0.480) / 0.615);",
    "      if (uvE.x > 0.0 && uvE.x < 1.0 && uvE.y > 0.0 && uvE.y < 1.0){",
    "        vec4 et = texture2D(u_etiq, uvE);",
    "        float borde = smoothstep(0.0, 0.05, uvE.x) * smoothstep(1.0, 0.95, uvE.x);",
    "        float luzEt = 1.06 + 0.22*dif*sh;",
    "        vec3 papel = et.rgb * luzEt * mix(0.74, 1.0, oc);",

    "        float fibra = rui(uvE * vec2(420.0, 260.0)) * 0.6",
    "                    + rui(uvE * vec2(52.0, 34.0)) * 0.4;",
    "        papel *= 0.955 + 0.09 * fibra;",

    "        float curva = 1.0 - pow(abs(uvE.x - 0.5) * 2.0, 2.2);",
    "        papel *= mix(0.80, 1.0, clamp(curva, 0.0, 1.0));",

    "        papel += vec3(1.0) * pow(clamp(dot(n,hh),0.0,1.0), 5.5) * sh * 0.07;",

    "        float dBor = min(min(uvE.x, 1.0 - uvE.x), min(uvE.y, 1.0 - uvE.y));",
    "        float labio = 1.0 - smoothstep(0.0, 0.012, dBor);",
    "        float caraLuz = clamp(0.35 + 0.65 * dif, 0.0, 1.0);",
    "        papel += vec3(1.0) * labio * caraLuz * 0.16 * sh;",
    "        papel *= 1.0 - labio * (1.0 - caraLuz) * 0.22;",

    "        col = mix(col, papel, et.a * borde);",

    "        float fuera = smoothstep(0.0, 0.014, dBor);",
    "        col *= 1.0 - (1.0 - fuera) * (1.0 - et.a) * 0.28;",
    "      }",

    "    } else if (h.y < 2.5){",
    "      vec3 base = vec3(0.632, 0.338, 0.196);",
    "      col  = base * (0.13 + 0.30*dif*sh);",
    "      col += refl * base * 1.12;",
    "      col += vec3(1.0,0.96,0.92) * pow(clamp(dot(n,hh),0.0,1.0), 160.0) * sh * 1.45;",
    "      col += vec3(1.0,0.93,0.86) * pow(clamp(dot(n,hh),0.0,1.0), 18.0) * sh * 0.30;",
    "      col += base * fres * 0.40;",
    "      col += vec3(1.0,0.86,0.74) * rim * 0.30;",
    "      col *= mix(0.55, 1.0, oc);",
    "    } else {",
    "      float cerca = 1.0 - clamp(length(p.xz)*0.78, 0.0, 1.0);",
    "      if (cerca <= 0.001){ gl_FragColor = vec4(0.0); return; }",
    "      float s = sombra(p + vec3(0.0,0.014,0.0), luz);",
    "      alfa = (1.0 - s) * cerca * cerca * 0.34;",
    "      vec2 haciaSombra = normalize(luz.xz) * -0.30;",
    "      float dCau = length(p.xz - haciaSombra);",
    "      float cau = exp(-dCau*dCau*13.0) * (1.0 - s) * 0.85;",
    "      cau += exp(-dCau*dCau*46.0) * (1.0 - s) * 0.55;",     // nucleo mas apretado
    "      vec3 tonoCau = vec3(1.34, 1.06, 0.92);",
    "      vec3 colSombra = vec3(0.34,0.25,0.25);",
    "      float aOut = clamp(alfa + cau*0.30, 0.0, 1.0);",
    "      vec3 cOut = colSombra*alfa + tonoCau*cau*0.62;",
    "      gl_FragColor = vec4(cOut, aOut);",
    "      return;",
    "    }",
    "    alfa = 1.0;",
    "    col *= 0.99 + 0.01*sin(u_t*0.8);",
    "    col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));",
    "  }",
    "  float lz = dot(col, vec3(0.2126,0.7152,0.0722));",
    "  col += (hsh(gl_FragCoord.xy) - 0.5) * 0.020 * (1.0 - clamp(lz*2.2, 0.0, 0.9));",
    "  gl_FragColor = vec4(col*alfa, alfa);",
    "}"
  ].join("\n");

  function compilar(tipo, fuente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fuente); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("bote-aura:", gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  var vs = compilar(gl.VERTEX_SHADER, VS), fs = compilar(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { caja.classList.remove("vivo"); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { caja.classList.remove("vivo"); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // el canvas ya viene premultiplicado

  var uRes = gl.getUniformLocation(prog, "u_res");
  var uGiro = gl.getUniformLocation(prog, "u_giro");
  var uAlt = gl.getUniformLocation(prog, "u_alt");
  var uT = gl.getUniformLocation(prog, "u_t");
  var uEtiq = gl.getUniformLocation(prog, "u_etiq");
  var uTinte  = gl.getUniformLocation(prog, "u_tinte");
  var uCuerpo = gl.getUniformLocation(prog, "u_cuerpo");
  var uCuello = gl.getUniformLocation(prog, "u_cuello");
  var uHombro = gl.getUniformLocation(prog, "u_hombro");
  var uNivel  = gl.getUniformLocation(prog, "u_nivel");
  var uTapa   = gl.getUniformLocation(prog, "u_tapa");

  var tinte = (op.liquido || caja.getAttribute("data-liquido") || "0.26,0.98,1.28")
    .split(",").map(function (x) { return parseFloat(x) || 0; });
  if (tinte.length !== 3) tinte = [0.26, 0.98, 1.28];

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturaEtiqueta(
    op.rotulo || caja.getAttribute("data-rotulo") || "AURA",
    op.bajada || caja.getAttribute("data-bajada") || "SKINCARE",
    op.pie || caja.getAttribute("data-pie") || "SERUM REPARADOR \u00B7 30 ML"));

  var giroBase = 0, giroMano = 0, giroSuave = 0, altura = 0, altSuave = 0;
  var arrastrando = false, x0 = 0, y0 = 0, g0 = 0, a0 = 0;

  function porScroll() {
    var r = caja.getBoundingClientRect();
    var h = innerHeight || 1;
    var avance = 0.5 - (r.top + r.height * 0.5) / h;   // 0 = centrada
    giroBase = clamp(avance, -0.85, 0.85) * 2.30;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  var FRICCION   = 0.94;    // por fotograma: ~0,8 s de deriva a 60 fps
  var PARADA     = 0.0006;  // por debajo de esto ya no se ve moverse: se para
  var TOPE_VEL   = 0.22;    // rad/fotograma. Mas rapido no gira: parpadea
  var UMBRAL_EJE = 8;       // px antes de decidir si el gesto es del frasco

  var vel = 0, gPrev = 0, eje = null;

  var mio = (getComputedStyle(caja).touchAction || "").indexOf("pan-y") < 0;

  caja.addEventListener("pointerdown", function (e) {
    arrastrando = true; x0 = e.clientX; y0 = e.clientY; g0 = giroMano; a0 = altura;
    vel = 0; gPrev = giroMano; eje = null;
    caja.setPointerCapture(e.pointerId); caja.classList.add("cogido");
  });

  caja.addEventListener("pointermove", function (e) {
    if (!arrastrando) return;
    var dx = e.clientX - x0, dy = e.clientY - y0;

    if (eje === null) {
      if (Math.abs(dx) < UMBRAL_EJE && Math.abs(dy) < UMBRAL_EJE) return;
      eje = (mio || Math.abs(dx) >= Math.abs(dy)) ? "frasco" : "pagina";
    }
    if (eje === "pagina") return;        // es scroll: no se toca ni se bloquea

    giroMano = g0 - dx / (caja.clientWidth || 1) * 3.4;
    altura = clamp(a0 + dy / (caja.clientHeight || 1) * 2.4, -1.15, 1.15);
    vel = clamp(giroMano - gPrev, -TOPE_VEL, TOPE_VEL);
    gPrev = giroMano;
    if (e.cancelable) e.preventDefault();
  });

  function soltar(e) {
    if (!arrastrando) return;
    arrastrando = false; eje = null; caja.classList.remove("cogido");
    if (e && e.pointerId != null && caja.hasPointerCapture(e.pointerId)) caja.releasePointerCapture(e.pointerId);
  }

  function derivar() {
    if (arrastrando || vel === 0) return;
    giroMano += vel;
    vel *= FRICCION;
    if (Math.abs(vel) < PARADA) vel = 0;
  }
  caja.addEventListener("pointerup", soltar);
  caja.addEventListener("pointercancel", soltar);
  addEventListener("scroll", porScroll, { passive: true });
  porScroll();

  var visible = true, corriendo = false, t0 = performance.now(), tPrev = t0;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (f) {
      visible = f[0].isIntersecting;
      if (visible && !corriendo) { corriendo = true; tPrev = performance.now(); requestAnimationFrame(pintar); }
    }, { rootMargin: "120px" }).observe(caja);
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && visible && !corriendo) { corriendo = true; tPrev = performance.now(); requestAnimationFrame(pintar); }
  });

  function pintar(ahora) {
    if (!visible || document.hidden) { corriendo = false; return; }
    corriendo = true;
    derivar();

    var w = Math.round(caja.clientWidth * Math.min(devicePixelRatio || 1, TOPE_DPR) * ESCALA);
    var h = Math.round(caja.clientHeight * Math.min(devicePixelRatio || 1, TOPE_DPR) * ESCALA);
    if (w > 0 && h > 0 && (cv.width !== w || cv.height !== h)) {
      cv.width = w; cv.height = h; gl.viewport(0, 0, w, h);
    }

    var bruto = ahora - tPrev;
    var dt = Math.min(bruto / 1000, 0.05); tPrev = ahora;
    if (bruto > 0 && bruto < 400) muestras.push(bruto);
    if (muestras.length >= 30 && ahora - ultimoAjuste > 900) {
      muestras.sort(function (a, b) { return a - b; });
      var med = muestras[15];
      muestras.length = 0; ultimoAjuste = ahora;
      var antes = ESCALA;
      if (med > 21) ESCALA = Math.max(MIN_ESC, ESCALA * 0.82);        // va justo
      else if (med < 13.5) ESCALA = Math.min(MAX_ESC, ESCALA * 1.10); // sobra margen
      caja.setAttribute("data-calidad", ESCALA.toFixed(2));
      caja.setAttribute("data-ms", med.toFixed(1));
    }
    var k = 1 - Math.exp(-dt * 7.0);
    giroSuave += ((giroBase + giroMano) - giroSuave) * k;
    altSuave += (altura - altSuave) * k;

    gl.uniform2f(uRes, cv.width, cv.height);
    gl.uniform1f(uGiro, giroSuave);
    gl.uniform1f(uAlt, altSuave);
    gl.uniform1f(uT, (ahora - t0) / 1000);
    gl.uniform1i(uEtiq, 0);
    gl.uniform3f(uTinte, tinte[0], tinte[1], tinte[2]);
    gl.uniform2f(uCuerpo, F.cuerpo[0], F.cuerpo[1]);
    gl.uniform2f(uCuello, F.cuello[0], F.cuello[1]);
    gl.uniform1f(uHombro, F.hombro);
    gl.uniform1f(uNivel, F.nivel);
    gl.uniform2f(uTapa, F.tapa[0], F.tapa[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(pintar);
  }
  pintar(performance.now());
};

window.auraPieza();
