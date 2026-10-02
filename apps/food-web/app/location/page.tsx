import {FoodHeader} from "../../components/food-header";
import {FoodLocationPageClient} from "../../components/food-location-page-client";
export default function LocationPage(){return <div className="food-shell"><FoodHeader showSearch={false}/><main className="food-location-page-shell"><FoodLocationPageClient/></main></div>}
