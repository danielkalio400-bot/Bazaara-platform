import { FoodHeader } from "../../../components/food-header";
import { FoodCartClient } from "../../../components/food-cart-client";

export default async function CartPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = await params;
  return <div className="food-shell"><FoodHeader cartRestaurantSlug={restaurantSlug}/><main className="food-page"><FoodCartClient restaurantSlug={restaurantSlug}/></main></div>;
}
