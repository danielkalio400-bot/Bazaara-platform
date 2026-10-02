import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { parseSearch, SearchError, normalizeResults, safeExternalUrl } from '../src/search.mjs';
import { searchBrave } from '../src/provider.mjs';
import { createSearchServer } from '../src/server.mjs';

function url(query) { return new URL(`http://localhost/v1/search?${query}`); }

test('strict input validation, duplicate protection and page bounds', () => {
  assert.equal(parseSearch(url('q=climate+research')).q, 'climate research');
  assert.equal(parseSearch(url('q=market&category=news&page=10&country=ng')).country, 'NG');
  for (const q of ['q=', 'q=test&q=other', 'q=test&page=0', 'q=test&page=11', 'q=test&category=maps', 'q=test&category=images&page=2', `q=${'x'.repeat(201)}`]) {
    assert.throws(() => parseSearch(url(q)), SearchError, q);
  }
});

test('malicious and credential-bearing links are rejected; HTML remains plain text', () => {
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('https://user:pass@example.com'), null);
  const normal = normalizeResults({ web: { results: [
    { title: '<script>alert(1)</script>', url: 'https://example.org/a', description: '  public    page' },
    { title: 'unsafe', url: 'data:text/html,bad' },
  ] } }, 'web');
  assert.equal(normal.results.length, 1);
  assert.equal(normal.results[0].title, '<script>alert(1)</script>');
  assert.equal(normal.results[0].description, 'public page');
});

test('web provider request uses server-side key, exact encoded parameters, normalized results', async () => {
  let upstream;
  const result = await searchBrave({ q: 'African research', category: 'web', page: 3, safe: 'strict', country: 'NG' }, {
    apiKey: 'SERVER-SECRET',
    fetchImpl: async (url, options) => {
      upstream = { url: new URL(url), options };
      return { ok: true, status: 200, json: async () => ({ web: { results: [{ title: 'University', url: 'https://example.org', description: 'Research' }] } }) };
    },
  });
  assert.equal(upstream.url.hostname, 'api.search.brave.com');
  assert.equal(upstream.url.searchParams.get('offset'), '2');
  assert.equal(upstream.url.searchParams.get('country'), 'NG');
  assert.equal(upstream.options.headers['X-Subscription-Token'], 'SERVER-SECRET');
  assert.equal(result.results[0].title, 'University');
  assert.equal(result.privacy.providerReceivesQuery, true);
  assert.equal(JSON.stringify(result).includes('SERVER-SECRET'), false);
});

test('image endpoint uses its supported SafeSearch options and no offset', async () => {
  let requested;
  await searchBrave({ q: 'tigers', category: 'images', page: 1, safe: 'moderate', country: 'ALL' }, {
    apiKey: 'key',
    fetchImpl: async (url) => { requested = new URL(url); return { ok: true, status: 200, json: async () => ({ results: [] }) }; },
  });
  assert.equal(requested.pathname, '/res/v1/images/search');
  assert.equal(requested.searchParams.get('safesearch'), 'strict');
  assert.equal(requested.searchParams.has('offset'), false);
});

test('missing key, upstream authentication and rate errors are mapped safely', async () => {
  const p = { q: 'public', category: 'web', page: 1, safe: 'moderate', country: 'ALL' };
  await assert.rejects(searchBrave(p, { apiKey: '' }), { code: 'PROVIDER_NOT_CONFIGURED', status: 503 });
  await assert.rejects(searchBrave(p, { apiKey: 'key', fetchImpl: async () => ({ ok: false, status: 401 }) }), { code: 'PROVIDER_AUTH' });
  await assert.rejects(searchBrave(p, { apiKey: 'key', fetchImpl: async () => ({ ok: false, status: 429 }) }), { code: 'PROVIDER_RATE_LIMIT' });
});

test('HTTP contract: health, validation, search, rate limit and no-store headers', async (t) => {
  const server = createSearchServer({
    search: async (params) => ({ query: params.q, results: [], provider: 'mock (test only)' }),
    rateLimit: (address) => address.length > 0,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/health/live`);
  assert.equal(health.status, 200);
  const good = await fetch(`${base}/v1/search?q=bazaara`);
  assert.equal(good.status, 200);
  assert.match(good.headers.get('cache-control'), /no-store/u);
  assert.equal((await good.json()).query, 'bazaara');
  const bad = await fetch(`${base}/v1/search?q=a&page=99`);
  assert.equal(bad.status, 400);
  const missing = await fetch(`${base}/does-not-exist`);
  assert.equal(missing.status, 404);
  const limited = createSearchServer({ rateLimit: () => false });
  limited.listen(0, '127.0.0.1');
  await once(limited, 'listening');
  t.after(() => limited.close());
  const response = await fetch(`http://127.0.0.1:${limited.address().port}/v1/search?q=hi`);
  assert.equal(response.status, 429);
});

test('provider timeout and malformed JSON map to explicit safe errors', async () => {
  const p = { q: 'bazaara', category: 'news', page: 1, safe: 'moderate', country: 'NG' };
  const timeout = new Error('provider hung'); timeout.name = 'TimeoutError';
  await assert.rejects(searchBrave(p, { apiKey: 'key', fetchImpl: async () => { throw timeout; } }), {
    code: 'PROVIDER_TIMEOUT', status: 504,
  });
  await assert.rejects(searchBrave(p, { apiKey: 'key', fetchImpl: async () => ({
    status: 200, ok: true, json: async () => { throw new Error('invalid JSON'); },
  }) }), { code: 'PROVIDER_INVALID_RESPONSE', status: 502 });
});

test('unexpected backend exceptions never expose stack traces or credentials', async (t) => {
  const server = createSearchServer({ search: async () => { throw new Error('SECRET-TOKEN-DO-NOT-PRINT'); }, rateLimit: () => true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/v1/search?q=privacy`);
  const text = await response.text();
  assert.equal(response.status, 502);
  assert.equal(text.includes('SECRET-TOKEN-DO-NOT-PRINT'), false);
  assert.equal(text.includes('stack'), false);
});
