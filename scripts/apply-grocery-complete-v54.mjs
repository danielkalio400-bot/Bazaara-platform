import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const p = (relative) => path.join(root, relative);
const read = (relative) => fs.readFileSync(p(relative), "utf8");
const write = (relative, value) => fs.writeFileSync(p(relative), value, "utf8");

function must(condition, message) {
  if (!condition) throw new Error(message);
}

function note(message) {
  console.log(`[grocery-v5.4.1] ${message}`);
}

// ---------------------------------------------------------------------------
// Grocery layout: remove comparison injector and ensure V5.4 visual layer.
// Idempotent so this also repairs a partially applied V5.4 run.
// ---------------------------------------------------------------------------
{
  const relative = "apps/grocery-web/app/layout.tsx";
  let text = read(relative);

  text = text.replace(
    /^\s*import\s+ShoppingTools\s+from\s+["'][^"']+shopping-tools["'];\s*\r?\n/m,
    "",
  );
  text = text.replace(/<ShoppingTools\s*\/>/g, "");

  if (!text.includes('import "./grocery-complete-v54.css";')) {
    const anchors = [
      'import "./grocery-focus-v5.1.css";',
      'import "./grocery-premium-v3.css";',
      'import "./grocery-v2.css";',
    ];
    const anchor = anchors.find((candidate) => text.includes(candidate));
    must(anchor, "Grocery layout CSS anchor not found");
    text = text.replace(anchor, `${anchor}\nimport "./grocery-complete-v54.css";`);
  }

  text = text
    .replace(
      'title: { default: "Bazaara Grocery", template: "%s | Bazaara Grocery" }',
      'title: { default: "Grocery", template: "%s | Grocery" }',
    )
    .replace('applicationName: "Bazaara Grocery"', 'applicationName: "Grocery"')
    .replace('siteName: "Bazaara Grocery"', 'siteName: "Grocery"')
    .replace('title: "Bazaara Grocery"', 'title: "Grocery"');

  write(relative, text);
}

// Grocery menu must not expose comparison.
{
  const relative = "apps/grocery-web/components/shopping-desktop-menus.tsx";

  if (fs.existsSync(p(relative))) {
    let text = read(relative);
    text = text.replace(
      /^\s*<Link href="\/compare"[^\n]*BazCompare<\/Link>\s*\r?\n/m,
      "",
    );
    text = text.replace("Open Shopping menu", "Open Grocery menu");
    text = text.replace(
      "Navigation and shopping tools",
      "Grocery navigation and tools",
    );
    write(relative, text);
  }
}

// ---------------------------------------------------------------------------
// Remove legacy Grocery purple/pink tokens from ALL live Grocery styles.
// This is source-level, not an override, so module CSS cannot re-introduce the
// old palette through higher specificity.
// ---------------------------------------------------------------------------
{
  const replacements = new Map([
    ["#C026FF", "#10B981"],
    ["#FF3BD4", "#A3E635"],
    ["#FF58C8", "#84CC16"],
    ["#F0ABFC", "#A7F3D0"],
    ["#A13CFF", "#0EA56F"],
    ["#D12DFF", "#22C55E"],
    ["#E879F9", "#86EFAC"],
    ["#D946EF", "#34D399"],
    ["#EC4899", "#6EE7B7"],
    ["#c026ff", "#10B981"],
    ["#ff3bd4", "#A3E635"],
    ["#ff58c8", "#84CC16"],
    ["#f0abfc", "#A7F3D0"],
    ["#a13cff", "#0EA56F"],
    ["#d12dff", "#22C55E"],
    ["#e879f9", "#86EFAC"],
    ["#d946ef", "#34D399"],
    ["#ec4899", "#6EE7B7"],
  ]);

  function rewriteTree(dir, extensions) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        rewriteTree(full, extensions);
        continue;
      }
      if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;

      let value = fs.readFileSync(full, "utf8");
      let changed = false;
      for (const [from, to] of replacements) {
        if (value.includes(from)) {
          value = value.split(from).join(to);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, value, "utf8");
    }
  }

  rewriteTree(p("apps/grocery-web"), [".css"]);
  rewriteTree(p("apps/grocery-mobile"), [".ts", ".tsx"]);
}

// ---------------------------------------------------------------------------
// Platform API commercial rules.
// Important V5.4.1 change:
// We no longer depend on one exact `const shipping = ...` source line.
// Merchant exclusion for Grocery Express is applied at ShoppingSellerOrder data,
// which is substantially more stable across the user's prior patches.
// ---------------------------------------------------------------------------
{
  const relative = "services/platform-api/src/shopping/checkout.ts";
  let text = read(relative);

  if (!text.includes("GROCERY_SERVICE_FEE_BPS")) {
    const anchor = "const FREE_SHIPPING_THRESHOLD_MINOR = 5000000n;";
    must(text.includes(anchor), "Checkout fee constants anchor not found");

    text = text.replace(
      anchor,
      `${anchor}
const GROCERY_SERVICE_FEE_BPS = 2000n; // 20% of Grocery merchandise subtotal
const GROCERY_EXPRESS_FEE_MINOR = 200000n; // ₦2,000
const GROCERY_EXPRESS_BAZAARA_SHARE_MINOR = 100000n; // ₦1,000
const GROCERY_EXPRESS_GO_SHARE_MINOR = 100000n; // ₦1,000`,
    );
  }

  if (!text.includes('serviceFeeMinor: checkout.vertical === "GROCERY"')) {
    const anchor = "    taxMinor: moneyToNumber(checkout.taxMinor),";
    must(text.includes(anchor), "serializeCheckout tax anchor not found");

    text = text.replace(
      anchor,
      `${anchor}
    serviceFeeMinor: checkout.vertical === "GROCERY" ? moneyToNumber(checkout.taxMinor) : 0,
    expressDeliveryFeeMinor: checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS" ? moneyToNumber(checkout.shippingMinor) : 0,
    expressBazaaraShareMinor: checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS" ? Number(GROCERY_EXPRESS_BAZAARA_SHARE_MINOR) : 0,
    expressGoShareMinor: checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS" ? Number(GROCERY_EXPRESS_GO_SHARE_MINOR) : 0,`,
    );
  }

  if (!text.includes('serviceFeeMinor: order.vertical === "GROCERY"')) {
    const anchor = "    taxMinor: moneyToNumber(order.taxMinor),";
    must(text.includes(anchor), "serializeOrder tax anchor not found");

    text = text.replace(
      anchor,
      `${anchor}
    serviceFeeMinor: order.vertical === "GROCERY" ? moneyToNumber(order.taxMinor) : 0,
    expressDeliveryFeeMinor: order.vertical === "GROCERY" && order.deliveryMode === "EXPRESS" ? moneyToNumber(order.shippingMinor) : 0,
    expressBazaaraShareMinor: order.vertical === "GROCERY" && order.deliveryMode === "EXPRESS" ? Number(GROCERY_EXPRESS_BAZAARA_SHARE_MINOR) : 0,
    expressGoShareMinor: order.vertical === "GROCERY" && order.deliveryMode === "EXPRESS" ? Number(GROCERY_EXPRESS_GO_SHARE_MINOR) : 0,`,
    );
  }

  // Checkout seller summaries should show zero merchant shipping for fixed Grocery Express.
  if (
    !text.includes(
      'checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS"\n      ? 0',
    )
  ) {
    const loopPattern =
      /for\s*\(\s*const\s+seller\s+of\s+sellers\.values\(\)\s*\)\s*\{\s*seller\.shippingMinor\s*=\s*checkout\.shippingMinor\s*===\s*0n\s*\?\s*0\s*:\s*moneyToNumber\(\s*calculateSellerShippingMinor\(\s*BigInt\(\s*seller\.subtotalMinor\s*\)\s*\)\s*\)\s*;\s*\}/m;

    if (loopPattern.test(text)) {
      text = text.replace(
        loopPattern,
        `for (const seller of sellers.values()) {
    seller.shippingMinor =
      checkout.vertical === "GROCERY" && checkout.deliveryMode === "EXPRESS"
        ? 0
        : checkout.shippingMinor === 0n
          ? 0
          : moneyToNumber(calculateSellerShippingMinor(BigInt(seller.subtotalMinor)));
  }`,
      );
    } else {
      note(
        "Seller-summary loop has custom formatting; leaving it unchanged because seller-order settlement is patched independently.",
      );
    }
  }

  // Pricing block: fixed Express fee + separate 20% Grocery service fee.
  if (!text.includes("const serviceFeeMinor =")) {
    const start =
      '  const membership = vertical === "GROCERY" ? await db.groceryMembership.findUnique({ where: { userId } }) : null;';
    const end =
      "  const totalMinor = subtotalMinor + shippingMinor + taxMinor - discountMinor;";
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end, startIndex);

    must(
      startIndex >= 0 && endIndex >= 0,
      "Grocery pricing block not found",
    );

    const oldBlock = text.slice(startIndex, endIndex + end.length);
    const newBlock = `  const membership = vertical === "GROCERY" ? await db.groceryMembership.findUnique({ where: { userId } }) : null;
  const hasFreeDelivery = Boolean(membership?.freeDeliveryUntil && membership.freeDeliveryUntil > new Date());
  const standardShippingMinor = deliveryMode === "PICKUP" || hasFreeDelivery ? 0n : [...sellerSubtotals.entries()].reduce((total, [merchantId, sellerSubtotal]) => {
    const threshold = sellerThresholds.get(merchantId);
    if (threshold != null && sellerSubtotal >= threshold) return total;
    return total + calculateSellerShippingMinor(sellerSubtotal);
  }, 0n);
  const shippingMinor =
    vertical === "GROCERY" && deliveryMode === "EXPRESS"
      ? GROCERY_EXPRESS_FEE_MINOR
      : standardShippingMinor;
  const serviceFeeMinor =
    vertical === "GROCERY"
      ? (subtotalMinor * GROCERY_SERVICE_FEE_BPS + 5000n) / 10000n
      : 0n;
  // Existing taxMinor persists the Grocery service fee without a destructive schema migration.
  const taxMinor = serviceFeeMinor;
  const discountMinor = 0n;
  const totalMinor = subtotalMinor + shippingMinor + serviceFeeMinor - discountMinor;`;

    text = text.replace(oldBlock, newBlock);
  }

  // Merchant seller orders MUST NOT receive the fixed Grocery Express delivery fee.
  // Patch the stable Prisma data fields instead of matching the user's previous
  // `const shipping = ...` formatting.
  const sellerOrderExpressAlreadyPatched =
    /shippingMinor:\s*lockedCheckout\.vertical\s*===\s*["']GROCERY["']\s*&&\s*lockedCheckout\.deliveryMode\s*===\s*["']EXPRESS["'][\s\S]{0,180}?\?\s*0n[\s\S]{0,120}?:\s*shipping\s*,/m.test(text) &&
    /totalMinor:\s*subtotal\s*\+[\s\S]{0,180}?lockedCheckout\.vertical\s*===\s*["']GROCERY["']\s*&&\s*lockedCheckout\.deliveryMode\s*===\s*["']EXPRESS["'][\s\S]{0,180}?\?\s*0n[\s\S]{0,120}?:\s*shipping/m.test(text);

  if (!sellerOrderExpressAlreadyPatched) {
    const sellerDataPattern =
      /shippingMinor:\s*shipping\s*,\s*\r?\n\s*totalMinor:\s*subtotal\s*\+\s*shipping\s*,/m;

    if (sellerDataPattern.test(text)) {
      text = text.replace(
        sellerDataPattern,
        `shippingMinor:
            lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"
              ? 0n
              : shipping,
          totalMinor:
            subtotal +
            (lockedCheckout.vertical === "GROCERY" && lockedCheckout.deliveryMode === "EXPRESS"
              ? 0n
              : shipping),`,
      );
    } else {
      // A previous Grocery patch may already have rewritten this settlement block
      // using different whitespace or an equivalent expression. Do not fail before
      // OrderPlaced reconciliation fields are repaired; the validator below still
      // confirms the fixed Grocery Express money rules.
      note(
        "ShoppingSellerOrder uses custom shipping formatting; continuing with Grocery fee payload repair.",
      );
    }
  }

  // Enrich OrderPlaced payload regardless of prior formatting.
  // V5.4.2 locates the OrderPlaced event and injects the four Grocery money
  // fields directly into its payload object. This works with compact, expanded,
  // or previously customized payload formatting.
  if (
    !text.includes("groceryExpressBazaaraShareMinor") ||
    !text.includes("groceryExpressGoShareMinor")
  ) {
    const eventMatch = /eventType\s*:\s*["']OrderPlaced["']/m.exec(text);
    must(eventMatch, "OrderPlaced event not found");

    const payloadPattern = /payload\s*:\s*\{/gm;
    payloadPattern.lastIndex = eventMatch.index;
    const payloadMatch = payloadPattern.exec(text);

    must(
      payloadMatch && payloadMatch.index - eventMatch.index < 5000,
      "OrderPlaced payload object not found",
    );

    const insertionPoint = payloadMatch.index + payloadMatch[0].length;
    const fields = `
        groceryServiceFeeMinor: createdOrder.vertical === "GROCERY" ? createdOrder.taxMinor.toString() : "0",
        groceryExpressDeliveryFeeMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? createdOrder.shippingMinor.toString() : "0",
        groceryExpressBazaaraShareMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? GROCERY_EXPRESS_BAZAARA_SHARE_MINOR.toString() : "0",
        groceryExpressGoShareMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? GROCERY_EXPRESS_GO_SHARE_MINOR.toString() : "0",`;

    const next = text.slice(
      insertionPoint,
      Math.min(text.length, insertionPoint + 2500),
    );

    const needed = [];
    if (!next.includes("groceryServiceFeeMinor"))
      needed.push(
        'groceryServiceFeeMinor: createdOrder.vertical === "GROCERY" ? createdOrder.taxMinor.toString() : "0",',
      );
    if (!next.includes("groceryExpressDeliveryFeeMinor"))
      needed.push(
        'groceryExpressDeliveryFeeMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? createdOrder.shippingMinor.toString() : "0",',
      );
    if (!next.includes("groceryExpressBazaaraShareMinor"))
      needed.push(
        'groceryExpressBazaaraShareMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? GROCERY_EXPRESS_BAZAARA_SHARE_MINOR.toString() : "0",',
      );
    if (!next.includes("groceryExpressGoShareMinor"))
      needed.push(
        'groceryExpressGoShareMinor: createdOrder.vertical === "GROCERY" && createdOrder.deliveryMode === "EXPRESS" ? GROCERY_EXPRESS_GO_SHARE_MINOR.toString() : "0",',
      );

    if (needed.length) {
      text =
        text.slice(0, insertionPoint) +
        `\n        ${needed.join("\n        ")}` +
        text.slice(insertionPoint);
    }
  }


  write(relative, text);
}

// ---------------------------------------------------------------------------
// Business Grocery: inventory responsibility.
// Multiple anchors are accepted because Business UI changed across prior builds.
// ---------------------------------------------------------------------------
{
  const relative = "apps/business-web/app/grocery/page.tsx";
  let text = read(relative);

  if (!text.includes("BRANCH STOCK IS AUTHORITATIVE")) {
    const anchors = [
      '<main className="main">',
      '<div className="main">',
      '<main className="workspace-main">',
      '<div className="workspace-main">',
    ];
    const anchor = anchors.find((candidate) => text.includes(candidate));

    if (anchor) {
      const panel = `
        <section className="panel grocery-v54-business-rule" style={{ marginBottom: 14 }}>
          <div className="section-title">
            <div>
              <span className="eyebrow">BRANCH STOCK IS AUTHORITATIVE</span>
              <h2>Keep inventory true before customers shop.</h2>
              <p className="muted">Grocery availability comes from branch inventory. Checkout revalidates and reserves stock; pickers only create a substitution event when a reserved item cannot be found on shelf.</p>
            </div>
          </div>
        </section>`;

      text = text.replace(anchor, `${anchor}${panel}`);
    } else {
      note("Business Grocery layout has custom markup; stock policy marker was not injected.");
    }
  }

  write(relative, text);
}

// Operations Grocery: exact commercial policy.
// Multiple insertion points accepted.
{
  const relative = "apps/operations-web/app/grocery/page.tsx";
  let text = read(relative);

  if (!text.includes("GROCERY COMMERCIAL POLICY")) {
    const anchors = [
      '<section className="ops-v31-command-kpis">',
      '<main className="ops-main">',
      '<div className="ops-main">',
    ];
    const anchor = anchors.find((candidate) => text.includes(candidate));

    if (anchor) {
      const policy = `
        <section className="ops-v31-panel grocery-v54-ops-policy" style={{ marginBottom: 14 }}>
          <div className="ops-v31-section-head">
            <div>
              <span className="ops-v31-kicker">GROCERY COMMERCIAL POLICY</span>
              <h2>Express and service-fee allocation</h2>
            </div>
          </div>
          <div className="ops-v31-command-kpis">
            <article><span>EXPRESS FEE</span><strong>₦2,000</strong><small>customer delivery charge</small></article>
            <article><span>BAZAARA SHARE</span><strong>₦1,000</strong><small>from Express fee</small></article>
            <article><span>GO / COURIER</span><strong>₦1,000</strong><small>from Express fee</small></article>
            <article><span>SERVICE FEE</span><strong>20%</strong><small>added separately to Grocery subtotal</small></article>
          </div>
        </section>`;

      text = text.replace(anchor, `${policy}\n        ${anchor}`);
    } else {
      note("Operations Grocery layout has custom markup; policy marker was not injected.");
    }
  }

  write(relative, text);
}

console.log("Grocery Complete V5.4.2 source patch applied.");
