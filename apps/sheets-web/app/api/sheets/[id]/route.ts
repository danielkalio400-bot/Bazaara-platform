import {NextRequest} from 'next/server';import {mutationAllowed,relay,error} from '../../../../lib/proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
function safeId(value:string){return /^[a-f0-9]{32}$/.test(value)?value:null;}
export async function GET(r:NextRequest,{params}:{params:Promise<{id:string}>}){const id=safeId((await params).id);return id?relay(r,'GET',`/v1/sheets/${id}`):error('Invalid workbook identifier.');}
export async function PUT(r:NextRequest,{params}:{params:Promise<{id:string}>}){if(!mutationAllowed(r))return error('Invalid request origin.',403);const id=safeId((await params).id);if(!id)return error('Invalid workbook identifier.');const raw=await r.text();if(raw.length>2200000)return error('Workbook data too large.',413);return relay(r,'PUT',`/v1/sheets/${id}`,{headers:{'Content-Type':'application/json'},body:raw});}
export async function DELETE(r:NextRequest,{params}:{params:Promise<{id:string}>}){if(!mutationAllowed(r))return error('Invalid request origin.',403);const id=safeId((await params).id);return id?relay(r,'DELETE',`/v1/sheets/${id}`):error('Invalid workbook identifier.');}
