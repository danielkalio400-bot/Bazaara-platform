import zlib from 'node:zlib';
import { loadRobots, robotsPolicy, extractSitemapUrls } from './robots.mjs';
import { fetchPage } from './renderer.mjs';
import { parseHtml } from './parser.mjs';
import { fetchLimited, normalizeUrl, nowIso, sleep } from './util.mjs';

export class BazCrawler {
  constructor(db,indexer,config) {
    this.db=db; this.indexer=indexer; this.config=config;
    this.hostReadyAt=new Map(); this.running=false;
  }

  async seed(urls, {priority=10, discoverSitemaps=true}={}) {
    const accepted=[];
    for (const raw of urls) {
      const u=normalizeUrl(raw); if (!u) continue;
      this.db.enqueue(u,{depth:0,priority,revisit:true}); accepted.push(u);
    }
    if (discoverSitemaps) {
      for (const u of accepted.slice(0,25)) {
        try { await this.discoverSitemaps(u); } catch {}
      }
    }
    return accepted;
  }

  async discoverSitemaps(seedUrl) {
    const robots=await loadRobots(this.db,seedUrl,this.config);
    const policy=robotsPolicy(robots,this.config.userAgent,seedUrl);
    const u=new URL(seedUrl);
    const pending=[...policy.sitemaps,`${u.protocol}//${u.host}/sitemap.xml`]
      .map(x=>normalizeUrl(x,seedUrl)).filter(Boolean).map(url=>({url,level:0}));
    const seen=new Set(); let accepted=0;
    while (pending.length && accepted < this.config.maxUrlsPerSeed) {
      const item=pending.shift();
      if (!item || seen.has(item.url)) continue; seen.add(item.url);
      try {
        const {response,bytes}=await fetchLimited(item.url,{userAgent:this.config.userAgent,timeoutMs:this.config.requestTimeoutMs,maxBytes:10_000_000,allowPrivate:this.config.allowPrivateNetwork});
        if (!response.ok) continue;
        let data=bytes;
        if (/\.gz(?:$|\?)/i.test(item.url)) { try { data=zlib.gunzipSync(bytes); } catch {} }
        const urls=extractSitemapUrls(data.toString('utf8'),item.url);
        for (const x of urls) {
          if (accepted>=this.config.maxUrlsPerSeed) break;
          const looksMap=/sitemap/i.test(x) && /\.xml(?:\.gz)?(?:$|\?)/i.test(x);
          if (looksMap && item.level < 2) { pending.push({url:x,level:item.level+1}); continue; }
          this.db.enqueue(x,{depth:0,priority:5,discoveredFrom:item.url}); accepted++;
        }
      } catch {}
    }
    return accepted;
  }

  async waitForHost(host,delayMs) {
    const ready=this.hostReadyAt.get(host) ?? 0;
    if (ready>Date.now()) await sleep(ready-Date.now());
    this.hostReadyAt.set(host,Date.now()+delayMs);
  }

  async crawlOne(item) {
    const url=item.url, host=item.domain;
    try {
      const robots=await loadRobots(this.db,url,this.config);
      const policy=robotsPolicy(robots,this.config.userAgent,url);
      if (!this.config.ignoreRobots && !policy.allowed) { this.db.queueDone(item.id); return {url,status:'robots_blocked'}; }
      const delay=Math.max(this.config.defaultCrawlDelayMs,policy.crawlDelayMs ?? 0);
      await this.waitForHost(host,delay);
      const fetched=await fetchPage(url,this.config);
      const contentType=(fetched.response.headers.get('content-type')||'').toLowerCase();
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        this.db.db.prepare('INSERT INTO fetch_log(url,status_code,duration_ms,bytes,rendered,error,created_at) VALUES(?,?,?,?,?,?,?)').run(url,fetched.response.status,fetched.durationMs,fetched.bytes,fetched.rendered?1:0,'unsupported_content_type',nowIso());
        this.db.queueDone(item.id); return {url,status:'skipped',contentType};
      }
      const finalUrl=normalizeUrl(fetched.finalUrl) ?? url;
      const doc=parseHtml(fetched.html,finalUrl,fetched.response.status,contentType);
      const indexed=await this.indexer.indexDocument(doc);
      this.db.db.prepare('INSERT INTO fetch_log(url,status_code,duration_ms,bytes,rendered,error,created_at) VALUES(?,?,?,?,?,?,?)').run(url,fetched.response.status,fetched.durationMs,fetched.bytes,fetched.rendered?1:0,null,nowIso());
      this.db.upsertDomain(host,{last_fetch_at:nowIso()});

      if (item.depth < this.config.maxDepth) {
        let added=0;
        for (const l of doc.links) {
          if (added>=this.config.maxUrlsPerSeed) break;
          const target=new URL(l.url);
          const sameHost=target.hostname===host;
          const nofollow=(l.rel||'').toLowerCase().includes('nofollow');
          if (nofollow) continue;
          this.db.enqueue(l.url,{depth:item.depth+1,priority:sameHost?Math.max(1,item.priority-0.5):Math.max(0,item.priority-2),discoveredFrom:finalUrl});
          added++;
        }
      }
      this.db.queueDone(item.id);
      return {url,status:'indexed',id:indexed.id,indexable:indexed.indexable,links:doc.links.length,images:doc.images.length};
    } catch (error) {
      this.db.db.prepare('INSERT INTO fetch_log(url,status_code,duration_ms,bytes,rendered,error,created_at) VALUES(?,?,?,?,?,?,?)').run(url,null,null,null,0,String(error.message||error).slice(0,1000),nowIso());
      this.db.queueRetry(item.id,error.message||error,Math.min(3600_000,60_000*Math.max(1,item.attempts+1)));
      return {url,status:'error',error:String(error.message||error)};
    }
  }

  async crawlBatch(limit=this.config.batchSize) {
    if (this.running) return {busy:true,results:[]};
    this.running=true;
    try {
      this.db.scheduleRecrawls(this.config.recrawlDays, Math.max(50,limit*5));
      const items=this.db.reserveQueue(limit);
      const results=[];
      // Sequential by default: safer for a laptop and polite for hosts. Multiple service instances can scale horizontally later.
      for (const item of items) results.push(await this.crawlOne(item));
      return {busy:false,results};
    } finally { this.running=false; }
  }
}
