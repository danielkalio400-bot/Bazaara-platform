import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Screen, colors } from "@bazaara/mobile-ui";

const SHOPPING_WEB = (process.env.EXPO_PUBLIC_SHOPPING_WEB_BASE_URL ?? "http://10.0.2.2:3003").replace(/\/$/, "");

export default function BazLensPage() {
  const [busy, setBusy] = useState(false);

  async function openLens() {
    setBusy(true);
    try {
      await WebBrowser.openBrowserAsync(`${SHOPPING_WEB}/bazlens`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
        <View><Text style={styles.eyebrow}>SHOPPING</Text><Text style={styles.title}>Baz Lens</Text></View>
      </View>
      <View style={styles.card}>
        <View style={styles.camera}><View style={styles.lens} /></View>
        <Text style={styles.cardTitle}>Visual shopping search</Text>
        <Text style={styles.copy}>Use the same Baz Lens experience as Shopping Web to identify a product from a photo and find matching catalogue items.</Text>
        <Pressable disabled={busy} accessibilityRole="button" onPress={() => void openLens()} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? "Opening Baz Lens…" : "Open Baz Lens"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { color: colors.text, fontSize: 40, lineHeight: 42 },
  eyebrow: { color: colors.orange, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, lineHeight: 32, fontWeight: "900" },
  card: { alignItems: "center", padding: 22, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  camera: { width: 70, height: 54, borderWidth: 4, borderColor: colors.indigoBright, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  lens: { width: 25, height: 25, borderWidth: 4, borderColor: colors.indigoBright, borderRadius: 15 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: 8 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  button: { width: "100%", minHeight: 48, marginTop: 18, borderRadius: 12, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
});
