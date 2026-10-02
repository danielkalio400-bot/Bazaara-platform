import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pharmacy", description: "OTC and wellness commerce with compliance guardrails." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="pharmacy"/></body></html>; }
