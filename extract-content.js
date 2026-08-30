import dns from "node:dns/promises";
import net from "node:net";
import { mediaType } from "./media-input.js";

const FETCH_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 24000;
const MAX_TRANSCRIPT_CHARS = 80000;
const MAX_COMMENTS = 50;
const MAX_COMMENT_CHARS = 1200;
const MAX_REDIRECTS = 5;

function decodeHtml(value = "") {
  const decodeCodePoint = (entity, code, radix) => {
    const number = parseInt(code, radix);
    if (!Number.isInteger(number) || number < 0 || number > 0x10ffff) return entity;
    try { return String.fromCodePoint(number); } catch { return entity; }
  };
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (entity, code) => decodeCodePoint(entity, code, 10))
    .replace(/&#x([0-9a-f]+);/gi, (entity, code) => decodeCodePoint(entity, code, 16));
}

function cleanText(value = "", max = MAX_TEXT_CHARS) {
  return decodeHtml(String(value))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function extractMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1], 3000);
  }
  return "";
}

function extractJsonObjects(html = "") {
  const objects = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) && objects.length < 20) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      objects.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {}
  }
  return objects;
}

function visitJson(value, visitor, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  visitor(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(item => visitJson(item, visitor, seen));
    else visitJson(child, visitor, seen);
  }
}

function textValue(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.text || value.name || value.description || "";
  }
  return "";
}

function authorValue(value) {
  if (Array.isArray(value)) return value.map(authorValue).filter(Boolean).join(", ");
  if (typeof value === "string") return value;
  return value?.name || value?.alternateName || "";
}

function structuredPageData(html = "") {
  const result = {
    titulo: "",
    autor: "",
    descripcion: "",
    fecha_publicacion: "",
    fecha_modificacion: "",
    comentarios: []
  };

  for (const root of extractJsonObjects(html)) {
    visitJson(root, node => {
      const type = Array.isArray(node["@type"]) ? node["@type"].join(" ") : node["@type"] || "";
      if (/VideoObject|SocialMediaPosting|NewsArticle|Article|BlogPosting/i.test(type)) {
        result.titulo ||= cleanText(node.headline || node.name || "", 1000);
        result.autor ||= cleanText(authorValue(node.author || node.creator), 1000);
        result.descripcion ||= cleanText(node.description || node.articleBody || "", 5000);
        result.fecha_publicacion ||= cleanText(node.datePublished || node.uploadDate || "", 100);
        result.fecha_modificacion ||= cleanText(node.dateModified || "", 100);
      }

      if (/Comment|UserComments/i.test(type) && result.comentarios.length < MAX_COMMENTS) {
        const texto = cleanText(
          node.text || node.commentText || node.description || node.reviewBody || "",
          MAX_COMMENT_CHARS
        );
        if (!texto) return;
        result.comentarios.push({
          autor: cleanText(authorValue(node.author || node.creator), 300),
          texto,
          publicado: cleanText(node.dateCreated || node.datePublished || "", 100),
          me_gusta: Number(node.upvoteCount || node.interactionStatistic?.userInteractionCount || 0) || 0,
          respuestas: 0
        });
      }
    });
  }

  return result;
}

function uniqueComments(comments = []) {
  const seen = new Set();
  return comments.filter(comment => {
    const key = cleanText(comment?.texto || "", MAX_COMMENT_CHARS).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_COMMENTS);
}

function commentsAsText(comments = []) {
  return comments.map((comment, index) => {
    const details = [
      comment.autor && `autor: ${comment.autor}`,
      comment.publicado && `fecha: ${comment.publicado}`,
      Number.isFinite(comment.me_gusta) && `me gusta: ${comment.me_gusta}`,
      Number.isFinite(comment.respuestas) && `respuestas: ${comment.respuestas}`
    ].filter(Boolean).join(", ");
    return `${index + 1}. ${comment.texto}${details ? ` (${details})` : ""}`;
  }).join("\n");
}

function platformFromHostname(hostname = "") {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
  if (host.endsWith("threads.net") || host.endsWith("threads.com")) return "Threads";
  if (host.endsWith("instagram.com")) return "Instagram";
  if (host.endsWith("facebook.com") || host === "fb.watch") return "Facebook";
  if (host.endsWith("tiktok.com")) return "TikTok";
  if (host === "x.com" || host.endsWith("twitter.com")) return "X";
  return "Sitio web";
}

export function isSocialProfileUrl(url, platform) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (platform === "Threads") {
    return parts.length === 1 && /^@[^/]+$/i.test(parts[0]);
  }
  if (platform === "TikTok") {
    return /^(?:www\.)?tiktok\.com$/i.test(url.hostname) && parts.length === 1 && /^@[^/]+$/.test(parts[0]);
  }
  if (platform === "Instagram") {
    return parts.length === 1 && !/^(?:p|reel|reels|video|stories)$/i.test(parts[0]);
  }
  if (platform === "X") {
    return parts.length === 1 && !/^(?:home|explore|search|i)$/i.test(parts[0]);
  }
  return false;
}

function parseCompactNumber(value = "") {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/([\d.,]+)(mill[oó]n(?:es)?|mil|k|m)?/i);
  if (!match) return null;
  let number = Number(match[1].replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  if (match[2] === "k" || match[2] === "mil") number *= 1000;
  else if (/^(?:m|mill)/i.test(match[2] || "")) number *= 1_000_000;
  return Math.round(number);
}

export function profileDataFromMetadata(url, title = "", description = "") {
  const username = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "").replace(/^@/, "");
  const followers = description.match(/([\d.,]+\s*(?:k|m|mil|mill[oó]n(?:es)?)?)\s+(?:followers|seguidores)/i);
  const posts = description.match(/([\d.,]+\s*(?:k|m|mil|mill[oó]n(?:es)?)?)\s+(?:threads|hilos|publicaciones|posts)/i);
  const bio = description
    .replace(/^[\s\S]*?(?:followers|seguidores)\s*[•·]\s*[\d.,]+\s*(?:k|m|mil|mill[oó]n(?:es)?)?\s*(?:threads|hilos|publicaciones|posts)\s*[•·]\s*/i, "")
    .replace(/\s*(?:See|Mira)\s+(?:the latest|las últimas)[\s\S]*$/i, "")
    .trim();
  return {
    usuario: username,
    nombre: title.replace(/\s*\(@[^)]+\)[\s\S]*$/i, "").trim(),
    biografia: bio,
    seguidores: followers ? parseCompactNumber(followers[1]) : null,
    publicaciones_declaradas: posts ? parseCompactNumber(posts[1]) : null
  };
}

function isPrivateIp(address) {
  if (!address) return true;
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      parts[0] >= 224
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.")
    );
  }
  return true;
}

async function assertSafeUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Solo se permiten enlaces HTTP o HTTPS.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("El enlace apunta a una dirección privada o interna.");
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("El enlace apunta a una dirección privada.");
    return url;
  }

  const addresses = await dns.lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => isPrivateIp(item.address))) {
    throw new Error("El dominio resuelve a una dirección privada o no válida.");
  }
  return url;
}

async function safeFetch(rawUrl, options = {}) {
  let current = rawUrl;
  const {onResolvedUrl, ...fetchOptions} = options;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const safeUrl = await assertSafeUrl(current);
    onResolvedUrl?.(safeUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(safeUrl, {
        ...fetchOptions,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LaVerdadIncomoda/1.2; +https://laverdadincomoda.mx)",
          "Accept-Language": "es-MX,es;q=0.9,en;q=0.7",
          ...(options.headers || {})
        }
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return response;
      current = new URL(location, safeUrl).href;
      continue;
    }

    return response;
  }

  throw new Error("El enlace excedió el máximo de redirecciones permitido.");
}

async function readLimitedText(response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_HTML_BYTES) {
    throw new Error("El contenido del enlace es demasiado grande para extracción directa.");
  }

  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_HTML_BYTES) {
    throw new Error("El contenido descargado excede el límite permitido.");
  }
  return text;
}

async function readMediaBytes(response, max=20_000_000) {
  if (Number(response.headers.get('content-length')||0)>max) {
    await response.body?.cancel();
    throw new Error('El archivo enlazado excede 20 MB.');
  }
  const reader=response.body.getReader(); const chunks=[]; let size=0;
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;reader.cancel();},20000);
  let complete=false;
  try {
    while(true) {
      const item=await reader.read();
      if(item.done){if(timedOut) throw new Error('La descarga del archivo agotó el tiempo disponible.');complete=true;break;}
      size+=item.value.length;
      if(size>max) throw new Error('El archivo enlazado excede 20 MB.');
      chunks.push(Buffer.from(item.value));
    }
    if(!size) throw new Error('Archivo enlazado vacío.');
    return Buffer.concat(chunks);
  } finally { clearTimeout(timer); if(!complete) await reader.cancel(); }
}

function youtubeVideoId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) return parts[1] || "";
    }
  } catch {}
  return "";
}

function extractBalancedJson(source = "", marker = "") {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = source.indexOf("{", markerIndex + marker.length);
  if (start < 0) return null;

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      try { return JSON.parse(source.slice(start, index + 1)); } catch { return null; }
    }
  }
  return null;
}

function formatTimestamp(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(Number(milliseconds) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchYouTubeTranscript(playerResponse) {
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const preferred =
    tracks.find(track => /^es/i.test(track.languageCode || "")) ||
    tracks.find(track => /^en/i.test(track.languageCode || "")) ||
    tracks[0];
  if (!preferred?.baseUrl) return { transcript: "", segments: [] };

  const captions = await safeFetch(`${preferred.baseUrl}&fmt=json3`, {
    headers: { Accept: "application/json" }
  });
  if (!captions.ok) return { transcript: "", segments: [] };

  const data = await captions.json();
  const segments = (data.events || []).map(event => ({
    inicio: formatTimestamp(event.tStartMs),
    inicio_ms: Number(event.tStartMs || 0),
    texto: (event.segs || []).map(segment => segment.utf8 || "").join("").replace(/\s+/g, " ").trim()
  })).filter(segment => segment.texto);

  const transcript = segments
    .map(segment => `[${segment.inicio}] ${segment.texto}`)
    .join(" ")
    .slice(0, MAX_TRANSCRIPT_CHARS);
  return { transcript, segments };
}

async function fetchInnertubePlayer(html, id) {
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  if (!apiKey || !clientVersion) return null;
  const response = await safeFetch(`https://www.youtube.com/youtubei/v1/player?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      videoId: id,
      context: { client: { clientName: "WEB", clientVersion, hl: "es", gl: "MX" } },
      playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" } }
    })
  });
  return response.ok ? response.json() : null;
}

async function extractYouTube(rawUrl, id) {
  const result = {
    plataforma: "YouTube",
    url_original: rawUrl,
    url_final: rawUrl,
    acceso_directo: false,
    titulo: "",
    autor: "",
    descripcion: "",
    fecha_publicacion: "",
    fecha_modificacion: "",
    estadisticas: {},
    duracion_segundos: null,
    transcripcion: "",
    segmentos_transcripcion: [],
    texto_recuperado: "",
    comentarios: [],
    limitaciones: [],
    comentarios_recuperados: false
  };

  try {
    const oembed = await safeFetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`,
      { headers: { Accept: "application/json" } }
    );
    if (oembed.ok) {
      const data = await oembed.json();
      result.titulo = cleanText(data.title || "", 1000);
      result.autor = cleanText(data.author_name || "", 1000);
      result.acceso_directo = true;
    }
  } catch (error) {
    result.limitaciones.push(`No se pudo consultar oEmbed: ${error.message}`);
  }

  try {
    const page = await safeFetch(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, {
      headers: { Accept: "text/html,application/xhtml+xml" }
    });
    result.url_final = page.url || rawUrl;
    if (page.ok) {
      const html = await readLimitedText(page);
      const structured = structuredPageData(html);
      result.titulo ||= extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
      result.titulo ||= structured.titulo;
      result.autor ||= structured.autor;
      result.descripcion = extractMeta(html, "og:description") || extractMeta(html, "description") || structured.descripcion;
      result.fecha_publicacion = structured.fecha_publicacion;
      result.fecha_modificacion = structured.fecha_modificacion;
      result.comentarios.push(...structured.comentarios);

      try {
        let playerResponse =
          extractBalancedJson(html, "ytInitialPlayerResponse") ||
          extractBalancedJson(html, '"playerResponse":');
        if (!playerResponse?.captions) {
          playerResponse = await fetchInnertubePlayer(html, id) || playerResponse;
        }
        result.duracion_segundos = Number(playerResponse?.videoDetails?.lengthSeconds || 0) || null;
        const transcriptData = await fetchYouTubeTranscript(playerResponse);
        result.transcripcion = transcriptData.transcript;
        result.segmentos_transcripcion = transcriptData.segments;
        if (!result.transcripcion) {
          result.limitaciones.push("YouTube no proporcionó subtítulos públicos ni transcripción automática recuperable para este video.");
        }
      } catch (error) {
        result.limitaciones.push(`No se pudo recuperar la transcripción disponible: ${error.message}`);
      }
      result.acceso_directo = true;
    } else {
      result.limitaciones.push(`YouTube respondió HTTP ${page.status}.`);
    }
  } catch (error) {
    result.limitaciones.push(`No se pudo abrir la página del video: ${error.message}`);
  }

  if (process.env.YOUTUBE_API_KEY) {
    try {
      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.searchParams.set("part", "snippet,statistics");
      videoUrl.searchParams.set("id", id);
      videoUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);
      const videoResponse = await safeFetch(videoUrl.href, { headers: { Accept: "application/json" } });
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const video = videoData.items?.[0];
        result.titulo ||= cleanText(video?.snippet?.title || "", 1000);
        result.autor ||= cleanText(video?.snippet?.channelTitle || "", 1000);
        result.descripcion ||= cleanText(video?.snippet?.description || "", 5000);
        result.fecha_publicacion ||= cleanText(video?.snippet?.publishedAt || "", 100);
        result.estadisticas = {
          visualizaciones: Number(video?.statistics?.viewCount || 0),
          me_gusta: Number(video?.statistics?.likeCount || 0),
          comentarios: Number(video?.statistics?.commentCount || 0)
        };
      } else {
        result.limitaciones.push(`La API de YouTube respondió HTTP ${videoResponse.status} al solicitar metadatos.`);
      }

      const commentsUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
      commentsUrl.searchParams.set("part", "snippet,replies");
      commentsUrl.searchParams.set("videoId", id);
      commentsUrl.searchParams.set("maxResults", String(MAX_COMMENTS));
      commentsUrl.searchParams.set("order", "relevance");
      commentsUrl.searchParams.set("textFormat", "plainText");
      commentsUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);
      const commentsResponse = await safeFetch(commentsUrl.href, { headers: { Accept: "application/json" } });
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        for (const thread of commentsData.items || []) {
          const top = thread.snippet?.topLevelComment?.snippet;
          const text = cleanText(top?.textDisplay || top?.textOriginal || "", MAX_COMMENT_CHARS);
          if (!text) continue;
          result.comentarios.push({
            autor: cleanText(top?.authorDisplayName || "", 300),
            texto: text,
            publicado: cleanText(top?.publishedAt || "", 100),
            me_gusta: Number(top?.likeCount || 0),
            respuestas: Number(thread.snippet?.totalReplyCount || 0)
          });
        }
      } else if (commentsResponse.status === 403) {
        result.limitaciones.push("Los comentarios de YouTube están desactivados, restringidos o la clave no tiene habilitada YouTube Data API v3.");
      } else {
        result.limitaciones.push(`La API de YouTube respondió HTTP ${commentsResponse.status} al solicitar comentarios.`);
      }
    } catch (error) {
      result.limitaciones.push(`No se completó la consulta oficial de YouTube: ${error.message}`);
    }
  } else {
    result.limitaciones.push(
      "No se configuró YOUTUBE_API_KEY; se analizaron metadatos y subtítulos públicos, pero no fue posible solicitar una muestra de comentarios mediante YouTube Data API v3."
    );
  }

  result.comentarios = uniqueComments(result.comentarios);
  result.comentarios_recuperados = result.comentarios.length > 0;

  result.texto_recuperado = [
    result.titulo && `Título: ${result.titulo}`,
    result.autor && `Canal: ${result.autor}`,
    result.descripcion && `Descripción: ${result.descripcion}`,
    result.fecha_publicacion && `Fecha de publicación: ${result.fecha_publicacion}`,
    result.duracion_segundos && `Duración: ${formatTimestamp(result.duracion_segundos * 1000)}`,
    Object.keys(result.estadisticas).length && `Estadísticas públicas: ${JSON.stringify(result.estadisticas)}`,
    result.transcripcion && `Transcripción: ${result.transcripcion}`,
    result.comentarios.length && `Muestra de comentarios públicos (${result.comentarios.length}, orden de relevancia de YouTube):\n${commentsAsText(result.comentarios)}`
  ].filter(Boolean).join("\n\n").slice(0, MAX_TEXT_CHARS);

  return result;
}

export function findFirstPublicUrl(value = "") {
  const match = String(value).match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0].replace(/[),.;!?]+$/, "") : "";
}

export async function extractPublicLink(rawUrl) {
  let parsed;
  let plataforma = "Desconocida";
  let esPerfil = false;
  try {
    parsed = new URL(rawUrl);
    plataforma = platformFromHostname(parsed.hostname);
    esPerfil = isSocialProfileUrl(parsed, plataforma);
    parsed = await assertSafeUrl(parsed.href);
  } catch (error) {
    return {
      plataforma,
      tipo_enlace: esPerfil ? "perfil" : "publicacion_o_pagina",
      url_original: rawUrl,
      url_final: rawUrl,
      acceso_directo: false,
      titulo: "",
      autor: "",
      descripcion: "",
      fecha_publicacion: "",
      fecha_modificacion: "",
      estadisticas: {},
      duracion_segundos: null,
      transcripcion: "",
      segmentos_transcripcion: [],
      texto_recuperado: "",
      comentarios: [],
      perfil: esPerfil && parsed
        ? profileDataFromMetadata(parsed, "", "")
        : null,
      comentarios_recuperados: false,
      limitaciones: [error.message]
    };
  }

  const videoId = youtubeVideoId(parsed.href);
  if (videoId) return extractYouTube(parsed.href, videoId);

  const result = {
    plataforma,
    tipo_enlace: esPerfil ? "perfil" : "publicacion_o_pagina",
    url_original: parsed.href,
    url_final: parsed.href,
    acceso_directo: false,
    titulo: "",
    autor: "",
    descripcion: "",
    fecha_publicacion: "",
    fecha_modificacion: "",
    estadisticas: {},
    transcripcion: "",
    texto_recuperado: "",
    comentarios: [],
    perfil: null,
    comentarios_recuperados: false,
    limitaciones: []
  };

  try {
    const response = await safeFetch(parsed.href, {
      onResolvedUrl(url) {
        result.url_final=url.href;
        parsed=url;
        plataforma=platformFromHostname(url.hostname);
        esPerfil=isSocialProfileUrl(url,plataforma);
        result.plataforma=plataforma;
        result.tipo_enlace=esPerfil?'perfil':'publicacion_o_pagina';
      },
      headers: { Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" }
    });
    result.url_final = response.url || parsed.href;

    if (!response.ok) {
      result.limitaciones.push(`El servidor respondió HTTP ${response.status}.`);
      return result;
    }

    const contentType = response.headers.get("content-type") || "";
    const mediaName=new URL(result.url_final || parsed.href).pathname.split('/').pop() || 'archivo';
    const detectedType=mediaType(mediaName,contentType.split(';')[0]);
    if (detectedType && !/text\/html/i.test(contentType)) {
      const bytes=await readMediaBytes(response);
      result.archivo_recuperado={name:mediaName,type:detectedType,data:bytes.toString('base64')};
      result.acceso_directo=true;
      result.tipo_enlace='archivo';
      return result;
    }
    const raw = await readLimitedText(response);

    if (/application\/json/i.test(contentType)) {
      result.texto_recuperado = cleanText(raw);
      result.acceso_directo = result.texto_recuperado.length >= 80;
      return result;
    }

    const structured = structuredPageData(raw);
    result.titulo =
      extractMeta(raw, "og:title") ||
      extractMeta(raw, "twitter:title") ||
      structured.titulo ||
      cleanText(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "", 1000);
    result.descripcion =
      extractMeta(raw, "og:description") ||
      extractMeta(raw, "twitter:description") ||
      extractMeta(raw, "description") ||
      structured.descripcion;
    result.autor = extractMeta(raw, "author") || structured.autor;
    if (esPerfil) {
      result.perfil = profileDataFromMetadata(parsed, result.titulo, result.descripcion);
    }
    result.fecha_publicacion =
      structured.fecha_publicacion ||
      extractMeta(raw, "article:published_time") ||
      extractMeta(raw, "date");
    result.fecha_modificacion = structured.fecha_modificacion || extractMeta(raw, "article:modified_time");
    result.comentarios = uniqueComments(structured.comentarios);
    result.comentarios_recuperados = result.comentarios.length > 0;

    const body = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || raw;
    const bodyText = plataforma === "Threads" && esPerfil ? "" : cleanText(body);
    result.texto_recuperado = [
      result.titulo && `Título: ${result.titulo}`,
      result.autor && `Autor o cuenta: ${result.autor}`,
      result.descripcion && `Descripción: ${result.descripcion}`,
      result.perfil && `Ficha pública del perfil: ${JSON.stringify(result.perfil)}`,
      result.fecha_publicacion && `Fecha de publicación: ${result.fecha_publicacion}`,
      bodyText && `Texto visible: ${bodyText}`,
      result.comentarios.length && `Comentarios públicos expuestos en la página (${result.comentarios.length}):\n${commentsAsText(result.comentarios)}`
    ].filter(Boolean).join("\n\n").slice(0, MAX_TEXT_CHARS);

    const accessShell =
      (plataforma === "TikTok" && /^TikTok\s*[-–|]\s*Make Your Day$/i.test(result.titulo.trim()) && !result.autor && !result.fecha_publicacion) ||
      (plataforma === "Threads" && esPerfil) ||
      result.texto_recuperado.length < 120 ||
      /(?:log in|sign up|iniciar sesi[oó]n|crear cuenta|enable javascript|javascript is disabled)/i.test(result.texto_recuperado);

    const metadataPerfilUtil = esPerfil && Boolean(
      result.titulo || result.descripcion || result.perfil?.usuario
    );
    result.acceso_directo = !accessShell;
    result.acceso_parcial = accessShell && metadataPerfilUtil;
    if (accessShell) {
      result.limitaciones.push(
        metadataPerfilUtil
          ? `${plataforma} permitió recuperar la ficha pública del perfil, pero limitó el listado completo de publicaciones o contenido que requiere JavaScript o inicio de sesión.`
          : `${plataforma} entregó una página de acceso, una interfaz incompleta o contenido que requiere JavaScript o inicio de sesión.`
      );
    }

    if (["Threads", "Instagram", "Facebook", "TikTok", "X"].includes(plataforma)) {
      result.limitaciones.push(
        "La plataforma puede limitar publicaciones y comentarios a sus APIs oficiales. Los comentarios solo deben analizarse si fueron recuperados realmente, pegados por el usuario o aportados mediante capturas."
      );
    }
  } catch (error) {
    result.limitaciones.push(
      error?.name === "AbortError"
        ? "La descarga directa agotó el tiempo de espera."
        : `No se pudo descargar directamente el enlace: ${error.message}`
    );
  }

  return result;
}
