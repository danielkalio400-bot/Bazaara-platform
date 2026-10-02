import {NextRequest,NextResponse} from 'next/server';
import {callBox,mutationAllowed,error,nocache} from '../../../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
type RouteParams={params:Promise<{id:string}>};
async function locate(args:RouteParams){const {id}=await args.params;return /^[a-f0-9]{32}$/.test(id)?id:null;}
export async function GET(r:NextRequest,context:RouteParams){
  const id=await locate(context);if(!id)return error('Invalid identifier.');
  const result=await callBox(r,'GET',`/v1/box/files/${id}`);
  if(result instanceof NextResponse)return result;
  if(!result.ok)return new NextResponse(await result.text(),{status:result.status,headers:{...nocache,'Content-Type':'application/json'}});
  const headers:Record<string,string>={...nocache,'Content-Type':'application/octet-stream','Content-Disposition':result.headers.get('content-disposition')||'attachment'};
  const length=result.headers.get('content-length');if(length)headers['Content-Length']=length;
  return new NextResponse(result.body,{status:200,headers});
}
export async function DELETE(r:NextRequest,context:RouteParams){
  if(!mutationAllowed(r))return error('Invalid request origin.',403);
  const id=await locate(context);if(!id)return error('Invalid identifier.');
  const result=await callBox(r,'DELETE',`/v1/box/files/${id}`);
  if(result instanceof NextResponse)return result;
  return new NextResponse(await result.text(),{status:result.status,headers:{...nocache,'Content-Type':'application/json'}});
}
