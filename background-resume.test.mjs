import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = name => fs.readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

for (const name of ["index.html", "index-final.html"]) {
  test(`${name} preserves and resumes an interrupted investigation`, () => {
    const html = read(name);
    assert.match(html, /lvi_analysis_state_v1/);
    assert.match(html, /status:\s*"running"/);
    assert.match(html, /status:\s*"retry_pending"/);
    assert.match(html, /visibilitychange/);
    assert.match(html, /pageshow/);
    assert.match(html, /online/);
    assert.match(html, /resumePendingAnalysis/);
    assert.match(html, /se reanudará automáticamente al volver/);
  });
}
