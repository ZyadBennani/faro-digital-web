/* `/test/faro` · LA PIEZA FIRMA · fila B15 · Fable 5.1 · 04-sep-2026
 *
 * Motivo: pieza firma del faro sobre la página del test. Techo 300 KB (texturas
 * incluidas), 60 fps en Android de gama media, DPR ≤ 1,5.
 *
 * Un plano y un shader. WebGL2 a mano, sin librerías: un cuadrilátero a pantalla
 * completa con dos texturas, la foto y la máscara del mar. El shader desplaza las
 * UV SOLO donde la máscara es blanca, con dos capas de ruido (oleaje lento y rizo
 * fino); el faro, el espigón y el cielo se dibujan tal cual, siempre. Encima,
 * el reflejo de la linterna en oro, deformado por el mismo oleaje.
 *
 * Control: en escritorio el puntero (abajo = mar alto y rizo fuerte); en móvil el
 * progreso de scroll del hero y la escena; sin ninguno, una respiración de 8 s.
 * Todo con inercia (lerp 0,06 por frame), nunca directo.
 *
 * Contrato de escena: DPR ≤ 1,5 · rAF solo con el hero en viewport · arranca
 * después del LCP (load + 300 ms) · sin WebGL2, primer frame > 80 ms o contexto
 * perdido → se queda el poster, que es la misma imagen quieta · con
 * prefers-reduced-motion este archivo no hace nada (manda el <video> de 5 s).
 *
 * Todo lo que aquí es un número sale de `direccion-arte.md`: no se ha vuelto a
 * medir nada. */
(function () {
  'use strict';

  var canvas = document.querySelector('.pieza');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hero = canvas.closest('.hero');
  var escena = document.querySelector('.escena');
  var oferta = document.querySelector('.oferta');
  if (!hero) return;

  /* ---------- Las dos escenas, medidas en direccion-arte.md ---------- */
  var ESCENAS = {
    w: { tex: 'media/faro-w.webp', mask: 'media/mascara-w.png', tw: 1600, th: 912,
         horizonte: 0.527, lint: [0.495, 0.230], rad: 0.030, anclaY: 0.60,
         // constantes propias: torre oscura, mar abierto, espuma a los lados
         oleaje: 0.0090, rizo: 0.0028, reflejo: 0.55, umbralEspuma: 0.34 },
    m: { tex: 'media/faro-m.webp', mask: 'media/mascara-m.png', tw: 672, th: 900,
         horizonte: 0.575, lint: [0.500, 0.125], rad: 0.055, anclaY: 0.70,
         // torre clara y olas grandes: el rizo puede ser algo mayor, el reflejo menos
         oleaje: 0.0080, rizo: 0.0034, reflejo: 0.45, umbralEspuma: 0.40 }
  };
  var ORO = [0.788, 0.651, 0.404];       // #C9A667, el único acento
  var esMovil = matchMedia('(max-width: 640px)');
  var punteroFino = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Shaders ---------- */
  var VS = '#version 300 es\n' +
    'const vec2 P[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));' +
    'out vec2 vUv;' +
    'void main(){vec2 p=P[gl_VertexID];vUv=vec2(p.x*.5+.5,1.-(p.y*.5+.5));gl_Position=vec4(p,0.,1.);}';

  var FS = '#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 vUv; out vec4 o;\n' +
    'uniform sampler2D uTex, uMask;\n' +
    'uniform vec2 uUvScale, uUvOffset, uLint;\n' +
    'uniform float uT, uNivel, uAmp, uDrift, uHorizonte, uRad, uAspect, uOleaje, uRizo, uReflejo, uUmbral, uAliento;\n' +
    /* Ruido simplex 2D, escrito a mano (Gustavson / McEwan, dominio público). */
    'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}\n' +
    'vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}\n' +
    'vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}\n' +
    'float snoise(vec2 v){\n' +
    ' const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);\n' +
    ' vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);\n' +
    ' vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);\n' +
    ' vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);\n' +
    ' vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));\n' +
    ' vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;\n' +
    ' vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;\n' +
    ' m*=1.79284291400159-.85373472095314*(a0*a0+h*h);\n' +
    ' vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;\n' +
    ' return 130.*dot(m,g);}\n' +
    'float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}\n' +
    'void main(){\n' +
    ' vec2 uv=vUv*uUvScale+uUvOffset;\n' +
    ' if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){o=vec4(.098,.149,.133,1.);return;}\n' +
    ' float m=texture(uMask,uv).r;\n' +
    ' vec3 base=texture(uTex,uv).rgb;\n' +
    ' vec3 col=base;\n' +
    ' if(m>0.002){\n' +
    /* oleaje: lento y ancho (~6 s). rizo: fino (~1,2 s). El tiempo entra dividido
       por el periodo, así los números de arriba SON los periodos. */
    '  vec2 q=vec2(uv.x*uAspect,uv.y);\n' +
    /* dos muestras en sentidos opuestos, promediadas: el patrón evoluciona en el sitio en vez de trasladarse. Una sola muestra que se mueve se lee como una textura deslizando, no como agua. */
    '  float ole=.5*(snoise(q*vec2(2.6,4.2)+vec2(uT/6.,-uT/6.*1.7))+snoise(q*vec2(3.1,3.7)+vec2(-uT/6.*1.3,uT/6.*.9)));\n' +
    '  float riz=.5*(snoise(q*vec2(17.,34.)+vec2(-uT/1.2,uT/1.2*1.2))+snoise(q*vec2(21.,29.)+vec2(uT/1.2*.8,-uT/1.2)));\n' +
    /* espuma: donde la foto ya es clara, el rizo va ×1,6. No se pinta espuma nueva. */
    '  float esp=smoothstep(uUmbral,uUmbral+.18,lum(base));\n' +
    '  riz*=mix(1.,1.6,esp);\n' +
    /* atenuación en el horizonte: la franja del degradado de la máscara vale m<1,
       y elevado al cuadrado deja la línea del mar sin desplazar. */
    /* el canal G es la máscara desenfocada (la calcula pieza.js al cargar): pegado a la torre o al espigón vale poco y el agua de ahí apenas se mueve. Sin esto el agua desplazada se corta contra la piedra y deja una costura. */
    '  float lejos=texture(uMask,uv).g;\n' +
    '  float at=m*m*pow(lejos,1.4);\n' +
    '  vec2 d=vec2(ole*uOleaje*.55+riz*uRizo*.6*uAmp+uDrift,\n' +
    '              ole*uOleaje+riz*uRizo*uAmp+uNivel)*at;\n' +
    /* nunca se traen píxeles de la torre o del espigón al agua: si en el destino
       la máscara es negra, el desplazamiento se recorta hacia cero. */
    '  float md=texture(uMask,uv+d).r;\n' +
    '  d*=smoothstep(0.,.35,md);\n' +
    '  col=texture(uTex,uv+d).rgb;\n' +
    /* el reflejo de la linterna: una columna de oro anclada a su x, que se
       ensancha y se apaga al alejarse del horizonte, y se rompe con el oleaje. */
    '  float rx=uLint.x+ole*.012+uDrift*.5;\n' +
    '  float dy=max(uv.y-uHorizonte,0.);\n' +
    '  float w=.010+dy*.09;\n' +
    '  float dx=(uv.x-rx)*uAspect;\n' +
    '  float colu=exp(-dx*dx/(2.*w*w));\n' +
    '  float caida=exp(-dy*5.5)*smoothstep(0.,.03,dy);\n' +
    '  float brillo=colu*caida*m*(.65+.35*max(riz,0.))*uReflejo*(1.+uAliento*4.);\n' +
    '  col+=vec3(.788,.651,.404)*brillo;\n' +
    ' }\n' +
    /* la linterna respira al 3 %: un halo suave en su sitio, nada más brilla. */
    ' float dl=length((uv-uLint)*vec2(uAspect,1.));\n' +
    ' float halo=exp(-dl*dl/(2.*uRad*uRad));\n' +
    ' col+=col*halo*uAliento;\n' +
    ' o=vec4(col,1.);\n' +
    '}';

  /* ---------- Estado ---------- */
  var gl = null, prog = null, uni = {}, texFoto = null, texMask = null;
  var esc = null, listo = false, vivo = false, enVista = true, raf = 0, perdido = false;
  var t0 = 0;
  var objetivo = { nivel: 0, amp: 1, drift: 0 }, actual = { nivel: 0, amp: 1, drift: 0 };
  var ultimaEntrada = -1e9, punteroY = 0.5, punteroX = 0.5;
  var LERP = 0.06;

  function curvaSuave(x) { // --m-continua, simétrica: va y vuelve, se puede parar a mitad
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function cargar(src) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src;
    });
  }

  /* La máscara se sube con dos canales: R = la máscara tal cual, G = la misma
     muy desenfocada (radio ~3 % del ancho). G es la «distancia a la estructura»
     con la que el shader deja casi quieta el agua pegada a la piedra. */
  function mascaraConDistancia(im) {
    var w = im.naturalWidth, h = im.naturalHeight;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0);
    var d = x.getImageData(0, 0, w, h), px = d.data, n = w * h;
    var a = new Float32Array(n), b = new Float32Array(n), i;
    for (i = 0; i < n; i++) a[i] = px[i * 4] / 255;
    var r = Math.max(2, Math.round(w * 0.03));
    function pasada(src, dst, horiz) {           // desenfoque de caja separable
      var Lg = horiz ? w : h, M = horiz ? h : w, j, k, i2;
      for (j = 0; j < M; j++) {
        var acc = 0, cnt = 0;
        for (k = -r; k <= r; k++) { var q = Math.min(Math.max(k, 0), Lg - 1); acc += horiz ? src[j * w + q] : src[q * w + j]; cnt++; }
        for (i2 = 0; i2 < Lg; i2++) {
          dst[horiz ? j * w + i2 : i2 * w + j] = acc / cnt;
          var sal = Math.min(Math.max(i2 - r, 0), Lg - 1), ent = Math.min(i2 + r + 1, Lg - 1);
          acc += (horiz ? src[j * w + ent] : src[ent * w + j]) - (horiz ? src[j * w + sal] : src[sal * w + j]);
        }
      }
    }
    for (var pz = 0; pz < 3; pz++) { pasada(a, b, true); pasada(b, a, false); }   // tres pasadas ≈ gaussiano
    for (i = 0; i < n; i++) px[i * 4 + 1] = Math.round(Math.min(Math.max(a[i], 0), 1) * 255);
    x.putImageData(d, 0, 0);
    return c;
  }

  function textura(im, lineal) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function compilar(tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  /* Cover con el mismo anclaje que usaba el vídeo (50 % / 60 % en escritorio,
     50 % / 70 % en móvil): así el canvas y el poster de debajo coinciden píxel a
     píxel y el fundido no salta. */
  function medir() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = hero.getBoundingClientRect();
    var W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    gl.viewport(0, 0, W, H);
    var s = Math.max(W / esc.tw, H / esc.th);
    var dw = esc.tw * s, dh = esc.th * s;
    var ox = (W - dw) * 0.5, oy = (H - dh) * esc.anclaY;
    gl.uniform2f(uni.uUvScale, W / dw, H / dh);
    gl.uniform2f(uni.uUvOffset, -ox / dw, -oy / dh);
    gl.uniform1f(uni.uAspect, esc.tw / esc.th);
  }

  function apagar(motivo) {
    vivo = false; listo = false;
    canvas.classList.remove('viva');
    if (raf) cancelAnimationFrame(raf); raf = 0;
    canvas.setAttribute('data-pieza', motivo);
  }

  /* ---------- Control ---------- */
  function progresoScroll() {
    // 0 arriba del todo · 1 con los cuatro bloques de la sección 2 a la vista
    var fin;
    if (escena && escena.offsetHeight > window.innerHeight * 1.5) {
      fin = escena.offsetHeight - window.innerHeight;          // escena sticky de 200vh
    } else if (oferta) {
      fin = oferta.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    } else { fin = window.innerHeight; }
    return Math.min(Math.max(window.scrollY / Math.max(fin, 1), 0), 1);
  }

  function fijarObjetivo(y01, x01) {
    // arriba = mar bajo y rizo ×1 · abajo = mar alto (+6 %) y rizo ×2,5
    objetivo.nivel = -0.03 + (0.05 + 0.03) * y01;
    objetivo.amp = 1 + 1.5 * y01;
    objetivo.drift = (x01 - 0.5) * 0.018;
  }

  if (punteroFino.matches) {
    window.addEventListener('pointermove', function (e) {
      punteroX = e.clientX / window.innerWidth;
      punteroY = e.clientY / window.innerHeight;
      ultimaEntrada = performance.now();
    }, { passive: true });
  }
  window.addEventListener('scroll', function () { ultimaEntrada = performance.now(); }, { passive: true });

  /* ---------- El bucle ---------- */
  function marco(ahora) {
    raf = 0;
    if (!vivo || !enVista) return;
    var t = (ahora - t0) / 1000;

    var quieto = ahora - ultimaEntrada > 3000;
    if (punteroFino.matches) {
      if (quieto) {                                     // respiración de 8 s
        var f = curvaSuave((Math.sin(t * Math.PI * 2 / 8) + 1) / 2);
        fijarObjetivo(0.35 + 0.3 * f, 0.5);
      } else { fijarObjetivo(punteroY, punteroX); }
    } else {
      var p = progresoScroll();
      var r = quieto ? 0.12 * curvaSuave((Math.sin(t * Math.PI * 2 / 8) + 1) / 2) : 0;
      fijarObjetivo(Math.min(p + r, 1), 0.5);
    }
    actual.nivel += (objetivo.nivel - actual.nivel) * LERP;
    actual.amp += (objetivo.amp - actual.amp) * LERP;
    actual.drift += (objetivo.drift - actual.drift) * LERP;

    var aliento = 0.03 * curvaSuave((Math.sin(t * Math.PI * 2 / 8) + 1) / 2);

    gl.uniform1f(uni.uT, t);
    gl.uniform1f(uni.uNivel, actual.nivel);
    gl.uniform1f(uni.uAmp, actual.amp);
    gl.uniform1f(uni.uDrift, actual.drift);
    gl.uniform1f(uni.uAliento, aliento);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(marco);
  }

  function arrancarBucle() {
    if (!vivo || !enVista || raf) return;
    raf = requestAnimationFrame(marco);
  }

  /* ---------- Arranque: después del LCP, nunca antes ---------- */
  function iniciar() {
    if (listo) return; listo = true;
    esc = esMovil.matches ? ESCENAS.m : ESCENAS.w;
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) { apagar('sin-webgl2'); return; }

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); perdido = true; apagar('contexto-perdido'); }, false);

    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) { apagar('shader'); return; }
    gl.useProgram(prog);
    ['uTex', 'uMask', 'uUvScale', 'uUvOffset', 'uLint', 'uT', 'uNivel', 'uAmp', 'uDrift', 'uHorizonte',
     'uRad', 'uAspect', 'uOleaje', 'uRizo', 'uReflejo', 'uUmbral', 'uAliento'].forEach(function (n) {
      uni[n] = gl.getUniformLocation(prog, n);
    });

    Promise.all([cargar(esc.tex), cargar(esc.mask)]).then(function (ims) {
      if (perdido) return;
      texFoto = textura(ims[0]); texMask = textura(mascaraConDistancia(ims[1]));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texFoto); gl.uniform1i(uni.uTex, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texMask); gl.uniform1i(uni.uMask, 1);
      gl.uniform2f(uni.uLint, esc.lint[0], esc.lint[1]);
      gl.uniform1f(uni.uHorizonte, esc.horizonte);
      gl.uniform1f(uni.uRad, esc.rad);
      gl.uniform1f(uni.uOleaje, esc.oleaje);
      gl.uniform1f(uni.uRizo, esc.rizo);
      gl.uniform1f(uni.uReflejo, esc.reflejo);
      gl.uniform1f(uni.uUmbral, esc.umbralEspuma);
      medir();

      // El primer frame, cronometrado: si tarda más de 80 ms este dispositivo no
      // es para esto, y se queda el poster sin que se note nada.
      var a = performance.now();
      gl.uniform1f(uni.uT, 0); gl.uniform1f(uni.uNivel, 0); gl.uniform1f(uni.uAmp, 1);
      gl.uniform1f(uni.uDrift, 0); gl.uniform1f(uni.uAliento, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.finish();
      var ms = performance.now() - a;
      canvas.setAttribute('data-primer-frame-ms', ms.toFixed(1));
      if (ms > 80) { apagar('primer-frame-lento'); return; }

      t0 = performance.now();
      vivo = true;
      canvas.classList.add('viva');
      canvas.setAttribute('data-pieza', 'viva:' + (esc === ESCENAS.m ? 'm' : 'w'));
      arrancarBucle();
    }).catch(function () { apagar('texturas'); });
  }

  // rAF solo con el hero en pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        enVista = e.isIntersecting;
        if (enVista) arrancarBucle(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    }, { threshold: 0.02 }).observe(hero);
  }

  window.addEventListener('resize', function () {
    if (!vivo) return;
    var quiero = esMovil.matches ? ESCENAS.m : ESCENAS.w;
    if (quiero !== esc) { // cambia la escena: se vuelve a cargar todo
      apagar('reinicio'); listo = false; iniciar(); return;
    }
    medir();
  });

  function despues() { setTimeout(iniciar, 300); }
  if (document.readyState === 'complete') despues();
  else window.addEventListener('load', despues, { once: true });
})();
