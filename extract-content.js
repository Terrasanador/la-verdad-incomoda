import dns from "node:dns/promises";
import net from "node:net";

const FETCH_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 16000;
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
    transcripcion: "",
    texto_recuperado: "",
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
      result.titulo ||= extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
      result.descripcion = extractMeta(html, "og:description") || extractMeta(html, "description");

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
                .slice(0, MAX_TEXT_CHARS);
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

  result.texto_recuperado = [
    result.titulo && `Título: ${result.titulo}`,
    result.autor && `Canal: ${result.autor}`,
    result.descripcion && `Descripción: ${result.descripcion}`,
    result.transcripcion && `Transcripción: ${result.transcripcion}`
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
      transcripcion: "",
      texto_recuperado: "",
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
    transcripcion: "",
    texto_recuperado: "",
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

    result.titulo =
      extractMeta(raw, "og:title") ||
      extractMeta(raw, "twitter:title") ||
      cleanText(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "", 1000);
    result.descripcion =
      extractMeta(raw, "og:description") ||
      extractMeta(raw, "twitter:description") ||
      extractMeta(raw, "description");
    result.autor = extractMeta(raw, "author");

    const body = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || raw;
    const bodyText = cleanText(body);
    result.texto_recuperado = [
      result.titulo && `Título: ${result.titulo}`,
      result.autor && `Autor o cuenta: ${result.autor}`,
      result.descripcion && `Descripción: ${result.descripcion}`,
      bodyText && `Texto visible: ${bodyText}`
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
