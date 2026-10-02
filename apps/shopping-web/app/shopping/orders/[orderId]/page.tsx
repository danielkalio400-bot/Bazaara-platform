"use client";

import Link from "next/link";

import {
  use,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  OrderAgainButton
} from "../../../../components/order-again-button";

import {
  ShoppingHeader
} from "../../../../components/shopping-header";

import {
  formatMoney,
  ShoppingOrder
} from "../../../../lib/shopping";


const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";


export default function OrderDetailPage({
  params
}: {
  params:
    Promise<{
      orderId: string;
    }>;
}) {
  const {
    orderId
  } =
    use(
      params
    );


  const [
    order,
    setOrder
  ] =
    useState<ShoppingOrder | null>(
      null
    );


  const [
    error,
    setError
  ] =
    useState(
      ""
    );


  const [
    busy,
    setBusy
  ] =
    useState(
      false
    );


  const [
    returnOpen,
    setReturnOpen
  ] =
    useState(
      false
    );


  const [
    selected,
    setSelected
  ] =
    useState<Record<string, boolean>>(
      {}
    );


  async function load() {
    setError(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/v1/shopping/orders/${encodeURIComponent(orderId)}`,
          {
            credentials:
              "include",

            cache:
              "no-store"
          }
        );


      const body =
        await response
          .json()
          .catch(
            () => null
          );


      if (
        !response.ok
      ) {
        throw new Error(
          body?.error?.message ??
          "Could not load order"
        );
      }


      setOrder(
        body.order
      );
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load order"
      );
    }
  }


  useEffect(
    () => {
      void load();
    },
    [
      orderId
    ]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "return") return;
    void (async () => {
      try {
        await fetch(`${API}/v1/shopping/orders/${encodeURIComponent(orderId)}/payment/reconcile`, { method: "POST", credentials: "include" });
      } finally {
        params.delete("payment");
        const suffix = params.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${suffix ? `?${suffix}` : ""}`);
        await load();
      }
    })();
  }, [orderId]);


  const allItems =
    useMemo(
      () =>
        order?.sellerOrders.flatMap(
          (
            sellerOrder
          ) =>
            sellerOrder.items
        ) ??
        [],
      [
        order
      ]
    );


  async function payOnline() {
    if (!order || order.paymentMethod === "PAY_ON_DELIVERY" || order.paymentStatus === "PAID") return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/v1/shopping/orders/${encodeURIComponent(order.id)}/payment/initialize`, { method: "POST", credentials: "include", headers: { "idempotency-key": crypto.randomUUID(), "content-type": "application/json" }, body: JSON.stringify({ returnOrigin: window.location.origin }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not start secure payment");
      if (body?.checkoutUrl) window.location.assign(body.checkoutUrl);
      else await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start secure payment"); }
    finally { setBusy(false); }
  }

  async function cancel() {
    if (
      !confirm(
        "Cancel this order? Stock will be released back to the sellers."
      )
    ) {
      return;
    }


    setBusy(
      true
    );


    try {
      const response =
        await fetch(
          `${API}/v1/shopping/orders/${encodeURIComponent(orderId)}/cancel`,
          {
            method:
              "POST",

            credentials:
              "include"
          }
        );


      const body =
        await response
          .json()
          .catch(
            () => null
          );


      if (
        !response.ok
      ) {
        throw new Error(
          body?.error?.message ??
          "Could not cancel order"
        );
      }


      setOrder(
        body.order
      );
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not cancel order"
      );
    }
    finally {
      setBusy(
        false
      );
    }
  }


  async function requestReturn(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    const form =
      new FormData(
        event.currentTarget
      );


    const items =
      allItems
        .filter(
          (
            item
          ) =>
            selected[
              item.id
            ]
        )
        .map(
          (
            item
          ) => (
            {
              orderItemId:
                item.id,

              quantity:
                Number(
                  form.get(
                    `qty:${item.id}`
                  ) ??
                  1
                )
            }
          )
        );


    if (
      items.length ===
      0
    ) {
      setError(
        "Select at least one item to return"
      );

      return;
    }


    setBusy(
      true
    );

    setError(
      ""
    );


    try {
      const response =
        await fetch(
          `${API}/v1/shopping/orders/${encodeURIComponent(orderId)}/returns`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "content-type":
                "application/json"
            },

            body:
              JSON.stringify(
                {
                  reason:
                    form.get(
                      "reason"
                    ),

                  details:
                    form.get(
                      "details"
                    ) ||
                    undefined,

                  evidence:
                    String(form.get("evidenceUrl") ?? "").trim()
                      ? [{
                          type: String(form.get("evidenceType") ?? "PHOTO"),
                          url: String(form.get("evidenceUrl") ?? "").trim(),
                          note: String(form.get("evidenceNote") ?? "").trim() || undefined
                        }]
                      : undefined,

                  items
                }
              )
          }
        );


      const body =
        await response
          .json()
          .catch(
            () => null
          );


      if (
        !response.ok
      ) {
        throw new Error(
          body?.error?.message ??
          "Could not request return"
        );
      }


      setOrder(
        body.order
      );


      setReturnOpen(
        false
      );
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not request return"
      );
    }
    finally {
      setBusy(
        false
      );
    }
  }


  async function openDispute(
    event: React.FormEvent<HTMLFormElement>,
    returnId: string
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("disputeReason") ?? "").trim();
    const details = String(form.get("disputeDetails") ?? "").trim();
    if (reason.length < 3) {
      setError("Enter a dispute reason");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/v1/shopping/returns/${encodeURIComponent(returnId)}/disputes`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not escalate return dispute");
      await load();
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not escalate return dispute");
    } finally {
      setBusy(false);
    }
  }


  if (!order) {
    return (
      <div
        className="shop-shell"
      >
        <ShoppingHeader />


        <main
          className="shop-main"
        >
          {
            error
              ? (
                <div
                  className="form-error"
                >
                  {
                    error
                  }
                </div>
              )
              : (
                <div
                  className="shop-empty"
                >
                  Loading order...
                </div>
              )
          }
        </main>
      </div>
    );
  }


  const address =
    order.shippingAddress as Record<string, string>;


  const cancellable =
    [
      "PLACED",
      "CONFIRMED"
    ].includes(
      order.status
    );


  return (
    <div
      className="shop-shell"
    >
      <ShoppingHeader />


      <main
        className="shop-main"
      >
        <div
          className="breadcrumbs"
        >
          <Link
            href="/orders"
          >
            Orders
          </Link>

          <span>
            /
          </span>

          <span>
            {
              order.orderNumber
            }
          </span>
        </div>


        <div
          className="order-hero order-hero-actions-upgraded"
        >
          <div>
            <span
              className="eyebrow"
            >
              Order {
                order.orderNumber
              }
            </span>

            <h1>
              {
                order.status.replaceAll(
                  "_",
                  " "
                )
              }
            </h1>

            <p>
              Placed {
                new Date(
                  order.placedAt
                ).toLocaleString(
                  "en-NG"
                )
              }
            </p>
          </div>


          <div
            className="order-actions order-actions-upgraded"
          >
            <OrderAgainButton
              orderId={
                order.id
              }
            />


            {
              cancellable
                ? (
                  <button
                    className="secondary-shop-button order-action-button"
                    disabled={
                      busy
                    }
                    onClick={
                      () =>
                        void cancel()
                    }
                  >
                    Cancel order
                  </button>
                )
                : null
            }


            {
              order.status ===
              "DELIVERED"
                ? (
                  <button
                    className="primary-shop-button order-action-button"
                    onClick={
                      () =>
                        setReturnOpen(
                          (
                            value
                          ) =>
                            !value
                        )
                    }
                  >
                    Request return
                  </button>
                )
                : null
            }
          </div>
        </div>


        <div
          className="order-detail-grid"
        >
          <section
            className="order-main"
          >
            {
              order.sellerOrders.map(
                (
                  seller
                ) => (
                  <article
                    className="seller-order-card"
                    key={
                      seller.id
                    }
                  >
                    <div
                      className="seller-order-head"
                    >
                      <div>
                        <strong>
                          {
                            seller.seller.name
                          }
                        </strong>

                        <small>
                          {
                            seller.store.name
                          }
                        </small>
                      </div>


                      <span
                        className={`status-pill status-${seller.status.toLowerCase()}`}
                      >
                        {
                          seller.status.replaceAll(
                            "_",
                            " "
                          )
                        }
                      </span>
                    </div>


                    {
                      seller.items.map(
                        (
                          item
                        ) => (
                          <div
                            className="order-item-row"
                            key={
                              item.id
                            }
                          >
                            <div>
                              <strong>
                                {
                                  item.productTitle
                                }
                              </strong>

                              <small>
                                {
                                  item.variantTitle
                                }
                                {" · "}
                                {
                                  item.sku
                                }
                                {" · Qty "}
                                {
                                  item.quantity
                                }
                              </small>
                            </div>


                            <strong>
                              {
                                formatMoney(
                                  item.lineTotalMinor,
                                  order.currency
                                )
                              }
                            </strong>
                          </div>
                        )
                      )
                    }


                    <div
                      className="order-subtotal"
                    >
                      <span>
                        Seller total
                      </span>

                      <strong>
                        {
                          formatMoney(
                            seller.totalMinor,
                            order.currency
                          )
                        }
                      </strong>
                    </div>
                  </article>
                )
              )
            }


            {
              returnOpen
                ? (
                  <form
                    className="return-panel"
                    onSubmit={
                      requestReturn
                    }
                  >
                    <h2>
                      Request a return
                    </h2>

                    <p>
                      Select the delivered items you want reviewed for return eligibility.
                    </p>


                    {
                      allItems.map(
                        (
                          item
                        ) => (
                          <label
                            className="return-item"
                            key={
                              item.id
                            }
                          >
                            <input
                              type="checkbox"
                              checked={
                                Boolean(
                                  selected[
                                    item.id
                                  ]
                                )
                              }
                              onChange={
                                (
                                  event
                                ) =>
                                  setSelected(
                                    (
                                      value
                                    ) => (
                                      {
                                        ...value,

                                        [
                                          item.id
                                        ]:
                                          event.target.checked
                                      }
                                    )
                                  )
                              }
                            />


                            <span>
                              {
                                item.productTitle
                              }

                              <small>
                                {
                                  item.variantTitle
                                }
                              </small>
                            </span>


                            <input
                              name={`qty:${item.id}`}
                              type="number"
                              min={
                                1
                              }
                              max={
                                item.quantity
                              }
                              defaultValue={
                                1
                              }
                              disabled={
                                !selected[
                                  item.id
                                ]
                              }
                            />
                          </label>
                        )
                      )
                    }


                    <label>
                      Reason

                      <select
                        name="reason"
                        required
                        defaultValue=""
                      >
                        <option
                          value=""
                          disabled
                        >
                          Select a reason
                        </option>

                        <option>
                          Item arrived damaged
                        </option>

                        <option>
                          Wrong item received
                        </option>

                        <option>
                          Item differs from description
                        </option>

                        <option>
                          Changed my mind
                        </option>

                        <option>
                          Other
                        </option>
                      </select>
                    </label>


                    <label>
                      Details

                      <textarea
                        name="details"
                        rows={
                          3
                        }
                        maxLength={
                          1000
                        }
                      />
                    </label>

                    <div className="return-evidence-fields">
                      <label>
                        Evidence type
                        <select name="evidenceType" defaultValue="PHOTO">
                          <option value="PHOTO">Photo</option>
                          <option value="VIDEO">Video</option>
                          <option value="DOCUMENT">Document</option>
                        </select>
                      </label>
                      <label>
                        Evidence URL (optional)
                        <input name="evidenceUrl" type="url" placeholder="https://…" maxLength={2000} />
                      </label>
                      <label>
                        Evidence note
                        <input name="evidenceNote" maxLength={400} placeholder="What does this show?" />
                      </label>
                    </div>


                    <button
                      className="primary-shop-button"
                      disabled={
                        busy
                      }
                    >
                      {
                        busy
                          ? "Submitting..."
                          : "Submit return request"
                      }
                    </button>
                  </form>
                )
                : null
            }

            {
              order.returns.length
                ? (
                  <div className="return-history">
                    <h2>Returns & refunds</h2>
                    {order.returns.map((returnCase) => {
                      const openDisputeCase = returnCase.disputes.find((dispute) => ["OPEN", "UNDER_REVIEW"].includes(dispute.status));
                      const canDispute = ["REJECTED", "PARTIALLY_REFUNDED", "REFUND_PENDING", "REFUNDED"].includes(returnCase.status) && !openDisputeCase;
                      return (
                        <article className="return-history-card" key={returnCase.id}>
                          <div className="return-history-head">
                            <div>
                              <span className={`status-pill status-${returnCase.status.toLowerCase()}`}>{returnCase.status.replaceAll("_", " ")}</span>
                              <strong>{returnCase.reason}</strong>
                              <small>Requested {new Date(returnCase.requestedAt).toLocaleString("en-NG")}</small>
                            </div>
                            <strong>{formatMoney(returnCase.approvedRefundMinor ?? returnCase.requestedRefundMinor ?? 0, order.currency)}</strong>
                          </div>
                          {returnCase.returnTrackingId ? <p className="muted-copy">Return tracking: {returnCase.returnCarrier ?? "Carrier"} · {returnCase.returnTrackingId}</p> : null}
                          {returnCase.evidence.length ? <div className="return-evidence-links">{returnCase.evidence.map((evidence) => <a key={evidence.id} href={evidence.url} target="_blank" rel="noreferrer">{evidence.type}{evidence.note ? ` · ${evidence.note}` : ""}</a>)}</div> : null}
                          {returnCase.refunds.length ? <div className="return-refunds">{returnCase.refunds.map((refund) => <span key={refund.id}>{refund.status.replaceAll("_", " ")} · {formatMoney(refund.amountMinor, order.currency)}</span>)}</div> : null}
                          {openDisputeCase ? <div className="return-dispute-state"><strong>Dispute {openDisputeCase.status.replaceAll("_", " ")}</strong><span>{openDisputeCase.reason}</span></div> : null}
                          {canDispute ? (
                            <form className="return-dispute-form" onSubmit={(event) => void openDispute(event, returnCase.id)}>
                              <strong>Escalate a dispute</strong>
                              <input name="disputeReason" required minLength={3} maxLength={160} placeholder="Why should this return decision be reviewed?" />
                              <textarea name="disputeDetails" rows={2} maxLength={1200} placeholder="Optional supporting details" />
                              <button className="secondary-shop-button" disabled={busy}>Submit dispute</button>
                            </form>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )
                : null
            }
          </section>


          <aside
            className="cart-summary"
          >
            <h2>
              Order summary
            </h2>


            <div>
              <span>
                Items
              </span>

              <strong>
                {
                  formatMoney(
                    order.subtotalMinor,
                    order.currency
                  )
                }
              </strong>
            </div>


            <div>
              <span>
                Delivery
              </span>

              <strong>
                {
                  formatMoney(
                    order.shippingMinor,
                    order.currency
                  )
                }
              </strong>
            </div>


            <div>
              <span>
                Delivery method
              </span>

              <span>
                {order.deliveryMode === "SCHEDULED" && order.scheduledFor
                  ? `Scheduled · ${new Date(order.scheduledFor).toLocaleString("en-NG")}`
                  : order.deliveryMode.replaceAll("_", " ")}
              </span>
            </div>


            <div>
              <span>
                Payment
              </span>

              <span>
                {
                  order.paymentMethod.replaceAll(
                    "_",
                    " "
                  )
                }
              </span>
            </div>


            <div>
              <span>
                Payment status
              </span>

              <span>
                {
                  order.paymentStatus.replaceAll(
                    "_",
                    " "
                  )
                }
              </span>
            </div>


            {order.paymentMethod !== "PAY_ON_DELIVERY" && order.paymentStatus !== "PAID" && !["CANCELLED","REFUNDED"].includes(order.paymentStatus) ? (
              <button className="primary-shop-button" type="button" disabled={busy} onClick={() => void payOnline()}>
                {busy ? "Opening secure payment…" : "Pay securely"}
              </button>
            ) : null}

            <div
              className="summary-total"
            >
              <span>
                Total
              </span>

              <strong>
                {
                  formatMoney(
                    order.totalMinor,
                    order.currency
                  )
                }
              </strong>
            </div>


            <div
              className="address-block"
            >
              <strong>
                Deliver to
              </strong>

              <span>
                {
                  address.fullName
                }
              </span>

              <span>
                {
                  address.phone
                }
              </span>

              <span>
                {
                  [
                    address.building,
                    address.street,
                    address.district,
                    address.city,
                    address.region
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      ", "
                    )
                }
              </span>

              {
                address.landmark
                  ? (
                    <span>
                      Near {
                        address.landmark
                      }
                    </span>
                  )
                  : null
              }
            </div>
          </aside>
        </div>


        {
          error
            ? (
              <div
                className="form-error"
                role="alert"
              >
                {
                  error
                }
              </div>
            )
            : null
        }
      </main>
    </div>
  );
}
