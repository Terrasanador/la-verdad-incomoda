import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectMediaProvenance } from './media-provenance.js';

const scan = (value, mime = 'image/jpeg') => inspectMediaProvenance(Buffer.from(value), mime);

test('declared AI generation and editing are distinguished', () => {
  assert.equal(scan('digitalSourceType=trainedAlgorithmicMedia').status, 'ai_generated_declared');
  assert.equal(scan('digitalSourceType=compositeWithTrainedAlgorithmicMedia').status, 'ai_edited_declared');
});

test('a generic credential reference is not classified as AI generation', () => {
  assert.equal(scan('c2pa manifest').status, 'credentials_unverified');
  assert.equal(scan('ordinary photo').status, 'unknown');
  assert.equal(scan('ordinary video', 'video/mp4').status, 'unknown');
  assert.equal(scan('trainedAlgorithmicMedia', 'text/plain'), null);
});
