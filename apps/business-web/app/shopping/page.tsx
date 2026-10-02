"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import { businessRequest, useBusinessOrganizations } from "../lib/business";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  totalMinor: number;
  placedAt: string;
  store: string;
  itemCount: number;
};

type Product = {
  id: string;
  title: string;
  status: string;
  priceMinor: number;
  currency: string;
  media: Array<{ id: string; url: string; alt: string }>;
  variants: Array<{
    inventory: Array<{
      available: number;
      lowStockThreshold: number;
    }>;
  }>;
};

type Catalog = {
  merchant: {
    id: string;
    stores: Array<{ id: string; name: string; status: string }>;
  };
  products: Product[];
};

const NEXT: Record<string, string | undefined> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PICKING",
  PICKING: "PACKED",
  PROCESSING: "PACKED",
  PACKED: "READY_TO_SHIP",
};

function money(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export default function ShoppingBusiness() {
  const business = useBusinessOrganizations();
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    try {
      const [orderResult, catalogResult] = await Promise.all([
        businessRequest<{ orders: Order[] }>("/v1/business/shopping/orders"),
        businessRequest<Catalog>(
          `/v1/business/advanced/organizations/${business.organizationId}/catalog/SHOPPING`,
        ),
      ]);
      setOrders(orderResult.orders);
      setCatalog(catalogResult);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Shopping");
    }
  }, [business.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const open = orders.filter(
      (item) => !["DELIVERED", "CANCELLED"].includes(item.status),
    );
    const low = (catalog?.products ?? []).filter((product) =>
      product.variants.some((variant) =>
        variant.inventory.some(
          (inventory) => inventory.available <= inventory.lowStockThreshold,
        ),
      ),
    );
    return {
      gross: orders.reduce((sum, item) => sum + item.totalMinor, 0),
      open: open.length,
      active: (catalog?.products ?? []).filter(
        (product) => product.status === "ACTIVE",
      ).length,
      low: low.length,
    };
  }, [orders, catalog]);

  async function advance(order: Order) {
    const status = NEXT[order.status];
    if (!status) return;
    setBusy(order.id);
    try {
      await businessRequest(
        `/v1/business/shopping/orders/${order.id}/status`,
        "PATCH",
        { status },
      );
      setNotice(`${order.orderNumber} moved to ${status.replaceAll("_", " ")}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update order");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={business.organization}
        organizations={business.organizations}
        organizationId={business.organizationId}
        setOrganizationId={business.setOrganizationId}
        active="shopping"
      />

      <main className="business-control-main">
        <section className="business-page-heading business-page-heading-v3">
          <div>
            <span className="business-kicker">SHOPPING</span>
            <h1>Commerce operations.</h1>
            <p>
              Products, stock, orders and fulfilment for the selected Business
              organization.
            </p>
          </div>
          <div className="business-page-heading-actions">
            <a className="business-primary-button" href="/shopping/products">
              + Add product
            </a>
            <a className="business-secondary-button" href="/fulfillment">
              Fulfillment
            </a>
          </div>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}
        {notice ? <div className="business-notice">{notice}</div> : null}

        <section className="business-control-kpis business-control-kpis-v3">
          <article>
            <span>GROSS ORDER VALUE</span>
            <strong>{money(stats.gross, orders[0]?.currency ?? "NGN")}</strong>
            <small>loaded seller orders</small>
          </article>
          <article>
            <span>OPEN FULFILLMENT</span>
            <strong>{stats.open}</strong>
            <small>orders requiring work</small>
          </article>
          <article>
            <span>ACTIVE PRODUCTS</span>
            <strong>{stats.active}</strong>
            <small>{catalog?.products.length ?? 0} total products</small>
          </article>
          <article>
            <span>LOW STOCK</span>
            <strong>{stats.low}</strong>
            <small>needs inventory attention</small>
          </article>
        </section>

        <div className="business-dashboard-grid">
          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">ORDERS</span>
                <h2>Recent seller orders</h2>
              </div>
              <a className="business-text-link" href="/fulfillment">
                Advanced fulfillment
              </a>
            </div>
            <div className="business-ledger-list">
              {orders.slice(0, 12).map((order) => (
                <article key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {order.store} · {order.itemCount} items ·{" "}
                      {new Date(order.placedAt).toLocaleString("en-NG")}
                    </small>
                  </div>
                  <div>
                    <span>{order.status.replaceAll("_", " ")}</span>
                    <strong>{money(order.totalMinor, order.currency)}</strong>
                    {NEXT[order.status] ? (
                      <button
                        className="business-mini-action"
                        disabled={busy === order.id}
                        onClick={() => void advance(order)}
                      >
                        {busy === order.id
                          ? "Updating…"
                          : `Mark ${NEXT[order.status]?.replaceAll("_", " ")}`}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
              {!orders.length ? (
                <div className="business-empty-state">No Shopping orders yet.</div>
              ) : null}
            </div>
          </section>

          <aside className="business-panel">
            <span className="business-kicker">CATALOGUE HEALTH</span>
            <h2>Products & inventory</h2>
            <div className="business-product-preview-list">
              {(catalog?.products ?? []).slice(0, 6).map((product) => (
                <article key={product.id}>
                  <div className="business-product-thumb">
                    {product.media[0]?.url ? (
                      <img src={product.media[0].url} alt={product.media[0].alt || product.title} />
                    ) : (
                      <span>{product.title.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <strong>{product.title}</strong>
                    <small>
                      {product.status} · {money(product.priceMinor, product.currency)}
                    </small>
                  </div>
                </article>
              ))}
            </div>
            <a className="business-primary-button full" href="/shopping/products">
              Manage products
            </a>
          </aside>
        </div>

        <section className="business-panel">
          <div className="business-section-heading">
            <div>
              <span className="business-kicker">STORES</span>
              <h2>Operating footprint</h2>
            </div>
            <a className="business-text-link" href="/settings#branches">
              Manage locations
            </a>
          </div>
          <div className="business-module-grid">
            {(catalog?.merchant.stores ?? []).map((store) => (
              <article className="business-module-card" key={store.id}>
                <div className="module-icon">S</div>
                <div>
                  <strong>{store.name}</strong>
                  <span>{store.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
