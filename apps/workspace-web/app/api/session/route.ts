import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_API, safeUser } from '../../../lib/session.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff' };
export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return NextResponse.json({ authenticated:false }, { status:401, headers });
  try {
    const result = await fetch(`${process.env.PLATFORM_API_ORIGIN ?? DEFAULT_API}/v1/bazid/me`, {
      headers:{ cookie, accept:'application/json' }, cache:'no-store', redirect:'manual', signal:AbortSignal.timeout(5000),
    });
    if (result.status === 401) return NextResponse.json({ authenticated:false }, { status:401, headers });
    if (!result.ok) return NextResponse.json({ message:'Identity service unavailable.' }, { status:502, headers });
    const user = safeUser(await result.json());
    if (!user) return NextResponse.json({ message:'Invalid identity response.' }, { status:502, headers });
    return NextResponse.json({ authenticated:true,user }, { headers });
  } catch { return NextResponse.json({ message:'Identity service unavailable.' }, { status:502, headers }); }
}
