"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "⌂", match: (path: string) => path === "/" },
  { href: "/search", label: "Search", icon: "⌕", match: (path: string) => path.startsWith("/search") || path.startsWith("/restaurants") },
  { href: "/orders", label: "Orders", icon: "▤", match: (path: string) => path.startsWith("/orders") },
  { href: "/account", label: "Account", icon: "◉", match: (path: string) => path.startsWith("/account") },
];

export function FoodBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="food-bottom-nav" aria-label="Food mobile navigation">
      {items.map((item) => <Link key={item.href} href={item.href} className={item.match(pathname) ? "active" : undefined}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></Link>)}
    </nav>
  );
}
