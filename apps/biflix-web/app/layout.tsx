import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Ɓiflix · BAZAARA",description:"A cinematic entertainment experience under development by BAZAARA."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
