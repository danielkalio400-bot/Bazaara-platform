import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

function root(){return path.resolve(process.env.DATA_DIR||'.data')}
function safeUser(v){return String(v||'local-dev').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,96)}
function fileFor(user){return path.join(root(),safeUser(user)+'.json')}
function prefsFileFor(user){return path.join(root(),safeUser(user)+'.prefs.json')}
async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if(e?.code==='ENOENT')return fallback;throw e}}
async function writeJson(file,value){const dir=root();await fs.mkdir(dir,{recursive:true});const tmp=file+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2),{encoding:'utf8',mode:0o600});await fs.rename(tmp,file)}
function text(v,max){return typeof v==='string'?v.replace(/\u0000/g,'').slice(0,max):''}
function stringArray(v,maxItems=100,maxLen=320){return Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>text(x,maxLen).trim()).filter(Boolean).slice(0,maxItems):[]}
function safeAttachments(v){return Array.isArray(v)?v.slice(0,20).flatMap(x=>{if(!x||typeof x!=='object')return[];const name=text(x.name,240).trim();const size=Number(x.size);const type=text(x.type,160).trim();if(!name||!Number.isFinite(size)||size<0||size>100*1024*1024)return[];return[{name,size:Math.trunc(size),type}] }):[]}
const FOLDERS=new Set(['INBOX','STARRED','SNOOZED','SENT','DRAFTS','SCHEDULED','ARCHIVE','SPAM','TRASH']);
const CATEGORIES=new Set(['PRIMARY','PROMOTIONS','SOCIAL','UPDATES']);
const PRIORITIES=new Set(['normal','high','low']);
function normalizeMeta(input={},prior={}){
  const src={...prior,...(input&&typeof input==='object'?input:{})};
  const folder=FOLDERS.has(src.folder)?src.folder:'DRAFTS';
  const category=CATEGORIES.has(src.category)?src.category:'PRIMARY';
  const priority=PRIORITIES.has(src.priority)?src.priority:'normal';
  return {
    folder,
    to:stringArray(src.to),cc:stringArray(src.cc),bcc:stringArray(src.bcc),
    labels:stringArray(src.labels,50,80),starred:Boolean(src.starred),read:src.read!==false,
    important:Boolean(src.important),snoozedUntil:text(src.snoozedUntil,64),scheduledFor:text(src.scheduledFor,64),
    sentAt:text(src.sentAt,64),from:text(src.from,320),attachments:safeAttachments(src.attachments),
    category,confidential:Boolean(src.confidential),expiresAt:text(src.expiresAt,64),allowForward:src.allowForward!==false,
    priority,threadId:text(src.threadId,96)
  };
}
function normalizeLegacy(item){if(!item||typeof item!=='object')return item;return{...item,title:text(item.title,200).trim(),body:text(item.body,50000),meta:normalizeMeta(item.meta||{},item.meta||{})}}
async function read(user){const rows=await readJson(fileFor(user),[]);return Array.isArray(rows)?rows.map(normalizeLegacy):[]}
async function write(user,items){await writeJson(fileFor(user),items)}
export async function list(user){return (await read(user)).sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')))}
export async function get(user,id){return (await read(user)).find(x=>x.id===id)||null}
export async function create(user,input){const items=await read(user);const now=new Date().toISOString();const title=text(input?.title,200).trim();if(!title)throw Object.assign(new Error('title is required'),{status:400});const item={id:crypto.randomUUID(),title,body:text(input?.body,50000),meta:normalizeMeta(input?.meta),createdAt:now,updatedAt:now};items.push(item);await write(user,items);return item}
export async function update(user,id,input){const items=await read(user);const index=items.findIndex(x=>x.id===id);if(index<0)throw Object.assign(new Error('not found'),{status:404});const prior=items[index];const title=text(input?.title??prior.title,200).trim();if(!title)throw Object.assign(new Error('title is required'),{status:400});const next={...prior,title,body:text(input?.body??prior.body,50000),meta:normalizeMeta(input?.meta,prior.meta),updatedAt:new Date().toISOString()};items[index]=next;await write(user,items);return next}
export async function remove(user,id){const items=await read(user);const next=items.filter(x=>x.id!==id);if(next.length===items.length)return false;await write(user,next);return true}
export async function preferences(user){const p=await readJson(prefsFileFor(user),{});return{signature:text(p?.signature,5000),undoSendSeconds:Math.min(30,Math.max(0,Number(p?.undoSendSeconds)||5)),defaultFrom:text(p?.defaultFrom,320),defaultLabels:stringArray(p?.defaultLabels,20,80)}}
export async function updatePreferences(user,input){const current=await preferences(user);const next={signature:text(input?.signature??current.signature,5000),undoSendSeconds:Math.min(30,Math.max(0,Number(input?.undoSendSeconds??current.undoSendSeconds)||0)),defaultFrom:text(input?.defaultFrom??current.defaultFrom,320),defaultLabels:stringArray(input?.defaultLabels??current.defaultLabels,20,80)};await writeJson(prefsFileFor(user),next);return next}
