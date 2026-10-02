import {
  getNigeriaState,
  isNigeriaLga,
  isNigeriaState
} from "./nigeria-addresses";

export const ADDRESS_BOOK_KEY =
  "bazaara:shopping-address-book:v1";

export const LEGACY_PROFILE_KEY =
  "bazaara:shopping-contact:v1";

export type AddressLabel =
  | "Home"
  | "Work"
  | "Other";

export type ShoppingAddress = {
  id: string;
  label: AddressLabel;
  recipientName: string;
  email: string;
  phoneNational: string;
  state: string;
  lga: string;
  city: string;
  postalCode: string;
  street: string;
  building: string;
  landmark: string;
  deliveryInstructions: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type AddressBookPayload = {
  version: 1;
  addresses: ShoppingAddress[];
};

function browserReady() {
  return typeof window !== "undefined";
}

export function normalizeNigeriaPhone(
  raw: string
) {
  const digits =
    raw.replace(/\D/g, "");

  let national =
    digits;

  if (
    national.startsWith("234") &&
    national.length >= 13
  ) {
    national =
      national.slice(3);
  }

  if (
    national.startsWith("0") &&
    national.length === 11
  ) {
    national =
      national.slice(1);
  }

  return national.slice(0, 10);
}

export function isValidNigeriaPhone(
  raw: string
) {
  return /^\d{10}$/.test(
    normalizeNigeriaPhone(raw)
  );
}

export function normalizeNigeriaPostalCode(
  raw: string
) {
  return raw
    .replace(/\D/g, "")
    .slice(0, 6);
}

export function isValidNigeriaPostalCode(
  raw: string
) {
  return /^\d{6}$/.test(
    normalizeNigeriaPostalCode(raw)
  );
}

export function formatNigeriaPhone(
  raw: string
) {
  const phone =
    normalizeNigeriaPhone(raw);

  if (phone.length !== 10) {
    return "+234 " + phone;
  }

  return (
    `+234 ${phone.slice(0, 3)} ` +
    `${phone.slice(3, 6)} ` +
    `${phone.slice(6)}`
  );
}

function validAddress(
  value: unknown
): value is ShoppingAddress {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item =
    value as Partial<ShoppingAddress>;

  return (
    typeof item.id === "string" &&
    typeof item.recipientName === "string" &&
    typeof item.phoneNational === "string" &&
    typeof item.state === "string" &&
    typeof item.lga === "string" &&
    isNigeriaState(item.state) &&
    isNigeriaLga(
      item.state,
      item.lga
    )
  );
}

function ensureDefault(
  addresses: ShoppingAddress[]
) {
  if (addresses.length === 0) {
    return addresses;
  }

  const defaultIndex =
    addresses.findIndex(
      (address) =>
        address.isDefault
    );

  if (defaultIndex >= 0) {
    return addresses.map(
      (address, index) => ({
        ...address,
        isDefault:
          index === defaultIndex
      })
    );
  }

  return addresses.map(
    (address, index) => ({
      ...address,
      isDefault:
        index === 0
    })
  );
}

export function loadAddressBook() {
  if (!browserReady()) {
    return [] as ShoppingAddress[];
  }

  try {
    const raw =
      window.localStorage.getItem(
        ADDRESS_BOOK_KEY
      );

    if (!raw) {
      return migrateLegacyProfile();
    }

    const parsed =
      JSON.parse(raw) as Partial<AddressBookPayload>;

    const addresses =
      Array.isArray(parsed.addresses)
        ? parsed.addresses
            .filter(
              validAddress
            )
            .map(
              (address) => ({
                ...address,
                postalCode:
                  typeof (
                    address as ShoppingAddress & {
                      postalCode?: string;
                    }
                  ).postalCode === "string"
                    ? (
                        address as ShoppingAddress & {
                          postalCode?: string;
                        }
                      ).postalCode ?? ""
                    : ""
              })
            )
        : [];

    return ensureDefault(addresses);
  }
  catch {
    return [] as ShoppingAddress[];
  }
}

export function saveAddressBook(
  addresses: ShoppingAddress[]
) {
  if (!browserReady()) {
    return;
  }

  const safe =
    ensureDefault(addresses);

  const payload: AddressBookPayload = {
    version: 1,
    addresses: safe
  };

  window.localStorage.setItem(
    ADDRESS_BOOK_KEY,
    JSON.stringify(payload)
  );
}

export function getDefaultAddress(
  addresses: ShoppingAddress[]
) {
  return (
    addresses.find(
      (address) =>
        address.isDefault
    ) ??
    addresses[0] ??
    null
  );
}

export function setDefaultAddress(
  addresses: ShoppingAddress[],
  id: string
) {
  const next =
    addresses.map(
      (address) => ({
        ...address,
        isDefault:
          address.id === id,
        updatedAt:
          address.id === id
            ? new Date().toISOString()
            : address.updatedAt
      })
    );

  saveAddressBook(next);

  return next;
}

export function deleteAddress(
  addresses: ShoppingAddress[],
  id: string
) {
  const next =
    ensureDefault(
      addresses.filter(
        (address) =>
          address.id !== id
      )
    );

  saveAddressBook(next);

  return next;
}

export function upsertAddress(
  addresses: ShoppingAddress[],
  address: ShoppingAddress
) {
  const exists =
    addresses.some(
      (item) =>
        item.id === address.id
    );

  let next =
    exists
      ? addresses.map(
          (item) =>
            item.id === address.id
              ? address
              : item
        )
      : [
          ...addresses,
          address
        ];

  if (address.isDefault) {
    next =
      next.map(
        (item) => ({
          ...item,
          isDefault:
            item.id === address.id
        })
      );
  }

  next =
    ensureDefault(next);

  saveAddressBook(next);

  return next;
}

export function createAddressId() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return (
    `addr-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2)
  );
}

function migrateLegacyProfile() {
  if (!browserReady()) {
    return [] as ShoppingAddress[];
  }

  try {
    const raw =
      window.localStorage.getItem(
        LEGACY_PROFILE_KEY
      );

    if (!raw) {
      return [] as ShoppingAddress[];
    }

    const profile =
      JSON.parse(raw) as Record<string, unknown>;

    const state =
      typeof profile.region === "string"
        ? profile.region
        : "";

    const lga =
      typeof profile.district === "string"
        ? profile.district
        : "";

    if (
      !isNigeriaState(state) ||
      !isNigeriaLga(state, lga)
    ) {
      return [] as ShoppingAddress[];
    }

    const now =
      new Date().toISOString();

    const stateData =
      getNigeriaState(state);

    const address: ShoppingAddress = {
      id: createAddressId(),
      label: "Home",
      recipientName:
        typeof profile.fullName === "string"
          ? profile.fullName
          : "",
      email:
        typeof profile.email === "string"
          ? profile.email
          : "",
      phoneNational:
        normalizeNigeriaPhone(
          typeof profile.phone === "string"
            ? profile.phone
            : ""
        ),
      state,
      lga,
      city:
        typeof profile.city === "string" &&
        profile.city.trim()
          ? profile.city.trim()
          : stateData?.capital ?? lga,
      postalCode:
        typeof profile.postalCode === "string"
          ? normalizeNigeriaPostalCode(
              profile.postalCode
            )
          : "",
      street:
        typeof profile.street === "string"
          ? profile.street
          : "",
      building:
        typeof profile.building === "string"
          ? profile.building
          : "",
      landmark:
        typeof profile.landmark === "string"
          ? profile.landmark
          : "",
      deliveryInstructions:
        typeof profile.deliveryInstructions === "string"
          ? profile.deliveryInstructions
          : "",
      isDefault: true,
      createdAt: now,
      updatedAt: now
    };

    if (
      !address.recipientName ||
      !isValidNigeriaPhone(
        address.phoneNational
      )
    ) {
      return [] as ShoppingAddress[];
    }

    saveAddressBook([
      address
    ]);

    return [
      address
    ];
  }
  catch {
    return [] as ShoppingAddress[];
  }
}
