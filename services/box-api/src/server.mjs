import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createReadStream} from 'node:fs';
import {createStore,BoxError,FILE_MAX} from './store.mjs';
import {verifyAssertion} from './auth.mjs';

export function makeServer({secret,root=path.join(os.homedir(),'.bazaara','box-dev'),port=4022}={}) {
  if(!secret || secret.length<32)throw new Error('Missing BOX_INTERNAL_SECRET (32+ random characters)');
  const store=createStore(root);
  const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));};
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url??'/', 'http://localhost').pathname;
    if(req.method==='GET'&&pathname==='/health/live')return send(res,200,{ok:true,service:'box-api',storage:'local-development'});
    try {
      const sub=verifyAssertion(secret,req.headers['x-box-identity'],req.method,pathname);
      if(req.method==='GET'&&pathname==='/v1/box')return send(res,200,await store.list(sub));
      if(req.method==='POST'&&pathname==='/v1/box/folders'){
        const data=await readJSON(req,2048);
        return send(res,201,await store.folder(sub,data.name,data.parentId??null));
      }
      if(req.method==='POST'&&pathname==='/v1/box/files'){
        let name;try{name=decodeURIComponent(String(req.headers['x-box-filename']??''));}catch{throw new BoxError('Invalid filename encoding.');}
        const folderId=req.headers['x-box-folder']||null;
        const body=await readBody(req,FILE_MAX);
        return send(res,201,await store.upload(sub,{name,folderId,body}));
      }
      const fm=pathname.match(/^\/v1\/box\/files\/([a-f0-9]{32})$/);
      if(fm&&req.method==='GET'){
        const {item,fp}=await store.download(sub,fm[1]);
        // Always serve as attachment, never render untrusted HTML/SVG in the website origin.
        const filename=item.name.replace(/[\\"\r\n]/g,'_');
        res.writeHead(200,{'content-type':'application/octet-stream','content-disposition':`attachment; filename="${filename.replace(/[^\x20-\x7e]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(item.name)}`,'content-length':item.size,'cache-control':'private, no-store','x-content-type-options':'nosniff'});
        const stream=createReadStream(fp);stream.on('error',()=>res.destroy());stream.pipe(res);return;
      }
      if(fm&&req.method==='DELETE')return send(res,200,await store.deleteFile(sub,fm[1]));
      const dm=pathname.match(/^\/v1\/box\/folders\/([a-f0-9]{32})$/);
      if(dm&&req.method==='DELETE')return send(res,200,await store.deleteFolder(sub,dm[1]));
      return send(res,404,{message:'Not found.'});
    }catch(e){
      const status=e instanceof BoxError?e.status:500;
      if(status===500)console.error('Box API internal error:',e);
      if(!res.headersSent)send(res,status,{message:status===500?'Storage unavailable.':e.message});else res.destroy();
    }
  });
  server.requestTimeout=30000; server.headersTimeout=10000; server.maxHeadersCount=40;
  return {server,store,listen(){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});});}};
}
async function readBody(req,limit){
  const declared=Number(req.headers['content-length']??0);
  if((declared && (!Number.isSafeInteger(declared)||declared>limit))||declared<0)throw new BoxError('Upload exceeds size limit.',413);
  let len=0;const chunks=[];
  for await(const part of req){len+=part.length;if(len>limit)throw new BoxError('Upload exceeds size limit.',413);chunks.push(part);}
  return Buffer.concat(chunks);
}
async function readJSON(req,limit){const buf=await readBody(req,limit);try{const v=JSON.parse(buf.toString());if(!v||typeof v!=='object'||Array.isArray(v))throw Error();return v;}catch{throw new BoxError('Invalid JSON.');}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const instance=makeServer({secret:process.env.BOX_INTERNAL_SECRET,root:process.env.BOX_DATA_DIR||undefined,port:Number(process.env.PORT||4022)});
  instance.listen().then(addr=>console.log(`BAZAARA Box API listening on http://127.0.0.1:${addr.port}`)).catch(e=>{console.error(e);process.exitCode=1;});
}
