"use client";

import { useEffect } from "react";

type BazIdContext =
  | "ecosystem"
  | "food"
  | "pay"
  | "shopping"
  | "grocery"
  | "business"
  | "operations"
  | "go"
  | "pharmacy"
  | "drive"
  | "sport";

const PORT_CONTEXT: Record<string, BazIdContext> = {
  "3001": "business",
  "3002": "operations",
  "3003": "shopping",
  "3005": "ecosystem",
  "3006": "grocery",
  "3007": "food",
  "3008": "go",
  "3009": "pharmacy",
  "3010": "pay",
  "3011": "drive",
  "3012": "sport",
};

function contextFromText(value: string | null | undefined): BazIdContext | null {
  const text = (value ?? "").toLowerCase();
  if (!text) return null;
  if (text.includes("food")) return "food";
  if (text.includes("pay") || text.includes("wallet")) return "pay";
  if (text.includes("grocery")) return "grocery";
  if (text.includes("shopping") || text.includes("commerce")) return "shopping";
  if (text.includes("business") || text.includes("merchant")) return "business";
  if (text.includes("operations") || text.includes("admin")) return "operations";
  if (text.includes("logistics") || text.includes("courier") || text.includes("go")) return "go";
  if (text.includes("pharmacy")) return "pharmacy";
  if (text.includes("drive") || text.includes("rider") || text.includes("driver")) return "drive";
  if (text.includes("sport")) return "sport";
  if (text.includes("bazaara") || text.includes("portal") || text.includes("ecosystem")) return "ecosystem";
  return null;
}

function contextFromUrl(value: string | null | undefined): BazIdContext | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return PORT_CONTEXT[url.port] ?? contextFromText(`${url.hostname} ${url.pathname}`);
  } catch {
    return contextFromText(value);
  }
}

function resolveContext(): BazIdContext {
  const url = new URL(window.location.href);

  for (const key of ["from", "app", "theme", "client_id"]) {
    const direct = contextFromText(url.searchParams.get(key));
    if (direct) return direct;
  }

  const returnContext = contextFromUrl(url.searchParams.get("returnTo"));
  if (returnContext) return returnContext;

  const referrerContext = contextFromUrl(document.referrer);
  if (referrerContext) return referrerContext;

  try {
    const stored = contextFromText(window.localStorage.getItem("bazaara.bazid.context"));
    if (stored) return stored;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }

  return "ecosystem";
}

export function BazIdThemeBridge() {
  useEffect(() => {
    const context = resolveContext();
    document.documentElement.dataset.bazidContext = context;
    try {
      window.localStorage.setItem("bazaara.bazid.context", context);
    } catch {
      // Cosmetic theme persistence must never block authentication.
    }
  }, []);

  return null;
}
