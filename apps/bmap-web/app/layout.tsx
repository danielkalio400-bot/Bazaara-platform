import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import InternetDock from '../components/InternetDock';
import './internet-neon-v6.css';
import './internet-research-v8.css';
import './globals.css';
import './bmap-v5-2.css';
// Independent BMap product shell. Global BazID session and BMap API routes remain intact.
// Other products retain their Spectrum launcher; BMap exposes Workspace via its compact rail.
export const metadata = { title: 'BMap — BAZAARA', description: 'Maps, places and local discovery.' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><InternetDock current="bmap"/>{children}</body></html>;
}
