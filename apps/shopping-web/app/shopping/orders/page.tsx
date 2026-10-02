"use client";

import Link from "next/link";
import {
  useEffect,
  useState
} from "react";

import {
  OrderAgainButton
} from "../../../components/order-again-button";

import {
  ShoppingHeader
} from "../../../components/shopping-header";

import {
  formatMoney,
  ShoppingOrder
} from "../../../lib/shopping";


const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";


const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ??
  "http://localhost:3004";


function itemCount(
  order: ShoppingOrder
) {
  return order.sellerOrders.reduce(
    (
      total,
      sellerOrder
    ) =>
      total +
      sellerOrder.items.reduce(
        (
          sellerTotal,
          item
        ) =>
          sellerTotal +
          item.quantity,
        0
      ),
    0
  );
}


export default function OrdersPage() {
  const [
    orders,
    setOrders
  ] =
    useState<ShoppingOrder[] | null>(
      null
    );


  const [
    error,
    setError
  ] =
    useState(
      ""
    );


  useEffect(
    () => {
      void (
        async () => {
          try {
            const response =
              await fetch(
                `${API}/v1/shopping/orders`,
                {
                  credentials:
                    "include",

                  cache:
                    "no-store"
                }
              );


            if (
              response.status ===
              401
            ) {
              setError(
                "SIGN_IN"
              );

              setOrders(
                []
              );

              return;
            }


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
                "Could not load orders"
              );
            }


            setOrders(
              body.orders
            );
          }
          catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not load orders"
            );
          }
        }
      )();
    },
    []
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
          className="catalogue-heading"
        >
          <div>
            <span
              className="eyebrow"
            >
              Shopping
            </span>

            <h1
              className="cart-title"
            >
              Your orders
            </h1>

            <p
              className="muted-copy"
            >
              Review previous purchases, open order details, or add available items to your cart again.
            </p>
          </div>
        </div>


        {
          orders === null &&
          !error
            ? (
              <div
                className="shop-empty"
              >
                Loading your orders...
              </div>
            )
            : error ===
              "SIGN_IN"
              ? (
                <div
                  className="shop-empty"
                >
                  <h2>
                    Sign in to view orders
                  </h2>

                  <p>
                    Your purchases, delivery progress, cancellations and returns are connected to BazID.
                  </p>

                  <a
                    className="primary-shop-button inline-button"
                    href={`${BAZID}/bazid/sign-in`}
                  >
                    Sign in with BazID
                  </a>
                </div>
              )
              : orders?.length ===
                0
                ? (
                  <div
                    className="shop-empty"
                  >
                    <h2>
                      No orders yet
                    </h2>

                    <p>
                      Orders you place through Shopping will appear here.
                    </p>

                    <Link
                      className="primary-shop-button inline-button"
                      href="/"
                    >
                      Start shopping
                    </Link>
                  </div>
                )
                : (
                  <div
                    className="order-list order-list-actions"
                  >
                    {
                      orders?.map(
                        (
                          order
                        ) => (
                          <article
                            key={
                              order.id
                            }
                            className="order-card order-card-with-actions"
                          >
                            <Link
                              href={`/orders/${order.id}`}
                              className="order-card-main-link"
                            >
                              <div>
                                <span
                                  className="eyebrow"
                                >
                                  {
                                    order.orderNumber
                                  }
                                </span>

                                <h2>
                                  {
                                    order.sellerOrders
                                      .map(
                                        (
                                          sellerOrder
                                        ) =>
                                          sellerOrder.seller.name
                                      )
                                      .join(
                                        ", "
                                      )
                                  }
                                </h2>

                                <p>
                                  {
                                    new Date(
                                      order.placedAt
                                    ).toLocaleString(
                                      "en-NG"
                                    )
                                  }
                                  {" · "}
                                  {
                                    itemCount(
                                      order
                                    )
                                  }
                                  {" "}
                                  item(s)
                                </p>
                              </div>


                              <div
                                className="order-card-side"
                              >
                                <span
                                  className={`status-pill status-${order.status.toLowerCase()}`}
                                >
                                  {
                                    order.status.replaceAll(
                                      "_",
                                      " "
                                    )
                                  }
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
                            </Link>


                            <div
                              className="order-card-actions"
                            >
                              <OrderAgainButton
                                orderId={
                                  order.id
                                }
                                compact
                              />


                              <Link
                                className="order-details-button"
                                href={`/orders/${order.id}`}
                              >
                                View details
                              </Link>
                            </div>
                          </article>
                        )
                      )
                    }
                  </div>
                )
        }


        {
          error &&
          error !==
            "SIGN_IN"
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
