(function () {
  "use strict";

  var caja = document.querySelector(".esc-v");
  if (!caja) return;
  if (!window.WebGLRenderingContext) return;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  var PROD = [
    { id: "serum",  reposo: [-0.06, 0.61,  0.12], heroe: [ 0.00, 0.52,  0.34] },
    { id: "crema",  reposo: [ 0.46, 0.82, -0.18], heroe: [ 0.00, 0.50,  0.34] },
    { id: "aceite", reposo: [-0.50, 0.70, -0.30], heroe: [ 0.00, 0.50,  0.34] }
  ];
  var BANDA = [[-0.62, 0.92, -0.60], [0.64, 0.84, -0.56], [0.02, 1.14, -0.72]];

  var VS = "attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }";

  var FS = [
    "precision highp float;",
    "uniform vec2  u_res;",
    "uniform float u_t;",
    "uniform vec3  u_ro;",          // camara
    "uniform vec3  u_ta;",          // a donde mira
    "uniform vec3  u_p0, u_p1, u_p2;",
    "uniform vec3  u_k;",           // escala de cada pieza
    "uniform vec3  u_d;",           // atenuacion de cada pieza
    "uniform float u_q;",           // calidad: 1 = completa, 0 = reducida
    "uniform vec2  u_foco;",        // x = distancia enfocada, y = apertura
    "uniform vec2  u_jit;",         // desplazamiento sub-pixel de esta muestra
    "uniform sampler2D u_lab;",

    "float sdCil(vec3 p, float r, float h){",
    "  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);",
    "  return min(max(d.x,d.y),0.0) + length(max(d,0.0));",
    "}",
    "float sdCaja(vec3 p, vec3 b, float r){",
    "  vec3 q = abs(p) - b + r;",
    "  return min(max(q.x,max(q.y,q.z)),0.0) + length(max(q,0.0)) - r;",
    "}",
    "float smin(float a, float b, float k){",
    "  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);",
    "  return mix(b, a, h) - k*h*(1.0-h);",
    "}",
    "vec2 U(vec2 a, vec2 b){ return a.x < b.x ? a : b; }",

    "float hsh(vec2 q){ return fract(sin(dot(q, vec2(41.7, 289.3))) * 43758.5453); }",
    "vec2 mapPlinto(vec3 p){",
    "  float a = atan(p.z, p.x);",
    "  float estria = 0.0075 * (0.5 + 0.5*cos(a*34.0));",
    "  float d = sdCil(p - vec3(0.0,0.098,0.0), 0.425 - estria, 0.098) - 0.009;",
    "  float aro = max(abs(length(p.xz) - 0.352) - 0.007, abs(p.y - 0.196) - 0.007);",
    "  return U(vec2(d, 2.0), vec2(aro, 3.0));",
    "}",

    "vec2 mapSerum(vec3 p){",                 // vidrio ambar + tapon de oro
    "  float cuerpo = sdCaja(p - vec3(0.0,-0.02,0.0), vec3(0.150,0.250,0.088), 0.055);",
    "  float cuello = sdCil(p - vec3(0.0,0.268,0.0), 0.052, 0.055);",
    "  float v = smin(cuerpo, cuello, 0.055);",
    "  float collar = sdCil(p - vec3(0.0,0.330,0.0), 0.062, 0.028);",
    "  float bomba  = sdCil(p - vec3(0.0,0.392,0.0), 0.030, 0.044);",
    "  float pico   = sdCaja(p - vec3(0.045,0.428,0.0), vec3(0.062,0.014,0.017), 0.013);",
    "  float oro = min(collar, min(bomba, pico));",
    "  return U(vec2(v, 4.0), vec2(oro, 3.0));",
    "}",
    "vec2 mapCrema(vec3 p){",                 // opalo + tapa de oro
    "  float tarro = sdCil(p - vec3(0.0,-0.04,0.0), 0.175, 0.115) - 0.020;",
    "  float tapa  = sdCil(p - vec3(0.0,0.118,0.0), 0.182, 0.048) - 0.016;",
    "  return U(vec2(tarro, 5.0), vec2(tapa, 3.0));",
    "}",
    "vec2 mapBals(vec3 p){",                  // bronce
    "  float base = sdCil(p - vec3(0.0,-0.035,0.0), 0.250, 0.038) - 0.018;",
    "  float tapa = sdCil(p - vec3(0.0,0.038,0.0), 0.256, 0.030) - 0.014;",
    "  return U(vec2(base, 6.0), vec2(tapa, 6.0));",
    "}",

    "vec2 mapa(vec3 p){",
    "  vec2 r = vec2(p.y, 1.0);",                      // suelo
    "  r = U(r, mapPlinto(p));",
    "  vec3 a = (p - u_p0) / u_k.x;  r = U(r, vec2(mapSerum(a).x * u_k.x, mapSerum(a).y));",
    "  vec3 b = (p - u_p1) / u_k.y;  r = U(r, vec2(mapCrema(b).x * u_k.y, mapCrema(b).y));",
    "  vec3 c = (p - u_p2) / u_k.z;  r = U(r, vec2(mapBals(c).x  * u_k.z, mapBals(c).y));",
    "  return r;",
    "}",

    "vec3 normal(vec3 p){",
    "  vec2 e = vec2(1.0,-1.0) * 0.0013;",
    "  return normalize(e.xyy*mapa(p+e.xyy).x + e.yyx*mapa(p+e.yyx).x +",
    "                   e.yxy*mapa(p+e.yxy).x + e.xxx*mapa(p+e.xxx).x);",
    "}",

    "float sombra(vec3 o, vec3 d){",
    "  float r = 1.0, t = 0.03;",
    "  for (int i = 0; i < 16; i++){",
    "    float h = mapa(o + d*t).x;",
    "    if (h < 0.0012) return 0.0;",
    "    r = min(r, 7.0*h/t); t += clamp(h, 0.022, 0.30);",
    "    if (t > 4.2) break;",
    "  }",
    "  return clamp(r, 0.0, 1.0);",
    "}",
    "float ao(vec3 p, vec3 n){",
    "  float s = 0.0, e = 1.0;",
    "  for (int i = 1; i <= 5; i++){",
    "    float d = 0.045 * float(i);",
    "    s += (d - mapa(p + n*d).x) * e; e *= 0.68;",
    "  }",
    "  return clamp(1.0 - 2.2*s, 0.0, 1.0);",
    "}",

    "uniform sampler2D u_env;",
    "vec3 desEnv(vec3 c){ return pow(c, vec3(2.2)) * 8.0; }",
    "vec3 entorno(vec3 d, float rug){",
    "  float u = atan(d.x, d.z) / 6.28318531 + 0.5;",
    "  float v = acos(clamp(d.y, -1.0, 1.0)) / 3.14159265;",
    "  float vv = 0.006 + v * 0.988;",
    "  float niv = clamp(rug, 0.0, 1.0) * 3.0;",
    "  float n0 = floor(niv);",
    "  float n1 = min(n0 + 1.0, 3.0);",
    "  vec3 a = desEnv(texture2D(u_env, vec2(u, (n0 + vv) * 0.25)).rgb);",
    "  vec3 b = desEnv(texture2D(u_env, vec2(u, (n1 + vv) * 0.25)).rgb);",
    "  return mix(a, b, niv - n0);",
    "}",
    "vec3 estudio(vec3 d){ return entorno(d, 0.0); }",

    "void material(float m, out vec3 alb, out float rug, out float met){",
    "  if (m < 1.5)      { alb = vec3(0.012,0.010,0.009); rug = 0.16; met = 0.0; }", // suelo
    "  else if (m < 2.5) { alb = vec3(0.013,0.012,0.010); rug = 0.58; met = 0.0; }", // piedra
    "  else if (m < 3.5) { alb = vec3(1.00,0.80,0.46);    rug = 0.17; met = 1.0; }", // oro
    "  else if (m < 4.5) { alb = vec3(0.62,0.34,0.11);    rug = 0.09; met = 0.0; }", // vidrio ambar
    "  else if (m < 5.5) { alb = vec3(0.88,0.81,0.77);    rug = 0.22; met = 0.0; }", // opalo
    "  else              { alb = vec3(0.92,0.66,0.42);    rug = 0.22; met = 1.0; }", // bronce
    "}",

    "vec4 tinta(vec3 lp, float fila, float R, float y0, float y1){",
    "  if (lp.z <= 0.0) return vec4(0.0);",
    "  float u = asin(clamp(lp.x / R, -1.0, 1.0)) / 1.5707963;",   // -1..1 sobre la cara
    "  float sx = 0.5 + u * 0.86;",
    "  float v  = (lp.y - y0) / (y1 - y0);",
    "  if (sx < -0.02 || sx > 1.02 || v < -0.02 || v > 1.02) return vec4(0.0);",
    "  vec4 c = texture2D(u_lab, vec2(clamp(sx,0.0,1.0), (fila + (1.0 - v)) / 3.0));",
    "  c.a *= smoothstep(0.0, 0.05, sx) * smoothstep(1.0, 0.95, sx);",
    "  c.a *= smoothstep(0.0, 0.04, v)  * smoothstep(1.0, 0.96, v);",
    "  c.a *= smoothstep(0.02, 0.16, lp.z / R);",
    "  return c;",
    "}",
    "vec4 tintaDe(vec3 lp, float m){",
    "  if (m < 4.5) return tinta(lp, 0.0, 0.150, -0.185, 0.085);",   // serum
    "  if (m < 5.5) return tinta(lp, 1.0, 0.175, -0.125, 0.045);",   // crema
    "  return              tinta(lp, 2.0, 0.268, -0.072, 0.006);",  // balsamo
    "}",

    "vec3 luz(vec3 p, vec3 n, vec3 rd, float m, float dim){",
    "  vec3 alb; float rug, met;",
    "  material(m, alb, rug, met);",
    "  if (m > 3.9 && m < 6.5){",
    "    vec3 lp = (m < 4.5) ? (p - u_p0)/u_k.x : ((m < 5.5) ? (p - u_p1)/u_k.y : (p - u_p2)/u_k.z);",
    "    vec4 tq = tintaDe(lp, m);",
    "    alb = mix(alb, tq.rgb, tq.a * 0.94);",
    "  }",
    "  float oc = ao(p, n);",
    "  if (m > 1.5 && m < 2.5){",
    "    float gr = hsh(floor(p.xz * 420.0) + floor(p.y * 420.0));",
    "    alb *= 0.78 + 0.44 * gr;",
    "  }",
    "  vec3 col = vec3(0.0);",

    "  vec3 L1 = normalize(vec3(-0.52, 0.78, 0.46));",
    "  float sh = sombra(p + n*0.004, L1);",
    "  float df = max(dot(n, L1), 0.0);",
    "  col += alb * vec3(1.00,0.94,0.86) * df * (0.14 + 0.86*sh) * 3.10 * (1.0 - met);",
    "  vec3 L2 = normalize(vec3(0.86, 0.28, 0.40));",
    "  col += alb * vec3(0.30,0.35,0.44) * max(dot(n, L2), 0.0) * 0.62 * (1.0 - met);",
    "  col += alb * vec3(0.34,0.31,0.28) * max(dot(n, -rd), 0.0) * 0.52 * (1.0 - met);",
    "  vec3 L3 = normalize(vec3(0.24, 0.42, -0.90));",
    "  col += alb * vec3(1.05,0.84,0.56) * pow(max(dot(n, L3), 0.0), 2.2) * 1.45 * (1.0 - met*0.72);",
    "  col += alb * entorno(n, 0.92) * 0.85 * oc * (1.0 - met) * mix(0.38, 1.0, sh);",

    "  vec3 R = reflect(rd, n);",
    "  float f = pow(1.0 - max(dot(-rd, n), 0.0), 4.0);",
    "  float kf = mix(0.045, 1.0, f);",
    "  vec3 env = entorno(R, rug);",
    "  vec3 esp = env * mix(vec3(kf), alb * (0.55 + 0.45*kf), met);",
    "  col += esp * (0.30 + 0.70*oc) * 1.25;",
    "  float ph = pow(max(dot(reflect(rd, n), L1), 0.0), mix(22.0, 640.0, 1.0-rug));",
    "  col += mix(vec3(1.0,0.97,0.92), alb, met) * ph * (1.0 - rug*0.6) * 2.4 * sh;",

    "  return col * dim;",
    "}",

    "vec3 vidrio(vec3 p, vec3 n, vec3 rd, float dim){",
    "  vec3 rr = refract(rd, n, 1.0/1.46);",
    "  float t = 0.006, hondo = 0.0;",
    "  for (int i = 0; i < 22; i++){",
    "    vec3 q = p + rr*t;",
    "    vec3 a = (q - u_p0) / u_k.x;",
    "    float d = mapSerum(a).x * u_k.x;",
    "    if (d > 0.0){ break; }",
    "    hondo += -d * 0.02; t += max(-d, 0.006);",
    "    if (t > 0.9) break;",
    "  }",
    "  vec3 sal = p + rr*t;",
    "  vec3 nn = normal(sal);",
    "  vec3 rs = refract(rr, -nn, 1.46);",
    "  if (dot(rs, rs) < 0.001) rs = reflect(rr, -nn);",
    "  vec3 dentro = estudio(normalize(rs));",
    "  float ym = ((p.y + sal.y) * 0.5 - u_p0.y) / u_k.x;",
    "  float lleno = smoothstep(0.115, 0.055, ym);",
    "  vec3 kabs = mix(vec3(0.045,0.085,0.150), vec3(0.42,1.30,2.45), lleno);",
    "  vec3 abs_ = exp(-kabs * (t*3.0 + hondo));",
    "  vec3 col = dentro * abs_;",
    "  float f = pow(1.0 - max(dot(-rd, n), 0.0), 3.4);",
    "  col = mix(col, estudio(reflect(rd, n)), clamp(0.05 + 0.95*f, 0.0, 1.0));",
    "  col *= mix(vec3(1.02,0.99,0.94), vec3(1.34,1.00,0.66), lleno);",
    "  float men = smoothstep(0.128, 0.112, ym) * smoothstep(0.098, 0.114, ym);",
    "  col = mix(col, col * vec3(1.55, 1.18, 0.78) + vec3(0.10,0.06,0.02), men);",
    "  vec3 Lb = normalize(vec3(0.30, 0.55, -0.78));",
    "  float pasa = pow(max(dot(rr, Lb), 0.0), 3.0);",
    "  col += vec3(1.45, 0.92, 0.42) * pasa * abs_ * 0.85;",
    "  vec3 L1 = normalize(vec3(-0.52, 0.78, 0.46));",
    "  col += vec3(1.0,0.96,0.88) * pow(max(dot(reflect(rd,n), L1), 0.0), 420.0) * 3.4;",
    "  col += vec3(0.90,0.84,0.74) * pow(max(dot(reflect(rd,n), L1), 0.0), 26.0) * 0.55;",
    "  float canto = pow(1.0 - max(dot(-rd, n), 0.0), 2.2);",
    "  col *= mix(1.0, 0.42, canto*0.85);",
    "  return col * dim;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy + u_jit - 0.5*u_res) / u_res.y;",
    "  vec3 ww = normalize(u_ta - u_ro);",
    "  vec3 uu = normalize(cross(ww, vec3(0.0,1.0,0.0)));",
    "  vec3 vv = cross(uu, ww);",
    "  vec3 rd = normalize(uv.x*uu + uv.y*vv + 2.75*ww);",
    "  vec3 ro = u_ro;",

    "  float t = 0.02; vec2 h = vec2(0.0);",
    "  bool dio = false;",
    "  for (int i = 0; i < 64; i++){",
    "    h = mapa(ro + rd*t);",
    "    if (h.x < 0.0012*t){ dio = true; break; }",
    "    t += h.x * 0.92;",
    "    if (t > 14.0) break;",
    "  }",

    "  vec3 col = estudio(rd) * 0.75;",
    "  if (dio){",
    "    vec3 p = ro + rd*t;",
    "    vec3 n = normal(p);",
    "    float dim = 1.0;",
    "    if (h.y > 3.9 && h.y < 4.5) dim = u_d.x;",
    "    else if (h.y > 4.5 && h.y < 5.5) dim = u_d.y;",
    "    else if (h.y > 5.5) dim = u_d.z;",

    "    if (h.y < 1.5){",
    "      col = luz(p, n, rd, 1.0, 1.0);",
    "      vec3 R = reflect(rd, n);",
    "      float t2 = 0.02; vec2 h2 = vec2(0.0); bool d2 = false;",
    "      for (int j = 0; j < 22; j++){",
    "        h2 = mapa(p + R*t2);",
    "        if (h2.x < 0.0016*t2){ d2 = true; break; }",
    "        t2 += h2.x * 0.95;",
    "        if (t2 > 4.0) break;",
    "      }",
    "      vec3 cr = estudio(R) * 0.6;",
    "      if (d2){",
    "        vec3 p2 = p + R*t2; vec3 n2 = normal(p2);",
    "        float dm = 1.0;",
    "        if (h2.y > 3.9 && h2.y < 4.5) dm = u_d.x;",
    "        else if (h2.y > 4.5 && h2.y < 5.5) dm = u_d.y;",
    "        else if (h2.y > 5.5) dm = u_d.z;",
    "        cr = luz(p2, n2, R, h2.y < 4.5 && h2.y > 3.9 ? 5.0 : h2.y, dm);",
    "      }",
    "      float f = pow(1.0 - max(dot(-rd, n), 0.0), 3.2);",
    "      float lejos = exp(-0.34 * t2);",
    "      col += cr * mix(0.05, 0.62, f) * lejos;",
    "    }",
    "    else if (h.y > 3.9 && h.y < 4.5){",
    "      col = vidrio(p, n, rd, dim);",
    "      vec4 tq = tintaDe((p - u_p0)/u_k.x, 4.0);",
    "      if (tq.a > 0.01){",
    "        float fl = pow(max(dot(reflect(rd,n), normalize(vec3(-0.52,0.78,0.46))), 0.0), 300.0);",
    "        col = mix(col, tq.rgb * (0.62 + 1.6*fl), tq.a * 0.90);",
    "      }",
    "    }",
    "    else col = luz(p, n, rd, h.y, dim);",

    "    col = mix(col, vec3(0.016,0.013,0.011), 1.0 - exp(-0.014*t*t));",
    "  }",

    "  float z = dio ? t : 30.0;",
    "  float coc = clamp((abs(z - u_foco.x) - 0.13) / max(0.34, u_foco.x * 0.26), 0.0, 1.0);",
    "  coc *= (z > u_foco.x) ? 1.0 : 0.55;",
    "  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));",
    "  vec3 comp = col / (1.0 + L);",
    "  gl_FragColor = vec4(pow(comp, vec3(0.4545)), coc);",
    "}"
  ].join("\n");

  var FS2 = [
    "precision highp float;",
    "uniform sampler2D u_tex;",
    "uniform vec2 u_res;",
    "uniform float u_t;",
    "uniform float u_apert;",
    "vec3 abrir(vec4 s){",
    "  vec3 c = pow(s.rgb, vec3(2.2));",
    "  float l = dot(c, vec3(0.2126,0.7152,0.0722));",
    "  return min(c / max(0.14, 1.0 - l), vec3(7.0));",   // con techo: sin el, un canal saturado se dispara           // inversa de c/(1+luma)
    "}",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  vec4 c0 = texture2D(u_tex, uv);",
    "  float r = c0.a * u_apert;",
    "  vec3 acc = abrir(c0); float pes = 1.0;",
    "  float giro = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;",
    "  if (r > 0.6){",
    "    for (int i = 0; i < 22; i++){",
    "      float f = (float(i) + 0.5) / 22.0;",
    "      float ang = float(i) * 2.39996323 + giro;",
    "      vec2 o = vec2(cos(ang), sin(ang)) * sqrt(f) * r;",
    "      vec4 sm = texture2D(u_tex, uv + o / u_res);",
    "      float w = clamp(sm.a * u_apert - length(o) + 1.2, 0.0, 1.0);",
    "      acc += abrir(sm) * w; pes += w;",
    "    }",
    "  }",
    "  vec3 col = acc / pes;",

    "  vec3 halo = vec3(0.0);",
    "  float rb = max(18.0, u_apert * 2.6);",
    "  for (int i = 0; i < 14; i++){",
    "    float f = (float(i) + 0.5) / 14.0;",
    "    float a = float(i) * 2.39996323 + 1.31 + giro;",
    "    vec2 o = vec2(cos(a), sin(a)) * sqrt(f) * rb;",
    "    vec3 sm = abrir(texture2D(u_tex, uv + o / u_res));",
    "    halo += vec3(max(dot(sm, vec3(0.2126,0.7152,0.0722)) - 1.12, 0.0));",
    "  }",
    "  col += halo * (0.58 / 14.0) * vec3(1.0, 0.93, 0.82);",
    "  col = col / (col + vec3(0.70));",
    "  col = pow(col, vec3(0.4545));",
    "  col *= 0.82 + 0.18*pow(16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.28);",
    "  float g = fract(sin(dot(gl_FragCoord.xy + u_t*60.0, vec2(12.9898,78.233))) * 43758.5453);",
    "  col += (g - 0.5) * 0.026;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function texEntorno() {
    var L = 512, A = 256, c = document.createElement("canvas");
    c.width = L; c.height = A * 4;
    var g = c.getContext("2d");

    function cod(r, gr, b) {          // comprime al rango de la textura
      function k(x) { return Math.round(Math.pow(Math.min(1, x / 8), 1 / 2.2) * 255); }
      return "rgb(" + k(r) + "," + k(gr) + "," + k(b) + ")";
    }

    var base = document.createElement("canvas");
    base.width = L; base.height = A;
    var b = base.getContext("2d");

    var v = b.createLinearGradient(0, 0, 0, A);
    v.addColorStop(0.00, cod(0.10, 0.092, 0.084));
    v.addColorStop(0.42, cod(0.020, 0.018, 0.016));
    v.addColorStop(0.52, cod(0.008, 0.007, 0.006));
    v.addColorStop(1.00, cod(0.085, 0.062, 0.042));
    b.fillStyle = v; b.fillRect(0, 0, L, A);

    b.globalCompositeOperation = "lighter";
    var p = b.createRadialGradient(L * 0.30, A * 0.24, 0, L * 0.30, A * 0.24, L * 0.30);
    p.addColorStop(0.00, cod(1.55, 1.48, 1.36));
    p.addColorStop(0.55, cod(0.42, 0.40, 0.36));
    p.addColorStop(1.00, cod(0, 0, 0));
    b.fillStyle = p; b.fillRect(0, 0, L, A);

    var nu = b.createRadialGradient(L * 0.28, A * 0.20, 0, L * 0.28, A * 0.20, L * 0.10);
    nu.addColorStop(0.00, cod(6.40, 6.10, 5.55));
    nu.addColorStop(1.00, cod(0, 0, 0));
    b.fillStyle = nu; b.fillRect(0, 0, L, A);

    var fr = b.createRadialGradient(L * 0.74, A * 0.44, 0, L * 0.74, A * 0.44, L * 0.20);
    fr.addColorStop(0.00, cod(0.52, 0.60, 0.78));
    fr.addColorStop(1.00, cod(0, 0, 0));
    b.fillStyle = fr; b.fillRect(0, 0, L, A);

    var re = b.createRadialGradient(L * 0.46, A * 0.82, 0, L * 0.46, A * 0.82, L * 0.34);
    re.addColorStop(0.00, cod(0.44, 0.32, 0.20));
    re.addColorStop(1.00, cod(0, 0, 0));
    b.fillStyle = re; b.fillRect(0, 0, L, A);
    b.globalCompositeOperation = "source-over";

    var desenfoques = [0, 4, 13, 34];
    for (var i = 0; i < 4; i++) {
      g.save();
      g.beginPath(); g.rect(0, i * A, L, A); g.clip();
      g.filter = desenfoques[i] ? "blur(" + desenfoques[i] + "px)" : "none";
      g.drawImage(base, -L, i * A);
      g.drawImage(base, 0, i * A);
      g.drawImage(base, L, i * A);
      g.restore();
    }
    return c;
  }

  function texEtiquetas() {
    var L = 512, c = document.createElement("canvas");
    c.width = L; c.height = L * 3;
    var x = c.getContext("2d");
    var filas = [
      ["SÉRUM REPARADOR", "30 ML", "rgba(252,240,220,"],
      ["CREMA DE NOCHE",  "50 ML", "rgba(88,66,54,"],
      ["BÁLSAMO LIMPIADOR", "75 ML", "rgba(246,232,204,"]
    ];
    for (var i = 0; i < 3; i++) {
      var oy = i * L + L * 0.30, tinta = filas[i][2];
      x.textAlign = "center";
      x.fillStyle = tinta + "0.97)";
      x.font = "600 74px 'Frank Ruhl Libre', Georgia, serif";
      x.letterSpacing = "16px";
      x.fillText("AURA", L / 2 + 8, oy + 60);
      x.fillStyle = tinta + "0.74)";
      x.font = "300 25px 'Work Sans', system-ui, sans-serif";
      x.letterSpacing = "11px";
      x.fillText("SKINCARE", L / 2 + 6, oy + 100);
      x.strokeStyle = tinta + "0.34)"; x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(L * .30, oy + 124); x.lineTo(L * .70, oy + 124); x.stroke();
      x.fillStyle = tinta + "0.66)";
      x.font = "300 19px 'Work Sans', system-ui, sans-serif";
      x.letterSpacing = "5px";
      x.fillText(filas[i][0], L / 2 + 3, oy + 154);
      x.fillText(filas[i][1], L / 2 + 3, oy + 180);
    }
    return c;
  }

  var lienzo = document.createElement("canvas");
  lienzo.className = "v3d";
  lienzo.setAttribute("aria-hidden", "true");
  var gl = lienzo.getContext("webgl", { antialias: false, alpha: false,
                                        powerPreference: "high-performance" }) ||
           lienzo.getContext("experimental-webgl");
  if (!gl) return;

  function compilar(tipo, src) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("vitrina-3d:", gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  var vs = compilar(gl.VERTEX_SHADER, VS), fs = compilar(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texEtiquetas());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var texEnv = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texEnv);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texEntorno());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0);

  var U = {};
  ["u_res","u_t","u_ro","u_ta","u_p0","u_p1","u_p2","u_k","u_d","u_q","u_lab","u_foco","u_jit","u_env"]
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.u_lab, 0);
  gl.uniform1i(U.u_env, 1);

  var fs2 = compilar(gl.FRAGMENT_SHADER, FS2);
  if (!fs2) return;
  var prog2 = gl.createProgram();
  gl.attachShader(prog2, vs); gl.attachShader(prog2, fs2); gl.linkProgram(prog2);
  if (!gl.getProgramParameter(prog2, gl.LINK_STATUS)) return;
  var loc2 = gl.getAttribLocation(prog2, "p");
  var U2 = {};
  ["u_tex","u_res","u_t","u_apert"].forEach(function (n) {
    U2[n] = gl.getUniformLocation(prog2, n);
  });

  var fbo = gl.createFramebuffer(), fboTex = gl.createTexture();
  function lienzoIntermedio(w, h) {
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  caja.insertBefore(lienzo, caja.firstChild);

  var esc = 1.0, heroe = -1;
  var orbY = 0, orbX = 0, tOrbY = 0, tOrbX = 0;
  var foco = 3.4;
  var muestra = 0, tope = 10;
  function reiniciar() { muestra = 0; }

  var energia = 1, ultimaAccion = 0, eraQuieto = false, convergiendo = false;
  function despertar() { ultimaAccion = performance.now(); }
  var pos  = PROD.map(function (p) { return p.reposo.slice(); });
  var base = PROD.map(function (p) { return p.reposo.slice(); });
  var kEsc = [1, 1, 1], kDim = [1, 1, 1];
  var W = 0, H = 0;

  var TOPE_PX = 1600000;      // presupuesto: mas alla de esto no compensa

  function medir() {
    var r = caja.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var px = r.width * r.height * dpr * dpr * esc * esc;
    var techo = px > TOPE_PX ? Math.sqrt(TOPE_PX / px) : 1.0;
    W = Math.max(2, Math.round(r.width * dpr * esc * techo));
    H = Math.max(2, Math.round(r.height * dpr * esc * techo));
    lienzo.width = W; lienzo.height = H;
    gl.viewport(0, 0, W, H);
    lienzoIntermedio(W, H);
    reiniciar();
  }
  medir();
  addEventListener("resize", medir);

  function destinos() {
    var libre = 0;
    for (var i = 0; i < 3; i++) {
      if (i === heroe) { PROD[i].dest = PROD[i].heroe; PROD[i].k = 1.14; PROD[i].dim = 1.0; }
      else if (heroe < 0) { PROD[i].dest = PROD[i].reposo; PROD[i].k = 1.0; PROD[i].dim = 1.0; }
      else { PROD[i].dest = BANDA[libre++]; PROD[i].k = 0.78; PROD[i].dim = 0.44; }
    }
  }
  destinos();

  var botones = PROD.map(function (p, i) {
    var b = document.createElement("button");
    b.className = "v3d-hit";
    b.type = "button";
    b.setAttribute("data-p3d", p.id);
    b.setAttribute("aria-label", "Ver " + p.id);
    b.addEventListener("click", function () { elegir(i); });
    caja.appendChild(b);
    return b;
  });

  function proyectar(w, ro, ta) {
    var wx = ta[0]-ro[0], wy = ta[1]-ro[1], wz = ta[2]-ro[2];
    var l = Math.hypot(wx, wy, wz); wx/=l; wy/=l; wz/=l;

    var ux = -wz, uy = 0, uz = wx;
    var ul = Math.hypot(ux, uy, uz); ux/=ul; uy/=ul; uz/=ul;

    var vx = uy*wz - uz*wy;
    var vy = uz*wx - ux*wz;
    var vz = ux*wy - uy*wx;

    var dx = w[0]-ro[0], dy = w[1]-ro[1], dz = w[2]-ro[2];
    var a = dx*ux + dy*uy + dz*uz;      // horizontal
    var b = dx*vx + dy*vy + dz*vz;      // vertical
    var c = dx*wx + dy*wy + dz*wz;      // profundidad
    if (c <= 0.01) return null;

    var r = caja.getBoundingClientRect();
    return [r.width * 0.5 + (2.75 * a / c) * r.height,
            r.height * 0.5 - (2.75 * b / c) * r.height];
  }

  function elegir(i) {
    heroe = (heroe === i) ? -1 : i;
    reiniciar(); despertar();
    destinos();
    caja.setAttribute("data-heroe", heroe < 0 ? "" : PROD[heroe].id);
    ficha(heroe < 0 ? null : PROD[heroe].id);
  }
  function ficha(id) {
    var r = caja.parentNode.querySelector(".v-rotulo");
    if (!r) return;
    var fila = id && caja.parentNode.querySelector('.v-fila[data-prod="' + id + '"]');
    caja.parentNode.querySelectorAll(".v-fila").forEach(function (f) {
      f.toggleAttribute("data-activa", !!fila && f === fila);
    });
    if (!fila) { r.removeAttribute("data-ver"); return; }
    r.querySelector(".r-nom").textContent = fila.getAttribute("data-nom");
    r.querySelector(".r-det").textContent = fila.getAttribute("data-det");
    r.querySelector(".r-eur").textContent = fila.getAttribute("data-eur") + " €";
    r.setAttribute("data-ver", "si");
  }

  window.auraElegir3D = function (id) {
    var i = PROD.map(function (p) { return p.id; }).indexOf(id);
    if (i >= 0 && i !== heroe) elegir(i);
  };

  var fino = matchMedia("(hover:hover) and (pointer:fine)").matches;
  caja.addEventListener("pointermove", function (e) {
    despertar();
    var r = caja.getBoundingClientRect();
    tOrbY = ((e.clientX - r.left) / r.width - 0.5) * 0.62;
    tOrbX = ((e.clientY - r.top) / r.height - 0.5) * 0.30;
  });
  caja.addEventListener("pointerleave", function () { despertar(); tOrbY = 0; tOrbX = 0; });
  var ax = 0, ay = 0, arr = false;
  caja.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return;
    arr = true; ax = e.clientX; ay = tOrbY;
  });
  caja.addEventListener("pointermove", function (e) {
    if (!arr) return;
    var r = caja.getBoundingClientRect();
    tOrbY = Math.max(-0.9, Math.min(0.9, ay + (e.clientX - ax) / r.width * 1.6));
  });
  ["pointerup", "pointercancel"].forEach(function (ev) {
    caja.addEventListener(ev, function () { arr = false; });
  });

  var visible = false, t0 = performance.now(), lento = 0, rapido = 0, activo = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (f) {
      visible = f[0].isIntersecting;
      if (visible && !activo) { activo = true; requestAnimationFrame(pintar); }
    }, { rootMargin: "120px" }).observe(caja);
  } else { visible = true; activo = true; requestAnimationFrame(pintar); }

  var ultimo = 0;
  function pintar(ahora) {
    if (!visible || document.hidden) { activo = false; return; }
    if (ahora - ultimo < 24) { requestAnimationFrame(pintar); return; }
    ultimo = ahora;
    var t = (ahora - t0) / 1000;

    var quieto = (ahora - ultimaAccion) > 1500;
    energia += ((quieto ? 0 : 1) - energia) * 0.055;
    if (quieto !== eraQuieto) { eraQuieto = quieto; reiniciar(); }
    tope = (energia < 0.02) ? 160 : 4;
    if (energia < 0.02 && !convergiendo) { convergiendo = true; reiniciar(); }
    if (energia >= 0.02) convergiendo = false;

    var oy0 = orbY, ox0 = orbX;
    orbY += (tOrbY - orbY) * 0.055;
    orbX += (tOrbX - orbX) * 0.055;
    if (Math.abs(orbY - oy0) > 0.0006 || Math.abs(orbX - ox0) > 0.0006) reiniciar();

    var rad = 3.62, alt = 1.02 + orbX * 0.95;
    var ro = [Math.sin(orbY) * rad, alt, Math.cos(orbY) * rad];
    var ta = [0.0, 0.52 + Math.sin(t * 0.21) * 0.004 * energia, 0.0];

    for (var i = 0; i < 3; i++) {
      var d = PROD[i].dest, fl = Math.sin(t * (0.42 + i * 0.11) + i * 2.1) * 0.014 * energia;
      base[i][0] += (d[0] - base[i][0]) * 0.075;
      base[i][1] += (d[1] - base[i][1]) * 0.075;
      base[i][2] += (d[2] - base[i][2]) * 0.075;
      pos[i][0] = base[i][0];
      pos[i][1] = base[i][1] + fl;
      pos[i][2] = base[i][2];
      kEsc[i] += (PROD[i].k - kEsc[i]) * 0.075;
      kDim[i] += (PROD[i].dim - kDim[i]) * 0.075;
      if (Math.abs(d[0] - base[i][0]) + Math.abs(d[1] - base[i][1]) +
          Math.abs(d[2] - base[i][2]) > 0.0015) reiniciar();
      var s = proyectar(base[i], ro, ta);
      var b = botones[i];
      if (s) {
        var lado = Math.max(56, caja.clientWidth * 0.15) * kEsc[i];
        b.style.left = (s[0] - lado / 2) + "px";
        b.style.top = (s[1] - lado / 2) + "px";
        b.style.width = b.style.height = lado + "px";
        b.style.opacity = "1";
      } else { b.style.opacity = "0"; }
    }

    gl.useProgram(prog);
    gl.uniform2f(U.u_res, W, H);
    gl.uniform1f(U.u_t, t);
    gl.uniform3f(U.u_ro, ro[0], ro[1], ro[2]);
    gl.uniform3f(U.u_ta, ta[0], ta[1], ta[2]);
    gl.uniform3f(U.u_p0, pos[0][0], pos[0][1], pos[0][2]);
    gl.uniform3f(U.u_p1, pos[1][0], pos[1][1], pos[1][2]);
    gl.uniform3f(U.u_p2, pos[2][0], pos[2][1], pos[2][2]);
    gl.uniform3f(U.u_k, kEsc[0], kEsc[1], kEsc[2]);
    gl.uniform3f(U.u_d, kDim[0], kDim[1], kDim[2]);
    var fx = (heroe >= 0) ? base[heroe] : [0, 0.72, 0.05];
    var destFoco = Math.hypot(ro[0] - fx[0], ro[1] - fx[1], ro[2] - fx[2]) - 0.17;
    foco += (destFoco - foco) * 0.055;

    gl.uniform1f(U.u_q, 1.0);
    gl.uniform2f(U.u_foco, foco, 1.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texEnv);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, W, H);
    gl.useProgram(prog);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var hx = 0, hy = 0, fb = 1.0 / 2, ft = 1.0 / 3, ii = muestra + 1, jj = muestra + 1;
    while (ii > 0) { hx += fb * (ii % 2); ii = Math.floor(ii / 2); fb /= 2; }
    while (jj > 0) { hy += ft * (jj % 3); jj = Math.floor(jj / 3); ft /= 3; }
    gl.uniform2f(U.u_jit, hx - 0.5, hy - 0.5);
    if (muestra === 0) {
      gl.disable(gl.BLEND);
    } else {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
      gl.blendColor(0, 0, 0, 1 / (muestra + 1));
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    if (muestra < tope) muestra++;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(prog2);
    gl.enableVertexAttribArray(loc2);
    gl.vertexAttribPointer(loc2, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.uniform1i(U2.u_tex, 0);
    gl.uniform2f(U2.u_res, W, H);
    gl.uniform1f(U2.u_t, t);
    gl.uniform1f(U2.u_apert, Math.max(4.5, W * 0.0102));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    var dt = performance.now() - ahora;
    if (dt > 26)      { lento++;  rapido = 0; }
    else if (dt < 13) { rapido++; lento = 0; }
    if (lento > 20 && esc > 0.55)  { esc = Math.max(0.55, esc - 0.15); lento = 0; medir(); }
    if (rapido > 180 && esc < 1.0) { esc = Math.min(1.0, esc + 0.15); rapido = 0; medir(); }

    if (!caja.classList.contains("v3d-vivo")) caja.classList.add("v3d-vivo");
    requestAnimationFrame(pintar);
  }
})();
