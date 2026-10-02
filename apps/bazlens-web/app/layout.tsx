import '../../../packages/smart-ui/src/styles.css';
import InternetDock from '../components/InternetDock';
import './internet-neon-v6.css';
import './internet-research-v8.css';
import type {Metadata} from 'next';import './globals.css';import './standalone.css';import './standalone-v5.css';import './bazlens-v4.css';import './bazlens-v5.css';
export const metadata:Metadata={title:'BAZAARA BazLens — Visual discovery',description:'Independent visual inspection with image cropping, barcode detection and optional vision integration.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InternetDock current="bazlens"/>{children}</body></html>}
