"use client";

import Link from "next/link";
import {
  useEffect,
  useState
} from "react";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

const SETTINGS_KEY =
  "bazaara:shopping-settings:v2";

type LocalSettings = {
  reduceMotion: boolean;
  compactCards: boolean;
};

const defaultSettings: LocalSettings = {
  reduceMotion: false,
  compactCards: false
};

function readSettings(): LocalSettings {
  try {
    const raw =
      window.localStorage.getItem(
        SETTINGS_KEY
      );

    if (!raw) {
      return defaultSettings;
    }

    const parsed =
      JSON.parse(raw) as Partial<LocalSettings>;

    return {
      reduceMotion:
        parsed.reduceMotion === true,
      compactCards:
        parsed.compactCards === true
    };
  }
  catch {
    return defaultSettings;
  }
}

function persistSettings(
  next: LocalSettings
) {
  window.localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(next)
  );

  if (next.reduceMotion) {
    document.documentElement.setAttribute(
      "data-bazaara-reduce-motion",
      "true"
    );
  }
  else {
    document.documentElement.removeAttribute(
      "data-bazaara-reduce-motion"
    );
  }

  if (next.compactCards) {
    document.documentElement.setAttribute(
      "data-bazaara-compact-cards",
      "true"
    );
  }
  else {
    document.documentElement.removeAttribute(
      "data-bazaara-compact-cards"
    );
  }
}

export default function AccountSettingsPage() {
  const [
    settings,
    setSettings
  ] =
    useState<LocalSettings>(
      defaultSettings
    );

  const [
    status,
    setStatus
  ] =
    useState("");

  useEffect(
    () => {
      const next =
        readSettings();

      setSettings(next);
      persistSettings(next);
    },
    []
  );

  function updateSettings(
    next: LocalSettings
  ) {
    setSettings(next);
    persistSettings(next);
  }

  function announce(
    message: string
  ) {
    setStatus(message);

    window.setTimeout(
      () =>
        setStatus(""),
      2200
    );
  }

  function clearSearchHistory() {
    [
      "bazaara:search-history",
      "bazaara_search_history",
      "bazaara:shopping-search-history"
    ].forEach(
      (key) =>
        window.localStorage.removeItem(
          key
        )
    );

    announce(
      "Search history cleared on this device."
    );
  }

  function clearRecentlyViewed() {
    [
      "bazaara:recently-viewed",
      "bazaara_recently_viewed",
      "bazaara:shopping-recently-viewed"
    ].forEach(
      (key) =>
        window.localStorage.removeItem(
          key
        )
    );

    announce(
      "Recently viewed products cleared on this device."
    );
  }

  return (
    <main
      className="bazaara-settings-page"
    >
      <div
        className="bazaara-settings-wrap"
      >
        <div
          className="bazaara-settings-heading"
        >
          <Link
            href="/account"
            className="bazaara-settings-back"
            aria-label="Back to account"
          >
            ←
          </Link>

          <div>
            <p>
              ACCOUNT
            </p>

            <h1>
              Settings
            </h1>

            <span>
              Grocery preferences only. Sign out remains on the Account page.
            </span>
          </div>
        </div>

        <section
          className="bazaara-settings-panel"
        >
          <div
            className="bazaara-settings-panel-head"
          >
            <h2>
              Account
            </h2>

            <p>
              Manage contact details and BazID security without duplicating controls.
            </p>
          </div>

          <div
            className="bazaara-settings-list"
          >
            <Link
              href="/account/addresses"
              className="bazaara-settings-link-row"
            >
              <span>
                Address Book
              </span>

              <small>
                Saved Nigeria delivery addresses and default checkout address
              </small>

              <b aria-hidden="true">
                ›
              </b>
            </Link>

            <Link
              href="/account/profile"
              className="bazaara-settings-link-row"
            >
              <span>
                Contact details
              </span>

              <small>
                Grocery email and phone
              </small>

              <b aria-hidden="true">
                ›
              </b>
            </Link>

            <a
              href={BAZID}
              className="bazaara-settings-link-row"
            >
              <span>
                BazID security
              </span>

              <small>
                Identity, sign-in and security controls
              </small>

              <b aria-hidden="true">
                ›
              </b>
            </a>
          </div>
        </section>

        <section
          className="bazaara-settings-panel"
        >
          <div
            className="bazaara-settings-panel-head"
          >
            <h2>
              Grocery experience
            </h2>

            <p>
              Device-local accessibility and catalogue preferences.
            </p>
          </div>

          <div
            className="bazaara-settings-toggle-row"
          >
            <div>
              <strong>
                Reduce motion
              </strong>

              <span>
                Minimize non-essential transitions and animations.
              </span>
            </div>

            <button
              type="button"
              className={
                settings.reduceMotion
                  ? "bazaara-switch is-on"
                  : "bazaara-switch"
              }
              aria-pressed={
                settings.reduceMotion
              }
              onClick={
                () =>
                  updateSettings({
                    ...settings,
                    reduceMotion:
                      !settings.reduceMotion
                  })
              }
            >
              <span />
            </button>
          </div>

          <div
            className="bazaara-settings-toggle-row"
          >
            <div>
              <strong>
                Compact product cards
              </strong>

              <span>
                Fit more products on tablets and laptops.
              </span>
            </div>

            <button
              type="button"
              className={
                settings.compactCards
                  ? "bazaara-switch is-on"
                  : "bazaara-switch"
              }
              aria-pressed={
                settings.compactCards
              }
              onClick={
                () =>
                  updateSettings({
                    ...settings,
                    compactCards:
                      !settings.compactCards
                  })
              }
            >
              <span />
            </button>
          </div>
        </section>

        <section
          className="bazaara-settings-panel"
          id="privacy"
        >
          <div
            className="bazaara-settings-panel-head"
          >
            <h2>
              Privacy & history
            </h2>

            <p>
              Clear local Grocery activity without changing your BazID.
            </p>
          </div>

          <div
            className="bazaara-settings-list"
          >
            <button
              type="button"
              className="bazaara-settings-action-row"
              onClick={clearSearchHistory}
            >
              Clear search history
            </button>

            <button
              type="button"
              className="bazaara-settings-action-row"
              onClick={clearRecentlyViewed}
            >
              Clear recently viewed
            </button>
          </div>
        </section>

        <section
          className="bazaara-settings-panel"
          id="support"
        >
          <div
            className="bazaara-settings-panel-head"
          >
            <h2>
              Support
            </h2>

            <p>
              Grocery assistance and diagnostics.
            </p>
          </div>

          <div
            className="bazaara-settings-list"
          >
            <Link
              href="/bazai?ask=Help me with Grocery"
              className="bazaara-settings-link-row"
            >
              <span>
                Ask BazAI
              </span>

              <small>
                Product questions, comparisons and buying help
              </small>

              <b aria-hidden="true">
                ›
              </b>
            </Link>

            <Link
              href="/bazlens"
              className="bazaara-settings-link-row"
            >
              <span>
                Open BazLens
              </span>

              <small>
                Find products by photo or barcode
              </small>

              <b aria-hidden="true">
                ›
              </b>
            </Link>
          </div>
        </section>

        {
          status
            ? (
              <div
                className="bazaara-settings-toast"
                role="status"
              >
                {status}
              </div>
            )
            : null
        }
      </div>
    </main>
  );
}
