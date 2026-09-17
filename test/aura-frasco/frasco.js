/* ═══════════════════════════════════════════════════════════════════════════
   AURA · EL FRASCO COMO OBJETO DE LUZ
   Banco /test/aura-frasco/ · sesion 1 · 17-sep-2026

   UNA SOLA IDEA: el frasco es un objeto de luz SOBRE PAPEL. No una escena, no
   un fondo negro, no una caja.

   POR QUE ESTE ARCHIVO EXISTE Y EL ANTERIOR NO SIRVIO
   El intento del 30-ago (Versiones-Anteriores/vitrina-three-2026-08-30) se
   archivo con esta frase: «plastico saturado, brillo duro, sin desenfoque».
   Su acta esta en POR-QUE-ESTA-AQUI.md, y la causa tecnica se lee entre lineas:
   entorno de 8 bits. Un entorno LDR no puede tener un reflejo mas brillante que
   el blanco del papel, y sin ese reflejo el vidrio no es vidrio: es plastico
   gris con un punto blanco quemado encima.

       🔴 EL ENTORNO ES FLOTANTE (Float32, valores > 1). Es LA decision
          tecnica de esta sesion. Si alguien lo cambia por un <canvas>,
          vuelve el plastico.

   QUE ES EL ENTORNO, Y POR QUE NO ES UN HDRI DESCARGADO
   Prohibido cargar HDRI externo. Y ademas no haria falta: el entorno de esta
   pieza ES LA PAGINA. Debajo del horizonte, papel (#F5EFE4). Encima, luz de
   estudio. Nada mas. Un HDRI de estudio mete ventanas, paredes y tramoya que no
   existen en la web, y esos reflejos son justo lo que delata un render pegado
   sobre una pagina.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from './tres/three.module.min.js';

export const PAPEL = 0xF5EFE4;          // base.css · la unica superficie de esta pieza
export const ACENTO = 0x916445;         // base.css · --caso-acento de Aura. UNO, no dos.

/* ── AJUSTES POR DEFECTO ───────────────────────────────────────────────────
   Todo lo que el panel puede mover. Se exporta tal cual a JSON junto a cada
   render, para que un render se pueda reconstruir. */
export const AJUSTES = {
  entorno: {
    clave_int: 26.0,     // softbox principal, calida
    clave_az: 48,        // grados. + = a la derecha de la camara
    clave_el: 26,        // grados sobre el horizonte
    clave_r: 26,         // radio angular: mas grande = mas suave. Pequeno y fuerte = vidrio;
                         // grande y flojo = ceramica. Es la diferencia, medida a ojo el 17-sep.
    contra_int: 9.0,     // contra fria: la que dibuja el canto del vidrio contra el papel
    contra_az: -138,
    contra_el: 20,
    contra_r: 26,
    relleno: 0.10,       // frontal muy bajo, solo para que la sombra no se cierre
    cielo: 0.06,         // sobre el horizonte
    suelo: 0.34,         // bajo el horizonte = el papel. Lo que se refleja en la base.

    /* ── LAS BANDERAS NEGRAS ────────────────────────────────────────────────
       🔴 ESTO ES LO QUE CONVIERTE EL PLASTICO EN VIDRIO, y sin ello no hay
       ajuste de material que lo arregle.

       Un frasco de vidrio sobre papel blanco, rodeado SOLO de claro, no tiene
       nada oscuro que reflejar: el canto se llena de luz por todos lados y el
       ojo lo lee como un solido blanco. Es exactamente lo que salio en el
       primer render del 17-sep, y es el mismo «plastico» del acta del 30-ago.

           El vidrio no se dibuja con luz: se dibuja con lo oscuro que
           tiene al lado. Sin negro alrededor, el vidrio no existe.

       En un estudio de verdad esto se resuelve con dos carteles negros a los
       lados del frasco, fuera de cuadro. Aqui son dos zonas oscuras del
       entorno, a la altura del frasco, a izquierda y derecha. No se ven en la
       foto —no estan en el cuadro— pero estan en cada reflejo. */
    bandera_int: 0.10,  // cuanto queda de la base dentro de la bandera. 1 = sin bandera.
    bandera_az: 2,       // grados: a la derecha. La otra va simetrica, a 180 de esta.
    bandera_el: 8,
    bandera_r: 32
  },
  luz: {
    clave_dir: 5.20,     // DirectionalLight: solo para la sombra proyectada
    sombra_radio: 40,
    sombra_lado: 12,
    contacto_op: 0.58,   // sombra de contacto (calcomania bajo el frasco)
    contacto_esc: 1.45,  /* 🔴 Medido el 17-sep apagandola y comparando pixeles: a
                            2,35 la calcomania de contacto pintaba el 30 % DE LA
                            IMAGEN, centrada, y se tragaba a las otras dos capas
                            —la sombra proyectada (17 %) y la caustica (1,3 %)—
                            que estaban las dos bien puestas. Parecia que la
                            caustica no funcionaba; lo que pasaba es que no se veia
                            debajo de una mancha diez veces mayor.
                            El contacto es el APOYO: corto y apretado. El tiro
                            largo lo hace la sombra proyectada. */
    cau_int: 1.15,       /* caustica calida. 🔴 Y su DESPLAZAMIENTO importa mas que
                            su intensidad: con 0,26 el charco caia justo debajo
                            del frasco, tapado por el propio frasco, y no se veia
                            por mucho que se subiera. Va donde esta la sombra
                            VISIBLE — algo mas de un radio hacia el lado contrario
                            al foco. Una luz que no se ve no alumbra. */
    cau_esc: 1.05,
    cau_desp: 1.10,      // desplazamiento contrario a la clave
    vineta: 0.14         // caida de la luz sobre el papel hacia los bordes.
                         // No es un degradado de fondo: es que la luz de estudio
                         // NO ilumina cuatro metros de papel por igual.
  },
  camara: {
    focal: 85,           // equivalente 35 mm. Largo: el frasco no se deforma.
    elevacion: 9,        // grados sobre el horizonte
    exposicion: 1.0
  },
  material: {
    etiqueta_modo: 'impresa',   // 'impresa' = tinta sobre el vidrio · 'papel' = pegatina
    control_negativo: false     // L-0052: transmission 0 y thickness 0
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   1 · PERFIL → GEOMETRIA
   ═══════════════════════════════════════════════════════════════════════════ */

/* Los puntos del JSON son puntos de CONTROL. Se pasan por un Catmull-Rom
   centripeto —no uniforme— porque el uniforme se pasa de largo en las esquinas.

   🔴 Y EL CENTRIPETO TAMBIEN SE PASA, medido: el perfil del liquido de ALBA
      tiene radio maximo 1,204 cm en sus puntos de control y la curva devolvia
      1,38 — un 15 % de mas. El liquido salia METIDO DENTRO DE LA PARED del
      frasco, y por eso no se veia: no estaba detras del vidrio, estaba dentro.

          Una curva suave entre dos puntos no se queda entre los dos puntos.
          En una esquina de 90 grados se va por fuera, y en un perfil de
          revolucion «por fuera» significa atravesar la pieza de al lado.

      Por eso cada muestra se recorta al rectangulo de los DOS puntos de control
      que la enmarcan: dentro de un tramo la curva suaviza, pero no puede salirse
      de su tramo. El filo de la base sigue matado, y el liquido se queda dentro. */
function remuestrear(pts, n) {
  const N = n || 150;
  const v3 = pts.map(p => new THREE.Vector3(p[0], p[1], 0));
  const curva = new THREE.CatmullRomCurve3(v3, false, 'centripetal', 0.5);
  const fuera = [];
  const ultimo = pts.length - 1;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curva.getPoint(t);
    const seg = Math.min(ultimo - 1, Math.floor(t * ultimo));
    const a = pts[seg], b = pts[seg + 1];
    const x = Math.min(Math.max(p.x, Math.min(a[0], b[0])), Math.max(a[0], b[0]));
    const y = Math.min(Math.max(p.y, Math.min(a[1], b[1])), Math.max(a[1], b[1]));
    fuera.push(new THREE.Vector2(Math.max(0, x), y));
  }
  return fuera;
}

/* El vidrio NO es una superficie: es un solido hueco. El perfil sube por fuera,
   cruza el borde de la boca y baja por dentro hasta el suelo de la cavidad.
   Un LatheGeometry de ese perfil es un frasco de verdad, con pared y con fondo
   grueso — y eso es lo que la refraccion necesita para tener algo que
   refractar. Una sola superficie sin pared da el «vidrio sin grosor» prohibido. */
function perfilSolido(ext, inte) {
  const fuera = ext.filter((p, i) => i === 0 || p[0] > 0.001);
  const dentro = inte.filter(p => p[0] > 0.001).slice().reverse();
  const suelo = inte[0];
  return fuera.concat(dentro, [[0, suelo[1]]]);
}

/* El liquido: el mismo perfil interior recortado al nivel y cerrado con un
   disco plano. Encogido un 0,5 % para no pelear con la pared por el mismo
   pixel. No es un cilindro: tiene la forma de dentro del frasco, y por eso la
   linea del liquido se curva donde el frasco se curva. */
function perfilLiquido(inte, nivel) {
  const dentro = inte.filter(p => p[0] > 0.001);
  const bajo = dentro.filter(p => p[1] <= nivel);
  if (!bajo.length) return null;
  let rNivel = bajo[bajo.length - 1][0];
  const sig = dentro.find(p => p[1] > nivel);
  if (sig) {
    const a = bajo[bajo.length - 1];
    const t = (nivel - a[1]) / (sig[1] - a[1]);
    rNivel = a[0] + (sig[0] - a[0]) * t;
  }
  const k = 0.995;
  const pts = [[0, inte[0][1]]]
    .concat(bajo.map(p => [p[0] * k, p[1]]))
    .concat([[rNivel * k, nivel], [0, nivel]]);
  return pts;
}

function lathe(pts, segs, n) {
  const g = new THREE.LatheGeometry(remuestrear(pts, n), segs || 96);
  g.computeVertexNormals();
  return g;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA ETIQUETA · SVG → CanvasTexture
   Tipografia de base.css. Ni una imagen de banco, ni una textura descargada.
   ═══════════════════════════════════════════════════════════════════════════ */

let FUENTES_B64 = null;

export async function cargarFuentes(rutaBase) {
  if (FUENTES_B64) return FUENTES_B64;
  const base = rutaBase || '../../assets/fuentes/';
  const leer = async (u) => {
    const r = await fetch(base + u);
    if (!r.ok) throw new Error('fuente ' + u + ' -> ' + r.status);
    const b = new Uint8Array(await r.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  };
  FUENTES_B64 = {
    display: await leer('FrankRuhlLibre-latin.woff2'),
    texto: await leer('WorkSans-latin.woff2')
  };
  return FUENTES_B64;
}

/* El SVG lleva la fuente incrustada en base64. Un <img> con un SVG dentro NO ve
   las fuentes de la pagina: si no va incrustada, el navegador cae a Times y
   nadie se entera hasta que se mira el render a tamano completo.
   Por eso ademas se COMPRUEBA: ver comprobarEtiqueta(). */
export function svgEtiqueta(def, opciones) {
  const o = opciones || {};
  const W = 1024, H = 512;
  const impresa = o.modo !== 'papel';
  const tinta = impresa ? '#2A1D17' : '#33251F';
  const nombre = def.nombre_tilde || def.nombre;
  const fondo = impresa ? '' : '<rect x="0" y="0" width="1024" height="512" fill="#FBF7F1"/>';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">',
    '<defs><style>',
    "@font-face{font-family:'Frank Ruhl Libre';src:url(data:font/woff2;base64," + FUENTES_B64.display + ") format('woff2');font-weight:500 700;}",
    "@font-face{font-family:'Work Sans';src:url(data:font/woff2;base64," + FUENTES_B64.texto + ") format('woff2');font-weight:400 700;}",
    ".n{font-family:'Frank Ruhl Libre';font-weight:500;font-size:150px;letter-spacing:26px;fill:" + tinta + ";}",
    ".t{font-family:'Work Sans';font-weight:600;font-size:36px;letter-spacing:15px;fill:" + tinta + ";fill-opacity:.74;}",
    ".v{font-family:'Work Sans';font-weight:500;font-size:33px;letter-spacing:11px;fill:" + tinta + ";fill-opacity:.62;}",
    '</style></defs>',
    fondo,
    '<text class="n" x="512" y="252" text-anchor="middle">' + nombre + '</text>',
    '<rect x="446" y="300" width="132" height="3" fill="' + tinta + '" fill-opacity=".38"/>',
    '<text class="t" x="512" y="356" text-anchor="middle">' + def.tipo.toUpperCase() + '</text>',
    '<text class="v" x="512" y="424" text-anchor="middle">' + def.volumen + '</text>',
    '</svg>'
  ].join('\n');
}

export function texturaDesdeSVG(svg) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.clearRect(0, 0, 1024, 512);
      x.drawImage(img, 0, 0, 1024, 512);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
      t._lienzo = c;
      res(t);
    };
    img.onerror = () => rej(new Error('el SVG de la etiqueta no rasterizo'));
    img.src = url;
  });
}

/* CONTROL DE LA ETIQUETA (L-0052 en pequeno).
   Una etiqueta que sale en Times es un fallo silencioso: el render se ve «bien»
   y la tipografia no es la de la marca. Se mide el ancho real de la tinta en la
   banda del nombre y se compara con lo que ocupa el mismo texto dibujado con la
   fuente cargada de verdad en la pagina. Si difieren mas de un 8 %, la fuente
   incrustada no entro. */
export function comprobarEtiqueta(tex, def) {
  const c = tex._lienzo;
  const x = c.getContext('2d', { willReadFrequently: true });
  const d = x.getImageData(0, 140, 1024, 140).data;
  let min = 1e9, max = -1, tinta = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 40) {
      const px = (i / 4) % 1024;
      if (px < min) min = px;
      if (px > max) max = px;
      tinta++;
    }
  }
  const anchoSVG = max > 0 ? max - min : 0;
  const m = document.createElement('canvas').getContext('2d');
  m.font = "500 150px 'Frank Ruhl Libre', Georgia, serif";
  try { m.letterSpacing = '26px'; } catch (e) { /* navegador viejo */ }
  const nombre = def.nombre_tilde || def.nombre;
  const anchoReal = m.measureText(nombre).width - 26;
  const desvio = anchoReal > 0 ? Math.abs(anchoSVG - anchoReal) / anchoReal : 1;
  return {
    ok: tinta > 1500 && desvio < 0.08,
    tinta: tinta,
    anchoSVG: Math.round(anchoSVG),
    anchoReal: Math.round(anchoReal),
    desvio: +(desvio * 100).toFixed(1)
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL ENTORNO · Float32 equirectangular generado aqui mismo
   ═══════════════════════════════════════════════════════════════════════════ */

function dirDeUV(u, v) {
  const y = Math.sin((v - 0.5) * Math.PI);
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = (u - 0.5) * Math.PI * 2;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

export function dirDeAngulos(azGrados, elGrados) {
  const az = azGrados * Math.PI / 180, el = elGrados * Math.PI / 180;
  const y = Math.sin(el), r = Math.cos(el);
  return [Math.cos(az) * r, y, Math.sin(az) * r];
}

/* Una VENTANA: un rectangulo angular con el borde difuminado, visto desde el
   centro de la escena. Devuelve 0..1. Es la unidad con la que se construye toda
   la luz de esta pieza — clave, contra y banderas son ventanas, no conos. */
function ventana(d, dir, ejeD, ejeU, wAz, wEl, borde) {
  const cf = d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2];
  if (cf <= 0.02) return 0;
  const dr = d[0] * ejeD[0] + d[1] * ejeD[1] + d[2] * ejeD[2];
  const du = d[0] * ejeU[0] + d[1] * ejeU[1] + d[2] * ejeU[2];
  const aAz = Math.abs(Math.atan2(dr, cf)) * 180 / Math.PI;
  const aEl = Math.abs(Math.atan2(du, cf)) * 180 / Math.PI;
  const b = borde === undefined ? 0.45 : borde;
  const fa = 1 - Math.min(1, Math.max(0, (aAz - wAz * (1 - b)) / (wAz * b)));
  const fe = 1 - Math.min(1, Math.max(0, (aEl - wEl * (1 - b)) / (wEl * b)));
  return (fa * fa * (3 - 2 * fa)) * (fe * fe * (3 - 2 * fe));
}

function ejes(dir) {
  const c = [dir[2], 0, -dir[0]];
  const n = Math.hypot(c[0], c[1], c[2]) || 1;
  const D = [c[0] / n, c[1] / n, c[2] / n];
  const U = [D[1] * dir[2] - D[2] * dir[1], D[2] * dir[0] - D[0] * dir[2], D[0] * dir[1] - D[1] * dir[0]];
  return [D, U];
}

/* ═══════════════════════════════════════════════════════════════════════════
   🔴 EL ESTUDIO ES OSCURO. ESTO ES LO QUE LO CAMBIO TODO.

   Durante seis renders el entorno fue un domo gris uniforme con dos lunares:
   una bola blanca de clave, otra de contra, dos manchas negras de bandera y
   todo lo demas gris medio. Se puede VER, esta guardado: el volcado del
   equirectangular del 17-sep. Y explica por si solo por que el vidrio salia de
   ceramica, porque un objeto reflejante rodeado de gris uniforme devuelve gris
   uniforme, se ponga lo que se ponga en el material.

       Lo tenia del reves. Un estudio de fotografia de vidrio NO es una
       habitacion clara con dos focos: es una habitacion OSCURA con dos
       ventanas y un papel encendido debajo.

   Asi que: el cielo casi negro (0,06), el papel de abajo encendido —ese si
   existe, es sobre lo que se apoya el frasco—, y dos ventanas grandes. Todo el
   dibujo del vidrio sale del contraste entre esas ventanas y el negro que
   tienen al lado. Y no incumple la regla del §1: lo que se refleja arriba es
   NADA, que es exactamente lo que hay encima de una seccion de una pagina web.

   El papel no se oscurece por esto: se calibra despues, y la calibracion sube
   la ganancia del suelo hasta clavar #F5EFE4 — que es lo que en un plato hace
   el foco de fondo, un foco que ilumina el papel y no toca al producto.
   ═══════════════════════════════════════════════════════════════════════════ */
/* El equirectangular crudo, en flotante. Se exporta A PROPOSITO: el visor de
   entorno tiene que mirar ESTOS numeros, no una copia del algoritmo pegada en
   otro archivo. La primera version del visor llevaba el algoritmo copiado y
   dejo de decir la verdad en cuanto se toco el original — un medidor con su
   propia version de lo que mide no mide nada. */
export function equirectCrudo(cfg) {
  const e = cfg.entorno;
  const W = 512, H = 256;
  const datos = new Float32Array(W * H * 4);

  const clave = dirDeAngulos(e.clave_az, e.clave_el);
  const contra = dirDeAngulos(e.contra_az, e.contra_el);
  const [kD, kU] = ejes(clave);
  const [cD, cU] = ejes(contra);

  const CAL = [1.00, 0.955, 0.895];   // blanco calido de la clave
  const FRI = [0.86, 0.925, 1.00];    // contra fria
  const PAP = [0.961, 0.937, 0.894];  // #F5EFE4 normalizado

  for (let j = 0; j < H; j++) {
    const v = (j + 0.5) / H;
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      const d = dirDeUV(u, v);
      const arriba = d[1] > 0;
      const t = Math.min(1, Math.abs(d[1]) / 0.35);

      let r, g, b;
      if (arriba) {
        /* El techo del plato: oscuro. Lo unico claro de ahi arriba son las
           ventanas, que se suman despues. */
        const k = e.cielo * (0.55 + 0.45 * t);
        r = PAP[0] * k * 1.03; g = PAP[1] * k * 1.02; b = PAP[2] * k;
      } else {
        /* El papel. Este SI esta, y es lo que se ve reflejado en la base. */
        const k = e.suelo * (1.0 - 0.22 * t);
        r = PAP[0] * k; g = PAP[1] * k; b = PAP[2] * k;
      }

      const fr = Math.max(0, d[2] * 0.5 + 0.5);
      r += e.relleno * 0.30 * fr; g += e.relleno * 0.29 * fr; b += e.relleno * 0.27 * fr;

      /* Banderas: a los lados y a la altura del frasco, apagando el ambiente.
         Con el cielo ya oscuro pesan menos que antes, pero siguen cerrando el
         costado por donde no entra ninguna ventana. */
      let sb = 1;
      for (const sg of [1, -1]) {
        const bd = dirDeAngulos(e.bandera_az + (sg < 0 ? 180 : 0), e.bandera_el);
        const [bD, bU] = ejes(bd);
        const sm = ventana(d, bd, bD, bU, e.bandera_r, e.bandera_r * 1.6, 0.7);
        sb = Math.min(sb, 1 - sm * (1 - e.bandera_int));
      }
      r *= sb; g *= sb; b *= sb;

      /* La ventana principal: alta y estrecha, de pie al lado del producto. Su
         reflejo es la raya vertical que recorre el frasco — la firma del vidrio
         fotografiado. Un circulo en su lugar deja un lunar. */
      const sk = ventana(d, clave, kD, kU, e.clave_r * 0.52, e.clave_r * 1.55, 0.40);
      r += CAL[0] * e.clave_int * sk; g += CAL[1] * e.clave_int * sk; b += CAL[2] * e.clave_int * sk;

      /* La contra, tambien ventana: mas estrecha todavia, detras y al otro lado.
         Es la que separa el canto del frasco del papel. */
      const sc = ventana(d, contra, cD, cU, e.contra_r * 0.34, e.contra_r * 2.0, 0.45);
      r += FRI[0] * e.contra_int * sc; g += FRI[1] * e.contra_int * sc; b += FRI[2] * e.contra_int * sc;

      const o = (j * W + i) * 4;
      datos[o] = r; datos[o + 1] = g; datos[o + 2] = b; datos[o + 3] = 1;
    }
  }

  return { W: W, H: H, datos: datos };
}

export function construirEntorno(renderer, cfg) {
  const { W, H, datos } = equirectCrudo(cfg);
  const tex = new THREE.DataTexture(datos, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const objetivo = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return objetivo.texture;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CALCOMANIAS · sombra de contacto y caustica
   Las dos son texturas de codigo. Ninguna imagen entra en esta pieza.
   ═══════════════════════════════════════════════════════════════════════════ */

function texturaRadial(pintar) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  pintar(x, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* La sombra de contacto es una GOTA, no un circulo. Un circulo centrado bajo el
   frasco dice «hay algo encima» pero no dice de donde viene la luz, y el ojo lo
   lee como una pegatina. Lo que hay en cualquier foto de producto es una mancha
   apretada y oscura justo donde el vidrio toca el papel, que se estira y se
   abre hacia el lado contrario al foco. El estiron es la mitad de la
   informacion. */
export function texturaSombra() {
  return texturaRadial((x, S) => {
    x.clearRect(0, 0, S, S);
    /* El cuerpo estirado: el centro de masa desplazado hacia la cola. */
    const g = x.createRadialGradient(S * 0.5, S * 0.40, 0, S * 0.5, S * 0.40, S * 0.52);
    g.addColorStop(0.00, 'rgba(0,0,0,0.92)');
    g.addColorStop(0.34, 'rgba(0,0,0,0.60)');
    g.addColorStop(0.62, 'rgba(0,0,0,0.22)');
    g.addColorStop(0.85, 'rgba(0,0,0,0.05)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    /* La cabeza: el apoyo. Corta y muy oscura, o el frasco flota igual. */
    const h = x.createRadialGradient(S * 0.5, S * 0.68, 0, S * 0.5, S * 0.68, S * 0.26);
    h.addColorStop(0.00, 'rgba(0,0,0,1)');
    h.addColorStop(0.45, 'rgba(0,0,0,0.70)');
    h.addColorStop(1.00, 'rgba(0,0,0,0)');
    x.fillStyle = h;
    x.fillRect(0, 0, S, S);
  });
}

/* La caustica: un nucleo caliente CON UN ANILLO alrededor, que es lo que hace de
   verdad un fondo grueso de vidrio con una luz a 45 grados. Falsa, dicha y
   firmada — pero con la forma correcta. Un degradado radial pelado se lee como
   una mancha; el anillo es lo que lo hace leer como vidrio. */
export function texturaCaustica() {
  return texturaRadial((x, S) => {
    x.clearRect(0, 0, S, S);
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0.00, 'rgba(255,236,206,0.95)');
    g.addColorStop(0.16, 'rgba(255,226,186,0.62)');
    g.addColorStop(0.34, 'rgba(255,214,166,0.20)');
    g.addColorStop(0.46, 'rgba(255,222,180,0.46)');
    g.addColorStop(0.60, 'rgba(255,214,168,0.16)');
    g.addColorStop(0.82, 'rgba(255,216,172,0.04)');
    g.addColorStop(1.00, 'rgba(255,216,172,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL FRASCO
   ═══════════════════════════════════════════════════════════════════════════ */

function matVidrio(base, cfg) {
  const neg = cfg.material.control_negativo;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(base.color),
    /* 🔴 CONTROL NEGATIVO (L-0052): con esto en 0 el frasco tiene que verse
       CLARAMENTE peor. Si el jurado no distingue este render del bueno, la
       transmision no esta haciendo nada y el vidrio es una ilusion del que lo
       escribio. */
    transmission: neg ? 0 : base.transmission,
    thickness: neg ? 0 : base.thickness,
    ior: base.ior,
    roughness: base.roughness,
    metalness: 0,
    attenuationColor: new THREE.Color(base.attenuationColor),
    attenuationDistance: base.attenuationDistance,
    envMapIntensity: base.envMapIntensity,
    /* 🔴 BARNIZ (clearcoat) SOBRE EL VIDRIO. No es un truco: es la unica forma
       de que la ventana del §3 se VEA reflejada. Con transmission 1 casi toda
       la luz atraviesa y el unico especular que queda es el de Fresnel, que a
       45 grados es del 4 % — invisible. El barniz anade una capa especular
       propia, y ahi es donde aparece la raya vertical de la ventana: la firma
       de un frasco fotografiado. Rugosidad casi cero para que la raya tenga
       CANTO; un barniz rugoso devuelve otra vez la mancha. */
    clearcoat: neg ? 0 : 1.0,
    clearcoatRoughness: 0.025,
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide,
    depthWrite: true
  });
}

/* 🔴 EL LIQUIDO NO PUEDE SER TRANSMISIVO, Y ESTO COSTO UN RENDER ENTERO.
   En three.js un material con `transmission` se dibuja en una pasada aparte
   contra un objetivo que NO CONTIENE los demas objetos transmisivos. Vidrio y
   liquido, los dos transmisivos, no se ven el uno al otro: el vidrio refracta un
   fondo del que el liquido ha sido excluido, y el liquido queda tapado por el
   vidrio. Resultado: tres frascos blancos y opacos, sin una gota dentro.

       Dos cristales anidados no se ven entre si. El de dentro tiene que ser
       opaco para existir para el de fuera.

   Asi que el liquido es materia SOLIDA con el color del producto. Entra en el
   fondo que el vidrio refracta, y de ahi sale la unica cosa que hace que un
   frasco parezca lleno: que el liquido se deforme al mirarlo a traves del
   vidrio y de la base gruesa. */
function matLiquido(liq, vidrio, cfg) {
  const neg = cfg.material.control_negativo;
  const c = new THREE.Color(liq.attenuationColor);
  if (liq.mezcla_papel) c.lerp(new THREE.Color(PAPEL), liq.mezcla_papel);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    transmission: 0,
    thickness: 0,
    ior: liq.ior,
    roughness: liq.roughness,
    metalness: 0,
    clearcoat: neg ? 0 : 0.55,
    clearcoatRoughness: 0.08,
    envMapIntensity: (vidrio.envMapIntensity || 1) * 0.55,
    side: THREE.DoubleSide
  });
}

function matTapon(t) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(t.color),
    roughness: t.roughness,
    metalness: t.metalness,
    clearcoat: 0.0,
    envMapIntensity: 0.9
  });
}

function matAnillo(a) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(a.color),
    roughness: a.roughness,
    metalness: a.metalness,
    envMapIntensity: 1.0
  });
}

/* Tapon torneado: un cilindro con el canto matado. Un cilindro pelado se ve de
   plantilla; el filo redondeado de menos de un milimetro es la diferencia. */
function perfilTapon(r, h, y0) {
  const f = Math.min(0.09, r * 0.12);
  return [
    [0, y0], [r - f, y0], [r, y0 + f],
    [r, y0 + h - f], [r - f, y0 + h],
    [r * 0.55, y0 + h], [0, y0 + h]
  ];
}

export function construirFrasco(def, comun, cfg, etiquetaTex) {
  const g = new THREE.Group();
  g.name = def.id;

  const vidrioMat = matVidrio(comun.vidrio, cfg);
  const cuerpo = new THREE.Mesh(lathe(perfilSolido(def.exterior, def.interior)), vidrioMat);
  cuerpo.name = 'vidrio';
  cuerpo.renderOrder = 2;
  /* 🔴 EL VIDRIO PROYECTA SOMBRA, Y ESO NO ES UN ERROR DE FISICA.
     three.js dibuja el vidrio en el mapa de sombras como si fuera opaco, asi que
     la primera reaccion es apagarselo. Apagado, el frasco FLOTA: era el fallo
     numero uno de los tres primeros renders del 17-sep y es el mismo que la
     vitrina vieja tenia el 30-ago.

     La verdad fotografica esta en medio: un frasco de vidrio SI deja una sombra
     larga y oscura —mirar cualquier foto de producto— y ademas deja un nucleo
     CLARO dentro de esa sombra, que es la luz que ha atravesado el vidrio. Los
     dos a la vez.

         Un objeto transparente no deja de tapar la luz: la reparte.
         Sombra oscura por los bordes, caustica encendida en el centro.

     Asi que se proyecta la sombra Y se le pone la caustica dentro, en la misma
     direccion. Una sin la otra miente en un sentido o en el contrario. */
  cuerpo.castShadow = true;
  g.add(cuerpo);

  const pl = perfilLiquido(def.interior, def.nivel_liquido);
  if (pl) {
    const liq = new THREE.Mesh(lathe(pl), matLiquido(def.liquido, comun.vidrio, cfg));
    liq.name = 'liquido';
    liq.castShadow = true;
    liq.renderOrder = 1;
    g.add(liq);
  }

  /* Etiqueta: por defecto TINTA SOBRE EL VIDRIO, no pegatina. Una pegatina de
     papel tapa el vidrio justo donde el vidrio es interesante. */
  if (etiquetaTex) {
    const et = def.etiqueta;
    const rBase = Math.max.apply(null, def.exterior.map(p => p[0]));
    const arco = et.arco * Math.PI * 2;
    /* thetaStart va en -arco/2, no en PI/2 - arco/2: en CylinderGeometry el
       angulo cero mira a +Z, que es la camara. Con el desfase de 90 grados la
       etiqueta se iba al costado derecho y salia cortada por el canto. */
    const geo = new THREE.CylinderGeometry(
      rBase + et.radio_extra, rBase + et.radio_extra, et.alto, 96, 1, true,
      -arco / 2, arco
    );
    const impresa = cfg.material.etiqueta_modo !== 'papel';
    const mat = new THREE.MeshPhysicalMaterial({
      map: etiquetaTex,
      transparent: true,
      roughness: impresa ? 0.38 : 0.86,
      metalness: 0,
      side: THREE.DoubleSide,
      envMapIntensity: impresa ? 0.5 : 0.35,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = et.centro_y;
    m.name = 'etiqueta';
    m.renderOrder = 3;
    g.add(m);
  }

  /* ── El tapon. Es lo que ancla el frasco: mate, oscuro, sin brillo. ── */
  const tg = def.tapon_geo;
  const tapon = new THREE.Mesh(
    lathe(perfilTapon(tg.radio, tg.alto, tg.base_y), 96, 90),
    matTapon(comun.tapon)
  );
  tapon.castShadow = true;
  tapon.name = 'tapon';
  g.add(tapon);

  /* El unico metal de la pieza, y el unico acento: el anillo. */
  if (tg.anillo_alto > 0) {
    const ar = new THREE.Mesh(
      new THREE.CylinderGeometry(tg.radio * 1.012, tg.radio * 1.012, tg.anillo_alto, 96, 1, true),
      matAnillo(comun.tapon.anillo)
    );
    ar.position.y = tg.base_y + tg.anillo_alto / 2;
    ar.name = 'anillo';
    g.add(ar);
  }

  if (def.pipeta) {
    const p = def.pipeta;
    const alto = tg.base_y - p.hasta_y;
    const vidrioPipeta = Object.assign({}, comun.vidrio, { thickness: 0.5, attenuationDistance: 30 });
    const pip = new THREE.Mesh(
      new THREE.CylinderGeometry(p.radio * 0.72, p.radio, alto, 48, 1, false),
      matVidrio(vidrioPipeta, cfg)
    );
    pip.position.y = p.hasta_y + alto / 2;
    pip.name = 'pipeta';
    pip.renderOrder = 1;
    g.add(pip);
  }

  if (def.actuador) {
    const a = def.actuador;
    const act = new THREE.Mesh(
      lathe(perfilTapon(a.radio, a.alto, a.base_y), 96, 90),
      matTapon(comun.tapon)
    );
    act.castShadow = true;
    act.name = 'actuador';
    g.add(act);
  }

  const altoVidrio = Math.max.apply(null, def.exterior.map(p => p[1]));
  const cima = def.actuador
    ? def.actuador.base_y + def.actuador.alto
    : tg.base_y + tg.alto;
  g.userData.altura = Math.max(altoVidrio, cima);
  g.userData.radio = Math.max.apply(null, def.exterior.map(p => p[0]));
  g.userData.def = def;
  return g;
}

/* Sombra de contacto + caustica, la pareja. Van juntas porque separadas
   mienten: una sombra sin caustica es un objeto opaco, y una caustica sin
   sombra es un objeto que flota. */
export function calcomanias(frasco, cfg, texSombra, texCau) {
  const r = frasco.userData.radio;
  const grupo = new THREE.Group();

  const cl = dirDeAngulos(cfg.entorno.clave_az, cfg.entorno.clave_el);
  /* La sombra se alarga cuanto mas baja esta la luz: es la tangente del angulo,
     no un numero a ojo. Con la clave a 30 grados sale 1,7 veces el radio. */
  const largo = Math.min(3.4, 1 / Math.max(0.28, Math.tan(cfg.entorno.clave_el * Math.PI / 180)));
  const s = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2 * cfg.luz.contacto_esc, r * 2 * cfg.luz.contacto_esc * largo * 0.62),
    new THREE.MeshBasicMaterial({
      map: texSombra, transparent: true, color: 0x1a1410,
      opacity: cfg.luz.contacto_op, depthWrite: false, toneMapped: false
    })
  );
  s.rotation.x = -Math.PI / 2;
  /* Girada para que la cola apunte al lado contrario del foco. */
  /* atan2(cl[0], cl[2]), no atan2(-cl[0], -cl[2]): con los signos cambiados la
     cola de la sombra apuntaba HACIA el foco. Se ve en el render del 17-sep —
     la mancha salia por el lado iluminado— y es el tipo de fallo que nadie
     mira dos veces porque «hay una sombra». La haber: mal puesta.
     El plano se tumba con rotation.x = -90, y eso manda su +Y local a -Z del
     mundo; girando phi antes, la cola acaba en (-sin phi, 0, -cos phi). Para
     que eso valga -direccion_de_la_luz hace falta phi = atan2(lx, lz). */
  s.rotation.z = Math.atan2(cl[0], cl[2]);
  s.position.y = 0.004;
  s.renderOrder = -2;
  grupo.add(s);

  const clave = cl;
  const c = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2 * cfg.luz.cau_esc, r * 2 * cfg.luz.cau_esc * 0.78),
    new THREE.MeshBasicMaterial({
      map: texCau, transparent: true, opacity: cfg.luz.cau_int,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    })
  );
  c.rotation.x = -Math.PI / 2;
  c.position.set(-clave[0] * r * cfg.luz.cau_desp, 0.006, -clave[2] * r * cfg.luz.cau_desp);
  c.renderOrder = -1;
  grupo.add(c);

  grupo.userData.sombra = s;
  grupo.userData.caustica = c;
  return grupo;
}
