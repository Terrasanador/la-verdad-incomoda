import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = name => fs.readFileSync(new URL("./"+name, import.meta.url), "utf8");
test("biblioteca visible sin JavaScript",()=>{assert.ok((read("articles.html").match(/class="card" href="\/articulos\//g)||[]).length>=19)});
test("páginas de confianza",()=>{for(const n of ["privacidad.html","terminos.html","contacto.html","autores.html","correcciones.html"])assert.ok(fs.existsSync(new URL("./"+n,import.meta.url)))});
test("verificación sustancial",()=>{const a=JSON.parse(read("content.json")).articles.find(x=>x.slug==="falso-rancho-san-cristobal-reynosa-vicente-fox");assert.equal(a.verdict,"FALSA");assert.ok(a.content.split(/\s+/).length>=900);assert.ok(a.sources.length>=5);assert.ok(read("sitemap.xml").includes(a.slug))});
