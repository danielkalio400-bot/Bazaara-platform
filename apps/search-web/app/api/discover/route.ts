import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type NewsItem={title:string;url:string;source:string;image?:string;publishedAt?:string};
function safeHttps(value:unknown){try{if(typeof value!=='string')return '';const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
/* Search Discover reuses real, publisher-attributed BAZAARA News articles. The
 * hostname is deployment configuration, never input supplied by a browser. */
export async function GET(){
 const configured=process.env.BAZAARA_NEWS_INTERNAL_URL||'http://127.0.0.1:3040';
 let endpoint:URL;
 try {endpoint=new URL('/api/headlines?category=nigeria',configured);
  if(endpoint.username||endpoint.password||!(endpoint.protocol==='https:'||endpoint.protocol==='http:'&&['127.0.0.1','localhost','::1'].includes(endpoint.hostname)))throw Error('Invalid feed host');
 }catch{return NextResponse.json({articles:[],message:'News feed endpoint is not configured safely.'},{status:503,headers:{'Cache-Control':'no-store'}});}
 try{
  const response=await fetch(endpoint.href,{signal:AbortSignal.timeout(6500),cache:'no-store'});
  if(!response.ok)return NextResponse.json({articles:[],message:'News feed is unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});
  const body=await response.json() as {articles?:NewsItem[]};
  const articles=(Array.isArray(body.articles)?body.articles:[]).flatMap(a=>{const url=safeHttps(a.url);if(!url||typeof a.title!=='string')return [];return [{title:a.title.slice(0,220),url,source:typeof a.source==='string'?a.source.slice(0,70):'Publisher',image:safeHttps(a.image),publishedAt:typeof a.publishedAt==='string'?a.publishedAt:''}];}).slice(0,9);
  if(!articles.length)return NextResponse.json({articles:[],message:'No publisher stories are available.'},{status:503,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({articles},{headers:{'Cache-Control':'public,s-maxage=180,stale-while-revalidate=180'}});
 }catch{return NextResponse.json({articles:[],message:'Publisher headlines could not be loaded.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
