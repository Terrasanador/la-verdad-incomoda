import fs from "node:fs";

const content = JSON.parse(fs.readFileSync(new URL("./content.json", import.meta.url), "utf8"));

const SITE = "https://www.laverdadincomoda.mx";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function articleHtml(article) {
  const canonical = `${SITE}/articulos/${encodeURIComponent(article.slug)}`;
  const published = new Date(article.publishedAt || article.updatedAt).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    author: { "@type": "Organization", name: article.author },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "La Verdad Incómoda", url: `${SITE}/` }
  };
  const paragraphs = String(article.content || "").split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  const sources = (article.sources || []).map((url) => `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></li>`).join("");

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(article.title)} | La Verdad Incómoda</title>
<meta name="description" content="${esc(article.summary || article.title)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${esc(article.summary || article.title)}"><meta property="og:url" content="${canonical}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<style>:root{--bg:#070708;--panel:#151519;--border:#373740;--text:#fff;--muted:#b8b8c1;--red:#ff3b30}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#291010,#070708 42%);color:var(--text);font-family:Arial,sans-serif}header{padding:18px;border-bottom:1px solid var(--border);background:#09090b}.brand{font-weight:900}.brand span{color:var(--red)}main{width:min(820px,calc(100% - 24px));margin:35px auto}.tag{color:#ff8e88;font-weight:bold}h1{font-size:clamp(35px,8vw,65px);line-height:1.02}.summary{font-size:20px;color:#ddd;line-height:1.5}.meta{color:var(--muted);border-bottom:1px solid var(--border);padding-bottom:18px}.content{line-height:1.75;font-size:18px}.sources{background:var(--panel);border:1px solid var(--border);border-radius:15px;padding:16px;margin-top:30px}.sources a{color:#8bbcff;word-break:break-word}</style>
</head><body><header><div class="brand"><a href="/" style="color:inherit;text-decoration:none">LA VERDAD <span>INCÓMODA</span></a> · <a href="/articles.html" style="color:#ddd">Todos los artículos</a> · <a href="/politica-editorial.html" style="color:#ddd">Política editorial</a></div></header>
<main><div class="tag">${esc(article.category)}</div><h1>${esc(article.title)}</h1><p class="summary">${esc(article.summary || "")}</p><p class="meta">${esc(article.author)} · ${published}</p><div class="content">${paragraphs}</div>${sources ? `<section class="sources"><h2>Fuentes consultadas</h2><ul>${sources}</ul></section>` : ""}<section class="sources"><h2>Transparencia</h2><p>Consulta nuestra <a href="/metodologia.html">metodología</a>, <a href="/politica-editorial.html">política editorial</a> y <a href="/correcciones.html">procedimiento de correcciones</a>.</p></section></main></body></html>`;
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
