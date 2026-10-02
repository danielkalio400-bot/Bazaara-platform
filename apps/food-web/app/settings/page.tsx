import {FoodHeader} from "../../components/food-header";
import {FoodSettingsClient} from "../../components/food-settings-client";
export default function SettingsPage(){return <div className="food-shell"><FoodHeader showSearch={false}/><main className="food-settings-page"><div className="food-settings-title"><span>FOOD SETTINGS</span><h1>Built around you.</h1><p>Location, Nigerian language preferences, Wallet, notifications and BazID controls in one adaptive settings surface.</p></div><FoodSettingsClient/></main></div>}
