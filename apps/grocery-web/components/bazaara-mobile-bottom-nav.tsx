"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState
} from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

type JsonRecord = Record<string, unknown>;

type CategoryGroup = {
  title: string;
  items: string[];
};

type Category = {
  name: string;
  slug: string;
  icon: string;
  groups: CategoryGroup[];
};

const categories: Category[] = [
  {
    name: "Official Stores",
    slug: "official-stores",
    icon: "★",
    groups: [
      {
        title: "BAZAARA STORES",
        items: [
          "Bazaara Select",
          "Official Brand Stores",
          "Top Rated Sellers",
          "New Stores"
        ]
      },
      {
        title: "POPULAR BRANDS",
        items: [
          "Samsung",
          "Apple",
          "HP",
          "Lenovo",
          "Sony",
          "Nike",
          "Adidas"
        ]
      }
    ]
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "▣",
    groups: [
      {
        title: "TELEVISION & VIDEO",
        items: [
          "Televisions",
          "Smart TVs",
          "LED & LCD TVs",
          "Projectors",
          "Streaming Devices"
        ]
      },
      {
        title: "CAMERAS & PHOTOS",
        items: [
          "Digital Cameras",
          "CCTV Cameras",
          "Video Surveillance",
          "Camera Accessories"
        ]
      },
      {
        title: "HOME AUDIO",
        items: [
          "Sound Bars",
          "Bluetooth Speakers",
          "Home Theatre Systems",
          "Headphones"
        ]
      }
    ]
  },
  {
    name: "Computing",
    slug: "computing",
    icon: "▤",
    groups: [
      {
        title: "COMPUTERS",
        items: [
          "Laptops",
          "Desktops",
          "Gaming Laptops",
          "MacBooks"
        ]
      },
      {
        title: "COMPUTER ACCESSORIES",
        items: [
          "Keyboards & Mice",
          "Monitors",
          "USB Hubs",
          "Storage",
          "Memory Cards"
        ]
      },
      {
        title: "PRINTERS",
        items: [
          "Inkjet Printers",
          "Laser Printers",
          "Printer Ink & Toner"
        ]
      }
    ]
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchens",
    icon: "⌂",
    groups: [
      {
        title: "HOME & KITCHEN",
        items: [
          "Small Appliances",
          "Cookware",
          "Kitchen & Dining",
          "Home Furniture",
          "Bedding",
          "Home Decor"
        ]
      },
      {
        title: "OFFICE PRODUCTS",
        items: [
          "Office & School Supplies",
          "Office Furniture",
          "Lighting"
        ]
      },
      {
        title: "OUTDOOR & GARDEN",
        items: [
          "Generators",
          "Garden Tools",
          "Outdoor Furniture"
        ]
      }
    ]
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "◇",
    groups: [
      {
        title: "WOMEN'S FASHION",
        items: [
          "Clothing",
          "Shoes",
          "Accessories",
          "Jewelry",
          "Handbags & Wallets"
        ]
      },
      {
        title: "MEN'S FASHION",
        items: [
          "Clothing",
          "Shoes",
          "Accessories",
          "T-Shirts",
          "Sneakers"
        ]
      },
      {
        title: "WATCHES",
        items: [
          "Men's Watches",
          "Women's Watches",
          "Smart Watches"
        ]
      }
    ]
  },
  {
    name: "Beauty & Care",
    slug: "beauty-care",
    icon: "✦",
    groups: [
      {
        title: "BEAUTY",
        items: [
          "Make Up",
          "Skin Care",
          "Fragrances",
          "Hair Care"
        ]
      },
      {
        title: "PERSONAL CARE",
        items: [
          "Bathing & Skin Care",
          "Oral Care",
          "Grooming",
          "Deodorants"
        ]
      },
      {
        title: "HEALTH CARE",
        items: [
          "First Aid",
          "Medical Supplies",
          "Wellness"
        ]
      }
    ]
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "●",
    groups: [
      {
        title: "BABY PRODUCTS",
        items: [
          "Diapers",
          "Baby Feeding",
          "Bathing & Skin Care",
          "Baby Gear"
        ]
      },
      {
        title: "KIDS",
        items: [
          "Toys & Games",
          "Kids Fashion",
          "School Supplies"
        ]
      }
    ]
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "✣",
    groups: [
      {
        title: "PLAYSTATION",
        items: [
          "PlayStation 5",
          "PlayStation 4",
          "Controllers",
          "PlayStation Games"
        ]
      },
      {
        title: "XBOX & NINTENDO",
        items: [
          "Xbox",
          "Nintendo Switch",
          "Nintendo Games"
        ]
      },
      {
        title: "PC GAMING",
        items: [
          "Gaming Accessories",
          "Gaming Monitors",
          "Gaming Keyboards"
        ]
      }
    ]
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "●",
    groups: [
      {
        title: "AUTOMOBILE",
        items: [
          "Car Care",
          "Car Electronics",
          "Interior Accessories",
          "Exterior Accessories",
          "Tyres & Rims"
        ]
      },
      {
        title: "MOTORCYCLE",
        items: [
          "Helmets",
          "Accessories",
          "Maintenance"
        ]
      }
    ]
  },
  {
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    icon: "◆",
    groups: [
      {
        title: "SPORTING GOODS",
        items: [
          "Cardio Training",
          "Strength Training",
          "Team Sports",
          "Outdoor & Adventure"
        ]
      },
      {
        title: "FITNESS",
        items: [
          "Fitness Accessories",
          "Exercise Equipment",
          "Sportswear"
        ]
      }
    ]
  },
  {
    name: "Books & Media",
    slug: "books-media",
    icon: "▰",
    groups: [
      {
        title: "BOOKS",
        items: [
          "Academic",
          "Business",
          "Fiction",
          "Children's Books"
        ]
      },
      {
        title: "MEDIA",
        items: [
          "Music",
          "Movies",
          "Learning Materials"
        ]
      }
    ]
  },
  {
    name: "Other categories",
    slug: "other-categories",
    icon: "•••",
    groups: [
      {
        title: "MORE",
        items: [
          "Musical Instruments",
          "Pet Supplies",
          "Toys & Games",
          "Wholesale",
          "Office Supplies"
        ]
      }
    ]
  }
];

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getCartCount(
  payload: unknown
) {
  if (!isRecord(payload)) {
    return 0;
  }

  const cart =
    isRecord(payload.cart)
      ? payload.cart
      : isRecord(payload.data) &&
        isRecord(payload.data.cart)
        ? payload.data.cart
        : payload;

  if (
    !isRecord(cart) ||
    !Array.isArray(cart.items)
  ) {
    return 0;
  }

  return cart.items.reduce(
    (total, item) => {
      if (!isRecord(item)) {
        return total;
      }

      const quantity =
        typeof item.quantity === "number"
          ? item.quantity
          : 0;

      return total + Math.max(0, Math.trunc(quantity));
    },
    0
  );
}

function SvgIcon({
  children
}: {
  children: ReactNode;
}) {
  return (
    <span
      className="bazaara-mobile-nav-icon"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1" />
      <circle cx="19" cy="20" r="1" />
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2h5Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function AiSymbol() {
  return (
    <span className="bazaara-ai-mark" aria-hidden="true">
      <span className="bazaara-ai-b">B</span>
      <span className="bazaara-ai-spark">✦</span>
    </span>
  );
}

export function BazaaraMobileBottomNav() {
  const pathname = usePathname();

  const [
    cartCount,
    setCartCount
  ] = useState(0);

  const [
    categoriesOpen,
    setCategoriesOpen
  ] = useState(false);

  const [
    activeSlug,
    setActiveSlug
  ] = useState<string | null>(null);

  const [
    search,
    setSearch
  ] = useState("");

  const activeCategory =
    useMemo(
      () =>
        activeSlug
          ? categories.find(
              (category) =>
                category.slug === activeSlug
            ) ?? null
          : null,
      [activeSlug]
    );

  useEffect(
    () => {
      let alive = true;

      async function loadCart() {
        try {
          const response =
            await fetch(
              `${API}/v1/grocery/cart`,
              {
                credentials: "include",
                cache: "no-store"
              }
            );

          if (!response.ok) {
            return;
          }

          const body =
            await response.json();

          if (alive) {
            setCartCount(
              getCartCount(body)
            );
          }
        }
        catch {
        }
      }

      function onCartUpdate(
        event: Event
      ) {
        const customEvent =
          event as CustomEvent<unknown>;

        setCartCount(
          getCartCount(
            customEvent.detail
          )
        );

        void loadCart();
      }

      void loadCart();

      window.addEventListener(
        "bazaara:cart-updated",
        onCartUpdate
      );

      window.addEventListener(
        "focus",
        loadCart
      );

      return () => {
        alive = false;

        window.removeEventListener(
          "bazaara:cart-updated",
          onCartUpdate
        );

        window.removeEventListener(
          "focus",
          loadCart
        );
      };
    },
    []
  );

  useEffect(
    () => {
      if (!categoriesOpen) {
        document.documentElement.removeAttribute(
          "data-bazaara-sheet-open"
        );

        return;
      }

      document.documentElement.setAttribute(
        "data-bazaara-sheet-open",
        "true"
      );

      return () => {
        document.documentElement.removeAttribute(
          "data-bazaara-sheet-open"
        );
      };
    },
    [categoriesOpen]
  );

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query =
      search.trim();

    if (!query) {
      return;
    }

    window.location.href =
      `/search-results?q=${encodeURIComponent(query)}`;
  }

  function closeCategories() {
    setCategoriesOpen(false);
    setActiveSlug(null);
  }

  function openCategories() {
    setCategoriesOpen(true);
    setActiveSlug(null);
  }

  function searchWithinCategory(
    category: Category,
    item: string
  ) {
    closeCategories();

    window.location.href =
      `/search-results?category=${encodeURIComponent(category.slug)}&q=${encodeURIComponent(item)}`;
  }

  const homeActive =
    pathname === "/" ||
    pathname.startsWith("/shopping");

  const cartActive =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout");

  const wishlistActive =
    pathname.startsWith("/wishlist");

  const accountActive =
    pathname.startsWith("/account");

  return (
    <>
      <div
        className="bazaara-mobile-topbar"
        aria-label="Grocery search"
      >
        <form
          className="bazaara-mobile-search"
          onSubmit={submitSearch}
        >
          <span
            className="bazaara-mobile-search-leading"
            aria-hidden="true"
          >
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={
              (
                event:
                  ChangeEvent<HTMLInputElement>
              ) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder="Search products, groceries, stores, services…"
            aria-label="Search Grocery"
          />

          <Link
            href="/bazlens"
            className="bazaara-mobile-lens-link"
            aria-label="Find products with BazLens"
            title="BazLens"
          >
            <CameraIcon />
          </Link>
          <Link href="/cart" className="bazaara-mobile-lens-link" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`} title="Cart">
            <CartIcon />
            {cartCount > 0 ? <span className="bazaara-mobile-cart-badge" aria-hidden="true">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </Link>
        </form>
      </div>

      <nav
        className="bazaara-mobile-bottom-nav"
        aria-label="Grocery navigation"
      >
        <Link href="/" className={homeActive ? "bazaara-mobile-nav-item is-active" : "bazaara-mobile-nav-item"}>
          <SvgIcon><HomeIcon /></SvgIcon><span>Home</span>
        </Link>
        <Link href="/explore" className={pathname.startsWith("/explore") || pathname.startsWith("/categories") || pathname.startsWith("/search-results") ? "bazaara-mobile-nav-item is-active" : "bazaara-mobile-nav-item"}>
          <SvgIcon><CategoryIcon /></SvgIcon><span>Explore</span>
        </Link>
        <Link href="/bazai" className={pathname.startsWith("/bazai") ? "bazaara-mobile-nav-item is-active bazaara-mobile-go-ai" : "bazaara-mobile-nav-item bazaara-mobile-go-ai"}>
          <AiSymbol /><span>Assistant</span>
        </Link>
        <Link href="/orders" className={pathname.startsWith("/orders") ? "bazaara-mobile-nav-item is-active" : "bazaara-mobile-nav-item"}>
          <SvgIcon><CartIcon /></SvgIcon><span>Orders</span>
        </Link>
        <Link href="/account" className={accountActive ? "bazaara-mobile-nav-item is-active" : "bazaara-mobile-nav-item"}>
          <SvgIcon><AccountIcon /></SvgIcon><span>Account</span>
        </Link>
      </nav>

      {
        categoriesOpen
          ? (
            <>
              <button
                type="button"
                className="bazaara-mobile-sheet-backdrop"
                onClick={closeCategories}
                aria-label="Close categories"
              />

              <aside
                id="bazaara-mobile-category-sheet"
                className="bazaara-mobile-category-drawer"
                aria-label="Grocery categories"
              >
                <div
                  className="bazaara-mobile-category-head"
                >
                  <div>
                    <small>
                      BAZAARA GROCERY
                    </small>

                    <strong>
                      {
                        activeCategory
                          ? activeCategory.name
                          : "Shop categories"
                      }
                    </strong>

                    {
                      activeCategory
                        ? (
                          <span>
                            Choose a department or view all.
                          </span>
                        )
                        : (
                          <span>
                            Tap a category once to see its departments.
                          </span>
                        )
                    }
                  </div>

                  <button
                    type="button"
                    onClick={closeCategories}
                    aria-label="Close categories"
                  >
                    ×
                  </button>
                </div>

                {
                  activeCategory
                    ? (
                      <div
                        className="bazaara-mobile-category-details"
                      >
                        <button
                          type="button"
                          className="bazaara-mobile-category-back"
                          onClick={
                            () =>
                              setActiveSlug(null)
                          }
                        >
                          ← All categories
                        </button>

                        <div
                          className="bazaara-mobile-category-groups"
                        >
                          {
                            activeCategory.groups.map(
                              (group) => (
                                <section
                                  key={group.title}
                                >
                                  <h3>
                                    {group.title}
                                  </h3>

                                  <div>
                                    {
                                      group.items.map(
                                        (item) => (
                                          <button
                                            type="button"
                                            key={item}
                                            onClick={
                                              () =>
                                                searchWithinCategory(
                                                  activeCategory,
                                                  item
                                                )
                                            }
                                          >
                                            {item}
                                            <span
                                              aria-hidden="true"
                                            >
                                              ›
                                            </span>
                                          </button>
                                        )
                                      )
                                    }
                                  </div>
                                </section>
                              )
                            )
                          }
                        </div>

                        <a
                          className="bazaara-mobile-view-all"
                          href={`/?category=${encodeURIComponent(activeCategory.slug)}#catalogue`}
                          onClick={closeCategories}
                        >
                          View all {activeCategory.name}
                          <span aria-hidden="true">
                            →
                          </span>
                        </a>
                      </div>
                    )
                    : (
                      <div
                        className="bazaara-mobile-category-list"
                      >
                        {
                          categories.map(
                            (category) => (
                              <button
                                type="button"
                                key={category.slug}
                                onClick={
                                  () =>
                                    setActiveSlug(
                                      category.slug
                                    )
                                }
                              >
                                <span
                                  className="bazaara-mobile-category-icon"
                                  aria-hidden="true"
                                >
                                  {category.icon}
                                </span>

                                <span>
                                  {category.name}
                                </span>

                                <span
                                  aria-hidden="true"
                                >
                                  ›
                                </span>
                              </button>
                            )
                          )
                        }
                      </div>
                    )
                }
              </aside>
            </>
          )
          : null
      }
    </>
  );
}
