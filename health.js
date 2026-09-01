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
    version: "1.9.16",
    openai_key_configured: Boolean(process.env.OPENAI_API_KEY),
    youtube_key_configured: Boolean(process.env.YOUTUBE_API_KEY),
    captapi_key_configured: Boolean(process.env.CAPTAPI_API_KEY),
    timestamp: new Date().toISOString()
  });
}
