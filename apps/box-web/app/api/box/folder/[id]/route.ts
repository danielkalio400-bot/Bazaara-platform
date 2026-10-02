import {NextRequest,NextResponse} from 'next/server';
import {callBox,mutationAllowed,error,nocache} from '../../../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function DELETE(r:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!mutationAllowed(r))return error('Invalid request origin.',403);
  const {id}=await params;if(!/^[a-f0-9]{32}$/.test(id))return error('Invalid identifier.');
  const result=await callBox(r,'DELETE',`/v1/box/folders/${id}`);
  if(result instanceof NextResponse)return result;
  return new NextResponse(await result.text(),{status:result.status,headers:{...nocache,'Content-Type':'application/json'}});
}
