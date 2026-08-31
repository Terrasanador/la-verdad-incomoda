// Pure URL classification and bounded, per-worker rate-limit state.
export function isThreadsUrl(value) {
  try {
    const url=new URL(value);
    return ['http:','https:'].includes(url.protocol) && !url.username && !url.password && !url.port && /^(?:www\.)?threads\.(?:com|net)$/i.test(url.hostname);
  } catch { return false; }
}
export function threadsLinkType(value) {
  if (!isThreadsUrl(value)) return '';
  const path=new URL(value).pathname;
  if (/^\/@[A-Za-z0-9_.]+\/post\/[A-Za-z0-9_-]+\/?$/.test(path)) return 'post';
  if (/^\/@[A-Za-z0-9_.]+\/?$/.test(path)) return 'profile';
  if (/^\/share\/[^/]+\/?$/.test(path)) return 'share';
  return 'unsupported';
}
function decode(value) {
  return value.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'");
}
export function threadsCanonicalFromHtml(html,baseUrl) {
  if (threadsLinkType(baseUrl)!=='share') return '';
  const head=String(html).split(/<\/head>/i)[0].slice(0,128000);
  const candidates=new Set();
  for (const tag of head.match(/<(?:link|meta)\b[^>]*>/gi)||[]) {
    const attrs={};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[match[1].toLowerCase()]=decode(match[2]??match[3]);
    let target='';
    if (/^<link/i.test(tag) && /(?:^|\s)canonical(?:\s|$)/i.test(attrs.rel||'')) target=attrs.href;
    if (/^<meta/i.test(tag) && (attrs.property||'').toLowerCase()==='og:url') target=attrs.content;
    if (/^<meta/i.test(tag) && (attrs['http-equiv']||'').toLowerCase()==='refresh') target=(attrs.content||'').match(/^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*["']?([^"']+)/i)?.[1]?.trim();
    if(!target) continue;
    try {
      const url=new URL(target,baseUrl);
      if(!['post','profile'].includes(threadsLinkType(url.href))) continue;
      url.search='';url.hash='';url.pathname=url.pathname.replace(/\/$/,'');
      candidates.add(url.href);
    } catch {}
  }
  // Conflicting metadata is not sufficient to identify the intended publication.
  return candidates.size===1?[...candidates][0]:'';
}

const cooldowns=new Map();
export function retryAfterSeconds(value,now=Date.now()) {
  const raw=String(value??'').trim();
  if (/^\d+$/.test(raw)) return Math.max(1,Number(raw));
  const date=Date.parse(raw);
  return Number.isFinite(date)?Math.max(1,Math.ceil((date-now)/1000)):60;
}
export function rememberThreadsRateLimit(response,scope='direct',now=Date.now()) {
  const seconds=retryAfterSeconds(response.headers.get('retry-after'),now);
  const deadline=Math.max(cooldowns.get(scope)||0,now+seconds*1000);
  cooldowns.set(scope,deadline);
  return Math.ceil((deadline-now)/1000);
}
export function threadsRetryRemaining(scope='direct',now=Date.now()) {
  const seconds=Math.ceil(((cooldowns.get(scope)||0)-now)/1000);
  if(seconds<=0) {cooldowns.delete(scope);return 0;}
  return seconds;
}
export function resetThreadsCooldownsForTest() {cooldowns.clear();}
export function threadsReferenceOnly(text,url) {
  const rest=String(text).replace(url,'').trim();
  return /^(?:(?:por favor|verifica|verificar|analiza|analizar|revisa|revisar|este|esta|el|la|un|una|las|los|afirmaciones|del|de|contenido|en|video|vídeo|publicación|publicacion|enlace|perfil|cuenta|threads|credibilidad|y)[\s,:;.!?¿¡-]*)*$/i.test(rest);
}
export function incompleteThreadsResult(extraction) {
  const seconds=Number(extraction.retry_after_seconds)||0;
  return {
    estado:'sin_acceso',analizado:false,tipo_resultado:'error_recuperacion',
    estado_tecnico:seconds?'HTTP_429':'ENLACE_COMPARTIDO_NO_RESUELTO',
    veredicto:null,veredicto_final:null,credibilidad:null,confianza:null,
    mensaje:seconds?'Threads limitó temporalmente las solicitudes. La publicación todavía no fue analizada.':'Threads no proporcionó la dirección final del enlace compartido. No se ha identificado su contenido.',
    fuentes:[],compartir_habilitado:false,url_consultada:extraction.url_final||extraction.url_original,
    limitaciones:extraction.limitaciones||[],retry_after_seconds:seconds,
    reintentar_desde:seconds?new Date(Date.now()+seconds*1000).toISOString():null,
    acciones_disponibles:['REINTENTAR_MAS_TARDE'],reintentar:true
  };
}
