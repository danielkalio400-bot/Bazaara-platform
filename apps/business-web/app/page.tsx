"use client";

import { useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "./components/BusinessHeader";
import {
  businessRequest,
  useBusinessOrganizations,
} from "./lib/business";

type Profile = {
  organization: {
    id: string;
    businessNumber: string;
    displayName: string;
    legalName: string;
    legalType: string;
    status: string;
    country: string;
  };
  verification: {
    status: string;
  };
  registrations: Array<{
    id: string;
    vertical: string;
    status: string;
  }>;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  status: string;
};

type TeamMember = {
  id: string;
  status: string;
  roleKey?: string;
};

type Settlement = {
  id: string;
  netMinor: number;
  status: string;
  currency: string;
};

function money(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

const verticalCards: Record<
  string,
  { title: string; caption: string; manage: string; create: string; createLabel: string }
> = {
  SHOPPING: {
    title: "Shopping",
    caption: "Products, stock, promotions, orders and returns.",
    manage: "/shopping",
    create: "/shopping/products",
    createLabel: "Add product",
  },
  FOOD: {
    title: "Food",
    caption: "Restaurant operations, menu, kitchen queue and reviews.",
    manage: "/food",
    create: "/food/menu",
    createLabel: "Add menu item",
  },
  GROCERY: {
    title: "Grocery",
    caption: "Catalogue, stock, substitutions, picking and delivery slots.",
    manage: "/grocery",
    create: "/grocery/products",
    createLabel: "Add grocery product",
  },
  PHARMACY: {
    title: "Pharmacy",
    caption: "Products, batches, prescriptions and regulated fulfilment.",
    manage: "/pharmacy",
    create: "/pharmacy/products",
    createLabel: "Add pharmacy product",
  },
};

export default function BusinessOverview() {
  const {
    organizations,
    organization,
    organizationId,
    setOrganizationId,
    loading,
    error,
  } = useBusinessOrganizations();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!organizationId) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    void Promise.all([
      businessRequest<Profile>(
        `/v1/business/advanced/organizations/${organizationId}/profile`,
      ),
      businessRequest<{ branches: Branch[] }>(
        `/v1/business/organizations/${organizationId}/branches`,
      ),
      businessRequest<{ members: TeamMember[] }>(
        `/v1/business/organizations/${organizationId}/members`,
      ),
      businessRequest<{ settlements: Settlement[] }>(
        `/v1/business/organizations/${organizationId}/settlements`,
      ),
    ])
      .then(([profileResult, branchResult, memberResult, settlementResult]) => {
        if (cancelled) return;
        setProfile(profileResult);
        setBranches(branchResult.branches);
        setMembers(memberResult.members);
        setSettlements(settlementResult.settlements);
        setDetailError("");
      })
      .catch((cause) => {
        if (cancelled) return;
        setDetailError(
          cause instanceof Error
            ? cause.message
            : "Could not load the business dashboard",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const pendingSettlementMinor = useMemo(
    () =>
      settlements
        .filter((item) => !["SETTLED", "PAID"].includes(item.status))
        .reduce((sum, item) => sum + item.netMinor, 0),
    [settlements],
  );

  const activeVerticals = organization?.verticals ?? [];
  const registrations = new Map(
    (profile?.registrations ?? []).map((item) => [item.vertical, item]),
  );

  if (loading) {
    return (
      <main className="business-control-main">
        <div className="business-loading-card">
          <span className="business-pulse" />
          <strong>Opening Business…</strong>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <div className="business-control-shell">
        <main className="business-control-main">
          <section className="business-onboarding-hero">
            <span className="business-kicker">BUSINESS</span>
            <h1>Start your business workspace.</h1>
            <p>
              Create the organization first, then add only the business types
              you actually operate. BazID remains your identity; Business
              manages the company.
            </p>
            <a className="business-primary-button" href="/onboarding">
              Create business
            </a>
          </section>
          {error ? <div className="business-alert">{error}</div> : null}
        </main>
      </div>
    );
  }

  const tasks = [
    profile?.verification.status !== "VERIFIED"
      ? {
          title: "Complete business verification",
          text: `Current status: ${profile?.verification.status ?? "DOCUMENTS_REQUIRED"}`,
          href: "/settings#verification",
        }
      : null,
    branches.length === 0
      ? {
          title: "Add your first branch",
          text: "Branches control locations, staff access and future branch inventory.",
          href: "/settings#branches",
        }
      : null,
    activeVerticals.length === 0
      ? {
          title: "Add a business type",
          text: "Shopping, Food, Grocery and Pharmacy remain hidden until registered.",
          href: "/register",
        }
      : null,
  ].filter(
    (item): item is { title: string; text: string; href: string } =>
      Boolean(item),
  );

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={organization}
        organizations={organizations}
        organizationId={organizationId}
        setOrganizationId={setOrganizationId}
        active="overview"
      />

      <main className="business-control-main">
        {detailError ? <div className="business-alert">{detailError}</div> : null}

        <section className="business-hero business-hero-v2">
          <div>
            <span className="business-kicker">BUSINESS CONTROL CENTER</span>
            <h1>Run {organization.displayName} from one place.</h1>
            <p>
              Your registered business types, staff, branches, money and setup
              status are separated cleanly inside one organization.
            </p>
            <div className="business-hero-actions">
              {(() => {
                const primaryVertical = activeVerticals[0];
                if (!primaryVertical) return null;

                return (
                  <a
                    className="business-primary-button"
                    href={verticalCards[primaryVertical]?.create ?? "/register"}
                  >
                    + Create
                  </a>
                );
              })()}
              <a className="business-secondary-button" href="/team">
                Manage team
              </a>
            </div>
          </div>

          <div className="business-identity-card">
            <span>BUSINESS ID</span>
            <strong>{profile?.organization.businessNumber ?? "Allocating…"}</strong>
            <small>Use this ID when contacting Bazaara support.</small>
            <div>
              <span>STATUS</span>
              <b>{organization.status}</b>
            </div>
            <div>
              <span>VERIFICATION</span>
              <b>{profile?.verification.status ?? "—"}</b>
            </div>
          </div>
        </section>

        <section className="business-control-kpis">
          <article>
            <span>BUSINESS TYPES</span>
            <strong>{activeVerticals.length}</strong>
            <small>registered to this organization</small>
          </article>
          <article>
            <span>ACTIVE BRANCHES</span>
            <strong>
              {branches.filter((item) => item.status === "ACTIVE").length}
            </strong>
            <small>{branches.length} total branches</small>
          </article>
          <article>
            <span>TEAM</span>
            <strong>
              {members.filter((item) => item.status === "ACTIVE").length}
            </strong>
            <small>active organization members</small>
          </article>
          <article>
            <span>PENDING SETTLEMENTS</span>
            <strong>{money(pendingSettlementMinor)}</strong>
            <small>{settlements.length} settlement records</small>
          </article>
        </section>

        {tasks.length ? (
          <section className="business-panel business-task-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">ACTION REQUIRED</span>
                <h2>Finish setting up your business.</h2>
              </div>
              <span className="business-soft-pill">{tasks.length} tasks</span>
            </div>
            <div className="business-task-grid">
              {tasks.map((task) => (
                <a key={task.title} href={task.href}>
                  <strong>{task.title}</strong>
                  <span>{task.text}</span>
                  <b>Continue →</b>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="business-panel">
          <div className="business-section-heading">
            <div>
              <span className="business-kicker">YOUR BUSINESS TYPES</span>
              <h2>Only registered verticals appear here.</h2>
            </div>
            <a className="business-text-link" href="/register">
              + Add business type
            </a>
          </div>

          {activeVerticals.length ? (
            <div className="business-vertical-grid">
              {activeVerticals.map((vertical) => {
                const info = verticalCards[vertical];
                if (!info) return null;
                const registration = registrations.get(vertical);
                return (
                  <article key={vertical}>
                    <div className="business-vertical-icon">{vertical[0]}</div>
                    <div>
                      <span className="business-kicker">
                        {registration?.status ?? "REGISTERED"}
                      </span>
                      <h3>{info.title}</h3>
                      <p>{info.caption}</p>
                    </div>
                    <div className="business-card-actions">
                      <a href={info.manage}>Open workspace</a>
                      <a className="primary" href={info.create}>
                        {info.createLabel}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="business-empty-state">
              No business type has been registered yet.
            </div>
          )}
        </section>

        <div className="business-dashboard-grid lower">
          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">BRANCHES</span>
                <h2>Operating footprint</h2>
              </div>
              <a className="business-text-link" href="/settings#branches">
                Manage
              </a>
            </div>
            <div className="business-branch-list">
              {branches.length ? (
                branches.slice(0, 6).map((branch) => (
                  <div key={branch.id}>
                    <span
                      className={`business-dot ${
                        branch.status === "ACTIVE" ? "good" : ""
                      }`}
                    />
                    <div>
                      <strong>{branch.name}</strong>
                      <small>{branch.code}</small>
                    </div>
                    <span>{branch.status}</span>
                  </div>
                ))
              ) : (
                <div className="business-empty-state">
                  Add your first operating location in Settings.
                </div>
              )}
            </div>
          </section>

          <section className="business-panel">
            <span className="business-kicker">QUICK CREATE</span>
            <h2>Move straight into work.</h2>
            <div className="business-command-list">
              {activeVerticals.map((vertical) => {
                const info = verticalCards[vertical];
                return info ? (
                  <a key={vertical} href={info.create}>
                    <span>+</span>
                    <div>
                      <strong>{info.createLabel}</strong>
                      <small>{info.title}</small>
                    </div>
                    <b>→</b>
                  </a>
                ) : null;
              })}
              <a href="/team">
                <span>+</span>
                <div>
                  <strong>Invite team member</strong>
                  <small>Team & access</small>
                </div>
                <b>→</b>
              </a>
              <a href="/finance">
                <span>₦</span>
                <div>
                  <strong>Review finance</strong>
                  <small>Settlements & invoices</small>
                </div>
                <b>→</b>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
