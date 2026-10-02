"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorText, signInUrl, useSocialSession } from "@bazaara/social-ui";

type Person = { id: string; displayName: string | null; socialProfile?: {handle: string} | null };
type Conversation = { id: string; participants: Person[]; unread: number; updatedAt: string };
type Call = {
  id: string; conversationId: string; callerUserId: string; recipientUserId: string;
  mode: "audio" | "video"; status: "RINGING" | "ACTIVE" | "DECLINED" | "ENDED" | "MISSED";
  createdAt: string; updatedAt: string;
};
type Wire =
  | {type:"description";sdpType:"offer" | "answer";sdp:string}
  | {type:"candidate";candidate:string;sdpMid?:string|null;sdpMLineIndex?:number|null};
type SignalPacket = {sequence:number;senderUserId:string;payload:Wire};
type CallInbox = {calls:Call[]};
type SignalInbox = {signals:SignalPacket[];cursor:number};
const callUrl = (id:string) => `/v1/bchat/calls/${encodeURIComponent(id)}`;
const STUN = process.env.NEXT_PUBLIC_BCHAT_STUN_URL || "stun:stun.l.google.com:19302";
const rtcConfiguration:RTCConfiguration={iceServers:[{urls:STUN}]};

export default function CallsExperience(){
  const session=useSocialSession();
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [calls,setCalls]=useState<Call[]>([]);
  const [selected,setSelected]=useState("");
  const [current,setCurrent]=useState<Call|null>(null);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [muted,setMuted]=useState(false);
  const [cameraOff,setCameraOff]=useState(false);
  const [connection,setConnection]=useState("Not connected");
  const localVideo=useRef<HTMLVideoElement>(null);
  const remoteVideo=useRef<HTMLVideoElement>(null);
  const localStream=useRef<MediaStream|null>(null);
  const remoteStream=useRef<MediaStream|null>(null);
  const peer=useRef<RTCPeerConnection|null>(null);
  const active=useRef<Call|null>(null);
  const lastSignal=useRef(0);
  const pendingIce=useRef<RTCIceCandidateInit[]>([]);
  const negotiating=useRef(false);
  const unmounted=useRef(false);
  const userId=session.user?.id;

  const who=useCallback((conversationId:string)=>{
    const item=conversations.find(c=>c.id===conversationId);
    return item?.participants.find(p=>p.id!==userId)?.displayName??"BAZAARA member";
  },[conversations,userId]);

  const stopMedia=useCallback(()=>{
    peer.current?.close();peer.current=null;
    localStream.current?.getTracks().forEach(track=>track.stop());localStream.current=null;
    remoteStream.current?.getTracks().forEach(track=>track.stop());remoteStream.current=null;
    if(localVideo.current)localVideo.current.srcObject=null;
    if(remoteVideo.current)remoteVideo.current.srcObject=null;
    lastSignal.current=0;pendingIce.current=[];negotiating.current=false;
    setMuted(false);setCameraOff(false);setConnection("Disconnected");
  },[]);

  const end=useCallback(async()=>{
    const item=active.current;
    if(item){try{await api.post(`${callUrl(item.id)}/end`,{});}catch(e){setNotice(errorText(e));}}
    active.current=null;setCurrent(null);stopMedia();
  },[stopMedia]);

  const getDevices=useCallback(async(mode:"audio"|"video")=>{
    if(!navigator.mediaDevices?.getUserMedia)throw Error("Calling requires a browser with camera/microphone permissions over HTTPS or localhost.");
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:mode==="video"?{width:{ideal:1280},height:{ideal:720}}:false});
    localStream.current=stream;
    if(localVideo.current)localVideo.current.srcObject=stream;
    return stream;
  },[]);

  const sendSignal=useCallback(async(callId:string,payload:Wire)=>{
    await api.post(`${callUrl(callId)}/signals`,payload);
  },[]);

  const flushCandidates=useCallback(async()=>{
    const pc=peer.current;
    if(!pc?.remoteDescription)return;
    while(pendingIce.current.length){
      const ice=pendingIce.current.shift();
      if(ice)try{await pc.addIceCandidate(ice);}catch(e){setNotice(`Network candidate rejected: ${errorText(e)}`);}
    }
  },[]);

  const makePeer=useCallback(async(call:Call,initiator:boolean)=>{
    if(peer.current || negotiating.current)return;
    if(!localStream.current)throw Error("Microphone/camera access is required for this call.");
    negotiating.current=true;
    try{
      const pc=new RTCPeerConnection(rtcConfiguration);
      peer.current=pc;remoteStream.current=new MediaStream();
      if(remoteVideo.current)remoteVideo.current.srcObject=remoteStream.current;
      for(const track of localStream.current.getTracks())pc.addTrack(track,localStream.current);
      pc.onicecandidate=e=>{
        if(e.candidate){const x=e.candidate.toJSON();
          if(!x.candidate)return;
          void sendSignal(call.id,{type:"candidate",candidate:x.candidate,sdpMid:x.sdpMid,sdpMLineIndex:x.sdpMLineIndex}).catch(err=>setNotice(errorText(err)));
        }
      };
      pc.ontrack=e=>{
        const remote=remoteStream.current;
        if(!remote)return;
        if(!remote.getTracks().some(x=>x.id===e.track.id))remote.addTrack(e.track);
        if(remoteVideo.current){remoteVideo.current.srcObject=remote;void remoteVideo.current.play().catch(()=>setNotice("Press the remote video to start playback if autoplay was blocked."));}
      };
      pc.onconnectionstatechange=()=>{
        setConnection(pc.connectionState);
        if(pc.connectionState==="failed")setNotice("Peer connection failed. Check network restrictions or configure a TURN server.");
      };
      if(initiator){
        const offer=await pc.createOffer();await pc.setLocalDescription(offer);
        await sendSignal(call.id,{type:"description",sdpType:"offer",sdp:offer.sdp??""});
      }
    }finally{negotiating.current=false;}
  },[sendSignal]);

  const processSignal=useCallback(async(packet:SignalPacket)=>{
    const pc=peer.current;const call=active.current;
    if(!pc||!call)return;
    const p=packet.payload;
    if(p.type==="candidate"){
      const ice:RTCIceCandidateInit={candidate:p.candidate,sdpMid:p.sdpMid,sdpMLineIndex:p.sdpMLineIndex};
      if(!pc.remoteDescription)pendingIce.current.push(ice);
      else await pc.addIceCandidate(ice);
      return;
    }
    if(p.sdpType==="offer"){
      if(call.callerUserId===userId)return;
      if(pc.signalingState!=="stable")return;
      await pc.setRemoteDescription({type:"offer",sdp:p.sdp});
      await flushCandidates();
      const answer=await pc.createAnswer();await pc.setLocalDescription(answer);
      await sendSignal(call.id,{type:"description",sdpType:"answer",sdp:answer.sdp??""});
    }else if(p.sdpType==="answer"){
      if(call.callerUserId!==userId||pc.signalingState!=="have-local-offer")return;
      await pc.setRemoteDescription({type:"answer",sdp:p.sdp});
      await flushCandidates();
    }
  },[userId,flushCandidates,sendSignal]);

  const refresh=useCallback(async()=>{
    if(!userId)return;
    const [inbox,convos]=await Promise.all([
      api.get<CallInbox>("/v1/bchat/calls/inbox",{maxRetries:0}),
      api.get<{conversations:Conversation[]}>("/v1/bazchat/conversations",{maxRetries:0}),
    ]);
    if(unmounted.current)return;
    setCalls(inbox.calls);setConversations(convos.conversations);
    const currentCall=active.current;
    if(!currentCall)return;
    const live=inbox.calls.find(c=>c.id===currentCall.id);
    if(!live || (live.status!=="RINGING"&&live.status!=="ACTIVE")){
      active.current=null;setCurrent(null);stopMedia();
      setNotice(live?.status==="DECLINED"?"The call was declined.":live?.status==="MISSED"?"No answer.":"Call ended.");
      return;
    }
    active.current=live;setCurrent(live);
    if(live.status==="ACTIVE" && live.callerUserId===userId && !peer.current && localStream.current){
      await makePeer(live,true);
    }
  },[userId,makePeer,stopMedia]);

  const pollSignals=useCallback(async()=>{
    const item=active.current;
    if(!item||item.status!=="ACTIVE"||!peer.current)return;
    // Do not overlap signal polls: ICE messages must be delivered in sequence.
    if(signalPolling.current)return;
    signalPolling.current=true;
    try{
      let more=true;
      for(let page=0;page<8&&more;page++){
        const r=await api.get<SignalInbox>(`${callUrl(item.id)}/signals`,{query:{after:lastSignal.current},maxRetries:0});
        for(const signal of r.signals){if(signal.sequence>lastSignal.current){await processSignal(signal);lastSignal.current=signal.sequence;}}
        if(r.signals.length===0){lastSignal.current=r.cursor;more=false;}
        else more=r.signals.length===100;
      }
    }catch(e){setNotice(errorText(e));}
    finally{signalPolling.current=false;}
  },[processSignal]);
  const signalPolling=useRef(false);

  useEffect(()=>{
    if(!userId)return;
    unmounted.current=false;
    void refresh().catch(e=>setNotice(errorText(e)));
    const inboxTimer=window.setInterval(()=>void refresh().catch(e=>setNotice(errorText(e))),2000);
    const signalsTimer=window.setInterval(()=>void pollSignals(),800);
    return()=>{unmounted.current=true;window.clearInterval(inboxTimer);window.clearInterval(signalsTimer);stopMedia();};
  },[userId,refresh,pollSignals,stopMedia]);

  async function dial(mode:"audio"|"video"){
    if(!selected||busy)return;
    setBusy(true);setNotice("");
    try{
      await getDevices(mode);
      const r=await api.post<{call:Call}>("/v1/bchat/calls",{conversationId:selected,mode});
      active.current=r.call;setCurrent(r.call);setConnection("Waiting for answer");
    }catch(e){stopMedia();setNotice(errorText(e));}finally{setBusy(false);}
  }
  async function accept(call:Call){
    if(busy)return;
    setBusy(true);setNotice("");
    try{
      await getDevices(call.mode);
      const r=await api.post<{call:Call}>(`${callUrl(call.id)}/accept`,{});
      active.current=r.call;setCurrent(r.call);lastSignal.current=0;
      await makePeer(r.call,false);
    }catch(e){
      stopMedia();setNotice(errorText(e));
      // Do not leave a ringing/active call behind after local device initialization fails.
      await api.post(`${callUrl(call.id)}/end`,{}).catch(()=>undefined);
    }finally{setBusy(false);}
  }
  async function decline(call:Call){
    try{await api.post(`${callUrl(call.id)}/decline`,{});void refresh();}
    catch(e){setNotice(errorText(e));}
  }
  function toggleMute(){
    const audio=localStream.current?.getAudioTracks()??[];
    const next=!muted;audio.forEach(t=>{t.enabled=!next;});setMuted(next);
  }
  function toggleCamera(){
    const video=localStream.current?.getVideoTracks()??[];
    const next=!cameraOff;video.forEach(t=>{t.enabled=!next;});setCameraOff(next);
  }
  async function shareScreen(){
    try{
      if(!navigator.mediaDevices.getDisplayMedia)throw Error("Screen sharing is not available in this browser.");
      const screen=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      const track=screen.getVideoTracks()[0];
      if(!track)return;
      const sender=peer.current?.getSenders().find(x=>x.track?.kind==="video");
      if(!sender){track.stop();throw Error("Screen sharing currently requires an active video call.");}
      const camera=localStream.current?.getVideoTracks()[0];
      await sender.replaceTrack(track);
      track.addEventListener("ended",()=>{void sender.replaceTrack(camera??null);},{once:true});
    }catch(e){setNotice(errorText(e));}
  }
  const incoming=calls.filter(c=>c.recipientUserId===userId && c.status==="RINGING");
  const history=calls.filter(c=>c.status!=="RINGING"&&c.status!=="ACTIVE");
  return <main className="bc4"><header className="bc4-header"><a className="bc4-logo" href="/">◈ <span>BChat</span></a><nav aria-label="BChat navigation"><a href="/messages">Inbox</a><a aria-current="page" href="/calls">Calls</a></nav><span className="bc4-badge">BAZAARA · REALTIME CALLS</span></header>
    <section className="bc4-hero"><div><span className="bc4-overline">PRIVATE COMMUNICATION</span><h1>Voice and video calls</h1><p>Place or receive live browser-to-browser calls with BAZAARA members. Your microphone and camera activate only with your permission.</p></div><div className="bc4-status">{connection}</div></section>
    {session.loading?<p role="status">Checking BazID session…</p>:session.unauthenticated?<p>Please <a href={signInUrl()}>sign in to BChat</a>.</p>:session.error?<p role="alert">{session.error}</p>:<>
    <div className="bc4-layout"><section className="bc4-panel" aria-labelledby="contacts"><h2 id="contacts">Start a call</h2><label htmlFor="bc4-chat">Choose an existing conversation</label><select id="bc4-chat" value={selected} onChange={e=>setSelected(e.target.value)} disabled={Boolean(current)}><option value="">Select member</option>{conversations.filter(c=>c.participants.length===2).map(c=><option key={c.id} value={c.id}>{who(c.id)}</option>)}</select><div className="bc4-actions"><button disabled={!selected||busy||Boolean(current)} onClick={()=>void dial("audio")}>Start voice call</button><button disabled={!selected||busy||Boolean(current)} onClick={()=>void dial("video")}>Start video call</button></div><p className="bc4-small">No contacts? <a href="/messages">Open BChat to start a conversation.</a></p>
      {incoming.length>0&&<div aria-live="polite" className="bc4-incoming"><h3>Incoming call</h3>{incoming.map(c=><div key={c.id} className="bc4-ring"><strong>{who(c.conversationId)}</strong><small>{c.mode==="video"?"Video call":"Voice call"}</small><div className="bc4-actions"><button disabled={busy||Boolean(current)} onClick={()=>void accept(c)}>Accept</button><button className="bc4-destructive" onClick={()=>void decline(c)}>Decline</button></div></div>)}</div>}
      <h3>Recent calls</h3><ul className="bc4-history">{history.slice(0,10).map(c=><li key={c.id}><span>{who(c.conversationId)} · {c.mode}</span><small>{c.status.toLowerCase()} · {new Date(c.createdAt).toLocaleString()}</small></li>)}{history.length===0&&<li>No recent calls in this session.</li>}</ul>
    </section><section className="bc4-panel bc4-stage" aria-label="Current call"><div className="bc4-callhead"><div><h2>{current?who(current.conversationId):"Call stage"}</h2><span>{current?current.status==="RINGING"?"Ringing…":`Live ${current.mode} call`:"Select a member to call"}</span></div>{current&&<span className="bc4-live">{current.mode.toUpperCase()}</span>}</div>
      <div className="bc4-media"><video ref={remoteVideo} autoPlay playsInline onClick={()=>void remoteVideo.current?.play()} aria-label="Remote participant video"/><div className="bc4-remoteLabel">{current?"Remote participant":"No active call"}</div><video className="bc4-self" ref={localVideo} autoPlay muted playsInline aria-label="Your camera preview"/></div>
      {current&&<div className="bc4-controls"><button onClick={toggleMute}>{muted?"Unmute":"Mute"}</button>{current.mode==="video"&&<><button onClick={toggleCamera}>{cameraOff?"Camera on":"Camera off"}</button><button onClick={()=>void shareScreen()} disabled={current.status!=="ACTIVE"}>Share screen</button></>}<button className="bc4-destructive" onClick={()=>void end()}>End call</button></div>}
      <p className="bc4-small">Browser calling requires both participants to keep this Calls page open. Peer connectivity depends on network configuration; a TURN service is needed for reliable internet calling.</p>
    </section></div>
    {notice&&<div role="alert" className="bc4-alert">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss alert">Dismiss</button></div>}
    </>}
    <footer>WebRTC uses encrypted media transport. This development release is not audited end-to-end encrypted messaging, does not support group calls, and does not store call recordings.</footer>
  </main>;
}
