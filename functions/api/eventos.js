
const CABECERAS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-panel-password',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CABECERAS });
}

export async function onRequestGet({ request, env }) {
  if (!env || !env.PANEL_FARO_PASSWORD) {
    return new Response(JSON.stringify({ ok: false,
      error: 'El lector no está configurado: falta la variable PANEL_FARO_PASSWORD en Cloudflare.' }),
      { status: 503, headers: CABECERAS });
  }
  if (request.headers.get('x-panel-password') !== env.PANEL_FARO_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: 'Contraseña incorrecta' }),
      { status: 401, headers: CABECERAS });
  }
  if (!env.EVENTOS) {
    return new Response(JSON.stringify({ ok: false,
      error: 'Falta el enlace KV `EVENTOS`: no hay dónde leer.' }),
      { status: 503, headers: CABECERAS });
  }

  const url = new URL(request.url);
  const desde = url.searchParams.get('desde') ||
    new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  try {
    const claves = [];
    let cursor;
    do {
      const pagina = await env.EVENTOS.list({ cursor });
      for (const k of pagina.keys) if (k.name.slice(0, 10) >= desde) claves.push(k.name);
      cursor = pagina.list_complete ? null : pagina.cursor;
    } while (cursor);

    const registros = await Promise.all(claves.map((k) => env.EVENTOS.get(k, { type: 'json' })));

    const porEvento = {}, porDia = {}, auditoriaPorPagina = {}, casosMasVistos = {};
    const hablemosPorOrigen = {};   // qué caso empuja a escribir
    const profundidad = {};         // dónde se abandona cada página
    const tiempoPorTramo = {};      // cuánto se queda quien se queda

    for (const r of registros) {
      if (!r || !r.evento) continue;
      porEvento[r.evento] = (porEvento[r.evento] || 0) + 1;
      const dia = (r.ts || '').slice(0, 10);
      if (dia) {
        porDia[dia] = porDia[dia] || {};
        porDia[dia][r.evento] = (porDia[dia][r.evento] || 0) + 1;
      }
      if (r.evento === 'clic_cta_auditoria') {
        const p = r.pagina || '/';
        auditoriaPorPagina[p] = (auditoriaPorPagina[p] || 0) + 1;
      }
      if (r.evento === 'clic_caso_portfolio' && r.detalle) {
        casosMasVistos[r.detalle] = (casosMasVistos[r.detalle] || 0) + 1;
      }
      if (r.evento === 'clic_hablemos' && r.detalle) {
        hablemosPorOrigen[r.detalle] = (hablemosPorOrigen[r.detalle] || 0) + 1;
      }
      if (r.evento.indexOf('scroll_') === 0) {
        const p = r.pagina || '/';
        profundidad[p] = profundidad[p] || {};
        profundidad[p][r.evento] = (profundidad[p][r.evento] || 0) + 1;
      }
      if (r.evento === 'tiempo_pagina' && r.detalle) {
        tiempoPorTramo[r.detalle] = (tiempoPorTramo[r.detalle] || 0) + 1;
      }
    }

    return new Response(JSON.stringify({
      ok: true, desde, total: registros.length,
      clicsEnPedirAuditoria: porEvento.clic_cta_auditoria || 0,
      formulariosEnviados: (porEvento.envio_contacto || 0) + (porEvento.envio_auditoria || 0),
      porEvento, auditoriaPorPagina, casosMasVistos, hablemosPorOrigen,
      profundidad, tiempoPorTramo, porDia,
      avisoSerie: 'Serie iniciada el 1-sep-2026 al mover el sitio a Cloudflare. ' +
        'Los eventos anteriores siguen en Netlify y no están incluidos.',
      aviso: 'Un clic en el CTA no es un contacto: mide intención. El envío de ' +
        'formulario sí es una conversión real. Y no se mide nada que identifique ' +
        'a nadie, así que no se puede seguir a una persona entre visitas — es ' +
        'deliberado, no una limitación.',
    }), { status: 200, headers: CABECERAS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'No se ha podido leer el almacén.' }),
      { status: 500, headers: CABECERAS });
  }
}
