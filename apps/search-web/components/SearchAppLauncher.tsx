'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AppCategory = 'Internet' | 'Communication' | 'Productivity' | 'Storage & security' | 'Creative' | 'Platform';
type CatalogApp = { id: string; name: string; short: string; category: AppCategory; port: number };
const CATALOG: CatalogApp[] = [
  {id:'search',name:'Search',short:'⌕',category:'Internet',port:3020},
  {id:'bmap',name:'BMap',short:'⌖',category:'Internet',port:3038},
  {id:'translate',name:'Translate',short:'文',category:'Internet',port:3039},
  {id:'news',name:'News',short:'≡',category:'Internet',port:3040},
  {id:'bazlens',name:'BazLens',short:'◎',category:'Internet',port:3041},
  {id:'bmail',name:'BMail',short:'✉',category:'Communication',port:3036},
  {id:'bazmeet',name:'BazMeet',short:'▣',category:'Communication',port:3037},
  {id:'groups',name:'Groups',short:'♧',category:'Communication',port:3046},
  {id:'docs',name:'Docs',short:'▤',category:'Productivity',port:3023},
  {id:'sheets',name:'Sheets',short:'▦',category:'Productivity',port:3024},
  {id:'slides',name:'Slides',short:'▭',category:'Productivity',port:3025},
  {id:'forms',name:'Forms',short:'☷',category:'Productivity',port:3026},
  {id:'notes',name:'Notes',short:'✎',category:'Productivity',port:3027},
  {id:'calendar',name:'Calendar',short:'31',category:'Productivity',port:3028},
  {id:'contacts',name:'Contacts',short:'◉',category:'Productivity',port:3029},
  {id:'tasks',name:'Tasks',short:'✓',category:'Productivity',port:3045},
  {id:'projects',name:'Projects',short:'◫',category:'Productivity',port:3034},
  {id:'flow',name:'Flow',short:'⤳',category:'Productivity',port:3035},
  {id:'photos',name:'Photos',short:'✧',category:'Storage & security',port:3030},
  {id:'box',name:'Box',short:'⬡',category:'Storage & security',port:3022},
  {id:'vault',name:'Vault',short:'◇',category:'Storage & security',port:3031},
  {id:'bcloud',name:'BCloud',short:'☁',category:'Storage & security',port:3043},
  {id:'bazshield',name:'BazShield',short:'⬟',category:'Storage & security',port:3054},
  {id:'sites',name:'Sites',short:'▧',category:'Creative',port:3042},
  {id:'boards',name:'Boards',short:'▥',category:'Creative',port:3033},
  {id:'spaces',name:'Spaces',short:'∞',category:'Creative',port:3032},
  {id:'learn',name:'Learn',short:'◈',category:'Creative',port:3048},
  {id:'home',name:'Bazaara Home',short:'⌂',category:'Platform',port:3005},
  {id:'bazid',name:'BazID',short:'B',category:'Platform',port:3004},
  {id:'workspace',name:'Workspace',short:'▦',category:'Platform',port:3021},
  {id:'one',name:'Bazaara One',short:'◌',category:'Platform',port:3051},
  {id:'analytics',name:'Analytics',short:'▥',category:'Platform',port:3052},
  {id:'admin',name:'Admin',short:'⚙',category:'Platform',port:3044},
];
const INITIAL_FAVORITES = ['bazid','search','bmap','translate','news','bazlens','bmail','docs','calendar'];
const STORAGE_KEY = 'bazaara-search-launcher-favorites-v85';
const CATEGORY_ORDER: AppCategory[] = ['Internet','Communication','Productivity','Storage & security','Creative','Platform'];

function getAppHref(app: CatalogApp): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const config = JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}') as Record<string,unknown>;
    const configured=config[app.id];
    if (typeof configured === 'string') {
      const url = new URL(configured);
      if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
    }
  } catch { /* Invalid configuration must not produce an unsafe URL. */ }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    const host = hostname.includes(':') ? `[${hostname}]` : hostname;
    return `${window.location.protocol}//${host}:${app.port}/`;
  }
  return null;
}
function launcherApps(): CatalogApp[] { return CATALOG; }

export default function SearchAppLauncher({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [favorites, setFavorites] = useState<string[]>(INITIAL_FAVORITES);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const onCloseRef=useRef(onClose);onCloseRef.current=onClose;
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) {
        const valid = saved.filter((id):id is string=>typeof id === 'string' && CATALOG.some(app=>app.id===id));
        setFavorites(Array.from(new Set(valid)).slice(0, 15));
      }
    } catch { /* Favorites remain available for this session. */ }
  }, []);
  useEffect(() => {
    if (!open) { setEditing(false); setFilter(''); setShowAll(false); setNotice(''); return; }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(()=>searchInput.current?.focus(), 0);
    const handleKey = (event:KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onCloseRef.current(); }
      if (event.key !== 'Tab' || !root.current) return;
      const els = Array.from(root.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])'));
      if (!els.length) return;
      if (event.shiftKey && document.activeElement === els[0]) {event.preventDefault(); els[els.length - 1]?.focus();}
      else if (!event.shiftKey && document.activeElement === els[els.length - 1]) {event.preventDefault(); els[0]?.focus();}
    };
    document.addEventListener('keydown', handleKey, true);
    return ()=>{window.clearTimeout(t); document.removeEventListener('keydown', handleKey, true); previous?.focus();};
  }, [open]);
  const visible = useMemo(() => launcherApps().filter(app => `${app.name} ${app.category}`.toLowerCase().includes(filter.trim().toLowerCase())), [filter]);
  const favApps = favorites.map(id=>CATALOG.find(app=>app.id===id)).filter((app):app is CatalogApp=>!!app && visible.some(v=>v.id===app.id));
  function persist(next: string[]) {
    setFavorites(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setNotice('Favorites saved on this device.'); }
    catch { setNotice('Favorites changed for this session. Browser storage is unavailable.'); }
  }
  function toggle(id:string) {
    persist(favorites.includes(id) ? favorites.filter(v=>v!==id) : [...favorites,id].slice(0,15));
  }
  function move(id:string, direction:-1|1) {
    const next=[...favorites]; const at=next.indexOf(id); const destination=at+direction;
    if(at<0||destination<0||destination>=next.length)return;
    const current = next[at]; const target = next[destination];
    if (current === undefined || target === undefined) return;
    next[at] = target; next[destination] = current;
    persist(next);
  }
  function tile(app:CatalogApp, pinned:boolean) {
    const href = getAppHref(app);
    return <div className="bz85-app-item" key={app.id}>
      {href ? <a className="bz85-app-tile" href={href} title={`Open ${app.name}`} onClick={onClose}>
        <span className={`bz85-app-icon bz85-icon-${app.category.toLowerCase().replace(/[^a-z]+/g,'-')}`} aria-hidden="true">{app.short}</span>
        <span className="bz85-app-name">{app.name}</span>
      </a> : <span className="bz85-app-tile bz85-app-disabled" title="Configure an HTTPS URL for this app before launching it">
        <span className={`bz85-app-icon bz85-icon-${app.category.toLowerCase().replace(/[^a-z]+/g,'-')}`} aria-hidden="true">{app.short}</span>
        <span className="bz85-app-name">{app.name}</span>
        <small>Not configured</small>
      </span>}
      {editing && <div className="bz85-edit-controls"><button type="button" onClick={()=>toggle(app.id)} aria-label={pinned?`Remove ${app.name} from favorites`:`Add ${app.name} to favorites`}>{pinned?'−':'+'}</button>{pinned && <><button type="button" disabled={favorites.indexOf(app.id)===0} onClick={()=>move(app.id,-1)} aria-label={`Move ${app.name} earlier`}>←</button><button type="button" disabled={favorites.indexOf(app.id)===favorites.length-1} onClick={()=>move(app.id,1)} aria-label={`Move ${app.name} later`}>→</button></>}</div>}
    </div>;
  }
  if (!open) return null;
  return <div className="bz85-screen-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="bz85-launcher" ref={root} role="dialog" aria-modal="true" aria-label="BAZAARA app launcher">
      <div className="bz85-launcher-top"><div><small>THE BAZAARA ECOSYSTEM</small><h2>Apps</h2></div><a href="/connected" style={{color: "#c8adff",fontSize:11,textDecoration:"none"}} aria-label="Open BAZAARA connected workflows">Connected journeys</a><button type="button" className="bz85-close" onClick={onClose} aria-label="Close app launcher">×</button></div>
      <div className="bz85-app-find"><span aria-hidden="true">⌕</span><input ref={searchInput} type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search BAZAARA apps" aria-label="Search apps" /></div>
      <div className="bz85-launcher-scroll">
        <section className="bz85-app-section" aria-label="Your favorite apps"><div className="bz85-section-head"><h3>Your favorites</h3><button type="button" className="bz85-edit-button" onClick={()=>setEditing(!editing)} aria-pressed={editing}>{editing?'Done':'Edit'}</button></div>
          {favApps.length ? <div className="bz85-app-grid">{favApps.map(app=>tile(app,true))}</div> : <p className="bz85-empty">No matching favorites. Browse the full catalog below.</p>}
        </section>
        <div className="bz85-section-divider"/>
        {(showAll || !!filter || editing) ? CATEGORY_ORDER.map(category=>{
          const section=visible.filter(app=>app.category===category && (!favorites.includes(app.id)||editing||!!filter));
          return section.length ? <section key={category} className="bz85-app-section"><div className="bz85-section-head"><h3>{category}</h3></div><div className="bz85-app-grid">{section.map(app=>tile(app,favorites.includes(app.id)))}</div></section> : null;
        }) : <button type="button" className="bz85-show-all" onClick={()=>setShowAll(true)}>Explore all BAZAARA apps <span aria-hidden="true">↓</span></button>}
        {visible.length===0 && <p className="bz85-empty">No apps matched your search.</p>}
      </div>
      {notice && <div className="bz85-live-note" role="status">{notice}</div>}
      <div className="bz85-launcher-foot"><span className="bz85-ribbon-mark">B</span><span>Connected by BazID</span></div>
    </div>
  </div>;
}
