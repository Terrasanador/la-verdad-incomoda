import OpenAI from "openai";
import * as cheerio from "cheerio";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function platformFromUrl(url) {
  const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  if (host.includes("facebook.com") || host.includes("fb.watch")) return "Facebook";
  if (host.includes("tiktok.com")) return "TikTok";
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
  if (host === "x.com" || host.includes("twitter.com")) return "X";
  if (host.includes("threads.net")) return "Threads";
  return host;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
}

function looksBlocked(text, platform) {
  const lower = text.toLowerCase();
  const genericMarkers = [
    "log in to facebook",
    "inicia sesión en facebook",
    "login • instagram",
    "log in • instagram",
    "enable javascript",
    "access denied",
    "captcha",
    "security check required"
  ];
  if (genericMarkers.some((marker) => lower.includes(marker))) return true;
  if (["Facebook", "Instagram", "TikTok"].includes(platform) && text.length < 350) return true;
  return false;
}

async function extractPublicPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        accept: "text/html,application/xhtml+xml"
      }
    });
    const finalUrl = response.url || url;
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return { accessible: false, finalUrl, reason: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    $("script,style,noscript,svg,canvas,iframe").remove();

    const title = cleanText(
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text()
    );
    const description = cleanText(
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content")
    );
    const body = cleanText($("body").text()).slice(0, 18000);
    const combined = cleanText([title, description, body].filter(Boolean).join("\n"));
    const platform = platformFromUrl(finalUrl);

    if (combined.length < 180 || looksBlocked(combined, platform)) {
      return { accessible: false, finalUrl, platform, title, description, reason: "blocked_or_empty" };
    }

    return {
      accessible: true,
      finalUrl,
      platform,
      title,
      description,
      content: combined
    };
  } catch (error) {
    return { accessible: false, finalUrl: url, reason: error?.name === "AbortError" ? "timeout" : "fetch_failed" };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonLoose(text) {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  throw new Error("La respuesta del motor no tuvo un formato JSON válido.");
}

async function investigate({ original, extracted, platform, sourceUrl }) {
  const instructions = `Eres el motor de verificación de La Verdad Incómoda. Debes investigar, no adivinar. Usa búsqueda web real para contrastar las afirmaciones verificables. No emitas un veredicto si faltan datos esenciales. No inventes fuentes ni URLs. Responde exclusivamente con JSON válido y sin markdown.

Estructura obligatoria:
{
  "estado": "completado" | "insuficiente",
  "veredicto": "verdadero" | "mayormente verdadero" | "engañoso" | "mayormente falso" | "falso" | "no verificable",
  "confianza": 0-100,
  "contenido_analizado": "resumen preciso",
  "tipo_plataforma": "tipo y plataforma",
  "credibilidad": "evaluación breve",
  "contraste_fuentes": "qué coinciden o contradicen las fuentes",
  "conclusion": "respuesta concreta y comprensible",
  "advertencia": "solo si es necesaria; de lo contrario cadena vacía",
  "fuentes": [
    {"titulo":"...","url":"https://...","aporte":"qué demuestra"}
  ]
}

Reglas: incluye al menos 2 fuentes independientes cuando exista información suficiente. Prefiere fuentes primarias, institucionales, académicas y medios reconocidos. Si no encontraste fuentes, usa estado=insuficiente, confianza=0 y explica que no se investigó suficientemente; no insinúes que el contenido es falso o engañoso.`;

  const input = `CONTENIDO ORIGINAL:\n${original}\n\nPLATAFORMA: ${platform || "texto"}\nURL: ${sourceUrl || "no aplica"}\n\nCONTENIDO EXTRAÍDO O TEXTO A ANALIZAR:\n${extracted}`;

  const response = await client.responses.create({
    model: MODEL,
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: instructions },
      { role: "user", content: input }
    ]
  });

  return parseJsonLoose(response.output_text);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Falta OPENAI_API_KEY en Vercel" });

  try {
    const text = cleanText(req.body?.text);
    if (!text) return res.status(400).json({ error: "Pega texto o un enlace para analizar." });

    if (isHttpUrl(text)) {
      const platform = platformFromUrl(text);
      const page = await extractPublicPage(text);

      if (!page.accessible) {
        return res.status(200).json({
          estado: "sin_acceso",
          analizado: false,
          plataforma: platform,
          contenido_analizado: text,
          mensaje: `${platform} impidió acceder automáticamente al contenido o requiere iniciar sesión.`,
          conclusion: "No se emitió ningún veredicto porque el sistema no pudo ver, escuchar ni leer la publicación.",
          instrucciones: [
            "Sube el video o audio directamente.",
            "También puedes subir capturas o pegar el texto de la publicación."
          ]
        });
      }

      const result = await investigate({
        original: text,
        extracted: page.content,
        platform: page.platform,
        sourceUrl: page.finalUrl
      });
      return res.status(200).json(result);
    }

    const result = await investigate({ original: text, extracted: text, platform: "texto", sourceUrl: "" });
    return res.status(200).json(result);
  } catch (error) {
    console.error("analyze_error", error);
    return res.status(500).json({
      error: "No se pudo completar el análisis.",
      detalle: error?.message || "Error desconocido"
    });
  }
}
