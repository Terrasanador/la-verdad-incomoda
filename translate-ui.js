export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

  try {
    const language = String(req.body?.language || "").trim();
    const strings = Array.isArray(req.body?.strings)
      ? req.body.strings.map(value => String(value || "").trim()).filter(Boolean)
      : [];

    if (!language || !strings.length) {
      return res.status(400).json({ error: "language and strings are required" });
    }
    if (strings.length > 180 || strings.join("").length > 18000) {
      return res.status(413).json({ error: "translation request too large" });
    }

    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["translations"],
      properties: {
        translations: {
          type: "array",
          minItems: strings.length,
          maxItems: strings.length,
          items: { type: "string" }
        }
      }
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "ui_translations",
            strict: true,
            schema
          }
        },
        instructions:
          "Translate each interface string faithfully into the requested language. " +
          "Preserve order and return exactly one translation per input string. " +
          "Keep the brand name La Verdad Incómoda unchanged. Preserve URLs, numbers, emojis, " +
          "HTML-like tokens and technical codes. Use natural, concise interface language.",
        input: [{
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({ language, strings })
          }]
        }],
        max_output_tokens: 5000
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "translation failed" });
    }

    const output = String(data.output_text || "").trim();
    const parsed = JSON.parse(output);
    return res.status(200).json({ translations: parsed.translations });
  } catch (error) {
    console.error("translate-ui error:", error);
    return res.status(500).json({ error: error?.message || "translation failed" });
  }
}
