import { groceryHome } from "./grocery.js";
import { listProducts } from "./service.js";

export async function bazaaraGoHome() {
  const [marketplace, grocery] = await Promise.all([
    listProducts({ vertical: "SHOPPING", sort: "featured", page: 1, limit: 10 }),
    groceryHome(),
  ]);

  return {
    product: "GO",
    quickServices: [
      { key: "marketplace", label: "Marketplace", href: "/search-results", enabled: true, tone: "marketplace" },
      { key: "grocery", label: "Grocery", href: "/grocery", enabled: true, tone: "grocery" },
      { key: "food", label: "Food", href: "/food", enabled: false, tone: "food" },
      { key: "classifieds", label: "Classifieds", href: "/classifieds", enabled: false, tone: "classifieds" },
      { key: "courier", label: "Courier", href: "/courier", enabled: false, tone: "courier" },
      { key: "services", label: "Services", href: "/services", enabled: false, tone: "services" },
      { key: "digital", label: "Digital", href: "/digital", enabled: false, tone: "digital" },
      { key: "tickets", label: "Tickets", href: "/tickets", enabled: false, tone: "tickets" },
    ],
    modules: [
      { key: "marketplace-picks", type: "products", eyebrow: "Marketplace", title: "Picked for you", products: marketplace.products },
      { key: "grocery-essentials", type: "products", eyebrow: "Grocery", title: "Everyday essentials", products: grocery.products.slice(0, 8), href: "/grocery" },
    ],
  };
}
