import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type { Metadata } from "next";
import "./globals.css";
import { BazIdThemeBridge } from "./bazid-theme";

export const metadata: Metadata = {
  title: "BazID | Bazaara",
  description: "One secure identity across the Bazaara ecosystem.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-bazid-context="ecosystem"><body><BazIdThemeBridge />{children}<BazaaraHub currentApp="bazid"/></body></html>;
}
