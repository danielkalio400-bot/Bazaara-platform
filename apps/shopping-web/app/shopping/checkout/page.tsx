"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  buildBazIdSignInUrl
} from "@bazaara/bazid-client";

import {
  ShoppingHeader
} from "../../../components/shopping-header";

import {
  ShoppingAddress,
  formatNigeriaPhone,
  getDefaultAddress,
  isValidNigeriaPostalCode,
  loadAddressBook
} from "../../../lib/address-book";

import {
  Checkout,
  formatMoney
} from "../../../lib/shopping";

import {
  calculateCheckoutFeePreview
} from "../../../lib/checkout-fee-policy";


import styles from "./checkout.module.css";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";

type Cart = {
  id: string | null;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  items: Array<{
    id: string;
    quantity: number;
    lineTotalMinor: number;
    fulfillmentModes?: string[];
    variant: {
      title: string;
    };
    product: {
      title: string;
    };
  }>;
};

type DeliveryProcess =
  | "standard"
  | "express"
  | "scheduled";

const DELIVERY_PROCESSES: Array<{
  id: DeliveryProcess;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    id: "standard",
    title: "Standard delivery",
    description:
      "Regular doorstep delivery using the available Bazaara delivery network.",
    badge: "Best value"
  },
  {
    id: "express",
    title: "Express delivery",
    description:
      "Priority delivery preference where the destination and seller support it.",
    badge: "Faster"
  },
  {
    id: "scheduled",
    title: "Scheduled delivery",
    description:
      "Choose a future delivery time where every item and seller supports scheduling.",
    badge: "Plan ahead"
  }
];

function deliveryProcessLabel(
  value: DeliveryProcess
) {
  return (
    DELIVERY_PROCESSES.find(
      (option) =>
        option.id === value
    )?.title ??
    "Standard delivery"
  );
}

export default function CheckoutPage() {
  const [
    cart,
    setCart
  ] =
    useState<Cart | null>(
      null
    );

  const [
    signedIn,
    setSignedIn
  ] =
    useState<boolean | null>(
      null
    );

  const [
    checkout,
    setCheckout
  ] =
    useState<Checkout | null>(
      null
    );

  const [
    addresses,
    setAddresses
  ] =
    useState<ShoppingAddress[]>(
      []
    );

  const [
    selectedAddressId,
    setSelectedAddressId
  ] =
    useState("");

  const [
    ready,
    setReady
  ] =
    useState(false);

  const [
    error,
    setError
  ] =
    useState("");

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    deliveryProcess,
    setDeliveryProcess
  ] =
    useState<DeliveryProcess>(
      "standard"
    );

  const [scheduledFor, setScheduledFor] = useState("");

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address.id ===
            selectedAddressId
        ) ??
        getDefaultAddress(
          addresses
        ),
      [
        addresses,
        selectedAddressId
      ]
    );

  const feePreview =
    useMemo(
      () =>
        cart
          ? calculateCheckoutFeePreview(
              cart.subtotalMinor,
              deliveryProcess
            )
          : null,
      [
        cart,
        deliveryProcess
      ]
    );

  const deliveryAvailability = useMemo(() => ({
    standard: cart?.items.every((item) => item.fulfillmentModes?.includes("STANDARD") ?? true) ?? true,
    express: cart?.items.length ? cart.items.every((item) => item.fulfillmentModes?.includes("EXPRESS")) : false,
    scheduled: cart?.items.length ? cart.items.every((item) => item.fulfillmentModes?.includes("SCHEDULED")) : false,
  }), [cart]);

  function signInUrl() {
    if (
      typeof window ===
      "undefined"
    ) {
      return `${BAZID}/bazid/sign-in`;
    }

    return buildBazIdSignInUrl(
      {
        bazIdBaseUrl: BAZID,
        returnTo:
          window.location.href
      }
    );
  }

  useEffect(
    () => {
      const saved =
        loadAddressBook();

      setAddresses(saved);

      const params =
        new URLSearchParams(
          window.location.search
        );

      const requested =
        params.get("address");

      const requestedAddress =
        requested
          ? saved.find(
              (address) =>
                address.id === requested
            )
          : null;

      setSelectedAddressId(
        requestedAddress?.id ??
        getDefaultAddress(saved)?.id ??
        ""
      );

      void (
        async () => {
          try {
            const [
              cartResponse,
              meResponse
            ] =
              await Promise.all(
                [
                  fetch(
                    `${API}/v1/shopping/cart`,
                    {
                      credentials: "include",
                      cache: "no-store"
                    }
                  ),
                  fetch(
                    `${API}/v1/bazid/me`,
                    {
                      credentials: "include",
                      cache: "no-store"
                    }
                  )
                ]
              );

            const cartBody =
              await cartResponse
                .json()
                .catch(
                  () => null
                );

            if (!cartResponse.ok) {
              throw new Error(
                cartBody?.error?.message ??
                "Could not load your cart"
              );
            }

            setCart(
              cartBody.cart
            );

            setSignedIn(
              meResponse.ok
            );
          }
          catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not load checkout"
            );
          }
          finally {
            setReady(true);
          }
        }
      )();
    },
    []
  );

  async function startCheckout() {
    if (!selectedAddress) {
      setError(
        "Choose or add a delivery address first."
      );
      return;
    }

    if (
      !isValidNigeriaPostalCode(
        selectedAddress.postalCode
      )
    ) {
      setError(
        "This saved address needs a valid 6-digit postal code. Edit it in Address Book before continuing."
      );
      return;
    }

    if (deliveryProcess === "scheduled" && !scheduledFor) {
      setError("Choose a future delivery time for scheduled delivery.");
      return;
    }

    setBusy(true);
    setError("");

    const shippingAddress = {
      fullName:
        selectedAddress.recipientName,
      phone:
        `+234${selectedAddress.phoneNational}`,
      country:
        "NG",
      region:
        selectedAddress.state,
      city:
        selectedAddress.city,
      postalCode:
        selectedAddress.postalCode,
      district:
        selectedAddress.lga,
      street:
        selectedAddress.street,
      building:
        selectedAddress.building,
      landmark:
        selectedAddress.landmark,
      deliveryInstructions:
        [
          `Delivery process: ${deliveryProcessLabel(deliveryProcess)}`,
          selectedAddress.deliveryInstructions
        ]
          .filter(Boolean)
          .join(" · ")
    };

    try {
      const response =
        await fetch(
          `${API}/v1/shopping/checkouts`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify(
                {
                  shippingAddress,
                  deliveryMode: deliveryProcess.toUpperCase(),
                  scheduledFor: deliveryProcess === "scheduled" && scheduledFor ? new Date(scheduledFor).toISOString() : undefined
                }
              )
          }
        );

      if (
        response.status ===
        401
      ) {
        window.location.href =
          signInUrl();
        return;
      }

      const body =
        await response
          .json()
          .catch(
            () => null
          );

      if (!response.ok) {
        throw new Error(
          body?.error?.message ??
          "Could not start checkout"
        );
      }

      setCheckout(
        body.checkout
      );
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start checkout"
      );
    }
    finally {
      setBusy(false);
    }
  }

  async function changePaymentMethod(paymentMethod: string) {
    if (!checkout || checkout.paymentMethod === paymentMethod) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/v1/shopping/checkouts/${encodeURIComponent(checkout.id)}/payment-method`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentMethod }) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.checkout) throw new Error(body?.error?.message ?? "Could not change payment method");
      setCheckout(body.checkout);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change payment method");
    } finally { setBusy(false); }
  }

  async function placeOrder() {
    if (!checkout) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API}/v1/shopping/checkouts/${checkout.id}/place-order`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "idempotency-key":
                crypto.randomUUID()
            }
          }
        );

      const body =
        await response
          .json()
          .catch(
            () => null
          );

      if (!response.ok) {
        throw new Error(
          body?.error?.message ??
          "Could not place order"
        );
      }

      if (checkout.paymentMethod.startsWith("PAYSTACK_")) {
        const paymentResponse = await fetch(`${API}/v1/shopping/orders/${encodeURIComponent(body.order.id)}/payment/initialize`, { method: "POST", credentials: "include", headers: { "idempotency-key": crypto.randomUUID(), "content-type": "application/json" }, body: JSON.stringify({ returnOrigin: window.location.origin }) });
        const paymentBody = await paymentResponse.json().catch(() => null);
        if (!paymentResponse.ok) throw new Error(paymentBody?.error?.message ?? "Could not start secure payment");
        if (paymentBody?.checkoutUrl) { window.location.assign(paymentBody.checkoutUrl); return; }
      }
      window.location.assign(`/orders/${body.order.id}`);
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not place order"
      );
    }
    finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="shop-shell"
    >
      <ShoppingHeader />

      <main
        className="shop-main"
      >
        <div
          className={
            styles.pageHeader
          }
        >
          <div
            className="breadcrumbs"
          >
            <Link
              href="/cart"
            >
              Cart
            </Link>

            <span>
              /
            </span>

            <span>
              Checkout
            </span>
          </div>

          <span
            className={
              styles.eyebrow
            }
          >
            SECURE CHECKOUT
          </span>

          <h1
            className={
              styles.title
            }
          >
            Delivery and payment
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Choose a saved delivery address, review totals and place your order securely.
          </p>
        </div>

        {
          !ready ||
          !cart ||
          signedIn === null
            ? (
              <div
                className={
                  styles.empty
                }
              >
                Loading checkout…
              </div>
            )
            : null
        }

        {
          ready &&
          cart &&
          cart.items.length === 0
            ? (
              <div
                className={
                  styles.empty
                }
              >
                <h2>
                  Your cart is empty
                </h2>

                <Link
                  className={
                    styles.primaryButton
                  }
                  href="/"
                >
                  Return to Shopping
                </Link>
              </div>
            )
            : null
        }

        {
          ready &&
          cart &&
          cart.items.length > 0 &&
          signedIn === false
            ? (
              <div
                className={
                  styles.empty
                }
              >
                <h2>
                  Sign in to checkout
                </h2>

                <p>
                  Your guest cart is saved. Sign in with BazID and it will be attached to your account.
                </p>

                <a
                  className={
                    styles.primaryButton
                  }
                  href={signInUrl()}
                >
                  Continue with BazID
                </a>
              </div>
            )
            : null
        }

        {
          ready &&
          cart &&
          cart.items.length > 0 &&
          signedIn === true &&
          !checkout
            ? (
              <div
                className={
                  styles.layout
                }
              >
                <section
                  className={
                    styles.panel
                  }
                >
                  <div
                    className={
                      styles.panelIntro
                    }
                  >
                    <span
                      className={
                        styles.step
                      }
                    >
                      STEP 1
                    </span>

                    <h2>
                      Delivery address
                    </h2>

                    <p>
                      Choose one saved address. No need to type the same state, LGA and phone details again.
                    </p>
                  </div>

                  {
                    addresses.length === 0
                      ? (
                        <div
                          className="bazaara-checkout-address-empty"
                        >
                          <strong>
                            Add a delivery address
                          </strong>

                          <span>
                            Your Address Book stores Nigeria, state/FCT, LGA/Area Council, phone and street details for reuse.
                          </span>

                          <Link
                            href="/account/addresses"
                          >
                            Open Address Book
                          </Link>
                        </div>
                      )
                      : (
                        <>
                          <div
                            className="bazaara-checkout-address-list"
                          >
                            {
                              addresses.map(
                                (address) => (
                                  <label
                                    className={
                                      selectedAddress?.id === address.id
                                        ? "bazaara-checkout-address-card is-selected"
                                        : "bazaara-checkout-address-card"
                                    }
                                    key={address.id}
                                  >
                                    <input
                                      type="radio"
                                      name="delivery-address"
                                      checked={
                                        selectedAddress?.id === address.id
                                      }
                                      onChange={
                                        () =>
                                          setSelectedAddressId(
                                            address.id
                                          )
                                      }
                                    />

                                    <span
                                      className="bazaara-checkout-address-copy"
                                    >
                                      <span>
                                        <strong>
                                          {address.label}
                                        </strong>

                                        {
                                          address.isDefault
                                            ? (
                                              <small>
                                                Default
                                              </small>
                                            )
                                            : null
                                        }
                                      </span>

                                      <b>
                                        {
                                          address.recipientName
                                        }
                                      </b>

                                      <span>
                                        {
                                          address.building
                                            ? `${address.building}, `
                                            : ""
                                        }
                                        {address.street}
                                      </span>

                                      <span>
                                        {
                                          address.city
                                        }, {
                                          address.lga
                                        }, {
                                          address.state
                                        }
                                      </span>

                                      <span>
                                        Postal code {
                                          address.postalCode ||
                                          "required"
                                        }
                                      </span>

                                      <span>
                                        {
                                          formatNigeriaPhone(
                                            address.phoneNational
                                          )
                                        }
                                      </span>
                                    </span>
                                  </label>
                                )
                              )
                            }
                          </div>

                          <div
                            className="bazaara-checkout-address-actions"
                          >
                            <Link
                              href="/account/addresses"
                            >
                              Manage addresses
                            </Link>

                            <Link
                              href="/account/addresses"
                            >
                              + Add another address
                            </Link>
                          </div>
                        </>
                      )
                  }

                  <div
                    className="bazaara-checkout-delivery-process"
                  >
                    <div
                      className="bazaara-checkout-delivery-process-head"
                    >
                      <div>
                        <small>
                          STEP 2
                        </small>

                        <h3>
                          Delivery process
                        </h3>

                        <p>
                          Choose how you want this order delivered. Final delivery fee and availability are confirmed by checkout.
                        </p>
                      </div>
                    </div>

                    <div
                      className="bazaara-checkout-delivery-process-options"
                    >
                      {
                        DELIVERY_PROCESSES.map(
                          (option) => {
                            const available = deliveryAvailability[option.id];
                            return (
                              <label
                                className={`${deliveryProcess === option.id ? "bazaara-checkout-delivery-option is-selected" : "bazaara-checkout-delivery-option"}${available ? "" : " is-disabled"}`}
                                key={option.id}
                              >
                                <input
                                  type="radio"
                                  name="delivery-process"
                                  value={option.id}
                                  checked={deliveryProcess === option.id}
                                  disabled={!available}
                                  onChange={() => setDeliveryProcess(option.id)}
                                />

                                <span className="bazaara-checkout-delivery-option-copy">
                                  <span>
                                    <strong>{option.title}</strong>
                                    <small>{available ? option.badge : "Unavailable"}</small>
                                  </span>
                                  <span>{available ? option.description : "Unavailable for one or more cart items."}</span>
                                </span>
                              </label>
                            );
                          }
                        )
                      }

                      {deliveryProcess === "scheduled" ? (
                        <label className="bazaara-checkout-scheduled-field">
                          <span>Delivery date & time</span>
                          <input
                            type="datetime-local"
                            value={scheduledFor}
                            min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                            max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                            onChange={(event) => setScheduledFor(event.target.value)}
                            required
                          />
                        </label>
                      ) : null}

                      <div
                        className="bazaara-checkout-delivery-option is-disabled"
                        aria-disabled="true"
                      >
                        <span
                          className="bazaara-checkout-delivery-disabled-dot"
                          aria-hidden="true"
                        />

                        <span
                          className="bazaara-checkout-delivery-option-copy"
                        >
                          <span>
                            <strong>
                              Pickup point
                            </strong>

                            <small>
                              Coming with pickup locations
                            </small>
                          </span>

                          <span>
                            Pickup selection stays disabled until the platform has a confirmed pickup-point/location service.
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className={
                      styles.primaryButton
                    }
                    type="button"
                    disabled={
                      busy ||
                      !selectedAddress
                    }
                    onClick={
                      () =>
                        void startCheckout()
                    }
                  >
                    {
                      busy
                        ? "Reserving stock…"
                        : "Review order"
                    }
                  </button>
                </section>

                <aside
                  className={
                    styles.summary
                  }
                >
                  <span
                    className={
                      styles.summaryEyebrow
                    }
                  >
                    ORDER SUMMARY
                  </span>

                  <h2>
                    Cart summary
                  </h2>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Items ({cart.itemCount})
                    </span>

                    <strong>
                      {
                        formatMoney(
                          cart.subtotalMinor,
                          cart.currency
                        )
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Platform fee (2%)
                    </span>

                    <strong>
                      {
                        feePreview
                          ? formatMoney(
                              feePreview.platformFeeMinor,
                              cart.currency
                            )
                          : "—"
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      {
                        deliveryProcessLabel(
                          deliveryProcess
                        )
                      }
                    </span>

                    <strong>
                      {
                        feePreview
                          ? formatMoney(
                              feePreview.deliveryFeeMinor,
                              cart.currency
                            )
                          : "—"
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      `${styles.summaryRow} ${styles.summaryTotal}`
                    }
                  >
                    <span>
                      Estimated total
                    </span>

                    <strong>
                      {
                        feePreview
                          ? formatMoney(
                              feePreview.estimatedTotalMinor,
                              cart.currency
                            )
                          : formatMoney(
                              cart.subtotalMinor,
                              cart.currency
                            )
                      }
                    </strong>
                  </div>

                  <p
                    className={
                      styles.summaryNote
                    }
                  >
                    Fee preview: platform fee is 2% of item subtotal. Standard delivery is ₦1,000–₦3,000 and Express is ₦5,000–₦10,000 by cart value. Final payable fees must be confirmed by Platform API before payment.
                  </p>
                </aside>
              </div>
            )
            : null
        }

        {
          checkout
            ? (
              <div
                className={
                  styles.layout
                }
              >
                <section
                  className={
                    styles.panel
                  }
                >
                  <div
                    className={
                      styles.panelIntro
                    }
                  >
                    <span
                      className={
                        styles.step
                      }
                    >
                      STEP 3
                    </span>

                    <h2>
                      Review your order
                    </h2>

                    <p>
                      Verify sellers, item quantities, delivery and payment before placing the order.
                    </p>
                  </div>

                  {
                    selectedAddress
                      ? (
                        <div
                          className="bazaara-checkout-selected-address"
                        >
                          <small>
                            DELIVER TO
                          </small>

                          <strong>
                            {
                              selectedAddress.recipientName
                            }
                          </strong>

                          <span>
                            {
                              selectedAddress.building
                                ? `${selectedAddress.building}, `
                                : ""
                            }
                            {selectedAddress.street}, {
                              selectedAddress.city
                            }, {
                              selectedAddress.lga
                            }, {
                              selectedAddress.state
                            }
                          </span>

                          <span>
                            Postal code {
                              selectedAddress.postalCode
                            }
                          </span>

                          <span>
                            {
                              formatNigeriaPhone(
                                selectedAddress.phoneNational
                              )
                            }
                          </span>

                          <span
                            className="bazaara-checkout-delivery-review"
                          >
                            {
                              deliveryProcessLabel(
                                deliveryProcess
                              )
                            }
                          </span>
                        </div>
                      )
                      : null
                  }

                  <div
                    className={
                      styles.sellers
                    }
                  >
                    {
                      checkout.sellers.map(
                        (seller) => (
                          <article
                            key={
                              seller.merchantId
                            }
                            className={
                              styles.seller
                            }
                          >
                            <div
                              className={
                                styles.sellerHead
                              }
                            >
                              <strong>
                                {
                                  seller.sellerName
                                }
                              </strong>

                              <span>
                                {
                                  formatMoney(
                                    seller.subtotalMinor,
                                    checkout.currency
                                  )
                                }
                              </span>
                            </div>

                            {
                              seller.items.map(
                                (item) => (
                                  <div
                                    className={
                                      styles.line
                                    }
                                    key={item.id}
                                  >
                                    <span>
                                      {
                                        item.productTitle
                                      }

                                      <small>
                                        {
                                          item.variantTitle
                                        } · Qty {
                                          item.quantity
                                        }
                                      </small>
                                    </span>

                                    <strong>
                                      {
                                        formatMoney(
                                          item.lineTotalMinor,
                                          checkout.currency
                                        )
                                      }
                                    </strong>
                                  </div>
                                )
                              )
                            }
                          </article>
                        )
                      )
                    }
                  </div>
                </section>

                <aside
                  className={
                    styles.summary
                  }
                >
                  <span
                    className={
                      styles.summaryEyebrow
                    }
                  >
                    CHECKOUT SUMMARY
                  </span>

                  <h2>
                    Final review
                  </h2>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Items
                    </span>

                    <strong>
                      {
                        formatMoney(
                          checkout.subtotalMinor,
                          checkout.currency
                        )
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Delivery
                    </span>

                    <strong>
                      {
                        formatMoney(
                          checkout.shippingMinor,
                          checkout.currency
                        )
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Platform fee preview (2%)
                    </span>

                    <strong>
                      {
                        feePreview
                          ? formatMoney(
                              feePreview.platformFeeMinor,
                              checkout.currency
                            )
                          : "—"
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.summaryRow
                    }
                  >
                    <span>
                      Delivery policy preview
                    </span>

                    <strong>
                      {
                        feePreview
                          ? formatMoney(
                              feePreview.deliveryFeeMinor,
                              checkout.currency
                            )
                          : "—"
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      `${styles.summaryRow} ${styles.summaryTotal}`
                    }
                  >
                    <span>
                      Server checkout total
                    </span>

                    <strong>
                      {
                        formatMoney(
                          checkout.totalMinor,
                          checkout.currency
                        )
                      }
                    </strong>
                  </div>

                  <div className={styles.paymentMethods}>
                    <span className={styles.summaryEyebrow}>PAYMENT METHOD</span>
                    {checkout.paymentMethods.filter((method) => method.key !== "BAZAARA_PAY").map((method) => (
                      <button key={method.key} type="button" disabled={busy || !method.available} onClick={() => void changePaymentMethod(method.key)} className={`${styles.paymentMethod} ${checkout.paymentMethod === method.key ? styles.paymentMethodActive : ""}`}>
                        <span>{method.label}</span>
                        <small>{method.available ? (method.key.startsWith("PAYSTACK_") ? "Provider-confirmed secure payment" : "Pay when the order arrives") : method.reason}</small>
                      </button>
                    ))}
                  </div>

                  {
                    feePreview
                      ? (
                        <div
                          className="bazaara-fee-policy-notice"
                        >
                          <strong>
                            Pricing policy preview
                          </strong>

                          <span>
                            Expected Bazaara total with the requested fee policy: {
                              formatMoney(
                                feePreview.estimatedTotalMinor,
                                checkout.currency
                              )
                            }. Payment remains tied to the server checkout total until Platform API fee enforcement is added.
                          </span>
                        </div>
                      )
                      : null
                  }

                  <button
                    className={
                      styles.primaryButton
                    }
                    type="button"
                    disabled={busy}
                    onClick={
                      () =>
                        void placeOrder()
                    }
                  >
                    {
                      busy
                        ? "Placing order…"
                        : checkout.paymentMethod.startsWith("PAYSTACK_") ? "Place order & pay securely" : "Place order"
                    }
                  </button>
                </aside>
              </div>
            )
            : null
        }

        {
          error
            ? (
              <div
                className={
                  styles.error
                }
                role="alert"
              >
                {error}
              </div>
            )
            : null
        }
      </main>
    </div>
  );
}
