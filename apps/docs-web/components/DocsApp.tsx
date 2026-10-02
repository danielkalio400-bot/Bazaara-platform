'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';

import {Dialog,Field,ImportButton,Notice,download,useCollection,uid,now} from '../../../packages/flagship-ui/src/core';
type Snapshot={id:string;documentId:string;title:string;markdown:string;updated:string};
const validSnapshot=(v:unknown):v is Snapshot=>{const x=v as Snapshot;return !!x&&['id','documentId','title','markdown','updated'].every(k=>typeof (x as unknown as Record<string,unknown>)[k]==='string');};
type DocSummary={id:string,title:string,revision:number,createdAt:string,updatedAt:string,words:number,chars:number};
type Doc=DocSummary&{markdown:string};
type Listing={documents:DocSummary[],limit:number};
type SaveState='saved'|'saving'|'dirty'|'error';
const templates={
  blank:{title:'Untitled document',markdown:''},
  meeting:{title:'Meeting notes',markdown:'# Meeting notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n- \n\n## Decisions\n\n- \n\n## Actions\n\n- [ ] '},
  brief:{title:'Project brief',markdown:'# Project brief\n\n## Objective\n\nDescribe the outcome this work should achieve.\n\n## Context\n\n\n## Scope\n\n- \n\n## Success measures\n\n- \n\n## Next steps\n\n- [ ] '}
};
function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}
function inlineMarkdown(raw:string){
  let s=escapeHtml(raw);
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/__([^_]+)__/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/~~([^~]+)~~/g,'<del>$1</del>');
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_m,label,url)=>{
    const decoded=String(url).replace(/&amp;/g,'&').trim();
    if(!/^(https?:\/\/|mailto:)/i.test(decoded))return label;
    return `<a href="${escapeHtml(decoded)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return s;
}
function renderMarkdown(md:string){
  const lines=md.replace(/\r\n?/g,'\n').split('\n');const out:string[]=[];let list:null|'ul'|'ol'=null;
  const close=()=>{if(list){out.push(`</${list}>`);list=null;}};
  for(const line of lines){
    if(/^###\s+/.test(line)){close();out.push(`<h3>${inlineMarkdown(line.replace(/^###\s+/,''))}</h3>`);continue;}
    if(/^##\s+/.test(line)){close();out.push(`<h2>${inlineMarkdown(line.replace(/^##\s+/,''))}</h2>`);continue;}
    if(/^#\s+/.test(line)){close();out.push(`<h1>${inlineMarkdown(line.replace(/^#\s+/,''))}</h1>`);continue;}
    if(/^>\s?/.test(line)){close();out.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/,''))}</blockquote>`);continue;}
    if(/^[-*]\s+/.test(line)){if(list!=='ul'){close();out.push('<ul>');list='ul';}out.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/,''))}</li>`);continue;}
    if(/^\d+\.\s+/.test(line)){if(list!=='ol'){close();out.push('<ol>');list='ol';}out.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/,''))}</li>`);continue;}
    close(); if(!line.trim()){out.push('<p><br/></p>');continue;} out.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  close();return out.join('');
}
async function json(res:Response){try{return await res.json();}catch{return {message:'Unexpected server response.'}}}
export default function DocsApp(){
  const [docs,setDocs]=useState<DocSummary[]>([]),[active,setActive]=useState<Doc|null>(null),[title,setTitle]=useState(''),[markdown,setMarkdown]=useState(''),[authorized,setAuthorized]=useState(true),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[saveState,setSaveState]=useState<SaveState>('saved'),[mode,setMode]=useState<'write'|'preview'>('write'),[query,setQuery]=useState(''),[showTemplates,setShowTemplates]=useState(false),[renameTarget,setRenameTarget]=useState<DocSummary|null>(null),[renameDraft,setRenameDraft]=useState(''),[renameBusy,setRenameBusy]=useState(false),[renameError,setRenameError]=useState('');
  const [findText,setFindText]=useState(''),[replacement,setReplacement]=useState(''),[showFind,setShowFind]=useState(false),[showHistory,setShowHistory]=useState(false);
  const snapshots=useCollection<Snapshot>('docs-snapshots',validSnapshot);
  const textarea=useRef<HTMLTextAreaElement>(null),renameInput=useRef<HTMLInputElement>(null),renameInvoker=useRef<HTMLElement|null>(null),saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null),saveInFlight=useRef<Promise<boolean>|null>(null),latest=useRef({title:'',markdown:'',revision:0,id:''}),lastSaved=useRef({title:'',markdown:'',id:''});
  const refresh=useCallback(async()=>{try{const r=await fetch('/api/docs',{cache:'no-store'}),body=await json(r);if(r.status===401){setAuthorized(false);setDocs([]);setMessage('Sign in with BazID to use Docs.');return;}if(!r.ok)throw new Error(body.message||'Unable to load Docs.');setAuthorized(true);setDocs((body as Listing).documents);setMessage('');}catch(e){setMessage(e instanceof Error?e.message:'Unable to connect to Docs.');}finally{setLoading(false)}},[]);
  useEffect(()=>{void refresh();return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)}},[refresh]);
  useEffect(()=>{if(renameTarget)renameInput.current?.focus();},[renameTarget]);
  const open=useCallback(async(id:string)=>{if(saveState!=='saved'){const saved=await saveNow();if(!saved)return;}try{setLoading(true);const r=await fetch(`/api/docs/${id}`,{cache:'no-store'}),body=await json(r);if(!r.ok)throw new Error(body.message||'Unable to open document.');const d=body as Doc;setActive(d);setTitle(d.title);setMarkdown(d.markdown);latest.current={title:d.title,markdown:d.markdown,revision:d.revision,id:d.id};lastSaved.current={title:d.title,markdown:d.markdown,id:d.id};setSaveState('saved');setMode('write');setMessage('');history.replaceState(null,'',`?doc=${d.id}`);}catch(e){setMessage(e instanceof Error?e.message:'Unable to open document.');}finally{setLoading(false)}},[saveState]);
  useEffect(()=>{if(!authorized||loading||active)return;const id=new URLSearchParams(location.search).get('doc');if(id&&/^[a-f0-9]{32}$/.test(id))void open(id);},[authorized,loading,active,open]);
  async function create(template:keyof typeof templates='blank'){if(!await saveNow())return;try{const value=templates[template];const r=await fetch('/api/docs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}),body=await json(r);if(!r.ok)throw new Error(body.message||'Unable to create document.');setShowTemplates(false);await refresh();await open(body.id);}catch(e){setMessage(e instanceof Error?e.message:'Unable to create document.')}}
  async function saveNow():Promise<boolean>{
    if(saveTimer.current){clearTimeout(saveTimer.current);saveTimer.current=null;}
    // Wait for an existing save rather than sending concurrent PUTs with the same revision.
    while(saveInFlight.current){const previous=await saveInFlight.current;if(!previous)return false;}
    const payload={...latest.current};
    if(!payload.id)return true;
    if(lastSaved.current.id===payload.id&&lastSaved.current.title===payload.title&&lastSaved.current.markdown===payload.markdown){
      setSaveState('saved');return true;
    }
    setSaveState('saving');
    const operation=(async():Promise<boolean>=>{
      try{
        const r=await fetch(`/api/docs/${payload.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:payload.title,markdown:payload.markdown,expectedRevision:payload.revision})}),body=await json(r);
        if(r.status===409){setSaveState('error');setMessage('This document changed in another session. Reopen it before saving again.');return false;}
        if(!r.ok)throw new Error(body.message||'Unable to save document.');
        const updated=body as DocSummary;
        lastSaved.current={id:payload.id,title:updated.title,markdown:payload.markdown};
        if(latest.current.id===payload.id){
          latest.current.revision=updated.revision;
          const newerChanges=latest.current.title!==payload.title||latest.current.markdown!==payload.markdown;
          if(!newerChanges){latest.current.title=updated.title;setTitle(updated.title);}
          setActive(a=>a?.id===updated.id?{...a,...updated,markdown:latest.current.markdown}:a);
          setSaveState(newerChanges?'dirty':'saved');
          if(newerChanges&&!saveTimer.current){saveTimer.current=setTimeout(()=>void saveNow(),850);}
        }
        setDocs(list=>list.map(d=>d.id===updated.id?updated:d).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
        return true;
      }catch(e){setSaveState('error');setMessage(e instanceof Error?e.message:'Autosave failed.');return false;}
    })();
    saveInFlight.current=operation;
    let ok=false;try{ok=await operation;}
    finally{if(saveInFlight.current===operation)saveInFlight.current=null;}
    if(ok&&latest.current.id===payload.id&&(latest.current.title!==lastSaved.current.title||latest.current.markdown!==lastSaved.current.markdown))return saveNow();
    return ok;
  }
  function dirty(nextTitle=title,nextMarkdown=markdown){if(!active)return;latest.current={title:nextTitle,markdown:nextMarkdown,revision:latest.current.revision,id:active.id};setSaveState('dirty');if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>void saveNow(),850);}
  function changeTitle(v:string){setTitle(v);dirty(v,markdown)}
  function changeMarkdown(v:string){setMarkdown(v);dirty(title,v)}
  function beginRename(doc:DocSummary){
    if(renameBusy)return;
    renameInvoker.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setRenameTarget(doc);setRenameDraft(doc.title);setRenameError('');
  }
  function dismissRename(){if(!renameBusy){setRenameTarget(null);setRenameError('');requestAnimationFrame(()=>renameInvoker.current?.focus());}}
  async function commitRename(){
    if(!renameTarget||renameBusy)return;
    const target=renameTarget;
    const nextTitle=renameDraft.normalize('NFC').replace(/\s+/g,' ').trim();
    if(!nextTitle){setRenameError('Enter a document name.');renameInput.current?.focus();return;}
    if(nextTitle.length>100){setRenameError('Document names cannot exceed 100 characters.');return;}
    // Never overwrite the active editor's unsaved changes through a second request.
    if(active?.id===target.id&&saveState!=='saved'){
      setRenameError('Wait for the current document to finish saving, then try again.');
      return;
    }
    setRenameBusy(true);setRenameError('');
    try{
      // Fetch current content and revision so renaming never replaces the body with stale list data.
      const read=await fetch(`/api/docs/${target.id}`,{cache:'no-store'}),current=await json(read);
      if(!read.ok)throw new Error(current.message||'Unable to load this document.');
      const doc=current as Doc;
      if(nextTitle===doc.title){setRenameTarget(null);setRenameDraft('');requestAnimationFrame(()=>renameInvoker.current?.focus());return;}
      if(active?.id===target.id&&doc.revision!==latest.current.revision){
        throw new Error('This document was changed elsewhere. Reopen it before renaming.');
      }
      const result=await fetch(`/api/docs/${target.id}`,{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:nextTitle,markdown:doc.markdown,expectedRevision:doc.revision})
      });
      const response=await json(result);
      if(result.status===409)throw new Error('Document changed in another session. Reopen it and retry.');
      if(!result.ok)throw new Error(response.message||'Unable to rename document.');
      const updated=response as DocSummary;
      setDocs(list=>list.map(d=>d.id===updated.id?updated:d).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
      if(active?.id===updated.id){
        latest.current={...latest.current,title:updated.title,revision:updated.revision};
        lastSaved.current={...lastSaved.current,title:updated.title};
        setTitle(updated.title);
        setActive(old=>old?.id===updated.id?{...old,...updated}:old);
      }
      setRenameTarget(null);setRenameDraft('');setMessage('');requestAnimationFrame(()=>renameInvoker.current?.focus());
    }catch(e){setRenameError(e instanceof Error?e.message:'Unable to rename document.');}
    finally{setRenameBusy(false);}
  }
  async function remove(){if(!active||!confirm(`Delete “${title||'Untitled document'}” permanently?`))return;if(saveTimer.current){clearTimeout(saveTimer.current);saveTimer.current=null;}while(saveInFlight.current)await saveInFlight.current;try{const r=await fetch(`/api/docs/${active.id}`,{method:'DELETE'}),body=await json(r);if(!r.ok)throw new Error(body.message||'Unable to delete document.');setActive(null);setTitle('');setMarkdown('');latest.current={title:'',markdown:'',revision:0,id:''};lastSaved.current={title:'',markdown:'',id:''};if(saveTimer.current){clearTimeout(saveTimer.current);saveTimer.current=null;}history.replaceState(null,'',location.pathname);await refresh();}catch(e){setMessage(e instanceof Error?e.message:'Unable to delete document.')}}
  function wrap(before:string,after=before,placeholder='text'){
    const el=textarea.current;if(!el)return;const start=el.selectionStart,end=el.selectionEnd,selected=markdown.slice(start,end)||placeholder;const next=markdown.slice(0,start)+before+selected+after+markdown.slice(end);changeMarkdown(next);requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+before.length,start+before.length+selected.length)});
  }
  function linePrefix(prefix:string){const el=textarea.current;if(!el)return;const start=markdown.lastIndexOf('\n',Math.max(0,el.selectionStart-1))+1;const end=markdown.indexOf('\n',el.selectionEnd);const finish=end<0?markdown.length:end;const block=markdown.slice(start,finish).split('\n').map((line,i)=>`${prefix==='1. '?`${i+1}. `:prefix}${line}`).join('\n');const next=markdown.slice(0,start)+block+markdown.slice(finish);changeMarkdown(next);requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start,start+block.length)});
  }
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(latest.current.id&&(latest.current.title!==lastSaved.current.title||latest.current.markdown!==lastSaved.current.markdown)){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
  function replaceAll(){if(!findText)return;const count=markdown.split(findText).length-1;if(!count){setMessage('No exact matches.');return;}changeMarkdown(markdown.split(findText).join(replacement));setMessage(count+' replacements made.');}
  function snapshot(){if(!active)return;if(snapshots.mutate(rows=>[{id:uid(),documentId:active.id,title,markdown,updated:now()},...rows].filter((x,i,all)=>x.documentId!==active.id||all.slice(0,i).filter(y=>y.documentId===active.id).length<20)))setMessage('Device snapshot saved.');}
  const filtered=docs.filter(d=>d.title.toLowerCase().includes(query.trim().toLowerCase()));
  const preview=useMemo(()=>renderMarkdown(markdown),[markdown]);
  const status=saveState==='saved'?'Saved':saveState==='saving'?'Saving…':saveState==='dirty'?'Unsaved changes':'Save problem';
  return <div className="shell">
    <aside className="rail">
      <a className="brand" href="http://localhost:3021"><span className="mark">◇</span><span>BAZAARA <b>Docs</b><small>ECOSYSTEM 03</small></span></a>
      <button className="new" onClick={()=>setShowTemplates(v=>!v)} disabled={!authorized}>＋ New document</button>
      {showTemplates&&<div className="template-menu"><button onClick={()=>void create('blank')}><b>Blank</b><span>Start from a clean page</span></button><button onClick={()=>void create('meeting')}><b>Meeting notes</b><span>Agenda, decisions and actions</span></button><button onClick={()=>void create('brief')}><b>Project brief</b><span>Objective, scope and measures</span></button></div>}
      <label className="doc-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find documents"/></label>
      <div className="doc-list" role="list">{loading&&!docs.length?<div className="rail-empty">Loading…</div>:filtered.map(d=><div role="listitem" className={active?.id===d.id?'doc-row active':'doc-row'} key={d.id}><button type="button" className="doc-item" onClick={()=>void open(d.id)} disabled={renameBusy}><span className="doc-icon">≡</span><span className="doc-item-text"><b>{d.title}</b><small>{new Date(d.updatedAt).toLocaleDateString()} · {d.words} words</small></span></button><button type="button" className="doc-rename" onClick={()=>beginRename(d)} disabled={renameBusy} aria-label={`Rename ${d.title}`} title={`Rename ${d.title}`}>Rename</button></div>)}{!loading&&authorized&&!filtered.length&&<div className="rail-empty">{query?'No matches':'Create your first document.'}</div>}</div>
      <div className="rail-links"><a href="http://localhost:3022">□ Box</a><a href="http://localhost:3021">◈ Workspace</a><a href="http://localhost:3020">⌕ Search</a></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand">BAZAARA <b>Docs</b></div><div className="top-actions"><span className={`save ${saveState}`}>● {status}</span><span className="alpha">DEVELOPMENT ALPHA</span><a href="http://localhost:3004/account">BazID ↗</a></div></header>
      {message&&<div className="alert" role="alert">{message}{!authorized&&<a href="http://localhost:3004">Open BazID ↗</a>}<button onClick={()=>setMessage('')}>×</button></div>}
      {!authorized?<section className="welcome"><span className="eyebrow">CONNECTED PRODUCTIVITY</span><h1>Your ideas, in one focused space.</h1><p>Sign in with your existing BazID to create documents stored through Bazaara Box.</p><a className="cta" href="http://localhost:3004">Sign in with BazID ↗</a></section>:!active?<section className="welcome"><span className="eyebrow">BAZAARA DOCS</span><h1>Write with less friction.</h1><p>Create a clean document, capture meeting notes or start a project brief. Documents autosave through Box.</p><div className="welcome-actions"><button className="cta" onClick={()=>void create('blank')}>＋ Blank document</button><button onClick={()=>{setShowTemplates(true);}}>Browse templates</button></div><div className="feature-row"><div><span>01</span><b>Autosave</b><p>Optimistic revisions protect against accidental overwrite.</p></div><div><span>02</span><b>Box-backed</b><p>Document bodies are persisted in your private Box storage.</p></div><div><span>03</span><b>Focused</b><p>Markdown-backed editing keeps the document portable.</p></div></div></section>:<section className="workspace">
        <div className="doc-header"><input aria-label="Document title (editable)" title="Edit document title" maxLength={100} value={title} onChange={e=>changeTitle(e.target.value)} onBlur={()=>{if(saveState==='dirty'||saveState==='error')void saveNow();}} placeholder="Untitled document"/><div><button type="button" onClick={()=>beginRename(active)} aria-label="Rename current document">Rename</button><button onClick={()=>setMode('write')} className={mode==='write'?'selected':''}>Write</button><button onClick={()=>setMode('preview')} className={mode==='preview'?'selected':''}>Preview</button><button className="danger" onClick={()=>void remove()}>Delete</button></div></div>
        <div className="toolbar" aria-label="Formatting tools"><button title="Heading 1" onClick={()=>linePrefix('# ')}>H1</button><button title="Heading 2" onClick={()=>linePrefix('## ')}>H2</button><span/><button title="Bold" onClick={()=>wrap('**','**','bold text')}><b>B</b></button><button title="Italic" onClick={()=>wrap('*','*','italic text')}><i>I</i></button><button title="Strikethrough" onClick={()=>wrap('~~','~~','text')}>S̶</button><span/><button title="Bulleted list" onClick={()=>linePrefix('- ')}>• List</button><button title="Numbered list" onClick={()=>linePrefix('1. ')}>1. List</button><button title="Quote" onClick={()=>linePrefix('> ')}>❝</button><button title="Link" onClick={()=>wrap('[','](https://)','label')}>↗ Link</button><button title="Save now" onClick={()=>void saveNow()}>⌘ Save</button><button onClick={()=>setShowFind(!showFind)}>Find / replace</button><button onClick={()=>download(title+'.md',markdown,'text/markdown')}>Export Markdown</button><button onClick={()=>download(title+'.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>'+escapeHtml(title)+'</title><style>body{max-width:800px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.6;overflow-wrap:anywhere}blockquote{border-left:3px solid #865ce6;padding-left:18px}code{background:#edf0f7;padding:2px 5px}@media print{body{margin:0}}</style><article>'+preview+'</article></html>','text/html')}>Export HTML</button><ImportButton label="Import Markdown" accept=".md,.txt,text/plain,text/markdown" onFile={async f=>{if(f.size>250000)throw Error('Import Markdown smaller than 250 KB.');const text=await f.text();if(markdown&&!confirm('Replace the current document content? Save a device snapshot first if you need a copy.'))return;changeMarkdown(text);}}/><button onClick={snapshot}>Save device snapshot</button><button onClick={()=>setShowHistory(true)}>Device history</button></div>
        {showFind&&<div className="bf-root" style={{minHeight:0,padding:12}}><div className="bf-toolbar"><input aria-label="Find exact text" placeholder="Find exact text" value={findText} onChange={e=>setFindText(e.target.value)}/><input aria-label="Replacement text" placeholder="Replacement" value={replacement} onChange={e=>setReplacement(e.target.value)}/><span>{findText?markdown.split(findText).length-1:0} matches</span><button disabled={!findText} onClick={replaceAll}>Replace all</button></div></div>}
        <div className="paper-wrap">{mode==='write'?<textarea ref={textarea} className="paper editor" spellCheck value={markdown} onChange={e=>changeMarkdown(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void saveNow();}}} placeholder="Start writing…"/>:<article className="paper preview" dangerouslySetInnerHTML={{__html:preview}}/>}</div>
        <footer className="doc-footer"><span>{markdown.trim()?markdown.trim().split(/\s+/).length:0} words · {markdown.length} characters</span><span>Revision {latest.current.revision} · Box-backed `.bdoc`</span></footer>
      </section>}
    </main>
    {showHistory&&active&&<Dialog title="Device snapshots" close={()=>setShowHistory(false)}><p>Up to 20 snapshots per document are saved only on this browser. Server revision history and shared comments require the document service.</p>{snapshots.items.filter(x=>x.documentId===active.id).map(x=><article className="bf-card" key={x.id}><h3>{x.title}</h3><p>{new Date(x.updated).toLocaleString()}</p><button onClick={()=>{if(!confirm('Restore this snapshot into the current editor?'))return;setTitle(x.title);setMarkdown(x.markdown);dirty(x.title,x.markdown);setShowHistory(false);}}>Restore to editor</button><button onClick={()=>download(x.title+'.md',x.markdown,'text/markdown')}>Download</button><button onClick={()=>snapshots.remove(x.id)}>Remove snapshot</button></article>)}<Notice error>{snapshots.error}</Notice></Dialog>}
    {renameTarget&&<div className="dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)dismissRename();}}>
      <section className="rename-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-heading" aria-describedby="rename-description" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();dismissRename();}else if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled)'));if(controls.length){const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}}>
        <div className="dialog-accent" aria-hidden="true"/>
        <h2 id="rename-heading">Rename document</h2>
        <p id="rename-description">Choose a name. The document content remains intact in your private Box storage.</p>
        <form onSubmit={e=>{e.preventDefault();void commitRename();}}>
          <label htmlFor="rename-title">Document name</label>
          <input id="rename-title" ref={renameInput} value={renameDraft} maxLength={100} disabled={renameBusy} onChange={e=>{setRenameDraft(e.target.value);setRenameError('');}} onFocus={e=>e.currentTarget.select()} autoComplete="off" required/>
          {active?.id===renameTarget.id&&saveState!=='saved'&&<p className="rename-hint" role="status">Wait for your current changes to finish saving before renaming.</p>}
          {renameError&&<p className="rename-error" role="alert">{renameError}</p>}
          <div className="dialog-actions"><button type="button" onClick={dismissRename} disabled={renameBusy}>Cancel</button><button type="submit" className="rename-submit" disabled={renameBusy||(active?.id===renameTarget.id&&saveState!=='saved')}>{renameBusy?'Renaming…':'Save name'}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
