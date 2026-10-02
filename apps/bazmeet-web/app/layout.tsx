import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import './globals.css';
export const metadata={title:'BazMeet — BAZAARA',description:'Video meetings, rooms and scheduling.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="bazmeet"/></body></html>}
