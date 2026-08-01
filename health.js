export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido. Usa GET."
    });
  }

  return res.status(200).json({
    ok: true,
    service: "La Verdad Incómoda",
    version: "1.0.0",
    openai_key_configured: Boolean(process.env.OPENAI_API_KEY),
    timestamp: new Date().toISOString()
  });
}
