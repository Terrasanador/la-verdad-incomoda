import { extractPublicLink, findFirstPublicUrl } from "./extract-content.js";

// La Verdad Incómoda — analyze.js v2.2
// Videos largos: resumen temático, contexto y verificación por afirmaciones.

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

    const enlaceDetectado = tieneTexto ? findFirstPublicUrl(texto) : "";
    let extraccionEnlace = null;

    if (enlaceDetectado) {
      try {
        extraccionEnlace = await extractPublicLink(enlaceDetectado);
      } catch (error) {
        console.error("Error inesperado al extraer enlace:", error);
        extraccionEnlace = {
          plataforma: "Desconocida",
          url_original: enlaceDetectado,
          url_final: enlaceDetectado,
          acceso_directo: false,
          titulo: "",
          autor: "",
          descripcion: "",
          transcripcion: "",
          texto_recuperado: "",
          comentarios_recuperados: false,
          limitaciones: ["La extracción directa falló de forma inesperada."]
        };
      }
    }

    const modo = body.mode === "profundo" ? "profundo" : "rapido";
    const idiomaSalida = String(body.language || body.idioma || "auto").trim() || "auto";

    const instrucciones = [
      'Eres el motor de investigación y verificación de hechos de "La Verdad Incómoda".',
      "",
      "OBJETIVO:",
      "Investiga afirmaciones, noticias, rumores, enlaces, imágenes, publicaciones y preguntas mediante evidencia verificable.",
      "Debes usar búsqueda web antes de emitir un veredicto.",
      `IDIOMA DE SALIDA: ${idiomaSalida}.`,
      "Escribe todos los campos narrativos en el idioma solicitado por el usuario.",
      "Conserva exactamente en español los valores técnicos enumerados del esquema: estado, veredicto_final y veredicto.",
      "No traduzcas URLs, nombres propios, títulos oficiales ni citas textuales salvo que expliques la traducción.",
      "Si el idioma solicitado es auto, responde en el mismo idioma principal de la consulta o del texto visible en la imagen.",
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
      "Cuando se recupere una muestra real de comentarios, úsala para comprender qué interpretan, cuestionan o aportan los usuarios, no como votación de verdad.",
      "Distingue siempre el contenido de la publicación, los comentarios del público y la evidencia externa; no atribuyas al autor lo dicho por comentaristas.",
      "Si los comentarios aportan nombres, fechas, lugares, fuentes o versiones alternativas relevantes, comprueba esos datos mediante búsqueda web antes de usarlos como contexto.",
      "Comprueba si el contenido fue recortado, editado, reutilizado o sacado de contexto.",
      "Si está privado, eliminado, bloqueado o requiere inicio de sesión, decláralo claramente.",
      "Nunca simules haber visto contenido inaccesible.",
      "Si el backend adjunta CONTENIDO RECUPERADO DEL ENLACE, úsalo como material recibido, pero verifica sus afirmaciones mediante búsqueda web.",
      "Que la extracción directa falle no obliga por sí sola a declarar NO VERIFICABLE: intenta identificar la publicación mediante URL final, título, autor, copias públicas, transcripciones, citas y cobertura independiente.",
      "Solo afirma haber analizado comentarios cuando los comentarios aparezcan realmente en el contenido recuperado, en capturas o en texto aportado por el usuario.",
      "No calcules porcentajes de comentarios positivos o negativos sin una muestra identificable. Indica tamaño, forma de selección y limitaciones de representatividad.",
      "VIDEOS LARGOS, PROGRAMAS Y TRANSMISIONES:",
      "Si el usuario envía únicamente el enlace de un video, su solicitud implícita es conocer el contenido, el contexto y su confiabilidad. No le exijas indicar previamente una frase o minuto.",
      "Usa la transcripción con marcas de tiempo para dividir el video en temas. Resume el contenido completo, identifica automáticamente las afirmaciones factuales principales y verifica las más relevantes.",
      "En un noticiero o programa con múltiples asuntos, no fuerces un único veredicto de cierto o falso para todo el video. Evalúa por separado cada tema o afirmación y reserva el veredicto general para describir la confiabilidad integral del contenido.",
      "Distingue autenticidad del enlace, confiabilidad de la fuente, exactitud de cada afirmación, calidad de la evidencia y estilo editorial.",
      "Si no hay transcripción, utiliza título, descripción, capítulos, citas, copias, notas relacionadas y búsqueda web para reconstruir prudentemente los temas. Declara el alcance real y nunca atribuyas al video una frase que no pudiste escuchar o leer.",
      "La falta de subtítulos no autoriza a pedirle al usuario que haga el análisis. Agota primero la identificación automática de temas y afirmaciones mediante las fuentes públicas disponibles.",
      "Cuando no exista una afirmación única, credibilidad debe ser null: no uses 0%, porque 0% podría interpretarse como falsedad.",
      "",
      "SEÑALES DE DESINFORMACIÓN:",
      "Busca lenguaje alarmista, llamados urgentes a compartir, afirmaciones absolutas sin evidencia, ausencia de autor o fecha, cifras sin metodología, capturas sin contexto, citas falsas, contenido antiguo presentado como reciente, titulares que no corresponden al contenido, edición selectiva, fuentes anónimas sin corroboración, publicación coordinada, bots, hashtags artificiales, expertos sin credenciales, gráficos sin fuente y omisiones que cambian el sentido.",
      "",
      "MOTOR ANTIAMARILLISMO E INTEGRIDAD INFORMATIVA:",
      "Además de verificar hechos, evalúa si el contenido exagera, atemoriza, induce urgencia artificial o transforma incertidumbre en certeza.",
      "Compara el titular, la bajada, el cuerpo, las imágenes, los datos y las fuentes. Un hecho verdadero puede estar presentado de forma amarillista o engañosa.",
      "Detecta: lenguaje catastrófico, hipérboles, absolutos, preguntas insinuantes, clickbait, omisión de contexto tranquilizador o relevante, extrapolación de casos aislados, causalidad no demostrada, posibilidad presentada como certeza, riesgo hipotético presentado como inminente y llamados compulsivos a compartir.",
      "No minimices riesgos reales. Distingue con claridad: riesgo confirmado, riesgo probable, posibilidad teórica, incertidumbre y escenario especulativo.",
      "Propón un titular responsable que conserve el hecho relevante sin fabricar miedo.",
      "CORROBORACIÓN INDEPENDIENTE Y CADENAS DE REPLICACIÓN:",
      "Investiga si varias notas proceden de la misma agencia, comunicado, redacción, cadena, grupo empresarial, propietario, fuente matriz o texto sindicado.",
      "No cuentes como fuentes independientes páginas que copian el mismo cable, comunicado, párrafos idénticos o una publicación original sin verificación propia.",
      "Agrupa esas réplicas por fuente matriz y explica cuántas fuentes realmente independientes quedan después de deduplicarlas.",
      "La repetición masiva no aumenta por sí sola la credibilidad.",
      "DIFUSIÓN AUTOMATIZADA Y BOTS:",
      "Busca señales públicas de amplificación coordinada: publicaciones casi simultáneas, texto o hashtags idénticos, frecuencia inhumana, cuentas recientes o vacías, patrones repetitivos, redes que solo retransmiten, proporción anormal de republicaciones y coordinación documentada por estudios o herramientas confiables.",
      "No declares que una cuenta es bot solo por publicar mucho, ser anónima, apoyar una postura o repetir un mensaje.",
      "Distingue entre bot confirmado, comportamiento compatible con automatización, campaña coordinada humana y evidencia insuficiente.",
      "Solo usa la etiqueta exacta INFORMACIÓN AMARILLISTA DIFUNDIDA POR BOTS cuando: el amarillismo sea alto, exista evidencia suficiente de amplificación automatizada y la confianza de esa detección sea alta.",
      "Si solo hay indicios, escribe POSIBLE DIFUSIÓN COORDINADA O AUTOMATIZADA y explica las limitaciones.",
      "La detección de bots debe basarse en evidencia observable y nunca inventar métricas, cuentas o herramientas consultadas.",
      "EDUCACIÓN DEL LECTOR:",
      "Explica qué está confirmado, qué falta, qué se exageró, por qué la narrativa puede inducir miedo y cómo sería una formulación informativa responsable.",
      "",
      "JERARQUÍA DE EVIDENCIA:",
      "Da mayor peso, sin aplicarlo mecánicamente, a: evidencia primaria; estudios con metodología; datos oficiales competentes; investigaciones periodísticas documentadas; verificadores transparentes; medios que enlazan evidencia primaria; declaraciones interesadas; opiniones y testimonios no corroborados.",
      "Una fuente oficial puede equivocarse y una fuente no oficial puede aportar evidencia válida. Evalúa el contenido.",
      "",
      "AUDITORÍA OBLIGATORIA DE SESGO Y PLURALIDAD DE FUENTES:",
      "Antes de concluir, separa la afirmación principal en componentes verificables. No permitas que un hecho verdadero preste credibilidad automática a otra acusación distinta incluida en la misma frase.",
      "Busca activamente evidencia favorable, evidencia contraria y evidencia neutral o primaria. Esta obligación de contradicción es indispensable antes de emitir el veredicto.",
      "Clasifica la orientación política de cada medio o actor únicamente como IZQUIERDA, DERECHA, MIXTO o NO DETERMINADO. No uses subdivisiones adicionales.",
      "La orientación política es contexto de propagación, nunca prueba de verdad o falsedad.",
      "No clasifiques una fuente por una sola nota. Usa evidencia pública acumulada: línea editorial recurrente, propiedad, vínculos declarados, posicionamientos sistemáticos, estudios de contenido o autodefinición. Si falta evidencia, usa NO DETERMINADO.",
      "Deduplica medios de la misma cadena, grupo empresarial, agencia, comunicado o fuente matriz. Varias réplicas no son corroboraciones independientes.",
      "Informa cuántas fuentes son de IZQUIERDA, cuántas de DERECHA, cuántas MIXTAS y cuántas NO DETERMINADAS, después de deduplicar réplicas.",
      "Si más del 70 por ciento de las fuentes independientes con orientación identificable pertenecen a un solo lado y faltan fuentes primarias o contrarias suficientes, marca ADVERTENCIA DE DESEQUILIBRIO DE FUENTES y reduce la confianza del análisis.",
      "No uses agresiones, amenazas o asesinatos de periodistas como prueba de una política gubernamental de censura sin identificar al agresor, el vínculo institucional y evidencia específica de coordinación estatal.",
      "Las críticas, descalificaciones o confrontaciones verbales de un gobernante con periodistas no equivalen por sí solas a censura, prohibición de publicar, cierre de medios ni política sistemática para silenciar a la prensa.",
      "Una investigación periodística sobre presuntos delitos es evidencia de que existe una acusación documentada, no prueba automática de que el delito ocurrió. Evalúa documentos, testimonios, corroboración independiente, refutaciones y estado procesal.",
      "La ausencia de sentencia no vuelve falsa una afirmación, pero tampoco permite presentarla como hecho probado. Distingue evidencia factual, acusación, investigación abierta y responsabilidad judicial.",
      "En afirmaciones sobre aprobación, popularidad o respaldo político, revisa varias encuestas recientes, sus fechas, preguntas, muestras, patrocinadores y metodologías. No extrapoles una encuesta aislada ni mezcles aprobación presidencial con aceptación de un movimiento político distinto.",
      "Explica si el resultado podría estar condicionado por una selección desequilibrada de fuentes. Si no se logró pluralidad suficiente, no presentes una conclusión tajante de alta confianza.",
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
"Usa 0 a 39 solo cuando sí se analizó la afirmación y la solidez del análisis sea muy baja.",
"Cuando el contenido no pueda consultarse, credibilidad y confianza deben ser null, no 0 ni 50.",
"Cuando un video contenga varias afirmaciones y no exista una sola afirmación global que pueda calificarse responsablemente, credibilidad debe ser null; entrega evaluaciones separadas en temas_video.",
"No reduzcas la confianza únicamente porque la conclusión sea FALSA.",
"No aumentes la confianza únicamente porque muchas páginas repitan la misma información.",
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
"Si la clasificación técnica es PARCIALMENTE VERDADERO, el veredicto_final debe ser PARCIALMENTE CIERTA.",
"Si la clasificación técnica es VERDADERO o MAYORMENTE VERDADERO, el veredicto_final debe ser CIERTA.",
"Si la clasificación técnica es FALSO, el veredicto_final debe ser FALSA. Si es ENGAÑOSO, FUERA DE CONTEXTO o CONTENIDO MANIPULADO, usa ENGAÑOSA salvo que la afirmación central sea materialmente falsa.",
"Si existen partes verdaderas y partes falsas, usa PARCIALMENTE VERDADERO como clasificación y explica cuáles son.",
"No conviertas una generalización sobre un medio, gobierno, periodista o institución en un hecho probado sin evidencia suficiente.",
"FORMATO:",
      "Devuelve únicamente JSON válido, sin Markdown ni texto adicional.",
      "Usa exactamente esta estructura:",
      "{",
      '  "estado": "analizado | sin_acceso",',
      '  "veredicto_final": "CIERTA | FALSA | PARCIALMENTE CIERTA | ENGAÑOSA | NO VERIFICABLE",',
      '  "explicacion_veredicto_final": "Explicación breve y directa",',
      '  "veredicto": "CLASIFICACIÓN PERMITIDA",',
      '  "credibilidad": 0,',
      '  "confianza": 0,',
      "Usa null en credibilidad y confianza cuando estado sea sin_acceso.",
      '  "afirmacion_principal": "Afirmación precisa investigada",',
      '  "respuesta_directa": "Respuesta clara y completa",',
      '  "resumen": "Resumen explicativo",',
      '  "resumen_video": "Síntesis completa del video o cadena vacía si no es video",',
      '  "temas_video": [{"tema":"Tema", "minuto":"00:00", "resumen":"Síntesis", "afirmaciones":["Afirmación"], "veredicto":"Evaluación específica", "contexto":"Contexto", "fuentes":["Fuente"]}],',
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
  const bloqueExtraccion = extraccionEnlace
    ? `

CONTENIDO RECUPERADO DEL ENLACE POR EL BACKEND:
Plataforma detectada: ${extraccionEnlace.plataforma || "Desconocida"}
URL original: ${extraccionEnlace.url_original || enlaceDetectado}
URL final después de redirecciones: ${extraccionEnlace.url_final || enlaceDetectado}
Acceso directo útil: ${extraccionEnlace.acceso_directo ? "sí" : "no"}
Título recuperado: ${extraccionEnlace.titulo || "No disponible"}
Autor o cuenta: ${extraccionEnlace.autor || "No disponible"}
Descripción: ${extraccionEnlace.descripcion || "No disponible"}
Fecha de publicación: ${extraccionEnlace.fecha_publicacion || "No disponible"}
Fecha de modificación: ${extraccionEnlace.fecha_modificacion || "No disponible"}
Estadísticas públicas disponibles: ${Object.keys(extraccionEnlace.estadisticas || {}).length ? JSON.stringify(extraccionEnlace.estadisticas) : "No disponibles"}
Transcripción: ${extraccionEnlace.transcripcion || "No disponible"}
Texto recuperado:
${extraccionEnlace.texto_recuperado || "No se recuperó texto utilizable."}
Comentarios recuperados realmente: ${extraccionEnlace.comentarios_recuperados ? "sí" : "no"}
Cantidad de comentarios recuperados: ${Array.isArray(extraccionEnlace.comentarios) ? extraccionEnlace.comentarios.length : 0}
Muestra de comentarios recuperados:
${Array.isArray(extraccionEnlace.comentarios) && extraccionEnlace.comentarios.length
  ? extraccionEnlace.comentarios.map((comentario, indice) =>
      `${indice + 1}. ${comentario.texto}${comentario.autor ? ` — ${comentario.autor}` : ""}${comentario.publicado ? ` (${comentario.publicado})` : ""}`
    ).join("\n")
  : "No se recuperaron comentarios."}
Limitaciones:
${(extraccionEnlace.limitaciones || []).map(item => `- ${item}`).join("\n") || "- Ninguna registrada."}

REGLAS SOBRE ESTE BLOQUE:
- No lo presentes como una fuente independiente; es contenido técnico extraído del enlace enviado.
- Busca y contrasta la afirmación en la web antes del veredicto.
- Si el enlace directo está bloqueado pero la afirmación puede identificarse por fuentes públicas, continúa el análisis y explica la limitación.
- No inventes comentarios, reacciones, transcripciones ni contenido no recuperado.`
    : "";

  contenidoUsuario.push({
    type: "input_text",
    text: `Modo de investigación: ${modo}.

Consulta:
${texto}${bloqueExtraccion}`
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
        "respuesta_directa", "resumen", "resumen_video", "temas_video", "hechos_comprobados",
        "evidencia_a_favor", "evidencia_en_contra",
        "indicadores_desinformacion", "contexto", "contraste_fuentes",
        "reputacion_fuente", "analisis_redes", "analisis_encuestas",
        "auditoria_sesgo_fuentes", "limitaciones", "conclusion", "analisis_integridad_informativa", "fuentes"
      ],
      properties: {
        estado: {
          type: "string",
          enum: ["analizado", "sin_acceso"]
        },
        veredicto_final: {
          type: "string",
          enum: ["CIERTA", "FALSA", "PARCIALMENTE CIERTA", "ENGAÑOSA", "NO VERIFICABLE"]
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
        credibilidad: { type: ["integer", "null"], minimum: 0, maximum: 100 },
        confianza: { type: ["integer", "null"], minimum: 0, maximum: 100 },
        afirmacion_principal: { type: "string" },
        respuesta_directa: { type: "string" },
        resumen: { type: "string" },
        resumen_video: { type: "string" },
        temas_video: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tema", "minuto", "resumen", "afirmaciones", "veredicto", "contexto", "fuentes"],
            properties: {
              tema: { type: "string" },
              minuto: { type: "string" },
              resumen: { type: "string" },
              afirmaciones: { type: "array", items: { type: "string" } },
              veredicto: { type: "string" },
              contexto: { type: "string" },
              fuentes: { type: "array", items: { type: "string" } }
            }
          }
        },
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
        auditoria_sesgo_fuentes: {
          type: "object",
          additionalProperties: false,
          required: [
            "fuentes_izquierda", "fuentes_derecha", "fuentes_mixtas",
            "fuentes_no_determinadas", "fuentes_primarias",
            "fuentes_independientes_deduplicadas", "predominio",
            "porcentaje_predominio", "confianza_clasificacion",
            "advertencia_desequilibrio", "obligacion_contradiccion_cumplida",
            "evidencia_contraria_buscada", "problemas_metodologicos",
            "explicacion", "limitaciones"
          ],
          properties: {
            fuentes_izquierda: { type: "array", items: { type: "string" } },
            fuentes_derecha: { type: "array", items: { type: "string" } },
            fuentes_mixtas: { type: "array", items: { type: "string" } },
            fuentes_no_determinadas: { type: "array", items: { type: "string" } },
            fuentes_primarias: { type: "array", items: { type: "string" } },
            fuentes_independientes_deduplicadas: { type: "integer", minimum: 0 },
            predominio: { type: "string", enum: ["IZQUIERDA", "DERECHA", "MIXTO", "NO DETERMINADO"] },
            porcentaje_predominio: { type: "integer", minimum: 0, maximum: 100 },
            confianza_clasificacion: { type: "integer", minimum: 0, maximum: 100 },
            advertencia_desequilibrio: { type: "boolean" },
            obligacion_contradiccion_cumplida: { type: "boolean" },
            evidencia_contraria_buscada: { type: "array", items: { type: "string" } },
            problemas_metodologicos: { type: "array", items: { type: "string" } },
            explicacion: { type: "string" },
            limitaciones: { type: "array", items: { type: "string" } }
          }
        },
        analisis_integridad_informativa: {
          type: "object",
          additionalProperties: false,
          required: [
            "indice_amarillismo", "nivel_amarillismo", "carga_emocional",
            "riesgo_confirmado", "riesgo_presentado", "extrapolaciones",
            "contexto_omitido", "titular_responsable", "explicacion_educativa",
            "fuentes_matriz", "replicas_no_independientes", "fuentes_independientes_reales",
            "evidencia_bots", "probabilidad_automatizacion", "confianza_deteccion_bots",
            "etiqueta_especial", "limitaciones"
          ],
          properties: {
            indice_amarillismo: { type: "integer", minimum: 0, maximum: 100 },
            nivel_amarillismo: { type: "string", enum: ["BAJO", "MODERADO", "ALTO", "EXTREMO"] },
            carga_emocional: { type: "array", items: { type: "string" } },
            riesgo_confirmado: { type: "string" },
            riesgo_presentado: { type: "string" },
            extrapolaciones: { type: "array", items: { type: "string" } },
            contexto_omitido: { type: "array", items: { type: "string" } },
            titular_responsable: { type: "string" },
            explicacion_educativa: { type: "string" },
            fuentes_matriz: { type: "array", items: { type: "string" } },
            replicas_no_independientes: { type: "array", items: { type: "string" } },
            fuentes_independientes_reales: { type: "integer", minimum: 0 },
            evidencia_bots: { type: "array", items: { type: "string" } },
            probabilidad_automatizacion: { type: "integer", minimum: 0, maximum: 100 },
            confianza_deteccion_bots: { type: "integer", minimum: 0, maximum: 100 },
            etiqueta_especial: {
              type: "string",
              enum: ["NINGUNA", "POSIBLE DIFUSIÓN COORDINADA O AUTOMATIZADA", "INFORMACIÓN AMARILLISTA DIFUNDIDA POR BOTS"]
            },
            limitaciones: { type: "array", items: { type: "string" } }
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

      if (openAIResponse.status === 429) {
        const retryAfter = openAIResponse.headers.get("retry-after");
        if (retryAfter) res.setHeader("Retry-After", retryAfter);

        return res.status(429).json({
          estado: "sin_acceso",
          estado_tecnico: "OPENAI_HTTP_429",
          veredicto_final: "NO VERIFICABLE",
          veredicto: "NO VERIFICABLE",
          credibilidad: null,
          confianza: null,
          mensaje: "El servicio alcanzó temporalmente su límite de solicitudes. Reintenta más tarde.",
          acciones_disponibles: ["REINTENTAR_MAS_TARDE"],
          reintentar: true
        });
      }

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
      if (valor === null || valor === undefined || valor === "") return null;
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return null;
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
    resultado.resumen_video = String(resultado.resumen_video || "").trim();
    resultado.temas_video = Array.isArray(resultado.temas_video)
      ? resultado.temas_video.map(tema => ({
          tema: String(tema?.tema || "").trim(),
          minuto: String(tema?.minuto || "").trim(),
          resumen: String(tema?.resumen || "").trim(),
          afirmaciones: limpiarLista(tema?.afirmaciones),
          veredicto: String(tema?.veredicto || "NO VERIFICABLE").trim(),
          contexto: String(tema?.contexto || "").trim(),
          fuentes: limpiarLista(tema?.fuentes)
        })).filter(tema => tema.tema || tema.resumen)
      : [];
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

    const sesgoBase =
      resultado.auditoria_sesgo_fuentes &&
      typeof resultado.auditoria_sesgo_fuentes === "object"
        ? resultado.auditoria_sesgo_fuentes
        : {};

    resultado.auditoria_sesgo_fuentes = {
      fuentes_izquierda: limpiarLista(sesgoBase.fuentes_izquierda),
      fuentes_derecha: limpiarLista(sesgoBase.fuentes_derecha),
      fuentes_mixtas: limpiarLista(sesgoBase.fuentes_mixtas),
      fuentes_no_determinadas: limpiarLista(sesgoBase.fuentes_no_determinadas),
      fuentes_primarias: limpiarLista(sesgoBase.fuentes_primarias),
      fuentes_independientes_deduplicadas: Math.max(0, Math.round(Number(sesgoBase.fuentes_independientes_deduplicadas) || 0)),
      predominio: ["IZQUIERDA", "DERECHA", "MIXTO", "NO DETERMINADO"].includes(sesgoBase.predominio)
        ? sesgoBase.predominio
        : "NO DETERMINADO",
      porcentaje_predominio: limitarPorcentaje(sesgoBase.porcentaje_predominio),
      confianza_clasificacion: limitarPorcentaje(sesgoBase.confianza_clasificacion),
      advertencia_desequilibrio: Boolean(sesgoBase.advertencia_desequilibrio),
      obligacion_contradiccion_cumplida: Boolean(sesgoBase.obligacion_contradiccion_cumplida),
      evidencia_contraria_buscada: limpiarLista(sesgoBase.evidencia_contraria_buscada),
      problemas_metodologicos: limpiarLista(sesgoBase.problemas_metodologicos),
      explicacion: String(sesgoBase.explicacion || "").trim(),
      limitaciones: limpiarLista(sesgoBase.limitaciones)
    };

    // Salvaguarda: si el análisis reconoce desequilibrio o no cumplió la contradicción,
    // la confianza no puede presentarse como alta.
    const asf = resultado.auditoria_sesgo_fuentes;
    if ((asf.advertencia_desequilibrio || !asf.obligacion_contradiccion_cumplida) && Number.isFinite(Number(resultado.confianza))) {
      resultado.confianza = Math.min(Number(resultado.confianza), 69);
    }

    const integridadBase =
      resultado.analisis_integridad_informativa &&
      typeof resultado.analisis_integridad_informativa === "object"
        ? resultado.analisis_integridad_informativa
        : {};

    resultado.analisis_integridad_informativa = {
      indice_amarillismo: limitarPorcentaje(integridadBase.indice_amarillismo),
      nivel_amarillismo: ["BAJO", "MODERADO", "ALTO", "EXTREMO"].includes(integridadBase.nivel_amarillismo)
        ? integridadBase.nivel_amarillismo
        : "BAJO",
      carga_emocional: limpiarLista(integridadBase.carga_emocional),
      riesgo_confirmado: String(integridadBase.riesgo_confirmado || "No determinado.").trim(),
      riesgo_presentado: String(integridadBase.riesgo_presentado || "No determinado.").trim(),
      extrapolaciones: limpiarLista(integridadBase.extrapolaciones),
      contexto_omitido: limpiarLista(integridadBase.contexto_omitido),
      titular_responsable: String(integridadBase.titular_responsable || "").trim(),
      explicacion_educativa: String(integridadBase.explicacion_educativa || "").trim(),
      fuentes_matriz: limpiarLista(integridadBase.fuentes_matriz),
      replicas_no_independientes: limpiarLista(integridadBase.replicas_no_independientes),
      fuentes_independientes_reales: Math.max(0, Math.round(Number(integridadBase.fuentes_independientes_reales) || 0)),
      evidencia_bots: limpiarLista(integridadBase.evidencia_bots),
      probabilidad_automatizacion: limitarPorcentaje(integridadBase.probabilidad_automatizacion),
      confianza_deteccion_bots: limitarPorcentaje(integridadBase.confianza_deteccion_bots),
      etiqueta_especial: [
        "NINGUNA",
        "POSIBLE DIFUSIÓN COORDINADA O AUTOMATIZADA",
        "INFORMACIÓN AMARILLISTA DIFUNDIDA POR BOTS"
      ].includes(integridadBase.etiqueta_especial)
        ? integridadBase.etiqueta_especial
        : "NINGUNA",
      limitaciones: limpiarLista(integridadBase.limitaciones)
    };

    // Salvaguarda: la etiqueta más grave exige evidencia y confianza altas.
    const ii = resultado.analisis_integridad_informativa;
    if (
      ii.etiqueta_especial === "INFORMACIÓN AMARILLISTA DIFUNDIDA POR BOTS" &&
      !(ii.indice_amarillismo >= 61 && ii.probabilidad_automatizacion >= 70 && ii.confianza_deteccion_bots >= 70 && ii.evidencia_bots.length > 0)
    ) {
      ii.etiqueta_especial = ii.evidencia_bots.length
        ? "POSIBLE DIFUSIÓN COORDINADA O AUTOMATIZADA"
        : "NINGUNA";
      ii.limitaciones.push("La evidencia disponible no alcanza el umbral para afirmar difusión por bots con alta confianza.");
    }

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

    const esVideoYouTube = extraccionEnlace?.plataforma === "YouTube";
    const videoConMultiplesTemas = esVideoYouTube && resultado.temas_video.length > 1;
    const usuarioSoloEnvioEnlace = consultaEsEnlace && texto.trim() === enlaceDetectado;
    if (videoConMultiplesTemas && usuarioSoloEnvioEnlace) {
      resultado.credibilidad = null;
      resultado.afirmacion_principal = "Contenido audiovisual con múltiples afirmaciones evaluadas por tema.";
    }

    // Un enlace bloqueado puede producir texto explicativo generado por el modelo.
    // Por eso no se usa la mera existencia de resumen/respuesta como prueba de acceso.
    const accesoRealmenteBloqueado =
      consultaEsEnlace &&
      !esImagen &&
      (
        resultado.estado === "sin_acceso" ||
        pareceSinAcceso(textoDiagnostico)
      );

    if (accesoRealmenteBloqueado) {
      resultado.estado = "sin_acceso";
      resultado.estado_tecnico = /(?:\b429\b|too many requests)/i.test(textoDiagnostico)
        ? "HTTP_429"
        : "ACCESO_RESTRINGIDO";
      resultado.veredicto = "NO VERIFICABLE";
      resultado.veredicto_final = "NO VERIFICABLE";

      // null significa “no calculado”. Nunca convertir un fallo técnico en 0%.
      resultado.credibilidad = null;
      resultado.confianza = null;

      resultado.explicacion_veredicto_final =
        resultado.estado_tecnico === "HTTP_429"
          ? "Threads limitó temporalmente las solicitudes (HTTP 429). No se evaluó la veracidad de la publicación."
          : "La plataforma restringió el acceso y no fue posible recuperar suficiente contenido para evaluar la afirmación.";

      resultado.respuesta_directa =
        "El contenido aún no fue evaluado. Sube una captura legible, pega el texto completo o reintenta después del tiempo de espera.";

      resultado.resumen =
        "El análisis quedó pendiente por una restricción técnica de acceso. Esto no implica que la publicación sea verdadera ni falsa.";

      resultado.conclusion =
        "Sin conocer la afirmación concreta no se puede confirmar ni desmentir responsablemente su veracidad.";

      resultado.hechos_comprobados = [];
      resultado.evidencia_a_favor = [];
      resultado.evidencia_en_contra = [];
      resultado.indicadores_desinformacion = [];
      resultado.mensaje =
        "Acceso limitado temporalmente. La credibilidad y la confianza permanecen pendientes de evaluación.";
      resultado.acciones_disponibles = [
        "REINTENTAR_MAS_TARDE",
        "SUBIR_CAPTURA",
        "PEGAR_TEXTO"
      ];
      resultado.reintentar = resultado.estado_tecnico === "HTTP_429";
    } else {
      resultado.estado = "analizado";
      resultado.estado_tecnico = "OK";
      resultado.acciones_disponibles = [];
      resultado.reintentar = false;
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
      if (resultado.estado === "sin_acceso") return null;

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

    if (extraccionEnlace) {
      resultado.extraccion_enlace = {
        plataforma: extraccionEnlace.plataforma || "Desconocida",
        url_original: extraccionEnlace.url_original || enlaceDetectado,
        url_final: extraccionEnlace.url_final || enlaceDetectado,
        acceso_directo: Boolean(extraccionEnlace.acceso_directo),
        comentarios_recuperados: Boolean(extraccionEnlace.comentarios_recuperados),
        titulo: String(extraccionEnlace.titulo || "").trim(),
        autor: String(extraccionEnlace.autor || "").trim(),
        descripcion: String(extraccionEnlace.descripcion || "").trim(),
        fecha_publicacion: String(extraccionEnlace.fecha_publicacion || "").trim(),
        fecha_modificacion: String(extraccionEnlace.fecha_modificacion || "").trim(),
        duracion_segundos: Number(extraccionEnlace.duracion_segundos || 0) || null,
        transcripcion_recuperada: Boolean(extraccionEnlace.transcripcion),
        segmentos_transcripcion: Array.isArray(extraccionEnlace.segmentos_transcripcion)
          ? extraccionEnlace.segmentos_transcripcion.length
          : 0,
        estadisticas: extraccionEnlace.estadisticas && typeof extraccionEnlace.estadisticas === "object"
          ? extraccionEnlace.estadisticas
          : {},
        comentarios: Array.isArray(extraccionEnlace.comentarios)
          ? extraccionEnlace.comentarios.slice(0, 50).map(comentario => ({
              autor: String(comentario.autor || "").trim(),
              texto: String(comentario.texto || "").trim(),
              publicado: String(comentario.publicado || "").trim(),
              me_gusta: Number(comentario.me_gusta || 0),
              respuestas: Number(comentario.respuestas || 0)
            }))
          : [],
        limitaciones: Array.isArray(extraccionEnlace.limitaciones)
          ? extraccionEnlace.limitaciones
          : []
      };
    }

    if (typeof resultado.credibilidad === "number" && resultado.veredicto === "FALSO" && resultado.credibilidad > 50) {
      resultado.credibilidad = 100 - resultado.credibilidad;
    }

    if (typeof resultado.credibilidad === "number" && resultado.veredicto === "VERDADERO" && resultado.credibilidad < 50) {
      resultado.credibilidad = 100 - resultado.credibilidad;
    }

    if (resultado.veredicto === "PARCIALMENTE VERDADERO") {
      resultado.veredicto_final = "PARCIALMENTE CIERTA";
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
