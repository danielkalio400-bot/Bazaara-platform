"use client";

import Link from "next/link";
import {
  useEffect,
  useState
} from "react";

import {
  AddressEditor
} from "../../../components/address-editor";

import {
  ShoppingAddress,
  deleteAddress,
  formatNigeriaPhone,
  loadAddressBook,
  setDefaultAddress,
  upsertAddress
} from "../../../lib/address-book";

export default function AddressBookPage() {
  const [
    addresses,
    setAddresses
  ] =
    useState<ShoppingAddress[]>(
      []
    );

  const [
    editing,
    setEditing
  ] =
    useState<
      ShoppingAddress |
      null |
      undefined
    >(
      undefined
    );

  useEffect(
    () => {
      setAddresses(
        loadAddressBook()
      );
    },
    []
  );

  function save(
    address: ShoppingAddress
  ) {
    const next =
      upsertAddress(
        addresses,
        address
      );

    setAddresses(next);
    setEditing(undefined);
  }

  function remove(
    id: string
  ) {
    if (
      !window.confirm(
        "Remove this delivery address?"
      )
    ) {
      return;
    }

    setAddresses(
      deleteAddress(
        addresses,
        id
      )
    );
  }

  function makeDefault(
    id: string
  ) {
    setAddresses(
      setDefaultAddress(
        addresses,
        id
      )
    );
  }

  return (
    <main
      className="bazaara-address-page"
    >
      <div
        className="bazaara-address-wrap"
      >
        <header
          className="bazaara-address-page-head"
        >
          <Link
            href="/account"
            aria-label="Back to account"
          >
            ←
          </Link>

          <div>
            <small>
              ACCOUNT
            </small>

            <h1>
              Address Book
            </h1>

            <p>
              Save delivery addresses once and choose one at checkout. Nigeria, state/FCT and LGA/Area Council use structured selections.
            </p>
          </div>

          <button
            type="button"
            onClick={
              () =>
                setEditing(null)
            }
          >
            + Add address
          </button>
        </header>

        {
          addresses.length === 0
            ? (
              <section
                className="bazaara-address-empty"
              >
                <strong>
                  No saved delivery addresses
                </strong>

                <span>
                  Add your first address. It will automatically become your default checkout address.
                </span>

                <button
                  type="button"
                  onClick={
                    () =>
                      setEditing(null)
                  }
                >
                  Add delivery address
                </button>
              </section>
            )
            : (
              <section
                className="bazaara-address-grid"
              >
                {
                  addresses.map(
                    (address) => (
                      <article
                        className={
                          address.isDefault
                            ? "bazaara-address-card is-default"
                            : "bazaara-address-card"
                        }
                        key={address.id}
                      >
                        <div
                          className="bazaara-address-card-top"
                        >
                          <div>
                            <strong>
                              {
                                address.label
                              }
                            </strong>

                            {
                              address.isDefault
                                ? (
                                  <span>
                                    Default
                                  </span>
                                )
                                : null
                            }
                          </div>

                          <button
                            type="button"
                            onClick={
                              () =>
                                setEditing(
                                  address
                                )
                            }
                          >
                            Edit
                          </button>
                        </div>

                        <h2>
                          {
                            address.recipientName
                          }
                        </h2>

                        <p>
                          {
                            address.building
                              ? `${address.building}, `
                              : ""
                          }
                          {address.street}
                        </p>

                        <p>
                          {
                            address.city
                          }, {
                            address.lga
                          }
                        </p>

                        <p>
                          {
                            address.state
                          }, Nigeria · Postal code {
                            address.postalCode ||
                            "Not set"
                          }
                        </p>

                        <small>
                          {
                            formatNigeriaPhone(
                              address.phoneNational
                            )
                          }
                        </small>

                        <div
                          className="bazaara-address-card-actions"
                        >
                          {
                            address.isDefault
                              ? (
                                <Link
                                  href={`/checkout?address=${encodeURIComponent(address.id)}`}
                                >
                                  Use at checkout
                                </Link>
                              )
                              : (
                                <>
                                  <button
                                    type="button"
                                    onClick={
                                      () =>
                                        makeDefault(
                                          address.id
                                        )
                                    }
                                  >
                                    Set default
                                  </button>

                                  <Link
                                    href={`/checkout?address=${encodeURIComponent(address.id)}`}
                                  >
                                    Use at checkout
                                  </Link>
                                </>
                              )
                          }

                          <button
                            type="button"
                            className="is-danger"
                            onClick={
                              () =>
                                remove(
                                  address.id
                                )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )
                  )
                }
              </section>
            )
        }
      </div>

      {
        editing !== undefined
          ? (
            <div
              className="bazaara-address-modal"
            >
              <button
                type="button"
                className="bazaara-address-modal-backdrop"
                aria-label="Close address form"
                onClick={
                  () =>
                    setEditing(
                      undefined
                    )
                }
              />

              <div
                className="bazaara-address-modal-card"
              >
                <AddressEditor
                  address={
                    editing
                  }
                  forceDefault={
                    addresses.length === 0
                  }
                  onCancel={
                    () =>
                      setEditing(
                        undefined
                      )
                  }
                  onSave={save}
                />
              </div>
            </div>
          )
          : null
      }
    </main>
  );
}
