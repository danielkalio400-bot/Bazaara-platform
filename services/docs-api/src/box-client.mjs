import {createAssertion} from './auth.mjs';
export class BoxClientError extends Error{constructor(message,status=502){super(message);this.status=status;}}
export function makeBoxClient({origin='http://127.0.0.1:4022',secret}){
  if(typeof secret!=='string'||secret.length<32)throw new Error('Missing BOX_INTERNAL_SECRET (32+ characters)');
  const base=new URL(origin);if(base.protocol!=='http:'&&base.protocol!=='https:')throw new Error('Invalid BOX_API_ORIGIN');
  async function call(sub,method,path,{headers={},body}={}){
    const token=createAssertion(secret,sub,method,path,'bazaara-box-v1');
    let result;try{result=await fetch(new URL(path,base),{method,headers:{...headers,'x-box-identity':token},body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});}catch{throw new BoxClientError('Box service unavailable.',503);}
    if(!result.ok){let message='Box storage request failed.';try{const j=await result.json();if(typeof j?.message==='string')message=j.message;}catch{}throw new BoxClientError(message,result.status>=500?503:result.status);}
    return result;
  }
  return {
    async health(){try{const r=await fetch(new URL('/health/live',base),{cache:'no-store',signal:AbortSignal.timeout(2500)});return r.ok;}catch{return false;}},
    async upload(sub,name,buffer){const r=await call(sub,'POST','/v1/box/files',{headers:{'x-box-filename':encodeURIComponent(name),'content-type':'application/octet-stream','content-length':String(buffer.length)},body:buffer});return r.json();},
    async download(sub,id){const path=`/v1/box/files/${id}`;const r=await call(sub,'GET',path);return Buffer.from(await r.arrayBuffer());},
    async remove(sub,id){const path=`/v1/box/files/${id}`;const r=await call(sub,'DELETE',path);return r.json();}
  };
}
