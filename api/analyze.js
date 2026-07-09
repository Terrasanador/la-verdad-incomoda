export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
const input = req.body?.text || req.body?.contenido || "";    

if (!input || input.trim().length < 5) {
      return res.status(400).json({
        error: "Escribe una afirmación, noticia o enlace válido."
      });
    }

    return res.status(200).json({
      ok: true,
      estado: "recibido",
      mensaje: "El motor de La Verdad Incómoda recibió correctamente el contenido.",
      input
    });

  } catch (error) {
    return res.status(500).json({
      error: "No fue posible procesar la solicitud."
    });
  }
} 
