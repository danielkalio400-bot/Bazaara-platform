import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { allowedMutationOrigin, validCredentials, safeUser, publicError } from '../lib/session.mjs';
const app = resolve(fileURLToPath(new URL('..', import.meta.url)));
const patch = resolve(app,'../..');
function request(origin){return {headers:new Headers(origin===undefined?{}:{origin})};}

test('origin guard allows the exact Workspace origin only',()=>{
  assert.equal(allowedMutationOrigin(request('http://localhost:3021')),true);
  assert.equal(allowedMutationOrigin(request('http://localhost:3021.evil.test')),false);
  assert.equal(allowedMutationOrigin(request('http://localhost:3004')),false);
  assert.equal(allowedMutationOrigin(request('http://127.0.0.1:3021')),false);
  assert.equal(allowedMutationOrigin(request('https://localhost:3021')),false);
  assert.equal(allowedMutationOrigin(request()),false);
  assert.equal(allowedMutationOrigin(request('null')),false);
});
test('credential guard blocks invalid payloads, arrays, oversized input',()=>{
  assert.equal(validCredentials({email:'person@example.com',password:'correct horse'}),true);
  for(const candidate of [null,[],{},'x',{email:'x',password:'p'},{email:'x@y.z',password:''},{email:'x@y.z',password:'x'.repeat(257)},{email:'a'.repeat(322)+'@x.y',password:'x'}])assert.equal(validCredentials(candidate),false);
});
test('profile projection excludes server-only token and private profile fields',()=>{
  const projected=safeUser({user:{id:'user1',displayName:'Daniel',verificationLevel:'BASIC',locale:'en-NG',emails:[{email:'other@example.com'},{email:'main@example.com',isPrimary:true}],token:'VERY_PRIVATE',phone:'VERY_PRIVATE'}});
  assert.deepEqual(projected,{id:'user1',displayName:'Daniel',verificationLevel:'BASIC',locale:'en-NG',email:'main@example.com'});
  assert.equal(safeUser({user:{name:'unverified'}}),null);
});
test('identity upstream errors are generic and avoid leaking internals',()=>{
  assert.match(publicError(401),/credentials|session/i);
  assert.match(publicError(429),/attempts/i);
  assert.doesNotMatch(publicError(500),/database|stack|password/i);
});
test('all 31 products have unique IDs; Search, Workspace, Box and Docs advertised as available',()=>{
  const source=readFileSync(join(app,'lib/products.ts'),'utf8');
  const ids=[...source.matchAll(/\{ id:'([^']+)', name:'([^']+)'/g)];
  assert.equal(ids.length,31);
  assert.equal(new Set(ids.map(match=>match[1])).size,31);
  assert.equal((source.match(/status:'available'/g)||[]).length,4);
  assert.match(source,/id:'docs'.*status:'available'/);
  assert.match(source,/id:'box'.*status:'available'/);
  assert.match(source,/id:'search'.*status:'available'/);
  assert.match(source,/id:'workspace'.*status:'available'/);
});
test('auth routes enforce CSRF before forwarding and logout revokes server-side first',()=>{
  const login=readFileSync(join(app,'app/api/session/login/route.ts'),'utf8');
  const logout=readFileSync(join(app,'app/api/session/logout/route.ts'),'utf8');
  assert.ok(login.indexOf('allowedMutationOrigin')<login.indexOf('await fetch'));
  assert.ok(logout.indexOf('allowedMutationOrigin')<logout.indexOf('await fetch'));
  assert.ok(logout.indexOf("upstream.status !== 204")<logout.indexOf("response.cookies.set"));
  assert.match(logout,/WEB_ORIGINS/);
  assert.match(login,/getSetCookie\(\)/);
});
test('port checker passes with E2 3013-3019 and rejects actual Workspace collision',()=>{
  const root=mkdtempSync(join(tmpdir(),'bazaara-e3-port-'));
  try{
    mkdirSync(join(root,'ecosystems'),{recursive:true});mkdirSync(join(root,'apps','bazchat-web'),{recursive:true});
    writeFileSync(join(root,'ecosystems','port-map.json'),JSON.stringify({'3013':{workspace:'apps/bazchat-web'},'3019':{workspace:'apps/bazsend-web'}}));
    writeFileSync(join(root,'apps','bazchat-web','package.json'),'{"scripts":{"dev":"next dev -p 3013"}}');
    const script=join(patch,'scripts','check-e3-workspace-port.mjs');
    let run=spawnSync(process.execPath,[script,'--repo',root],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    writeFileSync(join(root,'ecosystems','port-map.json'),JSON.stringify({'3021':{workspace:'apps/not-workspace'}}));
    run=spawnSync(process.execPath,[script,'--repo',root],{encoding:'utf8'});
    assert.equal(run.status,2);
    assert.match(run.stderr,/PORT CONFLICT/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('lockfile script registers only Workspace and preserves existing Search/E2 records',()=>{
  const root=mkdtempSync(join(tmpdir(),'bazaara-e3-lock-'));
  try{
    mkdirSync(join(root,'apps','workspace-web'),{recursive:true});mkdirSync(join(root,'scripts'),{recursive:true});
    const original={name:'bazaara-platform',lockfileVersion:3,packages:{'':{name:'bazaara-platform',workspaces:['apps/*','services/*']},'apps/search-web':{name:'@bazaara/search-web'},'node_modules/@bazaara/search-web':{resolved:'apps/search-web',link:true},'apps/bazchat-web':{name:'@bazaara/bazchat-web'}}};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify(original));
    writeFileSync(join(root,'apps/workspace-web/package.json'),readFileSync(join(app,'package.json')));
    const script=join(patch,'scripts','register-e3-workspace-lockfile.mjs');
    const clone=join(root,'scripts','register-e3-workspace-lockfile.mjs');
    writeFileSync(clone,readFileSync(script));
    writeFileSync(join(root,'package.json'),'{"name":"bazaara-platform","type":"module"}');
    let run=spawnSync(process.execPath,[clone],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const after=JSON.parse(readFileSync(join(root,'package-lock.json')));
    for(const [key,value] of Object.entries(original.packages))assert.deepEqual(after.packages[key],value);
    assert.equal(after.packages['apps/workspace-web'].name,'@bazaara/workspace-web');
    assert.deepEqual(after.packages['node_modules/@bazaara/workspace-web'],{resolved:'apps/workspace-web',link:true});
    run=spawnSync(process.execPath,[clone],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/already registered/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
