import assert from 'node:assert/strict';

function normalize(result) {
  const evaluaciones = Array.isArray(result.evaluacion_afirmaciones) ? result.evaluacion_afirmaciones : [];
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
