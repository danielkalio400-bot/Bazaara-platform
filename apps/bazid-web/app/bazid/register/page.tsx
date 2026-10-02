"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const PORTAL = process.env.NEXT_PUBLIC_BAZAARA_BASE_URL ?? "http://localhost:3005";
const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const APP_DESTINATIONS: Record<string, string> = {
  ecosystem: PORTAL,
  shopping: process.env.NEXT_PUBLIC_SHOPPING_BASE_URL ?? "http://localhost:3003",
  food: process.env.NEXT_PUBLIC_FOOD_BASE_URL ?? "http://localhost:3007",
  grocery: process.env.NEXT_PUBLIC_GROCERY_BASE_URL ?? "http://localhost:3006",
  business: process.env.NEXT_PUBLIC_BUSINESS_BASE_URL ?? "http://localhost:3001",
  operations: process.env.NEXT_PUBLIC_OPERATIONS_BASE_URL ?? "http://localhost:3002",
  go: process.env.NEXT_PUBLIC_LOGISTICS_BASE_URL ?? "http://localhost:3008",
  pharmacy: process.env.NEXT_PUBLIC_PHARMACY_BASE_URL ?? "http://localhost:3011",
  pay: process.env.NEXT_PUBLIC_PAY_BASE_URL ?? "http://localhost:3010",
  drive: process.env.NEXT_PUBLIC_DRIVE_BASE_URL ?? "http://localhost:3009",
  sport: process.env.NEXT_PUBLIC_SPORT_BASE_URL ?? "http://localhost:3012",
};
const RETURN_ORIGINS = new Set(
  (
    process.env.NEXT_PUBLIC_BAZID_RETURN_ORIGINS ??
    "http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://localhost:3008,http://localhost:3009,http://localhost:3010,http://localhost:3011,http://localhost:3012,http://localhost:3013,http://localhost:3014,http://localhost:3015,http://localhost:3016,http://localhost:3017,http://localhost:3018,http://localhost:3019"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

function safeReturnTo(value: string | null, from: string | null) {
  if (!value) {
    const appDestination = from ? APP_DESTINATIONS[from.trim().toLowerCase()] : undefined;
    return appDestination ?? "/";
  }
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const destination = new URL(value, BAZID);
    if (RETURN_ORIGINS.has(destination.origin)) return destination.toString();
  } catch {
    // Invalid return destination falls back safely below.
  }

  return "/";
}

function isNativeAuthorizationReturn(returnTo: string) {
  if (!returnTo.startsWith("/bazid/authorize?")) return false;

  try {
    const url = new URL(returnTo, "http://bazid.local");
    return (
      url.pathname === "/bazid/authorize" &&
      Boolean(url.searchParams.get("client_id")) &&
      Boolean(url.searchParams.get("redirect_uri")) &&
      Boolean(url.searchParams.get("code_challenge")) &&
      Boolean(url.searchParams.get("state"))
    );
  } catch {
    return false;
  }
}

function RegisterFields({ busy = false }: { busy?: boolean }) {
  return (
    <>
      <label style={{ display: "grid", gap: 5, color: "#AEBBD0", fontSize: 12, fontWeight: 700 }}>
        Name
        <input
          name="displayName"
          type="text"
          required
          autoComplete="name"
          style={{ minHeight: 44, borderRadius: 9, border: "1px solid rgba(203,213,225,.22)", background: "#202C40", color: "#fff", padding: "0 11px", font: "inherit" }}
        />
      </label>

      <label style={{ display: "grid", gap: 5, color: "#AEBBD0", fontSize: 12, fontWeight: 700 }}>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          style={{ minHeight: 44, borderRadius: 9, border: "1px solid rgba(203,213,225,.22)", background: "#202C40", color: "#fff", padding: "0 11px", font: "inherit" }}
        />
      </label>

      <label style={{ display: "grid", gap: 5, color: "#AEBBD0", fontSize: 12, fontWeight: 700 }}>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          style={{ minHeight: 44, borderRadius: 9, border: "1px solid rgba(203,213,225,.22)", background: "#202C40", color: "#fff", padding: "0 11px", font: "inherit" }}
        />
        <span style={{ color: "#7E8DA6", fontSize: 11 }}>Use at least 12 characters.</span>
      </label>

      <button
        type="submit"
        disabled={busy}
        style={{ minHeight: 46, border: 0, borderRadius: 9, background: "#5B4DFF", color: "#fff", fontWeight: 850, opacity: busy ? 0.7 : 1 }}
      >
        {busy ? "Creating BazID..." : "Create BazID and continue"}
      </button>
    </>
  );
}

function RegisterContent() {
  const search = useSearchParams();
  const from = search.get("from");
  const returnTo = useMemo(() => safeReturnTo(search.get("returnTo"), from), [search, from]);
  const nativeFlow = useMemo(() => isNativeAuthorizationReturn(returnTo), [returnTo]);

  const [busy, setBusy] = useState(false);
  const [webError, setWebError] = useState("");

  const nativeFlowError = nativeFlow ? search.get("flow_error") ?? "" : "";
  const signInHref = useMemo(() => {
    const params = new URLSearchParams();
    if (returnTo !== "/") params.set("returnTo", returnTo);
    if (from) params.set("from", from);
    const query = params.toString();
    return query ? `/bazid/sign-in?${query}` : "/bazid/sign-in";
  }, [returnTo, from]);

  async function registerWeb(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setWebError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/native-bazid/register", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { message?: string; error?: string | { message?: string } }
        | null;

      if (!response.ok) {
        const nested =
          body?.error && typeof body.error === "object"
            ? body.error.message
            : undefined;

        throw new Error(
          body?.message ??
            nested ??
            (typeof body?.error === "string" ? body.error : undefined) ??
            `Account creation failed (${response.status})`
        );
      }

      // Web BazID sessions are host cookies and therefore work across localhost ports.
      // Return directly to Food/Grocery/Shopping/etc instead of sending a browser
      // registration through the native OAuth/PKCE flow.
      window.location.href = returnTo === "/" ? PORTAL : returnTo;
    } catch (cause) {
      setWebError(cause instanceof Error ? cause.message : "Could not create BazID");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "start center",
        padding: "22px 14px 36px",
        background: "#0F172A",
        color: "#F8FAFC",
        fontFamily: "Inter, ui-sans-serif, system-ui",
      }}
    >
      <section
        style={{
          width: "min(430px, 100%)",
          border: "1px solid rgba(203,213,225,.18)",
          borderRadius: 16,
          background: "#182234",
          padding: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,.28)",
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: "-.04em", fontSize: 21 }}>
          BAZAARA<span style={{ color: "#7166FF" }}>.</span>{" "}
          <span style={{ color: "#AEBBD0", fontWeight: 700, fontSize: 13 }}>BazID</span>
        </div>

        <p
          style={{
            color: "#F97316",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: ".11em",
            textTransform: "uppercase",
            marginTop: 22,
          }}
        >
          One secure account
        </p>

        <h1 style={{ margin: "6px 0 8px", fontSize: 27, lineHeight: 1.08, letterSpacing: "-.04em" }}>
          Create your BazID
        </h1>

        <p style={{ color: "#AEBBD0", lineHeight: 1.55, fontSize: 14 }}>
          Your BazID works across Bazaara. After creation you will return to the Bazaara app you came from automatically.
        </p>

        {nativeFlowError ? (
          <div
            role="alert"
            style={{ marginTop: 14, padding: 11, borderRadius: 9, background: "rgba(239,68,68,.16)", color: "#FCA5A5", fontSize: 13 }}
          >
            {nativeFlowError}
          </div>
        ) : null}

        {webError ? (
          <div
            role="alert"
            style={{ marginTop: 14, padding: 11, borderRadius: 9, background: "rgba(239,68,68,.16)", color: "#FCA5A5", fontSize: 13 }}
          >
            {webError}
          </div>
        ) : null}

        {nativeFlow ? (
          <form action="/api/native-bazid/native-flow" method="post" style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <input type="hidden" name="flowAction" value="register" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <RegisterFields />
          </form>
        ) : (
          <form onSubmit={registerWeb} style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <RegisterFields busy={busy} />
          </form>
        )}

        <p style={{ color: "#AEBBD0", fontSize: 12, textAlign: "center", marginTop: 16 }}>
          Already have a BazID?{" "}
          <Link href={signInHref} style={{ color: "#8B80FF", fontWeight: 850 }}>
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#0F172A" }} />}>
      <RegisterContent />
    </Suspense>
  );
}