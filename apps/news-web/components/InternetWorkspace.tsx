'use client';

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Kind = 'bmap' | 'translate' | 'news' | 'bazlens';
type Item = { id: string; title: string; body: string; createdAt: string };
type SavedFields = {
  v: 1;
  notes?: string;
  url?: string;
  source?: string;
  target?: string;
  original?: string;
  translated?: string;
  filename?: string;
  mime?: string;
  bytes?: number;
  width?: number;
  height?: number;
};
type App = { kind: Kind; name: string; port: number; label: string; intro: string; detail: string; color: string; icon: string };
const apps: App[] = [
  {kind:'bmap',name:'BMap',port:3038,label:'Saved places',intro:'Your places, organized.',detail:'Keep destinations and location notes together, then explore them in OpenStreetMap.',color:'#0c928b',icon:'⌖'},
  {kind:'translate',name:'Translate',port:3039,label:'Language workspace',intro:'Words without borders.',detail:'Prepare language drafts, translate with an optional connected provider and save the result.',color:'#0e8a77',icon:'文'},
  {kind:'news',name:'News',port:3040,label:'Reading sources',intro:'Follow what matters.',detail:'Build your own source list, organize topics and choose where to read.',color:'#2477bf',icon:'▤'},
  {kind:'bazlens',name:'BazLens',port:3041,label:'Visual workspace',intro:'See the details.',detail:'Review images locally, capture their metadata and keep research notes.',color:'#7654cb',icon:'◉'},
];
const languages = [
  ['auto','Detect language'],['en','English'],['fr','French'],['es','Spanish'],['pt','Portuguese'],
  ['ar','Arabic'],['de','German'],['it','Italian'],['zh','Chinese'],['ja','Japanese'],
  ['ko','Korean'],['hi','Hindi'],['ru','Russian'],['sw','Swahili'],
] as const;
const formatBytes = (n: number) => n < 1024 * 1024 ? `${Math.max(1,Math.round(n / 1024))} KB` : `${(n / (1024*1024)).toFixed(1)} MB`;
function readFields(raw: string): SavedFields {
  if (!raw.startsWith('BZ_INTERNET_1|')) return {v:1, notes:raw};
  try {
    const value: unknown = JSON.parse(raw.slice('BZ_INTERNET_1|'.length));
    if (value && typeof value === 'object' && 'v' in value && (value as SavedFields).v === 1) return value as SavedFields;
  } catch { /* display older records as text */ }
  return {v:1,notes:raw};
}
function encodeFields(value: SavedFields): string {
  const body = 'BZ_INTERNET_1|' + JSON.stringify(value);
  if (body.length > 4000) throw new Error('This entry is too long. Shorten its text before saving.');
  return body;
}
function urlFor(slug: string, port: number): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return `${window.location.protocol}//${host}:${port}/`;
  try {
    const config = JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}') as Record<string,string>;
    const target = config[slug];
    if (typeof target === 'string' && target.startsWith('https://')) return target;
  } catch { /* no deployment URL was configured */ }
  return null;
}
function Magnifier({size=19}:{size?:number}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.2 16.2 5 5"/></svg>}
function ExternalIcon(){return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 5h6v6m0-6-9 9"/><path d="M19 14v5H5V5h5"/></svg>}
function iconLabel(kind: Kind) {return apps.find(a=>a.kind===kind)!;}

export default function InternetWorkspace({kind}:{kind:Kind}) {
  const app = iconLabel(kind);
  const [items,setItems] = useState<Item[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [deleting,setDeleting] = useState<string|null>(null);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [name,setName] = useState('');
  const [notes,setNotes] = useState('');
  const [url,setUrl] = useState('');
  const [source,setSource] = useState('auto');
  const [target,setTarget] = useState('fr');
  const [original,setOriginal] = useState('');
  const [translated,setTranslated] = useState('');
  const [translating,setTranslating] = useState(false);
  const [providerConnected,setProviderConnected] = useState(false);
  const [selectedFile,setSelectedFile] = useState<File|null>(null);
  const [preview,setPreview] = useState('');
  const [dimensions,setDimensions] = useState<{width:number;height:number}|null>(null);
  const [dragged,setDragged] = useState(false);
  const [query,setQuery] = useState('');
  const [view,setView] = useState<'overview'|'library'|'about'>('overview');
  const [links,setLinks] = useState<Record<string,string>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string>('');
  
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/items',{cache:'no-store',credentials:'same-origin'});
      const body: unknown = await response.json();
      const parsed = body as {items?:Item[];error?:string};
      if (!response.ok) throw new Error(parsed.error || 'Your saved items are temporarily unavailable.');
      setItems(Array.isArray(parsed.items) ? parsed.items : []);
      setError('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not load your items.'); }
    finally { setLoading(false); }
  },[]);

  useEffect(() => {void load();},[load]);
  useEffect(() => {
    const urls: Record<string,string> = {};
    for (const [slug,port] of [['search',3020],['bmap',3038],['translate',3039],['news',3040],['bazlens',3041],['workspace',3021]] as const) {
      const href = urlFor(slug,port);
      if (href) urls[slug] = href;
    }
    setLinks(urls);
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();setView('library');requestAnimationFrame(()=>searchRef.current?.focus());
      }
    };
    window.addEventListener('keydown',shortcut);
    return () => window.removeEventListener('keydown',shortcut);
  },[]);
  useEffect(() => {
    if (kind !== 'translate') return;
    let active=true;
    fetch('/api/translate',{cache:'no-store'}).then(r=>r.json()).then((data: {configured?:boolean}) => {
      if (active) setProviderConnected(data.configured===true);
    }).catch(()=>{ if(active) setProviderConnected(false); });
    return ()=>{active=false;};
  },[kind]);
  useEffect(() => {
    if (!selectedFile) { if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current='';setPreview('');setDimensions(null);return; }
    const imageUrl = URL.createObjectURL(selectedFile);
    previewRef.current = imageUrl;
    setPreview(imageUrl);
    const img = new Image();
    img.onload = () => setDimensions({width:img.naturalWidth,height:img.naturalHeight});
    img.onerror = () => setError('This file cannot be previewed as an image.');
    img.src=imageUrl;
    return () => {img.onload=null;img.onerror=null;URL.revokeObjectURL(imageUrl);if(previewRef.current===imageUrl)previewRef.current='';};
  },[selectedFile]);

  const filtered = useMemo(() => {
    const term=query.trim().toLowerCase();
    return term ? items.filter(x=> `${x.title} ${readFields(x.body).notes||''} ${readFields(x.body).original||''}`.toLowerCase().includes(term)) : items;
  },[items,query]);
  function pickFile(file:File|undefined) {
    if (!file) return;
    setError('');setNotice('');
    if (!file.type.startsWith('image/')) {setError('Choose an image file (PNG, JPEG, WebP or GIF).');return;}
    if (file.size > 10*1024*1024) {setError('Image exceeds the 10 MB limit.');return;}
    setSelectedFile(file);
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, '').slice(0,120));
  }
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('');setNotice('');
    const title=name.trim() || (kind==='translate'?original.trim().slice(0,75):kind==='bazlens'?selectedFile?.name.replace(/\.[^.]+$/,''):'');
    if (!title) {setError('A title is required.');return;}
    if (kind==='news' && url.trim()) {
      try {const parsed=new URL(url.trim());if (!['https:','http:'].includes(parsed.protocol))throw new Error();}
      catch {setError('Use a valid http:// or https:// source URL.');return;}
    }
    let fields:SavedFields={v:1,notes:notes.trim()};
    if (kind==='news') fields={...fields,url:url.trim()};
    if (kind==='translate') fields={...fields,source,target,original:original.trim(),translated:translated.trim()};
    if (kind==='bazlens' && selectedFile) fields={...fields,filename:selectedFile.name.slice(0,200),mime:selectedFile.type,bytes:selectedFile.size,width:dimensions?.width,height:dimensions?.height};
    let body:string;
    try {body=encodeFields(fields);}catch(e){setError(e instanceof Error?e.message:'Entry is too long.');return;}
    setSaving(true);
    try {
      const response=await fetch('/api/items',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({title:title.slice(0,120),body})});
      const data=await response.json() as {error?:string};
      if (!response.ok)throw new Error(data.error||'Unable to save this item.');
      setName('');setNotes('');setUrl('');setOriginal('');setTranslated('');setSelectedFile(null);
      if(inputFileRef.current)inputFileRef.current.value='';
      setNotice(kind==='bazlens'?'Scan metadata and notes saved. The image itself was not uploaded.':'Saved to your workspace.');
      await load();
    } catch(e){setError(e instanceof Error?e.message:'Save failed.');}
    finally{setSaving(false);}
  }
  async function remove(item:Item) {
    if (!window.confirm(`Delete "${item.title}"? This action cannot be undone.`))return;
    setDeleting(item.id);setNotice('');setError('');
    try {
      const response=await fetch('/api/items/'+encodeURIComponent(item.id),{method:'DELETE',credentials:'same-origin'});
      if(!response.ok)throw new Error('Delete failed. Please try again.');
      setItems(current=>current.filter(x=>x.id!==item.id));setNotice('Item deleted.');
    } catch(e){setError(e instanceof Error?e.message:'Delete failed.');}
    finally{setDeleting(null);}
  }
  async function translateNow(){
    if (!original.trim()||!providerConnected)return;
    setTranslating(true);setError('');setNotice('');setTranslated('');
    try {
      const response=await fetch('/api/translate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({text:original.trim(),source,target})});
      const payload=await response.json() as {translation?:string;message?:string};
      if(!response.ok||typeof payload.translation!=='string')throw new Error(payload.message||'Translation unavailable.');
      setTranslated(payload.translation);setNotice('Translation complete. Save the entry to keep it.');
    }catch(e){setError(e instanceof Error?e.message:'Translation unavailable.');}
    finally{setTranslating(false);}
  }
  async function copy(text:string){
    try {await navigator.clipboard.writeText(text);setNotice('Copied to clipboard.');setError('');}
    catch {setError('Clipboard access unavailable. Select and copy the text manually.');}
  }
  function speak(text:string,lang:string){
    if (!('speechSynthesis' in window)) {setError('Text-to-speech is not supported by this browser.');return;}
    const message=new SpeechSynthesisUtterance(text);if(lang!=='auto')message.lang=lang;
    window.speechSynthesis.cancel();window.speechSynthesis.speak(message);
  }
  function clearSearch(event:ReactKeyboardEvent<HTMLInputElement>){if(event.key==='Escape'){setQuery('');searchRef.current?.blur();}}
  return <div className={`internet-product internet-product--${kind}`}>
    <div className="iw-orb iw-orb-a" aria-hidden="true"/><div className="iw-orb iw-orb-b" aria-hidden="true"/>
    <header className="iw-header"><div className="iw-header-inner">
      <a className="iw-brand" href="/" aria-label={`${app.name} home`}><span className="iw-brand-mark" aria-hidden="true">◈</span><span className="iw-brand-text">BAZAARA <span>/{app.name}</span></span></a>
      <span className="iw-category">ECOSYSTEM 3 <span aria-hidden="true">/</span> INTERNET</span>
      <div className="iw-header-actions">{links.workspace&&<a className="iw-back" href={links.workspace}>Workspace <ExternalIcon/></a>}<span className="iw-privacy"><span className="iw-status-dot"/> Local preview</span></div>
    </div></header>
    <div className="iw-frame">
      <nav className="iw-product-nav" aria-label="Internet applications">
        {[{kind:'search',name:'Search',port:3020,icon:'⌕'},...apps].map(entry => {
          const href=links[entry.kind];const current=kind===entry.kind;
          return current ? <span className="iw-nav-item iw-nav-current" aria-current="page" key={entry.kind}><span className="iw-nav-glyph" aria-hidden="true">{entry.icon}</span>{entry.name}</span>:
            href?<a className="iw-nav-item" key={entry.kind} href={href}><span className="iw-nav-glyph" aria-hidden="true">{entry.icon}</span>{entry.name}</a>:
            <span className="iw-nav-item iw-nav-disabled" title="Configure the production URL to enable this link" key={entry.kind}>{entry.name}</span>;
        })}
      </nav>
      <main className="iw-main">
        <div className="iw-hero"><div className="iw-hero-copy"><div className="iw-kicker"><span className="iw-kicker-dot"/>{app.label.toUpperCase()}</div><h1>{app.intro}</h1><p>{app.detail}</p><div className="iw-hero-actions"><button type="button" className={`iw-action ${view==='overview'?'iw-action-active':''}`} onClick={()=>setView('overview')}>Overview</button><button type="button" className={`iw-action ${view==='library'?'iw-action-active':''}`} onClick={()=>setView('library')}>Your {kind==='bmap'?'places':kind==='translate'?'entries':kind==='news'?'sources':'scans'} <span className="iw-number">{items.length}</span></button><button type="button" className={`iw-action ${view==='about'?'iw-action-active':''}`} onClick={()=>setView('about')}>About</button></div></div><div className="iw-hero-art" aria-hidden="true"><span className="iw-art-grid"/><span className="iw-art-ring iw-art-ring-a"/><span className="iw-art-ring iw-art-ring-b"/><strong>{app.icon}</strong><span className="iw-art-caption">BAZAARA / INTERNET</span></div></div>
        {error&&<div className="iw-message iw-message-error" role="alert">{error}<button type="button" onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
        {notice&&<div className="iw-message iw-message-success" role="status">{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Dismiss notification">×</button></div>}
        {view==='about' ? <section className="iw-card iw-about"><span className="iw-small-label">PRODUCT STATUS</span><h2>{app.name} · local alpha</h2>{kind==='bmap'?<p>Saved places, location notes and external OpenStreetMap discovery work. Interactive in-app maps and turn-by-turn routing require a separately configured mapping service.</p>:kind==='translate'?<p>Drafts and per-user translation history work. Actual translation requires an explicitly configured external or self-hosted LibreTranslate-compatible endpoint. Text is sent to that provider only when you request translation.</p>:kind==='news'?<p>Create your own source library and topics. Live aggregated articles, automatic feed retrieval and personalization are not enabled in this alpha.</p>:<p>Image selection and preview run on your device. You may store filenames, dimensions and notes. Image uploads, OCR and AI recognition require a reviewed inference/storage integration.</p>}<p>Your saved items continue to use the existing BAZAARA product API. This update does not change its storage format for older items.</p></section> : <>
        {view==='overview'&&<div className="iw-overview-grid"><section className="iw-card iw-compose"><div className="iw-card-heading"><div><span className="iw-small-label">YOUR WORKSPACE</span><h2>{kind==='bmap'?'Save a place':kind==='translate'?'Translate or draft':kind==='news'?'Follow a source':'Inspect an image'}</h2></div><span className="iw-card-icon" aria-hidden="true">{app.icon}</span></div>
          <form className="iw-form" onSubmit={create}>
            {kind==='bazlens'&&<div className={`iw-dropzone ${dragged?'iw-dragging':''}`} onDragOver={e=>{e.preventDefault();setDragged(true);}} onDragLeave={()=>setDragged(false)} onDrop={e=>{e.preventDefault();setDragged(false);pickFile(e.dataTransfer.files?.[0]);}}>
              <input ref={inputFileRef} id="iw-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>pickFile(e.target.files?.[0])} className="iw-file-input"/>
              {preview?<div className="iw-preview"><img src={preview} alt="Preview of selected image"/><div className="iw-preview-caption">{selectedFile?.name} · {selectedFile?formatBytes(selectedFile.size):''} {dimensions?`· ${dimensions.width} × ${dimensions.height}`:''}</div></div>:<label htmlFor="iw-file" className="iw-drop-label"><span aria-hidden="true">⬡</span><strong>Choose or drop an image</strong><small>Local preview · PNG, JPG, WebP, GIF · Max 10 MB</small></label>}
              {preview&&<div className="iw-drop-controls"><label htmlFor="iw-file" className="iw-light-btn">Change image</label><button type="button" className="iw-light-btn" onClick={()=>{setSelectedFile(null);if(inputFileRef.current)inputFileRef.current.value='';}}>Remove</button></div>}
            </div>}
            {kind==='translate'&&<><div className="iw-pair"><label>From<select value={source} onChange={e=>{setSource(e.target.value);setTranslated('');}}>{languages.map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></label><button type="button" className="iw-swap" aria-label="Swap languages" disabled={source==='auto'} onClick={()=>{const from=source;setSource(target);setTarget(from);setTranslated('');}}>⇄</button><label>To<select value={target} onChange={e=>{setTarget(e.target.value);setTranslated('');}}>{languages.filter(([code])=>code!=='auto').map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></label></div><label className="iw-field">Text to translate<textarea maxLength={2200} value={original} onChange={e=>{setOriginal(e.target.value);setTranslated('');}} placeholder="Enter text in your source language…" rows={5}/></label><div className="iw-inline"><span className={`iw-provider-status ${providerConnected?'iw-provider-ready':''}`}>{providerConnected?'Translation provider connected':'Translation provider not connected'}</span><span>{original.length}/2,200</span></div><div className="iw-inline iw-translate-actions"><button type="button" className="iw-light-btn" disabled={!original.trim()} onClick={()=>speak(original,source)}>Listen</button><button type="button" className="iw-light-btn" disabled={!original.trim()} onClick={()=>void copy(original)}>Copy</button><button type="button" className="iw-action-primary" disabled={!original.trim()||!providerConnected||translating} onClick={()=>void translateNow()}>{translating?'Translating…':'Translate'}</button></div>{translated&&<div className="iw-translation-output"><div className="iw-inline"><strong>Translation</strong><button type="button" className="iw-light-btn" onClick={()=>void copy(translated)}>Copy</button></div><p>{translated}</p></div>}</>}
            <label className="iw-field">{kind==='bmap'?'Place name':kind==='translate'?'Entry title (optional)':kind==='news'?'Source or topic name':'Scan title'}<input maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder={kind==='bmap'?'e.g. Port Harcourt City Mall':kind==='translate'?'e.g. Project introduction':kind==='news'?'e.g. Technology and innovation':'e.g. Reference photograph'} required={kind==='bmap'||kind==='news'}/></label>
            {kind==='news'&&<label className="iw-field">Source URL (optional)<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.org/news" maxLength={800}/></label>}
            <label className="iw-field">{kind==='bmap'?'Place notes':kind==='translate'?'Context / notes':kind==='news'?'Why follow this source?':'Observations'}<textarea rows={3} value={notes} maxLength={kind==='translate'?400:kind==='bazlens'?700:1500} onChange={e=>setNotes(e.target.value)} placeholder={kind==='bmap'?'Address, directions or a useful detail…':kind==='translate'?'Audience, terminology or context…':kind==='news'?'What do you want to follow?':'What do you want to remember about this image?…'}/></label>
            <div className="iw-submit-row"><button type="submit" className="iw-action-primary" disabled={saving||(!name.trim()&&!(kind==='translate'&&original.trim())&&!(kind==='bazlens'&&selectedFile))}>{saving?'Saving…':kind==='bmap'?'Save place':kind==='translate'?'Save entry':kind==='news'?'Save source':'Save scan details'} <span aria-hidden="true">↗</span></button>{kind==='bazlens'&&<small>Image remains on this device. Only its metadata and notes are saved.</small>}</div>
          </form>
        </section><aside className="iw-insight"><section className="iw-card iw-insight-card"><span className="iw-small-label">YOUR LIBRARY</span><strong className="iw-big-count">{items.length.toString().padStart(2,'0')}</strong><p>{kind==='bmap'?'Saved destinations':kind==='translate'?'Language entries':kind==='news'?'Followed sources':'Saved scan records'}</p><button className="iw-text-link" type="button" onClick={()=>setView('library')}>View library <span>↗</span></button></section><section className="iw-card iw-support-card"><span className="iw-small-label">GOOD TO KNOW</span><h3>{kind==='bmap'?'Choose where to explore':kind==='translate'?'You control text sharing':kind==='news'?'Follow sources you trust':'Designed for local inspection'}</h3><p>{kind==='bmap'?'Places open in OpenStreetMap for exploration. BMap does not claim live routing in this alpha.':kind==='translate'?'Your drafts can be saved without sending them to a translation provider.':kind==='news'?'BAZAARA does not invent news articles. Add a source link to open its original website.':'Selecting an image does not upload it. Review metadata before saving your notes.'}</p></section></aside></div>}
        <section className="iw-card iw-library" id="library"><div className="iw-library-heading"><div><span className="iw-small-label">RECENT ACTIVITY</span><h2>{kind==='bmap'?'Your places':kind==='translate'?'Your language entries':kind==='news'?'Your sources':'Your scans'}</h2><p>Records you save here are retrieved from the existing product API.</p></div><div className="iw-library-actions"><label className="iw-search-input"><Magnifier size={18}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={clearSearch} placeholder="Search saved items" aria-label="Search saved items"/><kbd>⌘ K</kbd></label><button className="iw-light-btn" type="button" onClick={()=>void load()} disabled={loading}>Refresh</button></div></div>
        <div className="iw-list" aria-live="polite" aria-busy={loading}>{loading?<div className="iw-empty"><span className="iw-spinner"/> Loading your library…</div>:filtered.length===0?<div className="iw-empty"><span className="iw-empty-icon" aria-hidden="true">{app.icon}</span><strong>{query?'No matching items yet':`No ${kind==='bmap'?'places':kind==='translate'?'entries':kind==='news'?'sources':'scans'} saved`}</strong><p>{query?'Try a shorter search.':'Use the workspace above to create your first entry.'}</p></div>:filtered.map((item)=>{
          const details=readFields(item.body);
          let sourceHref:string|null=null;
          if (kind==='news'&&details.url) {try{const parsed=new URL(details.url);if(['http:','https:'].includes(parsed.protocol))sourceHref=parsed.href;}catch{/* legacy record */}}
          const mapHref=kind==='bmap'?`https://www.openstreetmap.org/search?query=${encodeURIComponent(item.title)}`:null;
          return <article className="iw-item" key={item.id}><div className="iw-item-icon" aria-hidden="true">{app.icon}</div><div className="iw-item-main"><h3>{item.title}</h3><span className="iw-item-meta">{new Date(item.createdAt).toLocaleString()}{kind==='bazlens'&&details.filename?` · ${details.filename}`:''}{kind==='translate'&&details.source&&details.target?` · ${details.source} → ${details.target}`:''}</span>{kind==='translate'&&details.original&&<p className="iw-item-text">{details.original}</p>}{kind==='translate'&&details.translated&&<p className="iw-item-translated">{details.translated}</p>}{details.notes&&<p className="iw-item-text">{details.notes}</p>}{kind==='bazlens'&&details.width&&details.height&&<span className="iw-item-meta">{details.width} × {details.height}{details.bytes?` · ${formatBytes(details.bytes)}`:''} · Image not stored</span>}<div className="iw-item-links">{sourceHref&&<a href={sourceHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open source <ExternalIcon/></a>}{mapHref&&<a href={mapHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Explore map <ExternalIcon/></a>}{kind==='translate'&&details.translated&&<button onClick={()=>void copy(details.translated||'')}>Copy translation</button>}</div></div><button type="button" className="iw-delete" onClick={()=>void remove(item)} disabled={deleting===item.id} aria-label={`Delete ${item.title}`}>{deleting===item.id?'Deleting…':'Delete'}</button></article>;
        })}</div></section>
        </>}
      </main>
      <footer className="iw-footer"><span>© 2026 BAZAARA <span className="iw-separator">·</span> Internet suite</span><span>Connected by the BAZAARA platform <span className="iw-separator">/</span> BazID</span></footer>
    </div>
  </div>;
}
