'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import '../app/search-2026.css';
import '../app/search-v5.css';
import '../app/search-portal-v8_5.css';
import '../app/search-moments-v86.css';
import { SearchMoments } from './SearchMoments';
import SearchInputTools from './SearchInputTools';
import {readHistory,recordHistory,readPrefs,exportLocalSearchData,SEARCH_PREFS_KEY,HISTORY_OPTIN_KEY,HISTORY_KEY,type HistoryEntry,type SearchPreferences} from './searchLocalHistory';
import SearchAppLauncher from './SearchAppLauncher';
import SearchSettingsPanel from './SearchSettingsPanel';

type Category = 'web' | 'images' | 'news';
type Safety = 'off' | 'moderate' | 'strict';
type Region = string;
type RegionMeta = { country: Region; label: string; source: 'edge-ip' | 'geoip' | 'browser-locale' | 'unavailable'; auto: boolean };
type LensMode = 'similar' | 'text' | 'objects';
type LensResult = { labels: string[]; text: string; matches: { title: string; url: string }[] };
type Result = { title: string; url: string; displayUrl: string; description: string; thumbnail?: string | null; age?: string };
type SearchData = { results: Result[]; hasMore: boolean; provider: string; privacy?: { notice?: string; providerReceivesQuery?: boolean } };
type ErrorData = { code: string; message: string };
type Pin = Pick<Result, 'title' | 'url' | 'displayUrl'>;
type DiscoverItem={title:string;url:string;source:string;image?:string;publishedAt?:string};
const REGIONS: { code: Region; label: string }[] = [
  { code: 'ALL', label: 'All regions' }, { code: 'NG', label: 'Nigeria' }, { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' }, { code: 'ZA', label: 'South Africa' }, { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' }, { code: 'CA', label: 'Canada' }, { code: 'IN', label: 'India' },
];
function validRegion(value: string | null | undefined): Region {
  const normalized=(value||'').trim().toUpperCase();
  return normalized==='ALL'||/^[A-Z]{2}$/.test(normalized)?normalized:'ALL';
}
function regionLabel(code: Region): string {
  if(code==='ALL') return 'All regions';
  try { return new Intl.DisplayNames(['en'],{type:'region'}).of(code) || code; } catch { return REGIONS.find(r=>r.code===code)?.label || code; }
}
function browserRegion(): Region {
  try { return validRegion(new Intl.Locale(navigator.language||'en-US').region); } catch { return 'ALL'; }
}
const REGION_LANGUAGES: Record<string, string[]> = {
  NG: ['Hausa', 'Igbo', 'Yorùbá', 'Nigerian Pidgin'],
  GH: ['Twi', 'Ewe', 'Ga'],
  KE: ['Kiswahili'],
  ZA: ['isiZulu', 'isiXhosa', 'Afrikaans'],
  IN: ['हिन्दी', 'বাংলা', 'తెలుగు', 'मराठी'],
  CA: ['Français'],
};
function regionalLanguages(code: Region): string[] { return REGION_LANGUAGES[code] || []; }
const TABS: { id: Category; label: string; icon: IconName }[] = [
  { id: 'web', label: 'All', icon: 'globe' }, { id: 'images', label: 'Images', icon: 'image' }, { id: 'news', label: 'News', icon: 'news' },
];
type IconName = 'search' | 'globe' | 'image' | 'news' | 'map' | 'spark' | 'arrow' | 'chevron' | 'x' | 'filter' | 'shield' | 'bookmark' | 'copy' | 'check' | 'menu' | 'layout' | 'external' | 'clock' | 'mic' | 'camera' | 'grid';
function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="7.2" /><path d="m16.2 16.2 5 5" /></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.6"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
    news: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    map: <><path d="m3 5 6-2 6 3 6-3v16l-6 2-6-3-6 3V5Zm6-2v15m6-12v15"/></>,
    spark: <><path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"/></>,
    arrow: <><path d="M4 12h16m-7-7 7 7-7 7"/></>, chevron: <path d="m6 9 6 6 6-6"/>,
    x: <path d="M5 5 19 19M19 5 5 19"/>,
    filter: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none"/></>,
    shield: <><path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z"/>, copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    check: <path d="m5 12 4 4 10-10"/>, menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    layout: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 4v16"/></>,
    external: <><path d="M13 4h7v7M20 4l-9 9"/><path d="M19 14v5H5V5h6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"/></>,
    grid: <><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1"/><rect x="17" y="3" width="5" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/><rect x="17" y="10" width="5" height="5" rx="1"/><rect x="3" y="17" width="5" height="5" rx="1"/><rect x="10" y="17" width="5" height="5" rx="1"/><rect x="17" y="17" width="5" height="5" rx="1"/></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v12H3V7Z"/><circle cx="12" cy="13" r="3.5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function appUrl(slug: string, port: number): string | undefined {
  if (typeof window === 'undefined') return;
  try {
    const overrides = JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}') as Record<string, unknown>;
    if (typeof overrides[slug] === 'string' && /^https:\/\//.test(overrides[slug])) return overrides[slug] as string;
  } catch { /* malformed deployment URLs do not compromise local navigation */ }
  const host = window.location.hostname;
  return ['localhost', '127.0.0.1', '::1'].includes(host) ? `${window.location.protocol}//${host.includes(':') ? `[${host}]` : host}:${port}/` : undefined;
}
function readUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category');
  const requestedSafety = params.get('safe');
  const requestedCountry = params.get('country')?.toUpperCase();
  const requestedPage = Number(params.get('page') || '1');
  return {
    q: (params.get('q') || '').trim().slice(0, 200),
    category: (['web', 'images', 'news'].includes(requestedCategory || '') ? requestedCategory : 'web') as Category,
    safe: (['off', 'moderate', 'strict'].includes(requestedSafety || '') ? requestedSafety : 'moderate') as Safety,
    country: validRegion(requestedCountry),
    page: Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 10 ? requestedPage : 1,
  };
}
function safeResult(raw: Result): Result | null {
  if (typeof raw?.title !== 'string' || typeof raw?.url !== 'string') return null;
  try {
    const url = new URL(raw.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return { title: raw.title.slice(0, 250), url: url.href, displayUrl: url.hostname.replace(/^www\./, ''),
      description: typeof raw.description === 'string' ? raw.description.slice(0, 800) : '',
      thumbnail: typeof raw.thumbnail === 'string' && /^https:\/\//i.test(raw.thumbnail) ? raw.thumbnail : null,
      age: typeof raw.age === 'string' ? raw.age.slice(0, 50) : undefined };
  } catch { return null; }
}
export function SearchExperience() {
  const [query, setQuery] = useState(''); const [searched, setSearched] = useState('');
  const [category, setCategory] = useState<Category>('web'); const [safe, setSafe] = useState<Safety>('moderate');
  const [country, setCountry] = useState<Region>('ALL'); const [regionMeta,setRegionMeta]=useState<RegionMeta>({country:'ALL',label:'Detecting region…',source:'unavailable',auto:true}); const [autoRegion,setAutoRegion]=useState(true); const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchData | null>(null); const [error, setError] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnails] = useState(true); const [moreOpen, setMoreOpen] = useState(false); const [toolsOpen, setToolsOpen] = useState(false);
  const [focusUrl, setFocusUrl] = useState<string | null>(null); const [launcherOpen,setLauncherOpen]=useState(false); const [settingsOpen,setSettingsOpen]=useState(false); const [settingsTab,setSettingsTab]=useState<'preferences'|'advanced'|'history'|'privacy'>('preferences');
  const [pins, setPins] = useState<Pin[]>([]); const [notice, setNotice] = useState('');
  const [addOpen,setAddOpen]=useState(false); const [history,setHistory]=useState<HistoryEntry[]>([]);const [historyEnabled,setHistoryEnabled]=useState(false);
  const [prefs,setPrefs]=useState<SearchPreferences>({language:'auto',newTab:true,suggestions:true,spokenAnswers:false});
  const [showSuggestions,setShowSuggestions]=useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [aboutUrl,setAboutUrl]=useState<string|null>(null);
  const [voiceOpen,setVoiceOpen]=useState(false),[voiceListening,setVoiceListening]=useState(false),[voiceTranscript,setVoiceTranscript]=useState(''),[voiceError,setVoiceError]=useState('');
  const [lensOpen,setLensOpen]=useState(false),[lensMode,setLensMode]=useState<LensMode>('similar'),[lensFile,setLensFile]=useState<File|null>(null),[lensPreview,setLensPreview]=useState(''),[lensUrl,setLensUrl]=useState(''),[lensLoading,setLensLoading]=useState(false),[lensError,setLensError]=useState(''),[lensResult,setLensResult]=useState<LensResult|null>(null);
  const [screen,setScreen] = useState<'Home'|'Search'|'Notifications'|'Activity'>('Home');
  const [dark,setDark] = useState(true);
  const [discover,setDiscover]=useState<DiscoverItem[]>([]);
  const input = useRef<HTMLInputElement>(null); const controller = useRef<AbortController | null>(null); const recognitionRef=useRef<{stop:()=>void;abort?:()=>void}|null>(null); const lensInput=useRef<HTMLInputElement>(null);

  const search = useCallback(async (next: { q: string; category: Category; safe: Safety; country: Region; page?: number }, push = true) => {
    const q = next.q.trim().replace(/\s+/g, ' ').slice(0, 200);
    const requestedPage = next.category === 'images' ? 1 : (next.page || 1);
    controller.current?.abort(); setScreen(q?'Search':'Home'); setQuery(q); setSearched(q); setCategory(next.category); setSafe(next.safe);
    setCountry(next.country); setPage(requestedPage); setFocusUrl(null); setData(null); setError(null);
    if (!q) { setLoading(false); if (push) window.history.pushState(null, '', window.location.pathname); return; }
    const params = new URLSearchParams({ q, category: next.category, safe: next.safe, country: next.country, page: String(requestedPage) });
    if (push) {window.history.pushState(null, '', `?${params}`);
      // Optional local history, off by default. No server-side history added.
      try {setHistory(recordHistory({q,category:next.category,at:Date.now()}));} catch {/* Private browsing can disable storage. */}
    }
    const task = new AbortController(); controller.current = task; setLoading(true);
    try {
      const response = await fetch(`/api/search?${params}`, { signal: task.signal, cache: 'no-store', credentials: 'same-origin' });
      const body: unknown = await response.json();
      if (task.signal.aborted) return;
      if (!response.ok) {
        const reason = body as Partial<ErrorData>;
        setError({ code: typeof reason.code === 'string' ? reason.code : 'SEARCH_FAILED', message: typeof reason.message === 'string' ? reason.message : 'The search provider is unavailable.' });
        return;
      }
      const parsed = body as Partial<SearchData>;
      setData({ results: Array.isArray(parsed.results) ? parsed.results.map(safeResult).filter((r): r is Result => r !== null) : [],
        hasMore: parsed.hasMore === true, provider: typeof parsed.provider === 'string' ? parsed.provider : 'connected provider',
        privacy: parsed.privacy });
    } catch { if (!task.signal.aborted) setError({ code: 'NETWORK_ERROR', message: 'Could not reach the search service. Check its connection and try again.' }); }
    finally { if (!task.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    setLinks(Object.fromEntries(([['bmap',3038], ['translate',3039], ['news',3040], ['bazlens',3041], ['workspace',3021], ['shopping',3003], ['bazid',3004], ['bazclips',3014], ['learn',3048], ['bmail',3036]] as const)
      .map(([slug, port]) => [slug, appUrl(slug, port)]).filter((pair): pair is [string,string] => typeof pair[1] === 'string')));
    try {setHistory(readHistory());setHistoryEnabled(localStorage.getItem(HISTORY_OPTIN_KEY)==='on');setPrefs(readPrefs());}catch{}
    try {const savedTheme=localStorage.getItem('bazaara-search-theme-v5');setDark(savedTheme !== 'light');const storedSafe=localStorage.getItem('bazaara-search-safety-v85');if(storedSafe&&['off','moderate','strict'].includes(storedSafe)&&!new URLSearchParams(window.location.search).has('safe'))setSafe(storedSafe as Safety);}catch{}
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('bazaara-search-saved-v2') || '[]');
      if (Array.isArray(stored)) setPins(stored.filter((p): p is Pin => !!p && typeof p.title === 'string' && typeof p.url === 'string' && typeof p.displayUrl === 'string' && !!safeResult({title:p.title,url:p.url,displayUrl:p.displayUrl,description:''})).slice(0, 40));
    } catch { /* browser may disable local storage */ }
    const sync = () => { const state = readUrl(); void search(state, false); };
    sync(); window.addEventListener('popstate', sync);
    const keys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey && event.key.toLowerCase() === 'i') { event.preventDefault(); setLauncherOpen(value=>!value); setSettingsOpen(false); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); input.current?.select(); }
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT','TEXTAREA'].includes(target?.tagName || '')) { event.preventDefault(); input.current?.focus(); }
      if (event.key === 'Escape') { setLauncherOpen(false); setSettingsOpen(false); setMoreOpen(false); setToolsOpen(false); }
    };
    window.addEventListener('keydown', keys);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('keydown', keys); controller.current?.abort(); };
  }, [search]);
  useEffect(()=>{let active=true;void fetch('/api/discover',{cache:'no-store'}).then(async r=>r.ok?await r.json():null).then((data:{articles?:DiscoverItem[]}|null)=>{if(!active||!Array.isArray(data?.articles))return;setDiscover(data.articles.filter(a=>a&&typeof a.title==='string'&&/^https:\/\//.test(a.url)).slice(0,6));}).catch(()=>{/* News availability is independent of search. */});return()=>{active=false;};},[]);
  useEffect(()=>{let active=true;void fetch('/api/region',{cache:'no-store',credentials:'same-origin'}).then(async r=>r.ok?await r.json():null).then((raw:{country?:unknown;source?:unknown}|null)=>{if(!active)return;let detected=validRegion(typeof raw?.country==='string'?raw.country:'');let source:RegionMeta['source']=raw?.source==='edge-ip'||raw?.source==='geoip'?raw.source:'unavailable';if(detected==='ALL'){const fallback=browserRegion();if(fallback!=='ALL'){detected=fallback;source='browser-locale';}}const meta:RegionMeta={country:detected,label:regionLabel(detected),source,auto:true};setRegionMeta(meta);const explicit=new URLSearchParams(window.location.search).has('country');let mode='auto';let savedCountry='ALL';try{mode=localStorage.getItem('bazaara-search-region-mode-v85')||'auto';savedCountry=validRegion(localStorage.getItem('bazaara-search-country-v85'));}catch{}if(mode==='manual'){setAutoRegion(false);if(!explicit){setCountry(savedCountry);const state=readUrl();if(state.q)void search({...state,country:savedCountry},false);}}else if(!explicit&&detected!=='ALL'){setCountry(detected);setAutoRegion(true);const state=readUrl();if(state.q)void search({...state,country:detected},false);}}).catch(()=>{if(!active)return;const fallback=browserRegion();setRegionMeta({country:fallback,label:regionLabel(fallback),source:fallback==='ALL'?'unavailable':'browser-locale',auto:true});let mode='auto';let savedCountry='ALL';try{mode=localStorage.getItem('bazaara-search-region-mode-v85')||'auto';savedCountry=validRegion(localStorage.getItem('bazaara-search-country-v85'));}catch{}if(mode==='manual'){setAutoRegion(false);setCountry(savedCountry);}else if(fallback!=='ALL'){setCountry(fallback);const state=readUrl();if(state.q)void search({...state,country:fallback},false);}});return()=>{active=false;};},[search]);
  useEffect(()=>{if(!lensFile){setLensPreview('');return;}const url=URL.createObjectURL(lensFile);setLensPreview(url);return()=>URL.revokeObjectURL(url);},[lensFile]);
  const results = data?.results || [];
  const selected = useMemo(() => results.find(r => r.url === focusUrl) || results[0] || null, [results, focusUrl]);
  const aboutResult = useMemo(() => results.find(r => r.url === aboutUrl) || null, [results, aboutUrl]);
  function voiceSearch() {
    type SpeechResultLike={results:ArrayLike<{0?:{transcript?:string};isFinal?:boolean}>};
    type SpeechLike={lang:string;continuous:boolean;interimResults:boolean;onstart:(()=>void)|null;onresult:((event:SpeechResultLike)=>void)|null;onerror:((event:{error?:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort?:()=>void};
    type SpeechWindow=Window&{SpeechRecognition?:new()=>SpeechLike;webkitSpeechRecognition?:new()=>SpeechLike};
    setVoiceOpen(true);setVoiceError('');setVoiceTranscript('');
    const browser=window as SpeechWindow;const Recognition=browser.SpeechRecognition||browser.webkitSpeechRecognition;
    if(!Recognition){setVoiceError('Voice search is unavailable in this browser. Try a current Chromium browser or type your query.');return;}
    try{const recognition=new Recognition();recognition.lang=prefs.language==='auto'?(navigator.language||'en-US'):prefs.language;recognition.continuous=false;recognition.interimResults=true;recognition.onstart=()=>setVoiceListening(true);recognition.onresult=e=>{let text='';for(let i=0;i<e.results.length;i++)text+=(e.results[i]?.[0]?.transcript||'')+' ';setVoiceTranscript(text.trim().slice(0,200));};recognition.onerror=e=>{setVoiceListening(false);setVoiceError(e.error==='not-allowed'?'Microphone permission was denied. Allow microphone access in your browser settings and try again.':'Voice recognition stopped before a query was captured.');};recognition.onend=()=>setVoiceListening(false);recognitionRef.current=recognition;recognition.start();}catch{setVoiceError('Could not start voice recognition.');}
  }
  function closeVoice(){recognitionRef.current?.abort?.();recognitionRef.current=null;setVoiceListening(false);setVoiceOpen(false);}
  function submitVoice(){const spoken=voiceTranscript.trim();if(!spoken)return;setQuery(spoken);closeVoice();void search({q:spoken,category,safe,country});}
  function chooseLensFile(candidate:File|undefined){if(!candidate)return;setLensError('');setLensResult(null);if(!['image/png','image/jpeg','image/webp','image/gif'].includes(candidate.type)){setLensError('Choose a PNG, JPEG, WebP or GIF image.');return;}if(candidate.size>8*1024*1024){setLensError('Choose an image smaller than 8 MB.');return;}setLensFile(candidate);}
  async function importLensUrl(){const raw=lensUrl.trim();if(!raw)return;setLensError('');try{const parsed=new URL(raw);if(parsed.protocol!=='https:')throw Error('Use an HTTPS image URL.');const response=await fetch(parsed.href,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('The image host did not allow this request.');const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('That URL did not return an image.');if(blob.size>8*1024*1024)throw Error('The image is larger than 8 MB.');chooseLensFile(new File([blob],`linked-image.${blob.type.split('/')[1]||'jpg'}`,{type:blob.type}));}catch(e){setLensError(e instanceof Error?e.message:'Could not import that image URL.');}}
  async function analyzeLens(){if(!lensFile){setLensError('Choose an image first.');return;}setLensLoading(true);setLensError('');setLensResult(null);try{const form=new FormData();form.append('image',lensFile);form.append('mode',lensMode);const response=await fetch('/api/lens/analyze',{method:'POST',body:form,credentials:'same-origin'});const body=await response.json() as Partial<LensResult>&{message?:string};if(!response.ok)throw Error(body.message||'BazLens analysis is unavailable.');const parsed:LensResult={labels:Array.isArray(body.labels)?body.labels.filter((x):x is string=>typeof x==='string').slice(0,20):[],text:typeof body.text==='string'?body.text.slice(0,10000):'',matches:Array.isArray(body.matches)?body.matches.filter((x):x is {title:string;url:string}=>!!x&&typeof x.title==='string'&&typeof x.url==='string').slice(0,8):[]};setLensResult(parsed);}catch(e){setLensError(e instanceof Error?e.message:'BazLens analysis failed.');}finally{setLensLoading(false);}}
  function closeLens(){setLensOpen(false);setLensError('');setLensResult(null);}
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setShowSuggestions(false); void search({ q: query, category, safe, country }); }
  function tab(value: Category) { setMoreOpen(false); setToolsOpen(false); setCategory(value); if (searched) void search({ q: searched, category: value, safe, country }); }
  function save(result: Result) {
    const next = pins.some(p => p.url === result.url) ? pins.filter(p => p.url !== result.url) : [{ title: result.title, url: result.url, displayUrl: result.displayUrl }, ...pins].slice(0, 40);
    setPins(next); try { localStorage.setItem('bazaara-search-saved-v2', JSON.stringify(next)); } catch { setNotice('Browser storage is unavailable; saved links will not persist.'); }
  }
  async function share(value: string) { try { await navigator.clipboard.writeText(value); setNotice('Link copied.'); } catch { setNotice('Copy is unavailable in this browser.'); } }
  function openSettings(tab:'preferences'|'advanced'|'history'|'privacy') {setLauncherOpen(false);setAddOpen(false);setSettingsTab(tab);setSettingsOpen(true);}
  function changeTheme(next:boolean){setDark(next);try{localStorage.setItem('bazaara-search-theme-v5',next?'dark':'light');}catch{}}
  function changeSafety(next:Safety){setSafe(next);try{localStorage.setItem('bazaara-search-safety-v85',next);}catch{}if(searched)void search({q:searched,category,safe:next,country});}
  function changeAutoRegion(next:boolean){setAutoRegion(next);try{localStorage.setItem('bazaara-search-region-mode-v85',next?'auto':'manual');}catch{}if(next){const detected=regionMeta.country;setCountry(detected);if(searched)void search({q:searched,category,safe,country:detected});}}
  function changeCountry(next:string){setAutoRegion(false);setCountry(next);try{localStorage.setItem('bazaara-search-region-mode-v85','manual');localStorage.setItem('bazaara-search-country-v85',next);}catch{}if(searched)void search({q:searched,category,safe,country:next});}
  function clearBrowserPins(){setPins([]);try{localStorage.removeItem('bazaara-search-saved-v2');setNotice('Browser-saved results deleted.');}catch{setNotice('Could not clear browser storage.');}}
  function updatePrefs(value:SearchPreferences){setPrefs(value);try{localStorage.setItem(SEARCH_PREFS_KEY,JSON.stringify(value));}catch{setNotice('Browser settings cannot be saved in this session.');}}
  function toggleHistory(enabled:boolean){setHistoryEnabled(enabled);try{localStorage.setItem(HISTORY_OPTIN_KEY,enabled?'on':'off');}catch{setNotice('Browser storage unavailable; history consent cannot be saved.');setHistoryEnabled(false);}}
  function clearHistory(){setHistory([]);try{localStorage.removeItem(HISTORY_KEY);setNotice('Local search history cleared.');}catch{setNotice('Unable to clear browser storage.');}}
  function exportLocal(){exportLocalSearchData(history,pins,prefs);}
  function speakExcerpt(text:string){if(typeof window==='undefined'||!('speechSynthesis' in window)){setNotice('Spoken excerpts are unavailable in this browser.');return;}
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text.slice(0,450));utterance.lang=prefs.language==='auto'?(navigator.language||'en-US'):prefs.language;window.speechSynthesis.speak(utterance);}
  function aiStudioUrl(){try{const value=process.env.NEXT_PUBLIC_BAZAARA_AI_STUDIO_URL; if(!value)return;const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}return undefined;}
  const closeLauncher=useCallback(()=>setLauncherOpen(false),[]);
  const closeSettings=useCallback(()=>setSettingsOpen(false),[]);
  const hasQuery = searched.length > 0;
  return <div data-theme={dark?'dark':'light'} className={`bzs bzs-v5 bz82-google-nav ${!hasQuery ? 'bz84-home' : 'bz84-results'}`} >
    <div className="bzs-shell">
      <header className="bzs-header">
        <a href="/" className="bzs-v5-brand" aria-label="BAZAARA Search home">BAZAARA</a>
        <div className="bzs-header-actions">
          {!hasQuery && category==='web' && links.bmail && <a className="bz84-head-link" href={links.bmail}>BMail</a>}
          {!hasQuery && category==='web' && <button type="button" className="bz84-head-link" onClick={()=>setCategory('images')}>Images</button>}
          {!hasQuery && category==='images' && <button type="button" className="bz84-head-link" onClick={()=>setCategory('web')}>Search</button>}
          {hasQuery && <button type="button" className="bz85-head-settings" aria-label="Search settings" onClick={()=>openSettings('preferences')}>Settings</button>}
          <button type="button" className="bzs-v5-apps" aria-label="BAZAARA apps" aria-expanded={launcherOpen} aria-haspopup="dialog" onClick={()=>{setLauncherOpen(v=>!v);setSettingsOpen(false);}}><Icon name="grid" size={20}/></button>
          {links.bazid?<a className="bzs-avatar" href={links.bazid+'account'} aria-label="BazID account">B</a>:<button type="button" className="bzs-avatar" aria-label="BazID account settings" onClick={()=>openSettings('privacy')}>B</button>}
        </div>
      </header>
      <main className="bzs-main">
        {(screen==='Home'||screen==='Search')&&<>
        <div className={`bzs-intro ${hasQuery ? 'bzs-intro-compact' : ''}`}><div><h1>{hasQuery ? 'Search' : 'BAZAARA'}</h1>{!hasQuery && category==='images' && <span className="bz84-product-label">images</span>}</div></div>
        <section className="bzs-search-area" aria-label={category==='images'?'Search images':'Search the web'}>
          <form className="bzs-search-form" onSubmit={submit} role="search">
            {!hasQuery && category==='web' ? <button className="bz84-add" type="button" aria-label="Add image, document or AI tool" title="Add to Search" onClick={()=>{setAddOpen(true);setShowSuggestions(false);}}>+</button> : <Icon name="search" size={24}/>}
            <input ref={input} value={query} onFocus={()=>setShowSuggestions(true)} onBlur={()=>window.setTimeout(()=>setShowSuggestions(false),175)} onPaste={e=>{const file=Array.from(e.clipboardData.files).find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();chooseLensFile(file);setLensOpen(true);setShowSuggestions(false);}}} onChange={e => setQuery(e.target.value)} placeholder={category==='images'?'Search images':'Search the web'} aria-label={category==='images'?'Search images':'Search the web'} name="q" maxLength={200} autoComplete="off" spellCheck={false} enterKeyHint="search"/>
            {query && <button className="bzs-clear" type="button" title="Clear input" aria-label="Clear input" onClick={() => { setQuery(''); input.current?.focus(); }}><Icon name="x" size={18}/></button>}
            <button className="bzs-voice" type="button" aria-label="Voice search" title="Voice search" onClick={voiceSearch}><Icon name="mic" size={18}/></button>
            <button className="bzs-camera" type="button" aria-label="Search with BazLens" title="Search with an image" onClick={()=>{setLensOpen(true);setLensError('');}}><Icon name="camera" size={19}/></button>
            {!hasQuery && category==='web' && <button className="bz84-ai-chip" type="button" onClick={()=>setNotice('AI Mode requires a connected AI provider. BAZAARA will not fabricate AI answers while it is disconnected.')}><Icon name="spark" size={17}/> AI Mode</button>}
            {hasQuery && <button className="bzs-go" type="submit" aria-label="Search" disabled={loading}><Icon name="arrow" size={22}/></button>}
          </form>
          {showSuggestions&&prefs.suggestions&&historyEnabled&&history.length>0&&!hasQuery&&<div className="bz86-suggestions" role="listbox" aria-label="Recent local searches"><header>Recent searches <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>openSettings('history')}>Manage</button></header>{history.filter(h=>!query||h.q.toLowerCase().includes(query.toLowerCase())).slice(0,5).map(h=><button type="button" key={`${h.q}-${h.category}`} role="option" aria-selected={false} onMouseDown={e=>e.preventDefault()} onClick={()=>{setShowSuggestions(false);void search({q:h.q,category:h.category,safe,country});}}><span>◷</span>{h.q}<small>{h.category}</small></button>)}</div>}
          {hasQuery && <div className="bzs-toolbar bz82-toolbar"><div className="bzs-tabs bz82-search-nav" role="tablist" aria-label="Search category"><button className="bzs-v5-ai" type="button" disabled title="AI Mode requires a separately connected AI provider">AI Mode</button>{TABS.map(t => <button key={t.id} role="tab" aria-selected={category===t.id} className={category===t.id?'bzs-tab-active':''} onClick={() => tab(t.id)}>{t.label}</button>)}{links.bazclips&&<a href={links.bazclips}>Videos</a>}<div className="bz82-nav-menu"><button type="button" className={moreOpen?'bz82-nav-trigger is-open':'bz82-nav-trigger'} aria-expanded={moreOpen} aria-haspopup="menu" onClick={()=>{setMoreOpen(v=>!v);setToolsOpen(false);}}>More <Icon name="chevron" size={13}/></button>{moreOpen&&<div className="bz82-menu" role="menu"><button type="button" role="menuitem" onClick={()=>tab('web')}>Web</button>{links.bmap&&<a role="menuitem" href={links.bmap}>BMap</a>}{links.shopping&&<a role="menuitem" href={links.shopping}>Shopping</a>}{links.learn&&<a role="menuitem" href={links.learn}>Books</a>}</div>}</div><div className="bz82-nav-menu"><button type="button" className={toolsOpen?'bz82-nav-trigger is-open':'bz82-nav-trigger'} aria-expanded={toolsOpen} aria-haspopup="menu" onClick={()=>{setToolsOpen(v=>!v);setMoreOpen(false);}}>Tools <Icon name="chevron" size={13}/></button>{toolsOpen&&<div className="bz82-menu bz82-tools-menu" role="menu"><div className="bz82-tools-row"><span>SafeSearch</span><select aria-label="SafeSearch" value={safe} onChange={e=>{const next=e.target.value as Safety;setSafe(next);if(searched)void search({q:searched,category,safe:next,country});}}><option value="strict">Strict</option><option value="moderate">Moderate</option><option value="off">Off</option></select></div><div className="bz82-tools-region"><span>Search region</span><strong>{regionMeta.country==='ALL'?'Automatic':regionMeta.label}</strong><small>{regionMeta.source==='edge-ip'||regionMeta.source==='geoip'?'Detected automatically from your network country':regionMeta.source==='browser-locale'?'Local fallback from browser locale':'Automatic country detection will apply when IP-aware deployment data is available'}</small></div></div>}</div></div></div>}
        </section>
        {!hasQuery && <section className="bz84-home-actions" aria-label="Search actions">
          <div className="bz84-buttons">
            <button type="button" onClick={()=>{const q=query.trim();if(q)void search({q,category,safe,country});}} disabled={!query.trim()}>Bazaara Search</button>
            {links.news && <a href={links.news}>Explore</a>}
          </div>
          {regionalLanguages(regionMeta.country).length>0 && <p className="bz84-languages"><span>Regional languages:</span>{regionalLanguages(regionMeta.country).map(language=>links.translate?<a key={language} href={links.translate} title={`Open BAZAARA Translate for ${language}`}>{language}</a>:<span key={language}>{language}</span>)}</p>}
        </section>}
        {!hasQuery&&category==='web'&&<SearchMoments onSearch={(q: string)=>{setQuery(q);void search({q,category:'web',safe,country});}}/>}
        {!hasQuery && <footer className="bz84-home-footer"><strong>{regionMeta.country==='ALL'?'Region automatic':regionMeta.label}</strong><nav aria-label="Search footer"><button type="button" className="bz85-footer-control" onClick={()=>openSettings('privacy')}>Privacy</button><button type="button" className="bz85-footer-control" onClick={()=>openSettings('preferences')}>Settings</button></nav></footer>}
        {hasQuery && screen==='Search' && <section className="bzs-response" aria-live="polite" aria-busy={loading}>
          <div className="bzs-results-heading"><span>{loading?'Finding sources…':error?'Search could not complete':data?`${results.length} results on this page`:'Preparing results'}</span><button type="button" onClick={() => void share(window.location.href)}><Icon name="copy" size={14}/> Copy search link</button></div>
          {loading && <div className="bzs-loading" role="status">{[1,2,3].map(n=><div key={n}><span/><span/><span/></div>)}</div>}
          {!loading && error && <div className="bzs-error" role="alert"><span className="bzs-error-icon">!</span><h2>{error.code==='PROVIDER_NOT_CONFIGURED'?'Search provider not yet connected':'Search is temporarily unavailable'}</h2><p>{error.message}</p>{error.code==='PROVIDER_NOT_CONFIGURED' && <p className="bzs-setup">Configure <code>BRAVE_SEARCH_API_KEY</code> on Search API port 4020; BAZAARA will never invent search results while disconnected.</p>}<button onClick={()=>void search({q:searched,category,safe,country,page})}>Retry search <Icon name="arrow" size={16}/></button></div>}
          {!loading && data && results.length===0 && <div className="bzs-error"><h2>No matching sources</h2><p>Try a different query, region or result category.</p></div>}
          {!loading && data && results.length>0 && <div className="bzs-columns"><div className="bzs-result-column">
            {category==='web' && <article className="bzs-source-brief"><div className="bzs-brief-label"><span className="bzs-brief-spark"><Icon name="spark" size={18}/></span><span>SOURCE FOCUS</span><span className="bzs-evidence-badge">From live results</span></div><h2>{results[0]?.title}</h2><p>{results[0]?.description || 'Open the original source to read the full article.'}</p><div className="bzs-source-chips">{results.slice(0,3).map(r=><a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><span className="bzs-domain-dot">{r.displayUrl[0]?.toUpperCase()}</span>{r.displayUrl}<Icon name="external" size={12}/></a>)}</div><small>This is an excerpt of an actual search result, not an AI-generated answer.</small></article>}
            {category==='images' && !thumbnails && <div className="bzs-image-privacy"><Icon name="shield" size={18}/> Image previews are loaded from provider-supplied HTTPS sources.</div>}
            <div className={category==='images'?'bzs-result-grid':'bzs-result-list'}>{results.map((r,index)=><article className={selected?.url===r.url?'bzs-result bzs-result-focused':'bzs-result'} key={`${r.url}-${index}`}>
              {category==='images' && <div className="bzs-result-image">{thumbnails && r.thumbnail?<img src={r.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<Icon name="image" size={36}/>}</div>}
              <div className="bzs-result-body"><div className="bzs-result-domain"><span className="bzs-domain-dot">{r.displayUrl[0]?.toUpperCase()}</span>{r.displayUrl}{r.age&&<span>· {r.age}</span>}</div><a className="bzs-result-title" href={r.url} target={prefs.newTab?"_blank":"_self"} rel="noopener noreferrer" referrerPolicy="no-referrer">{r.title}</a><p>{r.description}</p><div className="bzs-result-actions"><button type="button" onClick={()=>setFocusUrl(r.url)}><Icon name="layout" size={14}/> Focus</button><button type="button" onClick={()=>setAboutUrl(r.url)}>About result</button><button type="button" onClick={()=>save(r)} aria-pressed={pins.some(p=>p.url===r.url)}><Icon name={pins.some(p=>p.url===r.url)?'check':'bookmark'} size={14}/>{pins.some(p=>p.url===r.url)?'Saved':'Save'}</button><button type="button" onClick={()=>void share(r.url)}><Icon name="copy" size={14}/> Copy</button>{prefs.spokenAnswers&&<button type="button" onClick={()=>speakExcerpt(`${r.title}. ${r.description}`)} aria-label={`Read aloud ${r.title}`}><Icon name="mic" size={14}/> Listen</button>}</div></div></article>)}</div>
            {data.hasMore && category!=='images'&&<div className="bzs-pagination"><button disabled={page<=1} onClick={()=>{void search({q:searched,category,safe,country,page:page-1});window.scrollTo({top:0,behavior:'smooth'});}}>Previous</button><span>Page {page}</span><button disabled={page>=10} onClick={()=>{void search({q:searched,category,safe,country,page:page+1});window.scrollTo({top:0,behavior:'smooth'});}}>Next page <Icon name="arrow" size={15}/></button></div>}
            <p className="bzs-provider">Results via {data.provider}. {data.privacy?.notice || 'Third-party search provider policies apply.'}</p>
          </div>{category!=='images'&&<aside className="bzs-insight"><div className="bzs-insight-header"><span>EXPLORE THIS SOURCE</span><Icon name="spark" size={17}/></div>{selected && <><span className="bzs-insight-logo">{selected.displayUrl[0]?.toUpperCase()}</span><h2>{selected.title}</h2><div className="bzs-insight-domain">{selected.displayUrl}</div><p>{selected.description||'Open this source to learn more.'}</p><a href={selected.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="bzs-insight-open">Read original source <Icon name="external" size={15}/></a></>}
            <div className="bzs-insight-divider"/><h3>Compare sources</h3><p className="bzs-insight-help">Select a result to inspect its published excerpt. Compare information using the original pages.</p>{results.filter(r=>r.url!==selected?.url).slice(0,4).map(r=><button key={r.url} type="button" className="bzs-compare" onClick={()=>setFocusUrl(r.url)}><span className="bzs-domain-dot">{r.displayUrl[0]?.toUpperCase()}</span><span>{r.title}<small>{r.displayUrl}</small></span><Icon name="chevron" size={15}/></button>)}
            <div className="bzs-insight-foot"><Icon name="shield" size={18}/> Source context only. No invented summaries, statistics or ratings.</div>
          </aside>}</div>}
        </section>}
        </>}
        {screen==='Notifications'&&<section className="bzs-v5-page"><h1>Notifications</h1><p>Notifications are not enabled yet. No alerts will be fabricated.</p></section>}
        {screen==='Activity'&&<section className="bzs-v5-page bz86-activity"><h1>Activity</h1><div className="bz86-activity-bar"><p>Local browser history: {historyEnabled?'On':'Off'} · {history.length} entries</p><button type="button" onClick={()=>openSettings('history')}>Manage history & export</button></div>{historyEnabled&&history.slice(0,10).map(h=><button className="bz86-activity-item" type="button" key={`${h.q}-${h.at}`} onClick={()=>void search({q:h.q,category:h.category,safe,country})}>{h.q}<small>{new Date(h.at).toLocaleString()}</small></button>)}<h2>Links saved in this browser</h2>{pins.length?pins.map(p=><a key={p.url} href={p.url} target={prefs.newTab?'_blank':'_self'} rel="noopener noreferrer">{p.title} ↗</a>):<p>No saved links yet.</p>}</section>}

        {aboutResult&&<div className="bz8-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setAboutUrl(null);}}><section className="bz8-about-result" role="dialog" aria-modal="true" aria-label="About this result"><header><div><small className="bz8-eyebrow">ABOUT THIS RESULT</small><h2>{aboutResult.displayUrl}</h2></div><button onClick={()=>setAboutUrl(null)} aria-label="Close">×</button></header><p>{aboutResult.description||'No provider excerpt was returned for this result.'}</p><dl><div><dt>Destination</dt><dd>{aboutResult.displayUrl}</dd></div><div><dt>Result type</dt><dd>{category==='images'?'Image result':category==='news'?'News result':'Web result'}</dd></div><div><dt>Provider</dt><dd>{data?.provider||'Connected search provider'}</dd></div></dl><a href={aboutResult.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open original source ↗</a><footer>BAZAARA shows provider-supplied source metadata only. It does not fabricate trust scores, ownership claims or publisher ratings.</footer></section></div>}
        {voiceOpen&&<div className="bz8-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeVoice();}}><section className="bz8-voice-dialog" role="dialog" aria-modal="true" aria-label="Voice search"><header><div><small className="bz8-eyebrow">VOICE SEARCH</small><h2>{voiceListening?'Listening…':voiceTranscript?'Ready to search':'Speak your search'}</h2></div><button type="button" onClick={closeVoice} aria-label="Close voice search">×</button></header><div className={voiceListening?'bz8-voice-orb is-listening':'bz8-voice-orb'}><span><Icon name="mic" size={34}/></span><i/><i/><i/></div><p className="bz8-voice-transcript">{voiceTranscript||voiceError||'Say a word, place, question or topic.'}</p><div className="bz8-voice-actions">{!voiceListening&&<button type="button" onClick={voiceSearch}>Listen again</button>}<button type="button" className="bz8-primary" disabled={!voiceTranscript.trim()} onClick={submitVoice}>Search</button></div><footer>Recognition language: {typeof navigator!=='undefined'?(navigator.language||'browser default'):'browser default'} · Microphone is used only while listening.</footer></section></div>}
        {lensOpen&&<div className="bz8-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeLens();}}><section className="bz8-search-lens" role="dialog" aria-modal="true" aria-label="Search any image with BazLens"><header><div><small className="bz8-eyebrow">BAZLENS</small><h2>Search any image</h2><p>Drop an image, upload a file or import an HTTPS image link.</p></div><button type="button" onClick={closeLens} aria-label="Close BazLens">×</button></header><input ref={lensInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>chooseLensFile(e.target.files?.[0])}/><div className={lensFile?'bz8-lens-drop has-image':'bz8-lens-drop'} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();chooseLensFile(e.dataTransfer.files?.[0]);}}>{lensPreview?<img src={lensPreview} alt="Selected visual search image"/>:<><span className="bz8-lens-upload-icon"><Icon name="image" size={34}/></span><strong>Drag an image here</strong><span>or</span><button type="button" onClick={()=>lensInput.current?.click()}>Upload a file</button></>}</div><div className="bz8-lens-or"><span/>OR<span/></div><div className="bz8-lens-url"><input type="url" value={lensUrl} onChange={e=>setLensUrl(e.target.value)} placeholder="Paste image link" aria-label="Image URL"/><button type="button" disabled={!lensUrl.trim()} onClick={()=>void importLensUrl()}>Import</button></div><div className="bz8-lens-mode-row" role="tablist" aria-label="BazLens mode"><button role="tab" aria-selected={lensMode==='similar'} onClick={()=>setLensMode('similar')}>Visual search</button><button role="tab" aria-selected={lensMode==='text'} onClick={()=>setLensMode('text')}>Text</button><button role="tab" aria-selected={lensMode==='objects'} onClick={()=>setLensMode('objects')}>Shopping & objects</button></div>{lensError&&<p className="bz8-lens-error" role="alert">{lensError}</p>}{lensResult&&<div className="bz8-lens-mini-results">{lensResult.text&&<p><strong>Recognized text</strong>{lensResult.text.slice(0,420)}</p>}{lensResult.labels.length>0&&<div>{lensResult.labels.slice(0,8).map(x=><button key={x} onClick={()=>{setQuery(x);closeLens();void search({q:x,category:'web',safe,country});}}>{x}</button>)}</div>}{lensResult.matches.filter(m=>{try{const u=new URL(m.url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}).slice(0,3).map(m=><a href={m.url} key={m.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{m.title} ↗</a>)}</div>}<div className="bz8-lens-footer"><button type="button" onClick={()=>{setLensFile(null);setLensResult(null);setLensError('');}}>Clear</button>{links.bazlens&&<a href={links.bazlens}>Open full BazLens ↗</a>}<button type="button" className="bz8-primary" disabled={!lensFile||lensLoading} onClick={()=>void analyzeLens()}>{lensLoading?'Analyzing…':'Search image'}</button></div><small className="bz8-lens-privacy">Images are sent only when you press Search image. BazLens provider configuration determines analysis availability.</small></section></div>}
      </main>
      <nav className="bzs-v5-bottom" aria-label="Search navigation">{(['Home','Search','Notifications','Activity'] as const).map(t=><button type="button" key={t} aria-current={screen===t?'page':undefined} onClick={()=>{setScreen(t);if(t==='Search')input.current?.focus();window.scrollTo({top:0});}}><span>{t==='Home'?'⌂':t==='Search'?'⌕':t==='Notifications'?'♧':'◷'}</span><small>{t}</small></button>)}</nav>
    </div>
    <SearchAppLauncher open={launcherOpen} onClose={closeLauncher}/><SearchInputTools open={addOpen} onClose={()=>setAddOpen(false)} onLens={()=>{setLensOpen(true);setLensError('');}} onInsert={text=>{setQuery(text);setShowSuggestions(false);window.setTimeout(()=>input.current?.focus(),0);}} aiStudioHref={aiStudioUrl()}/>
    <SearchSettingsPanel open={settingsOpen} initialTab={settingsTab} onClose={closeSettings} dark={dark} onDarkChange={changeTheme} safe={safe} onSafeChange={changeSafety} country={country} onCountryChange={changeCountry} autoRegion={autoRegion} onAutoRegionChange={changeAutoRegion} regionInfo={regionMeta} savedCount={pins.length} onClearSaved={clearBrowserPins} bazidHref={links.bazid?`${links.bazid}account`:undefined} prefs={prefs} onPrefsChange={updatePrefs} historyEnabled={historyEnabled} onHistoryEnabledChange={toggleHistory} history={history} onClearHistory={clearHistory} onExport={exportLocal} onAdvancedSearch={value=>{setQuery(value);setScreen('Home');input.current?.focus();}}/>
    {notice && <div className="bzs-toast" role="status">{notice}<button type="button" aria-label="Dismiss" onClick={()=>setNotice('')}><Icon name="x" size={15}/></button></div>}
  </div>;
}
