"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBazIdNativeClientById, isBazIdNativeRedirectUri } from "@bazaara/bazid-client";

type User = {
  id: string;
  displayName: string | null;
  verificationLevel: string;
};

type RequestState = {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  scope: string;
};

function requestComplete(request: RequestState) {
  const client = getBazIdNativeClientById(request.clientId);
  if (!client) return false;
  const allowedScopes = new Set(client.scope.split(/\s+/));
  const requestedScopes = request.scope.trim().split(/\s+/).filter(Boolean);
  return (
    request.responseType === "code" &&
    isBazIdNativeRedirectUri(request.clientId, request.redirectUri, process.env.NODE_ENV === "development") &&
    request.codeChallenge.length >= 43 &&
    request.codeChallengeMethod.toUpperCase() === "S256" &&
    request.state.length >= 8 &&
    requestedScopes.length > 0 &&
    requestedScopes.every((scope) => allowedScopes.has(scope))
  );
}

function BazIdAuthorizeContent() {
  const search = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const clientId = search.get("client_id") ?? "";
  const client = getBazIdNativeClientById(clientId);
  const request = useMemo<RequestState>(
    () => ({
      clientId,
      redirectUri: search.get("redirect_uri") ?? "",
      responseType: search.get("response_type") ?? "",
      codeChallenge: search.get("code_challenge") ?? "",
      codeChallengeMethod: search.get("code_challenge_method") ?? "",
      state: search.get("state") ?? "",
      scope: search.get("scope") ?? client?.scope ?? "openid profile",
    }),
    [client?.scope, clientId, search]
  );

  const complete = requestComplete(request);
  const clientName = client?.name ?? "Bazaara app";
  const returnTo = `/bazid/authorize?${new URLSearchParams(
    Array.from(search.entries()).filter(([key]) => key !== "flow_error")
  ).toString()}`;
  const createAccountHref = `/bazid/register?returnTo=${encodeURIComponent(returnTo)}`;
  const flowError = search.get("flow_error") ?? "";

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/native-bazid/me", { credentials: "include", cache: "no-store" });
        const body = (await response.json().catch(() => null)) as { user?: User } | null;
        if (active && response.ok && body?.user) setUser(body.user);
      } catch {
        // Authorization form remains usable even if session discovery fails.
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "start center", padding: "22px 14px 36px", background: "#0F172A", color: "#F8FAFC", fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <section style={{ width: "min(430px, 100%)", border: "1px solid rgba(203,213,225,.18)", borderRadius: 16, background: "#182234", padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>
        <div style={{ fontWeight: 900, letterSpacing: "-.04em", fontSize: 21 }}>
          BAZAARA<span style={{ color: "#7166FF" }}>.</span>{" "}<span style={{ color: "#AEBBD0", fontWeight: 700, fontSize: 13 }}>BazID</span>
        </div>
        <p style={{ color: "#F97316", fontSize: 11, fontWeight: 900, letterSpacing: ".11em", textTransform: "uppercase", marginTop: 22 }}>Secure mobile authorization</p>
        <h1 style={{ margin: "6px 0 8px", fontSize: 27, lineHeight: 1.08, letterSpacing: "-.04em" }}>Continue to {clientName}</h1>
        <p style={{ color: "#AEBBD0", lineHeight: 1.55, fontSize: 14 }}>Sign in with BazID, then return securely to the requesting app.</p>

        {!complete ? <div style={{ marginTop: 14, padding: 11, borderRadius: 9, background: "rgba(239,68,68,.16)", color: "#FCA5A5", fontSize: 13 }}>This authorization request is incomplete or unregistered. Reopen BazID from an updated Bazaara app.</div> : null}
        {flowError ? <div role="alert" style={{ marginTop: 14, padding: 11, borderRadius: 9, background: "rgba(239,68,68,.16)", color: "#FCA5A5", fontSize: 13 }}>{flowError}</div> : null}

        {user ? (
          <form action="/api/native-bazid/native-flow" method="post" style={{ marginTop: 18 }}>
            <input type="hidden" name="flowAction" value="authorize" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div style={{ padding: 12, border: "1px solid rgba(203,213,225,.16)", borderRadius: 10, background: "#202C40", marginBottom: 12 }}><strong>{user.displayName || "BazID account"}</strong></div>
            <button type="submit" disabled={!complete} style={{ width: "100%", minHeight: 46, border: 0, borderRadius: 9, background: "#5B4DFF", color: "#fff", fontWeight: 850 }}>Continue to {clientName}</button>
          </form>
        ) : (
          <form action="/api/native-bazid/native-flow" method="post" style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <input type="hidden" name="flowAction" value="login" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div style={{ color: "#F8FAFC", fontWeight: 850, fontSize: 15 }}>Sign in to BazID</div>
            {checking ? <div style={{ color: "#7E8DA6", fontSize: 11 }}>Checking for an existing session…</div> : null}
            <label style={{ display: "grid", gap: 5, color: "#AEBBD0", fontSize: 12, fontWeight: 700 }}>Email<input name="email" type="email" required autoComplete="email" style={{ minHeight: 44, borderRadius: 9, border: "1px solid rgba(203,213,225,.22)", background: "#202C40", color: "#fff", padding: "0 11px", font: "inherit" }} /></label>
            <label style={{ display: "grid", gap: 5, color: "#AEBBD0", fontSize: 12, fontWeight: 700 }}>Password<input name="password" type="password" required autoComplete="current-password" style={{ minHeight: 44, borderRadius: 9, border: "1px solid rgba(203,213,225,.22)", background: "#202C40", color: "#fff", padding: "0 11px", font: "inherit" }} /></label>
            <button type="submit" disabled={!complete} style={{ minHeight: 46, border: 0, borderRadius: 9, background: "#5B4DFF", color: "#fff", fontWeight: 850 }}>Sign in and continue</button>
            <div style={{ display: "grid", gap: 8, marginTop: 6, paddingTop: 14, borderTop: "1px solid rgba(203,213,225,.12)", textAlign: "center" }}><span style={{ color: "#AEBBD0", fontSize: 12 }}>Don&apos;t have a BazID?</span><a href={createAccountHref} style={{ minHeight: 44, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid rgba(113,102,255,.65)", color: "#F8FAFC", textDecoration: "none", fontWeight: 850 }}>Create BazID account</a></div>
          </form>
        )}
      </section>
    </main>
  );
}

export default function BazIdAuthorizePage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh", background: "#0F172A" }} />}><BazIdAuthorizeContent /></Suspense>;
}
