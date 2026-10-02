import { FoodHeader } from "../../components/food-header";
import { FoodAccountClient } from "../../components/food-account-client";

export default function AccountPage() {
  return <div className="food-shell"><FoodHeader/><main className="food-page food-account-main"><FoodAccountClient/></main></div>;
}