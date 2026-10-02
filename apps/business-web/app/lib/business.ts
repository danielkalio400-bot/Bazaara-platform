"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@bazaara/api-client";

export type BusinessOrganization = {
  id: string;
  type: string;
  legalName: string;
  displayName: string;
  status: string;
  country: string;
  bTaxId?: string | null;
  verticals: string[];
  merchants?: Array<{
    id: string;
    vertical: string;
    slug: string;
    verifiedAt: string | null;
  }>;
};

export function businessApiBase() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3001";
  return `${origin}/api/bazaara-platform`;
}

export async function businessRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  const api = createApiClient({
    baseUrl: businessApiBase(),
    credentials: "include",
  });
  return api.request<T>(path, {
    method,
    body,
    cache: "no-store",
  });
}

export function useBusinessOrganizations() {
  const [organizations, setOrganizations] = useState<BusinessOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await businessRequest<{ organizations: BusinessOrganization[] }>(
        "/v1/business/organizations",
      );
      setOrganizations(result.organizations);
      setOrganizationId((current) =>
        result.organizations.some((item) => item.id === current)
          ? current
          : result.organizations[0]?.id ?? "",
      );
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const organization = useMemo(
    () =>
      organizations.find((item) => item.id === organizationId) ??
      organizations[0],
    [organizations, organizationId],
  );

  return {
    organizations,
    organization,
    organizationId: organization?.id ?? organizationId,
    setOrganizationId,
    loading,
    error,
    reloadOrganizations: load,
  };
}


export async function uploadBusinessFile(
  file: File,
  visibility: "PRIVATE" | "PUBLIC" = "PUBLIC",
) {
  const reservation = await businessRequest<{
    asset: { id: string };
    upload: {
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    };
  }>("/v1/media/uploads", "POST", {
    contentType: file.type || "application/octet-stream",
    byteSize: file.size,
    visibility,
  });

  const uploaded = await fetch(reservation.upload.url, {
    method: reservation.upload.method,
    headers: {
      "content-type": file.type || "application/octet-stream",
      ...(reservation.upload.headers ?? {}),
    },
    body: file,
  });

  if (!uploaded.ok) throw new Error("File upload failed");

  const completed = await businessRequest<{
    asset: { id: string; status: string; publicUrl: string | null };
  }>(`/v1/media/${reservation.asset.id}/complete`, "POST", {});

  return {
    assetId: completed.asset.id,
    publicUrl:
      visibility === "PUBLIC"
        ? completed.asset.publicUrl ??
          `${businessApiBase()}/v1/media/public/${completed.asset.id}`
        : null,
  };
}
