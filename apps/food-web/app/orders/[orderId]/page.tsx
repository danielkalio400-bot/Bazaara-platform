import { FoodHeader } from "../../../components/food-header";
import { FoodOrderDetailClient } from "../../../components/food-order-detail-client";
export default async function OrderDetailPage({params}:{params:Promise<{orderId:string}>}){const{orderId}=await params;return <div className="food-shell"><FoodHeader/><main className="food-page"><FoodOrderDetailClient orderId={orderId}/></main></div>}
