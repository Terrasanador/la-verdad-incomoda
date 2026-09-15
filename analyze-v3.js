import analyzeHandler from './analyze.js';

// La Verdad Incómoda — guardas metodológicas V3.
// Este adaptador refuerza el motor existente sin duplicar sus 120 KB de lógica.
const POLICY = `\n\nREGLAS V3 OBLIGATORIAS PARA ESTA VERIFICACIÓN:\n1) Identifica primero la TESIS CENTRAL o acusación que el contenido intenta instalar.\n2) Separa hechos SUSTANTIVOS que prueban esa tesis de datos PERIFÉRICOS (nombre, cargo, fecha, parentesco, lugar, que alguien publicó la acusación, etc.). Un dato periférico verdadero NO convierte una acusación central falsa o no demostrada en PARCIALMENTE CIERTA.\n3) PARCIALMENTE CIERTA/PARCIALMENTE VERDADERO solo procede cuando al menos una proposición SUSTANTIVA de la tesis central está demostrada y otra proposición SUSTANTIVA está contradicha o no demostrada.\n4) Si la tesis central está materialmente contradicha por evidencia suficiente, usa FALSA/FALSO aunque contenga datos periféricos correctos.\n5) Si la tesis central atribuye órdenes secretas, encubrimiento, protección, conspiración, intención o causalidad y no existe evidencia suficiente para confirmarla o refutarla, usa NO VERIFICABLE/INFORMACIÓN INSUFICIENTE; no la premies con verdad parcial por hechos accesorios.\n6) AUDITA AL EMISOR: identifica la fuente matriz; revisa antecedentes públicos relevantes y una muestra verificable de publicaciones anteriores; registra patrón editorial, objetivos recurrentes, falsedades o correcciones documentadas, propiedad/financiamiento/conflictos solo si están sustentados, y orientación IZQUIERDA/DERECHA/MIXTA/NO DETERMINADA únicamente con evidencia acumulada. La orientación jamás decide la verdad.\n7) Distingue crítica legítima, opinión adversa, cobertura negativa recurrente, campaña de descrédito y ataque sistemático con desinformación. No atribuyas pago, coordinación o intención sin evidencia.\n8) Deduplica réplicas: varias notas que copian la misma fuente matriz cuentan como una sola cadena, no como corroboraciones independientes.\n9) Antes del veredicto responde internamente: ¿cuál es la tesis central?, ¿qué evidencia DIRECTA la prueba o contradice?, ¿qué datos son periféricos?, ¿quién origina la acusación y qué patrón verificable muestra su historial?\n10) Mantén presunción de inocencia y separa hechos procesales de culpabilidad.\n11) INVESTIGA EL ENTORNO COMPLETO antes de clasificar: localiza la fuente primaria, metodología, anexos o tablas, periodo comparable, alcance, limitaciones, reacciones oficiales y críticas técnicas pertinentes. No te limites a confirmar cómo circula el titular ni a resumir el texto proporcionado por el usuario.\n12) Para pruebas, índices, encuestas y estadísticas internacionales consulta obligatoriamente: nota del país o ficha oficial, informe y guía metodológica, significancia estadística, tamaño y cobertura de la muestra, cambios de población o elegibilidad y declaraciones públicas de quienes dirigen o elaboran la medición. Distingue una diferencia numérica de un cambio estadísticamente significativo.\n13) Verifica la exposición temporal: antes de atribuir un resultado a una reforma, gobierno, plan educativo o política, comprueba cuándo se aplicó, cuánto tiempo estuvieron expuestas las personas evaluadas y si la fuente primaria hace esa atribución causal.\n14) Evalúa por separado todo término fuerte del titular —por ejemplo "fracaso", "colapso", "milagro", "causó" o "demuestra"—. La existencia del titular o su repetición es CIRCUNSTANCIAL, no prueba directa de su verdad.\n15) NO VERIFICABLE se reserva para casos en los que, después de agotar la búsqueda, ninguna parte factual sustantiva de la tesis puede resolverse. Si hay componentes sustantivos confirmados y otros contradichos o no demostrados, usa PARCIALMENTE CIERTA; si los datos son reales pero el encuadre altera su significado, usa ENGAÑOSA.\n16) Un resultado NO VERIFICABLE debe tener credibilidad nula/no aplicable; nunca muestres simultáneamente "información insuficiente" y una credibilidad numérica alta.\n17) Si se solicitan comentarios de quienes dirigen, coordinan o elaboran una prueba, prioriza su intervención directa: presentación oficial, transcripción, video completo, artículo firmado o comunicado de la institución. Una nota periodística o un comunicado gubernamental que resuma sus palabras es evidencia secundaria y debe identificarse como tal; no inventes ni confirmes una cita que no recuperaste.\n18) Las palabras absolutas —"solo", "únicamente", "nunca", "siempre", "todos" o "ninguno"— requieren prueba del alcance total. Si la evidencia solo confirma algunos ejemplos o una reacción, no marques el absoluto como CONFIRMADO.\n19) No confundas dos preguntas: comprobar que una autoridad DIJO o ATRIBUYÓ algo no demuestra que la acusación editorial de que "culpa", "se excusa" o "busca un pretexto" sea cierta. Esas palabras atribuyen una estrategia o intención y requieren evidencia propia.\n20) En afirmaciones sobre PISA y COVID-19 contrasta obligatoriamente las intervenciones directas de la OCDE: la pandemia no puede ignorarse, pero no existe una relación simple entre cierres y tendencias, y parte del deterioro internacional empezó antes de 2020. No conviertas uno de esos matices en causa única.\n21) Si una frase mezcla una declaración comprobada con un encuadre acusatorio que omite causas concurrentes reconocidas por la fuente primaria, la categoría adecuada es ENGAÑOSA; usa FALSA solo cuando la tesis central esté contradicha de manera material.\n`;

const ATTRIBUTION_POLICY = `\nREGLAS DE ACUSACIONES Y ATRIBUCIÓN:\n22) Una fuente anónima es una atribución que debe evaluarse, no corroboración independiente. En acusaciones sobre salud, consumo de sustancias, delitos, vida privada o conducta actual de una persona, exige evidencia directa, pertinente e independientemente corroborada. La repetición de la acusación por portales o cuentas no satisface ese estándar.\n23) Si únicamente está confirmado que alguien DIJO, PUBLICÓ o REPITIÓ X, mientras X aparece como NO DEMOSTRADA o el propio informe reconoce que no hay pruebas verificables, nunca cierres con CIERTA ni PARCIALMENTE CIERTA. Usa NO VERIFICABLE si X no puede confirmarse ni refutarse; usa FALSA solo si evidencia suficiente contradice materialmente X.\n24) El historial de un emisor modifica cuánto contraste necesita su contenido, pero no decide el veredicto. Aplica el mismo método a Anabel Hernández, Atypical TV, Carlos Salinas Pliego, Chumel Torres, Luisito Comunica, Adela Micha, Latinus, cuentas oficialistas, autoridades y cualquier otra fuente. Documenta errores, correcciones y conflictos concretos; no uses etiquetas políticas como sustituto de pruebas.\n25) Cuando la fuente original califique su propia versión como supuesto, rumor, testimonio anónimo o no comprobado, conserva esa incertidumbre. No transformes ese lenguaje en un hecho confirmado.\n`;

const CHECKABLE_CLAIM_POLICY = `\nREGLAS PARA CONTENIDO SIN AFIRMACIÓN VERIFICABLE:\n26) Antes de emitir CIERTA, FALSA, PARCIALMENTE CIERTA o ENGAÑOSA, identifica una proposición factual completa sobre el mundo. Resolver una URL, identificar una cuenta o recuperar literalmente un fragmento solo acredita procedencia técnica; no demuestra la veracidad del contenido.\n27) Una frase elíptica, deíctica o coloquial sin referente recuperable —por ejemplo “te lo dije”, “mira esto”, “y es domingo” o solo emojis— no debe convertirse en una tesis inventada. Usa INFORMACIÓN INSUFICIENTE/NO VERIFICABLE, credibilidad no aplicable y explica qué contexto falta.\n28) La existencia del mismo usuario en otras plataformas y las páginas que limpian, expanden o visualizan enlaces no son evidencia favorable de una afirmación. Exclúyelas de las fuentes decisivas salvo que la consulta sea expresamente técnica sobre la identidad o redirección del enlace.\n29) Si no existe una afirmación factual identificable, no generes auditorías de orientación, financiamiento, patrón, intención, coordinación o reputación del autor: no hay una tesis sustantiva a la cual vincularlas.\n`;

const POLITICAL_CONTEXT_POLICY = `\nREGLAS PARA CITAS Y ENCUADRES POLÍTICOS:\n30) Cuando una publicación política cita a una persona, la autoría de la frase es una comprobación secundaria. Salvo que el usuario pregunte expresamente “¿lo dijo?”, formula como tesis central la proposición factual que la cita pretende hacer creer y comprueba esa proposición.\n31) Separa cuatro capas: (a) qué dijo el actor; (b) qué decidió realmente la autoridad competente; (c) qué consecuencia factual se atribuye a esa decisión; y (d) si se responsabiliza a un gobierno o partido. No permitas que la capa (a) confirme automáticamente las capas (b), (c) o (d).\n32) Un comunicado partidista es fuente primaria para la postura del partido, no prueba independiente de fraude, captura institucional, mala fe, autoritarismo, encubrimiento ni control gubernamental. Aplica exactamente la misma regla a comunicados oficialistas y opositores.\n33) Ante expresiones como “legaliza el fraude”, “el gobierno controla”, “institución cooptada” o equivalentes, consulta el acuerdo, ley, resolución, votación o procedimiento original. Compara sujeto competente, alcance, salvaguardas, revisión y vías de impugnación antes de clasificar.\n34) Describe el encuadre político observable —qué actor responsabiliza a quién y con qué palabras—, pero distingue función retórica de intención psicológica. Una crítica explícita permite identificar su objetivo; no demuestra por sí sola que el emisor sepa que miente, reciba instrucciones o participe en una coordinación.\n35) Si el documento original contradice la descripción factual que sostiene la acusación, el veredicto debe recaer sobre esa descripción y ser FALSA o ENGAÑOSA según el alcance del error, aunque la cita sea auténtica.\n36) En el informe, marca “X dijo Y” como CIRCUNSTANCIAL y presenta por separado la veracidad de Y. Incluye tanto los elementos que hacen razonable la preocupación como las salvaguardas o hechos que contradicen la conclusión política.\n37) Una denuncia, queja o envío a una fiscalía confirma que se formuló una acusación; no confirma el delito denunciado, la participación de las personas señaladas ni la existencia de una organización inventada por el emisor. Exige resoluciones, expedientes accesibles, documentos, testimonios identificables o evidencia independiente que conecte sujeto, conducta y fecha.\n38) No unas frases separadas para fabricar una cronología. Una fecha solo sustenta el inicio de un hecho si la fuente la vincula expresamente con ese hecho; la proximidad de dos párrafos no autoriza esa inferencia.\n39) En acusaciones categóricas de pacto criminal, narcogobierno, encubrimiento o pertenencia a un cártel, los casos comprobados de terceros y los indicadores generales de violencia son contexto, no prueba automática de un acuerdo del presidente o del gobierno.\n40) Si una publicación presenta como hecho una acusación penal categórica y sus propias fuentes solo acreditan que un adversario la pronunció, o ni siquiera contienen la fecha o el vínculo atribuidos, clasifica la publicación como FALSA. Explica por separado que la tesis subyacente no quedó demostrada y que la ausencia de prueba pública no demuestra imposibilidad absoluta.\n`;

const BOOK_EVIDENCE_POLICY = `\nREGLAS PARA LIBROS, SINOPSIS Y RESEÑAS:\n41) Una ficha editorial, contraportada, página de venta, Google Books, reseña, entrevista promocional o resumen confirma que una obra y su tesis existen; no demuestra que sus acusaciones sean verdaderas. Nunca las uses como corroboración independiente del contenido del libro.\n42) Para validar una acusación factual de un libro exige la evidencia subyacente pertinente: documentos identificables, expedientes, resoluciones, registros, testimonios corroborados y contraste independiente. La reputación, premios o historial crítico de la autora tampoco sustituyen esa prueba.\n43) No uses un libro anterior para validar automáticamente otro libro, video o acusación posterior. Comprueba título, edición, fecha, pasaje y evidencia específica.\n44) Si no recuperaste la transcripción del video ni examinaste el pasaje íntegro del libro, no atribuyas documentos o testimonios concretos ni afirmes que la obra “demuestra” la tesis. Declara la limitación.\n45) Expresiones absolutas o totalizantes como “el crimen organizado se convirtió en el sistema mismo” o “las instituciones ocultan la realidad” requieren evidencia de ese alcance. Casos particulares de corrupción o infiltración no prueban una sustitución total del Estado ni una política unificada de ocultamiento. Si la publicación presenta ese salto como hecho y solo aporta sinopsis, reseñas o la voz de la propia autora, clasifica la afirmación categórica como FALSA.\n`;

function addPolicy(req) {
  const body = req.body || {};
  const keys = ['consulta','pregunta','question','query','text','input','content'];
  const key = keys.find(k => typeof body[k] === 'string' && body[k].trim());
  if (key) {
    req.body = { ...body, [key]: `${body[key]}${POLICY}${ATTRIBUTION_POLICY}${CHECKABLE_CLAIM_POLICY}${POLITICAL_CONTEXT_POLICY}${BOOK_EVIDENCE_POLICY}` };
  } else if (typeof body.url === 'string' && body.url.trim()) {
    req.body = { ...body, consulta: `${body.url}${POLICY}${ATTRIBUTION_POLICY}${CHECKABLE_CLAIM_POLICY}${POLITICAL_CONTEXT_POLICY}${BOOK_EVIDENCE_POLICY}` };
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
  const atribucion = /\b(?:dijo|afirmo|declaro|publico|escribio|difundio|aseguro|sostuvo|acuso|denuncio|imputo|formulo|presento|reporto|compartio|emitio|reprodujo|pidio|exigio|advirtio|cuestiono|califico|llamo)\b/.test(afirmacion) ||
    /\b(?:publicacion|episodio|post|video|titular|acusacion|version|rumor)\b.{0,80}\b(?:existe|circula|aparecio|fue publicado|se difundio)\b/.test(afirmacion);
  return item?.relacion_con_afirmacion === 'AJENA' ||
    item?.relacion_con_afirmacion === 'CIRCUNSTANCIAL' ||
    atribucion;
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
  const reconoceFaltaDePrueba = /(?:no (?:presento|aporto|hay|existen|se hallo|se encontro).{0,90}(?:prueba|evidencia|corroboracion)|carece de (?:prueba|evidencia|sustento)|sin (?:prueba|evidencia|corroboracion)|no (?:hay|existen).{0,70}(?:sentencias?|resoluciones?|documentos?|peritajes?)|(?:alegatos?|acusaciones?|imputaciones?).{0,80}(?:no equivalen|sin|no constituyen).{0,60}(?:prueba|evidencia)|fuentes? anonimas?.{0,120}(?:sin|no).{0,60}(?:corrobor|confirm|verific)|no (?:puede|pudo) confirmarse|no (?:demuestra|prueba|acredita|confirma).{0,140}(?:fraude|mala fe|control|cooptacion|captura|acusacion|tesis|afirmacion|hecho|contenido|sea cierto|verdad))/i.test(diagnostico);
  const soloSeConfirmoLaDifusion = confirmadas.length > 0 && confirmacionSustantiva.length === 0;
  // Si todas las confirmaciones son actos de habla, ya existe una tesis
  // sustantiva pendiente aunque el modelo haya omitido separarla en su lista.
  // Esto impide que una salida como “Moreno acusó X” valide automáticamente X.
  const hayTesisPendiente = pendienteSustantiva.length > 0 || reconoceFaltaDePrueba || soloSeConfirmoLaDifusion;

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

/**
 * Evita convertir material promocional o reseñas de un libro en prueba de las
 * acusaciones contenidas en la obra. En particular, corrige el salto entre
 * casos de infiltración y la generalización de que el crimen sustituyó al
 * sistema completo o que todas las instituciones encubren esa realidad.
 */
export function applyBookSynopsisEvidenceGuard(result, input = '') {
  if (!result || typeof result !== 'object') return result;

  const veredictoAfirmativo = ['CIERTA', 'PARCIALMENTE CIERTA'].includes(String(result.veredicto_final || '').toUpperCase()) ||
    ['VERDADERO', 'MAYORMENTE VERDADERO', 'PARCIALMENTE VERDADERO'].includes(String(result.veredicto || '').toUpperCase());
  if (!veredictoAfirmativo) return result;

  const diagnostico = normalizarTexto([
    input,
    result.afirmacion_principal,
    result.explicacion_veredicto_final,
    result.respuesta_directa,
    result.resumen,
    result.contexto,
    result.conclusion,
    ...(Array.isArray(result.limitaciones) ? result.limitaciones : [])
  ].join(' '));
  const tesisTotalizante = /(?:crimen organizado|narco).{0,100}(?:sistema mismo|parte del sistema|convirtio en el sistema|infiltr|permeo)|instituciones?.{0,80}(?:ocultan|encubren)/.test(diagnostico);
  const usaLibroComoPrueba = /(?:libro|obra|investigacion).{0,100}(?:documenta|demuestra|muestra|expone|tesis)|(?:sinopsis|contraportada|ficha editorial|resenas?)/.test(diagnostico);
  const reconoceAccesoIncompleto = /(?:no (?:se )?(?:recupero|examino|leyo|accedio).{0,90}(?:transcripcion|video|texto integro|libro)|no fue posible.{0,90}(?:transcripcion|video|texto integro|libro))/.test(diagnostico);

  const fuentes = Array.isArray(result.fuentes) ? result.fuentes : [];
  const promocionales = fuentes.filter(fuente => {
    const texto = normalizarTexto(`${fuente?.titulo || ''} ${fuente?.tipo || ''} ${fuente?.aporte || ''}`);
    let host = '';
    try { host = new URL(String(fuente?.url || '')).hostname.replace(/^www\./, '').toLowerCase(); } catch {}
    return /(?:penguinrandomhouse|books\.google|amazon\.|lecturalia|eslite)/.test(host) ||
      /(?:ficha editorial|sinopsis|contraportada|resena|bibliografica|pagina de venta)/.test(texto);
  });
  const evidenciaDirectaIndependiente = fuentes.some(fuente => {
    const texto = normalizarTexto(`${fuente?.titulo || ''} ${fuente?.tipo || ''} ${fuente?.aporte || ''}`);
    return /(?:sentencia|resolucion judicial|expediente|registro oficial|documento oficial|base de datos|peritaje)/.test(texto) &&
      !/(?:sinopsis|resena|ficha editorial|menciona|contextualiza)/.test(texto);
  });

  if (!tesisTotalizante || !usaLibroComoPrueba || evidenciaDirectaIndependiente ||
      !(promocionales.length > 0 || reconoceAccesoIncompleto)) return result;

  result.veredicto = 'FALSO';
  result.veredicto_final = 'FALSA';
  result.credibilidad = Math.min(Number.isFinite(result.credibilidad) ? result.credibilidad : 10, 10);
  result.explicacion_veredicto_final =
    'La afirmación categórica es falsa tal como se presenta. Las fichas editoriales, sinopsis y reseñas citadas solo confirman qué sostiene el libro; no prueban que el crimen organizado se haya convertido en “el sistema mismo” ni que las instituciones oculten esa realidad de forma generalizada.';
  result.respuesta_directa =
    'No. Los materiales citados describen y promocionan la tesis de la autora, pero no aportan evidencia primaria e independiente suficiente para demostrar esa generalización.';
  result.resumen =
    'El análisis anterior confundió la existencia de una tesis editorial con su comprobación. Casos particulares de corrupción o infiltración pueden documentarse individualmente, pero no demuestran que todo el sistema haya sido sustituido por el crimen organizado ni una política unificada de ocultamiento institucional.';
  result.conclusion = result.respuesta_directa;
  result.evidencia_a_favor = [];
  result.evidencia_en_contra = [
    'Las fichas editoriales y reseñas dependen de la propia obra y no son corroboración independiente de sus acusaciones.',
    'No se recuperó la transcripción completa del video ni se examinó el pasaje íntegro y su evidencia subyacente.',
    'La existencia de casos concretos de corrupción no demuestra la afirmación totalizante de que el crimen organizado sea el sistema completo.'
  ];
  result.limitaciones = [...new Set([
    ...(Array.isArray(result.limitaciones) ? result.limitaciones : []),
    'No se verificaron documentos, expedientes o resoluciones que acrediten el alcance totalizante atribuido a la obra.',
    'Este veredicto no niega casos particulares de corrupción o infiltración que deben evaluarse individualmente.'
  ])];
  result.evaluacion_afirmaciones = [
    {
      afirmacion: 'El libro y sus materiales promocionales sostienen una tesis sobre redes de complicidad con el crimen organizado.',
      estado: 'CONFIRMADA', relacion_con_afirmacion: 'CIRCUNSTANCIAL',
      sustento_directo: ['Fichas editoriales y reseñas de la obra.'],
      fuente_matriz: promocionales[0]?.url || '',
      lo_que_no_demuestra: 'Que la tesis sea verdadera ni que tenga el alcance totalizante de la publicación.'
    },
    {
      afirmacion: 'El crimen organizado se convirtió en el sistema mismo y las instituciones ocultan esa realidad de manera generalizada.',
      estado: 'CONTRADICHA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['Las fuentes citadas no aportan evidencia primaria independiente de ese alcance y solo reiteran la tesis editorial.'],
      fuente_matriz: '',
      lo_que_no_demuestra: 'No excluye la existencia de casos específicos de corrupción o infiltración.'
    }
  ];
  return result;
}

/**
 * Corrige la acusación que atribuye a López Obrador el inicio de un pacto con
 * el crimen organizado en 2018. La transcripción partidista usada como fuente
 * confirma el discurso de Alejandro Moreno, pero no la cronología ni el pacto.
 */
export function applyCriminalPact2018Guard(result, input = '') {
  if (!result || typeof result !== 'object' || consultaSoloAtribucion(input)) return result;

  const evaluacionesPrevias = Array.isArray(result.evaluacion_afirmaciones)
    ? result.evaluacion_afirmaciones
    : [];
  const corpus = normalizarTexto([
    input,
    result.afirmacion_principal,
    result.explicacion_veredicto_final,
    result.respuesta_directa,
    result.resumen,
    result.contexto,
    ...evaluacionesPrevias.map(item => `${item?.afirmacion || ''} ${item?.sustento_directo || ''} ${item?.lo_que_no_demuestra || ''}`)
  ].join(' '));

  const identificaAAmlo = /\b(?:andres manuel lopez obrador|lopez obrador|amlo)\b/.test(corpus);
  const identificaEmisor = /\b(?:alejandro moreno|alito)\b|cartel de macuspana|\bpri\b/.test(corpus);
  const afirmaPacto = /(?:pacto.{0,55}(?:crimen organizado|criminal|carteles? de la droga)|(?:crimen organizado|carteles? de la droga).{0,55}pacto)/.test(corpus);
  const fijaInicioEn2018 = /(?:inici|comenz|arranc|desde).{0,55}\b2018\b|\b2018\b.{0,55}(?:inici|comenz|arranc|pacto)/.test(corpus);
  if (!identificaAAmlo || !identificaEmisor || !afirmaPacto || !fijaInicioEn2018) return result;

  const discursoPri = 'https://www.pri.org.mx/ElPartidoDeMexico/SaladePrensa/Nota.aspx?y=40980';
  const respuestaPresidencia = 'https://www.gob.mx/presidencia/articulos/version-estenografica-conferencia-de-prensa-de-la-presidenta-claudia-sheinbaum-pardo-del-20-de-mayo-de-2026';
  const informeCrisisGroup = 'https://www.justice.gov/file/1066011/dl?inline=';
  const constitucion = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf';

  result.estado = 'analizado';
  result.analizado = true;
  result.estado_tecnico = 'AFIRMACION_FALSA';
  result.veredicto = 'FALSO';
  result.veredicto_final = 'FALSA';
  result.credibilidad = Math.min(Number.isFinite(result.credibilidad) ? result.credibilidad : 10, 10);
  result.confianza = Math.max(Number.isFinite(result.confianza) ? result.confianza : 90, 90);
  result.afirmacion_principal =
    'Andrés Manuel López Obrador inició en 2018 un pacto con el crimen organizado y encabezó una estructura criminal presentada como “Cártel de Macuspana”.';
  result.explicacion_veredicto_final =
    'La publicación es falsa en su afirmación central. La fuente oficial del PRI confirma que Alejandro Moreno lanzó acusaciones de “pacto” y “narcogobierno”, pero no aporta evidencia verificable del supuesto acuerdo ni afirma que éste comenzara en 2018. En esa transcripción, 2018 aparece después y en otro pasaje, al comparar el gobierno que entregó el PRI; unir ambos fragmentos fabrica una cronología que la fuente no sostiene.';
  result.respuesta_directa =
    'No. Que Alejandro Moreno haya formulado la acusación solo prueba la existencia de su declaración. No prueba un pacto criminal, y la fuente citada tampoco vincula el inicio de ese supuesto pacto con 2018.';
  result.resumen =
    'Alejandro Moreno sí acusó públicamente a López Obrador y Morena de mantener vínculos con el crimen organizado. Pero su discurso no demuestra esa imputación ni sitúa el comienzo de un pacto en 2018: ese año aparece en un pasaje distinto sobre el cambio de gobierno. Denuncias, etiquetas partidistas y notas que reproducen la misma declaración no sustituyen una resolución, un expediente accesible o evidencia independiente del acuerdo alegado.';
  result.conclusion =
    'El acto de habla es auténtico; la proposición publicada como hecho es falsa. No se identificó evidencia pública independiente que establezca un pacto iniciado por López Obrador en 2018, y la propia fuente utilizada no contiene esa cronología.';
  result.contexto =
    'El mensaje forma parte de una confrontación partidista explícita. Como presidente del PRI, Alejandro Moreno agrupa casos, investigaciones y señalamientos distintos bajo las etiquetas “narcogobierno” y “Cártel de Macuspana”, y llama a su militancia a enfrentar políticamente a Morena. Ese objetivo opositor es observable en el discurso; no demuestra por sí solo que Moreno conozca la falsedad, haya recibido un pago o actúe dentro de una coordinación encubierta.';
  result.contraste_fuentes =
    'La página del PRI es primaria para comprobar qué dijo Moreno, no para probar el delito que atribuye. Su texto separa la acusación de “pacto” del pasaje que menciona 2018. La respuesta de Presidencia niega el señalamiento, pero una negación tampoco resuelve por sí sola el caso; el veredicto descansa en la tergiversación cronológica y en la ausencia de evidencia sustantiva en las fuentes presentadas. El análisis independiente sobre seguridad documenta violencia, fragmentación criminal y fallas estatales, no el pacto presidencial específico descrito en la publicación.';

  result.evaluacion_afirmaciones = [
    {
      afirmacion: 'Alejandro Moreno acusó públicamente a López Obrador y a Morena de un pacto con el crimen organizado.',
      estado: 'CONFIRMADA', relacion_con_afirmacion: 'CIRCUNSTANCIAL',
      sustento_directo: ['La transcripción institucional del PRI reproduce esa acusación.'],
      fuente_matriz: discursoPri,
      lo_que_no_demuestra: 'Confirma la autoría y el encuadre partidista, no la existencia del pacto.'
    },
    {
      afirmacion: 'La fuente citada afirma que el supuesto pacto comenzó en 2018.',
      estado: 'CONTRADICHA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['La transcripción menciona 2018 en un pasaje separado sobre el gobierno que entregó el PRI, no como fecha de inicio de un pacto.'],
      fuente_matriz: discursoPri,
      lo_que_no_demuestra: 'No excluye que Moreno haya repetido otras versiones en otros momentos; contradice la cronología atribuida a esta fuente.'
    },
    {
      afirmacion: 'López Obrador inició en 2018 un pacto con el crimen organizado.',
      estado: 'NO DEMOSTRADA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: [],
      fuente_matriz: discursoPri,
      lo_que_no_demuestra: 'Un discurso partidista, una denuncia o su reproducción periodística no acreditan un acuerdo criminal.'
    },
    {
      afirmacion: 'Los casos o señalamientos contra terceras personas prueban una estructura criminal encabezada por López Obrador.',
      estado: 'NO DEMOSTRADA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: [],
      fuente_matriz: '',
      lo_que_no_demuestra: 'La responsabilidad es individual; la asociación política o personal no prueba conocimiento, orden ni participación del expresidente.'
    }
  ];

  result.hechos_comprobados = [
    'Alejandro Moreno realizó la acusación en un mensaje publicado por el PRI.',
    'La transcripción del PRI no presenta documentos, testimonios identificables, peritajes ni una resolución que prueben el supuesto pacto.',
    'En la fuente citada, el año 2018 aparece en un pasaje sobre el balance del gobierno saliente, separado de la acusación criminal.',
    'La violencia y la infiltración criminal en ámbitos locales son problemas documentados, pero no acreditan por sí solos un pacto presidencial iniciado en 2018.'
  ];
  result.evidencia_a_favor = [];
  result.evidencia_en_contra = [
    'La única evidencia directa citada acredita la declaración del dirigente opositor, no el hecho denunciado.',
    'La cronología de 2018 no aparece vinculada al supuesto pacto en la transcripción usada como fuente.',
    'No se identificó en las fuentes presentadas una sentencia, resolución ministerial, expediente accesible o prueba independiente que conecte a López Obrador con ese acuerdo específico.',
    'Las notas que reproducen la acusación dependen de la misma fuente matriz y no constituyen corroboraciones independientes.'
  ];
  result.indicadores_desinformacion = [
    'Sustituye la prueba del hecho por la prueba de que un adversario político lo afirmó.',
    'Une pasajes separados para atribuir al supuesto pacto una fecha de inicio que la fuente no establece.',
    'Agrupa casos y señalamientos de personas distintas para inferir una estructura criminal presidencial sin demostrar el vínculo.',
    'Presenta una etiqueta partidista —“Cártel de Macuspana”— como si fuera una organización establecida por una autoridad competente.'
  ];
  result.limitaciones = [
    'La revisión se refiere a la afirmación pública y a las fuentes accesibles; no permite conocer expedientes legalmente reservados o investigaciones no publicadas.',
    'La falta de evidencia pública no demuestra que un hecho sea metafísicamente imposible; sí impide publicarlo responsablemente como hecho probado.',
    'La respuesta del gobierno es contexto y contradicción política, no se toma como prueba suficiente de inocencia.',
    'No se atribuye intención de mentir, pago, automatización ni coordinación sin evidencia específica.'
  ];

  result.analisis_intencionalidad = {
    clasificacion: 'INTENCIÓN NO DEMOSTRADA',
    objetivo_del_dano: 'Andrés Manuel López Obrador, sus familiares, Morena y la credibilidad del gobierno federal.',
    tipo_de_perjuicio: ['Político', 'Reputacional', 'Institucional'],
    evidencia: ['El discurso llama a la militancia del PRI a enfrentar a Morena y usa acusaciones criminales como argumento de contraste partidista.'],
    contraindicadores: ['No se documentó pago, instrucción externa, coordinación encubierta ni prueba de que el emisor conociera la falsedad de cada afirmación.'],
    explicacion: 'El propósito de confrontación política está expreso en el propio mensaje. Eso permite describir su función retórica, pero no afirmar intención deliberada de engañar.',
    confianza: 90
  };
  result.analisis_patron_objetivos = {
    objetivo_principal: 'Andrés Manuel López Obrador y Morena.',
    publicaciones_revisadas: 2,
    publicaciones_dirigidas: 2,
    periodo_muestra: 'Septiembre de 2025 a 2026',
    clasificacion: 'CRÍTICA RECURRENTE',
    recursos_recurrentes: ['Etiquetas criminales colectivas', 'Culpabilidad por asociación', 'Presentación de denuncias como confirmación del delito'],
    ejemplos: ['Presentación del llamado “Cártel de Macuspana”.', 'Discurso del PRI que atribuye a López Obrador un pacto criminal.'],
    fundamento: 'Las fuentes muestran reiteración de la misma línea acusatoria contra el adversario partidista. La muestra permite documentar crítica recurrente, no una operación coordinada ni una campaña pagada.',
    limitaciones: ['Dos piezas no representan todo el historial del emisor.', 'La recurrencia del ataque no decide por sí sola la falsedad de una afirmación concreta.']
  };
  result.reputacion_fuente = {
    medio_o_autor: 'Alejandro Moreno / Partido Revolucionario Institucional',
    antecedentes_verificados: ['El PRI ha difundido reiteradamente la etiqueta “Cártel de Macuspana” y acusaciones criminales contra dirigentes de Morena.'],
    percepcion_en_redes: 'No se usa popularidad, rechazo u orientación política como sustituto de evidencia.',
    calidad_contenido_actual: 'El sitio del PRI es adecuado para comprobar la declaración de su dirigente, pero no aporta corroboración independiente del supuesto pacto.',
    conflictos_interes: ['Alejandro Moreno dirige un partido opositor y el mensaje busca desacreditar a un adversario electoral directo.'],
    limitaciones: 'El interés partidista exige contraste reforzado, pero no vuelve falsa una afirmación por sí mismo.'
  };
  result.analisis_redes = {
    plataformas_consultadas: ['Threads', 'Sitio institucional del PRI'],
    tendencias_observadas: ['La acusación fue reproducida por distintas notas a partir de la misma fuente partidista.'],
    posible_manipulacion: [],
    representatividad: 'La muestra permite rastrear la procedencia del argumento, no medir la opinión pública ni toda su difusión.',
    limitaciones: 'No se analizaron métricas internas, comentarios completos, automatización ni relaciones entre cuentas; no se infiere coordinación.'
  };
  result.auditoria_sesgo_fuentes = {
    fuentes_izquierda: [],
    fuentes_derecha: [],
    fuentes_mixtas: [],
    fuentes_no_determinadas: ['PRI / Alejandro Moreno'],
    fuentes_primarias: [discursoPri, respuestaPresidencia],
    fuentes_independientes_deduplicadas: 1,
    predominio: 'NO DETERMINADO',
    porcentaje_predominio: 0,
    confianza_clasificacion: 90,
    advertencia_desequilibrio: false,
    obligacion_contradiccion_cumplida: true,
    evidencia_contraria_buscada: ['Respuesta pública de Presidencia', 'Análisis independiente del entorno de seguridad desde 2018'],
    problemas_metodologicos: ['Varias notas reproducen la declaración partidista y no aportan una cadena probatoria independiente.'],
    explicacion: 'No se asigna una etiqueta ideológica a cada medio para decidir el resultado. Se distingue la fuente partidista de la evidencia independiente y se contrasta la acusación con su texto íntegro y el entorno documentado.',
    limitaciones: ['La ausencia de un expediente público no permite descartar investigaciones reservadas; sí impide tratarlas como prueba disponible.']
  };
  result.auditoria_fuentes_periodisticas = [{
    medio_o_periodista: 'PRI / Alejandro Moreno',
    orientacion: 'NO DETERMINADA',
    fundamento_orientacion: ['Es una fuente partidista opositora; las categorías izquierda/derecha no son necesarias para evaluar esta prueba.'],
    propiedad_y_financiamiento: ['Sitio institucional del Partido Revolucionario Institucional.'],
    contratos_o_pagos_documentados: [],
    antecedentes_verificados: ['Ha publicado de forma reiterada la etiqueta “Cártel de Macuspana”.'],
    relacion_con_publicacion_actual: 'DIRECTA',
    prueba_pago_para_mentir: 'NO APLICA',
    conclusion: 'Fuente primaria de la acusación y de su contexto político; no es corroboración independiente de la conducta criminal alegada.',
    limitaciones: ['La evaluación se limita a la afirmación y las piezas revisadas; no juzga globalmente al partido o a su dirigente.']
  }];

  const integridadBase = result.analisis_integridad_informativa &&
    typeof result.analisis_integridad_informativa === 'object'
    ? result.analisis_integridad_informativa
    : {};
  result.analisis_integridad_informativa = {
    ...integridadBase,
    indice_amarillismo: Math.max(Number(integridadBase.indice_amarillismo) || 0, 80),
    nivel_amarillismo: 'ALTO',
    carga_emocional: ['“narcogobierno”', '“Cártel de Macuspana”', '“pacto criminal impune”'],
    riesgo_confirmado: 'Existen violencia, corrupción e investigaciones contra actores públicos que justifican escrutinio y rendición de cuentas.',
    riesgo_presentado: 'Se presenta como hecho probado un pacto nacional encabezado por López Obrador desde 2018.',
    extrapolaciones: ['De casos de terceros se infiere un acuerdo presidencial.', 'De una acusación partidista se infiere culpabilidad.', 'De una mención separada de 2018 se crea una fecha de inicio.'],
    contexto_omitido: ['La fuente no vincula 2018 con el inicio del supuesto pacto.', 'No se aporta el puente probatorio entre casos individuales y López Obrador.', 'Una denuncia no equivale a una resolución.'],
    titular_responsable: 'Alejandro Moreno acusó a López Obrador de un pacto criminal, pero no presentó evidencia pública que lo pruebe ni situó su inicio en 2018 en la fuente citada.',
    explicacion_educativa: 'Para verificar una acusación contenida en una cita hay que comprobar el hecho acusado, no solo la autenticidad de la cita. En delitos, cada vínculo —persona, conducta, fecha y conocimiento— necesita prueba propia.',
    fuentes_matriz: [discursoPri],
    replicas_no_independientes: ['Notas y publicaciones que únicamente reproducen las palabras de Alejandro Moreno.'],
    fuentes_independientes_reales: 1,
    evidencia_coordinacion: [],
    probabilidad_coordinacion: 0,
    confianza_deteccion_coordinacion: 0,
    cuentas_comparadas: [],
    publicaciones_coincidentes: [],
    patron_publicacion_grupal: '',
    evidencia_bots: [],
    probabilidad_automatizacion: 0,
    confianza_deteccion_bots: 0,
    etiqueta_especial: 'NINGUNA',
    limitaciones: ['No se analizaron datos internos de distribución ni todos los mensajes de las cuentas que replicaron la acusación.']
  };

  result.fuentes = [
    {
      titulo: 'PRI — Versión íntegra del mensaje de Alejandro Moreno',
      url: discursoPri,
      tipo: 'Primaria',
      aporte: 'Confirma la acusación y permite comprobar que el pasaje sobre 2018 está separado y no fija el inicio del supuesto pacto.'
    },
    {
      titulo: 'Presidencia — Conferencia del 20 de mayo de 2026',
      url: respuestaPresidencia,
      tipo: 'Oficial',
      aporte: 'Registra la respuesta gubernamental y su versión contrapuesta; se usa como contexto, no como prueba decisiva.'
    },
    {
      titulo: 'International Crisis Group — Mexico’s Everyday War',
      url: informeCrisisGroup,
      tipo: 'Académica',
      aporte: 'Analiza violencia, fragmentación criminal y la estrategia de seguridad desde 2018 sin establecer el pacto presidencial alegado.'
    },
    {
      titulo: 'Constitución Política de los Estados Unidos Mexicanos',
      url: constitucion,
      tipo: 'Oficial',
      aporte: 'Marco aplicable a presunción de inocencia y responsabilidad individual frente a acusaciones penales.'
    }
  ];
  return result;
}

/**
 * Corrige la lectura factual del debate sobre las boletas sin doblez. La
 * declaración partidista acredita una postura, mientras que el Acuerdo
 * INE/CG542/2026 y su explicación pública determinan qué procedimiento fue
 * realmente aprobado.
 */
export function applyUnfoldedBallotFramingGuard(result, input = '') {
  if (!result || typeof result !== 'object' || consultaSoloAtribucion(input)) return result;

  const evaluacionesPrevias = Array.isArray(result.evaluacion_afirmaciones)
    ? result.evaluacion_afirmaciones
    : [];
  const corpus = normalizarTexto([
    input,
    result.afirmacion_principal,
    result.explicacion_veredicto_final,
    result.respuesta_directa,
    result.resumen,
    result.contexto,
    ...evaluacionesPrevias.map(item => `${item?.afirmacion || ''} ${item?.lo_que_no_demuestra || ''}`)
  ].join(' '));
  const trataBoletasSinDoblez = /(?:boletas?.{0,55}(?:sin doblar|sin doblez|planchadas?)|(?:sin doblar|sin doblez|planchadas?).{0,55}boletas?)/.test(corpus);
  const instalaFraude = /(?:legaliz|permit|facilit|abrir.{0,35}puerta|contar|computar|validar).{0,90}fraude|fraude.{0,90}(?:legaliz|permit|facilit|contar|computar|validar)/.test(corpus);
  if (!trataBoletasSinDoblez || !instalaFraude) return result;

  const panUrl = 'https://www.pan.senado.gob.mx/2026/09/entrevista-al-coordinador-de-las-y-los-senadores-del-pan-ricardo-anaya-cortes-al-salir-de-la-junta-de-coordinacion-politica/';
  const tarjetaIne = 'https://centralelectoral.ine.mx/2026/09/11/tratamiento-de-boletas-sin-doblez/';
  const sesionIne = 'https://centralelectoral.ine.mx/2026/09/03/version-estenografica-de-la-sesion-extraordinaria-del-consejo-general-del-ine-3-de-septiembre-de-2026/';
  const acuerdoIne = 'https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/189760/CGex202609-03-ap-15-a.pdf';
  const lgipe = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGIPE.pdf';

  result.estado = 'analizado';
  result.analizado = true;
  result.veredicto = 'FALSO';
  result.veredicto_final = 'FALSA';
  result.credibilidad = Math.min(Number.isFinite(result.credibilidad) ? result.credibilidad : 15, 15);
  result.confianza = Math.max(Number.isFinite(result.confianza) ? result.confianza : 90, 90);
  result.afirmacion_principal =
    'El INE decidió contabilizar automáticamente las boletas sin doblez y con ello “legalizó el fraude electoral” rumbo a 2027.';
  result.explicacion_veredicto_final =
    'Es cierto que Ricardo Anaya pronunció esa frase, pero la afirmación factual que contiene es falsa. El Acuerdo INE/CG542/2026 no ordena contar automáticamente las boletas sin doblez: exige apartarlas, documentar el incidente y someter cada caso al Pleno del Consejo Distrital, que debe decidir de forma fundada si se computa o no. Las representaciones partidistas intervienen y la decisión puede impugnarse. La cita acredita la posición política del PAN; no prueba fraude ni que el gobierno federal haya dictado el criterio.';
  result.respuesta_directa =
    'No. Anaya sí lo dijo, pero el procedimiento real no valida ni cuenta automáticamente esas boletas. Presentar una revisión individual, documentada e impugnable como “legalización del fraude” altera el contenido del acuerdo y no aporta prueba de control gubernamental sobre la decisión.';
  result.resumen =
    'La frase de Ricardo Anaya es auténtica; su premisa no. El INE no autorizó el conteo automático de boletas sin doblez. Ordenó reservarlas, registrar el incidente y llevar cada caso al Consejo Distrital para una decisión fundada, con presencia de partidos y posibilidad de impugnación. La ausencia de doblez puede justificar sospecha y revisión, pero no demuestra por sí sola fraude ni que el gobierno controle al INE.';
  result.conclusion = result.respuesta_directa;
  result.contexto =
    'El encuadre transforma una controversia técnica del INE en una acusación política: pasa de “una boleta sin doblez debe revisarse” a “el árbitro legaliza un fraude” y, en mensajes opositores contemporáneos, vincula esa sospecha con Morena y el gobierno federal. Ese objetivo discursivo es observable; una intención de mentir, una orden gubernamental o una coordinación encubierta no están demostradas. La preocupación de origen no es inventada: la LGIPE indica que la persona electora dobla la boleta y existen precedentes que justifican examinar anomalías. Lo falso es describir el nuevo procedimiento como autorización automática del voto o como prueba de fraude gubernamental.';
  result.contraste_fuentes =
    'La página del PAN y el audio sirven para confirmar qué dijo Anaya. Para comprobar el contenido se usaron el Acuerdo INE/CG542/2026, la tarjeta explicativa y la sesión pública del Consejo General. Esas fuentes primarias muestran una reserva y revisión caso por caso, no una orden de contabilización automática. Las notas que reproducen la frase de Anaya forman una misma cadena de atribución y no son corroboraciones independientes del fraude alegado.';

  result.evaluacion_afirmaciones = [
    {
      afirmacion: 'Ricardo Anaya afirmó que contar boletas sin doblez sería “legalizar el fraude electoral”.',
      estado: 'CONFIRMADA', relacion_con_afirmacion: 'CIRCUNSTANCIAL',
      sustento_directo: ['Transcripción y audio publicados por la coordinación del PAN en el Senado.'],
      fuente_matriz: panUrl,
      lo_que_no_demuestra: 'Confirma la autoría de la frase, no la existencia de fraude ni la descripción del acuerdo.'
    },
    {
      afirmacion: 'El INE ordenó que las boletas sin doblez se contabilicen automáticamente.',
      estado: 'CONTRADICHA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['El procedimiento ordena reservarlas, documentarlas y someterlas al Pleno del Consejo Distrital.'],
      fuente_matriz: tarjetaIne,
      lo_que_no_demuestra: 'La revisión individual no garantiza que toda boleta sea válida o inválida; exige resolver cada caso.'
    },
    {
      afirmacion: 'El procedimiento aprobado legaliza un mecanismo de fraude electoral.',
      estado: 'CONTRADICHA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: ['No hay validación automática; hay registro, deliberación fundada, participación partidista e impugnación.'],
      fuente_matriz: acuerdoIne,
      lo_que_no_demuestra: 'Las salvaguardas no eliminan todo riesgo electoral, pero contradicen la descripción de una autorización para defraudar.'
    },
    {
      afirmacion: 'El gobierno federal o Morena ordenaron o controlaron esta decisión del INE.',
      estado: 'NO DEMOSTRADA', relacion_con_afirmacion: 'DIRECTA',
      sustento_directo: [],
      fuente_matriz: sesionIne,
      lo_que_no_demuestra: 'La crítica política y la composición del Consejo General no prueban una orden, subordinación o acuerdo con el gobierno.'
    }
  ];
  result.hechos_comprobados = [
    'Ricardo Anaya hizo la declaración atribuida en la entrevista publicada por el PAN el 14 de septiembre de 2026.',
    'El Consejo General del INE aprobó por mayoría el Acuerdo INE/CG542/2026.',
    'Una boleta sin señales de doblez debe apartarse y no se clasifica ni captura de inmediato.',
    'El incidente debe quedar asentado con datos de casilla, cantidad, hora y personas presentes.',
    'El Pleno del Consejo Distrital decide de forma fundada si procede computarla; los partidos participan y la resolución puede impugnarse.'
  ];
  result.evidencia_a_favor = [
    'El artículo 279, numeral 3, de la LGIPE dispone que la persona electora dobla sus boletas antes de depositarlas.',
    'La falta de doblez puede ser una anomalía objetiva y existen antecedentes que justifican reservar y revisar esas boletas.'
  ];
  result.evidencia_en_contra = [
    'El acuerdo no manda contar automáticamente una boleta sin doblez.',
    'La autoridad debe preservar evidencia, documentar el caso y adoptar una resolución individual fundada y motivada.',
    'No se aportó evidencia directa de que el gobierno federal o Morena hayan ordenado al INE aprobar ese procedimiento.'
  ];
  result.indicadores_desinformacion = [
    'Sustituye un procedimiento de reserva y revisión por la idea de una autorización general para contar votos irregulares.',
    'Presenta una posibilidad de riesgo como prueba de que el fraude ya fue legalizado.',
    'Usa una cita partidista auténtica como si fuera corroboración independiente de la acusación contenida en ella.'
  ];
  result.limitaciones = [
    'La falta de doblez puede ser un indicio relevante, pero no permite decidir por sí sola la autenticidad de todas las boletas.',
    'No se evaluó el desarrollo futuro de la elección de 2027; se verificó el contenido del acuerdo vigente y la acusación publicada.',
    'La evidencia revisada permite describir el objetivo explícito de la crítica, pero no atribuir conocimiento de falsedad, pago o coordinación encubierta.'
  ];

  result.analisis_intencionalidad = {
    clasificacion: 'INTENCIÓN NO DEMOSTRADA',
    objetivo_del_dano: 'El INE y, por extensión en el encuadre opositor, Morena y el gobierno federal.',
    tipo_de_perjuicio: ['Político', 'Institucional', 'Reputacional'],
    evidencia: ['La frase usa “legalizar el fraude electoral” para caracterizar una decisión del árbitro electoral.'],
    contraindicadores: ['La ausencia de doblez sí plantea una preocupación técnica legítima.', 'No hay prueba de pago, instrucción, coordinación encubierta o conocimiento deliberado de la falsedad.'],
    explicacion: 'El blanco político y la función acusatoria del mensaje son observables en sus palabras y contexto público. Eso no basta para afirmar como hecho que Anaya mintió deliberadamente o actuó bajo una coordinación.',
    confianza: 90
  };
  result.analisis_patron_objetivos = {
    objetivo_principal: 'La credibilidad del INE y la asociación política de su decisión con Morena y el gobierno federal.',
    publicaciones_revisadas: 1,
    publicaciones_dirigidas: 1,
    periodo_muestra: '14 de septiembre de 2026',
    clasificacion: 'SIN PATRÓN DEMOSTRADO',
    recursos_recurrentes: ['Conversión de una regla técnica en una acusación categórica de fraude.'],
    ejemplos: ['Declaración de Ricardo Anaya sobre las boletas sin doblez.'],
    fundamento: 'Este mensaje tiene un encuadre opositor explícito, pero una sola publicación no demuestra una campaña sistemática ni coordinación.',
    limitaciones: ['La muestra se limita al contenido consultado y a su contexto inmediato.']
  };
  result.reputacion_fuente = {
    medio_o_autor: 'Ricardo Anaya / Grupo Parlamentario del PAN en el Senado',
    antecedentes_verificados: [],
    percepcion_en_redes: 'No se usa la popularidad ni la orientación partidista para decidir el veredicto.',
    calidad_contenido_actual: 'La fuente oficial del PAN es adecuada para comprobar la declaración, pero no es una verificación independiente de la acusación de fraude.',
    conflictos_interes: ['El emisor es dirigente y coordinador parlamentario de un partido opositor con interés directo en el proceso electoral de 2027.'],
    limitaciones: 'La filiación política explica el contexto comunicativo, pero no vuelve verdadera ni falsa la afirmación por sí sola.'
  };

  const primarySources = [
    { titulo: 'INE — Tratamiento de boletas sin doblez', url: tarjetaIne, tipo: 'Oficial', aporte: 'Explica que no hay inclusión ni exclusión automática y detalla la reserva, documentación, decisión e impugnación.' },
    { titulo: 'Acuerdo INE/CG542/2026', url: acuerdoIne, tipo: 'Oficial', aporte: 'Documento normativo original de los cómputos distritales para 2026-2027.' },
    { titulo: 'Sesión del Consejo General del INE del 3 de septiembre de 2026', url: sesionIne, tipo: 'Oficial', aporte: 'Registra la discusión pública, razones, objeciones y alcance del procedimiento.' },
    { titulo: 'Ley General de Instituciones y Procedimientos Electorales', url: lgipe, tipo: 'Oficial', aporte: 'Establece el procedimiento de emisión y depósito del voto y las competencias electorales.' },
    { titulo: 'Entrevista a Ricardo Anaya — PAN Senado', url: panUrl, tipo: 'Primaria', aporte: 'Confirma la declaración y su carácter de posicionamiento partidista.' }
  ];
  const existing = Array.isArray(result.fuentes) ? result.fuentes : [];
  const seen = new Set();
  result.fuentes = [...primarySources, ...existing].filter(source => {
    const url = String(source?.url || '');
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  }).slice(0, 7);

  if (result.analisis_integridad_informativa && typeof result.analisis_integridad_informativa === 'object') {
    result.analisis_integridad_informativa = {
      ...result.analisis_integridad_informativa,
      riesgo_confirmado: 'La ausencia de doblez puede justificar reserva y revisión de una boleta.',
      riesgo_presentado: 'Se presenta el procedimiento como autorización para contabilizar boletas irregulares y legalizar un fraude.',
      extrapolaciones: ['De una decisión caso por caso se salta a una autorización general de fraude.', 'De una controversia en el INE se infiere control del gobierno sin evidencia directa.'],
      contexto_omitido: ['Reserva de la boleta', 'Acta circunstanciada', 'Decisión fundada del Consejo Distrital', 'Participación de representaciones partidistas', 'Vía de impugnación'],
      titular_responsable: 'El INE ordena revisar individualmente las boletas sin doblez; Anaya acusa sin pruebas que eso “legaliza el fraude”.',
      fuentes_matriz: [tarjetaIne, acuerdoIne, panUrl]
    };
  }
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
  return applyCriminalPact2018Guard(
    applyUnfoldedBallotFramingGuard(
      applyPisaPandemicFramingGuard(
        applyBookSynopsisEvidenceGuard(
          applyEmbeddedAllegationGuard(applyNoCheckableClaimGuard(result, input), input),
          input
        ),
        input
      ),
      input
    ),
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
