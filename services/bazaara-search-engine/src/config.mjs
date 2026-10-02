import path from 'node:path';
import fs from 'node:fs';

const envFile=path.resolve('.env');
if (fs.existsSync(envFile)) {
  for (const raw of fs.readFileSync(envFile,'utf8').split(/\r?\n/)) {
    const line=raw.trim(); if (!line || line.startsWith('#')) continue;
    const i=line.indexOf('='); if (i<1) continue;
    const key=line.slice(0,i).trim(); let value=line.slice(i+1).trim();
    if ((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith("'") && value.endsWith("'"))) value=value.slice(1,-1);
    if (process.env[key] == null) process.env[key]=value;
  }
}

function int(name, fallback) {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}
function bool(name, fallback=false) {
  const v = (process.env[name] ?? '').trim().toLowerCase();
  if (!v) return fallback;
  return ['1','true','yes','on'].includes(v);
}
function str(name, fallback='') { return process.env[name] ?? fallback; }

const dataDir = path.resolve(str('BAZAARA_SEARCH_DATA', './data'));

export const config = Object.freeze({
  host: str('BAZAARA_SEARCH_HOST', '127.0.0.1'),
  port: int('BAZAARA_SEARCH_PORT', 4020),
  dataDir,
  dbPath: path.join(dataDir, 'bazaara-search.sqlite'),
  adminKey: str('BAZAARA_SEARCH_ADMIN_KEY', 'change-me-before-exposing-the-service'),
  cors: str('BAZAARA_SEARCH_CORS', 'http://localhost:3020,http://127.0.0.1:3020').split(',').map(s=>s.trim()).filter(Boolean),
  userAgent: str('BAZBOT_USER_AGENT', 'BazBot/1.0 (+https://bazaara.local/search/bazbot)'),
  autoCrawl: bool('BAZBOT_AUTO_CRAWL', false),
  batchSize: int('BAZBOT_BATCH_SIZE', 10),
  intervalMs: int('BAZBOT_INTERVAL_MS', 30000),
  requestTimeoutMs: int('BAZBOT_REQUEST_TIMEOUT_MS', 15000),
  maxHtmlBytes: int('BAZBOT_MAX_HTML_BYTES', 5_000_000),
  defaultCrawlDelayMs: int('BAZBOT_DEFAULT_CRAWL_DELAY_MS', 1500),
  maxDepth: int('BAZBOT_MAX_DEPTH', 4),
  recrawlDays: int('BAZBOT_RECRAWL_DAYS', 7),
  maxUrlsPerSeed: int('BAZBOT_MAX_URLS_PER_SEED', 1000),
  renderJs: bool('BAZBOT_RENDER_JS', false),
  ignoreRobots: bool('BAZBOT_IGNORE_ROBOTS', false),
  allowPrivateNetwork: bool('BAZBOT_ALLOW_PRIVATE_NETWORK', false),
  pageSize: int('BAZAARA_SEARCH_PAGE_SIZE', 10),
  maxPageSize: int('BAZAARA_SEARCH_MAX_PAGE_SIZE', 50),
  semantic: bool('BAZAARA_SEARCH_SEMANTIC', true),
  ollamaEnabled: bool('BAZAARA_OLLAMA_ENABLED', false),
  ollamaUrl: str('BAZAARA_OLLAMA_URL', 'http://127.0.0.1:11434').replace(/\/$/, ''),
  ollamaModel: str('BAZAARA_OLLAMA_MODEL', 'nomic-embed-text'),
});
