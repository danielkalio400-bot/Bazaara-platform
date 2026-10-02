export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA foreign_keys=ON;
PRAGMA temp_store=MEMORY;
PRAGMA busy_timeout=5000;

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  url_hash TEXT NOT NULL UNIQUE,
  canonical_url TEXT,
  domain TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'text/html',
  status_code INTEGER NOT NULL DEFAULT 200,
  content_hash TEXT NOT NULL DEFAULT '',
  duplicate_of INTEGER REFERENCES documents(id),
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  indexed_at TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  indexable INTEGER NOT NULL DEFAULT 1,
  is_news INTEGER NOT NULL DEFAULT 0,
  is_video INTEGER NOT NULL DEFAULT 0,
  is_product INTEGER NOT NULL DEFAULT 0,
  is_book INTEGER NOT NULL DEFAULT 0,
  quality_score REAL NOT NULL DEFAULT 0,
  pagerank REAL NOT NULL DEFAULT 0,
  freshness_score REAL NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX IF NOT EXISTS idx_documents_domain ON documents(domain);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_documents_news ON documents(is_news, published_at);
CREATE INDEX IF NOT EXISTS idx_documents_video ON documents(is_video);
CREATE INDEX IF NOT EXISTS idx_documents_product ON documents(is_product);
CREATE INDEX IF NOT EXISTS idx_documents_book ON documents(is_book);
CREATE INDEX IF NOT EXISTS idx_documents_indexable ON documents(indexable);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title,
  description,
  body,
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  from_document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  to_url TEXT NOT NULL,
  to_url_hash TEXT NOT NULL,
  anchor TEXT NOT NULL DEFAULT '',
  rel TEXT NOT NULL DEFAULT '',
  UNIQUE(from_document_id, to_url_hash)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_links_to_hash ON links(to_url_hash);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  UNIQUE(document_id, url)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_images_document ON images(document_id);

CREATE TABLE IF NOT EXISTS crawl_queue (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  url_hash TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  priority REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  discovered_from TEXT,
  next_fetch_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_queue_ready ON crawl_queue(status, next_fetch_at, priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_domain ON crawl_queue(domain, status);

CREATE TABLE IF NOT EXISTS domains (
  host TEXT PRIMARY KEY,
  robots_txt TEXT,
  robots_fetched_at TEXT,
  crawl_delay_ms INTEGER,
  last_fetch_at TEXT,
  authority REAL NOT NULL DEFAULT 0,
  pages_indexed INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE IF NOT EXISTS document_embeddings (
  document_id INTEGER PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  vector_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS suggestions (
  value TEXT PRIMARY KEY,
  normalized TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'index',
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_suggestions_normalized ON suggestions(normalized, weight DESC);

CREATE TABLE IF NOT EXISTS query_log (
  id INTEGER PRIMARY KEY,
  query TEXT NOT NULL,
  normalized TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_query_log_normalized ON query_log(normalized, created_at DESC);

CREATE TABLE IF NOT EXISTS fetch_log (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  bytes INTEGER,
  rendered INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL
) STRICT;
`;
