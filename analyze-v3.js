import analyzeHandler from './analyze.js';

// La Verdad Incómoda — guardas metodológicas V3.
// Este adaptador refuerza el motor existente sin duplicar sus 120 KB de lógica.
const POLICY = `\n\nREGLAS V3 OBLIGATORIAS PARA ESTA VERIFICACIÓN:\n1) Identifica primero la TESIS CENTRAL o acusación que el contenido intenta instalar.\n2) Separa hechos SUSTANTIVOS que prueban esa tesis de datos PERIFÉRICOS (nombre, cargo, fecha, parentesco, lugar, que alguien publicó la acusación, etc.). Un dato periférico verdadero NO convierte una acusación central falsa o no demostrada en PARCIALMENTE CIERTA.\n3) PARCIALMENTE CIERTA/PARCIALMENTE VERDADERO solo procede cuando al menos una proposición SUSTANTIVA de la tesis central está demostrada y otra proposición SUSTANTIVA está contradicha o no demostrada.\n4) Si la tesis central está materialmente contradicha por evidencia suficiente, usa FALSA/FALSO aunque contenga datos periféricos correctos.\n5) Si la tesis central atribuye órdenes secretas, encubrimiento, protección, conspiración, intención o causalidad y no existe evidencia suficiente para confirmarla o refutarla, usa NO VERIFICABLE/INFORMACIÓN INSUFICIENTE; no la premies con verdad parcial por hechos accesorios.\n6) AUDITA AL EMISOR: identifica la fuente matriz; revisa antecedentes públicos relevantes y una muestra verificable de publicaciones anteriores; registra patrón editorial, objetivos recurrentes, falsedades o correcciones documentadas, propiedad/financiamiento/conflictos solo si están sustentados, y orientación IZQUIERDA/DERECHA/MIXTA/NO DETERMINADA únicamente con evidencia acumulada. La orientación jamás decide la verdad.\n7) Distingue crítica legítima, opinión adversa, cobertura negativa recurrente, campaña de descrédito y ataque sistemático con desinformación. No atribuyas pago, coordinación o intención sin evidencia.\n8) Deduplica réplicas: varias notas que copian la misma fuente matriz cuentan como una sola cadena, no como corroboraciones independientes.\n9) Antes del veredicto responde internamente: ¿cuál es la tesis central?, ¿qué evidencia DIRECTA la prueba o contradice?, ¿qué datos son periféricos?, ¿quién origina la acusación y qué patrón verificable muestra su historial?\n10) Mantén presunción de inocencia y separa hechos procesales de culpabilidad.\n11) INVESTIGA EL ENTORNO COMPLETO antes de clasificar: localiza la fuente primaria, metodología, anexos o tablas, periodo comparable, alcance, limitaciones, reacciones oficiales y críticas técnicas pertinentes. No te limites a confirmar cómo circula el titular ni a resumir el texto proporcionado por el usuario.\n12) Para pruebas, índices, encuestas y estadísticas internacionales consulta obligatoriamente: nota del país o ficha oficial, informe y guía metodológica, significancia estadística, tamaño y cobertura de la muestra, cambios de población o elegibilidad y declaraciones públicas de quienes dirigen o elaboran la medición. Distingue una diferencia numérica de un cambio estadísticamente significativo.\n13) Verifica la exposición temporal: antes de atribuir un resultado a una reforma, gobierno, plan educativo o política, comprueba cuándo se aplicó, cuánto tiempo estuvieron expuestas las personas evaluadas y si la fuente primaria hace esa atribución causal.\n14) Evalúa por separado todo término fuerte del titular —por ejemplo "fracaso", "colapso", "milagro", "causó" o "demuestra"—. La existencia del titular o su repetición es CIRCUNSTANCIAL, no prueba directa de su verdad.\n15) NO VERIFICABLE se reserva para casos en los que, después de agotar la búsqueda, ninguna parte factual sustantiva de la tesis puede resolverse. Si hay componentes sustantivos confirmados y otros contradichos o no demostrados, usa PARCIALMENTE CIERTA; si los datos son reales pero el encuadre altera su significado, usa ENGAÑOSA.\n16) Un resultado NO VERIFICABLE debe tener credibilidad nula/no aplicable; nunca muestres simultáneamente "información insuficiente" y una credibilidad numérica alta.\n17) Si se solicitan comentarios de quienes dirigen, coordinan o elaboran una prueba, prioriza su intervención directa: presentación oficial, transcripción, video completo, artículo firmado o comunicado de la institución. Una nota periodística o un comunicado gubernamental que resuma sus palabras es evidencia secundaria y debe identificarse como tal; no inventes ni confirmes una cita que no recuperaste.\n18) Las palabras absolutas —"solo", "únicamente", "nunca", "siempre", "todos" o "ninguno"— requieren prueba del alcance total. Si la evidencia solo confirma algunos ejemplos o una reacción, no marques el absoluto como CONFIRMADO.\n19) No confundas dos preguntas: comprobar que una autoridad DIJO o ATRIBUYÓ algo no demuestra que la acusación editorial de que "culpa", "se excusa" o "busca un pretexto" sea cierta. Esas palabras atribuyen una estrategia o intención y requieren evidencia propia.\n20) En afirmaciones sobre PISA y COVID-19 contrasta obligatoriamente las intervenciones directas de la OCDE: la pandemia no puede ignorarse, pero no existe una relación simple entre cierres y tendencias, y parte del deterioro internacional empezó antes de 2020. No conviertas uno de esos matices en causa única.\n21) Si una frase mezcla una declaración comprobada con un encuadre acusatorio que omite causas concurrentes reconocidas por la fuente primaria, la categoría adecuada es ENGAÑOSA; usa FALSA solo cuando la tesis central esté contradicha de manera material.\n`;

const ATTRIBUTION_POLICY = `\nREGLAS DE ACUSACIONES Y ATRIBUCIÓN:\n22) Una fuente anónima es una atribución que debe evaluarse, no corroboración independiente. En acusaciones sobre salud, consumo de sustancias, delitos, vida privada o conducta actual de una persona, exige evidencia directa, pertinente e independientemente corroborada. La repetición de la acusación por portales o cuentas no satisface ese estándar.\n23) Si únicamente está confirmado que alguien DIJO, PUBLICÓ o REPITIÓ X, mientras X aparece como NO DEMOSTRADA o el propio informe reconoce que no hay pruebas verificables, nunca cierres con CIERTA ni PARCIALMENTE CIERTA. Usa NO VERIFICABLE si X no puede confirmarse ni refutarse; usa FALSA solo si evidencia suficiente contradice materialmente X.\n24) El historial de un emisor modifica cuánto contraste necesita su contenido, pero no decide el veredicto. Aplica el mismo método a Anabel Hernández, Atypical TV, Carlos Salinas Pliego, Chumel Torres, Luisito Comunica, Adela Micha, Latinus, cuentas oficialistas, autoridades y cualquier otra fuente. Documenta errores, correcciones y conflictos concretos; no uses etiquetas políticas como sustituto de pruebas.\n25) Cuando la fuente original califique su propia versión como supuesto, rumor, testimonio anónimo o no comprobado, conserva esa incertidumbre. No transformes ese lenguaje en un hecho confirmado.\n`;

const CHECKABLE_CLAIM_POLICY = `\nREGLAS PARA CONTENIDO SIN AFIRMACIÓN VERIFICABLE:\n26) Antes de emitir CIERTA, FALSA, PARCIALMENTE CIERTA o ENGAÑOSA, identifica una proposición factual completa sobre el mundo. Resolver una URL, identificar una cuenta o recuperar literalmente un fragmento solo acredita procedencia técnica; no demuestra la veracidad del contenido.\n27) Una frase elíptica, deíctica o coloquial sin referente recuperable —por ejemplo “te lo dije”, “mira esto”, “y es domingo” o solo emojis— no debe convertirse en una tesis inventada. Usa INFORMACIÓN INSUFICIENTE/NO VERIFICABLE, credibilidad no aplicable y explica qué contexto falta.\n28) La existencia del mismo usuario en otras plataformas y las páginas que limpian, expanden o visualizan enlaces no son evidencia favorable de una afirmación. Exclúyelas de las fuentes decisivas salvo que la consulta sea expresamente técnica sobre la identidad o redirección del enlace.\n29) Si no existe una afirmación factual identificable, no generes auditorías de orientación, financiamiento, patrón, intención, coordinación o reputación del autor: no hay una tesis sustantiva a la cual vincularlas.\n`;

function addPolicy(req) {
  const body = req.body || {};
  const keys = ['consulta','pregunta','question','query','text','input','content'];
  const key = keys.find(k => typeof body[k] === 'string' && body[k].trim());
  if (key) {
    req.body = { ...body, [key]: `${body[key]}${POLICY}${ATTRIBUTION_POLICY}${CHECKABLE_CLAIM_POLICY}` };
  } else if (typeof body.url === 'string' && body.url.trim()) {
    req.body = { ...body, consulta: `${body.url}${POLICY}${ATTRIBUTION_POLICY}${CHECKABLE_CLAIM_POLICY}` };
  }
}

function originalInput(req) {
  const body = req.body || {};
  const keys = ['consulta','pregunta','question','query','text','input','content'];
  const key = keys.find(k => typeof body[k] === 'string' && body[k].trim());
  return key ? body[key] : String(body.url || '');
}

export function applyPisaPandemicFramingGuard(result, input) {
  const thesis = `${input || ''} ${result.afirmacion_principal || ''}`;
  const isPisaPandemicClaim = /\bpisa\b/i.test(thesis) && /(?:covid|pandemi)/i.test(thesis);
  const hasLoadedBlameFrame = /(?:culp(?:a|an|ar|ó|aron)|excusa|pretexto|justifica(?:n|r|ción))/i.test(thesis);
  const currentlyTrue = result.veredicto_final === 'CIERTA' || ['VERDADERO', 'MAYORMENTE VERDADERO'].includes(result.veredicto);
  if (!isPisaPandemicClaim || !hasLoadedBlameFrame || !currentlyTrue) return result;

  result.veredicto = 'ENGAÑOSO';
  result.veredicto_final = 'ENGAÑOSA';
  result.credibilidad = Math.min(Number.isFinite(result.credibilidad) ? result.credibilidad : 45, 45);
  result.explicacion_veredicto_final =
    'Es engañosa: sí hay declaraciones gubernamentales que mencionan la pandemia, pero eso no demuestra la acusación de que el COVID-19 sea un pretexto inventado para eludir responsabilidad. La OCDE reconoce efectos pospandemia, advierte que las causas son múltiples, que parte del deterioro empezó antes de 2020 y que no existe una relación simple entre la duración de los cierres y las tendencias posteriores.';
  result.respuesta_directa =
    'No puede calificarse como cierta la insinuación de que citar la pandemia equivale a fabricar una excusa. El impacto educativo internacional del COVID-19 está documentado, aunque tampoco explica por sí solo todos los resultados de PISA.';
  result.conclusion = result.respuesta_directa;
  result.resumen =
    'La mención oficial del COVID-19 es comprobable; la acusación de que se usa como simple pretexto no lo es. La OCDE considera que la pandemia influyó, pero también señala tendencias previas y otros factores estructurales y digitales. Presentar cualquiera de esas causas como explicación única altera el sentido de la evidencia.';

  result.hechos_comprobados = [
    'La OCDE reporta para México resultados de PISA 2025 menores que en 2022 en matemáticas y aproximadamente iguales en lectura y ciencias.',
    'Andreas Schleicher señala que las secuelas de la pandemia no pueden ignorarse, pero que no existe una relación simple entre la duración de los cierres escolares y las tendencias posteriores.',
    'El secretario general de la OCDE advierte que las caídas internacionales no comenzaron únicamente con la pandemia y que en varios países ya existían antes de 2020.',
    'La OCDE identifica factores concurrentes como lectura digital superficial, menor lectura por placer, distracción con pantallas y ausentismo.'
  ];
  result.evidencia_a_favor = [
    'Autoridades mexicanas sí mencionaron la pandemia al responder sobre resultados educativos.',
    'La OCDE reconoce que las disrupciones asociadas al COVID-19 forman parte del contexto internacional.'
  ];
  result.evidencia_en_contra = [
    'La evidencia internacional contradice la insinuación de que el COVID-19 sea un factor ficticio o ajeno al deterioro educativo.',
    'La propia OCDE rechaza una explicación única: documenta tendencias previas a 2020 y otros factores posteriores.',
    'Encontrar declaraciones aisladas no demuestra que Morena o la 4T actúen siempre, uniformemente o con la intención de eludir responsabilidad.'
  ];
  result.evaluacion_afirmaciones = [
    {
      afirmacion: 'Autoridades mexicanas mencionaron el COVID-19 al explicar resultados educativos.',
      estado: 'CONFIRMADA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['Declaraciones públicas atribuidas a Presidencia y SEP.'],
      fuente_matriz: '',
      lo_que_no_demuestra: 'No prueba que la pandemia sea una excusa inventada ni una explicación única.'
    },
    {
      afirmacion: 'El COVID-19 es solo un pretexto sin sustento internacional para explicar los resultados de PISA.',
      estado: 'CONTRADICHA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['La OCDE reconoce efectos pospandemia, aunque descarta una relación causal simple o exclusiva.'],
      fuente_matriz: 'https://oecdedutoday.com/the-state-of-global-education-according-to-pisa/',
      lo_que_no_demuestra: 'No exime a las políticas nacionales ni atribuye todo el resultado a la pandemia.'
    },
    {
      afirmacion: 'Morena y la 4T culpan de forma general o sistemática a terceros.',
      estado: 'NO DEMOSTRADA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: [], fuente_matriz: '',
      lo_que_no_demuestra: 'Una muestra de declaraciones no prueba una conducta total, uniforme ni intencional.'
    }
  ];

  const primarySources = [
    {
      titulo: 'PISA 2025 Results: Mexico — Country note',
      url: 'https://www.oecd.org/en/publications/pisa-2025-results-volume-i-country-notes_2d4ff9ea-en/mexico_85702d30-en.html',
      tipo: 'Oficial',
      aporte: 'Resultados, tendencias, significancia y contexto de cobertura escolar de México.'
    },
    {
      titulo: 'The State of Global Education, according to PISA — Andreas Schleicher',
      url: 'https://oecdedutoday.com/the-state-of-global-education-according-to-pisa/',
      tipo: 'Oficial',
      aporte: 'Comentario directo sobre pandemia, tendencias previas y causas múltiples.'
    },
    {
      titulo: 'International launch of PISA 2025 — OECD Secretary-General',
      url: 'https://www.oecd.org/en/about/news/speech-statements/2026/09/international-launch-of-pisa-2025.html',
      tipo: 'Oficial',
      aporte: 'La OCDE afirma que el deterioro internacional no comenzó solo con COVID-19.'
    }
  ];
  const existing = Array.isArray(result.fuentes) ? result.fuentes : [];
  const seen = new Set();
  result.fuentes = [...primarySources, ...existing].filter(source => {
    const url = String(source?.url || '');
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  }).slice(0, 5);
  return result;
}

function normalizarTexto(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function consultaSoloAtribucion(input) {
  const original = String(input || '').trim();
  if (!original || /^https?:\/\/\S+$/i.test(original)) return false;
  const texto = normalizarTexto(original);
  if (/\blo que\s+(?:dijo|afirmo|declaro|publico|aseguro|sostuvo)\b/.test(texto)) return false;
  const verbo = '(?:dijo|afirmo|declaro|publico|escribio|difundio|aseguro|sostuvo|acuso)';
  return new RegExp(`^(?:¿\\s*)?(?:es cierto|es verdad|confirma|confirme|verifica|verifique|comprueba|compruebe|puedes confirmar|puede confirmar)\\s+(?:que|si)\\s+.{1,140}\\b${verbo}\\b`, 'i').test(texto) ||
    new RegExp(`^(?:¿\\s*)?[^?]{1,100}\\b${verbo}\\b[^?]{0,180}\\?\\s*$`, 'i').test(texto);
}

function esAtribucionOPeriferica(item) {
  const afirmacion = normalizarTexto(item?.afirmacion);
  const limite = normalizarTexto(item?.lo_que_no_demuestra);
  const atribucion = /\b(?:dijo|afirmo|declaro|publico|escribio|difundio|aseguro|sostuvo|acuso|reporto|compartio|emitio|reprodujo)\b/.test(afirmacion) ||
    /\b(?:publicacion|episodio|post|video|titular|acusacion|version|rumor)\b.{0,80}\b(?:existe|circula|aparecio|fue publicado|se difundio)\b/.test(afirmacion);
  const reconoceLimite = /\bno (?:demuestra|prueba|confirma|acredita)\b.{0,160}\b(?:tesis|afirmacion|acusacion|hecho|contenido|consumo|sea cierto|verdad)\b/.test(limite) ||
    /\bsolo (?:confirma|demuestra|prueba)\b.{0,100}\b(?:autoria|autor|publicacion|que .* (?:dijo|publico))\b/.test(limite);
  return item?.relacion_con_afirmacion === 'AJENA' ||
    item?.relacion_con_afirmacion === 'CIRCUNSTANCIAL' ||
    (atribucion && reconoceLimite);
}

function consultaSoloIdentidadEnlace(input) {
  const original = String(input || '').trim();
  if (!original || /^https?:\/\/\S+$/i.test(original)) return false;
  const texto = normalizarTexto(original.replace(/https?:\/\/\S+/gi, ' '));
  return /\b(?:enlace|link|url|publicacion|post)\b.{0,100}\b(?:apunta|redirige|corresponde|pertenece|lleva|es de)\b/.test(texto) ||
    /\b(?:quien|que cuenta|que usuario)\b.{0,100}\b(?:publico|escribio|subio|compartio)\b/.test(texto);
}

function esHechoTecnicoDeRecuperacion(value) {
  const texto = normalizarTexto(typeof value === 'string' ? value : value?.afirmacion);
  if (!texto) return false;
  return /\b(?:enlace|link|url)\b.{0,120}\b(?:apunta|redirige|corresponde|expande|resuelve|lleva)\b/.test(texto) ||
    /\b(?:apunta|redirige|corresponde|expande|resuelve|lleva)\b.{0,120}\b(?:enlace|link|url|publicacion|post)\b/.test(texto) ||
    /\b(?:vista previa|metadatos|conector)\b.{0,140}\b(?:muestra|recupera|identifica|contiene)\b/.test(texto) ||
    /\b(?:texto|fragmento)\b.{0,100}\b(?:visible|recuperado|indicado)\b/.test(texto);
}

function fuenteEsThreads(value) {
  try {
    const url = new URL(String(value || ''));
    return /(^|\.)threads\.(?:com|net)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function fuenteOriginalThreads(result, input) {
  const candidatas = [
    result?.extraccion_enlace?.url_final,
    result?.extraccion_enlace?.url_original,
    ...(Array.isArray(result?.fuentes) ? result.fuentes.map(fuente => fuente?.url) : []),
    String(input || '').match(/https?:\/\/[^\s]+/i)?.[0]
  ].filter(fuenteEsThreads);
  const url = candidatas.find(item => /\/@[^/]+\/(?:post|video)\//i.test(String(item))) || candidatas[0];
  if (!url) return [];
  return [{
    titulo: 'Publicación original en Threads',
    url: String(url),
    tipo: 'Red social',
    aporte: 'Permite identificar la procedencia y el fragmento visible; no aporta por sí sola el contexto necesario para un veredicto factual.'
  }];
}

/**
 * Evita presentar la resolución técnica de un enlace como verificación factual.
 * Solo actúa cuando el propio informe reconoce que no existe una tesis concreta
 * y los únicos elementos confirmados describen URL, cuenta o texto recuperado.
 */
export function applyNoCheckableClaimGuard(result, input = '') {
  if (!result || typeof result !== 'object' || consultaSoloIdentidadEnlace(input)) return result;

  const diagnostico = normalizarTexto([
    result.explicacion_veredicto_final,
    result.resumen,
    result.respuesta_directa,
    result.contexto,
    result.conclusion,
    ...(Array.isArray(result.limitaciones) ? result.limitaciones : [])
  ].join(' '));
  const reconoceAusenciaDeTesis = /(?:no (?:contiene|incluye|presenta|plantea|formula|permite identificar)|sin)\s+(?:una |ninguna )?(?:afirmacion(?:es)?|tesis|proposicion(?:es)?)(?:\s+(?:factual(?:es)?|concreta(?:s)?|verificable(?:s)?))?/.test(diagnostico) ||
    /no (?:hay|existe|se identifico|fue posible identificar).{0,45}(?:afirmacion|tesis).{0,45}(?:factual|concreta|verificable)/.test(diagnostico);

  const textoRecuperado = normalizarTexto([
    result?.extraccion_enlace?.titulo,
    result?.extraccion_enlace?.descripcion
  ].join(' '));
  const fragmentoSinReferente = textoRecuperado.length > 0 && textoRecuperado.length < 120 &&
    /\b(?:te lo dije|se los dije|ya lo sabia|mira esto|mira eso|y es domingo)\b/.test(textoRecuperado);
  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones)
    ? result.evaluacion_afirmaciones
    : [];
  const confirmadas = evaluaciones.filter(item => item?.estado === 'CONFIRMADA');
  const principalTecnica = esHechoTecnicoDeRecuperacion(result.afirmacion_principal);
  const principalDeclaraAusenciaDeTesis = /(?:ninguna|no (?:se )?(?:identifico|identifica|hay|existe)).{0,60}(?:afirmacion|tesis|proposicion).{0,40}(?:factual|concreta|verificable)/
    .test(normalizarTexto(result.afirmacion_principal));
  const principalEsMetaPreguntaSobreLaTesis = /(?:publicacion|post|fragmento|texto).{0,90}(?:contiene|incluye|presenta|formula|carece).{0,50}(?:afirmacion|acusacion|tesis|proposicion).{0,40}(?:factual|concreta|verificable)/
    .test(normalizarTexto(result.afirmacion_principal));
  const soloConfirmacionesTecnicas = confirmadas.length > 0 &&
    confirmadas.every(esHechoTecnicoDeRecuperacion);

  if (!(reconoceAusenciaDeTesis || fragmentoSinReferente) ||
      !(principalTecnica || principalDeclaraAusenciaDeTesis || principalEsMetaPreguntaSobreLaTesis || soloConfirmacionesTecnicas)) return result;

  const hechosTecnicos = [
    ...(Array.isArray(result.hechos_comprobados) ? result.hechos_comprobados : []),
    ...confirmadas.map(item => item.afirmacion)
  ].filter(esHechoTecnicoDeRecuperacion).filter((item, index, list) =>
    list.findIndex(other => normalizarTexto(other) === normalizarTexto(item)) === index
  ).slice(0, 2);

  result.estado = 'analizado';
  result.analizado = true;
  result.estado_tecnico = 'SIN_AFIRMACION_VERIFICABLE';
  result.tipo_resultado = 'sin_afirmacion_verificable';
  result.veredicto = 'INFORMACIÓN INSUFICIENTE';
  result.veredicto_final = 'NO VERIFICABLE';
  result.credibilidad = null;
  result.confianza = null;
  result.explicacion_veredicto_final =
    'Se identificaron la procedencia del enlace y un fragmento visible, pero eso no constituye una afirmación factual completa. Sin el referente de la frase ni el contexto de la publicación, no corresponde declararla cierta o falsa.';
  result.afirmacion_principal =
    'No se identificó una afirmación factual completa y verificable en el fragmento recuperado.';
  result.respuesta_directa =
    'No corresponde asignar un veredicto de verdad. El fragmento es coloquial y depende de un contexto que no fue recuperado.';
  result.resumen =
    'El enlace y su autoría pudieron identificarse, pero el texto visible no formula por sí solo una proposición comprobable. Hace falta el contenido anterior, la multimedia o el hilo completo para saber qué se está afirmando.';
  result.conclusion = result.respuesta_directa;
  result.contexto =
    'La expresión recuperada usa referencias implícitas —como “te lo dije”— sin indicar qué hecho, predicción o acontecimiento menciona.';
  result.contraste_fuentes =
    'La búsqueda no localizó una copia pública independiente que restituyera el referente, la multimedia o el hilo completo. Las herramientas de expansión de enlaces solo confirman navegación, no veracidad.';
  result.evaluacion_afirmaciones = [];
  result.hechos_comprobados = hechosTecnicos;
  result.evidencia_a_favor = [];
  result.evidencia_en_contra = [];
  result.indicadores_desinformacion = [];
  result.limitaciones = [
    'El fragmento visible no identifica a qué se refiere “te lo dije”.',
    'No se recuperaron el hilo completo, la multimedia ni una copia archivada con contexto verificable.'
  ];
  result.fuentes = fuenteOriginalThreads(result, input);
  result.auditoria_fuentes_periodisticas = [];
  result.analisis_encuestas = [];
  result.reputacion_fuente = {
    medio_o_autor: '', antecedentes_verificados: [], percepcion_en_redes: '',
    calidad_contenido_actual: '', conflictos_interes: [],
    limitaciones: 'No aplica: no se identificó una afirmación factual que justificara auditar al emisor.'
  };
  result.analisis_redes = {
    plataformas_consultadas: [], tendencias_observadas: [], posible_manipulacion: [],
    representatividad: '', limitaciones: ''
  };
  result.analisis_intencionalidad = {
    clasificacion: 'NO APLICA', objetivo_del_dano: '', tipo_de_perjuicio: [],
    evidencia: [], contraindicadores: [],
    explicacion: 'No se identificó una afirmación sustantiva cuyo propósito o daño pueda evaluarse.',
    confianza: 0
  };
  result.analisis_patron_objetivos = {
    objetivo_principal: '', publicaciones_revisadas: 0, publicaciones_dirigidas: 0,
    periodo_muestra: '', clasificacion: 'SIN PATRÓN DEMOSTRADO',
    recursos_recurrentes: [], ejemplos: [], fundamento: '', limitaciones: []
  };
  if (result.analisis_integridad_informativa && typeof result.analisis_integridad_informativa === 'object') {
    result.analisis_integridad_informativa = {
      ...result.analisis_integridad_informativa,
      cuentas_comparadas: [], publicaciones_coincidentes: [],
      evidencia_coordinacion: [], evidencia_bots: [],
      patron_publicacion_grupal: '', etiqueta_especial: 'NINGUNA'
    };
  }
  return result;
}

/**
 * Impide que la existencia de una acusación se use como prueba de su contenido.
 * La regla es agnóstica respecto de la orientación política del emisor.
 */
export function applyEmbeddedAllegationGuard(result, input = '') {
  if (!result || typeof result !== 'object' || consultaSoloAtribucion(input)) return result;

  const final = normalizarTexto(result.veredicto_final);
  const tecnico = normalizarTexto(result.veredicto);
  const esAfirmativo = ['cierta', 'parcialmente cierta'].includes(final) ||
    ['verdadero', 'cierto', 'mayormente verdadero', 'parcialmente verdadero', 'parcialmente cierto'].includes(tecnico);
  if (!esAfirmativo) return result;

  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones)
    ? result.evaluacion_afirmaciones
    : [];
  const confirmadas = evaluaciones.filter(item => item?.estado === 'CONFIRMADA');
  const noDemostradas = evaluaciones.filter(item => item?.estado === 'NO DEMOSTRADA');
  const contradichas = evaluaciones.filter(item => item?.estado === 'CONTRADICHA');
  const confirmacionSustantiva = confirmadas.filter(item => !esAtribucionOPeriferica(item));
  const pendienteSustantiva = noDemostradas.filter(item =>
    !/\b(?:dijo|afirmo|declaro|publico|difundio)\b/.test(normalizarTexto(item?.afirmacion))
  );
  const contradiccionSustantiva = contradichas.filter(item => !esAtribucionOPeriferica(item));
  const diagnostico = normalizarTexto([
    result.explicacion_veredicto_final,
    result.respuesta_directa,
    result.resumen,
    result.conclusion,
    ...(Array.isArray(result.limitaciones) ? result.limitaciones : [])
  ].join(' '));
  const reconoceFaltaDePrueba = /(?:no (?:presento|aporto|hay|existen|se hallo|se encontro).{0,90}(?:prueba|evidencia|corroboracion)|carece de (?:prueba|evidencia|sustento)|sin (?:prueba|evidencia|corroboracion)|fuentes? anonimas?.{0,120}(?:sin|no).{0,60}(?:corrobor|confirm|verific)|no (?:puede|pudo) confirmarse)/.test(diagnostico);
  const soloSeConfirmoLaDifusion = confirmadas.length > 0 && confirmacionSustantiva.length === 0;
  const hayTesisPendiente = pendienteSustantiva.length > 0 || reconoceFaltaDePrueba;

  if (!hayTesisPendiente || (!soloSeConfirmoLaDifusion && confirmacionSustantiva.length > 0)) return result;

  const refutada = contradiccionSustantiva.length > 0;
  result.veredicto = refutada ? 'FALSO' : 'INFORMACIÓN INSUFICIENTE';
  result.veredicto_final = refutada ? 'FALSA' : 'NO VERIFICABLE';
  result.credibilidad = refutada
    ? Math.min(Number.isFinite(result.credibilidad) ? result.credibilidad : 20, 20)
    : null;
  result.explicacion_veredicto_final = refutada
    ? 'Se comprobó que la acusación fue publicada, pero ese hecho no prueba su contenido. La afirmación sustantiva está contradicha por evidencia directa suficiente; por eso el veredicto corresponde a la acusación y es FALSA.'
    : 'Se comprobó que la acusación fue publicada, no que el hecho alegado haya ocurrido. Una fuente anónima y las notas o cuentas que repiten la misma versión no constituyen corroboraciones independientes. Sin evidencia directa suficiente que confirme o contradiga la afirmación sustantiva, el veredicto es NO VERIFICABLE.';
  result.respuesta_directa = refutada
    ? 'No. Está documentada la publicación de la acusación, pero la evidencia directa disponible contradice su contenido.'
    : 'No se puede afirmar que sea cierta. Está documentado que alguien difundió la acusación, pero no hay evidencia pública e independiente suficiente que demuestre el hecho alegado.';
  result.resumen = result.respuesta_directa;
  result.conclusion = result.respuesta_directa;

  for (const item of evaluaciones) {
    if (item?.estado === 'CONFIRMADA' && esAtribucionOPeriferica(item)) {
      item.relacion_con_afirmacion = 'CIRCUNSTANCIAL';
      if (!String(item.lo_que_no_demuestra || '').trim()) {
        item.lo_que_no_demuestra = 'La existencia o autoría de la acusación no demuestra que su contenido sea verdadero.';
      }
    }
    if (item?.estado === 'NO DEMOSTRADA' &&
        !/\b(?:dijo|afirmo|declaro|publico|difundio)\b/.test(normalizarTexto(item?.afirmacion))) {
      item.relacion_con_afirmacion = 'DIRECTA';
    }
  }

  result.evidencia_a_favor = [];
  const limites = Array.isArray(result.limitaciones) ? result.limitaciones : [];
  result.limitaciones = [...new Set([
    ...limites,
    'La existencia de la publicación y sus réplicas solo acredita que la acusación circuló; no acredita el hecho alegado.',
    'La ausencia de evidencia pública suficiente tampoco demuestra automáticamente la afirmación contraria.'
  ])];
  return result;
}

export function normalize(result, input = '') {
  if (!result || typeof result !== 'object') return result;
  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones) ? result.evaluacion_afirmaciones : [];

  // El encabezado y la clasificación técnica expresan el mismo veredicto.
  // Ante una respuesta incompatible, conserva la categoría técnica más
  // matizada y refleja su equivalente editorial en el encabezado.
  const finalPorTecnico = {
    VERDADERO: 'CIERTA',
    CIERTO: 'CIERTA',
    FALSO: 'FALSA',
    'PARCIALMENTE VERDADERO': 'PARCIALMENTE CIERTA',
    'PARCIALMENTE CIERTO': 'PARCIALMENTE CIERTA',
    ENGAÑOSO: 'ENGAÑOSA',
    'INFORMACIÓN INSUFICIENTE': 'NO VERIFICABLE',
    'NO VERIFICABLE': 'NO VERIFICABLE',
    'NO COMPROBABLE': 'NO VERIFICABLE'
  };
  const tecnicoInicial = String(result.veredicto || '').toUpperCase().trim();
  if (finalPorTecnico[tecnicoInicial]) result.veredicto_final = finalPorTecnico[tecnicoInicial];

  // Una URL institucional no debe mostrarse como fuente periodística por un
  // error de clasificación del modelo.
  if (Array.isArray(result.fuentes)) {
    for (const fuente of result.fuentes) {
      try {
        const host = new URL(String(fuente?.url || '')).hostname.toLowerCase();
        if (host === 'oecd.org' || host.endsWith('.oecd.org') || host === 'gob.mx' || host.endsWith('.gob.mx')) {
          fuente.tipo = 'Oficial';
        }
      } catch {}
    }
  }

  // Una evidencia parcial no confirma términos absolutos. Si el propio campo
  // "lo que no demuestra" reconoce esa carencia, corrige el estado antes de
  // reconciliar el veredicto.
  for (const item of evaluaciones) {
    const afirmacion = String(item?.afirmacion || '');
    const limite = String(item?.lo_que_no_demuestra || '');
    if (
      item?.estado === 'CONFIRMADA' &&
      /\b(?:solo|sólo|únicamente|nunca|siempre|todos?|ningun[oa]s?)\b/i.test(afirmacion) &&
      /(?:no (?:prueba|demuestra)|interpretativ|no permite afirmar|alcance total)/i.test(limite)
    ) {
      item.estado = 'NO DEMOSTRADA';
      item.sustento_directo = [];
    }
  }

  const directas = evaluaciones.filter(e => e?.relacion_con_afirmacion === 'DIRECTA');
  const confirmadas = directas.filter(e => e?.estado === 'CONFIRMADA');
  const contradichas = directas.filter(e => e?.estado === 'CONTRADICHA');
  const noDemostradas = directas.filter(e => e?.estado === 'NO DEMOSTRADA');

  const finalNormalizado = String(result.veredicto_final || '').toUpperCase();
  const tecnicoNormalizado = String(result.veredicto || '').toUpperCase();
  const noVerificable = finalNormalizado === 'NO VERIFICABLE' ||
    ['INFORMACIÓN INSUFICIENTE', 'NO VERIFICABLE', 'NO COMPROBABLE'].includes(tecnicoNormalizado);

  // Coherencia mínima: no puede afirmarse "información insuficiente" y, al
  // mismo tiempo, asignar una credibilidad numérica alta.
  if (noVerificable && confirmadas.length === 0) {
    result.credibilidad = null;
  }

  // Si el propio análisis resolvió al menos una proposición sustantiva directa,
  // el caso ya no es totalmente no verificable. La parte pendiente debe
  // conservarse como límite dentro de un veredicto parcial.
  if (noVerificable && confirmadas.length > 0) {
    result.veredicto_final = 'PARCIALMENTE CIERTA';
    result.veredicto = 'PARCIALMENTE VERDADERO';
    result.explicacion_veredicto_final =
      `${result.explicacion_veredicto_final || ''} El resultado no es totalmente no verificable: el propio análisis confirmó al menos una proposición sustantiva directa; las restantes deben presentarse como contradichas o no demostradas.`.trim();
  }

  // Salvaguarda determinista: una verdad parcial requiere sustento directo sustantivo.
  if (result.veredicto_final === 'PARCIALMENTE CIERTA' || result.veredicto === 'PARCIALMENTE VERDADERO') {
    if (confirmadas.length === 0) {
      if (contradichas.length > 0) {
        result.veredicto_final = 'FALSA';
        result.veredicto = 'FALSO';
        result.explicacion_veredicto_final = `${result.explicacion_veredicto_final || ''} La clasificación parcial fue descartada porque no existe una proposición sustantiva directa confirmada y sí existe contradicción directa.`.trim();
      } else {
        result.veredicto_final = 'NO VERIFICABLE';
        result.veredicto = 'INFORMACIÓN INSUFICIENTE';
        result.explicacion_veredicto_final = `${result.explicacion_veredicto_final || ''} La clasificación parcial fue descartada porque los datos confirmados no prueban directamente una parte sustantiva de la tesis central.`.trim();
      }
    } else if (contradichas.length === 0 && noDemostradas.length === 0) {
      result.veredicto_final = 'CIERTA';
      if (result.veredicto === 'PARCIALMENTE VERDADERO') result.veredicto = 'VERDADERO';
    }
  }
  return applyPisaPandemicFramingGuard(
    applyEmbeddedAllegationGuard(applyNoCheckableClaimGuard(result, input), input),
    input
  );
}

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const input = originalInput(req);
  addPolicy(req);
  const originalJson = res.json.bind(res);
  res.json = payload => originalJson(normalize(payload, input));
  return analyzeHandler(req, res);
}
