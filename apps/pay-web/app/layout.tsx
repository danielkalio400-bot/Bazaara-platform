import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wallet", description: "Wallet, payments and settlement." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="pay"/></body></html>; }
