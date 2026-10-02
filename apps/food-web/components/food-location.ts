"use client";

export type FoodDiscoveryLocation = {
  latitude: number;
  longitude: number;
  label: string;
  detail?: string;
  source: "device" | "saved";
  updatedAt: string;
};

export const FOOD_LOCATION_STORAGE_KEY = "bazaara.food.discoveryLocation.v1";
export const FOOD_LOCATION_EVENT = "bazaara-food-location-change";

export function readFoodDiscoveryLocation(): FoodDiscoveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOOD_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<FoodDiscoveryLocation>;
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return {
      latitude,
      longitude,
      label: typeof value.label === "string" && value.label.trim() ? value.label.trim() : "Current location",
      detail: typeof value.detail === "string" ? value.detail : undefined,
      source: value.source === "saved" ? "saved" : "device",
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveFoodDiscoveryLocation(location: FoodDiscoveryLocation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOOD_LOCATION_STORAGE_KEY, JSON.stringify(location));
  window.dispatchEvent(new CustomEvent<FoodDiscoveryLocation>(FOOD_LOCATION_EVENT, { detail: location }));
}

export function subscribeFoodDiscoveryLocation(listener: (location: FoodDiscoveryLocation | null) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener(readFoodDiscoveryLocation());
  window.addEventListener(FOOD_LOCATION_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FOOD_LOCATION_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function foodDiscoveryQuery(location: FoodDiscoveryLocation | null) {
  if (!location) return "";
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  });
  return params.toString();
}
