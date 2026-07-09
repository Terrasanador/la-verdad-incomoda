export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const input =
      req.body?.text ||
      req.body?.contenido ||
      req.body?.input ||
      "";

    if (!input || input.trim().length < 5) {
      return res.status(400).json({
        error: "Escribe una afirmación, noticia o enlace válido."
      });
    }

    const prompt = `
Analiza la credibilidad del siguiente contenido:

${input}

Responde SOLO en JSON válido con estas claves:
{
  "resultado": "",
  "tipo": "",
  "plataforma": "",
  "credibilidad": "",
  "nivel_de_confianza": 0,
  "contraste_de_fuentes": "",
  "conclusion": "",
  "advertencia": ""
}
`;

    const respuesta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(500).json({
        error: "Error del motor OpenAI",
        detalle: data
      });
    }

    const texto = data.output_text || "";

    let json;
    try {
      json = JSON.parse(texto);
    } catch {
      json = {
        resultado: "ANÁLISIS GENERADO",
        contenido_analizado: input,
        respuesta: texto
      };
    }

    return res.status(200).json({
      ok: true,
      contenido_analizado: input,
      ...json
    });
  } catch (error) {
    return res.status(500).json({
      error: "No fue posible procesar la solicitud.",
      detalle: error.message
    });
  }
}
