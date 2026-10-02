import '../../../packages/smart-ui/src/styles.css';
import '../../../packages/flagship-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BAZAARA Box — Your space for what matters',description:'Private file management in BAZAARA Ecosystem 3.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<BazaaraHub currentApp="box"/></body></html>}
