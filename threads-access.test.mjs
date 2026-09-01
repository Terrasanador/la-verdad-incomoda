import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import vm from 'node:vm';
import {threadsLinkType,threadsCanonicalFromHtml,retryAfterSeconds,threadsRetryRemaining,resetThreadsCooldownsForTest,threadsReferenceOnly} from './threads-access.js';
import {extractPublicLink} from './extract-content.js';
import {extractSocialPublicData} from './social-data.js';
import handler from './analyze.js';

const share='https://www.threads.com/share/example/';
const post='https://www.threads.com/@usuario/post/ABC_123';
function emptySchema(schema){
  if(schema.type==='object')return Object.fromEntries(Object.entries(schema.properties).map(([key,value])=>[key,emptySchema(value)]));
  if(schema.type==='array')return [];
  if(schema.enum)return schema.enum[0];
  if(schema.type==='boolean')return false;
  if(schema.type==='number'||schema.type==='integer')return 0;
  if(Array.isArray(schema.type))return schema.type.includes('null')?null:'';
  return '';
}
async function withMocks(run) {
  const oldFetch=global.fetch, oldLookup=dns.lookup, apiKey=process.env.CAPTAPI_API_KEY, openai=process.env.OPENAI_API_KEY;
  process.env.CAPTAPI_API_KEY='test-key';process.env.OPENAI_API_KEY='test-key';
  dns.lookup=async()=>[{address:'8.8.8.8',family:4}];resetThreadsCooldownsForTest();
  try {await run();} finally {global.fetch=oldFetch;dns.lookup=oldLookup;resetThreadsCooldownsForTest();
    if(apiKey===undefined)delete process.env.CAPTAPI_API_KEY;else process.env.CAPTAPI_API_KEY=apiKey;
    if(openai===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=openai;}
}
test('Threads URL types and command-only detection',()=>{
  assert.equal(threadsLinkType(share),'share');assert.equal(threadsLinkType(post),'post');
  assert.equal(threadsLinkType('https://www.threads.com/@usuario'),'profile');
  assert.equal(threadsLinkType('https://threads.com.evil.test/@u/post/ID'),'');
  assert(threadsReferenceOnly('Verifica este video '+share,share));
  assert(!threadsReferenceOnly('La capital de Francia es París '+share,share));
});
test('Canonical metadata, og:url and refresh resolve only valid Threads targets',()=>{
  for(const html of [`<link rel="canonical" href="${post}?x=1">`,`<meta content="${post}" property="og:url">`,`<meta http-equiv="refresh" content="0;url=${post}">`]) assert.equal(threadsCanonicalFromHtml(html,share),post);
  assert.equal(threadsCanonicalFromHtml(`<a href="${post}">Related post</a>`,share),'');
  assert.equal(threadsCanonicalFromHtml('<link rel="canonical" href="https://threads.com.evil.test/@u/post/ID">',share),'');
  assert.equal(threadsCanonicalFromHtml(`<link rel="canonical" href="${post}"><meta property="og:url" content="https://www.threads.com/@other/post/XYZ">`,share),'');
});
test('Retry-After supports seconds, HTTP date and fallback',()=>{
  const now=Date.parse('2026-08-31T12:00:00Z');
  assert.equal(retryAfterSeconds('120',now),120);
  assert.equal(retryAfterSeconds('Mon, 31 Aug 2026 12:02:00 GMT',now),120);
  assert.equal(retryAfterSeconds(null,now),60);
});
test('HTTP redirect preserves post URL; canonical HTML is not treated as content',()=>withMocks(async()=>{
  let n=0;global.fetch=async()=>n++===0?new Response('',{status:302,headers:{location:post}}):new Response('<title>Post</title><body>'+('contenido '.repeat(30))+'</body>',{headers:{'content-type':'text/html'}});
  const redirect=await extractPublicLink(share);assert.equal(redirect.url_final,post);assert.equal(redirect.perfil,null);
  global.fetch=async()=>new Response(`<head><link rel="canonical" href="${post}"></head>`,{headers:{'content-type':'text/html'}});
  const html=await extractPublicLink(share);assert.equal(html.url_final,post);assert.equal(html.resolucion_enlace,'canonical_html');assert.equal(html.acceso_directo,false);
}));
test('Unresolved share never calls an incompatible provider endpoint',()=>withMocks(async()=>{
  global.fetch=async()=>{throw new Error('No network request expected');};
  const result=await extractSocialPublicData(share);assert.equal(result.consultas_intentadas,0);assert.equal(result.tipo_enlace,'compartido_no_resuelto');
}));
test('Resolved post goes to post-details, not profile',()=>withMocks(async()=>{
  global.fetch=async(url)=>{const target=new URL(url);assert.equal(target.pathname,'/v1/threads/post-details');assert.equal(target.searchParams.get('url'),post);return Response.json({text:'Recovered claim'});};
  const result=await extractSocialPublicData(post);assert.equal(result.consultas_exitosas,1);
}));
test('Direct 429 stops requests across Threads domains and surfaces wait',()=>withMocks(async()=>{
  let n=0;global.fetch=async()=>{n++;return new Response('',{status:429,headers:{'retry-after':'120'}});};
  const first=await extractPublicLink(share);assert.equal(first.http_status,429);assert.equal(first.retry_after_seconds,120);
  const second=await extractPublicLink('https://www.threads.net/share/other');assert.equal(n,1);assert(second.retry_after_seconds>0);assert(threadsRetryRemaining()>0);
}));
test('Provider 429 exposes wait and does not retry',()=>withMocks(async()=>{
  let n=0;global.fetch=async()=>{n++;return new Response('',{status:429,headers:{'retry-after':'90'}});};
  const first=await extractSocialPublicData(post);assert.equal(first.retry_after_seconds,90);
  const second=await extractSocialPublicData(post);assert.equal(n,1);assert(second.retry_after_seconds>0);
}));
test('Handler bypasses model and provider on unresolved or rate-limited share',()=>withMocks(async()=>{
  for(const limited of [false,true]) {
    resetThreadsCooldownsForTest();let n=0;
    global.fetch=async(url)=>{n++;assert.equal(new URL(url).hostname,'www.threads.com');return limited?new Response('',{status:429,headers:{'retry-after':'120'}}):new Response('<title>Threads</title>',{headers:{'content-type':'text/html'}});};
    const headers={};const res={setHeader(k,v){headers[k]=v;},status(n){this.code=n;return this;},json(v){this.value=v;return this;}};
    await handler({method:'POST',body:{text:'Verifica este video '+share}},res);
    assert.equal(n,1);assert.equal(res.code,200);assert.equal(res.value.analizado,false);assert.equal(res.value.veredicto_final,null);assert.deepEqual(res.value.fuentes,[]);
    if(limited)assert.equal(headers['Retry-After'],'120');
  }
}));
test('Recovered Threads description overrides an erroneous model access failure',()=>withMocks(async()=>{
  let step=0;
  global.fetch=async(url,options={})=>{
    const target=new URL(url);
    if(target.hostname==='www.threads.com' && step++===0) return new Response('',{status:302,headers:{location:post}});
    if(target.hostname==='www.threads.com') return new Response(`<head><meta property="og:title" content="Publicación de usuario"><meta property="og:description" content="Esta es una afirmación pública suficientemente extensa para ser identificada y verificada por el sistema."></head><body>Threads requiere JavaScript</body>`,{headers:{'content-type':'text/html'}});
    if(target.hostname==='api.captapi.com') return Response.json({text:'Esta es una afirmación pública suficientemente extensa para verificar.'});
    assert.equal(target.hostname,'api.openai.com');
    const request=JSON.parse(options.body);const result=emptySchema(request.text.format.schema);
    result.estado='sin_acceso';result.veredicto='NO VERIFICABLE';result.veredicto_final='NO VERIFICABLE';
    result.afirmacion_principal='Esta es una afirmación pública';result.respuesta_directa='No pude acceder';result.resumen='No pude acceder';result.conclusion='No pude acceder';
    result.evaluacion_afirmaciones=[{afirmacion:'Esta es una afirmación pública',estado:'NO DEMOSTRADA',relacion_con_afirmacion:'DIRECTA',sustento_directo:[],fuente_matriz:'Publicación original',lo_que_no_demuestra:'Su veracidad'}];
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
  };
  const res={setHeader(){},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};
  await handler({method:'POST',body:{text:share}},res);
  assert.equal(res.code,200);assert.equal(res.value.estado,'analizado');assert.notEqual(res.value.analizado,false);
  assert.equal(res.value.extraccion_enlace.conector_multiplataforma.consultas_exitosas,1);
}));
test('Both frontends persist cooldown, suppress repeat fetch and do not count failure as success',async()=>{
  const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
  assert.equal(html,fs.readFileSync(new URL('./index-final.html',import.meta.url),'utf8'));
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if(!/application\/ld\+json/i.test(match[1])) new vm.Script(match[2]);
  }
  const source=html.slice(html.indexOf('  async function analyze('),html.indexOf('  const howModal ='));
  let calls=0,blocked=0;const events=[],saved={};
  const context=vm.createContext({
    newsInput:{value:share},threadsCooldownUntil:0,selectedFile:null,selectedMode:'rapido',
    analyzeButton:{disabled:false},result:{classList:{remove(){}}},
    startProgress(){},endProgress(){},render(){},renderError(message){throw new Error(message);},
    renderBlocked(data){blocked++;assert(data.retry_after_seconds>0);},trackUsage(name){events.push(name);},
    sessionStorage:{setItem(k,v){saved[k]=v;}},
    fetch:async()=>{calls++;return Response.json({estado:'sin_acceso',analizado:false,retry_after_seconds:120});}
  });
  vm.runInContext(source,context);
  await context.analyze();assert.equal(calls,1);assert.equal(context.analyzeButton.disabled,false);
  assert(Number(saved.lvi_threads_retry_at)>Date.now());
  assert(events.includes('verificacion_sin_acceso'));assert(!events.includes('verificacion_completada'));
  await context.analyze();assert.equal(calls,1);assert.equal(blocked,1);
});
