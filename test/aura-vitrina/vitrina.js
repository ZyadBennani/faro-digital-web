/* ═══════════════════════════════════════════════════════════════════════════
   vitrina.js · LA VITRINA DE AURA EN VIVO — sesion 2

   Tres frascos reales sobre el papel de la pagina. UNA escena, UN lienzo, UN
   contexto WebGL. Tres visores serian tres contextos, y tres contextos matan
   un movil: el navegador tiene un tope (suele ser 8-16) y al pasarlo empieza
   a matar los mas viejos sin avisar.

   Lo que esta pieza NO hace, y cada ausencia es una decision:
     · no bloquea el scroll NUNCA. Ver §GESTOS, que es la parte delicada.
     · no escribe «toca un producto». La pista es un vaiven, una vez.
     · no baja la opacidad de los no elegidos: les baja el TONO. Un producto
       medio transparente se lee como un fallo de carga, no como un estado.
     · no tiene caja, fondo, pedestal, desenfoque ni particulas.

   El plato (entorno oscuro, dos ventanas, dos sombras) viene de estudio.js y
   no se toca: es lo que costo seis rondas y tres lecciones en la sesion 1.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from './tres/three.module.min.js';
import { GLTFLoader } from './tres/GLTFLoader.min.js';
import { DRACOLoader } from './tres/DRACOLoader.min.js';
import {
  AJUSTES, PAPEL, construirEntorno, matVidrio, matLiquido, matTapon, matAnillo,
  cargarFuentes, svgEtiqueta, texturaDesdeSVG, comprobarEtiqueta,
  texturaSombra, texturaCaustica, calcomanias, dirDeAngulos
} from './estudio.js';
import {
  nivelarLiquido, crearChapoteo, colocarPlano, imperfectar, cargarEntornoHDRI
} from './realismo.js';

/* ── LOS NUMEROS DE LA INTERACCION, TODOS JUNTOS ──────────────────────────── */
export const MOV = {
  avance: 0.12,        // el elegido se acerca un 12 % de la distancia de camara
  retroceso: 0.06,     // los otros dos se van un 6 %
  giro_sel: 15,        // grados que el elegido gira hacia la camara
  presencia: 0.42,     // cuanto baja el tono de los NO elegidos (0 = igual)
  lerp: 0.08,          // el tiron por fotograma hacia el objetivo
  transicion: 600,     // ms. La curva es la de la web (--m-estandar)
  reposo_ms: 3000,     // sin tocar, vuelve solo
  amortiguacion: 0.935,// inercia del giro libre
  polar_min: 15,       // grados desde el cenit
  polar_max: 100,      // 100 = 10 grados por debajo del horizonte. Nunca mas.
  vaiven: 10,          // grados de la pista de entrada
  separacion: 6.4      // cm entre ejes de frasco: ensancha la fila y deja
                       // menos papel vacio a los lados sin que se toquen
};

/* 🔴 EL ORDEN SALE DE LA CONFIGURACION, NO DE UNA CONSTANTE ESCRITA AQUI.
   Al quitar ROCIO de la familia, una lista fija en el codigo habria seguido
   pidiendo un frasco que ya no existe — y el fallo no habria sido un error
   limpio, sino un hueco en la fila. El tamano de la familia es un DATO. */
const ORDEN_POR_DEFECTO = ['crema', 'serum', 'bruma'];
const CURVA = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;   // easeInOutCubic

/* La camara esta fija a 9 grados sobre el horizonte (AJUSTES.camara.elevacion),
   asi que su angulo polar es 90-9 = 81. El giro libre mueve el FRASCO, no la
   camara, y por eso el limite en polar del enunciado se traduce a un limite de
   inclinacion del objeto: inclinar +D grados hace que se vea como si la camara
   estuviera a 81-D. */
function limitesInclinacion(elevCam) {
  const polarCam = 90 - elevCam;
  return { min: polarCam - MOV.polar_max, max: polarCam - MOV.polar_min };
}

export class Vitrina {
  constructor(lienzo, cfg) {
    this.lienzo = lienzo;
    this.cfg = cfg || AJUSTES;
    this.frascos = {};
    this.sel = null;
    this.t0 = 0;              // cuando empezo la transicion de seleccion
    this.giro = { az: 0, incl: 0, vaz: 0, vincl: 0 };
    this.ultimoToque = 0;
    this.arrastrando = false;
    this.pista = { hecha: false, t0: 0 };
    this.listo = false;
    this.aviso = [];
    /* Los interruptores de la sesion 3. Cada mejora se puede APAGAR, que es
       lo unico que permite fotografiarla con y sin y demostrar que hace algo
       (L-0052). El banco los mueve; la pagina los deja todos encendidos. */
    this.op = { nivelado: true, ruido: true, hdri: true, dispersion: true };
    this.chapoteo = {};
  }

  /* ── montaje ─────────────────────────────────────────────────────────── */
  async montar(rutaModelos) {
    const r = new THREE.WebGLRenderer({
      canvas: this.lienzo, antialias: true, alpha: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: true
    });
    /* DPR topado a 1,75: por encima el coste sube con el cuadrado y el ojo ya
       no distingue en una pieza sin texto dentro del lienzo. */
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = this.cfg.camara.exposicion;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.rend = r;

    const esc = new THREE.Scene();
    esc.background = new THREE.Color(PAPEL);
    this.esc = esc;

    /* ── EL ENTORNO ────────────────────────────────────────────────────
       Primero se intenta el HDRI real (una habitacion de verdad, con sus
       ventanas). Si no carga, se cae al entorno procedural de la sesion 1,
       que no es un apano: es lo que estuvo publicado y funcionaba. Lo que
       NO se hace es quedarse sin entorno, porque un objeto reflejante sin
       nada que reflejar es plastico gris (L-0067). */
    this.entornoProc = construirEntorno(r, this.cfg);
    if (this.op.hdri && this.cfg.entornoHDRI) {
      try {
        const h = await cargarEntornoHDRI(r, this.cfg.entornoHDRI.archivo, this.cfg.entornoHDRI);
        this.entornoHDRI = h.textura;
        this.entornoInforme = h.informe;
        if (!h.informe.ok)
          this.aviso.push('entorno HDRI: maximo ' + h.informe.maximo_decodificado +
                          ' contra ' + h.informe.maximo_esperado + ' esperado');
      } catch (e) {
        this.aviso.push('entorno HDRI no carga: ' + e.message + ' — se usa el procedural');
      }
    }
    this.usarEntorno(this.op.hdri && !!this.entornoHDRI);

    /* ── EL PAPEL ───────────────────────────────────────────────────────────
       4000 de lado, no 400. Con 400 el borde del plano entraba en cuadro por
       arriba y dejaba una BANDA MAS CLARA cruzando la parte alta del lienzo —
       se ve en la hoja de contacto del 17-sep. Esa banda es la caja que esta
       pieza no puede tener: el lienzo tiene que ser papel de lado a lado.

       Y la vineta de la sesion 1 se queda A PROPOSITO, pero al reves de como
       se usaba: alli el render era una imagen suelta y la caida oscurecia los
       bordes. Aqui los bordes TOCAN LA PAGINA, asi que lo que se calibra
       contra #F5EFE4 es la ESQUINA, y el centro queda un punto mas encendido.
       Un charco de luz bajo los productos se lee como luz de plato; un borde
       oscuro se lee como el canto de una caja. */
    const papel = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshStandardMaterial({ color: PAPEL, roughness: 0.94, metalness: 0 })
    );
    papel.rotation.x = -Math.PI / 2;
    papel.receiveShadow = true;
    /* 🔴 EL PAPEL TIENE SU PROPIO ENTORNO, Y EL PRODUCTO EL HDRI.
       Al poner la habitacion real como entorno de la escena, el papel empezo a
       recoger la ESTRUCTURA de su suelo: el especular de una superficie mate
       depende del vector de reflexion, que cambia de un lado a otro del plano,
       y un suelo de estudio de verdad no es uniforme. Resultado medido: la
       costura con la pagina se abrio de 1/255 a 11/255 — la caja, otra vez.

           En un plato, el fondo y el producto no hacen el mismo trabajo. El
           producto tiene que reflejar la habitacion; el fondo tiene que ser
           un fondo, y aqui ademas tiene que casar con la pagina al pixel.

       Asi que el papel se queda con el entorno procedural, que es liso por
       construccion, y el HDRI se lo llevan los frascos — que es donde se ve.
       A rugosidad 0,94 la diferencia entre los dos no se distingue en el papel;
       lo que si se distingue es el borde de una caja. */
    papel.material.envMap = this.entornoProc;
    papel.material.envMapIntensity = 1;
    esc.add(papel);
    this.papel = papel;

    /* la clave, solo para la sombra proyectada. L-0068: mapa PEQUENO y radio
       GRANDE, porque el desenfoque se mide en texeles del mapa, no en cm.
       Subir la resolucion ENDURECE la sombra. */
    const cl = dirDeAngulos(this.cfg.entorno.clave_az, this.cfg.entorno.clave_el);
    const dir = new THREE.DirectionalLight(0xfff2e2, this.cfg.luz.clave_dir);
    dir.position.set(cl[0] * 70, cl[1] * 70, cl[2] * 70);
    dir.castShadow = true;
    dir.shadow.mapSize.set(512, 512);
    dir.shadow.radius = this.cfg.luz.sombra_radio;
    const s = 18;
    Object.assign(dir.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 220 });
    dir.shadow.camera.updateProjectionMatrix();
    dir.shadow.bias = -0.0009;
    esc.add(dir);
    this.clave = dir;   // la calibracion del papel la mueve: ver calibrarPapel

    this.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 600);

    await this.cargarFrascos(rutaModelos);
    this.colocar();
    this.gestos();
    this.listo = true;
    return this;
  }

  /* Cambiar de entorno es UNA linea, y por eso el control negativo del §3
     es posible: se fotografia con el HDRI y con el procedural sin recargar. */
  usarEntorno(hdri) {
    this.esc.environment = (hdri && this.entornoHDRI) ? this.entornoHDRI : this.entornoProc;
    /* El HDRI trae su habitacion orientada como estaba la camara que la
       fotografio. Se gira para que su ventana grande caiga donde esta la luz
       clave de la escena — si no, el brillo del vidrio y la sombra del papel
       apuntan a sitios distintos y el ojo lo nota aunque no sepa que mira. */
    if (this.esc.environmentRotation)
      this.esc.environmentRotation.set(0, (this.cfg.entornoHDRI && this.cfg.entornoHDRI.giro || 0) * Math.PI / 180, 0);
    this.entornoActual = (hdri && this.entornoHDRI) ? 'hdri' : 'procedural';
  }

  async cargarFrascos(ruta) {
    const draco = new DRACOLoader().setDecoderPath(ruta.replace('modelos/', 'tres/draco/'));
    const gl = new GLTFLoader().setDRACOLoader(draco);
    const carga = u => new Promise((ok, err) => gl.load(u, ok, undefined, err));

    await cargarFuentes('../../assets/fuentes/');
    const texSombra = texturaSombra(), texCau = texturaCaustica();

    for (const def of this.cfg.familia.frascos) {
      const gltf = await carga(ruta + def.id + '.glb');
      const raiz = gltf.scene;
      const g = new THREE.Group();
      g.name = def.id;

      /* El .glb ya viene con la base en y=0, centrado en XZ y a escala real en
         cm: lo hizo preparar.mjs. Aqui no se re-escala nada, porque escalar dos
         veces es como se pierde de vista cual es el tamano de verdad. */
      /* 🔴 EL NIVEL VIENE DEL .glb, NO SE VUELVE A CALCULAR AQUI.
         `preparar.mjs` lo midio al tornear el liquido y lo dejo en
         `asset.extras.nivel_y_cm`. Recalcularlo en el navegador seria tener
         dos versiones del mismo numero, y el dia que una cambie dejaran de
         coincidir sin que nadie se entere. */
      const extras = (gltf.parser && gltf.parser.json && gltf.parser.json.asset &&
                      gltf.parser.json.asset.extras) || {};
      if (extras.nivel_y_cm === undefined)
        this.aviso.push(def.id + ': el .glb no trae nivel_y_cm — correr preparar.mjs');

      let alto = 0, radio = 0;
      raiz.traverse(o => {
        if (!o.isMesh) return;
        o.geometry.computeBoundingBox();
        const b = o.geometry.boundingBox;
        alto = Math.max(alto, b.max.y);
        radio = Math.max(radio, Math.abs(b.max.x), Math.abs(b.min.x), Math.abs(b.max.z), Math.abs(b.min.z));

        const papel = o.material ? o.material.name : '';
        o.userData.papel = papel;
        o.material = this.materialDe(papel, def);
        o.castShadow = (papel !== 'liquido');   // el liquido ya esta dentro del vidrio
        o.renderOrder = papel === 'vidrio' ? 2 : papel === 'liquido' ? 1 : 0;
        o.frustumCulled = false;
      });
      g.add(raiz);
      g.userData.alto = alto;
      g.userData.radio = radio;
      g.userData.def = def;
      g.userData.nivelY = extras.nivel_y_cm !== undefined
        ? extras.nivel_y_cm : (alto * (def.nivel_liquido || 0.7));
      g.userData.liquido = g.getObjectByName ? null : null;
      raiz.traverse(o => { if (o.isMesh && o.userData.papel === 'liquido') g.userData.liquido = o; });
      this.chapoteo[def.id] = crearChapoteo();

      await this.ponerEtiqueta(g, def, radio, alto);

      /* El pivote del giro va a media altura, no en la base: inclinar sobre la
         base hunde el frasco en el papel por un lado y lo levanta por el otro.
         A media altura el frasco gira como gira en la mano. */
      g.userData.pivote = alto * 0.42;

      const dec = calcomanias(g, this.cfg, texSombra, texCau);
      g.userData.calcos = dec;

      const conjunto = new THREE.Group();
      conjunto.name = def.id + '-conjunto';
      conjunto.add(dec);
      conjunto.add(g);
      conjunto.userData = { frasco: g, def: def };
      this.esc.add(conjunto);
      this.frascos[def.id] = conjunto;
    }
  }

  /* Los que hay, en el orden de la fila: los de la config que ademas se han
     cargado. Si la familia crece o encoge, esto no hay que tocarlo. */
  orden() {
    const ids = (this.cfg.familia && this.cfg.familia.frascos || []).map(f => f.id);
    const base = ids.length ? ids : ORDEN_POR_DEFECTO;
    return ORDEN_POR_DEFECTO.filter(id => base.indexOf(id) >= 0 && this.frascos[id])
      .concat(base.filter(id => ORDEN_POR_DEFECTO.indexOf(id) < 0 && this.frascos[id]));
  }

  materialDe(papel, def) {
    const v = this.cfg.familia.vidrio, t = this.cfg.familia.tapon;
    if (papel === 'vidrio') {
      const m = matVidrio(v, this.cfg);
      /* DISPERSION: el vidrio grueso separa el color en el canto, como un
         prisma flojo. Llego en three r166 y va sobre `transmission`. Si esta
         version no la trae, no se finge: se anota y se sigue. */
      if (this.op.dispersion && 'dispersion' in m) m.dispersion = v.dispersion || 1.6;
      else if (this.op.dispersion) this.aviso.push('r185 sin `dispersion` en MeshPhysicalMaterial');
      if (this.op.ruido) imperfectar(m, { escala: 1.4, min: 0.02, max: 0.075,
                                          ccMin: 0.055, ccMax: 0.165 });
      return m;
    }
    if (papel === 'liquido') return nivelarLiquido(matLiquido(def.liquido, v, this.cfg));
    if (papel === 'anillo')  return matAnillo(t.anillo);
    if (papel === 'sobretapa') {
      /* La sobretapa de ROCIO es la unica pieza transparente que no es el
         cuerpo. No lleva transmission: dos transmisivos anidados no se ven
         entre si (L-0066) y esta esta DELANTE del vaporizador. Cristal fino
         por alfa, que para una pieza sin liquido dentro basta y no cuesta
         una pasada aparte. */
      return new THREE.MeshPhysicalMaterial({
        color: 0xF2EFEA, transparent: true, opacity: 0.22,
        roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
        envMapIntensity: 1.1, side: THREE.DoubleSide, depthWrite: false
      });
    }
    const mt = matTapon(t);
    /* El tapon mate es donde MAS se nota el ruido: una superficie mate con
       rugosidad constante devuelve un degradado perfecto que no existe en
       ningun plastico inyectado. */
    if (this.op.ruido) imperfectar(mt, { escala: 2.6, min: 0.40, max: 0.68 });
    return mt;     // tapon, y cualquier papel no previsto
  }

  /* La etiqueta: SVG con la tipografia de base.css, sobre una banda cilindrica
     pegada al frasco. No hace falta que el modelo tenga UV util —ninguno de los
     tres lo tiene— y no cuesta ni un byte de descarga: se dibuja aqui. */
  /* Claro sobre oscuro y oscuro sobre claro, decidido con la luminancia del
     liquido YA mezclado con el papel — que es el color que de verdad se ve
     detras de la banda, no el que esta escrito en el JSON. */
  tintaEtiqueta(def) {
    const c = new THREE.Color(def.liquido.attenuationColor);
    if (def.liquido.mezcla_papel) c.lerp(new THREE.Color(PAPEL), def.liquido.mezcla_papel);
    const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;   // lineal, que es donde vive el color
    return L < 0.20 ? '#F7F1E6' : '#2A1D17';
  }

  async ponerEtiqueta(g, def, radio, alto) {
    const svg = svgEtiqueta(def, { modo: 'impresa', tinta: this.tintaEtiqueta(def) });
    const tex = await texturaDesdeSVG(svg);
    const chk = comprobarEtiqueta(tex, def);
    if (!chk.ok) this.aviso.push('etiqueta ' + def.id + ': desvio ' + chk.desvio + '% tinta ' + chk.tinta);
    this.etiquetaChk = this.etiquetaChk || {};
    this.etiquetaChk[def.id] = chk;

    const e = def.etiqueta;
    const arco = e.arco * Math.PI * 2;
    /* El radio de la banda NO es el radio maximo del frasco: es el radio del
       cuerpo A LA ALTURA de la etiqueta. Con el maximo, en un frasco de hombro
       redondo la banda flota separada de la pared. */
    const yCentro = alto * e.centro_rel;
    const rBanda = this.radioA(g, yCentro) * 1.004;
    const geo = new THREE.CylinderGeometry(rBanda, rBanda, alto * e.alto_rel, 80, 1, true, -arco / 2, arco);
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      map: tex, transparent: true, roughness: 0.38, metalness: 0,
      side: THREE.DoubleSide, envMapIntensity: 0.5, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    }));
    m.position.y = yCentro;
    m.name = 'etiqueta';
    m.renderOrder = 3;
    g.add(m);
  }

  /* radio del cuerpo a una altura dada, muestreando la geometria del vidrio */
  radioA(g, y) {
    let r = 0, mejor = 1e9;
    g.traverse(o => {
      if (!o.isMesh || !o.material || o.material.transmission !== 1) return;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const dy = Math.abs(p.getY(i) - y);
        if (dy > 0.12) continue;
        const rr = Math.hypot(p.getX(i), p.getZ(i));
        if (rr > r) { r = rr; mejor = dy; }
      }
    });
    return r || g.userData.radio;
  }

  /* ── colocacion: tres en linea, misma base ───────────────────────────── */
  colocar() {
    const ORDEN = this.orden();
    let x = 0;
    const xs = {};
    for (let i = 0; i < ORDEN.length; i++) {
      const c = this.frascos[ORDEN[i]];
      if (!c) continue;
      if (i > 0) x += MOV.separacion;
      xs[ORDEN[i]] = x;
    }
    const centro = (Math.max(...Object.values(xs)) + Math.min(...Object.values(xs))) / 2;
    for (const id in xs) {
      this.frascos[id].position.set(xs[id] - centro, 0, 0);
      this.frascos[id].userData.x0 = xs[id] - centro;
    }
    this.anchoFila = Math.max(...Object.values(xs)) - Math.min(...Object.values(xs))
                     + 2 * Math.max(...ORDEN.map(id => this.frascos[id] ? this.frascos[id].userData.frasco.userData.radio : 0));
    this.altoFila = Math.max(...ORDEN.map(id => this.frascos[id] ? this.frascos[id].userData.frasco.userData.alto : 0));
  }

  /* El encuadre: focal 85 equivalente, 9 grados sobre el horizonte. La
     distancia sale de que quepa la fila con aire, en ancho Y en alto. */
  encuadrar(w, h) {
    const c = this.cam;
    c.aspect = w / h;
    c.fov = 2 * Math.atan(24 / (2 * this.cfg.camara.focal)) * 180 / Math.PI;
    c.updateProjectionMatrix();
    const vT = Math.tan(c.fov * Math.PI / 360);
    /* 🔴 EL AIRE NO ES DECORACION, ES LO QUE EVITA QUE SE CORTE EL FRASCO.
       Con holgura 1,16 el encuadre daba 16,64 cm de alto util para un ROCIO de
       16,41: 2 milimetros de margen, y en cuanto el frasco avanzaba un 12 %
       hacia la camara al ser elegido, se salia por arriba. Se ve cortado en
       `vitrina-reposo-1440.png` del 17-sep.

           Un encuadre calculado para el estado de reposo se rompe en cuanto
           algo se mueve. El margen tiene que cubrir el estado MAS GRANDE.

       Pero el aire tampoco es gratis EN EL OTRO SENTIDO: con 1,55 el encuadre
       se iba tan atras que la fila de 15,3 cm ocupaba el 38 % del ancho del
       lienzo y el resto era papel vacio. En un lienzo 16:10, el frasco mas
       alto manda la distancia, y cuanto mas margen se le da mas se vacia el
       ancho. El numero tiene que cubrir el estado mas grande Y NADA MAS:

           alto visible = 16,1 x 1,30 = 20,9 cm
           el mas alto, ya avanzado un 12 % = 16,1 x 1,136 = 18,3 cm
           margen que queda = 2,6 cm, medido, no estimado. */
    /* 🔴 LO QUE TIENE QUE CABER ES EL ESTADO MAS GRANDE, Y ESE NO ES EL DE
       REPOSO. El elegido avanza un 12 % hacia la camara, o sea que se ve un
       13,6 % mas grande — y ese aumento hay que descontarlo del encuadre, no
       confiarlo al margen.

       Se vio al quitar ROCIO: con dos frascos la fila es mas estrecha, la
       camara se acerca hasta que manda la altura, y ALBA —ya avanzada— asomaba
       por ARRIBA. La costura con la pagina salto de 1/255 a 39/255 y el punto
       peor era (439,3): gris 184,180,172 en el borde superior. No era una caja:
       era un frasco cortado. La medida dice donde, y donde es la mitad de la
       respuesta.

       Asi que el alto efectivo se calcula, no se estima: alto / (1 - avance). */
    const altoEfectivo = this.altoFila / (1 - MOV.avance);
    /* Y el margen cubre los DOS extremos del estado avanzado: el elegido no
       solo se ve mas alto, tambien BAJA en pantalla —se acerca a una camara
       que mira desde arriba—, y con el baja su base y su sombra. El salto al
       cruzar el canto inferior del lienzo se midio en 36/255 justo debajo de
       ALBA: no era una caja, era el frasco elegido saliendose por abajo. */
    const holgura = w / h < 1.15 ? 1.62 : 1.45;
    const dAlto  = (altoEfectivo * holgura * 0.5) / vT;
    const dAncho = (this.anchoFila * 1.22 * 0.5) / (vT * c.aspect);
    const d = Math.max(dAlto, dAncho);
    const el = this.cfg.camara.elevacion * Math.PI / 180;
    /* Se mira algo por debajo de la media altura: deja sitio a las sombras
       abajo, que es donde el ojo comprueba que el frasco esta apoyado. */
    const mira = altoEfectivo * 0.46;
    c.position.set(0, mira + d * Math.sin(el), d * Math.cos(el));
    c.lookAt(0, mira, 0);
    this.dist = d;
  }

  medida(w, h) {
    this.rend.setSize(w, h, false);
    this.encuadrar(w, h);
    this.calibrarPapel();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     § EL PAPEL SE CALIBRA MIDIENDO EL LIENZO (L-0065)

     `#F5EFE4` escrito en un material NO sale `#F5EFE4` por pantalla: entre
     medias hay ACES y la conversion a sRGB. En la sesion 1 esto costo cuatro
     rondas de renders con el papel gris mientras el medidor firmaba «desvio
     1/255» — porque leia un render target, al que no se le aplica ninguna de
     las dos cosas.

         Un medidor que no lee por donde sale la imagen no mide la imagen.

     Asi que se lee `readPixels` sobre el framebuffer POR DEFECTO, que es lo
     que el usuario ve. Y aqui importa el doble que en la sesion 1: alli un
     desvio se notaba comparando dos PNG; aqui el papel del lienzo esta PEGADO
     al papel de la pagina y cualquier desvio dibuja el borde de una caja.
     ═══════════════════════════════════════════════════════════════════════ */
  calibrarPapel(pasos, tolerancia) {
    const objetivo = new THREE.Color(PAPEL);
    const aSRGB = v => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const obj = [objetivo.r, objetivo.g, objetivo.b].map(aSRGB);

    const gl = this.rend.getContext();
    const buf = new Uint8Array(4);
    const m = this.papel.material;
    const gan = this.papel.userData.ganancia || [1, 1, 1];
    const base = new THREE.Color(PAPEL);

    /* 🔴 SE CALIBRA CONTRA LO MISMO QUE SE MIDE.
       La version anterior calibraba UN pixel —la esquina inferior izquierda— y
       la puerta media DOCE puntos del borde. Con el entorno procedural daba
       igual porque el papel era liso; con el HDRI el borde varia un poco y el
       peor punto se quedaba en 3/255 mientras la esquina calibrada marcaba 1.

           Calibrar en un punto y medir en doce reparte el error a favor del
           punto que se calibro. Se calibra contra la MEDIA de los doce, que
           centra el error y baja el peor.

       Se saltan los puntos que no son papel: si un frasco o su sombra tocan un
       borde, ese punto no dice nada del papel y contaminaria la media. */
    const bordes = () => {
      const W = this.rend.domElement.width, H = this.rend.domElement.height;
      const p = [];
      for (let i = 0; i < 5; i++) {
        const x = Math.round(3 + (W - 7) * i / 4);
        p.push([x, 3], [x, H - 4]);
      }
      for (let i = 1; i < 4; i++) {
        const y = Math.round(3 + (H - 7) * i / 4);
        p.push([3, y], [W - 4, y]);
      }
      return p;
    };
    const puntos = bordes();
    const lee = () => {
      this.rend.setRenderTarget(null);
      this.rend.render(this.esc, this.cam);
      let r = 0, g = 0, b = 0, n = 0;
      for (const [x, y] of puntos) {
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        // un punto muy por debajo del papel es un frasco o su sombra: no cuenta
        if (buf[0] < 150) continue;
        r += buf[0]; g += buf[1]; b += buf[2]; n++;
      }
      if (!n) { gl.readPixels(3, 3, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf); return [buf[0]/255, buf[1]/255, buf[2]/255]; }
      return [r / n / 255, g / n / 255, b / n / 255];
    };
    const aplicar = () => {
      m.color.setRGB(Math.min(1, base.r * gan[0]), Math.min(1, base.g * gan[1]), Math.min(1, base.b * gan[2]));
      /* 🔴 Lo que pasa de 1 va a `emissive`, y se DICE. Una superficie que
         brilla por emision NO RECIBE SOMBRA: la emision se suma despues de la
         iluminacion. Con emisiva alta las sombras salen lavadas por mucho que
         se suba el foco (L-0068). Si esto pasa de 0,05, falta luz clave. */
      const ex = 0.18;
      m.emissive.setRGB(
        Math.max(0, base.r * gan[0] - 1) * ex,
        Math.max(0, base.g * gan[1] - 1) * ex,
        Math.max(0, base.b * gan[2] - 1) * ex
      );
      m.needsUpdate = true;
    };

    /* ═══════════════════════════════════════════════════════════════════════
       🔴 PRIMERO SE CALIBRA CON LUZ, Y SOLO DESPUES CON PINTURA.

       Con el entorno procedural de la sesion 1 el papel salia casi a su color
       con albedo 1, y la emisiva se quedaba en 0,006. Al cambiar a un HDRI de
       un plato de fotografia DE VERDAD, el suelo de esa habitacion es oscuro:
       el papel se quedo corto, el bucle subio la emisiva a **0,24**, y pasaron
       las dos cosas que L-0068 predice — la sombra se lavo y, como la emision
       es uniforme, la caida de luz desaparecio y volvio a verse la CAJA.

           Un fondo que se ilumina solo no se puede ensombrecer. Si el papel
           brilla por emision, la sombra del frasco no tiene nada que apagar.

       Asi que el bucle ahora tiene dos etapas. La primera mueve la LUZ CLAVE,
       que es la que proyecta la sombra: mas luz sobre el papel es mas papel Y
       mas sombra, las dos cosas a la vez, que es lo que pasa en un plato. La
       segunda afina con el albedo, que no puede pasar de 1. La emisiva queda
       como ultimo recurso y sigue saliendo en el informe con su aviso.
       ═══════════════════════════════════════════════════════════════════════ */
    let desvio = 1, leido = [0, 0, 0];

    /* 🔴 LA ETAPA DE LUZ APUNTA AL CANAL MAS CORTO, NO A LA LUMINANCIA.
       La primera version subia la clave hasta cuadrar la LUMINANCIA, y ahi
       paraba. Pero el albedo de la etapa 2 solo puede BAJAR —esta topado en 1—,
       asi que cualquier canal que quedara corto se quedaba corto para siempre:
       el papel salia #EFEDE4 contra #F5EFE4 y la costura con la pagina se
       abria a 13/255, o sea la caja otra vez.

           Si el ajuste fino solo puede restar, el ajuste grueso tiene que
           pasarse por arriba en todos los canales, no quedarse en la media.

       Asi que la luz sube hasta que NINGUN canal se queda corto, con un pelin
       de sobra, y la etapa 2 recorta los que sobran. */
    for (let k = 0; k < 9; k++) {
      aplicar();
      leido = lee();
      let peor = 0;
      for (let i = 0; i < 3; i++)
        peor = Math.max(peor, leido[i] > 0.02 ? obj[i] / leido[i] : 1.4);
      if (peor <= 1.012) break;                       // ya sobra en los tres
      const nueva = Math.min(60, Math.max(0.5, this.clave.intensity * Math.pow(peor * 1.005, 1.5)));
      if (Math.abs(nueva - this.clave.intensity) < 1e-3) break;
      this.clave.intensity = nueva;
    }
    /* La emisiva ya no tiene que tapar ningun agujero: la luz llega. Se pone a
       cero ANTES de la etapa 2 para que el bucle no la herede de una pasada
       anterior — una calibracion que arrastra el estado de la anterior mide dos
       cosas mezcladas. */
    for (let i = 0; i < 3; i++) gan[i] = Math.min(gan[i], 1);

    // etapa 2 · el albedo, por canal, para clavar el tono
    for (let k = 0; k < (pasos || 10); k++) {
      aplicar();
      leido = lee();
      desvio = Math.max(Math.abs(leido[0] - obj[0]), Math.abs(leido[1] - obj[1]), Math.abs(leido[2] - obj[2]));
      if (desvio < (tolerancia || 0.003)) break;
      for (let i = 0; i < 3; i++) {
        const f = leido[i] > 0.02 ? Math.min(1.5, Math.max(0.7, obj[i] / leido[i])) : 1.3;
        gan[i] = Math.min(6, Math.max(0.3, gan[i] * Math.pow(f, 2.0)));
      }
    }
    this.papel.userData.ganancia = gan;
    const hex = a => '#' + a.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    this.papelInforme = {
      leido: hex(leido), objetivo: '#F5EFE4', desvio_255: +(desvio * 255).toFixed(1),
      albedo: +Math.max(m.color.r, m.color.g, m.color.b).toFixed(3),
      emisiva: +Math.max(m.emissive.r, m.emissive.g, m.emissive.b).toFixed(3),
      clave: +this.clave.intensity.toFixed(2),
      entorno: this.entornoActual
    };
    if (this.papelInforme.emisiva > 0.05)
      this.aviso.push('emisiva ' + this.papelInforme.emisiva + ' — LAVA LA SOMBRA (L-0068)');
    return this.papelInforme;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     § LA COSTURA · la prueba de que NO hay caja

     «Sin caja, sin fondo propio» no es una intencion: es un numero. Se leen
     doce pixeles del BORDE del lienzo y se comparan con el color que la
     pagina pinta al lado. Si alguno se sale, hay una caja — la vea alguien o
     no. Calibrar una esquina y dar por hecho que las otras once van detras es
     exactamente como se cuela un degradado.
     ═══════════════════════════════════════════════════════════════════════ */
  costura() {
    const gl = this.rend.getContext();
    const W = this.rend.domElement.width, H = this.rend.domElement.height;
    const obj = new THREE.Color(PAPEL);
    const aSRGB = v => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const o = [obj.r, obj.g, obj.b].map(v => Math.round(aSRGB(v) * 255));
    this.rend.setRenderTarget(null);
    this.rend.render(this.esc, this.cam);
    const buf = new Uint8Array(4);
    const puntos = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.round(3 + (W - 7) * i / 4);
      puntos.push([x, 3], [x, H - 4]);
    }
    for (let i = 1; i < 4; i++) {
      const y = Math.round(3 + (H - 7) * i / 4);
      puntos.push([3, y], [W - 4, y]);
    }
    let peor = 0, dondePeor = null;
    const muestras = [];
    for (const [x, y] of puntos) {
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      const d = Math.max(Math.abs(buf[0] - o[0]), Math.abs(buf[1] - o[1]), Math.abs(buf[2] - o[2]));
      muestras.push({ x, y, rgb: [buf[0], buf[1], buf[2]], desvio: d });
      if (d > peor) { peor = d; dondePeor = [x, y]; }
    }
    return { objetivo: o, peor_desvio_255: peor, donde: dondePeor, puntos: muestras.length, muestras };
  }

  /* ── seleccion ───────────────────────────────────────────────────────── */
  seleccionar(id) {
    if (id === this.sel) return;
    this.sel = id;
    this.t0 = performance.now();
    /* Cambiar de frasco devuelve el giro a cero: el que se va no se queda
       torcido a tus espaldas. */
    this.giro.az = 0; this.giro.incl = 0; this.giro.vaz = 0; this.giro.vincl = 0;
    this.ultimoToque = 0;
    this.pista.hecha = false;      // el nuevo elegido tiene su propia pista
  }

  /* ── el bucle ────────────────────────────────────────────────────────── */
  paso(ahora) {
    const av = Math.min(1, (ahora - this.t0) / MOV.transicion);
    const k = CURVA(av);

    /* la pista: un vaiven de 10 grados, UNA vez, al entrar en pantalla */
    let pistaAz = 0;
    if (this.pista.t0) {
      const p = (ahora - this.pista.t0) / 900;
      if (p >= 1) { this.pista.t0 = 0; this.pista.hecha = true; }
      else pistaAz = Math.sin(p * Math.PI * 2) * MOV.vaiven * Math.PI / 180 * (1 - p);
    }

    /* inercia del giro libre + vuelta a reposo */
    if (!this.arrastrando) {
      this.giro.az += this.giro.vaz;
      this.giro.incl += this.giro.vincl;
      this.giro.vaz *= MOV.amortiguacion;
      this.giro.vincl *= MOV.amortiguacion;
      if (Math.abs(this.giro.vaz) < 1e-5) this.giro.vaz = 0;
      if (Math.abs(this.giro.vincl) < 1e-5) this.giro.vincl = 0;
      const quieto = this.ultimoToque && (ahora - this.ultimoToque) > MOV.reposo_ms;
      if (quieto && !this.giro.vaz && !this.giro.vincl) {
        /* 🔴 VUELVE POR EL CAMINO CORTO. Tras tres vueltas de arrastre el
           azimut vale 1.200 grados; volver «a cero» significaria desandar las
           tres vueltas delante del usuario. Se normaliza primero a la vuelta
           actual: el frasco se recoloca girando como mucho 180 grados, que es
           lo que hace una pieza al soltarla en la mano. */
        const T = Math.PI * 2;
        this.giro.az = ((this.giro.az % T) + T + Math.PI) % T - Math.PI;
        this.giro.az += (0 - this.giro.az) * MOV.lerp;
        this.giro.incl += (0 - this.giro.incl) * MOV.lerp;
        if (Math.abs(this.giro.az) < 1e-4) this.giro.az = 0;
        if (Math.abs(this.giro.incl) < 1e-4) this.giro.incl = 0;
      }
    }
    const lim = limitesInclinacion(this.cfg.camara.elevacion);
    this.giro.incl = Math.max(lim.min * Math.PI/180, Math.min(lim.max * Math.PI/180, this.giro.incl));

    for (const id of this.orden()) {
      const c = this.frascos[id];
      if (!c) continue;
      const esSel = id === this.sel;
      const f = c.userData.frasco;

      /* avance / retroceso: por el eje de la camara, para que «acercarse» sea
         acercarse a quien mira y no moverse a la derecha. */
      const objZ = this.sel == null ? 0
                 : (esSel ? MOV.avance : -MOV.retroceso) * this.dist;
      c.userData.z = c.userData.z === undefined ? 0 : c.userData.z;
      c.userData.z += (objZ - c.userData.z) * MOV.lerp;

      /* 🔴 AVANZA SOBRE EL PAPEL, NO POR EL EJE DE LA CAMARA.
         La primera version movia el frasco elegido a lo largo de la linea de
         vision, y como la camara esta 9 grados por encima del horizonte, eso
         lo SUBIA: el frasco se despegaba del papel y su sombra se quedaba
         abajo. Un producto flotando sobre su propia sombra es exactamente lo
         que la sesion 1 quito de la vitrina vieja — el pedestal y el frasco
         suspendido — y habria vuelto por la puerta de atras.

             Acercarse a quien mira no es levantarse. Sobre una mesa, un
             objeto se desliza; el que se eleva esta en otra clase de imagen.

         Asi que solo +Z, sobre el plano. Se acerca igual, se ve mas grande
         igual, y sigue apoyado. */
      c.position.z = c.userData.z;
      c.position.y = 0;

      /* giro: 15 grados hacia la camara al ser elegido, mas el giro libre */
      const objAz = esSel ? MOV.giro_sel * Math.PI / 180 : 0;
      c.userData.az = c.userData.az === undefined ? 0 : c.userData.az;
      c.userData.az += (objAz - c.userData.az) * MOV.lerp;

      f.rotation.set(0, 0, 0);
      f.position.set(0, 0, 0);
      const pv = f.userData.pivote;
      if (esSel && (this.giro.az || this.giro.incl || pistaAz)) {
        /* rotar alrededor de un pivote a media altura: bajar, girar, subir */
        f.position.y = pv;
        f.rotation.order = 'YXZ';
        f.rotation.y = c.userData.az + this.giro.az + pistaAz;
        f.rotation.x = this.giro.incl;
        f.translateY(-pv);
      } else {
        f.rotation.y = c.userData.az + (esSel ? pistaAz : 0);
      }

      /* presencia: TONO, no opacidad. Se baja el entorno que refleja y se
         acerca el color al papel. Un frasco medio transparente es un fallo;
         un frasco con menos luz encima es un frasco en segundo termino. */
      const objP = this.sel == null ? 0 : (esSel ? 0 : MOV.presencia);
      c.userData.p = c.userData.p === undefined ? 0 : c.userData.p;
      c.userData.p += (objP - c.userData.p) * MOV.lerp;
      this.aplicarPresencia(c, c.userData.p);

      /* EL LIQUIDO SE NIVELA. Se hace despues de mover y girar el frasco y
         antes de dibujar, porque el plano depende de la matriz del frasco
         YA colocado: hacerlo antes lo dejaria un fotograma por detras. */
      if (f.userData.liquido) {
        this.inclinacionLiquido = colocarPlano(
          f.userData.liquido, f, f.userData.nivelY,
          this.chapoteo[id], this.op.nivelado);
      }

      /* las dos sombras siguen al frasco, y se aflojan cuando se inclina:
         un frasco en la mano no deja la misma marca que uno apoyado. */
      const calcos = f.userData ? null : null;
      const dec = c.userData.frasco.userData.calcos;
      if (dec) {
        const inclina = Math.min(1, Math.abs(this.giro.incl) / (0.6));
        const op = this.cfg.luz.contacto_op * (1 - 0.55 * (esSel ? inclina : 0));
        dec.userData.sombra.material.opacity = op;
        dec.userData.caustica.material.opacity = this.cfg.luz.cau_int * (1 - 0.7 * (esSel ? inclina : 0));
        /* Ya no hace falta compensar la altura: el frasco no sube. La sombra
           acompana al frasco en Z, que es lo que hace un objeto que se
           desliza hacia ti sobre una mesa. */
        dec.position.y = 0;
      }
    }
    this.rend.render(this.esc, this.cam);
    return av;
  }

  aplicarPresencia(c, p) {
    if (Math.abs((c.userData.pAplicada || 0) - p) < 0.002) return;
    c.userData.pAplicada = p;
    const papelC = new THREE.Color(PAPEL);
    c.userData.frasco.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const m = o.material;
      if (!m.userData.base) {
        m.userData.base = { env: m.envMapIntensity, col: m.color ? m.color.clone() : null };
      }
      m.envMapIntensity = m.userData.base.env * (1 - 0.45 * p);
      /* 🔴 0,12 y no 0,30. `Color.lerp` interpola en LINEAL, no en sRGB: un
         0,30 lineal sobre el tapon #332C28 lo llevaba a #5D5853 — de casi
         negro a gris medio. Los tapones de los no elegidos salian lavados y
         parecia un fallo de material. En lineal, un numero pequeno ya es
         mucho: el ojo vive en sRGB y la aritmetica no. */
      if (m.userData.base.col) m.color.copy(m.userData.base.col).lerp(papelC, 0.12 * p);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     § GESTOS · LA REGLA DEL 29-AGO, QUE NO SE NEGOCIA

     EL SCROLL DE LA PAGINA NO SE BLOQUEA NUNCA.

     Y no se consigue con `preventDefault()` condicional, que es la trampa: para
     decidir si el gesto es horizontal hay que ver el primer movimiento, y para
     entonces el navegador ya ha decidido si desplaza o no. Se consigue al
     reves, declarandolo antes de que pase nada:

         touch-action: pan-y   en el lienzo (esta en el CSS, no aqui)

     Con eso el navegador se queda el desplazamiento vertical SIEMPRE, y a este
     codigo solo le llegan gestos que ya no son scroll. Lo que queda por decidir
     aqui es mas estrecho: de los gestos horizontales, cuales son giro.

       · un dedo, y solo si empieza SOBRE el frasco elegido, y solo si el
         primer movimiento es mas horizontal que vertical
       · dos dedos: jamas. Es un pellizco o un scroll a dos manos, y los dos
         son de la pagina
       · con raton no hay ambiguedad: el raton no desplaza la pagina arrastrando
     ═══════════════════════════════════════════════════════════════════════ */
  gestos() {
    const el = this.lienzo;
    const rc = new THREE.Raycaster();
    const v2 = new THREE.Vector2();
    let punt = new Map(), decidido = null, ini = null, ult = null;

    const sobreElegido = (ev) => {
      if (!this.sel) return false;
      const r = el.getBoundingClientRect();
      v2.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(v2, this.cam);
      const c = this.frascos[this.sel];
      if (!c) return false;
      /* Contra una caja generosa, no contra la malla: el vidrio tiene huecos y
         un rayo que se cuela entre el tapon y el cuerpo diria «no le has dado»
         justo donde el dedo SI le ha dado. */
      const caja = new THREE.Box3().setFromObject(c.userData.frasco);
      caja.expandByScalar(Math.max(0.5, c.userData.frasco.userData.radio * 0.45));
      return rc.ray.intersectsBox(caja);
    };

    el.addEventListener('pointerdown', (ev) => {
      punt.set(ev.pointerId, ev);
      if (punt.size > 1) { this.soltar(el, punt); decidido = 'pagina'; return; }
      ini = { x: ev.clientX, y: ev.clientY, t: performance.now(), tipo: ev.pointerType };
      ult = { x: ev.clientX, y: ev.clientY };
      /* Con raton se decide ya; con dedo se espera al primer movimiento. */
      decidido = (ev.pointerType === 'mouse' && sobreElegido(ev)) ? 'giro'
               : (ev.pointerType === 'mouse' ? 'pagina' : null);
      if (decidido === 'giro') this.tomar(el, ev);
    });

    el.addEventListener('pointermove', (ev) => {
      if (!ini || punt.size > 1) return;
      const dx = ev.clientX - ini.x, dy = ev.clientY - ini.y;

      if (decidido === null) {
        if (Math.hypot(dx, dy) < 6) return;          // aun no hay gesto
        /* AQUI esta la decision, y solo se toma una vez por gesto. */
        decidido = (Math.abs(dx) > Math.abs(dy) * 1.25 && sobreElegido(ini.tipo ? { clientX: ini.x, clientY: ini.y } : ev))
                 ? 'giro' : 'pagina';
        if (decidido === 'giro') {
          this.tomar(el, ev);
        } else {
          return;    // de la pagina: ni un preventDefault, que siga su camino
        }
      }
      if (decidido !== 'giro') return;

      const mx = ev.clientX - ult.x, my = ev.clientY - ult.y;
      ult = { x: ev.clientX, y: ev.clientY };
      const r = el.getBoundingClientRect();
      const kaz = Math.PI * 2 / Math.max(240, r.width * 0.75);
      this.giro.az += mx * kaz;
      this.giro.incl += my * kaz * 0.8;
      this.giro.vaz = mx * kaz * 0.55;
      this.giro.vincl = my * kaz * 0.44;
      this.ultimoToque = performance.now();
      ev.preventDefault();
    });

    const fin = (ev) => {
      punt.delete(ev.pointerId);
      if (decidido === 'giro') { this.ultimoToque = performance.now(); }
      this.arrastrando = false;
      decidido = null; ini = null;
      if (el.hasPointerCapture && el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
    };
    el.addEventListener('pointerup', fin);
    el.addEventListener('pointercancel', fin);
    el.addEventListener('lostpointercapture', () => { this.arrastrando = false; });
  }

  /* El estado se pone SIEMPRE; la captura del puntero se intenta DESPUES.
     Al reves, un `setPointerCapture` que lanza —y lanza con cualquier puntero
     sintetico, o sea con todo lo que dispara el banco— aborta el manejador y
     deja `arrastrando` en false mientras el usuario esta arrastrando. Y no se
     traga el error: se anota, porque una salvaguarda muda es peor que ninguna. */
  tomar(el, ev) {
    this.arrastrando = true;
    this.giro.vaz = this.giro.vincl = 0;
    try { el.setPointerCapture(ev.pointerId); }
    catch (e) { this.sinCaptura = (this.sinCaptura || 0) + 1; }
  }

  soltar(el, punt) {
    this.arrastrando = false;
    for (const id of punt.keys())
      if (el.hasPointerCapture && el.hasPointerCapture(id)) el.releasePointerCapture(id);
  }

  lanzarPista() {
    if (this.pista.hecha || this.pista.t0 || !this.sel) return;
    this.pista.t0 = performance.now();
  }
}

/* ── sonda de reserva: hay WebGL2 de verdad? ───────────────────────────────
   No basta con que exista el contexto: un contexto que cae a software es peor
   que el poster, porque tarda y ademas se ve mal. */
export function hayWebGL2() {
  try {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!g) return false;
    const d = g.getExtension('WEBGL_debug_renderer_info');
    const nombre = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : '';
    return !/swiftshader|software|llvmpipe/i.test(nombre);
  } catch (e) { return false; }
}
