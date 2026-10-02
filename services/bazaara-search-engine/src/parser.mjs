import { freshnessScore, normalizeUrl, sha256, tokenize } from './util.mjs';

function decode(s='') {
  return String(s)
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Number.parseInt(n,16)))
    .replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'");
}
function attr(tag,name) {
  const re=new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i');
  const m=tag.match(re); return decode(m?.[1] ?? m?.[2] ?? m?.[3] ?? '');
}
function tags(html,name) { return html.match(new RegExp(`<${name}\\b[^>]*>`,'gi')) ?? []; }
function firstMatch(html,re) { const m=html.match(re); return decode(m?.[1] ?? '').replace(/\s+/g,' ').trim(); }
function stripHtml(html) {
  return decode(String(html)
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi,' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi,' ')
    .replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}
function parseIntSafe(v) { const n=Number.parseInt(v ?? '',10); return Number.isFinite(n)?n:null; }
function metaMap(html) {
  const map=new Map();
  for (const tag of tags(html,'meta')) {
    const key=(attr(tag,'name')||attr(tag,'property')||attr(tag,'http-equiv')).toLowerCase();
    const value=attr(tag,'content'); if (key && value && !map.has(key)) map.set(key,value);
  }
  return map;
}
function jsonLdInfo(html) {
  const dates=[]; const types=new Set();
  const re=/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const root=JSON.parse(m[1]); const stack=Array.isArray(root)?[...root]:[root];
      while (stack.length) {
        const x=stack.pop(); if (!x || typeof x!=='object') continue;
        const t=x['@type'];
        if (typeof t==='string') types.add(t.toLowerCase());
        else if (Array.isArray(t)) for (const v of t) if (typeof v==='string') types.add(v.toLowerCase());
        for (const key of ['datePublished','dateModified']) if (x[key] && Number.isFinite(Date.parse(x[key]))) dates.push(String(x[key]));
        for (const [k,v] of Object.entries(x)) if (k!=='@context' && v && typeof v==='object') stack.push(v);
      }
    } catch {}
  }
  return {date:dates[0]??null,types};
}

export function parseHtml(html,fetchedUrl,statusCode=200,contentType='text/html') {
  const metas=metaMap(html);
  const htmlTag=(html.match(/<html\b[^>]*>/i)||[''])[0];
  const title=firstMatch(html,/<title\b[^>]*>([\s\S]*?)<\/title>/i).slice(0,500) || (metas.get('og:title')||'').slice(0,500);
  const description=(metas.get('description')||metas.get('og:description')||'').replace(/\s+/g,' ').trim().slice(0,2000);
  const language=(attr(htmlTag,'lang')||metas.get('content-language')||'').slice(0,50);
  const robots=(metas.get('robots')||metas.get('googlebot')||'').toLowerCase();
  const noindex=robots.split(',').map(x=>x.trim()).includes('noindex');

  let canonical=fetchedUrl;
  for (const tag of tags(html,'link')) {
    if (attr(tag,'rel').toLowerCase().split(/\s+/).includes('canonical')) { canonical=normalizeUrl(attr(tag,'href'),fetchedUrl)||fetchedUrl; break; }
  }

  const timeTag=(html.match(/<time\b[^>]*datetime\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)[^>]*>/i)||[''])[0];
  const jsonLd=jsonLdInfo(html);
  const published=metas.get('article:published_time')||metas.get('date')||attr(timeTag,'datetime')||jsonLd.date;
  const publishedAt=published && Number.isFinite(Date.parse(published))?new Date(published).toISOString():null;
  const ogType=(metas.get('og:type')||'').toLowerCase();

  const articleMatch=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const candidates=[articleMatch?.[1],mainMatch?.[1],bodyMatch?.[1],html].filter(Boolean).map(stripHtml);
  let text=candidates.sort((a,b)=>b.length-a.length)[0]?.slice(0,500_000)||'';

  const links=[];
  const aRe=/<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(aRe)) {
    const tag=`<a ${m[1]}>`; const u=normalizeUrl(attr(tag,'href'),fetchedUrl); if (!u) continue;
    links.push({url:u,anchor:stripHtml(m[2]).slice(0,300),rel:attr(tag,'rel').slice(0,100)});
  }
  const uniqueLinks=[...new Map(links.map(x=>[x.url,x])).values()].slice(0,2000);

  const images=[];
  const socialImage=metas.get('og:image')||metas.get('twitter:image')||metas.get('twitter:image:src');
  if (socialImage) {
    const u=normalizeUrl(socialImage,fetchedUrl);
    if (u && !/\.svg(?:$|[?#])/i.test(u) && !/(?:privacy|favicon|sprite)/i.test(u)) images.push({url:u,alt:title,title,width:null,height:null});
  }
  for (const tag of tags(html,'img')) {
    const u=normalizeUrl(attr(tag,'src')||attr(tag,'data-src'),fetchedUrl); if (!u) continue;
    if (/\.svg(?:$|[?#])/i.test(u) || /(?:privacyoptions|favicon|sprite)/i.test(u)) continue;
    images.push({url:u,alt:attr(tag,'alt').slice(0,500),title:attr(tag,'title').slice(0,500),width:parseIntSafe(attr(tag,'width')),height:parseIntSafe(attr(tag,'height'))});
  }

  const words=tokenize(text);
  const pathname=new URL(fetchedUrl).pathname || '/';
  const rootLike=pathname==='/' || pathname==='';
  const newsSchema=[...jsonLd.types].some(t=>['newsarticle','reportagenewsarticle'].includes(t));
  const editorialSchema=[...jsonLd.types].some(t=>['article','blogposting'].includes(t));
  const explicitArticleDate=metas.get('article:published_time');
  const articleSection=metas.get('article:section');
  const isNews=newsSchema || (!rootLike && ogType==='article' && (!!explicitArticleDate || !!articleSection || editorialSchema));
  const isVideo=ogType.includes('video') || jsonLd.types.has('videoobject');
  const isProduct=jsonLd.types.has('product') || jsonLd.types.has('offer');
  const isBook=jsonLd.types.has('book');
  let quality=0;
  if (title) quality+=0.2; if (description) quality+=0.1;
  if (words.length>=200) quality+=0.25; else if (words.length>=50) quality+=0.12;
  if (new URL(fetchedUrl).protocol==='https:') quality+=0.05;
  if (canonical===fetchedUrl) quality+=0.05; if (uniqueLinks.length) quality+=0.05; if (!noindex) quality+=0.1;
  quality=Math.min(1,quality);

  return {url:fetchedUrl,canonical_url:canonical,domain:new URL(fetchedUrl).hostname,title,description,body:text,language,content_type:contentType,status_code:statusCode,content_hash:sha256(`${title}\n${text}`),published_at:publishedAt,fetched_at:new Date().toISOString(),word_count:words.length,indexable:!noindex&&statusCode>=200&&statusCode<300&&text.length>=40,is_news:isNews,is_video:isVideo,is_product:isProduct,is_book:isBook,quality_score:quality,freshness_score:freshnessScore(publishedAt),links:uniqueLinks,images:[...new Map(images.map(x=>[x.url,x])).values()].slice(0,100)};
}
