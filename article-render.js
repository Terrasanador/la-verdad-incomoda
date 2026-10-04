import fs from "node:fs";

const baseContent = JSON.parse(fs.readFileSync(new URL("./content.json", import.meta.url), "utf8"));
const editorialContent = JSON.parse(fs.readFileSync(new URL("./editorial-library.json", import.meta.url), "utf8"));
const expansions = JSON.parse(fs.readFileSync(new URL("./editorial-expansions.json", import.meta.url), "utf8"));
const deepening = JSON.parse(fs.readFileSync(new URL("./editorial-deepening.json", import.meta.url), "utf8"));
const DEEPENING_UPDATED_AT = "2026-09-10T01:45:00.000Z";
const content = {
  articles: [...(baseContent.articles || []), ...(editorialContent.articles || [])].map((article) => ({
    ...article,
    updatedAt: deepening[article.slug] ? DEEPENING_UPDATED_AT : article.updatedAt,
    content: [article.content, expansions[article.slug], deepening[article.slug]].filter(Boolean).join("\n\n")
  }))
};

const SITE = "https://www.laverdadincomoda.mx";
const EDITOR = "Manuel Méndez Feregrino";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function sourceName(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    const known = {
      "ine.mx": "Instituto Nacional Electoral",
      "portal.ine.mx": "Instituto Nacional Electoral",
      "gob.mx": "Gobierno de México",
      "dof.gob.mx": "Diario Oficial de la Federación",
      "imss.gob.mx": "Instituto Mexicano del Seguro Social",
      "inegi.org.mx": "INEGI",
      "repositoriodocumental.ine.mx": "Repositorio documental del INE",
      "ppef.hacienda.gob.mx": "Secretaría de Hacienda",
      "votomx.mx": "VotoMx"
    };
    return known[host] || host;
  } catch {
    return "Fuente consultada";
  }
}

function sourceKind(value) {
  try {
    const host = new URL(value).hostname;
    if (/\.gob\.mx$|\.ine\.mx$|\.inegi\.org\.mx$|\.imss\.gob\.mx$|dof\.gob\.mx$/.test(host)) return "Documento o registro institucional";
    if (/\.edu$|\.edu\.|doi\.org$/.test(host)) return "Fuente académica";
    return "Fuente externa de contraste";
  } catch {
    return "Fuente externa";
  }
}

function claimRating(verdict) {
  const normalized = String(verdict || "").toUpperCase();
  const values = { "FALSO": 1, "FALSA": 1, "ENGAÑOSO": 2, "ENGAÑOSA": 2, "PARCIAL": 3, "CIERTO": 5, "CIERTA": 5 };
  return values[normalized] || null;
}

function articleHtml(article) {
  const canonical = `${SITE}/articulos/${encodeURIComponent(article.slug)}`;
  const isFactCheck = Boolean(article.verdict && article.claim);
  const published = new Date(article.publishedAt || article.updatedAt).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  });
  const modified = new Date(article.updatedAt || article.publishedAt).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  });
  const editor = article.reviewedBy || EDITOR;
  const readingMinutes = Math.max(1, Math.ceil(String(article.content || "").trim().split(/\s+/).length / 220));
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    author: { "@type": "Organization", name: article.author, url: `${SITE}/autores.html` },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    reviewedBy: { "@type": "Person", name: editor, url: `${SITE}/autores.html` },
    publisher: { "@type": "Organization", name: "La Verdad Incómoda", url: `${SITE}/`, ethicsPolicy: `${SITE}/politica-editorial.html`, correctionsPolicy: `${SITE}/correcciones.html` },
    inLanguage: "es-MX",
    isAccessibleForFree: true,
    citation: article.sources || []
  };
  const rating = claimRating(article.verdict);
  const claimSchema = isFactCheck && rating ? {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url: canonical,
    claimReviewed: article.claim,
    datePublished: article.publishedAt,
    author: { "@type": "Organization", name: "La Verdad Incómoda", url: `${SITE}/` },
    reviewRating: { "@type": "Rating", ratingValue: rating, bestRating: 5, worstRating: 1, alternateName: article.verdict },
    itemReviewed: { "@type": "CreativeWork", name: article.claim }
  } : null;
  const schema = claimSchema ? [articleSchema, claimSchema] : articleSchema;
  const paragraphs = String(article.content || "").split(/\n\n+/).map((block) => {
    if (block.startsWith("## ")) return `<h2>${esc(block.slice(3))}</h2>`;
    return `<p>${esc(block)}</p>`;
  }).join("");
  const sources = (article.sources || []).map((url, index) => `<li><strong>${index + 1}. ${esc(sourceName(url))}</strong><small>${esc(sourceKind(url))}</small><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir documento o página consultada</a><code>${esc(url)}</code></li>`).join("");
  const related = (content.articles || []).filter((item) => item.slug !== article.slug && item.status === "published" && (item.category === article.category || item.sources?.some((source) => article.sources?.includes(source)))).slice(0, 3);
  const shareText = `${article.title}\n\n${article.summary || "Consulta la evidencia y las fuentes."}\n\n${canonical}`;
  const shareTextJson = JSON.stringify(shareText).replace(/</g, "\\u003c");
  const shareTitleJson = JSON.stringify(article.title).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(article.title)} | La Verdad Incómoda</title>
<meta name="description" content="${esc(article.summary || article.title)}">
<meta name="robots" content="${isFactCheck ? "index,follow,max-image-preview:large" : "noindex,follow"}">
<meta name="google-adsense-account" content="ca-pub-3013146050600948">
<link rel="canonical" href="${canonical}">
${isFactCheck ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3013146050600948" crossorigin="anonymous"></script>' : ""}
<meta property="og:type" content="article"><meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${esc(article.summary || article.title)}"><meta property="og:url" content="${canonical}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VJ6ECPYJVJ"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-VJ6ECPYJVJ");</script>
<style>:root{--bg:#070708;--panel:#151519;--border:#373740;--text:#fff;--muted:#b8b8c1;--red:#ff3b30}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#291010,#070708 42%);color:var(--text);font-family:Arial,sans-serif}header{padding:18px;border-bottom:1px solid var(--border);background:#09090b}.brand{font-weight:900}.brand span{color:var(--red)}main{width:min(820px,calc(100% - 24px));margin:35px auto}.tag{color:#ff8e88;font-weight:bold}h1{font-size:clamp(35px,8vw,65px);line-height:1.02}.summary{font-size:20px;color:#ddd;line-height:1.5}.meta{color:var(--muted);border-bottom:1px solid var(--border);padding-bottom:18px}.verification-file{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin:22px 0}.verification-file div{padding:13px;border:1px solid var(--border);border-radius:12px;background:#101014}.verification-file small{display:block;color:var(--muted);font-weight:700}.verification-file strong{display:block;margin-top:4px}.verdict-box{margin:22px 0;padding:20px;border:1px solid #803a37;border-radius:16px;background:rgba(255,59,48,.09)}.verdict-box small{display:block;color:#ffaaa6;font-weight:900;letter-spacing:1px}.verdict-box strong{display:block;color:var(--red);font-size:34px;margin:5px 0}.verdict-box p{margin:0;color:#eee;line-height:1.55}.content{line-height:1.75;font-size:18px}.content h2{margin:34px 0 10px;font-size:28px;line-height:1.2}.sources{background:var(--panel);border:1px solid var(--border);border-radius:15px;padding:16px;margin-top:30px}.sources a{color:#8bbcff;word-break:break-word}.sources ul{padding-left:0;list-style:none}.sources li{display:grid;gap:5px;padding:13px 0;border-bottom:1px solid var(--border)}.sources li:last-child{border-bottom:0}.sources small{color:var(--muted)}.sources code{color:#aaa;white-space:normal;word-break:break-all;font-size:11px}.share-box{margin:30px 0;padding:20px;border:1px solid #49505a;border-radius:16px;background:#101014}.share-box h2{margin:0 0 7px}.share-box p{color:#ddd;line-height:1.55}.share-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.share-actions button,.share-actions a{flex:1 1 190px;min-height:48px;border-radius:999px;border:1px solid #666;color:#fff;background:#25252b;font-weight:900;padding:11px 16px;text-decoration:none;display:flex;align-items:center;justify-content:center}.share-actions .whatsapp{background:#137a44;border-color:#55d995}.share-actions .verify{background:var(--red);border-color:#ff817b}@media(max-width:600px){.share-actions{display:grid}.share-actions button,.share-actions a{width:100%}}</style>
</head><body><header><div class="brand"><a href="/" style="color:inherit;text-decoration:none">LA VERDAD <span>INCÓMODA</span></a> · <a href="/articles.html" style="color:#ddd">Todos los artículos</a> · <a href="/metodologia.html" style="color:#ddd">Metodología</a> · <a href="/politica-editorial.html" style="color:#ddd">Política editorial</a></div></header>
<main><nav aria-label="Ruta de navegación" class="meta"><a href="/">Inicio</a> · <a href="/articles.html">Artículos</a> · ${esc(article.category)}</nav><div class="tag">${esc(article.category)}</div><h1>${esc(article.title)}</h1><p class="summary">${esc(article.summary || "")}</p><p class="meta"><a href="/autores.html">${esc(article.author)}</a> · Revisión editorial: ${esc(editor)} · Publicado: ${published}${modified !== published ? ` · Actualizado: ${modified}` : ""}</p><section class="verification-file" aria-label="Ficha de la verificación"><div><small>Fuentes enlazadas</small><strong>${(article.sources || []).length}</strong></div><div><small>Lectura estimada</small><strong>${readingMinutes} minutos</strong></div><div><small>Correcciones</small><strong><a href="/correcciones.html">Canal abierto</a></strong></div></section>${article.verdict ? `<section class="verdict-box"><small>VEREDICTO</small><strong>${esc(article.verdict)}</strong>${article.claim ? `<p><b>Afirmación revisada:</b> ${esc(article.claim)}</p>` : ""}</section>` : ""}<div class="content">${paragraphs}</div>${sources ? `<section class="sources"><h2>Fuentes consultadas</h2><p>Enlaces directos utilizados para que cualquier lector pueda reproducir la revisión. Que una fuente figure aquí no significa que aceptemos automáticamente todas sus conclusiones.</p><ul>${sources}</ul></section>` : ""}${related.length ? `<section class="sources"><h2>Artículos relacionados</h2><ul>${related.map((item) => `<li><a href="/articulos/${encodeURIComponent(item.slug)}">${esc(item.title)}</a></li>`).join("")}</ul></section>` : ""}<section class="sources"><h2>Transparencia y responsabilidad</h2><p>Este artículo fue elaborado mediante consulta de fuentes públicas y revisión editorial humana. La inteligencia artificial puede ayudar a localizar y organizar materiales, pero no se considera una fuente ni decide el veredicto. La conclusión se basa en los documentos enlazados y puede corregirse si aparece evidencia mejor. Consulta nuestra <a href="/metodologia.html">metodología</a>, <a href="/politica-editorial.html">política editorial</a>, <a href="/autores.html">responsabilidad de autoría</a>, <a href="/transparencia.html">financiamiento y transparencia</a> y <a href="/correcciones.html">procedimiento de correcciones</a>.</p></section><section class="share-box"><h2>Ayuda a detener la desinformación</h2><p>Comparte esta verificación con quien te envió la afirmación o comprueba otra publicación sospechosa.</p><div class="share-actions"><button class="whatsapp" type="button" onclick="shareArticleWhatsApp()">Compartir por WhatsApp</button><button type="button" onclick="shareArticle()">Compartir verificación</button><a class="verify" href="/#analizador" onclick="trackArticleEvent('usar_analizador_desde_articulo')">Verificar otra publicación</a></div></section></main><footer style="width:min(820px,calc(100% - 24px));margin:40px auto 20px;padding:20px 0;border-top:1px solid #373740;color:#b8b8c1">© 2026 La Verdad Incómoda · <a href="/privacidad.html">Privacidad</a> · <a href="/terminos.html">Términos</a> · <a href="/contacto.html">Contacto</a> · <a href="/quienes-somos.html">Quiénes somos</a> · <a href="/transparencia.html">Transparencia</a></footer><script>const articleShareText=${shareTextJson};const articleShareTitle=${shareTitleJson};function trackArticleEvent(name){try{gtag("event",name,{article_slug:${JSON.stringify(article.slug)}})}catch{}}function shareArticleWhatsApp(){trackArticleEvent("articulo_compartido_whatsapp");window.open("https://wa.me/?text="+encodeURIComponent(articleShareText),"_blank","noopener,noreferrer")}async function shareArticle(){try{if(navigator.share){await navigator.share({title:articleShareTitle,text:articleShareText,url:location.href});trackArticleEvent("articulo_compartido_nativo")}else{await navigator.clipboard.writeText(articleShareText);trackArticleEvent("articulo_enlace_copiado");alert("Verificación copiada para compartir.")}}catch(error){if(error.name!=="AbortError")alert("No fue posible compartir automáticamente.")}}</script><script defer src="/_vercel/insights/script.js"></script></body></html>`;
}

export default function handler(req, res) {
  const querySlug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
  const pathSlug = String(req.url || "").match(/^\/articulos\/([^/?#]+)/)?.[1];
  const requestedSlug = querySlug || pathSlug;
  const slug = String(requestedSlug || "").replace(/^\/+|\/+$/g, "");
  const article = (content.articles || []).find((item) => item.status === "published" && item.slug === slug);

  if (!article) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Artículo no encontrado</title></head><body><h1>Artículo no encontrado</h1><p><a href="/articles.html">Ver todos los artículos</a></p></body></html>');
  }

  const canonicalPath = `/articulos/${encodeURIComponent(article.slug)}`;
  if (req.url.startsWith("/article.html")) {
    res.statusCode = 308;
    res.setHeader("Location", canonicalPath);
    return res.end();
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
  return res.end(articleHtml(article));
}
