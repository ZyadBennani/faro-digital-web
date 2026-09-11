
function normalizeUrl(input) {
  let url = String(input || '').trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'FaroDigitalAuditBot/1.0 (+https://faro-digital.pages.dev)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(res, maxBytes) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let total = 0;
  let html = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    html += decoder.decode(value, { stream: true });
    if (total >= maxBytes) {
      try { await reader.cancel(); } catch (e) {}
      break;
    }
  }
  return html;
}

function decodeEntities(s) {
  if (!s) return s;
  const NOMBRES = { lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', amp: '&' };
  return s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|(lt|gt|quot|apos|nbsp|amp));/g,
    (todo, dec, hex, nombre) => {
      try {
        if (dec) return String.fromCodePoint(parseInt(dec, 10));
        if (hex) return String.fromCodePoint(parseInt(hex, 16));
        return NOMBRES[nombre];
      } catch (e) { return todo; }
    });
}

function extractTag(html, regex) {
  const m = html.match(regex);
  return m ? decodeEntities(m[1].trim()) : null;
}

function countMatches(html, regex) {
  const m = html.match(regex);
  return m ? m.length : 0;
}

async function analyze(inputUrl) {
  const url = normalizeUrl(inputUrl);
  let finalUrl = url;
  let html = '';
  let fetchError = null;

  try {
    const res = await fetchWithTimeout(url, 8000);
    finalUrl = res.url || url;
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      fetchError = `La web respondió con un error (código ${res.status}).`;
    } else if (!contentType.includes('text/html')) {
      fetchError = 'Esa dirección no parece devolver una página web (HTML).';
    } else {
      html = await readCapped(res, 1_500_000);
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      fetchError = 'La web tardó demasiado en responder (más de 8 segundos).';
    } else {
      fetchError = 'No hemos podido acceder a esa dirección. Revisa que la URL sea correcta.';
    }
  }

  if (fetchError) {
    return { url: finalUrl, ok: false, error: fetchError, checks: [] };
  }

  const isHttps = finalUrl.startsWith('https://');
  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || extractTag(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
  const structuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const favicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);
  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  const bloquesLd = (html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []).join(' ');

  const tipoNegocio = /"@type"\s*:\s*"(LocalBusiness|Organization|ProfessionalService|Store|Restaurant|HealthAndBeautyBusiness|BeautySalon|HairSalon|Dentist|MedicalBusiness|FoodEstablishment|Bakery|CafeOrCoffeeShop)"/i.test(bloquesLd);
  const tieneNombre = /"name"\s*:\s*"[^"]{2,}"/i.test(bloquesLd);
  const geoNegocio = tipoNegocio && tieneNombre;

  const dirSchema = /"address"\s*:/i.test(bloquesLd)
    || /"streetAddress"\s*:/i.test(bloquesLd)
    || /"addressLocality"\s*:/i.test(bloquesLd)
    || /"areaServed"\s*:/i.test(bloquesLd);
  const dirTexto = /\b\d{5}\b[^<]{0,40}(Barcelona|Madrid|Valencia|Sevilla|Bilbao|Málaga|Zaragoza)/i.test(html);
  const tieneTel = /"telephone"\s*:/i.test(bloquesLd) || /href=["']tel:/i.test(html);
  const tieneEmail = /"email"\s*:/i.test(bloquesLd) || /href=["']mailto:/i.test(html)
    || /[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(html.replace(/<script[\s\S]*?<\/script>/gi, ' '));
  const geoDonde = (dirSchema || dirTexto) && (tieneTel || tieneEmail);

  const geoHorario = /"openingHours(Specification)?"\s*:/i.test(bloquesLd)
    || /\b(lunes|martes|miércoles|jueves|viernes|dilluns|dimarts)\b[^<]{0,60}\d{1,2}[:.]\d{2}/i.test(html);

  const faqSchema = /"@type"\s*:\s*"(FAQPage|Question)"/i.test(bloquesLd);
  const encabezadosPregunta = countMatches(html, /<h[2-4][^>]*>\s*[¿?]/gi);
  const geoPreguntas = faqSchema || encabezadosPregunta >= 2;

  const ogDesc = extractTag(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)
    || extractTag(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  const normal = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[«»"'.,;:!¡¿?—-]/g, '').trim();
  const geoCoherencia = !!description && !!ogDesc
    && (normal(description) === normal(ogDesc)
        || normal(description).slice(0, 60) === normal(ogDesc).slice(0, 60));

  const checks = [
    { id: 'https', label: 'Conexión segura (HTTPS)', pass: isHttps,
      note: isHttps ? 'La web carga por HTTPS.' : 'La web no fuerza HTTPS — algunos navegadores la marcan como "no segura".' },
    { id: 'title', label: 'Título de la página', pass: !!title && title.length >= 10 && title.length <= 65,
      note: !title ? 'No se ha encontrado etiqueta <title>.'
        : (title.length < 10 || title.length > 65) ? `Tiene título ("${title}"), pero con ${title.length} caracteres — lo ideal es entre 10 y 65.`
        : `Título correcto: "${title}".` },
    { id: 'description', label: 'Meta descripción', pass: !!description && description.length >= 50 && description.length <= 160,
      note: !description ? 'No tiene meta descripción — Google suele mostrar un fragmento aleatorio de la página en su lugar.'
        : (description.length < 50 || description.length > 160) ? `Tiene descripción, pero con ${description.length} caracteres — lo ideal es entre 50 y 160.`
        : 'Meta descripción presente y con buena longitud.' },
    { id: 'viewport', label: 'Adaptada a móvil', pass: viewport,
      note: viewport ? 'Tiene configuración de viewport para móvil.' : 'Falta la etiqueta viewport — riesgo real de verse mal en móvil.' },
    { id: 'social', label: 'Vista previa en redes (Open Graph)', pass: ogTitle && ogImage,
      note: (ogTitle && ogImage) ? 'Tiene título e imagen configurados para cuando se comparte en redes.'
        : 'Al compartir esta web en WhatsApp o LinkedIn, es probable que salga sin imagen o sin título — faltan etiquetas Open Graph.' },
    { id: 'structured-data', label: 'Datos estructurados (schema.org)', pass: structuredData,
      note: structuredData ? 'Tiene datos estructurados — ayuda a Google (y a la IA) a entender el negocio.' : 'No se han encontrado datos estructurados — una oportunidad real que casi nadie usa bien.' },
    { id: 'favicon', label: 'Icono de pestaña (favicon)', pass: favicon,
      note: favicon ? 'Tiene favicon configurado.' : 'No se ha encontrado favicon — detalle pequeño, pero se nota.' },
    { id: 'h1', label: 'Encabezado principal (H1)', pass: h1Count === 1,
      note: h1Count === 0 ? 'No se ha encontrado ningún H1 — Google usa esa etiqueta para entender el tema principal de la página.'
        : h1Count === 1 ? 'Tiene exactamente un H1, como se recomienda.'
        : `Tiene ${h1Count} etiquetas H1 — lo recomendable es una sola por página.` },
    { id: 'canonical', label: 'URL canónica', pass: canonical,
      note: canonical ? 'Tiene URL canónica definida.' : 'No tiene URL canónica — puede generar contenido duplicado a ojos de Google.' },

    { id: 'geo-negocio', grupo: 'geo', label: 'La web dice qué negocio es', pass: geoNegocio,
      note: geoNegocio ? 'Los datos estructurados identifican el negocio y su nombre — un asistente puede saber a qué te dedicas.'
        : 'No hay datos estructurados que digan qué tipo de negocio es. Tener un ld+json cualquiera no basta: hace falta que declare el negocio y su nombre.' },
    { id: 'geo-donde', grupo: 'geo', label: 'Dónde estás y cómo contactarte', pass: geoDonde,
      note: geoDonde ? 'Se pueden extraer la localidad y una forma de contacto sin interpretar nada.'
        : 'No se ha podido extraer la localidad o una forma de contacto (teléfono o email). Sin localidad, un asistente no puede recomendarte a quien busca «cerca de mí» — que es casi toda la búsqueda local.' },
    { id: 'geo-horario', grupo: 'geo', label: 'Horario publicado en la web', pass: geoHorario,
      note: geoHorario ? 'El horario está en la página, no solo en la ficha de Google.'
        : 'No se ha encontrado horario. Sin él, un asistente responde «consulta su web» — que es exactamente la respuesta que pierde al cliente.' },
    { id: 'geo-preguntas', grupo: 'geo', label: 'Preguntas respondidas', pass: geoPreguntas,
      note: geoPreguntas ? 'Hay preguntas con su respuesta — es el formato que un asistente cita casi literal.'
        : 'No se han encontrado preguntas respondidas (ni schema FAQ ni encabezados en forma de pregunta). Es el contenido más fácil de citar y casi nadie lo tiene.' },
    { id: 'geo-coherencia', grupo: 'geo', label: 'Dice lo mismo en todas partes', pass: geoCoherencia,
      note: geoCoherencia ? 'La descripción de la página y la de redes coinciden — la coherencia es lo que decide a quién cita una IA.'
        : 'La descripción para buscadores y la de redes no coinciden (o falta una). Google ha dicho que el GEO es SEO: lo que pesa es decir lo mismo en todos los sitios.' },
  ];

  checks.forEach((c) => { if (!c.grupo) c.grupo = 'seo'; });

  const passCount = checks.filter(c => c.pass).length;
  const geo = checks.filter(c => c.grupo === 'geo');
  const seo = checks.filter(c => c.grupo === 'seo');
  return {
    url: finalUrl, ok: true, error: null, checks,
    score: `${passCount}/${checks.length}`,
    scoreSeo: `${seo.filter(c => c.pass).length}/${seo.length}`,
    scoreGeo: `${geo.filter(c => c.pass).length}/${geo.length}`,
  };
}

const CABECERAS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CABECERAS });
}

export async function onRequestGet({ request }) {
  const target = new URL(request.url).searchParams.get('url') || '';
  if (!target || target.length > 300) {
    return new Response(JSON.stringify({ ok: false,
      error: 'Falta la URL a analizar, o es demasiado larga.' }),
      { status: 400, headers: CABECERAS });
  }
  try {
    return new Response(JSON.stringify(await analyze(target)),
      { status: 200, headers: CABECERAS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false,
      error: 'Algo ha fallado analizando esa direccion.' }),
      { status: 200, headers: CABECERAS });
  }
}
