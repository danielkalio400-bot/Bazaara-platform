import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
function root(){return path.resolve(process.env.DATA_DIR||'.data')}
function safeUser(v){return String(v||'local-dev').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,96)}
async function read(user){const dir=root();await fs.mkdir(dir,{recursive:true});const file=path.join(dir,safeUser(user)+'.json');try{return JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if(e?.code==='ENOENT')return [];throw e}}
async function write(user,items){const dir=root();await fs.mkdir(dir,{recursive:true});const file=path.join(dir,safeUser(user)+'.json');const tmp=file+'.tmp';await fs.writeFile(tmp,JSON.stringify(items,null,2),'utf8');await fs.rename(tmp,file)}
export async function list(user){return (await read(user)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
export async function create(user,input){const items=await read(user);const item={id:crypto.randomUUID(),title:String(input?.title||'').trim().slice(0,120),body:String(input?.body||'').trim().slice(0,4000),createdAt:new Date().toISOString()};if(!item.title)throw Object.assign(new Error('title is required'),{status:400});items.push(item);await write(user,items);return item}
export async function remove(user,id){const items=await read(user);const next=items.filter(x=>x.id!==id);if(next.length===items.length)return false;await write(user,next);return true}
