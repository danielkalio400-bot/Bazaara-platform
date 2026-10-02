"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createApiClient } from "@bazaara/api-client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const BAZID_BASE = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
export const api = createApiClient({ baseUrl: API_BASE, credentials: "include" });

export type UploadedMedia = { id: string; status: string; objectKey?: string; publicUrl?: string | null };
export async function uploadMedia(file: File, visibility: "PRIVATE" | "PUBLIC" = "PRIVATE"): Promise<UploadedMedia> {
  if (!file.size) throw new Error("Choose a non-empty file.");
  if (file.size > 250 * 1024 * 1024) throw new Error("Files are limited to 250 MB in this release.");
  const contentType = file.type || "application/octet-stream";
  const reservation = await api.post<{
    asset: { id: string; status: string; objectKey: string };
    upload: { method: "PUT"; url: string; headers: Record<string, string> };
  }>("/v1/media/uploads", { contentType, byteSize: file.size, visibility });
  const uploaded = await fetch(reservation.upload.url, { method: reservation.upload.method, headers: reservation.upload.headers, body: file });
  if (!uploaded.ok) throw new Error(`Media upload failed (${uploaded.status}).`);
  const completed = await api.post<{ asset: { id: string; status: string; publicUrl?: string | null } }>(
    `/v1/media/${encodeURIComponent(reservation.asset.id)}/complete`, {},
  );
  return { ...reservation.asset, ...completed.asset };
}

export type SocialUser = { id: string; displayName: string | null; profile: { handle: string; bio: string; discoverable: boolean } | null };
export const apps = [
  { slug: "bazchat", title: "BChat", port: 3013, url: process.env.NEXT_PUBLIC_BAZCHAT_BASE_URL ?? "http://localhost:3013", description: "Messages & calls", mark: "B" },
  { slug: "bazclips", title: "ZimZam", port: 3014, url: process.env.NEXT_PUBLIC_BAZCLIPS_BASE_URL ?? "http://localhost:3014", description: "Short-form video", mark: "Z" },
  { slug: "baztune", title: "BTune", port: 3015, url: process.env.NEXT_PUBLIC_BAZTUNE_BASE_URL ?? "http://localhost:3015", description: "Music & audio", mark: "T" },
  { slug: "bazcircle", title: "Bicord", port: 3017, url: process.env.NEXT_PUBLIC_BAZCIRCLE_BASE_URL ?? "http://localhost:3017", description: "Communities & social", mark: "Bi" },
  { slug: "bazcut", title: "BazCut", port: 3018, url: process.env.NEXT_PUBLIC_BAZCUT_BASE_URL ?? "http://localhost:3018", description: "Video editing", mark: "C" },
  { slug: "bazsend", title: "BSend", port: 3019, url: process.env.NEXT_PUBLIC_BAZSEND_BASE_URL ?? "http://localhost:3019", description: "File transfer", mark: "S" },
] as const;

export function productForSlug(slug: string) { return apps.find(app => app.slug === slug) ?? apps[0]; }
export function errorText(error: unknown) { return error instanceof Error ? error.message : "The request could not be completed."; }
export function signInUrl() { const path = typeof window !== "undefined" ? window.location.href : "http://localhost:3013"; return `${BAZID_BASE}/bazid/sign-in?returnTo=${encodeURIComponent(path)}`; }
export function registerUrl() { const path = typeof window !== "undefined" ? window.location.href : "http://localhost:3013"; return `${BAZID_BASE}/bazid/register?returnTo=${encodeURIComponent(path)}`; }

export function useSocialSession() {
  const [user, setUser] = useState<SocialUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try { const response = await api.get<{user: SocialUser}>("/v1/social/me", { maxRetries: 0 }); setUser(response.user); setUnauthenticated(false); setError(""); }
    catch (e) { const status = (e as {status?: number}).status; if (status === 401) setUnauthenticated(true); else setError(errorText(e)); setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { user, loading, unauthenticated, error, refresh };
}

function ProductMark({label}:{label:string}) { return <span className="e2-productMark" aria-hidden="true">{label}</span>; }

export function Shell({slug,children,section}:{slug:string;children:ReactNode;section?:string}) {
  const product = productForSlug(slug);
  return <div className={`e2-app e2-standalone e2-${slug}`}>
    <header className="e2-header e2-productHeader">
      <a href="/" className="e2-productBrand" aria-label={`${product.title} home`}><ProductMark label={product.mark}/><span><strong>{product.title}</strong><small>{product.description}</small></span></a>
      <div className="e2-breadcrumb"><strong>{product.title}</strong>{section?<><span className="e2-sep">/</span><span>{section}</span></>:null}</div>
      <div className="e2-headerActions"><span className="e2-beta">ALPHA BUILD</span><a href={BAZID_BASE} className="e2-identity" aria-label="Open BazID account">◉ <span>BazID</span></a></div>
    </header>
    <main className="e2-content">{children}</main>
    <footer className="e2-footer"><span>{product.title}</span><span>Independent BAZAARA product · BazID authentication</span></footer>
  </div>;
}

export function SessionGate({loading,unauthenticated,error,children,productName="this app"}:{loading:boolean;unauthenticated:boolean;error:string;children:ReactNode;productName?:string}) {
  if (loading) return <div className="e2-gate" role="status"><div className="e2-spinner"/><h2>Opening {productName}</h2><p>Checking your BazID session.</p></div>;
  if (unauthenticated) return <div className="e2-gate"><div className="e2-gateMark">◉</div><div className="e2-kicker">{productName.toUpperCase()}</div><h2>Sign in to continue.</h2><p>{productName} works as its own product and uses BazID only for secure account authentication.</p><div className="e2-actions"><a className="e2-button" href={signInUrl()}>Sign in with BazID →</a><a className="e2-button secondary" href={registerUrl()}>Create BazID</a></div></div>;
  if (error) return <div className="e2-notice" role="alert">{error} Check that the platform API is running on port 4000.</div>;
  return <>{children}</>;
}

export function ProfileSetup({user,onComplete,productName="BAZAARA",headline}:{user:SocialUser;onComplete:()=>void;productName?:string;headline?:string}) {
  const [handle,setHandle]=useState(""); const [displayName,setDisplayName]=useState(user.displayName??""); const [bio,setBio]=useState(""); const [discoverable,setDiscoverable]=useState(false); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
  if (user.profile) return null;
  return <div className="e2-gate e2-profile"><span className="e2-kicker">WELCOME TO {productName.toUpperCase()}</span><h2>{headline ?? `Set up your ${productName} profile.`}</h2><p>This profile is used inside {productName}. Your BazID remains your account sign-in.</p><form onSubmit={async e=>{e.preventDefault();setSaving(true);setError("");try{await api.put("/v1/social/me",{handle,bio,displayName,discoverable});onComplete();}catch(err){setError(errorText(err));}finally{setSaving(false);}}} className="e2-form"><label>Display name<input value={displayName} maxLength={80} onChange={e=>setDisplayName(e.target.value)} required/></label><label>{productName} handle <span>3–30 characters, letters/numbers/underscores</span><div className="e2-inputPrefix"><span>@</span><input value={handle} onChange={e=>setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} minLength={3} maxLength={30} pattern="[a-z][a-z0-9_]{2,29}" required/></div></label><label>Bio <span>Optional</span><textarea value={bio} maxLength={280} rows={3} onChange={e=>setBio(e.target.value)}/></label>{error?<div className="e2-notice" role="alert">{error}</div>:null}<label className="e2-optIn"><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)}/><span><strong>Allow discovery in {productName}</strong><small>Other members can find you by name or handle. Off by default.</small></span></label><button className="e2-button" disabled={saving}>{saving?"Saving…":`Enter ${productName} →`}</button></form></div>;
}

export function TitleBlock({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}) {return <div className="e2-title"><div><span className="e2-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action?<div className="e2-titleAction">{action}</div>:null}</div>;}
export function Member({name,handle,size="normal"}:{name:string|null;handle?:string|null;size?:"normal"|"small"}) {const label=name?.trim()||handle||"Member";return <span className={`e2-member ${size==="small"?"small":""}`} aria-hidden="true">{label.charAt(0).toUpperCase()}</span>;}
