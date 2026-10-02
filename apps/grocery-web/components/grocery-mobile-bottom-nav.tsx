"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/search-results?vertical=GROCERY", match: "/search-results", label: "Explore", icon: "⌕" },
  { href: "/bazai?prompt=Help%20me%20shop%20for%20groceries", match: "/bazai", label: "Assistant", icon: "✦", center: true },
  { href: "/orders", label: "Orders", icon: "▤" },
  { href: "/account", label: "Account", icon: "●" },
];

export function GroceryMobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="grocery-mobile-nav" aria-label="Grocery navigation">
      {items.map((item) => {
        const match = item.match ?? item.href;
        const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
        return (
          <Link key={item.label} href={item.href} className={`${active ? "is-active" : ""}${item.center ? " is-center" : ""}`}>
            <span className="grocery-mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
