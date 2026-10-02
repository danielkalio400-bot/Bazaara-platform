ALTER TABLE "Organization"
ADD COLUMN "businessNumber" TEXT,
ADD COLUMN "legalType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "brandUpdatedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3);

ALTER TABLE "OrganizationMember"
ADD COLUMN "roleKey" TEXT NOT NULL DEFAULT 'MEMBER',
ADD COLUMN "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "branchIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Organization_businessNumber_key"
ON "Organization"("businessNumber");

CREATE TABLE "BusinessVerification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "legalType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
  "registrationNumber" TEXT,
  "taxId" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DOCUMENTS_REQUIRED',
  "checklist" JSONB,
  "submittedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "changesRequestedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessVerification_organizationId_key"
ON "BusinessVerification"("organizationId");

CREATE INDEX "BusinessVerification_status_updatedAt_idx"
ON "BusinessVerification"("status","updatedAt");

CREATE TABLE "BusinessVerticalRegistration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "vertical" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SETUP',
  "requirements" JSONB,
  "submittedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessVerticalRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessVerticalRegistration_merchantId_key"
ON "BusinessVerticalRegistration"("merchantId");

CREATE UNIQUE INDEX "BusinessVerticalRegistration_organizationId_vertical_key"
ON "BusinessVerticalRegistration"("organizationId","vertical");

CREATE INDEX "BusinessVerticalRegistration_status_updatedAt_idx"
ON "BusinessVerticalRegistration"("status","updatedAt");

CREATE TABLE "BusinessInvitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "branchIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "invitedByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessInvitation_tokenHash_key"
ON "BusinessInvitation"("tokenHash");

CREATE INDEX "BusinessInvitation_organizationId_status_createdAt_idx"
ON "BusinessInvitation"("organizationId","status","createdAt");

CREATE INDEX "BusinessInvitation_normalizedEmail_status_idx"
ON "BusinessInvitation"("normalizedEmail","status");

CREATE TABLE "BusinessCatalogMeta" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "barcode" TEXT,
  "costMinor" BIGINT,
  "weightGrams" INTEGER,
  "returnEligible" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessCatalogMeta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessCatalogMeta_productId_key"
ON "BusinessCatalogMeta"("productId");

CREATE INDEX "BusinessCatalogMeta_barcode_idx"
ON "BusinessCatalogMeta"("barcode");
