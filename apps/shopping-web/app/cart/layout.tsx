import type { Metadata } from "next";
import { CartAftercareRecommendations } from "../../components/cart-aftercare-recommendations";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };

export default function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <>{children}<CartAftercareRecommendations /></>; }
