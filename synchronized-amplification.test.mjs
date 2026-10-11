import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const analyze = fs.readFileSync(new URL('./analyze.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const standards = fs.readFileSync(new URL('./estandares-editoriales.html', import.meta.url), 'utf8');

test('detects synchronized narrative amplification separately from falsity and bots', () => {
  assert.match(analyze, /AMPLIFICACIÓN SINCRONIZADA DE NARRATIVA/);
  assert.match(analyze, /Puede existir aunque el dato base sea verdadero, parcial, engañoso o todavía no verificable/);
  assert.match(analyze, /misma imagen o recorte, misma cifra destacada, proximidad temporal/);
  assert.match(analyze, /Las señales de \(b\) no prueban por sí solas \(c\)/);
});

test('renders the diffusion-pattern classification to readers', () => {
  assert.match(index, /Clasificación del patrón de difusión/);
  assert.match(index, /integrity\.etiqueta_especial !== "NINGUNA"/);
});

test('publishes the neutral editorial standard', () => {
  assert.match(standards, /Amplificación sincronizada de narrativas/);
  assert.match(standards, /derecha, izquierda, oficialistas, opositores y comerciales/);
});
