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
    result.estado='sin_acceso';result.veredicto='NO VERIFICABLE';result.veredicto_final='NO VERIFICABLE';result.respuesta_directa='No fue posible acceder al video.';
    result.fuentes=[{titulo:'Irrelevant directory',url:'https://example.com',tipo:'Otra',aporte:'Metadata'}];
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
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
      afirmacion:'Se pagaron $30,000 por la botella',estado:'NO DEMOSTRADA',sustento_directo:[],
      fuente_matriz:'Una columna replicada por otros medios',lo_que_no_demuestra:'Quién ordenó o pagó la botella'
    }];
    result.fuentes=[{titulo:'Nota que replica la columna',url:'https://example.com/replica',tipo:'Medio',aporte:'Repite la acusación'}];
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
  };
  try {
    const res={setHeader(){},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};
    await handler({method:'POST',body:{text:'¿Pagaron los hijos de AMLO $30,000 por una botella?'}},res);
    assert.equal(res.code,200);
    assert.equal(res.value.veredicto,'INFORMACIÓN INSUFICIENTE');
    assert.equal(res.value.veredicto_final,'NO VERIFICABLE');
    assert.doesNotMatch(res.value.explicacion_veredicto_final,/evidencia period[ií]stica/i);
    assert.equal(res.value.evaluacion_afirmaciones[0].estado,'NO DEMOSTRADA');
  } finally {global.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
