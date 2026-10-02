import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Place = { id: string; name: string; address: string; type: string; lat: number; lon: number; bbox: [number, number, number, number] | null };
type Cached = { expires: number; places: Place[] };
const cache = new Map<string, Cached>();
let active = false;
let lastRequest = 0;
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, more: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...headers, ...more } });

/** Explicit submit only. No browser autocomplete, no scraping and no API key in the client bundle. */
export async function GET(request: NextRequest) {
  const contact = (process.env.BMAP_GEOCODE_CONTACT || '').trim();
  const configured = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.length <= 254;
  if (request.nextUrl.searchParams.get('status') === '1') return json({ configured, provider: configured ? 'OpenStreetMap Nominatim' : null });
  if (!configured) return json({ code: 'GEOCODER_UNCONFIGURED', message: 'Configure BMAP_GEOCODE_CONTACT with a valid contact email to enable live place lookup.' }, 503);
  if (request.nextUrl.searchParams.getAll('q').length !== 1) return json({ code: 'INVALID_QUERY', message: 'Enter one search phrase.' }, 400);
  const q = (request.nextUrl.searchParams.get('q') || '').trim().replace(/\s+/gu, ' ');
  if ([...q].length < 3 || [...q].length > 120 || /[\u0000-\u001f\u007f]/u.test(q)) return json({ code: 'INVALID_QUERY', message: 'Enter a place name of 3–120 characters.' }, 400);
  const key = q.toLocaleLowerCase('en');
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return json({ places: hit.places, attribution: '© OpenStreetMap contributors', cached: true });
  const now = Date.now();
  if (active || now - lastRequest < 1200) return json({ code: 'RATE_LIMIT', message: 'Please wait a moment before your next place search.' }, 429, { 'Retry-After': '2' });
  active = true; lastRequest = now;
  try {
    // The upstream is configured by the operator, never accepted from a browser parameter.
    const origin = process.env.BMAP_GEOCODE_BASE_URL || 'https://nominatim.openstreetmap.org';
    const base = new URL(origin);
    if (base.protocol !== 'https:' || base.username || base.password) throw Error('Geocoder origin must use HTTPS.');
    const url = new URL('search', base.href.endsWith('/') ? base.href : base.href + '/');
    url.searchParams.set('q', q); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('addressdetails', '0'); url.searchParams.set('limit', '8');
    const upstream = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(9000), headers: { Accept: 'application/json', 'User-Agent': `Bazaara-BMap/2.0 (${contact})` } });
    if (!upstream.ok) return json({ code: 'GEOCODER_UNAVAILABLE', message: 'Place lookup is temporarily unavailable.' }, 502);
    if (Number(upstream.headers.get('content-length') || 0) > 100_000) throw Error('Response too large');
    const body = await upstream.text(); if (body.length > 100_000) throw Error('Response too large');
    const raw: unknown = JSON.parse(body);
    if (!Array.isArray(raw)) throw Error('Unexpected geocoding response');
    const places: Place[] = raw.slice(0, 8).flatMap((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return [];
      const row = entry as Record<string, unknown>;
      const lat = Number(row.lat), lon = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return [];
      const address = typeof row.display_name === 'string' ? row.display_name.trim().slice(0, 320) : '';
      if (!address) return [];
      const rawBbox = row.boundingbox;
      let bbox: Place['bbox'] = null;
      if (Array.isArray(rawBbox) && rawBbox.length === 4) {
        const values = rawBbox.map(Number);
        if (values.every(Number.isFinite) && values[0] >= -90 && values[1] <= 90 && values[2] >= -180 && values[3] <= 180) bbox = [values[2], values[0], values[3], values[1]];
      }
      return [{ id: `${String(row.osm_type || 'place').slice(0, 20)}-${String(row.osm_id || `${lat},${lon}`).slice(0, 40)}`,
        name: address.split(',')[0].slice(0, 130), address, type: typeof row.type === 'string' ? row.type.slice(0, 65) : 'place', lat, lon, bbox }];
    });
    if (cache.size > 120) { for (const [item, value] of cache) if (value.expires < now || cache.size > 100) cache.delete(item); }
    cache.set(key, { expires: now + 2 * 60 * 60 * 1000, places });
    return json({ places, attribution: '© OpenStreetMap contributors', cached: false });
  } catch {
    return json({ code: 'GEOCODER_UNAVAILABLE', message: 'The geocoding service could not complete this request. Try again later.' }, 502);
  } finally { active = false; }
}
