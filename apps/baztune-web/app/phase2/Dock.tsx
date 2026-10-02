"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { signInUrl, useSocialSession } from "@bazaara/social-ui";
export type PhaseSession = ReturnType<typeof useSocialSession>;
export function Dock({app,children}:{app:string;children:(session:PhaseSession)=>ReactNode}){
 const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);const close=useRef<HTMLButtonElement>(null);const dialog=useRef<HTMLElement>(null);const session=useSocialSession();
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";close.current?.focus();const onKey=(e:KeyboardEvent)=>{
 if(e.key==="Escape"){setOpen(false);trigger.current?.focus();return}
 if(e.key!=="Tab"||!dialog.current)return;
 const tabbable=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(x=>x.getClientRects().length>0);
 const first=tabbable[0];const last=tabbable[tabbable.length-1];if(!first||!last)return;
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 };document.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",onKey)}},[open]);
 function dismiss(){setOpen(false);trigger.current?.focus()}
 return <><button ref={trigger} className="p2-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><span aria-hidden="true">✦</span>{app} / Phase 2</button>
 {open&&<><div className="p2-mask" aria-hidden="true" onClick={dismiss}/><aside ref={dialog} className="p2" role="dialog" aria-modal="true" aria-label={`${app} Phase 2 tools`}><header><div><small>BAZAARA / ECOSYSTEM 02</small><strong>{app} · Phase 2</strong></div><button ref={close} type="button" className="close" onClick={dismiss} aria-label="Close tools">✕</button></header><main>
 {session.loading?<p role="status">Connecting to BazID…</p>:session.unauthenticated?<div className="card"><h2>Sign in required</h2><p>Use BazID to open this app’s own features.</p><a href={signInUrl()}>Sign in →</a></div>:session.error?<div role="alert" className="alert">{session.error}<button type="button" onClick={()=>void session.refresh()}>Retry</button></div>:session.user?children(session):<p role="alert">Account unavailable.</p>}
 </main></aside></>}</>
}
export function Failure({message,clear}:{message:string;clear:()=>void}){return message?<div className="alert" role="alert">{message} <button type="button" onClick={clear}>Dismiss</button></div>:null}
export function Notice({message}:{message:string}){return message?<div className="success" role="status">{message}</div>:null}
export function saveBlob(name:string,source:string,mime="text/plain") {const blob=new Blob([source],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
