import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import {isSocialProfileUrl,extractPublicLink} from './extract-content.js';
import handler from './analyze.js';

test('TikTok short codes are not usernames',()=>{
  for(const host of ['vt.tiktok.com','vm.tiktok.com']) assert.equal(isSocialProfileUrl(new URL(`https://${host}/ZSVvAup4u/`),'TikTok'),false);
  assert.equal(isSocialProfileUrl(new URL('https://www.tiktok.com/@joan'),'TikTok'),true);
});
test('Resolved URL survives destination failure; generic page is not content',async()=>{
  const oldFetch=global.fetch, oldLookup=dns.lookup;
  dns.lookup=async()=>[{address:'8.8.8.8',family:4}];
  try {
    let count=0;
    global.fetch=async()=>{if(count++===0)return new Response('',{status:301,headers:{location:'https://www.tiktok.com/@joan/video/123'}});throw new Error('destination failed');};
    const fail=await extractPublicLink('https://vt.tiktok.com/ABC/');
    assert.equal(fail.url_final,'https://www.tiktok.com/@joan/video/123');assert.equal(fail.perfil,null);
    global.fetch=async()=>new Response('<title>TikTok - Make Your Day</title><body>'+('Generic navigation '.repeat(30))+'</body>',{headers:{'content-type':'text/html'}});
    const shell=await extractPublicLink('https://www.tiktok.com/@joan/video/123');assert.equal(shell.acceso_directo,false);
  } finally {global.fetch=oldFetch;dns.lookup=oldLookup;}
});
function empty(schema){
  if(schema.type==='object')return Object.fromEntries(Object.entries(schema.properties).map(([k,v])=>[k,empty(v)]));
  if(schema.type==='array')return [];
  if(schema.enum)return schema.enum[0];
  if(schema.type==='boolean')return false;
  if(schema.type==='number'||schema.type==='integer')return 0;
  if(Array.isArray(schema.type))return schema.type.includes('null')?null:'';
  return '';
}
test('Bare and prefixed link failures return no verdict or sources',async()=>{
  const old=global.fetch, oldKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='mock';
  global.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body=JSON.parse(options.body);const result=empty(body.text.format.schema);
    assert.equal(body.reasoning.effort,'medium');
    assert.equal(body.tools[0].search_context_size,'high');
    result.estado='sin_acceso';result.veredicto='NO VERIFICABLE';result.veredicto_final='NO VERIFICABLE';result.respuesta_directa='No fue posible acceder al video.';
    result.fuentes=[{titulo:'Irrelevant directory',url:'https://example.com',tipo:'Otra',aporte:'Metadata'}];
    return Response.json({output:[{type:'message',content:[{
      type:'output_text',text:JSON.stringify(result),
      annotations:[{type:'url_citation',url:'https://example.com/exploratorio',title:'Resultado exploratorio'}]
    }]}]});
  };
  try {
    for(const text of ['http://127.0.0.1/video','Verifica este video http://127.0.0.1/video']){
      const res={setHeader(){},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};
      await handler({method:'POST',body:{text}},res);
      assert.equal(res.code,200);assert.equal(res.value.analizado,false);assert.equal(res.value.veredicto_final,null);assert.deepEqual(res.value.fuentes,[]);assert.equal(res.value.compartir_habilitado,false);
    }
  } finally {global.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
test('Journalistic repetition cannot manufacture a partially true verdict',async()=>{
  const old=global.fetch, oldKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='mock';
  global.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body=JSON.parse(options.body);const result=empty(body.text.format.schema);
    result.estado='analizado';
    result.veredicto='PARCIALMENTE VERDADERO';
    result.veredicto_final='PARCIALMENTE CIERTA';
    result.explicacion_veredicto_final='Hay evidencia periodística reciente sobre una botella de $30,000.';
    result.evaluacion_afirmaciones=[{
      afirmacion:'Se pagaron $30,000 por la botella',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA',sustento_directo:[],
      fuente_matriz:'Una columna replicada por otros medios',lo_que_no_demuestra:'Quién ordenó o pagó la botella'
    }];
    result.fuentes=[{titulo:'Nota general sobre las mismas personas',url:'https://example.com/contexto',tipo:'Medio',aporte:'Contexto político; no documenta el caso del vino'}];
    return Response.json({output:[{type:'message',content:[{
      type:'output_text',text:JSON.stringify(result),
      annotations:[{type:'url_citation',url:'https://example.com/exploratorio-2',title:'Otra búsqueda exploratoria'}]
    }]}]});
  };
  try {
    const res={setHeader(){},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};
    await handler({method:'POST',body:{text:'¿Pagaron los hijos de AMLO $30,000 por una botella?'}},res);
    assert.equal(res.code,200);
    assert.equal(res.value.veredicto,'INFORMACIÓN INSUFICIENTE');
    assert.equal(res.value.veredicto_final,'NO VERIFICABLE');
    assert.doesNotMatch(res.value.explicacion_veredicto_final,/evidencia period[ií]stica/i);
    assert.equal(res.value.evaluacion_afirmaciones[0].estado,'NO DEMOSTRADA');
    assert.equal(res.value.evaluacion_afirmaciones[0].relacion_con_afirmacion,'DIRECTA');
    assert.deepEqual(res.value.fuentes,[]);
  } finally {global.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
test('Journalistic claims require a source audit and direct proof of paid deception',async()=>{
  const old=global.fetch, oldKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='mock';
  global.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body=JSON.parse(options.body);const result=empty(body.text.format.schema);
    assert(body.text.format.schema.required.includes('auditoria_fuentes_periodisticas'));
    result.estado='analizado';
    result.veredicto='ENGAÑOSO';
    result.veredicto_final='ENGAÑOSA';
    result.confianza=92;
    result.resumen='Informes periodísticos sostienen el señalamiento y el comunicador recibió dinero para inventar la nota.';
    result.evaluacion_afirmaciones=[{
      afirmacion:'El señalamiento está demostrado',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA',sustento_directo:[],fuente_matriz:'Medio A',lo_que_no_demuestra:'El hecho subyacente'
    }];
    result.auditoria_sesgo_fuentes.obligacion_contradiccion_cumplida=true;
    result.auditoria_fuentes_periodisticas=[{
      medio_o_periodista:'Medio A',orientacion:'DERECHA',fundamento_orientacion:['Línea editorial documentada'],
      propiedad_y_financiamiento:['Propietario identificado'],contratos_o_pagos_documentados:['Contrato de publicidad'],
      antecedentes_verificados:['Corrección publicada'],relacion_con_publicacion_actual:'NO DEMOSTRADA',
      prueba_pago_para_mentir:'NO DOCUMENTADA',conclusion:'El contrato no prueba compra de esta nota.',limitaciones:[]
    }];
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result),annotations:[]}]}]});
  };
  try {
    const res={setHeader(){},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};
    await handler({method:'POST',body:{text:'Revisa si este medio cobró por publicar una mentira.'}},res);
    assert.equal(res.code,200);
    assert.equal(res.value.auditoria_fuentes_periodisticas[0].prueba_pago_para_mentir,'NO DOCUMENTADA');
    assert(res.value.confianza<=49);
    assert(res.value.limitaciones.some(item=>item.includes('No se documentó un vínculo directo')));
  } finally {global.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
