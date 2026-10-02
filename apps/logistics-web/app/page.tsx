"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  LogisticsBookingResponseContract,
  LogisticsQuoteContract,
  LogisticsServiceLevel,
} from "@bazaara/contracts";

type Point = { latitude: number; longitude: number };

type FoodEconomics = {
  courierGrossMinor: number;
  goCommissionBps: number;
  goCommissionMinor: number;
  courierNetMinor: number;
  courierPayoutMinor: number;
};

type FoodDelivery = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  tipMinor: number;
  restaurant: { name: string };
  items: Array<{ quantity: number; name: string }>;
  economics: FoodEconomics | null;
  pickup: Point | null;
  pickupDistanceMeters: number | null;
  deliveryPinVerified: boolean;
  dropoff: Point | null;
};

type FoodOffersResponse = {
  offers: FoodDelivery[];
  rules: {
    maxPickupDistanceMeters: number;
    maxPickupEtaSeconds: number;
    goCommissionBps: number;
  };
};

type FoodHistory = {
  deliveries: FoodDelivery[];
  summary: {
    deliveredCount: number;
    todayDeliveredCount: number;
    todayPayoutMinor: number;
    recentPayoutMinor: number;
  };
};

type ParcelOffer = {
  id: string;
  publicCode: string;
  trackingCode: string;
  status: string;
  scheduledFor: string | null;
  pickup: unknown;
  dropoff: unknown;
  serviceLevel: string;
  weightGrams: number;
  distanceMeters: number | null;
  etaMinutes: number;
  currency: string;
  amountMinor: number;
  pickupDistanceMeters: number | null;
  economics: {
    grossMinor: number;
    platformFeeBps: number;
    platformFeeMinor: number;
    courierPayoutMinor: number;
  };
};

type CustomerBooking = {
  booking: {
    id: string;
    publicCode: string;
    trackingCode: string;
    status: string;
    fundingStatus?: string;
    amountPaidMinor?: number;
    platformFeeMinor?: number;
    courierPayoutMinor?: number;
    scheduledFor: string | null;
    createdAt: string;
  };
  quote: LogisticsQuoteContract;
  pickup: unknown;
  dropoff: unknown;
  lastEvent?: { type: string; createdAt: string } | null;
};

type ParcelHistory = {
  deliveries: ParcelOffer[];
  summary: {
    deliveredCount: number;
    todayDeliveredCount: number;
    todayPayoutMinor: number;
    recentPayoutMinor: number;
  };
};

type SupportCase = {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  lastActivityAt: string;
};

type Tab = "cockpit" | "parcels" | "earnings" | "support" | "profile";
type ApiFailure = Error & { status?: number; code?: string };

const BAZID =
  process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";

const services: Array<[LogisticsServiceLevel, string, string]> = [
  ["BIKE", "Bike Express", "Documents, meals, small parcels"],
  ["CAR", "Car Courier", "Larger packages and protected loads"],
  ["VAN", "Van", "Bulk and commercial delivery"],
];

function money(minor = 0, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function distance(meters: number | null | undefined) {
  if (meters == null) return "Distance pending";
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

function locationLabel(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Location";
  const row = value as Record<string, unknown>;
  return typeof row.label === "string" ? row.label : "Location";
}

function pointFromUnknown(value: unknown): Point | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return typeof row.latitude === "number" && typeof row.longitude === "number"
    ? { latitude: row.latitude, longitude: row.longitude }
    : null;
}

async function request<T>(
  path: string,
  init: RequestInit & {
    bodyJson?: unknown;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.bodyJson !== undefined) headers.set("content-type", "application/json");
  if (init.idempotencyKey) headers.set("idempotency-key", init.idempotencyKey);

  const requestInit: RequestInit = {
    ...init,
    headers,
    body:
      init.bodyJson === undefined
        ? init.body
        : JSON.stringify(init.bodyJson),
    credentials: "include",
    cache: "no-store",
  };

  let response: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(`/api/bazaara-platform${path}`, requestInit);
      break;
    } catch (cause) {
      lastError = cause;
      if (attempt < 2) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, attempt === 0 ? 250 : 700),
        );
      }
    }
  }

  if (!response) {
    throw new Error(
      `GO network request failed: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const nested =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "object"
        ? (payload as { error: { message?: string; code?: string } }).error
        : null;

    const message =
      nested?.message ??
      (payload &&
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload
        ? String((payload as { message?: unknown }).message ?? "")
        : "") ??
      `Bazaara API returned ${response.status}`;

    const error = new Error(
      message || `Bazaara API returned ${response.status}`,
    ) as ApiFailure;
    error.status = response.status;
    error.code = nested?.code;
    throw error;
  }

  return payload as T;
}

function signIn() {
  const returnTo = window.location.href;
  window.location.href = `${BAZID.replace(
    /\/$/,
    "",
  )}/bazid/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}

function locate(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser does not support location services."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Location permission is required to receive nearby GO offers."
              : "GO could not read your current location.",
          ),
        ),
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 10_000,
      },
    );
  });
}

export default function BazaaraGoPage() {
  const [tab, setTab] = useState<Tab>("cockpit");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [courierAuthorized, setCourierAuthorized] = useState(true);
  const [online, setOnline] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  const [foodOffers, setFoodOffers] = useState<FoodDelivery[]>([]);
  const [foodDeliveries, setFoodDeliveries] = useState<FoodDelivery[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodHistory>({
    deliveries: [],
    summary: {
      deliveredCount: 0,
      todayDeliveredCount: 0,
      todayPayoutMinor: 0,
      recentPayoutMinor: 0,
    },
  });
  const [parcelOffers, setParcelOffers] = useState<ParcelOffer[]>([]);
  const [parcelDeliveries, setParcelDeliveries] = useState<ParcelOffer[]>([]);
  const [parcelHistory, setParcelHistory] = useState<ParcelHistory>({
    deliveries: [],
    summary: {
      deliveredCount: 0,
      todayDeliveredCount: 0,
      todayPayoutMinor: 0,
      recentPayoutMinor: 0,
    },
  });
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [capabilities, setCapabilities] = useState<{
    commissionBps: number;
    maxCourierPickupDistanceMeters: number;
    region: string;
    currency: string;
    advancePaymentRequired: boolean;
  } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [foodPin, setFoodPin] = useState("");
  const [quote, setQuote] = useState<LogisticsQuoteContract | null>(null);
  const [verification, setVerification] = useState<{
    pickupCode: string;
    deliveryCode: string;
  } | null>(null);
  const [parcelForm, setParcelForm] = useState({
    pickup: "",
    pickupLat: "",
    pickupLng: "",
    dropoff: "",
    dropoffLat: "",
    dropoffLng: "",
    serviceLevel: "BIKE" as LogisticsServiceLevel,
    weightKg: "1",
    distanceKm: "5",
    schedule: "",
    payPin: "",
  });
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<{
    trackingCode: string;
    publicCode: string;
    status: string;
    fundingStatus: string;
    updatedAt: string;
    serviceLevel: string;
    etaMinutes: number;
  } | null>(null);
  const [supportForm, setSupportForm] = useState({
    category: "GO",
    subject: "",
    description: "",
  });

  const pointRef = useRef<Point | null>(null);
  const tickInFlight = useRef(false);

  const activeFood = foodDeliveries[0] ?? null;
  const activeParcel = parcelDeliveries[0] ?? null;

  const loadCustomer = useCallback(async () => {
    try {
      const [bookings, cases, caps] = await Promise.all([
        request<{ bookings: CustomerBooking[] }>("/v1/logistics/bookings"),
        request<{ cases: SupportCase[] }>("/v1/support/cases"),
        request<{
          commissionBps: number;
          maxCourierPickupDistanceMeters: number;
          region: string;
          currency: string;
          advancePaymentRequired: boolean;
        }>("/v1/logistics/capabilities"),
      ]);
      setCustomerBookings(bookings.bookings);
      setSupportCases(
        cases.cases.filter((item) =>
          ["GO", "LOGISTICS", "DELIVERY"].includes(item.category),
        ),
      );
      setCapabilities(caps);
      setSignedIn(true);
      setError("");
      return true;
    } catch (cause) {
      const failure = cause as ApiFailure;
      if (failure.status === 401) {
        setSignedIn(false);
        setCustomerBookings([]);
        return false;
      }
      setError(failure.message);
      return true;
    }
  }, []);

  const loadCourier = useCallback(
    async (optionalPoint?: Point) => {
      const current = optionalPoint ?? pointRef.current;

      try {
        const [foodJobs, foodPast, parcelJobs, parcelPast] = await Promise.all([
          request<{ deliveries: FoodDelivery[] }>("/v1/go/food/deliveries"),
          request<FoodHistory>("/v1/go/food/history"),
          request<{ deliveries: ParcelOffer[] }>("/v1/logistics/courier/deliveries"),
          request<ParcelHistory>("/v1/logistics/courier/history"),
        ]);
        setCourierAuthorized(true);
        setFoodDeliveries(foodJobs.deliveries);
        setFoodHistory(foodPast);
        setParcelDeliveries(parcelJobs.deliveries);
        setParcelHistory(parcelPast);

        if (online && current && !foodJobs.deliveries.length) {
          const food = await request<FoodOffersResponse>(
            `/v1/go/food/offers?latitude=${encodeURIComponent(
              current.latitude,
            )}&longitude=${encodeURIComponent(current.longitude)}`,
          );
          setFoodOffers(food.offers);
        } else {
          setFoodOffers([]);
        }

        if (online && current && !parcelJobs.deliveries.length) {
          const parcel = await request<{ offers: ParcelOffer[] }>(
            `/v1/logistics/courier/offers?latitude=${encodeURIComponent(
              current.latitude,
            )}&longitude=${encodeURIComponent(current.longitude)}`,
          );
          setParcelOffers(parcel.offers);
        } else {
          setParcelOffers([]);
        }
      } catch (cause) {
        const failure = cause as ApiFailure;
        if (failure.status === 403) {
          setCourierAuthorized(false);
          setOnline(false);
          setFoodOffers([]);
          setParcelOffers([]);
          setFoodDeliveries([]);
          setParcelDeliveries([]);
          return;
        }
        if (failure.status !== 401) setError(failure.message);
      }
    },
    [online],
  );

  const refresh = useCallback(
    async (optionalPoint?: Point) => {
      const authenticated = await loadCustomer();
      if (authenticated) await loadCourier(optionalPoint);
    },
    [loadCourier, loadCustomer],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("bazaara.go.web.online");
    if (stored === "1") setOnline(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!signedIn || !courierAuthorized || !online) return;

    let cancelled = false;

    const tick = async () => {
      if (tickInFlight.current) return;
      tickInFlight.current = true;

      try {
        const current = await locate();
        if (cancelled) return;
        pointRef.current = current;
        setPoint(current);

        if (activeFood) {
          await request(`/v1/go/food/deliveries/${activeFood.id}/location`, {
            method: "POST",
            bodyJson: current,
          }).catch(() => undefined);
        }

        if (activeParcel) {
          await request(
            `/v1/logistics/courier/bookings/${activeParcel.id}/location`,
            {
              method: "POST",
              bodyJson: current,
            },
          ).catch(() => undefined);
        }

        await loadCourier(current);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not update live location.");
        }
      } finally {
        tickInFlight.current = false;
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    activeFood?.id,
    activeParcel?.id,
    courierAuthorized,
    loadCourier,
    online,
    signedIn,
  ]);

  async function toggleOnline() {
    if (!courierAuthorized) {
      setError("This BazID does not have GO courier access.");
      return;
    }

    setBusy("online");
    try {
      if (online) {
        setOnline(false);
        setFoodOffers([]);
        setParcelOffers([]);
        window.localStorage.removeItem("bazaara.go.web.online");
        return;
      }

      const current = await locate();
      pointRef.current = current;
      setPoint(current);
      setOnline(true);
      window.localStorage.setItem("bazaara.go.web.online", "1");
      await loadCourier(current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change online status.");
    } finally {
      setBusy("");
    }
  }

  async function acceptFood(job: FoodDelivery) {
    if (!point) return;
    setBusy(`food:${job.id}`);
    try {
      await request(`/v1/go/food/offers/${job.id}/accept`, {
        method: "POST",
        bodyJson: point,
      });
      setNotice(`${job.restaurant.name} delivery accepted.`);
      await loadCourier(point);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not accept Food delivery.");
    } finally {
      setBusy("");
    }
  }

  async function acceptParcel(job: ParcelOffer) {
    setBusy(`parcel:${job.id}`);
    try {
      await request(`/v1/logistics/courier/offers/${job.id}/accept`, {
        method: "POST",
        bodyJson: {},
      });
      setNotice(`${job.publicCode} accepted.`);
      await loadCourier(point ?? undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not accept parcel.");
    } finally {
      setBusy("");
    }
  }

  async function foodStatus(next: "PICKED_UP" | "ON_THE_WAY" | "DELIVERED") {
    if (!activeFood) return;
    setBusy(`food-status:${next}`);
    try {
      const current = await locate();
      await request(`/v1/go/food/deliveries/${activeFood.id}/status`, {
        method: "PATCH",
        bodyJson: { status: next, ...current },
      });
      setNotice(`Food delivery moved to ${label(next)}.`);
      await loadCourier(current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update Food delivery.");
    } finally {
      setBusy("");
    }
  }

  async function verifyFoodPin() {
    if (!activeFood || foodPin.length !== 4) return;
    setBusy("food-pin");
    try {
      await request(`/v1/go/food/deliveries/${activeFood.id}/verify-pin`, {
        method: "POST",
        bodyJson: { pin: foodPin },
      });
      setFoodPin("");
      setNotice("Food delivery PIN verified.");
      await loadCourier(point ?? undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify PIN.");
    } finally {
      setBusy("");
    }
  }

  async function parcelStatus(
    next: "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED" | "RETURNING" | "RETURNED",
  ) {
    if (!activeParcel) return;
    setBusy(`parcel-status:${next}`);
    try {
      const verificationCode =
        next === "PICKED_UP" || next === "DELIVERED" ? deliveryCode : undefined;
      await request(`/v1/logistics/bookings/${activeParcel.id}/status`, {
        method: "PATCH",
        bodyJson: {
          status: next,
          verificationCode,
          reason: next === "FAILED" ? "Courier delivery attempt failed" : undefined,
        },
      });
      setDeliveryCode("");
      setNotice(`${activeParcel.publicCode} moved to ${label(next)}.`);
      await refresh(point ?? undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update parcel.");
    } finally {
      setBusy("");
    }
  }

  async function createQuote(event: FormEvent) {
    event.preventDefault();
    setBusy("quote");
    try {
      const result = await request<LogisticsQuoteContract>("/v1/logistics/quotes", {
        method: "POST",
        bodyJson: {
          pickup: {
            label: parcelForm.pickup,
            latitude: parcelForm.pickupLat ? Number(parcelForm.pickupLat) : undefined,
            longitude: parcelForm.pickupLng ? Number(parcelForm.pickupLng) : undefined,
          },
          dropoff: {
            label: parcelForm.dropoff,
            latitude: parcelForm.dropoffLat ? Number(parcelForm.dropoffLat) : undefined,
            longitude: parcelForm.dropoffLng ? Number(parcelForm.dropoffLng) : undefined,
          },
          serviceLevel: parcelForm.serviceLevel,
          weightGrams: Math.max(1, Math.round(Number(parcelForm.weightKg) * 1000)),
          distanceMeters: Math.max(100, Math.round(Number(parcelForm.distanceKm) * 1000)),
        },
      });
      setQuote(result);
      setVerification(null);
      setNotice("Quote locked for 10 minutes. Confirm with your 6-digit Wallet PIN.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create quote.");
    } finally {
      setBusy("");
    }
  }

  async function confirmBooking() {
    if (!quote) return;
    setBusy("book");
    try {
      const result = await request<LogisticsBookingResponseContract>(
        "/v1/logistics/bookings",
        {
          method: "POST",
          idempotencyKey: crypto.randomUUID(),
          bodyJson: {
            quoteId: quote.id,
            scheduledFor: parcelForm.schedule
              ? new Date(parcelForm.schedule).toISOString()
              : undefined,
            payPin: parcelForm.payPin,
          },
        },
      );
      setVerification(result.verification);
      setNotice(
        `${result.booking.publicCode} · ${result.booking.trackingCode} is fully paid and confirmed. Save both verification codes.`,
      );
      setParcelForm((current) => ({ ...current, payPin: "" }));
      setQuote(null);
      await loadCustomer();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm delivery.");
    } finally {
      setBusy("");
    }
  }

  async function track(event: FormEvent) {
    event.preventDefault();
    if (!trackingCode.trim()) return;
    setBusy("track");
    try {
      const result = await request<typeof trackingResult>(
        `/v1/logistics/tracking/${encodeURIComponent(trackingCode.trim())}`,
      );
      setTrackingResult(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tracking code not found.");
    } finally {
      setBusy("");
    }
  }

  async function cancelBooking(id: string) {
    const reason = window.prompt("Why are you cancelling this parcel?");
    if (!reason) return;
    setBusy(`cancel:${id}`);
    try {
      await request(`/v1/logistics/bookings/${id}/status`, {
        method: "PATCH",
        bodyJson: { status: "CANCELLED", reason },
      });
      setNotice("Booking cancelled and funded amount returned to Wallet.");
      await loadCustomer();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel booking.");
    } finally {
      setBusy("");
    }
  }

  async function createSupportCase(event: FormEvent) {
    event.preventDefault();
    setBusy("support");
    try {
      await request("/v1/support/cases", {
        method: "POST",
        bodyJson: {
          category: supportForm.category,
          subject: supportForm.subject,
          description: supportForm.description,
          channel: "GO",
          context: {
            surface: "BAZAARA_GO_WEB",
            online,
            courierAuthorized,
          },
        },
      });
      setSupportForm({ category: "GO", subject: "", description: "" });
      setNotice("Support case opened with Operations.");
      await loadCustomer();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not contact support.");
    } finally {
      setBusy("");
    }
  }

  const combinedToday =
    foodHistory.summary.todayPayoutMinor +
    parcelHistory.summary.todayPayoutMinor;
  const combinedRecent =
    foodHistory.summary.recentPayoutMinor +
    parcelHistory.summary.recentPayoutMinor;

  const activeCount = foodDeliveries.length + parcelDeliveries.length;
  const offerCount = foodOffers.length + parcelOffers.length;

  if (signedIn === null) {
    return (
      <main className="go-v4-loading">
        <div className="go-v4-spinner" />
        <strong>Connecting GO</strong>
        <span>Dispatch · Pay · Support</span>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="go-v4-auth">
        <section>
          <div className="go-v4-auth-brand"><b>GO</b><span>GO</span></div>
          <span className="go-v4-kicker">ONE DELIVERY NETWORK</span>
          <h1>Food, parcels and Bazaara commerce. One movement layer.</h1>
          <p>
            Book and track parcels, or operate as an authorized GO courier.
            Advance payment, courier earnings and support remain connected to Wallet and BazID.
          </p>
          <button onClick={signIn}>Continue with BazID</button>
        </section>
      </main>
    );
  }

  return (
    <div className="go-v4-shell">
      <aside className="go-v4-sidebar">
        <a href="/" className="go-v4-logo">
          <b>GO</b>
          <span><strong>BAZAARA</strong><small>GO</small></span>
        </a>

        <div className="go-v4-presence">
          <span className={online ? "online" : ""} />
          <div>
            <strong>{courierAuthorized ? (online ? "Courier online" : "Courier offline") : "Customer mode"}</strong>
            <small>{courierAuthorized ? `${offerCount} nearby offers` : "Parcel booking & tracking"}</small>
          </div>
        </div>

        <nav>
          {([
            ["cockpit", "CP", "Cockpit", "Food + parcel dispatch"],
            ["parcels", "PX", "Parcels", "Book, track and manage"],
            ["earnings", "ER", "Earnings", "Go payouts and history"],
            ["support", "SP", "Support", "Operations case inbox"],
            ["profile", "ID", "Profile", "BazID, access and rules"],
          ] as Array<[Tab, string, string, string]>).map(([key, short, title, detail]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              <span>{short}</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
            </button>
          ))}
        </nav>

        <div className="go-v4-side-foot">
          <span>BAZAARA NETWORK</span>
          <small>Advance-paid parcel delivery · Final-mile commerce</small>
        </div>
      </aside>

      <div className="go-v4-workspace">
        <header className="go-v4-topbar">
          <div>
            <span className="go-v4-kicker">GO</span>
            <strong>{tab === "cockpit" ? "Live cockpit" : label(tab)}</strong>
          </div>
          <div className="go-v4-top-actions">
            <a href="http://localhost:3010">Wallet</a>
            <button
              className={online ? "online" : ""}
              disabled={busy === "online" || !courierAuthorized}
              onClick={() => void toggleOnline()}
            >
              {busy === "online" ? "…" : online ? "● ONLINE" : courierAuthorized ? "GO ONLINE" : "CUSTOMER MODE"}
            </button>
          </div>
        </header>

        <main className="go-v4-main">
          {error ? <div className="go-v4-alert">{error}<button onClick={() => setError("")}>×</button></div> : null}
          {notice ? <div className="go-v4-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

          {tab === "cockpit" ? (
            <>
              <section className="go-v4-hero">
                <div>
                  <span className="go-v4-kicker">LIVE DELIVERY NETWORK</span>
                  <h1>Move Bazaara without switching systems.</h1>
                  <p>
                    Food and parcel dispatch share one courier identity. Payments settle through
                    Wallet and every issue can escalate into Operations Support.
                  </p>
                </div>
                <div className="go-v4-hero-stats">
                  <article><span>ACTIVE</span><strong>{activeCount}</strong><small>assigned jobs</small></article>
                  <article><span>OFFERS</span><strong>{offerCount}</strong><small>nearby & eligible</small></article>
                  <article><span>TODAY</span><strong>{money(combinedToday)}</strong><small>courier payout</small></article>
                </div>
              </section>

              {!courierAuthorized ? (
                <section className="go-v4-panel go-v4-access-card">
                  <div><span className="go-v4-kicker">COURIER ACCESS</span><h2>Parcel customer mode is fully available.</h2><p>This BazID is not currently assigned the GO courier role. Business parcel booking, tracking and support remain available.</p></div>
                  <button onClick={() => setTab("support")}>Contact Operations</button>
                </section>
              ) : null}

              {activeFood ? (
                <section className="go-v4-panel go-v4-active-card">
                  <div className="go-v4-card-head">
                    <div><span className="go-v4-kicker">ACTIVE FOOD</span><h2>{activeFood.restaurant.name}</h2><p>{activeFood.orderNumber} · {label(activeFood.status)}</p></div>
                    <strong>{money(activeFood.economics?.courierPayoutMinor ?? 0, activeFood.currency)}</strong>
                  </div>
                  <div className="go-v4-route">
                    <button onClick={() => {
                      if (activeFood.pickup) window.open(`https://www.google.com/maps/search/?api=1&query=${activeFood.pickup.latitude},${activeFood.pickup.longitude}`, "_blank", "noopener,noreferrer");
                    }}>Navigate pickup</button>
                    <span>→</span>
                    <button onClick={() => {
                      if (activeFood.dropoff) window.open(`https://www.google.com/maps/search/?api=1&query=${activeFood.dropoff.latitude},${activeFood.dropoff.longitude}`, "_blank", "noopener,noreferrer");
                    }}>Navigate customer</button>
                  </div>
                  <div className="go-v4-job-actions">
                    {activeFood.status === "READY" ? <button onClick={() => void foodStatus("PICKED_UP")}>Confirm pickup</button> : null}
                    {activeFood.status === "PICKED_UP" ? <button onClick={() => void foodStatus("ON_THE_WAY")}>Start delivery</button> : null}
                    {activeFood.status === "ON_THE_WAY" ? (
                      <>
                        <input value={foodPin} onChange={(e) => setFoodPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit customer PIN" />
                        <button onClick={() => void verifyFoodPin()}>Verify PIN</button>
                        <button disabled={!activeFood.deliveryPinVerified} onClick={() => void foodStatus("DELIVERED")}>Complete Food delivery</button>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {activeParcel ? (
                <section className="go-v4-panel go-v4-active-card parcel">
                  <div className="go-v4-card-head">
                    <div><span className="go-v4-kicker">ACTIVE PARCEL</span><h2>{activeParcel.publicCode}</h2><p>{locationLabel(activeParcel.pickup)} → {locationLabel(activeParcel.dropoff)}</p></div>
                    <strong>{money(activeParcel.economics.courierPayoutMinor, activeParcel.currency)}</strong>
                  </div>
                  <div className="go-v4-progress">
                    {["ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED"].map((item) => <span key={item} className={activeParcel.status === item ? "active" : ""}>{label(item)}</span>)}
                  </div>
                  <div className="go-v4-job-actions">
                    {activeParcel.status === "ASSIGNED" ? (
                      <>
                        <input value={deliveryCode} onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pickup code" />
                        <button disabled={deliveryCode.length !== 6} onClick={() => void parcelStatus("PICKED_UP")}>Verify pickup</button>
                      </>
                    ) : null}
                    {activeParcel.status === "PICKED_UP" ? <button onClick={() => void parcelStatus("IN_TRANSIT")}>Start transit</button> : null}
                    {activeParcel.status === "IN_TRANSIT" ? (
                      <>
                        <input value={deliveryCode} onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit delivery code" />
                        <button disabled={deliveryCode.length !== 6} onClick={() => void parcelStatus("DELIVERED")}>Complete parcel</button>
                        <button className="danger" onClick={() => void parcelStatus("FAILED")}>Attempt failed</button>
                      </>
                    ) : null}
                    {activeParcel.status === "FAILED" ? <button onClick={() => void parcelStatus("RETURNING")}>Return to sender</button> : null}
                    {activeParcel.status === "RETURNING" ? <button onClick={() => void parcelStatus("RETURNED")}>Confirm returned</button> : null}
                  </div>
                </section>
              ) : null}

              {courierAuthorized && online && !activeCount ? (
                <div className="go-v4-offer-grid">
                  {foodOffers.map((job) => (
                    <article className="go-v4-offer" key={`food-${job.id}`}>
                      <span className="go-v4-type food">FOOD</span>
                      <h3>{job.restaurant.name}</h3>
                      <p>{job.orderNumber} · {distance(job.pickupDistanceMeters)} to pickup</p>
                      <div><span>You receive</span><strong>{money(job.economics?.courierPayoutMinor ?? 0, job.currency)}</strong></div>
                      <button disabled={busy === `food:${job.id}`} onClick={() => void acceptFood(job)}>Accept Food delivery</button>
                    </article>
                  ))}
                  {parcelOffers.map((job) => (
                    <article className="go-v4-offer parcel" key={`parcel-${job.id}`}>
                      <span className="go-v4-type parcel">PARCEL</span>
                      <h3>{job.publicCode}</h3>
                      <p>{locationLabel(job.pickup)} → {locationLabel(job.dropoff)}</p>
                      <p>{distance(job.pickupDistanceMeters)} to pickup · {job.serviceLevel}</p>
                      <div><span>You receive</span><strong>{money(job.economics.courierPayoutMinor, job.currency)}</strong></div>
                      <button disabled={busy === `parcel:${job.id}`} onClick={() => void acceptParcel(job)}>Accept parcel</button>
                    </article>
                  ))}
                  {!offerCount ? <div className="go-v4-empty">No eligible jobs right now. GO filters out pickups outside your configured distance.</div> : null}
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "parcels" ? (
            <>
              <section className="go-v4-section-head"><div><span className="go-v4-kicker">ADVANCE-PAID LOGISTICS</span><h1>Book. Pay. Track.</h1><p>Every parcel is fully funded before dispatch. Delivery settlement happens only after verified completion.</p></div></section>
              {verification ? (
                <section className="go-v4-code-vault">
                  <div><span>PICKUP CODE</span><strong>{verification.pickupCode}</strong><small>Give this to the courier only at pickup.</small></div>
                  <div><span>DELIVERY CODE</span><strong>{verification.deliveryCode}</strong><small>Recipient provides this at delivery.</small></div>
                </section>
              ) : null}
              <div className="go-v4-parcel-grid">
                <section className="go-v4-panel">
                  <div className="go-v4-panel-head"><div><span className="go-v4-kicker">NEW DELIVERY</span><h2>Instant quote</h2></div></div>
                  <form className="go-v4-form" onSubmit={createQuote}>
                    <label className="wide">Pickup<input required value={parcelForm.pickup} onChange={(e) => setParcelForm((v) => ({...v,pickup:e.target.value}))} placeholder="Pickup address or place"/></label>
                    <label>Pickup latitude<input inputMode="decimal" value={parcelForm.pickupLat} onChange={(e) => setParcelForm((v) => ({...v,pickupLat:e.target.value}))}/></label>
                    <label>Pickup longitude<input inputMode="decimal" value={parcelForm.pickupLng} onChange={(e) => setParcelForm((v) => ({...v,pickupLng:e.target.value}))}/></label>
                    <label className="wide">Drop-off<input required value={parcelForm.dropoff} onChange={(e) => setParcelForm((v) => ({...v,dropoff:e.target.value}))} placeholder="Destination"/></label>
                    <label>Distance (km)<input required inputMode="decimal" value={parcelForm.distanceKm} onChange={(e) => setParcelForm((v) => ({...v,distanceKm:e.target.value}))}/></label>
                    <label>Weight (kg)<input required inputMode="decimal" value={parcelForm.weightKg} onChange={(e) => setParcelForm((v) => ({...v,weightKg:e.target.value}))}/></label>
                    <label>Service<select value={parcelForm.serviceLevel} onChange={(e) => setParcelForm((v) => ({...v,serviceLevel:e.target.value as LogisticsServiceLevel}))}>{services.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
                    <label>Schedule<input type="datetime-local" value={parcelForm.schedule} onChange={(e) => setParcelForm((v) => ({...v,schedule:e.target.value}))}/></label>
                    <button className="go-v4-primary" disabled={busy === "quote"}>{busy === "quote" ? "Quoting…" : "Get live quote"}</button>
                  </form>

                  {quote ? (
                    <div className="go-v4-quote">
                      <div><span>{quote.serviceLevel}</span><strong>{money(quote.amountMinor, quote.currency)}</strong></div>
                      <p>Estimated delivery {quote.etaMinutes} min · quote expires {new Date(quote.expiresAt).toLocaleTimeString("en-NG")}</p>
                      <label>6-digit Wallet PIN<input type="password" inputMode="numeric" maxLength={6} value={parcelForm.payPin} onChange={(e) => setParcelForm((v) => ({...v,payPin:e.target.value.replace(/\D/g,"").slice(0,6)}))}/></label>
                      <button className="go-v4-primary" disabled={busy === "book" || parcelForm.payPin.length !== 6} onClick={() => void confirmBooking()}>{busy === "book" ? "Funding…" : `Pay ${money(quote.amountMinor, quote.currency)} & confirm`}</button>
                      <small>Funds move from Wallet into delivery escrow immediately. Cancellation before pickup returns funded value to Pay.</small>
                    </div>
                  ) : null}
                </section>

                <section className="go-v4-panel">
                  <div className="go-v4-panel-head"><div><span className="go-v4-kicker">TRACK</span><h2>Parcel timeline</h2></div></div>
                  <form className="go-v4-track" onSubmit={track}>
                    <input required value={trackingCode} onChange={(e)=>setTrackingCode(e.target.value)} placeholder="TRK-…"/>
                    <button>Track</button>
                  </form>
                  {trackingResult ? (
                    <div className="go-v4-tracking-card">
                      <span>{trackingResult.publicCode}</span>
                      <strong>{label(trackingResult.status)}</strong>
                      <p>{trackingResult.serviceLevel} · {trackingResult.etaMinutes} min quote ETA</p>
                      <small>{label(trackingResult.fundingStatus)} · updated {new Date(trackingResult.updatedAt).toLocaleString("en-NG")}</small>
                    </div>
                  ) : null}
                </section>
              </div>

              <section className="go-v4-panel">
                <div className="go-v4-panel-head"><div><span className="go-v4-kicker">MY PARCELS</span><h2>Bookings & funding</h2></div><button onClick={() => void loadCustomer()}>Refresh</button></div>
                <div className="go-v4-booking-list">
                  {customerBookings.length ? customerBookings.map((item) => (
                    <article key={item.booking.id}>
                      <div><span>{item.booking.publicCode}</span><strong>{locationLabel(item.pickup)} → {locationLabel(item.dropoff)}</strong><small>{item.booking.trackingCode} · {new Date(item.booking.createdAt).toLocaleString("en-NG")}</small></div>
                      <div><b>{label(item.booking.status)}</b><strong>{money(item.booking.amountPaidMinor ?? item.quote.amountMinor, item.quote.currency)}</strong><small>{label(item.booking.fundingStatus ?? "UNFUNDED")}</small></div>
                      {["CONFIRMED","ASSIGNED"].includes(item.booking.status) ? <button disabled={busy === `cancel:${item.booking.id}`} onClick={() => void cancelBooking(item.booking.id)}>Cancel</button> : null}
                    </article>
                  )) : <div className="go-v4-empty">No parcel bookings yet.</div>}
                </div>
              </section>
            </>
          ) : null}

          {tab === "earnings" ? (
            <>
              <section className="go-v4-section-head"><div><span className="go-v4-kicker">GO EARNINGS</span><h1>One payout picture.</h1><p>Food and parcel courier earnings settle to Wallet after verified completion.</p></div></section>
              <section className="go-v4-money-grid">
                <article><span>TODAY</span><strong>{money(combinedToday)}</strong><small>{foodHistory.summary.todayDeliveredCount + parcelHistory.summary.todayDeliveredCount} completed</small></article>
                <article><span>RECENT</span><strong>{money(combinedRecent)}</strong><small>loaded delivery history</small></article>
                <article><span>FOOD</span><strong>{money(foodHistory.summary.recentPayoutMinor)}</strong><small>{foodHistory.summary.deliveredCount} delivered</small></article>
                <article><span>PARCELS</span><strong>{money(parcelHistory.summary.recentPayoutMinor)}</strong><small>{parcelHistory.summary.deliveredCount} delivered</small></article>
              </section>
              <section className="go-v4-panel">
                <div className="go-v4-panel-head"><div><span className="go-v4-kicker">PAYOUT RAIL</span><h2>Wallet</h2></div><a href="http://localhost:3010">Open Pay →</a></div>
                <p className="go-v4-muted">Parcel earnings are ledger-settled from funded delivery escrow. Food earnings continue through the existing Go economics flow. The Pay wallet is the canonical courier balance.</p>
              </section>
            </>
          ) : null}

          {tab === "support" ? (
            <>
              <section className="go-v4-section-head"><div><span className="go-v4-kicker">GLOBAL SUPPORT</span><h1>One issue. One case.</h1><p>Courier, parcel, payment and delivery problems route into the same Operations support desk.</p></div></section>
              <div className="go-v4-support-grid">
                <section className="go-v4-panel">
                  <div className="go-v4-panel-head"><div><span className="go-v4-kicker">CONTACT OPERATIONS</span><h2>Open a case</h2></div></div>
                  <form className="go-v4-form" onSubmit={createSupportCase}>
                    <label>Area<select value={supportForm.category} onChange={(e)=>setSupportForm(v=>({...v,category:e.target.value}))}><option>GO</option><option>LOGISTICS</option><option>DELIVERY</option><option>PAYMENT</option><option>ACCOUNT</option><option>OTHER</option></select></label>
                    <label className="wide">Subject<input required value={supportForm.subject} onChange={(e)=>setSupportForm(v=>({...v,subject:e.target.value}))}/></label>
                    <label className="wide">Detail<textarea required value={supportForm.description} onChange={(e)=>setSupportForm(v=>({...v,description:e.target.value}))}/></label>
                    <button className="go-v4-primary" disabled={busy==="support"}>{busy==="support"?"Opening…":"Open support case"}</button>
                  </form>
                </section>
                <section className="go-v4-panel">
                  <div className="go-v4-panel-head"><div><span className="go-v4-kicker">CASE INBOX</span><h2>Recent Go cases</h2></div></div>
                  <div className="go-v4-case-list">
                    {supportCases.length ? supportCases.map((item)=><article key={item.id}><div><strong>{item.subject}</strong><small>{item.category} · {new Date(item.lastActivityAt).toLocaleString("en-NG")}</small></div><span>{label(item.status)}</span></article>) : <div className="go-v4-empty">No Go support cases.</div>}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {tab === "profile" ? (
            <>
              <section className="go-v4-section-head"><div><span className="go-v4-kicker">GO PROFILE</span><h1>Access, region and rules.</h1></div></section>
              <section className="go-v4-profile-grid">
                <article><span>COURIER ACCESS</span><strong>{courierAuthorized ? "ACTIVE" : "NOT ASSIGNED"}</strong><small>BazID logistics.courier scope</small></article>
                <article><span>REGION</span><strong>{capabilities?.region ?? "—"}</strong><small>Platform operating region</small></article>
                <article><span>CURRENCY</span><strong>{capabilities?.currency ?? "—"}</strong><small>Logistics quote currency</small></article>
                <article><span>PARCEL COMMISSION</span><strong>{((capabilities?.commissionBps ?? 0)/100).toFixed(1)}%</strong><small>Applied on delivered parcel jobs</small></article>
                <article><span>PICKUP RADIUS</span><strong>{Math.round((capabilities?.maxCourierPickupDistanceMeters ?? 0)/1000)} km</strong><small>Maximum parcel offer radius</small></article>
                <article><span>PAYMENT</span><strong>{capabilities?.advancePaymentRequired ? "100% ADVANCE" : "OPTIONAL"}</strong><small>Funded before dispatch</small></article>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
