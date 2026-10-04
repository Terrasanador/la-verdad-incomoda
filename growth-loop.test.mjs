import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = name => fs.readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

test("homepage turns visitors into verifications and WhatsApp referrals", () => {
  for (const name of ["index.html", "index-final.html"]) {
    const html = read(name);
    assert.match(html, /id="heroVerifyButton"/);
    assert.match(html, /id="heroWhatsAppButton"/);
    assert.match(html, /¿Te llegó por WhatsApp\?/);
    assert.match(html, /shareReportOnWhatsApp/);
    assert.match(html, /https:\/\/wa\.me\/\?text=/);
    assert.match(html, /cta_verificar/);
    assert.match(html, /informe_compartido/);
    assert.match(html, /verificacion_iniciada/);
    assert.match(html, /verificacion_completada/);
  }
});

test("fact-check articles create a measurable sharing loop", () => {
  const renderer = read("article-render.js");
  assert.match(renderer, /Ayuda a detener la desinformación/);
  assert.match(renderer, /shareArticleWhatsApp/);
  assert.match(renderer, /articulo_compartido_whatsapp/);
  assert.match(renderer, /Verificar otra publicación/);
  assert.match(renderer, /G-VJ6ECPYJVJ/);
  assert.match(renderer, /_vercel\/insights\/script\.js/);
});

