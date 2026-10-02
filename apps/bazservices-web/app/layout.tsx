import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import './globals.css';
export const metadata={title:'BazServices — BAZAARA',description:'Shared application service layer and capability status.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="bazservices"/></body></html>}
