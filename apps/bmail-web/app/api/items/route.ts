import {NextRequest,NextResponse} from 'next/server';
const origin=process.env.PRODUCT_API_ORIGIN||'http://127.0.0.1:4036';
const secret=process.env.PRODUCT_INTERNAL_SECRET||'';
function headers(req:NextRequest){return {'content-type':'application/json','x-bazaara-internal':secret,'x-bazaara-user':req.cookies.get('bazid_sub')?.value||'local-dev'}}
async function relay(req:NextRequest,method:'GET'|'POST'){
 const r=await fetch(origin+'/api/v1/items',{method,headers:headers(req),body:method==='POST'?await req.text():undefined,cache:'no-store'});
 return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json','cache-control':'private, no-store'}})
}
export async function GET(req:NextRequest){return relay(req,'GET')}
export async function POST(req:NextRequest){return relay(req,'POST')}
