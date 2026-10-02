// Bazaara Box local-alpha store. One Node process only; replace with PostgreSQL + object storage before multi-instance deployment.
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, open, unlink, stat } from 'node:fs/promises';
import path from 'node:path';

export class BoxError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'BoxError'; this.status = status; }
}
export const FILE_MAX = 10 * 1024 * 1024;
export const QUOTA = 100 * 1024 * 1024;
export const MAX_ITEMS = 1000;
const validId = /^[a-f0-9]{32}$/;
export function safeName(input) {
  if (typeof input !== 'string') throw new BoxError('A filename is required.');
  const name = input.normalize('NFC').replaceAll('\\', '/').split('/').at(-1)?.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/g, '').trim();
  if (!name || name === '.' || name === '..' || name.length > 128) throw new BoxError('Invalid filename (maximum 128 characters).');
  return name;
}
export function safeId(value) { if (typeof value !== 'string' || !validId.test(value)) throw new BoxError('Invalid identifier.'); return value; }
export function userKey(sub) {
  if (typeof sub !== 'string' || !sub || sub.length > 128) throw new BoxError('Invalid user.', 401);
  return createHash('sha256').update(sub).digest('hex');
}
const fresh = () => ({ version:1, folders:[], files:[] });
export function createStore(root, {fileMax = FILE_MAX, quota = QUOTA} = {}) {
  const locks = new Map();
  function dir(sub) { return path.join(root, userKey(sub)); }
  async function read(sub) {
    try {
      const result = JSON.parse(await readFile(path.join(dir(sub), 'index.json'), 'utf8'));
      if (result.version !== 1 || !Array.isArray(result.files) || !Array.isArray(result.folders)) throw new Error('Corrupt metadata');
      return result;
    } catch(e) { if (e.code === 'ENOENT') return fresh(); throw e; }
  }
  async function commit(sub, data) {
    const d = dir(sub); await mkdir(d, {recursive:true, mode:0o700});
    const tmp = path.join(d, `${randomBytes(16).toString('hex')}.tmp`);
    try { const f = await open(tmp, 'wx', 0o600); try { await f.writeFile(JSON.stringify(data)); await f.sync(); } finally { await f.close(); } await rename(tmp, path.join(d,'index.json')); }
    catch(e) { await unlink(tmp).catch(()=>{}); throw e; }
  }
  // Serialize per-account modifications to prevent local single-process lost updates.
  function update(sub, fn) {
    const key = userKey(sub), prev = locks.get(key) ?? Promise.resolve();
    const task = prev.catch(()=>{}).then(async () => fn(await read(sub)));
    const tail = task.catch(()=>{}); locks.set(key,tail);
    tail.finally(()=>{ if(locks.get(key)===tail) locks.delete(key); });
    return task;
  }
  async function list(sub) {
    const data = await read(sub);
    return { folders:data.folders, files:data.files.map(({id,name,size,folderId,createdAt}) => ({id,name,size,folderId,createdAt})), usage:data.files.reduce((n,f)=>n+f.size,0), quota, maxUpload:fileMax };
  }
  async function folder(sub, name, parentId=null) {
    name = safeName(name); if(parentId!==null) safeId(parentId);
    return update(sub,async data=>{
      if(data.folders.length>=MAX_ITEMS) throw new BoxError('Folder limit reached.',413);
      if(parentId && !data.folders.some(f=>f.id===parentId)) throw new BoxError('Parent folder not found.',404);
      if(data.folders.some(f=>f.parentId===parentId && f.name.toLowerCase()===name.toLowerCase())) throw new BoxError('Folder already exists.',409);
      const item={id:randomBytes(16).toString('hex'),name,parentId,createdAt:new Date().toISOString()};
      data.folders.push(item); await commit(sub,data); return item;
    });
  }
  async function upload(sub, {name,folderId=null,body}) {
    name=safeName(name); if(folderId!==null) safeId(folderId);
    if(!Buffer.isBuffer(body) || body.length===0 || body.length>fileMax) throw new BoxError(`File must be 1–${Math.floor(fileMax/1048576)} MB.`,413);
    return update(sub,async data=>{
      if(data.files.length>=MAX_ITEMS)throw new BoxError('File limit reached.',413);
      if(folderId && !data.folders.some(f=>f.id===folderId)) throw new BoxError('Folder not found.',404);
      if(data.files.reduce((n,f)=>n+f.size,0)+body.length>quota) throw new BoxError('Your storage quota would be exceeded.',413);
      const d=dir(sub); await mkdir(path.join(d,'objects'),{recursive:true,mode:0o700});
      const id=randomBytes(16).toString('hex'), fp=path.join(d,'objects',id);
      const fh=await open(fp,'wx',0o600);
      try { await fh.writeFile(body); await fh.sync(); } finally { await fh.close(); }
      const item={id,name,size:body.length,folderId,createdAt:new Date().toISOString()};
      data.files.push(item);
      try { await commit(sub,data); } catch(e) { await unlink(fp).catch(()=>{}); throw e; }
      return item;
    });
  }
  async function download(sub,id) {
    safeId(id); const data=await read(sub), item=data.files.find(f=>f.id===id);
    if(!item) throw new BoxError('File not found.',404);
    const fp=path.join(dir(sub),'objects',id);
    const info=await stat(fp); if(!info.isFile() || info.size!==item.size) throw new BoxError('File is temporarily unavailable.',503);
    return {item,fp};
  }
  async function deleteFile(sub,id) {
    safeId(id);
    return update(sub,async data=>{
      const index=data.files.findIndex(f=>f.id===id); if(index<0) throw new BoxError('File not found.',404);
      // Rename to tombstone first: commit errors restore original file.
      const fp=path.join(dir(sub),'objects',id), tomb=`${fp}.deleting`;
      await rename(fp,tomb);
      data.files.splice(index,1);
      try {await commit(sub,data);}catch(e){await rename(tomb,fp).catch(()=>{});throw e;}
      await unlink(tomb).catch(()=>{}); return {deleted:true};
    });
  }
  async function deleteFolder(sub,id) {
    safeId(id);
    return update(sub,async data=>{
      const idx=data.folders.findIndex(f=>f.id===id); if(idx<0) throw new BoxError('Folder not found.',404);
      if(data.files.some(f=>f.folderId===id)||data.folders.some(f=>f.parentId===id))throw new BoxError('Folder is not empty.',409);
      data.folders.splice(idx,1); await commit(sub,data); return {deleted:true};
    });
  }
  return {list,folder,upload,download,deleteFile,deleteFolder};
}
