'use client';

import {useCallback, useEffect, useId, useRef, useState, type ReactNode} from 'react';

export type Identified = {id: string};
type Collection<T> = {version: 1; revision: number; items: T[]};
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const errorText = (e: unknown) => e instanceof Error ? e.message : 'The operation could not be completed.';
export const escapeHtml = (v: string) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const safeLink = (v: string) => {try {const u = new URL(v); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined;} catch {return undefined;}};
export function download(name: string, value: string | Blob, mime='application/json') {
  const blob = typeof value === 'string' ? new Blob([value], {type: mime}) : value;
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '-'); a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function csv(rows: unknown[][], protectFormulas=true) {
  return rows.map(row => row.map(value => {
    let s = String(value ?? '');
    if(protectFormulas && typeof value==='string' && /^[\t\r\n ]*[=+@-]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') {if(quoted && text[i+1]==='"'){field+='"';i++;} else if(quoted || field==='') quoted=!quoted; else field+=c;}
    else if(c===',' && !quoted){row.push(field);field='';}
    else if((c==='\n' || c==='\r') && !quoted){if(c==='\r' && text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted) throw Error('The CSV has an unterminated quoted field.');
  if(field || row.length){row.push(field);rows.push(row);}
  return rows.filter(r=>r.some(Boolean));
}
export function useCollection<T extends Identified>(name: string, validate?: (value: unknown)=>value is T) {
  const key='bazaara.flagship.v1.'+name;
  const [items,setItems]=useState<T[]>([]),[ready,setReady]=useState(false),[error,setError]=useState('');
  const current=useRef<T[]>([]); const check=useRef(validate);check.current=validate;
  const read=useCallback((): Collection<T> => {
    const raw=localStorage.getItem(key); if(!raw)return {version:1,revision:0,items:[]};
    const data=JSON.parse(raw) as Collection<T>;
    if(data.version!==1 || !Array.isArray(data.items) || !Number.isInteger(data.revision))throw Error('Stored data has an unsupported format. Export or restore a valid backup before continuing.');
    if(!data.items.every(i=>i && typeof i.id==='string' && (!check.current || check.current(i)))||new Set(data.items.map(i=>i.id)).size!==data.items.length)throw Error('Stored records failed validation. Your original data has been preserved.');
    return data;
  },[key]);
  useEffect(()=>{
    const load=()=>{try {const data=read();current.current=data.items;setItems(data.items);setError('');}catch(e){setError(errorText(e));}finally{setReady(true);}};
    setReady(false);load();
    const changed=(e:StorageEvent)=>{if(e.key===key)load();};window.addEventListener('storage',changed);
    return ()=>window.removeEventListener('storage',changed);
  },[key,read]);
  const mutate=useCallback((fn:(items:T[])=>T[])=>{
    if(!ready)return false;
    try {
      // Read immediately before mutation; do not overwrite a newer tab's records.
      const base=read(),next=fn(base.items);
      if(next.length>10000)throw Error('This collection has reached its 10,000 record device limit.');
      if(!next.every(i=>i && typeof i.id==='string' && (!check.current || check.current(i)))||new Set(next.map(i=>i.id)).size!==next.length)throw Error('One or more records failed validation.');
      const payload=JSON.stringify({version:1,revision:base.revision+1,items:next});
      if(payload.length>3000000)throw Error('This collection exceeds the device text-storage limit. Export a backup and reduce its size.');
      localStorage.setItem(key,payload);current.current=next;setItems(next);setError('');return true;
    }catch(e){setError(errorText(e));return false;}
  },[ready,read,key]);
  const put=useCallback((item:T)=>mutate(rows=>[item,...rows.filter(r=>r.id!==item.id)]),[mutate]);
  const remove=useCallback((id:string)=>mutate(rows=>rows.filter(r=>r.id!==id)),[mutate]);
  return {items,ready,error,mutate,put,remove};
}
export async function readJson<T>(file: File, validate:(value:unknown)=>value is T, max=3000000):Promise<T> {
  if(file.size>max)throw Error('This import exceeds the supported file size.');
  const value:unknown=JSON.parse(await file.text());if(!validate(value))throw Error('This file is not a valid product backup.');return value;
}
export function Brand({name}:{name:string}) {
  const id=useId().replace(/:/g,'');
  return <div className="bf-brand"><svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id={id+'r'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#da66ff"/><stop offset=".47" stopColor="#824dff"/><stop offset="1" stopColor="#17edff"/></linearGradient><linearGradient id={id+'s'} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#3bdcff"/><stop offset=".5" stopColor="#8259ff"/><stop offset="1" stopColor="#f48bff"/></linearGradient></defs><path d="M29 18c0-4 3-7 7-7h38c22 0 37 12 37 30 0 11-6 19-16 24 12 5 19 15 19 27 0 20-16 33-41 33H36c-4 0-7-3-7-7V18Zm20 13v26h22c13 0 19-5 19-13s-7-13-19-13H49Zm0 45v28h24c14 0 20-5 20-14 0-10-7-14-21-14H49Z" fill={`url(#${id}r)`} opacity=".95"/><path d="M29 18c0-4 3-7 7-7h38c22 0 37 12 37 30 0 11-6 19-16 24-11 6-28 11-46 11v28h24c14 0 20-5 20-14 0-8-5-12-14-14" fill="none" stroke={`url(#${id}s)`} strokeWidth="8" strokeLinecap="round" opacity=".9"/><path d="M48 31v26h23c12 0 19-5 19-13S83 31 71 31H48Z" fill="#07101e" opacity=".76"/></svg><div><strong>{name}</strong><small>BAZAARA</small></div></div>;
}
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}){return children?<div className={'bf-notice'+(error?' error':'')} role={error?'alert':'status'}>{children}</div>:null;}
export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="bf-empty"><h2>{title}</h2><p>{children}</p></div>;}
export function Shell({name,description,actions,children,notice,error,storage=true}:{name:string;description:string;actions?:ReactNode;children:ReactNode;notice?:string;error?:string;storage?:boolean}) {
  return <main className="bf-root"><a className="bf-skip" href="#bf-content">Skip to content</a><header className="bf-header"><Brand name={name}/><div className="bf-actions">{actions}</div></header><div className="bf-intro"><div><span className="bf-eyebrow">INTELLIGENCE · CREATIVITY · PEOPLE</span><h1>{name}</h1><p>{description}</p></div>{storage&&<span className="bf-storage">Device workspace · Export backups</span>}</div><Notice error>{error}</Notice><Notice>{notice}</Notice><section id="bf-content" className="bf-content">{children}</section></main>;
}
export function Dialog({title,close,children}:{title:string;close:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null),onClose=useRef(close);onClose.current=close;
  useEffect(()=>{const d=ref.current,previous=document.activeElement;if(!d)return;d.showModal();const cancel=(e:Event)=>{e.preventDefault();onClose.current();};d.addEventListener('cancel',cancel);return()=>{d.removeEventListener('cancel',cancel);if(d.open)d.close();if(previous instanceof HTMLElement)previous.focus();};},[]);
  return <dialog className="bf-dialog bf-root" ref={ref} aria-label={title} onClick={e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)close();}}}><header><h2>{title}</h2><button type="button" onClick={close} aria-label="Close dialog">✕</button></header>{children}</dialog>;
}
export function ImportButton({label='Import backup',accept='application/json',onFile}:{label?:string;accept?:string;onFile:(f:File)=>Promise<void>}) {
  const ref=useRef<HTMLInputElement>(null);const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <><button type="button" disabled={busy} onClick={()=>ref.current?.click()}>{busy?'Importing…':label}</button><input ref={ref} hidden type="file" accept={accept} onChange={async e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';if(!f)return;setBusy(true);setError('');try{await onFile(f);}catch(err){setError(errorText(err));}finally{setBusy(false);}}}/>{error&&<Notice error>{error}</Notice>}</>;
}
export function useHistory<T>(initial:T) {
  const [value,setValue]=useState(initial),past=useRef<T[]>([]),future=useRef<T[]>([]);
  const [tick,setTick]=useState(0);
  const replace=(next:T)=>{past.current=[];future.current=[];setValue(next);setTick(t=>t+1);};
  const change=(next:T)=>{past.current=[...past.current.slice(-99),value];future.current=[];setValue(next);setTick(t=>t+1);};
  const undo=()=>{const next=past.current.pop();if(next===undefined)return;future.current.push(value);setValue(next);setTick(t=>t+1);};
  const redo=()=>{const next=future.current.pop();if(next===undefined)return;past.current.push(value);setValue(next);setTick(t=>t+1);};
  return {value,change,replace,undo,redo,canUndo:past.current.length>0,canRedo:future.current.length>0,tick};
}
export function ToolRow({children}:{children:ReactNode}){return <div className="bf-toolbar">{children}</div>;}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="bf-field"><span>{label}</span>{children}</label>;}
export function Metric({label,value}:{label:string;value:ReactNode}){return <div className="bf-metric"><strong>{value}</strong><span>{label}</span></div>;}
export async function copyText(value:string){if(!navigator.clipboard)throw Error('Clipboard access is unavailable. Select and copy the text manually.');await navigator.clipboard.writeText(value);}
