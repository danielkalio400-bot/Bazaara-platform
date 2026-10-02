import BazaaraHub from './bazaara-hub';
import '../../../packages/smart-ui/src/styles.css';
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "BSend | BAZAARA", description: "Private file transfer and sharing" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="bazsend"/></body></html>; }
