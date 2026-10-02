import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type { Metadata } from "next";
import { FoodBottomNav } from "../components/food-bottom-nav";
import "./globals.css";

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_FOOD_WEB_BASE_URL ?? "https://food.bazaara.com";
export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  title: { default: "Food", template: "%s | Food" },
  description: "Restaurants, prepared meals, pickup and delivery on Food.",
  applicationName: "Food",
  openGraph: { type: "website", siteName: "Food", title: "Food", description: "Discover restaurants and order meals with Bazaara." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="bazaara-food-app">{children}<FoodBottomNav /><BazaaraHub currentApp="food"/></body></html>;
}
