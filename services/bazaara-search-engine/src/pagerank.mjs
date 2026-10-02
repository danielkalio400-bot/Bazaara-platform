import { sha256 } from './util.mjs';

export function recomputePageRank(db, {iterations=20,damping=0.85}={}) {
  const docs=db.db.prepare('SELECT id,url,url_hash FROM documents WHERE indexable=1').all();
  const n=docs.length;
  if (!n) return {documents:0,iterations:0};
  const byHash=new Map(docs.map((d,i)=>[d.url_hash,{i,id:d.id}]));
  const out=Array.from({length:n},()=>[]);
  const links=db.db.prepare('SELECT from_document_id,to_url_hash FROM links').all();
  const byId=new Map(docs.map((d,i)=>[d.id,i]));
  for (const l of links) {
    const from=byId.get(l.from_document_id), to=byHash.get(l.to_url_hash)?.i;
    if (from==null || to==null || from===to) continue;
    out[from].push(to);
  }
  let rank=new Float64Array(n); rank.fill(1/n);
  for (let k=0;k<iterations;k++) {
    const next=new Float64Array(n); next.fill((1-damping)/n);
    let dangling=0;
    for (let i=0;i<n;i++) {
      const unique=[...new Set(out[i])];
      if (!unique.length) dangling+=rank[i];
      else {
        const share=damping*rank[i]/unique.length;
        for (const j of unique) next[j]+=share;
      }
    }
    const dshare=damping*dangling/n;
    for (let i=0;i<n;i++) next[i]+=dshare;
    rank=next;
  }
  const upd=db.db.prepare('UPDATE documents SET pagerank=? WHERE id=?');
  for (let i=0;i<n;i++) upd.run(rank[i]*n,docs[i].id);
  const domains=db.db.prepare('SELECT domain,AVG(pagerank) authority FROM documents WHERE indexable=1 GROUP BY domain').all();
  for (const d of domains) db.upsertDomain(d.domain,{authority:d.authority});
  return {documents:n,iterations};
}
