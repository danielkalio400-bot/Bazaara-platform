"use client";

import {
  CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createPortal
} from "react-dom";

import styles from "./shopping-header.module.css";


type Group = {
  heading: string;
  items: string[];
};


type Category = {
  name: string;
  slug: string;
  icon: string;
  groups: Group[];
};


const categories: Category[] = [
  {
    name: "Official Stores",
    slug: "official-stores",
    icon: "★",
    groups: [
      {
        heading: "FEATURED STORES",
        items: [
          "Bazaara Select",
          "Official Brand Stores",
          "Top Rated Sellers",
          "New Stores"
        ]
      },
      {
        heading: "POPULAR BRANDS",
        items: [
          "Samsung",
          "Apple",
          "HP",
          "Lenovo",
          "Sony",
          "Nike",
          "Adidas"
        ]
      },
      {
        heading: "SHOP BY TRUST",
        items: [
          "Verified Sellers",
          "Fast Delivery",
          "Top Customer Ratings"
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
        heading: "TELEVISION & VIDEO",
        items: [
          "Televisions",
          "Smart TVs",
          "LED & LCD TVs",
          "QLED & OLED TVs",
          "TV Accessories",
          "DVD Players & Recorders"
        ]
      },
      {
        heading: "CAMERAS & PHOTOS",
        items: [
          "Digital Cameras",
          "Projectors",
          "Video Surveillance",
          "CCTV Cameras",
          "Compact Cameras",
          "Camera Accessories"
        ]
      },
      {
        heading: "HOME AUDIO",
        items: [
          "Home Theatre Systems",
          "Receivers & Amplifiers",
          "Sound Bars",
          "Bluetooth Speakers",
          "Subwoofers"
        ]
      },
      {
        heading: "POWER",
        items: [
          "Generators",
          "Power Inverters",
          "Solar & Wind Power",
          "Stabilizers",
          "Batteries",
          "Battery Chargers"
        ]
      }
    ]
  },
  {
    name: "Computing",
    slug: "computing",
    icon: "▰",
    groups: [
      {
        heading: "COMPUTERS",
        items: [
          "Desktops",
          "Laptops",
          "MacBooks",
          "Gaming Laptops",
          "Business Laptops",
          "Chromebooks"
        ]
      },
      {
        heading: "DATA STORAGE",
        items: [
          "External Hard Drives",
          "USB Flash Drives",
          "External SSD",
          "Memory Cards"
        ]
      },
      {
        heading: "PRINTERS",
        items: [
          "Inkjet Printers",
          "Laser Printers",
          "Printer Ink & Toner"
        ]
      },
      {
        heading: "COMPUTER ACCESSORIES",
        items: [
          "Keyboards & Mice",
          "PC Gaming Hardware",
          "UPS",
          "Scanners",
          "Webcams",
          "Bluetooth Keyboards",
          "Bluetooth Mouse"
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
        heading: "HOME & KITCHEN",
        items: [
          "Bath",
          "Bedding",
          "Home Decor",
          "Home Furniture",
          "Vacuums & Floor Care",
          "Wall Art",
          "Cookware",
          "Bakeware"
        ]
      },
      {
        heading: "SMALL APPLIANCES",
        items: [
          "Blenders",
          "Air Fryers",
          "Juicers",
          "Rice Cookers",
          "Microwaves",
          "Kettles",
          "Food Processors"
        ]
      },
      {
        heading: "OFFICE PRODUCTS",
        items: [
          "Office & School Supplies",
          "Office Furniture & Lighting",
          "Packaging Materials"
        ]
      },
      {
        heading: "OUTDOOR & GARDEN",
        items: [
          "Garden Tools",
          "Outdoor Furniture",
          "Lighting",
          "Storage & Organization"
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
        heading: "WOMEN'S FASHION",
        items: [
          "Clothing",
          "Shoes",
          "Accessories",
          "Jewellery",
          "Handbags & Wallets",
          "Dresses",
          "Traditional",
          "Beach & Swimwear"
        ]
      },
      {
        heading: "MEN'S FASHION",
        items: [
          "Clothing",
          "Shoes",
          "Accessories",
          "T-Shirts",
          "Polo Shirts",
          "Trousers & Chinos",
          "Sneakers",
          "Traditional"
        ]
      },
      {
        heading: "WATCHES & EYEWEAR",
        items: [
          "Men's Watches",
          "Women's Watches",
          "Men's Sunglasses",
          "Women's Sunglasses"
        ]
      },
      {
        heading: "KIDS' FASHION",
        items: [
          "Boys' Fashion",
          "Girls' Fashion"
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
        heading: "MAKE UP",
        items: [
          "Foundation",
          "Powder",
          "Lipstick",
          "Eyeliner & Kajal",
          "Mascara"
        ]
      },
      {
        heading: "PERSONAL CARE",
        items: [
          "Skin Care",
          "Sunscreens",
          "Deodorants & Antiperspirants",
          "Lip Care"
        ]
      },
      {
        heading: "HAIR CARE",
        items: [
          "Hair Cutting Tools",
          "Shampoo & Conditioner",
          "Wigs & Accessories"
        ]
      },
      {
        heading: "FRAGRANCES",
        items: [
          "Women's Fragrances",
          "Men's Fragrances"
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
        heading: "APPAREL & ACCESSORIES",
        items: [
          "Baby Boys",
          "Baby Girls"
        ]
      },
      {
        heading: "DIAPERING",
        items: [
          "Disposable Diapers",
          "Diaper Bags",
          "Wipes & Holders"
        ]
      },
      {
        heading: "BABY & TODDLER TOYS",
        items: [
          "Activity Play Centers",
          "Music & Sound",
          "Bath Toys"
        ]
      },
      {
        heading: "FEEDING",
        items: [
          "Bibs & Burp Cloths",
          "Bottle Feeding",
          "Pacifiers & Accessories",
          "Highchairs & Booster Seats"
        ]
      }
    ]
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "⌘",
    groups: [
      {
        heading: "PLAYSTATION",
        items: [
          "PlayStation 5",
          "PlayStation 4",
          "PlayStation 3",
          "PlayStation Accessories"
        ]
      },
      {
        heading: "XBOX",
        items: [
          "Xbox Series",
          "Xbox One",
          "Xbox 360",
          "Xbox Accessories"
        ]
      },
      {
        heading: "NINTENDO",
        items: [
          "Nintendo Switch",
          "Nintendo DS",
          "Nintendo Accessories"
        ]
      },
      {
        heading: "TOP GAMES",
        items: [
          "Sports Games",
          "Action Games",
          "Adventure Games",
          "Racing Games"
        ]
      }
    ]
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "◉",
    groups: [
      {
        heading: "AUTOMOBILE",
        items: [
          "Car Care",
          "Car Electronics & Accessories",
          "Lights & Lighting Accessories",
          "Exterior Accessories",
          "Oils & Fluids",
          "Interior Accessories",
          "Tyres & Rims"
        ]
      },
      {
        heading: "MOTORCYCLE",
        items: [
          "Helmets",
          "Motorcycle Parts",
          "Motorcycle Accessories"
        ]
      },
      {
        heading: "TOOLS",
        items: [
          "Garage Tools",
          "Diagnostic Tools",
          "Emergency Equipment"
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
        heading: "SPORTING GOODS",
        items: [
          "Cardio Training",
          "Strength Training Equipment",
          "Accessories",
          "Team Sports",
          "Outdoor & Adventure"
        ]
      },
      {
        heading: "FITNESS",
        items: [
          "Gym Equipment",
          "Yoga",
          "Running",
          "Cycling"
        ]
      },
      {
        heading: "OUTDOOR",
        items: [
          "Camping",
          "Hiking",
          "Travel Gear"
        ]
      }
    ]
  },
  {
    name: "Books & Media",
    slug: "books-media",
    icon: "▤",
    groups: [
      {
        heading: "BOOKS",
        items: [
          "Fiction",
          "Non-Fiction",
          "Business",
          "Education",
          "Children's Books"
        ]
      },
      {
        heading: "MUSIC",
        items: [
          "Musical Instruments",
          "Studio & Live Equipment",
          "Electronic Music & DJ Equipment",
          "Amplifiers & Effects"
        ]
      },
      {
        heading: "MEDIA",
        items: [
          "Movies",
          "Music",
          "Collectibles"
        ]
      }
    ]
  },
  {
    name: "Other categories",
    slug: "other",
    icon: "•••",
    groups: [
      {
        heading: "MORE SHOPPING",
        items: [
          "Pet Supplies",
          "Toys & Games",
          "Stationery",
          "Tools & Home Improvement",
          "Luggage & Travel Gear"
        ]
      },
      {
        heading: "OFFICIAL STORES",
        items: [
          "Bazaara Select",
          "Verified Brand Stores",
          "Top Sellers"
        ]
      },
      {
        heading: "DISCOVER",
        items: [
          "New Arrivals",
          "Trending Products",
          "Top Rated",
          "Deals"
        ]
      }
    ]
  }
];


const DEFAULT_CATEGORY: Category = categories[0]!;


function queryHref(
  category: string,
  item?: string
) {

  const params =
    new URLSearchParams();


  params.set(
    "category",
    category
  );


  if (item) {

    params.set(
      "subcategory",
      item
    );
  }


  return `/?${params.toString()}#catalogue`;
}


export function CategoryMenu() {

  const [
    mounted,
    setMounted
  ] =
    useState(false);


  const [
    open,
    setOpen
  ] =
    useState(false);


  const [
    isMobile,
    setIsMobile
  ] =
    useState(false);


  const [
    armedSlug,
    setArmedSlug
  ] =
    useState<string | null>(
      null
    );


  const [
    activeSlug,
    setActiveSlug
  ] =
    useState(
      DEFAULT_CATEGORY.slug
    );


  const [
    anchor,
    setAnchor
  ] =
    useState({
      top: 72,
      left: 16
    });


  const triggerRef =
    useRef<HTMLButtonElement>(
      null
    );


  const activeCategory =
    useMemo(
      () =>
        categories.find(
          (
            category
          ) =>
            category.slug ===
            activeSlug
        ) ??
        DEFAULT_CATEGORY,
      [
        activeSlug
      ]
    );


  useEffect(
    () => {

      setMounted(
        true
      );


      const media =
        window.matchMedia(
          "(max-width: 760px)"
        );


      function syncMobile() {

        setIsMobile(
          media.matches
        );
      }


      syncMobile();


      media.addEventListener(
        "change",
        syncMobile
      );


      return () => {

        media.removeEventListener(
          "change",
          syncMobile
        );
      };
    },
    []
  );


  function updateAnchor() {

    const rect =
      triggerRef.current?.getBoundingClientRect();


    if (!rect) {

      return;
    }


    setAnchor(
      {
        top:
          Math.max(
            58,
            rect.bottom + 8
          ),

        left:
          Math.max(
            12,
            rect.left
          )
      }
    );
  }


  function openMenu() {

    updateAnchor();

    setArmedSlug(
      null
    );

    setOpen(
      true
    );
  }


  function handleCategoryClick(
    event: MouseEvent<HTMLAnchorElement>,
    category: Category
  ) {

    if (!isMobile) {

      setOpen(
        false
      );

      return;
    }


    if (
      armedSlug !==
      category.slug
    ) {

      event.preventDefault();

      setActiveSlug(
        category.slug
      );

      setArmedSlug(
        category.slug
      );


      window.requestAnimationFrame(
        () => {

          document
            .getElementById(
              "bazaara-mobile-category-details"
            )
            ?.scrollIntoView(
              {
                block:
                  "nearest",

                behavior:
                  "smooth"
              }
            );
        }
      );

      return;
    }


    setOpen(
      false
    );
  }


  useEffect(
    () => {

      if (!open) {

        return;
      }


      function handleResize() {

        updateAnchor();
      }


      function handleKeyDown(
        event: KeyboardEvent
      ) {

        if (
          event.key ===
          "Escape"
        ) {

          setOpen(
            false
          );
        }
      }


      window.addEventListener(
        "resize",
        handleResize
      );


      window.addEventListener(
        "scroll",
        handleResize,
        true
      );


      document.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        window.removeEventListener(
          "resize",
          handleResize
        );


        window.removeEventListener(
          "scroll",
          handleResize,
          true
        );


        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open
    ]
  );


  const portal =
    open &&
    mounted
      ? createPortal(
          <div
            className={
              styles.megaLayer
            }
          >
            <button
              type="button"
              className={
                styles.megaBackdrop
              }
              onClick={
                () =>
                  setOpen(
                    false
                  )
              }
              aria-label="Close category menu"
            />


            <section
              id="bazaara-category-mega-menu"
              className={
                styles.megaMenu
              }
              style={
                {
                  "--mega-top":
                    `${anchor.top}px`,

                  "--mega-left":
                    `${anchor.left}px`
                } as CSSProperties
              }
              aria-label="Shopping categories"
            >
              <div
                className={
                  styles.megaRail
                }
              >
                {categories.map(
                  (
                    category
                  ) => (
                    <a
                      key={
                        category.slug
                      }
                      className={
                        category.slug ===
                        activeCategory.slug
                          ? `${styles.megaRailItem} ${styles.megaRailItemActive}`
                          : styles.megaRailItem
                      }
                      href={
                        queryHref(
                          category.slug
                        )
                      }
                      onMouseEnter={
                        () => {

                          if (!isMobile) {

                            setActiveSlug(
                              category.slug
                            );
                          }
                        }
                      }
                      onFocus={
                        () => {

                          if (!isMobile) {

                            setActiveSlug(
                              category.slug
                            );
                          }
                        }
                      }
                      onClick={
                        (
                          event
                        ) =>
                          handleCategoryClick(
                            event,
                            category
                          )
                      }
                    >
                      <span
                        className={
                          styles.megaRailIcon
                        }
                        aria-hidden="true"
                      >
                        {
                          category.icon
                        }
                      </span>

                      <span>
                        {
                          category.name
                        }
                      </span>

                      <span
                        className={
                          styles.megaRailArrow
                        }
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </a>
                  )
                )}
              </div>


              <div
                id="bazaara-mobile-category-details"
                className={
                  styles.megaContent
                }
              >
                <div
                  className={
                    styles.megaContentHead
                  }
                >
                  <div>
                    <span>
                      SHOPPING
                    </span>

                    <strong>
                      {
                        activeCategory.name
                      }
                    </strong>

                    <small
                      className={
                        styles.mobileCategoryHint
                      }
                    >
                      Tap this category again to open it
                    </small>
                  </div>


                  <button
                    type="button"
                    className={
                      styles.megaClose
                    }
                    onClick={
                      () =>
                        setOpen(
                          false
                        )
                    }
                    aria-label="Close category menu"
                  >
                    ×
                  </button>
                </div>


                <div
                  className={
                    styles.megaColumns
                  }
                >
                  {activeCategory.groups.map(
                    (
                      group
                    ) => (
                      <section
                        key={
                          group.heading
                        }
                        className={
                          styles.megaGroup
                        }
                      >
                        <h3>
                          {
                            group.heading
                          }
                        </h3>


                        <div
                          className={
                            styles.megaLinks
                          }
                        >
                          {group.items.map(
                            (
                              item
                            ) => (
                              <a
                                key={
                                  item
                                }
                                href={
                                  queryHref(
                                    activeCategory.slug,
                                    item
                                  )
                                }
                                onClick={
                                  () =>
                                    setOpen(
                                      false
                                    )
                                }
                              >
                                {
                                  item
                                }
                              </a>
                            )
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>


                <div
                  className={
                    styles.megaFooter
                  }
                >
                  <a
                    href={
                      queryHref(
                        activeCategory.slug
                      )
                    }
                    onClick={
                      () =>
                        setOpen(
                          false
                        )
                    }
                  >
                    Browse all {
                      activeCategory.name
                    }
                  </a>

                  <span>
                    BAZAARA Shopping categories only
                  </span>
                </div>
              </div>
            </section>
          </div>,
          document.body
        )
      : null;


  return (
    <>
      <button
        ref={
          triggerRef
        }
        type="button"
        className={
          styles.menuButton
        }
        onClick={
          open
            ? () =>
                setOpen(
                  false
                )
            : openMenu
        }
        aria-label="Open shopping categories"
        aria-expanded={
          open
        }
        aria-controls="bazaara-category-mega-menu"
      >
        <span />
        <span />
        <span />
      </button>

      {portal}
    </>
  );
}
