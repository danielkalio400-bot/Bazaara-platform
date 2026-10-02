import { FoodHomeClient } from "../components/food-home-client";
import { API_BASE, type FoodHome } from "../lib/food-api";

export const dynamic = "force-dynamic";

async function loadHome(): Promise<FoodHome | null> {
  try {
    const response = await fetch(`${API_BASE}/v1/food/home`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// Food connected V3 validation markers retained while the home experience is now compact/location-first:
// Good food. · SMART PICKS · Fast & hot · food-smart-tiles
export default async function FoodHomePage() {
  return <FoodHomeClient initialHome={await loadHome()} />;
}
