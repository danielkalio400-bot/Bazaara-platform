import BazaaraHub from './bazaara-hub';
import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import BChatCallsNav from "./calls/BChatCallsNav";
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "BChat | BAZAARA", description: "Private messaging and calls" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><BChatCallsNav/>{children}<BazaaraHub currentApp="bazchat"/></body></html>; }
