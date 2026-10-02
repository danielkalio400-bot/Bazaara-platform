import { headers } from 'next/headers';
import { DEFAULT_API, safeUser } from './session.mjs';
export type WorkspaceUser = { id:string; displayName:string; verificationLevel:string; locale?:string; email:string|null };
export type IdentityState = { status:'signed-in'; user:WorkspaceUser } | {status:'signed-out'|'unavailable';user:null};

export async function getIdentity(): Promise<IdentityState> {
  const cookies = (await headers()).get('cookie');
  if (!cookies) return { status:'signed-out', user:null };
  try {
    const response = await fetch(`${process.env.PLATFORM_API_ORIGIN ?? DEFAULT_API}/v1/bazid/me`, {
      headers: { cookie: cookies, accept:'application/json' },
      cache:'no-store', redirect:'manual', signal:AbortSignal.timeout(5000),
    });
    if (response.status === 401) return { status:'signed-out', user:null };
    if (!response.ok) return { status:'unavailable', user:null };
    const user = safeUser(await response.json()) as WorkspaceUser|null;
    if (!user) return { status:'unavailable',user:null };
    return { status:'signed-in', user };
  } catch { return { status:'unavailable',user:null }; }
}
