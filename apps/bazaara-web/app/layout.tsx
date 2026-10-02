import '../../../packages/smart-ui/src/styles.css';
import BazaaraHub from "./bazaara-hub";
import "./bazaara-hub.css";
import "./globals.css";

export const metadata = {
  title: "BAZAARA — Platform Home",
  description: "One platform. Three ecosystems. Built in sequence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<BazaaraHub currentApp="bazaara"/></body>
    </html>
  );
}
