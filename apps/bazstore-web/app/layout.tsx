import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import './globals.css';
export const metadata={title:'BazStore — BAZAARA',description:'Official BAZAARA app marketplace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="bazstore"/></body></html>}
