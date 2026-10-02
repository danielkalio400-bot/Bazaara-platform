import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import InternetDock from '../components/InternetDock';
import './internet-neon-v6.css';
import './internet-research-v8.css';
import type {Metadata} from 'next';
import './globals.css';import './standalone.css';import './standalone-v5.css';import './news-v4.css';import './news-v5.css';
export const metadata:Metadata={title:'BAZAARA News — Your world in focus',description:'Independent news reader featuring live publisher feeds, following and saved articles.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InternetDock current="news"/>{children}</body></html>}
