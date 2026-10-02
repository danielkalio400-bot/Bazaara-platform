"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, TextField } from "@bazaara/design-system";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const PORTAL =
  process.env.NEXT_PUBLIC_BAZAARA_BASE_URL ??
  "http://localhost:3005";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

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
  (process.env.NEXT_PUBLIC_BAZID_RETURN_ORIGINS ??
    "http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://localhost:3008,http://localhost:3009,http://localhost:3010,http://localhost:3011,http://localhost:3012,http://localhost:3013,http://localhost:3014,http://localhost:3015,http://localhost:3016,http://localhost:3017,http://localhost:3018,http://localhost:3019")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

for (const base of [PORTAL, BAZID, ...Object.values(APP_DESTINATIONS)]) {
  try {
    RETURN_ORIGINS.add(new URL(base).origin);
  } catch {
    // Invalid optional app base URLs are ignored.
  }
}

function getReturnDestination(): string {
  if (typeof window === "undefined") {
    return PORTAL;
  }

  const search = new URLSearchParams(
    window.location.search
  );

  const returnTo = search.get("returnTo");

  if (returnTo) {
    try {
      const destination = new URL(returnTo, BAZID);
      if (RETURN_ORIGINS.has(destination.origin)) {
        return destination.toString();
      }
    } catch {
      // Ignore invalid return URLs.
    }
  }

  const from = (search.get("from") ?? "").trim().toLowerCase();
  const appDestination = from ? APP_DESTINATIONS[from] : undefined;
  if (appDestination) {
    return appDestination;
  }

  return PORTAL;
}

export default function SignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const form = new FormData(
      event.currentTarget
    );

    try {
      const response = await fetch(
        "/api/native-bazid/login",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "content-type": "application/json"
          },

          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password")
          })
        }
      );

      const body = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.message ?? body?.error?.message ??
          `Sign in failed (${response.status})`
        );
      }

      window.location.href =
        getReturnDestination();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign in failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link
            href="/"
            className="brand"
          >
            BAZAARA
            <span className="brand-dot">
              .
            </span>
          </Link>

          <span className="muted">
            BazID
          </span>
        </div>
      </header>

      <main className="main">
        <section className="auth-wrap panel">
          <div className="eyebrow">
            BazID
          </div>

          <h1 style={{ fontSize: "2rem" }}>
            Sign in to Bazaara
          </h1>

          <p className="muted">
            One secure account for Shopping,
            payments, delivery and the Bazaara
            ecosystem.
          </p>

          <form
            className="form-stack"
            onSubmit={submit}
          >
            {error ? (
              <div
                className="form-error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <TextField
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
            />

            <TextField
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Signing in..."
                : "Sign in"}
            </Button>
          </form>

          <p
            className="muted"
            style={{ marginBottom: 0 }}
          >
            New to Bazaara?{" "}

            <Link
              href="/bazid/register"
              onClick={(event) => {
                const params = new URLSearchParams(window.location.search);
                const returnTo = params.get("returnTo");
                const from = params.get("from");
                if (!returnTo && !from) return;
                event.preventDefault();
                const next = new URLSearchParams();
                if (returnTo) next.set("returnTo", returnTo);
                if (from) next.set("from", from);
                window.location.href = `/bazid/register?${next.toString()}`;
              }}
              style={{
                color: "var(--bz-indigo)",
                fontWeight: 750
              }}
            >
              Create a BazID
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}