'use client';
import {useEffect,useState,type ReactNode} from 'react';

type Product='Translate'|'News'|'BazLens';
const ICONS:Record<string,string>={
  'For you':'⌂','Headlines':'▤','Local':'⌖','Nigeria':'◉','Following':'☆','Newsstand':'▥','Saved':'▣',
  'Text':'文','Documents':'▤','Websites':'⌕','History':'◷','Conversation':'☷','Live':'☷','Transcribe':'≋','Camera':'◎',
  'Explore':'◎','Results':'▤','Saved scans':'☆','About image':'◇'
};
const MAIN:Record<Product,string[]>={
  News:['For you','Headlines','Local','Nigeria','Following','Newsstand','Saved','Business','Technology','World','Africa'],
  Translate:['Text','Live','Transcribe','Camera','Documents','Websites','History','Saved'],
  BazLens:['Explore','Results','About image','Saved scans']
};
const BOTTOM:Record<Product,string[]>={
  News:['For you','Following','Saved'],
  Translate:['Text','Live','Camera','Saved'],
  BazLens:['Explore','Results','Saved scans']
};
function href(port:number,path=''){
  if(typeof window==='undefined')return '#';
  try{
    const overrides=JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS||'{}') as Record<string,string>;
    const name=port===3004?'bazid':port===3021?'workspace':'';
    if(name&&typeof overrides[name]==='string'&&/^https:\/\//.test(overrides[name]))return overrides[name].replace(/\/$/,'')+path;
  }catch{/* optional deployment configuration */}
  const host=window.location.hostname;
  return ['localhost','127.0.0.1','::1'].includes(host)?`${window.location.protocol}//${host.includes(':')?`[${host}]`:host}:${port}${path}`:'#';
}

export default function StandaloneFrame({product,tabs,active,onTab,children,actions}:{product:Product;tagline:string;tabs:string[];active:string;onTab:(tab:string)=>void;children:ReactNode;actions?:ReactNode}){
  const [account,setAccount]=useState(false);
  const [dark,setDark]=useState(true);
  const [accountUrl,setAccountUrl]=useState('#');
  const [workspaceUrl,setWorkspaceUrl]=useState('#');

  useEffect(()=>{
    setAccountUrl(href(3004,'/account'));
    setWorkspaceUrl(href(3021,'/'));
    try{const saved=localStorage.getItem(`bazaara-${product.toLowerCase()}-theme`);if(saved==='dark'||saved==='light')setDark(saved==='dark');}catch{/* optional */}
  },[product]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setAccount(false);};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[]);

  const title=product==='News'?'BAZAARA News':product==='BazLens'?'BazLens':'BAZAARA Translate';
  const desktop=[...MAIN[product].filter(item=>tabs.includes(item)),...tabs.filter(item=>!MAIN[product].includes(item))];
  const mobile=BOTTOM[product].filter(item=>tabs.includes(item));

  return <div className={`ig5-shell ig5-${product.toLowerCase()} bz8-product-shell`} data-theme={dark?'dark':'light'}>
    <header className="ig5-topbar bz8-topbar">
      <button className="bz8-product-brand" type="button" onClick={()=>onTab(desktop[0]||tabs[0])} aria-label={`${title} home`}>
        <img src="/bazaara-ribbon-b.svg" alt=""/><span><strong>{title}</strong><small>BAZAARA INTERNET</small></span>
      </button>
      <div className="ig5-top-actions">{actions}
        <button className="ig5-top-icon ig5-theme" type="button" aria-label={dark?'Use light appearance':'Use dark appearance'} onClick={()=>{setDark(value=>{const next=!value;try{localStorage.setItem(`bazaara-${product.toLowerCase()}-theme`,next?'dark':'light');}catch{}return next;});}}>{dark?'☼':'☾'}</button>
        <button className="ig5-account bz8-account" type="button" aria-label="BazID account" aria-expanded={account} onClick={()=>setAccount(value=>!value)}>B</button>
      </div>
    </header>

    {account&&<div className="ig5-popup ig5-account-popup bz8-account-popup" role="dialog" aria-label="BazID account">
      <div className="ig5-popup-heading"><strong>BazID</strong><button onClick={()=>setAccount(false)} aria-label="Close account menu">×</button></div>
      <a href={accountUrl}>Manage your account ↗</a><a href={workspaceUrl}>All BAZAARA products ↗</a>
      <button type="button" onClick={()=>setDark(value=>!value)}>Switch appearance</button>
    </div>}

    <nav className={`ig5-desktop-tabs bz8-mode-tabs ${product==='News'?'ig5-news-tabs':''}`} aria-label={`${product} sections`}>
      {desktop.map(item=><button type="button" key={item} aria-current={active===item?'page':undefined} onClick={()=>onTab(item)}>{item}</button>)}
    </nav>

    <main className="ig5-main bz8-main" id="main-content">{children}</main>

    <nav className="ig5-bottom bz8-bottom" aria-label={`${product} navigation`}>
      {mobile.map(item=><button type="button" key={item} aria-current={active===item?'page':undefined} onClick={()=>onTab(item)}><span aria-hidden="true">{ICONS[item]||'•'}</span><small>{item==='For you'||item==='Text'||item==='Explore'?'Home':item}</small></button>)}
    </nav>
  </div>;
}
