import { NextRequest, NextResponse } from 'next/server';
import { allowedMutationOrigin, DEFAULT_API, DEFAULT_ORIGIN, publicError, safeUser, validCredentials } from '../../../../lib/session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };

// Browser POST -> same-origin BFF -> existing BazID Platform API. No credentials go to external telemetry.
export async function POST(request: NextRequest) {
  if (!allowedMutationOrigin(request, process.env.WORKSPACE_PUBLIC_ORIGIN ?? DEFAULT_ORIGIN)) {
    return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403, headers: noStore });
  }
  const length = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(length) || length > 4096) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 413, headers: noStore });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) throw new Error('oversized');
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400, headers: noStore }); }
  if (!validCredentials(body)) return NextResponse.json({ message: 'Enter a valid email and password.' }, { status: 400, headers: noStore });
  try {
    const upstream = await fetch(`${process.env.PLATFORM_API_ORIGIN ?? DEFAULT_API}/v1/bazid/login/email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', accept:'application/json' },
      body: JSON.stringify({ email: body.email.trim(), password: body.password }),
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(7000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ message: publicError(upstream.status) }, { status: upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 401 : 502, headers: noStore });
    }
    const user = safeUser(await upstream.json());
    const cookies = upstream.headers.getSetCookie();
    const sessionCookieName = process.env.WORKSPACE_SESSION_COOKIE_NAME || 'bazid_session';
    if (!user || !cookies.some(value => value.startsWith(`${sessionCookieName}=`))) {
      return NextResponse.json({ message:'BazID did not return an expected session. Check the platform configuration.' }, { status:502, headers:noStore });
    }
    const result = NextResponse.json({ user }, { status: 200, headers:noStore });
    for (const cookie of cookies) result.headers.append('Set-Cookie', cookie);
    return result;
  } catch {
    return NextResponse.json({ message:'Cannot reach BazID. Start the existing Platform API and try again.' }, { status:502, headers:noStore });
  }
}
