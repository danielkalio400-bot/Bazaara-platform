import '../../../packages/smart-ui/src/styles.css';
import '../../../packages/flagship-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import './globals.css';
export const metadata={title:'Learn — BAZAARA',description:'Classroom, courses and learning workflows.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="learn"/></body></html>}
