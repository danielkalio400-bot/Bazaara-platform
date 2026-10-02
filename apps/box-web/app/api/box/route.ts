import {NextRequest} from 'next/server';
import {mutationAllowed,relay,error} from '../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:NextRequest){return relay(r,'GET','/v1/box');}
export async function POST(r:NextRequest){
  if(!mutationAllowed(r))return error('Invalid request origin.',403);
  const raw=await r.text();if(raw.length>2048)return error('Folder data too large.',413);
  let data:unknown;try{data=JSON.parse(raw);}catch{return error('Invalid JSON.');}
  if(!data||typeof data!=='object'||Array.isArray(data)||typeof (data as {name?:unknown}).name!=='string')return error('A folder name is required.');
  return relay(r,'POST','/v1/box/folders',{headers:{'Content-Type':'application/json'},body:raw});
}
