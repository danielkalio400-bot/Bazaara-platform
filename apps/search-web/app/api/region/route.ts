import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'private, no-store',
  'Vary': 'CF-IPCountry, X-Vercel-IP-Country, X-Country-Code, X-Geo-Country, Accept-Language',
};

function validCountry(value: string | null | undefined) {
  const code = (value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== 'ZZ' ? code : null;
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || null;
}

async function configuredGeoIp(request: NextRequest) {
  const template = process.env.BAZAARA_GEOIP_ENDPOINT?.trim();
  const ip = clientIp(request);
  if (!template || !ip || ['127.0.0.1', '::1'].includes(ip)) return null;

  let target: URL;
  try {
    const raw = template.includes('{ip}') ? template.replace('{ip}', encodeURIComponent(ip)) : template;
    target = new URL(raw);
    if (target.protocol !== 'https:' || target.username || target.password) return null;
    if (!template.includes('{ip}')) target.searchParams.set('ip', ip);
  } catch {
    return null;
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.BAZAARA_GEOIP_API_KEY) headers.Authorization = `Bearer ${process.env.BAZAARA_GEOIP_API_KEY}`;
    const response = await fetch(target, {
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return null;
    const payload = await response.json() as Record<string, unknown>;
    const code = validCountry(
      typeof payload.country_code === 'string' ? payload.country_code :
      typeof payload.countryCode === 'string' ? payload.countryCode :
      typeof payload.country === 'string' && payload.country.length === 2 ? payload.country : null,
    );
    return code;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const edgeCountry = [
    request.headers.get('x-vercel-ip-country'),
    request.headers.get('cf-ipcountry'),
    request.headers.get('x-country-code'),
    request.headers.get('x-geo-country'),
    request.headers.get('x-appengine-country'),
  ].map(validCountry).find(Boolean) || null;

  if (edgeCountry) {
    return NextResponse.json({ country: edgeCountry, source: 'edge-ip' }, { headers: responseHeaders });
  }

  const geoCountry = await configuredGeoIp(request);
  if (geoCountry) {
    return NextResponse.json({ country: geoCountry, source: 'geoip' }, { headers: responseHeaders });
  }

  return NextResponse.json({ country: 'ALL', source: 'unavailable' }, { headers: responseHeaders });
}
