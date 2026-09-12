import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const readJson = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), "utf8"));
const base = readJson("./content.json").articles || [];
const editorial = readJson("./editorial-library.json").articles || [];
const expansions = readJson("./editorial-expansions.json");
const deepening = readJson("./editorial-deepening.json");
const published = [...base, ...editorial].filter(article => article.status === "published");

const words = value => (String(value || "").match(/[\p{L}\p{N}]+/gu) || []).length;

test("every published article has substantive, sourced editorial content", () => {
  assert.equal(published.length, 26);
  for (const article of published) {
    const full = [article.content, expansions[article.slug], deepening[article.slug]].filter(Boolean).join("\n\n");
    assert.ok(words(full) >= 500, `${article.slug} has fewer than 500 words`);
    assert.ok((article.sources || []).length >= 2, `${article.slug} has fewer than two sources`);
    assert.ok(article.author, `${article.slug} has no author`);
    assert.ok(article.summary, `${article.slug} has no summary`);
  }
});

test("thin legacy guides were deepened with unique practical material", () => {
  const guides = published.filter(article => !article.verdict);
  assert.equal(guides.length, 18);
  for (const article of guides) {
    assert.ok(deepening[article.slug], `${article.slug} has no deepening section`);
    assert.ok(words(deepening[article.slug]) >= 150, `${article.slug} deepening is too short`);
  }
  assert.equal(new Set(guides.map(article => deepening[article.slug])).size, guides.length);
});

test("monetizable pages include canonical, crawler and AdSense signals", () => {
  const articleRenderer = fs.readFileSync(new URL("./article-render.js", import.meta.url), "utf8");
  const listing = fs.readFileSync(new URL("./articles.html", import.meta.url), "utf8");
  const standards = fs.readFileSync(new URL("./estandares-editoriales.html", import.meta.url), "utf8");
  for (const [name, html] of [["renderer", articleRenderer], ["listing", listing], ["standards", standards]]) {
    assert.match(html, /ca-pub-3013146050600948/, `${name} has no AdSense publisher id`);
    assert.match(html, /canonical/, `${name} has no canonical declaration`);
  }
  assert.match(listing, /index,follow/);
  assert.match(standards, /index,follow/);
});

test("legacy duplicate pages do not compete in search", () => {
  const vercel = JSON.parse(fs.readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
  const oldHow = fs.readFileSync(new URL("./como-funciona.html", import.meta.url), "utf8");
  assert(vercel.routes.some((route) => route.src === "/index-final\\.html" && route.status === 308 && route.headers?.Location === "/"));
  assert.match(oldHow, /noindex,follow/);
  assert.match(oldHow, /\/metodologia\.html/);
});
