import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { cartRequest } from "@/lib/api";
import type { Cart } from "@/lib/types";

type CartStateValue = {
  cart: Cart | null;
  count: number;
  quantities: Record<string, number>;
  busyVariantId: string | null;
  setCount: (count: number) => void;
  syncCart: (cart: Cart) => void;
  refresh: () => Promise<void>;
  setVariantQuantity: (variantId: string, quantity: number) => Promise<void>;
};

const CartStateContext = createContext<CartStateValue | null>(null);

export function CartStateProvider({ children }: PropsWithChildren) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [count, setCountState] = useState(0);
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null);

  const setCount = useCallback((next: number) => {
    setCountState(Math.max(0, Number.isFinite(next) ? next : 0));
  }, []);

  const syncCart = useCallback((next: Cart) => {
    setCart(next);
    setCount(next.itemCount);
  }, [setCount]);

  const refresh = useCallback(async () => {
    try {
      const body = await cartRequest<{ cart: Cart }>("/v1/shopping/cart", { method: "GET" });
      syncCart(body.cart);
    } catch {
      // Cart state is best-effort enhancement state. Individual screens can still render errors.
    }
  }, [syncCart]);

  const quantities = useMemo(() => {
    const next: Record<string, number> = {};
    for (const item of cart?.items ?? []) next[item.variant.id] = item.quantity;
    return next;
  }, [cart]);

  const setVariantQuantity = useCallback(async (variantId: string, quantity: number) => {
    if (!variantId || busyVariantId) return;
    setBusyVariantId(variantId);
    try {
      if (quantity <= 0) {
        let current = cart;
        if (!current) {
          const loaded = await cartRequest<{ cart: Cart }>("/v1/shopping/cart", { method: "GET" });
          current = loaded.cart;
          syncCart(current);
        }
        const item = current.items.find((entry) => entry.variant.id === variantId);
        if (!item) return;
        const body = await cartRequest<{ cart: Cart }>(
          `/v1/shopping/cart/items/${encodeURIComponent(item.id)}`,
          { method: "DELETE" }
        );
        syncCart(body.cart);
        return;
      }

      const body = await cartRequest<{ cart: Cart }>("/v1/shopping/cart/items", {
        method: "POST",
        body: { variantId, quantity },
      });
      syncCart(body.cart);
    } finally {
      setBusyVariantId(null);
    }
  }, [busyVariantId, cart, syncCart]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ cart, count, quantities, busyVariantId, setCount, syncCart, refresh, setVariantQuantity }),
    [busyVariantId, cart, count, quantities, refresh, setCount, setVariantQuantity, syncCart]
  );

  return <CartStateContext.Provider value={value}>{children}</CartStateContext.Provider>;
}

export function useCartState() {
  const value = useContext(CartStateContext);
  if (!value) throw new Error("useCartState must be used inside CartStateProvider");
  return value;
}
