import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bazasport", description: "Sports fixtures, live scores and discovery." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="bazasport"/></body></html>; }
