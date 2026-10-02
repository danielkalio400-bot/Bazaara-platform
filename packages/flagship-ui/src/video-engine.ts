export type Keyframe={time:number;scale:number;x:number;y:number;rotation:number;opacity:number};
export type VideoClip={id:string;assetId:string;in:number;out:number;speed:number;volume:number;brightness:number;contrast:number;saturation:number;hue:number;blur:number;scale:number;x:number;y:number;rotation:number;opacity:number;mirror:boolean;fadeIn:number;fadeOut:number;mask:'none'|'circle';keyframes:Keyframe[]};
export type Caption={id:string;start:number;end:number;text:string};
export type MediaAsset={id:string;name:string;duration:number;width:number;height:number;kind:'video'|'audio'};
export type VideoProject={id:string;name:string;assets:MediaAsset[];clips:VideoClip[];captions:Caption[];aspect:'16:9'|'9:16'|'1:1';resolution:720|1080|2160;fps:24|30|60;fit:'contain'|'cover';background:string;captionSize:number;musicId:string;musicVolume:number;chroma:boolean;chromaColor:string;chromaTolerance:number;updated:string};
export const clipDuration=(c:VideoClip)=>(c.out-c.in)/c.speed;
export const projectDuration=(p:VideoProject)=>p.clips.reduce((n,c)=>n+clipDuration(c),0);
export function transformAt(clip:VideoClip,time:number):Keyframe {
 const fallback={time,scale:clip.scale,x:clip.x,y:clip.y,rotation:clip.rotation,opacity:clip.opacity};
 const frames=[...clip.keyframes].sort((a,b)=>a.time-b.time);if(!frames.length)return fallback;
 if(time<=frames[0].time)return frames[0];if(time>=frames[frames.length-1].time)return frames[frames.length-1];
 const j=frames.findIndex(f=>f.time>=time),a=frames[j-1],b=frames[j],ratio=(time-a.time)/(b.time-a.time||1);
 return {time,scale:a.scale+(b.scale-a.scale)*ratio,x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio,rotation:a.rotation+(b.rotation-a.rotation)*ratio,opacity:a.opacity+(b.opacity-a.opacity)*ratio};
}
export function dimensions(p:VideoProject){const height=p.resolution;if(p.aspect==='9:16')return {width:height,height:Math.round(height*16/9)};if(p.aspect==='1:1')return {width:height,height};return {width:Math.round(height*16/9),height};}
export function filterFor(c:VideoClip){return `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) hue-rotate(${c.hue}deg) blur(${c.blur}px)`;}
function aborted(signal:AbortSignal){if(signal.aborted)throw new DOMException('Export cancelled.','AbortError');}
function mediaReady(el:HTMLMediaElement,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
 const cleanup=()=>{clearTimeout(timer);el.removeEventListener('loadeddata',good);el.removeEventListener('error',bad);signal.removeEventListener('abort',cancel);};
 const good=()=>{cleanup();resolve();},bad=()=>{cleanup();reject(Error('The browser cannot decode this source. Try a browser-compatible MP4 or WebM.'));},cancel=()=>{cleanup();reject(new DOMException('Export cancelled.','AbortError'));};
 const timer=setTimeout(()=>{cleanup();reject(Error('Media loading timed out.'));},15000);el.addEventListener('loadeddata',good);el.addEventListener('error',bad);signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();else if(el.readyState>=2)good();else el.load();
 });}
function seek(el:HTMLMediaElement,time:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
 if(Math.abs(el.currentTime-time)<.02&&el.readyState>=2){resolve();return;}
 const cleanup=()=>{clearTimeout(timer);el.removeEventListener('seeked',good);signal.removeEventListener('abort',cancel);};
 const good=()=>{cleanup();resolve();},cancel=()=>{cleanup();reject(new DOMException('Export cancelled.','AbortError'));};
 const timer=setTimeout(()=>{cleanup();reject(Error('Seeking timed out.'));},15000);el.addEventListener('seeked',good,{once:true});signal.addEventListener('abort',cancel,{once:true});el.currentTime=time;if(signal.aborted)cancel();
 });}
function drawCaption(ctx:CanvasRenderingContext2D,caption:Caption,w:number,h:number,size:number){
 ctx.save();ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='white';ctx.strokeStyle='black';ctx.lineWidth=Math.max(2,size/10);ctx.lineJoin='round';
 const lines:string[]=[];for(const paragraph of caption.text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>w*.9&&line){lines.push(line);line=word;}else line=next;}lines.push(line);}
 lines.slice(0,6).forEach((line,i)=>{const y=h-size*.8-(Math.min(6,lines.length)-i-1)*size*1.25;ctx.strokeText(line,w/2,y,w*.92);ctx.fillText(line,w/2,y,w*.92);});ctx.restore();
}
export async function renderVideo(p:VideoProject,urls:Record<string,string>,signal:AbortSignal,onProgress:(value:number)=>void):Promise<Blob>{
 const total=projectDuration(p);if(total<=0||total>180)throw Error('Choose an edit between 0 and 180 seconds for browser rendering.');
 if(!('MediaRecorder'in window)||!HTMLCanvasElement.prototype.captureStream)throw Error('This browser cannot encode video. Export the project plan or use a current Chromium browser.');
 const type=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('No supported WebM encoder was found.');
 if(p.clips.some(c=>!urls[c.assetId])||p.musicId&&!urls[p.musicId])throw Error('Reattach every source file used by this project before exporting.');
 const canvas=document.createElement('canvas'),{width:w,height:h}=dimensions(p);canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:p.chroma});if(!ctx)throw Error('Canvas rendering is unavailable.');
 const stream=canvas.captureStream(p.fps),videos:HTMLVideoElement[]=[],sources:AudioNode[]=[],audioCtx=new AudioContext(),destination=audioCtx.createMediaStreamDestination();
 const music=document.createElement('audio');let musicGain:GainNode|null=null,recorder:MediaRecorder|null=null,raf=0;const chunks:Blob[]=[];let completed=false;
 const hex=p.chromaColor.replace('#','');const key=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
 try{
  await audioCtx.resume();aborted(signal);
  stream.addTrack(destination.stream.getAudioTracks()[0]);
  const gains:GainNode[]=[];
  for(const clip of p.clips){const v=document.createElement('video');v.src=urls[clip.assetId];v.preload='auto';v.playsInline=true;videos.push(v);await mediaReady(v,signal);if(clip.out>v.duration+.03||clip.in<0||clip.out<=clip.in)throw Error('A trim range is outside its source file.');const source=audioCtx.createMediaElementSource(v),gain=audioCtx.createGain();gain.gain.value=clip.volume;source.connect(gain);gain.connect(destination);sources.push(source,gain);gains.push(gain);v.playbackRate=clip.speed;}
  if(p.musicId){music.src=urls[p.musicId];music.loop=true;music.preload='auto';await mediaReady(music,signal);const source=audioCtx.createMediaElementSource(music);musicGain=audioCtx.createGain();musicGain.gain.value=p.musicVolume;source.connect(musicGain);musicGain.connect(destination);sources.push(source,musicGain);}
  recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:p.resolution===2160?22000000:p.resolution===1080?12000000:6000000,audioBitsPerSecond:192000});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  let failed:Error|null=null;recorder.onerror=()=>{failed=Error('The browser video encoder failed.');};
  let offset=0;
  for(let i=0;i<p.clips.length;i++){
   const clip=p.clips[i],v=videos[i],duration=clipDuration(clip);if(i>0){recorder.pause();music.pause();}await seek(v,clip.in,signal);aborted(signal);await v.play();if(i===0)recorder.start(500);else recorder.resume();if(p.musicId)await music.play();
   await new Promise<void>((resolve,reject)=>{
    const started=performance.now();const cancel=()=>{cancelAnimationFrame(raf);v.pause();signal.removeEventListener('abort',cancel);reject(new DOMException('Export cancelled.','AbortError'));};signal.addEventListener('abort',cancel,{once:true});
    const frame=()=>{try{aborted(signal);if(failed)throw failed;const time=Math.min(duration,Math.max(0,(v.currentTime-clip.in)/clip.speed));if(time>=duration-.02||v.ended){v.pause();signal.removeEventListener('abort',cancel);resolve();return;}if(performance.now()-started>(duration+20)*1000)throw Error('Source playback stalled during export.');
     ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);ctx.save();const t=transformAt(clip,time);const fade=Math.min(clip.fadeIn?time/clip.fadeIn:1,clip.fadeOut?(duration-time)/clip.fadeOut:1,1);ctx.globalAlpha=Math.max(0,Math.min(1,t.opacity*fade));gains[i].gain.value=clip.volume*Math.max(0,Math.min(1,fade));ctx.translate(w/2+t.x*w/100,h/2+t.y*h/100);ctx.rotate(t.rotation*Math.PI/180);ctx.scale((clip.mirror?-1:1)*t.scale,t.scale);if(clip.mask==='circle'){ctx.beginPath();ctx.arc(0,0,Math.min(w,h)/2,0,Math.PI*2);ctx.clip();}ctx.filter=filterFor(clip);const ratio=p.fit==='cover'?Math.max(w/v.videoWidth,h/v.videoHeight):Math.min(w/v.videoWidth,h/v.videoHeight);const dw=v.videoWidth*ratio,dh=v.videoHeight*ratio;ctx.drawImage(v,-dw/2,-dh/2,dw,dh);ctx.restore();
     if(p.chroma){const image=ctx.getImageData(0,0,w,h);for(let k=0;k<image.data.length;k+=4){const distance=Math.hypot(image.data[k]-key[0],image.data[k+1]-key[1],image.data[k+2]-key[2]);if(distance<p.chromaTolerance){image.data[k]=parseInt(p.background.slice(1,3),16);image.data[k+1]=parseInt(p.background.slice(3,5),16);image.data[k+2]=parseInt(p.background.slice(5,7),16);}}ctx.putImageData(image,0,0);}
     for(const caption of p.captions)if(offset+time>=caption.start&&offset+time<caption.end)drawCaption(ctx,caption,w,h,p.captionSize*(h/720));onProgress(Math.min(99,Math.round((offset+time)/total*100)));raf=requestAnimationFrame(frame);
    }catch(e){signal.removeEventListener('abort',cancel);reject(e);}};raf=requestAnimationFrame(frame);
   });offset+=duration;
  }
  aborted(signal);music.pause();
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('The encoder did not finalize its output.')),10000);recorder!.onstop=()=>{clearTimeout(timer);resolve();};recorder!.stop();});
  aborted(signal);if(failed)throw failed;if(!chunks.length)throw Error('No frames were encoded.');completed=true;onProgress(100);return new Blob(chunks,{type:'video/webm'});
 }finally{
  cancelAnimationFrame(raf);videos.forEach(v=>{v.pause();v.removeAttribute('src');v.load();});music.pause();music.removeAttribute('src');music.load();if(recorder&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop());sources.forEach(s=>{try{s.disconnect();}catch{}});await audioCtx.close().catch(()=>undefined);if(!completed)onProgress(0);
 }
}
const srtTime=(seconds:number)=>{const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
export function exportSrt(captions:Caption[]){return [...captions].sort((a,b)=>a.start-b.start).map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}`).join('\n\n');}
export function importSrt(raw:string):Caption[]{const time=(s:string)=>{const match=s.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})$/);if(!match)throw Error('Invalid caption timestamp.');return Number(match[1]||0)*3600+Number(match[2])*60+Number(match[3])+Number(match[4])/1000;};return raw.replace(/^\uFEFF/,'').replace(/\r/g,'').replace(/^WEBVTT[^\n]*\n/,'').split(/\n\s*\n/).flatMap(block=>{const lines=block.trim().split('\n'),i=lines.findIndex(s=>s.includes('-->'));if(i<0)return [];const [start,end]=lines[i].split('-->').map(s=>time(s.trim().split(' ')[0]));if(end<=start)throw Error('Caption end must follow its start.');return [{id:crypto.randomUUID(),start,end,text:lines.slice(i+1).join('\n')}];});}
