"use client";
import { usePathname } from "next/navigation";
/** App-specific navigation; no other BAZAARA app is needed to use BChat. */
export default function BChatCallsNav(){
  const pathname=usePathname();
  if(pathname?.startsWith("/calls") || pathname?.startsWith("/phase3") || pathname?.startsWith("/phase2") || pathname?.startsWith("/phase1-ui")) return null;
  return <nav aria-label="BChat messages and calls" style={{position:"relative",zIndex:20,display:"flex",gap:15,alignItems:"center",padding:"8px 16px",background:"#070b16",color:"#f7f9ff",borderBottom:"1px solid #293652",fontFamily:"ui-sans-serif,system-ui,sans-serif"}}>
    <strong style={{fontSize:14,letterSpacing:".05em"}}>BChat</strong>
    <a href="/messages" aria-label="BChat inbox" style={{color:"#b6c0d6",textDecoration:"none",fontSize:13}}>Messages</a>
    <a href="/calls" style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:7,color:"#f7f9ff",textDecoration:"none",fontSize:13,fontWeight:700,padding:"8px 14px",borderRadius:10,background:"linear-gradient(110deg,#7255da,#2869ca)"}}>☎ Voice & video calls</a>
  </nav>;
}
