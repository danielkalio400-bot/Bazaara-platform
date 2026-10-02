import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { parseSearch, SearchError } from './search.mjs';
import { searchBrave } from './provider.mjs';

const IP_WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 30;
const MAX_CONCURRENT = 20;
const ipBuckets = new Map();
let active = 0;
let seenRequests = 0;

function json(res, status, body, moreHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...moreHeaders,
  });
  res.end(JSON.stringify(body));
}

function withinLimit(address) {
  const now = Date.now();
  const existing = ipBuckets.get(address);
  const next = !existing || existing.expires <= now ? { count: 1, expires: now + IP_WINDOW_MS } : existing;
  if (next === existing) next.count += 1;
  ipBuckets.set(address, next);
  if (++seenRequests % 512 === 0) {
    for (const [key, bucket] of ipBuckets) if (bucket.expires < now) ipBuckets.delete(key);
  }
  return next.count <= REQUESTS_PER_WINDOW;
}

/** Can be exercised by an HTTP integration test without starting the full platform. */
export function createSearchServer({ search = searchBrave, rateLimit = withinLimit } = {}) {
  return http.createServer(async (req, res) => {
    // Do not log URLs: searches appear in the query string.
    if (req.method !== 'GET') return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' }, { Allow: 'GET' });
    let url;
    try { url = new URL(req.url ?? '/', 'http://localhost'); } catch {
      return json(res, 400, { code: 'INVALID_URL', message: 'Invalid request.' });
    }
    if (url.pathname === '/health/live') return json(res, 200, { status: 'ok', service: 'bazaara-search-api' });
    if (url.pathname === '/health/ready') {
      const configured = Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
      return json(res, configured ? 200 : 503, {
        status: configured ? 'ready' : 'needs-provider-key',
        providerConfigured: configured,
      });
    }
    if (url.pathname !== '/v1/search') return json(res, 404, { code: 'NOT_FOUND', message: 'Not found.' });
    // Bind to loopback by default, and never trust a caller-controlled forwarded-IP header.
    if (!rateLimit(req.socket.remoteAddress ?? 'unknown')) {
      return json(res, 429, { code: 'RATE_LIMIT', message: 'Too many searches. Try again shortly.' }, { 'Retry-After': '60' });
    }
    if (active >= MAX_CONCURRENT) return json(res, 503, { code: 'BUSY', message: 'Search is busy. Please retry.' });
    let params;
    try { params = parseSearch(url); } catch (error) {
      if (error instanceof SearchError) return json(res, error.status, { code: error.code, message: error.message });
      return json(res, 400, { code: 'INVALID_QUERY', message: 'Invalid search request.' });
    }
    active += 1;
    try {
      const result = await search(params);
      return json(res, 200, result);
    } catch (error) {
      if (error instanceof SearchError) return json(res, error.status, { code: error.code, message: error.message });
      // Never expose provider credentials, upstream URLs, stack traces or search text.
      return json(res, 502, { code: 'UPSTREAM_ERROR', message: 'Search could not be completed.' });
    } finally {
      active -= 1;
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.SEARCH_API_PORT ?? 4020);
  const host = process.env.SEARCH_API_HOST ?? '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SEARCH_API_PORT');
  createSearchServer().listen(port, host, () => {
    console.log(`BAZAARA Search API listening on http://${host}:${port} (no query logging)`);
    if (!process.env.BRAVE_SEARCH_API_KEY) console.warn('BRAVE_SEARCH_API_KEY is not set; searches will display a configuration message.');
  });
}
