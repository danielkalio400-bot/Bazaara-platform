"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const api = createApiClient({
  baseUrl: API,
  credentials: "include",
});

type Business = {
  id: string;
  businessNumber: string | null;
  displayName: string;
  legalName: string;
  legalType: string;
  status: string;
  country: string;
  contactEmail: string | null;
  contactPhone: string | null;
  memberCount: number;
  merchants: Array<{
    id: string;
    vertical: string;
    slug: string;
    verifiedAt: string | null;
  }>;
  verification: null | {
    status: string;
    legalType: string;
    registrationNumber: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
  };
  verticalRegistrations: Array<{
    vertical: string;
    status: string;
  }>;
  pay: {
    linked: boolean;
    walletId: string | null;
    availableMinor: number;
    currency: string;
  };
  pendingSettlements: {
    count: number;
    netMinor: number;
  };
};

export default function OperationsBusinesses() {
  const [items, setItems] = useState<Business[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial =
      new URLSearchParams(window.location.search).get("q") ?? "";
    setQ(initial);
  }, []);

  const load = useCallback(
    async (term = q) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (term.trim()) params.set("q", term.trim());

        const result = await api.get<{ organizations: Business[] }>(
          `/v1/operations/businesses${
            params.size ? `?${params.toString()}` : ""
          }`,
        );

        setItems(result.organizations);
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? `${cause.message}. Check Platform API 4000; the last successful business list stays on screen.`
            : "Operations could not reach the Platform API.",
        );
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(q), 100);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  async function verification(
    organizationId: string,
    status: "VERIFIED" | "CHANGES_REQUIRED" | "UNDER_REVIEW",
  ) {
    setBusy(`${organizationId}-${status}`);

    try {
      const result = await api.request<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/operations/businesses/${organizationId}/verification`,
        {
          method: "PATCH",
          body: { status },
        },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? `Business verification was already ${status}.` : `Business verification moved to ${status}.`);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update verification",
      );
    } finally {
      setBusy("");
    }
  }

  async function vertical(
    organizationId: string,
    verticalName: "SHOPPING" | "FOOD" | "GROCERY" | "PHARMACY",
    status: "ACTIVE" | "CHANGES_REQUIRED" | "SUSPENDED",
  ) {
    const key = `${organizationId}-${verticalName}-${status}`;
    setBusy(key);

    try {
      const result = await api.request<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(
        `/v1/operations/businesses/${organizationId}/verticals/${verticalName}/status`,
        {
          method: "PATCH",
          body: { status },
        },
      );
      setNotice(result.actionState === "ALREADY_DONE" ? `${verticalName} was already ${status}.` : `${verticalName} moved to ${status}.`);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update business type",
      );
    } finally {
      setBusy("");
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);

    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${
        params.size ? `?${params.toString()}` : ""
      }`,
    );

    void load(q);
  }

  return (
    <OpsShell active="/businesses">
      <main className="ops-v31-main">
        <section className="ops-v32-domain-hero">
          <div>
            <span className="ops-v31-kicker">
              BUSINESS ADMINISTRATION
            </span>
            <h1>Verification and activation.</h1>
            <p>
              Vendors operate in Business. Employees verify,
              activate, suspend and investigate here.
            </p>
          </div>

          <div className="ops-v32-domain-live">
            <span>RESULTS</span>
            <strong>{loading ? "…" : items.length}</strong>
            <small>organizations in this view</small>
          </div>
        </section>

        <form className="ops-v3-search" onSubmit={search}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search Business ID, brand or legal name"
          />
          <button>{loading ? "Loading…" : "Search"}</button>
        </form>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <div className="ops-v3-business-list">
          {items.map((item) => (
            <article className="ops-v3-business-card" key={item.id}>
              <div className="ops-v3-business-main">
                <span className="ops-v31-kicker">
                  {item.businessNumber ?? "BUSINESS ID PENDING"}
                </span>
                <h2>{item.displayName}</h2>
                <p>{item.legalName}</p>

                <div className="ops-v3-business-meta">
                  <span>{item.status}</span>
                  <span>{item.legalType}</span>
                  <span>{item.memberCount} members</span>
                  <span>{item.country}</span>
                </div>
              </div>

              <div className="ops-v3-business-finance">
                <span>BUSINESS PAY</span>
                <strong>
                  {item.pay.linked
                    ? money(
                        item.pay.availableMinor,
                        item.pay.currency,
                      )
                    : "Not linked"}
                </strong>
                <small>
                  {item.pendingSettlements.count} pending ·{" "}
                  {money(item.pendingSettlements.netMinor)}
                </small>
              </div>

              <div className="ops-v3-business-review">
                <strong>KYB</strong>
                <span className="ops-v31-soft-chip">
                  {item.verification?.status ?? "NOT SUBMITTED"}
                </span>
                <div>
                  <button
                    disabled={busy.startsWith(item.id) || item.verification?.status === "UNDER_REVIEW"}
                    className={item.verification?.status === "UNDER_REVIEW" ? "smart-done" : ""}
                    onClick={() =>
                      void verification(item.id, "UNDER_REVIEW")
                    }
                  >
                    {item.verification?.status === "UNDER_REVIEW" ? "✓ Under review" : "Review"}
                  </button>
                  <button
                    disabled={busy.startsWith(item.id) || item.verification?.status === "VERIFIED"}
                    className={item.verification?.status === "VERIFIED" ? "smart-done" : ""}
                    onClick={() =>
                      void verification(item.id, "VERIFIED")
                    }
                  >
                    {item.verification?.status === "VERIFIED" ? "✓ Verified" : "Verify"}
                  </button>
                  <button
                    disabled={busy.startsWith(item.id) || item.verification?.status === "CHANGES_REQUIRED"}
                    className={item.verification?.status === "CHANGES_REQUIRED" ? "smart-done" : ""}
                    onClick={() =>
                      void verification(
                        item.id,
                        "CHANGES_REQUIRED",
                      )
                    }
                  >
                    {item.verification?.status === "CHANGES_REQUIRED" ? "✓ Changes requested" : "Request changes"}
                  </button>
                </div>
              </div>

              <div className="ops-v3-vertical-admin">
                {item.verticalRegistrations.length ? (
                  item.verticalRegistrations.map((registration) => (
                    <div key={registration.vertical}>
                      <span>
                        <strong>{registration.vertical}</strong>
                        <small>{registration.status}</small>
                      </span>
                      <span>
                        <button
                          disabled={busy.startsWith(item.id) || registration.status === "ACTIVE"}
                          className={registration.status === "ACTIVE" ? "smart-done" : ""}
                          onClick={() =>
                            void vertical(
                              item.id,
                              registration.vertical as
                                | "SHOPPING"
                                | "FOOD"
                                | "GROCERY"
                                | "PHARMACY",
                              "ACTIVE",
                            )
                          }
                        >
                          {registration.status === "ACTIVE" ? "✓ Active" : "Activate"}
                        </button>
                        <button
                          disabled={busy.startsWith(item.id) || registration.status === "CHANGES_REQUIRED"}
                          className={registration.status === "CHANGES_REQUIRED" ? "smart-done" : ""}
                          onClick={() =>
                            void vertical(
                              item.id,
                              registration.vertical as
                                | "SHOPPING"
                                | "FOOD"
                                | "GROCERY"
                                | "PHARMACY",
                              "CHANGES_REQUIRED",
                            )
                          }
                        >
                          {registration.status === "CHANGES_REQUIRED" ? "✓ Changes required" : "Changes"}
                        </button>
                        <button
                          disabled={busy.startsWith(item.id) || registration.status === "SUSPENDED"}
                          className={registration.status === "SUSPENDED" ? "smart-done" : ""}
                          onClick={() =>
                            void vertical(
                              item.id,
                              registration.vertical as
                                | "SHOPPING"
                                | "FOOD"
                                | "GROCERY"
                                | "PHARMACY",
                              "SUSPENDED",
                            )
                          }
                        >
                          {registration.status === "SUSPENDED" ? "✓ Suspended" : "Suspend"}
                        </button>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="ops-v31-empty">
                    No registered merchant types.
                  </div>
                )}
              </div>
            </article>
          ))}

          {!loading && !items.length ? (
            <div className="ops-v31-panel ops-v31-empty">
              No businesses match this search.
            </div>
          ) : null}
        </div>
      </main>
    </OpsShell>
  );
}
