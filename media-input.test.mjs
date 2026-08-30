import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFile,validateFile} from './media-input.js';
const file=(name,text,type='')=>({name,type,data:Buffer.from(text).toString('base64')});
test('TXT content really reaches model',async()=>{
  const r=await prepareFile(file('claim.txt','Dos más dos son cuatro.'));
  assert(r.content.some(x=>x.text?.includes('Dos más dos')));
});
test('PDF is passed as input_file',async()=>{
  const r=await prepareFile(file('scan.pdf','%PDF-1.4\n'));
  assert.equal(r.content[1].type,'input_file');
});
test('Office content is forwarded, with visual coverage limit',async()=>{
  for(const ext of ['doc','docx','xls','xlsx','ppt','pptx']){
    const r=await prepareFile(file('document.'+ext,'test'));
    assert(r.content.some(x=>x.type==='input_file'));
    assert(r.coverage.limitaciones.length);
  }
});
test('Image uses vision input',async()=>{
  const r=await prepareFile(file('test.png','image'));
  assert(r.content.some(x=>x.type==='input_image'));
});
test('Audio calls transcription and includes actual text',async()=>{
  const r=await prepareFile(file('sample.mp3','audio'),{fetchImpl:async(url,options)=>{
    assert(url.endsWith('/audio/transcriptions'));
    assert.equal(options.body.get('model'),'gpt-4o-mini-transcribe');
    assert.equal(options.body.get('file').name,'sample.mp3');
    return Response.json({text:'La afirmación pronunciada.'});
  }});
  assert(r.content.some(x=>x.text?.includes('La afirmación pronunciada.')));
});
test('Video audio alone does not claim visual inspection',async()=>{
  const r=await prepareFile(file('clip.mp4','video'),{fetchImpl:async()=>Response.json({text:'Hola'})});
  assert(r.coverage.limitaciones.some(x=>x.includes('no se inspeccionaron')));
});
test('Sampled frames have explicit partial coverage',async()=>{
  const f=file('clip.mp4','video');f.frames=[{seconds:1,data:Buffer.from([255,216,255,217]).toString('base64')}];
  const r=await prepareFile(f,{fetchImpl:async()=>Response.json({text:'Hola'})});
  assert(r.content.some(x=>x.type==='input_image'));
  assert(r.coverage.limitaciones.some(x=>x.includes('1 fotogramas')));
});
test('Provider errors are not factual verdicts',async()=>{
  await assert.rejects(prepareFile(file('a.mp3','audio'),{fetchImpl:async()=>new Response('',{status:429})}),/HTTP 429/);
});
test('Reject empty, malformed, unsupported and oversized files',()=>{
  for(const f of [{data:''},{name:'x.txt',data:'?'},file('x.exe','payload'),file('x.pdf','not pdf'),file('x.txt','a'.repeat(3000001))]) assert.throws(()=>validateFile(f));
});
test('Maximum valid upload does not overflow validator',()=>{
  assert.equal(validateFile(file('large.txt','a'.repeat(3000000))).bytes.length,3000000);
});
