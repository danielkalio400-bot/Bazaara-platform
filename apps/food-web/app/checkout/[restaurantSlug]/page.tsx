import { FoodHeader } from "../../../components/food-header";
import { FoodCheckoutClient } from "../../../components/food-checkout-client";

export default async function CheckoutPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = await params;
  return <div className="food-shell"><FoodHeader cartRestaurantSlug={restaurantSlug}/><main className="food-page"><FoodCheckoutClient restaurantSlug={restaurantSlug}/></main></div>;
}
