import assert from 'node:assert/strict';
import { applyPisaPandemicFramingGuard, normalize as normalizeProduction } from './analyze-v3.js';

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

// Confirmar la autoría de una acusación no confirma la acusación incrustada.
const acusacionAnonima = normalizeProduction({
  veredicto_final:'CIERTA',
  veredicto:'VERDADERO',
  credibilidad:null,
  confianza:63,
  afirmacion_principal:'Que la presidenta Claudia Sheinbaum consume marihuana actualmente, según lo afirmado por Anabel Hernández.',
  explicacion_veredicto_final:'Anabel Hernández sí difundió la versión, pero no presentó pruebas verificables públicas que confirmen el consumo actual.',
  respuesta_directa:'La periodista lo dijo, pero la afirmación carece de evidencia pública verificable.',
  evaluacion_afirmaciones:[
    {
      afirmacion:'Anabel Hernández afirmó que miembros del gobierno le dijeron que Sheinbaum consume marihuana.',
      estado:'CONFIRMADA', relacion_con_afirmacion:'DIRECTA',
      sustento_directo:['Registro y transcripción del episodio.'],
      lo_que_no_demuestra:'No demuestra que el consumo sea cierto.'
    },
    {
      afirmacion:'Claudia Sheinbaum consume marihuana actualmente.',
      estado:'NO DEMOSTRADA', relacion_con_afirmacion:'CIRCUNSTANCIAL',
      sustento_directo:[], lo_que_no_demuestra:'No existen pruebas médicas ni testimonios identificables.'
    }
  ],
  evidencia_a_favor:['El episodio reproduce la versión de fuentes anónimas.'],
  limitaciones:[]
}, 'https://podcasts.apple.com/episodio/111');
assert.equal(acusacionAnonima.veredicto_final,'NO VERIFICABLE');
assert.equal(acusacionAnonima.veredicto,'INFORMACIÓN INSUFICIENTE');
assert.equal(acusacionAnonima.credibilidad,null);
assert.equal(acusacionAnonima.evaluacion_afirmaciones[0].relacion_con_afirmacion,'CIRCUNSTANCIAL');
assert.equal(acusacionAnonima.evaluacion_afirmaciones[1].relacion_con_afirmacion,'DIRECTA');
assert.deepEqual(acusacionAnonima.evidencia_a_favor,[]);

// Si la consulta pregunta expresamente por la declaración, la autoría sí es la
// tesis central y puede verificarse sin afirmar que el contenido sea verdadero.
const preguntaDeAtribucion = normalizeProduction({
  veredicto_final:'CIERTA', veredicto:'VERDADERO',
  afirmacion_principal:'Anabel Hernández afirmó que la presidenta consume marihuana.',
  explicacion_veredicto_final:'La declaración aparece en el episodio, pero no prueba el consumo.',
  evaluacion_afirmaciones:[
    {afirmacion:'Anabel Hernández hizo esa declaración.',estado:'CONFIRMADA',relacion_con_afirmacion:'DIRECTA'},
    {afirmacion:'La presidenta consume marihuana.',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'CIRCUNSTANCIAL'}
  ]
}, '¿Es cierto que Anabel Hernández afirmó que la presidenta consume marihuana?');
assert.equal(preguntaDeAtribucion.veredicto_final,'CIERTA');

// Resolver un enlace y recuperar una frase elíptica no equivale a comprobar
// una afirmación. Este caso reproduce la salida defectuosa observada en Threads.
const fragmentoSinAfirmacion = normalizeProduction({
  estado:'analizado',
  veredicto_final:'CIERTA',
  veredicto:'VERDADERO',
  credibilidad:90,
  confianza:63,
  afirmacion_principal:'El enlace corresponde a una publicación de @simonlevymx en Threads con el texto indicado.',
  explicacion_veredicto_final:'El enlace compartido se expande a una publicación pública atribuida al usuario @simonlevymx.',
  resumen:'La vista previa muestra “… y es domingo. Te lo dije papi.”',
  respuesta_directa:'Sí. El share link apunta a una publicación de @simonlevymx.',
  contexto:'Se trata de una publicación de tono coloquial y breve; no contiene afirmaciones verificables ni acusaciones.',
  conclusion:'El post es de tono personal y no contiene afirmaciones verificables.',
  evaluacion_afirmaciones:[{
    afirmacion:'El enlace apunta a una publicación de @simonlevymx en Threads con el texto visible.',
    estado:'CONFIRMADA', relacion_con_afirmacion:'DIRECTA',
    sustento_directo:['Redirección y metadatos del conector.'],
    fuente_matriz:'https://www.threads.com/@simonlevymx/post/DdOzRkmjn6i',
    lo_que_no_demuestra:'No demuestra fecha exacta ni contexto adicional.'
  }],
  hechos_comprobados:[
    'El share link redirige a https://www.threads.com/@simonlevymx/post/DdOzRkmjn6i.',
    'La vista previa recuperada muestra el texto “… y es domingo. Te lo dije papi.”',
    'Simón Levy usa el mismo identificador en otras plataformas.'
  ],
  evidencia_a_favor:['ThreadLook confirma que existen visores anónimos de Threads.'],
  evidencia_en_contra:[],
  limitaciones:['No se recuperaron el hilo completo, la multimedia ni los comentarios.'],
  auditoria_fuentes_periodisticas:[{medio_o_periodista:'ThreadReaderApp'}],
  fuentes:[
    {titulo:'Threads',url:'https://www.threads.com/@simonlevymx/post/DdOzRkmjn6i',tipo:'Red social',aporte:'Vista previa.'},
    {titulo:'Telegram',url:'https://t.me/SimonLevyMx',tipo:'Red social',aporte:'Mismo usuario.'},
    {titulo:'Clean Links',url:'https://example.com/clean-links',tipo:'Otra',aporte:'Expansión técnica.'}
  ],
  extraccion_enlace:{
    plataforma:'Threads',
    url_original:'https://www.threads.com/share/BAZnM8Bm81/',
    url_final:'https://www.threads.com/@simonlevymx/post/DdOzRkmjn6i',
    descripcion:'… y es domingo. Te lo dije papi.'
  }
}, 'https://www.threads.com/share/BAZnM8Bm81/');
assert.equal(fragmentoSinAfirmacion.veredicto_final,'NO VERIFICABLE');
assert.equal(fragmentoSinAfirmacion.veredicto,'INFORMACIÓN INSUFICIENTE');
assert.equal(fragmentoSinAfirmacion.tipo_resultado,'sin_afirmacion_verificable');
assert.equal(fragmentoSinAfirmacion.estado_tecnico,'SIN_AFIRMACION_VERIFICABLE');
assert.equal(fragmentoSinAfirmacion.credibilidad,null);
assert.equal(fragmentoSinAfirmacion.confianza,null);
assert.deepEqual(fragmentoSinAfirmacion.evidencia_a_favor,[]);
assert.deepEqual(fragmentoSinAfirmacion.auditoria_fuentes_periodisticas,[]);
assert.equal(fragmentoSinAfirmacion.fuentes.length,1);
assert.match(fragmentoSinAfirmacion.fuentes[0].url,/threads\.com\/@simonlevymx\/post\//);
assert.equal(fragmentoSinAfirmacion.hechos_comprobados.length,2);

// Si la pregunta del usuario es expresamente técnica, la identidad del enlace
// sí puede ser la proposición principal y no se fuerza un veredicto factual.
const preguntaTecnicaEnlace = normalizeProduction({
  veredicto_final:'CIERTA', veredicto:'VERDADERO', credibilidad:95,
  afirmacion_principal:'El enlace corresponde a una publicación de @simonlevymx.',
  contexto:'La frase visible no contiene afirmaciones verificables.',
  evaluacion_afirmaciones:[{
    afirmacion:'El enlace apunta a una publicación de @simonlevymx.',
    estado:'CONFIRMADA', relacion_con_afirmacion:'DIRECTA', sustento_directo:['Redirección observada.']
  }]
}, '¿Este enlace corresponde a una publicación de @simonlevymx? https://www.threads.com/share/BAZnM8Bm81/');
assert.equal(preguntaTecnicaEnlace.veredicto_final,'CIERTA');
