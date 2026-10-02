"use client";

import { FormEvent, useState } from "react";
import { businessRequest } from "../lib/business";

export default function BusinessOnboarding() {
  const [form, setForm] = useState({
    displayName: "",
    legalName: "",
    legalType: "INDIVIDUAL",
    contactEmail: "",
    contactPhone: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result = await businessRequest<{ nextPath: string }>(
        "/v1/business/advanced/organizations",
        "POST",
        {
          ...form,
          country: "NG",
        },
      );
      window.location.assign(result.nextPath);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create business",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="business-control-shell">
      <main className="business-control-main business-onboarding-main">
        <a className="business-wordmark business-onboarding-logo" href="/">
          BAZAARA<span>BUSINESS</span>
        </a>

        <section className="business-page-heading">
          <span className="business-kicker">CREATE BUSINESS</span>
          <h1>One organization. Add only the services you operate.</h1>
          <p>
            BazID identifies the owner. This step creates the vendor
            organization; Shopping, Food, Grocery or Pharmacy are added
            afterwards.
          </p>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}

        <div className="business-onboarding-grid">
          <form className="business-panel business-form" onSubmit={submit}>
            <label>
              Brand / display name
              <input
                required
                value={form.displayName}
                onChange={(event) =>
                  setForm({ ...form, displayName: event.target.value })
                }
                placeholder="Jollof House"
              />
            </label>

            <label>
              Legal business name
              <input
                required
                value={form.legalName}
                onChange={(event) =>
                  setForm({ ...form, legalName: event.target.value })
                }
                placeholder="Jollof House Restaurants Ltd"
              />
            </label>

            <label>
              Legal type
              <select
                value={form.legalType}
                onChange={(event) =>
                  setForm({ ...form, legalType: event.target.value })
                }
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="SOLE_TRADER">Sole trader</option>
                <option value="BUSINESS_NAME">Registered business name</option>
                <option value="COMPANY">Company</option>
              </select>
            </label>

            <label>
              Business email
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm({ ...form, contactEmail: event.target.value })
                }
              />
            </label>

            <label>
              Business phone
              <input
                required
                value={form.contactPhone}
                onChange={(event) =>
                  setForm({ ...form, contactPhone: event.target.value })
                }
              />
            </label>

            <div className="business-registration-warning wide">
              Registration creates a vendor workspace, not automatic public
              approval. Each business type has its own activation requirements.
            </div>

            <button className="business-primary-button" disabled={busy}>
              {busy ? "Creating…" : "Create business"}
            </button>
          </form>

          <aside className="business-panel business-onboarding-aside">
            <span className="business-kicker">WHAT HAPPENS NEXT</span>
            <h2>Build the right workspace.</h2>
            <div>
              <b>1</b>
              <span>Create the organization and permanent Business ID.</span>
            </div>
            <div>
              <b>2</b>
              <span>Choose Shopping, Food, Grocery or Pharmacy.</span>
            </div>
            <div>
              <b>3</b>
              <span>Complete the requirements for that business type.</span>
            </div>
            <div>
              <b>4</b>
              <span>Add branches, products/menu, staff and settlement setup.</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
