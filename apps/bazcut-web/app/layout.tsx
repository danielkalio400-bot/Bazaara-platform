import BazaaraHub from './bazaara-hub';
import '../../../packages/smart-ui/src/styles.css';
import '../../../packages/flagship-ui/src/styles.css';
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "BazCut | BAZAARA", description: "Video editing and creative tools" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="bazcut"/></body></html>; }
