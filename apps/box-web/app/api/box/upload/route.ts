import {NextRequest} from 'next/server';
import {MAX_UPLOAD,mutationAllowed,authorized,relay,error} from '../../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(r:NextRequest){
  if(!mutationAllowed(r))return error('Invalid request origin.',403);
  // Reject unauthenticated uploads before buffering or decoding multipart bodies.
  const principal=await authorized(r);
  if(principal===null)return error('Sign in using BazID.',401);
  if(principal===undefined)return error('Identity service unavailable.',502);
  // Bound the entire multipart stream before parsing. Missing or forged Content-Length
  // must never let the web process buffer an unlimited request.
  if(!(r.headers.get('content-type')||'').toLowerCase().startsWith('multipart/form-data;'))return error('Expected multipart file upload.',415);
  const limit=MAX_UPLOAD+64*1024;
  const declared=Number(r.headers.get('content-length')||0);
  if(!Number.isSafeInteger(declared)||declared<0||declared>limit)return error('Maximum file size is 10 MB.',413);
  const reader=r.body?.getReader();if(!reader)return error('Missing upload body.');
  const parts:Uint8Array[]=[];let received=0;
  try{
    while(true){const part=await reader.read();if(part.done)break;
      received+=part.value.byteLength;if(received>limit){await reader.cancel();return error('Maximum file size is 10 MB.',413)}
      parts.push(part.value);
    }
  }catch{return error('Upload interrupted.',400);}
  let form:FormData;
  try{const request=new Request(r.url,{method:'POST',headers:{'Content-Type':r.headers.get('content-type')||''},body:Buffer.concat(parts.map(part=>Buffer.from(part)),received)});form=await request.formData();}
  catch{return error('Invalid upload.',400);}
  const file=form.get('file'),folderId=form.get('folderId');
  if(!(file instanceof File)||!file.name||!file.size||file.size>MAX_UPLOAD)return error('Select a file between 1 byte and 10 MB.',413);
  const name=encodeURIComponent(file.name);
  const headers:Record<string,string>={'Content-Type':'application/octet-stream','x-box-filename':name};
  if(typeof folderId==='string'&&folderId)headers['x-box-folder']=folderId;
  return relay(r,'POST','/v1/box/files',{headers,body:file});
}
