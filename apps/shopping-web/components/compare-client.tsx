"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CompareItem,
  clearCompareItems,
  readCompareItems,
  removeCompareItem
} from "./compare-store";


type Row = {
  label: string;
  read: (item: CompareItem) => string;
};


const rows: Row[] = [
  {
    label: "Current price",
    read: (item) => item.price || "—"
  },
  {
    label: "Previous price",
    read: (item) => item.oldPrice || "—"
  },
  {
    label: "Seller",
    read: (item) => item.seller || "—"
  },
  {
    label: "Availability",
    read: (item) => item.availability || "—"
  },
  {
    label: "Rating",
    read: (item) => item.rating || "—"
  }
];


export default function CompareClient() {

  const [
    items,
    setItems
  ] =
    useState<CompareItem[]>(
      []
    );


  const [
    differencesOnly,
    setDifferencesOnly
  ] =
    useState(
      false
    );


  useEffect(
    () => {

      setItems(
        readCompareItems()
      );
    },
    []
  );


  const visibleRows =
    useMemo(
      () => {

        if (
          !differencesOnly ||
          items.length < 2
        ) {
          return rows;
        }


        return rows.filter(
          (
            row
          ) => {

            const values =
              items.map(
                (
                  item
                ) =>
                  row.read(
                    item
                  )
              );


            return (
              new Set(
                values
              ).size >
              1
            );
          }
        );
      },
      [
        differencesOnly,
        items
      ]
    );


  if (
    items.length === 0
  ) {
    return (
      <main
        className="bazcompare-page"
      >
        <section
          className="bazcompare-empty"
        >
          <span>
            SHOPPING
          </span>

          <h1>
            BazCompare
          </h1>

          <p>
            Add products to compare their price, seller, availability and other key details side by side.
          </p>

          <a
            href="/#catalogue"
          >
            Browse products
          </a>
        </section>
      </main>
    );
  }


  return (
    <main
      className="bazcompare-page"
    >
      <header
        className="bazcompare-page-head"
      >
        <div>
          <span>
            SHOPPING
          </span>

          <h1>
            BazCompare
          </h1>

          <p>
            Compare up to four products side by side.
          </p>
        </div>


        <div
          className="bazcompare-page-actions"
        >
          <label>
            <input
              type="checkbox"
              checked={
                differencesOnly
              }
              onChange={
                (
                  event
                ) =>
                  setDifferencesOnly(
                    event.target.checked
                  )
              }
            />

            Show differences only
          </label>


          <button
            type="button"
            onClick={
              () => {

                clearCompareItems();

                setItems(
                  []
                );
              }
            }
          >
            Clear all
          </button>
        </div>
      </header>


      <div
        className="bazcompare-grid"
        style={
          {
            "--compare-count":
              items.length
          } as React.CSSProperties
        }
      >
        <div
          className="bazcompare-label-cell bazcompare-product-label"
        >
          Products
        </div>


        {items.map(
          (
            item
          ) => (
            <article
              key={
                item.id
              }
              className="bazcompare-product"
            >
              <div
                className="bazcompare-product-image"
              >
                {item.image ? (
                  <img
                    src={
                      item.image
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    ⇄
                  </span>
                )}
              </div>


              <h2>
                {
                  item.title
                }
              </h2>


              <strong>
                {
                  item.price ||
                  "Price unavailable"
                }
              </strong>


              <div
                className="bazcompare-product-links"
              >
                <a
                  href={
                    item.href
                  }
                >
                  View product
                </a>


                <button
                  type="button"
                  onClick={
                    () => {

                      setItems(
                        removeCompareItem(
                          item.id
                        )
                      );
                    }
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          )
        )}


        {visibleRows.map(
          (
            row
          ) => (
            <div
              key={
                row.label
              }
              className="bazcompare-row"
              style={
                {
                  display:
                    "contents"
                }
              }
            >
              <div
                className="bazcompare-label-cell"
              >
                {
                  row.label
                }
              </div>


              {items.map(
                (
                  item
                ) => (
                  <div
                    key={
                      `${row.label}-${item.id}`
                    }
                    className="bazcompare-value-cell"
                  >
                    {
                      row.read(
                        item
                      )
                    }
                  </div>
                )
              )}
            </div>
          )
        )}
      </div>
    </main>
  );
}
