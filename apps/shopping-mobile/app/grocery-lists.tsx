import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, EmptyState, Screen, SectionTitle, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { isSignedIn, signInWithBazId } from "@/lib/auth";

type GroceryItem = { id: string; label: string; quantity: number; checked: boolean };
type GroceryList = { id: string; name: string; items: GroceryItem[]; updatedAt: string };

export default function GroceryListsPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [name, setName] = useState("");
  const [itemDrafts, setItemDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const signed = await isSignedIn(); setSignedIn(signed); if (!signed) return;
    try { const body = await publicApi.get<{ lists: GroceryList[] }>("/v1/grocery/lists"); setLists(body.lists); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load grocery lists"); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function signIn() { const result = await signInWithBazId("/grocery-lists"); if (result.ok) await load(); }
  async function createList() { if (!name.trim()) return; setBusy(true); setError(""); try { await publicApi.post("/v1/grocery/lists", { name: name.trim() }); setName(""); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create list"); } finally { setBusy(false); } }
  async function addItem(listId: string) { const label = (itemDrafts[listId] ?? "").trim(); if (!label) return; setBusy(true); try { await publicApi.post(`/v1/grocery/lists/${encodeURIComponent(listId)}/items`, { label, quantity: 1 }); setItemDrafts((value) => ({ ...value, [listId]: "" })); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add item"); } finally { setBusy(false); } }
  async function toggle(listId: string, item: GroceryItem) { try { await publicApi.patch(`/v1/grocery/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(item.id)}`, { checked: !item.checked }); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update item"); } }
  async function remove(listId: string, itemId: string) { try { await publicApi.delete(`/v1/grocery/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove item"); } }

  return <Screen tabBarSafe={false}>
    <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.brand}>Grocery lists</Text></View>
    <SectionTitle eyebrow="Grocery" title="Reusable shopping lists" />
    <Text style={styles.intro}>Keep repeatable essentials under your BazID account, then match items to live grocery products when you are ready to shop.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {signedIn === false ? <Card style={styles.signIn}><Text style={styles.cardTitle}>BazID required</Text><Text style={styles.copy}>Sign in to keep lists private and synced to your Bazaara account.</Text><Button label="Continue with BazID" onPress={() => void signIn()} /></Card> : signedIn ? <>
      <Card style={styles.create}><Text style={styles.cardTitle}>New list</Text><View style={styles.row}><TextInput value={name} onChangeText={setName} placeholder="e.g. Weekly essentials" placeholderTextColor={colors.muted2} style={styles.input} /><View style={styles.button}><Pressable disabled={busy} onPress={() => void createList()} style={[styles.createButton, busy && styles.createButtonBusy]}><Text style={styles.createButtonText}>{busy ? "Creating…" : "Create"}</Text></Pressable></View></View></Card>
      {lists.length === 0 ? <EmptyState title="No grocery lists yet" message="Create a list for weekly staples, breakfast, school supplies or any repeat shop." /> : lists.map((list) => <Card key={list.id} style={styles.list}><Text style={styles.listTitle}>{list.name}</Text>{list.items.map((item) => <View key={item.id} style={styles.item}><Pressable onPress={() => void toggle(list.id, item)} style={[styles.check, item.checked && styles.checked]}><Text style={styles.checkText}>{item.checked ? "✓" : ""}</Text></Pressable><Text style={[styles.itemLabel, item.checked && styles.itemDone]}>{item.label} × {item.quantity}</Text><Pressable onPress={() => void remove(list.id, item.id)} hitSlop={8}><Text style={styles.remove}>×</Text></Pressable></View>)}<View style={styles.row}><TextInput value={itemDrafts[list.id] ?? ""} onChangeText={(value) => setItemDrafts((current) => ({ ...current, [list.id]: value }))} onSubmitEditing={() => void addItem(list.id)} placeholder="Add an item" placeholderTextColor={colors.muted2} style={styles.input} /><Pressable onPress={() => void addItem(list.id)} style={styles.add}><Text style={styles.addText}>+</Text></Pressable></View></Card>)}
    </> : <Text style={styles.copy}>Checking BazID…</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: colors.muted, fontSize: 12, fontWeight: "800" }, brand: { color: colors.text, fontSize: 15, fontWeight: "900" }, intro: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 12 }, error: { color: "#FCA5A5", marginBottom: 8, fontSize: 11 }, signIn: { gap: 10 }, create: { gap: 8, marginBottom: 10 }, cardTitle: { color: colors.text, fontSize: 14, fontWeight: "900" }, copy: { color: colors.muted, fontSize: 10.5, lineHeight: 16 }, row: { flexDirection: "row", alignItems: "center", gap: 7 }, input: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, paddingHorizontal: 10, backgroundColor: colors.card, color: colors.text, fontSize: 12 }, button: { width: 88 }, createButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#D946EF", borderWidth: 1, borderColor: "#FF65D8" }, createButtonBusy: { opacity: 0.58 }, createButtonText: { color: colors.white, fontSize: 11, fontWeight: "900" }, list: { gap: 8, marginBottom: 10 }, listTitle: { color: colors.text, fontSize: 15, fontWeight: "900" }, item: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, borderBottomColor: colors.border }, check: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: colors.borderStrong }, checked: { backgroundColor: colors.green, borderColor: colors.green }, checkText: { color: colors.white, fontWeight: "900" }, itemLabel: { flex: 1, color: colors.text, fontSize: 11 }, itemDone: { color: colors.muted2, textDecorationLine: "line-through" }, remove: { color: colors.muted, fontSize: 20 }, add: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#D946EF" }, addText: { color: colors.white, fontSize: 22, fontWeight: "900" },
});
