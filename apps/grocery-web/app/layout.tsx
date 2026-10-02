import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type { Metadata } from "next";

import { GroceryMobileBottomNav } from "../components/grocery-mobile-bottom-nav";

import "./globals.css";
import "./grocery-theme.css";
import "./grocery-v2.css";
import "./grocery-focus-v5.1.css";
import "./grocery-complete-v54.css";
import "./grocery-v5.3.css";
import "./grocery-normal-v55.css";

const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "https://grocery.bazaara.com";

function safeMetadataBase() {
  try {
    return new URL(PUBLIC_ORIGIN);
  } catch {
    return new URL("https://grocery.bazaara.com");
  }
}

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: { default: "Grocery", template: "%s | Grocery" },
  description:
    "Fresh groceries, household essentials, reusable lists, smart planning and flexible fulfilment on Bazaara.",
  applicationName: "Grocery",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Grocery",
    title: "Grocery",
    description:
      "Fresh groceries and household essentials with Grocery lists, checkout and delivery.",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bazaara-grocery-app">
        {children}
        <GroceryMobileBottomNav />
      <BazaaraHub currentApp="grocery"/></body>
    </html>
  );
}
