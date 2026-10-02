import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {makeServer} from '../src/server.mjs';
import {createAssertion,verifyAssertion} from '../src/auth.mjs';
import {safeTitle} from '../src/store.mjs';

const docsSecret='docs-secret-'+randomBytes(32).toString('hex');
const boxSecret='box-secret-'+randomBytes(32).toString('hex');
let boxServer,docsServer,boxOrigin,docsOrigin,root;const objects=new Map();let counter=0;
function start(server){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});});}
function close(server){return new Promise(resolve=>server.close(()=>resolve()));}
async function read(req){const chunks=[];for await(const c of req)chunks.push(c);return Buffer.concat(chunks);}
before(async()=>{
  root=await mkdtemp(path.join(tmpdir(),'bazaara-docs-test-'));
  boxServer=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/health/live'){res.writeHead(200);res.end('ok');return;}const match=url.pathname.match(/^\/v1\/box\/files\/([a-f0-9]{32})$/);if(req.method==='POST'&&url.pathname==='/v1/box/files'){const id=(++counter).toString(16).padStart(32,'0');objects.set(id,await read(req));res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({id,name:'doc.bdoc',size:objects.get(id).length}));return;}if(match&&req.method==='GET'){const body=objects.get(match[1]);if(!body){res.writeHead(404);res.end('{}');return;}res.writeHead(200,{'content-type':'application/octet-stream'});res.end(body);return;}if(match&&req.method==='DELETE'){objects.delete(match[1]);res.writeHead(200,{'content-type':'application/json'});res.end('{"deleted":true}');return;}res.writeHead(404);res.end('{}');});
  const ba=await start(boxServer);boxOrigin=`http://127.0.0.1:${ba.port}`;
  const instance=makeServer({secret:docsSecret,boxSecret,boxOrigin,root,port:0});docsServer=instance.server;const da=await instance.listen();docsOrigin=`http://127.0.0.1:${da.port}`;
});
after(async()=>{await close(docsServer);await close(boxServer);await rm(root,{recursive:true,force:true});});
async function request(sub,method,path,body){return fetch(docsOrigin+path,{method,headers:{'x-docs-identity':createAssertion(docsSecret,sub,method,path),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}

test('HMAC assertion is method/path bound and expires safely',()=>{const token=createAssertion(docsSecret,'user-a','GET','/v1/docs',undefined,100000);assert.equal(verifyAssertion(docsSecret,token,'GET','/v1/docs',100000),'user-a');assert.throws(()=>verifyAssertion(docsSecret,token,'POST','/v1/docs',100000));assert.throws(()=>verifyAssertion(docsSecret,token,'GET','/v1/docs',130000));});
test('titles are normalized and bounded',()=>{assert.equal(safeTitle('  Project   brief  '),'Project brief');assert.equal(safeTitle(''),'Untitled document');assert.throws(()=>safeTitle('x'.repeat(101)));});
test('readiness checks Box dependency',async()=>{const r=await fetch(docsOrigin+'/health/ready');assert.equal(r.status,200);assert.equal((await r.json()).box,'ready');});
let created;
test('create document stores body in Box and returns metadata',async()=>{const r=await request('user-a','POST','/v1/docs',{title:'Project brief',markdown:'# Hello\n\nWorld'});assert.equal(r.status,201);created=await r.json();assert.match(created.id,/^[a-f0-9]{32}$/);assert.equal(created.revision,1);assert.equal(created.words,2);assert.equal(objects.size,1);});
test('list and read return the current document without exposing Box ids',async()=>{let r=await request('user-a','GET','/v1/docs');let body=await r.json();assert.equal(body.documents.length,1);assert.equal(body.documents[0].boxFileId,undefined);r=await request('user-a','GET',`/v1/docs/${created.id}`);body=await r.json();assert.equal(body.markdown,'# Hello\n\nWorld');assert.equal(body.boxFileId,undefined);});
test('save uses optimistic revision control and copy-on-write storage',async()=>{let r=await request('user-a','PUT',`/v1/docs/${created.id}`,{title:'Renamed',markdown:'Updated content',expectedRevision:1});assert.equal(r.status,200);const body=await r.json();assert.equal(body.revision,2);assert.equal(objects.size,1);r=await request('user-a','PUT',`/v1/docs/${created.id}`,{title:'Stale',markdown:'No',expectedRevision:1});assert.equal(r.status,409);});
test('rename-only update preserves content, advances revision and persists through listing and reloading',async()=>{
  let r=await request('user-a','GET',`/v1/docs/${created.id}`);
  let original=await r.json();
  assert.equal(original.title,'Renamed');
  assert.equal(original.markdown,'Updated content');
  const oldObjectCount=objects.size;
  r=await request('user-a','PUT',`/v1/docs/${created.id}`,{title:'BAZAARA Test Document',markdown:original.markdown,expectedRevision:original.revision});
  assert.equal(r.status,200);
  const renamed=await r.json();
  assert.equal(renamed.title,'BAZAARA Test Document');
  assert.equal(renamed.revision,original.revision+1);
  assert.equal(objects.size,oldObjectCount);
  r=await request('user-a','GET','/v1/docs');
  const listing=await r.json();
  assert.equal(listing.documents[0].title,'BAZAARA Test Document');
  r=await request('user-a','GET',`/v1/docs/${created.id}`);
  const reloaded=await r.json();
  assert.equal(reloaded.title,'BAZAARA Test Document');
  assert.equal(reloaded.markdown,'Updated content');
  r=await request('user-a','PUT',`/v1/docs/${created.id}`,{title:'Stale rename',markdown:original.markdown,expectedRevision:original.revision});
  assert.equal(r.status,409);
});
test('documents are isolated by BazID subject',async()=>{const r=await request('user-b','GET','/v1/docs');assert.equal(r.status,200);assert.equal((await r.json()).documents.length,0);const denied=await request('user-b','GET',`/v1/docs/${created.id}`);assert.equal(denied.status,404);});
test('delete removes metadata and current Box object',async()=>{const r=await request('user-a','DELETE',`/v1/docs/${created.id}`);assert.equal(r.status,200);assert.equal(objects.size,0);const list=await request('user-a','GET','/v1/docs');assert.equal((await list.json()).documents.length,0);});
