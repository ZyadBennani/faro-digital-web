/* ═══════════════════════════════════════════════════════════════════════════
   preparar.mjs · de los .glb de Sketchfab a los tres frascos de Aura

   Entra:  _crudo/*.glb            (originales, fuera de git, ver .gitignore)
   Sale:   modelos/<id>.glb        (lo unico que se publica)
           modelos/informe.json    (numeros de cada paso, para la tabla)

   Lo que hace, en orden, y por que cada cosa:

   1  HORNEAR LAS TRANSFORMACIONES. Los .glb de Sketchfab traen la rotacion
      Z-up -> Y-up en el nodo. Medir radios en espacio de MALLA da perfiles
      simetricos de 13 cm de ancho por 3 de alto: se esta rebanando el frasco
      de canto. Todo lo que sigue se hace en espacio de escena.

   2  PAPELES POR NOMBRE DE MATERIAL, leidos en la hoja de contacto con las
      piezas pintadas. No se adivina cual malla es el vidrio.

   3  EL PERFIL DEL CUERPO, medido: radio exterior e interior por rodaja.

   4  EL LIQUIDO, que ningun modelo trae. Se torna del perfil interior, y su
      radio es min(exterior*(1-pared), interior*0,985): coge la pared real
      cuando existe y el retranqueo cuando el cuerpo es de pared unica.
      L-0069: una superficie generada NO puede salirse de la pieza de al lado.

   5  LA ESCALA SALE DEL VOLUMEN. Se integra el interior, se multiplica por el
      nivel de llenado y se resuelve k para los ml declarados. La altura es
      una consecuencia, no un gusto.

   6  SIMPLIFICAR, SOLDAR, COMPRIMIR — y medir las tres cosas.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import {
  clearNodeTransform, flatten, dequantize, weld, simplify,
  prune, dedup, transformMesh, quantize
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import fs from 'fs';
import { gzipSync } from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CRUDO = path.join(AQUI, '_crudo');
const SALIDA = path.join(AQUI, 'modelos');
const CFG = JSON.parse(fs.readFileSync(path.join(AQUI, 'familia.json'), 'utf8'));

const RODAJAS = 220;          // resolucion a la que se MIDE el perfil
/* El perfil se mide fino y se TORNEA grueso, y son dos numeros distintos a
   proposito. Con 220 anillos el liquido salia con 24.000 triangulos —mas que
   el frasco entero— y el simplificador gastaba en la superficie escondida el
   presupuesto que necesitaba el hombro del vidrio. La medida fina sigue
   haciendo falta: es la que garantiza que el radio nunca se pasa de la pared. */
const ANILLOS_LIQ = 44;       // anillos del torno del liquido
const SEGMENTOS_LIQ = 56;     // lados
const MARGEN_INT = 0.985;     // el liquido nunca toca la pared interior

await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule()
  });

/* ── utilidades ────────────────────────────────────────────────────────────── */

function matrizTS(t, s) {           // escala uniforme + traslacion, columna mayor
  return [s,0,0,0,  0,s,0,0,  0,0,s,0,  t[0],t[1],t[2],1];
}

function primsDe(doc) {
  const fuera = [];
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      fuera.push({ mesh, prim, mat: prim.getMaterial() });
  return fuera;
}

function leerPos(prim) {
  const a = prim.getAttribute('POSITION');
  const n = a.getCount();
  const P = new Float32Array(n * 3);
  const v = [0, 0, 0];
  for (let i = 0; i < n; i++) { a.getElement(i, v); P[i*3]=v[0]; P[i*3+1]=v[1]; P[i*3+2]=v[2]; }
  return P;
}

function triangulos(prim) {
  const idx = prim.getIndices();
  return idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
}

/* ── 3 · el perfil del cuerpo, medido ─────────────────────────────────────── */
function perfilCuerpo(P, cx, cz, y0, y1) {
  const ext = new Float32Array(RODAJAS).fill(0);
  const int = new Float32Array(RODAJAS).fill(Infinity);
  const cuenta = new Int32Array(RODAJAS);
  const alto = y1 - y0;
  for (let i = 0; i < P.length; i += 3) {
    const s = Math.min(RODAJAS - 1, Math.max(0, Math.floor((P[i+1] - y0) / alto * RODAJAS)));
    const r = Math.hypot(P[i] - cx, P[i+2] - cz);
    if (r > ext[s]) ext[s] = r;
    if (r < int[s]) int[s] = r;
    cuenta[s]++;
  }
  // rodajas vacias: se interpolan de las vecinas, o el torno sale con dientes
  for (let s = 0; s < RODAJAS; s++) {
    if (cuenta[s]) continue;
    let a = s - 1; while (a >= 0 && !cuenta[a]) a--;
    let b = s + 1; while (b < RODAJAS && !cuenta[b]) b++;
    if (a < 0 && b >= RODAJAS) { ext[s] = 0; int[s] = 0; continue; }
    if (a < 0) { ext[s] = ext[b]; int[s] = int[b]; continue; }
    if (b >= RODAJAS) { ext[s] = ext[a]; int[s] = int[a]; continue; }
    const t = (s - a) / (b - a);
    ext[s] = ext[a] + (ext[b] - ext[a]) * t;
    int[s] = int[a] + (int[b] - int[a]) * t;
  }
  return { ext, int };
}

/* ── 4 · el liquido, torneado del perfil interior ─────────────────────────── */
function construirLiquido(doc, perfil, cx, cz, y0, y1, nivel, pared, material) {
  const alto = y1 - y0;
  /* ═══════════════════════════════════════════════════════════════════════
     🔴 EL LIQUIDO SE CONSTRUYE HASTA EL BORDE, NO HASTA EL NIVEL.

     En la sesion 2 la malla llegaba justo al nivel de llenado, y por eso el
     liquido GIRABA CON EL FRASCO — que es el defecto que Zyad nombro: «el
     liquido se va moviendo cuando mueves el frasco, esto no es realista».

     Ahora la superficie no es geometria: es un PLANO DE MUNDO que el vertex
     shader aplasta contra si mismo en ejecucion (ver `nivelarLiquido` en
     vitrina.js). Para que ese plano tenga siempre malla que aplastar por
     encima —a cualquier inclinacion y por los dos lados del frasco— el
     liquido tiene que llegar arriba del todo.

         Una superficie que se inclina con el frasco no es liquido: es
         un solido pintado del color del liquido.

     El VOLUMEN se sigue midiendo hasta `nivel`, que es lo que fija la escala
     del frasco: lo que cambia es hasta donde hay malla, no cuanto producto hay.
     ═══════════════════════════════════════════════════════════════════════ */
  const HASTA_BORDE = 0.985;
  const hasta = Math.floor(RODAJAS * HASTA_BORDE);
  const hastaNivel = Math.floor(RODAJAS * nivel);
  /* radio del liquido en cada rodaja. min(): coge la pared real donde la hay
     (serum, crema) y el retranqueo donde el cuerpo es de pared unica (bruma). */
  const rad = [];
  for (let s = 0; s <= hasta; s++) {
    const i = Math.min(RODAJAS - 1, s);
    const rInt = isFinite(perfil.int[i]) ? perfil.int[i] * MARGEN_INT : Infinity;
    const rExt = perfil.ext[i] * (1 - pared);
    rad.push(Math.max(0, Math.min(rExt, rInt)));
  }
  /* suavizado corto: el perfil medido tiene ruido de un vertice suelto, y un
     torno sobre ruido se ve como una vela derretida. Tres pasadas de media
     movil de 5, que no mueve la silueta pero le quita el temblor. */
  for (let p = 0; p < 3; p++) {
    const c = rad.slice();
    for (let s = 2; s < rad.length - 2; s++)
      rad[s] = (c[s-2] + c[s-1] + c[s] + c[s+1] + c[s+2]) / 5;
  }
  // la superficie del liquido: plana, al nivel
  const yDe = s => y0 + alto * (s / RODAJAS);

  const pos = [], nor = [], idx = [];
  const S = SEGMENTOS_LIQ;
  /* Remuestreo a ANILLOS_LIQ, tomando el MINIMO del tramo que cada anillo
     resume. Tomar la media dejaria que un anillo se comiera un estrechamiento
     y el liquido asomaria por la pared justo donde el frasco se cierra —
     que es el fallo de L-0069 otra vez, ahora por remuestreo en vez de por
     spline. Del lado de dentro siempre. */
  const anillo = [];
  for (let a = 0; a <= ANILLOS_LIQ; a++) {
    const s0 = Math.floor(a / ANILLOS_LIQ * (rad.length - 1));
    const s1 = Math.floor(Math.min(ANILLOS_LIQ, a + 1) / ANILLOS_LIQ * (rad.length - 1));
    let r = rad[s0];
    for (let s = s0; s <= Math.max(s0, s1 - (a < ANILLOS_LIQ ? 1 : 0)); s++) r = Math.min(r, rad[s]);
    anillo.push({ r: r, y: yDe(s0) });
  }
  anillo.push({ r: anillo[anillo.length - 1].r, y: yDe(hasta) });   // borde de la superficie

  for (let a = 0; a < anillo.length; a++) {
    for (let j = 0; j <= S; j++) {
      const th = j / S * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      pos.push(cx + anillo[a].r * c, anillo[a].y, cz + anillo[a].r * sn);
      // normal: perpendicular al perfil, hacia fuera
      const ant = anillo[Math.max(0, a - 1)], sig = anillo[Math.min(anillo.length - 1, a + 1)];
      const dr = sig.r - ant.r, dy = sig.y - ant.y;
      const L = Math.hypot(dr, dy) || 1;
      nor.push(dy / L * c, -dr / L, dy / L * sn);
    }
  }
  for (let a = 0; a < anillo.length - 1; a++) {
    for (let j = 0; j < S; j++) {
      const p0 = a * (S + 1) + j, p1 = p0 + 1, p2 = p0 + S + 1, p3 = p2 + 1;
      idx.push(p0, p2, p1,  p1, p2, p3);
    }
  }
  // tapa superior (la superficie del liquido) y fondo
  const tapa = pos.length / 3;
  pos.push(cx, yDe(hasta), cz); nor.push(0, 1, 0);
  const base0 = (anillo.length - 1) * (S + 1);
  for (let j = 0; j < S; j++) idx.push(tapa, base0 + j, base0 + j + 1);
  const fondo = pos.length / 3;
  pos.push(cx, yDe(0), cz); nor.push(0, -1, 0);
  for (let j = 0; j < S; j++) idx.push(fondo, j + 1, j);

  const buf = doc.getRoot().listBuffers()[0];
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buf))
    .setAttribute('NORMAL',   doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buf))
    .setMaterial(material);
  const mesh = doc.createMesh('liquido').addPrimitive(prim);
  doc.getRoot().listScenes()[0].addChild(doc.createNode('liquido').setMesh(mesh));

  /* Volumen interior HASTA EL NIVEL —no hasta donde llega la malla—, por
     discos. Es lo que fija la escala del frasco: cuanto producto hay dentro,
     no cuanta geometria se ha construido. */
  let vol = 0;
  for (let s = 0; s < Math.min(hastaNivel, rad.length - 1); s++) {
    const h = yDe(s + 1) - yDe(s);
    vol += Math.PI * ((rad[s] + rad[s+1]) / 2) ** 2 * h;
  }
  /* La altura local del plano de nivelado, en unidades del modelo ANTES de
     escalar. `prepararFrasco` la multiplica por k y la deja en el informe:
     el runtime la necesita para colocar el plano y no puede adivinarla. */
  const yNivel = yDe(hastaNivel);
  return { mesh, volumen: vol, triangulos: idx.length / 3, yNivel: yNivel, yTope: yDe(hasta) };
}

/* ── el paso completo de un frasco ────────────────────────────────────────── */
async function prepararFrasco(def) {
  const paso = { id: def.id, archivo: def.archivo };
  const doc = await io.read(path.join(CRUDO, def.archivo));
  paso.kb_origen = Math.round(fs.statSync(path.join(CRUDO, def.archivo)).size / 1024);

  // 1 · hornear
  await doc.transform(dequantize(), flatten());
  for (const n of doc.getRoot().listNodes()) clearNodeTransform(n);

  // 2 · papeles
  const lista = primsDe(doc);
  paso.tri_origen = Math.round(lista.reduce((a, x) => a + triangulos(x.prim), 0));
  const porPapel = {};
  for (const x of lista) {
    const nm = x.mat ? x.mat.getName() : '(sin material)';
    const papel = def.piezas[nm];
    if (!papel) throw new Error(def.id + ': la malla con material "' + nm
      + '" no tiene papel en familia.json. Papeles declarados: ' + Object.keys(def.piezas).join(', '));
    x.papel = papel;
    (porPapel[papel] = porPapel[papel] || []).push(x);
  }
  if (!porPapel.vidrio) throw new Error(def.id + ': ningun material mapeado a "vidrio"');

  // 3 · el perfil del cuerpo
  const cuerpo = porPapel.vidrio[0];
  const P = leerPos(cuerpo.prim);
  let cx = 0, cz = 0, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < P.length; i += 3) {
    cx += P[i]; cz += P[i+2];
    y0 = Math.min(y0, P[i+1]); y1 = Math.max(y1, P[i+1]);
  }
  cx /= P.length / 3; cz /= P.length / 3;
  const perfil = perfilCuerpo(P, cx, cz, y0, y1);
  paso.cuerpo = {
    alto_modelo: +(y1 - y0).toFixed(5),
    r_ext_max: +Math.max(...perfil.ext).toFixed(5),
    r_int_medio: +(perfil.int.slice(40, 180).reduce((a, b) => a + b, 0) / 140).toFixed(5)
  };
  paso.cuerpo.pared_medida_pct = +(100 * (1 - paso.cuerpo.r_int_medio / paso.cuerpo.r_ext_max)).toFixed(2);

  // 4 · el liquido
  const matLiq = doc.createMaterial('liquido');
  const liq = construirLiquido(doc, perfil, cx, cz, y0, y1,
                               def.nivel_liquido, def.pared_min, matLiq);
  paso.liquido_tri = liq.triangulos;

  // 5 · la escala sale del volumen (1 cm^3 = 1 ml)
  const k = Math.cbrt(def.volumen_ml / liq.volumen);
  paso.escala = +k.toFixed(4);
  paso.volumen_modelo = +liq.volumen.toFixed(7);

  // caja completa de la escena, para apoyar la base en y=0 y centrar en XZ
  let gy0 = Infinity;
  for (const x of primsDe(doc)) {
    const Q = leerPos(x.prim);
    for (let i = 1; i < Q.length; i += 3) gy0 = Math.min(gy0, Q[i]);
  }
  const M = matrizTS([-cx * k, -gy0 * k, -cz * k], k);
  for (const mesh of doc.getRoot().listMeshes()) transformMesh(mesh, M);

  // medir la altura final, ya en cm
  let fy0 = Infinity, fy1 = -Infinity, fr = 0;
  for (const x of primsDe(doc)) {
    const Q = leerPos(x.prim);
    for (let i = 0; i < Q.length; i += 3) {
      fy0 = Math.min(fy0, Q[i+1]); fy1 = Math.max(fy1, Q[i+1]);
      fr = Math.max(fr, Math.hypot(Q[i], Q[i+2]));
    }
  }
  paso.alto_cm = +fy1.toFixed(3);
  paso.radio_cm = +fr.toFixed(3);
  paso.base_en_cero = +fy0.toFixed(5);

  /* el vidrio, en cm: lo que necesita el material para la atenuacion */
  paso.vidrio_alto_cm = +((y1 - y0) * k).toFixed(3);

  /* 🔴 LA ALTURA DEL PLANO DE NIVELADO, YA EN CM, VIAJA CON EL MODELO.
     El runtime aplasta el liquido contra un plano de mundo y necesita saber a
     que altura local esta el nivel de llenado. Calcularlo otra vez en el
     navegador seria tener DOS versiones del mismo numero, y en cuanto una de
     las dos cambie dejarian de coincidir sin que nadie se entere — que es
     exactamente como se estropean estas cosas. Se mide una vez, aqui, y se
     mete en el .glb. */
  paso.nivel_y_cm = +((liq.yNivel - gy0) * k).toFixed(4);
  paso.tope_liquido_y_cm = +((liq.yTope - gy0) * k).toFixed(4);

  // 2-bis · el nombre del material ES el papel: asi lo encuentra el runtime
  for (const x of lista) if (x.mat) x.mat.setName(x.papel);
  matLiq.setName('liquido');
  for (const x of lista) x.mesh.setName(x.papel);

  // 6 · soldar y simplificar
  await doc.transform(weld({ tolerance: 0.00005 }));
  paso.tri_soldado = Math.round(primsDe(doc).reduce((a, x) => a + triangulos(x.prim), 0));
  const ratio = Math.min(1, def.tri_objetivo / paso.tri_soldado);
  if (ratio < 0.999) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0015, lockBorder: true }));
  }
  await doc.transform(dedup(), prune());
  paso.tri_final = Math.round(primsDe(doc).reduce((a, x) => a + triangulos(x.prim), 0));

  doc.getRoot().getAsset().generator = 'Aura vitrina · preparar.mjs';
  doc.getRoot().getAsset().extras = {
    aura: def.id, producto: def.nombre,
    origen: def.archivo, credito: def.credito,
    licencia: 'CC BY 4.0 · ver Aura-3D/LICENCIAS.md',
    nivel_y_cm: paso.nivel_y_cm,
    tope_liquido_y_cm: paso.tope_liquido_y_cm,
    alto_cm: paso.alto_cm, radio_cm: paso.radio_cm
  };

  // 7 · dos compresiones, y se mide cual gana DE VERDAD
  fs.mkdirSync(SALIDA, { recursive: true });

  const docQ = await io.readBinary(await io.writeBinary(doc));
  await docQ.transform(quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }));
  const binQ = await io.writeBinary(docQ);

  const docD = await io.readBinary(await io.writeBinary(doc));
  docD.createExtension(KHRDracoMeshCompression)
      .setRequired(true)
      .setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
                           quantizationBits: { POSITION: 14, NORMAL: 10 } });
  const binD = await io.writeBinary(docD);

  /* 🔴 Y SE COMPARAN EN GZIP, que es lo que viaja. En disco Draco gana de
     calle (46 KB contra 200), pero los datos de Draco YA estan comprimidos y
     no se encogen mas, mientras que un GLB cuantizado es casi todo enteros
     con patron y el servidor se lo come. Comparar en disco decide por el
     numero equivocado. */
  paso.kb_quantize = +(binQ.byteLength / 1024).toFixed(1);
  paso.kb_draco = +(binD.byteLength / 1024).toFixed(1);
  paso.kb_quantize_gz = +(gzipSync(Buffer.from(binQ), { level: 9 }).length / 1024).toFixed(1);
  paso.kb_draco_gz = +(gzipSync(Buffer.from(binD), { level: 9 }).length / 1024).toFixed(1);

  /* Lo que se publica es el Draco, medido y elegido abajo. Y al lado, en una
     carpeta que no entra en git, el mismo modelo SIN COMPRIMIR: es el control
     negativo de la puerta de peso (L-0052). Una puerta que solo se prueba con
     el archivo que pasa no ha sido probada. */
  const crudo = path.join(SALIDA, '_control');
  fs.mkdirSync(crudo, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, def.id + '.glb'), binD);
  fs.writeFileSync(path.join(crudo, def.id + '-sin-comprimir.glb'), await io.writeBinary(doc));
  paso.kb_sin_comprimir = Math.round((await io.writeBinary(doc)).byteLength / 1024);
  return paso;
}

/* ── main ─────────────────────────────────────────────────────────────────── */
const informe = { fecha: new Date().toISOString().slice(0, 10), frascos: [] };
for (const def of CFG.frascos) {
  const p = await prepararFrasco(def);
  informe.frascos.push(p);
  console.log('\n=== ' + p.id + ' (' + def.nombre + ', ' + def.volumen_ml + ' ml) ===');
  console.log('  origen            ' + p.kb_origen + ' KB · ' + p.tri_origen + ' tri');
  console.log('  cuerpo            alto ' + p.cuerpo.alto_modelo + ' · r_ext ' + p.cuerpo.r_ext_max
              + ' · r_int ' + p.cuerpo.r_int_medio + ' · pared ' + p.cuerpo.pared_medida_pct + '%');
  console.log('  liquido           ' + p.liquido_tri + ' tri · volumen modelo ' + p.volumen_modelo);
  console.log('  nivel del liquido y=' + p.nivel_y_cm + ' cm (malla hasta ' + p.tope_liquido_y_cm + ')');
  console.log('  escala k          ' + p.escala + '  ->  ALTO ' + p.alto_cm
              + ' cm · radio ' + p.radio_cm + ' cm · base en ' + p.base_en_cero);
  console.log('  triangulos        ' + p.tri_origen + ' -> soldado ' + p.tri_soldado + ' -> final ' + p.tri_final);
  console.log('  comprimido        quantize ' + p.kb_quantize + ' KB (gz ' + p.kb_quantize_gz + ')'
              + '  ·  draco ' + p.kb_draco + ' KB (gz ' + p.kb_draco_gz + ')');
}
fs.writeFileSync(path.join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 2));

/* ═══════════════════════════════════════════════════════════════════════════
   🔴 LA PUERTA DE PESO VIVE AQUI, EN LA TUBERIA, Y PARA EL BUILD.

   En la sesion 2 la puerta estaba solo en el banco, a 1.400 KB de seccion, y
   el control negativo demostro que NO SERVIA: los mismos modelos SIN comprimir
   (644 KB) pasaban las tres puertas de peso igual que los comprimidos (104 KB).
   Una puerta que aprueba tanto el caso bueno como el malo no es una puerta.

       Lo que protegia el peso no era la puerta: era la tuberia. Asi que la
       puerta se pone donde de verdad decide, y con un numero que muerda.

   60 KB por modelo comprimido: Draco da 47 y 33; sin comprimir dan 262 y 201.
   El caso que debe fallar, falla — y ahora ademas para el build.

   🔴 Y LA REGLA DE ALTURA, por la misma razon: ninguno pasa de 1,4 veces el mas
   bajo. Los ml no mandan sobre la fila.
   ═══════════════════════════════════════════════════════════════════════════ */
const TOPE_KB_MODELO = 60;
const TOPE_RATIO_ALTURA = 1.4;

const rojos = [];
for (const f of informe.frascos) {
  if (f.kb_draco > TOPE_KB_MODELO)
    rojos.push(f.id + ': ' + f.kb_draco + ' KB comprimido, tope ' + TOPE_KB_MODELO);
}
const alturas = informe.frascos.map(f => f.alto_cm);
if (alturas.length > 1) {
  const ratio = Math.max(...alturas) / Math.min(...alturas);
  informe.ratio_altura = +ratio.toFixed(3);
  console.log('\nAlturas: ' + alturas.map(a => a.toFixed(2) + ' cm').join(' · ') +
              '  -> el mas alto es ' + ratio.toFixed(2) + 'x el mas bajo (tope ' + TOPE_RATIO_ALTURA + ')');
  if (ratio > TOPE_RATIO_ALTURA)
    rojos.push('alturas: el mas alto es ' + ratio.toFixed(2) + 'x el mas bajo, tope ' + TOPE_RATIO_ALTURA);
}

const sum = c => informe.frascos.reduce((a, x) => a + x[c], 0);

/* El decodificador de Draco se pesa EN GZIP tambien, y se pesa entero: el
   .wasm mas el envoltorio .js mas DRACOLoader. Es un coste fijo que solo paga
   la opcion Draco, y compararlo sin el es hacer trampa a favor de Draco. */
const gz = f => gzipSync(fs.readFileSync(f), { level: 9 }).length / 1024;
const tres = path.join(AQUI, 'tres');
const dec = gz(path.join(tres, 'draco', 'draco_decoder.wasm'))
          + gz(path.join(tres, 'draco', 'draco_wasm_wrapper.js'))
          + gz(path.join(tres, 'DRACOLoader.min.js'));

const q = sum('kb_quantize_gz'), d = sum('kb_draco_gz');
console.log('\n── TOTAL de los modelos, EN GZIP (que es lo que viaja) ──');
console.log('  quantize   ' + q.toFixed(1) + ' KB  (sin decodificador)');
console.log('  draco      ' + d.toFixed(1) + ' KB  + ' + dec.toFixed(1) + ' KB de decodificador  = '
            + (d + dec).toFixed(1) + ' KB');
console.log('  en disco:  quantize ' + sum('kb_quantize').toFixed(1)
            + ' KB · draco ' + sum('kb_draco').toFixed(1) + ' KB');
const gana = q <= d + dec ? 'QUANTIZE' : 'DRACO';
console.log('  => GANA ' + gana + ' por ' + Math.abs(q - (d + dec)).toFixed(1) + ' KB');
informe.compresion = {
  quantize_gz: +q.toFixed(1), draco_gz: +d.toFixed(1),
  decodificador_draco_gz: +dec.toFixed(1), elegida: gana
};
informe.puertas = { tope_kb_modelo: TOPE_KB_MODELO, tope_ratio_altura: TOPE_RATIO_ALTURA,
                    rojos: rojos, verde: rojos.length === 0 };
fs.writeFileSync(path.join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 2));
if (rojos.length) {
  console.log('\n[ROJO] EL BUILD SE PARA. Lo que no pasa la puerta, no se publica:');
  for (const r of rojos) console.log('   · ' + r);
  process.exitCode = 1;
} else {
  console.log('\n[OK] puertas de la tuberia: cada modelo <= ' + TOPE_KB_MODELO +
              ' KB comprimido, y alturas dentro de ' + TOPE_RATIO_ALTURA + 'x');
}
