import { config } from './config.mjs';
import { SearchDb } from './db.mjs';
import { Embeddings } from './embeddings.mjs';
import { Indexer } from './indexer.mjs';
import { BazCrawler } from './crawler.mjs';
import { recomputePageRank } from './pagerank.mjs';

const db=new SearchDb(config.dbPath), embeddings=new Embeddings(config), indexer=new Indexer(db,embeddings,config), crawler=new BazCrawler(db,indexer,config);
const cmd=process.argv[2];
try {
  if (cmd==='seed') {
    const urls=process.argv.slice(3); if (!urls.length) throw new Error('Usage: npm run seed -- https://example.com [more URLs]');
    console.log(JSON.stringify({accepted:await crawler.seed(urls)},null,2));
  } else if (cmd==='crawl') console.log(JSON.stringify(await crawler.crawlBatch(Number(process.argv[3])||config.batchSize),null,2));
  else if (cmd==='pagerank') console.log(JSON.stringify(recomputePageRank(db,{}),null,2));
  else if (cmd==='status') console.log(JSON.stringify(db.status(),null,2));
  else throw new Error('Commands: seed | crawl | pagerank | status');
} finally { db.close(); }
