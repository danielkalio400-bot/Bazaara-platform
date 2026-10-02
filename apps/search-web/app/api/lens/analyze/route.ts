import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

function upstreamUrl() {
  const raw = process.env.BAZLENS_WEB_ORIGIN?.trim() || 'http://127.0.0.1:3041';
  try {
    const url = new URL('/api/analyze', raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET() {
  const target = upstreamUrl();
  if (!target) return NextResponse.json({ configured: false }, { status: 503, headers });
  try {
    const response = await fetch(target, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(3000) });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status, headers });
  } catch {
    return NextResponse.json({ configured: false, message: 'BazLens is unavailable.' }, { status: 502, headers });
  }
}

export async function POST(request: NextRequest) {
  const target = upstreamUrl();
  if (!target) return NextResponse.json({ message: 'BazLens origin is not configured.' }, { status: 503, headers });

  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > 9_000_000) return NextResponse.json({ message: 'Image exceeds the 8 MB limit.' }, { status: 413, headers });

  let incoming: FormData;
  try { incoming = await request.formData(); }
  catch { return NextResponse.json({ message: 'Expected multipart image input.' }, { status: 400, headers }); }

  const image = incoming.get('image');
  const mode = String(incoming.get('mode') || 'similar');
  if (!(image instanceof File) || image.size > 8 * 1024 * 1024 || !['image/jpeg','image/png','image/webp','image/gif'].includes(image.type)) {
    return NextResponse.json({ message: 'Choose a PNG, JPEG, WebP or GIF image under 8 MB.' }, { status: 400, headers });
  }
  if (!['similar','text','objects'].includes(mode)) {
    return NextResponse.json({ message: 'Unsupported BazLens analysis mode.' }, { status: 400, headers });
  }

  const outbound = new FormData();
  outbound.append('image', image, image.name.slice(0, 90));
  outbound.append('mode', mode);

  try {
    const response = await fetch(target, {
      method: 'POST',
      body: outbound,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(22000),
      headers: { Accept: 'application/json' },
    });
    const size = Number(response.headers.get('content-length') || 0);
    if (size > 160_000) throw new Error('BazLens response too large');
    const text = await response.text();
    if (text.length > 160_000) throw new Error('BazLens response too large');
    let payload: unknown;
    try { payload = JSON.parse(text); }
    catch { payload = { message: 'BazLens returned an invalid response.' }; }
    return NextResponse.json(payload, { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: 'Could not reach BazLens. Check port 3041 or BAZLENS_WEB_ORIGIN.' }, { status: 502, headers });
  }
}
