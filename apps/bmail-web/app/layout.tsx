import '../../../packages/flagship-ui/src/styles.css';
import '../../../packages/smart-ui/src/styles.css';
import "./bazaara-hub.css";
import './globals.css';
import './bmail-experience.css';
export const metadata={title:'Bmail — BAZAARA',description:'Private email and connected BazID communications.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
