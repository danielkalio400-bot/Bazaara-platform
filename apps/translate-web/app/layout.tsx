import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import InternetDock from '../components/InternetDock';
import './internet-neon-v6.css';
import './internet-research-v8.css';
import type {Metadata} from 'next';import './globals.css';import './standalone.css';import './standalone-v5.css';import './translate-v4.css';import './translate-v5.css';
export const metadata:Metadata={title:'BAZAARA Translate — Languages without borders',description:'Independent translation product with connected text provider, document import and history.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InternetDock current="translate"/>{children}</body></html>}
