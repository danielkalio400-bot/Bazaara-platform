'use client';
import { useEffect,useRef,useState } from 'react';
const ACCEPT='.txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json';
export default function SearchInputTools({open,onClose,onLens,onInsert,aiStudioHref}:{open:boolean;onClose:()=>void;onLens:()=>void;onInsert:(text:string)=>void;aiStudioHref?:string}){
 const [file,setFile]=useState<{name:string;sample:string}|null>(null);const [error,setError]=useState('');const ref=useRef<HTMLDivElement>(null);const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!open)return;const focus=ref.current?.querySelector('button');focus?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){onClose();return;}if(e.key==='Tab'&&ref.current){const els=Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]'));if(!els.length)return;if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1]?.focus();}else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0]?.focus();}}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[open,onClose]);
 async function read(file:File|undefined){if(!file)return;setError('');setFile(null);
  const ext=file.name.split('.').pop()?.toLowerCase();if(!['txt','md','csv','json'].includes(ext||'')){setError('This release reads text, Markdown, CSV and JSON locally. PDF/DOCX ingestion needs a configured document service.');return;}
  if(file.size>1024*1024){setError('Choose a text file below 1 MB.');return;}
  try{const text=await file.text();const cleaned=text.replace(/\s+/g,' ').trim();if(!cleaned){setError('The file contains no readable text.');return;}setFile({name:file.name.slice(0,100),sample:cleaned.slice(0,200)});}catch{setError('This browser could not read the file.');}
 }
 if(!open)return null;
 return <div className="bz86-tools-overlay" onMouseDown={e=>{if(e.currentTarget===e.target)onClose();}}><section className="bz86-tools" ref={ref} role="dialog" aria-modal="true" aria-label="Add to BAZAARA Search"><header><div><small className="bz86-eyebrow">MULTIMODAL INPUT</small><h2>Add to Search</h2></div><button type="button" onClick={onClose} aria-label="Close add menu">×</button></header>
 <div className="bz86-tools-grid"><button type="button" onClick={()=>{onClose();onLens();}}><span aria-hidden="true">▧</span><strong>Image & screenshot</strong><small>Open BazLens visual search</small></button><button type="button" onClick={()=>input.current?.click()}><span aria-hidden="true">▤</span><strong>Text document</strong><small>Local TXT, MD, CSV or JSON</small></button>
 {aiStudioHref?<a href={aiStudioHref} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">✧</span><strong>AI Studio</strong><small>Open your configured BAZAARA service ↗</small></a>:<div className="bz86-tool-disabled" aria-disabled="true"><span aria-hidden="true">✧</span><strong>AI creation</strong><small>Requires an AI service connection</small></div>}
 <div className="bz86-tool-disabled" aria-disabled="true"><span aria-hidden="true">▧</span><strong>PDF / DOCX</strong><small>Secure document indexing is not configured</small></div></div>
 <input ref={input} type="file" hidden accept={ACCEPT} onChange={e=>{void read(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
 {file&&<div className="bz86-file-preview"><strong>{file.name}</strong><p>{file.sample}</p><button type="button" onClick={()=>{onInsert(file.sample);onClose();}}>Insert excerpt in Search</button><small>Only the excerpt you choose will be sent when you submit a search. The file itself stays in this browser.</small></div>}
 {error&&<p className="bz86-form-error" role="alert">{error}</p>}<footer>Only enabled actions are interactive; no simulated AI or document uploads.</footer></section></div>;
}
