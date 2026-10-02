"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  COMPARE_EVENT,
  COMPARE_LIMIT,
  CompareItem,
  isCompared,
  readCompareItems,
  toggleCompareItem
} from "./compare-store";


type BazLensResult = {
  title: string;
  href: string;
  image?: string;
  price?: string;
};


const productHrefPattern =
  /\/products\/[^?#]+/i;


function normalizeHref(
  href: string
) {
  try {
    const url = new URL(
      href,
      window.location.origin
    );

    return (
      url.pathname +
      url.search
    );
  }
  catch {
    return href;
  }
}


function extractText(
  root: Element,
  selectors: string
) {
  const node =
    root.querySelector(
      selectors
    );

  return (
    node?.textContent ??
    ""
  ).trim();
}


function extractProduct(
  root: Element,
  href: string
): CompareItem {

  const text =
    (
      root.textContent ??
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  const prices =
    text.match(
      /₦\s?[\d,.]+/g
    ) ?? [];


  const image =
    root.querySelector(
      "img"
    ) as HTMLImageElement | null;


  const title =
    extractText(
      root,
      [
        "[data-product-title]",
        "h1",
        "h2",
        "h3",
        "h4"
      ].join(",")
    ) ||
    image?.alt?.trim() ||
    "BAZAARA product";


  const sellerMatch =
    text.match(
      /Sold by\s+([^|•·]+?)(?=\s{2,}|Availability|Price|₦|$)/i
    );


  const availabilityMatch =
    text.match(
      /(\d+\s+available|in stock|out of stock)/i
    );


  const ratingMatch =
    text.match(
      /([0-5](?:\.\d)?)\s*(?:★|stars?|\/5)/i
    );


  const id =
    normalizeHref(
      href
    );


  return {
    id,
    href: id,
    title,
    image:
      image?.currentSrc ||
      image?.src ||
      "",
    price:
      prices[0] ??
      "",
    oldPrice:
      prices[1] ??
      "",
    seller:
      sellerMatch?.[1]?.trim() ??
      "",
    availability:
      availabilityMatch?.[1]?.trim() ??
      "",
    rating:
      ratingMatch?.[1]?.trim() ??
      ""
  };
}


function findProductCard(
  link: HTMLAnchorElement
): HTMLElement | null {

  const semantic =
    link.closest(
      [
        "article",
        "[data-product-card]",
        "[class*='product-card']",
        "[class*='productCard']"
      ].join(",")
    ) as HTMLElement | null;


  if (semantic) {
    return semantic;
  }


  let node =
    link.parentElement;


  for (
    let depth = 0;
    node &&
    depth < 5;
    depth += 1
  ) {
    const rect =
      node.getBoundingClientRect();


    if (
      rect.width >= 145 &&
      rect.height >= 180 &&
      rect.width <= 520 &&
      rect.height <= 920
    ) {
      return node;
    }


    node =
      node.parentElement;
  }


  return null;
}


function createCompareButton(
  card: HTMLElement,
  item: CompareItem
) {

  const existing =
    card.querySelector(
      ":scope > .bazcompare-card-action"
    ) as HTMLButtonElement | null;


  if (existing) {
    existing.textContent =
      isCompared(
        item.id
      )
        ? "✓ Comparing"
        : "Compare";

    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "bazcompare-card-action";


  button.textContent =
    isCompared(
      item.id
    )
      ? "✓ Comparing"
      : "Compare";


  button.setAttribute(
    "aria-label",
    `Compare ${item.title}`
  );


  button.addEventListener(
    "click",
    (
      event
    ) => {

      event.preventDefault();
      event.stopPropagation();


      const result =
        toggleCompareItem(
          item
        );


      button.textContent =
        isCompared(
          item.id
        )
          ? "✓ Comparing"
          : "Compare";


      if (
        result.limitReached
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "bazaara-compare-limit"
          )
        );
      }
    }
  );


  card.appendChild(
    button
  );
}


export default function ShoppingTools() {

  const [
    compareItems,
    setCompareItems
  ] =
    useState<CompareItem[]>(
      []
    );


  const [
    lensOpen,
    setLensOpen
  ] =
    useState(
      false
    );


  const [
    lensFile,
    setLensFile
  ] =
    useState<File | null>(
      null
    );


  const [
    previewUrl,
    setPreviewUrl
  ] =
    useState(
      ""
    );


  const [
    lensBusy,
    setLensBusy
  ] =
    useState(
      false
    );


  const [
    lensMessage,
    setLensMessage
  ] =
    useState(
      ""
    );


  const [
    lensResults,
    setLensResults
  ] =
    useState<BazLensResult[]>(
      []
    );


  const [
    compareNotice,
    setCompareNotice
  ] =
    useState(
      ""
    );


  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );


  const cameraInputRef =
    useRef<HTMLInputElement>(
      null
    );


  const syncCompare =
    useCallback(
      () => {

        setCompareItems(
          readCompareItems()
        );


        document
          .querySelectorAll<HTMLButtonElement>(
            ".bazcompare-card-action"
          )
          .forEach(
            (
              button
            ) => {

              const id =
                button.dataset.compareId;


              if (
                id
              ) {
                button.textContent =
                  isCompared(
                    id
                  )
                    ? "✓ Comparing"
                    : "Compare";
              }
            }
          );
      },
      []
    );


  const enhancePage =
    useCallback(
      () => {

        /*
         * Product-detail Compare used to be appended directly to document.body.
         * Because ShoppingTools lives at layout level, that floating button
         * could survive product navigation and appear to "pop up" repeatedly.
         *
         * Comparison remains available through catalogue Compare actions,
         * /compare and BazAI. Product detail itself stays clean.
         */
        document
          .querySelectorAll(
            ".bazcompare-detail-action"
          )
          .forEach(
            (node) =>
              node.remove()
          );


        /*
         * V8.3: ShoppingHeader owns the desktop BazAI/BazLens controls.
         *
         * Older ShoppingTools code dynamically appended another
         * `.bazlens-trigger` camera beside any product-search input.
         * That produced the duplicate camera on laptop/web.
         *
         * Remove any stale injected trigger and padding class instead.
         */
        document
          .querySelectorAll(
            ".bazlens-trigger"
          )
          .forEach(
            (node) =>
              node.remove()
          );


        document
          .querySelectorAll<HTMLInputElement>(
            "input.baz-search-input"
          )
          .forEach(
            (input) =>
              input.classList.remove(
                "baz-search-input"
              )
          );


        document
          .querySelectorAll<HTMLAnchorElement>(
            'a[href*="/products/"]'
          )
          .forEach(
            (
              link
            ) => {

              if (
                !productHrefPattern.test(
                  link.href
                )
              ) {
                return;
              }


              const card =
                findProductCard(
                  link
                );


              if (
                !card ||
                card.dataset.bazCompareEnhanced ===
                  "1"
              ) {
                return;
              }


              const item =
                extractProduct(
                  card,
                  link.href
                );


              card.dataset.bazCompareEnhanced =
                "1";


              const beforePosition =
                window.getComputedStyle(
                  card
                ).position;


              if (
                beforePosition ===
                "static"
              ) {
                card.style.position =
                  "relative";
              }


              createCompareButton(
                card,
                item
              );


              const button =
                card.querySelector<HTMLButtonElement>(
                  ":scope > .bazcompare-card-action"
                );


              if (
                button
              ) {
                button.dataset.compareId =
                  item.id;
              }
            }
          );
      },
      []
    );


  useEffect(
    () => {

      syncCompare();
      enhancePage();


      const observer =
        new MutationObserver(
          () => {

            window.requestAnimationFrame(
              enhancePage
            );
          }
        );


      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );


      const sync =
        () => {

          syncCompare();
          enhancePage();
        };


      const limit =
        () => {

          setCompareNotice(
            `BazCompare supports up to ${COMPARE_LIMIT} products. Remove one to add another.`
          );
        };


      window.addEventListener(
        COMPARE_EVENT,
        sync
      );


      window.addEventListener(
        "storage",
        sync
      );


      window.addEventListener(
        "bazaara-compare-limit",
        limit
      );


      return () => {

        document
          .querySelectorAll(
            ".bazcompare-detail-action"
          )
          .forEach(
            (node) =>
              node.remove()
          );


        document
          .querySelectorAll(
            ".bazlens-trigger"
          )
          .forEach(
            (node) =>
              node.remove()
          );


        document
          .querySelectorAll<HTMLInputElement>(
            "input.baz-search-input"
          )
          .forEach(
            (input) =>
              input.classList.remove(
                "baz-search-input"
              )
          );


        observer.disconnect();


        window.removeEventListener(
          COMPARE_EVENT,
          sync
        );


        window.removeEventListener(
          "storage",
          sync
        );


        window.removeEventListener(
          "bazaara-compare-limit",
          limit
        );
      };
    },
    [
      enhancePage,
      syncCompare
    ]
  );


  useEffect(
    () => {

      return () => {

        if (
          previewUrl
        ) {
          URL.revokeObjectURL(
            previewUrl
          );
        }
      };
    },
    [
      previewUrl
    ]
  );


  function chooseFile(
    file: File | null
  ) {

    if (
      previewUrl
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }


    setLensFile(
      file
    );


    setLensMessage(
      ""
    );


    setLensResults(
      []
    );


    setPreviewUrl(
      file
        ? URL.createObjectURL(
            file
          )
        : ""
    );
  }


  function handleFileInput(
    event: ChangeEvent<HTMLInputElement>
  ) {

    chooseFile(
      event.target.files?.[0] ??
      null
    );
  }


  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {

    event.preventDefault();


    chooseFile(
      event.dataTransfer.files?.[0] ??
      null
    );
  }


  async function runBazLens() {

    if (
      !lensFile
    ) {
      setLensMessage(
        "Choose or take a product photo first."
      );

      return;
    }


    setLensBusy(
      true
    );


    setLensMessage(
      ""
    );


    setLensResults(
      []
    );


    try {
      const form =
        new FormData();


      form.append(
        "image",
        lensFile
      );


      const response =
        await fetch(
          "/api/bazlens/search",
          {
            method:
              "POST",

            body:
              form
          }
        );


      const payload =
        await response.json() as {
          results?: BazLensResult[];
          error?: string;
        };


      if (
        !response.ok
      ) {
        throw new Error(
          payload.error ||
          "BazLens visual search is unavailable."
        );
      }


      setLensResults(
        Array.isArray(
          payload.results
        )
          ? payload.results
          : []
      );


      if (
        !payload.results?.length
      ) {
        setLensMessage(
          "No close visual matches were returned."
        );
      }
    }
    catch (
      error
    ) {
      setLensMessage(
        error instanceof Error
          ? error.message
          : "BazLens visual search failed."
      );
    }
    finally {
      setLensBusy(
        false
      );
    }
  }


  return (
    <>
      {compareItems.length > 0 && (
        <div
          className="bazcompare-tray"
          role="region"
          aria-label="BazCompare selection"
        >
          <div>
            <strong>
              BazCompare
            </strong>

            <span>
              {compareItems.length}/{COMPARE_LIMIT} products
            </span>
          </div>


          <div
            className="bazcompare-thumbs"
          >
            {compareItems.map(
              (
                item
              ) => (
                <span
                  key={
                    item.id
                  }
                  title={
                    item.title
                  }
                >
                  {item.image ? (
                    <img
                      src={
                        item.image
                      }
                      alt=""
                    />
                  ) : (
                    "⇄"
                  )}
                </span>
              )
            )}
          </div>


          <button
            type="button"
            onClick={
              () => {

                window.location.href =
                  "/compare";
              }
            }
          >
            Compare now
          </button>
        </div>
      )}


      {compareNotice && (
        <div
          className="bazcompare-notice"
          role="status"
        >
          <span>
            {compareNotice}
          </span>

          <button
            type="button"
            onClick={
              () =>
                setCompareNotice(
                  ""
                )
            }
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}


      {lensOpen && (
        <div
          className="bazlens-layer"
          role="dialog"
          aria-modal="true"
          aria-label="BazLens visual search"
        >
          <button
            type="button"
            className="bazlens-backdrop"
            onClick={
              () =>
                setLensOpen(
                  false
                )
            }
            aria-label="Close BazLens"
          />


          <section
            className="bazlens-modal"
          >
            <header>
              <div>
                <span>
                  SHOPPING
                </span>

                <h2>
                  BazLens
                </h2>

                <p>
                  Search Shopping using a product image.
                </p>
              </div>


              <button
                type="button"
                className="bazlens-close"
                onClick={
                  () =>
                    setLensOpen(
                      false
                    )
                }
                aria-label="Close BazLens"
              >
                ×
              </button>
            </header>


            <div
              className="bazlens-drop"
              onDragOver={
                (
                  event
                ) =>
                  event.preventDefault()
              }
              onDrop={
                handleDrop
              }
            >
              {previewUrl ? (
                <img
                  src={
                    previewUrl
                  }
                  alt="Selected product"
                />
              ) : (
                <div
                  className="bazlens-placeholder"
                >
                  <span>
                    ◉
                  </span>

                  <strong>
                    Add a product photo
                  </strong>

                  <small>
                    JPG, PNG or WEBP
                  </small>
                </div>
              )}
            </div>


            <div
              className="bazlens-actions"
            >
              <button
                type="button"
                onClick={
                  () =>
                    cameraInputRef.current?.click()
                }
              >
                Take photo
              </button>


              <button
                type="button"
                onClick={
                  () =>
                    fileInputRef.current?.click()
                }
              >
                Upload image
              </button>


              <button
                type="button"
                className="bazlens-primary"
                disabled={
                  !lensFile ||
                  lensBusy
                }
                onClick={
                  runBazLens
                }
              >
                {lensBusy
                  ? "Searching…"
                  : "Search with BazLens"}
              </button>
            </div>


            <input
              ref={
                cameraInputRef
              }
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={
                handleFileInput
              }
            />


            <input
              ref={
                fileInputRef
              }
              hidden
              type="file"
              accept="image/*"
              onChange={
                handleFileInput
              }
            />


            {lensMessage && (
              <p
                className="bazlens-message"
              >
                {lensMessage}
              </p>
            )}


            {lensResults.length > 0 && (
              <div
                className="bazlens-results"
              >
                <h3>
                  Visual matches
                </h3>


                {lensResults.map(
                  (
                    result
                  ) => (
                    <a
                      key={
                        result.href
                      }
                      href={
                        result.href
                      }
                    >
                      {result.image ? (
                        <img
                          src={
                            result.image
                          }
                          alt=""
                        />
                      ) : (
                        <span
                          className="bazlens-result-placeholder"
                        >
                          ◫
                        </span>
                      )}


                      <span>
                        <strong>
                          {
                            result.title
                          }
                        </strong>

                        <small>
                          {
                            result.price ??
                            ""
                          }
                        </small>
                      </span>
                    </a>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
