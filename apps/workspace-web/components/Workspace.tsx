'use client';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { categories, products, activeProducts, type Product, type ProductGroup } from '../lib/products';
import type { IdentityState, WorkspaceUser } from '../lib/session';

const NAV = ['Overview','All apps','Favorites'] as const;
type Tab = typeof NAV[number];
const site = {
  search:process.env.NEXT_PUBLIC_SEARCH_ORIGIN || 'http://localhost:3020',
  bazid:process.env.NEXT_PUBLIC_BAZID_ORIGIN || 'http://localhost:3004',
  platform:process.env.NEXT_PUBLIC_PLATFORM_HOME_ORIGIN || 'http://localhost:3005',
};

function Brand({compact=false}:{compact?:boolean}) {
  return <a className="brand" href="/" aria-label="BAZAARA Workspace home">
    <span className="brand-mark" aria-hidden="true"><span className="brand-mark-inner"/></span>
    <span className="brand-letters">BAZAARA{!compact&&<small>WORKSPACE</small>}</span>
  </a>;
}

function ProductIcon({product}:{product:Product}) {
  return <span aria-hidden="true" className={`product-icon icon-${product.color}`}>{product.icon}</span>;
}

function ProductTile({product,pinned,togglePin}:{product:Product;pinned:boolean;togglePin:(id:string)=>void}) {
  const available = product.status==='available';
  return <article className="product-tile">
    <div className="tile-head"><ProductIcon product={product}/>
      <button type="button" className={`pin-button ${pinned?'is-pinned':''}`} aria-label={`${pinned?'Unpin':'Pin'} ${product.name}`} title={`${pinned?'Unpin':'Pin'} ${product.name} (this device)`} aria-pressed={pinned} onClick={()=>togglePin(product.id)}>{pinned?'★':'☆'}</button>
    </div>
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <div className="tile-footer">
      {available ? <a className="launch-link" href={product.href} aria-label={`Open ${product.name}`}>Open <span aria-hidden="true">↗</span></a>
        : <span className="soon-tag">In development</span>}
      <span className={`status-dot ${available?'online':''}`} aria-label={available?'Available':'Planned'}/>
    </div>
  </article>;
}

function LoginPanel({unavailable}:{unavailable:boolean}) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response=await fetch('/api/session/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body:JSON.stringify({email,password}) });
      const body=await response.json();
      if (!response.ok) throw new Error(body.message || 'Sign-in failed.');
      window.location.replace('/');
    } catch(cause) { setError(cause instanceof Error?cause.message:'Sign-in failed.'); }
    finally { setBusy(false); setPassword(''); }
  }
  return <div className="auth-page">
    <div className="auth-left">
      <Brand/>
      <div className="auth-story"><span className="eyebrow light">YOUR DIGITAL HOME</span>
        <h1>Everything works <em>better together.</em></h1>
        <p>Search, create, organize and collaborate through a connected BAZAARA experience — powered by one BazID.</p>
        <div className="auth-showcase" aria-label="Active and upcoming products"><span className="auth-showcase-dot"/>
          <span>Workspace <b>Available</b></span><span>{activeProducts.length} local apps <b>Connected</b></span><span>Bazaara Spectrum <b>Active</b></span>
        </div>
      </div><div className="auth-footer">ECOSYSTEM 3 <span>·</span> INTELLIGENCE, PRODUCTIVITY & INFRASTRUCTURE</div>
    </div>
    <div className="auth-right"><div className="auth-form-wrap"><div className="mobile-brand"><Brand/></div>
      <span className="eyebrow">WELCOME TO WORKSPACE</span><h2>Sign in with BazID</h2>
      <p className="auth-subtitle">Use the Bazaara account you already have. Your password goes to the existing BazID service; Workspace does not store it.</p>
      {unavailable&&<div className="notice error" role="alert">BazID could not be reached. Start the existing Platform API on port 4000.</div>}
      <form onSubmit={submit} className="auth-form">
        <label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="username" maxLength={320} placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        <label htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" maxLength={256} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)}/>
        {error&&<div className="notice error" role="alert">{error}</div>}
        <button className="primary-button" type="submit" disabled={busy}>{busy?'Signing in…':'Sign in to Workspace'} <span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-help">New to Bazaara? <a href={`${site.bazid}/bazid/register`}>Create a BazID account ↗</a></p>
      <div className="auth-bottom"><span>Secure, host-only session cookie</span><a href={site.search}>Explore BAZAARA Search ↗</a></div>
    </div></div>
  </div>;
}

export function Workspace({initialIdentity}:{initialIdentity:IdentityState}) {
  const [tab,setTab]=useState<Tab>('Overview');
  const [category,setCategory]=useState<ProductGroup|'All'>('All');
  const [query,setQuery]=useState('');
  const [pinned,setPinned]=useState<string[]>(['search','workspace','docs','box']);
  const [mobileNav,setMobileNav]=useState(false);
  const [logoutError,setLogoutError]=useState('');
  const [logoutBusy,setLogoutBusy]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const user:WorkspaceUser|null=initialIdentity.status==='signed-in'?initialIdentity.user:null;
  const pinKey=user?`bazaara:e3:pins:v1:${user.id}`:null;

  useEffect(()=>{ if(!pinKey)return; try{const raw=localStorage.getItem(pinKey);if(raw){const ids=JSON.parse(raw);if(Array.isArray(ids))setPinned(ids.filter((id:unknown)=>typeof id==='string'&&products.some(p=>p.id===id)));}}catch{/* Local convenience only */}},[pinKey]);
  useEffect(()=>{
    function shortcut(e:KeyboardEvent){
      const tag=(e.target as HTMLElement)?.tagName;
      if ((e.key==='/' && !['INPUT','TEXTAREA'].includes(tag)) || (e.key.toLowerCase()==='k'&&(e.metaKey||e.ctrlKey))) {e.preventDefault();searchRef.current?.focus();setTab('All apps');}
      if(e.key==='Escape')searchRef.current?.blur();
    }
    window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);
  },[]);
  const filtered=useMemo(()=>products.filter(p=>
    (category==='All'||p.category===category)&&
    (tab!=='Favorites'||pinned.includes(p.id))&&
    (p.name.toLowerCase().includes(query.toLowerCase())||p.description.toLowerCase().includes(query.toLowerCase()))
  ),[category,tab,pinned,query]);
  function togglePin(id:string){if(!pinKey)return;setPinned(prev=>{const next=prev.includes(id)?prev.filter(i=>i!==id):[...prev,id];try{localStorage.setItem(pinKey,JSON.stringify(next));}catch{}return next;});}
  async function logout(){setLogoutBusy(true);setLogoutError('');try{const r=await fetch('/api/session/logout',{method:'POST',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new Error(d.message||'Sign-out failed.');window.location.replace('/');}catch(e){setLogoutError(e instanceof Error?e.message:'Sign-out failed.');setLogoutBusy(false);}}
  if(!user)return <LoginPanel unavailable={initialIdentity.status==='unavailable'}/>;
  const firstName=user.displayName.trim().split(/\s+/)[0]||'there';
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`} aria-label="Main navigation">
      <div className="sidebar-brand"><Brand/><button className="mobile-close" type="button" aria-label="Close menu" onClick={()=>setMobileNav(false)}>×</button></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Workspace sections">{NAV.map((name,i)=><button type="button" className={`nav-button ${tab===name?'selected':''}`} aria-current={tab===name?'page':undefined} key={name} onClick={()=>{setTab(name);setCategory('All');setMobileNav(false);}}><span aria-hidden="true" className="nav-glyph">{['▦','◫','☆'][i]}</span>{name}{name==='Favorites'&&<span className="nav-count">{pinned.length}</span>}</button>)}</nav>
      <div className="sidebar-section-label category-label">CATEGORIES</div>
      <nav className="main-nav category-nav" aria-label="App categories">{categories.map((name,i)=><button type="button" key={name} className={`nav-button category-button ${category===name?'selected':''}`} onClick={()=>{setCategory(name);setTab('All apps');setMobileNav(false);}}><span className={`category-square color-${i}`} aria-hidden="true"/>{name}</button>)}</nav>
      <div className="sidebar-bottom"><span className="release-pill"><span/>Workspace Alpha</span><p>Connected to the Bazaara platform. Product families are color-coded by purpose.</p><a href={site.platform}>Platform homepage ↗</a></div>
    </aside>
    {mobileNav&&<button className="nav-scrim" aria-label="Close menu" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="menu-toggle" type="button" aria-label="Open menu" onClick={()=>setMobileNav(true)}>☰</button>
        <div className="topbar-title"><span className="breadcrumbs">BAZAARA <span>/</span> ECOSYSTEM 3</span><strong>{tab==='Overview'?'Your workspace':tab}</strong></div>
        <div className="top-actions"><label className="quick-search" htmlFor="app-search"><span aria-hidden="true">⌕</span><input ref={searchRef} id="app-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value)setTab('All apps');}} placeholder="Find an app…" aria-label="Find a Bazaara app"/><kbd>⌘ K</kbd></label><a className="top-bazid" href={`${site.bazid}/account`} title="Manage BazID account" aria-label="Manage BazID account">{firstName.charAt(0).toUpperCase()}</a></div>
      </header>
      <div className="content-wrap">
        {tab==='Overview' && !query && category==='All' && <>
          <section className="welcome-heading"><div><span className="eyebrow">YOUR BAZAARA SPECTRUM</span><h1>Good to see you, {firstName}<span className="green-point">.</span></h1><p>One workspace, seven purpose-led colors, and every connected tool in reach.</p></div><span className="local-date">ECOSYSTEM THREE / ALPHA</span></section>
          <section className="hero-grid" aria-label="Featured app"><div className="hero-main"><div className="hero-pattern" aria-hidden="true"><span/><span/><span/></div><div className="hero-content"><span className="hero-label"><span/>BAZAARA SPECTRUM</span><h2>One place.<br/><em>Every color has a job.</em></h2><p>Search, create, organize, store and collaborate through one connected workspace.</p><button className="hero-button" type="button" onClick={()=>setTab('All apps')}>Explore your apps <span aria-hidden="true">↗</span></button></div><div className="hero-art" aria-hidden="true"><div className="art-circle"><span>⌕</span></div><div className="art-orbit art-orbit-one"/><div className="art-orbit art-orbit-two"/></div></div><div className="hero-side"><div className="side-top"><span>YOUR WORKSPACE</span><span className="side-live">● ACTIVE</span></div><strong>{String(activeProducts.length).padStart(2,'0')}<small>LIVE APPS</small></strong><div className="side-rule"/><p>Explore the applications already available in Ecosystem 3.</p><button type="button" onClick={()=>setTab('All apps')}>View all products <span aria-hidden="true">→</span></button></div></section>
          <div className="section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Ready when you are</h2></div><button type="button" className="text-action" onClick={()=>setTab('All apps')}>Browse 31 products ↗</button></div>
          <div className="featured-grid"><a className="feature-card feature-internet" href={site.search}><span className="feature-icon teal">⌕</span><div><h3>Search</h3><p>Explore the open web.</p><span>Open Search ↗</span></div></a><a className="feature-card feature-productivity" href="http://localhost:3023"><span className="feature-icon green">≡</span><div><h3>Docs</h3><p>Create and organize documents.</p><span>Open Docs ↗</span></div></a><a className="feature-card feature-storage" href="http://localhost:3022"><span className="feature-icon blue">□</span><div><h3>Box</h3><p>Your connected file layer.</p><span>Open Box ↗</span></div></a><a className="feature-card feature-communication" href="http://localhost:3028"><span className="feature-icon violet">▦</span><div><h3>Calendar</h3><p>Plan time across your work.</p><span>Open Calendar ↗</span></div></a></div>
          <div className="section-heading roadmap-section"><div><span className="eyebrow">NEXT FRONTIER</span><h2>Intelligence joins the workspace</h2></div><span className="roadmap-label">DEVELOPMENT ROADMAP</span></div>
          <div className="roadmap-cards"><div><span>01</span><strong>Bmail</strong><p>Connected mail and BazID identity</p></div><div><span>02</span><strong>Bazaara AI</strong><p>Permission-aware intelligence</p></div><div><span>03</span><strong>Cloud</strong><p>Infrastructure for the wider platform</p></div></div>
        </>}
        {(tab!=='Overview'||query||category!=='All')&&<section className="app-listing"><div className="listing-top"><div><span className="eyebrow">EXPLORE THE ECOSYSTEM</span><h1>{tab==='Favorites'?'Your favorites':category!=='All'?category:'All applications'}<span className="green-point">.</span></h1><p>{tab==='Favorites'?'Your pinned applications, saved on this device.':`${filtered.length} product${filtered.length===1?'':'s'} matching your selection. Planned products are labeled.`}</p></div><button className="reset-button" type="button" onClick={()=>{setTab('All apps');setCategory('All');setQuery('');}}>Clear filters ↗</button></div>
          <div className="category-chips" aria-label="Filter by category"><button type="button" aria-pressed={category==='All'} className={category==='All'?'chip active':'chip'} onClick={()=>setCategory('All')}>All</button>{categories.map(c=><button type="button" key={c} aria-pressed={category===c} className={category===c?'chip active':'chip'} onClick={()=>setCategory(c)}>{c}</button>)}</div>
          {filtered.length?<div className="product-grid">{filtered.map(p=><ProductTile key={p.id} product={p} pinned={pinned.includes(p.id)} togglePin={togglePin}/>)}</div>:<div className="empty-state"><span>⌕</span><h3>Nothing here yet</h3><p>Try a different search, choose another category or pin more apps.</p></div>}
        </section>}
        <footer className="workspace-footer"><div><span className="footer-logo">BAZAARA</span><span>Connected by the Bazaara platform</span></div><div><span>One Account (BazID)</span><span>Unified Platform</span><span>Bazaara Spectrum</span><span>Secure Infrastructure</span></div></footer>
      </div>
      <div className="account-tray"><div className="account-details"><span className="account-avatar">{firstName.charAt(0).toUpperCase()}</span><div><strong>{user.displayName||'BazID member'}</strong><span>{user.email||'BazID account'}</span></div></div><div className="account-links"><a href={`${site.bazid}/account`}>Account settings ↗</a><button type="button" onClick={logout} disabled={logoutBusy}>{logoutBusy?'Signing out…':'Sign out'}</button></div>{logoutError&&<p role="alert" className="tray-error">{logoutError}</p>}</div>
    </main>
  </div>;
}
