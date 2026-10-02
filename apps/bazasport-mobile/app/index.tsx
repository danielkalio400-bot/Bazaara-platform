import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { createApiClient } from "@bazaara/api-client";
import type {
  SportsCompetitionContract,
  SportsFixtureContract,
} from "@bazaara/contracts";

type Fixture = SportsFixtureContract & { competition: SportsCompetitionContract };

// The same public, provider-ingested sports endpoints used by Bazasport Web.
// Physical devices must set EXPO_PUBLIC_API_BASE_URL to the developer PC's LAN URL.
const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  credentials: "omit",
});

function isLive(status: string) {
  return status.trim().toUpperCase() === "LIVE";
}

function fixtureDisplay(fixture: Fixture) {
  if (fixture.homeScore !== null && fixture.awayScore !== null) {
    return `${fixture.homeScore} – ${fixture.awayScore}`;
  }
  const date = new Date(fixture.startsAt);
  return Number.isNaN(date.getTime()) ? "Time pending" : date.toLocaleString();
}

export default function BazasportHome() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitions, setCompetitions] = useState<SportsCompetitionContract[]>([]);
  const [selectedSport, setSelectedSport] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fixtureData, competitionData] = await Promise.all([
        api.get<{ fixtures: Fixture[] }>("/v1/sport/fixtures"),
        api.get<{ competitions: SportsCompetitionContract[] }>("/v1/sport/competitions"),
      ]);
      setFixtures(fixtureData.fixtures);
      setCompetitions(competitionData.competitions);
      setError("");
    } catch (cause) {
      // Do not display invented fixtures or reuse a stale feed after an API error.
      setFixtures([]);
      setCompetitions([]);
      setError(cause instanceof Error ? cause.message : "The sports feed is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sports = useMemo(
    () => ["All", ...Array.from(new Set(competitions.map((item) => item.sport))).sort()],
    [competitions],
  );
  const visibleFixtures = useMemo(
    () => selectedSport === "All"
      ? fixtures
      : fixtures.filter((fixture) => fixture.competition.sport === selectedSport),
    [fixtures, selectedSport],
  );
  const liveCount = fixtures.filter((fixture) => isLive(fixture.status)).length;

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.wrap}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <Text style={styles.brand}>BAZASPORT</Text>
        <Text style={styles.heading}>Live now.</Text>
        <Text style={styles.lede}>
          Fixtures and scores from the connected BAZAARA sports API. Pull down to refresh.
        </Text>

        <View style={styles.summary}>
          <View>
            <Text style={styles.label}>LIVE EVENTS</Text>
            <Text style={styles.summaryValue}>{liveCount}</Text>
          </View>
          <View>
            <Text style={styles.label}>COMPETITIONS</Text>
            <Text style={styles.summaryValue}>{competitions.length}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Fixtures & scores</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh fixtures"
            onPress={() => void load()}
            disabled={loading}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.notice} accessibilityRole="alert">
            <Text style={styles.noticeText}>Unable to load fixtures: {error}</Text>
            <Text style={styles.noticeHint}>
              Check the Platform API and EXPO_PUBLIC_API_BASE_URL on your device.
            </Text>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport}
              accessibilityRole="button"
              accessibilityState={{ selected: sport === selectedSport }}
              onPress={() => setSelectedSport(sport)}
              style={[styles.filter, sport === selectedSport ? styles.filterSelected : null]}
            >
              <Text style={[styles.filterText, sport === selectedSport ? styles.filterTextSelected : null]}>
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && fixtures.length === 0 ? <ActivityIndicator color="#39FF14" size="large" /> : null}
        {!loading && !error && visibleFixtures.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.cardTitle}>No fixtures available</Text>
            <Text style={styles.muted}>
              No provider-ingested matches are available for this selection yet.
            </Text>
          </View>
        ) : null}

        {visibleFixtures.map((fixture) => (
          <View key={fixture.id} style={styles.card}>
            <Text style={styles.label}>
              {fixture.status.toUpperCase()} · {fixture.competition.name}
            </Text>
            <Text style={styles.cardTitle}>
              {fixture.homeName} vs {fixture.awayName}
            </Text>
            <Text style={styles.score}>{fixtureDisplay(fixture)}</Text>
            {fixture.clock ? <Text style={styles.muted}>{fixture.clock}</Text> : null}
          </View>
        ))}

        <Text style={styles.policy}>
          Bazasport displays connected sports data. Real-money wagering is disabled.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#041004" },
  wrap: { padding: 22, paddingBottom: 40, gap: 18 },
  brand: { color: "#39FF14", fontWeight: "900", letterSpacing: 2, fontSize: 13 },
  heading: { color: "#FFFFFF", fontWeight: "900", fontSize: 44, lineHeight: 50 },
  lede: { color: "#9ABD95", fontSize: 16, lineHeight: 24 },
  summary: { flexDirection: "row", justifyContent: "space-between", gap: 12, padding: 20, borderRadius: 22, backgroundColor: "#091A09" },
  label: { color: "#39FF14", fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
  summaryValue: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", marginTop: 6 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", flexShrink: 1 },
  refreshButton: { borderColor: "#39FF14", borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  refreshText: { color: "#39FF14", fontSize: 14, fontWeight: "800" },
  filters: { gap: 8, paddingVertical: 4 },
  filter: { borderWidth: 1, borderColor: "#214121", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  filterSelected: { backgroundColor: "#39FF14", borderColor: "#39FF14" },
  filterText: { color: "#B6CDB4", fontWeight: "700" },
  filterTextSelected: { color: "#041004" },
  card: { backgroundColor: "#091A09", borderColor: "#173817", borderWidth: 1, borderRadius: 22, padding: 20, gap: 10 },
  cardTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 20 },
  score: { color: "#FFFFFF", fontWeight: "900", fontSize: 25 },
  muted: { color: "#9ABD95", fontSize: 14, lineHeight: 21 },
  empty: { borderColor: "#214121", borderWidth: 1, borderRadius: 20, padding: 24, gap: 8 },
  notice: { borderColor: "#E9A949", borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  noticeText: { color: "#FFD9A3", fontSize: 15 },
  noticeHint: { color: "#9ABD95", fontSize: 13, lineHeight: 19 },
  policy: { color: "#7C9B78", fontSize: 12, lineHeight: 18, marginTop: 12 },
});
