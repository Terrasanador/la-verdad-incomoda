import analyzeHandler from './analyze.js';

// La Verdad Incómoda — guardas metodológicas V3.
// Este adaptador refuerza el motor existente sin duplicar sus 120 KB de lógica.
const POLICY = `\n\nREGLAS V3 OBLIGATORIAS PARA ESTA VERIFICACIÓN:\n1) Identifica primero la TESIS CENTRAL o acusación que el contenido intenta instalar.\n2) Separa hechos SUSTANTIVOS que prueban esa tesis de datos PERIFÉRICOS (nombre, cargo, fecha, parentesco, lugar, que alguien publicó la acusación, etc.). Un dato periférico verdadero NO convierte una acusación central falsa o no demostrada en PARCIALMENTE CIERTA.\n3) PARCIALMENTE CIERTA/PARCIALMENTE VERDADERO solo procede cuando al menos una proposición SUSTANTIVA de la tesis central está demostrada y otra proposición SUSTANTIVA está contradicha o no demostrada.\n4) Si la tesis central está materialmente contradicha por evidencia suficiente, usa FALSA/FALSO aunque contenga datos periféricos correctos.\n5) Si la tesis central atribuye órdenes secretas, encubrimiento, protección, conspiración, intención o causalidad y no existe evidencia suficiente para confirmarla o refutarla, usa NO VERIFICABLE/INFORMACIÓN INSUFICIENTE; no la premies con verdad parcial por hechos accesorios.\n6) AUDITA AL EMISOR: identifica la fuente matriz; revisa antecedentes públicos relevantes y una muestra verificable de publicaciones anteriores; registra patrón editorial, objetivos recurrentes, falsedades o correcciones documentadas, propiedad/financiamiento/conflictos solo si están sustentados, y orientación IZQUIERDA/DERECHA/MIXTA/NO DETERMINADA únicamente con evidencia acumulada. La orientación jamás decide la verdad.\n7) Distingue crítica legítima, opinión adversa, cobertura negativa recurrente, campaña de descrédito y ataque sistemático con desinformación. No atribuyas pago, coordinación o intención sin evidencia.\n8) Deduplica réplicas: varias notas que copian la misma fuente matriz cuentan como una sola cadena, no como corroboraciones independientes.\n9) Antes del veredicto responde internamente: ¿cuál es la tesis central?, ¿qué evidencia DIRECTA la prueba o contradice?, ¿qué datos son periféricos?, ¿quién origina la acusación y qué patrón verificable muestra su historial?\n10) Mantén presunción de inocencia y separa hechos procesales de culpabilidad.\n`;

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
