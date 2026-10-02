"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  buildBazIdSignInUrl
} from "@bazaara/bazid-client";

import styles from "./shopping-header.module.css";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

type BazIdUser = {
  id: string;
  displayName: string | null;
};

function ProfileIcon() {
  return (
    <svg
      className={styles.headerSvg}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20c.5-4 3-6 7-6s6.5 2 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AccountActions() {
  const [
    user,
    setUser
  ] =
    useState<
      BazIdUser |
      null |
      undefined
    >(
      undefined
    );

  const [
    menuOpen,
    setMenuOpen
  ] =
    useState(false);

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    signInUrl,
    setSignInUrl
  ] =
    useState(
      buildBazIdSignInUrl({
        bazIdBaseUrl: BAZID
      })
    );

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(
    () => {
      let cancelled = false;

      setSignInUrl(
        buildBazIdSignInUrl({
          bazIdBaseUrl: BAZID,
          returnTo:
            window.location.href
        })
      );

      async function loadAccount() {
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

          if (cancelled) {
            return;
          }

          if (
            response.status === 401
          ) {
            setUser(null);
            return;
          }

          if (!response.ok) {
            throw new Error(
              `BazID returned ${response.status}`
            );
          }

          const body =
            await response.json() as {
              user:
                BazIdUser;
            };

          setUser(body.user);
        }
        catch {
          if (!cancelled) {
            setUser(null);
          }
        }
      }

      void loadAccount();

      return () => {
        cancelled = true;
      };
    },
    []
  );

  useEffect(
    () => {
      function handlePointerDown(
        event:
          MouseEvent
      ) {
        if (
          !rootRef.current
        ) {
          return;
        }

        if (
          !rootRef.current.contains(
            event.target as Node
          )
        ) {
          setMenuOpen(false);
        }
      }

      function handleEscape(
        event:
          KeyboardEvent
      ) {
        if (
          event.key === "Escape"
        ) {
          setMenuOpen(false);
        }
      }

      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      document.addEventListener(
        "keydown",
        handleEscape
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handlePointerDown
        );

        document.removeEventListener(
          "keydown",
          handleEscape
        );
      };
    },
    []
  );

  async function signOut() {
    if (busy) {
      return;
    }

    setBusy(true);

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

      setUser(null);
      setMenuOpen(false);
      window.location.href = "/";
    }
    catch {
      setBusy(false);
    }
  }

  if (
    user === undefined
  ) {
    return (
      <span
        className={`${styles.profileTrigger} ${styles.profileLoading}`}
        aria-label="Checking BazID account"
      >
        <ProfileIcon />
      </span>
    );
  }

  if (
    user === null
  ) {
    return (
      <a
        className={styles.profileTrigger}
        href={signInUrl}
        aria-label="Sign in to BazID"
        title="Sign in"
      >
        <ProfileIcon />
      </a>
    );
  }

  return (
    <div
      className={styles.profileRoot}
      ref={rootRef}
    >
      <button
        type="button"
        className={
          menuOpen
            ? `${styles.profileTrigger} ${styles.profileTriggerOpen}`
            : styles.profileTrigger
        }
        onClick={
          () =>
            setMenuOpen(
              (current) =>
                !current
            )
        }
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={
          user.displayName ??
          "Profile"
        }
      >
        <ProfileIcon />

        <span
          className={styles.profileOnline}
          aria-hidden="true"
        />
      </button>

      {
        menuOpen
          ? (
            <div
              className={styles.profileMenu}
              role="menu"
            >
              <div
                className={styles.profileMenuHead}
              >
                <span
                  className={styles.profileAvatar}
                >
                  <ProfileIcon />
                </span>

                <div
                  className={styles.profileIdentity}
                >
                  <strong>
                    {
                      user.displayName ??
                      "BAZAARA account"
                    }
                  </strong>

                  <small>
                    BazID connected
                  </small>
                </div>
              </div>

              <div
                className={styles.profileMenuDivider}
              />

              <a
                href="/account"
                role="menuitem"
                className={styles.profileMenuItem}
                onClick={
                  () =>
                    setMenuOpen(false)
                }
              >
                <span aria-hidden="true">
                  ◯
                </span>

                Account
              </a>

              <a
                href="/account/settings"
                role="menuitem"
                className={styles.profileMenuItem}
                onClick={
                  () =>
                    setMenuOpen(false)
                }
              >
                <span aria-hidden="true">
                  ⚙
                </span>

                Settings
              </a>

              <div
                className={styles.profileMenuDivider}
              />

              <button
                type="button"
                role="menuitem"
                className={`${styles.profileMenuItem} ${styles.profileSignout}`}
                disabled={busy}
                onClick={
                  () =>
                    void signOut()
                }
              >
                <span aria-hidden="true">
                  ↪
                </span>

                {
                  busy
                    ? "Signing out…"
                    : "Sign out"
                }
              </button>
            </div>
          )
          : null
      }
    </div>
  );
}
