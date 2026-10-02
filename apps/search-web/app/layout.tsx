import BazaaraHub from './bazaara-hub';
import '../../../packages/smart-ui/src/styles.css';
import './internet-neon-v6.css';
import './internet-research-v8.css';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BAZAARA Search — Search built for people',
  description: 'Explore the web through BAZAARA Search. Original interface. Transparent provider integration. No BAZAARA query-history database.',
  robots: { index: false, follow: false }, // Alpha must not be indexed until deployment is approved.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<BazaaraHub currentApp="search"/></body></html>;
}
