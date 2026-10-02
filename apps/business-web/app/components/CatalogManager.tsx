"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "./BusinessHeader";
import {
  businessRequest,
  useBusinessOrganizations,
} from "../lib/business";

type Vertical = "SHOPPING" | "GROCERY";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Store = {
  id: string;
  name: string;
  status: string;
};

type Product = {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  currency: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  barcode: string | null;
  costMinor: number | null;
  weightGrams: number | null;
  returnEligible: boolean;
  category: Category;
  brand: { id: string; name: string } | null;
  media: Array<{ id: string; url: string; alt: string }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    active: boolean;
    priceMinor: number;
    inventory: Array<{
      id: string;
      store: Store;
      quantityOnHand: number;
      quantityReserved: number;
      available: number;
      lowStockThreshold: number;
    }>;
  }>;
};

type CatalogResponse = {
  merchant: {
    id: string;
    vertical: Vertical;
    stores: Store[];
  };
  products: Product[];
};

function money(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function parseMoney(value: string) {
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export function CatalogManager({
  vertical,
}: {
  vertical: Vertical;
}) {
  const {
    organizations,
    organization,
    organizationId,
    setOrganizationId,
    loading,
  } = useBusinessOrganizations();

  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    brandName: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    sku: "",
    barcode: "",
    stock: "0",
    lowStockThreshold: "5",
    weightGrams: "",
    returnEligible: true,
    imageUrl: "",
    publish: false,
    storeId: "",
  });

  const title = vertical === "SHOPPING" ? "Shopping products" : "Grocery products";
  const navActive = vertical === "SHOPPING" ? "shopping" : "grocery";

  const load = useCallback(async () => {
    if (!organizationId) return;
    if (!organization?.verticals.includes(vertical)) {
      setCatalog(null);
      return;
    }

    try {
      const [categoryResult, catalogResult] = await Promise.all([
        businessRequest<{ categories: Category[] }>(
          "/v1/business/advanced/catalog/categories",
        ),
        businessRequest<CatalogResponse>(
          `/v1/business/advanced/organizations/${organizationId}/catalog/${vertical}`,
        ),
      ]);

      const groceryCategoryNames = new Set([
        "fresh food",
        "pantry",
        "breakfast",
        "drinks",
        "household",
        "baby & kids",
        "beauty & care",
        "grocery",
      ]);

      const visibleCategories =
        vertical === "GROCERY"
          ? categoryResult.categories.filter((item) =>
              groceryCategoryNames.has(item.name.trim().toLowerCase()),
            )
          : categoryResult.categories;

      setCategories(visibleCategories);
      setCatalog(catalogResult);
      setForm((current) => ({
        ...current,
        categoryId:
          visibleCategories.some((item) => item.id === current.categoryId)
            ? current.categoryId
            : visibleCategories[0]?.id ?? "",
        storeId:
          current.storeId || catalogResult.merchant.stores[0]?.id || "",
      }));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load catalogue");
    }
  }, [organizationId, organization?.verticals, vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  const lowStock = useMemo(
    () =>
      (catalog?.products ?? []).filter((product) =>
        product.variants.some((variant) =>
          variant.inventory.some(
            (inventory) =>
              inventory.available <= inventory.lowStockThreshold,
          ),
        ),
      ).length,
    [catalog],
  );

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Product images must be 10 MB or smaller.");
      return;
    }

    setImageBusy(true);
    setError("");

    try {
      const reservation = await businessRequest<{
        asset: { id: string };
        upload: { url: string; headers?: Record<string, string> };
      }>("/v1/media/uploads", "POST", {
        contentType: file.type,
        byteSize: file.size,
        visibility: "PUBLIC",
      });

      const upload = await fetch(reservation.upload.url, {
        method: "PUT",
        headers: {
          "content-type": file.type,
          ...(reservation.upload.headers ?? {}),
        },
        body: file,
      });

      if (!upload.ok) {
        throw new Error("Image upload failed");
      }

      const complete = await businessRequest<{
        asset: { id: string; status: string; publicUrl: string | null };
      }>(`/v1/media/${reservation.asset.id}/complete`, "POST", {});

      const publicUrl =
        complete.asset.publicUrl ??
        `${window.location.origin}/api/bazaara-platform/v1/media/public/${complete.asset.id}`;

      setForm((current) => ({
        ...current,
        imageUrl: publicUrl,
      }));
      setNotice("Product image uploaded.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload image");
    } finally {
      setImageBusy(false);
    }
  }

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;

    setBusy("create");
    setError("");
    setNotice("");

    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/catalog/${vertical}`,
        "POST",
        {
          title: form.title,
          description: form.description,
          categoryId: form.categoryId,
          brandName: form.brandName || undefined,
          priceMinor: parseMoney(form.price),
          compareAtPriceMinor: form.compareAtPrice
            ? parseMoney(form.compareAtPrice)
            : undefined,
          costMinor: form.cost ? parseMoney(form.cost) : undefined,
          sku: form.sku,
          barcode: form.barcode || undefined,
          stock: Number(form.stock || 0),
          lowStockThreshold: Number(form.lowStockThreshold || 0),
          weightGrams: form.weightGrams
            ? Number(form.weightGrams)
            : undefined,
          returnEligible: form.returnEligible,
          imageUrl: form.imageUrl || undefined,
          publish: form.publish,
          storeId: form.storeId || undefined,
        },
      );

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        brandName: "",
        price: "",
        compareAtPrice: "",
        cost: "",
        sku: "",
        barcode: "",
        stock: "0",
        weightGrams: "",
        imageUrl: "",
        publish: false,
      }));

      setNotice(
        form.publish
          ? "Product created and published."
          : "Product saved as draft.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create product");
    } finally {
      setBusy("");
    }
  }

  async function updateProduct(
    productId: string,
    body: Record<string, unknown>,
    message: string,
  ) {
    setBusy(productId);
    setError("");
    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${organizationId}/catalog/${vertical}/products/${productId}`,
        "PATCH",
        body,
      );
      setNotice(message);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update product");
    } finally {
      setBusy("");
    }
  }

  function downloadTemplate() {
    const templateCategory = vertical === "GROCERY" ? "Pantry" : "General";
    const csv =
      "title,description,category,brand,sku,price,stock,barcode,weightGrams\n" +
      `Sample product,"Describe the item","${templateCategory}","Brand","SKU-001",2500,10,"1234567890",500\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      vertical === "SHOPPING"
        ? "bazaara-shopping-products.csv"
        : "bazaara-grocery-products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    if (!organizationId) return;
    setBusy("import");
    setError("");
    setNotice("");

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) throw new Error("CSV has no product rows");

      const firstLine = lines[0];
      if (!firstLine) throw new Error("CSV has no header row");
      const header = firstLine.split(",").map((value) => value.trim());
      const index = (name: string) => header.indexOf(name);

      const rows = lines.slice(1).map((line, rowIndex) => {
        const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
        const categoryName = values[index("category")] || "";
        const category =
          categories.find(
            (item) =>
              item.name.toLowerCase() === categoryName.toLowerCase() ||
              item.slug.toLowerCase() === categoryName.toLowerCase(),
          ) ?? categories[0];

        if (!category) {
          throw new Error(`Row ${rowIndex + 2}: no product category is available`);
        }

        return {
          title: values[index("title")] || "",
          description: values[index("description")] || "",
          categoryId: category.id,
          brandName: values[index("brand")] || undefined,
          sku: values[index("sku")] || "",
          priceMinor: parseMoney(values[index("price")] || "0"),
          stock: Number(values[index("stock")] || 0),
          barcode: values[index("barcode")] || undefined,
          weightGrams: values[index("weightGrams")]
            ? Number(values[index("weightGrams")])
            : undefined,
          lowStockThreshold: 5,
          returnEligible: true,
          publish: false,
          storeId: catalog?.merchant.stores[0]?.id,
        };
      });

      const result = await businessRequest<{
        imported: number;
        failed: number;
      }>(
        `/v1/business/advanced/organizations/${organizationId}/catalog/${vertical}/bulk`,
        "POST",
        { items: rows },
      );

      setNotice(
        `${result.imported} product(s) imported as drafts${
          result.failed ? ` · ${result.failed} failed` : ""
        }.`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CSV import failed");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <main className="business-control-main">
        <div className="business-loading-card">Loading catalogue…</div>
      </main>
    );
  }

  if (!organization?.verticals.includes(vertical)) {
    return (
      <div className="business-control-shell">
        <BusinessHeader
          organization={organization}
          organizations={organizations}
          organizationId={organizationId}
          setOrganizationId={setOrganizationId}
          active={navActive}
        />
        <main className="business-control-main">
          <section className="business-auth-card">
            <span className="business-kicker">BUSINESS TYPE NOT REGISTERED</span>
            <h1>{title} is not enabled for this organization.</h1>
            <a className="business-primary-button" href="/register">
              Add business type
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="business-control-shell">
      <BusinessHeader
        organization={organization}
        organizations={organizations}
        organizationId={organizationId}
        setOrganizationId={setOrganizationId}
        active={navActive}
      />

      <main className="business-control-main">
        <section className="business-page-heading">
          <span className="business-kicker">{vertical} CATALOGUE</span>
          <h1>{title}</h1>
          <p>
            Create products, publish when the business is eligible, manage
            branch stock and import catalogue rows in bulk.
          </p>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}
        {notice ? <div className="business-notice">{notice}</div> : null}

        <section className="business-control-kpis">
          <article>
            <span>PRODUCTS</span>
            <strong>{catalog?.products.length ?? 0}</strong>
            <small>all catalogue records</small>
          </article>
          <article>
            <span>PUBLISHED</span>
            <strong>
              {catalog?.products.filter((item) => item.status === "ACTIVE").length ?? 0}
            </strong>
            <small>visible products</small>
          </article>
          <article>
            <span>DRAFTS</span>
            <strong>
              {catalog?.products.filter((item) => item.status === "DRAFT").length ?? 0}
            </strong>
            <small>not customer-visible</small>
          </article>
          <article>
            <span>LOW STOCK</span>
            <strong>{lowStock}</strong>
            <small>at or below threshold</small>
          </article>
        </section>

        <div className="business-catalog-layout">
          <section className="business-panel business-create-product-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">ADD PRODUCT</span>
                <h2>Build a complete product record.</h2>
              </div>
            </div>

            <form className="business-form" onSubmit={createProduct}>
              <label className="wide">
                Product title
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>

              <label className="wide">
                Description
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              <label>
                Category
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Brand
                <input
                  value={form.brandName}
                  onChange={(event) =>
                    setForm({ ...form, brandName: event.target.value })
                  }
                />
              </label>

              <label>
                SKU
                <input
                  required
                  value={form.sku}
                  onChange={(event) =>
                    setForm({ ...form, sku: event.target.value })
                  }
                />
              </label>

              <label>
                Barcode
                <input
                  value={form.barcode}
                  onChange={(event) =>
                    setForm({ ...form, barcode: event.target.value })
                  }
                />
              </label>

              <label>
                Selling price (NGN)
                <input
                  required
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                />
              </label>

              <label>
                Compare-at price (NGN)
                <input
                  inputMode="decimal"
                  value={form.compareAtPrice}
                  onChange={(event) =>
                    setForm({ ...form, compareAtPrice: event.target.value })
                  }
                />
              </label>

              <label>
                Cost (NGN)
                <input
                  inputMode="decimal"
                  value={form.cost}
                  onChange={(event) =>
                    setForm({ ...form, cost: event.target.value })
                  }
                />
              </label>

              <label>
                Initial stock
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({ ...form, stock: event.target.value })
                  }
                />
              </label>

              <label>
                Low-stock alert
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      lowStockThreshold: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Weight (grams)
                <input
                  type="number"
                  min="0"
                  value={form.weightGrams}
                  onChange={(event) =>
                    setForm({ ...form, weightGrams: event.target.value })
                  }
                />
              </label>

              <label>
                Store
                <select
                  value={form.storeId}
                  onChange={(event) =>
                    setForm({ ...form, storeId: event.target.value })
                  }
                >
                  {(catalog?.merchant.stores ?? []).map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Image URL
                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="business-file-label wide">
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={imageBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
                <small>
                  {imageBusy
                    ? "Uploading…"
                    : "JPG, PNG or WebP · up to 10 MB"}
                </small>
              </label>

              <label className="business-check">
                <input
                  type="checkbox"
                  checked={form.returnEligible}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      returnEligible: event.target.checked,
                    })
                  }
                />
                Return eligible
              </label>

              <label className="business-check">
                <input
                  type="checkbox"
                  checked={form.publish}
                  onChange={(event) =>
                    setForm({ ...form, publish: event.target.checked })
                  }
                />
                Publish immediately
              </label>

              <button
                className="business-primary-button wide"
                disabled={busy === "create"}
              >
                {busy === "create" ? "Saving…" : "Save product"}
              </button>
            </form>
          </section>

          <aside className="business-panel">
            <span className="business-kicker">BULK CATALOGUE</span>
            <h2>Import products faster.</h2>
            <p className="business-panel-copy">
              Download the CSV template, fill it in and import up to 200
              products at once. Imported products start as drafts so you can
              review them before publishing.
            </p>
            <button
              type="button"
              className="business-secondary-button full"
              onClick={downloadTemplate}
            >
              Download CSV template
            </button>
            <label className="business-import-drop">
              <strong>{busy === "import" ? "Importing…" : "Import CSV"}</strong>
              <span>Choose a completed template</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={busy === "import"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importCsv(file);
                }}
              />
            </label>

            <div className="business-catalog-tips">
              <b>Before publishing</b>
              <span>Check price, stock, images and fulfilment.</span>
              <b>Branch inventory</b>
              <span>Stock is stored against the selected store.</span>
              <b>Verification</b>
              <span>
                Incomplete business verification can still save drafts, but
                publishing may be blocked.
              </span>
            </div>
          </aside>
        </div>

        <section className="business-panel">
          <div className="business-section-heading">
            <div>
              <span className="business-kicker">CATALOGUE</span>
              <h2>Products & inventory</h2>
            </div>
            <span className="business-soft-pill">
              {catalog?.products.length ?? 0} products
            </span>
          </div>

          <div className="business-product-table">
            {(catalog?.products ?? []).length ? (
              catalog?.products.map((product) => {
                const firstVariant = product.variants[0];
                const firstInventory = firstVariant?.inventory[0];
                return (
                  <article key={product.id}>
                    <div className="business-product-thumb">
                      {product.media[0]?.url ? (
                        <img
                          src={product.media[0].url}
                          alt={product.media[0].alt}
                        />
                      ) : (
                        <span>{product.title.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="business-product-main">
                      <strong>{product.title}</strong>
                      <small>
                        {firstVariant?.sku ?? "No SKU"} · {product.category.name}
                        {product.brand ? ` · ${product.brand.name}` : ""}
                      </small>
                    </div>
                    <div>
                      <span className={`business-status-badge ${product.status.toLowerCase()}`}>
                        {product.status}
                      </span>
                    </div>
                    <div>
                      <strong>{money(product.priceMinor, product.currency)}</strong>
                      <small>
                        {firstInventory
                          ? `${firstInventory.available} available`
                          : "No inventory"}
                      </small>
                    </div>
                    <div className="business-inline-actions">
                      {product.status === "DRAFT" ? (
                        <button
                          disabled={busy === product.id}
                          onClick={() =>
                            void updateProduct(
                              product.id,
                              { status: "ACTIVE" },
                              "Product published.",
                            )
                          }
                        >
                          Publish
                        </button>
                      ) : product.status === "ACTIVE" ? (
                        <button
                          disabled={busy === product.id}
                          onClick={() =>
                            void updateProduct(
                              product.id,
                              { status: "DRAFT" },
                              "Product moved back to draft.",
                            )
                          }
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button className="smart-done" disabled>✓ Archived</button>
                      )}
                      <button
                        disabled={busy === product.id}
                        onClick={() => {
                          const next = window.prompt(
                            "Set quantity on hand",
                            String(firstInventory?.quantityOnHand ?? 0),
                          );
                          if (next == null) return;
                          void updateProduct(
                            product.id,
                            { stock: Number(next) },
                            "Stock updated.",
                          );
                        }}
                      >
                        Stock
                      </button>
                      <button
                        className={product.status === "ARCHIVED" ? "smart-done" : ""}
                        disabled={busy === product.id || product.status === "ARCHIVED"}
                        onClick={() =>
                          void updateProduct(
                            product.id,
                            { status: "ARCHIVED" },
                            "Product archived.",
                          )
                        }
                      >
                        {product.status === "ARCHIVED" ? "✓ Archived" : "Archive"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="business-empty-state">
                No products yet. Use the form above to create the first one.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
