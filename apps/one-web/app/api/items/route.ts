import {NextRequest,NextResponse} from 'next/server';
const origin=process.env.PRODUCT_API_ORIGIN||'http://127.0.0.1:4051';
const secret=process.env.PRODUCT_INTERNAL_SECRET||'';
function headers(req:NextRequest){return {'content-type':'application/json','x-bazaara-internal':secret,'x-bazaara-user':req.cookies.get('bazid_sub')?.value||'local-dev'}}
export async function GET(req:NextRequest){const r=await fetch(origin+'/api/v1/items',{headers:headers(req),cache:'no-store'});return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json'}})}
export async function POST(req:NextRequest){const body=await req.text();const r=await fetch(origin+'/api/v1/items',{method:'POST',headers:headers(req),body});return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json'}})}
