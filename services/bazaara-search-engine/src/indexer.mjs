import { tokenize } from './util.mjs';

export class Indexer {
  constructor(db, embeddings, config) { this.db=db; this.embeddings=embeddings; this.config=config; }

  async indexDocument(doc) {
    const stored=this.db.upsertDocument(doc);
    this.db.replaceLinks(stored.id, doc.links ?? []);
    this.db.replaceImages(stored.id, doc.images ?? []);

    this.db.addSuggestion(doc.title, 3, 'title');
    this.db.addSuggestion(doc.domain, 2, 'domain');
    const titleTokens=tokenize(doc.title).filter(x=>x.length>=3).slice(0,12);
    for (const t of new Set(titleTokens)) this.db.addSuggestion(t,1,'term');

    if (stored.indexable && this.config.semantic) {
      const emb=await this.embeddings.embed(`${doc.title}\n${doc.description}\n${doc.body.slice(0,10000)}`);
      this.db.setEmbedding(stored.id,emb);
    }

    const domain=this.db.getDomain(doc.domain) ?? {};
    const pages=Number(domain.pages_indexed ?? 0) + (stored.indexable ? 1 : 0);
    this.db.upsertDomain(doc.domain,{pages_indexed:pages});
    return stored;
  }
}
