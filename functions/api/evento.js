
const EVENTOS_VALIDOS = [
  'clic_cta_auditoria',
  'clic_check_gratuito',
  'clic_demo_dashboard',
  'clic_caso_portfolio',
  'clic_newsletter',
  'clic_email',
  'envio_contacto',
  'envio_newsletter',
  'envio_auditoria',
  'uso_check_gratuito',
  'clic_hablemos',
  'scroll_25',
  'scroll_50',
  'scroll_75',
  'scroll_100',
  'tiempo_pagina',
  'vista_404',
];

const MAX = { pagina: 120, detalle: 60, sitio: 40 };

function limpiar(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}

const CABECERAS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CABECERAS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = JSON.parse((await request.text()) || '{}');
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: CABECERAS });
  }

  const evento = limpiar(body.evento, 40);
  if (!evento || EVENTOS_VALIDOS.indexOf(evento) === -1) {
    return new Response(null, { status: 204, headers: CABECERAS });
  }

  const registro = {
    evento,
    pagina: limpiar(body.pagina, MAX.pagina) || '/',
    detalle: limpiar(body.detalle, MAX.detalle),
    sitio: limpiar(body.sitio, MAX.sitio) || 'faro-web',
    ts: new Date().toISOString(),
  };

  if (!env || !env.EVENTOS) {
    console.error('[medicion] SIN ALMACEN: falta el enlace KV `EVENTOS`. Evento perdido:', registro.evento);
    return new Response(null, { status: 204, headers: CABECERAS });
  }

  const dia = registro.ts.slice(0, 10);
  const clave = `${dia}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await env.EVENTOS.put(clave, JSON.stringify(registro));
  } catch (e) {
    console.error('[medicion] NO se ha guardado el evento:', e && e.message);
  }
  return new Response(null, { status: 204, headers: CABECERAS });
}
