// Recuperación complementaria de contenido público en redes mediante Captapi.
// La clave se lee exclusivamente desde Vercel y nunca se envía al navegador.
import { threadsLinkType, threadsRetryRemaining, rememberThreadsRateLimit } from './threads-access.js';

const API_BASE = "https://api.captapi.com/v1";
const REQUEST_TIMEOUT_MS = 22000;
const DEFAULT_PROFILE_LIMIT = 20;
const DEFAULT_COMMENT_LIMIT = 20;
const MAX_SERIALIZED_CHARS = 32000;

// Casos públicos aportados por el usuario y reconstruidos mediante resultados
// indexados. Son datos de recuperación (texto, URLs y pistas), no veredictos.
const INDEXED_SOCIAL_EXAMPLES = {
  "7680293712575941895": {
    recuperacion: "OCR y copias públicas indexadas",
    texto_ocr: "¿CON RAZÓN VICENTE FOX ESTABA TAN METIDO EN EL DEBATE DEL HUACHICOL? RANCHO SAN CRISTÓBAL · CENTRO FOX",
    afirmacion_a_verificar: "La composición vincula o identifica el Rancho San Cristóbal cateado por combustible en Reynosa con el rancho de Vicente Fox y Centro Fox.",
    publicacion_matriz: "https://www.tiktok.com/@raytorresmax/photo/7680293712575941895",
    copias_exactas: [
      "https://www.facebook.com/groups/1099945933506382/posts/3573842642783353/",
      "https://www.facebook.com/groups/383904412584500/posts/1980611549580437/"
    ],
    publicaciones_relacionadas: [
      "https://www.facebook.com/GildoGarzaPeriodista/posts/-reynosa-rancho-san-crist%C3%B3bal-el-punto-que-ya-exist%C3%ADa-y-que-nadie-quiso-tocarcua/1558042042991139/",
      "https://www.facebook.com/valorxtamaulipasoficial/posts/reynosa-rancho-san-crist%C3%B3bal-empresas-combustible-y-cuatro-a%C3%B1os-de-silencio-ofic/1331132292381873/"
    ],
    fuentes_para_contrastar: [
      "https://www.centrofox.org.mx/aviso-de-privacidad/",
      "https://boletines.guanajuato.gob.mx/2017/06/27/presentan-san-cristobal-center-hotel-hacienda-san-cristobal-cdmx/",
      "https://expreso.press/2026/04/01/parque-industrial-bajo-sospecha/",
      "https://www.elmanana.com/local/reynosa/familia-layrisse-ramirez-obtiene-contratos-pemex-en-reynosa/6120533"
    ],
    advertencias: [
      "El OCR y las copias permiten identificar la afirmación, pero no equivalen a acceso directo al carrusel original.",
      "La repetición textual entre cuentas puede documentar amplificación; no demuestra por sí sola automatización, pago, instrucciones compartidas ni intención de mentir."
    ]
  }
};

// Evidencia pública complementaria para publicaciones de Threads cuyo video
// puede recuperarse, pero cuya identidad o contexto no aparecen en el pie de
// foto. Son pistas auditables para la investigación, nunca un veredicto fijo.
const INDEXED_THREADS_EXAMPLES = {
  'DdkTfdwElXL': {
    transcripcion_clave: 'No me ofende que me digan PRIAN. Soy producto de una coalición. Me ofendería si me dijeran narcosenadora.',
    hablante_atribuida_por_copias_publicas: 'Carolina Viggiano',
    fuentes_para_identificar_y_contextualizar: [
      'https://www.facebook.com/RadioFormulaMX/posts/no-me-ofende-que-me-digan-prian-soy-producto-de-una-coalici%C3%B3n-me-ofender%C3%ADa-si-me/1255003937088562/',
      'https://www.instagram.com/reel/DdkNZ7ogYae/',
      'https://centralelectoral.ine.mx/2024/04/05/consejo-local-del-ine-hidalgo-declara-improcedente-medidas-cautelares-en-contra-del-partido-morena/',
      'https://pri.org.mx/elpartidodemexico/saladeprensa/Nota.aspx?y=37562'
    ],
    advertencias: [
      'Las copias de Radio Fórmula ayudan a identificar a la hablante y la literalidad; no convierten en verdaderas acusaciones partidistas pronunciadas en el clip.',
      'Las fuentes del INE y del PRI permiten comprobar por separado la postulación en coalición; no acreditan etiquetas criminales o retóricas.'
    ]
  }
};

export function indexedThreadsEvidence(rawUrl) {
  try {
    const match = new URL(rawUrl).pathname.match(/^\/@[^/]+\/(?:post|video)\/([^/]+)/i);
    return match ? INDEXED_THREADS_EXAMPLES[match[1]] || null : null;
  } catch {
    return null;
  }
}

export function indexedTikTokPhotoEvidence(rawUrl) {
  try {
    const match = new URL(rawUrl).pathname.match(/^\/@[^/]+\/photo\/(\d+)\/?$/i);
    return match ? INDEXED_SOCIAL_EXAMPLES[match[1]] || null : null;
  } catch {
    return null;
  }
}

function platformFromUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "threads.com" || host === "threads.net") return "threads";
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") return "facebook";
    if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
    if (["x.com", "twitter.com", "mobile.twitter.com", "mobile.x.com"].includes(host)) return "twitter";
    return "";
  } catch {
    return "";
  }
}

function decodeHtmlUrl(value='') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/gi, '&')
    .replace(/&#38;/g, '&');
}

/**
 * Threads publica el video de cada post dentro de su vista /embed incluso
 * cuando la página normal requiere JavaScript o el proveedor externo no tiene
 * créditos. Esta ruta es pública y devuelve la URL temporal del MP4 alojado
 * por Meta. Solo aceptamos hosts de medios de Meta y nunca URLs tomadas del
 * texto del usuario.
 */
export async function extractThreadsEmbedMedia(rawUrl, {fetchImpl=fetch}={}) {
  if (threadsLinkType(rawUrl) !== 'post') return null;
  let source;
  try {
    source = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = source.hostname.toLowerCase().replace(/^www\./, '');
  if (!['threads.com','threads.net'].includes(host)) return null;
  source.hostname = `www.${host}`;
  source.pathname = `${source.pathname.replace(/\/+$/, '')}/embed`;
  source.search = '';
  source.hash = '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(source.toString(), {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; LaVerdadIncomoda/1.0; +https://www.laverdadincomoda.mx/)'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Threads embed HTTP ${response.status}`);
    const html = await response.text();
    const matches = html.match(/https:\/\/[^"'<>\\\s]+?\.mp4(?:\?[^"'<>\\\s]*)?/gi) || [];
    for (const encoded of matches) {
      try {
        const videoUrl = new URL(decodeHtmlUrl(encoded));
        const mediaHost = videoUrl.hostname.toLowerCase();
        const isMetaMedia = mediaHost.endsWith('.cdninstagram.com') || mediaHost.endsWith('.fbcdn.net');
        if (!isMetaMedia || mediaHost.startsWith('static.')) continue;
        return {
          tipo: 'video',
          video_url: videoUrl.toString(),
          url_embed: source.toString(),
          recuperacion: 'Vista pública embed de Threads',
          advertencia: 'La URL del medio es temporal; la transcripción debe realizarse durante esta consulta.',
          evidencia_indexada: indexedThreadsEvidence(rawUrl)
        };
      } catch {}
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isProfileUrl(rawUrl, platform) {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (!parts.length) return false;
    if (platform === "threads") return parts.length === 1 && parts[0].startsWith("@");
    if (platform === "tiktok") return parts.length === 1 && parts[0].startsWith("@");
    if (platform === "instagram") return parts.length === 1 && !["reel", "reels", "p", "stories", "share", "accounts", "explore"].includes(parts[0]);
    if (platform === "twitter") return parts.length === 1 && !["home", "i", "search", "intent", "share", "login"].includes(parts[0]);
    if (platform === "facebook") {
      if (url.hostname === "fb.watch") return false;
      if (parts[0] === "profile.php") return url.searchParams.has("id");
      return parts.length === 1 && !["watch", "reel", "reels", "share", "groups", "login", "login.php", "story.php", "permalink.php", "photo.php", "photo", "videos"].includes(parts[0]);
    }
    return false;
  } catch {
    return false;
  }
}

export function isTikTokPhotoPost(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (host === "tiktok.com" || host.endsWith(".tiktok.com")) &&
      /^\/@[^/]+\/photo\/\d+\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function tiktokPhotoReference(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(/^\/@([^/]+)\/photo\/(\d+)\/?$/i);
    if (!match) return null;
    const reference = {
      tipo: "publicacion_fotografica",
      cuenta: `@${match[1]}`,
      id_publicacion: match[2],
      url_canonica: `${url.origin}/@${match[1]}/photo/${match[2]}`,
      instruccion_recuperacion: "Buscar el identificador, la cuenta, el texto OCR y copias públicas indexadas; no tratar esta dirección como video ni como perfil."
    };
    const indexed = indexedTikTokPhotoEvidence(rawUrl);
    return indexed ? { ...reference, evidencia_indexada: indexed } : reference;
  } catch {
    return null;
  }
}

function profileLimitForFallback() {
  return boundedInteger(process.env.SOCIAL_PROFILE_POST_LIMIT, DEFAULT_PROFILE_LIMIT, 50);
}

function boundedInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(maximum, number));
}

function endpointRequests(platform, profile, rawUrl) {
  const profileLimit = boundedInteger(
    process.env.SOCIAL_PROFILE_POST_LIMIT,
    DEFAULT_PROFILE_LIMIT,
    50
  );
  const commentLimit = boundedInteger(
    process.env.SOCIAL_COMMENT_LIMIT,
    DEFAULT_COMMENT_LIMIT,
    50
  );

  if (platform === "facebook" && /^\/groups\/[^/]+\/?$/.test(new URL(rawUrl).pathname)) {
    return [["facebook/group-posts", { limit: Math.min(profileLimit, 5) }]];
  }

  if (profile) {
    const map = {
      threads: [
        ["threads/profile", {}],
        ["threads/user-posts", { limit: profileLimit }]
      ],
      tiktok: [
        ["tiktok/channel-details", {}],
        ["tiktok/channel-posts", { limit: profileLimit }]
      ],
      facebook: [
        ["facebook/page-details", {}],
        ["facebook/profile-posts", { limit: Math.min(profileLimit, 5) }]
      ],
      instagram: [
        ["instagram/channel-details", {}],
        ["instagram/channel-posts", { limit: Math.min(profileLimit, 5) }]
      ],
      twitter: [
        ["twitter/profile", {}],
        ["twitter/user-tweets", { limit: Math.min(profileLimit, 5) }]
      ]
    };
    return map[platform] || [];
  }

  const map = {
    threads: [["threads/post-details", {}]],
    tiktok: [
      ["tiktok/video-details", {}],
      ["tiktok/comments", { limit: commentLimit }],
      ["tiktok/transcript", {}]
    ],
    facebook: [
      ["facebook/details", {}],
      ["facebook/comments", { limit: Math.min(commentLimit, 5) }],
      ["facebook/summarize", {}]
    ],
    instagram: [
      ["instagram/details", {}],
      ["instagram/transcript", {}]
    ],
    twitter: [
      ["twitter/tweet-details", {}]
    ]
  };
  return map[platform] || [];
}

async function callCaptapi(apiKey, path, rawUrl, extraParams = {}) {
  if(path.startsWith('threads/') && threadsRetryRemaining('provider')) {
    const error=new Error('El proveedor de Threads sigue dentro de su periodo de espera.');
    error.status=429;error.retryAfterSeconds=threadsRetryRemaining('provider');throw error;
  }
  const query = new URLSearchParams({
    url: rawUrl,
    cache: "true"
  });
  for (const [key, value] of Object.entries(extraParams)) {
    query.set(key, String(value));
  }

  const controller = new AbortController();
  const timeout = path.startsWith("facebook/") || path.endsWith("/transcript") ? 65000 : REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${API_BASE}/${path}?${query}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") || "";
    if(response.status===429 && path.startsWith('threads/')) {
      const error=new Error('El proveedor de Threads limitó temporalmente las solicitudes (HTTP 429).');
      error.status=429;error.retryAfterSeconds=rememberThreadsRateLimit(response,'provider');
      await response.body?.cancel();throw error;
    }
    const raw = await response.text();
    let body = null;
    if (/application\/json/i.test(contentType) && raw) {
      try { body = JSON.parse(raw); } catch { body = null; }
    }
    if (!response.ok) {
      const providerMessage = body?.error?.message || body?.message || `HTTP ${response.status}`;
      throw new Error(providerMessage);
    }
    if (!body || typeof body !== "object") {
      throw new Error("El proveedor no devolvió JSON utilizable.");
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function safeSerialize(value) {
  const seen = new WeakSet();
  const json = JSON.stringify(value, (key, item) => {
    if (typeof item === "string") return item.slice(0, 6000);
    if (item && typeof item === "object") {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }
    return item;
  });
  return String(json || "").slice(0, MAX_SERIALIZED_CHARS);
}

function collectTikTokVideoUrls(value, output = new Set()) {
  if (output.size >= 5 || value == null) return output;
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+\/video\/\d+/gi) || [];
    matches.forEach(url => {
      if (output.size < 5) output.add(url.replace(/[),.;]+$/, ""));
    });
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTikTokVideoUrls(item, output);
    return output;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectTikTokVideoUrls(item, output);
  }
  return output;
}

export async function extractSocialPublicData(rawUrl) {
  const apiKey = process.env.CAPTAPI_API_KEY;
  const platform = platformFromUrl(rawUrl);
  if(platform==='threads' && !['post','profile'].includes(threadsLinkType(rawUrl))) {
    return {proveedor:'Captapi',plataforma:platform,tipo_enlace:'compartido_no_resuelto',
      consultas_exitosas:0,consultas_intentadas:0,contenido_json:'',
      limitaciones:['No se consultó el proveedor: falta resolver el enlace de Threads a una publicación o perfil con dirección válida.']};
  }
  if (!["threads", "tiktok", "facebook", "instagram", "twitter"].includes(platform)) return null;

  const profile = isProfileUrl(rawUrl, platform);
  const threadsEmbed = platform === 'threads' && !profile
    ? await extractThreadsEmbedMedia(rawUrl).catch(() => null)
    : null;
  if (!apiKey) {
    if (!threadsEmbed) return null;
    return {
      proveedor: 'Threads público',
      plataforma: platform,
      tipo_enlace: 'publicacion_con_video',
      consultas_exitosas: 1,
      consultas_intentadas: 1,
      contiene_video: true,
      contenido_json: safeSerialize([{endpoint:'threads/embed',respuesta:threadsEmbed}]),
      limitaciones: ['Se recuperó el MP4 desde la vista pública embed; los comentarios no estuvieron disponibles.']
    };
  }

  // Captapi expone endpoints de video, pero no uno equivalente para carruseles
  // /photo/. Enviar esas URL a video-details genera el falso diagnóstico de que
  // son perfiles. Conservamos una referencia estructurada para que la búsqueda
  // web pueda localizar OCR y réplicas públicas sin inventar una transcripción.
  if (platform === "tiktok" && isTikTokPhotoPost(rawUrl)) {
    const reference = tiktokPhotoReference(rawUrl);
    const hasIndexedEvidence = Boolean(reference?.evidencia_indexada);
    return {
      proveedor: hasIndexedEvidence ? "Índice público verificado" : "Recuperación web",
      plataforma: platform,
      tipo_enlace: "publicacion_fotografica",
      consultas_exitosas: hasIndexedEvidence ? 1 : 0,
      consultas_intentadas: 0,
      contenido_json: safeSerialize(reference),
      limitaciones: [
        "TikTok identifica el enlace como una publicación fotográfica o carrusel, no como video ni perfil.",
        hasIndexedEvidence
          ? "El texto se reconstruyó mediante OCR y copias indexadas; debe confirmarse cada dato con las URLs indicadas y no presentarse como transcripción directa del original."
          : "El proveedor social no ofrece un endpoint compatible con /photo/; deben localizarse texto OCR y copias públicas mediante búsqueda por cuenta e identificador."
      ]
    };
  }

  const requests = endpointRequests(platform, profile, rawUrl);
  if (!requests.length) return null;

  const settled = await Promise.allSettled(
    requests.map(([path, params]) => callCaptapi(apiKey, path, rawUrl, params))
  );

  const recovered = threadsEmbed
    ? [{endpoint:'threads/embed', respuesta:threadsEmbed}]
    : [];
  const limitations = [];
  if (threadsEmbed) limitations.push('El video se recuperó desde la vista pública embed de Threads; los comentarios dependen del proveedor social.');
  const retryAfter=Math.max(0,...settled.map(item=>item.status==='rejected'?Number(item.reason?.retryAfterSeconds)||0:0));
  if (platform === "facebook") limitations.push("Un resumen del proveedor es una síntesis automática, no una transcripción literal ni prueba de haber escuchado el audio. Contrastar con la publicación original y fuentes independientes.");
  if (platform === "twitter") limitations.push("Los datos del post incluyen texto y referencias multimedia; no equivalen a transcripción del audio de un video adjunto. La muestra del perfil no garantiza orden cronológico.");
  settled.forEach((outcome, index) => {
    const path = requests[index][0];
    if (outcome.status === "fulfilled") {
      recovered.push({ endpoint: path, respuesta: outcome.value });
    } else {
      limitations.push(`${path}: ${outcome.reason?.message || "consulta no disponible"}`);
    }
  });

  // Un perfil no basta: abre hasta cinco videos públicos recuperados y solicita
  // detalles y transcripción para que el verificador pueda evaluar lo que dicen.
  if (profile && platform === "tiktok" && recovered.length) {
    const videoUrls = [...collectTikTokVideoUrls(recovered)];
    const detailRequests = videoUrls.flatMap(videoUrl => [
      { path: "tiktok/video-details", url: videoUrl },
      { path: "tiktok/transcript", url: videoUrl }
    ]);
    const details = await Promise.allSettled(
      detailRequests.map(item => callCaptapi(apiKey, item.path, item.url))
    );
    details.forEach((outcome, index) => {
      const request = detailRequests[index];
      if (outcome.status === "fulfilled") {
        recovered.push({ endpoint: request.path, url_analizada: request.url, respuesta: outcome.value });
      } else {
        limitations.push(`${request.path} (${request.url}): ${outcome.reason?.message || "consulta no disponible"}`);
      }
    });
    requests.push(...detailRequests.map(item => [item.path, { url: item.url }]));
  }

  if (!recovered.length && platform === "tiktok" && !profile) {
    try {
      const parsed = new URL(rawUrl);
      const match = parsed.pathname.match(/^\/@([^/]+)\/video\/(\d+)\/?$/i);
      if (match) {
        const profileUrl = `${parsed.origin}/@${match[1]}`;
        const profilePosts = await callCaptapi(apiKey, "tiktok/channel-posts", profileUrl, {
          limit: Math.min(profileLimitForFallback(), 20)
        });
        recovered.push({
          endpoint: "tiktok/channel-posts",
          url_analizada: profileUrl,
          id_objetivo: match[2],
          respuesta: profilePosts
        });
        requests.push(["tiktok/channel-posts", { url: profileUrl, id_objetivo: match[2] }]);
        limitations.push("El detalle individual no estuvo disponible; se consultó la muestra pública reciente de la cuenta para localizar el identificador exacto del video.");
      }
    } catch (error) {
      limitations.push(`tiktok/channel-posts (recuperación por cuenta): ${error?.message || "consulta no disponible"}`);
    }
  }

  if (!recovered.length) {
    return {
      proveedor: "Captapi",
      plataforma: platform,
      tipo_enlace: profile ? "perfil" : "publicacion_o_pagina",
      consultas_exitosas: 0,
      consultas_intentadas: requests.length + (threadsEmbed ? 1 : 0),
      contenido_json: "",
      retry_after_seconds: retryAfter,
      limitaciones: limitations
    };
  }

  return {
    proveedor: "Captapi",
    plataforma: platform,
    tipo_enlace: profile ? "perfil" : threadsEmbed ? "publicacion_con_video" : "publicacion_o_pagina",
    consultas_exitosas: recovered.length,
    consultas_intentadas: requests.length + (threadsEmbed ? 1 : 0),
    contiene_video: Boolean(threadsEmbed),
    contenido_json: safeSerialize(recovered),
    limitaciones: limitations
  };
}
