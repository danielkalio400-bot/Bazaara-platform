"use client";

import { BusinessHeaderStandalone } from "../components/BusinessHeaderStandalone";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const api = createApiClient({ baseUrl: API, credentials: "include" });

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
async function req<T>(path: string, method: HttpMethod = "GET", body?: unknown) {
  return api.request<T>(path, { method, body });
}
function money(n: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n / 100);
}

type Slot = { id: string; startsAt: string; endsAt: string; capacity: number; reserved: number; active: boolean };
type Store = {
  id: string;
  name: string;
  status: string;
  fulfillmentModes: string[];
  merchant: string;
  config: {
    pickupEnabled?: boolean;
    expressEnabled?: boolean;
    scheduledEnabled?: boolean;
    pickerChatEnabled?: boolean;
    weightedItemsEnabled?: boolean;
    minimumOrderMinor?: number;
    maxActiveOrders?: number;
    prepMinutes?: number;
    freeDeliveryThresholdMinor?: number | null;
  } | null;
  slots: Slot[];
};
type Message = { id: string; senderUserId: string; kind: "TEXT" | "IMAGE"; text: string | null; mediaKey: string | null; createdAt: string };
type Outcome = {
  id: string;
  orderItemId: string;
  status: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  customerDecision: string;
  note?: string | null;
  actualWeightGrams?: number | null;
  finalUnitPriceMinor?: number | null;
  replacementVariantId?: string | null;
};
type OrderItem = { id: string; productTitle: string; variantTitle: string; quantity: number };
type Order = {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  deliveryMode: string;
  scheduledFor: string | null;
  totalMinor: number;
  currency: string;
  seller: string;
  store: { id: string; name: string };
  items: OrderItem[];
  picker: null | { id: string; status: string; outcomes: Outcome[]; messages: Message[] };
};
type ReplacementOption = {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantTitle: string;
  priceMinor: number;
  currency: string;
  availableQuantity: number;
};
type ItemDraft = { fulfilledQuantity: string; weightGrams: string; finalUnitPriceMinor: string; note: string; replacementQuery: string; replacementVariantId: string; replacementQuantity: string };

const emptyItemDraft: ItemDraft = {
  fulfilledQuantity: "1",
  weightGrams: "",
  finalUnitPriceMinor: "",
  note: "",
  replacementQuery: "",
  replacementVariantId: "",
  replacementQuantity: "1",
};

export default function GroceryOps() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [activeStore, setActiveStore] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [replacementOptions, setReplacementOptions] = useState<Record<string, ReplacementOption[]>>({});
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [orderResponse, storeResponse] = await Promise.all([
        req<{ orders: Order[] }>("/v1/business/grocery/orders"),
        req<{ stores: Store[] }>("/v1/business/grocery/stores"),
      ]);
      setOrders(orderResponse.orders);
      setStores(storeResponse.stores);
      setActiveStore((value) => value || storeResponse.stores[0]?.id || "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Grocery operations");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openOrders = useMemo(() => orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)), [orders]);

  function draftFor(item: OrderItem) {
    return drafts[item.id] ?? { ...emptyItemDraft, fulfilledQuantity: String(Math.max(1, item.quantity - 1)) };
  }
  function patchDraft(item: OrderItem, patch: Partial<ItemDraft>) {
    setDrafts((current) => ({ ...current, [item.id]: { ...draftFor(item), ...patch } }));
  }

  async function run(key: string, operation: () => Promise<unknown>, success?: string) {
    setBusy(key);
    setError("");
    try {
      await operation();
      if (success) setNotice(success);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Grocery operation could not be completed");
    } finally {
      setBusy("");
    }
  }

  async function updateOutcome(order: Order, item: OrderItem, status: "FOUND" | "PARTIAL" | "OUT_OF_STOCK" | "REPLACEMENT_PROPOSED") {
    const draft = draftFor(item);
    const body: Record<string, unknown> = { status, note: draft.note.trim() || undefined };
    if (status === "PARTIAL") body.fulfilledQuantity = Number(draft.fulfilledQuantity);
    if (status === "FOUND" || status === "PARTIAL") {
      if (draft.weightGrams) body.actualWeightGrams = Number(draft.weightGrams);
      if (draft.finalUnitPriceMinor) body.finalUnitPriceMinor = Number(draft.finalUnitPriceMinor);
    }
    if (status === "REPLACEMENT_PROPOSED") {
      body.replacementVariantId = draft.replacementVariantId;
      body.replacementQuantity = Number(draft.replacementQuantity || 1);
    }
    await run(`outcome:${item.id}`, () => req(`/v1/business/grocery/orders/${order.id}/items/${item.id}/outcome`, "PATCH", body));
  }

  async function searchReplacement(order: Order, item: OrderItem) {
    const query = draftFor(item).replacementQuery.trim();
    setBusy(`replacement:${item.id}`);
    try {
      const result = await req<{ options: ReplacementOption[] }>(`/v1/business/grocery/orders/${order.id}/replacement-options?q=${encodeURIComponent(query)}`);
      setReplacementOptions((current) => ({ ...current, [item.id]: result.options }));
      if (!result.options.length) setNotice("No in-stock replacement matches were found at this branch.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not find replacement options");
    } finally {
      setBusy("");
    }
  }

  async function sendMessage(order: Order) {
    const text = (chatDrafts[order.id] ?? "").trim();
    if (!text) return;
    await run(`chat:${order.id}`, async () => {
      await req(`/v1/business/grocery/orders/${order.id}/picker/messages`, "POST", { text });
      setChatDrafts((current) => ({ ...current, [order.id]: "" }));
    });
  }

  async function uploadPickerPhoto(order: Order, file: File) {
    if (!file.type.startsWith("image/")) { setError("Choose a JPG, PNG or WebP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Picker photos must be 10 MB or smaller."); return; }
    setBusy(`photo:${order.id}`);
    setError("");
    try {
      const reservation = await req<{ asset: { id: string; objectKey: string }; upload: { url: string; headers?: Record<string, string> } }>("/v1/media/uploads", "POST", {
        contentType: file.type,
        byteSize: file.size,
        visibility: "PRIVATE",
      });
      const uploaded = await fetch(reservation.upload.url, { method: "PUT", headers: reservation.upload.headers, body: file });
      if (!uploaded.ok) throw new Error("Photo upload failed. Please try again.");
      await req(`/v1/media/${reservation.asset.id}/complete`, "POST", {});
      await req(`/v1/business/grocery/orders/${order.id}/picker/messages`, "POST", { mediaKey: reservation.asset.objectKey });
      setNotice("Photo shared with the customer.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not share the picker photo");
    } finally {
      setBusy("");
    }
  }

  async function viewMessageImage(order: Order, message: Message) {
    setBusy(`image:${message.id}`);
    try {
      const result = await req<{ url: string }>(`/v1/business/grocery/orders/${order.id}/picker/messages/${message.id}/media`);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the image");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="shell grocery-business-v5">
      <BusinessHeaderStandalone active="grocery" /><div className="business-operation-subnav"><a className="active" href="/grocery">Picking & operations</a><a href="/grocery/products">Products</a><a href="/finance">Finance</a><a href="/team">Team</a></div>
      <main className="main">
        <section className="panel grocery-v54-business-rule" style={{ marginBottom: 14 }}>
          <div className="section-title">
            <div>
              <span className="eyebrow">BRANCH STOCK IS AUTHORITATIVE</span>
              <h2>Keep inventory true before customers shop.</h2>
              <p className="muted">Grocery availability comes from branch inventory. Checkout revalidates and reserves stock; pickers only create a substitution event when a reserved item cannot be found on shelf.</p>
            </div>
          </div>
        </section>
        <div className="title-row"><div><span className="eyebrow">GROCERY OPERATIONS</span><h1>Fresh-order control room</h1><p className="muted">Manage picking, customer-approved replacements, variable-weight pricing, conversations, capacity and scheduled delivery.</p></div></div>
        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        {notice ? <div className="notice-banner" role="status">{notice}</div> : null}
        <div className="kpi-grid">
          <div className="kpi">Open orders<strong>{openOrders.length}</strong><span>Needs operational attention</span></div>
          <div className="kpi">Picking now<strong>{openOrders.filter((order) => order.picker?.status === "PICKING").length}</strong><span>Active picker sessions</span></div>
          <div className="kpi">Branches<strong>{stores.length}</strong><span>Accessible Grocery stores</span></div>
          <div className="kpi">Reserved slots<strong>{stores.reduce((total, store) => total + store.slots.reduce((sum, slot) => sum + slot.reserved, 0), 0)}</strong><span>Scheduled reservations</span></div>
        </div>

        <section>
          <div className="section-title"><h2>Order queue</h2><span className="muted">Record what was actually picked. Customer approval is required for contact-me replacements.</span></div>
          {openOrders.length === 0 ? <div className="panel empty">No open Grocery orders.</div> : openOrders.map((order) => (
            <article className="panel" key={order.id} style={{ marginBottom: 18 }}>
              <div className="section-title">
                <div><span className="status">{order.picker?.status ?? order.status}</span><h3>{order.orderNumber} · {order.store.name}</h3><p className="muted">{order.deliveryMode.replaceAll("_", " ")} · {money(order.totalMinor, order.currency)}{order.scheduledFor ? ` · ${new Date(order.scheduledFor).toLocaleString("en-NG")}` : ""}</p></div>
                {!order.picker || order.picker.status === "QUEUED"
                  ? <button className="button" disabled={busy === `start:${order.id}`} onClick={() => void run(`start:${order.id}`, () => req(`/v1/business/grocery/orders/${order.id}/picking/start`, "POST", {}), "Picking started.")}>Start picking</button>
                  : <button className="button secondary" disabled={busy === `complete:${order.id}`} onClick={() => void run(`complete:${order.id}`, () => req(`/v1/business/grocery/orders/${order.id}/picking/complete`, "POST", {}), "Picking completed.")}>Complete picking</button>}
              </div>

              <div className="table-wrap"><table><thead><tr><th>Item</th><th>Requested</th><th>Outcome</th><th>Picker controls</th></tr></thead><tbody>{order.items.map((item) => {
                const outcome = order.picker?.outcomes.find((entry) => entry.orderItemId === item.id);
                const draft = draftFor(item);
                const options = replacementOptions[item.id] ?? [];
                return <tr key={item.id}><td><strong>{item.productTitle}</strong><br/><span className="muted">{item.variantTitle}</span></td><td>{item.quantity}</td><td>{outcome?.status ?? "PENDING"}{outcome?.customerDecision === "PENDING" ? <><br/><span className="muted">Awaiting customer</span></> : null}</td><td style={{ minWidth: 360 }}>
                  <div className="form-grid" style={{ marginBottom: 8 }}>
                    {item.quantity > 1 ? <label>Partial qty<input type="number" min="1" max={Math.max(1, item.quantity - 1)} value={draft.fulfilledQuantity} onChange={(event) => patchDraft(item, { fulfilledQuantity: event.target.value })}/></label> : null}
                    <label>Weight (g)<input type="number" min="1" placeholder="Optional" value={draft.weightGrams} onChange={(event) => patchDraft(item, { weightGrams: event.target.value })}/></label>
                    <label>Final unit price (minor)<input type="number" min="0" placeholder="Optional" value={draft.finalUnitPriceMinor} onChange={(event) => patchDraft(item, { finalUnitPriceMinor: event.target.value })}/></label>
                  </div>
                  <label>Picker note<input value={draft.note} maxLength={500} placeholder="Freshness, size or shortage note" onChange={(event) => patchDraft(item, { note: event.target.value })}/></label>
                  <div className="row-actions" style={{ marginTop: 8 }}>
                    <button className="button small" disabled={!order.picker || busy === `outcome:${item.id}`} onClick={() => void updateOutcome(order, item, "FOUND")}>Found</button>
                    {item.quantity > 1 ? <button className="button ghost small" disabled={!order.picker || busy === `outcome:${item.id}`} onClick={() => void updateOutcome(order, item, "PARTIAL")}>Partial</button> : null}
                    <button className="button ghost small" disabled={!order.picker || busy === `outcome:${item.id}`} onClick={() => void updateOutcome(order, item, "OUT_OF_STOCK")}>Out of stock</button>
                  </div>
                  {order.picker ? <details style={{ marginTop: 10 }}><summary>Propose replacement</summary><div className="form-grid" style={{ marginTop: 8 }}><label>Search this branch<input value={draft.replacementQuery} placeholder="Product or variant" onChange={(event) => patchDraft(item, { replacementQuery: event.target.value })}/></label><label>Replacement quantity<input type="number" min="1" max={item.quantity} value={draft.replacementQuantity} onChange={(event) => patchDraft(item, { replacementQuantity: event.target.value })}/></label><button type="button" className="button ghost" disabled={busy === `replacement:${item.id}`} onClick={() => void searchReplacement(order, item)}>Find options</button></div>{options.length ? <label style={{ display: "block", marginTop: 8 }}>In-stock replacement<select value={draft.replacementVariantId} onChange={(event) => patchDraft(item, { replacementVariantId: event.target.value })}><option value="">Choose an item</option>{options.map((option) => <option key={option.variantId} value={option.variantId}>{option.productTitle} · {option.variantTitle} · {money(option.priceMinor, option.currency)} · {option.availableQuantity} available</option>)}</select></label> : null}<button type="button" className="button" style={{ marginTop: 8 }} disabled={!draft.replacementVariantId || busy === `outcome:${item.id}`} onClick={() => void updateOutcome(order, item, "REPLACEMENT_PROPOSED")}>Send for customer approval</button></details> : null}
                </td></tr>;
              })}</tbody></table></div>

              {order.picker ? <div className="panel" style={{ marginTop: 14 }}><div className="section-title"><div><h3>Picker conversation</h3><p className="muted">Messages and replacement photos are attached to this store-order only.</p></div></div><div className="campaign-list">{order.picker.messages.length ? order.picker.messages.map((message) => <div className="store-row" key={message.id}><div><strong>{message.text || (message.kind === "IMAGE" ? "Image shared" : "Message")}</strong><small>{new Date(message.createdAt).toLocaleString("en-NG")}</small></div>{message.kind === "IMAGE" ? <button className="button ghost small" disabled={busy === `image:${message.id}`} onClick={() => void viewMessageImage(order, message)}>{busy === `image:${message.id}` ? "Opening…" : "View image"}</button> : null}</div>) : <div className="muted">No messages yet.</div>}</div><div className="form-grid" style={{ marginTop: 12 }}><label>Message<input value={chatDrafts[order.id] ?? ""} maxLength={1000} placeholder="Ask about a replacement or update the customer" onChange={(event) => setChatDrafts((current) => ({ ...current, [order.id]: event.target.value }))}/></label><button className="button" disabled={!chatDrafts[order.id]?.trim() || busy === `chat:${order.id}`} onClick={() => void sendMessage(order)}>Send</button><label className="button ghost" style={{ cursor: "pointer", textAlign: "center" }}>Share photo<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy === `photo:${order.id}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPickerPhoto(order, file); event.currentTarget.value = ""; }}/></label></div></div> : null}
            </article>
          ))}
        </section>

        <StoreSettings stores={stores} active={activeStore} setActive={setActiveStore} reload={load} setError={setError} setNotice={setNotice}/>
      </main>
    </div>
  );
}

function StoreSettings({ stores, active, setActive, reload, setError, setNotice }: { stores: Store[]; active: string; setActive: (id: string) => void; reload: () => Promise<void>; setError: (message: string) => void; setNotice: (message: string) => void }) {
  const store = stores.find((entry) => entry.id === active);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [capacity, setCapacity] = useState("12");
  const [settingsBusy, setSettingsBusy] = useState("");

  useEffect(() => {
    if (!store) return;
    setForm({
      pickupEnabled: store.config?.pickupEnabled ?? false,
      expressEnabled: store.config?.expressEnabled ?? false,
      scheduledEnabled: store.config?.scheduledEnabled ?? false,
      pickerChatEnabled: store.config?.pickerChatEnabled ?? true,
      weightedItemsEnabled: store.config?.weightedItemsEnabled ?? true,
      minimumOrderMinor: store.config?.minimumOrderMinor ?? 0,
      maxActiveOrders: store.config?.maxActiveOrders ?? 40,
      prepMinutes: store.config?.prepMinutes ?? 20,
      freeDeliveryThresholdMinor: store.config?.freeDeliveryThresholdMinor ?? null,
    });
  }, [store]);

  if (!stores.length) return <section className="panel empty">No Grocery branches are available to this Business account.</section>;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!store) return;
    setSettingsBusy("save");
    try { await req(`/v1/business/grocery/stores/${store.id}/config`, "PATCH", form); setNotice("✓ Grocery branch settings saved."); await reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this branch"); }
    finally { setSettingsBusy(""); }
  }
  async function addSlot(event: FormEvent) {
    event.preventDefault();
    if (!store) return;
    setSettingsBusy("add-slot");
    try {
      await req(`/v1/business/grocery/stores/${store.id}/slots`, "POST", { startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), capacity: Number(capacity) });
      setNotice("✓ Delivery slot created."); setStart(""); setEnd(""); await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the delivery slot"); }
    finally { setSettingsBusy(""); }
  }
  async function toggleSlot(slot: Slot) {
    if (!store) return;
    setSettingsBusy(`slot:${slot.id}`);
    try { await req(`/v1/business/grocery/stores/${store.id}/slots/${slot.id}`, "PATCH", { active: !slot.active }); setNotice(slot.active ? "✓ Delivery slot paused." : "✓ Delivery slot activated."); await reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the delivery slot"); }
    finally { setSettingsBusy(""); }
  }

  return <section style={{ marginTop: 28 }}><div className="section-title"><h2>Branch controls</h2><select className="merchant-switch" value={active} onChange={(event) => setActive(event.target.value)}>{stores.map((entry) => <option key={entry.id} value={entry.id}>{entry.merchant} · {entry.name}</option>)}</select></div>{store ? <div className="catalog-layout"><form className="panel form-panel" onSubmit={save}><h3>Fulfillment & capacity</h3>{([["pickupEnabled","Pickup"],["expressEnabled","Express"],["scheduledEnabled","Scheduled"],["pickerChatEnabled","Picker chat"],["weightedItemsEnabled","Variable-weight items"]] as const).map(([key,label]) => <label className="check" key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setForm({ ...form, [key]: event.target.checked })}/> {label}</label>)}<div className="form-grid"><label>Minimum order (minor)<input type="number" min="0" value={String(form.minimumOrderMinor ?? 0)} onChange={(event) => setForm({ ...form, minimumOrderMinor: Number(event.target.value) })}/></label><label>Max active orders<input type="number" min="1" value={String(form.maxActiveOrders ?? 40)} onChange={(event) => setForm({ ...form, maxActiveOrders: Number(event.target.value) })}/></label><label>Prep minutes<input type="number" min="0" value={String(form.prepMinutes ?? 20)} onChange={(event) => setForm({ ...form, prepMinutes: Number(event.target.value) })}/></label><label>Free-delivery threshold (minor)<input type="number" min="0" placeholder="Optional" value={form.freeDeliveryThresholdMinor == null ? "" : String(form.freeDeliveryThresholdMinor)} onChange={(event) => setForm({ ...form, freeDeliveryThresholdMinor: event.target.value ? Number(event.target.value) : null })}/></label></div><button className="button" disabled={settingsBusy === "save"}>{settingsBusy === "save" ? "Saving…" : "Save branch"}</button></form><div className="panel"><h3>Scheduled delivery slots</h3><form className="form-grid" onSubmit={addSlot}><label>Starts<input type="datetime-local" required value={start} onChange={(event) => setStart(event.target.value)}/></label><label>Ends<input type="datetime-local" required value={end} onChange={(event) => setEnd(event.target.value)}/></label><label>Capacity<input type="number" min="1" required value={capacity} onChange={(event) => setCapacity(event.target.value)}/></label><button className="button" disabled={settingsBusy === "add-slot"}>{settingsBusy === "add-slot" ? "Adding…" : "Add slot"}</button></form><div className="campaign-list" style={{ marginTop: 14 }}>{store.slots.length ? store.slots.map((slot) => <div className="store-row" key={slot.id}><div><strong>{new Date(slot.startsAt).toLocaleString("en-NG")}</strong><small>{slot.reserved}/{slot.capacity} reserved · {slot.active ? "Active" : "Paused"}</small></div><button className="button ghost small" disabled={settingsBusy === `slot:${slot.id}`} onClick={() => void toggleSlot(slot)}>{settingsBusy === `slot:${slot.id}` ? "Saving…" : slot.active ? "Pause" : "Activate"}</button></div>) : <div className="muted">No future delivery slots configured.</div>}</div></div></div> : null}</section>;
}
