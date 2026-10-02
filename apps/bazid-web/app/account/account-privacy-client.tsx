"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Email = { email: string; verifiedAt: string | null; isPrimary: boolean };
type Phone = { e164: string; verifiedAt: string | null; isPrimary: boolean };
type User = {
  id: string;
  displayName: string | null;
  locale: string;
  verificationLevel: string;
  emails: Email[];
  phones?: Phone[];
};
type Session = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  current: boolean;
};
type PrivacyRequest = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  dueAt: string;
};

const PORTAL = process.env.NEXT_PUBLIC_BAZAARA_BASE_URL ?? "http://localhost:3005";
const FOOD = process.env.NEXT_PUBLIC_FOOD_BASE_URL ?? "http://localhost:3007";
const PAY = process.env.NEXT_PUBLIC_PAY_BASE_URL ?? "http://localhost:3010";
const SHOPPING = process.env.NEXT_PUBLIC_SHOPPING_BASE_URL ?? "http://localhost:3003";
const BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_BASE_URL ?? "http://localhost:3001";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? body?.error?.message ?? `Request failed (${response.status})`);
  return body as T;
}

function browserLabel(session: Session) {
  if (session.deviceLabel) return session.deviceLabel;
  const ua = session.userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
  return `${browser} · ${device}`;
}

function initials(name: string | null | undefined, email: string | undefined) {
  const clean = (name ?? "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "B";
  }
  return (email?.[0] ?? "B").toUpperCase();
}

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "recently";
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 2) return "now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function passwordSignals(value: string) {
  return [
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
}

const APP_RETURN_TARGETS: Record<string, string> = {
  food: `${FOOD}/account`,
  pay: PAY,
  ecosystem: PORTAL,
  shopping: SHOPPING,
  grocery: process.env.NEXT_PUBLIC_GROCERY_BASE_URL ?? "http://localhost:3006",
  business: BUSINESS,
  operations: process.env.NEXT_PUBLIC_OPERATIONS_BASE_URL ?? "http://localhost:3002",
  go: process.env.NEXT_PUBLIC_LOGISTICS_BASE_URL ?? "http://localhost:3008",
  pharmacy: process.env.NEXT_PUBLIC_PHARMACY_BASE_URL ?? "http://localhost:3011",
  drive: process.env.NEXT_PUBLIC_DRIVE_BASE_URL ?? "http://localhost:3009",
  sport: process.env.NEXT_PUBLIC_SPORT_BASE_URL ?? "http://localhost:3012",
};

function signInReturnUrl() {
  const current = new URL(window.location.href);
  const from = (current.searchParams.get("from") ?? "").trim().toLowerCase();
  const explicit = current.searchParams.get("returnTo");
  const returnTo = explicit || APP_RETURN_TARGETS[from] || current.toString();

  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  if (from) params.set("from", from);

  return `/bazid/sign-in?${params.toString()}`;
}

export default function AccountPrivacyClient() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const load = useCallback(async () => {
    setError("");
    try {
      const [{ user }, { sessions }, privacy] = await Promise.all([
        jsonFetch<{ user: User }>("/api/native-bazid/me"),
        jsonFetch<{ sessions: Session[] }>("/api/native-bazid/sessions"),
        jsonFetch<{ requests: PrivacyRequest[] }>("/api/native-bazid/privacy"),
      ]);
      setUser(user);
      setSessions(sessions);
      setRequests(privacy.requests);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your BazID account");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const primaryEmail = useMemo(() => user?.emails?.find((entry) => entry.isPrimary) ?? user?.emails?.[0], [user]);
  const primaryPhone = useMemo(() => user?.phones?.find((entry) => entry.isPrimary) ?? user?.phones?.[0], [user]);

  const verifiedEmailCount = useMemo(() => user?.emails?.filter((entry) => Boolean(entry.verifiedAt)).length ?? 0, [user]);
  const verifiedPhoneCount = useMemo(() => user?.phones?.filter((entry) => Boolean(entry.verifiedAt)).length ?? 0, [user]);
  const otherSessions = useMemo(() => sessions.filter((session) => !session.current), [sessions]);
  const openPrivacyRequests = useMemo(() => requests.filter((request) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(request.status)).length, [requests]);

  const securityState = useMemo(() => {
    const checks = [
      verifiedEmailCount > 0,
      verifiedPhoneCount > 0,
      otherSessions.length <= 2,
    ];
    const complete = checks.filter(Boolean).length;
    return complete === 3 ? { label: "Strong", tone: "good" } : complete === 2 ? { label: "Good", tone: "ok" } : { label: "Needs attention", tone: "warn" };
  }, [verifiedEmailCount, verifiedPhoneCount, otherSessions.length]);

  const passwordChecks = useMemo(() => passwordSignals(newPassword), [newPassword]);
  const passwordReady = passwordChecks.every(Boolean) && newPassword === confirmPassword;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    setBusy("profile"); setError(""); setNotice("");
    try {
      const body = await jsonFetch<{ user: User }>("/api/native-bazid/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? "").trim(),
          locale: String(form.get("locale") ?? "en-NG"),
        }),
      });
      setUser(body.user);
      setNotice("Profile updated across Bazaara.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update profile");
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordReady) {
      setError("Use a stronger password and make sure both password fields match.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("password"); setError(""); setNotice("");
    try {
      await jsonFetch<{ ok: true }>("/api/native-bazid/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword,
        }),
      });
      formElement.reset();
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed. Every other BazID session was signed out.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change password");
    } finally {
      setBusy("");
    }
  }

  async function revoke(sessionId: string) {
    setBusy(sessionId); setError(""); setNotice("");
    try {
      await jsonFetch(`/api/native-bazid/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
      setNotice("Session signed out.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke session");
    } finally {
      setBusy("");
    }
  }

  async function revokeOthers() {
    if (!otherSessions.length) return;
    if (!window.confirm(`Sign out ${otherSessions.length} other BazID session${otherSessions.length === 1 ? "" : "s"}?`)) return;
    setBusy("revoke-all"); setError(""); setNotice("");
    try {
      for (const session of otherSessions) {
        await jsonFetch(`/api/native-bazid/sessions/${encodeURIComponent(session.id)}`, { method: "DELETE" });
      }
      setNotice("All other devices were signed out.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out every session");
    } finally {
      setBusy("");
    }
  }

  async function requestPrivacy(type: "EXPORT" | "DELETE") {
    const message = type === "DELETE"
      ? "Request deletion of your Bazaara account data? This starts a formal privacy request and is not immediate."
      : "Request a portable copy of your Bazaara account data?";
    if (!window.confirm(message)) return;
    setBusy(type); setError(""); setNotice("");
    try {
      await jsonFetch("/api/native-bazid/privacy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      setNotice(type === "DELETE" ? "Account-data deletion request received." : "Data-export request received.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create privacy request");
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    setBusy("logout");
    const next = signInReturnUrl();
    try {
      await fetch("/api/native-bazid/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = next;
    }
  }

  function goTo(section: string) {
    setActiveSection(section);
    document.getElementById(`bazid-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return <div className="bazid-account-shell"><div className="bazid-account-loading"><div className="bazid-account-spinner" />Loading your secure BazID…</div></div>;
  }

  if (!user) {
    return <div className="bazid-account-shell"><div className="bazid-account-loading"><h1>Sign in required</h1><p>{error || "Sign in to manage your account and privacy."}</p><Link className="bazid-account-primary" href={typeof window === "undefined" ? "/bazid/sign-in" : signInReturnUrl()}>Sign in to BazID</Link></div></div>;
  }

  return <div className="bazid-account-shell">
    <header className="bazid-account-nav">
      <div className="bazid-account-brand-stack">
        <a href={PORTAL} className="bazid-account-brand">BAZAARA <span>BAZID</span></a>
        <small>GLOBAL IDENTITY</small>
      </div>
      <div className="bazid-account-nav-links">
        <a href={PAY}>Pay</a>
        <a href={FOOD}>Food</a>
        <button onClick={() => void logout()} disabled={busy === "logout"}>{busy === "logout" ? "Signing out…" : "Sign out"}</button>
      </div>
    </header>

    <div className="bazid-account-page bazid-account-page-v9">
      <section className="bazid-account-hero bazid-account-hero-v9" id="bazid-overview">
        <div className="bazid-account-hero-main">
          <div className="bazid-avatar" aria-hidden="true">{initials(user.displayName, primaryEmail?.email)}</div>
          <div>
            <span>IDENTITY · SECURITY · PRIVACY</span>
            <h1>Your BazID, under your control.</h1>
            <p>One global identity across Bazaara. Manage profile details, sessions, credentials and privacy requests from a single secure control centre.</p>
            <div className="bazid-hero-meta">
              <b>{user.displayName || "Bazaara member"}</b>
              <small>{primaryEmail?.email ?? "No primary email"}</small>
            </div>
          </div>
        </div>

        <div className="bazid-account-trust bazid-account-trust-v9">
          <div><small>Verification</small><strong>{user.verificationLevel}</strong></div>
          <div><small>Security posture</small><strong className={`tone-${securityState.tone}`}>{securityState.label}</strong></div>
          <div><small>Active sessions</small><strong>{sessions.length}</strong></div>
          <div><small>Privacy requests</small><strong>{openPrivacyRequests}</strong></div>
        </div>
      </section>

      <nav className="bazid-account-section-nav" aria-label="Account sections">
        {([
          ["overview", "Overview"],
          ["identity", "Identity"],
          ["security", "Security"],
          ["sessions", "Devices"],
          ["privacy", "Privacy"],
        ] as const).map(([id, label]) => <button key={id} className={activeSection === id ? "active" : ""} onClick={() => goTo(id)}>{label}</button>)}
      </nav>

      {error ? <div className="bazid-account-error" role="alert">{error}</div> : null}
      {notice ? <div className="bazid-account-notice" role="status">{notice}</div> : null}

      <section className="bazid-account-overview-grid">
        <article className="bazid-account-stat-card">
          <span>EMAIL</span>
          <strong>{verifiedEmailCount ? "Verified" : "Action needed"}</strong>
          <small>{primaryEmail?.email ?? "No email attached"}</small>
        </article>
        <article className="bazid-account-stat-card">
          <span>PHONE</span>
          <strong>{verifiedPhoneCount ? "Verified" : "Not verified"}</strong>
          <small>{primaryPhone?.e164 ?? "No phone attached yet"}</small>
        </article>
        <article className="bazid-account-stat-card">
          <span>DEVICES</span>
          <strong>{otherSessions.length ? `${otherSessions.length} other` : "Only this device"}</strong>
          <small>{sessions.find((session) => session.current) ? "Current session protected" : "Session status unavailable"}</small>
        </article>
        <article className="bazid-account-stat-card">
          <span>PRIVACY</span>
          <strong>{openPrivacyRequests ? `${openPrivacyRequests} open` : "No open requests"}</strong>
          <small>Your export and deletion requests appear below.</small>
        </article>
      </section>

      <div className="bazid-account-grid bazid-account-grid-v9">
        <section className="bazid-account-card bazid-account-card-wide" id="bazid-identity">
          <div className="bazid-card-head">
            <span>IDENTITY</span>
            <h2>Account profile</h2>
            <p>This is the profile shared across the Bazaara ecosystem.</p>
          </div>

          <form className="bazid-account-form bazid-account-form-v9" onSubmit={saveProfile}>
            <label>Display name<input name="displayName" defaultValue={user.displayName ?? ""} maxLength={100} /></label>
            <label>Preferred locale
              <select name="locale" defaultValue={user.locale}>
                <option value="en-NG">English (Nigeria)</option>
                <option value="pcm-NG">Nigerian Pidgin</option>
                <option value="ha-NG">Hausa</option>
                <option value="yo-NG">Yoruba</option>
                <option value="ig-NG">Igbo</option>
                <option value="ef-NG">Efik / Ibibio</option>
              </select>
            </label>
            <div className="bazid-form-span-2">
              <button type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile across Bazaara"}</button>
            </div>
          </form>

          <div className="bazid-identity-list">
            <h3>Verified contact identities</h3>
            {user.emails.map((entry) => <div key={entry.email} className="bazid-identity-row">
              <div><b>{entry.email}</b><small>Email {entry.isPrimary ? "· primary" : ""}</small></div>
              <span className={entry.verifiedAt ? "verified" : "unverified"}>{entry.verifiedAt ? "Verified" : "Unverified"}</span>
            </div>)}
            {(user.phones ?? []).map((entry) => <div key={entry.e164} className="bazid-identity-row">
              <div><b>{entry.e164}</b><small>Phone {entry.isPrimary ? "· primary" : ""}</small></div>
              <span className={entry.verifiedAt ? "verified" : "unverified"}>{entry.verifiedAt ? "Verified" : "Unverified"}</span>
            </div>)}
            {!user.phones?.length ? <div className="bazid-identity-row"><div><b>No verified phone yet</b><small>A verified phone strengthens recovery and account security.</small></div><span className="unverified">Not set</span></div> : null}
          </div>
        </section>

        <section className="bazid-account-card" id="bazid-security">
          <div className="bazid-card-head">
            <span>SECURITY</span>
            <h2>Password & recovery</h2>
            <p>Changing your password signs out every other BazID session.</p>
          </div>

          <form className="bazid-account-form" onSubmit={changePassword}>
            <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
            <label>New password
              <input name="newPassword" type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label>Confirm new password
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>

            <div className="bazid-password-checks">
              {[
                ["12+ characters", passwordChecks[0]],
                ["Upper + lowercase", passwordChecks[1]],
                ["Number", passwordChecks[2]],
                ["Symbol", passwordChecks[3]],
                ["Passwords match", Boolean(confirmPassword) && newPassword === confirmPassword],
              ].map(([label, ok]) => <span key={String(label)} className={ok ? "ok" : ""}>{ok ? "✓" : "○"} {label}</span>)}
            </div>

            <button type="submit" disabled={busy === "password" || !passwordReady}>{busy === "password" ? "Updating…" : "Update password securely"}</button>
          </form>
        </section>

        <section className="bazid-account-card bazid-account-card-wide bazid-sessions-card-v9" id="bazid-sessions">
          <div className="bazid-card-head bazid-card-head-actions">
            <div>
              <span>DEVICES & SESSIONS</span>
              <h2>Where you're signed in</h2>
              <p>Review recent device activity and sign out sessions you no longer recognise.</p>
            </div>
            <button className="bazid-outline-button" onClick={() => void revokeOthers()} disabled={busy === "revoke-all" || !otherSessions.length}>
              {busy === "revoke-all" ? "Signing out…" : "Sign out other devices"}
            </button>
          </div>

          <div className="bazid-session-list bazid-session-list-v9">
            {sessions.map((session) => <article key={session.id}>
              <div className="bazid-session-icon" aria-hidden="true">{/Mobile|Android|iPhone|iPad/i.test(session.userAgent ?? "") ? "▯" : "▭"}</div>
              <div className="bazid-session-copy">
                <b>{browserLabel(session)} {session.current ? <em>THIS DEVICE</em> : null}</b>
                <small>{session.ipAddress ?? "Local/private network"} · last active {relativeTime(session.lastSeenAt)}</small>
                <small>Session expires {new Date(session.expiresAt).toLocaleDateString()}</small>
              </div>
              {session.current
                ? <span className="bazid-session-current">Active now</span>
                : <button onClick={() => void revoke(session.id)} disabled={busy === session.id}>{busy === session.id ? "Signing out…" : "Sign out"}</button>}
            </article>)}
          </div>
        </section>

        <section className="bazid-account-card bazid-account-card-wide" id="bazid-privacy">
          <div className="bazid-card-head">
            <span>PRIVACY CENTRE</span>
            <h2>Your data, your choices</h2>
            <p>Request a portable copy of your Bazaara data or start a formal account-data deletion request.</p>
          </div>

          <div className="bazid-privacy-v9">
            <article>
              <div><b>Download your data</b><p>Request a portable archive of account data associated with this BazID.</p></div>
              <button onClick={() => void requestPrivacy("EXPORT")} disabled={busy === "EXPORT"}>{busy === "EXPORT" ? "Requesting…" : "Request export"}</button>
            </article>
            <article className="danger">
              <div><b>Delete account data</b><p>Starts a formal privacy deletion request. It is reviewed and is not an instant hard delete.</p></div>
              <button onClick={() => void requestPrivacy("DELETE")} disabled={busy === "DELETE"}>{busy === "DELETE" ? "Requesting…" : "Request deletion"}</button>
            </article>
          </div>

          <div className="bazid-request-history">
            <div className="bazid-request-history-head"><h3>Privacy request history</h3><span>{requests.length}</span></div>
            {requests.length
              ? requests.slice(0, 8).map((request) => <div className="bazid-request-row" key={request.id}>
                  <div><b>{request.type === "EXPORT" ? "Data export" : "Account deletion"}</b><small>Requested {new Date(request.createdAt).toLocaleDateString()}</small></div>
                  <span>{request.status}</span>
                  <small>Due {new Date(request.dueAt).toLocaleDateString()}</small>
                </div>)
              : <p className="bazid-account-muted">No privacy requests yet.</p>}
          </div>
        </section>


      </div>
    </div>
  </div>;
}
