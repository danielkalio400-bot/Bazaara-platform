"use client";

export type CompareItem = {
  id: string;
  href: string;
  title: string;
  image: string;
  price: string;
  oldPrice: string;
  seller: string;
  availability: string;
  rating: string;
};

export const COMPARE_STORAGE_KEY = "bazaara_compare_v1";
export const COMPARE_LIMIT = 4;
export const COMPARE_EVENT = "bazaara-compare-updated";

export function readCompareItems(): CompareItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is CompareItem => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate = item as Partial<CompareItem>;

        return (
          typeof candidate.id === "string" &&
          typeof candidate.href === "string" &&
          typeof candidate.title === "string"
        );
      })
      .slice(0, COMPARE_LIMIT);
  }
  catch {
    return [];
  }
}

function writeCompareItems(items: CompareItem[]) {
  window.localStorage.setItem(
    COMPARE_STORAGE_KEY,
    JSON.stringify(items.slice(0, COMPARE_LIMIT))
  );

  window.dispatchEvent(
    new CustomEvent(COMPARE_EVENT)
  );
}

export function isCompared(id: string) {
  return readCompareItems().some((item) => item.id === id);
}

export function toggleCompareItem(
  item: CompareItem
): {
  items: CompareItem[];
  added: boolean;
  limitReached: boolean;
} {
  const current = readCompareItems();
  const exists = current.some((entry) => entry.id === item.id);

  if (exists) {
    const next = current.filter((entry) => entry.id !== item.id);
    writeCompareItems(next);

    return {
      items: next,
      added: false,
      limitReached: false
    };
  }

  if (current.length >= COMPARE_LIMIT) {
    return {
      items: current,
      added: false,
      limitReached: true
    };
  }

  const next = [...current, item];
  writeCompareItems(next);

  return {
    items: next,
    added: true,
    limitReached: false
  };
}

export function removeCompareItem(id: string) {
  const next = readCompareItems().filter((entry) => entry.id !== id);
  writeCompareItems(next);

  return next;
}

export function clearCompareItems() {
  writeCompareItems([]);
}
