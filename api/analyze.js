export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const input =
      req.body?.text ||
      req.body?.contenido ||
      req.body?.input ||
      "";

    if (!input || input.trim().length < 5) {
      return res.status(400).json({
        error: "Escribe una afirmación o pega un enlace para analizar."
      });
    }

    const texto = input.trim();
    const esEnlace = /^https?:\/\//i.test(texto);

    let plataforma = "Texto directo";

    if (texto.includes("threads.net") || texto.includes("threads.com")) {
      plataforma = "Threads";
    } else if (texto.includes("facebook.com")) {
      plataforma = "Facebook";
    } else if (texto.includes("x.com") || texto.includes("twitter.com")) {
      plataforma = "X / Twitter";
    } else if (texto.includes("tiktok.com")) {
      plataforma = "TikTok";
    } else if (texto.includes("youtube.com") || texto.includes("youtu.be")) {
      plataforma = "YouTube";
    }

    return res.status(200).json({
      ok: true,
      resultado: "ANÁLISIS PRELIMINAR",
      tipo: esEnlace ? "Publicación enlazada" : "Afirmación escrita",
      plataforma: plataforma,
      contenido_analizado: texto,
      credibilidad: "PENDIENTE DE VERIFICACIÓN",
      nivel_de_confianza: 0,
      contraste_de_fuentes:
        "La publicación fue recibida correctamente. Falta contrastarla con fuentes públicas independientes.",
      conclusion:
        "No hay evidencia suficiente todavía para clasificar este contenido como verdadero o falso.",
      advertencia:
        "No compartas el contenido como verdadero hasta completar la verificación de fuentes."
    });
  } catch (error) {
    return res.status(500).json({
      error: "No fue posible procesar la solicitud."
    });
  }
      }
