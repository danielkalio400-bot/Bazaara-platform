"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ShoppingHeader } from "../../components/shopping-header";
import {
  getDefaultAddress,
  loadAddressBook,
  type ShoppingAddress,
} from "../../lib/address-book";
import {
  groceryFetch,
  groceryMoney,
  type GroceryCart,
  type GroceryCheckout,
  type GroceryPricingPolicy,
  type GroceryStore,
} from "../../lib/grocery-api";

type Mode = "STANDARD" | "EXPRESS" | "SCHEDULED" | "PICKUP";
type Policy = "BEST_MATCH" | "CONTACT_ME" | "REFUND";

const FALLBACK_POLICY: GroceryPricingPolicy = {
  serviceFeeBps: 1000,
  serviceFeeMinBps: 1000,
  serviceFeeMaxBps: 1500,
  expressRateBps: 1000,
  expressMinimumMinor: 100000,
  expressMaximumMinor: 500000,
};

const modes: Array<{
  id: Mode;
  title: string;
  desc: string;
}> = [
  {
    id: "STANDARD",
    title: "Standard delivery",
    desc: "Normal Grocery delivery from an eligible branch.",
  },
  {
    id: "EXPRESS",
    title: "Express delivery",
    desc: "Priority fulfilment priced from your merchandise subtotal.",
  },
  {
    id: "SCHEDULED",
    title: "Scheduled delivery",
    desc: "Reserve an available Grocery delivery window.",
  },
  {
    id: "PICKUP",
    title: "Pickup",
    desc: "Collect from a Grocery branch. No delivery fee.",
  },
];

function percent(bps: number) {
  return `${(bps / 100).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}%`;
}

function feeFromBps(subtotalMinor: number, bps: number) {
  return Math.round((subtotalMinor * bps) / 10000);
}

function expressEstimate(subtotalMinor: number, pricing: GroceryPricingPolicy) {
  const raw = feeFromBps(subtotalMinor, pricing.expressRateBps);
  return Math.min(
    pricing.expressMaximumMinor,
    Math.max(pricing.expressMinimumMinor, raw),
  );
}

export default function GroceryCheckoutPage() {
  const [cart, setCart] = useState<GroceryCart | null>(null);
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [pricing, setPricing] =
    useState<GroceryPricingPolicy>(FALLBACK_POLICY);
  const [addresses, setAddresses] = useState<ShoppingAddress[]>([]);
  const [addressId, setAddressId] = useState("");
  const [mode, setMode] = useState<Mode>("STANDARD");
  const [storeId, setStoreId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [policy, setPolicy] = useState<Policy>("BEST_MATCH");
  const [replacementLimit, setReplacementLimit] = useState("10");
  const [checkout, setCheckout] = useState<GroceryCheckout | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ordered, setOrdered] = useState<any>(null);

  useEffect(() => {
    const book = loadAddressBook();
    setAddresses(book);
    setAddressId(getDefaultAddress(book)?.id ?? book[0]?.id ?? "");

    void Promise.all([
      groceryFetch<{ cart: GroceryCart }>("/v1/grocery/cart"),
      groceryFetch<{ stores: GroceryStore[] }>("/v1/grocery/stores"),
      groceryFetch<GroceryPricingPolicy>("/v1/grocery/pricing-policy").catch(
        () => FALLBACK_POLICY,
      ),
    ])
      .then(([cartBody, storeBody, policyBody]) => {
        setCart(cartBody.cart);
        setStores(storeBody.stores);
        setPricing(policyBody);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Could not load checkout",
        ),
      );
  }, []);

  const branches = useMemo(
    () =>
      stores.flatMap((store) =>
        store.branches.map((branch) => ({
          ...branch,
          merchantName: store.name,
        })),
      ),
    [stores],
  );

  const selectedBranch = branches.find((branch) => branch.id === storeId);
  const address = addresses.find((entry) => entry.id === addressId);

  const modeSupported = (candidate: Mode) =>
    candidate === "STANDARD"
      ? true
      : candidate === "EXPRESS"
        ? branches.some(
            (branch) =>
              branch.config?.expressEnabled ||
              branch.fulfillmentModes.includes("EXPRESS"),
          )
        : candidate === "SCHEDULED"
          ? branches.some(
              (branch) =>
                (branch.config?.scheduledEnabled ||
                  branch.fulfillmentModes.includes("SCHEDULED")) &&
                branch.slots.some((slot) => slot.remaining > 0),
            )
          : branches.some(
              (branch) =>
                branch.config?.pickupEnabled ||
                branch.fulfillmentModes.includes("PICKUP"),
            );

  async function applyPolicy() {
    if (!cart?.items.length) return;

    const maxPriceIncreasePercent =
      policy === "REFUND"
        ? null
        : Math.max(
            0,
            Math.min(100, Number(replacementLimit || "0")),
          );

    await Promise.all(
      cart.items.map((item) =>
        groceryFetch(
          `/v1/grocery/cart/items/${item.id}/substitution`,
          {
            method: "PUT",
            body: JSON.stringify({
              substitutionPolicy: policy,
              pickerNote: null,
              maxPriceIncreasePercent,
            }),
          },
        ),
      ),
    );
  }

  async function create() {
    if (!address) {
      setError("Choose or add a saved address.");
      return;
    }

    if ((mode === "PICKUP" || mode === "SCHEDULED") && !storeId) {
      setError("Choose a branch.");
      return;
    }

    if (mode === "SCHEDULED" && !slotId) {
      setError("Choose an available delivery window.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await applyPolicy();

      const shippingAddress = {
        fullName: address.recipientName,
        phone: `+234${address.phoneNational}`,
        country: "NG",
        region: address.state,
        city: address.city,
        addressLine1: [address.street, address.building]
          .filter(Boolean)
          .join(", "),
        addressLine2: address.landmark || undefined,
        postalCode: address.postalCode,
      };

      const body = await groceryFetch<{ checkout: GroceryCheckout }>(
        "/v1/grocery/checkouts",
        {
          method: "POST",
          body: JSON.stringify({
            shippingAddress,
            deliveryMode: mode,
            pickupStoreId:
              mode === "PICKUP" ? storeId : undefined,
            deliverySlotId:
              mode === "SCHEDULED" ? slotId : undefined,
          }),
        },
      );

      setCheckout(body.checkout);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start checkout",
      );
    } finally {
      setBusy(false);
    }
  }

  async function payment(key: string) {
    if (!checkout) return;

    setBusy(true);

    try {
      const body = await groceryFetch<{ checkout: GroceryCheckout }>(
        `/v1/grocery/checkouts/${checkout.id}/payment-method`,
        {
          method: "PATCH",
          body: JSON.stringify({ paymentMethod: key }),
        },
      );
      setCheckout(body.checkout);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not change payment method",
      );
    } finally {
      setBusy(false);
    }
  }

  async function place() {
    if (!checkout || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/v1/grocery/checkouts/${checkout.id}/place-order`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "idempotency-key": `grocery-web-${checkout.id}-${Date.now()}`,
          },
          body: "{}",
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.error?.message ?? "Could not place order",
        );
      }

      setOrdered(body.order);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not place order",
      );
    } finally {
      setBusy(false);
    }
  }

  if (ordered) {
    return (
      <div className="shop-shell grocery-shell">
        <ShoppingHeader />
        <main className="gv2-page">
          <div
            className="gv2-card"
            style={{
              maxWidth: 720,
              margin: "40px auto",
              textAlign: "center",
            }}
          >
            <span className="gv2-kicker">ORDER CONFIRMED</span>
            <h1>{ordered.orderNumber}</h1>
            <p>
              The branch verifies reserved products while picking. Your
              order-level replacement preference is used only if a reserved
              item cannot be found.
            </p>
            <Link className="gv2-btn" href={`/orders/${ordered.id}`}>
              Track order
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const subtotal = cart?.subtotalMinor ?? 0;
  const estimatedService = feeFromBps(
    subtotal,
    pricing.serviceFeeBps,
  );
  const estimatedExpress =
    mode === "EXPRESS"
      ? expressEstimate(subtotal, pricing)
      : 0;

  const shownServiceBps =
    checkout?.serviceFeeBps ?? pricing.serviceFeeBps;

  return (
    <div className="shop-shell grocery-shell grocery-v55-checkout">
      <ShoppingHeader />

      <main className="gv2-page">
        <div className="gv2-head">
          <div>
            <span className="gv2-kicker">GROCERY CHECKOUT</span>
            <h1>Delivery, fallback and payment.</h1>
            <p className="gv2-muted">
              Grocery checks inventory. You choose one fallback rule for the
              whole order instead of configuring every item.
            </p>
          </div>

          <Link href="/cart" className="gv2-btn secondary">
            Back to basket
          </Link>
        </div>

        {error ? <div className="gv2-error">{error}</div> : null}

        <div className="gv2-grid">
          <section className="gv2-stack">
            <div className="gv2-card">
              <div className="grocery-v54-step-head">
                <span>01</span>
                <div>
                  <h2>Fulfilment</h2>
                  <p>Choose how this Grocery order reaches you.</p>
                </div>
              </div>

              <div className="grocery-v54-mode-grid">
                {modes.map((candidate) => (
                  <label
                    className={`grocery-v54-mode${
                      mode === candidate.id ? " is-active" : ""
                    }`}
                    key={candidate.id}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === candidate.id}
                      disabled={!modeSupported(candidate.id)}
                      onChange={() => {
                        setMode(candidate.id);
                        setCheckout(null);
                        setStoreId("");
                        setSlotId("");
                      }}
                    />
                    <span>
                      <strong>{candidate.title}</strong>
                      <small>
                        {modeSupported(candidate.id)
                          ? candidate.desc
                          : "Unavailable for current stores"}
                      </small>
                    </span>
                    {candidate.id === "EXPRESS" ? (
                      <b>10%</b>
                    ) : candidate.id === "PICKUP" ? (
                      <b>FREE</b>
                    ) : null}
                  </label>
                ))}
              </div>

              {mode === "EXPRESS" ? (
                <div className="grocery-v54-fee-callout">
                  <div>
                    <span>EXPRESS DELIVERY</span>
                    <strong>
                      {groceryMoney(
                        expressEstimate(subtotal, pricing),
                        cart?.currency ?? "NGN",
                      )}
                    </strong>
                  </div>
                  <p>
                    10% of merchandise subtotal, minimum ₦1,000 and maximum
                    ₦5,000. The Grocery service fee is separate.
                  </p>
                </div>
              ) : null}
            </div>

            {mode === "PICKUP" || mode === "SCHEDULED" ? (
              <div className="gv2-card">
                <div className="grocery-v54-step-head">
                  <span>02</span>
                  <div>
                    <h2>
                      Branch {mode === "SCHEDULED" ? "and time" : ""}
                    </h2>
                    <p>
                      Select the Grocery branch responsible for this order.
                    </p>
                  </div>
                </div>

                <label
                  className="gv2-field"
                  style={{ marginTop: 14 }}
                >
                  <span>Branch</span>
                  <select
                    className="gv2-select"
                    value={storeId}
                    onChange={(event) => {
                      setStoreId(event.target.value);
                      setSlotId("");
                      setCheckout(null);
                    }}
                  >
                    <option value="">Choose a branch</option>
                    {branches
                      .filter((branch) =>
                        mode === "PICKUP"
                          ? branch.config?.pickupEnabled ||
                            branch.fulfillmentModes.includes("PICKUP")
                          : branch.config?.scheduledEnabled ||
                            branch.fulfillmentModes.includes("SCHEDULED"),
                      )
                      .map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.merchantName} · {branch.name}
                        </option>
                      ))}
                  </select>
                </label>

                {mode === "SCHEDULED" && selectedBranch ? (
                  <label
                    className="gv2-field"
                    style={{ marginTop: 12 }}
                  >
                    <span>Available window</span>
                    <select
                      className="gv2-select"
                      value={slotId}
                      onChange={(event) => {
                        setSlotId(event.target.value);
                        setCheckout(null);
                      }}
                    >
                      <option value="">Choose a time</option>
                      {selectedBranch.slots
                        .filter((slot) => slot.remaining > 0)
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {new Date(slot.startsAt).toLocaleString(
                              "en-NG",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}{" "}
                            · {slot.remaining} left
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}

            <div className="gv2-card">
              <div className="grocery-v54-step-head">
                <span>
                  {mode === "PICKUP" || mode === "SCHEDULED"
                    ? "03"
                    : "02"}
                </span>
                <div>
                  <h2>If a reserved item is missing</h2>
                  <p>
                    One preference for the whole order. The store checks stock
                    first.
                  </p>
                </div>
              </div>

              <div className="grocery-v54-sub-grid">
                {(
                  [
                    [
                      "BEST_MATCH",
                      "Best similar item",
                      "Picker may choose the closest reasonable match.",
                    ],
                    [
                      "CONTACT_ME",
                      "Ask me first",
                      "Send me a decision before changing the item.",
                    ],
                    [
                      "REFUND",
                      "Refund it",
                      "Do not replace unavailable items.",
                    ],
                  ] as const
                ).map(([value, title, description]) => (
                  <label
                    key={value}
                    className={`grocery-v54-sub${
                      policy === value ? " is-active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="sub"
                      checked={policy === value}
                      onChange={() => {
                        setPolicy(value);
                        setCheckout(null);
                      }}
                    />
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>

              {policy !== "REFUND" ? (
                <label className="gv2-field grocery-v54-limit">
                  <span>Maximum replacement price increase (%)</span>
                  <input
                    className="gv2-input"
                    inputMode="numeric"
                    value={replacementLimit}
                    onChange={(event) =>
                      setReplacementLimit(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 3),
                      )
                    }
                  />
                </label>
              ) : null}
            </div>

            <div className="gv2-card">
              <div className="grocery-v54-step-head">
                <span>
                  {mode === "PICKUP" || mode === "SCHEDULED"
                    ? "04"
                    : "03"}
                </span>
                <div>
                  <h2>Contact address</h2>
                  <p>Used for delivery and order communication.</p>
                </div>
              </div>

              {addresses.length ? (
                <label
                  className="gv2-field"
                  style={{ marginTop: 14 }}
                >
                  <span>Saved address</span>
                  <select
                    className="gv2-select"
                    value={addressId}
                    onChange={(event) => {
                      setAddressId(event.target.value);
                      setCheckout(null);
                    }}
                  >
                    {addresses.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label} · {entry.street}, {entry.city}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="gv2-notice">
                  No saved address.{" "}
                  <Link href="/account/addresses">
                    Add one in Address Book
                  </Link>
                  .
                </div>
              )}
            </div>

            {checkout ? (
              <div className="gv2-card">
                <div className="grocery-v54-step-head">
                  <span>
                    {mode === "PICKUP" || mode === "SCHEDULED"
                      ? "05"
                      : "04"}
                  </span>
                  <div>
                    <h2>Payment</h2>
                    <p>Choose an available payment rail.</p>
                  </div>
                </div>

                <div
                  className="gv2-stack"
                  style={{ marginTop: 12 }}
                >
                  {checkout.paymentMethods.map((method) => (
                    <label className="gv2-option" key={method.key}>
                      <input
                        type="radio"
                        name="payment"
                        checked={
                          checkout.paymentMethod === method.key
                        }
                        disabled={!method.available || busy}
                        onChange={() => void payment(method.key)}
                      />
                      <span>
                        <strong>{method.label}</strong>
                        {method.reason ? (
                          <>
                            <br />
                            <small className="gv2-muted">
                              {method.reason}
                            </small>
                          </>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="gv2-card gv2-sticky gv2-summary grocery-v54-summary">
            <span className="gv2-kicker">PRICE BREAKDOWN</span>
            <h2>Order summary</h2>

            <div>
              <span>Items</span>
              <strong>{cart?.itemCount ?? 0}</strong>
            </div>

            <div>
              <span>Subtotal</span>
              <strong>
                {groceryMoney(
                  checkout?.subtotalMinor ??
                    cart?.subtotalMinor ??
                    0,
                )}
              </strong>
            </div>

            <div>
              <span>
                {mode === "EXPRESS"
                  ? "Express delivery"
                  : "Delivery"}
              </span>
              <strong>
                {checkout
                  ? checkout.shippingMinor === 0
                    ? "Free"
                    : groceryMoney(checkout.shippingMinor)
                  : mode === "EXPRESS"
                    ? groceryMoney(estimatedExpress)
                    : mode === "PICKUP"
                      ? "Free"
                      : "Calculated next"}
              </strong>
            </div>

            <div>
              <span>Service fee · {percent(shownServiceBps)}</span>
              <strong>
                {groceryMoney(
                  checkout?.serviceFeeMinor ??
                    estimatedService,
                )}
              </strong>
            </div>

            {checkout?.discountMinor ? (
              <div>
                <span>Discounts</span>
                <strong>
                  −{groceryMoney(checkout.discountMinor)}
                </strong>
              </div>
            ) : null}

            <div className="total">
              <span>Total</span>
              <strong>
                {groceryMoney(
                  checkout?.totalMinor ??
                    subtotal +
                      estimatedExpress +
                      estimatedService,
                )}
              </strong>
            </div>

            {checkout ? (
              <button
                className="gv2-btn"
                disabled={busy}
                onClick={() => void place()}
              >
                {busy ? "Placing order…" : "Place order"}
              </button>
            ) : (
              <button
                className="gv2-btn"
                disabled={busy || !cart?.items.length}
                onClick={() => void create()}
              >
                {busy
                  ? "Checking stock…"
                  : "Check stock & review payment"}
              </button>
            )}

            <small className="gv2-muted">
              Service fee is configured between 10% and 15%. Express is 10%
              of merchandise subtotal with a ₦1,000 minimum and ₦5,000
              maximum. Inventory is reserved by the API before checkout
              completes.
            </small>
          </aside>
        </div>
      </main>
    </div>
  );
}
