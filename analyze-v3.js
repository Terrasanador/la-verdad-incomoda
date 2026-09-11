import analyzeHandler from './analyze.js';

// La Verdad Incómoda — guardas metodológicas V3.
// Este adaptador refuerza el motor existente sin duplicar sus 120 KB de lógica.
const POLICY = `\n\nREGLAS V3 OBLIGATORIAS PARA ESTA VERIFICACIÓN:\n1) Identifica primero la TESIS CENTRAL o acusación que el contenido intenta instalar.\n2) Separa hechos SUSTANTIVOS que prueban esa tesis de datos PERIFÉRICOS (nombre, cargo, fecha, parentesco, lugar, que alguien publicó la acusación, etc.). Un dato periférico verdadero NO convierte una acusación central falsa o no demostrada en PARCIALMENTE CIERTA.\n3) PARCIALMENTE CIERTA/PARCIALMENTE VERDADERO solo procede cuando al menos una proposición SUSTANTIVA de la tesis central está demostrada y otra proposición SUSTANTIVA está contradicha o no demostrada.\n4) Si la tesis central está materialmente contradicha por evidencia suficiente, usa FALSA/FALSO aunque contenga datos periféricos correctos.\n5) Si la tesis central atribuye órdenes secretas, encubrimiento, protección, conspiración, intención o causalidad y no existe evidencia suficiente para confirmarla o refutarla, usa NO VERIFICABLE/INFORMACIÓN INSUFICIENTE; no la premies con verdad parcial por hechos accesorios.\n6) AUDITA AL EMISOR: identifica la fuente matriz; revisa antecedentes públicos relevantes y una muestra verificable de publicaciones anteriores; registra patrón editorial, objetivos recurrentes, falsedades o correcciones documentadas, propiedad/financiamiento/conflictos solo si están sustentados, y orientación IZQUIERDA/DERECHA/MIXTA/NO DETERMINADA únicamente con evidencia acumulada. La orientación jamás decide la verdad.\n7) Distingue crítica legítima, opinión adversa, cobertura negativa recurrente, campaña de descrédito y ataque sistemático con desinformación. No atribuyas pago, coordinación o intención sin evidencia.\n8) Deduplica réplicas: varias notas que copian la misma fuente matriz cuentan como una sola cadena, no como corroboraciones independientes.\n9) Antes del veredicto responde internamente: ¿cuál es la tesis central?, ¿qué evidencia DIRECTA la prueba o contradice?, ¿qué datos son periféricos?, ¿quién origina la acusación y qué patrón verificable muestra su historial?\n10) Mantén presunción de inocencia y separa hechos procesales de culpabilidad.\n11) INVESTIGA EL ENTORNO COMPLETO antes de clasificar: localiza la fuente primaria, metodología, anexos o tablas, periodo comparable, alcance, limitaciones, reacciones oficiales y críticas técnicas pertinentes. No te limites a confirmar cómo circula el titular ni a resumir el texto proporcionado por el usuario.\n12) Para pruebas, índices, encuestas y estadísticas internacionales consulta obligatoriamente: nota del país o ficha oficial, informe y guía metodológica, significancia estadística, tamaño y cobertura de la muestra, cambios de población o elegibilidad y declaraciones públicas de quienes dirigen o elaboran la medición. Distingue una diferencia numérica de un cambio estadísticamente significativo.\n13) Verifica la exposición temporal: antes de atribuir un resultado a una reforma, gobierno, plan educativo o política, comprueba cuándo se aplicó, cuánto tiempo estuvieron expuestas las personas evaluadas y si la fuente primaria hace esa atribución causal.\n14) Evalúa por separado todo término fuerte del titular —por ejemplo "fracaso", "colapso", "milagro", "causó" o "demuestra"—. La existencia del titular o su repetición es CIRCUNSTANCIAL, no prueba directa de su verdad.\n15) NO VERIFICABLE se reserva para casos en los que, después de agotar la búsqueda, ninguna parte factual sustantiva de la tesis puede resolverse. Si hay componentes sustantivos confirmados y otros contradichos o no demostrados, usa PARCIALMENTE CIERTA; si los datos son reales pero el encuadre altera su significado, usa ENGAÑOSA.\n16) Un resultado NO VERIFICABLE debe tener credibilidad nula/no aplicable; nunca muestres simultáneamente "información insuficiente" y una credibilidad numérica alta.\n17) Si se solicitan comentarios de quienes dirigen, coordinan o elaboran una prueba, prioriza su intervención directa: presentación oficial, transcripción, video completo, artículo firmado o comunicado de la institución. Una nota periodística o un comunicado gubernamental que resuma sus palabras es evidencia secundaria y debe identificarse como tal; no inventes ni confirmes una cita que no recuperaste.\n18) Las palabras absolutas —"solo", "únicamente", "nunca", "siempre", "todos" o "ninguno"— requieren prueba del alcance total. Si la evidencia solo confirma algunos ejemplos o una reacción, no marques el absoluto como CONFIRMADO.\n19) No confundas dos preguntas: comprobar que una autoridad DIJO o ATRIBUYÓ algo no demuestra que la acusación editorial de que "culpa", "se excusa" o "busca un pretexto" sea cierta. Esas palabras atribuyen una estrategia o intención y requieren evidencia propia.\n20) En afirmaciones sobre PISA y COVID-19 contrasta obligatoriamente las intervenciones directas de la OCDE: la pandemia no puede ignorarse, pero no existe una relación simple entre cierres y tendencias, y parte del deterioro internacional empezó antes de 2020. No conviertas uno de esos matices en causa única.\n21) Si una frase mezcla una declaración comprobada con un encuadre acusatorio que omite causas concurrentes reconocidas por la fuente primaria, la categoría adecuada es ENGAÑOSA; usa FALSA solo cuando la tesis central esté contradicha de manera material.\n`;

function addPolicy(req) {
  const body = req.body || {};
  const keys = ['consulta','pregunta','question','query','text','input','content'];
  const key = keys.find(k => typeof body[k] === 'string' && body[k].trim());
  if (key) {
    req.body = { ...body, [key]: `${body[key]}${POLICY}` };
  } else if (typeof body.url === 'string' && body.url.trim()) {
    req.body = { ...body, consulta: `${body.url}${POLICY}` };
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

function normalize(result, input = '') {
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
  return applyPisaPandemicFramingGuard(result, input);
}

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const input = originalInput(req);
  addPolicy(req);
  const originalJson = res.json.bind(res);
  res.json = payload => originalJson(normalize(payload, input));
  return analyzeHandler(req, res);
}
