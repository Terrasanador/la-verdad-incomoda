import assert from 'node:assert/strict';
import { applyPisaPandemicFramingGuard } from './analyze-v3.js';

function normalize(result) {
  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones) ? result.evaluacion_afirmaciones : [];
  const finalPorTecnico = {
    VERDADERO:'CIERTA', CIERTO:'CIERTA', FALSO:'FALSA',
    'PARCIALMENTE VERDADERO':'PARCIALMENTE CIERTA',
    'PARCIALMENTE CIERTO':'PARCIALMENTE CIERTA',
    ENGAÑOSO:'ENGAÑOSA',
    'INFORMACIÓN INSUFICIENTE':'NO VERIFICABLE',
    'NO VERIFICABLE':'NO VERIFICABLE', 'NO COMPROBABLE':'NO VERIFICABLE'
  };
  if (finalPorTecnico[result.veredicto]) result.veredicto_final=finalPorTecnico[result.veredicto];
  if (Array.isArray(result.fuentes)) for (const fuente of result.fuentes) {
    try {
      const host=new URL(fuente.url).hostname.toLowerCase();
      if (host==='oecd.org'||host.endsWith('.oecd.org')||host==='gob.mx'||host.endsWith('.gob.mx')) fuente.tipo='Oficial';
    } catch {}
  }
  const directas = evaluaciones.filter(e => e?.relacion_con_afirmacion === 'DIRECTA');
  const confirmadas = directas.filter(e => e?.estado === 'CONFIRMADA');
  const contradichas = directas.filter(e => e?.estado === 'CONTRADICHA');
  const noDemostradas = directas.filter(e => e?.estado === 'NO DEMOSTRADA');
  const noVerificable = result.veredicto_final === 'NO VERIFICABLE' || ['INFORMACIÓN INSUFICIENTE','NO VERIFICABLE','NO COMPROBABLE'].includes(result.veredicto);
  if (noVerificable && confirmadas.length === 0) result.credibilidad = null;
  if (noVerificable && confirmadas.length > 0) {
    result.veredicto_final='PARCIALMENTE CIERTA';
    result.veredicto='PARCIALMENTE VERDADERO';
  }
  if (result.veredicto_final === 'PARCIALMENTE CIERTA' || result.veredicto === 'PARCIALMENTE VERDADERO') {
    if (confirmadas.length === 0) {
      if (contradichas.length > 0) { result.veredicto_final='FALSA'; result.veredicto='FALSO'; }
      else { result.veredicto_final='NO VERIFICABLE'; result.veredicto='INFORMACIÓN INSUFICIENTE'; }
    } else if (contradichas.length === 0 && noDemostradas.length === 0) {
      result.veredicto_final='CIERTA'; result.veredicto='VERDADERO';
    }
  }
  return result;
}

// Un cargo real no vuelve parcialmente cierta una acusación de encubrimiento.
assert.equal(normalize({veredicto_final:'PARCIALMENTE CIERTA',veredicto:'PARCIALMENTE VERDADERO',evaluacion_afirmaciones:[{afirmacion:'Ocupa el cargo',estado:'CONFIRMADA',relacion_con_afirmacion:'CIRCUNSTANCIAL'},{afirmacion:'Fue colocado para encubrir',estado:'CONTRADICHA',relacion_con_afirmacion:'DIRECTA'}]}).veredicto_final,'FALSA');

// Si solo hay datos accesorios y la tesis secreta no se demuestra, no hay verdad parcial.
assert.equal(normalize({veredicto_final:'PARCIALMENTE CIERTA',veredicto:'PARCIALMENTE VERDADERO',evaluacion_afirmaciones:[{afirmacion:'Existe la persona',estado:'CONFIRMADA',relacion_con_afirmacion:'CIRCUNSTANCIAL'},{afirmacion:'Recibió una orden secreta',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA'}]}).veredicto_final,'NO VERIFICABLE');

// Una verdad parcial legítima conserva dos componentes sustantivos directos distintos.
assert.equal(normalize({veredicto_final:'PARCIALMENTE CIERTA',veredicto:'PARCIALMENTE VERDADERO',evaluacion_afirmaciones:[{afirmacion:'Componente A',estado:'CONFIRMADA',relacion_con_afirmacion:'DIRECTA'},{afirmacion:'Componente B',estado:'CONTRADICHA',relacion_con_afirmacion:'DIRECTA'}]}).veredicto_final,'PARCIALMENTE CIERTA');

console.log('thesis-central-regression: OK');

// Caso PISA: hechos sustantivos confirmados + atribución causal no demostrada
// no pueden producir un cierre totalmente "NO VERIFICABLE".
const pisa = normalize({
  veredicto_final:'NO VERIFICABLE',
  veredicto:'INFORMACIÓN INSUFICIENTE',
  credibilidad:85,
  evaluacion_afirmaciones:[
    {afirmacion:'México bajó en matemáticas frente a 2022',estado:'CONFIRMADA',relacion_con_afirmacion:'DIRECTA'},
    {afirmacion:'La Nueva Escuela Mexicana causó el resultado',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA'}
  ]
});
assert.equal(pisa.veredicto_final,'PARCIALMENTE CIERTA');
assert.equal(pisa.veredicto,'PARCIALMENTE VERDADERO');

const imposible = normalize({
  veredicto_final:'NO VERIFICABLE',
  veredicto:'INFORMACIÓN INSUFICIENTE',
  credibilidad:85,
  evaluacion_afirmaciones:[
    {afirmacion:'La acusación secreta ocurrió',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA'}
  ]
});
assert.equal(imposible.veredicto_final,'NO VERIFICABLE');
assert.equal(imposible.credibilidad,null);

// Un ejemplo de reacción no confirma la palabra absoluta "solo".
const absoluta = {
  estado:'CONFIRMADA',
  afirmacion:'La presidenta solo ofreció explicaciones.',
  lo_que_no_demuestra:'La palabra solo es interpretativa; no prueba que no haya otras acciones.'
};
if (
  absoluta.estado === 'CONFIRMADA' &&
  /\b(?:solo|sólo|únicamente|nunca|siempre|todos?|ningun[oa]s?)\b/i.test(absoluta.afirmacion) &&
  /(?:no (?:prueba|demuestra)|interpretativ|no permite afirmar|alcance total)/i.test(absoluta.lo_que_no_demuestra)
) absoluta.estado='NO DEMOSTRADA';
assert.equal(absoluta.estado,'NO DEMOSTRADA');

// El encabezado no puede decir FALSA si la clasificación técnica dice ENGAÑOSO.
const inconsistente=normalize({
  veredicto_final:'FALSA', veredicto:'ENGAÑOSO', evaluacion_afirmaciones:[],
  fuentes:[{url:'https://www.oecd.org/en/publications/pisa-2025-results/mexico.html',tipo:'Periodística'}]
});
assert.equal(inconsistente.veredicto_final,'ENGAÑOSA');
assert.equal(inconsistente.fuentes[0].tipo,'Oficial');

// Citar declaraciones oficiales no confirma el encuadre acusatorio de que la
// pandemia es una excusa inventada. PISA exige contraste internacional.
const culpaPisa = applyPisaPandemicFramingGuard({
  veredicto_final:'CIERTA',
  veredicto:'VERDADERO',
  credibilidad:75,
  afirmacion_principal:'Morena culpa al pasado y usa el COVID como excusa por PISA.',
  fuentes:[],
  evaluacion_afirmaciones:[]
}, 'La 4T culpa al pasado y al COVID-19 por el fracaso en PISA.');
assert.equal(culpaPisa.veredicto_final,'ENGAÑOSA');
assert.equal(culpaPisa.veredicto,'ENGAÑOSO');
assert.equal(culpaPisa.credibilidad,45);
assert.equal(culpaPisa.evaluacion_afirmaciones[1].estado,'CONTRADICHA');
assert.match(culpaPisa.fuentes[1].url,/oecdedutoday\.com/);

// Una pregunta neutral sobre si hubo una declaración conserva su resultado.
const citaNeutral = applyPisaPandemicFramingGuard({
  veredicto_final:'CIERTA', veredicto:'VERDADERO',
  afirmacion_principal:'La presidenta mencionó la pandemia al comentar PISA.'
}, '¿La presidenta mencionó la pandemia al comentar PISA?');
assert.equal(citaNeutral.veredicto_final,'CIERTA');
