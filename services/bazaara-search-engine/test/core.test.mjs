import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildFtsQuery, normalizeUrl, searchTerms } from '../src/util.mjs';
import { parseRobots, robotsPolicy } from '../src/robots.mjs';
import { parseHtml } from '../src/parser.mjs';
import { SearchDb } from '../src/db.mjs';
import { Embeddings } from '../src/embeddings.mjs';
import { Indexer } from '../src/indexer.mjs';
import { SearchEngine } from '../src/search.mjs';

const cfg={semantic:true,ollamaEnabled:false,ollamaUrl:'',ollamaModel:'',pageSize:10,maxPageSize:50};

test('normalizeUrl canonicalizes common tracking URLs',()=>{
  assert.equal(normalizeUrl('HTTPS://Example.COM:443/a/?utm_source=x&b=2&a=1#top'),'https://example.com/a?a=1&b=2');
});

test('robots policy honors most specific allow',()=>{
  const text=`User-agent: *\nDisallow: /private\nAllow: /private/public\nCrawl-delay: 2\nSitemap: https://example.com/sitemap.xml`;
  assert.equal(robotsPolicy(text,'BazBot/1.0','https://example.com/private/x').allowed,false);
  const p=robotsPolicy(text,'BazBot/1.0','https://example.com/private/public/x');
  assert.equal(p.allowed,true); assert.equal(p.crawlDelayMs,2000); assert.deepEqual(p.sitemaps,['https://example.com/sitemap.xml']);
});

test('HTML parser extracts indexable document, links, images and metadata',()=>{
  const html=`<!doctype html><html lang="en"><head><title>Bazaara Search Architecture</title><meta name="description" content="Independent search"><link rel="canonical" href="/search"><meta property="og:type" content="article"><meta property="article:published_time" content="2026-09-30T10:00:00Z"><meta property="og:image" content="/hero-social.jpg"></head><body><article>${'Search indexing crawling ranking '.repeat(80)}</article><a href="/next?utm_source=x">Next</a><img src="/hero.png" alt="Hero"></body></html>`;
  const d=parseHtml(html,'https://example.com/search?utm_source=test');
  assert.equal(d.canonical_url,'https://example.com/search');
  assert.equal(d.language,'en'); assert.equal(d.is_news,true); assert.equal(d.indexable,true);
  assert.equal(d.links[0].url,'https://example.com/next'); assert.equal(d.images[0].url,'https://example.com/hero-social.jpg');
});

test('owned index returns locally indexed results',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baz-search-'));
  const db=new SearchDb(path.join(dir,'test.sqlite'));
  try {
    const emb=new Embeddings(cfg), idx=new Indexer(db,emb,cfg), engine=new SearchEngine(db,emb,cfg);
    const base={canonical_url:'https://example.com/bazaara',domain:'example.com',description:'A self owned web search engine',language:'en',content_type:'text/html',status_code:200,published_at:'2026-09-30T10:00:00Z',fetched_at:new Date().toISOString(),indexable:true,is_news:false,quality_score:.9,freshness_score:.9,links:[],images:[]};
    await idx.indexDocument({...base,url:'https://example.com/bazaara',title:'BAZAARA Independent Search Engine',body:'BAZAARA crawler index retrieval ranking engine with independent web search and semantic retrieval.',content_hash:'hash1',word_count:12});
    await idx.indexDocument({...base,url:'https://example.com/cooking',canonical_url:'https://example.com/cooking',title:'Cooking Pasta',body:'How to make pasta with tomato sauce.',content_hash:'hash2',word_count:8});
    const r=await engine.search('independent search engine',{count:10});
    assert.equal(r.results[0].url,'https://example.com/bazaara');
    assert.equal(r.results[0].source,'bazaara_index');
  } finally { db.close(); fs.rmSync(dir,{recursive:true,force:true}); }
});

test('BazBot crawls a site into the owned index end to end',async()=>{
  const http=await import('node:http');
  const { BazCrawler }=await import('../src/crawler.mjs');
  const server=http.createServer((req,res)=>{
    if(req.url==='/robots.txt'){res.writeHead(200,{'content-type':'text/plain'});return res.end('User-agent: *\nAllow: /');}
    if(req.url==='/page2'){res.writeHead(200,{'content-type':'text/html'});return res.end('<html><head><title>Second Bazaara Page</title></head><body><main>'+ 'ranking crawler index '.repeat(40) +'</main></body></html>');}
    res.writeHead(200,{'content-type':'text/html'});res.end('<html><head><title>Bazaara Test Web</title><meta name="description" content="owned search test"></head><body><main>'+ 'bazaara independent crawler index search '.repeat(50) +'</main><a href="/page2">Next</a><img src="/hero.jpg" alt="hero"></body></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baz-crawl-'));
  const db=new SearchDb(path.join(dir,'test.sqlite'));
  const crawlCfg={...cfg,userAgent:'BazBot-Test/1.0',requestTimeoutMs:3000,maxHtmlBytes:1_000_000,allowPrivateNetwork:true,renderJs:false,ignoreRobots:false,defaultCrawlDelayMs:0,maxDepth:2,maxUrlsPerSeed:50,batchSize:10,recrawlDays:7};
  try {
    const emb=new Embeddings(crawlCfg), idx=new Indexer(db,emb,crawlCfg), crawler=new BazCrawler(db,idx,crawlCfg), engine=new SearchEngine(db,emb,crawlCfg);
    await crawler.seed([`http://127.0.0.1:${port}/`],{discoverSitemaps:false});
    const first=await crawler.crawlBatch(1);
    assert.equal(first.results[0].status,'indexed');
    await crawler.crawlBatch(5);
    const r=await engine.search('independent crawler index',{count:5});
    assert.equal(r.results.length>0,true);
    assert.equal(r.results[0].source,'bazaara_index');
    assert.equal(db.status().images>=1,true);
  } finally { db.close(); await new Promise(resolve=>server.close(resolve)); fs.rmSync(dir,{recursive:true,force:true}); }
});


test('generic dated article-like pages are not automatically News',()=>{
  const html=`<html><head><title>Reference Page</title><meta property="article:published_time" content="2001-01-01T00:00:00Z"></head><body><article>${'reference encyclopedia content '.repeat(40)}</article><img src="/privacyoptions.svg"><img src="/photo.jpg" width="800" height="500"></body></html>`;
  const d=parseHtml(html,'https://example.com/wiki/reference');
  assert.equal(d.is_news,false);
  assert.equal(d.images.some(x=>/privacyoptions\.svg/i.test(x.url)),false);
  assert.equal(d.images.some(x=>/photo\.jpg/i.test(x.url)),true);
});

test('owned search never emits external-provider sources',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baz-owned-only-'));
  const db=new SearchDb(path.join(dir,'test.sqlite'));
  try {
    const emb=new Embeddings(cfg), idx=new Indexer(db,emb,cfg), engine=new SearchEngine(db,emb,cfg);
    await idx.indexDocument({url:'https://example.com/owned',canonical_url:'https://example.com/owned',domain:'example.com',title:'Owned Bazaara Search',description:'Independent owned index',body:'bazaara independent owned index search engine',language:'en',content_type:'text/html',status_code:200,content_hash:'owned1',published_at:null,fetched_at:new Date().toISOString(),word_count:7,indexable:true,is_news:false,is_video:false,is_product:false,is_book:false,quality_score:.8,freshness_score:.5,links:[],images:[]});
    const r=await engine.search('bazaara search',{count:5});
    assert.equal(r.source,'bazaara_index');
    assert.equal(r.results.every(x=>x.source==='bazaara_index'),true);
  } finally { db.close(); fs.rmSync(dir,{recursive:true,force:true}); }
});


test('search query removes common stopwords before FTS retrieval',()=>{
  assert.deepEqual(searchTerms('Call of duty'),['call','duty']);
  assert.equal(buildFtsQuery('Call of duty'),'"call" OR "duty"');
});

test('multi-term queries do not fill results with partial irrelevant matches',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baz-grounding-'));
  const db=new SearchDb(path.join(dir,'test.sqlite'));
  try {
    const emb=new Embeddings(cfg), idx=new Indexer(db,emb,cfg), engine=new SearchEngine(db,emb,cfg);
    const base={domain:'example.com',description:'',language:'en',content_type:'text/html',status_code:200,published_at:null,fetched_at:new Date().toISOString(),indexable:true,is_news:false,is_video:false,is_product:false,is_book:false,quality_score:.8,freshness_score:.5,links:[],images:[]};
    await idx.indexDocument({...base,url:'https://example.com/cars',canonical_url:'https://example.com/cars',title:'Cars and Vehicles',body:'Ford cars vehicle reviews and automotive buying advice. Call us for sales.',content_hash:'g1',word_count:12});
    await idx.indexDocument({...base,url:'https://example.com/game',canonical_url:'https://example.com/game',title:'Call of Duty Game',body:'Call of Duty multiplayer game news maps weapons and updates.',content_hash:'g2',word_count:12});
    const good=await engine.search('call of duty',{count:10});
    assert.equal(good.results.length,1);
    assert.equal(good.results[0].url,'https://example.com/game');
    db.db.prepare('DELETE FROM documents WHERE id=?').run(good.results[0].id);
    const none=await engine.search('call of duty',{count:10});
    assert.equal(none.results.length,0);
    assert.equal(none.total,0);
  } finally { db.close(); fs.rmSync(dir,{recursive:true,force:true}); }
});
