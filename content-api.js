const OWNER = process.env.GITHUB_OWNER || "Terrasanador";
const REPO = process.env.GITHUB_REPO || "la-verdad-incomoda";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE_PATH = "content.json";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function clean(value, max = 20000) {
  return String(value ?? "").trim().slice(0, max);
}

function slugify(value) {
  return clean(value, 180)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || `articulo-${Date.now()}`;
}

function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const received = req.headers["x-admin-password"] || "";
  return Boolean(expected) && received === expected;
}

function githubHeaders() {
  const token = process.env.GITHUB_CONTENT_TOKEN || "";
  if (!token) throw new Error("Falta GITHUB_CONTENT_TOKEN en Vercel.");
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "La-Verdad-Incomoda-CMS"
  };
}

async function readStore() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) return { sha: null, data: { articles: [] } };
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "No se pudo leer content.json.");
  const decoded = Buffer.from(result.content || "", "base64").toString("utf8");
  let data;
  try { data = JSON.parse(decoded); } catch { data = { articles: [] }; }
  if (!Array.isArray(data.articles)) data.articles = [];
  return { sha: result.sha, data };
}

async function writeStore(data, sha, message) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64"),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "No se pudo guardar content.json.");
  return result;
}

function normalizeArticle(input, existing = {}) {
  const now = new Date().toISOString();
  const title = clean(input.title, 180);
  if (!title) throw new Error("El título es obligatorio.");
  const requestedSlug = slugify(input.slug || title);
  const status = input.status === "published" ? "published" : "draft";
  const sources = Array.isArray(input.sources)
    ? input.sources.map(x => clean(x, 500)).filter(Boolean).slice(0, 30)
    : clean(input.sources, 15000).split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30);

  return {
    id: existing.id || `lvi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    slug: requestedSlug,
    category: clean(input.category || "Verificaciones", 80),
    author: clean(input.author || "Manuel Méndez Feregrino", 120),
    status,
    summary: clean(input.summary, 500),
    content: clean(input.content, 60000),
    sources,
    createdAt: existing.createdAt || now,
    updatedAt: now,
    publishedAt: status === "published" ? (existing.publishedAt || now) : null
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
      return res.end();
    }

    const { sha, data } = await readStore();

    if (req.method === "GET") {
      const articles = isAdmin(req)
        ? data.articles
        : data.articles.filter(article => article.status === "published");
      return send(res, 200, { articles });
    }

    if (!isAdmin(req)) return send(res, 401, { error: "Contraseña incorrecta." });

    if (req.method === "POST") {
      const article = normalizeArticle(req.body || {});
      if (data.articles.some(item => item.slug === article.slug)) {
        article.slug = `${article.slug}-${Date.now().toString().slice(-5)}`;
      }
      data.articles.unshift(article);
      await writeStore(data, sha, `Publicar contenido: ${article.title}`);
      return send(res, 201, { article });
    }

    if (req.method === "PUT") {
      const id = clean(req.body?.id, 120);
      const index = data.articles.findIndex(item => item.id === id);
      if (index < 0) return send(res, 404, { error: "Artículo no encontrado." });
      const article = normalizeArticle(req.body || {}, data.articles[index]);
      if (data.articles.some((item, i) => i !== index && item.slug === article.slug)) {
        return send(res, 409, { error: "Ya existe otro artículo con esa URL amigable." });
      }
      data.articles[index] = article;
      await writeStore(data, sha, `Actualizar contenido: ${article.title}`);
      return send(res, 200, { article });
    }

    if (req.method === "DELETE") {
      const id = clean(req.body?.id, 120);
      const index = data.articles.findIndex(item => item.id === id);
      if (index < 0) return send(res, 404, { error: "Artículo no encontrado." });
      const [removed] = data.articles.splice(index, 1);
      await writeStore(data, sha, `Eliminar contenido: ${removed.title}`);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Método no permitido." });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error?.message || "Error interno." });
  }
}
