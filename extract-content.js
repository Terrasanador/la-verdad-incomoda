import dns from "node:dns/promises";
import net from "node:net";

const FETCH_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 24000;
const MAX_TRANSCRIPT_CHARS = 20000;
const MAX_COMMENTS = 50;
const MAX_COMMENT_CHARS = 1200;
const MAX_REDIRECTS = 5;

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
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

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const safeUrl = await assertSafeUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(safeUrl, {
        ...options,
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
    transcripcion: "",
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

      const captionMatch = html.match(/"captionTracks":(\[[\s\S]*?\])/);
      if (captionMatch) {
        try {
          const tracks = JSON.parse(captionMatch[1].replace(/\\u0026/g, "&"));
          const preferred =
            tracks.find(track => /^es/i.test(track.languageCode || "")) ||
            tracks.find(track => /^en/i.test(track.languageCode || "")) ||
            tracks[0];

          if (preferred?.baseUrl) {
            const captions = await safeFetch(`${preferred.baseUrl}&fmt=json3`, {
              headers: { Accept: "application/json" }
            });
            if (captions.ok) {
              const data = await captions.json();
              result.transcripcion = (data.events || [])
                .flatMap(event => event.segs || [])
                .map(segment => segment.utf8 || "")
                .join(" ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, MAX_TRANSCRIPT_CHARS);
            }
          }
        } catch {
          result.limitaciones.push("Se detectaron subtítulos, pero no pudieron procesarse.");
        }
      } else {
        result.limitaciones.push("El video no expuso subtítulos públicos.");
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
  try {
    parsed = await assertSafeUrl(rawUrl);
  } catch (error) {
    return {
      plataforma: "Desconocida",
      url_original: rawUrl,
      url_final: rawUrl,
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
      comentarios_recuperados: false,
      limitaciones: [error.message]
    };
  }

  const videoId = youtubeVideoId(parsed.href);
  if (videoId) return extractYouTube(parsed.href, videoId);

  const plataforma = platformFromHostname(parsed.hostname);
  const result = {
    plataforma,
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
    comentarios_recuperados: false,
    limitaciones: []
  };

  try {
    const response = await safeFetch(parsed.href, {
      headers: { Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" }
    });
    result.url_final = response.url || parsed.href;

    if (!response.ok) {
      result.limitaciones.push(`El servidor respondió HTTP ${response.status}.`);
      return result;
    }

    const contentType = response.headers.get("content-type") || "";
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
    result.fecha_publicacion =
      structured.fecha_publicacion ||
      extractMeta(raw, "article:published_time") ||
      extractMeta(raw, "date");
    result.fecha_modificacion = structured.fecha_modificacion || extractMeta(raw, "article:modified_time");
    result.comentarios = uniqueComments(structured.comentarios);
    result.comentarios_recuperados = result.comentarios.length > 0;

    const body = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || raw;
    const bodyText = cleanText(body);
    result.texto_recuperado = [
      result.titulo && `Título: ${result.titulo}`,
      result.autor && `Autor o cuenta: ${result.autor}`,
      result.descripcion && `Descripción: ${result.descripcion}`,
      result.fecha_publicacion && `Fecha de publicación: ${result.fecha_publicacion}`,
      bodyText && `Texto visible: ${bodyText}`,
      result.comentarios.length && `Comentarios públicos expuestos en la página (${result.comentarios.length}):\n${commentsAsText(result.comentarios)}`
    ].filter(Boolean).join("\n\n").slice(0, MAX_TEXT_CHARS);

    const accessShell =
      result.texto_recuperado.length < 120 ||
      /(?:log in|sign up|iniciar sesi[oó]n|crear cuenta|enable javascript|javascript is disabled)/i.test(result.texto_recuperado);

    result.acceso_directo = !accessShell;
    if (accessShell) {
      result.limitaciones.push(
        `${plataforma} entregó una página de acceso, una interfaz incompleta o contenido que requiere JavaScript o inicio de sesión.`
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
