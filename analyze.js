import OpenAI, { toFile } from "openai";
import * as cheerio from "cheerio";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
const MAX_FILE_BYTES = 3_500_000;

function cleanText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function blockedPage(text, platform) {
  const lower = text.toLowerCase();
  const markers = [
    "log in to facebook",
    "inicia sesión en facebook",
    "login • instagram",
    "log in • instagram",
    "enable javascript",
    "access denied",
    "captcha",
    "security check required"
  ];

  if (markers.some((marker) => lower.includes(marker))) return true;
  return ["Facebook", "Instagram", "TikTok"].includes(platform) && text.length < 350;
}

async function extractPublicPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        accept: "text/html,application/xhtml+xml"
      }
    });

    const finalUrl = response.url || url;
    const platform = platformFromUrl(finalUrl);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("text/html")) {
      return { accessible: false, finalUrl, platform, reason: `HTTP ${response.status}` };
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

    if (content.length < 180 || blockedPage(content, platform)) {
      return {
        accessible: false,
        finalUrl,
        platform,
        title,
        description,
        reason: "blocked_or_empty"
      };
    }

    return { accessible: true, finalUrl, platform, title, description, content };
  } catch (error) {
    return {
      accessible: false,
      finalUrl: url,
      platform: platformFromUrl(url),
      reason: error?.name === "AbortError" ? "timeout" : "fetch_failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    estado: { type: "string", enum: ["completado", "insuficiente"] },
    naturaleza: {
      type: "string",
      enum: ["hecho_verificable", "opinion", "prediccion", "pregunta_abierta"]
    },
    orientacion: {
      type: "string",
      enum: ["positiva", "negativa", "mixta", "insuficiente"]
    },
    veredicto: {
      type: "string",
      enum: [
        "verdadero",
        "mayormente verdadero",
        "engañoso",
        "mayormente falso",
        "falso",
        "evaluacion positiva",
        "evaluacion negativa",
        "evaluacion mixta",
        "evidencia insuficiente"
      ]
    },
    credibilidad_nivel: {
      type: "string",
      enum: ["muy alta", "alta", "media", "baja", "muy baja", "insuficiente"]
    },
    confianza: { type: "integer", minimum: 0, maximum: 100 },
    riesgo_desinformacion: {
      type: "string",
      enum: ["muy bajo", "bajo", "medio", "alto", "muy alto", "no aplica"]
    },
    contenido_analizado: { type: "string" },
    tipo_plataforma: { type: "string" },
    resumen_ejecutivo: { type: "string" },
    credibilidad: { type: "string" },
    contraste_fuentes: { type: "string" },
    hechos_comprobados: { type: "array", items: { type: "string" } },
    evidencia_favorable: { type: "array", items: { type: "string" } },
    evidencia_desfavorable: { type: "array", items: { type: "string" } },
    no_comprobado: { type: "array", items: { type: "string" } },
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
          tipo: { type: "string" },
          fecha: { type: "string" },
          aporte: { type: "string" }
        },
        required: ["titulo", "url", "tipo", "fecha", "aporte"]
      }
    }
  },
  required: [
    "estado",
    "naturaleza",
    "orientacion",
    "veredicto",
    "credibilidad_nivel",
    "confianza",
    "riesgo_desinformacion",
    "contenido_analizado",
    "tipo_plataforma",
    "resumen_ejecutivo",
    "credibilidad",
    "contraste_fuentes",
    "hechos_comprobados",
    "evidencia_favorable",
    "evidencia_desfavorable",
    "no_comprobado",
    "conclusion",
    "advertencia",
    "fuentes"
  ]
};

function collectCitations(response) {
  const citations = [];
  const seen = new Set();

  function visit(value) {
    if (!value || typeof value !== "object") return;

    if (value.type === "url_citation" && value.url) {
      const url = cleanText(value.url);
      if (url && !seen.has(url)) {
        seen.add(url);
        citations.push({
          titulo: cleanText(value.title) || url,
          url,
          tipo: "Fuente web",
          fecha: "",
          aporte: "Fuente consultada durante la búsqueda web."
        });
      }
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
    } else {
      Object.values(value).forEach(visit);
    }
  }

  visit(response?.output);
  return citations;
}

function mergeSources(modelSources, citations) {
  const result = [];
  const seen = new Set();

  for (const source of [...citations, ...(Array.isArray(modelSources) ? modelSources : [])]) {
    const url = cleanText(source?.url);
    const key = url || cleanText(source?.titulo);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({
      titulo: cleanText(source?.titulo) || url || "Fuente",
      url,
      tipo: cleanText(source?.tipo) || "Fuente web",
      fecha: cleanText(source?.fecha),
      aporte: cleanText(source?.aporte)
    });
  }

  return result.slice(0, 12);
}

function basePrompt(mode) {
  return `Eres el motor de investigación y evaluación de credibilidad de "La Verdad Incómoda".

OBJETIVO
Investiga la información digital pública disponible, contrasta fuentes y emite una valoración útil y concreta.

REGLAS OBLIGATORIAS
1. Para hechos, decide si la afirmación es verdadera, falsa o intermedia según la evidencia.
2. Para opiniones o preguntas de idoneidad, no te detengas en decir "es subjetivo": investiga los hechos públicos relevantes y emite una evaluación positiva, negativa o mixta.
3. La orientación debe ser positiva, negativa o mixta siempre que haya evidencia suficiente. Usa insuficiente únicamente cuando de verdad no pueda investigarse.
4. La confianza mide la solidez de la investigación, no una certeza moral.
5. Busca evidencia favorable, desfavorable y neutral.
6. Prefiere fuentes oficiales, primarias, académicas, judiciales, regulatorias y medios reconocidos.
7. No inventes fuentes, títulos, fechas ni URLs.
8. Nunca dejes campos vacíos; explica las limitaciones.
9. Distingue claramente hechos comprobados, evidencia favorable, evidencia desfavorable y aspectos no comprobados.
10. La conclusión debe responder directamente la pregunta del usuario.
11. Para personas o empresas revisa, cuando sea pertinente: trayectoria, resultados, logros, sanciones, litigios, adeudos, controversias, conflictos de interés, declaraciones, propuestas y conducta pública.
12. La credibilidad debe expresarse como muy alta, alta, media, baja, muy baja o insuficiente.

MODO
${mode === "profundo" ? "Investigación amplia con varias fuentes independientes y análisis detallado." : "Verificación breve, pero sustentada con fuentes reales."}`;
}

async function runResearch({ original, platform, sourceUrl, contentParts, mode }) {
  const response = await client.responses.create({
    model: MODEL,
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: basePrompt(mode) },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `CONTENIDO ORIGINAL:\n${original}\n\nPLATAFORMA:\n${platform}\n\nURL:\n${sourceUrl || "No aplica"}`
          },
          ...contentParts
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "credibility_report",
        strict: true,
        schema
      }
    }
  });

  let parsed;
  try {
    parsed = JSON.parse(response.output_text || "{}");
  } catch {
    throw new Error("El motor devolvió una respuesta que no pudo interpretarse.");
  }

  parsed.fuentes = mergeSources(parsed.fuentes, collectCitations(response));
  return parsed;
}

function decodeBase64File(file) {
  const data = cleanText(file?.data);
  if (!data) throw new Error("El archivo no contiene datos.");
  const buffer = Buffer.from(data, "base64");
  if (!buffer.length) throw new Error("El archivo está vacío.");
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error("El archivo excede el límite de 3.5 MB para esta versión.");
  }
  return buffer;
}

async function analyzeFile(file, text, mode) {
  const name = cleanText(file?.name) || "archivo";
  const type = cleanText(file?.type) || "application/octet-stream";
  const buffer = decodeBase64File(file);

  if (type.startsWith("image/")) {
    return runResearch({
      original: text || `Analiza la imagen ${name}`,
      platform: `Imagen: ${type}`,
      sourceUrl: "",
      contentParts: [
        {
          type: "input_text",
          text: "Examina la imagen, su texto visible, contexto, señales de edición y afirmaciones comprobables. Después investiga en la web lo que sea verificable."
        },
        {
          type: "input_image",
          image_url: `data:${type};base64,${buffer.toString("base64")}`
        }
      ],
      mode
    });
  }

  if (type.startsWith("audio/")) {
    const transcription = await client.audio.transcriptions.create({
      file: await toFile(buffer, name, { type }),
      model: TRANSCRIBE_MODEL
    });
    const transcript = cleanText(transcription?.text);
    if (!transcript) throw new Error("No se pudo obtener una transcripción del audio.");

    return runResearch({
      original: text || `Analiza el audio ${name}`,
      platform: `Audio: ${type}`,
      sourceUrl: "",
      contentParts: [
        {
          type: "input_text",
          text: `TRANSCRIPCIÓN DEL AUDIO:\n${transcript}`
        }
      ],
      mode
    });
  }

  if (type === "text/plain" || name.toLowerCase().endsWith(".txt")) {
    const decoded = cleanText(buffer.toString("utf8")).slice(0, 20000);
    return runResearch({
      original: text || `Analiza el documento ${name}`,
      platform: "Documento de texto",
      sourceUrl: "",
      contentParts: [{ type: "input_text", text: `CONTENIDO DEL DOCUMENTO:\n${decoded}` }],
      mode
    });
  }

  if (
    type === "application/pdf" ||
    name.toLowerCase().endsWith(".pdf") ||
    type.includes("wordprocessingml") ||
    type.includes("presentationml") ||
    type.includes("spreadsheetml")
  ) {
    return runResearch({
      original: text || `Analiza el documento ${name}`,
      platform: `Documento: ${type}`,
      sourceUrl: "",
      contentParts: [
        {
          type: "input_file",
          filename: name,
          file_data: `data:${type};base64,${buffer.toString("base64")}`
        },
        {
          type: "input_text",
          text: "Analiza el documento, identifica afirmaciones verificables y contrástalas con evidencia pública."
        }
      ],
      mode
    });
  }

  if (type.startsWith("video/")) {
    return {
      estado: "insuficiente",
      naturaleza: "pregunta_abierta",
      orientacion: "insuficiente",
      veredicto: "evidencia insuficiente",
      credibilidad_nivel: "insuficiente",
      confianza: 0,
      riesgo_desinformacion: "no aplica",
      contenido_analizado: name,
      tipo_plataforma: `Video: ${type}`,
      resumen_ejecutivo:
        "El video fue recibido, pero esta versión no extrae todavía su audio ni sus fotogramas en el servidor.",
      credibilidad:
        "No es responsable asignar credibilidad positiva o negativa sin haber visto y escuchado el contenido.",
      contraste_fuentes: "No se inició contraste porque el contenido del video no fue extraído.",
      hechos_comprobados: [],
      evidencia_favorable: [],
      evidencia_desfavorable: [],
      no_comprobado: ["Audio del video", "Fotogramas", "Afirmaciones contenidas en el video"],
      conclusion:
        "No se emitió una valoración sobre el video. Sube su audio, capturas o una transcripción para analizarlo ahora.",
      advertencia: "No se inventó un resultado sin evidencia.",
      fuentes: []
    };
  }

  throw new Error("Este tipo de archivo todavía no es compatible.");
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
      return res.status(400).json({
        error: "Escribe una pregunta, pega texto, un enlace o selecciona un archivo."
      });
    }

    if (file) {
      const result = await analyzeFile(file, text, mode);
      return res.status(200).json(result);
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
          conclusion:
            "No se emitió un veredicto porque el sistema no pudo ver, escuchar ni leer la publicación.",
          instrucciones: [
            "Sube el video o audio directamente.",
            "También puedes subir capturas o pegar el texto de la publicación."
          ]
        });
      }

      const result = await runResearch({
        original: text,
        platform: page.platform,
        sourceUrl: page.finalUrl,
        contentParts: [
          {
            type: "input_text",
            text: `CONTENIDO EXTRAÍDO DE LA PÁGINA:\n${page.content}`
          }
        ],
        mode
      });

      return res.status(200).json(result);
    }

    const result = await runResearch({
      original: text,
      platform: "Texto o pregunta",
      sourceUrl: "",
      contentParts: [{ type: "input_text", text }],
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
