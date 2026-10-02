import '../../../packages/smart-ui/src/styles.css';
import '../../../packages/flagship-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'BAZAARA Sheets',description:'Connected spreadsheets for the BAZAARA workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="sheets"/></body></html>}
