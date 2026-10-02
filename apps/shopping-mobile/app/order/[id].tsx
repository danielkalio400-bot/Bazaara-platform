import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Field, Screen, SectionTitle, Status, colors } from "@bazaara/mobile-ui";
import { publicApi } from "@/lib/api";
import { type ShoppingOrder, money } from "@/lib/types";

type OrderReturn = NonNullable<ShoppingOrder["returns"]>[number];

export default function OrderPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<ShoppingOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [disputeReturnId, setDisputeReturnId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");

  async function load() {
    if (!id) return;
    try {
      const body = await publicApi.get<{ order: ShoppingOrder }>(`/v1/shopping/orders/${encodeURIComponent(id)}`);
      setOrder(body.order);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order");
    }
  }

  useEffect(() => { void load(); }, [id]);

  const allItems = useMemo(() => order?.sellerOrders.flatMap((seller) => seller.items.map((item) => ({ ...item, sellerOrderId: seller.id, sellerName: seller.seller.name }))) ?? [], [order]);

  function toggleItem(itemId: string) {
    setSelected((value) => ({ ...value, [itemId]: !value[itemId] }));
    setQuantities((value) => ({ ...value, [itemId]: value[itemId] ?? 1 }));
  }

  function changeQuantity(itemId: string, max: number, delta: number) {
    setQuantities((value) => ({ ...value, [itemId]: Math.max(1, Math.min(max, (value[itemId] ?? 1) + delta)) }));
  }

  async function submitReturn() {
    if (!order) return;
    const items = allItems.filter((item) => selected[item.id]).map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] ?? 1 }));
    if (!items.length) { setError("Select at least one item to return."); return; }
    if (reason.trim().length < 3) { setError("Enter a return reason."); return; }
    setBusy(true); setError("");
    try {
      const body = await publicApi.post<{ order: ShoppingOrder }>(`/v1/shopping/orders/${encodeURIComponent(order.id)}/returns`, {
        reason: reason.trim(),
        details: details.trim() || undefined,
        items,
        evidence: evidenceUrl.trim() ? [{ type: "PHOTO", url: evidenceUrl.trim(), note: "Customer return evidence" }] : undefined,
      });
      setOrder(body.order);
      setReturnOpen(false); setSelected({}); setQuantities({}); setReason(""); setDetails(""); setEvidenceUrl("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not request return"); } finally { setBusy(false); }
  }

  async function submitDispute(returnCase: OrderReturn) {
    if (disputeReason.trim().length < 3) { setError("Enter a dispute reason."); return; }
    setBusy(true); setError("");
    try {
      await publicApi.post(`/v1/shopping/returns/${encodeURIComponent(returnCase.id)}/disputes`, { reason: disputeReason.trim(), details: disputeDetails.trim() || undefined });
      setDisputeReturnId(null); setDisputeReason(""); setDisputeDetails("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not open dispute"); } finally { setBusy(false); }
  }

  if (!order) return <Screen><Text style={styles.muted}>{error || "Loading order…"}</Text></Screen>;
  const returns = order.returns ?? [];

  return <Screen>
    <SectionTitle eyebrow={`Order ${order.orderNumber}`} title={order.status.replaceAll("_", " ")} action={<Status label={order.paymentStatus.replaceAll("_", " ")} kind={order.paymentStatus === "PAID" ? "success" : "neutral"} />} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Card><Text style={styles.total}>{money(order.totalMinor, order.currency)}</Text><Text style={styles.muted}>Placed {new Date(order.placedAt).toLocaleString("en-NG")}</Text><Text style={styles.muted}>Delivery · {order.deliveryMode === "SCHEDULED" && order.scheduledFor ? `Scheduled for ${new Date(order.scheduledFor).toLocaleString("en-NG")}` : order.deliveryMode.toLowerCase().replace(/^./, (value) => value.toUpperCase())}</Text></Card>
    {order.sellerOrders.map((seller) => <Card key={seller.id} style={styles.sellerCard}><Text style={styles.seller}>{seller.seller.name}</Text>{seller.items.map((item) => <View key={item.id} style={styles.line}><Text style={styles.item}>{item.productTitle} · {item.variantTitle} × {item.quantity}</Text><Text style={styles.value}>{money(item.lineTotalMinor, order.currency)}</Text></View>)}</Card>)}
    {order.status === "DELIVERED" ? <View style={styles.actionBlock}><Button label={returnOpen ? "Close return form" : "Request return"} kind="secondary" onPress={() => setReturnOpen((value) => !value)} /></View> : null}
    {returnOpen ? <Card style={styles.returnCard}><Text style={styles.heading}>Request a return</Text><Text style={styles.muted}>Select items from one seller per return request.</Text>{allItems.map((item) => <View key={item.id} style={styles.returnItem}><Pressable onPress={() => toggleItem(item.id)} style={[styles.check, selected[item.id] && styles.checkActive]} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(selected[item.id]) }}><Text style={styles.checkText}>{selected[item.id] ? "✓" : ""}</Text></Pressable><View style={styles.returnCopy}><Text style={styles.itemTitle}>{item.productTitle}</Text><Text style={styles.muted}>{item.sellerName} · up to {item.quantity}</Text></View>{selected[item.id] ? <View style={styles.qty}><Pressable onPress={() => changeQuantity(item.id, item.quantity, -1)} style={styles.qtyButton}><Text style={styles.qtyText}>−</Text></Pressable><Text style={styles.qtyValue}>{quantities[item.id] ?? 1}</Text><Pressable onPress={() => changeQuantity(item.id, item.quantity, 1)} style={styles.qtyButton}><Text style={styles.qtyText}>+</Text></Pressable></View> : null}</View>)}<Field label="Reason" value={reason} onChangeText={setReason} placeholder="Damaged, wrong item, changed mind…" maxLength={120}/><Field label="Details" value={details} onChangeText={setDetails} placeholder="Describe the issue" multiline maxLength={1000}/><Field label="Evidence URL (optional)" value={evidenceUrl} onChangeText={setEvidenceUrl} autoCapitalize="none" keyboardType="url" placeholder="https://…"/><Button label={busy ? "Submitting…" : "Submit return request"} loading={busy} onPress={() => void submitReturn()} /></Card> : null}
    {returns.length ? <View style={styles.returnHistory}><Text style={styles.heading}>Returns & refunds</Text>{returns.map((returnCase) => { const openDispute = returnCase.disputes.find((dispute) => ["OPEN", "UNDER_REVIEW"].includes(dispute.status)); const canDispute = ["REJECTED", "PARTIALLY_REFUNDED", "REFUND_PENDING", "REFUNDED"].includes(returnCase.status) && !openDispute; return <Card key={returnCase.id} style={styles.returnCard}><View style={styles.returnHead}><View style={styles.returnCopy}><Status label={returnCase.status.replaceAll("_", " ")} kind={returnCase.status === "REFUNDED" ? "success" : returnCase.status === "REJECTED" ? "danger" : "neutral"}/><Text style={styles.itemTitle}>{returnCase.reason}</Text><Text style={styles.muted}>Requested {new Date(returnCase.requestedAt).toLocaleString("en-NG")}</Text></View><Text style={styles.refundAmount}>{money(returnCase.approvedRefundMinor ?? returnCase.requestedRefundMinor ?? 0, order.currency)}</Text></View>{returnCase.returnTrackingId ? <Text style={styles.muted}>{returnCase.returnCarrier ?? "Carrier"} · {returnCase.returnTrackingId}</Text> : null}{returnCase.refunds.map((refund) => <Text key={refund.id} style={styles.muted}>{refund.status.replaceAll("_", " ")} · {money(refund.amountMinor, order.currency)}</Text>)}{openDispute ? <View style={styles.disputeState}><Text style={styles.itemTitle}>Dispute {openDispute.status.replaceAll("_", " ")}</Text><Text style={styles.muted}>{openDispute.reason}</Text></View> : null}{canDispute ? <Button label={disputeReturnId === returnCase.id ? "Close dispute form" : "Dispute return decision"} kind="secondary" onPress={() => setDisputeReturnId((value) => value === returnCase.id ? null : returnCase.id)} /> : null}{disputeReturnId === returnCase.id ? <View style={styles.disputeForm}><Field label="Dispute reason" value={disputeReason} onChangeText={setDisputeReason} maxLength={160}/><Field label="Details" value={disputeDetails} onChangeText={setDisputeDetails} multiline maxLength={1200}/><Button label="Submit dispute" loading={busy} onPress={() => void submitDispute(returnCase)} /></View> : null}</Card>; })}</View> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  muted: { color: colors.muted, marginTop: 6 },
  error: { color: "#FCA5A5", marginBottom: 8 },
  total: { color: colors.orange, fontWeight: "900", fontSize: 26 },
  sellerCard: { marginTop: 10 },
  seller: { color: colors.text, fontWeight: "900", marginBottom: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border },
  item: { color: colors.muted, flex: 1, lineHeight: 18 },
  value: { color: colors.text, fontWeight: "800" },
  actionBlock: { marginTop: 12 },
  returnCard: { marginTop: 10, gap: 10 },
  heading: { color: colors.text, fontWeight: "900", fontSize: 16 },
  returnItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  check: { width: 28, height: 28, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  checkActive: { backgroundColor: colors.indigo, borderColor: colors.indigoBright },
  checkText: { color: colors.white, fontWeight: "900" },
  returnCopy: { flex: 1, minWidth: 0 },
  itemTitle: { color: colors.text, fontWeight: "800", fontSize: 12 },
  qty: { flexDirection: "row", alignItems: "center", gap: 7 },
  qtyButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  qtyText: { color: colors.text, fontSize: 18, fontWeight: "800" },
  qtyValue: { color: colors.text, minWidth: 18, textAlign: "center", fontWeight: "800" },
  returnHistory: { marginTop: 16, gap: 4 },
  returnHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  refundAmount: { color: colors.orange, fontWeight: "900", fontSize: 13 },
  disputeState: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(249,115,22,.4)", backgroundColor: "rgba(249,115,22,.08)" },
  disputeForm: { gap: 8 },
});
