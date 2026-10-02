import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("E2 public naming is the six-product set",()=>{const m=JSON.parse(read("ecosystems/ecosystem-2/manifest.json"));assert.deepEqual(m.products,["BChat","ZimZam","BTune","Bicord","BazCut","BSend"]);assert.equal(m.ports.Bicord,3017);assert.equal(m.retired.BazForum,3016);});

test("active layouts are standalone and do not embed the cross-app hub",()=>{for(const app of ["bazchat-web","bazclips-web","baztune-web","bazcircle-web","bazcut-web","bazsend-web"]){const s=read(`apps/${app}/app/layout.tsx`);assert.doesNotMatch(s,/BazaaraHub/);}});

test("shared product shell exposes only six active products",()=>{const s=read("packages/social-ui/src/index.tsx");for(const n of ["BChat","ZimZam","BTune","Bicord","BazCut","BSend"])assert.match(s,new RegExp(n));assert.doesNotMatch(s,/title: "BazForum"/);});

test("Bicord merges community discussion and social feed APIs",()=>{const s=read("apps/bazcircle-web/app/page.tsx");assert.match(s,/\/v1\/bazforum\/topics/);assert.match(s,/\/v1\/bazforum\/threads/);assert.match(s,/\/v1\/bazcircle\/feed/);assert.match(s,/\/v1\/bazcircle\/posts/);});

test("unified launcher retires port 3016 and starts the six named products",()=>{const s=read("scripts/start-bazaara-local.ps1");assert.doesNotMatch(s,/Name = 'BazForum'.*3016/);for(const n of ["BChat","ZimZam","BTune","Bicord","BazCut","BSend"])assert.match(s,new RegExp(`Name = '${n}'`));});

test("browser mutation methods are CORS-enabled",()=>{const s=read("services/platform-api/src/app.ts");for(const method of ["PUT","PATCH","DELETE","OPTIONS"])assert.match(s,new RegExp(`\\"${method}\\"`));});
