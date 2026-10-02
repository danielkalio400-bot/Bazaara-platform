import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {verifyAssertion,AuthError} from './auth.mjs';
import {makeBoxClient,BoxClientError} from './box-client.mjs';
import {createStore,DocsError,safeId,safeTitle} from './store.mjs';

const DOC_MAX=1024*1024;
function counts(markdown){const text=markdown.replace(/[`*_>#\[\]()~-]/g,' ').replace(/\s+/g,' ').trim();return {words:text?text.split(' ').length:0,chars:markdown.length};}
function normalizeMarkdown(input){if(typeof input!=='string')throw new DocsError('Document content must be text.');if(Buffer.byteLength(input,'utf8')>DOC_MAX)throw new DocsError('Document exceeds 1 MB.',413);return input.replace(/\r\n?/g,'\n');}
function encodeDocument({id,title,markdown,createdAt,updatedAt}){return Buffer.from(JSON.stringify({format:'bazaara.docs',schemaVersion:1,id,title,markdown,createdAt,updatedAt}));}
function parseDocument(buffer,id){if(buffer.length>DOC_MAX+4096)throw new DocsError('Stored document is too large.',503);let value;try{value=JSON.parse(buffer.toString('utf8'));}catch{throw new DocsError('Stored document is corrupted.',503);}if(value?.format!=='bazaara.docs'||value?.schemaVersion!==1||value?.id!==id||typeof value.title!=='string'||typeof value.markdown!=='string')throw new DocsError('Stored document is corrupted.',503);return value;}
async function readBody(req,limit){const declared=Number(req.headers['content-length']??0);if((declared&&(!Number.isSafeInteger(declared)||declared>limit))||declared<0)throw new DocsError('Request is too large.',413);let len=0;const chunks=[];for await(const part of req){len+=part.length;if(len>limit)throw new DocsError('Request is too large.',413);chunks.push(part);}return Buffer.concat(chunks);}
async function readJSON(req,limit){const buf=await readBody(req,limit);try{const value=JSON.parse(buf.toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw new DocsError('Invalid JSON.');}}
function send(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}

export function makeServer({secret,boxSecret,boxOrigin='http://127.0.0.1:4022',root=path.join(os.homedir(),'.bazaara','docs-dev'),port=4023}={}){
  if(!secret||secret.length<32)throw new Error('Missing DOCS_INTERNAL_SECRET (32+ characters)');
  if(!boxSecret||boxSecret.length<32)throw new Error('Missing BOX_INTERNAL_SECRET (32+ characters)');
  const store=createStore(root),box=makeBoxClient({origin:boxOrigin,secret:boxSecret});
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url??'/', 'http://localhost').pathname;
    if(req.method==='GET'&&pathname==='/health/live')return send(res,200,{ok:true,service:'docs-api'});
    if(req.method==='GET'&&pathname==='/health/ready'){const ready=await box.health();return send(res,ready?200:503,{ok:ready,service:'docs-api',box:ready?'ready':'unavailable'});}
    try{
      const sub=verifyAssertion(secret,req.headers['x-docs-identity'],req.method,pathname);
      if(req.method==='GET'&&pathname==='/v1/docs')return send(res,200,await store.list(sub));
      if(req.method==='POST'&&pathname==='/v1/docs'){
        const input=await readJSON(req,200000),title=safeTitle(input.title??'Untitled document'),markdown=normalizeMarkdown(input.markdown??'');
        const now=new Date().toISOString();
        const result=await store.update(sub,async(data,commit)=>{
          if(data.documents.length>=store.limit)throw new DocsError('Document limit reached.',413);
          const id=randomBytes(16).toString('hex'),body=encodeDocument({id,title,markdown,createdAt:now,updatedAt:now});
          const uploaded=await box.upload(sub,`bazaara-doc-${id}.bdoc`,body);const stat=counts(markdown);const meta={id,title,boxFileId:uploaded.id,revision:1,createdAt:now,updatedAt:now,...stat};
          data.documents.push(meta);try{await commit(data);}catch(e){await box.remove(sub,uploaded.id).catch(()=>{});throw e;}const {boxFileId,...publicMeta}=meta;return publicMeta;
        });
        return send(res,201,result);
      }
      const match=pathname.match(/^\/v1\/docs\/([a-f0-9]{32})$/);
      if(match&&req.method==='GET'){
        const id=safeId(match[1]),meta=await store.getMeta(sub,id),buffer=await box.download(sub,meta.boxFileId),doc=parseDocument(buffer,id);const {boxFileId,...publicMeta}=meta;return send(res,200,{...publicMeta,markdown:doc.markdown});
      }
      if(match&&req.method==='PUT'){
        const id=safeId(match[1]),input=await readJSON(req,DOC_MAX+8192),title=safeTitle(input.title??'Untitled document'),markdown=normalizeMarkdown(input.markdown??'');
        if(!Number.isInteger(input.expectedRevision)||input.expectedRevision<1)throw new DocsError('expectedRevision is required.');
        const result=await store.update(sub,async(data,commit)=>{
          const index=data.documents.findIndex(d=>d.id===id);if(index<0)throw new DocsError('Document not found.',404);const old=data.documents[index];if(old.revision!==input.expectedRevision)throw new DocsError('Document revision conflict.',409);
          const now=new Date().toISOString(),body=encodeDocument({id,title,markdown,createdAt:old.createdAt,updatedAt:now});const uploaded=await box.upload(sub,`bazaara-doc-${id}.bdoc`,body);const stat=counts(markdown);const next={...old,title,boxFileId:uploaded.id,revision:old.revision+1,updatedAt:now,...stat};data.documents[index]=next;
          try{await commit(data);}catch(e){await box.remove(sub,uploaded.id).catch(()=>{});throw e;}await box.remove(sub,old.boxFileId).catch(e=>console.warn('Docs cleanup warning:',e.message));const {boxFileId,...publicMeta}=next;return publicMeta;
        });
        return send(res,200,result);
      }
      if(match&&req.method==='DELETE'){
        const id=safeId(match[1]);const result=await store.update(sub,async(data,commit)=>{const index=data.documents.findIndex(d=>d.id===id);if(index<0)throw new DocsError('Document not found.',404);const [old]=data.documents.splice(index,1);await commit(data);let cleanup='deleted';try{await box.remove(sub,old.boxFileId);}catch(e){cleanup='pending';console.warn('Docs orphan cleanup warning:',e.message);}return {deleted:true,cleanup};});return send(res,200,result);
      }
      return send(res,404,{message:'Not found.'});
    }catch(e){
      const status=e instanceof DocsError||e instanceof AuthError||e instanceof BoxClientError?e.status:500;if(status===500)console.error('Docs API internal error:',e);if(!res.headersSent)send(res,status,{message:status===500?'Document service unavailable.':e.message});else res.destroy();
    }
  });
  server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=40;
  return {server,store,box,listen(){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});});}};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const instance=makeServer({secret:process.env.DOCS_INTERNAL_SECRET,boxSecret:process.env.BOX_INTERNAL_SECRET,boxOrigin:process.env.BOX_API_ORIGIN||'http://127.0.0.1:4022',root:process.env.DOCS_DATA_DIR||undefined,port:Number(process.env.PORT||4023)});
  instance.listen().then(addr=>console.log(`BAZAARA Docs API listening on http://127.0.0.1:${addr.port}`)).catch(e=>{console.error(e);process.exitCode=1;});
}
