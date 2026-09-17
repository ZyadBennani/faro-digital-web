/* ═══════════════════════════════════════════════════════════════════════════
   realismo.js · sesión 3 — lo que separa «se ve que es 3D» de «es una foto»

   Zyad puntuó la sesión 2: movimiento 8, selección 8, **diseño 6,5**. Y nombró
   el defecto exacto: *«faltan detalles como el líquido que se va moviendo
   cuando mueves el frasco, esto no es realista»*.

   Tenía razón, y es el fallo más caro de los tres, porque no es un ajuste: es
   una mentira física. Un líquido cuya superficie se inclina con el envase no es
   un líquido; es un sólido pintado del color del líquido. El ojo lo caza sin
   saber qué está cazando, y todo lo demás —el vidrio, la luz, las sombras—
   queda bajo sospecha.

   Aquí están las cuatro cosas de esta sesión, cada una con su interruptor para
   poder fotografiarla encendida y apagada:

     1 · nivelado del líquido       `nivelarLiquido`
     2 · ruido de rugosidad          `imperfectar`
     3 · dispersión del vidrio       en `materialDe`, si r185 la trae
     4 · grano sobre el lienzo       en el CSS de index.html

   Cada interruptor existe porque una mejora que no se puede apagar no se puede
   demostrar (L-0052).
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from './tres/three.module.min.js';

export const ARRIBA = new THREE.Vector3(0, 1, 0);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL LÍQUIDO SE QUEDA NIVELADO

   🔴 POR QUÉ NO SE RECORTA CON UN PLANO DE RECORTE (clippingPlanes)
   Recortar deja la malla ABIERTA: se ve el interior hueco del frasco por el
   corte. El remedio estándar es tapar el corte con stencil, y ahí está la
   trampa de esta pieza en concreto: el vidrio usa `transmission`, y three.js
   dibuja la pasada de transmisión contra un objetivo **sin buffer de stencil**.
   O sea que la tapa existiría mirando el líquido directamente y desaparecería
   justo al mirarlo A TRAVÉS DEL VIDRIO — que es como se mira siempre.

   LO QUE SÍ FUNCIONA: no se corta nada. La malla del líquido llega hasta el
   borde del frasco y el vertex shader **aplasta contra el plano** todo lo que
   queda por encima. La malla sigue cerrada, así que no hay agujero que tapar,
   y como es geometría y no un truco de buffer, funciona igual en la pasada de
   transmisión, en el mapa de sombras y en cualquier pasada futura.

   DÓNDE VA EL PLANO, Y POR QUÉ IMPORTA: por el punto del EJE del frasco a la
   altura del nivel. No es un detalle estético — es lo que **conserva el
   volumen**. Para un cilindro inclinado, el volumen bajo un plano horizontal
   que pasa por el punto del eje a altura h es exactamente πr²h, la inclines lo
   que la inclines. Si el plano se pusiera a una altura fija de mundo, el
   frasco ganaría y perdería producto al girarlo.

   EL RETARDO: la superficie la arrastra el envase y la devuelve la gravedad.
   Cada fotograma se aplica al normal el giro que ha dado el frasco (arrastre) y
   se tira de él hacia la vertical con `lerp 0.05`. Eso es la inercia: no es una
   animación, es un equilibrio entre dos fuerzas.
   ═══════════════════════════════════════════════════════════════════════════ */

/* 0,996 y no 1,0, y esto no es una manía.
   Al aplastar, TODO lo que estaba por encima aterriza en el mismo plano: la
   pared del frasco por encima del nivel y la tapa superior de la malla acaban
   coplanares, y dos superficies coplanares con profundidad idéntica parpadean
   (z-fighting). Dejando un 0,4 % del exceso, cada anillo aterriza a una altura
   infinitesimalmente distinta —décimas de micra a esta escala, invisibles— y
   el orden de profundidad queda resuelto. La tapa, que era la más alta, queda
   arriba, que es justo lo que tiene que pasar. */
const APLASTADO = 0.996;

export function nivelarLiquido(material) {
  material.userData.plano = {
    N: { value: new THREE.Vector3(0, 1, 0) },
    D: { value: 0 },
    activo: { value: 1 }
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPlanoN = material.userData.plano.N;
    shader.uniforms.uPlanoD = material.userData.plano.D;
    shader.uniforms.uNivelado = material.userData.plano.activo;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uPlanoN;
        uniform float uPlanoD;
        uniform float uNivelado;
        float dPlano;`)
      /* El normal se toca ANTES que la posición porque three.js calcula
         `objectNormal` en este chunk, y el de posición viene después. Lo que se
         aplasta deja de tener el normal de la pared: pasa a ser la superficie
         del líquido, y mira hacia arriba. */
      .replace('#include <beginnormal_vertex>', `
        dPlano = ( dot( position, uPlanoN ) - uPlanoD ) * uNivelado;
        #include <beginnormal_vertex>
        if ( dPlano > 0.0 ) objectNormal = uPlanoN;`)
      .replace('#include <begin_vertex>', `
        #include <begin_vertex>
        if ( dPlano > 0.0 ) transformed -= uPlanoN * ( dPlano * ${APLASTADO} );`);
    material.userData.shader = shader;
  };
  material.customProgramCacheKey = () => 'aura-liquido-nivelado';
  return material;
}

/* El estado del chapoteo: vive fuera del material porque es por FRASCO, no por
   material, y porque así el banco puede leerlo y escribirlo. */
export function crearChapoteo() {
  return {
    normal: new THREE.Vector3(0, 1, 0),
    qAnterior: new THREE.Quaternion(),
    arrastre: 0.45,     // cuánto del giro del frasco se lleva la superficie
    vuelta: 0.05,       // el `lerp 0.05` del encargo: la gravedad tirando
    tope: 12            // grados. Más que esto ya no es inercia, es un fallo
  };
}

const _q = new THREE.Quaternion();
const _qId = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _plano = new THREE.Plane();

/**
 * Coloca el plano del líquido de un frasco. Se llama una vez por fotograma.
 * @param malla   la malla del líquido
 * @param frasco  el grupo que gira (el que lleva la rotación)
 * @param nivelY  altura local del nivel de llenado, en cm — viene del .glb
 * @param ch      estado del chapoteo (crearChapoteo)
 * @param nivelado  false = CONTROL NEGATIVO: el líquido gira con el frasco
 */
export function colocarPlano(malla, frasco, nivelY, ch, nivelado) {
  frasco.updateWorldMatrix(true, false);

  if (nivelado === false) {
    /* 🔴 CONTROL NEGATIVO (L-0052). Sin nivelado, el normal del plano es el
       «arriba» DEL FRASCO, así que la superficie se inclina con él — que es
       exactamente el defecto de la sesión 2. Si las dos capturas se parecen,
       el nivelado no está haciendo nada y toda esta sección sobra. */
    ch.normal.set(0, 1, 0).applyQuaternion(frasco.getWorldQuaternion(_q)).normalize();
  } else {
    /* arrastre: el giro que ha dado el frasco desde el fotograma anterior,
       aplicado en parte al normal. Una parte, no entero: el líquido roza la
       pared, no está soldado a ella. */
    frasco.getWorldQuaternion(_q);
    const delta = _q.clone().multiply(ch.qAnterior.clone().invert());
    ch.qAnterior.copy(_q);
    ch.normal.applyQuaternion(_qId.identity().slerp(delta, ch.arrastre));

    // gravedad: siempre tirando hacia la vertical
    ch.normal.lerp(ARRIBA, ch.vuelta).normalize();

    // y un tope, porque un chapoteo de 40 grados es un fallo, no una inercia
    const ang = ch.normal.angleTo(ARRIBA) * 180 / Math.PI;
    if (ang > ch.tope) {
      const eje = _v.copy(ARRIBA).cross(ch.normal).normalize();
      ch.normal.copy(ARRIBA).applyAxisAngle(eje, ch.tope * Math.PI / 180);
    }
  }

  /* El punto por el que pasa el plano: el del EJE del frasco a la altura del
     nivel, llevado a mundo. Aquí es donde se conserva el volumen. */
  _v.set(0, nivelY, 0).applyMatrix4(frasco.matrixWorld);
  _plano.setFromNormalAndCoplanarPoint(ch.normal, _v);

  /* y a espacio de objeto de la malla, que es donde trabaja el shader. Se hace
     con la matriz de la MALLA y no con la del grupo: si algún día el .glb trae
     un nodo con transformación propia, esto sigue siendo correcto sin que nadie
     tenga que acordarse. */
  malla.updateWorldMatrix(true, false);
  _m.copy(malla.matrixWorld).invert();
  const po = _plano.clone().applyMatrix4(_m);
  const u = malla.material.userData.plano;
  u.N.value.copy(po.normal);
  u.D.value = -po.constant;
  return ch.normal.angleTo(ARRIBA) * 180 / Math.PI;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · IMPERFECCIONES · el ruido de rugosidad

   Una superficie con rugosidad EXACTAMENTE constante no existe fuera de un
   render. El vidrio real tiene el pulido desigual, huellas, polvo; el tapón
   mate tiene la textura del molde. Es lo que hace que el brillo no sea una
   mancha limpia sino algo que se rompe.

   🔴 SE HACE EN EL SHADER Y NO CON UNA TEXTURA, y hay un motivo medido:
   **ninguno de los tres modelos trae UV.** Se comprobó: sus primitivas solo
   tienen POSITION y NORMAL. Un `roughnessMap` sin UV no pinta nada, y generar
   UV cilíndricas en la tubería mete una costura visible en la vertical donde
   u salta de 1 a 0 — justo en el canto del frasco, que es donde más se mira.
   Un ruido de posición no tiene costura porque no tiene parametrización.

   Y además no pesa: cero bytes de descarga.
   ═══════════════════════════════════════════════════════════════════════════ */

/* 🔴 LA ESCALA DEL RUIDO SE MIDE EN PANTALLA, NO EN EL MATERIAL.

   Primera version: `escala 18-22`. Las posiciones estan en CENTIMETROS, así que
   una celda de ruido medía 1/22 cm = **0,45 mm**. Un frasco de 10 cm ocupa unos
   200 px en el lienzo, o sea 1 px ≈ 0,5 mm: la celda de ruido era **más pequeña
   que un píxel**. El control negativo lo cazó — pico 6/255, 0,0 % de superficie
   tocada — y tenía toda la razón.

       Un ruido cuya celda es menor que un píxel no es una textura: es
       aliasing, y al promediarse dentro del píxel devuelve una constante.
       O sea, exactamente lo que se quería evitar.

   Lo que se ve es lo que mide entre medio centímetro y dos: escala 1-3. */
export function imperfectar(material, opciones) {
  const o = opciones || {};
  const escala = o.escala === undefined ? 1.6 : o.escala;
  const min = o.min === undefined ? 0.04 : o.min;
  const max = o.max === undefined ? 0.10 : o.max;
  const ccMin = o.ccMin, ccMax = o.ccMax;

  material.userData.ruido = { activo: { value: 1 } };
  const antes = material.onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    if (antes) antes(shader);
    shader.uniforms.uRuidoActivo = material.userData.ruido.activo;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vPosAura;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vPosAura = position;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosAura;
        uniform float uRuidoActivo;
        /* Ruido de valor, tres octavas. Barato y suficiente: lo que hace falta
           es que la rugosidad NO sea una constante, no que sea bonita. */
        float hashA( vec3 p ) {
          p = fract( p * 0.3183099 + vec3( 0.1, 0.2, 0.3 ) );
          p *= 17.0;
          return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
        }
        float ruidoA( vec3 x ) {
          vec3 i = floor( x ), f = fract( x );
          f = f * f * ( 3.0 - 2.0 * f );
          return mix( mix( mix( hashA( i + vec3(0,0,0) ), hashA( i + vec3(1,0,0) ), f.x ),
                           mix( hashA( i + vec3(0,1,0) ), hashA( i + vec3(1,1,0) ), f.x ), f.y ),
                      mix( mix( hashA( i + vec3(0,0,1) ), hashA( i + vec3(1,0,1) ), f.x ),
                           mix( hashA( i + vec3(0,1,1) ), hashA( i + vec3(1,1,1) ), f.x ), f.y ), f.z );
        }
        float fbmA( vec3 p ) {
          return 0.55 * ruidoA( p ) + 0.30 * ruidoA( p * 2.1 ) + 0.15 * ruidoA( p * 4.3 );
        }`)
      /* `roughnessFactor` ya está calculado en este punto del shader estándar.
         Se sustituye, no se multiplica: el rango 0,04-0,10 del encargo es un
         rango absoluto, y multiplicar por un ruido de media 0,5 lo convertiría
         en otra cosa sin que se note. */
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if ( uRuidoActivo > 0.5 ) {
          float nA = fbmA( vPosAura * ${escala.toFixed(3)} );
          roughnessFactor = mix( ${min.toFixed(4)}, ${max.toFixed(4)}, nA );
        }`);

    /* 🔴 EN EL VIDRIO HAY QUE TOCAR EL BARNIZ, NO SOLO LA BASE.
       El vidrio lleva `clearcoat: 1` —es lo que hace visible el reflejo de la
       ventana (sesion 1)— y con `transmission: 1` casi toda la luz atraviesa la
       capa base. O sea: lo que se VE del vidrio es el especular del BARNIZ, y
       perturbar la rugosidad de la base no cambia ni un pixel. Medido: pico
       6/255 con la base perturbada.
       El minimo es 0,055 y no menos porque three.js recorta por abajo en
       0,0525; pedir menos es pedir un numero que nadie va a usar. */
    if (ccMin !== undefined) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
        if ( uRuidoActivo > 0.5 ) {
          float nC = fbmA( vPosAura * ${escala.toFixed(3)} + vec3( 11.3, 7.1, 3.7 ) );
          material.clearcoatRoughness = mix( ${(+ccMin).toFixed(4)}, ${(+ccMax).toFixed(4)}, nC );
        }
        #endif`);
    }
    material.userData.shaderRuido = shader;
  };
  /* 🔴 `customProgramCacheKey` SE LLAMA CON SU MATERIAL, NO SUELTO.
     Es un metodo del prototipo de Material y por dentro lee
     `this.onBeforeCompile.toString()`. Guardarlo en una variable y llamarlo
     como funcion pelada lo deja sin `this`, y three.js revienta con
     «Cannot read properties of undefined (reading 'onBeforeCompile')» en
     mitad del primer render — no al asignarlo, que es lo que despista. */
  const clave = 'aura-ruido-' + escala + '-' + min + '-' + max;
  const antesClave = material.customProgramCacheKey;
  material.customProgramCacheKey = function () {
    return (antesClave ? antesClave.call(this) : '') + clave;
  };
  return material;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · ENTORNO REAL · el HDRI de Poly Haven, decodificado de PNG-RGBE

   `entorno.png` no es una imagen normal: su canal alfa es un EXPONENTE. Se
   decodifica aquí a Float32 y se pasa por PMREM, igual que el entorno
   procedural de la sesión 1 — la diferencia es que ahora lo que el vidrio
   refleja es una habitación de verdad, con sus ventanas y sus muebles, en vez
   de dos rectángulos de luz que yo dibujé.

   El rango se conserva: el máximo del original es 89,3 y el del PNG 76,7. Ese
   número por encima de 1 es lo que separa el vidrio del plástico gris (L-0067).
   ═══════════════════════════════════════════════════════════════════════════ */

export async function cargarEntornoHDRI(renderer, rutaPNG, meta) {
  const img = await new Promise((ok, err) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => err(new Error('no carga ' + rutaPNG));
    i.src = rutaPNG;
  });
  const W = meta.ancho, H = meta.alto;
  if (img.width !== W || img.height !== H)
    throw new Error('entorno.png mide ' + img.width + 'x' + img.height +
                    ' y entorno.json dice ' + W + 'x' + H);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;

  const datos = new Float32Array(W * H * 4);
  let max = 0;
  for (let i = 0; i < W * H; i++) {
    const e = d[i * 4 + 3];
    const s = e === 0 ? 0 : Math.pow(2, e - 128) / 255;
    datos[i * 4]     = d[i * 4]     * s;
    datos[i * 4 + 1] = d[i * 4 + 1] * s;
    datos[i * 4 + 2] = d[i * 4 + 2] * s;
    datos[i * 4 + 3] = 1;
    max = Math.max(max, datos[i * 4], datos[i * 4 + 1], datos[i * 4 + 2]);
  }
  /* 🔴 SE COMPRUEBA EL MÁXIMO CONTRA LO QUE DICE EL JSON. Un decodificador de
     exponentes que se equivoque en el signo o en el sesgo devuelve una imagen
     que SE VE bien —tonos parecidos— y sin un solo valor por encima de 1. El
     vidrio saldría de plástico y nadie sabría por qué (L-0065, L-0067). */
  const esperado = meta.maximo || 0;
  const desvio = esperado ? Math.abs(max - esperado) / esperado : 0;

  const tex = new THREE.DataTexture(datos, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const objetivo = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();

  return {
    textura: objetivo.texture,
    informe: {
      archivo: rutaPNG, tamano: W + 'x' + H,
      maximo_decodificado: +max.toFixed(2),
      maximo_esperado: esperado,
      desvio_pct: +(desvio * 100).toFixed(2),
      ok: max > 4 && desvio < 0.02,
      origen: meta.origen, autor: meta.autor
    }
  };
}
