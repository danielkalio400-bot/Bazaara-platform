import { createApiClient } from "@bazaara/api-client";
import type { FoodCartContract, FoodMenuItemContract, FoodOrderContract, FoodRestaurantSummaryContract } from "@bazaara/contracts";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
export const BAZID_BASE = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";

const FOOD_BROWSER_API_BASE =
  typeof window === "undefined"
    ? API_BASE
    : `${window.location.origin}/api/bazaara-platform`;

export const foodApi = createApiClient({
  baseUrl: FOOD_BROWSER_API_BASE,
  credentials: "include",
  maxGetRetries: 1,
});

export type FoodHome = {
  cuisines: Array<{ name: string; count: number }>;
  restaurants: FoodRestaurantSummaryContract[];
  featuredItems: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string | null;
    priceMinor: number;
    currency: string;
    restaurant: FoodRestaurantSummaryContract;
  }>;
};

export type FoodRestaurantDetail = {
  restaurant: FoodRestaurantSummaryContract;
  menu: Array<{ id: string; slug: string; title: string; description: string | null; items: FoodMenuItemContract[] }>;
};

export type FoodSearchResult = {
  restaurants: FoodRestaurantSummaryContract[];
  items: Array<{ id: string; slug: string; name: string; description: string; imageUrl: string | null; priceMinor: number; currency: string; restaurant: FoodRestaurantSummaryContract }>;
};

export type FoodCartResponse = { cart: FoodCartContract };

export type FoodOrder = FoodOrderContract;

export function money(minor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}
