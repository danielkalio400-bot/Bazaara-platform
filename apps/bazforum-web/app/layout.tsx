import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bazforum | BAZAARA", description: "BAZAARA Ecosystem 2 — Bazforum" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="bazforum"/></body></html>; }
