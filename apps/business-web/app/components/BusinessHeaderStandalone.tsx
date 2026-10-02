"use client";

import { BusinessHeader } from "./BusinessHeader";
import { useBusinessOrganizations } from "../lib/business";

export function BusinessHeaderStandalone({
  active,
}: {
  active: string;
}) {
  const {
    organizations,
    organization,
    organizationId,
    setOrganizationId,
  } = useBusinessOrganizations();

  return (
    <BusinessHeader
      organization={organization}
      organizations={organizations}
      organizationId={organizationId}
      setOrganizationId={setOrganizationId}
      active={active}
    />
  );
}
