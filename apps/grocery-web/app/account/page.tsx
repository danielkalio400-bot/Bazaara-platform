"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";

import {
  buildBazIdSignInUrl
} from "@bazaara/bazid-client";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

type JsonRecord = Record<string, unknown>;

type AccountUser = {
  id: string;
  displayName: string | null;
  email: string | null;
};

type AccountState =
  | "loading"
  | "authenticated"
  | "signed-out"
  | "error";

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function textValue(
  value: unknown
) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  )
    ? value.trim()
    : null;
}

function parseAccountUser(
  payload: unknown
): AccountUser | null {
  if (!isRecord(payload)) {
    return null;
  }

  const rawUser =
    isRecord(payload.user)
      ? payload.user
      : isRecord(payload.data) &&
        isRecord(payload.data.user)
        ? payload.data.user
        : null;

  if (!rawUser) {
    return null;
  }

  const id =
    textValue(rawUser.id);

  if (!id) {
    return null;
  }

  return {
    id,
    displayName:
      textValue(rawUser.displayName) ??
      textValue(rawUser.name) ??
      textValue(rawUser.fullName),
    email:
      textValue(rawUser.email) ??
      textValue(rawUser.primaryEmail) ??
      textValue(rawUser.emailAddress)
  };
}

function RowIcon({
  children
}: {
  children: ReactNode;
}) {
  return (
    <span
      className="bazaara-account-row-icon"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6V21H10v-.1A1.8 1.8 0 0 0 8.9 19a1.8 1.8 0 0 0-2 .4l-.1.1L4 16.7l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.5H3v-4h.1A1.8 1.8 0 0 0 4.7 8.4a1.8 1.8 0 0 0-.4-2l-.1-.1L7 3.5l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10.2 2H14v.1A1.8 1.8 0 0 0 15.1 4a1.8 1.8 0 0 0 2-.4l.1-.1L20 6.3l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 9.5h.1v4H21A1.8 1.8 0 0 0 19.4 15Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.6 2.6 0 1 1 4.4 1.9c-.9.7-1.6 1.2-1.6 2.6" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3Z" />
      <path d="m9.5 12 1.6 1.6 3.5-3.7" />
    </svg>
  );
}

function AccountRow({
  href,
  icon,
  title,
  description,
  external = false
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  external?: boolean;
}) {
  const content = (
    <>
      <RowIcon>
        {icon}
      </RowIcon>

      <span
        className="bazaara-account-row-copy"
      >
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </span>

      <span
        className="bazaara-account-chevron"
        aria-hidden="true"
      >
        ›
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className="bazaara-account-row"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="bazaara-account-row"
    >
      {content}
    </Link>
  );
}

export default function AccountPage() {
  const [
    state,
    setState
  ] =
    useState<AccountState>(
      "loading"
    );

  const [
    user,
    setUser
  ] =
    useState<AccountUser | null>(
      null
    );

  const [
    signInUrl,
    setSignInUrl
  ] =
    useState(
      buildBazIdSignInUrl({
        bazIdBaseUrl: BAZID,
        returnTo: "/account"
      })
    );

  const [
    signingOut,
    setSigningOut
  ] =
    useState(false);

  const loadAccount =
    useCallback(
      async () => {
        setState("loading");

        try {
          const response =
            await fetch(
              `${API}/v1/bazid/me`,
              {
                method: "GET",
                credentials: "include",
                cache: "no-store"
              }
            );

          if (
            response.status === 401
          ) {
            setUser(null);
            setState("signed-out");
            return;
          }

          if (!response.ok) {
            throw new Error(
              `BazID returned ${response.status}`
            );
          }

          const payload =
            await response.json() as unknown;

          const accountUser =
            parseAccountUser(payload);

          if (!accountUser) {
            throw new Error(
              "BazID account payload was incomplete"
            );
          }

          setUser(accountUser);
          setState("authenticated");
        }
        catch {
          setState("error");
        }
      },
      []
    );

  useEffect(
    () => {
      setSignInUrl(
        buildBazIdSignInUrl({
          bazIdBaseUrl: BAZID,
          returnTo:
            window.location.href
        })
      );

      void loadAccount();
    },
    [loadAccount]
  );

  const initials =
    useMemo(
      () => {
        const source =
          user?.displayName ??
          user?.email ??
          "B";

        const letters =
          source
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
              (part) =>
                part.charAt(0)
            )
            .join("")
            .toUpperCase();

        return letters || "B";
      },
      [user]
    );

  async function signOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      const response =
        await fetch(
          `${API}/v1/bazid/logout`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({})
          }
        );

      if (
        !response.ok &&
        response.status !== 401
      ) {
        throw new Error(
          `BazID logout returned ${response.status}`
        );
      }

      window.location.href = "/";
    }
    catch {
      setSigningOut(false);
    }
  }

  return (
    <main
      className="bazaara-account-page"
    >
      <div
        className="bazaara-account-wrap"
      >
        <p
          className="bazaara-account-kicker"
        >
          GROCERY
        </p>

        <h1
          className="bazaara-account-title"
        >
          Account
        </h1>

        <p
          className="bazaara-account-subtitle"
        >
          Your identity, delivery details, preferences and support controls in one place.
        </p>

        {
          state === "loading"
            ? (
              <section
                className="bazaara-account-state-card bazaara-account-status"
                aria-live="polite"
              >
                <strong>
                  Checking your BazID…
                </strong>

                <span>
                  Confirming the signed-in account.
                </span>
              </section>
            )
            : null
        }

        {
          state === "error"
            ? (
              <section
                className="bazaara-account-state-card bazaara-account-status"
                role="alert"
              >
                <strong>
                  Account status unavailable
                </strong>

                <span>
                  The BazID service could not be reached. This is not treated as a sign-out.
                </span>

                <button
                  type="button"
                  onClick={
                    () =>
                      void loadAccount()
                  }
                >
                  Retry
                </button>
              </section>
            )
            : null
        }

        {
          state === "signed-out"
            ? (
              <section
                className="bazaara-account-state-card bazaara-account-signed-out"
              >
                <strong>
                  Sign in with BazID
                </strong>

                <span>
                  Sign in to access account details, orders and cross-device Grocery activity.
                </span>

                <a
                  href={signInUrl}
                  className="bazaara-account-primary"
                >
                  Continue with BazID
                </a>
              </section>
            )
            : null
        }

        {
          state === "authenticated" &&
          user
            ? (
              <>
                <section
                  className="bazaara-account-profile-card"
                >
                  <div
                    className="bazaara-account-avatar"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>

                  <div
                    className="bazaara-account-profile-copy"
                  >
                    <strong>
                      {
                        user.displayName ??
                        "BAZAARA customer"
                      }
                    </strong>

                    {
                      user.email
                        ? (
                          <span>
                            {user.email}
                          </span>
                        )
                        : null
                    }

                    <small>
                      BazID connected
                    </small>
                  </div>

                  <span
                    className="bazaara-account-connected"
                  >
                    ● Connected
                  </span>
                </section>

                <section
                  className="bazaara-account-section"
                >
                  <div
                    className="bazaara-account-section-head"
                  >
                    <div>
                      <h2>
                        Account controls
                      </h2>

                      <p>
                        Grocery contact details, defaults and security.
                      </p>
                    </div>
                  </div>

                  <div
                    className="bazaara-account-list"
                  >
                    <AccountRow
                      href="/account/addresses"
                      icon={<PersonIcon />}
                      title="Address Book"
                      description="Saved Nigeria delivery addresses for faster checkout."
                    />

                    <AccountRow
                      href="/account/profile"
                      icon={<PersonIcon />}
                      title="Contact details"
                      description="Grocery contact email and phone details."
                    />

                    <AccountRow
                      href="/account/grocery"
                      icon={<SettingsIcon />}
                      title="Grocery preferences"
                      description="Freshness, substitutions, delivery defaults, recurring baskets and benefits."
                    />

                    <AccountRow
                      href="/account/settings"
                      icon={<SettingsIcon />}
                      title="Settings"
                      description="Accessibility, privacy and general app preferences."
                    />

                    <AccountRow
                      href="/?recent=1#catalogue"
                      icon={<ClockIcon />}
                      title="Recently viewed"
                      description="Return to products you recently explored."
                    />

                    <AccountRow
                      href="/support"
                      icon={<SupportIcon />}
                      title="Help & support"
                      description="Order, delivery, payment and return support."
                    />

                    <AccountRow
                      href="/account/notifications"
                      icon={<ClockIcon />}
                      title="Notifications"
                      description="Order, payment, refund and security updates."
                    />

                    <AccountRow
                      href={BAZID}
                      icon={<ShieldIcon />}
                      title="BazID security"
                      description="Open the identity service for sign-in and security controls."
                      external
                    />
                  </div>
                </section>

                <section
                  className="bazaara-account-signout-card"
                >
                  <div>
                    <strong>
                      Sign out
                    </strong>

                    <span>
                      Sign out of this BAZAARA session.
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={
                      () =>
                        void signOut()
                    }
                  >
                    {
                      signingOut
                        ? "Signing out…"
                        : "Sign out"
                    }
                  </button>
                </section>
              </>
            )
            : null
        }
      </div>
    </main>
  );
}
