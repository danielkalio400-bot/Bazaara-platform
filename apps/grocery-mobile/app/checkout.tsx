import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { Screen } from "@bazaara/mobile-ui";

import { groceryApi, groceryCartRequest } from "@/lib/api";
import { clearGuestCartToken } from "@/lib/guest-cart";
import {
  groceryMoney,
  type GroceryCart,
  type GroceryCheckout,
  type GroceryOrder,
  type GroceryPricingPolicy,
  type GroceryStore,
} from "@/lib/grocery";
import { groceryPalette, groceryStyles as s } from "@/ui/theme";

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

function percent(bps: number) {
  return `${(bps / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}%`;
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

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View
      style={[
        s.row,
        { justifyContent: "space-between", marginTop: strong ? 0 : 5 },
      ]}
    >
      <Text style={strong ? s.h2 : s.p}>{label}</Text>
      <Text style={strong ? s.price : s.name}>{value}</Text>
    </View>
  );
}

export default function GroceryCheckoutScreen() {
  const [cart, setCart] = useState<GroceryCart | null>(null);
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [pricing, setPricing] =
    useState<GroceryPricingPolicy>(FALLBACK_POLICY);
  const [mode, setMode] = useState<Mode>("STANDARD");
  const [policy, setPolicy] = useState<Policy>("BEST_MATCH");
  const [replacementLimit, setReplacementLimit] = useState("10");
  const [storeId, setStoreId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [checkout, setCheckout] = useState<GroceryCheckout | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("FCT");
  const [city, setCity] = useState("Abuja");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");

  const load = useCallback(async () => {
    try {
      const [cartBody, storeBody, policyBody] = await Promise.all([
        groceryCartRequest<{ cart: GroceryCart }>("/v1/grocery/cart", {
          method: "GET",
          cache: "no-store",
        }),
        groceryApi.get<{ stores: GroceryStore[] }>("/v1/grocery/stores", {
          cache: "no-store",
        }),
        groceryApi
          .get<GroceryPricingPolicy>("/v1/grocery/pricing-policy", {
            cache: "no-store",
          })
          .catch(() => FALLBACK_POLICY),
      ]);

      setCart(cartBody.cart);
      setStores(storeBody.stores);
      setPricing(policyBody);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not prepare checkout",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const selected = branches.find((branch) => branch.id === storeId);

  const supported = (candidate: Mode) =>
    candidate === "STANDARD" ||
    (candidate === "EXPRESS" &&
      branches.some(
        (branch) =>
          branch.config?.expressEnabled ||
          branch.fulfillmentModes.includes("EXPRESS"),
      )) ||
    (candidate === "PICKUP" &&
      branches.some(
        (branch) =>
          branch.config?.pickupEnabled ||
          branch.fulfillmentModes.includes("PICKUP"),
      )) ||
    (candidate === "SCHEDULED" &&
      branches.some(
        (branch) =>
          (branch.config?.scheduledEnabled ||
            branch.fulfillmentModes.includes("SCHEDULED")) &&
          branch.slots.some((slot) => slot.remaining > 0),
      ));

  async function applyPolicy() {
    if (!cart) return;

    await Promise.all(
      cart.items.map((item) =>
        groceryCartRequest(
          `/v1/grocery/cart/items/${item.id}/substitution`,
          {
            method: "PUT",
            body: {
              substitutionPolicy: policy,
              pickerNote: null,
              maxPriceIncreasePercent:
                policy === "REFUND"
                  ? null
                  : Math.max(
                      0,
                      Math.min(100, Number(replacementLimit || "0")),
                    ),
            },
          },
        ),
      ),
    );
  }

  async function create() {
    if (!name.trim() || !phone.trim() || !region.trim() || !city.trim()) {
      setError("Name, phone, state and city are required.");
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

      const body = await groceryApi.post<{ checkout: GroceryCheckout }>(
        "/v1/grocery/checkouts",
        {
          shippingAddress: {
            fullName: name.trim(),
            phone: phone.trim(),
            country: "NG",
            region: region.trim(),
            city: city.trim(),
            street: street.trim() || undefined,
            landmark: landmark.trim() || undefined,
          },
          deliveryMode: mode,
          pickupStoreId: mode === "PICKUP" ? storeId : undefined,
          deliverySlotId: mode === "SCHEDULED" ? slotId : undefined,
        },
      );

      setCheckout(body.checkout);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not reserve checkout",
      );
    } finally {
      setBusy(false);
    }
  }

  async function place() {
    if (!checkout) return;

    setBusy(true);
    setError("");

    try {
      const body = await groceryApi.post<{ order: GroceryOrder }>(
        `/v1/grocery/checkouts/${checkout.id}/place-order`,
        {},
        { idempotencyKey: `grocery-${Crypto.randomUUID()}` },
      );

      await clearGuestCartToken();
      router.replace({
        pathname: "/order/[id]",
        params: { id: body.order.id },
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not place order",
      );
    } finally {
      setBusy(false);
    }
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
    <Screen tabBarSafe={false}>
      <Text
        style={{
          color: groceryPalette.primary,
          fontSize: 7,
          fontWeight: "900",
          letterSpacing: 0.7,
        }}
      >
        GROCERY CHECKOUT
      </Text>

      <Text style={s.h1}>Finish your order</Text>
      <Text style={[s.p, { marginTop: 4 }]}>
        The branch checks stock. You choose one fallback rule for the whole
        basket.
      </Text>

      {error ? <Text style={[s.error, { marginTop: 8 }]}>{error}</Text> : null}

      <View style={[s.card, { marginTop: 13 }]}>
        <Text style={s.h2}>Fulfilment</Text>

        <View style={[s.wrap, { marginTop: 8 }]}>
          {(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"] as Mode[]).map(
            (candidate) => (
              <Pressable
                key={candidate}
                style={[
                  s.pill,
                  mode === candidate && s.pillActive,
                  !supported(candidate) && { opacity: 0.35 },
                ]}
                disabled={!supported(candidate)}
                onPress={() => {
                  setMode(candidate);
                  setCheckout(null);
                  setStoreId("");
                  setSlotId("");
                }}
              >
                <Text
                  style={[
                    s.pillText,
                    mode === candidate && s.pillTextActive,
                  ]}
                >
                  {candidate === "EXPRESS"
                    ? "EXPRESS · 10%"
                    : candidate.replaceAll("_", " ")}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {mode === "EXPRESS" ? (
          <Text style={[s.small, { marginTop: 8 }]}>
            Express is 10% of merchandise subtotal, minimum ₦1,000 and maximum
            ₦5,000. Service fee is separate.
          </Text>
        ) : null}
      </View>

      {mode === "PICKUP" || mode === "SCHEDULED" ? (
        <View style={[s.card, { marginTop: 9 }]}>
          <Text style={s.h2}>Branch</Text>

          <View style={[s.wrap, { marginTop: 8 }]}>
            {branches
              .filter((branch) =>
                mode === "PICKUP"
                  ? branch.config?.pickupEnabled ||
                    branch.fulfillmentModes.includes("PICKUP")
                  : branch.config?.scheduledEnabled ||
                    branch.fulfillmentModes.includes("SCHEDULED"),
              )
              .map((branch) => (
                <Pressable
                  key={branch.id}
                  style={[
                    s.pill,
                    storeId === branch.id && s.pillActive,
                  ]}
                  onPress={() => {
                    setStoreId(branch.id);
                    setSlotId("");
                    setCheckout(null);
                  }}
                >
                  <Text
                    style={[
                      s.pillText,
                      storeId === branch.id && s.pillTextActive,
                    ]}
                  >
                    {branch.merchantName} · {branch.name}
                  </Text>
                </Pressable>
              ))}
          </View>

          {mode === "SCHEDULED" && selected ? (
            <View style={[s.wrap, { marginTop: 8 }]}>
              {selected.slots
                .filter((slot) => slot.remaining > 0)
                .map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[
                      s.pill,
                      slotId === slot.id && s.pillActive,
                    ]}
                    onPress={() => {
                      setSlotId(slot.id);
                      setCheckout(null);
                    }}
                  >
                    <Text
                      style={[
                        s.pillText,
                        slotId === slot.id && s.pillTextActive,
                      ]}
                    >
                      {new Date(slot.startsAt).toLocaleString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </Pressable>
                ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[s.card, { marginTop: 9 }]}>
        <Text style={s.h2}>If something is unavailable</Text>
        <Text style={[s.p, { marginTop: 3 }]}>
          One fallback for the whole order after the picker checks the shelf.
        </Text>

        <View style={[s.wrap, { marginTop: 8 }]}>
          {(
            [
              ["BEST_MATCH", "Best match"],
              ["CONTACT_ME", "Ask me"],
              ["REFUND", "Refund"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              style={[
                s.pill,
                policy === value && s.pillActive,
              ]}
              onPress={() => {
                setPolicy(value);
                setCheckout(null);
              }}
            >
              <Text
                style={[
                  s.pillText,
                  policy === value && s.pillTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {policy !== "REFUND" ? (
          <>
            <Text style={[s.label, { marginTop: 10 }]}>
              Max replacement price increase (%)
            </Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              value={replacementLimit}
              onChangeText={(value) =>
                setReplacementLimit(
                  value.replace(/\D/g, "").slice(0, 3),
                )
              }
              placeholder="10"
              placeholderTextColor={groceryPalette.muted2}
            />
          </>
        ) : null}
      </View>

      <View style={[s.card, { marginTop: 9 }]}>
        <Text style={s.h2}>Contact address</Text>

        <TextInput
          style={[s.input, { marginTop: 8 }]}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={groceryPalette.muted2}
        />
        <TextInput
          style={[s.input, { marginTop: 7 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone"
          placeholderTextColor={groceryPalette.muted2}
        />
        <TextInput
          style={[s.input, { marginTop: 7 }]}
          value={region}
          onChangeText={setRegion}
          placeholder="State / region"
          placeholderTextColor={groceryPalette.muted2}
        />
        <TextInput
          style={[s.input, { marginTop: 7 }]}
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor={groceryPalette.muted2}
        />
        <TextInput
          style={[s.input, { marginTop: 7 }]}
          value={street}
          onChangeText={setStreet}
          placeholder="Street / address"
          placeholderTextColor={groceryPalette.muted2}
        />
        <TextInput
          style={[s.input, { marginTop: 7 }]}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Landmark (optional)"
          placeholderTextColor={groceryPalette.muted2}
        />
      </View>

      <View style={[s.card, { marginTop: 9 }]}>
        <Text style={s.h2}>Price breakdown</Text>

        <PriceRow
          label="Subtotal"
          value={groceryMoney(
            checkout?.subtotalMinor ?? subtotal,
          )}
        />

        <PriceRow
          label={
            mode === "EXPRESS"
              ? "Express delivery"
              : "Delivery"
          }
          value={
            checkout
              ? checkout.shippingMinor === 0
                ? "Free"
                : groceryMoney(checkout.shippingMinor)
              : mode === "EXPRESS"
                ? groceryMoney(estimatedExpress)
                : mode === "PICKUP"
                  ? "Free"
                  : "Calculated"
          }
        />

        <PriceRow
          label={`Service fee · ${percent(shownServiceBps)}`}
          value={groceryMoney(
            checkout?.serviceFeeMinor ?? estimatedService,
          )}
        />

        <View style={s.divider} />

        <PriceRow
          strong
          label="Total"
          value={groceryMoney(
            checkout?.totalMinor ??
              subtotal + estimatedExpress + estimatedService,
          )}
        />

        <Text style={[s.small, { marginTop: 8 }]}>
          Service fee is configured between 10% and 15%.
        </Text>
      </View>

      {checkout ? (
        <Pressable
          style={[s.button, { marginTop: 12 }]}
          disabled={busy}
          onPress={() => void place()}
        >
          <Text style={s.buttonText}>
            {busy ? "Placing order…" : "Place order"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={[s.button, { marginTop: 12 }]}
          disabled={busy || !cart?.items.length}
          onPress={() => void create()}
        >
          <Text style={s.buttonText}>
            {busy ? "Checking stock…" : "Check stock & continue"}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}
