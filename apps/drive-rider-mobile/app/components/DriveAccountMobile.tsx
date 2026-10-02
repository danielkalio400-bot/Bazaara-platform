import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatDriveWalletAmount } from "../../src/lib/wallet-display";

type WalletBalance = {
  availableMinor: number;
  heldFareMinor: number;
  currency: string;
  status: string;
};

type Props = {
  signed: boolean;
  payWeb: string;
  wallet: WalletBalance | null;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
};

const menus: Record<string, string[][]> = {
  account: [
    ["Profile", "profile"], ["Payments", "payment"], ["Safety", "safety"],
    ["Saved places", "places"], ["Settings", "settings"], ["Drive Plus", "plus"],
    ["Promotions", "promos"], ["Family Profile", "family"], ["Work Profile", "work"],
    ["Earn with BAZAARA", "earn"], ["Help & support", "support"],
  ],
  settings: [
    ["Communication", "communication"], ["Calendar", "generic"], ["Language", "generic"],
    ["Privacy", "generic"], ["Sign in and security", "security"], ["Legal", "legal"],
  ],
  safety: [["Pick-up code", "generic"], ["Trusted contacts", "generic"]],
  places: [["Add home address", "generic"], ["Add work address", "generic"], ["Add a place", "generic"]],
  communication: [
    ["Promotions & Tips", "generic"], ["BAZAARA products", "generic"],
    ["Travelling", "generic"], ["Partner offers", "generic"], ["Suggestions", "generic"],
  ],
  legal: [
    ["Accessibility Commitment", "generic"], ["Terms and Conditions", "generic"],
    ["Acknowledgements", "generic"], ["Privacy Notice", "generic"],
  ],
};

const titles: Record<string, string> = {
  account: "Account", profile: "Profile", payment: "Payments", safety: "Safety",
  places: "Saved places", settings: "Settings", communication: "Communication preferences",
  security: "Sign in and security", legal: "Legal", plus: "Drive Plus",
  family: "Family Profile", work: "Work Profile", earn: "Earn with BAZAARA",
  support: "Support", generic: "BAZAARA Drive",
};

export default function DriveAccountMobile({
  signed, payWeb, wallet, onLogin, onLogout, onRefresh,
}: Props) {
  const [screen, setScreen] = useState("account");
  const [walletError, setWalletError] = useState("");

  async function openWallet() {
    if (!signed) { onLogin(); return; }
    setWalletError("");
    try {
      // Real Wallet funding is handled by the existing BAZAARA Pay app.
      // We link to that flow, rather than pretending to take payments here.
      await Linking.openURL(`${payWeb.replace(/\/$/, "")}/?section=drive`);
    } catch {
      setWalletError("BAZAARA Wallet could not be opened. Try again or open BAZAARA Pay directly.");
    }
  }

  function go(id: string) {
    if (id === "payment") { void openWallet(); return; }
    setScreen(id);
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {screen !== "account" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Account" onPress={() =>
          setScreen(["communication", "security", "legal", "generic"].includes(screen) ? "settings" : "account")
        }><Text style={s.back}>←</Text></Pressable>
      ) : null}
      <Text style={s.title}>{titles[screen] || "Account"}</Text>

      {screen === "account" ? <>
        <View style={s.profile}>
          <View style={s.avatar}><Text style={s.avatarText}>◎</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bold}>{signed ? "Your account" : "Sign in to Drive"}</Text>
            <Text style={s.muted}>Profile, payments and ride preferences</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={signed ? onLogout : onLogin}>
            <Text style={s.link}>{signed ? "Sign out" : "Sign in"}</Text>
          </Pressable>
        </View>

        <View style={s.walletCard} accessibilityLabel="BAZAARA WALLET funding and available balance">
          <Text style={s.walletEyebrow}>BAZAARA WALLET · DRIVE</Text>
          {signed ? <>
            <Text style={s.walletAmount} accessibilityLabel="Available wallet balance">
              {wallet ? formatDriveWalletAmount(wallet.availableMinor, wallet.currency) : "Balance unavailable"}
            </Text>
            <Text style={s.walletCaption}>{wallet ? "Available for rides" : "Refresh to load your Wallet balance."}</Text>
            {wallet && wallet.heldFareMinor > 0 ? (
              <Text style={s.walletHeld}>Fare holds: {formatDriveWalletAmount(wallet.heldFareMinor, wallet.currency)}</Text>
            ) : null}
            {wallet && wallet.status !== "ACTIVE" ? (
              <Text style={s.walletStatus}>Wallet status: {wallet.status}. Funding may be limited.</Text>
            ) : null}
            <View style={s.walletActions}>
              <Pressable style={s.fundButton} accessibilityRole="button"
                accessibilityLabel="Add money in BAZAARA Wallet" onPress={() => void openWallet()}>
                <Text style={s.fundButtonText}>Add money in BAZAARA Wallet</Text>
              </Pressable>
              <Pressable style={s.refreshButton} accessibilityRole="button"
                accessibilityLabel="Refresh Wallet balance" onPress={onRefresh}>
                <Text style={s.refreshText}>Refresh</Text>
              </Pressable>
            </View>
          </> : <>
            <Text style={s.walletCaption}>Sign in to view your Wallet balance and fund a ride.</Text>
            <Pressable style={s.fundButton} accessibilityRole="button" onPress={onLogin}>
              <Text style={s.fundButtonText}>Sign in to Wallet</Text>
            </Pressable>
          </>}
          {walletError ? <Text accessibilityLiveRegion="polite" style={s.walletError}>{walletError}</Text> : null}
        </View>
      </> : null}

      {menus[screen]?.map(([label, id]) => (
        <Pressable key={label} style={s.row} accessibilityRole="button" onPress={() => go(id)}>
          <Text style={s.icon}>◇</Text>
          <Text style={s.label}>{label}</Text>
          <Text style={s.arrow}>›</Text>
        </Pressable>
      ))}
      {screen === "profile" ? <>
        <View style={s.photo}><Text style={s.avatarText}>◎</Text></View>
        <Text style={s.center}>Drivers can only see your photo during pickup</Text>
        {["Name · BAZAARA rider", "Phone number · Managed by BazID", "Email · Managed by BazID", "Identity · Verify with BazID"].map(label => (
          <View style={s.row} key={label}><Text style={s.label}>{label}</Text><Text style={s.arrow}>›</Text></View>
        ))}
      </> : null}
      {screen === "security" ? <>
        <View style={s.card}>
          <Text style={s.head}>Passkeys</Text>
          <Text style={s.link}>Set up your passkeys</Text>
          <Text style={s.muted}>Use a supported device passkey for secure sign-in.</Text>
        </View>
        <View style={s.card}>
          <Text style={s.head}>Two-step verification</Text>
          <Text style={s.muted}>Add another verification step through BazID.</Text>
        </View>
      </> : null}
      {screen === "plus" ? <View style={s.card}>
        <Text style={s.head}>BAZAARA Drive+</Text>
        {["Ride rewards", "Priority matching when available", "Flexible cancellation benefits", "Pause anytime"].map(label =>
          <Text style={s.perk} key={label}>✓  {label}</Text>
        )}
      </View> : null}
      {["family", "work"].includes(screen) ? <View style={s.card}>
        <Text style={s.head}>{screen === "family" ? "Keep your family connected" : "Expense your work rides with ease"}</Text>
        <Text style={s.muted}>{screen === "family" ?
          "Manage family ride visibility and shared payment preferences." :
          "Separate business rides, receipts and payment methods."}</Text>
      </View> : null}
      {screen === "earn" ? <View style={s.card}>
        <Pressable style={s.row}><Text style={s.label}>Become a BAZAARA driver</Text><Text style={s.arrow}>›</Text></Pressable>
        <Pressable style={s.row}><Text style={s.label}>Become a BAZAARA courier</Text><Text style={s.arrow}>›</Text></Pressable>
      </View> : null}
      {screen === "support" ? <View style={s.card}>
        <Text style={s.head}>What can we help with?</Text>
        {["I need help with a ride", "Contact a support agent", "Browse help articles", "Cases"].map(label => (
          <Pressable style={s.row} key={label}><Text style={s.label}>{label}</Text><Text style={s.arrow}>›</Text></Pressable>
        ))}
      </View> : null}
      {screen === "generic" ? <View style={s.card}>
        <Text style={s.head}>BAZAARA account preference</Text>
        <Text style={s.muted}>This preference will use the connected platform service when available.</Text>
      </View> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 25, paddingBottom: 90 },
  back: { fontSize: 32, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: "800", marginBottom: 28, color: "#17231e" },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#e8ece9" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#eef2ef", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30 },
  bold: { fontSize: 16, fontWeight: "800" },
  muted: { fontSize: 13, color: "#6e7872", lineHeight: 19, marginTop: 4 },
  link: { color: "#176c54", fontWeight: "800", paddingVertical: 8 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: 1, borderBottomColor: "#e9edeb" },
  icon: { fontSize: 24, color: "#65736c" },
  label: { fontSize: 17, flex: 1, color: "#202a25" },
  arrow: { fontSize: 27, color: "#919b96" },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eef2ef", alignSelf: "center", alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center", color: "#6e7872", marginVertical: 18 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginVertical: 8, borderWidth: 1, borderColor: "#edf0ee" },
  head: { fontSize: 24, fontWeight: "800", marginBottom: 12, color: "#17231e" },
  perk: { fontSize: 16, paddingVertical: 12 },
  walletCard: { backgroundColor: "#ecf7f0", borderColor: "#b7dfca", borderWidth: 1, borderRadius: 20, padding: 19, marginVertical: 16, gap: 9 },
  walletEyebrow: { color: "#17654a", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  walletAmount: { color: "#172b22", fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  walletCaption: { color: "#456e5a", fontSize: 13, lineHeight: 19 },
  walletHeld: { color: "#425c50", fontSize: 13 },
  walletStatus: { color: "#8a4b16", fontSize: 13, lineHeight: 19 },
  walletActions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 6 },
  fundButton: { backgroundColor: "#166949", borderRadius: 10, paddingHorizontal: 15, minHeight: 44, alignItems: "center", justifyContent: "center" },
  fundButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  refreshButton: { borderColor: "#448168", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 44, alignItems: "center", justifyContent: "center" },
  refreshText: { color: "#17583e", fontSize: 13, fontWeight: "800" },
  walletError: { color: "#a2262a", fontSize: 12, lineHeight: 18 },
});
