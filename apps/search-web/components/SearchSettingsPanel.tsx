'use client';
import { useEffect,useRef,useState } from 'react';
import { type SearchPreferences,type HistoryEntry } from './searchLocalHistory';

type Safety='off'|'moderate'|'strict';
type RegionInfo={country:string;label:string;source:string};
type Tab='preferences'|'advanced'|'history'|'privacy';
const COUNTRY_OPTIONS=[['ALL','All regions'],['NG','Nigeria'],['GH','Ghana'],['KE','Kenya'],['ZA','South Africa'],['GB','United Kingdom'],['US','United States'],['CA','Canada'],['IN','India']];
const INPUT_LANGUAGES=[['auto','Browser default'],['en','English'],['fr','French'],['es','Spanish'],['de','German'],['pt','Portuguese'],['ar','Arabic'],['hi','Hindi'],['yo','Yorùbá'],['ig','Igbo'],['ha','Hausa']];
export default function SearchSettingsPanel({open,initialTab,onClose,dark,onDarkChange,safe,onSafeChange,country,onCountryChange,autoRegion,onAutoRegionChange,regionInfo,savedCount,onClearSaved,bazidHref,prefs,onPrefsChange,historyEnabled,onHistoryEnabledChange,history,onClearHistory,onExport,onAdvancedSearch}:{
  open:boolean;initialTab:Tab;onClose:()=>void;dark:boolean;onDarkChange:(v:boolean)=>void;safe:Safety;onSafeChange:(v:Safety)=>void;
  country:string;onCountryChange:(v:string)=>void;autoRegion:boolean;onAutoRegionChange:(v:boolean)=>void;regionInfo:RegionInfo;
  savedCount:number;onClearSaved:()=>void;bazidHref?:string;prefs:SearchPreferences;onPrefsChange:(v:SearchPreferences)=>void;
  historyEnabled:boolean;onHistoryEnabledChange:(enabled:boolean)=>void;history:HistoryEntry[];onClearHistory:()=>void;onExport:()=>void;onAdvancedSearch:(v:string)=>void;
}) {
 const [tab,setTab]=useState<Tab>(initialTab);const [confirm,setConfirm]=useState<'history'|'saved'|null>(null);
 const [words,setWords]=useState('');const [phrase,setPhrase]=useState('');const [exclude,setExclude]=useState('');const [site,setSite]=useState('');const [filetype,setFiletype]=useState('');
 const close=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);const closeRef=useRef(onClose);closeRef.current=onClose;
 useEffect(()=>{if(open){setTab(initialTab);setConfirm(null);}},[open,initialTab]);
 useEffect(()=>{if(!open)return;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
   const timer=window.setTimeout(()=>close.current?.focus(),0);
   function key(e:KeyboardEvent){if(e.key==='Escape'){e.stopPropagation();closeRef.current();return;}if(e.key!=='Tab'||!panel.current)return;
    const els=Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],select:not([disabled]),input:not([disabled])'));
    if(!els.length)return;if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1]?.focus();}
    if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0]?.focus();}}
   document.addEventListener('keydown',key,true);return()=>{window.clearTimeout(timer);document.removeEventListener('keydown',key,true);previous?.focus();};
 },[open]);
 function update(name:keyof SearchPreferences,value:SearchPreferences[keyof SearchPreferences]){onPrefsChange({...prefs,[name]:value});}
 function build(){const query=[words.trim(),phrase.trim()?`"${phrase.trim().replace(/"/g,'')}"`:'',exclude.trim()?exclude.trim().split(/\s+/).map(s=>`-${s.replace(/["\s]/g,'')}`).join(' '):'',site.trim()?`site:${site.trim().replace(/^https?:\/\//,'').replace(/\s/g,'')}`:'',filetype?`filetype:${filetype}`:''].filter(Boolean).join(' ').slice(0,200);if(query){onAdvancedSearch(query);onClose();}}
 if(!open)return null;
 return <div className="bz85-screen-backdrop bz85-settings-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div className="bz85-settings bz86-settings" ref={panel} role="dialog" aria-modal="true" aria-label="BAZAARA Search settings">
   <header className="bz85-settings-head"><div><small>BAZAARA SEARCH · V8.6</small><h2>Preferences & privacy</h2></div><button ref={close} type="button" className="bz85-close" onClick={onClose} aria-label="Close settings">×</button></header>
   <nav className="bz85-settings-tabs" aria-label="Search settings pages">{([['preferences','Preferences'],['advanced','Advanced Search'],['history','History'],['privacy','Privacy & data']] as const).map(([id,label])=><button key={id} type="button" aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);setConfirm(null);}}>{label}</button>)}</nav>
   <div className="bz85-settings-scroll">
    {tab==='preferences'&&<>
     <section className="bz85-preference-section"><h3>Appearance</h3><p>Adjust only this browser's Search appearance.</p><div className="bz85-control-row"><label htmlFor="bzs86-theme">Theme</label><select id="bzs86-theme" value={dark?'dark':'light'} onChange={e=>onDarkChange(e.target.value==='dark')}><option value="dark">Neon black</option><option value="light">Pearl light</option></select></div></section>
     <section className="bz85-preference-section"><h3>Search preferences</h3><p>SafeSearch is requested from the connected search provider. Enforcement and supported operators depend on that provider.</p><div className="bz85-control-row"><label htmlFor="bzs86-safe">SafeSearch</label><select id="bzs86-safe" value={safe} onChange={e=>onSafeChange(e.target.value as Safety)}><option value="strict">Strict</option><option value="moderate">Moderate</option><option value="off">Off</option></select></div>
      <label className="bz85-switch-row"><span>Open results in a new tab<small>Use the same tab when disabled.</small></span><input type="checkbox" checked={prefs.newTab} onChange={e=>update('newTab',e.target.checked)}/></label>
      <label className="bz85-switch-row"><span>Recent search suggestions<small>Only your optional, browser-saved search history; no invented trends.</small></span><input type="checkbox" checked={prefs.suggestions} onChange={e=>update('suggestions',e.target.checked)}/></label>
      <label className="bz85-switch-row"><span>Spoken result excerpts<small>Uses your browser's text-to-speech where available.</small></span><input type="checkbox" checked={prefs.spokenAnswers} onChange={e=>update('spokenAnswers',e.target.checked)}/></label>
     </section>
     <section className="bz85-preference-section"><h3>Language & region</h3><p>Language controls voice recognition. Search results are returned by the configured provider, which may independently determine result language.</p><div className="bz85-control-row"><label htmlFor="bzs86-language">Voice input language</label><select id="bzs86-language" value={prefs.language} onChange={e=>update('language',e.target.value)}>{INPUT_LANGUAGES.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></div>
      <label className="bz85-switch-row"><span>Automatic search region<small>{['edge-ip','geoip'].includes(regionInfo.source)?'Approximate network country':'Browser-locale fallback if no trusted network country is available'}</small></span><input type="checkbox" checked={autoRegion} onChange={e=>onAutoRegionChange(e.target.checked)}/></label>
      <div className="bz85-control-row"><label htmlFor="bzs86-country">Region</label><select id="bzs86-country" value={COUNTRY_OPTIONS.some(([code])=>code===country)?country:'ALL'} disabled={autoRegion} onChange={e=>onCountryChange(e.target.value)}>{COUNTRY_OPTIONS.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></div><p className="bz85-note">{autoRegion?regionInfo.label:country} · {autoRegion?'Automatic':'Manual'}. VPNs and deployment configuration can affect IP detection.</p>
     </section>
    </>}
    {tab==='advanced'&&<section className="bz85-preference-section bz86-advanced"><h3>Advanced Search</h3><p>Construct an explicit search query. Operator availability depends on the search provider.</p><label>All these words<input value={words} onChange={e=>setWords(e.target.value)} placeholder="e.g. renewable energy"/></label><label>Exact phrase<input value={phrase} onChange={e=>setPhrase(e.target.value)} placeholder="a quoted phrase"/></label><label>Exclude words<input value={exclude} onChange={e=>setExclude(e.target.value)} placeholder="words to omit"/></label><label>Within a website<input value={site} onChange={e=>setSite(e.target.value)} placeholder="example.org"/></label><label>File type<select value={filetype} onChange={e=>setFiletype(e.target.value)}><option value="">Any</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="pptx">PPTX</option><option value="csv">CSV</option></select></label><button className="bz85-primary-link" type="button" onClick={build}>Use this query ↗</button><p className="bz85-note">This builder sends a normal text query; it does not enable unsupported backend filters.</p></section>}
    {tab==='history'&&<section className="bz85-preference-section"><h3>Local Search history</h3><p>Off by default. Turning this on stores search terms in this browser only. It does not activate provider history or BazID account sync.</p><label className="bz85-switch-row"><span>Save searches on this device<small>Up to 80 unique, recent entries.</small></span><input type="checkbox" checked={historyEnabled} onChange={e=>onHistoryEnabledChange(e.target.checked)}/></label><div className="bz85-data-pill">{history.length} locally saved {history.length===1?'query':'queries'}</div>
     {history.length>0&&<div className="bz86-history-list">{history.slice(0,15).map(item=><div key={`${item.at}-${item.category}`}><span>{item.q}<small>{item.category} · {new Date(item.at).toLocaleString()}</small></span></div>)}</div>}
     {history.length>0&&(confirm==='history'?<div className="bz85-confirm"><p>Clear local history from this browser? This will not affect your search provider or BazID.</p><button onClick={()=>{onClearHistory();setConfirm(null);}}>Delete local history</button><button onClick={()=>setConfirm(null)}>Cancel</button></div>:<button className="bz85-danger-button" onClick={()=>setConfirm('history')}>Clear local history</button>)}
     <button type="button" className="bz85-primary-link" onClick={onExport}>Export local Search data</button><p className="bz85-note">Export includes browser history, saved links and preferences—not provider-held records.</p>
    </section>}
    {tab==='privacy'&&<>
     <section className="bz85-preference-section"><h3>Data handling in this Search build</h3><p>Queries are sent through BAZAARA's same-origin Search route to its configured third-party provider. This browser can optionally save history; bookmarks and preferences remain local. The provider and any infrastructure may process requests under their own terms.</p><p>No account-level deletion or retention guarantee is implied by these browser controls.</p></section>
     <a className="bz85-primary-link" href="/search-data" target="_blank" rel="noopener noreferrer">Read Search data-handling notes ↗</a>
     <section className="bz85-preference-section"><h3>Saved result links</h3><div className="bz85-data-pill">{savedCount} saved in this browser</div>{savedCount>0&&(confirm==='saved'?<div className="bz85-confirm"><p>Delete browser-saved links?</p><button onClick={()=>{onClearSaved();setConfirm(null);}}>Delete links</button><button onClick={()=>setConfirm(null)}>Cancel</button></div>:<button className="bz85-danger-button" onClick={()=>setConfirm('saved')}>Clear saved links</button>)}</section>
     <section className="bz85-preference-section"><h3>Camera, microphone & files</h3><p>Browser permissions control camera and microphone. BazLens images are transmitted when you explicitly request analysis. V8.6 text attachments are read locally; only inserted excerpts enter a submitted search query.</p></section>
     <section className="bz85-preference-section"><h3>BazID account</h3><p>Use BazID for existing account/security features. This Search release does not claim to synchronize search history or implement account-level data deletion.</p>{bazidHref?<a className="bz85-primary-link" href={bazidHref}>Open BazID account ↗</a>:<p className="bz85-note">BazID URL is not configured for this deployment.</p>}</section>
     <button type="button" className="bz85-primary-link" onClick={onExport}>Export local Search data</button>
    </>}
   </div><footer className="bz85-settings-foot"><span className="bz85-ribbon-mark">B</span> BAZAARA Search · Your choices, clearly presented</footer>
  </div>
 </div>;
}
