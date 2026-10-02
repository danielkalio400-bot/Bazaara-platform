"use client";

import {
  useState
} from "react";


type JsonRecord =
  Record<string, unknown>;


type ReorderItem = {
  variantId: string | null;
  quantity: number;
  title: string;
};


type ReorderSummary = {
  requestedUnits: number;
  addedUnits: number;
  addedLines: number;
  skippedLines: number;
  reducedLines: number;
  cart: unknown;
};


const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";


function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function getString(
  value: unknown,
  keys: string[]
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate =
      value[key];

    if (
      typeof candidate === "string" &&
      candidate.trim() !== ""
    ) {
      return candidate;
    }
  }

  return null;
}


function getNumber(
  value: unknown,
  keys: string[]
): number | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate =
      value[key];

    if (
      typeof candidate === "number" &&
      Number.isFinite(candidate)
    ) {
      return candidate;
    }

    if (
      typeof candidate === "string" &&
      candidate.trim() !== ""
    ) {
      const parsed =
        Number(candidate);

      if (
        Number.isFinite(parsed)
      ) {
        return parsed;
      }
    }
  }

  return null;
}


function nestedRecord(
  value: unknown,
  keys: string[]
): JsonRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate =
      value[key];

    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return null;
}


function resolveVariantId(
  item: unknown
): string | null {
  const direct =
    getString(
      item,
      [
        "variantId",
        "productVariantId",
        "skuId"
      ]
    );

  if (direct) {
    return direct;
  }

  const nested =
    nestedRecord(
      item,
      [
        "variant",
        "productVariant",
        "sku"
      ]
    );

  return nested
    ? getString(
        nested,
        [
          "id",
          "variantId",
          "productVariantId"
        ]
      )
    : null;
}


function resolveTitle(
  item: unknown
) {
  return (
    getString(
      item,
      [
        "productTitle",
        "title",
        "name"
      ]
    ) ??
    "Order item"
  );
}


function resolveQuantity(
  item: unknown
) {
  return Math.max(
    1,
    Math.trunc(
      getNumber(
        item,
        [
          "quantity",
          "qty"
        ]
      ) ??
      1
    )
  );
}


function extractOrder(
  value: unknown
): JsonRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  if (isRecord(value.order)) {
    return value.order;
  }

  if (
    isRecord(value.data) &&
    isRecord(value.data.order)
  ) {
    return value.data.order;
  }

  return value;
}


function collectOrderItems(
  orderPayload: unknown
): ReorderItem[] {
  const order =
    extractOrder(
      orderPayload
    );

  if (!order) {
    return [];
  }

  const sellerOrders =
    Array.isArray(
      order.sellerOrders
    )
      ? order.sellerOrders
      : [];

  const items: ReorderItem[] =
    [];

  for (const sellerOrder of sellerOrders) {
    if (!isRecord(sellerOrder)) {
      continue;
    }

    const sellerItems =
      Array.isArray(
        sellerOrder.items
      )
        ? sellerOrder.items
        : [];

    for (const item of sellerItems) {
      items.push(
        {
          variantId:
            resolveVariantId(
              item
            ),

          quantity:
            resolveQuantity(
              item
            ),

          title:
            resolveTitle(
              item
            )
        }
      );
    }
  }

  return items;
}


function extractCart(
  value: unknown
): JsonRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  if (isRecord(value.cart)) {
    return value.cart;
  }

  if (
    isRecord(value.data) &&
    isRecord(value.data.cart)
  ) {
    return value.data.cart;
  }

  if (
    Array.isArray(value.items)
  ) {
    return value;
  }

  return null;
}


function cartItems(
  value: unknown
): unknown[] {
  const cart =
    extractCart(
      value
    );

  if (!cart) {
    return [];
  }

  return Array.isArray(
    cart.items
  )
    ? cart.items
    : [];
}


function cartVariantId(
  item: unknown
): string | null {
  return resolveVariantId(
    item
  );
}


function cartQuantity(
  item: unknown
) {
  return Math.max(
    0,
    Math.trunc(
      getNumber(
        item,
        [
          "quantity",
          "qty"
        ]
      ) ??
      0
    )
  );
}


function currentQuantityFor(
  cart: unknown,
  variantId: string
) {
  const line =
    cartItems(
      cart
    ).find(
      (
        item
      ) =>
        cartVariantId(
          item
        ) ===
        variantId
    );

  return line
    ? cartQuantity(
        line
      )
    : 0;
}


function extractAvailableQuantity(
  value: unknown,
  depth = 0
): number | null {
  if (
    depth > 6 ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found =
        extractAvailableQuantity(
          entry,
          depth + 1
        );

      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const direct =
    getNumber(
      value,
      [
        "availableQuantity",
        "maxQuantity",
        "available",
        "stock"
      ]
    );

  if (
    direct !== null
  ) {
    return Math.max(
      0,
      Math.trunc(
        direct
      )
    );
  }

  for (const nested of Object.values(value)) {
    const found =
      extractAvailableQuantity(
        nested,
        depth + 1
      );

    if (found !== null) {
      return found;
    }
  }

  return null;
}


async function readJson(
  response: Response
): Promise<unknown> {
  return response
    .json()
    .catch(
      () => null
    );
}


function messageFrom(
  body: unknown,
  fallback: string
) {
  if (!isRecord(body)) {
    return fallback;
  }

  if (
    isRecord(body.error) &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }

  if (
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return fallback;
}


class CartRequestError extends Error {
  body: unknown;

  constructor(
    message: string,
    body: unknown
  ) {
    super(
      message
    );

    this.name =
      "CartRequestError";

    this.body =
      body;
  }
}


async function getOrder(
  orderId: string
) {
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
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      messageFrom(
        body,
        "Could not load this order."
      )
    );
  }

  return body;
}


async function getCart() {
  const response =
    await fetch(
      `${API}/v1/grocery/cart`,
      {
        credentials:
          "include",

        cache:
          "no-store"
      }
    );

  const body =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      messageFrom(
        body,
        "Could not load your cart."
      )
    );
  }

  return body;
}


async function setCartQuantity(
  variantId: string,
  quantity: number
) {
  const response =
    await fetch(
      `${API}/v1/grocery/cart/items`,
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          "content-type":
            "application/json"
        },

        body:
          JSON.stringify(
            {
              variantId,
              quantity
            }
          )
      }
    );

  const body =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new CartRequestError(
      messageFrom(
        body,
        "This item could not be added."
      ),
      body
    );
  }

  return body;
}


async function reorder(
  orderId: string
): Promise<ReorderSummary> {
  const orderPayload =
    await getOrder(
      orderId
    );

  const items =
    collectOrderItems(
      orderPayload
    );

  if (
    items.length === 0
  ) {
    throw new Error(
      "This order has no items that can be reordered."
    );
  }

  let cart =
    await getCart();

  let requestedUnits =
    0;

  let addedUnits =
    0;

  let addedLines =
    0;

  let skippedLines =
    0;

  let reducedLines =
    0;


  for (const item of items) {
    requestedUnits +=
      item.quantity;

    if (!item.variantId) {
      skippedLines +=
        1;

      continue;
    }

    const current =
      currentQuantityFor(
        cart,
        item.variantId
      );

    const desired =
      current +
      item.quantity;

    try {
      cart =
        await setCartQuantity(
          item.variantId,
          desired
        );

      addedUnits +=
        item.quantity;

      addedLines +=
        1;
    }
    catch (error) {
      if (
        error instanceof CartRequestError
      ) {
        const available =
          extractAvailableQuantity(
            error.body
          );

        if (
          available !== null &&
          available > current
        ) {
          const fallback =
            Math.min(
              desired,
              available
            );

          try {
            cart =
              await setCartQuantity(
                item.variantId,
                fallback
              );

            addedUnits +=
              Math.max(
                0,
                fallback -
                current
              );

            addedLines +=
              1;

            reducedLines +=
              1;

            continue;
          }
          catch {
          }
        }
      }

      skippedLines +=
        1;
    }
  }


  const currentCart =
    extractCart(
      cart
    ) ??
    cart;


  window.dispatchEvent(
    new CustomEvent(
      "bazaara:cart-updated",
      {
        detail:
          currentCart
      }
    )
  );


  return {
    requestedUnits,
    addedUnits,
    addedLines,
    skippedLines,
    reducedLines,
    cart:
      currentCart
  };
}


export function OrderAgainButton({
  orderId,
  compact = false
}: {
  orderId: string;
  compact?: boolean;
}) {
  const [
    busy,
    setBusy
  ] =
    useState(
      false
    );


  const [
    complete,
    setComplete
  ] =
    useState(
      false
    );


  const [
    message,
    setMessage
  ] =
    useState(
      ""
    );


  async function handleClick() {
    if (
      complete
    ) {
      window.location.href =
        "/cart";

      return;
    }

    if (busy) {
      return;
    }

    setBusy(
      true
    );

    setMessage(
      ""
    );

    try {
      const result =
        await reorder(
          orderId
        );

      if (
        result.addedUnits === 0
      ) {
        setMessage(
          "None of these items are currently available to add again."
        );

        return;
      }

      setComplete(
        true
      );

      if (
        result.skippedLines === 0 &&
        result.reducedLines === 0
      ) {
        setMessage(
          `${result.addedUnits} item${result.addedUnits === 1 ? "" : "s"} added using current price and availability.`
        );
      }
      else {
        const notes =
          [];

        if (
          result.reducedLines > 0
        ) {
          notes.push(
            `${result.reducedLines} line${result.reducedLines === 1 ? "" : "s"} reduced to current stock`
          );
        }

        if (
          result.skippedLines > 0
        ) {
          notes.push(
            `${result.skippedLines} unavailable line${result.skippedLines === 1 ? "" : "s"} skipped`
          );
        }

        setMessage(
          `${result.addedUnits} of ${result.requestedUnits} requested item${result.requestedUnits === 1 ? "" : "s"} added. ${notes.join(". ")}.`
        );
      }
    }
    catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add this order to your cart again."
      );
    }
    finally {
      setBusy(
        false
      );
    }
  }


  return (
    <div
      className={
        compact
          ? "order-again-wrap order-again-wrap-compact"
          : "order-again-wrap"
      }
    >
      <button
        type="button"
        className={
          complete
            ? "order-again-button order-again-button-complete"
            : "order-again-button"
        }
        disabled={
          busy
        }
        onClick={
          () =>
            void handleClick()
        }
      >
        {
          busy
            ? "Checking items..."
            : complete
              ? "View cart"
              : "Order again"
        }
      </button>

      {message ? (
        <span
          className="order-again-message"
          role="status"
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
