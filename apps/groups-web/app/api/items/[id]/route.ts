import {NextRequest,NextResponse} from 'next/server';
const origin=process.env.PRODUCT_API_ORIGIN||'http://127.0.0.1:4046';
const secret=process.env.PRODUCT_INTERNAL_SECRET||'';
export async function DELETE(req:NextRequest,ctx:{params:Promise<{id:string}>}){const {id}=await ctx.params;const r=await fetch(origin+'/api/v1/items/'+encodeURIComponent(id),{method:'DELETE',headers:{'x-bazaara-internal':secret,'x-bazaara-user':req.cookies.get('bazid_sub')?.value||'local-dev'}});return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json'}})}
