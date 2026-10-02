import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema.mjs';
import { nowIso, sha256 } from './util.mjs';

export class SearchDb {
  constructor(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(SCHEMA_SQL);
    const version = this.db.prepare("SELECT value FROM metadata WHERE key='schema_version'").get()?.value;
    if (!version) this.db.prepare("INSERT INTO metadata(key,value) VALUES('schema_version',?)").run(String(SCHEMA_VERSION));
    else if (Number(version) !== SCHEMA_VERSION) throw new Error(`Unsupported schema version ${version}`);
    this.resetInterruptedQueue();
  }

  close() { this.db.close(); }

  resetInterruptedQueue() {
    this.db.prepare("UPDATE crawl_queue SET status='pending', updated_at=? WHERE status='processing'").run(nowIso());
  }

  enqueue(url, { depth=0, priority=0, discoveredFrom=null, revisit=false }={}) {
    const host = new URL(url).hostname;
    const hash = sha256(url);
    const now = nowIso();
    this.db.prepare(`
      INSERT INTO crawl_queue(url,url_hash,domain,depth,priority,status,attempts,discovered_from,next_fetch_at,created_at,updated_at)
      VALUES(?,?,?,?,?,'pending',0,?,NULL,?,?)
      ON CONFLICT(url) DO UPDATE SET
        priority=MAX(crawl_queue.priority, excluded.priority),
        depth=MIN(crawl_queue.depth, excluded.depth),
        status=CASE WHEN ? THEN 'pending' ELSE crawl_queue.status END,
        next_fetch_at=CASE WHEN ? THEN NULL ELSE crawl_queue.next_fetch_at END,
        updated_at=excluded.updated_at
    `).run(url, hash, host, depth, priority, discoveredFrom, now, now, revisit?1:0, revisit?1:0);
  }


  requeueDocuments(limit=1000) {
    const rows=this.db.prepare('SELECT url FROM documents ORDER BY fetched_at ASC LIMIT ?').all(Math.max(1,Math.min(50000,Number(limit)||1000)));
    for (const row of rows) this.enqueue(row.url,{depth:0,priority:20,revisit:true});
    return rows.map(r=>r.url);
  }

  scheduleRecrawls(recrawlDays=7, limit=250) {
    const cutoff=new Date(Date.now()-Math.max(1,recrawlDays)*86400000).toISOString();
    const rows=this.db.prepare(`
      SELECT q.id FROM crawl_queue q JOIN documents d ON d.url=q.url
      WHERE q.status='done' AND d.fetched_at < ? ORDER BY d.fetched_at ASC LIMIT ?
    `).all(cutoff,limit);
    const upd=this.db.prepare("UPDATE crawl_queue SET status='pending',next_fetch_at=NULL,updated_at=? WHERE id=? AND status='done'");
    for (const r of rows) upd.run(nowIso(),r.id);
    return rows.length;
  }

  reserveQueue(limit=10) {
    const rows = this.db.prepare(`
      SELECT * FROM crawl_queue
      WHERE status='pending' AND (next_fetch_at IS NULL OR next_fetch_at <= ?)
      ORDER BY priority DESC, id ASC LIMIT ?
    `).all(nowIso(), limit);
    const mark = this.db.prepare("UPDATE crawl_queue SET status='processing', attempts=attempts+1, updated_at=? WHERE id=? AND status='pending'");
    const reserved=[];
    for (const row of rows) {
      const r=mark.run(nowIso(), row.id);
      if (r.changes) reserved.push(row);
    }
    return reserved;
  }

  queueDone(id) { this.db.prepare("UPDATE crawl_queue SET status='done', last_error=NULL, updated_at=? WHERE id=?").run(nowIso(), id); }
  queueRetry(id, error, delayMs) {
    const next = new Date(Date.now()+delayMs).toISOString();
    this.db.prepare("UPDATE crawl_queue SET status=CASE WHEN attempts>=4 THEN 'failed' ELSE 'pending' END,last_error=?,next_fetch_at=?,updated_at=? WHERE id=?")
      .run(String(error).slice(0,1000), next, nowIso(), id);
  }

  getDomain(host) { return this.db.prepare('SELECT * FROM domains WHERE host=?').get(host); }
  upsertDomain(host, patch={}) {
    const old=this.getDomain(host) ?? {};
    this.db.prepare(`
      INSERT INTO domains(host,robots_txt,robots_fetched_at,crawl_delay_ms,last_fetch_at,authority,pages_indexed)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(host) DO UPDATE SET
        robots_txt=excluded.robots_txt,
        robots_fetched_at=excluded.robots_fetched_at,
        crawl_delay_ms=excluded.crawl_delay_ms,
        last_fetch_at=excluded.last_fetch_at,
        authority=excluded.authority,
        pages_indexed=excluded.pages_indexed
    `).run(host,
      patch.robots_txt ?? old.robots_txt ?? null,
      patch.robots_fetched_at ?? old.robots_fetched_at ?? null,
      patch.crawl_delay_ms ?? old.crawl_delay_ms ?? null,
      patch.last_fetch_at ?? old.last_fetch_at ?? null,
      patch.authority ?? old.authority ?? 0,
      patch.pages_indexed ?? old.pages_indexed ?? 0);
  }

  upsertDocument(doc) {
    const existing = this.db.prepare('SELECT id FROM documents WHERE url=?').get(doc.url);
    const duplicate = doc.content_hash ? this.db.prepare('SELECT id,url FROM documents WHERE content_hash=? AND url<>? AND duplicate_of IS NULL LIMIT 1').get(doc.content_hash, doc.url) : null;
    const duplicateOf = duplicate?.id ?? null;
    const indexable = doc.indexable && !duplicateOf ? 1 : 0;
    let id;
    if (existing) {
      id=existing.id;
      this.db.prepare(`UPDATE documents SET canonical_url=?,domain=?,title=?,description=?,body=?,language=?,content_type=?,status_code=?,content_hash=?,duplicate_of=?,published_at=?,fetched_at=?,indexed_at=?,word_count=?,indexable=?,is_news=?,is_video=?,is_product=?,is_book=?,quality_score=?,freshness_score=? WHERE id=?`)
        .run(doc.canonical_url,doc.domain,doc.title,doc.description,doc.body,doc.language,doc.content_type,doc.status_code,doc.content_hash,duplicateOf,doc.published_at,doc.fetched_at,nowIso(),doc.word_count,indexable,doc.is_news?1:0,doc.is_video?1:0,doc.is_product?1:0,doc.is_book?1:0,doc.quality_score,doc.freshness_score,id);
      this.db.prepare('DELETE FROM documents_fts WHERE rowid=?').run(id);
    } else {
      const r=this.db.prepare(`INSERT INTO documents(url,url_hash,canonical_url,domain,title,description,body,language,content_type,status_code,content_hash,duplicate_of,published_at,fetched_at,indexed_at,word_count,indexable,is_news,is_video,is_product,is_book,quality_score,freshness_score) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(doc.url,sha256(doc.url),doc.canonical_url,doc.domain,doc.title,doc.description,doc.body,doc.language,doc.content_type,doc.status_code,doc.content_hash,duplicateOf,doc.published_at,doc.fetched_at,nowIso(),doc.word_count,indexable,doc.is_news?1:0,doc.is_video?1:0,doc.is_product?1:0,doc.is_book?1:0,doc.quality_score,doc.freshness_score);
      id=Number(r.lastInsertRowid);
    }
    if (indexable) this.db.prepare('INSERT INTO documents_fts(rowid,title,description,body) VALUES(?,?,?,?)').run(id,doc.title,doc.description,doc.body);
    return { id, duplicateOf, indexable: !!indexable };
  }

  replaceLinks(documentId, links) {
    this.db.prepare('DELETE FROM links WHERE from_document_id=?').run(documentId);
    const ins=this.db.prepare('INSERT OR IGNORE INTO links(from_document_id,to_url,to_url_hash,anchor,rel) VALUES(?,?,?,?,?)');
    for (const l of links) ins.run(documentId,l.url,sha256(l.url),l.anchor ?? '',l.rel ?? '');
  }

  replaceImages(documentId, images) {
    this.db.prepare('DELETE FROM images WHERE document_id=?').run(documentId);
    const ins=this.db.prepare('INSERT OR IGNORE INTO images(document_id,url,alt,title,width,height) VALUES(?,?,?,?,?,?)');
    for (const x of images.slice(0,100)) ins.run(documentId,x.url,x.alt ?? '',x.title ?? '',x.width ?? null,x.height ?? null);
  }

  setEmbedding(documentId, {provider,model,vector}) {
    this.db.prepare(`INSERT INTO document_embeddings(document_id,provider,model,dimensions,vector_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(document_id) DO UPDATE SET provider=excluded.provider,model=excluded.model,dimensions=excluded.dimensions,vector_json=excluded.vector_json,updated_at=excluded.updated_at`)
      .run(documentId,provider,model,vector.length,JSON.stringify(vector),nowIso());
  }

  addSuggestion(value, weight=1, source='index') {
    const v=String(value ?? '').trim().replace(/\s+/g,' ').slice(0,180);
    if (v.length < 2) return;
    const n=v.toLowerCase();
    this.db.prepare(`INSERT INTO suggestions(value,normalized,weight,source,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(value) DO UPDATE SET weight=suggestions.weight+excluded.weight,updated_at=excluded.updated_at`).run(v,n,weight,source,nowIso());
  }

  logQuery(query, count) {
    const normalized=String(query).trim().toLowerCase();
    this.db.prepare('INSERT INTO query_log(query,normalized,result_count,created_at) VALUES(?,?,?,?)').run(query,normalized,count,nowIso());
    this.addSuggestion(query, 4, 'query');
  }

  status() {
    const one = sql => Number(this.db.prepare(sql).get()?.n ?? 0);
    return {
      documents: one('SELECT COUNT(*) n FROM documents'),
      indexableDocuments: one('SELECT COUNT(*) n FROM documents WHERE indexable=1'),
      newsDocuments: one('SELECT COUNT(*) n FROM documents WHERE indexable=1 AND is_news=1'),
      videoDocuments: one('SELECT COUNT(*) n FROM documents WHERE indexable=1 AND is_video=1'),
      productDocuments: one('SELECT COUNT(*) n FROM documents WHERE indexable=1 AND is_product=1'),
      bookDocuments: one('SELECT COUNT(*) n FROM documents WHERE indexable=1 AND is_book=1'),
      images: one('SELECT COUNT(*) n FROM images'),
      links: one('SELECT COUNT(*) n FROM links'),
      queuePending: one("SELECT COUNT(*) n FROM crawl_queue WHERE status='pending'"),
      queueFailed: one("SELECT COUNT(*) n FROM crawl_queue WHERE status='failed'"),
      domains: one('SELECT COUNT(*) n FROM domains')
    };
  }
}
