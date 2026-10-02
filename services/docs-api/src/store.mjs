import {createHash,randomBytes} from 'node:crypto';
import {mkdir,readFile,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
export class DocsError extends Error{constructor(message,status=400){super(message);this.name='DocsError';this.status=status;}}
const validId=/^[a-f0-9]{32}$/;const fresh=()=>({version:1,documents:[]});
export function safeId(value){if(typeof value!=='string'||!validId.test(value))throw new DocsError('Invalid document identifier.');return value;}
export function userKey(sub){if(typeof sub!=='string'||!sub||sub.length>128)throw new DocsError('Invalid user.',401);return createHash('sha256').update(sub).digest('hex');}
export function safeTitle(input){if(typeof input!=='string')throw new DocsError('A title is required.');const title=input.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim()||'Untitled document';if(title.length>100)throw new DocsError('Title must be 100 characters or fewer.');return title;}
export function createStore(root,{limit=200}={}){
  const locks=new Map();function dir(sub){return path.join(root,userKey(sub));}
  async function read(sub){try{const value=JSON.parse(await readFile(path.join(dir(sub),'index.json'),'utf8'));if(value.version!==1||!Array.isArray(value.documents))throw new Error('Corrupt Docs metadata.');return value;}catch(e){if(e.code==='ENOENT')return fresh();throw e;}}
  async function commit(sub,data){const d=dir(sub);await mkdir(d,{recursive:true,mode:0o700});const tmp=path.join(d,`${randomBytes(16).toString('hex')}.tmp`);try{const f=await open(tmp,'wx',0o600);try{await f.writeFile(JSON.stringify(data));await f.sync();}finally{await f.close();}await rename(tmp,path.join(d,'index.json'));}catch(e){await unlink(tmp).catch(()=>{});throw e;}}
  function update(sub,fn){const key=userKey(sub),prev=locks.get(key)||Promise.resolve();const task=prev.catch(()=>{}).then(async()=>fn(await read(sub),async data=>commit(sub,data)));const tail=task.catch(()=>{});locks.set(key,tail);tail.finally(()=>{if(locks.get(key)===tail)locks.delete(key)});return task;}
  async function list(sub){const data=await read(sub);return {documents:[...data.documents].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(({boxFileId,...rest})=>rest),limit};}
  async function getMeta(sub,id){safeId(id);const data=await read(sub),item=data.documents.find(d=>d.id===id);if(!item)throw new DocsError('Document not found.',404);return item;}
  return {list,getMeta,update,limit};
}
