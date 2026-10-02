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

const sheetsSecret='sheets-secret-'+randomBytes(32).toString('hex');
const boxSecret='box-secret-'+randomBytes(32).toString('hex');
let boxServer,sheetsServer,boxOrigin,sheetsOrigin,root;const objects=new Map();let counter=0;
function start(server){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});});}
function close(server){return new Promise(resolve=>server.close(()=>resolve()));}
async function read(req){const chunks=[];for await(const c of req)chunks.push(c);return Buffer.concat(chunks);}
before(async()=>{
  root=await mkdtemp(path.join(tmpdir(),'bazaara-sheets-test-'));
  boxServer=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/health/live'){res.writeHead(200);res.end('ok');return;}const match=url.pathname.match(/^\/v1\/box\/files\/([a-f0-9]{32})$/);if(req.method==='POST'&&url.pathname==='/v1/box/files'){const id=(++counter).toString(16).padStart(32,'0');objects.set(id,await read(req));res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({id,name:'book.bsheet',size:objects.get(id).length}));return;}if(match&&req.method==='GET'){const body=objects.get(match[1]);if(!body){res.writeHead(404);res.end('{}');return;}res.writeHead(200,{'content-type':'application/octet-stream'});res.end(body);return;}if(match&&req.method==='DELETE'){objects.delete(match[1]);res.writeHead(200,{'content-type':'application/json'});res.end('{"deleted":true}');return;}res.writeHead(404);res.end('{}');});
  const ba=await start(boxServer);boxOrigin=`http://127.0.0.1:${ba.port}`;
  const instance=makeServer({secret:sheetsSecret,boxSecret,boxOrigin,root,port:0});sheetsServer=instance.server;const sa=await instance.listen();sheetsOrigin=`http://127.0.0.1:${sa.port}`;
});
after(async()=>{await close(sheetsServer);await close(boxServer);await rm(root,{recursive:true,force:true});});
async function request(sub,method,path,body){return fetch(sheetsOrigin+path,{method,headers:{'x-sheets-identity':createAssertion(sheetsSecret,sub,method,path),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
const workbook={sheets:[{id:'sheet-1',name:'Sheet 1',cells:{A1:'Revenue',B1:'100',B2:'200',B3:'=SUM(B1:B2)'}}],activeSheetId:'sheet-1'};

test('HMAC assertion is method/path bound and expires safely',()=>{const token=createAssertion(sheetsSecret,'user-a','GET','/v1/sheets',undefined,100000);assert.equal(verifyAssertion(sheetsSecret,token,'GET','/v1/sheets',100000),'user-a');assert.throws(()=>verifyAssertion(sheetsSecret,token,'POST','/v1/sheets',100000));assert.throws(()=>verifyAssertion(sheetsSecret,token,'GET','/v1/sheets',130000));});
test('titles are normalized and bounded',()=>{assert.equal(safeTitle('  Q4   forecast  '),'Q4 forecast');assert.equal(safeTitle(''),'Untitled spreadsheet');assert.throws(()=>safeTitle('x'.repeat(101)));});
test('readiness checks Box dependency',async()=>{const r=await fetch(sheetsOrigin+'/health/ready');assert.equal(r.status,200);assert.equal((await r.json()).box,'ready');});
let created;
test('create workbook stores body in Box and returns summary counts',async()=>{const r=await request('user-a','POST','/v1/sheets',{title:'Q4 forecast',workbook});assert.equal(r.status,201);created=await r.json();assert.match(created.id,/^[a-f0-9]{32}$/);assert.equal(created.revision,1);assert.equal(created.sheetCount,1);assert.equal(created.cellCount,4);assert.equal(created.formulaCount,1);assert.equal(objects.size,1);});
test('list and read hide Box object ids',async()=>{let r=await request('user-a','GET','/v1/sheets');let body=await r.json();assert.equal(body.workbooks.length,1);assert.equal(body.workbooks[0].boxFileId,undefined);r=await request('user-a','GET',`/v1/sheets/${created.id}`);body=await r.json();assert.equal(body.workbook.sheets[0].cells.B3,'=SUM(B1:B2)');assert.equal(body.boxFileId,undefined);});
test('save uses optimistic revision control and copy-on-write Box storage',async()=>{const changed=structuredClone(workbook);changed.sheets[0].cells.B4='400';let r=await request('user-a','PUT',`/v1/sheets/${created.id}`,{title:'Updated',workbook:changed,expectedRevision:1});assert.equal(r.status,200);const body=await r.json();assert.equal(body.revision,2);assert.equal(body.cellCount,5);assert.equal(objects.size,1);r=await request('user-a','PUT',`/v1/sheets/${created.id}`,{title:'Stale',workbook,expectedRevision:1});assert.equal(r.status,409);});
test('workbooks are isolated by BazID subject',async()=>{const r=await request('user-b','GET','/v1/sheets');assert.equal(r.status,200);assert.equal((await r.json()).workbooks.length,0);const denied=await request('user-b','GET',`/v1/sheets/${created.id}`);assert.equal(denied.status,404);});
test('invalid cell references and duplicate sheet names are rejected',async()=>{let bad={sheets:[{id:'a',name:'Sheet',cells:{A0:'x'}}],activeSheetId:'a'};let r=await request('user-a','POST','/v1/sheets',{title:'bad',workbook:bad});assert.equal(r.status,400);bad={sheets:[{id:'a',name:'Same',cells:{}},{id:'b',name:'same',cells:{}}],activeSheetId:'a'};r=await request('user-a','POST','/v1/sheets',{title:'bad',workbook:bad});assert.equal(r.status,400);});
test('delete removes metadata and current Box object',async()=>{const r=await request('user-a','DELETE',`/v1/sheets/${created.id}`);assert.equal(r.status,200);assert.equal(objects.size,0);const list=await request('user-a','GET','/v1/sheets');assert.equal((await list.json()).workbooks.length,0);});
