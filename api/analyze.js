import OpenAI from "openai";
import * as cheerio from "cheerio";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function cleanText(value) {
  return String(value || "").replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function platformFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("facebook.com") || host.includes("fb.watch")) return "Facebook";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host === "x.com" || host.includes("twitter.com")) return "X";
    if (host.includes("threads.net")) return "Threads";
    return host || "Sitio web";
  } catch {
    return "Texto";
  }
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
    const platform = platformFromUrl(finalUrl);

    if (!response.ok || !contentType.includes("text/html")) {
      return { accessible: false, finalUrl, platform };
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
    const content = cleanText([title, description, body].filter(Boolean).join("\n"));

    if (content.length < 180) {
      return { accessible: false, finalUrl, platform };
    }

    return { accessible: true, finalUrl, platform, content };
  } catch {
    return { accessible: false, finalUrl: url, platform: platformFromUrl(url) };
  } finally {
    clearTimeout(timeout);
  }
}

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    estado: { type: "string", enum: ["completado", "insuficiente"] },
    naturaleza: { type: "string", enum: ["hecho_verificable", "opinion", "prediccion", "pregunta_abierta"] },
    veredicto: {
      type: "string",
      enum: ["verdadero", "mayormente verdadero", "engañoso", "mayormente falso", "falso", "no verificable"]
    },
    confianza: { type: "integer", minimum: 0, maximum: 100 },
    contenido_analizado: { type: "string" },
    tipo_plataforma: { type: "string" },
    credibilidad: { type: "string" },
    contraste_fuentes: { type: "string" },
    conclusion: { type: "string" },
    advertencia: { type: "string" },
    fuentes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          url: { type: "string" },
          aporte: { type: "string" }
        },
        required: ["titulo", "url", "aporte"]
      }
    }
  },
  required: [
    "estado",
    "naturaleza",
    "veredicto",
    "confianza",
    "contenido_analizado",
    "tipo_plataforma",
    "credibilidad",
    "contraste_fuentes",
    "conclusion",
    "advertencia",
    "fuentes"
  ]
};

async function investigate({ original, extracted, platform, sourceUrl, mode }) {
  const instructions = `Eres el motor de verificación de La Verdad Incómoda.

Debes distinguir entre hechos verificables, opiniones, predicciones y preguntas abiertas.
Nunca dejes campos vacíos y nunca respondas "No especificado" sin explicar por qué.
Usa búsqueda web para hechos comprobables. No inventes fuentes ni URLs.

Si la consulta pregunta si una persona es "confiable", "buena", "capaz", "la mejor" o adecuada para un cargo:
- clasifícala como opinión o pregunta abierta;
- no la declares verdadera ni falsa;
- explica que depende de criterios;
- identifica qué hechos objetivos sí pueden revisarse: trayectoria, resultados, conflictos de interés, sanciones, propuestas y antecedentes públicos.

Si faltan datos o fuentes:
- estado = "insuficiente"
- veredicto = "no verificable"
- confianza = 0
- explica con claridad la limitación.

Modo: ${mode === "profundo" ? "investigación amplia" : "verificación breve"}.`;

  const input = `CONTENIDO ORIGINAL:
${original}

PLATAFORMA:
${platform}

URL:
${sourceUrl || "No aplica"}

CONTENIDO EXTRAÍDO:
${extracted}`;

  const response = await client.responses.create({
    model: MODEL,
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: instructions },
      { role: "user", content: input }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "verification_result",
        strict: true,
        schema
      }
    }
  });

  const parsed = JSON.parse(response.output_text || "{}");

  return {
    estado: parsed.estado,
    naturaleza: parsed.naturaleza,
    veredicto: parsed.veredicto,
    confianza: parsed.confianza,
    contenido_analizado: cleanText(parsed.contenido_analizado) || original,
    tipo_plataforma: cleanText(parsed.tipo_plataforma) || platform,
    credibilidad: cleanText(parsed.credibilidad) || "No hay elementos suficientes para evaluarla.",
    contraste_fuentes: cleanText(parsed.contraste_fuentes) || "No se obtuvo contraste suficiente.",
    conclusion: cleanText(parsed.conclusion) || "No se pudo formular una conclusión sustentada.",
    advertencia: cleanText(parsed.advertencia),
    fuentes: Array.isArray(parsed.fuentes) ? parsed.fuentes : []
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Falta OPENAI_API_KEY en Vercel" });
  }

  try {
    const text = cleanText(req.body?.text);
    const mode = req.body?.mode === "profundo" ? "profundo" : "rapido";
    const file = req.body?.file;

    if (!text && !file) {
      return res.status(400).json({ error: "Escribe una pregunta, pega texto, un enlace o selecciona un archivo." });
    }

    if (file) {
      return res.status(200).json({
        estado: "insuficiente",
        naturaleza: "pregunta_abierta",
        veredicto: "no verificable",
        confianza: 0,
        contenido_analizado: file.name || "Archivo adjunto",
        tipo_plataforma: file.type || "Archivo",
        credibilidad: "La interfaz recibió el archivo, pero el servidor todavía no procesa su contenido.",
        contraste_fuentes: "No se realizó contraste porque el archivo no fue analizado.",
        conclusion: "No se emitió ningún veredicto sobre el archivo.",
        advertencia: "Falta habilitar el procesamiento multimedia en la API.",
        fuentes: []
      });
    }

    if (isHttpUrl(text)) {
      const page = await extractPublicPage(text);

      if (!page.accessible) {
        return res.status(200).json({
          estado: "sin_acceso",
          analizado: false,
          plataforma: page.platform,
          contenido_analizado: text,
          mensaje: `${page.platform} impidió acceder automáticamente al contenido o requiere iniciar sesión.`,
          conclusion: "No se emitió ningún veredicto porque el sistema no pudo leer la publicación.",
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
        sourceUrl: page.finalUrl,
        mode
      });

      return res.status(200).json(result);
    }

    const result = await investigate({
      original: text,
      extracted: text,
      platform: "Texto o pregunta",
      sourceUrl: "",
      mode
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("analyze_error", error);

    return res.status(500).json({
      error: "No se pudo completar el análisis.",
      detalle: error?.message || "Error desconocido"
    });
  }
}

