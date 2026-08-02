// La Verdad Incómoda — analyze.js v2.0
// Revisión integral: imágenes, acceso restringido, confianza y coherencia del veredicto.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Falta configurar OPENAI_API_KEY en Vercel."
    });
  }

  try {
    const body = req.body || {};
    const consulta =
  body.consulta ||
  body.pregunta ||
  body.question ||
  body.query ||
  body.text ||
  body.input ||
  body.content ||
  body.url ||
  "";

const tieneTexto =
  typeof consulta === "string" && consulta.trim().length > 0;

const archivo = body.file || null;
const tieneArchivo = !!archivo;

if (!tieneTexto && !tieneArchivo) {
  return res.status(400).json({
    error: "Escribe una pregunta, pega un enlace o adjunta un archivo."
  });
}

const texto = tieneTexto
  ? consulta.trim()
  : "Analiza el archivo adjunto.";
    const modo = body.mode === "profundo" ? "profundo" : "rapido";

    const instrucciones = [
      'Eres el motor de investigación y verificación de hechos de "La Verdad Incómoda".',
      "",
      "OBJETIVO:",
      "Investiga afirmaciones, noticias, rumores, enlaces, imágenes, publicaciones y preguntas mediante evidencia verificable.",
      "Debes usar búsqueda web antes de emitir un veredicto.",
      "",
      "PRINCIPIOS:",
      "1. Verifica cada afirmación concreta.",
      "2. No decidas la verdad por popularidad, ideología, número de seguidores, propiedad o reputación general.",
      "3. Distingue la veracidad de la afirmación, la calidad de la evidencia, la confiabilidad del contenido específico, la reputación documentada del autor o medio y la percepción pública.",
      "4. Prioriza documentos primarios, bases de datos, leyes, estudios, registros, estadísticas, videos completos y declaraciones originales.",
      "5. Contrasta fuentes independientes y busca evidencia favorable y contraria.",
      "6. No inventes fuentes, URLs, autores, fechas, cifras, encuestas, citas ni estudios.",
      "7. No afirmes haber visto contenido que no pudiste abrir.",
      "8. No confundas repetición masiva con corroboración independiente.",
      "9. Distingue hechos, opinión, publicidad, propaganda, sátira, rumor y manipulación.",
      "10. Incluye únicamente fuentes realmente consultadas.",
      "",
      "MEDIOS Y PERIODISTAS:",
      "TRATAMIENTO IMPARCIAL DE FUENTES POLÍTICAS Y MEDIOS:",
"Verifica la afirmación concreta, no condenes ni absuelvas globalmente a un medio, gobierno, periodista, partido o corriente política.",
"Reconoce a las conferencias oficiales, comunicados gubernamentales, leyes, bases de datos y documentos públicos como fuentes primarias sobre lo que una autoridad afirma, decide o publica.",
"Una fuente oficial no recibe veracidad automática: contrasta sus afirmaciones empíricas con registros, metodología, datos y fuentes independientes.",
"Un medio privado, crítico, opositor, oficialista, comercial o público tampoco recibe credibilidad o falsedad automática.",
"No uses orientación política, propiedad del medio, popularidad o cercanía con el gobierno como sustituto de evidencia.",
"Analiza por separado cada contenido de Latinus, TV Azteca, Televisa, Loret de Mola, López-Dóriga, Ciro Gómez Leyva, la conferencia matutina y cualquier otra fuente.",
"Cuando existan conflictos entre la versión oficial y una publicación periodística, presenta ambas versiones y resuelve únicamente mediante evidencia documental verificable.",
"Prioriza documentos originales, videos completos, transcripciones íntegras, estadísticas con metodología, resoluciones, contratos, presupuestos y registros públicos.",
"No concluyas que una conferencia, programa o medio contiene desinformación de manera general sin delimitar afirmaciones, fechas, muestras y ejemplos comprobados.",
"Una colección de verificaciones parciales no demuestra automáticamente que todo el contenido de una fuente sea falso.",
"Si la imagen contiene una acusación general como 'este medio siempre miente' o 'esta conferencia contiene noticias falsas', divide la afirmación en proposiciones verificables y evita aceptar la generalización.",
"Explica claramente qué afirmó cada parte, qué evidencia la respalda, qué evidencia la contradice y qué no pudo comprobarse.",
      "REPUTACIÓN EN REDES:",
      "Cuando sea relevante, investiga la reputación pública del medio, periodista, organización o cuenta.",
      "Distingue popularidad, aprobación, confianza declarada, reputación profesional, precisión histórica y calidad del contenido actual.",
      "Seguidores, likes, visualizaciones, tendencias y comentarios no son prueba de veracidad.",
      "Analiza, cuando existan datos públicos suficientes: autenticidad y antigüedad de cuentas, cuentas oficiales, tendencias positivas y negativas, críticas recurrentes, correcciones, desmentidos independientes, premios o sanciones documentadas, transparencia editorial, comportamiento coordinado, bots, cuentas falsas, campañas organizadas, polarización y diferencias entre plataformas y periodos.",
      "No presentes una muestra de comentarios como representativa de toda la población.",
      "Explica si la conversación puede estar distorsionada por bots, brigadas, polarización, fandoms o campañas políticas.",
      "",
      "ENCUESTAS Y SONDEOS:",
      "Cuando cites una encuesta, revisa institución responsable, patrocinador, fecha, población objetivo, tamaño de muestra, método de selección, cobertura geográfica, modo de aplicación, redacción de la pregunta, opciones de respuesta, margen de error, nivel de confianza, tasa de respuesta, ponderaciones, tratamiento de indecisos, ficha técnica y conflictos de interés.",
      "No trates encuestas abiertas de redes sociales o sondeos de seguidores como representativos.",
      "Descríbelos como sondeos no probabilísticos o percepción de una comunidad específica.",
      "No compares encuestas incompatibles sin advertir diferencias de pregunta, fecha, muestra o metodología.",
      "No uses una sola encuesta para declarar una reputación definitiva.",
      "Compara varias mediciones independientes cuando sea posible.",
      "",
      "REDES SOCIALES Y ENLACES:",
      "Para TikTok, Facebook, Instagram, YouTube, X, Threads y otras plataformas, intenta consultar el contenido público.",
      "Revisa autor, fecha, texto, título, descripción, transcripción, subtítulos, metadatos y copias disponibles.",
      "Comprueba si el contenido fue recortado, editado, reutilizado o sacado de contexto.",
      "Si está privado, eliminado, bloqueado o requiere inicio de sesión, decláralo claramente.",
      "Nunca simules haber visto contenido inaccesible.",
      "",
      "SEÑALES DE DESINFORMACIÓN:",
      "Busca lenguaje alarmista, llamados urgentes a compartir, afirmaciones absolutas sin evidencia, ausencia de autor o fecha, cifras sin metodología, capturas sin contexto, citas falsas, contenido antiguo presentado como reciente, titulares que no corresponden al contenido, edición selectiva, fuentes anónimas sin corroboración, publicación coordinada, bots, hashtags artificiales, expertos sin credenciales, gráficos sin fuente y omisiones que cambian el sentido.",
      "",
      "JERARQUÍA DE EVIDENCIA:",
      "Da mayor peso, sin aplicarlo mecánicamente, a: evidencia primaria; estudios con metodología; datos oficiales competentes; investigaciones periodísticas documentadas; verificadores transparentes; medios que enlazan evidencia primaria; declaraciones interesadas; opiniones y testimonios no corroborados.",
      "Una fuente oficial puede equivocarse y una fuente no oficial puede aportar evidencia válida. Evalúa el contenido.",
      "",
      "CLASIFICACIONES PERMITIDAS:",
      "VERDADERO",
      "MAYORMENTE VERDADERO",
      "PARCIALMENTE VERDADERO",
      "ENGAÑOSO",
      "FUERA DE CONTEXTO",
      "FALSO",
      "CONTENIDO MANIPULADO",
      "SÁTIRA",
      "OPINIÓN",
      "RUMOR NO CONFIRMADO",
      "CADENA DE DESINFORMACIÓN",
      "INFORMACIÓN INSUFICIENTE",
      "NO VERIFICABLE",
      "",
      "PORCENTAJES:",
      "REGLAS PARA CONFIANZA:",
"La confianza no debe usar valores fijos ni repetirse automáticamente.",
"Usa 95 a 100 cuando existan varias fuentes independientes, evidencia primaria clara, coincidencia entre fuentes y ninguna limitación material.",
"Usa 85 a 94 cuando la evidencia sea fuerte, pero exista alguna limitación menor.",
"Usa 70 a 84 cuando la evidencia sea razonable pero incompleta.",
"Usa 40 a 69 cuando existan contradicciones, pocas fuentes o acceso parcial.",
"Usa 0 a 39 cuando no haya evidencia suficiente o el contenido no pueda consultarse.",
"No reduzcas la confianza únicamente porque la conclusión sea FALSA.",
"No aumentes la confianza únicamente porque muchas páginas repitan la misma información.",
      "AUTODESCRIPCIÓN VS CALIDAD DEL SERVICIO:",
"Primero identifica cuál es la afirmación exacta que se está verificando.",
"Verifica únicamente esa afirmación, no otras relacionadas.",
"Si la afirmación consiste únicamente en comprobar la existencia de un sitio, organización, persona, documento, empresa, institución o servicio, o verificar cómo se presenta públicamente, evalúa únicamente esa afirmación.",
"Cuando la propia fuente oficial confirme directamente esa afirmación y no existan indicios de manipulación, asigna una confianza entre 95 y 100.",
"No reduzcas la confianza por ausencia de auditorías, metodología pública, transparencia, reputación o evaluaciones independientes cuando esos aspectos no formen parte de la afirmación investigada.",
"La evaluación de la calidad, independencia, precisión, imparcialidad, rigor o confiabilidad general de un servicio constituye una afirmación distinta y debe investigarse por separado.",
"Nunca confundas verificar una descripción pública con demostrar la calidad o confiabilidad del servicio.",
"Aplica esta regla a cualquier sitio web, empresa, gobierno, institución, organización, partido político, medio de comunicación, periodista, plataforma digital o red social, incluida La Verdad Incómoda.",
"",
"JUSTIFICACIÓN DE LA CONFIANZA:",
"Antes de asignar el porcentaje de confianza identifica exactamente qué evidencia existe para ESA afirmación concreta.",
"La confianza debe depender de la cantidad, calidad, actualidad e independencia de la evidencia obtenida para la afirmación específica.",
"No penalices una afirmación sencilla porque falten pruebas sobre aspectos diferentes que no forman parte de la consulta.",
"Dos afirmaciones sobre el mismo sujeto pueden requerir niveles de evidencia completamente distintos.",
"Justifica internamente el porcentaje de confianza antes de responder.",
"No reutilices porcentajes frecuentes por costumbre.",
"Calcula la confianza de forma proporcional a la evidencia realmente encontrada.",
      '"credibilidad" es la probabilidad estimada de que la afirmación sea cierta.',
      '"confianza" es la solidez del análisis.',
      "Ejemplo falso claro: credibilidad 5, confianza 95.",
      "Ejemplo verdadero claro: credibilidad 95, confianza 95.",
      "Ejemplo con evidencia insuficiente: credibilidad 50, confianza 25.",
      "Nunca inviertas credibilidad y confianza.",
      "",
      "VEREDICTO FINAL:",
      'El campo "veredicto_final" responde de forma directa a si la afirmación principal es cierta o falsa.',
      'Usa "CIERTA" cuando la evidencia suficiente respalde materialmente la afirmación.',
      'Usa "FALSA" cuando la evidencia suficiente contradiga materialmente la afirmación, incluso si la clasificación técnica es ENGAÑOSO, FUERA DE CONTEXTO o CONTENIDO MANIPULADO.',
      'Usa "NO VERIFICABLE" exclusivamente cuando no se conozca la afirmación concreta o falte acceso/evidencia suficiente para confirmarla o desmentirla.',
      "Un error de acceso, una publicación privada, un bloqueo 429 o un enlace eliminado no son evidencia favorable ni desfavorable sobre la veracidad del contenido.",
      "En esos casos establece estado = sin_acceso, veredicto = NO VERIFICABLE y veredicto_final = NO VERIFICABLE.",
      "No repitas el mismo hecho en varias secciones. Cada dato debe aparecer en la sección más adecuada.",
      "Mantén el resumen, la respuesta directa y la conclusión breves, claras y sin reiteraciones.",
      "",
      "",
"COHERENCIA DEL VEREDICTO:",
"Si la clasificación técnica es PARCIALMENTE VERDADERO, el veredicto_final no puede ser CIERTA ni FALSA de forma categórica.",
"Si la clasificación técnica es VERDADERO, el veredicto_final debe ser CIERTA.",
"Si la clasificación técnica es FALSO, el veredicto_final debe ser FALSA.",
"Si existen partes verdaderas y partes falsas, usa PARCIALMENTE VERDADERO como clasificación y explica cuáles son.",
"No conviertas una generalización sobre un medio, gobierno, periodista o institución en un hecho probado sin evidencia suficiente.",
"FORMATO:",
      "Devuelve únicamente JSON válido, sin Markdown ni texto adicional.",
      "Usa exactamente esta estructura:",
      "{",
      '  "estado": "analizado | sin_acceso",',
      '  "veredicto_final": "CIERTA | FALSA | NO VERIFICABLE",',
      '  "explicacion_veredicto_final": "Explicación breve y directa",',
      '  "veredicto": "CLASIFICACIÓN PERMITIDA",',
      '  "credibilidad": 0,',
      '  "confianza": 0,',
      '  "afirmacion_principal": "Afirmación precisa investigada",',
      '  "respuesta_directa": "Respuesta clara y completa",',
      '  "resumen": "Resumen explicativo",',
      '  "hechos_comprobados": ["Hecho confirmado"],',
      '  "evidencia_a_favor": ["Evidencia favorable"],',
      '  "evidencia_en_contra": ["Evidencia contraria o limitante"],',
      '  "indicadores_desinformacion": ["Indicador concreto"],',
      '  "contexto": "Contexto necesario",',
      '  "contraste_fuentes": "Comparación de coincidencias, diferencias, independencia, calidad y actualidad",',
      '  "reputacion_fuente": {',
      '    "medio_o_autor": "Nombre",',
      '    "antecedentes_verificados": ["Antecedente documentado"],',
      '    "percepcion_en_redes": "Resumen prudente de la percepción pública",',
      '    "calidad_contenido_actual": "Evaluación del contenido específico",',
      '    "conflictos_interes": ["Conflicto comprobado"],',
      '    "limitaciones": "Límites de la evaluación reputacional"',
      "  },",
      '  "analisis_redes": {',
      '    "plataformas_consultadas": ["Plataforma"],',
      '    "tendencias_observadas": ["Tendencia"],',
      '    "posible_manipulacion": ["Indicio de coordinación o bots"],',
      '    "representatividad": "Alcance real de los datos",',
      '    "limitaciones": "Limitaciones del análisis"',
      "  },",
      '  "analisis_encuestas": [',
      "    {",
      '      "nombre": "Nombre real",',
      '      "institucion": "Responsable",',
      '      "fecha": "Fecha o periodo",',
      '      "resultado_relevante": "Hallazgo",',
      '      "metodologia": "Muestra, método, población y cobertura",',
      '      "margen_error": "Margen publicado o no disponible",',
      '      "limitaciones": "Límites metodológicos",',
      '      "url": "URL auténtica"',
      "    }",
      "  ],",
      '  "limitaciones": ["Limitación encontrada"],',
      '  "conclusion": "Conclusión sustentada y proporcional",',
      '  "fuentes": [',
      "    {",
      '      "titulo": "Título real",',
      '      "url": "https://direccion-real",',
      '      "tipo": "Oficial | Primaria | Académica | Científica | Periodística | Verificador | Encuesta | Red social | Archivo | Otra",',
      '      "aporte": "Información concreta aportada"',
      "    }",
      "  ]",
      "}",
      "",
      "VALIDACIÓN FINAL:",
      "Comprueba que el resumen sea texto, que credibilidad y confianza no estén invertidas, que las evidencias estén llenas cuando existan, que las encuestas incluyan metodología o limitaciones, que reputación no se confunda con popularidad, que no haya acusaciones generales sin evidencia y que todas las URLs sean auténticas."
    ].join("\n");

    const contenidoUsuario = [];

if (tieneTexto) {
  contenidoUsuario.push({
    type: "input_text",
    text: `Modo de investigación: ${modo}.

Consulta:
${texto}`
  });
}

if (
  archivo &&
  typeof archivo === "object" &&
  typeof archivo.data === "string" &&
  typeof archivo.type === "string" &&
  archivo.type.startsWith("image/")
) {
  contenidoUsuario.push({
    type: "input_image",
    image_url: `data:${archivo.type};base64,${archivo.data}`,
    detail: "high"
  });

  contenidoUsuario.push({
    type: "input_text",
    text: "Examina la imagen directamente. Lee todo el texto visible, identifica titulares, nombres, fechas, cifras, logotipos y afirmaciones comprobables. Usa esos datos para realizar la búsqueda web. No pidas al usuario que vuelva a escribir información legible en la imagen. Si una parte no se distingue, declara exactamente qué fragmento no pudo leerse."
  });
}

    
        


    const esquemaResultado = {
      type: "object",
      additionalProperties: false,
      required: [
        "estado", "veredicto_final", "explicacion_veredicto_final",
        "veredicto", "credibilidad", "confianza", "afirmacion_principal",
        "respuesta_directa", "resumen", "hechos_comprobados",
        "evidencia_a_favor", "evidencia_en_contra",
        "indicadores_desinformacion", "contexto", "contraste_fuentes",
        "reputacion_fuente", "analisis_redes", "analisis_encuestas",
        "limitaciones", "conclusion", "fuentes"
      ],
      properties: {
        estado: {
          type: "string",
          enum: ["analizado", "sin_acceso"]
        },
        veredicto_final: {
          type: "string",
          enum: ["CIERTA", "FALSA", "NO VERIFICABLE"]
        },
        explicacion_veredicto_final: { type: "string" },
        veredicto: {
          type: "string",
          enum: [
            "VERDADERO", "MAYORMENTE VERDADERO",
            "PARCIALMENTE VERDADERO", "ENGAÑOSO",
            "FUERA DE CONTEXTO", "FALSO",
            "CONTENIDO MANIPULADO", "SÁTIRA", "OPINIÓN",
            "RUMOR NO CONFIRMADO", "CADENA DE DESINFORMACIÓN",
            "INFORMACIÓN INSUFICIENTE", "NO VERIFICABLE"
          ]
        },
        credibilidad: { type: "integer", minimum: 0, maximum: 100 },
        confianza: { type: "integer", minimum: 0, maximum: 100 },
        afirmacion_principal: { type: "string" },
        respuesta_directa: { type: "string" },
        resumen: { type: "string" },
        hechos_comprobados: { type: "array", items: { type: "string" } },
        evidencia_a_favor: { type: "array", items: { type: "string" } },
        evidencia_en_contra: { type: "array", items: { type: "string" } },
        indicadores_desinformacion: { type: "array", items: { type: "string" } },
        contexto: { type: "string" },
        contraste_fuentes: { type: "string" },
        reputacion_fuente: {
          type: "object",
          additionalProperties: false,
          required: [
            "medio_o_autor", "antecedentes_verificados",
            "percepcion_en_redes", "calidad_contenido_actual",
            "conflictos_interes", "limitaciones"
          ],
          properties: {
            medio_o_autor: { type: "string" },
            antecedentes_verificados: { type: "array", items: { type: "string" } },
            percepcion_en_redes: { type: "string" },
            calidad_contenido_actual: { type: "string" },
            conflictos_interes: { type: "array", items: { type: "string" } },
            limitaciones: { type: "string" }
          }
        },
        analisis_redes: {
          type: "object",
          additionalProperties: false,
          required: [
            "plataformas_consultadas", "tendencias_observadas",
            "posible_manipulacion", "representatividad", "limitaciones"
          ],
          properties: {
            plataformas_consultadas: { type: "array", items: { type: "string" } },
            tendencias_observadas: { type: "array", items: { type: "string" } },
            posible_manipulacion: { type: "array", items: { type: "string" } },
            representatividad: { type: "string" },
            limitaciones: { type: "string" }
          }
        },
        analisis_encuestas: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "nombre", "institucion", "fecha", "resultado_relevante",
              "metodologia", "margen_error", "limitaciones", "url"
            ],
            properties: {
              nombre: { type: "string" },
              institucion: { type: "string" },
              fecha: { type: "string" },
              resultado_relevante: { type: "string" },
              metodologia: { type: "string" },
              margen_error: { type: "string" },
              limitaciones: { type: "string" },
              url: { type: "string" }
            }
          }
        },
        limitaciones: { type: "array", items: { type: "string" } },
        conclusion: { type: "string" },
        fuentes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["titulo", "url", "tipo", "aporte"],
            properties: {
              titulo: { type: "string" },
              url: { type: "string" },
              tipo: { type: "string" },
              aporte: { type: "string" }
            }
          }
        }
      }
    };

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        reasoning: {
          effort: modo === "profundo" ? "medium" : "low"
        },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "resultado_verificacion",
            description:
              "Resultado estructurado de una investigación y verificación de hechos.",
            strict: true,
            schema: esquemaResultado
          }
        },
        instructions: instrucciones,
        input: [{ role: "user", content: contenidoUsuario }],
        tools: [{
          type: "web_search",
          search_context_size: modo === "profundo" ? "high" : "medium",
          user_location: {
            type: "approximate",
            country: "MX",
            timezone: "America/Mexico_City"
          }
        }],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
        max_output_tokens: modo === "profundo" ? 8000 : 5000
      })
    });

    const data = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error("Error de OpenAI:", data);
      return res.status(openAIResponse.status).json({
        error: data?.error?.message || "OpenAI no pudo completar la investigación."
      });
    }

    if (data.status === "incomplete") {
      const razon = data?.incomplete_details?.reason || "desconocida";

      console.error("Respuesta incompleta de OpenAI:", {
        status: data.status,
        reason: razon
      });

      return res.status(502).json({
        error:
          razon === "max_output_tokens"
            ? "La investigación agotó el límite de salida antes de terminar. Intenta una consulta más concreta o usa el análisis rápido."
            : "OpenAI devolvió una respuesta incompleta.",
        detalle: razon
      });
    }

    let outputText =
      typeof data.output_text === "string"
        ? data.output_text
        : "";

    if (!outputText) {
      for (const item of data.output || []) {
        if (item.type !== "message") continue;

        for (const part of item.content || []) {
          if (part.type === "output_text" && part.text) {
            outputText += part.text;
          }
        }
      }
    }

    if (!outputText.trim()) {
      return res.status(502).json({ error: "OpenAI no devolvió un análisis." });
    }

    const textoLimpio = outputText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let resultado;

    try {
      resultado = JSON.parse(textoLimpio);
    } catch {
      console.error("JSON inválido:", textoLimpio);
      return res.status(502).json({
        error: "La respuesta no llegó en formato JSON válido.",
        respuesta: textoLimpio
      });
    }

    const limitarPorcentaje = valor => {
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return 0;
      return Math.max(0, Math.min(100, Math.round(numero)));
    };

    const limpiarLista = valor => {
      if (!Array.isArray(valor)) return [];
      return valor
        .map(elemento => {
          if (typeof elemento === "string") return elemento.trim();
          if (elemento && typeof elemento === "object") {
            return String(
              elemento.texto ||
              elemento.descripcion ||
              elemento.hecho ||
              elemento.evidencia ||
              elemento.aporte ||
              ""
            ).trim();
          }
          return "";
        })
        .filter(Boolean);
    };

    const claveTexto = valor =>
      String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const quitarRepetidos = (lista, usados = new Set()) => {
      const salida = [];
      for (const elemento of limpiarLista(lista)) {
        const clave = claveTexto(elemento);
        if (!clave || usados.has(clave)) continue;
        usados.add(clave);
        salida.push(elemento);
      }
      return salida;
    };

    const pareceSinAcceso = valor =>
      /(?:\b429\b|too many requests|sin acceso|no fue posible acceder|no se pudo abrir|privad[ao]|eliminad[ao]|requiere iniciar sesi[oó]n|bloquead[ao]|enlace inaccesible)/i
        .test(String(valor || ""));

    resultado.veredicto = String(
      resultado.veredicto || "INFORMACIÓN INSUFICIENTE"
    ).toUpperCase();

    resultado.estado =
      resultado.estado === "sin_acceso" ? "sin_acceso" : "analizado";

    resultado.veredicto_final = String(
      resultado.veredicto_final || ""
    ).toUpperCase();

    if (!["CIERTA", "FALSA", "NO VERIFICABLE"].includes(resultado.veredicto_final)) {
      if (["VERDADERO", "MAYORMENTE VERDADERO"].includes(resultado.veredicto)) {
        resultado.veredicto_final = "CIERTA";
      } else if ([
        "FALSO", "ENGAÑOSO", "FUERA DE CONTEXTO",
        "CONTENIDO MANIPULADO", "CADENA DE DESINFORMACIÓN"
      ].includes(resultado.veredicto)) {
        resultado.veredicto_final = "FALSA";
      } else {
        resultado.veredicto_final = "NO VERIFICABLE";
      }
    }

    resultado.explicacion_veredicto_final = String(
      resultado.explicacion_veredicto_final ||
      resultado.respuesta_directa ||
      resultado.conclusion ||
      ""
    ).trim();

    resultado.credibilidad = limitarPorcentaje(resultado.credibilidad);
    resultado.confianza = limitarPorcentaje(resultado.confianza);
    resultado.afirmacion_principal = String(
      resultado.afirmacion_principal || texto
    ).trim();
    resultado.respuesta_directa = String(
      resultado.respuesta_directa ||
      resultado.conclusion ||
      "No se obtuvo una respuesta directa."
    ).trim();
    resultado.resumen = String(
      resultado.resumen ||
      resultado.respuesta_directa ||
      resultado.conclusion ||
      "No se obtuvo un resumen."
    ).trim();
    const usadosEvidencia = new Set();
    resultado.hechos_comprobados = quitarRepetidos(
      resultado.hechos_comprobados,
      usadosEvidencia
    );
    resultado.evidencia_a_favor = quitarRepetidos(
      resultado.evidencia_a_favor,
      usadosEvidencia
    );
    resultado.evidencia_en_contra = quitarRepetidos(
      resultado.evidencia_en_contra,
      usadosEvidencia
    );
    resultado.limitaciones = quitarRepetidos(
      resultado.limitaciones,
      usadosEvidencia
    );
    resultado.indicadores_desinformacion = quitarRepetidos(
      resultado.indicadores_desinformacion
    );
    resultado.contexto = String(resultado.contexto || "").trim();
    resultado.conclusion = String(
      resultado.conclusion ||
      resultado.respuesta_directa ||
      resultado.resumen
    ).trim();

    resultado.reputacion_fuente =
      resultado.reputacion_fuente &&
      typeof resultado.reputacion_fuente === "object"
        ? resultado.reputacion_fuente
        : {
            medio_o_autor: "",
            antecedentes_verificados: [],
            percepcion_en_redes: "",
            calidad_contenido_actual: "",
            conflictos_interes: [],
            limitaciones: "No se realizó una evaluación reputacional."
          };

    resultado.analisis_redes =
      resultado.analisis_redes &&
      typeof resultado.analisis_redes === "object"
        ? resultado.analisis_redes
        : {
            plataformas_consultadas: [],
            tendencias_observadas: [],
            posible_manipulacion: [],
            representatividad: "",
            limitaciones: "No se realizó un análisis de redes."
          };

    resultado.analisis_encuestas = Array.isArray(resultado.analisis_encuestas)
      ? resultado.analisis_encuestas
      : [];

    if (
      resultado.hechos_comprobados.length === 0 &&
      resultado.evidencia_en_contra.length > 0
    ) {
      resultado.hechos_comprobados = [...resultado.evidencia_en_contra];
    }

    if (
      resultado.hechos_comprobados.length === 0 &&
      resultado.evidencia_a_favor.length > 0
    ) {
      resultado.hechos_comprobados = [...resultado.evidencia_a_favor];
    }

    const textoDiagnostico = [
      resultado.resumen,
      resultado.respuesta_directa,
      resultado.conclusion,
      ...resultado.limitaciones
    ].join(" ");

    const esImagen =
      archivo &&
      typeof archivo.type === "string" &&
      archivo.type.startsWith("image/");

    const consultaEsEnlace =
      tieneTexto &&
      /^https?:\/\//i.test(texto.trim());

    const hayContenidoUtil =
      Boolean(resultado.afirmacion_principal?.trim()) ||
      Boolean(resultado.respuesta_directa?.trim()) ||
      Boolean(resultado.resumen?.trim()) ||
      resultado.hechos_comprobados.length > 0 ||
      resultado.evidencia_a_favor.length > 0 ||
      resultado.evidencia_en_contra.length > 0;

    const accesoRealmenteBloqueado =
      consultaEsEnlace &&
      !esImagen &&
      !hayContenidoUtil &&
      (
        resultado.estado === "sin_acceso" ||
        pareceSinAcceso(textoDiagnostico)
      );

    if (accesoRealmenteBloqueado) {
      resultado.estado = "sin_acceso";
      resultado.veredicto = "NO VERIFICABLE";
      resultado.veredicto_final = "NO VERIFICABLE";
      resultado.credibilidad = 50;
      resultado.confianza = Math.min(resultado.confianza || 40, 40);

      resultado.explicacion_veredicto_final =
        "La plataforma restringió el acceso y no fue posible recuperar suficiente contenido verificable para evaluar la afirmación.";

      resultado.respuesta_directa =
        "No fue posible acceder automáticamente a esta publicación. Comparte una captura legible, el texto completo o un enlace público alternativo para realizar la verificación.";

      resultado.resumen =
        "La investigación intentó consultar la publicación y buscar referencias públicas, pero no recuperó contenido suficiente. El resultado correcto es NO VERIFICABLE.";

      resultado.conclusion =
        "Sin conocer la afirmación concreta no se puede confirmar ni desmentir responsablemente su veracidad.";

      resultado.evidencia_a_favor = [];
      resultado.evidencia_en_contra = [];
      resultado.indicadores_desinformacion = [];
      resultado.mensaje =
        "La plataforma limitó el acceso al contenido. Comparte una captura legible, el texto completo o un enlace alternativo para continuar.";
    } else {
      resultado.estado = "analizado";
    }

    const fuentesBusqueda = [];

    for (const item of data.output || []) {
      if (item.type !== "web_search_call") continue;
      for (const source of item.action?.sources || []) {
        if (!source?.url) continue;
        if (!fuentesBusqueda.some(fuente => fuente.url === source.url)) {
          fuentesBusqueda.push({
            titulo: source.title || source.url || "Fuente consultada",
            url: source.url,
            tipo: "Fuente consultada",
            aporte: "Fuente utilizada durante la investigación web."
          });
        }
      }
    }

    const citas = [];

    for (const item of data.output || []) {
      if (item.type !== "message") continue;
      for (const part of item.content || []) {
        for (const annotation of part.annotations || []) {
          if (annotation.type !== "url_citation" || !annotation.url) continue;
          if (!citas.some(fuente => fuente.url === annotation.url)) {
            citas.push({
              titulo: annotation.title || annotation.url || "Fuente citada",
              url: annotation.url,
              tipo: "Fuente citada",
              aporte: "Fuente citada en la respuesta."
            });
          }
        }
      }
    }

    const fuentesFinales = [];

    const agregarFuente = fuente => {
      if (!fuente || typeof fuente !== "object" || typeof fuente.url !== "string") {
        return;
      }

      let urlValida;

      try {
        const url = new URL(fuente.url);
        if (!["http:", "https:"].includes(url.protocol)) return;
        urlValida = url.href;
      } catch {
        return;
      }

      if (fuentesFinales.some(existente => existente.url === urlValida)) return;

      fuentesFinales.push({
        titulo: String(fuente.titulo || fuente.title || urlValida).trim(),
        url: urlValida,
        tipo: String(fuente.tipo || "Fuente consultada").trim(),
        aporte: String(
          fuente.aporte || "Fuente utilizada durante la investigación."
        ).trim()
      });
    };

    (Array.isArray(resultado.fuentes) ? resultado.fuentes : []).forEach(agregarFuente);
    citas.forEach(agregarFuente);
    fuentesBusqueda.forEach(agregarFuente);

    resultado.fuentes = fuentesFinales;
    resultado.busqueda_web_realizada = fuentesFinales.length > 0;

    const fuentesPrimarias = fuentesFinales.filter(fuente =>
      /oficial|primaria|acad[eé]mica|cient[ií]fica|documento|registro/i
        .test(`${fuente.tipo} ${fuente.titulo}`)
    ).length;

    const cantidadLimitaciones = resultado.limitaciones.length;
    const evidenciaMixta =
      resultado.evidencia_a_favor.length > 0 &&
      resultado.evidencia_en_contra.length > 0;

    const calibrarConfianza = () => {
      if (resultado.estado === "sin_acceso") return Math.min(resultado.confianza || 40, 40);

      let valor = 45;

      if (fuentesFinales.length >= 1) valor += 12;
      if (fuentesFinales.length >= 2) valor += 8;
      if (fuentesFinales.length >= 4) valor += 8;
      if (fuentesFinales.length >= 6) valor += 5;

      valor += Math.min(15, fuentesPrimarias * 5);
      valor -= Math.min(25, cantidadLimitaciones * 5);
      if (evidenciaMixta) valor -= 5;

      if (
        fuentesFinales.length >= 5 &&
        fuentesPrimarias >= 2 &&
        cantidadLimitaciones === 0
      ) {
        valor = Math.max(valor, 95);
      }

      return limitarPorcentaje(Math.max(20, Math.min(98, valor)));
    };

    resultado.confianza = calibrarConfianza();

    let contraste = String(resultado.contraste_fuentes || "").trim();

    if (!contraste && fuentesFinales.length > 0) {
      contraste =
        `Se consultaron ${fuentesFinales.length} fuentes públicas. ` +
        "El veredicto compara coincidencia, independencia y calidad de la evidencia.";
    }

    if (!contraste) {
      contraste =
        "No se recuperaron suficientes fuentes públicas para un contraste independiente completo.";
    }

    resultado.contraste_fuentes = contraste;

    if (resultado.veredicto === "FALSO" && resultado.credibilidad > 50) {
      resultado.credibilidad = 100 - resultado.credibilidad;
    }

    if (resultado.veredicto === "VERDADERO" && resultado.credibilidad < 50) {
      resultado.credibilidad = 100 - resultado.credibilidad;
    }

    if (resultado.veredicto === "PARCIALMENTE VERDADERO") {
      resultado.veredicto_final = "NO VERIFICABLE";
      resultado.explicacion_veredicto_final =
        resultado.explicacion_veredicto_final ||
        "La afirmación mezcla elementos confirmados con partes falsas, imprecisas o no demostradas; por eso no corresponde declararla completamente cierta o falsa.";
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({
      error: "Ocurrió un error interno durante la investigación.",
      detalle: error?.message || "Error desconocido"
    });
  }
}

