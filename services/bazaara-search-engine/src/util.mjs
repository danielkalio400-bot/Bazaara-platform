import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';

export const nowIso = () => new Date().toISOString();
export const sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TRACKING = /^(utm_(source|medium|campaign|term|content|id)|fbclid|gclid|dclid|msclkid|mc_[ce]id|ref_src)$/i;

export function normalizeUrl(input, base) {
  let u;
  try { u = base ? new URL(input, base) : new URL(input); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  u.hash = '';
  u.hostname = u.hostname.toLowerCase().replace(/\.$/, '');
  if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) u.port = '';
  for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key);
  const params = [...u.searchParams.entries()].sort(([a,av],[b,bv]) => a.localeCompare(b) || av.localeCompare(bv));
  u.search = '';
  for (const [k,v] of params) u.searchParams.append(k,v);
  u.pathname = u.pathname.replace(/\/+/g, '/');
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
  return u.toString();
}

export function normalizeQuery(q) {
  return String(q ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function tokenize(text) {
  return normalizeQuery(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]{1,50}/gu) ?? [];
}

const SEARCH_STOPWORDS = new Set([
  'a','an','and','are','as','at','be','been','being','but','by','for','from','had','has','have','he','her','hers','him','his','i','if','in','into','is','it','its','me','my','of','on','or','our','ours','she','so','than','that','the','their','theirs','them','then','there','these','they','this','those','to','too','us','was','we','were','what','when','where','which','with','you','your','yours'
]);

export function searchTerms(query) {
  const all = tokenize(query).slice(0, 16).map(t => t.replace(/"/g, ''));
  if (!all.length) return [];
  const meaningful = all.filter(t => !SEARCH_STOPWORDS.has(t));
  // Never turn a legitimate stopword-only query into an empty query.
  return (meaningful.length ? meaningful : all).slice(0, 12);
}

export function buildFtsQuery(query) {
  const terms = searchTerms(query);
  if (!terms.length) return null;
  return terms.map(t => `"${t}"`).join(' OR ');
}

function ipv4Private(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n))) return true;
  return p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) ||
    p[0] === 0 || p[0] >= 224;
}

function ipv6Private(ip) {
  const x = ip.toLowerCase();
  return x === '::1' || x === '::' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb') || x.startsWith('ff');
}

export function isPrivateIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return ipv4Private(ip);
  if (kind === 6) return ipv6Private(ip);
  return true;
}

export async function assertPublicHttpUrl(url, allowPrivate=false) {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http/https URLs are allowed');
  if (allowPrivate) return;
  const records = await dns.lookup(u.hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error('DNS resolution returned no addresses');
  for (const r of records) if (isPrivateIp(r.address)) throw new Error(`Blocked private/reserved address: ${r.address}`);
}

export async function fetchLimited(url, { userAgent, timeoutMs=15000, maxBytes=5_000_000, allowPrivate=false, headers={}, maxRedirects=5 }={}) {
  let current = url;
  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    await assertPublicHttpUrl(current, allowPrivate);
    const started = Date.now();
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': userAgent ?? 'BazBot/1.0', 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', ...headers }
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const loc = response.headers.get('location');
      if (!loc) throw new Error('Redirect without Location header');
      current = normalizeUrl(loc, current);
      if (!current) throw new Error('Invalid redirect URL');
      continue;
    }
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error(`Response exceeds byte limit (${declared} > ${maxBytes})`);
    const reader = response.body?.getReader();
    const chunks = [];
    let total = 0;
    if (reader) {
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) { try { await reader.cancel(); } catch {} throw new Error(`Response exceeded byte limit ${maxBytes}`); }
        chunks.push(value);
      }
    }
    const bytes = Buffer.concat(chunks.map(c => Buffer.from(c)));
    return { response, bytes, finalUrl: current, durationMs: Date.now() - started };
  }
  throw new Error('Too many redirects');
}

export function htmlDecode(s='') {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}

export function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
export function daysOld(date) {
  const t = date ? Date.parse(date) : NaN;
  return Number.isFinite(t) ? Math.max(0, (Date.now()-t)/86400000) : null;
}
export function freshnessScore(date) {
  const d = daysOld(date);
  if (d == null) return 0.15;
  return Math.exp(-d / 90);
}
export function snippet(text, terms=[], max=220) {
  const clean = String(text ?? '').replace(/\s+/g,' ').trim();
  if (clean.length <= max) return clean;
  const lower = clean.toLowerCase();
  let at = -1;
  for (const term of terms) { const i = lower.indexOf(term.toLowerCase()); if (i >= 0 && (at < 0 || i < at)) at = i; }
  if (at < 0) return clean.slice(0,max).trim() + '…';
  const start = Math.max(0, at - Math.floor(max * .35));
  const end = Math.min(clean.length, start + max);
  return (start ? '…' : '') + clean.slice(start,end).trim() + (end < clean.length ? '…' : '');
}

export function json(res, status, payload, extraHeaders={}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'content-length':Buffer.byteLength(body), ...extraHeaders });
  res.end(body);
}

export async function readJson(req, maxBytes=1_000_000) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size += chunk.length; if (size > maxBytes) throw new Error('Request body too large'); chunks.push(chunk); }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
