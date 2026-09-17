/* ═══════════════════════════════════════════════════════════════════════════
   AURA · LA ESCENA Y EL BANCO
   Monta los tres frascos sobre papel, calibra el papel MIDIENDOLO, y expone
   window.AURA para que el panel y el guion de Python pidan renders.

   🔴 EL PAPEL SE CALIBRA, NO SE ELIGE
   base.css dice que papel es #F5EFE4. Con tonemapping ACES un material de ese
   color NO sale de ese color: sale de lo que la luz y la curva decidan. Escribir
   el hex y darlo por bueno es el falso verde de siempre. Aqui el suelo se ajusta
   en bucle hasta que el pixel RENDERIZADO es #F5EFE4, y el desvio se imprime.
   Si no converge, se dice — no se calla.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from './tres/three.module.min.js';
import {
  AJUSTES, PAPEL, construirEntorno, construirFrasco, calcomanias,
  texturaSombra, texturaCaustica, dirDeAngulos, equirectCrudo,
  cargarFuentes, svgEtiqueta, texturaDesdeSVG, comprobarEtiqueta
} from './frasco.js';

const SENSOR = 24;            // mm. Altura del cuadro de 35 mm: la focal es vertical.
const ORDEN = ['crema', 'serum', 'bruma'];   // de menor a mayor. La lista de precios va igual.

export const ENCUADRES = {
  'serum-frontal':   { sujeto: 'serum',  w: 1600, h: 2000, margen: 1.34 },
  'crema-frontal':   { sujeto: 'crema',  w: 1600, h: 2000, margen: 1.52 },
  'bruma-frontal':   { sujeto: 'bruma',  w: 1600, h: 2000, margen: 1.30 },
  'familia':         { sujeto: 'todos',  w: 2000, h: 1250, margen: 1.34 },
    /* El detalle de base sube a 17 grados. A la altura de los demas encuadres el
     charco de luz que deja la base gruesa queda DETRAS del propio frasco y el
     render no ensena lo unico que ha ido a buscar. Un encuadre que no deja ver
     su asunto no es un encuadre apretado: es el encuadre equivocado. */
  'detalle-base':    { sujeto: 'serum',  w: 2000, h: 1400, margen: 1.00, detalle: true, elev: 17 },
  'control-negativo':{ sujeto: 'serum',  w: 1600, h: 2000, margen: 1.34 },
  'vitrina-reposo':  { sujeto: 'todos',  w: 1440, h: 900,  margen: 1.30, vitrina: true, papelPlano: true },
  'vitrina-serum':   { sujeto: 'todos',  w: 1440, h: 900,  margen: 1.30, vitrina: true, sel: 'serum', papelPlano: true }
};

export class Banco {
  constructor(lienzo, datos) {
    this.datos = datos;
    this.cfg = JSON.parse(JSON.stringify(AJUSTES));
    this.notas = [];

    this.renderer = new THREE.WebGLRenderer({
      canvas: lienzo,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,   // sin esto, toDataURL devuelve negro a veces
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.cfg.camara.exposicion;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    /* Se probaron los dos. PCFSoft dejaba un paralelogramo de canto casi recto;
       VSM lo desenfocaba tanto que la sombra desaparecia y el frasco volvia a
       flotar. Ninguno de los dos da, por si solo, la sombra de una foto de
       producto — que es oscura y apretada donde el objeto toca y se abre y
       aclara al alejarse.

           Lo que hace una sombra creible no es el filtro del mapa: son DOS
           sombras. La proyectada, que dice hacia donde va la luz, y la de
           contacto, que dice que el objeto esta apoyado. Cada una sabe una
           cosa que la otra no.

       Asi que: PCFSoft con radio corto para la proyectada, y una calcomania de
       contacto estirada en la direccion de la luz para el apoyo. */
    /* VSM, en la segunda vuelta. La primera vez se probo y la sombra
       desaparecia — pero eso no era culpa de VSM: el papel estaba encendido por
       `emissive` y no habia nada que oscurecer (ver el comentario de la
       calibracion). Con la luz arreglada, VSM da lo que PCFSoft no puede: un
       borde que se ABRE con la distancia. En PCFSoft el radio son unos pocos
       texeles y se acabo; el resultado era un poligono gris de canto recto. */
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color(PAPEL);

    this.camara = new THREE.PerspectiveCamera(this.fov(), 1, 5, 9000);

    /* El suelo. Enorme a proposito: con focal larga y 9,5 grados de elevacion el
       horizonte queda JUSTO fuera del cuadro por arriba, y un plano corto
       ensenaria su borde dentro de la foto. 60 metros lo mandan fuera. */
    this.suelo = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(PAPEL), roughness: 0.94, metalness: 0 })
    );
    this.suelo.rotation.x = -Math.PI / 2;
    this.suelo.receiveShadow = true;
    this.escena.add(this.suelo);

    /* La caida de la luz sobre el papel va en el MAPA DEL SUELO, no en un plano
       encima. El primer intento fue un plano oscurecedor de 3,2 m y dejo UNA
       LINEA HORIZONTAL atravesando el papel: el borde del plano, donde el
       oscurecimiento pasaba de 0,14 a 0 de golpe.

           Un plano que oscurece termina en alguna parte, y ese final se ve.
           Una textura con los bordes fijados (ClampToEdge) no termina nunca:
           el ultimo texel se repite hasta el infinito.

       Y esto NO es un degradado de fondo —lo prohibido—: es que un foco de
       estudio no ilumina cuatro metros de papel por igual. Sin esa caida el
       papel se lee como un relleno plano y el frasco parece recortado y pegado
       encima. */
    this.POOL = 40;               // centimetros de ancho del charco de luz
    this._caida = null;
    this.aplicarPapel();

    this.clave = new THREE.DirectionalLight(0xfff0dc, this.cfg.luz.clave_dir);
    this.clave.castShadow = true;
    /* 🔴 EL MAPA DE SOMBRA ES PEQUENO A PROPOSITO: 512.
       El desenfoque de VSM se mide en TEXELES del mapa, no en centimetros. Con
       4096 texeles sobre 24 cm cada texel mide 0,006 cm, y un radio de 6 da 0,04
       cm de penumbra: cero. La sombra salia de canto recto y se probaron cuatro
       ajustes distintos contra ese fantasma antes de hacer la cuenta.

           Subir la resolucion del mapa ENDURECE la sombra. Es al reves de lo
           que dice el instinto, y es aritmetica: mas texeles, texeles mas
           pequenos, penumbra mas corta.

       Con 512 texeles cada uno mide 0,047 cm y un radio de 40 da ~1,9 cm de
       penumbra, que es lo que tiene la sombra de un frasco a 30 grados de luz. */
    this.clave.shadow.mapSize.set(512, 512);
    this.clave.shadow.radius = this.cfg.luz.sombra_radio;
    this.clave.shadow.blurSamples = 24;
    this.clave.shadow.bias = 0;
    this.clave.shadow.normalBias = 0.02;
    this.escena.add(this.clave);
    this.escena.add(this.clave.target);

    this.texSombra = texturaSombra();
    this.texCau = texturaCaustica();

    this.grupos = {};
    this.deco = {};
    this.raiz = new THREE.Group();
    this.escena.add(this.raiz);
  }

  fov() {
    return 2 * Math.atan((SENSOR / 2) / this.cfg.camara.focal) * 180 / Math.PI;
  }

  /* Blanco en el centro —ahi manda el papel calibrado— cayendo hacia fuera. Con
     wrapS/wrapT fijados al borde, mas alla de la textura el papel se queda en el
     valor del ultimo texel: uniforme hasta el horizonte, sin una sola linea. */
  texPapel(caida) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const v = Math.round(255 * (1 - caida));
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0.00, 'rgb(255,255,255)');
    g.addColorStop(0.22, 'rgb(255,255,255)');
    g.addColorStop(0.62, 'rgb(' + Math.round(255 - (255 - v) * 0.55) + ',' + Math.round(255 - (255 - v) * 0.55) + ',' + Math.round(255 - (255 - v) * 0.52) + ')');
    g.addColorStop(1.00, 'rgb(' + v + ',' + v + ',' + Math.round(v * 1.01) + ')');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    /* 🔴 SIN MIPMAPS. Con repeat 150 el charco ocupa 1/150 de la UV del plano:
       el GPU elige un nivel de mipmap donde los 40 cm de charco estan
       promediados con los 60 metros de papel, y la caida DESAPARECE. Medido: el
       centro del charco y la esquina lejana daban el mismo (235,231,219), o sea
       cero caida, mientras el codigo decia que habia un 14 %. */
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    const rep = 6000 / this.POOL;
    t.repeat.set(rep, rep);
    t.offset.set(-(rep - 1) / 2, -(rep - 1) / 2);
    return t;
  }

  aplicarPapel() {
    const caida = this.cfg.luz.vineta;
    if (this._caida === caida) return;
    if (this.suelo.material.map) this.suelo.material.map.dispose();
    this.suelo.material.map = this.texPapel(caida);
    this.suelo.material.needsUpdate = true;
    this._caida = caida;
  }

  async montar() {
    await cargarFuentes();
    this.entorno = construirEntorno(this.renderer, this.cfg);
    this.escena.environment = this.entorno;

    for (const def of this.datos.frascos) {
      const svg = svgEtiqueta(def, { modo: this.cfg.material.etiqueta_modo });
      const tex = await texturaDesdeSVG(svg);
      const chequeo = comprobarEtiqueta(tex, def);
      this.notas.push({ etiqueta: def.nombre, ...chequeo });
      const g = construirFrasco(def, this.datos, this.cfg, tex);
      const d = calcomanias(g, this.cfg, this.texSombra, this.texCau);
      this.grupos[def.id] = g;
      this.deco[def.id] = d;
      this.raiz.add(g);
      this.raiz.add(d);
    }
    this.colocar();
    this.aplicarLuz();
    return this.notas;
  }

  /* Los tres EN UNA LINEA, misma base, mismo horizonte. Nada flota, nada se
     desenfoca, no hay pedestal. Las separaciones se calculan de los radios: a
     ojo, un frasco ancho se come el hueco del de al lado. */
  colocar() {
    const HUECO = 2.2;
    let x = 0;
    const pos = {};
    ORDEN.forEach((id, i) => {
      const r = this.grupos[id].userData.radio;
      if (i > 0) x += r;
      pos[id] = x;
      x += r + HUECO;
    });
    const min = pos[ORDEN[0]] - this.grupos[ORDEN[0]].userData.radio;
    const max = pos[ORDEN[2]] + this.grupos[ORDEN[2]].userData.radio;
    const centro = (min + max) / 2;
    ORDEN.forEach(id => {
      this.grupos[id].position.x = pos[id] - centro;
      this.deco[id].position.x = pos[id] - centro;
    });
    this.ancho = max - min;
  }

  aplicarLuz() {
    const c = dirDeAngulos(this.cfg.entorno.clave_az, this.cfg.entorno.clave_el);
    const D = 40;
    this.clave.position.set(c[0] * D, c[1] * D, c[2] * D);
    this.clave.target.position.set(0, 2, 0);
    this.clave.intensity = this.cfg.luz.clave_dir;
    this.clave.shadow.radius = this.cfg.luz.sombra_radio;
    const L = this.cfg.luz.sombra_lado;
    const s = this.clave.shadow.camera;
    s.left = -L; s.right = L; s.top = L; s.bottom = -L; s.near = 1; s.far = 120;
    s.updateProjectionMatrix();
    this.renderer.toneMappingExposure = this.cfg.camara.exposicion;
    this.aplicarPapel();
    for (const id in this.deco) {
      const d = this.deco[id];
      const r = this.grupos[id].userData.radio;
      d.userData.sombra.material.opacity = this.cfg.luz.contacto_op;
      d.userData.caustica.material.opacity = this.cfg.luz.cau_int;
      /* 🔴 POSICION LOCAL, SIN SUMAR LA DEL GRUPO. La calcomania cuelga del
         grupo de decoracion, que YA esta movido a la x del frasco: sumarle otra
         vez esa x deja la caustica al doble de distancia. Se veia en los
         renders del 17-sep como una mancha calida suelta en la esquina de
         abajo a la izquierda, lejos de cualquier frasco — y se leia como un
         destello de lente, que es justo lo contrario de lo que hace.

             Una posicion relativa sumada a la absoluta no esta «un poco
             corrida»: esta al doble. Y con tres objetos, dos fallan y el
             del centro sale bien, que es lo que hace que no se vea. */
      d.userData.caustica.position.set(
        -c[0] * r * this.cfg.luz.cau_desp,
        0.006,
        -c[2] * r * this.cfg.luz.cau_desp
      );
    }
  }

  /* Reconstruye entorno, geometria y materiales con los ajustes actuales.
     Se llama cuando el panel toca algo que no es solo una posicion. */
  async rehacer() {
    for (const id in this.grupos) { this.raiz.remove(this.grupos[id]); this.raiz.remove(this.deco[id]); }
    this.grupos = {}; this.deco = {}; this.notas = [];
    if (this.entorno) this.entorno.dispose();
    this.camara.fov = this.fov();
    this.camara.updateProjectionMatrix();
    await this.montar();
  }

  /* ── ENCUADRE ──────────────────────────────────────────────────────────── */
  encuadrar(nombre, w, h) {
    const e = ENCUADRES[nombre];
    const aspecto = w / h;
    let cx = 0, cy = 0, alto, ancho;

    if (e.detalle) {
      const g = this.grupos[e.sujeto];
      cx = g.position.x; cy = 1.30; alto = 5.6; ancho = alto * aspecto;
    } else if (e.sujeto === 'todos') {
      let maxA = 0;
      ORDEN.forEach(id => { maxA = Math.max(maxA, this.grupos[id].userData.altura); });
      alto = maxA * e.margen;
      ancho = Math.max(this.ancho * e.margen, alto * aspecto);
      cy = maxA * 0.42;
    } else {
      const g = this.grupos[e.sujeto];
      cx = g.position.x;
      alto = g.userData.altura * e.margen;
      ancho = Math.max(g.userData.radio * 2 * e.margen * 1.35, alto * aspecto);
      cy = g.userData.altura * 0.42;
    }

    /* El cuadro se ajusta al lado que MANDA. Si el ancho pedido no cabe en el
       alto por la relacion de aspecto, manda el ancho: es el fallo clasico de
       recortar al sujeto por los lados sin que nadie lo vea hasta el PNG. */
    const altoNecesario = Math.max(alto, ancho / aspecto);
    const fovRad = this.camara.fov * Math.PI / 180;
    const d = (altoNecesario / 2) / Math.tan(fovRad / 2);

    const E = (e.elev || this.cfg.camara.elevacion) * Math.PI / 180;
    this.camara.aspect = aspecto;
    this.camara.position.set(cx, cy + d * Math.sin(E), d * Math.cos(E));
    this.camara.lookAt(cx, cy, 0);
    this.camara.updateProjectionMatrix();
    return { distancia: d, altoCuadro: altoNecesario };
  }

  /* ── CALIBRACION DEL PAPEL ─────────────────────────────────────────────────
     Mide el pixel de una esquina (papel desnudo) y corrige el color del suelo
     hasta clavar #F5EFE4. Devuelve el desvio final: si es alto, se dice. */
  calibrarPapel(pasos, tolerancia) {
    const objetivo = new THREE.Color(PAPEL);
    const objSRGB = [objetivo.r, objetivo.g, objetivo.b].map(v =>
      v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    /* 🔴 SE MIDE EL LIENZO, NO UN RENDER TARGET. Esto costo tres renders.
       La primera version calibraba contra un WebGLRenderTarget y cantaba
       «papel #F6EFE4, desvio 1/255». El PNG que salia por la puerta tenia el
       papel en (212,209,206): GRIS NEUTRO, 33 puntos por debajo y sin una gota
       del crema de la marca. Los dos numeros eran ciertos y median cosas
       distintas: a un render target no se le aplican el tonemapping ni la
       conversion de espacio de color que si se aplican al lienzo.

           Un medidor que no lee por donde sale la imagen no mide la imagen.
           Y cuando ademas converge, firma un verde que no existe.

       Asi que se renderiza al lienzo de verdad, en pequeno, y se leen sus
       pixeles con readPixels sobre el framebuffer por defecto — que es lo que
       toDataURL va a escribir en el PNG. */
    const gl = this.renderer.getContext();
    const buf = new Uint8Array(4);
    /* El charco se apaga para medir: si no, se estaria calibrando el papel
       contra una version ya oscurecida de si mismo y el papel real acabaria por
       encima de #F5EFE4 sin que nadie lo notara. Se calibra el CENTRO del
       charco, que es donde se apoya el producto. */
    const mapa0 = this.suelo.material.map;
    this.suelo.material.map = null;
    this.suelo.material.needsUpdate = true;
    let desvio = 1, leido = null;

    /* La ganancia puede pasar de 1: ACES baja el papel por debajo de su propio
       albedo, y con el albedo topado en 1 no habia forma de subirlo. Lo que pasa
       de 1 va a `emissive`, que es lo que en un plato hace la LUZ DE FONDO: un
       foco que ilumina solo el papel y no toca al producto. */
    const base = new THREE.Color(PAPEL);
    const gan = this.suelo.userData.ganancia || [1, 1, 1];
    const lee = () => {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.escena, this.camara);
      const alto = this.renderer.domElement.height;
      gl.readPixels(4, alto - 5, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return [buf[0] / 255, buf[1] / 255, buf[2] / 255];
    };
    const aplicar = () => {
      const m = this.suelo.material;
      m.color.setRGB(Math.min(1, base.r * gan[0]), Math.min(1, base.g * gan[1]), Math.min(1, base.b * gan[2]));
      /* 🔴 `emissive` ES EL ULTIMO RECURSO, Y SE DICE CUANDO SE USA.
         Un suelo que brilla por emision NO RECIBE SOMBRA: la emision se suma
         despues de la iluminacion y ninguna sombra la puede apagar. Durante
         cuatro renders el papel estaba encendido casi entero por aqui, y por eso
         las sombras salian lavadas por mucho que se subiera la luz. Se ve en el
         numero: con emisiva a 0,4 la sombra proyectada casi no existia.

             Un fondo que se ilumina solo no se puede ensombrecer. Si el papel
             brilla por emision, la sombra del frasco no tiene nada que apagar.

         Ahora la luz clave lleva el peso (clave_dir 5,2) y la emision se queda
         en un residuo. `papel.emisiva` sale en el informe: si sube de 0,05, la
         sombra se esta lavando y hay que subir la clave, no la emision. */
      const ex = 0.18;
      m.emissive.setRGB(
        Math.max(0, base.r * gan[0] - 1) * ex,
        Math.max(0, base.g * gan[1] - 1) * ex,
        Math.max(0, base.b * gan[2] - 1) * ex
      );
    };

    for (let k = 0; k < (pasos || 8); k++) {
      aplicar();
      leido = lee();
      desvio = Math.max(
        Math.abs(leido[0] - objSRGB[0]),
        Math.abs(leido[1] - objSRGB[1]),
        Math.abs(leido[2] - objSRGB[2])
      );
      if (desvio < (tolerancia || 0.004)) break;
      for (let i = 0; i < 3; i++) {
        const f = leido[i] > 0.02 ? Math.min(1.5, Math.max(0.7, objSRGB[i] / leido[i])) : 1.3;
        gan[i] = Math.min(6, Math.max(0.3, gan[i] * Math.pow(f, 2.0)));
      }
    }
    this.suelo.userData.ganancia = gan;
    this.suelo.material.map = mapa0;
    this.suelo.material.needsUpdate = true;
    const hex = '#' + [0, 1, 2].map(i => Math.round(leido[i] * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    const em = this.suelo.material.emissive;
    return { desvio: +(desvio * 255).toFixed(1), leido: hex, objetivo: '#F5EFE4',
             emisiva: +Math.max(em.r, em.g, em.b).toFixed(3),
             albedo: +Math.max.apply(null, [this.suelo.material.color.r, this.suelo.material.color.g, this.suelo.material.color.b]).toFixed(3) };
  }

  /* ── ESTADO DE LA VITRINA (para las maquetas del §3) ────────────────────
     El elegido avanza 12 % y gira 15 grados hacia la camara. Los otros dos
     retroceden 6 % y bajan a 70 % de PRESENCIA — tono, no opacidad: un producto
     medio transparente se lee como un fallo de carga, que es justo lo que el
     jurado ya castigo el 17-sep. */
  seleccion(id) {
    ORDEN.forEach(k => {
      const g = this.grupos[k], d = this.deco[k];
      const elegido = (k === id);
      const e = id ? (elegido ? 1.12 : 0.94) : 1.0;
      g.scale.setScalar(e);
      d.scale.setScalar(e);
      g.rotation.y = elegido ? (15 * Math.PI / 180) : 0;
      g.position.z = elegido ? 0.9 : (id ? -0.5 : 0);
      d.position.z = g.position.z;
      const presencia = (!id || elegido) ? 1.0 : 0.70;
      g.traverse(o => {
        if (!o.material) return;
        if (o.material.envMapIntensity !== undefined) {
          if (o.userData.env0 === undefined) o.userData.env0 = o.material.envMapIntensity;
          o.material.envMapIntensity = o.userData.env0 * (0.55 + 0.45 * presencia);
        }
        if (o.name === 'etiqueta' && o.material.opacity !== undefined) {
          o.material.opacity = presencia;
        }
      });
      d.userData.sombra.material.opacity = this.cfg.luz.contacto_op * (0.6 + 0.4 * presencia);
      d.userData.caustica.material.opacity = this.cfg.luz.cau_int * presencia;
    });
  }

  /* En un retrato de UN producto los otros dos no estan «fuera de cuadro»: estan
     dentro, asomando por los bordes. Se vio en la hoja de contactos del 17-sep —
     medio ALBA colandose en la foto de VELO— y es de los errores que no se ven
     mirando el visor, porque el visor esta encuadrado a los tres. */
  soloSujeto(id) {
    for (const k in this.grupos) {
      const v = !id || k === id;
      this.grupos[k].visible = v;
      this.deco[k].visible = v;
    }
  }

  render(nombre) {
    const e = ENCUADRES[nombre];
    if (!e) throw new Error('encuadre desconocido: ' + nombre);
    const guardar = { w: this.renderer.domElement.width, h: this.renderer.domElement.height };
    this.renderer.setSize(e.w, e.h, false);
    this.soloSujeto(e.sujeto === 'todos' ? null : e.sujeto);
    /* 🔴 EN LA VITRINA EL PAPEL VA PLANO. El charco de luz que hace que un
       retrato de producto respire deja, dentro de una PAGINA, un rectangulo
       visible: el render se ve como una foto pegada encima del papel, con sus
       cuatro esquinas mas oscuras que la seccion. Se vio en la primera maqueta.

           Un fondo que en una foto es luz, dentro de una pagina es un borde.

       En la version viva de la sesion 2 esto no existe —el lienzo sera
       transparente y el papel lo pinta la pagina—, pero la maqueta es un PNG y
       tiene que casar. Asi que para los dos estados de vitrina el charco se
       aplana casi del todo y se restaura al salir. */
    const caida0 = this.cfg.luz.vineta;
    if (e.papelPlano) { this.cfg.luz.vineta = 0.015; this.aplicarPapel(); this.calibrarPapel(14, 0.0018); }
    if (e.vitrina) this.seleccion(e.sel || null); else this.seleccion(null);
    const enc = this.encuadrar(nombre, e.w, e.h);
    this.renderer.render(this.escena, this.camara);
    const url = this.renderer.domElement.toDataURL('image/png');
    if (e.papelPlano) { this.cfg.luz.vineta = caida0; this.aplicarPapel(); this.calibrarPapel(5); }
    this.soloSujeto(null);
    this.renderer.setSize(guardar.w, guardar.h, false);
    return { url, w: e.w, h: e.h, encuadre: enc };
  }

  /* El control negativo NO es un ajuste del panel que alguien pueda olvidar
     puesto: es un modo que se enciende, se renderiza y se apaga, en la misma
     llamada. Asi no se puede quedar encendido por accidente. */
  async renderControlNegativo() {
    this.cfg.material.control_negativo = true;
    await this.rehacer();
    this.calibrarPapel(4);
    const r = this.render('control-negativo');
    this.cfg.material.control_negativo = false;
    await this.rehacer();
    this.calibrarPapel(4);
    return r;
  }

  /* Vuelca el entorno REAL —los mismos floats que se van al PMREM— a un PNG con
     una curva de tono, para poder mirarlo. Sirve para contestar «¿que esta
     reflejando el vidrio?» sin suponerlo. */
  volcarEntorno() {
    const { W, H, datos } = equirectCrudo(this.cfg);
    const c = document.createElement('canvas');
    c.width = W * 2; c.height = H * 2;
    const x = c.getContext('2d');
    const img = x.createImageData(W, H);
    const tm = q => Math.round(255 * Math.pow(Math.min(1, q / (q + 1) * 1.25), 1 / 2.2));
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const o = ((H - 1 - j) * W + i) * 4, p = (j * W + i) * 4;
        img.data[p] = tm(datos[o]); img.data[p + 1] = tm(datos[o + 1]);
        img.data[p + 2] = tm(datos[o + 2]); img.data[p + 3] = 255;
      }
    }
    const t = document.createElement('canvas'); t.width = W; t.height = H;
    t.getContext('2d').putImageData(img, 0, 0);
    x.imageSmoothingEnabled = false;
    x.drawImage(t, 0, 0, W * 2, H * 2);
    let max = 0, suma = 0;
    for (let k = 0; k < datos.length; k += 4) { max = Math.max(max, datos[k]); suma += datos[k]; }
    return { url: c.toDataURL('image/png'), maxR: +max.toFixed(2), mediaR: +(suma / (datos.length / 4)).toFixed(3) };
  }

  parametros(nombre) {
    return {
      render: nombre,
      fecha: new Date().toISOString().slice(0, 10),
      motor: 'three.js autoalojado · MeshPhysicalMaterial transmission + PMREM Float32',
      unidades: 'centimetros',
      encuadre: ENCUADRES[nombre],
      ajustes: JSON.parse(JSON.stringify(this.cfg)),
      fov_grados: +this.fov().toFixed(2),
      papel: this.ultimaCalibracion || null,
      etiquetas: this.notas
    };
  }
}
