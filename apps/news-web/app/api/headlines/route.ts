import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Topic='africa'|'world'|'business'|'technology'|'nigeria';
type Source={label:string;url:string;category:Topic};
/* Exact allowlist: never fetch a publisher URL supplied by a browser. Feeds may
 * rate-limit or change; unavailable sources simply yield no articles. */
const SOURCES:Source[]=[
 {label:'BBC News · Africa',url:'https://feeds.bbci.co.uk/news/world/africa/rss.xml',category:'africa'},
 {label:'BBC News · World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',category:'world'},
 {label:'BBC News · Business',url:'https://feeds.bbci.co.uk/news/business/rss.xml',category:'business'},
 {label:'BBC News · Technology',url:'https://feeds.bbci.co.uk/news/technology/rss.xml',category:'technology'},
 {label:'Punch Newspapers',url:'https://punchng.com/feed/',category:'nigeria'},
 {label:'Premium Times',url:'https://www.premiumtimesng.com/feed',category:'nigeria'},
 {label:'Channels Television',url:'https://www.channelstv.com/feed/',category:'nigeria'},
 {label:'Daily Post Nigeria',url:'https://dailypost.ng/feed/',category:'nigeria'},
];
function decode(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#(\d+)|#x([0-9a-f]+));/gi,(all,dec,hex)=>{if(dec||hex){const n=parseInt(dec||hex,hex?16:10);return n>0&&n<0x110000?String.fromCodePoint(n):'';}return ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[all.toLowerCase() as '&amp;'|'&lt;'|'&gt;'|'&quot;'|'&apos;'|'&nbsp;']||all;}).trim();}
function tag(xml:string,name:string){const match=new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,'i').exec(xml);return match?decode(match[1]):'';}
function httpsUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function imageFromItem(xml:string){const m=/<(?:media:thumbnail|media:content|enclosure)\b[^>]*\burl=["']([^"']+)["'][^>]*>/i.exec(xml);return m?httpsUrl(decode(m[1])):'';}
function parse(xml:string,source:Source){return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)).slice(0,14).flatMap((m,i)=>{const body=m[1],title=tag(body,'title'),url=httpsUrl(tag(body,'link'));if(!title||!url)return [];const published=tag(body,'pubDate');return [{id:`${source.category}-${i}-${url.slice(-45)}`,title:title.slice(0,240),description:tag(body,'description').slice(0,260),url,source:source.label,publishedAt:Number.isFinite(Date.parse(published))?new Date(published).toISOString():'',category:source.category,image:imageFromItem(body)}];});}
export async function GET(req:NextRequest){
 const category=req.nextUrl.searchParams.get('category')||'top';
 if(!['top','africa','world','business','technology','nigeria','local'].includes(category))return NextResponse.json({message:'Unknown news category'}, {status:400});
 const selected=category==='top'?SOURCES:category==='local'||category==='nigeria'?SOURCES.filter(s=>s.category==='nigeria'):SOURCES.filter(s=>s.category===category);
 const batches=await Promise.allSettled(selected.map(async source=>{const response=await fetch(source.url,{signal:AbortSignal.timeout(6500),cache:'no-store',headers:{'User-Agent':'BAZAARA-News/2.0 (+https://bazaara.com; publisher-linked RSS reader)','Accept':'application/rss+xml,application/xml,text/xml'}});if(!response.ok)throw Error('Feed unavailable');const size=Number(response.headers.get('content-length')||0);if(size>1100000)throw Error('Feed too large');const xml=(await response.text()).slice(0,1100000);return parse(xml,source);}));
 const articles=batches.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 if(!articles.length)return NextResponse.json({message:'Publisher feeds are not reachable. Try again later; no headlines will be invented.'},{status:503,headers:{'Cache-Control':'no-store'}});
 const unique=Array.from(new Map(articles.map(a=>[a.url,a])).values()).sort((a,b)=>Date.parse(b.publishedAt||'1970-01-01')-Date.parse(a.publishedAt||'1970-01-01')).slice(0,100);
 return NextResponse.json({articles:unique,retrievedAt:new Date().toISOString(),sources:selected.map(s=>s.label),partial:batches.some(r=>r.status==='rejected')},{headers:{'Cache-Control':'public, s-maxage=180, stale-while-revalidate=180','X-Content-Type-Options':'nosniff'}});
}
