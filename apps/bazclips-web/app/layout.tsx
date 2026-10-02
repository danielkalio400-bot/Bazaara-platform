import BazaaraHub from './bazaara-hub';
import '../../../packages/smart-ui/src/styles.css';
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "ZimZam | BAZAARA", description: "Short-form video and creator discovery" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="bazclips"/></body></html>; }
