import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title:'BAZAARA Workspace — One place for what comes next',
  description:'BAZAARA Ecosystem 3 unified workspace, BazID sign-in and connected app launcher.',
  robots:{index:false,follow:false},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="en"><body>{children}<BazaaraHub currentApp="workspace"/></body></html>;
}
