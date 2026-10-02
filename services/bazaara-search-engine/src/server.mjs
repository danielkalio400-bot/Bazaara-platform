import http from 'node:http';
import { config } from './config.mjs';
import { SearchDb } from './db.mjs';
import { Embeddings } from './embeddings.mjs';
import { Indexer } from './indexer.mjs';
import { BazCrawler } from './crawler.mjs';
import { SearchEngine } from './search.mjs';
import { recomputePageRank } from './pagerank.mjs';
import { json, normalizeUrl, readJson } from './util.mjs';

const db=new SearchDb(config.dbPath);
const embeddings=new Embeddings(config);
const indexer=new Indexer(db,embeddings,config);
const crawler=new BazCrawler(db,indexer,config);
const search=new SearchEngine(db,embeddings,config);

function corsHeaders(req) {
  const origin=req.headers.origin;
  if (!origin) return {'access-control-allow-origin':'*'};
  if (config.cors.includes('*') || config.cors.includes(origin)) return {'access-control-allow-origin':origin,'vary':'Origin'};
  return {};
}
function admin(req) {
  const value=req.headers['x-bazaara-admin-key'] || req.headers.authorization?.replace(/^Bearer\s+/i,'');
  return value && value===config.adminKey;
}
function params(url) { return Object.fromEntries(url.searchParams.entries()); }

const server=http.createServer(async (req,res)=>{
  const cors=corsHeaders(req);
  if (req.method==='OPTIONS') {
    res.writeHead(204,{...cors,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,x-bazaara-admin-key,authorization'}); return res.end();
  }
  try {
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    const p=params(url);

    if (req.method==='GET' && (url.pathname==='/' || url.pathname==='/health' || url.pathname==='/v1/health')) {
      return json(res,200,{ok:true,service:'bazaara-search-engine',version:'1.4.0',ownedIndex:true,status:db.status()},cors);
    }
    if (req.method==='GET' && url.pathname==='/v1/status') return json(res,200,{ok:true,...db.status(),autoCrawl:config.autoCrawl,renderJs:config.renderJs,semantic:config.semantic,independent:true,externalSearchProviders:0,rankingVersion:'1.4-grounded',relevanceGuard:true},cors);

    if (req.method==='GET' && (url.pathname==='/v1/search' || url.pathname==='/search' || url.pathname==='/api/search')) {
      const result=await search.search(p.q||p.query||'',{page:p.page,count:p.count||p.limit,site:p.site,freshnessDays:p.freshnessDays||p.freshness});
      return json(res,200,result,cors);
    }
    if (req.method==='GET' && url.pathname==='/v1/news') return json(res,200,await search.news(p.q||'',{page:p.page,count:p.count,site:p.site,freshnessDays:p.freshnessDays}),cors);
    if (req.method==='GET' && url.pathname==='/v1/videos') return json(res,200,await search.videos(p.q||'',{page:p.page,count:p.count,site:p.site,freshnessDays:p.freshnessDays}),cors);
    if (req.method==='GET' && url.pathname==='/v1/shopping') return json(res,200,await search.shopping(p.q||'',{page:p.page,count:p.count,site:p.site,freshnessDays:p.freshnessDays}),cors);
    if (req.method==='GET' && url.pathname==='/v1/books') return json(res,200,await search.books(p.q||'',{page:p.page,count:p.count,site:p.site,freshnessDays:p.freshnessDays}),cors);
    if (req.method==='GET' && url.pathname==='/v1/images') return json(res,200,await search.images(p.q||'',{count:p.count}),cors);
    if (req.method==='GET' && url.pathname==='/v1/suggest') return json(res,200,{query:p.q||'',suggestions:search.suggest(p.q||'',p.limit)},cors);
    if (req.method==='POST' && url.pathname==='/v1/nova/retrieve') {
      const body=await readJson(req); return json(res,200,await search.retrieveForNova(body.query||'',{topK:body.topK,maxChars:body.maxChars}),cors);
    }

    if (url.pathname.startsWith('/v1/admin/')) {
      if (!admin(req)) return json(res,401,{error:'unauthorized'},cors);
      if (req.method==='POST' && url.pathname==='/v1/admin/seed') {
        const body=await readJson(req); const urls=Array.isArray(body.urls)?body.urls:body.url?[body.url]:[];
        return json(res,200,{accepted:await crawler.seed(urls,{priority:Number(body.priority)||10,discoverSitemaps:body.discoverSitemaps!==false})},cors);
      }
      if (req.method==='POST' && url.pathname==='/v1/admin/crawl') {
        const body=await readJson(req); return json(res,200,await crawler.crawlBatch(Math.min(100,Number(body.limit)||config.batchSize)),cors);
      }
      if (req.method==='POST' && url.pathname==='/v1/admin/refresh') {
        const body=await readJson(req); const urls=db.requeueDocuments(Number(body.limit)||1000);
        return json(res,200,{accepted:urls.length,urls},cors);
      }
      if (req.method==='POST' && url.pathname==='/v1/admin/pagerank') return json(res,200,recomputePageRank(db,{}),cors);
      if (req.method==='POST' && url.pathname==='/v1/admin/index') {
        const body=await readJson(req,5_000_000); const u=normalizeUrl(body.url);
        if (!u) return json(res,400,{error:'invalid_url'},cors);
        const text=String(body.body||'').slice(0,500_000), title=String(body.title||'').slice(0,500), description=String(body.description||'').slice(0,2000);
        const doc={url:u,canonical_url:normalizeUrl(body.canonicalUrl||u)||u,domain:new URL(u).hostname,title,description,body:text,language:String(body.language||''),content_type:'text/html',status_code:200,content_hash:(await import('./util.mjs')).sha256(`${title}\n${text}`),published_at:body.publishedAt||null,fetched_at:new Date().toISOString(),word_count:text.split(/\s+/).filter(Boolean).length,indexable:body.indexable!==false,is_news:!!body.isNews,is_video:!!body.isVideo,is_product:!!body.isProduct,is_book:!!body.isBook,quality_score:Number(body.qualityScore)||0.5,freshness_score:0.5,links:Array.isArray(body.links)?body.links.map(x=>({url:normalizeUrl(typeof x==='string'?x:x.url,u),anchor:typeof x==='string'?'':x.anchor||'',rel:typeof x==='string'?'':x.rel||''})).filter(x=>x.url):[],images:Array.isArray(body.images)?body.images.map(x=>({url:normalizeUrl(typeof x==='string'?x:x.url,u),alt:typeof x==='string'?'':x.alt||'',title:typeof x==='string'?'':x.title||''})).filter(x=>x.url):[]};
        return json(res,200,await indexer.indexDocument(doc),cors);
      }
    }

    return json(res,404,{error:'not_found'},cors);
  } catch (error) {
    console.error(error);
    return json(res,500,{error:'internal_error',message:String(error.message||error)},cors);
  }
});

server.listen(config.port,config.host,()=>{
  console.log(`BAZAARA Search Engine listening on http://${config.host}:${config.port}`);
  console.log('Owned index:',config.dbPath);
  if (config.adminKey==='change-me-before-exposing-the-service') console.warn('WARNING: default admin key in use; keep service bound to localhost until changed.');
});

let timer=null;
if (config.autoCrawl) {
  timer=setInterval(()=>crawler.crawlBatch(config.batchSize).catch(e=>console.error('[BazBot]',e)),config.intervalMs);
  timer.unref?.();
}

function shutdown(signal) {
  console.log(`\n${signal}: shutting down BAZAARA Search Engine`);
  if (timer) clearInterval(timer);
  server.close(()=>{db.close();process.exit(0);});
  setTimeout(()=>process.exit(1),5000).unref();
}
process.on('SIGINT',()=>shutdown('SIGINT'));
process.on('SIGTERM',()=>shutdown('SIGTERM'));
