import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const analyze = fs.readFileSync(new URL('./analyze.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const indexFinal = fs.readFileSync(new URL('./index-final.html', import.meta.url), 'utf8');

for (const [name, html] of [['index.html', index], ['index-final.html', indexFinal]]) {
  test(`${name} accepts, lists and sends up to ten images`, () => {
    assert.match(html, /type="file" multiple/);
    assert.match(html, /combined\.length > 10/);
    assert.match(html, /payload\.files = encodedFiles/);
    assert.match(html, /Promise\.all\(selectedFiles\.map\(optimizeImage\)\)/);
  });

  test(`${name} places original publications after explanation and sources`, () => {
    const explanation = html.lastIndexOf('Explicación del veredicto final');
    const sources = html.lastIndexOf('renderSources(sources)');
    const originals = html.lastIndexOf('renderOriginalPublications()');
    assert(explanation > -1 && sources > explanation && originals > sources);
  });

  test(`${name} moves original investigations below the analyzer and results`, () => {
    assert.match(html, /result\.insertAdjacentElement\("afterend", editorialHome\)/);
  });
}

test('backend validates and compares every attached image', () => {
  assert.match(analyze, /body\.files/);
  assert.match(analyze, /archivos\.length > 10/);
  assert.match(analyze, /for \(const \[indice, file\] of archivos\.entries\(\)\)/);
  assert.match(analyze, /Compárala con todas las demás imágenes adjuntas/);
});
