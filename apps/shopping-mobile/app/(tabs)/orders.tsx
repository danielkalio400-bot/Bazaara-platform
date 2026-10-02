import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Card, EmptyState, Screen, SectionTitle, Status, colors } from "@bazaara/mobile-ui";
import { publicApi, ApiError } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";
import { type ShoppingOrder, money } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<ShoppingOrder[]>([]); const [signedIn, setSignedIn] = useState<boolean | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const signed = await isSignedIn(); setSignedIn(signed); if (!signed) return; try { const body = await publicApi.get<{ orders: ShoppingOrder[] }>("/v1/shopping/orders"); setOrders(body.orders); setError(""); } catch (e) { if (e instanceof ApiError && e.status === 401) setSignedIn(false); else setError(e instanceof Error ? e.message : "Could not load orders"); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function signIn() { setBusy(true); try { const result = await signInWithBazId(); if (result.ok) await load(); } catch (e) { setError(e instanceof Error ? e.message : "BazID sign-in failed"); } finally { setBusy(false); } }
  return <Screen><SectionTitle eyebrow="BazID account" title="Your orders" />{error ? <Text style={styles.error}>{error}</Text> : null}{signedIn === null ? <Text style={styles.muted}>Checking BazID…</Text> : !signedIn ? <EmptyState title="Sign in to view orders" message="Order history is attached to your BazID account across Shopping." action={<Button label="Continue with BazID" loading={busy} onPress={() => void signIn()} />} /> : orders.length === 0 ? <EmptyState title="No orders yet" message="Your Shopping orders will appear here after checkout." action={<Button label="Start shopping" onPress={() => router.push("/(tabs)")} />} /> : <View style={styles.list}>{orders.map((order) => <Pressable key={order.id} onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } })}><Card><View style={styles.head}><View><Text style={styles.orderNo}>{order.orderNumber}</Text><Text style={styles.date}>{new Date(order.placedAt).toLocaleString("en-NG")}</Text></View><Status label={order.status.replaceAll("_", " ")} kind={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "accent"} /></View><Text style={styles.total}>{money(order.totalMinor, order.currency)}</Text></Card></Pressable>)}</View>}</Screen>;
}
const styles = StyleSheet.create({ list: { gap: 10 }, head: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, orderNo: { color: colors.text, fontWeight: "900" }, date: { color: colors.muted2, fontSize: 11, marginTop: 4 }, total: { color: colors.orange, fontWeight: "900", fontSize: 19, marginTop: 14 }, muted: { color: colors.muted }, error: { color: "#FCA5A5", marginBottom: 10 } });
