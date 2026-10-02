import { buildFtsQuery, clamp, normalizeQuery, searchTerms, snippet, tokenize } from './util.mjs';
import { cosine } from './embeddings.mjs';

function titleOverlap(title, terms) {
  const t=new Set(tokenize(title)); if (!terms.length) return 0;
  return terms.filter(x=>t.has(x)).length/terms.length;
}
function lexicalNorm(raw) { return 1-Math.exp(-Math.max(0,raw)*10); }
function safeVector(json) { try { const x=JSON.parse(json); return Array.isArray(x)?x:null; } catch { return null; } }

export class SearchEngine {
  constructor(db,embeddings,config) { this.db=db; this.embeddings=embeddings; this.config=config; }

  async search(query,{page=1,count,site=null,freshnessDays=null,type='web'}={}) {
    const q=normalizeQuery(query); if (!q) return {query:q,total:0,results:[],source:'bazaara_index'};
    count=clamp(Number(count)||this.config.pageSize,1,this.config.maxPageSize);
    page=Math.max(1,Number(page)||1);
    const fts=buildFtsQuery(q); if (!fts) return {query:q,total:0,results:[],source:'bazaara_index'};
    const candidateLimit=Math.min(250,Math.max(50,page*count*5));
    const where=['documents_fts MATCH ?','d.indexable=1'];
    const args=[fts];
    if (site) { where.push('d.domain LIKE ?'); args.push(`%${String(site).replace(/^www\./,'')}`); }
    if (type==='news') where.push('d.is_news=1');
    if (type==='videos') where.push('d.is_video=1');
    if (type==='shopping') where.push('d.is_product=1');
    if (type==='books') where.push('d.is_book=1');
    if (freshnessDays && Number(freshnessDays)>0) { where.push('d.fetched_at>=?'); args.push(new Date(Date.now()-Number(freshnessDays)*86400000).toISOString()); }
    args.push(candidateLimit);
    const rows=this.db.db.prepare(`
      SELECT d.*, bm25(documents_fts,6.0,2.5,1.0) fts_score, e.vector_json,
             (SELECT url FROM images i
               WHERE i.document_id=d.id
                 AND lower(i.url) NOT LIKE '%.svg%'
                 AND lower(i.url) NOT LIKE '%privacy%'
                 AND lower(i.url) NOT LIKE '%favicon%'
                 AND lower(i.url) NOT LIKE '%sprite%'
               ORDER BY CASE WHEN COALESCE(i.width,0)>=300 OR COALESCE(i.height,0)>=200 THEN 0 ELSE 1 END, i.id ASC
               LIMIT 1) thumbnail
      FROM documents_fts
      JOIN documents d ON d.id=documents_fts.rowid
      LEFT JOIN document_embeddings e ON e.document_id=d.id
      WHERE ${where.join(' AND ')}
      ORDER BY fts_score ASC LIMIT ?
    `).all(...args);

    const terms=searchTerms(q);
    let qvec=null;
    if (this.config.semantic && rows.some(r=>r.vector_json)) qvec=(await this.embeddings.embed(q)).vector;
    const exact=q.toLowerCase();
    const scored=rows.map(r=>{
      const rawLex=Math.max(0,-Number(r.fts_score||0));
      const lex=lexicalNorm(rawLex);
      const sem=qvec?Math.max(0,cosine(qvec,safeVector(r.vector_json))):0;
      const overlap=titleOverlap(r.title,terms);
      const haystack=new Set(tokenize(`${r.title||''} ${r.description||''} ${r.body||''}`));
      const matchedTerms=terms.filter(t=>haystack.has(t)).length;
      const requiredMatches=terms.length<=1?1:(terms.length===2?2:Math.max(2,Math.ceil(terms.length*0.5)));
      const coverage=terms.length?matchedTerms/terms.length:0;
      const grounded=matchedTerms>=requiredMatches;
      const exactBoost=(r.title||'').toLowerCase().includes(exact)?1:((r.body||'').toLowerCase().includes(exact)?0.35:0);
      const authority=Math.tanh(Number(r.pagerank||0)/2);
      const freshness=Number(r.freshness_score||0);
      const quality=Number(r.quality_score||0);
      const score=lex*0.43+sem*0.12+overlap*0.14+coverage*0.12+exactBoost*0.08+authority*0.05+freshness*0.03+quality*0.03;
      return {...r,score,matchedTerms,requiredMatches,grounded};
    }).filter(r=>r.grounded).sort((a,b)=>b.score-a.score);

    const offset=(page-1)*count;
    let results=scored.slice(offset,offset+count).map(r=>({
      id:r.id,title:r.title||r.url,url:r.url,displayUrl:r.domain,description:r.description||'',snippet:snippet(r.description||r.body,terms,240),score:Number(r.score.toFixed(6)),source:'bazaara_index',publishedAt:r.published_at,language:r.language||null,isNews:!!r.is_news,isVideo:!!r.is_video,isProduct:!!r.is_product,isBook:!!r.is_book,thumbnail:r.thumbnail||null
    }));
    this.db.logQuery(query,results.length);
    const didYouMean=scored.length?null:this.didYouMean(q);
    return {query:q,page,count,total:scored.length,results,web:{results},didYouMean,source:'bazaara_index'};
  }

  suggest(prefix,limit=10) {
    const p=normalizeQuery(prefix); if (!p) return [];
    return this.db.db.prepare('SELECT value,weight,source FROM suggestions WHERE normalized LIKE ? ORDER BY weight DESC,LENGTH(value) ASC LIMIT ?').all(`${p}%`,clamp(Number(limit)||10,1,20));
  }

  didYouMean(query) {
    const q=normalizeQuery(query); if (q.length<3) return null;
    const candidates=this.db.db.prepare('SELECT value,weight FROM suggestions WHERE LENGTH(normalized) BETWEEN ? AND ? ORDER BY weight DESC LIMIT 250').all(Math.max(1,q.length-3),q.length+3);
    let best=null,bestD=Infinity;
    for (const c of candidates) {
      if (c.value.toLowerCase()===q) continue;
      const d=levenshtein(q,c.value.toLowerCase());
      if (d<bestD) {bestD=d;best=c.value;}
    }
    return bestD<=Math.max(1,Math.floor(q.length*0.28))?best:null;
  }

  async news(query,opts={}) { return this.search(query,{...opts,type:'news'}); }
  async videos(query,opts={}) { return this.search(query,{...opts,type:'videos'}); }
  async shopping(query,opts={}) { return this.search(query,{...opts,type:'shopping'}); }
  async books(query,opts={}) { return this.search(query,{...opts,type:'books'}); }

  async images(query,{count=30}={}) {
    const q=normalizeQuery(query); const fts=buildFtsQuery(q); if (!fts) return {query:q,results:[]};
    const rows=this.db.db.prepare(`
      SELECT i.id,i.url imageUrl,i.alt,i.title imageTitle,i.width,i.height,d.url pageUrl,d.title pageTitle,d.domain,bm25(documents_fts,6.0,2.5,1.0) score
      FROM documents_fts JOIN documents d ON d.id=documents_fts.rowid JOIN images i ON i.document_id=d.id
      WHERE documents_fts MATCH ? AND d.indexable=1 ORDER BY score ASC LIMIT ?
    `).all(fts,clamp(Number(count)||30,1,100));
    return {query:q,results:rows.map(r=>({...r,source:'bazaara_index'}))};
  }

  async retrieveForNova(query,{topK=8,maxChars=1800}={}) {
    const r=await this.search(query,{count:clamp(Number(topK)||8,1,20)});
    const ids=r.results.filter(x=>typeof x.id==='number').map(x=>x.id);
    const byId=new Map();
    if (ids.length) {
      const qs=ids.map(()=>'?').join(',');
      for (const d of this.db.db.prepare(`SELECT id,title,url,body,published_at FROM documents WHERE id IN (${qs})`).all(...ids)) byId.set(d.id,d);
    }
    return {query:r.query,evidence:r.results.map(x=>{
      const d=byId.get(x.id);
      return {title:x.title,url:x.url,snippet:x.snippet,content:(d?.body||x.description||'').slice(0,maxChars),score:x.score,source:x.source,publishedAt:x.publishedAt};
    })};
  }
}

export function levenshtein(a,b) {
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for (let i=1;i<=a.length;i++) {
    cur[0]=i;
    for (let j=1;j<=b.length;j++) cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for (let j=0;j<=b.length;j++) prev[j]=cur[j];
  }
  return prev[b.length];
}
