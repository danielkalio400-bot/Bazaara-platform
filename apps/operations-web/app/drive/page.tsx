"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const api = createApiClient({
  baseUrl: API,
  credentials: "include",
});

type RideRow = {
  ride: {
    id: string;
    status: string;
    fareFundingStatus: string;
    fundedAmountMinor: number;
    searchRadiusMeters: number;
    createdAt: string;
  };
  pricing: {
    rideClass: string;
    totalMinor: number;
    currency: string;
    fuelIndexBps: number;
    pricingRuleVersion: string;
  };
  penalties: Array<{
    type: string;
    amountMinor: number;
    rateBps: number;
  }>;
};

type DriverRow = {
  profile: {
    userId: string;
    approvalStatus: string;
    availability: string;
    walletBalanceMinor: number;
    platformDebtMinor: number;
    maxPickupDistanceMeters: number;
    maxPickupEtaSeconds: number;
    lastLocationAt: string | null;
  };
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    plateNumber: string;
    status: string;
  }>;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    expiresAt: string | null;
  }>;
};

type Fuel = {
  id: string;
  priceMinorPerLitre: number;
  indexBps: number;
  source: string;
  status: string;
  metadata: { evidenceUrl?: string; submittedByUserId?: string; approvedByUserId?: string } | null;
  effectiveFrom: string;
};

type DriveFinance = {
  currency: string;
  driverOutstandingMinor: number;
  platformDebtMinor: number;
  heldRiderFareMinor: number;
  heldRiderFareCount: number;
  paidToWalletMinor: number;
  completedPayoutCount: number;
  reconciliationIssueCount: number;
};

type View = "rides" | "drivers" | "finance" | "fuel";

export default function DriveOperations() {
  const [view, setView] = useState<View>("rides");
  const [rides, setRides] = useState<RideRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [finance, setFinance] = useState<DriveFinance | null>(null);
  const [rideStatus, setRideStatus] = useState("");
  const [driverStatus, setDriverStatus] = useState("");
  const [focusRideId, setFocusRideId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [price, setPrice] = useState("");
  const [reference, setReference] = useState("");
  const [source, setSource] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const rideParams = new URLSearchParams();
      if (rideStatus) rideParams.set("status", rideStatus);
      if (focusRideId) rideParams.set("rideId", focusRideId);
      const rideQuery = rideParams.size ? `?${rideParams.toString()}` : "";
      const driverQuery = driverStatus
        ? `?status=${encodeURIComponent(driverStatus)}`
        : "";

      const [rideResult, driverResult, fuelResult] = await Promise.all([
        api.get<{ rides: RideRow[] }>(
          `/v1/admin/drive/rides${rideQuery}`,
        ),
        api.get<{ drivers: DriverRow[] }>(
          `/v1/admin/drive/drivers${driverQuery}`,
        ),
        api.get<{ prices: Fuel[] }>("/v1/admin/drive/fuel-prices"),
      ]);

      setRides(rideResult.rides);
      setDrivers(driverResult.drivers);
      setFuels(fuelResult.prices);
      api.get<{ finance: DriveFinance }>("/v1/admin/drive/finance")
        .then((result) => setFinance(result.finance))
        .catch(() => setFinance(null));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load Drive Operations",
      );
    }
  }, [driverStatus, focusRideId, rideStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rideId = params.get("rideId");
    if (rideId) { setFocusRideId(rideId); setView("rides"); }
  }, []);

  const metrics = useMemo(
    () => ({
      active: rides.filter(
        (item) =>
          !["COMPLETED", "CANCELLED"].includes(item.ride.status),
      ).length,
      online: drivers.filter(
        (item) => item.profile.availability === "ONLINE",
      ).length,
      pending: drivers.filter(
        (item) => item.profile.approvalStatus === "PENDING",
      ).length,
      penalties: rides.reduce(
        (sum, item) => sum + item.penalties.length,
        0,
      ),
      activeFare: rides
        .filter(
          (item) =>
            !["COMPLETED", "CANCELLED"].includes(item.ride.status),
        )
        .reduce(
          (sum, item) => sum + item.pricing.totalMinor,
          0,
        ),
      debt: drivers.reduce(
        (sum, item) => sum + item.profile.platformDebtMinor,
        0,
      ),
    }),
    [drivers, rides],
  );

  async function patch(
    url: string,
    body: unknown,
    message: string,
  ) {
    setBusy(url);
    try {
      const result = await api.patch<{ actionState?: "COMPLETED" | "ALREADY_DONE" }>(url, body);
      setNotice(result.actionState === "ALREADY_DONE" ? "✓ No change needed — that Drive status was already applied on the server." : message);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Update failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function updateFuel() {
    setBusy("fuel");
    try {
      await api.post("/v1/admin/drive/fuel-prices", {
        priceMinorPerLitre: Math.round(Number(price) * 100),
        referencePriceMinorPerLitre: reference
          ? Math.round(Number(reference) * 100)
          : undefined,
        source,
        evidenceUrl,
      });
      setNotice("Fuel evidence submitted for review. A different authorized operator must approve it before it affects future fares.");
      setPrice("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Fuel update failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function approveFuel(id: string) {
    setBusy(`approve:${id}`);
    setError("");
    try {
      await api.post(`/v1/admin/drive/fuel-prices/${encodeURIComponent(id)}/approve`, {});
      setNotice("Fuel publication approved. It applies only while current and only to new quotes.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not approve fuel publication");
    } finally { setBusy(""); }
  }

  return (
    <OpsShell active="/drive">
      <main className="ops-v31-main">
        <section className="ops-v33-domain-hero drive">
          <div>
            <span className="ops-v31-kicker">DRIVE OPERATIONS</span>
            <h1>Dispatch, pricing and driver compliance.</h1>
            <p>
              Control nearby ETA dispatch, locked fares, fuel adjustment,
              driver onboarding, vehicle documents and penalty audit.
            </p>
          </div>

          <div className="ops-v33-hero-stat">
            <span>ACTIVE FARE VALUE</span>
            <strong>{money(metrics.activeFare)}</strong>
            <small>{metrics.active} active rides</small>
            <a className="ops-v10-finance-link" href="/pay">Open Pay / Finance →</a>
          </div>
        </section>

        {error ? <div className="ops-v31-alert">{error}</div> : null}
        {notice ? <div className="ops-v31-notice">{notice}</div> : null}

        <section className="ops-v31-command-kpis">
          <article>
            <span>ACTIVE RIDES</span>
            <strong>{metrics.active}</strong>
            <small>requested through in-progress</small>
          </article>
          <article>
            <span>ONLINE DRIVERS</span>
            <strong>{metrics.online}</strong>
            <small>available driver fleet</small>
          </article>
          <article className={metrics.pending ? "attention" : ""}>
            <span>PENDING DRIVERS</span>
            <strong>{metrics.pending}</strong>
            <small>needs compliance review</small>
          </article>
          <article>
            <span>PENALTIES</span>
            <strong>{metrics.penalties}</strong>
            <small>recorded ride penalties</small>
          </article>
          <article className={metrics.debt > 0 ? "attention" : ""}>
            <span>PLATFORM DEBT</span>
            <strong>{money(metrics.debt)}</strong>
            <small>driver platform debt</small>
          </article>
        </section>

        <div className="ops-v33-regulatory-strip">
          <div>
            <strong>15%</strong>
            <span>Platform charge at ride start.</span>
          </div>
          <div>
            <strong>10%</strong>
            <span>Driver cancellation after acceptance.</span>
          </div>
          <div>
            <strong>20%</strong>
            <span>Outside-drop-off violation.</span>
          </div>
          <div>
            <strong>Fuel index</strong>
            <span>Future fares adjust from verified pump-price data.</span>
          </div>
        </div>

        <div className="ops-v33-tabs">
          {(["rides", "drivers", "finance", "fuel"] as const).map((value) => (
            <button
              key={value}
              className={view === value ? "active" : ""}
              onClick={() => setView(value)}
            >
              {value === "rides"
                ? "Ride network"
                : value === "drivers"
                  ? "Driver compliance"
                  : value === "finance"
                    ? "Wallet settlement"
                    : "Fuel regulation"}
            </button>
          ))}
        </div>

        {view === "rides" ? (
          <section className="ops-v31-panel">
            {focusRideId ? <div className="ops-v11-focus-banner"><div><span className="ops-v31-kicker">LINKED SUPPORT CONTEXT</span><strong>{focusRideId}</strong><small>Showing the exact Drive ride passed from Support or Finance Operations.</small></div><div><a href={`/support?q=${encodeURIComponent(focusRideId)}&category=DRIVE`}>Open support cases</a><a href={`/pay?rideId=${encodeURIComponent(focusRideId)}`}>Open finance context</a><button onClick={() => setFocusRideId("")}>Clear focus</button></div></div> : null}
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">RIDE NETWORK</span>
                <h2>Dispatch and funding state</h2>
              </div>
              <select
                className="ops-v33-select"
                value={rideStatus}
                onChange={(event) => setRideStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                {[
                  "REQUESTED",
                  "SEARCHING",
                  "DRIVER_ASSIGNED",
                  "DRIVER_ARRIVING",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="ops-v32-table-wrap">
              <table className="ops-v32-table">
                <thead>
                  <tr>
                    <th>Ride</th>
                    <th>State</th>
                    <th>Class</th>
                    <th>Fare</th>
                    <th>Funding</th>
                    <th>Search</th>
                    <th>Penalty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((row) => (
                    <tr key={row.ride.id}>
                      <td>
                        <strong>{row.ride.id.slice(0, 10)}</strong>
                        <small>
                          {new Date(
                            row.ride.createdAt,
                          ).toLocaleString("en-NG")}
                        </small>
                      </td>
                      <td>
                        <span className="ops-v31-soft-chip">
                          {row.ride.status}
                        </span>
                      </td>
                      <td>{row.pricing.rideClass}</td>
                      <td>
                        <strong>
                          {money(
                            row.pricing.totalMinor,
                            row.pricing.currency,
                          )}
                        </strong>
                        <small>
                          fuel{" "}
                          {(row.pricing.fuelIndexBps / 100).toFixed(1)}%
                        </small>
                      </td>
                      <td>
                        {row.ride.fareFundingStatus}
                        <small>
                          {money(
                            row.ride.fundedAmountMinor,
                            row.pricing.currency,
                          )}
                        </small>
                      </td>
                      <td>
                        {(row.ride.searchRadiusMeters / 1000).toFixed(1)} km
                      </td>
                      <td>
                        {row.penalties.length
                          ? row.penalties
                              .map(
                                (penalty) =>
                                  `${penalty.type} ${penalty.rateBps / 100}%`,
                              )
                              .join(", ")
                          : "—"}
                      </td>
                      <td><div className="ops-v11-row-links"><a href={`/support?q=${encodeURIComponent(row.ride.id)}&category=DRIVE`}>Support</a><a href={`/pay?rideId=${encodeURIComponent(row.ride.id)}`}>Finance</a></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {view === "drivers" ? (
          <section className="ops-v31-panel">
            <div className="ops-v31-section-head">
              <div>
                <span className="ops-v31-kicker">DRIVER COMPLIANCE</span>
                <h2>People, vehicles and documents</h2>
              </div>
              <select
                className="ops-v33-select"
                value={driverStatus}
                onChange={(event) => setDriverStatus(event.target.value)}
              >
                <option value="">All approvals</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="ops-v33-driver-grid">
              {drivers.map((driver) => {
                const vehicle = driver.vehicles[0];
                const pendingDocs = driver.documents.filter(
                  (document) => document.status === "PENDING",
                );

                return (
                  <article key={driver.profile.userId}>
                    <div className="ops-v33-card-head">
                      <div>
                        <span className="ops-v31-soft-chip">
                          {driver.profile.approvalStatus}
                        </span>
                        <h3>{driver.profile.userId.slice(0, 12)}</h3>
                        <small>
                          {driver.profile.availability} ·{" "}
                          {Math.round(
                            driver.profile.maxPickupDistanceMeters / 1000,
                          )}{" "}
                          km max pickup
                        </small>
                      </div>
                      <strong>
                        {money(driver.profile.walletBalanceMinor)}
                      </strong>
                    </div>

                    <div className="ops-v33-driver-vehicle">
                      <span>VEHICLE</span>
                      <strong>
                        {vehicle
                          ? `${vehicle.make} ${vehicle.model}`
                          : "No vehicle"}
                      </strong>
                      <small>
                        {vehicle
                          ? `${vehicle.plateNumber} · ${vehicle.status}`
                          : "Driver cannot be approved yet"}
                      </small>
                    </div>

                    {vehicle ? (
                      <button
                        className={`${vehicle.status === "APPROVED" ? "smart-done" : "ops-v33-primary"}`}
                        disabled={busy.includes(vehicle.id) || vehicle.status === "APPROVED"}
                        onClick={() =>
                          void patch(
                            `/v1/admin/drive/vehicles/${vehicle.id}`,
                            { status: "APPROVED" },
                            "Vehicle approved.",
                          )
                        }
                      >
                        {vehicle.status === "APPROVED" ? "✓ Vehicle approved" : busy.includes(vehicle.id) ? "Saving…" : "Approve vehicle"}
                      </button>
                    ) : null}

                    <div className="ops-v33-doc-list">
                      {driver.documents.map((document) => (
                        <div key={document.id}>
                          <span>
                            <strong>{document.type}</strong>
                            <small>
                              {document.status}
                              {document.expiresAt
                                ? ` · expires ${new Date(
                                    document.expiresAt,
                                  ).toLocaleDateString("en-NG")}`
                                : ""}
                            </small>
                          </span>

                          <span>
                            <button
                              className={document.status === "APPROVED" ? "smart-done" : ""}
                              disabled={busy.includes(document.id) || document.status === "APPROVED" || document.status === "REJECTED"}
                              onClick={() =>
                                void patch(
                                  `/v1/admin/drive/documents/${document.id}`,
                                  { status: "APPROVED" },
                                  "Document approved.",
                                )
                              }
                            >
                              {document.status === "APPROVED" ? "✓ Approved" : "Approve"}
                            </button>
                            <button
                              className={document.status === "REJECTED" ? "smart-done" : ""}
                              disabled={busy.includes(document.id) || document.status === "APPROVED" || document.status === "REJECTED"}
                              onClick={() =>
                                void patch(
                                  `/v1/admin/drive/documents/${document.id}`,
                                  { status: "REJECTED" },
                                  "Document rejected.",
                                )
                              }
                            >
                              {document.status === "REJECTED" ? "✓ Rejected" : "Reject"}
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="ops-v33-row-actions">
                      <button
                        className={driver.profile.approvalStatus === "APPROVED" ? "smart-done" : ""}
                        disabled={
                          busy.includes(driver.profile.userId) ||
                          driver.profile.approvalStatus === "APPROVED" ||
                          !vehicle ||
                          vehicle.status !== "APPROVED" ||
                          pendingDocs.length > 0
                        }
                        onClick={() =>
                          void patch(
                            `/v1/admin/drive/drivers/${driver.profile.userId}`,
                            { approvalStatus: "APPROVED" },
                            "Driver approved.",
                          )
                        }
                      >
                        {driver.profile.approvalStatus === "APPROVED" ? "✓ Driver approved" : "Approve driver"}
                      </button>
                      <button
                        className={driver.profile.approvalStatus === "SUSPENDED" ? "smart-done" : ""}
                        disabled={busy.includes(driver.profile.userId) || driver.profile.approvalStatus === "SUSPENDED"}
                        onClick={() =>
                          void patch(
                            `/v1/admin/drive/drivers/${driver.profile.userId}`,
                            { approvalStatus: "SUSPENDED" },
                            "Driver suspended.",
                          )
                        }
                      >
                        {driver.profile.approvalStatus === "SUSPENDED" ? "✓ Suspended" : "Suspend"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {view === "finance" ? (
          <div className="ops-v31-dashboard-grid">
            <section className="ops-v31-panel">
              <div className="ops-v31-section-head"><div><span className="ops-v31-kicker">DRIVE + WALLET</span><h2>Settlement health</h2></div><a className="ops-v33-primary" href={focusRideId ? `/pay?rideId=${encodeURIComponent(focusRideId)}` : "/pay"}>Open Finance Operations</a></div>
              {finance ? <div className="ops-v33-detail-summary">
                <div><span>DRIVER OUTSTANDING</span><strong>{money(finance.driverOutstandingMinor, finance.currency)}</strong><small>earned but not moved to Wallet</small></div>
                <div><span>RIDER FARE ESCROW</span><strong>{money(finance.heldRiderFareMinor, finance.currency)}</strong><small>{finance.heldRiderFareCount} active holds</small></div>
                <div><span>PAID TO WALLET</span><strong>{money(finance.paidToWalletMinor, finance.currency)}</strong><small>{finance.completedPayoutCount} completed payouts</small></div>
                <div><span>RECONCILIATION</span><strong>{finance.reconciliationIssueCount}</strong><small>profile / ledger exceptions</small></div>
                <div><span>PLATFORM DEBT</span><strong>{money(finance.platformDebtMinor, finance.currency)}</strong><small>driver-side debt</small></div>
              </div> : <div className="ops-v33-policy-note"><strong>Finance permission required</strong><span>Mobility staff can operate rides and compliance without being granted payout visibility. Finance Operations owns money-level reconciliation.</span></div>}
            </section>
            <aside className="ops-v31-panel"><span className="ops-v31-kicker">CONTROL BOUNDARY</span><h2>Separated permissions</h2><p className="ops-v33-muted">Ride dispatch, vehicle approval and mobility enforcement remain under mobility/order permissions. Driver payout and reconciliation require payment.read / payout.manage.</p><div className="ops-v33-regulatory-strip"><div><strong>Fare hold</strong><span>Rider Wallet → Drive escrow</span></div><div><strong>Ride settle</strong><span>Escrow → platform + driver liability</span></div><div><strong>Payout</strong><span>Driver liability → BAZAARA Wallet</span></div><div><strong>Bank</strong><span>Wallet → regulated payout provider</span></div></div></aside>
          </div>
        ) : null}

        {view === "fuel" ? (
          <div className="ops-v31-dashboard-grid">
            <section className="ops-v31-panel">
              <div className="ops-v31-section-head">
                <div>
                  <span className="ops-v31-kicker">FUEL REGULATION</span>
                  <h2>Fuel evidence and approvals</h2>
                  <p>Submitted evidence must be reviewed by a second operator. Missing or stale approvals are not applied to new fares.</p>
                </div>
              </div>

              <div className="ops-v32-table-wrap">
                <table className="ops-v32-table">
                  <thead>
                    <tr>
                      <th>Effective</th>
                      <th>Pump price</th>
                      <th>Index</th>
                      <th>Source</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuels.map((fuel) => (
                      <tr key={fuel.id}>
                        <td>
                          {new Date(
                            fuel.effectiveFrom,
                          ).toLocaleString("en-NG")}
                        </td>
                        <td>
                          ₦{(fuel.priceMinorPerLitre / 100).toFixed(0)}/L
                        </td>
                        <td>
                          {(fuel.indexBps / 100).toFixed(1)}%
                        </td>
                        <td>{fuel.metadata?.evidenceUrl ? <a href={fuel.metadata.evidenceUrl} target="_blank" rel="noopener noreferrer">{fuel.source} ↗</a> : fuel.source}</td>
                        <td>{fuel.status === "PENDING" ? <button type="button" disabled={Boolean(busy)} onClick={() => void approveFuel(fuel.id)}>{busy === `approve:${fuel.id}` ? "Reviewing…" : "Approve (second reviewer)"}</button> : fuel.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="ops-v31-panel">
              <div className="ops-v31-section-head">
                <div>
                  <span className="ops-v31-kicker">NEW INDEX</span>
                  <h2>Submit fuel evidence</h2>
                </div>
              </div>

              <div className="ops-v33-form">
                <label>
                  Pump price ₦/L
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </label>
                <label>
                  Reference ₦/L
                  <input
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                  />
                </label>
                <label>
                  Source
                  <input
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  />
                </label>
                <label>
                  Public HTTPS evidence URL
                  <input type="url" required placeholder="https://official-or-verifiable-source/..." value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} />
                </label>
                <p>Commercial policy: 30% fare fuel exposure, a 12% adjustment cap, and a 7-day freshness window. These values are BAZAARA policies, not statutory prices.</p>
                <button
                  className="ops-v33-primary"
                  disabled={busy === "fuel" || !evidenceUrl.startsWith("https://") || !source.trim() || !(Number(price) > 0)}
                  onClick={() => void updateFuel()}
                >
                  {busy === "fuel" ? "Submitting…" : "Submit for approval"}
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </OpsShell>
  );
}
