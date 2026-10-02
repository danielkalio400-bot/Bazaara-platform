import {NextRequest} from 'next/server';import {mutationAllowed,relay,error} from '../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(r:NextRequest){return relay(r,'GET','/v1/sheets');}
export async function POST(r:NextRequest){if(!mutationAllowed(r))return error('Invalid request origin.',403);const raw=await r.text();if(raw.length>2200000)return error('Workbook data too large.',413);return relay(r,'POST','/v1/sheets',{headers:{'Content-Type':'application/json'},body:raw});}
