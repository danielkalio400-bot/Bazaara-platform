"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState
} from "react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const PROFILE_KEY =
  "bazaara:shopping-contact:v1";

type JsonRecord =
  Record<string, unknown>;

type ShoppingProfile = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  district: string;
  street: string;
  building: string;
  landmark: string;
  deliveryInstructions: string;
};

const emptyProfile: ShoppingProfile = {
  fullName: "",
  email: "",
  phone: "",
  country: "NG",
  region: "",
  city: "",
  district: "",
  street: "",
  building: "",
  landmark: "",
  deliveryInstructions: ""
};

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function stringValue(
  value: unknown
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}

function readSavedProfile() {
  try {
    const raw =
      window.localStorage.getItem(
        PROFILE_KEY
      );

    if (!raw) {
      return emptyProfile;
    }

    const parsed =
      JSON.parse(raw) as Partial<ShoppingProfile>;

    return {
      ...emptyProfile,
      ...parsed
    };
  }
  catch {
    return emptyProfile;
  }
}

export default function AccountProfilePage() {
  const [
    profile,
    setProfile
  ] =
    useState<ShoppingProfile>(
      emptyProfile
    );

  const [
    status,
    setStatus
  ] =
    useState("");

  useEffect(
    () => {
      const saved =
        readSavedProfile();

      setProfile(saved);

      void (
        async () => {
          try {
            const response =
              await fetch(
                `${API}/v1/bazid/me`,
                {
                  credentials: "include",
                  cache: "no-store"
                }
              );

            if (!response.ok) {
              return;
            }

            const body =
              await response.json() as unknown;

            if (!isRecord(body)) {
              return;
            }

            const user =
              isRecord(body.user)
                ? body.user
                : isRecord(body.data) &&
                  isRecord(body.data.user)
                  ? body.data.user
                  : null;

            if (!user) {
              return;
            }

            setProfile(
              (current) => ({
                ...current,
                fullName:
                  current.fullName ||
                  stringValue(
                    user.displayName ??
                    user.name ??
                    user.fullName
                  ),
                email:
                  current.email ||
                  stringValue(
                    user.email ??
                    user.primaryEmail ??
                    user.emailAddress
                  )
              })
            );
          }
          catch {
          }
        }
      )();
    },
    []
  );

  function update(
    key: keyof ShoppingProfile,
    value: string
  ) {
    setProfile(
      (current) => ({
        ...current,
        [key]:
          value
      })
    );
  }

  function save(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(profile)
    );

    setStatus(
      "Saved. These details will prefill checkout on this device."
    );

    window.setTimeout(
      () =>
        setStatus(""),
      2600
    );
  }

  return (
    <main
      className="bazaara-profile-page"
    >
      <div
        className="bazaara-profile-wrap"
      >
        <div
          className="bazaara-profile-heading"
        >
          <Link
            href="/account"
            className="bazaara-profile-back"
            aria-label="Back to account"
          >
            ←
          </Link>

          <div>
            <p>
              ACCOUNT
            </p>

            <h1>
              Personal & delivery details
            </h1>

            <span>
              Keep one default contact and delivery profile for faster checkout.
            </span>
          </div>
        </div>

        <form
          className="bazaara-profile-form"
          onSubmit={save}
        >
          <section
            className="bazaara-profile-panel"
          >
            <div
              className="bazaara-profile-panel-head"
            >
              <h2>
                Contact details
              </h2>

              <p>
                These are Grocery contact details. BazID remains the identity and sign-in authority.
              </p>
            </div>

            <div
              className="bazaara-profile-grid"
            >
              <label>
                <span>
                  Full name
                </span>

                <input
                  value={profile.fullName}
                  onChange={
                    (event) =>
                      update(
                        "fullName",
                        event.target.value
                      )
                  }
                  autoComplete="name"
                  placeholder="Full name"
                />
              </label>

              <label>
                <span>
                  Contact email
                </span>

                <input
                  type="email"
                  value={profile.email}
                  onChange={
                    (event) =>
                      update(
                        "email",
                        event.target.value
                      )
                  }
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label>
                <span>
                  Phone number
                </span>

                <input
                  value={profile.phone}
                  onChange={
                    (event) =>
                      update(
                        "phone",
                        event.target.value
                      )
                  }
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+234..."
                />
              </label>
            </div>
          </section>

          <section
            className="bazaara-profile-panel"
          >
            <div
              className="bazaara-profile-panel-head"
            >
              <h2>
                Default delivery address
              </h2>

              <p>
                Checkout will use this address automatically until you edit it.
              </p>
            </div>

            <div
              className="bazaara-profile-grid"
            >
              <label>
                <span>
                  Country
                </span>

                <input
                  value={profile.country}
                  maxLength={2}
                  onChange={
                    (event) =>
                      update(
                        "country",
                        event.target.value.toUpperCase()
                      )
                  }
                />
              </label>

              <label>
                <span>
                  State / region
                </span>

                <input
                  value={profile.region}
                  onChange={
                    (event) =>
                      update(
                        "region",
                        event.target.value
                      )
                  }
                />
              </label>

              <label>
                <span>
                  City
                </span>

                <input
                  value={profile.city}
                  onChange={
                    (event) =>
                      update(
                        "city",
                        event.target.value
                      )
                  }
                />
              </label>

              <label>
                <span>
                  District / area
                </span>

                <input
                  value={profile.district}
                  onChange={
                    (event) =>
                      update(
                        "district",
                        event.target.value
                      )
                  }
                />
              </label>

              <label
                className="bazaara-profile-wide"
              >
                <span>
                  Street
                </span>

                <input
                  value={profile.street}
                  onChange={
                    (event) =>
                      update(
                        "street",
                        event.target.value
                      )
                  }
                  autoComplete="street-address"
                />
              </label>

              <label>
                <span>
                  Building / unit
                </span>

                <input
                  value={profile.building}
                  onChange={
                    (event) =>
                      update(
                        "building",
                        event.target.value
                      )
                  }
                />
              </label>

              <label>
                <span>
                  Landmark
                </span>

                <input
                  value={profile.landmark}
                  onChange={
                    (event) =>
                      update(
                        "landmark",
                        event.target.value
                      )
                  }
                />
              </label>

              <label
                className="bazaara-profile-wide"
              >
                <span>
                  Delivery instructions
                </span>

                <textarea
                  value={
                    profile.deliveryInstructions
                  }
                  onChange={
                    (event) =>
                      update(
                        "deliveryInstructions",
                        event.target.value
                      )
                  }
                  rows={4}
                  maxLength={400}
                />
              </label>
            </div>
          </section>

          <div
            className="bazaara-profile-actions"
          >
            <button
              type="submit"
            >
              Save details
            </button>

            <Link
              href="/checkout"
            >
              Go to checkout
            </Link>
          </div>

          {
            status
              ? (
                <p
                  className="bazaara-profile-status"
                  role="status"
                >
                  {status}
                </p>
              )
              : null
          }
        </form>
      </div>
    </main>
  );
}
