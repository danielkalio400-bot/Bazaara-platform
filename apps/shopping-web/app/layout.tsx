import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type { Metadata } from "next";
import { BazaaraMobileBottomNav } from "../components/bazaara-mobile-bottom-nav";
import ShoppingTools from "../components/shopping-tools";
import "./globals.css";
import "./shopping-theme.css";
import "./shopping-futuristic-neon-v2.css";
import "./shopping-desktop-responsive-v2.4.css";
import "./cart-experience-v2.5.css";
import "./cart-wishlist-v2.6.css";
import "./cart-mobile-compact-v2.7.css";
import "./shopping-smart-v12.css";
import "./shopping-deals-v13.css";
import "./shopping-retail-v14.css";
import "./shopping-restored-v15.css";
import "./shopping-blue-complete-v15-1.css";

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_SHOPPING_WEB_BASE_URL ?? "https://shopping.bazaara.com";

function safeMetadataBase() {
  try { return new URL(PUBLIC_ORIGIN); } catch { return new URL("https://shopping.bazaara.com"); }
}

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: { default: "Shopping", template: "%s | Shopping" },
  description: "Shop products from accountable sellers with secure BazID checkout on Shopping.",
  applicationName: "Shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Shopping",
    title: "Shopping",
    description: "Shop products from accountable sellers with secure BazID checkout.",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<ShoppingTools /><BazaaraMobileBottomNav /><BazaaraHub currentApp="shopping"/></body></html>;
}
