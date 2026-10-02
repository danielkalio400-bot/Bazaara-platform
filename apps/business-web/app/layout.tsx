import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";
import "./business-go-v4.css";
import "./business-grocery-v5.css";
import "./business-grocery-normal-v55.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bazaara Business" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="business"/></body></html>; }
