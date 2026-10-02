"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "@bazaara/api-client";

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  credentials: "include",
});

const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
const BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_BASE_URL ?? "http://localhost:3001";
const GO = process.env.NEXT_PUBLIC_LOGISTICS_BASE_URL ?? "http://localhost:3008";
const DRIVE = process.env.NEXT_PUBLIC_DRIVE_BASE_URL ?? "http://localhost:3009";

type Wallet = { id: string; currency: string; status: string; availableMinor: number };
type Profile = { payTag: string; pinSet: boolean; dailyTransferLimitMinor: number };
type Activity = { id: string; transactionId: string; reference: string; kind: string; direction: "IN" | "OUT"; amountMinor: number; currency: string; description: string | null; createdAt: string };
type Savings = { id: string; name: string; principalMinor: number; currency: string; status: string; lockUntil: string; pledgedLoanApplicationId?: string | null; releasedAt?: string | null };
type Loan = { id: string; requestedMinor: number; currency: string; termDays: number; purpose?: string | null; status: string; lenderName: string | null; pledgedSavingsId?: string | null };
type BankAccount = { id: string; provider: string; bankCode: string; bankName: string; accountName: string; accountNumberLast4: string; status: string; createdAt: string };
type Withdrawal = { id: string; bankAccountId: string; provider: string; providerReference: string | null; amountMinor: number; currency: string; status: string; failureMessage: string | null; createdAt: string; completedAt: string | null; failedAt: string | null };
type Beneficiary = { id: string; walletId: string; displayName: string; payTag: string; label: string | null; createdAt: string };
type MoneyRequest = { id: string; code: string; requesterDisplayName: string; requesterPayTag: string; amountMinor: number; currency: string; note: string | null; status: string; createdAt: string; expiresAt: string };
type Overview = {
  wallet: Wallet;
  profile: Profile;
  activity: Activity[];
  bankAccounts: BankAccount[];
  withdrawals: Withdrawal[];
  savings: Savings[];
  loans: Loan[];
  beneficiaries: Beneficiary[];
  requests: MoneyRequest[];
};
type Caps = {
  externalFundingProviderConfigured: boolean;
  bankWithdrawals: boolean;
  p2pFeeBps: number;
  p2pFeeMinMinor: number;
  p2pFeeMaxMinor: number;
  testMode?: boolean;
  testBalanceMinor?: number;
};
type Biz = {
  organizationId: string;
  organizationName: string;
  businessNumber: string | null;
  organizationStatus: string;
  roleKey: string;
  linked: boolean;
  availableMinor: number;
  currency: string;
};
type Bank = { name: string; code: string; slug: string | null };
type GoSummary = {
  food: { deliveredCount: number; todayDeliveredCount: number; todayPayoutMinor: number; recentPayoutMinor: number };
  parcel: { deliveredCount: number; todayDeliveredCount: number; todayPayoutMinor: number; recentPayoutMinor: number };
};
type SupportCase = { id: string; category: string; subject: string; status: string; priority: string; lastActivityAt: string };
type DriveWallet = {
  wallet: { availableMinor: number; currency: string; status: string };
  heldFareMinor: number;
  activeRideCount: number;
  completedRideCount: number;
  completedSpendMinor: number;
  recentActivity: Activity[];
  recentRides: Array<{ id: string; status: string; rideClass: string; totalMinor: number; currency: string; createdAt: string }>;
  driver: null | {
    approvalStatus: string;
    earningsBalanceMinor: number;
    platformDebtMinor: number;
    payoutAvailableMinor: number;
    payWalletBalanceMinor: number;
    driveLedgerBalanceMinor: number;
    reconciled: boolean;
  };
};
type Mode = "send" | "request" | "fund" | "save" | "loan" | "pin" | "bank" | "withdraw" | "support" | null;
type Section = "wallet" | "business" | "wealth" | "drive" | "go" | "activity" | "support";

function money(n = 0, c = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(n / 100);
}

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export default function PremiumPayV4() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [business, setBusiness] = useState<Biz[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [goSummary, setGoSummary] = useState<GoSummary>({
    food: { deliveredCount: 0, todayDeliveredCount: 0, todayPayoutMinor: 0, recentPayoutMinor: 0 },
    parcel: { deliveredCount: 0, todayDeliveredCount: 0, todayPayoutMinor: 0, recentPayoutMinor: 0 },
  });
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [driveWallet, setDriveWallet] = useState<DriveWallet | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [active, setActive] = useState<Section>("wallet");
  const [hidden, setHidden] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [savingName, setSavingName] = useState("Fixed savings");
  const [savingDays, setSavingDays] = useState("30");
  const [loanDays, setLoanDays] = useState("90");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [pledgedSavingsId, setPledgedSavingsId] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawBankId, setWithdrawBankId] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportCategory, setSupportCategory] = useState<"PAYMENT" | "DRIVE" | "GO" | "LOGISTICS">("PAYMENT");
  const [supportDriveRideId, setSupportDriveRideId] = useState("");
  const [supportLedgerTransactionId, setSupportLedgerTransactionId] = useState("");
  const [focusRideId, setFocusRideId] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [o, c, b, cases, drive] = await Promise.all([
        api.get<Overview>("/v1/pay/overview"),
        api.get<Caps>("/v1/pay/capabilities"),
        api.get<{ accounts: Biz[] }>("/v1/pay/business-accounts"),
        api.get<{ cases: SupportCase[] }>("/v1/support/cases"),
        api.get<DriveWallet>("/v1/drive/wallet"),
      ]);

      setOverview(o);
      setCaps(c);
      setBusiness(b.accounts);
      setSupportCases(cases.cases.filter((item) => ["PAYMENT", "GO", "LOGISTICS", "DRIVE"].includes(item.category)));
      setDriveWallet(drive);
      setSignedOut(false);

      if (c.bankWithdrawals || c.externalFundingProviderConfigured) {
        api.get<{ banks: Bank[] }>("/v1/pay/banks")
          .then((result) => setBanks(result.banks))
          .catch(() => setBanks([]));
      }

      const [food, parcel] = await Promise.allSettled([
        api.get<{ summary: GoSummary["food"] }>("/v1/go/food/history"),
        api.get<{ summary: GoSummary["parcel"] }>("/v1/logistics/courier/history"),
      ]);

      setGoSummary({
        food: food.status === "fulfilled" ? food.value.summary : {
          deliveredCount: 0, todayDeliveredCount: 0, todayPayoutMinor: 0, recentPayoutMinor: 0,
        },
        parcel: parcel.status === "fulfilled" ? parcel.value.summary : {
          deliveredCount: 0, todayDeliveredCount: 0, todayPayoutMinor: 0, recentPayoutMinor: 0,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSignedOut(true);
      } else {
        setNotice(error instanceof Error ? error.message : "Could not load Wallet");
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get("section");
    if (["wallet", "business", "wealth", "drive", "go", "activity", "support"].includes(requestedSection ?? "")) {
      setActive(requestedSection as Section);
    }
    const rideId = params.get("rideId") ?? "";
    const ledgerTransactionId = params.get("ledgerTransactionId") ?? "";
    const category = params.get("category");
    if (rideId) { setFocusRideId(rideId); setSupportDriveRideId(rideId); }
    if (ledgerTransactionId) setSupportLedgerTransactionId(ledgerTransactionId);
    if (category === "DRIVE") setSupportCategory("DRIVE");
    if (requestedSection === "support" && (rideId || ledgerTransactionId || category)) {
      setMode("support");
      if (rideId) setSupportSubject("Help with my Drive ride");
      else if (ledgerTransactionId) setSupportSubject("Help with this Wallet transaction");
    }
  }, []);

  const amountMinor = Math.max(0, Math.round(Number(amount || "0") * 100));
  const feeMinor = useMemo(() => {
    if (!caps || amountMinor <= 0 || caps.p2pFeeBps <= 0) return 0;
    const raw = Math.ceil((amountMinor * caps.p2pFeeBps) / 10000);
    return Math.min(Math.max(raw, caps.p2pFeeMinMinor), caps.p2pFeeMaxMinor);
  }, [amountMinor, caps]);

  const businessTotal = business.reduce((sum, row) => sum + row.availableMinor, 0);
  const savingsTotal = (overview?.savings ?? [])
    .filter((row) => row.status !== "RELEASED")
    .reduce((sum, row) => sum + row.principalMinor, 0);
  const goToday = goSummary.food.todayPayoutMinor + goSummary.parcel.todayPayoutMinor;
  const goRecent = goSummary.food.recentPayoutMinor + goSummary.parcel.recentPayoutMinor;

  function resetForm() {
    setRecipient("");
    setAmount("");
    setPin("");
    setPassword("");
    setNote("");
    setAccountNumber("");
    setBankCode("");
    setBankName("");
    setWithdrawBankId("");
    setSupportSubject("");
    setSupportDescription("");
    setSupportDriveRideId("");
    setSupportLedgerTransactionId("");
  }

  async function run(labelKey: string, task: () => Promise<void>) {
    setBusy(labelKey);
    setNotice("");
    try {
      await task();
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Wallet action failed");
    } finally {
      setBusy("");
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    await run("send", async () => {
      await api.request("/v1/pay/transfers", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: {
          recipient,
          amountMinor,
          currency: overview?.wallet.currency ?? "NGN",
          note: note || undefined,
          pin,
        },
      });
      setMode(null);
      resetForm();
      setNotice("Transfer completed.");
    });
  }

  async function requestMoney(event: FormEvent) {
    event.preventDefault();
    await run("request", async () => {
      await api.post("/v1/pay/requests", {
        recipient: recipient || undefined,
        amountMinor,
        currency: overview?.wallet.currency ?? "NGN",
        note: note || undefined,
      });
      setMode(null);
      resetForm();
      setNotice("Payment request created.");
    });
  }

  async function fund(event: FormEvent) {
    event.preventDefault();
    await run("fund", async () => {
      const result = await api.request<{ intent?: { checkoutUrl?: string | null }; checkoutUrl?: string | null }>(
        "/v1/pay/funding-intents",
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
          body: {
            amountMinor,
            currency: overview?.wallet.currency ?? "NGN",
            paymentMethod: "PAYSTACK_CARD",
          },
        },
      );
      const url = result.intent?.checkoutUrl ?? result.checkoutUrl ?? null;
      if (url) {
        location.assign(url);
        return;
      }
      setMode(null);
      setNotice("Funding intent created.");
    });
  }

  async function createSavings(event: FormEvent) {
    event.preventDefault();
    await run("save", async () => {
      await api.post("/v1/pay/savings", {
        name: savingName,
        amountMinor,
        currency: overview?.wallet.currency ?? "NGN",
        durationDays: Number(savingDays),
        pin,
      });
      setMode(null);
      resetForm();
      setNotice("Fixed savings created.");
    });
  }

  async function releaseSavings(id: string) {
    const entered = window.prompt("Enter your 6-digit Wallet PIN to release this matured savings plan.");
    if (!entered) return;
    await run(`release:${id}`, async () => {
      await api.post(`/v1/pay/savings/${id}/release`, { pin: entered });
      setNotice("Matured savings returned to your wallet.");
    });
  }

  async function createLoan(event: FormEvent) {
    event.preventDefault();
    await run("loan", async () => {
      await api.post("/v1/pay/loan-applications", {
        requestedMinor: amountMinor,
        currency: overview?.wallet.currency ?? "NGN",
        termDays: Number(loanDays),
        purpose: loanPurpose || undefined,
        pledgedSavingsId: pledgedSavingsId || undefined,
      });
      setMode(null);
      resetForm();
      setPledgedSavingsId("");
      setNotice("Loan application submitted to the approved lending-partner workflow.");
    });
  }

  async function cancelLoan(id: string) {
    await run(`cancel-loan:${id}`, async () => {
      await api.post(`/v1/pay/loan-applications/${id}/cancel`, {});
      setNotice("Loan application cancelled.");
    });
  }

  async function setPayPin(event: FormEvent) {
    event.preventDefault();
    await run("pin", async () => {
      await api.post("/v1/pay/security/pin", { password, pin });
      setMode(null);
      resetForm();
      setNotice("Wallet PIN updated.");
    });
  }

  async function addBank(event: FormEvent) {
    event.preventDefault();
    await run("bank", async () => {
      const selected = banks.find((row) => row.code === bankCode);
      await api.post("/v1/pay/bank-accounts", {
        bankCode,
        bankName: selected?.name ?? bankName,
        accountNumber,
      });
      setMode(null);
      resetForm();
      setNotice("Bank account verified and added.");
    });
  }

  async function withdraw(event: FormEvent) {
    event.preventDefault();
    await run("withdraw", async () => {
      await api.request("/v1/pay/withdrawals", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: {
          bankAccountId: withdrawBankId,
          amountMinor,
          currency: overview?.wallet.currency ?? "NGN",
          pin,
        },
      });
      setMode(null);
      resetForm();
      setNotice("Withdrawal submitted to the configured regulated payout provider.");
    });
  }

  async function moveDriveEarnings() {
    if (!driveWallet?.driver?.payoutAvailableMinor) return;
    await run("drive-payout", async () => {
      await api.request("/v1/drive/driver/payouts", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: { amountMinor: driveWallet.driver?.payoutAvailableMinor },
      });
      setNotice("Drive earnings moved into your BAZAARA Wallet.");
    });
  }

  async function resetTestWallet() {
    await run("test-wallet", async () => {
      await api.post("/v1/pay/test-wallet/reset", {});
      setNotice("Local test wallet reset to the configured test balance.");
    });
  }

  async function createSupport(event: FormEvent) {
    event.preventDefault();
    await run("support", async () => {
      await api.post("/v1/support/cases", {
        category: supportCategory,
        subject: supportSubject,
        description: supportDescription,
        channel: "PAY",
        driveRideId: supportDriveRideId || undefined,
        ledgerTransactionId: supportLedgerTransactionId || undefined,
        context: { surface: "BAZAARA_PAY_WEB", section: active },
      });
      setMode(null);
      resetForm();
      setNotice(`${supportCategory === "DRIVE" ? "Drive" : "Wallet"} support case opened with Operations.`);
    });
  }

  if (signedOut) {
    return (
      <main className="pay-v4-auth">
        <section>
          <span className="pay-v4-kicker">WALLET</span>
          <h1>Money movement for the entire Bazaara ecosystem.</h1>
          <p>Wallet, Business Pay, GO earnings, savings, bank payouts and support use one BazID.</p>
          <a href={`${BAZID}/bazid/sign-in?returnTo=${encodeURIComponent("http://localhost:3010")}`}>
            Continue with BazID
          </a>
        </section>
      </main>
    );
  }

  const nav: Array<[Section, string, string, string]> = [
    ["wallet", "WL", "Wallet", "Send, request and fund"],
    ["business", "BZ", "Business Pay", "Merchant balances"],
    ["wealth", "SV", "Savings & credit", "Fixed savings, loans, banks"],
    ["drive", "DR", "Drive", "Rider fare + driver earnings"],
    ["go", "GO", "Go earnings", "Food + parcel payouts"],
    ["activity", "AC", "Activity", "Ledger-backed movement"],
    ["support", "SP", "Support", "Pay Operations cases"],
  ];

  return (
    <div className="pay-v4-shell">
      <aside className="pay-v4-sidebar">
        <a className="pay-v4-logo" href="/">
          <b>₿</b>
          <span><strong>BAZAARA</strong><small>PAY</small></span>
        </a>

        <div className="pay-v4-wallet-chip">
          <span className="live" />
          <div>
            <strong>@{overview?.profile.payTag ?? "pay"}</strong>
            <small>{overview?.wallet.status ?? "Loading"} · {overview?.wallet.currency ?? "NGN"}</small>
          </div>
        </div>

        <nav>
          {nav.map(([key, short, title, detail]) => (
            <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
              <span>{short}</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
            </button>
          ))}
        </nav>

        <div className="pay-v4-side-foot">
          <span>LEDGER BACKED</span>
          <small>Pay provider actions remain gated until regulated providers are configured.</small>
        </div>
      </aside>

      <div className="pay-v4-workspace">
        <header className="pay-v4-topbar">
          <div><span className="pay-v4-kicker">MONEY & SETTLEMENTS</span><strong>{nav.find(([key]) => key === active)?.[2]}</strong></div>
          <div className="pay-v4-top-actions">
            <a href={GO}>GO</a>
            <a href={BUSINESS}>Business</a>
            <button onClick={() => setMode("support")}>Support</button>
          </div>
        </header>

        <main className="pay-v4-main">
          {notice ? <div className="pay-v4-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

          {active === "wallet" ? (
            <>
              <section className="pay-v4-hero">
                <div className="pay-v4-balance">
                  <div className="pay-v4-balance-head"><span>AVAILABLE BALANCE</span><button onClick={() => setHidden((value) => !value)}>{hidden ? "Show" : "Hide"}</button></div>
                  <strong>{hidden ? "••••••" : money(overview?.wallet.availableMinor ?? 0, overview?.wallet.currency ?? "NGN")}</strong>
                  <p>@{overview?.profile.payTag ?? "—"} · {overview?.profile.pinSet ? "PIN protected" : "PIN setup required"}</p>
                  <div className="pay-v4-actions">
                    <button onClick={() => setMode("send")}><b>↑</b><span>Send</span></button>
                    <button onClick={() => setMode("request")}><b>↓</b><span>Request</span></button>
                    <button onClick={() => setMode("fund")}><b>＋</b><span>Add money</span></button>
                    <button onClick={() => setMode("withdraw")}><b>↗</b><span>Withdraw</span></button>
                    <button onClick={() => setMode("pin")}><b>◆</b><span>Security</span></button>
                  </div>
                </div>
                <aside className="pay-v4-hero-rail">
                  <article><span>BUSINESS PAY</span><strong>{money(businessTotal)}</strong><small>{business.filter((row) => row.linked).length} linked</small></article>
                  <article><span>FIXED SAVINGS</span><strong>{money(savingsTotal)}</strong><small>{overview?.savings.length ?? 0} plans</small></article>
                  <article><span>DRIVE HELD</span><strong>{money(driveWallet?.heldFareMinor ?? 0, driveWallet?.wallet.currency ?? "NGN")}</strong><small>{driveWallet?.activeRideCount ?? 0} active ride{(driveWallet?.activeRideCount ?? 0) === 1 ? "" : "s"}</small></article>
                </aside>
              </section>

              {caps?.testMode ? (
                <section className="pay-v4-testbar">
                  <div><span>LOCAL TEST MODE</span><strong>Reset wallet to {money(caps.testBalanceMinor ?? 0)}</strong></div>
                  <button disabled={busy === "test-wallet"} onClick={() => void resetTestWallet()}>{busy === "test-wallet" ? "Resetting…" : "Reset test wallet"}</button>
                </section>
              ) : null}

              <section className="pay-v4-panel">
                <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">RECENT</span><h2>Wallet activity</h2></div><button onClick={() => setActive("activity")}>View all</button></div>
                <ActivityList items={(overview?.activity ?? []).slice(0, 6)} />
              </section>
            </>
          ) : null}

          {active === "business" ? (
            <>
              <section className="pay-v4-section-head"><div><span className="pay-v4-kicker">BUSINESS PAY</span><h1>Personal and merchant money stay separated.</h1><p>Business settlements are organization-owned while your consumer wallet remains private.</p></div></section>
              <section className="pay-v4-business-grid">
                {business.length ? business.map((row) => (
                  <article key={row.organizationId}>
                    <div><span>{row.businessNumber ?? "BUSINESS"}</span><h2>{row.organizationName}</h2><small>{row.roleKey} · {row.organizationStatus}</small></div>
                    <strong>{row.linked ? money(row.availableMinor, row.currency) : "Not linked"}</strong>
                    <a href={`${BUSINESS}/finance`}>{row.linked ? "Open Finance →" : "Connect Business Pay →"}</a>
                  </article>
                )) : <div className="pay-v4-empty">No Business organization is associated with this BazID.</div>}
              </section>
            </>
          ) : null}

          {active === "wealth" ? (
            <>
              <section className="pay-v4-section-head"><div><span className="pay-v4-kicker">SAVINGS, CREDIT & PAYOUTS</span><h1>Control where your money goes next.</h1><p>Fixed savings are ledger-locked. Real yield and lending remain licensed-partner gated.</p></div><div className="pay-v4-head-actions"><button onClick={() => setMode("save")}>+ Savings</button><button onClick={() => setMode("loan")}>+ Loan application</button><button onClick={() => setMode("bank")}>+ Bank</button></div></section>

              <div className="pay-v4-two-col">
                <section className="pay-v4-panel">
                  <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">FIXED SAVINGS</span><h2>Locked pockets</h2></div></div>
                  <div className="pay-v4-list">
                    {(overview?.savings ?? []).length ? overview!.savings.map((row) => {
                      const matured = new Date(row.lockUntil) <= new Date();
                      return <article key={row.id}><div><strong>{row.name}</strong><small>{label(row.status)} · unlocks {new Date(row.lockUntil).toLocaleDateString("en-NG")}</small></div><b>{money(row.principalMinor, row.currency)}</b>{matured && !["PLEDGED", "RELEASED"].includes(row.status) ? <button disabled={busy === `release:${row.id}`} onClick={() => void releaseSavings(row.id)}>Release</button> : null}</article>;
                    }) : <div className="pay-v4-empty">No fixed savings yet.</div>}
                  </div>
                </section>

                <section className="pay-v4-panel">
                  <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">PARTNER CREDIT</span><h2>Loan applications</h2></div></div>
                  <div className="pay-v4-list">
                    {(overview?.loans ?? []).length ? overview!.loans.map((row) => <article key={row.id}><div><strong>{money(row.requestedMinor, row.currency)}</strong><small>{row.termDays} days · {label(row.status)}{row.lenderName ? ` · ${row.lenderName}` : ""}</small></div>{["PENDING_PARTNER", "OFFERED"].includes(row.status) ? <button disabled={busy === `cancel-loan:${row.id}`} onClick={() => void cancelLoan(row.id)}>Cancel</button> : <b>{label(row.status)}</b>}</article>) : <div className="pay-v4-empty">No loan applications.</div>}
                  </div>
                </section>
              </div>

              <section className="pay-v4-panel">
                <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">BANK PAYOUTS</span><h2>Verified withdrawal destinations</h2></div><button onClick={() => setMode("bank")}>Add bank</button></div>
                <div className="pay-v4-bank-grid">
                  {(overview?.bankAccounts ?? []).length ? overview!.bankAccounts.map((row) => <article key={row.id}><span>{row.bankName}</span><strong>{row.accountName}</strong><small>•••• {row.accountNumberLast4} · {label(row.status)}</small><button onClick={() => { setWithdrawBankId(row.id); setMode("withdraw"); }}>Withdraw here</button></article>) : <div className="pay-v4-empty">No verified bank accounts.</div>}
                </div>
                <div className="pay-v4-withdrawals">
                  {(overview?.withdrawals ?? []).slice(0, 8).map((row) => <article key={row.id}><span>{new Date(row.createdAt).toLocaleString("en-NG")}</span><strong>{money(row.amountMinor, row.currency)}</strong><b>{label(row.status)}</b></article>)}
                </div>
              </section>
            </>
          ) : null}

          {active === "drive" ? (
            <>
              <section className="pay-v4-section-head">
                <div><span className="pay-v4-kicker">DRIVE + WALLET</span><h1>One wallet from fare hold to driver payout.</h1><p>Rider fares are held in Drive escrow, then settled through the BAZAARA ledger. Driver earnings can be moved into the same spendable Wallet without creating a second cash system.</p></div>
                <div className="pay-v4-head-actions"><button className="pay-v4-primary-link" onClick={() => { setSupportCategory("DRIVE"); setSupportDriveRideId(focusRideId); setMode("support"); }}>Drive support</button><a className="pay-v4-primary-link" href={DRIVE}>Open Drive →</a></div>
              </section>
              {focusRideId ? <div className="pay-v11-context-banner"><span>LINKED DRIVE RIDE</span><strong>{focusRideId}</strong><p>Wallet is showing Drive context passed from the ride experience. Support opened here will carry this ride into Operations automatically.</p><button onClick={() => { setSupportCategory("DRIVE"); setSupportDriveRideId(focusRideId); setSupportSubject("Help with my Drive ride"); setMode("support"); }}>Open linked support case</button></div> : null}
              <section className="pay-v4-stat-grid">
                <article><span>HELD FOR ACTIVE RIDES</span><strong>{money(driveWallet?.heldFareMinor ?? 0, driveWallet?.wallet.currency ?? "NGN")}</strong><small>{driveWallet?.activeRideCount ?? 0} active</small></article>
                <article><span>COMPLETED RIDES</span><strong>{driveWallet?.completedRideCount ?? 0}</strong><small>{money(driveWallet?.completedSpendMinor ?? 0, driveWallet?.wallet.currency ?? "NGN")} total spend</small></article>
                <article><span>DRIVER EARNINGS</span><strong>{money(driveWallet?.driver?.earningsBalanceMinor ?? 0, driveWallet?.wallet.currency ?? "NGN")}</strong><small>{driveWallet?.driver ? `${label(driveWallet.driver.approvalStatus)} driver account` : "No driver account"}</small></article>
                <article><span>SPENDABLE WALLET</span><strong>{money(driveWallet?.wallet.availableMinor ?? 0, driveWallet?.wallet.currency ?? "NGN")}</strong><small>{driveWallet?.wallet.status ?? "Loading"}</small></article>
              </section>
              {driveWallet?.driver ? (
                <section className="pay-v4-panel pay-v4-drive-settlement">
                  <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">DRIVER SETTLEMENT</span><h2>Move earned Drive balance to Wallet</h2></div><button className="pay-v4-primary-link" disabled={!driveWallet.driver.payoutAvailableMinor || busy === "drive-payout" || !driveWallet.driver.reconciled} onClick={() => void moveDriveEarnings()}>{busy === "drive-payout" ? "Moving…" : `Move ${money(driveWallet.driver.payoutAvailableMinor, driveWallet.wallet.currency)}`}</button></div>
                  <p className="pay-v4-muted">Available payout excludes platform debt. Ledger/profile mismatches are blocked and routed to Finance Operations for reconciliation before money can move.</p>
                  {!driveWallet.driver.reconciled ? <div className="pay-v4-drive-warning">Driver earnings require Finance Operations reconciliation before payout.</div> : null}
                </section>
              ) : null}
              <section className="pay-v4-two-col">
                <div className="pay-v4-panel"><div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">DRIVE LEDGER</span><h2>Recent money movement</h2></div></div><ActivityList items={driveWallet?.recentActivity ?? []} onSupport={(row) => { setSupportCategory("PAYMENT"); setSupportLedgerTransactionId(row.transactionId); setSupportSubject(`Wallet transaction ${row.reference}`); setMode("support"); }} /></div>
                <div className="pay-v4-panel"><div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">TRIPS</span><h2>Recent rides</h2></div></div><div className="pay-v4-list pay-v11-drive-rides">{(driveWallet?.recentRides ?? []).length ? driveWallet!.recentRides.map((row) => <article key={row.id} className={focusRideId === row.id ? "focused" : ""}><div><strong>{label(row.rideClass)} · {label(row.status)}</strong><small>{new Date(row.createdAt).toLocaleString("en-NG")}</small><button onClick={() => { setFocusRideId(row.id); setSupportCategory("DRIVE"); setSupportDriveRideId(row.id); setSupportSubject("Help with my Drive ride"); setMode("support"); }}>Support this ride</button></div><b>{money(row.totalMinor, row.currency)}</b><span>{row.id.slice(0, 8)}</span></article>) : <div className="pay-v4-empty">No Drive rides yet.</div>}</div></div>
              </section>
            </>
          ) : null}

          {active === "go" ? (
            <>
              <section className="pay-v4-section-head"><div><span className="pay-v4-kicker">GO</span><h1>Courier earnings land where the rest of Bazaara money lives.</h1><p>Food and advance-funded parcel payouts share your Wallet wallet.</p></div><a className="pay-v4-primary-link" href={GO}>Open Go →</a></section>
              <section className="pay-v4-stat-grid">
                <article><span>TODAY</span><strong>{money(goToday)}</strong><small>{goSummary.food.todayDeliveredCount + goSummary.parcel.todayDeliveredCount} deliveries</small></article>
                <article><span>RECENT</span><strong>{money(goRecent)}</strong><small>Loaded Go history</small></article>
                <article><span>FOOD</span><strong>{money(goSummary.food.recentPayoutMinor)}</strong><small>{goSummary.food.deliveredCount} delivered</small></article>
                <article><span>PARCELS</span><strong>{money(goSummary.parcel.recentPayoutMinor)}</strong><small>{goSummary.parcel.deliveredCount} delivered</small></article>
              </section>
              <section className="pay-v4-panel"><div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">SETTLEMENT MODEL</span><h2>Verified completion → wallet credit</h2></div></div><p className="pay-v4-muted">Advance parcel funds remain in delivery escrow until verified completion. Courier payout and platform commission are posted through the ledger. Cancelled eligible parcels return funded value to the customer wallet.</p></section>
            </>
          ) : null}

          {active === "activity" ? (
            <>
              <section className="pay-v4-section-head"><div><span className="pay-v4-kicker">LEDGER ACTIVITY</span><h1>Every movement has a reference.</h1><p>Transfers, deposits, savings, withdrawals and Bazaara ecosystem settlements remain traceable.</p></div></section>
              <section className="pay-v4-panel"><ActivityList items={overview?.activity ?? []} /></section>
              <section className="pay-v4-panel">
                <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">MONEY REQUESTS</span><h2>Requests</h2></div><button onClick={() => setMode("request")}>New request</button></div>
                <div className="pay-v4-list">{(overview?.requests ?? []).length ? overview!.requests.map((row) => <article key={row.id}><div><strong>{row.code}</strong><small>{row.note ?? `@${row.requesterPayTag}`} · {new Date(row.createdAt).toLocaleString("en-NG")}</small></div><b>{money(row.amountMinor, row.currency)}</b><span>{label(row.status)}</span></article>) : <div className="pay-v4-empty">No payment requests.</div>}</div>
              </section>
            </>
          ) : null}

          {active === "support" ? (
            <>
              <section className="pay-v4-section-head"><div><span className="pay-v4-kicker">PAY SUPPORT</span><h1>Money problems should never become dead ends.</h1><p>Open a case directly into Operations and keep the canonical conversation attached to your BazID.</p></div><button className="pay-v4-primary-link" onClick={() => setMode("support")}>Open case</button></section>
              <section className="pay-v4-panel">
                <div className="pay-v4-case-list">{supportCases.length ? supportCases.map((row) => <article key={row.id}><div><strong>{row.subject}</strong><small>{row.category} · {new Date(row.lastActivityAt).toLocaleString("en-NG")}</small></div><span>{label(row.status)}</span><b>{row.priority}</b></article>) : <div className="pay-v4-empty">No Pay or Go cases.</div>}</div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      {mode ? (
        <div className="pay-v4-modal-backdrop" onMouseDown={() => setMode(null)}>
          <section className="pay-v4-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="pay-v4-panel-head"><div><span className="pay-v4-kicker">{mode.toUpperCase()}</span><h2>{modeTitle(mode)}</h2></div><button onClick={() => setMode(null)}>Close</button></div>

            {mode === "send" ? <form className="pay-v4-form" onSubmit={send}><label>Recipient<input required value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="@paytag, email, phone or wallet ID"/></label><label>Amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><label className="wide">Note<input value={note} onChange={(e) => setNote(e.target.value)}/></label><label>6-digit Pay PIN<input required type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}/></label><div className="pay-v4-fees"><span>Recipient {money(amountMinor)}</span><span>Fee {money(feeMinor)}</span><strong>Total {money(amountMinor + feeMinor)}</strong></div><button className="pay-v4-primary" disabled={busy === "send" || pin.length !== 6}>{busy === "send" ? "Sending…" : "Send securely"}</button></form> : null}

            {mode === "request" ? <form className="pay-v4-form" onSubmit={requestMoney}><label>Request from (optional)<input value={recipient} onChange={(e) => setRecipient(e.target.value)}/></label><label>Amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><label className="wide">Note<input value={note} onChange={(e) => setNote(e.target.value)}/></label><button className="pay-v4-primary">Create request</button></form> : null}

            {mode === "fund" ? <form className="pay-v4-form" onSubmit={fund}><label>Amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><div className="pay-v4-provider wide">{caps?.externalFundingProviderConfigured ? "A regulated funding provider is configured." : "External funding is provider-gated. No synthetic production deposit will be created."}</div><button className="pay-v4-primary" disabled={!caps?.externalFundingProviderConfigured || busy === "fund"}>Continue to provider</button></form> : null}

            {mode === "save" ? <form className="pay-v4-form" onSubmit={createSavings}><label>Name<input value={savingName} onChange={(e) => setSavingName(e.target.value)}/></label><label>Amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><label>Lock period<select value={savingDays} onChange={(e) => setSavingDays(e.target.value)}>{["7","30","90","180","365"].map((value) => <option key={value} value={value}>{value} days</option>)}</select></label><label>Pay PIN<input required type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}/></label><button className="pay-v4-primary" disabled={pin.length !== 6 || busy === "save"}>Lock savings</button></form> : null}

            {mode === "loan" ? <form className="pay-v4-form" onSubmit={createLoan}><label>Requested amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><label>Term<select value={loanDays} onChange={(e) => setLoanDays(e.target.value)}>{["30","60","90","180","365"].map((value) => <option key={value} value={value}>{value} days</option>)}</select></label><label className="wide">Purpose<input value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)}/></label><label className="wide">Optional savings collateral<select value={pledgedSavingsId} onChange={(e) => setPledgedSavingsId(e.target.value)}><option value="">No pledged savings</option>{(overview?.savings ?? []).filter((row) => ["ACTIVE","MATURED"].includes(row.status)).map((row) => <option key={row.id} value={row.id}>{row.name} · {money(row.principalMinor, row.currency)}</option>)}</select></label><button className="pay-v4-primary" disabled={busy === "loan"}>Submit for partner review</button></form> : null}

            {mode === "pin" ? <form className="pay-v4-form" onSubmit={setPayPin}><label className="wide">BazID password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}/></label><label>New 6-digit Pay PIN<input required type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}/></label><button className="pay-v4-primary" disabled={pin.length !== 6 || busy === "pin"}>Set Pay PIN</button></form> : null}

            {mode === "bank" ? <form className="pay-v4-form" onSubmit={addBank}><label className="wide">Bank<select required value={bankCode} onChange={(e) => { setBankCode(e.target.value); setBankName(banks.find((row) => row.code === e.target.value)?.name ?? ""); }}><option value="">Select bank</option>{banks.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</select></label><label className="wide">10-digit account number<input required inputMode="numeric" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}/></label><div className="pay-v4-provider wide">{caps?.bankWithdrawals ? "Account ownership will be resolved through the configured payout provider." : "Bank withdrawals are not enabled until the regulated payout provider is configured."}</div><button className="pay-v4-primary" disabled={!caps?.bankWithdrawals || accountNumber.length !== 10 || !bankCode || busy === "bank"}>Verify & add bank</button></form> : null}

            {mode === "withdraw" ? <form className="pay-v4-form" onSubmit={withdraw}><label className="wide">Destination<select required value={withdrawBankId} onChange={(e) => setWithdrawBankId(e.target.value)}><option value="">Select verified bank</option>{(overview?.bankAccounts ?? []).map((row) => <option key={row.id} value={row.id}>{row.bankName} · {row.accountName} · ••••{row.accountNumberLast4}</option>)}</select></label><label>Amount<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/></label><label>Pay PIN<input required type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}/></label><button className="pay-v4-primary" disabled={!caps?.bankWithdrawals || !withdrawBankId || pin.length !== 6 || busy === "withdraw"}>Withdraw securely</button></form> : null}

            {mode === "support" ? <form className="pay-v4-form" onSubmit={createSupport}><label className="wide">Area<select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value as typeof supportCategory)}><option value="PAYMENT">Wallet / payment</option><option value="DRIVE">Drive</option><option value="GO">GO</option><option value="LOGISTICS">Logistics</option></select></label>{supportCategory === "DRIVE" ? <label className="wide">Linked Drive ride<select value={supportDriveRideId} onChange={(e) => setSupportDriveRideId(e.target.value)}><option value="">General Drive issue</option>{(driveWallet?.recentRides ?? []).map((row) => <option key={row.id} value={row.id}>{row.id.slice(0, 10)} · {label(row.status)} · {money(row.totalMinor, row.currency)}</option>)}</select></label> : null}<label className="wide">Linked Wallet transaction<select value={supportLedgerTransactionId} onChange={(e) => setSupportLedgerTransactionId(e.target.value)}><option value="">No transaction attached</option>{(driveWallet?.recentActivity ?? []).map((row) => <option key={row.id} value={row.transactionId}>{row.reference} · {label(row.kind)} · {money(row.amountMinor, row.currency)}</option>)}</select></label><label className="wide">Subject<input required minLength={3} value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)}/></label><label className="wide">What happened?<textarea required minLength={3} value={supportDescription} onChange={(e) => setSupportDescription(e.target.value)}/></label><div className="pay-v11-support-context wide">{supportDriveRideId ? <span>Ride attached: <b>{supportDriveRideId.slice(0, 14)}</b></span> : null}{supportLedgerTransactionId ? <span>Ledger transaction attached: <b>{supportLedgerTransactionId.slice(0, 14)}</b></span> : null}{!supportDriveRideId && !supportLedgerTransactionId ? <span>You can attach a Drive ride or Wallet transaction so Operations receives the exact canonical record.</span> : null}</div><button className="pay-v4-primary" disabled={busy === "support"}>Open Operations case</button></form> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function modeTitle(mode: Exclude<Mode, null>) {
  return {
    send: "Send money",
    request: "Request money",
    fund: "Add money",
    save: "Create fixed savings",
    loan: "Partner-backed credit",
    pin: "Pay security",
    bank: "Add verified bank",
    withdraw: "Withdraw to bank",
    support: "Contact Pay support",
  }[mode];
}

function ActivityList({ items, onSupport }: { items: Activity[]; onSupport?: (row: Activity) => void }) {
  return (
    <div className="pay-v4-activity">
      {items.length ? items.map((row) => (
        <article key={row.id}>
          <span className={row.direction === "IN" ? "in" : "out"}>{row.direction === "IN" ? "↓" : "↑"}</span>
          <div><strong>{row.description ?? label(row.kind)}</strong><small>{row.reference} · {new Date(row.createdAt).toLocaleString("en-NG")}</small>{onSupport ? <button className="pay-v11-inline-support" onClick={() => onSupport(row)}>Get help with this transaction</button> : null}</div>
          <b>{row.direction === "IN" ? "+" : "-"}{money(row.amountMinor, row.currency)}</b>
        </article>
      )) : <div className="pay-v4-empty">No wallet activity yet.</div>}
    </div>
  );
}
