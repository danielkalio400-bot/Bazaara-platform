"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./shopping-header.module.css";

type Category = {
  name: string;
  slug: string;
  groups: Array<{
    title: string;
    items: string[];
  }>;
};

const categories: Category[] = [
  { name:"Official Stores", slug:"official-stores", groups:[
    { title:"BAZAARA STORES", items:["Bazaara Select","Official Brand Stores","Top Rated Sellers","New Stores"] },
    { title:"POPULAR BRANDS", items:["Samsung","Apple","HP","Lenovo","Sony","Nike","Adidas"] }
  ]},
  { name:"Electronics", slug:"electronics", groups:[
    { title:"TV & VIDEO", items:["Televisions","Smart TVs","Projectors","Streaming Devices"] },
    { title:"CAMERAS", items:["Digital Cameras","Security Cameras","Camera Accessories"] },
    { title:"AUDIO", items:["Sound Bars","Bluetooth Speakers","Home Theatre","Headphones"] }
  ]},
  { name:"Computing", slug:"computing", groups:[
    { title:"COMPUTERS", items:["Laptops","Desktops","Gaming Laptops","MacBooks"] },
    { title:"ACCESSORIES", items:["Monitors","Keyboards & Mice","Storage","USB Hubs"] },
    { title:"PRINTERS", items:["Inkjet Printers","Laser Printers","Ink & Toner"] }
  ]},
  { name:"Home & Kitchen", slug:"home-kitchens", groups:[
    { title:"HOME", items:["Furniture","Bedding","Home Decor","Lighting"] },
    { title:"KITCHEN", items:["Small Appliances","Cookware","Kitchen & Dining"] },
    { title:"OUTDOOR", items:["Generators","Garden Tools","Outdoor Furniture"] }
  ]},
  { name:"Fashion", slug:"fashion", groups:[
    { title:"WOMEN", items:["Clothing","Shoes","Handbags","Jewelry"] },
    { title:"MEN", items:["Clothing","Shoes","Sneakers","Accessories"] },
    { title:"WATCHES", items:["Men's Watches","Women's Watches","Smart Watches"] }
  ]},
  { name:"Beauty & Care", slug:"beauty-care", groups:[
    { title:"BEAUTY", items:["Make Up","Skin Care","Fragrances","Hair Care"] },
    { title:"PERSONAL CARE", items:["Oral Care","Grooming","Bath & Body"] }
  ]},
  { name:"Baby & Kids", slug:"baby-kids", groups:[
    { title:"BABY", items:["Diapers","Baby Feeding","Baby Gear","Bathing & Skin Care"] },
    { title:"KIDS", items:["Toys & Games","Kids Fashion","School Supplies"] }
  ]},
  { name:"Gaming", slug:"gaming", groups:[
    { title:"CONSOLES", items:["PlayStation","Xbox","Nintendo Switch"] },
    { title:"GAMES & ACCESSORIES", items:["Games","Controllers","Gaming Headsets","Gaming Keyboards"] }
  ]},
  { name:"Automotive", slug:"automotive", groups:[
    { title:"CAR", items:["Car Care","Car Electronics","Interior Accessories","Tyres & Rims"] },
    { title:"MOTORCYCLE", items:["Helmets","Accessories","Maintenance"] }
  ]},
  { name:"Sports & Outdoors", slug:"sports-outdoors", groups:[
    { title:"FITNESS", items:["Cardio Training","Strength Training","Fitness Accessories"] },
    { title:"OUTDOOR", items:["Team Sports","Camping","Outdoor & Adventure"] }
  ]},
  { name:"Books & Media", slug:"books-media", groups:[
    { title:"BOOKS", items:["Academic","Business","Fiction","Children's Books"] },
    { title:"MEDIA", items:["Music","Movies","Learning Materials"] }
  ]}
];

function MenuGlyph() {
  return (
    <span className={styles.menuGlyph} aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

export function DesktopMainMenu() {
  const [open,setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    function outside(event:MouseEvent) {
      if (open && rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event:KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown",outside);
    document.addEventListener("keydown",escape);
    return () => {
      document.removeEventListener("mousedown",outside);
      document.removeEventListener("keydown",escape);
    };
  },[open]);

  const close = () => setOpen(false);

  return (
    <div className={styles.desktopMenuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setOpen(value => !value)}
        aria-label="Open Grocery menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MenuGlyph />
      </button>

      {open ? (
        <div className={styles.mainMenuPanel} role="menu">
          <div className={styles.mainMenuHead}>
            <strong>Grocery</strong>
            <span>Grocery navigation and tools</span>
          </div>

          <div className={styles.mainMenuGrid}>
            <Link href="/" role="menuitem" onClick={close}>Home</Link>
            <a href="/#deals" role="menuitem" onClick={close}>Deals</a>
            <Link href="/orders" role="menuitem" onClick={close}>Orders</Link>
            <Link href="/wishlist" role="menuitem" onClick={close}>Wishlist</Link>
            <Link href="/account" role="menuitem" onClick={close}>Account</Link>
            <Link href="/account/settings" role="menuitem" onClick={close}>Settings</Link>
            <Link href="/bazai" role="menuitem" onClick={close}>BazAI</Link>
            <Link href="/bazlens" role="menuitem" onClick={close}>BazLens</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DesktopCategoryMenu() {
  const [open,setOpen] = useState(false);
  const [activeSlug,setActiveSlug] = useState(categories[0]?.slug ?? "");
  const rootRef = useRef<HTMLDivElement|null>(null);

  const active = useMemo(
    () => categories.find(category => category.slug === activeSlug) ?? categories[0] ?? null,
    [activeSlug]
  );

  useEffect(() => {
    function outside(event:MouseEvent) {
      if (open && rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event:KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown",outside);
    document.addEventListener("keydown",escape);
    return () => {
      document.removeEventListener("mousedown",outside);
      document.removeEventListener("keydown",escape);
    };
  },[open]);

  return (
    <div className={styles.desktopCategoryRoot} ref={rootRef}>
      <button
        type="button"
        className={open ? `${styles.categoryTrigger} ${styles.categoryTriggerOpen}` : styles.categoryTrigger}
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Categories <span aria-hidden="true">⌄</span>
      </button>

      {open ? (
        <div className={styles.categoryMegaMenu}>
          <div className={styles.categoryRail}>
            {categories.map(category => (
              <button
                type="button"
                key={category.slug}
                className={category.slug === active?.slug ? styles.categoryRailActive : ""}
                onMouseEnter={() => setActiveSlug(category.slug)}
                onFocus={() => setActiveSlug(category.slug)}
                onClick={() => setActiveSlug(category.slug)}
              >
                <span>{category.name}</span><span aria-hidden="true">›</span>
              </button>
            ))}
          </div>

          {active ? (
            <div className={styles.categoryDetail}>
              <div className={styles.categoryDetailHead}>
                <div>
                  <small>SHOP CATEGORY</small>
                  <strong>{active.name}</strong>
                </div>
                <a href={`/?category=${encodeURIComponent(active.slug)}#catalogue`} onClick={() => setOpen(false)}>
                  View all <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className={styles.categoryColumns}>
                {active.groups.map(group => (
                  <section key={group.title}>
                    <h3>{group.title}</h3>
                    <div>
                      {group.items.map(item => (
                        <a
                          key={item}
                          href={`/?category=${encodeURIComponent(active.slug)}&q=${encodeURIComponent(item)}#catalogue`}
                          onClick={() => setOpen(false)}
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
