"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeader } from "../components/BusinessHeader";
import {
  businessRequest,
  uploadBusinessFile,
  useBusinessOrganizations,
} from "../lib/business";

type Profile = {
  organization: {
    id: string;
    businessNumber: string | null;
    bTaxId: string | null;
    displayName: string;
    legalName: string;
    legalType: string;
    contactEmail: string | null;
    contactPhone: string | null;
    status: string;
    country: string;
  };
  verification: {
    status: string;
    legalType: string;
    registrationNumber: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
    changesRequestedAt: string | null;
  };
  registrations: Array<{
    id: string;
    vertical: string;
    status: string;
  }>;
};

type BranchAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  status: string;
  timezone: string;
  address: BranchAddress | null;
};

type VerificationDocument = {
  id: string;
  type: string;
  fileName: string;
  status: string;
  createdAt: string;
};

const VERTICAL_LABELS: Record<string, string> = {
  SHOPPING: "Shopping",
  FOOD: "Food",
  GROCERY: "Grocery",
  PHARMACY: "Pharmacy",
};

function localPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234")) return `0${digits.slice(3)}`.slice(0, 11);
  return digits.slice(0, 11);
}

function internationalPhone(value: string) {
  const local = localPhone(value);
  if (!local) return "";
  return `+234${local.startsWith("0") ? local.slice(1) : local}`;
}

function mapUrl(latitude?: number, longitude?: number) {
  if (latitude == null || longitude == null) return "";
  const pad = 0.008;
  const bbox = [
    longitude - pad,
    latitude - pad,
    longitude + pad,
    latitude + pad,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export default function BusinessSettings() {
  const business = useBusinessOrganizations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [verification, setVerification] = useState({
    legalType: "INDIVIDUAL",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [branch, setBranch] = useState({
    name: "",
    code: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    latitude: "",
    longitude: "",
  });
  const [documentType, setDocumentType] =
    useState("BUSINESS_REGISTRATION");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!business.organizationId) return;
    try {
      const [profileResult, branchResult, documentResult] = await Promise.all([
        businessRequest<Profile>(
          `/v1/business/advanced/organizations/${business.organizationId}/profile`,
        ),
        businessRequest<{ branches: Branch[] }>(
          `/v1/business/organizations/${business.organizationId}/branches`,
        ),
        businessRequest<{ documents: VerificationDocument[] }>(
          `/v1/business/v25/organizations/${business.organizationId}/verification-documents`,
        ),
      ]);
      setProfile(profileResult);
      setBranches(branchResult.branches);
      setDocuments(documentResult.documents);
      setBrandName(profileResult.organization.displayName);
      setContactEmail(profileResult.organization.contactEmail ?? "");
      setContactPhone(localPhone(profileResult.organization.contactPhone ?? ""));
      setVerification({
        legalType:
          profileResult.verification.legalType ??
          profileResult.organization.legalType ??
          "INDIVIDUAL",
        registrationNumber: profileResult.verification.registrationNumber ?? "",
        contactEmail:
          profileResult.verification.contactEmail ??
          profileResult.organization.contactEmail ??
          "",
        contactPhone: localPhone(
          profileResult.verification.contactPhone ??
            profileResult.organization.contactPhone ??
            "",
        ),
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load settings");
    }
  }, [business.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeTypes = useMemo(
    () => profile?.registrations.filter((item) => item.status !== "CLOSED") ?? [],
    [profile],
  );

  async function saveBrand(event: FormEvent) {
    event.preventDefault();
    setBusy("brand");
    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${business.organizationId}/profile`,
        "PATCH",
        {
          displayName: brandName,
          contactEmail,
          contactPhone: internationalPhone(contactPhone),
        },
      );
      setNotice("Brand profile updated.");
      await Promise.all([load(), business.reloadOrganizations()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save brand");
    } finally {
      setBusy("");
    }
  }

  async function submitVerification(event: FormEvent) {
    event.preventDefault();
    setBusy("verification");
    try {
      await businessRequest(
        `/v1/business/advanced/organizations/${business.organizationId}/verification/submit`,
        "POST",
        {
          legalType: verification.legalType,
          registrationNumber: verification.registrationNumber || undefined,
          contactEmail: verification.contactEmail,
          contactPhone: internationalPhone(verification.contactPhone),
        },
      );
      setNotice("Verification submitted to Operations.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not submit verification",
      );
    } finally {
      setBusy("");
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("This browser does not provide location access.");
      return;
    }
    setBusy("location");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBranch((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));
        setNotice("Current location pinned. Confirm the written address before saving.");
        setBusy("");
      },
      (cause) => {
        setError(cause.message || "Location permission was not granted.");
        setBusy("");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function addBranch(event: FormEvent) {
    event.preventDefault();
    setBusy("branch");
    try {
      await businessRequest(
        `/v1/business/organizations/${business.organizationId}/branches`,
        "POST",
        {
          name: branch.name,
          code: branch.code,
          timezone: "Africa/Lagos",
          address: {
            line1: branch.line1,
            line2: branch.line2 || undefined,
            city: branch.city,
            state: branch.state,
            postalCode: branch.postalCode || undefined,
            latitude: branch.latitude ? Number(branch.latitude) : undefined,
            longitude: branch.longitude ? Number(branch.longitude) : undefined,
          },
        },
      );
      setBranch({
        name: "",
        code: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        latitude: "",
        longitude: "",
      });
      setNotice("Operating location added.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create branch");
    } finally {
      setBusy("");
    }
  }

  async function uploadVerification(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      setError("Verification documents must be 15 MB or smaller.");
      return;
    }
    setBusy("document");
    try {
      const upload = await uploadBusinessFile(file, "PRIVATE");
      await businessRequest(
        `/v1/business/v25/organizations/${business.organizationId}/verification-documents`,
        "POST",
        {
          assetId: upload.assetId,
          type: documentType,
          fileName: file.name,
        },
      );
      setNotice("Verification document uploaded.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload document");
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
        active="settings"
      />

      <main className="business-control-main">
        <section className="business-page-heading business-page-heading-v3">
          <div>
            <span className="business-kicker">SETTINGS</span>
            <h1>Business identity and operating setup.</h1>
            <p>
              BTaxID is generated by Bazaara after Business sign-in. It is a
              Bazaara business tax reference, not a government TIN.
            </p>
          </div>
          <a className="business-secondary-button" href="/team">
            Team & access
          </a>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}
        {notice ? <div className="business-notice">{notice}</div> : null}

        <section className="business-settings-status">
          <div>
            <span>BUSINESS ID</span>
            <strong>{profile?.organization.businessNumber ?? "—"}</strong>
          </div>
          <div>
            <span>BTAXID</span>
            <strong>{profile?.organization.bTaxId ?? business.organization?.bTaxId ?? "Generating…"}</strong>
          </div>
          <div>
            <span>VERIFICATION</span>
            <strong>{profile?.verification.status ?? "—"}</strong>
          </div>
          <div>
            <span>LOCATIONS</span>
            <strong>{branches.length}</strong>
          </div>
        </section>

        <div className="business-settings-grid">
          <section className="business-panel">
            <span className="business-kicker">BRAND PROFILE</span>
            <h2>Customer-facing identity</h2>
            <form className="business-form" onSubmit={saveBrand}>
              <label className="wide">
                Brand name
                <input
                  required
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                />
              </label>
              <label>
                Business email
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </label>
              <label>
                Business phone
                <div className="business-phone-input">
                  <span>+234</span>
                  <input
                    inputMode="tel"
                    placeholder="08012345678"
                    value={contactPhone}
                    onChange={(event) =>
                      setContactPhone(
                        event.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                  />
                </div>
              </label>
              <button className="business-primary-button" disabled={busy === "brand"}>
                {busy === "brand" ? "Saving…" : "Save brand profile"}
              </button>
            </form>
          </section>

          <section className="business-panel">
            <div className="business-section-heading">
              <div>
                <span className="business-kicker">VERIFICATION</span>
                <h2>Legal profile & documents</h2>
              </div>
              <span className="business-soft-pill">
                {profile?.verification.status ?? "SETUP"}
              </span>
            </div>

            <div className="business-btax-card">
              <span>BTaxID</span>
              <strong>{profile?.organization.bTaxId ?? business.organization?.bTaxId ?? "Generating…"}</strong>
              <small>Generated by Bazaara; cannot be edited by the merchant.</small>
            </div>

            <form className="business-form" onSubmit={submitVerification}>
              <label>
                Legal type
                <select
                  value={verification.legalType}
                  onChange={(event) =>
                    setVerification({ ...verification, legalType: event.target.value })
                  }
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="SOLE_TRADER">Sole trader</option>
                  <option value="BUSINESS_NAME">Registered business name</option>
                  <option value="COMPANY">Company</option>
                </select>
              </label>
              <label>
                Registration number
                <input
                  value={verification.registrationNumber}
                  onChange={(event) =>
                    setVerification({
                      ...verification,
                      registrationNumber: event.target.value,
                    })
                  }
                  placeholder="Where applicable"
                />
              </label>
              <label>
                Verification email
                <input
                  required
                  type="email"
                  value={verification.contactEmail}
                  onChange={(event) =>
                    setVerification({
                      ...verification,
                      contactEmail: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Verification phone
                <div className="business-phone-input">
                  <span>+234</span>
                  <input
                    required
                    inputMode="tel"
                    value={verification.contactPhone}
                    onChange={(event) =>
                      setVerification({
                        ...verification,
                        contactPhone: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11),
                      })
                    }
                  />
                </div>
              </label>
              <button
                className="business-primary-button"
                disabled={busy === "verification"}
              >
                {busy === "verification" ? "Submitting…" : "Submit verification"}
              </button>
            </form>

            <div className="business-document-uploader">
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                <option value="BUSINESS_REGISTRATION">Business registration</option>
                <option value="OWNER_ID">Owner ID</option>
                <option value="ADDRESS_PROOF">Address proof</option>
                <option value="FOOD_DOCUMENT">Food-business document</option>
                <option value="PHARMACY_LICENCE">Pharmacy licence</option>
                <option value="OTHER">Other document</option>
              </select>
              <label className="business-secondary-button">
                {busy === "document" ? "Uploading…" : "+ Upload document"}
                <input
                  hidden
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  disabled={busy === "document"}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadVerification(file);
                  }}
                />
              </label>
            </div>

            <div className="business-document-list">
              {documents.map((document) => (
                <div key={document.id}>
                  <div>
                    <strong>{document.fileName}</strong>
                    <small>{document.type.replaceAll("_", " ")}</small>
                  </div>
                  <span className="business-soft-pill">{document.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="business-panel business-location-panel">
          <div className="business-section-heading">
            <div>
              <span className="business-kicker">OPERATING LOCATIONS</span>
              <h2>Branches, addresses and map pins</h2>
            </div>
            <span className="business-soft-pill">{branches.length} saved</span>
          </div>

          <div className="business-location-grid">
            <div>
              <form className="business-form" onSubmit={addBranch}>
                <label>
                  Branch name
                  <input
                    required
                    value={branch.name}
                    onChange={(event) =>
                      setBranch({ ...branch, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Branch code
                  <input
                    required
                    value={branch.code}
                    onChange={(event) =>
                      setBranch({
                        ...branch,
                        code: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
                <label className="wide">
                  Street address
                  <input
                    required
                    value={branch.line1}
                    onChange={(event) =>
                      setBranch({ ...branch, line1: event.target.value })
                    }
                  />
                </label>
                <label>
                  City
                  <input
                    required
                    value={branch.city}
                    onChange={(event) =>
                      setBranch({ ...branch, city: event.target.value })
                    }
                  />
                </label>
                <label>
                  State
                  <input
                    required
                    value={branch.state}
                    onChange={(event) =>
                      setBranch({ ...branch, state: event.target.value })
                    }
                  />
                </label>
                <label>
                  Latitude
                  <input value={branch.latitude} readOnly />
                </label>
                <label>
                  Longitude
                  <input value={branch.longitude} readOnly />
                </label>
                <button
                  type="button"
                  className="business-secondary-button"
                  onClick={useCurrentLocation}
                  disabled={busy === "location"}
                >
                  {busy === "location" ? "Locating…" : "Use current location"}
                </button>
                <button
                  className="business-primary-button"
                  disabled={busy === "branch"}
                >
                  {busy === "branch" ? "Saving…" : "Save operating location"}
                </button>
              </form>
            </div>

            <div className="business-map-card">
              {branch.latitude && branch.longitude ? (
                <iframe
                  title="Operating location map"
                  src={mapUrl(Number(branch.latitude), Number(branch.longitude))}
                  loading="lazy"
                />
              ) : (
                <div className="business-map-placeholder">
                  <strong>Map pin not set</strong>
                  <span>
                    Use current location to place the branch, then confirm the
                    written address.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="business-location-list">
            {branches.map((item) => (
              <article key={item.id}>
                <div>
                  <span
                    className={`business-dot ${
                      item.status === "ACTIVE" ? "good" : ""
                    }`}
                  />
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.address?.line1 ?? "Address not completed"}
                    {item.address?.city ? ` · ${item.address.city}` : ""}
                    {item.address?.state ? `, ${item.address.state}` : ""}
                  </small>
                </div>
                <span>{item.code}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="business-panel">
          <div className="business-section-heading">
            <div>
              <span className="business-kicker">BUSINESS TYPES</span>
              <h2>Registered services</h2>
            </div>
            <a className="business-text-link" href="/register">
              + Add business type
            </a>
          </div>
          <div className="business-registration-list">
            {activeTypes.map((registration) => (
              <article key={registration.id}>
                <div>
                  <strong>
                    {VERTICAL_LABELS[registration.vertical] ?? registration.vertical}
                  </strong>
                  <small>{registration.status}</small>
                </div>
                <a
                  href={
                    registration.vertical === "SHOPPING"
                      ? "/shopping"
                      : registration.vertical === "FOOD"
                        ? "/food"
                        : registration.vertical === "GROCERY"
                          ? "/grocery"
                          : "/pharmacy"
                  }
                >
                  Open
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
