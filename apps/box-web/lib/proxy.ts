import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
export const MAX_UPLOAD = 10 * 1024 * 1024;
const PLATFORM = process.env.PLATFORM_API_ORIGIN || 'http://127.0.0.1:4000';
const BOX = process.env.BOX_API_ORIGIN || 'http://127.0.0.1:4022';
const WEB = process.env.BOX_WEB_ORIGIN || 'http://localhost:3022';
export const nocache = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export function error(message:string,status=400){return NextResponse.json({message},{status,headers:nocache});}
export function mutationAllowed(r:NextRequest){
  try {return r.headers.get('origin')===new URL(WEB).origin && r.headers.get('sec-fetch-site')!=='cross-site';}catch{return false;}
}
export async function authorized(r:NextRequest):Promise<string|null|undefined>{
  const cookie=r.headers.get('cookie');if(!cookie)return null;
  try{
    const result=await fetch(`${PLATFORM}/v1/bazid/me`,{headers:{cookie,accept:'application/json'},redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(5000)});
    if(result.status===401||result.status===403)return null;
    if(!result.ok)return undefined;
    const body=await result.json();
    return typeof body?.user?.id==='string'&&body.user.id.length<=128&&body.user.id.length>0?body.user.id:undefined;
  }catch{return undefined;}
}
export async function callBox(r:NextRequest,method:string,path:string,init:{headers?:Record<string,string>,body?:BodyInit}={}){
  const sub=await authorized(r);if(sub===null)return error('Sign in using BazID.',401);if(sub===undefined)return error('Identity service unavailable.',502);
  const secret=process.env.BOX_INTERNAL_SECRET;if(!secret||secret.length<32)return error('Box service is not configured.',503);
  const blob=Buffer.from(JSON.stringify({aud:'bazaara-box-v1',sub,method,path,exp:Math.floor(Date.now()/1000)+20})).toString('base64url');
  const signature=createHmac('sha256',secret).update(blob).digest('base64url');
  try{return await fetch(`${BOX}${path}`,{method,headers:{...init.headers,'x-box-identity':`${blob}.${signature}`},body:init.body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(20000)});}
  catch{return error('Box service unavailable.',502);}
}
export async function relay(r:NextRequest,method:string,path:string,init:{headers?:Record<string,string>,body?:BodyInit}={}){
  const result=await callBox(r,method,path,init);
  if(result instanceof NextResponse)return result;
  const raw=await result.text();
  const response=new NextResponse(raw,{status:result.status,headers:{...nocache,'Content-Type':'application/json; charset=utf-8'}});
  return response;
}
