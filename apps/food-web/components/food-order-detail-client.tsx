"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi, money, type FoodOrder } from "../lib/food-api";

const STEPS = ["PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
const ISSUE_TYPES = ["MISSING_ITEM", "WRONG_ITEM", "QUALITY", "LATE_DELIVERY", "PAYMENT", "OTHER"] as const;
type FoodMapPoint = { latitude: number; longitude: number };

function validMapPoint(value: FoodMapPoint | null | undefined): FoodMapPoint | null {
  if (!value) return null;
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function statusTitle(status: string) {
  switch (status) {
    case "PLACED": return "Order received";
    case "ACCEPTED": return "Restaurant accepted your order";
    case "PREPARING": return "Your food is being prepared";
    case "READY": return "Ready for GO pickup";
    case "PICKED_UP": return "Courier picked up your order";
    case "ON_THE_WAY": return "Your order is on the way";
    case "DELIVERED": return "Delivered successfully";
    case "CANCELLED": return "Order cancelled";
    default: return status.replaceAll("_", " ");
  }
}

function statusCopy(order: FoodOrder) {
  switch (order.status) {
    case "PLACED": return "We sent the order to the restaurant.";
    case "ACCEPTED": return "The kitchen has confirmed your order.";
    case "PREPARING": return "The kitchen is preparing your items now.";
    case "READY": return order.courier ? "Your courier is heading to the restaurant." : "GO is matching a nearby courier.";
    case "PICKED_UP": return "Your courier has collected the order.";
    case "ON_THE_WAY": return "Keep your delivery PIN ready for handoff.";
    case "DELIVERED": return "Enjoy your meal. Live tracking has ended.";
    case "CANCELLED": return "This order will not continue through fulfilment.";
    default: return "Order updated.";
  }
}

function deliveryAddressLabel(value: Record<string, unknown> | null) {
  if (!value) return "Delivery address";
  const parts = [value.street, value.city, value.region].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  return parts.length ? parts.join(", ") : "Delivery address";
}

function paymentLabel(method: string) {
  if (method === "BAZAARA_PAY") return "Wallet";
  if (method === "PAYSTACK_CARD") return "Card";
  if (method === "PAYSTACK_BANK") return "Bank transfer";
  return method.replaceAll("_", " ");
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function FoodLiveDeliveryMap({ pickup, dropoff, courier, courierUpdatedAt, status }: {
  pickup: FoodMapPoint | null;
  dropoff: FoodMapPoint | null;
  courier: FoodMapPoint | null;
  courierUpdatedAt: string | null;
  status: string;
}) {
  const safePickup = validMapPoint(pickup);
  const safeDropoff = validMapPoint(dropoff);
  const safeCourier = validMapPoint(courier);
  const points = [safePickup, safeDropoff, safeCourier].filter((point): point is FoodMapPoint => Boolean(point));

  if (!points.length) {
    return <div className="food-live-map-empty"><b>Waiting for route coordinates</b><p>Tracking appears when a verified restaurant, customer or courier location is available.</p></div>;
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  let minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes);
  let minLon = Math.min(...longitudes), maxLon = Math.max(...longitudes);
  const latPad = Math.max(0.008, (maxLat - minLat) * 0.35);
  const lonPad = Math.max(0.008, (maxLon - minLon) * 0.35);
  minLat -= latPad; maxLat += latPad; minLon -= lonPad; maxLon += lonPad;

  const marker = safeCourier ?? safeDropoff ?? safePickup!;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${minLon},${minLat},${maxLon},${maxLat}`)}&layer=mapnik&marker=${encodeURIComponent(`${marker.latitude},${marker.longitude}`)}`;

  return <div className="food-live-map">
    <div className="food-live-map-stage">
      <iframe title="Food live delivery map" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="food-live-map-badge">{safeCourier ? "LIVE COURIER" : status === "READY" ? "AWAITING COURIER" : "DELIVERY ROUTE"}</div>
    </div>
    <div className="food-map-legend">
      {safePickup ? <span><i className="map-dot restaurant-dot" />Restaurant</span> : null}
      {safeCourier ? <span><i className="map-dot courier-dot" />Courier</span> : null}
      {safeDropoff ? <span><i className="map-dot customer-dot" />You</span> : null}
      {courierUpdatedAt ? <small>Courier updated {new Date(courierUpdatedAt).toLocaleTimeString()}</small> : <small>Live courier position appears after assignment.</small>}
    </div>
    <a className="food-map-open" href={`https://www.openstreetmap.org/?mlat=${marker.latitude}&mlon=${marker.longitude}#map=16/${marker.latitude}/${marker.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a>
  </div>;
}

export function FoodOrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [error, setError] = useState("");
  const [needAuth, setNeedAuth] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [issueType, setIssueType] = useState<(typeof ISSUE_TYPES)[number]>("OTHER");
  const [issueDetails, setIssueDetails] = useState("");
  const [refundNaira, setRefundNaira] = useState("");
  const [rating, setRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [deliveryPin, setDeliveryPin] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(() => Date.now());

  async function load() {
    try {
      const body = await foodApi.get<{ order: FoodOrder }>(`/v1/food/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      setOrder(body.order);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setNeedAuth(true);
      else setError(cause instanceof Error ? cause.message : "Could not load order");
    }
  }

  useEffect(() => {
    void load();
    const key = `bazaara.food.deliveryPin.${orderId}`;
    setDeliveryPin(sessionStorage.getItem(key));
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "return") {
      void reconcilePayment();
      window.history.replaceState({}, "", `/orders/${orderId}`);
    }
    const timer = window.setInterval(() => void load(), 5000);
    const clockTimer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => { window.clearInterval(timer); window.clearInterval(clockTimer); };
  }, [orderId]);

  const current = useMemo(() => order?.status === "CANCELLED" ? -1 : STEPS.indexOf(order?.status ?? ""), [order]);

  async function cancel() {
    setBusy("cancel");
    try {
      const body = await foodApi.post<{ order: FoodOrder }>(`/v1/food/orders/${encodeURIComponent(orderId)}/cancel`);
      setOrder(body.order);
      setNotice("Order cancelled.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel order");
    } finally {
      setBusy("");
    }
  }

  async function reorder() {
    setBusy("reorder");
    try {
      await foodApi.post(`/v1/food/orders/${encodeURIComponent(orderId)}/reorder`, {});
      if (order) window.location.href = `/cart/${order.restaurant.slug}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not rebuild this basket");
    } finally {
      setBusy("");
    }
  }

  async function recoverDeliveryPin() {
    setBusy("delivery-pin");
    setError("");
    try {
      const body = await foodApi.post<{ deliveryPin: string }>(`/v1/food/orders/${encodeURIComponent(orderId)}/delivery-pin`, {});
      const key = `bazaara.food.deliveryPin.${orderId}`;
      sessionStorage.setItem(key, body.deliveryPin);
      setDeliveryPin(body.deliveryPin);
      setNotice("A new delivery PIN was issued. Only the newest PIN will work.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not issue a new delivery PIN");
    } finally {
      setBusy("");
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;
    setBusy("message");
    try {
      await foodApi.post(`/v1/food/orders/${encodeURIComponent(orderId)}/messages`, { text: message.trim() });
      setMessage("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send message");
    } finally {
      setBusy("");
    }
  }

  async function initializePayment() {
    setBusy("payment");
    setError("");
    try {
      const body = await foodApi.post<{ alreadyPaid:boolean; checkoutUrl:string|null; paymentStatus:string }>(
        `/v1/food/orders/${encodeURIComponent(orderId)}/payment/initialize`,
        {},
        { idempotencyKey: `food-payment-${crypto.randomUUID()}` },
      );
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start payment");
    } finally {
      setBusy("");
    }
  }

  async function reconcilePayment() {
    setBusy("payment-check");
    setError("");
    try {
      const body = await foodApi.post<{ paymentStatus:string }>(
        `/v1/food/orders/${encodeURIComponent(orderId)}/payment/reconcile`,
        {},
      );
      setNotice(body.paymentStatus === "PAID" ? "Payment confirmed." : `Payment status: ${body.paymentStatus.toLowerCase()}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check payment");
    } finally {
      setBusy("");
    }
  }

  async function submitIssue() {
    if (!issueDetails.trim()) return;
    setBusy("issue");
    try {
      await foodApi.post(`/v1/food/orders/${encodeURIComponent(orderId)}/issues`, {
        type: issueType,
        details: issueDetails.trim(),
        requestedRefundMinor: refundNaira ? Math.round(Number(refundNaira) * 100) : null,
      });
      setIssueDetails("");
      setRefundNaira("");
      setNotice("Support request submitted.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create support request");
    } finally {
      setBusy("");
    }
  }

  async function submitReview() {
    setBusy("review");
    try {
      await foodApi.request(`/v1/food/orders/${encodeURIComponent(orderId)}/review`, {
        method: "PUT",
        body: { rating, foodRating, deliveryRating: order?.fulfillmentType === "DELIVERY" ? deliveryRating : null, text: reviewText.trim() || null, photoKeys: [] },
      });
      setNotice("Review saved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save review");
    } finally {
      setBusy("");
    }
  }

  if (needAuth) {
    const returnTo = typeof window === "undefined" ? `http://localhost:3007/orders/${orderId}` : window.location.href;
    return <div className="checkout-auth-card"><h1>Sign in to view this order</h1><a className="food-primary" href={buildBazIdSignInUrl({ bazIdBaseUrl: BAZID_BASE, returnTo })}>Continue with BazID</a></div>;
  }
  if (!order) return <div className="food-loading">{error || "Loading order…"}</div>;

  const live = order.tracking.filter((entry) => entry.latitude != null && entry.longitude != null).at(-1);
  const delivered = order.status === "DELIVERED";
  const cancelled = order.status === "CANCELLED";
  const liveDelivery = order.fulfillmentType === "DELIVERY" && ["READY", "PICKED_UP", "ON_THE_WAY"].includes(order.status);
  const deliveryHistory = [...order.tracking].reverse();
  const deliveredEvent = deliveryHistory.find((entry) => entry.status === "DELIVERED");
  const proximityEvent = deliveryHistory.find((entry) => entry.status === "COURIER_AT_PICKUP" || entry.status === "COURIER_NEAR_PICKUP");
  const durationEnd = order.deliveredAt ? new Date(order.deliveredAt).getTime() : order.cancelledAt ? new Date(order.cancelledAt).getTime() : clock;
  const durationSeconds = Math.max(0, Math.floor((durationEnd - new Date(order.placedAt).getTime()) / 1000));

  return <div className="order-detail order-detail-v2">
    <section className={`order-status-card status-card-${order.status.toLowerCase()}`}>
      <div className="order-status-card-copy">
        <span>{order.orderNumber}</span>
        <h1>{statusTitle(order.status)}</h1>
        <p>{statusCopy(order)}</p>
        <div className="order-status-meta">
          <span>{order.restaurant.name}</span>
          <span>{order.fulfillmentType === "DELIVERY" ? deliveryAddressLabel(order.deliveryAddress) : "Restaurant pickup"}</span>
          <span>{order.scheduledFor ? new Date(order.scheduledFor).toLocaleString() : "ASAP"}</span>
        </div>
      </div>
      <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span>
    </section>

    {notice ? <div className="checkout-success" role="status">{notice}</div> : null}
    {error ? <p className="food-error" role="alert">{error}</p> : null}

    <section className={`order-payment-card ${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
      <div className="order-payment-state">
        <span>{order.paymentStatus === "PAID" ? "PAYMENT CONFIRMED" : "PAYMENT REQUIRED"}</span>
        <h2>{paymentLabel(order.paymentMethod)}</h2>
        <p>{order.paymentStatus === "PAID" ? "This order is cleared for restaurant acceptance and fulfilment." : "The restaurant cannot accept this order until payment is confirmed."}</p>
      </div>
      <div className="order-payment-actions">
        <strong>{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus.replaceAll("_", " ")}</strong>
        {order.paymentStatus !== "PAID" && (order.paymentMethod === "PAYSTACK_CARD" || order.paymentMethod === "PAYSTACK_BANK") ? <>
          <button className="food-primary" disabled={busy === "payment"} onClick={() => void initializePayment()}>{busy === "payment" ? "Opening payment…" : "Pay now"}</button>
          <button className="food-secondary" disabled={busy === "payment-check"} onClick={() => void reconcilePayment()}>{busy === "payment-check" ? "Checking…" : "I've paid · check"}</button>
        </> : null}
      </div>
    </section>

    <section className="food-duration-card" aria-live="polite">
      <div className="food-duration-main">
        <span>{delivered ? "TOTAL DELIVERY TIME" : cancelled ? "ORDER ACTIVE TIME" : "LIVE ORDER TIME"}</span>
        <strong>{formatDuration(durationSeconds)}</strong>
        <small>{delivered ? "From order confirmation to delivery" : `Estimated delivery ${order.timing.estimatedDeliveryMin}–${order.timing.estimatedDeliveryMax} min`}</small>
      </div>
      <div className="food-duration-phases">
        <div><span>Courier assigned</span><b>{formatDuration(order.timing.phases.orderToCourierAssignedSeconds)}</b></div>
        <div><span>Assigned → pickup</span><b>{formatDuration(order.timing.phases.courierAssignedToPickupSeconds)}</b></div>
        <div><span>Pickup → delivery</span><b>{formatDuration(order.timing.phases.pickupToDeliverySeconds)}</b></div>
      </div>
    </section>

    {proximityEvent && !delivered && !cancelled ? <section className={`food-pickup-proximity ${proximityEvent.status === "COURIER_AT_PICKUP" ? "at" : "near"}`}><span>{proximityEvent.status === "COURIER_AT_PICKUP" ? "COURIER AT PICKUP" : "COURIER NEAR PICKUP"}</span><b>{proximityEvent.message ?? (proximityEvent.status === "COURIER_AT_PICKUP" ? "Your courier has reached the restaurant." : "Your courier is close to the restaurant.")}</b><small>{new Date(proximityEvent.createdAt).toLocaleTimeString()}</small></section> : null}

    {order.fulfillmentType === "DELIVERY" && !order.deliveryPinVerified && !delivered && !cancelled ? (
      <section className="delivery-pin-card delivery-pin-card-v2">
        <div><span>DELIVERY PIN</span><p>Share only when the courier reaches you.</p></div>
        {deliveryPin ? <strong>{deliveryPin}</strong> : <button className="food-primary" disabled={busy === "delivery-pin"} onClick={() => void recoverDeliveryPin()}>{busy === "delivery-pin" ? "Generating…" : "Get a new PIN"}</button>}
      </section>
    ) : null}

    {!cancelled ? (
      <section className="order-timeline order-timeline-v2">
        {STEPS.map((step, index) => <div key={step} className={index <= current ? "timeline-step complete" : "timeline-step"}>
          <span>{index < current ? "✓" : index === current ? "●" : "○"}</span>
          <div><b>{step.replaceAll("_", " ")}</b><small>{index === current ? "Now" : ""}</small></div>
        </div>)}
      </section>
    ) : <div className="food-error">This order was cancelled.</div>}

    {delivered ? (
      <section className="order-complete-card">
        <div className="order-complete-icon" aria-hidden="true">✓</div>
        <div><span>DELIVERY COMPLETE</span><h2>Delivered in {formatDuration(durationSeconds)}</h2><p>{deliveredEvent ? `Completed ${new Date(deliveredEvent.createdAt).toLocaleString()}. ` : ""}Live map tracking is now closed for this order.</p></div>
        <button className="food-secondary" disabled={busy === "reorder"} onClick={() => void reorder()}>{busy === "reorder" ? "Building basket…" : "Order again"}</button>
      </section>
    ) : null}

    {liveDelivery ? (
      <section className="checkout-card tracking-card tracking-card-v2">
        <div className="food-section-head compact-head"><div><span>LIVE DELIVERY</span><h2>{order.courier ? "Track your courier" : "Finding a courier"}</h2></div><button className="food-secondary compact-button" onClick={() => void load()}>Refresh</button></div>
        <FoodLiveDeliveryMap
          pickup={order.pickupLocation}
          dropoff={order.dropoffLocation}
          courier={live?.latitude != null && live?.longitude != null ? { latitude: live.latitude, longitude: live.longitude } : null}
          courierUpdatedAt={live?.createdAt ?? null}
          status={order.status}
        />
        {order.courier ? <div className="courier-mini-card"><div className="courier-avatar">GO</div><div><b>{order.courier.displayName}</b><small>{order.courier.phone ? <a href={`tel:${order.courier.phone}`}>{order.courier.phone}</a> : "GO courier"}</small></div></div> : <p className="muted-food">Only eligible nearby couriers receive this pickup offer.</p>}
      </section>
    ) : order.fulfillmentType === "DELIVERY" && !delivered && !cancelled ? (
      <section className="order-route-pending"><span>DELIVERY</span><b>{order.status === "PREPARING" ? "Map appears when the order is ready for courier pickup." : "Live map starts when courier tracking becomes relevant."}</b></section>
    ) : null}

    <div className="order-detail-grid order-detail-grid-v2">
      <section className="checkout-card order-items-card">
        <div className="order-card-heading"><h2>Your order</h2><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
        {order.items.map((item) => <div className="order-item-row" key={item.id}><div><b>{item.quantity}× {item.name}</b>{item.selectedModifiers.length ? <small>{item.selectedModifiers.map((modifier) => modifier.optionName).join(" · ")}</small> : null}</div><strong>{money(item.lineTotalMinor)}</strong></div>)}
        {order.isGift ? <div className="gift-summary"><b>Gift for {order.recipientName}</b><p>{order.giftMessage || "No gift message"}</p></div> : null}
      </section>
      <section className="checkout-card order-summary-card">
        <div className="order-card-heading"><h2>Total</h2><strong>{money(order.totalMinor)}</strong></div>
        <div className="summary-row"><span>Subtotal</span><b>{money(order.subtotalMinor)}</b></div>
        <div className="summary-row"><span>Delivery</span><b>{order.deliveryFeeMinor ? money(order.deliveryFeeMinor) : "Free"}</b></div>
        <div className="summary-row"><span>Service fee</span><b>{money(order.serviceFeeMinor)}</b></div>
        {order.tipMinor ? <div className="summary-row"><span>Tip</span><b>{money(order.tipMinor)}</b></div> : null}
        {order.discountMinor ? <div className="summary-row discount-row"><span>Discount</span><b>−{money(order.discountMinor)}</b></div> : null}
        <p className="order-payment-line">{paymentLabel(order.paymentMethod)} · {order.paymentStatus}</p>
        <div className="order-actions">
          {["PLACED", "ACCEPTED"].includes(order.status) ? <button className="food-secondary" disabled={busy === "cancel"} onClick={() => void cancel()}>{busy === "cancel" ? "Cancelling…" : "Cancel order"}</button> : null}
          {!delivered ? <button className="food-secondary" disabled={busy === "reorder"} onClick={() => void reorder()}>{busy === "reorder" ? "Building basket…" : "Order again"}</button> : null}
        </div>
      </section>
    </div>

    <details className="checkout-card order-collapsible" open={!delivered && order.messages.length > 0}>
      <summary><span>Order chat</span><small>{order.messages.length} message{order.messages.length === 1 ? "" : "s"}</small></summary>
      <div className="food-chat-log">{order.messages.length ? order.messages.map((entry) => <div key={entry.id} className={`food-chat-message role-${entry.senderRole.toLowerCase()}`}><b>{entry.senderRole === "CUSTOMER" ? "You" : entry.senderRole.toLowerCase()}</b><p>{entry.text || "Attachment"}</p><small>{new Date(entry.createdAt).toLocaleString()}</small></div>) : <p>No messages yet.</p>}</div>
      <div className="food-chat-compose"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void sendMessage(); } }} maxLength={1000} placeholder="Message the restaurant" /><button className="food-primary" disabled={busy === "message" || !message.trim()} onClick={() => void sendMessage()}>Send</button></div>
    </details>

    <details className="checkout-card order-collapsible">
      <summary><span>Delivery history</span><small>{order.tracking.length} updates</small></summary>
      <div className="tracking-events">{deliveryHistory.map((entry) => <div key={entry.id}><span>{entry.status.replaceAll("_", " ")}</span><p>{entry.message || "Order updated"}</p><small>{new Date(entry.createdAt).toLocaleString()}</small></div>)}</div>
    </details>

    <details className="checkout-card order-collapsible">
      <summary><span>Help with this order</span><small>{order.supportIssues.length ? `${order.supportIssues.length} open/history` : "Support & refunds"}</small></summary>
      {order.supportIssues.length ? <div className="issue-list">{order.supportIssues.map((issue) => <div key={issue.id}><b>{issue.type.replaceAll("_", " ")}</b><span>{issue.status}</span><p>{issue.details}</p>{issue.approvedRefundMinor != null ? <small>Approved: {money(issue.approvedRefundMinor)}</small> : issue.requestedRefundMinor != null ? <small>Requested: {money(issue.requestedRefundMinor)}</small> : null}</div>)}</div> : null}
      <div className="support-form">
        <label>Issue type<select value={issueType} onChange={(event) => setIssueType(event.target.value as typeof issueType)}>{ISSUE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Requested refund (₦, optional)<input type="number" min="0" value={refundNaira} onChange={(event) => setRefundNaira(event.target.value)} /></label>
        <label className="wide">What happened?<textarea value={issueDetails} onChange={(event) => setIssueDetails(event.target.value)} maxLength={1200} /></label>
        <button className="food-secondary" disabled={busy === "issue" || issueDetails.trim().length < 2} onClick={() => void submitIssue()}>Submit support request</button><Link className="food-secondary" href={`/support?order=${encodeURIComponent(order.id)}`}>Open live support chat</Link>
      </div>
    </details>

    {delivered ? <section className="checkout-card review-card-v2"><h2>Rate this order</h2>{order.review ? <div className="review-existing"><strong>{"★".repeat(order.review.rating)}{"☆".repeat(5 - order.review.rating)}</strong>{order.review.foodRating ? <p><b>Food:</b> {order.review.foodRating}/5{order.review.deliveryRating ? ` · Delivery: ${order.review.deliveryRating}/5` : ""}</p> : null}<p>{order.review.text || "No written review"}</p>{order.review.restaurantReply ? <blockquote><b>{order.restaurant.name}</b><p>{order.review.restaurantReply}</p></blockquote> : null}</div> : <div className="review-form"><label>Overall<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></label><label>Food<select value={foodRating} onChange={(event) => setFoodRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></label>{order.fulfillmentType === "DELIVERY" ? <label>Delivery<select value={deliveryRating} onChange={(event) => setDeliveryRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></label> : null}<label className="wide">Review<textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={1200} placeholder="How was your meal?" /></label><button className="food-primary" disabled={busy === "review"} onClick={() => void submitReview()}>Publish review</button></div>}</section> : null}

    <div className="order-bottom-links"><Link href={`/restaurants/${order.restaurant.slug}`}>Order more from {order.restaurant.name}</Link><Link href="/orders">All orders</Link></div>
  </div>;
}
