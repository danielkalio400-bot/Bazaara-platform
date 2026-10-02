"use client";

import {
  FormEvent,
  useMemo,
  useState
} from "react";

import {
  AddressLabel,
  ShoppingAddress,
  createAddressId,
  isValidNigeriaPhone,
  isValidNigeriaPostalCode,
  normalizeNigeriaPhone,
  normalizeNigeriaPostalCode
} from "../lib/address-book";

import {
  NIGERIA_STATES,
  getNigeriaLgas,
  getNigeriaState
} from "../lib/nigeria-addresses";

type Draft = {
  id: string;
  label: AddressLabel;
  recipientName: string;
  email: string;
  phoneNational: string;
  state: string;
  lga: string;
  cityChoice: string;
  cityOther: string;
  postalCode: string;
  street: string;
  building: string;
  landmark: string;
  deliveryInstructions: string;
  isDefault: boolean;
  createdAt: string;
};

function fromAddress(
  address?: ShoppingAddress | null
): Draft {
  const now =
    new Date().toISOString();

  if (!address) {
    return {
      id: createAddressId(),
      label: "Home",
      recipientName: "",
      email: "",
      phoneNational: "",
      state: "",
      lga: "",
      cityChoice: "",
      cityOther: "",
      postalCode: "",
      street: "",
      building: "",
      landmark: "",
      deliveryInstructions: "",
      isDefault: false,
      createdAt: now
    };
  }

  const stateData =
    getNigeriaState(
      address.state
    );

  const automaticCities =
    [
      stateData?.capital ?? "",
      address.lga
    ].filter(Boolean);

  const isAutomatic =
    automaticCities.includes(
      address.city
    );

  return {
    id: address.id,
    label: address.label,
    recipientName:
      address.recipientName,
    email: address.email,
    phoneNational:
      address.phoneNational,
    state: address.state,
    lga: address.lga,
    cityChoice:
      isAutomatic
        ? address.city
        : address.city
          ? "__other__"
          : "",
    cityOther:
      isAutomatic
        ? ""
        : address.city,
    postalCode:
      address.postalCode ?? "",
    street: address.street,
    building: address.building,
    landmark: address.landmark,
    deliveryInstructions:
      address.deliveryInstructions,
    isDefault:
      address.isDefault,
    createdAt:
      address.createdAt
  };
}

export function AddressEditor({
  address,
  forceDefault = false,
  onCancel,
  onSave
}: {
  address?: ShoppingAddress | null;
  forceDefault?: boolean;
  onCancel: () => void;
  onSave:
    (
      next: ShoppingAddress
    ) => void;
}) {
  const [
    draft,
    setDraft
  ] =
    useState<Draft>(
      () =>
        fromAddress(address)
    );

  const [
    error,
    setError
  ] =
    useState("");

  const lgas =
    useMemo(
      () =>
        getNigeriaLgas(
          draft.state
        ),
      [
        draft.state
      ]
    );

  const stateData =
    getNigeriaState(
      draft.state
    );

  const cityOptions =
    Array.from(
      new Set(
        [
          stateData?.capital ?? "",
          draft.lga
        ].filter(Boolean)
      )
    );

  function setField<
    K extends keyof Draft
  >(
    key: K,
    value: Draft[K]
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]:
          value
      })
    );
  }

  function chooseState(
    state: string
  ) {
    setDraft(
      (current) => ({
        ...current,
        state,
        lga: "",
        cityChoice: "",
        cityOther: ""
      })
    );
  }

  function chooseLga(
    lga: string
  ) {
    setDraft(
      (current) => ({
        ...current,
        lga,
        cityChoice:
          current.cityChoice === "__other__"
            ? "__other__"
            : "",
        cityOther:
          current.cityChoice === "__other__"
            ? current.cityOther
            : ""
      })
    );
  }

  function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const phone =
      normalizeNigeriaPhone(
        draft.phoneNational
      );

    if (
      !draft.recipientName.trim()
    ) {
      setError(
        "Enter the recipient name."
      );
      return;
    }

    if (
      !isValidNigeriaPhone(phone)
    ) {
      setError(
        "Enter a 10-digit Nigerian mobile number after +234."
      );
      return;
    }

    if (
      !draft.state ||
      !draft.lga
    ) {
      setError(
        "Choose a state and LGA / Area Council."
      );
      return;
    }

    const city =
      draft.cityChoice === "__other__"
        ? draft.cityOther.trim()
        : draft.cityChoice.trim();

    if (!city) {
      setError(
        "Choose the town/city, or select Other and enter it."
      );
      return;
    }

    if (
      !isValidNigeriaPostalCode(
        draft.postalCode
      )
    ) {
      setError(
        "Enter a valid 6-digit Nigerian postal code."
      );
      return;
    }

    if (!draft.street.trim()) {
      setError(
        "Enter the street/address details."
      );
      return;
    }

    const now =
      new Date().toISOString();

    onSave({
      id: draft.id,
      label: draft.label,
      recipientName:
        draft.recipientName.trim(),
      email:
        draft.email.trim(),
      phoneNational:
        phone,
      state:
        draft.state,
      lga:
        draft.lga,
      city,
      postalCode:
        normalizeNigeriaPostalCode(
          draft.postalCode
        ),
      street:
        draft.street.trim(),
      building:
        draft.building.trim(),
      landmark:
        draft.landmark.trim(),
      deliveryInstructions:
        draft.deliveryInstructions.trim(),
      isDefault:
        forceDefault ||
        draft.isDefault,
      createdAt:
        draft.createdAt,
      updatedAt:
        now
    });
  }

  return (
    <form
      className="bazaara-address-editor"
      onSubmit={submit}
    >
      <div
        className="bazaara-address-editor-head"
      >
        <div>
          <small>
            NIGERIA DELIVERY ADDRESS
          </small>

          <h2>
            {
              address
                ? "Edit address"
                : "Add address"
            }
          </h2>

          <p>
            State and LGA / Area Council are selected from structured Nigerian administrative data.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close address form"
        >
          ×
        </button>
      </div>

      <div
        className="bazaara-address-form-grid"
      >
        <label>
          <span>
            Address label
          </span>

          <select
            value={draft.label}
            onChange={
              (event) =>
                setField(
                  "label",
                  event.target.value as AddressLabel
                )
            }
          >
            <option value="Home">
              Home
            </option>

            <option value="Work">
              Work
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </label>

        <label>
          <span>
            Recipient name
          </span>

          <input
            value={
              draft.recipientName
            }
            onChange={
              (event) =>
                setField(
                  "recipientName",
                  event.target.value
                )
            }
            autoComplete="name"
            required
          />
        </label>

        <label
          className="bazaara-address-phone-field"
        >
          <span>
            Phone number
          </span>

          <div>
            <strong>
              +234
            </strong>

            <input
              value={
                draft.phoneNational
              }
              onChange={
                (event) =>
                  setField(
                    "phoneNational",
                    normalizeNigeriaPhone(
                      event.target.value
                    )
                  )
              }
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="8012345678"
              maxLength={10}
              required
            />
          </div>

          <small>
            10 digits after +234
          </small>
        </label>

        <label>
          <span>
            Contact email
          </span>

          <input
            type="email"
            value={
              draft.email
            }
            onChange={
              (event) =>
                setField(
                  "email",
                  event.target.value
                )
            }
            autoComplete="email"
            placeholder="Optional"
          />
        </label>

        <label>
          <span>
            Country
          </span>

          <select
            value="Nigeria"
            disabled
          >
            <option>
              Nigeria
            </option>
          </select>
        </label>

        <label>
          <span>
            State / FCT
          </span>

          <select
            value={
              draft.state
            }
            onChange={
              (event) =>
                chooseState(
                  event.target.value
                )
            }
            required
          >
            <option value="">
              Select state / FCT
            </option>

            {
              NIGERIA_STATES.map(
                (state) => (
                  <option
                    value={state.name}
                    key={state.name}
                  >
                    {state.name}
                  </option>
                )
              )
            }
          </select>
        </label>

        <label>
          <span>
            LGA / Area Council
          </span>

          <select
            value={
              draft.lga
            }
            disabled={
              !draft.state
            }
            onChange={
              (event) =>
                chooseLga(
                  event.target.value
                )
            }
            required
          >
            <option value="">
              {
                draft.state
                  ? "Select LGA / Area Council"
                  : "Choose state first"
              }
            </option>

            {
              lgas.map(
                (lga) => (
                  <option
                    value={lga}
                    key={lga}
                  >
                    {lga}
                  </option>
                )
              )
            }
          </select>
        </label>

        <label>
          <span>
            Town / city
          </span>

          <select
            value={
              draft.cityChoice
            }
            disabled={
              !draft.lga
            }
            onChange={
              (event) =>
                setField(
                  "cityChoice",
                  event.target.value
                )
            }
            required
          >
            <option value="">
              {
                draft.lga
                  ? "Choose town / city"
                  : "Choose LGA first"
              }
            </option>

            {
              cityOptions.map(
                (city) => (
                  <option
                    value={city}
                    key={city}
                  >
                    {city}
                  </option>
                )
              )
            }

            <option value="__other__">
              Other town / community
            </option>
          </select>
        </label>

        {
          draft.cityChoice === "__other__"
            ? (
              <label>
                <span>
                  Other town / community
                </span>

                <input
                  value={
                    draft.cityOther
                  }
                  onChange={
                    (event) =>
                      setField(
                        "cityOther",
                        event.target.value
                      )
                  }
                  required
                />
              </label>
            )
            : null
        }

        <label>
          <span>
            Postal code
          </span>

          <input
            value={
              draft.postalCode
            }
            onChange={
              (event) =>
                setField(
                  "postalCode",
                  normalizeNigeriaPostalCode(
                    event.target.value
                  )
                )
            }
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="6-digit postal code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />

          <small
            className="bazaara-address-field-help"
          >
            Nigerian postal codes use 6 digits.
          </small>
        </label>

        <label
          className="bazaara-address-wide"
        >
          <span>
            Street / area address
          </span>

          <input
            value={
              draft.street
            }
            onChange={
              (event) =>
                setField(
                  "street",
                  event.target.value
                )
            }
            autoComplete="street-address"
            placeholder="Street, estate, community or delivery area"
            required
          />
        </label>

        <label>
          <span>
            Building / house / unit
          </span>

          <input
            value={
              draft.building
            }
            onChange={
              (event) =>
                setField(
                  "building",
                  event.target.value
                )
            }
            placeholder="Optional"
          />
        </label>

        <label>
          <span>
            Landmark
          </span>

          <input
            value={
              draft.landmark
            }
            onChange={
              (event) =>
                setField(
                  "landmark",
                  event.target.value
                )
            }
            placeholder="Optional"
          />
        </label>

        <label
          className="bazaara-address-wide"
        >
          <span>
            Delivery instructions
          </span>

          <textarea
            value={
              draft.deliveryInstructions
            }
            onChange={
              (event) =>
                setField(
                  "deliveryInstructions",
                  event.target.value
                )
            }
            rows={3}
            maxLength={400}
            placeholder="Gate, floor, call-on-arrival instructions, etc."
          />
        </label>

        {
          !forceDefault
            ? (
              <label
                className="bazaara-address-default-check bazaara-address-wide"
              >
                <input
                  type="checkbox"
                  checked={
                    draft.isDefault
                  }
                  onChange={
                    (event) =>
                      setField(
                        "isDefault",
                        event.target.checked
                      )
                  }
                />

                <span>
                  Use as my default delivery address
                </span>
              </label>
            )
            : null
        }
      </div>

      {
        error
          ? (
            <p
              className="bazaara-address-error"
              role="alert"
            >
              {error}
            </p>
          )
          : null
      }

      <div
        className="bazaara-address-editor-actions"
      >
        <button
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
        >
          Save address
        </button>
      </div>
    </form>
  );
}
