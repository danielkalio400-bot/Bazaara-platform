"use client";
import type { ReactNode, CSSProperties } from "react";
import { signInUrl, useSocialSession } from "@bazaara/social-ui";
import "./next.css";

export function useReady() { return useSocialSession(); }
export function Frame({ children, app, initial, mark, accent, nav }:{
  children: ReactNode; app:string; initial:string; mark:string; accent:string;
  nav: { label:string; id:string; onClick?:()=>void; active?:boolean; disabled?:boolean }[];
}) {
  return <div className="nx" style={{ "--nx-accent": accent } as CSSProperties}>
    <a className="nx-skip" href="#nx-main">Skip to content</a>
    <aside className="nx-rail" aria-label={`${app} navigation`}>
      <a className="nx-brand" href="/next" aria-label={`${app} preview home`}><span className="nx-mark">{mark}</span><span><strong>{app}</strong><small>BAZAARA / {initial}</small></span></a>
      <nav className="nx-navigation">{nav.map(n=><button key={n.id} type="button" aria-current={n.active?"page":undefined} className={`nx-nav ${n.active?"active":""}`} onClick={n.onClick} disabled={n.disabled}>{n.label}</button>)}</nav>
      <div className="nx-railFooter"><span className="nx-liveDot"/>Independent product · Research preview</div>
    </aside>
    <div className="nx-stage"><header className="nx-header"><span className="nx-headerProduct"><span className="nx-mini">{mark}</span> {app}</span><span className="nx-headerStatus">2026 experience preview</span><a className="nx-return" href="/">Current app ↗</a></header>
      <main className="nx-main" id="nx-main">{children}</main>
    </div>
  </div>;
}
export function Access({ session, app }:{session:ReturnType<typeof useSocialSession>,app:string}){
  if (session.loading) return <div className="nx-access" role="status"><span className="nx-orb"/>Connecting to BazID…</div>;
  if (session.unauthenticated) return <div className="nx-access"><span className="nx-orb"/><h1>Your {app} experience starts here</h1><p>Sign in with BazID. Your {app} navigation and content remain independent of other applications.</p><a className="nx-primary" href={signInUrl()}>Continue with BazID</a></div>;
  if (session.error) return <div role="alert" className="nx-access"><h1>Connection unavailable</h1><p>{session.error}</p><button className="nx-primary" onClick={()=>void session.refresh()}>Retry</button></div>;
  if (!session.user?.profile) return <div className="nx-access"><span className="nx-orb"/><h1>Finish account setup</h1><p>This preview uses your existing account services without creating a second identity. Complete your current setup to enable live data.</p><a className="nx-primary" href="/">Open {app} setup</a></div>;
  return null;
}
export function State({children}:{children:ReactNode}){return <div className="nx-empty">{children}</div>}
