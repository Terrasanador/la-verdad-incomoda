import analyzeHandler from './analyze.js';

// La Verdad Incómoda — guardas metodológicas V3.
// Este adaptador refuerza el motor existente sin duplicar sus 120 KB de lógica.
const POLICY = `\n\nREGLAS V3 OBLIGATORIAS PARA ESTA VERIFICACIÓN:\n1) Identifica primero la TESIS CENTRAL o acusación que el contenido intenta instalar.\n2) Separa hechos SUSTANTIVOS que prueban esa tesis de datos PERIFÉRICOS (nombre, cargo, fecha, parentesco, lugar, que alguien publicó la acusación, etc.). Un dato periférico verdadero NO convierte una acusación central falsa o no demostrada en PARCIALMENTE CIERTA.\n3) PARCIALMENTE CIERTA/PARCIALMENTE VERDADERO solo procede cuando al menos una proposición SUSTANTIVA de la tesis central está demostrada y otra proposición SUSTANTIVA está contradicha o no demostrada.\n4) Si la tesis central está materialmente contradicha por evidencia suficiente, usa FALSA/FALSO aunque contenga datos periféricos correctos.\n5) Si la tesis central atribuye órdenes secretas, encubrimiento, protección, conspiración, intención o causalidad y no existe evidencia suficiente para confirmarla o refutarla, usa NO VERIFICABLE/INFORMACIÓN INSUFICIENTE; no la premies con verdad parcial por hechos accesorios.\n6) AUDITA AL EMISOR: identifica la fuente matriz; revisa antecedentes públicos relevantes y una muestra verificable de publicaciones anteriores; registra patrón editorial, objetivos recurrentes, falsedades o correcciones documentadas, propiedad/financiamiento/conflictos solo si están sustentados, y orientación IZQUIERDA/DERECHA/MIXTA/NO DETERMINADA únicamente con evidencia acumulada. La orientación jamás decide la verdad.\n7) Distingue crítica legítima, opinión adversa, cobertura negativa recurrente, campaña de descrédito y ataque sistemático con desinformación. No atribuyas pago, coordinación o intención sin evidencia.\n8) Deduplica réplicas: varias notas que copian la misma fuente matriz cuentan como una sola cadena, no como corroboraciones independientes.\n9) Antes del veredicto responde internamente: ¿cuál es la tesis central?, ¿qué evidencia DIRECTA la prueba o contradice?, ¿qué datos son periféricos?, ¿quién origina la acusación y qué patrón verificable muestra su historial?\n10) Mantén presunción de inocencia y separa hechos procesales de culpabilidad.\n11) INVESTIGA EL ENTORNO COMPLETO antes de clasificar: localiza la fuente primaria, metodología, anexos o tablas, periodo comparable, alcance, limitaciones, reacciones oficiales y críticas técnicas pertinentes. No te limites a confirmar cómo circula el titular ni a resumir el texto proporcionado por el usuario.\n12) Para pruebas, índices, encuestas y estadísticas internacionales consulta obligatoriamente: nota del país o ficha oficial, informe y guía metodológica, significancia estadística, tamaño y cobertura de la muestra, cambios de población o elegibilidad y declaraciones públicas de quienes dirigen o elaboran la medición. Distingue una diferencia numérica de un cambio estadísticamente significativo.\n13) Verifica la exposición temporal: antes de atribuir un resultado a una reforma, gobierno, plan educativo o política, comprueba cuándo se aplicó, cuánto tiempo estuvieron expuestas las personas evaluadas y si la fuente primaria hace esa atribución causal.\n14) Evalúa por separado todo término fuerte del titular —por ejemplo "fracaso", "colapso", "milagro", "causó" o "demuestra"—. La existencia del titular o su repetición es CIRCUNSTANCIAL, no prueba directa de su verdad.\n15) NO VERIFICABLE se reserva para casos en los que, después de agotar la búsqueda, ninguna parte factual sustantiva de la tesis puede resolverse. Si hay componentes sustantivos confirmados y otros contradichos o no demostrados, usa PARCIALMENTE CIERTA; si los datos son reales pero el encuadre altera su significado, usa ENGAÑOSA.\n16) Un resultado NO VERIFICABLE debe tener credibilidad nula/no aplicable; nunca muestres simultáneamente "información insuficiente" y una credibilidad numérica alta.\n`;

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

function normalize(result) {
  if (!result || typeof result !== 'object') return result;
  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones) ? result.evaluacion_afirmaciones : [];
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
  return result;
}

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  addPolicy(req);
  const originalJson = res.json.bind(res);
  res.json = payload => originalJson(normalize(payload));
  return analyzeHandler(req, res);
}
