import BazaaraHub from './bazaara-hub';
import '../../../packages/smart-ui/src/styles.css';
import "@bazaara/social-ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "BTune | BAZAARA", description: "Music, audio and playlists" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<BazaaraHub currentApp="baztune"/></body></html>; }
