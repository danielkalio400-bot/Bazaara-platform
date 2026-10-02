"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import {
  businessRequest,
  useBusinessOrganizations,
} from "../lib/business";

type Vertical = "SHOPPING" | "FOOD" | "GROCERY" | "PHARMACY";

type Requirement = {
  key: string;
  label: string;
  required: boolean;
  note: string;
};

const verticalInfo: Record<
  Vertical,
  {
    title: string;
    caption: string;
    detail: string;
    next: string;
    regulated?: boolean;
  }
> = {
  SHOPPING: {
    title: "Shopping",
    caption: "Sell retail products and manage stock.",
    detail:
      "Adds a Shopping merchant and store workspace. Products can be built as drafts while verification is incomplete.",
    next: "/shopping/products",
  },
  FOOD: {
    title: "Food",
    caption: "Operate a restaurant on Food.",
    detail:
      "Adds a restaurant workspace. Menu and kitchen setup can be completed before customer ordering is activated.",
    next: "/food/menu",
  },
  GROCERY: {
    title: "Grocery",
    caption: "Run grocery stores, inventory and picking.",
    detail:
      "Adds a grocery store workspace with catalogue, stock, substitutions and fulfilment controls.",
    next: "/grocery/products",
  },
  PHARMACY: {
    title: "Pharmacy",
    caption: "Operate a regulated pharmacy storefront.",
    detail:
      "Creates the pharmacy workspace in setup/review state. Regulated workflows remain gated until verification is complete.",
    next: "/pharmacy/products",
    regulated: true,
  },
};

export default function RegisterBusinessVertical() {
  const {
    organizations,
    organization,
    organizationId,
    setOrganizationId,
    reloadOrganizations,
    loading,
  } = useBusinessOrganizations();

  const [requirements, setRequirements] = useState<
    Record<Vertical, Requirement[]>
  >({
    SHOPPING: [],
    FOOD: [],
    GROCERY: [],
    PHARMACY: [],
  });
  const [selected, setSelected] = useState<Vertical | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const available = useMemo(
    () =>
      (Object.keys(verticalInfo) as Vertical[]).filter(
        (vertical) => !organization?.verticals.includes(vertical),
      ),
    [organization],
  );

  const loadRequirements = useCallback(async () => {
    try {
      const result = await businessRequest<{
        verticals: Record<Vertical, Requirement[]>;
      }>("/v1/business/advanced/requirements");
      setRequirements(result.verticals);
    } catch {
      // The page still functions if requirement copy cannot be loaded.
    }
  }, []);

  useEffect(() => {
    void loadRequirements();
  }, [loadRequirements]);

  useEffect(() => {
    if (selected && !available.includes(selected)) setSelected("");
  }, [available, selected]);

  async function register(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !selected) return;
    if (!acknowledged) {
      setError("Review and acknowledge the activation requirements first.");
      return;
    }

    setBusy(selected);
    setError("");
    setNotice("");

    try {
      const registration = await businessRequest<{
        nextPath: string;
        alreadyRegistered: boolean;
      }>(
        `/v1/business/organizations/${organizationId}/verticals/register`,
        "POST",
        {
          vertical: selected,
          name: name || undefined,
          description:
            selected === "FOOD" && description
              ? description
              : undefined,
        },
      );

      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/verticals/${selected}/setup`,
        "POST",
        {},
      );

      setNotice(
        registration.alreadyRegistered
          ? `${verticalInfo[selected].title} has been reopened in setup mode.`
          : `${verticalInfo[selected].title} has been added. Finish its setup before activation.`,
      );

      await reloadOrganizations();

      window.setTimeout(() => {
        window.location.assign(verticalInfo[selected].next);
      }, 500);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not add this business type",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="business-control-main">Loading business…</main>;
  }

  if (!organization) {
    return (
      <div className="business-control-shell">
        <main className="business-control-main">
          <section className="business-auth-card">
            <span className="business-kicker">CREATE ORGANIZATION FIRST</span>
            <h1>Add the vendor organization before a business type.</h1>
            <a className="business-primary-button" href="/onboarding">
              Create business
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={organization}
        organizations={organizations}
        organizationId={organizationId}
        setOrganizationId={setOrganizationId}
        active="register"
      />

      <main className="business-control-main">
        <section className="business-page-heading">
          <span className="business-kicker">ADD BUSINESS TYPE</span>
          <h1>Add only what {organization.displayName} actually operates.</h1>
          <p>
            Registration creates the workspace. Activation is a separate step
            so incomplete businesses never become customer-visible by accident.
          </p>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}
        {notice ? <div className="business-notice">{notice}</div> : null}

        <section className="business-registration-summary">
          <div>
            <span>BUSINESS</span>
            <strong>{organization.displayName}</strong>
          </div>
          <div>
            <span>REGISTERED TYPES</span>
            <strong>
              {organization.verticals.length
                ? organization.verticals.join(" · ")
                : "NONE YET"}
            </strong>
          </div>
        </section>

        <section className="business-register-grid">
          {(Object.keys(verticalInfo) as Vertical[]).map((vertical) => {
            const info = verticalInfo[vertical];
            const registered = organization.verticals.includes(vertical);
            return (
              <button
                type="button"
                className={`business-register-option ${
                  registered ? "registered" : ""
                } ${selected === vertical ? "selected" : ""}`}
                key={vertical}
                disabled={registered}
                onClick={() => {
                  setSelected(vertical);
                  setName("");
                  setDescription("");
                  setAcknowledged(false);
                  setError("");
                }}
              >
                <div className="business-register-icon">
                  {registered ? "✓" : vertical[0]}
                </div>
                <div>
                  <strong>{info.title}</strong>
                  <span>{info.caption}</span>
                  <small>{registered ? "Already registered" : info.detail}</small>
                </div>
                <b>{registered ? "ACTIVE" : "ADD"}</b>
              </button>
            );
          })}
        </section>

        {selected ? (
          <div className="business-registration-detail-grid">
            <section className="business-panel">
              <span className="business-kicker">
                {verticalInfo[selected].title.toUpperCase()} REQUIREMENTS
              </span>
              <h2>Before customer activation</h2>

              <div className="business-requirement-list">
                {requirements[selected].map((requirement) => (
                  <article key={requirement.key}>
                    <span>{requirement.required ? "REQUIRED" : "OPTIONAL"}</span>
                    <div>
                      <strong>{requirement.label}</strong>
                      <small>{requirement.note}</small>
                    </div>
                  </article>
                ))}
              </div>

              {verticalInfo[selected].regulated ? (
                <div className="business-registration-warning">
                  Pharmacy is created in setup/review state. Creating the
                  workspace does not constitute regulatory approval.
                </div>
              ) : null}
            </section>

            <section className="business-panel">
              <span className="business-kicker">
                SET UP {verticalInfo[selected].title.toUpperCase()}
              </span>
              <h2>Create the workspace.</h2>

              <form className="business-form" onSubmit={register}>
                <label className="wide">
                  Display name
                  <input
                    placeholder={organization.displayName}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <small>
                    Leave blank to use {organization.displayName}.
                  </small>
                </label>

                {selected === "FOOD" ? (
                  <label className="wide">
                    Restaurant description
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Tell customers what this restaurant serves."
                    />
                  </label>
                ) : null}

                <label className="business-check wide">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) =>
                      setAcknowledged(event.target.checked)
                    }
                  />
                  I understand this creates a setup workspace and that required
                  verification/setup must be completed before activation.
                </label>

                <button
                  className="business-primary-button"
                  disabled={busy === selected || !acknowledged}
                >
                  {busy === selected
                    ? "Creating…"
                    : `Add ${verticalInfo[selected].title}`}
                </button>
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
