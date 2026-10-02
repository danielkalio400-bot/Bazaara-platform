"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import styles from "./add-to-cart.module.css";

type JsonRecord =
  Record<string, unknown>;

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
  record: JsonRecord,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value =
      record[key];

    if (
      typeof value === "string" &&
      value.length > 0
    ) {
      return value;
    }
  }

  return null;
}

function getNumber(
  record: JsonRecord,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value =
      record[key];

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed =
        Number(value);

      if (
        Number.isFinite(parsed)
      ) {
        return parsed;
      }
    }
  }

  return null;
}

function unwrapCart(
  value: unknown
): unknown {
  let current =
    value;

  for (
    let depth = 0;
    depth < 5;
    depth++
  ) {
    if (!isRecord(current)) {
      break;
    }

    if (
      Array.isArray(current.items) ||
      Array.isArray(current.lines)
    ) {
      break;
    }

    if (isRecord(current.cart)) {
      current =
        current.cart;
      continue;
    }

    if (isRecord(current.data)) {
      current =
        current.data;
      continue;
    }

    break;
  }

  return current;
}

function itemArray(
  cart: unknown
): unknown[] {
  const unwrapped =
    unwrapCart(cart);

  if (!isRecord(unwrapped)) {
    return [];
  }

  if (
    Array.isArray(
      unwrapped.items
    )
  ) {
    return unwrapped.items;
  }

  if (
    Array.isArray(
      unwrapped.lines
    )
  ) {
    return unwrapped.lines;
  }

  return [];
}

function itemVariantId(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const direct =
    getString(
      value,
      [
        "variantId",
        "productVariantId",
        "skuId"
      ]
    );

  if (direct) {
    return direct;
  }

  for (
    const nestedKey of [
      "variant",
      "productVariant",
      "sku"
    ]
  ) {
    const nested =
      value[nestedKey];

    if (isRecord(nested)) {
      const nestedId =
        getString(
          nested,
          [
            "id",
            "variantId"
          ]
        );

      if (nestedId) {
        return nestedId;
      }
    }
  }

  return null;
}

function itemId(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return getString(
    value,
    [
      "id",
      "cartItemId",
      "lineId"
    ]
  );
}

function itemQuantity(
  value: unknown
): number {
  if (!isRecord(value)) {
    return 0;
  }

  return Math.max(
    0,
    getNumber(
      value,
      [
        "quantity",
        "qty"
      ]
    ) ??
    0
  );
}

function findLine(
  cart: unknown,
  variantId: string
): unknown | undefined {
  return itemArray(
    cart
  ).find(
    (line) =>
      itemVariantId(
        line
      ) === variantId
  );
}

function cartDetail(
  cart: unknown
) {
  const unwrapped =
    unwrapCart(cart);

  return isRecord(
    unwrapped
  )
    ? unwrapped
    : {};
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

function apiError(
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

async function requestCart(
  url: string,
  init?: RequestInit
) {
  const response =
    await fetch(
      url,
      {
        ...init,
        credentials:
          "same-origin",
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
      apiError(
        body,
        `Cart request failed (${response.status})`
      )
    );
  }

  return body;
}

async function getCart() {
  return requestCart(
    "/api/bazaara-cart"
  );
}

async function addInitial(
  variantId: string
) {
  await requestCart(
    "/api/bazaara-cart/items",
    {
      method:
        "POST",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify(
          {
            variantId,
            quantity: 1
          }
        )
    }
  );
}

async function patchQuantity(
  lineId: string,
  quantity: number
) {
  await requestCart(
    `/api/bazaara-cart/items/${encodeURIComponent(lineId)}`,
    {
      method:
        "PATCH",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify(
          {
            quantity
          }
        )
    }
  );
}

async function deleteLine(
  lineId: string
) {
  await requestCart(
    `/api/bazaara-cart/items/${encodeURIComponent(lineId)}`,
    {
      method:
        "DELETE",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        "{}"
    }
  );
}

export function AddToCart({
  variantId,
  disabled = false
}: {
  variantId: string;
  disabled?: boolean;
}) {
  const [
    quantity,
    setQuantity
  ] =
    useState(0);

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    message,
    setMessage
  ] =
    useState("");

  const syncFromServer =
    useCallback(
      async () => {
        const cart =
          await getCart();

        const line =
          findLine(
            cart,
            variantId
          );

        setQuantity(
          itemQuantity(
            line
          )
        );

        window.dispatchEvent(
          new CustomEvent(
            "bazaara:cart-updated",
            {
              detail:
                cartDetail(
                  cart
                )
            }
          )
        );
      },
      [
        variantId
      ]
    );

  useEffect(
    () => {
      let cancelled =
        false;

      void getCart()
        .then(
          (cart) => {
            if (cancelled) {
              return;
            }

            setQuantity(
              itemQuantity(
                findLine(
                  cart,
                  variantId
                )
              )
            );
          }
        )
        .catch(
          () => {
          }
        );

      return () => {
        cancelled =
          true;
      };
    },
    [
      variantId
    ]
  );

  async function change(
    direction: 1 | -1
  ) {
    if (
      busy ||
      disabled
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const cart =
        await getCart();

      const line =
        findLine(
          cart,
          variantId
        );

      const currentQuantity =
        itemQuantity(
          line
        );

      const currentLineId =
        itemId(
          line
        );

      if (
        direction === 1 &&
        currentQuantity === 0
      ) {
        await addInitial(
          variantId
        );
      }
      else {
        if (!currentLineId) {
          throw new Error(
            "Cart line could not be resolved."
          );
        }

        const nextQuantity =
          Math.max(
            0,
            currentQuantity +
            direction
          );

        if (
          nextQuantity === 0
        ) {
          await deleteLine(
            currentLineId
          );
        }
        else {
          await patchQuantity(
            currentLineId,
            nextQuantity
          );
        }
      }

      await syncFromServer();

      setMessage(
        "Cart updated"
      );
    }
    catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update cart"
      );
    }
    finally {
      setBusy(false);
    }
  }

  if (quantity > 0) {
    return (
      <div
        className={
          styles.control
        }
      >
        <div
          className={
            styles.stepper
          }
        >
          <button
            type="button"
            className={
              styles.stepButton
            }
            disabled={
              busy
            }
            onClick={
              () =>
                void change(
                  -1
                )
            }
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span
            className={
              styles.quantity
            }
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            className={
              styles.stepButton
            }
            disabled={
              busy ||
              disabled
            }
            onClick={
              () =>
                void change(
                  1
                )
            }
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <span
          className={
            styles.status
          }
          aria-live="polite"
        >
          {
            busy
              ? "Updating…"
              : message
          }
        </span>
      </div>
    );
  }

  return (
    <div
      className={
        styles.control
      }
    >
      <button
        type="button"
        className={
          styles.addButton
        }
        disabled={
          disabled ||
          busy
        }
        onClick={
          () =>
            void change(
              1
            )
        }
      >
        {
          busy
            ? "Adding…"
            : disabled
              ? "Out of stock"
              : "Add to cart"
        }
      </button>

      <span
        className={
          styles.status
        }
        aria-live="polite"
      >
        {message}
      </span>
    </div>
  );
}
