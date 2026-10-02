import { NextRequest, NextResponse } from 'next/server';
import { allowedMutationOrigin, DEFAULT_API, DEFAULT_ORIGIN } from '../../../../lib/session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, private' };

export async function POST(request: NextRequest) {
  const origin = process.env.WORKSPACE_PUBLIC_ORIGIN ?? DEFAULT_ORIGIN;
  if (!allowedMutationOrigin(request, origin)) {
    return NextResponse.json({ message:'Invalid request origin.' }, { status:403, headers });
  }
  const cookie = request.headers.get('cookie');
  if (!cookie) return NextResponse.json({ ok:true }, { headers });
  try {
    // Platform enforces the allowed-origin list for cookie-authenticated mutations.
    // Configure WEB_ORIGINS to include http://localhost:3021. Never clear only the browser cookie.
    const upstream = await fetch(`${process.env.PLATFORM_API_ORIGIN ?? DEFAULT_API}/v1/bazid/logout`, {
      method:'POST',
      headers:{ cookie, origin, accept:'application/json' },
      cache:'no-store', redirect:'manual', signal:AbortSignal.timeout(7000),
    });
    if (upstream.status !== 204) {
      return NextResponse.json({ message:upstream.status === 403
        ? 'Platform API rejected this origin. Add http://localhost:3021 to WEB_ORIGINS and restart the Platform API.'
        : 'Unable to revoke your session. Please try again.' }, { status:502, headers });
    }
    const response = NextResponse.json({ ok:true }, { headers });
    const setCookies = upstream.headers.getSetCookie();
    for (const value of setCookies) response.headers.append('Set-Cookie',value);
    // Defense in depth: only clear the same host-only session after server-side revocation.
    response.cookies.set(process.env.WORKSPACE_SESSION_COOKIE_NAME || 'bazid_session','',{ path:'/', httpOnly:true, sameSite:'lax', maxAge:0 });
    return response;
  } catch {
    return NextResponse.json({ message:'Identity service is unavailable. Session remains active.' }, { status:502, headers });
  }
}
