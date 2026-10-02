"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";
import { money, OpsShell } from "../components/OpsShell";

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  credentials: "include",
});

type Settlement = {
  id: string;
  organizationId: string;
  organization: null | { displayName: string; businessNumber: string | null };
  reference: string;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  status: string;
  provider: string | null;
};

type DriveFinance = {
  currency: string;
  driverOutstandingMinor: number;
  platformDebtMinor: number;
  heldRiderFareMinor: number;
  heldRiderFareCount: number;
  settledRiderFareMinor: number;
  settledRideCount: number;
  paidToWalletMinor: number;
  completedPayoutCount: number;
  reconciliationIssueCount: number;
  reconciliationIssues: Array<{
    driverUserId: string;
    profileBalanceMinor: number;
    ledgerBalanceMinor: number;
    deltaMinor: number;
    approvalStatus: string;
  }>;
  drivers: Array<{
    driverUserId: string;
    approvalStatus: string;
    profileBalanceMinor: number;
    ledgerBalanceMinor: number;
    platformDebtMinor: number;
    payoutAvailableMinor: number;
    reconciled: boolean;
  }>;
  payouts: Array<{
    id: string;
    driverUserId: string;
    amountMinor: number;
    currency: string;
    status: string;
    destinationWalletId: string | null;
    ledgerTransactionId: string | null;
    initiatedByUserId: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
};

type FocusLedger = {
  id: string; reference: string; kind: string; currency: string; description: string | null; createdAt: string;
  entries: Array<{ id: string; direction: string; amountMinor: number; createdAt: string; account: { id: string; code: string; kind: string; wallet: null | { id: string; ownerKey: string; userId: string | null; organizationId: string | null } } }>;
};

type PayOps = {
  funding: Array<{ id: string; amountMinor: number; currency: string; status: string; provider: string }>;
  withdrawals: Array<{ id: string; amountMinor: number; currency: string; status: string; provider: string }>;
  settlements: Settlement[];
  loans: Array<{ id: string; requestedMinor: number; currency: string; termDays: number; status: string; lenderName: string | null }>;
  driveFinance: DriveFinance;
};

function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

export default function OpsPay() {
  const [data, setData] = useState<PayOps | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [driveView, setDriveView] = useState<"balances" | "payouts" | "reconcile">("balances");
  const [focusRideId, setFocusRideId] = useState("");
  const [focusLedgerTransactionId, setFocusLedgerTransactionId] = useState("");
  const [focusedLedger, setFocusedLedger] = useState<FocusLedger | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<PayOps>("/v1/operations/pay"));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Pay Operations");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rideId = params.get("rideId") ?? "";
    const ledgerTransactionId = params.get("ledgerTransactionId") ?? "";
    setFocusRideId(rideId);
    setFocusLedgerTransactionId(ledgerTransactionId);
    if (ledgerTransactionId) setDriveView("payouts");
  }, []);

  useEffect(() => {
    if (!focusLedgerTransactionId) { setFocusedLedger(null); return; }
    let cancelled = false;
    void api.get<{ transaction: FocusLedger }>(`/v1/operations/pay/ledger-transactions/${encodeURIComponent(focusLedgerTransactionId)}`)
      .then((result) => { if (!cancelled) setFocusedLedger(result.transaction); })
      .catch((cause) => { if (!cancelled) { setFocusedLedger(null); setError(cause instanceof Error ? cause.message : "Could not load linked ledger transaction"); } });
    return () => { cancelled = true; };
  }, [focusLedgerTransactionId]);

  const totals = useMemo(() => ({
    settle: data?.settlements.filter((item) => item.status !== "SETTLED").reduce((sum, item) => sum + item.netMinor, 0) ?? 0,
    withdraw: data?.withdrawals.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length ?? 0,
    funding: data?.funding.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length ?? 0,
    loans: data?.loans.filter((item) => ["PENDING_PARTNER", "OFFERED"].includes(item.status)).length ?? 0,
  }), [data]);

  async function settle(id: string) {
    setBusy(`settle:${id}`);
    setError("");
    try {
      const result = await api.post<{ replayed?: boolean }>(`/v1/operations/business-settlements/${id}/settle-to-pay`, {});
      setNotice(result.replayed
        ? "Settlement was already posted to Business Pay; no duplicate payout was created."
        : "Settlement posted to Business Pay.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not settle payout");
    } finally {
      setBusy("");
    }
  }

  async function payDriver(userId: string, amountMinor: number) {
    if (amountMinor <= 0) return;
    setBusy(`driver-payout:${userId}`);
    setError("");
    try {
      const result = await api.request<{ replayed?: boolean; payout?: { amountMinor: number } }>(`/v1/admin/drive/drivers/${userId}/payout-to-wallet`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: { amountMinor },
      });
      setNotice(result.replayed
        ? "Driver payout had already been posted; the ledger was not charged twice."
        : `Moved ${money(result.payout?.amountMinor ?? amountMinor)} from Drive earnings into the driver's BAZAARA Wallet.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not move driver earnings");
    } finally {
      setBusy("");
    }
  }

  async function reconcileDriver(userId: string) {
    setBusy(`reconcile:${userId}`);
    setError("");
    try {
      const result = await api.post<{ actionState: "COMPLETED" | "ALREADY_DONE" }>(`/v1/admin/drive/drivers/${userId}/reconcile-wallet`, {});
      setNotice(result.actionState === "ALREADY_DONE"
        ? "Driver balance already matches the ledger source of truth."
        : "Driver balance mirror reconciled to the ledger source of truth.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reconcile driver balance");
    } finally {
      setBusy("");
    }
  }

  const drive = data?.driveFinance;

  return (
    <OpsShell active="/pay">
      <main className="ops-v3-main">
        <section className="ops-v3-page-head ops-pay-v10-head">
          <span className="ops-v3-kicker">PAY + DRIVE FINANCE OPERATIONS</span>
          <h1>One money control plane across BAZAARA.</h1>
          <p>Merchant settlements, consumer funding, bank withdrawals and Drive fare escrow now share one Finance Operations view while mobility dispatch permissions stay separate.</p>
        </section>

        {error ? <div className="ops-v3-alert">{error}</div> : null}
        {notice ? <div className="ops-v3-notice">{notice}</div> : null}
        {focusRideId || focusLedgerTransactionId ? <section className="ops-v11-focus-banner finance"><div><span className="ops-v3-kicker">LINKED OPERATIONS CONTEXT</span><strong>{focusRideId ? `Ride ${focusRideId}` : `Ledger ${focusLedgerTransactionId}`}</strong><small>Finance Operations was opened from a linked Drive/Support workflow. Use the shortcuts to keep the same canonical context.</small></div><div>{focusRideId ? <><a href={`/drive?rideId=${encodeURIComponent(focusRideId)}`}>Mobility</a><a href={`/support?q=${encodeURIComponent(focusRideId)}&category=DRIVE`}>Support</a></> : null}{focusLedgerTransactionId ? <a href={`/support?q=${encodeURIComponent(focusLedgerTransactionId)}`}>Support</a> : null}<button onClick={() => { setFocusRideId(""); setFocusLedgerTransactionId(""); }}>Clear focus</button></div></section> : null}
        {focusedLedger ? <section className="ops-v11-ledger-focus"><div className="ops-v11-ledger-head"><div><span className="ops-v3-kicker">CANONICAL LEDGER TRANSACTION</span><h2>{focusedLedger.reference}</h2><p>{focusedLedger.description ?? focusedLedger.kind}</p></div><div><strong>{focusedLedger.kind.replaceAll("_", " ")}</strong><small>{new Date(focusedLedger.createdAt).toLocaleString("en-NG")}</small></div></div><div className="ops-v11-ledger-entries">{focusedLedger.entries.map((entry) => <article key={entry.id}><span>{entry.direction}</span><strong>{money(entry.amountMinor, focusedLedger.currency)}</strong><small>{entry.account.code} · {entry.account.kind}</small><small>{entry.account.wallet ? `Wallet ${shortId(entry.account.wallet.id)} · ${entry.account.wallet.ownerKey}` : "Platform ledger account"}</small></article>)}</div></section> : null}

        <section className="ops-v3-kpis ops-pay-v10-kpis">
          <article><span>DRIVE FARE HELD</span><strong>{money(drive?.heldRiderFareMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>{drive?.heldRiderFareCount ?? 0} active fare holds</small></article>
          <article><span>DRIVER OUTSTANDING</span><strong>{money(drive?.driverOutstandingMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>earned, not yet moved to Wallet</small></article>
          <article className={(drive?.reconciliationIssueCount ?? 0) > 0 ? "attention" : ""}><span>RECONCILIATION</span><strong>{drive?.reconciliationIssueCount ?? 0}</strong><small>driver ledger mismatches</small></article>
          <article><span>BUSINESS NET</span><strong>{money(totals.settle)}</strong><small>pending Business Pay settlement</small></article>
        </section>

        <section className="ops-v3-panel ops-drive-money-panel">
          <div className="ops-pay-v10-section-head">
            <div><span className="ops-v3-kicker">DRIVE MONEY MOVEMENT</span><h2>Fare escrow → trip settlement → driver earnings → Wallet</h2><p>Customer fares are reserved before dispatch. Completed trips settle driver earnings into the Drive ledger; approved earnings can then move into the driver's BAZAARA Wallet.</p></div>
            <div className="ops-pay-v10-tabs">
              <button className={driveView === "balances" ? "active" : ""} disabled={Boolean(busy)} onClick={() => setDriveView("balances")}>Balances</button>
              <button className={driveView === "payouts" ? "active" : ""} disabled={Boolean(busy)} onClick={() => setDriveView("payouts")}>Payouts</button>
              <button className={driveView === "reconcile" ? "active" : ""} disabled={Boolean(busy)} onClick={() => setDriveView("reconcile")}>Reconcile</button>
            </div>
          </div>

          <div className="ops-pay-v10-flow">
            <article><span>1 · RIDER</span><strong>{money(drive?.heldRiderFareMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>currently held before/while riding</small></article>
            <i>→</i>
            <article><span>2 · SETTLED RIDES</span><strong>{money(drive?.settledRiderFareMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>{drive?.settledRideCount ?? 0} completed</small></article>
            <i>→</i>
            <article><span>3 · DRIVER EARNINGS</span><strong>{money(drive?.driverOutstandingMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>{money(drive?.platformDebtMinor ?? 0, drive?.currency ?? "NGN")} platform debt</small></article>
            <i>→</i>
            <article><span>4 · BAZAARA WALLET</span><strong>{money(drive?.paidToWalletMinor ?? 0, drive?.currency ?? "NGN")}</strong><small>{drive?.completedPayoutCount ?? 0} completed payouts</small></article>
          </div>

          {driveView === "balances" ? (
            <div className="ops-v3-table-wrap">
              <table className="ops-v3-table">
                <thead><tr><th>Driver</th><th>Approval</th><th>Drive balance</th><th>Ledger</th><th>Debt</th><th>Available</th><th /></tr></thead>
                <tbody>
                  {(drive?.drivers ?? []).length ? drive!.drivers.map((driver) => (
                    <tr key={driver.driverUserId}>
                      <td><strong>{shortId(driver.driverUserId)}</strong><small>{driver.reconciled ? "Ledger matched" : "Reconciliation required"}</small></td>
                      <td><span className="ops-v3-chip">{driver.approvalStatus}</span></td>
                      <td>{money(driver.profileBalanceMinor, drive?.currency)}</td>
                      <td>{money(driver.ledgerBalanceMinor, drive?.currency)}</td>
                      <td>{money(driver.platformDebtMinor, drive?.currency)}</td>
                      <td><strong>{money(driver.payoutAvailableMinor, drive?.currency)}</strong></td>
                      <td>{driver.reconciled && driver.payoutAvailableMinor > 0 ? <button className="ops-v3-table-action" disabled={busy === `driver-payout:${driver.driverUserId}`} onClick={() => void payDriver(driver.driverUserId, driver.payoutAvailableMinor)}>{busy === `driver-payout:${driver.driverUserId}` ? "Moving…" : "Move to Wallet"}</button> : <span className={driver.reconciled ? "ops-v3-success" : "ops-pay-v10-warning"}>{driver.reconciled ? "No payout" : "Blocked"}</span>}</td>
                    </tr>
                  )) : <tr><td colSpan={7}><div className="ops-pay-v10-empty">No outstanding Drive balances.</div></td></tr>}
                </tbody>
              </table>
            </div>
          ) : null}

          {driveView === "payouts" ? (
            <div className="ops-v3-table-wrap">
              <table className="ops-v3-table">
                <thead><tr><th>Driver</th><th>Amount</th><th>Status</th><th>Destination</th><th>Ledger reference</th><th>Completed</th></tr></thead>
                <tbody>{(drive?.payouts ?? []).length ? drive!.payouts.map((row) => <tr key={row.id}><td><strong>{shortId(row.driverUserId)}</strong><small>{shortId(row.id)}</small></td><td><strong>{money(row.amountMinor, row.currency)}</strong></td><td><span className="ops-v3-chip">{row.status}</span></td><td>{row.destinationWalletId ? shortId(row.destinationWalletId) : "—"}</td><td>{row.ledgerTransactionId ? <a className={focusLedgerTransactionId === row.ledgerTransactionId ? "ops-v11-ledger-link focused" : "ops-v11-ledger-link"} href={`/support?q=${encodeURIComponent(row.ledgerTransactionId)}`}>{shortId(row.ledgerTransactionId)}</a> : "—"}</td><td>{row.completedAt ? new Date(row.completedAt).toLocaleString("en-NG") : "Pending"}</td></tr>) : <tr><td colSpan={6}><div className="ops-pay-v10-empty">No Drive payouts yet.</div></td></tr>}</tbody>
              </table>
            </div>
          ) : null}

          {driveView === "reconcile" ? (
            <div className="ops-pay-v10-reconcile-list">
              {(drive?.reconciliationIssues ?? []).length ? drive!.reconciliationIssues.map((issue) => <article key={issue.driverUserId}><div><span>DRIVER</span><strong>{shortId(issue.driverUserId)}</strong><small>{issue.approvalStatus}</small></div><div><span>PROFILE</span><strong>{money(issue.profileBalanceMinor, drive?.currency)}</strong></div><div><span>LEDGER</span><strong>{money(issue.ledgerBalanceMinor, drive?.currency)}</strong></div><div><span>DELTA</span><strong>{money(issue.deltaMinor, drive?.currency)}</strong></div><button disabled={busy === `reconcile:${issue.driverUserId}`} onClick={() => void reconcileDriver(issue.driverUserId)}>{busy === `reconcile:${issue.driverUserId}` ? "Reconciling…" : "Reconcile mirror"}</button></article>) : <div className="ops-pay-v10-empty">All Drive driver balances match the ledger.</div>}
            </div>
          ) : null}
        </section>

        <section className="ops-v3-panel">
          <span className="ops-v3-kicker">BUSINESS SETTLEMENTS</span>
          <h2>Merchant payout control</h2>
          <div className="ops-v3-table-wrap"><table className="ops-v3-table"><thead><tr><th>Business</th><th>Reference</th><th>Gross</th><th>Fees</th><th>Net</th><th>Status</th><th /></tr></thead><tbody>{(data?.settlements ?? []).map((row) => <tr key={row.id}><td><strong>{row.organization?.displayName ?? row.organizationId}</strong><small>{row.organization?.businessNumber ?? ""}</small></td><td>{row.reference}</td><td>{money(row.grossMinor, row.currency)}</td><td>{money(row.feeMinor, row.currency)}</td><td><strong>{money(row.netMinor, row.currency)}</strong></td><td><span className="ops-v3-chip">{row.status}</span></td><td>{row.status !== "SETTLED" ? <button className="ops-v3-table-action" disabled={busy === `settle:${row.id}`} onClick={() => void settle(row.id)}>{busy === `settle:${row.id}` ? "Settling…" : "Settle to Pay"}</button> : <span className="ops-v3-success smart-done">✓ Paid</span>}</td></tr>)}</tbody></table></div>
        </section>

        <div className="ops-v3-grid">
          <section className="ops-v3-panel"><span className="ops-v3-kicker">CONSUMER PAY</span><h2>Recent bank withdrawals</h2><div className="ops-v3-stack">{(data?.withdrawals ?? []).slice(0, 12).map((row) => <div key={row.id}><span><strong>{row.status}</strong><small>{row.provider}</small></span><strong>{money(row.amountMinor, row.currency)}</strong></div>)}</div></section>
          <section className="ops-v3-panel"><span className="ops-v3-kicker">CREDIT</span><h2>Loan applications</h2><div className="ops-v3-stack">{(data?.loans ?? []).slice(0, 12).map((row) => <div key={row.id}><span><strong>{row.status}</strong><small>{row.termDays} days · {row.lenderName ?? "Awaiting partner"}</small></span><strong>{money(row.requestedMinor, row.currency)}</strong></div>)}</div></section>
        </div>
      </main>
    </OpsShell>
  );
}
