import { FoodHeader } from "../../../components/food-header";
import { FoodGroupJoinClient } from "../../../components/food-group-join-client";
export default async function GroupPage({params}:{params:Promise<{token:string}>}){const{token}=await params;return <div className="food-shell"><FoodHeader/><main className="food-page"><FoodGroupJoinClient token={token}/></main></div>}
