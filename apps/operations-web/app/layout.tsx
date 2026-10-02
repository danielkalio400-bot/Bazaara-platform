import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";
import "./operations-v4.css";
import "./operations-grocery-v5.css";
import "./operations-grocery-normal-v55.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bazaara Operations" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="operations"/></body></html>; }
