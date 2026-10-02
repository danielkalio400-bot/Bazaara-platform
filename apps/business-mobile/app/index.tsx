import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { createApiClient } from "@bazaara/api-client";

const API =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:4000";

const BUSINESS_WEB =
  process.env.EXPO_PUBLIC_BUSINESS_WEB_BASE_URL ??
  "http://10.0.2.2:3001";

const api = createApiClient({
  baseUrl: API,
  credentials: "omit",
});

type Capabilities = {
  organizations?: boolean;
  branches?: boolean;
  team?: boolean;
  invoices?: boolean;
  settlements?: boolean;
  verticalRegistration?: boolean;
};

function Shortcut({
  label,
  caption,
  path,
  accent,
}: {
  label: string;
  caption: string;
  path: string;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void Linking.openURL(`${BUSINESS_WEB}${path}`)}
      style={[styles.shortcut, accent ? styles.shortcutAccent : null]}
    >
      <View style={styles.shortcutCopy}>
        <Text style={[styles.shortcutLabel, accent ? styles.darkText : null]}>
          {label}
        </Text>
        <Text
          style={[
            styles.shortcutCaption,
            accent ? styles.darkCaption : null,
          ]}
        >
          {caption}
        </Text>
      </View>
      <Text style={[styles.shortcutArrow, accent ? styles.darkText : null]}>
        →
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const [state, setState] =
    useState<"loading" | "ready" | "error">("loading");
  const [caps, setCaps] = useState<Capabilities>({});
  const [detail, setDetail] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const result =
        await api.get<Capabilities>("/v1/business/capabilities");
      setCaps(result);
      setDetail("");
      setState("ready");
    } catch (error) {
      setDetail(error instanceof Error ? error.message : String(error));
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={state === "loading"}
            onRefresh={() => void load()}
            tintColor="#B15CFF"
          />
        }
        contentContainerStyle={styles.wrap}
      >
        <View style={styles.brandRow}>
          <Text style={styles.brand}>BAZAARA</Text>
          <Text style={styles.brandAccent}>BUSINESS</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MERCHANT OPERATING SYSTEM</Text>
          <Text style={styles.h1}>
            Your business.
            {"\n"}
            One control room.
          </Text>
          <Text style={styles.p}>
            Orders, products and menus, branches, staff, finance and business
            verification remain organization-scoped.
          </Text>

          <View style={styles.healthRow}>
            <View
              style={[
                styles.healthDot,
                state !== "ready" ? styles.healthDotMuted : null,
              ]}
            />
            <Text style={styles.healthText}>
              Platform API {state === "ready" ? "connected" : state}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>VERTICALS</Text>
            <Text style={styles.statValue}>
              {caps.verticalRegistration ? "GATED" : "—"}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>TEAM</Text>
            <Text style={styles.statValue}>{caps.team ? "READY" : "—"}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>FINANCE</Text>
            <Text style={styles.statValue}>
              {caps.settlements && caps.invoices ? "READY" : "—"}
            </Text>
          </View>
        </View>

        {detail ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection issue</Text>
            <Text style={styles.errorText}>{detail}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Business command center</Text>

        <View style={styles.shortcutList}>
          <Shortcut
            label="Open Business"
            caption="The web surface shows only registered business types"
            path="/"
            accent
          />
          <Shortcut
            label="Create / manage catalogue"
            caption="Products, grocery catalogue, Food menu and Pharmacy stock"
            path="/"
          />
          <Shortcut
            label="Team & access"
            caption="Invite BazID staff and assign roles"
            path="/team"
          />
          <Shortcut
            label="Finance"
            caption="Settlements, fees and invoices"
            path="/finance"
          />
          <Shortcut
            label="Business settings"
            caption="Brand name, verification, branches and closure"
            path="/settings"
          />
          <Shortcut
            label="Add business type"
            caption="Register another vertical only when you need it"
            path="/register"
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Registered types stay private to the organization.</Text>
          <Text style={styles.noteText}>
            Native BazID session handoff is still the remaining step before
            mobile can render the organization-specific product and order data
            directly instead of opening the authenticated Business web surface.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#08040F",
  },
  wrap: {
    padding: 20,
    paddingBottom: 52,
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#B15CFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  hero: {
    borderWidth: 1,
    borderColor: "#2D1942",
    backgroundColor: "#12091F",
    borderRadius: 26,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: "#B15CFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  h1: {
    color: "#FFFFFF",
    fontSize: 37,
    lineHeight: 39,
    fontWeight: "900",
    letterSpacing: -1.7,
  },
  p: {
    color: "#BAADC6",
    fontSize: 14,
    lineHeight: 21,
  },
  healthRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#7C3CFF",
  },
  healthDotMuted: {
    opacity: 0.4,
  },
  healthText: {
    color: "#D9CDE4",
    fontSize: 12,
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flex: 1,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#21152F",
    backgroundColor: "#0E0816",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#806F90",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  shortcutList: {
    gap: 9,
  },
  shortcut: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: "#21152F",
    backgroundColor: "#0E0816",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  shortcutAccent: {
    backgroundColor: "#B15CFF",
    borderColor: "#B15CFF",
  },
  shortcutCopy: {
    flex: 1,
  },
  shortcutLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  shortcutCaption: {
    color: "#8E819A",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  shortcutArrow: {
    color: "#B15CFF",
    fontSize: 22,
    fontWeight: "800",
  },
  darkText: {
    color: "#13091C",
  },
  darkCaption: {
    color: "#432858",
  },
  errorCard: {
    borderWidth: 1,
    borderColor: "#5B263A",
    backgroundColor: "#1B0C13",
    borderRadius: 15,
    padding: 14,
    gap: 5,
  },
  errorTitle: {
    color: "#FFB6C9",
    fontWeight: "900",
  },
  errorText: {
    color: "#D994A6",
    fontSize: 12,
  },
  note: {
    borderWidth: 1,
    borderColor: "#241731",
    borderRadius: 16,
    padding: 14,
    gap: 5,
  },
  noteTitle: {
    color: "#DCCFE7",
    fontSize: 12,
    fontWeight: "900",
  },
  noteText: {
    color: "#776A82",
    fontSize: 11,
    lineHeight: 17,
  },
});
