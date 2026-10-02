import { NextRequest, NextResponse } from 'next/server';

/** Optional server-side LibreTranslate-compatible integration.
 * Does not expose the private API key to browser code or store submitted text.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
function endpoint(): URL | null {
  const raw = process.env.BAZAARA_TRANSLATE_ENDPOINT?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.username || u.password || u.hash) return null;
    if (u.protocol === 'https:' || (u.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(u.hostname))) return u;
  } catch { /* invalid configuration */ }
  return null;
}
export async function GET() {
  return NextResponse.json({configured:endpoint() !== null,provider:'LibreTranslate-compatible'}, {headers});
}
export async function POST(req: NextRequest) {
  const upstream=endpoint();
  if (!upstream) return NextResponse.json({message:'Translation provider is not connected. Configure BAZAARA_TRANSLATE_ENDPOINT on the web server.'},{status:503,headers});
  let value:unknown;
  try {value=await req.json();}catch{return NextResponse.json({message:'Expected a JSON request body.'},{status:400,headers});}
  const payload=value as {text?:unknown;source?:unknown;target?:unknown};
  const text=typeof payload?.text==='string'?payload.text.trim():'';
  const source=typeof payload?.source==='string'?payload.source:'auto';
  const target=typeof payload?.target==='string'?payload.target:'';
  if (!text || text.length>2200 || !/^(auto|[a-z]{2,3}(?:-[a-z]{2})?)$/i.test(source) || !/^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(target)) {
    return NextResponse.json({message:'Provide text (up to 2,200 characters) and valid language codes.'},{status:400,headers});
  }
  // This is an explicit action: user text is sent only when Translate is clicked.
  try {
    const body:Record<string,string>={q:text,source,target,format:'text'};
    if (process.env.BAZAARA_TRANSLATE_API_KEY) body.api_key=process.env.BAZAARA_TRANSLATE_API_KEY;
    const response=await fetch(upstream,{method:'POST',redirect:'error',signal:AbortSignal.timeout(13000),headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    if (!response.ok) return NextResponse.json({message:'The translation provider could not complete the request.'},{status:502,headers});
    const size=Number(response.headers.get('content-length')??0);
    if (size>32768) throw new Error('Unexpectedly large provider response');
    const result=await response.json() as {translatedText?:unknown};
    if (typeof result.translatedText!=='string' || result.translatedText.length>8000) throw new Error('Invalid provider response');
    return NextResponse.json({translation:result.translatedText},{headers});
  } catch {
    return NextResponse.json({message:'The translation service is unavailable or timed out.'},{status:502,headers});
  }
}
