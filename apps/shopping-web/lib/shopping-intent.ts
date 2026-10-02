/**
 * Transparent, deterministic guided-search parsing; not model inference.
 * Returns only search parameters understood by /v1/shopping/search.
 * No external services and no personal data collection.
 */
export type ShoppingIntent = {
  q?: string;
  minPriceMinor?: string;
  maxPriceMinor?: string;
  inStock: "true";
  verifiedSeller?: "true";
  sort: "featured" | "newest" | "price_asc";
  vertical: "SHOPPING";
};

const numberPattern = String.raw`(?:₦|ngn\s*)?\s*([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)?`;
const maxPricePattern = new RegExp(String.raw`\b(?:under|below|less than|up to|maximum|max|within(?: a)? budget of)\s*${numberPattern}`, "i");
const minPricePattern = new RegExp(String.raw`\b(?:over|above|at least|minimum|min)\s*${numberPattern}`, "i");
const betweenPattern = new RegExp(String.raw`\bbetween\s*${numberPattern}\s+(?:and|to|-)\s*${numberPattern}`, "i");

function parseNaira(raw: string, suffix?: string) {
  const num = Number(raw.replaceAll(",", ""));
  const multiplier = suffix?.toLowerCase();
  const amount = num * (multiplier === "m" || multiplier === "million" ? 1_000_000 : multiplier === "k" || multiplier === "thousand" ? 1_000 : 1);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000
    ? String(Math.round(amount * 100)) : undefined;
}

export function parseShoppingIntent(phrase: string): ShoppingIntent {
  let remaining = phrase.trim().slice(0, 240);
  const intent: ShoppingIntent = { vertical: "SHOPPING", inStock: "true", sort: "featured" };
  const range = remaining.match(betweenPattern);
  if (range) {
    const first = parseNaira(range[1] ?? "", range[2]);
    const second = parseNaira(range[3] ?? "", range[4]);
    if (first && second) {
      const a = Number(first); const b = Number(second);
      intent.minPriceMinor = String(Math.min(a, b));
      intent.maxPriceMinor = String(Math.max(a, b));
      remaining = remaining.replace(range[0], " ");
    }
  }
  const max = remaining.match(maxPricePattern);
  if (max) {
    const value = parseNaira(max[1] ?? "", max[2]);
    if (value) { intent.maxPriceMinor = value; remaining = remaining.replace(max[0], " "); }
  }
  const min = remaining.match(minPricePattern);
  if (min) {
    const value = parseNaira(min[1] ?? "", min[2]);
    if (value) { intent.minPriceMinor = value; remaining = remaining.replace(min[0], " "); }
  }
  if (/\b(verified|trusted|approved)\s+(sellers?|shops?|merchants?)\b/i.test(remaining) || /\bonly verified\b/i.test(remaining)) {
    intent.verifiedSeller = "true";
    remaining = remaining.replace(/\b(verified|trusted|approved)\s+(sellers?|shops?|merchants?)\b|\bonly verified\b/gi, " ");
  }
  if (/\b(new arrivals?|newest|latest)\b/i.test(remaining)) {
    intent.sort = "newest";
    remaining = remaining.replace(/\b(new arrivals?|newest|latest)\b/gi, " ");
  } else if (/\b(cheapest|cheaper|cheap|lowest price|budget friendly)\b/i.test(remaining)) {
    intent.sort = "price_asc";
    remaining = remaining.replace(/\b(cheapest|cheaper|cheap|lowest price|budget friendly)\b/gi, " ");
  }
  const q = remaining.trim()
    .replace(/^(?:please\s+)?(?:show me|find me|find|shop for|looking for|i need|i want|buy)\s+/i, "")
    .replace(/^(?:(?:with|from|by|and|only|that are|that is)\s+)+/gi, "")
    .replace(/\b(?:that are|that is|with|only|and|for me|please)\s*$/gi, "")
    .replace(/\b(?:in stock|available now)\b/gi, " ")
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (q) intent.q = q;
  // Protect against a contradictory request creating an impossible range.
  if (intent.minPriceMinor && intent.maxPriceMinor && Number(intent.minPriceMinor) > Number(intent.maxPriceMinor)) {
    delete intent.minPriceMinor;
  }
  return intent;
}

export function shoppingIntentHref(intent: ShoppingIntent): string {
  return `/search-results?${new URLSearchParams(Object.entries(intent).filter((entry) => entry[1] !== undefined) as [string, string][]).toString()}`;
}
