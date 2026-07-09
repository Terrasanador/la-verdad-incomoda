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
Actúa como un verificador profesional de hechos.

Analiza la siguiente afirmación:

"${input}"

Tu tarea es determinar si la afirmación es verdadera, falsa, engañosa, parcialmente verdadera o no verificable.

REGLAS OBLIGATORIAS:

1. Usa tu conocimiento disponible para evaluar los hechos.
2. No respondas "pendiente de verificación" si la afirmación puede comprobarse con conocimiento factual ampliamente establecido.
3. Si la afirmación es claramente falsa, indícalo directamente.
4. Si es verdadera, indícalo directamente.
5. Distingue entre hechos, opiniones, sátira y contenido engañoso.
6. No inventes fuentes ni enlaces.
7. Si no tienes evidencia suficiente, indícalo claramente.
8. El nivel_de_confianza debe ser un número entero entre 0 y 100.

Responde SOLO en JSON válido, sin texto antes ni después, exactamente con esta estructura:

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
  model: "gpt-4o-mini",
  input: prompt
})
})
    const data = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Error desconocido de OpenAI",
detalle: data
      });
    }

const texto =
  data.output_text ||
  data.output?.[0]?.content?.[0]?.text ||
  "";

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
