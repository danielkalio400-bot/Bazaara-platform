import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Crypto from "expo-crypto";
import { payApi, ApiError } from "../src/lib/api";
import { isSignedIn, signInWithBazId, signOutNative } from "../src/lib/auth";

type Wallet = { id: string; currency: string; availableMinor: number };
type Profile = { payTag: string; pinSet: boolean; dailyTransferLimitMinor: number };
type Activity = {
  id: string;
  transactionId: string;
  kind: string;
  direction: "IN" | "OUT";
  amountMinor: number;
  currency: string;
  description: string | null;
  createdAt: string;
};
type Overview = {
  wallet: Wallet;
  profile: Profile;
  activity: Activity[];
  requests: Array<{
    id: string;
    requesterDisplayName: string;
    amountMinor: number;
    currency: string;
    note: string | null;
    status: string;
    payerUserId: string | null;
  }>;
};
type Caps = {
  externalFundingProviderConfigured: boolean;
  bankWithdrawals: boolean;
  p2pFeeBps?: number;
  p2pFeeMinMinor?: number;
  p2pFeeMaxMinor?: number;
  testMode?: boolean;
};
type DriveWallet = {
  wallet: { availableMinor: number; currency: string; status: string };
  heldFareMinor: number;
  activeRideCount: number;
  completedRideCount: number;
  completedSpendMinor: number;
  recentActivity: Array<{ id: string; transactionId: string; reference: string; kind: string; direction: "IN" | "OUT"; amountMinor: number; currency: string; description: string | null; createdAt: string }>;
  recentRides: Array<{ id: string; status: string; rideClass: string; totalMinor: number; currency: string; createdAt: string }>;
  driver?: {
    approvalStatus: string;
    earningsBalanceMinor: number;
    platformDebtMinor: number;
    payoutAvailableMinor: number;
    payWalletBalanceMinor: number;
    driveLedgerBalanceMinor: number;
    reconciled: boolean;
  } | null;
};

function money(value = 0, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export default function Home() {
  const { width } = useWindowDimensions();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [drive, setDrive] = useState<DriveWallet | null>(null);
  const [signed, setSigned] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"home" | "send" | "add" | "request">("home");
  const [notice, setNotice] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [driveBusy, setDriveBusy] = useState(false);
  const tablet = width >= 650;
  const payWeb = process.env.EXPO_PUBLIC_PAY_WEB_BASE_URL ?? "http://localhost:3010";
  const driveWeb = process.env.EXPO_PUBLIC_DRIVE_WEB_BASE_URL ?? "http://localhost:3009";

  const load = useCallback(async () => {
    try {
      const ok = await isSignedIn();
      setSigned(ok);
      if (!ok) {
        setOverview(null);
        setDrive(null);
        return;
      }
      const [walletResult, capabilityResult, driveResult] = await Promise.all([
        payApi.get<Overview>("/v1/pay/overview"),
        payApi.get<Caps>("/v1/pay/capabilities"),
        payApi.get<DriveWallet>("/v1/drive/wallet"),
      ]);
      setOverview(walletResult);
      setCaps(capabilityResult);
      setDrive(driveResult);
      setNotice("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setSigned(false);
        setOverview(null);
        setDrive(null);
      } else {
        setNotice(cause instanceof Error ? cause.message : "Could not load Wallet");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login() {
    try {
      await signInWithBazId("/");
      await load();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "BazID sign-in failed");
    }
  }

  async function addMoney() {
    try {
      if (!caps?.externalFundingProviderConfigured) {
        throw new Error("Card/bank funding is not configured on this server yet.");
      }
      const result = await payApi.post<{ checkoutUrl: string | null }>(
        "/v1/pay/funding-intents",
        {
          amountMinor: Math.round(Number(amount) * 100),
          currency: overview?.wallet.currency ?? "NGN",
          paymentMethod: "PAYSTACK_CARD",
        },
        { idempotencyKey: Crypto.randomUUID() },
      );
      if (result.checkoutUrl) await Linking.openURL(result.checkoutUrl);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not add money");
    }
  }

  async function send() {
    try {
      const resolved = await payApi.get<{ recipient: { walletId: string; displayName: string } }>(
        `/v1/pay/recipients/resolve?q=${encodeURIComponent(recipient)}`,
      );
      await payApi.post(
        "/v1/pay/transfers",
        {
          toWalletId: resolved.recipient.walletId,
          amountMinor: Math.round(Number(amount) * 100),
          currency: overview?.wallet.currency ?? "NGN",
          note,
          pin,
        },
        { idempotencyKey: Crypto.randomUUID() },
      );
      setNotice(`Sent ${money(Math.round(Number(amount) * 100))} to ${resolved.recipient.displayName}`);
      setRecipient("");
      setPin("");
      setNote("");
      setMode("home");
      await load();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Transfer failed");
    }
  }

  async function requestMoney() {
    try {
      const result = await payApi.post<{ request: { code: string } }>("/v1/pay/requests", {
        recipient: recipient || undefined,
        amountMinor: Math.round(Number(amount) * 100),
        currency: overview?.wallet.currency ?? "NGN",
        note,
      });
      setNotice(`Request created: ${result.request.code}`);
      setMode("home");
      await load();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not request money");
    }
  }

  function openDriveSupport() {
    const rideId = drive?.recentRides?.[0]?.id;
    const query = rideId ? `section=support&category=DRIVE&rideId=${encodeURIComponent(rideId)}` : "section=support&category=DRIVE";
    void Linking.openURL(`${payWeb}/?${query}`);
  }

  async function moveDriveEarnings() {
    if (!drive?.driver?.payoutAvailableMinor || !drive.driver.reconciled) return;
    setDriveBusy(true);
    try {
      await payApi.post(
        "/v1/drive/driver/payouts",
        { amountMinor: drive.driver.payoutAvailableMinor, currency: drive.wallet.currency },
        { idempotencyKey: `pay-mobile-drive-${Crypto.randomUUID()}` },
      );
      setNotice("Drive earnings moved to your BAZAARA Wallet.");
      await load();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not move Drive earnings");
    } finally {
      setDriveBusy(false);
    }
  }

  async function logout() {
    await signOutNative();
    setSigned(false);
    setOverview(null);
    setDrive(null);
  }

  if (!signed) {
    return (
      <SafeAreaView style={s.page}>
        <StatusBar style="light" />
        <View style={[s.auth, { maxWidth: tablet ? 620 : undefined }]}>
          <View style={s.logo}><Text style={s.logoText}>B</Text></View>
          <Text style={s.kicker}>WALLET</Text>
          <Text style={s.authTitle}>Your money,{"\n"}inside Bazaara.</Text>
          <Text style={s.copy}>Secure wallet, transfers, requests, Drive fare holds and driver earnings — connected to one BazID.</Text>
          <TouchableOpacity style={s.primary} onPress={() => void login()}><Text style={s.primaryText}>Continue with BazID</Text></TouchableOpacity>
          {notice ? <Text style={s.notice}>{notice}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load().finally(() => setRefreshing(false)); }} />}
        contentContainerStyle={[s.wrap, { maxWidth: tablet ? 760 : undefined, alignSelf: "center", width: "100%" }]}
      >
        <View style={s.top}>
          <Text style={s.brand}>BAZAARA <Text style={s.brandAccent}>WALLET</Text></Text>
          <TouchableOpacity onPress={() => void logout()}><Text style={s.topLink}>Sign out</Text></TouchableOpacity>
        </View>

        <View style={s.wallet}>
          <View style={s.walletTop}><Text style={s.kicker}>AVAILABLE BALANCE</Text><Text style={s.tag}>@{overview?.profile.payTag}</Text></View>
          <Text style={s.balance}>{money(overview?.wallet.availableMinor, overview?.wallet.currency)}</Text>
          <Text style={s.walletSub}>{overview?.profile.pinSet ? "6-digit Pay PIN active" : "Set a Pay PIN on Wallet Web before sending money"}</Text>
        </View>

        <View style={s.actions}>
          <Action label="Add" symbol="＋" onPress={() => setMode("add")} />
          <Action label="Send" symbol="↗" onPress={() => setMode("send")} />
          <Action label="Request" symbol="↙" onPress={() => setMode("request")} />
          <Action label="Bank" symbol="⇩" onPress={() => void Linking.openURL(payWeb)} />
          <Action label="Drive" symbol="D" onPress={() => void Linking.openURL(driveWeb)} />
          <Action label="Loans" symbol="◈" onPress={() => void Linking.openURL(payWeb)} />
        </View>

        {notice ? <View style={s.noticeBox}><Text style={s.notice}>{notice}</Text></View> : null}

        {mode !== "home" ? (
          <View style={s.panel}>
            <View style={s.panelHead}>
              <Text style={s.panelTitle}>{mode === "send" ? "Send money" : mode === "add" ? "Add money" : "Request money"}</Text>
              <TouchableOpacity onPress={() => setMode("home")}><Text style={s.close}>×</Text></TouchableOpacity>
            </View>
            {mode !== "add" ? <TextInput style={s.input} placeholder="@paytag, email or phone" placeholderTextColor="#686d64" value={recipient} onChangeText={setRecipient} /> : null}
            <TextInput style={s.input} placeholder="Amount" placeholderTextColor="#686d64" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            {mode !== "add" ? <TextInput style={s.input} placeholder="Note (optional)" placeholderTextColor="#686d64" value={note} onChangeText={setNote} /> : null}
            {mode === "send" ? <TextInput style={s.input} placeholder="6-digit Pay PIN" placeholderTextColor="#686d64" secureTextEntry keyboardType="number-pad" maxLength={6} value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, ""))} /> : null}
            <TouchableOpacity style={s.primary} onPress={() => void (mode === "send" ? send() : mode === "add" ? addMoney() : requestMoney())}>
              <Text style={s.primaryText}>{mode === "send" ? "Send securely" : mode === "add" ? "Continue to card payment" : "Create request"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.drivePanel}>
              <View style={s.panelHead}>
                <View><Text style={s.kicker}>DRIVE + WALLET</Text><Text style={s.sectionTitle}>One money rail</Text></View>
                <View style={s.inlineLinks}><TouchableOpacity onPress={() => void Linking.openURL(driveWeb)}><Text style={s.topLink}>Open Drive</Text></TouchableOpacity><TouchableOpacity onPress={openDriveSupport}><Text style={s.topLink}>Get help</Text></TouchableOpacity></View>
              </View>
              <View style={s.metricRow}>
                <Metric label="FARE HELD" value={money(drive?.heldFareMinor ?? 0, drive?.wallet.currency)} />
                <Metric label="RIDE SPEND" value={money(drive?.completedSpendMinor ?? 0, drive?.wallet.currency)} />
              </View>
              {drive?.recentRides?.[0] ? <TouchableOpacity style={s.driveContext} onPress={() => void Linking.openURL(`${payWeb}/?section=drive&rideId=${encodeURIComponent(drive.recentRides[0].id)}`)}><View><Text style={s.metricLabel}>LATEST DRIVE RIDE</Text><Text style={s.driveContextTitle}>{drive.recentRides[0].rideClass} · {drive.recentRides[0].status.replaceAll("_", " ")}</Text></View><Text style={s.topLink}>Wallet trace →</Text></TouchableOpacity> : null}
              {drive?.driver ? (
                <>
                  <View style={s.metricRow}>
                    <Metric label="DRIVER EARNINGS" value={money(drive.driver.earningsBalanceMinor, drive.wallet.currency)} />
                    <Metric label="READY TO MOVE" value={money(drive.driver.payoutAvailableMinor, drive.wallet.currency)} />
                  </View>
                  {!drive.driver.reconciled ? <Text style={s.warn}>Driver balance needs Finance reconciliation before payout.</Text> : null}
                  <TouchableOpacity
                    style={[s.primary, (!drive.driver.payoutAvailableMinor || !drive.driver.reconciled || driveBusy) && s.disabled]}
                    disabled={!drive.driver.payoutAvailableMinor || !drive.driver.reconciled || driveBusy}
                    onPress={() => void moveDriveEarnings()}
                  >
                    <Text style={s.primaryText}>{driveBusy ? "Moving earnings…" : "Move Drive earnings to Wallet"}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={s.walletSub}>{drive?.activeRideCount ?? 0} active · {drive?.completedRideCount ?? 0} completed rides</Text>
              )}
            </View>

            <View style={s.sectionHead}>
              <Text><Text style={s.kicker}>RECENT ACTIVITY</Text>{"\n"}<Text style={s.sectionTitle}>Wallet history</Text></Text>
              <TouchableOpacity onPress={() => void Linking.openURL(payWeb)}><Text style={s.topLink}>Open full Wallet</Text></TouchableOpacity>
            </View>
            <View style={s.panel}>
              {overview?.activity.length ? overview.activity.slice(0, 12).map((item) => (
                <View key={item.id} style={s.activity}>
                  <View style={[s.icon, item.direction === "IN" && s.iconIn]}><Text style={s.iconText}>{item.direction === "IN" ? "↓" : "↑"}</Text></View>
                  <View style={s.activityCopy}><Text style={s.activityTitle}>{item.kind.replaceAll("_", " ")}</Text><Text style={s.activitySub}>{item.description ?? "Wallet"}</Text></View>
                  <Text style={[s.activityAmount, item.direction === "IN" && s.good]}>{item.direction === "IN" ? "+" : "-"}{money(item.amountMinor, item.currency)}</Text>
                </View>
              )) : <Text style={s.empty}>No wallet activity yet.</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return <TouchableOpacity style={s.action} onPress={onPress}><View style={s.actionIcon}><Text style={s.actionSymbol}>{symbol}</Text></View><Text style={s.actionText}>{label}</Text></TouchableOpacity>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>;
}

const s = {
  page: { flex: 1, backgroundColor: "#071423" },
  wrap: { padding: 16, paddingBottom: 60, gap: 14 },
  top: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  brand: { color: "#fff", fontWeight: "900" as const, fontSize: 15, letterSpacing: -0.5 },
  brandAccent: { color: "#00C2B8" },
  topLink: { color: "#00C2B8", fontWeight: "800" as const, fontSize: 12 },
  wallet: { minHeight: 220, borderRadius: 28, padding: 22, backgroundColor: "#0B1B2C", borderWidth: 1, borderColor: "#16485A", justifyContent: "space-between" as const },
  walletTop: { flexDirection: "row" as const, justifyContent: "space-between" as const },
  kicker: { color: "#00C2B8", fontWeight: "900" as const, fontSize: 9, letterSpacing: 1.2 },
  tag: { color: "#A8BEC9", fontSize: 11 },
  balance: { color: "#fff", fontWeight: "900" as const, fontSize: 44, letterSpacing: -2.4 },
  walletSub: { color: "#8EA8B5", fontSize: 11, lineHeight: 17 },
  actions: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  action: { flexGrow: 1, flexBasis: "30%" as const, minHeight: 82, padding: 10, borderRadius: 17, borderWidth: 1, borderColor: "#173849", backgroundColor: "#0A1B29", justifyContent: "space-between" as const },
  actionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#0E3945", alignItems: "center" as const, justifyContent: "center" as const },
  actionSymbol: { color: "#00C2B8", fontSize: 19, fontWeight: "900" as const },
  actionText: { color: "#fff", fontWeight: "800" as const, fontSize: 11 },
  panel: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#22251F", backgroundColor: "#0D100C", gap: 10 },
  drivePanel: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: "#4A4100", backgroundColor: "#111005", gap: 12 },
  panelHead: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  panelTitle: { color: "#fff", fontWeight: "900" as const, fontSize: 22, letterSpacing: -0.8 },
  close: { color: "#00C2B8", fontSize: 28 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#282B24", backgroundColor: "#080A07", paddingHorizontal: 14, color: "#fff" },
  primary: { minHeight: 52, borderRadius: 15, backgroundColor: "#00C2B8", alignItems: "center" as const, justifyContent: "center" as const, marginTop: 4 },
  primaryText: { color: "#041519", fontWeight: "900" as const },
  disabled: { opacity: 0.4 },
  noticeBox: { padding: 12, borderRadius: 14, backgroundColor: "#102A36", borderWidth: 1, borderColor: "#275567" },
  notice: { color: "#9FE9E5", fontSize: 12, lineHeight: 18 },
  warn: { color: "#FCA5A5", fontSize: 11, lineHeight: 16 },
  inlineLinks: { flexDirection: "row" as const, gap: 12, alignItems: "center" as const },
  driveContext: { minHeight: 64, borderRadius: 15, padding: 12, borderWidth: 1, borderColor: "#1C5365", backgroundColor: "#0A2532", flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12 },
  driveContextTitle: { color: "#fff", fontSize: 12, fontWeight: "900" as const, marginTop: 4, textTransform: "capitalize" as const },
  metricRow: { flexDirection: "row" as const, gap: 8 },
  metric: { flex: 1, minHeight: 76, borderRadius: 15, padding: 11, borderWidth: 1, borderColor: "#193B4A", backgroundColor: "#081923", justifyContent: "space-between" as const },
  metricLabel: { color: "#7296A7", fontSize: 8, fontWeight: "900" as const, letterSpacing: 0.8 },
  metricValue: { color: "#fff", fontSize: 16, fontWeight: "900" as const },
  sectionHead: { flexDirection: "row" as const, alignItems: "flex-end" as const, justifyContent: "space-between" as const, marginTop: 4 },
  sectionTitle: { color: "#fff", fontWeight: "900" as const, fontSize: 24, letterSpacing: -1 },
  activity: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1B1D19" },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#1C1414", alignItems: "center" as const, justifyContent: "center" as const },
  iconIn: { backgroundColor: "#10241B" },
  iconText: { color: "#00C2B8", fontWeight: "900" as const, fontSize: 16 },
  activityCopy: { flex: 1, gap: 2 },
  activityTitle: { color: "#fff", fontWeight: "800" as const, fontSize: 12, textTransform: "capitalize" as const },
  activitySub: { color: "#767D72", fontSize: 10 },
  activityAmount: { color: "#F0DADA", fontWeight: "900" as const, fontSize: 12 },
  good: { color: "#86EFAC" },
  empty: { color: "#777E73", fontSize: 12 },
  auth: { flex: 1, alignSelf: "center" as const, width: "100%" as const, padding: 24, justifyContent: "center" as const, alignItems: "flex-start" as const, gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#00C2B8", alignItems: "center" as const, justifyContent: "center" as const },
  logoText: { color: "#041519", fontWeight: "900" as const, fontSize: 22 },
  authTitle: { color: "#fff", fontSize: 46, lineHeight: 45, fontWeight: "900" as const, letterSpacing: -2.5 },
  copy: { color: "#91A9B5", fontSize: 14, lineHeight: 21, maxWidth: 520 },
};
