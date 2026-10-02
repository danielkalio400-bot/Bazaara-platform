import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createStore,BoxError,safeId,safeName,FILE_MAX} from '../src/store.mjs';
import {createAssertion,verifyAssertion} from '../src/auth.mjs';
import {makeServer} from '../src/server.mjs';
const secret='A'.repeat(48);
const temp=()=>mkdtemp(path.join(os.tmpdir(),'bazaara-box-test-'));

test('filename and identifier validation reject traversal and controls',()=>{
 assert.equal(safeName('C:\\Documents\\report.pdf'),'report.pdf');
 assert.equal(safeName('../../notes.txt'),'notes.txt');
 for(const bad of ['..','/..','', '\u0000\u001e', 'a'.repeat(129)])assert.throws(()=>safeName(bad),BoxError);
 assert.throws(()=>safeId('../evil'),BoxError);
});
test('short-lived audience and path-bound identity assertions',()=>{
 const now=Date.now(),token=createAssertion(secret,'user1','GET','/v1/box',now);
 assert.equal(verifyAssertion(secret,token,'GET','/v1/box',now),'user1');
 assert.throws(()=>verifyAssertion(secret,token,'DELETE','/v1/box',now),BoxError);
 assert.throws(()=>verifyAssertion(secret,token,'GET','/v1/box',now+21000),BoxError);
 assert.throws(()=>verifyAssertion('B'.repeat(40),token,'GET','/v1/box',now),BoxError);
});
test('file upload, folder, retrieval, deletion and account separation',async()=>{
 const root=await temp();try{
 const store=createStore(root,{fileMax:32,quota:48});
 const a=await store.folder('alice','Reports');
 const file=await store.upload('alice',{name:'plan.txt',folderId:a.id,body:Buffer.from('Private Alice')});
 assert.equal((await store.list('alice')).usage,13);
 assert.equal((await store.list('bob')).files.length,0);
 await assert.rejects(store.download('bob',file.id),{status:404});
 assert.equal((await store.download('alice',file.id)).item.name,'plan.txt');
 await assert.rejects(store.deleteFolder('alice',a.id),{status:409});
 await store.deleteFile('alice',file.id);await store.deleteFolder('alice',a.id);
 assert.equal((await store.list('alice')).usage,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('quota, max size, invalid parent, duplicate folder fail closed',async()=>{
 const root=await temp();try{const store=createStore(root,{fileMax:16,quota:20});
 await store.folder('alice','Photos');
 await assert.rejects(store.folder('alice','photos'),{status:409});
 await assert.rejects(store.folder('alice','Nested','a'.repeat(32)),{status:404});
 await assert.rejects(store.upload('alice',{name:'big',body:Buffer.alloc(17)}),{status:413});
 await store.upload('alice',{name:'first',body:Buffer.alloc(15)});
 await assert.rejects(store.upload('alice',{name:'second',body:Buffer.alloc(6)}),{status:413});
 assert.equal((await store.list('alice')).files.length,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('same-user concurrent writes serialized (no lost metadata)',async()=>{
 const root=await temp();try{const store=createStore(root);await Promise.all(Array.from({length:20},(_,i)=>store.folder('alice',`Folder ${i}`)));assert.equal((await store.list('alice')).folders.length,20);}finally{await rm(root,{recursive:true,force:true});}
});
test('HTTP API rejects unsigned access; authenticated upload, download and deletion work',async()=>{
 const root=await temp();const {server,listen}=makeServer({secret,root,port:0});try{
 const {port}=await listen();const url=`http://127.0.0.1:${port}`;
 const anon=await fetch(url+'/v1/box');assert.equal(anon.status,401);
 const sign=(method,path)=>({'x-box-identity':createAssertion(secret,'alice',method,path)});
 const listed=await fetch(url+'/v1/box',{headers:sign('GET','/v1/box')});assert.equal(listed.status,200);
 const uploaded=await fetch(url+'/v1/box/files',{method:'POST',headers:{...sign('POST','/v1/box/files'),'x-box-filename':'hello.txt'},body:Buffer.from('hello world')});assert.equal(uploaded.status,201);const item=await uploaded.json();
 const filePath=`/v1/box/files/${item.id}`;
 const bob=await fetch(url+filePath,{headers:{'x-box-identity':createAssertion(secret,'bob','GET',filePath)}});assert.equal(bob.status,404);
 const downloaded=await fetch(url+filePath,{headers:sign('GET',filePath)});assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),'hello world');
 assert.equal(downloaded.headers.get('content-type'),'application/octet-stream');
 const removed=await fetch(url+filePath,{method:'DELETE',headers:sign('DELETE',filePath)});assert.equal(removed.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});

test('on-disk metadata persists after creating another store process',async()=>{
 const root=await temp();try{
 const a=createStore(root);const folder=await a.folder('alice','Year 2026');const file=await a.upload('alice',{name:'numbers.csv',folderId:folder.id,body:Buffer.from('a,b\n1,2')});
 const reopened=createStore(root);const listing=await reopened.list('alice');
 assert.equal(listing.folders[0].name,'Year 2026');assert.equal(listing.files[0].id,file.id);assert.equal(listing.usage,7);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('malformed URI filename and oversize upload are rejected without persistence',async()=>{
 const root=await temp();const {server,listen}=makeServer({secret,root,port:0});
 try{const {port}=await listen();const base=`http://127.0.0.1:${port}`;const loc='/v1/box/files';
 const sign=()=>({'x-box-identity':createAssertion(secret,'alice','POST',loc)});
 let r=await fetch(base+loc,{method:'POST',headers:{...sign(),'x-box-filename':'%ZZ'},body:'abc'});assert.equal(r.status,400);
 r=await fetch(base+loc,{method:'POST',headers:{...sign(),'x-box-filename':'too-big.bin'},body:Buffer.alloc(FILE_MAX+1)});assert.equal(r.status,413);
 assert.equal((await (await fetch(base+'/v1/box',{headers:{'x-box-identity':createAssertion(secret,'alice','GET','/v1/box')}})).json()).files.length,0);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
test('no valid internal secret fails at start',()=>{assert.throws(()=>makeServer({secret:'too-short',port:0}),/secret/i)});
