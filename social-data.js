// Recuperación complementaria de contenido público en redes mediante Captapi.
// La clave se lee exclusivamente desde Vercel y nunca se envía al navegador.

const API_BASE = "https://api.captapi.com/v1";
const REQUEST_TIMEOUT_MS = 22000;
const DEFAULT_PROFILE_LIMIT = 20;
const DEFAULT_COMMENT_LIMIT = 20;
const MAX_SERIALIZED_CHARS = 32000;

function platformFromUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "threads.com" || host === "threads.net") return "threads";
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    return "";
  } catch {
    return "";
  }
}

function isProfileUrl(rawUrl, platform) {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (!parts.length) return false;
    if (platform === "threads") return parts.length === 1 && parts[0].startsWith("@");
    if (platform === "tiktok") return parts.length === 1 && parts[0].startsWith("@");
    return false;
  } catch {
    return false;
  }
}

function boundedInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(maximum, number));
}

function endpointRequests(platform, profile, rawUrl) {
  const profileLimit = boundedInteger(
    process.env.SOCIAL_PROFILE_POST_LIMIT,
    DEFAULT_PROFILE_LIMIT,
    50
  );
  const commentLimit = boundedInteger(
    process.env.SOCIAL_COMMENT_LIMIT,
    DEFAULT_COMMENT_LIMIT,
    50
  );

  if (profile) {
    const map = {
      threads: [
        ["threads/profile", {}],
        ["threads/user-posts", { limit: profileLimit }]
      ],
      tiktok: [
        ["tiktok/channel-details", {}],
        ["tiktok/channel-posts", { limit: profileLimit }]
      ]
    };
    return map[platform] || [];
  }

  const map = {
    threads: [["threads/post-details", {}]],
    tiktok: [
      ["tiktok/video-details", {}],
      ["tiktok/comments", { limit: commentLimit }],
      ["tiktok/transcript", {}]
    ]
  };
  return map[platform] || [];
}

async function callCaptapi(apiKey, path, rawUrl, extraParams = {}) {
  const query = new URLSearchParams({
    url: rawUrl,
    cache: "true"
  });
  for (const [key, value] of Object.entries(extraParams)) {
    query.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}/${path}?${query}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let body = null;
    if (/application\/json/i.test(contentType) && raw) {
      try { body = JSON.parse(raw); } catch { body = null; }
    }
    if (!response.ok) {
      const providerMessage = body?.error?.message || body?.message || `HTTP ${response.status}`;
      throw new Error(providerMessage);
    }
    if (!body || typeof body !== "object") {
      throw new Error("El proveedor no devolvió JSON utilizable.");
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function safeSerialize(value) {
  const seen = new WeakSet();
  const json = JSON.stringify(value, (key, item) => {
    if (typeof item === "string") return item.slice(0, 6000);
    if (item && typeof item === "object") {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }
    return item;
  });
  return String(json || "").slice(0, MAX_SERIALIZED_CHARS);
}

function collectTikTokVideoUrls(value, output = new Set()) {
  if (output.size >= 5 || value == null) return output;
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+\/video\/\d+/gi) || [];
    matches.forEach(url => {
      if (output.size < 5) output.add(url.replace(/[),.;]+$/, ""));
    });
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTikTokVideoUrls(item, output);
    return output;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectTikTokVideoUrls(item, output);
  }
  return output;
}

export async function extractSocialPublicData(rawUrl) {
  const apiKey = process.env.CAPTAPI_API_KEY;
  const platform = platformFromUrl(rawUrl);
  if (!apiKey || !["threads", "tiktok"].includes(platform)) return null;

  const profile = isProfileUrl(rawUrl, platform);

  const requests = endpointRequests(platform, profile, rawUrl);
  if (!requests.length) return null;

  const settled = await Promise.allSettled(
    requests.map(([path, params]) => callCaptapi(apiKey, path, rawUrl, params))
  );

  const recovered = [];
  const limitations = [];
  settled.forEach((outcome, index) => {
    const path = requests[index][0];
    if (outcome.status === "fulfilled") {
      recovered.push({ endpoint: path, respuesta: outcome.value });
    } else {
      limitations.push(`${path}: ${outcome.reason?.message || "consulta no disponible"}`);
    }
  });

  // Un perfil no basta: abre hasta cinco videos públicos recuperados y solicita
  // detalles y transcripción para que el verificador pueda evaluar lo que dicen.
  if (profile && platform === "tiktok" && recovered.length) {
    const videoUrls = [...collectTikTokVideoUrls(recovered)];
    const detailRequests = videoUrls.flatMap(videoUrl => [
      { path: "tiktok/video-details", url: videoUrl },
      { path: "tiktok/transcript", url: videoUrl }
    ]);
    const details = await Promise.allSettled(
      detailRequests.map(item => callCaptapi(apiKey, item.path, item.url))
    );
    details.forEach((outcome, index) => {
      const request = detailRequests[index];
      if (outcome.status === "fulfilled") {
        recovered.push({ endpoint: request.path, url_analizada: request.url, respuesta: outcome.value });
      } else {
        limitations.push(`${request.path} (${request.url}): ${outcome.reason?.message || "consulta no disponible"}`);
      }
    });
    requests.push(...detailRequests.map(item => [item.path, { url: item.url }]));
  }

  if (!recovered.length) {
    return {
      proveedor: "Captapi",
      plataforma: platform,
      tipo_enlace: profile ? "perfil" : "publicacion_o_pagina",
      consultas_exitosas: 0,
      consultas_intentadas: requests.length,
      contenido_json: "",
      limitaciones: limitations
    };
  }

  return {
    proveedor: "Captapi",
    plataforma: platform,
    tipo_enlace: profile ? "perfil" : "publicacion_o_pagina",
    consultas_exitosas: recovered.length,
    consultas_intentadas: requests.length,
    contenido_json: safeSerialize(recovered),
    limitaciones: limitations
  };
}
