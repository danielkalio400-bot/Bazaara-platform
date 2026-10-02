export type HistoryEntry = { q: string; category: 'web'|'images'|'news'; at: number };
export const HISTORY_KEY = 'bazaara-search-local-history-v86';
export const HISTORY_OPTIN_KEY = 'bazaara-search-history-optin-v86';
export const SEARCH_PREFS_KEY = 'bazaara-search-preferences-v86';
export type SearchPreferences = { language: string; newTab: boolean; suggestions: boolean; spokenAnswers: boolean };
export const DEFAULT_SEARCH_PREFS: SearchPreferences = { language: 'auto', newTab: true, suggestions: true, spokenAnswers: false };
export function readHistory(): HistoryEntry[] {
  try {const val:unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(val)) return [];
    return val.filter((v):v is HistoryEntry=>!!v && typeof v.q==='string' && v.q.length<=200 &&
      ['web','news','images'].includes(v.category) && typeof v.at==='number' && Number.isFinite(v.at))
      .slice(0,80);
  }catch{return [];}
}
export function recordHistory(entry: HistoryEntry): HistoryEntry[] {
  if (localStorage.getItem(HISTORY_OPTIN_KEY) !== 'on') return readHistory();
  const next=[entry,...readHistory().filter(v=>!(v.q.toLowerCase()===entry.q.toLowerCase()&&v.category===entry.category))].slice(0,80);
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(next));}catch{}
  return next;
}
export function readPrefs(): SearchPreferences {
  try {const raw:unknown=JSON.parse(localStorage.getItem(SEARCH_PREFS_KEY)||'null');
    if(!raw||typeof raw!=='object')return {...DEFAULT_SEARCH_PREFS};
    const value=raw as Partial<SearchPreferences>;
    return {language:typeof value.language==='string'&&/^(auto|[a-z]{2}(?:-[A-Z]{2})?)$/.test(value.language)?value.language:'auto',
      newTab:typeof value.newTab==='boolean'?value.newTab:true,
      suggestions:typeof value.suggestions==='boolean'?value.suggestions:true,
      spokenAnswers:typeof value.spokenAnswers==='boolean'?value.spokenAnswers:false};
  }catch{return {...DEFAULT_SEARCH_PREFS};}
}
export function exportLocalSearchData(history:HistoryEntry[],pins:unknown,prefs:SearchPreferences):void{
  const payload={version:1,exportedAt:new Date().toISOString(),scope:'This browser only; not BazID or search-provider data.',history,savedLinks:pins,preferences:prefs};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='bazaara-search-local-data.json';
  document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),2500);
}
