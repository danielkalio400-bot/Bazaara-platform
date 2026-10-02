import '../../../packages/smart-ui/src/styles.css';
import '../../../packages/flagship-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import './globals.css';
export const metadata={title:'Sites — BAZAARA',description:'Website creation and publishing workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="sites"/></body></html>}
