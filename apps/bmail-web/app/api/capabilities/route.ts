import {NextResponse} from 'next/server';
const origin=process.env.PRODUCT_API_ORIGIN||'http://127.0.0.1:4036';
export async function GET(){try{const r=await fetch(origin+'/health/ready',{cache:'no-store',signal:AbortSignal.timeout(5000)});return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json','cache-control':'private, no-store'}})}catch{return NextResponse.json({ok:false,deliveryConfigured:false},{status:200})}}
