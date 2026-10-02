-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('GUEST', 'CONTACT_VERIFIED', 'IDENTITY_VERIFIED', 'FINANCIAL_VERIFIED', 'BUSINESS_VERIFIED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SELLER', 'RESTAURANT', 'GROCERY_MERCHANT', 'PHARMACY', 'LOGISTICS_FLEET', 'BUSINESS_CUSTOMER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ShoppingCheckoutStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShoppingOrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ShoppingPaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "ShoppingSellerOrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'PICKING', 'PROCESSING', 'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLATION_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ShoppingReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURN_LABEL_CREATED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShoppingCancellationRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'LABEL_CREATED', 'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'REDELIVERY_SCHEDULED', 'RETURN_TO_SENDER', 'RETURNED_TO_SENDER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShoppingReturnDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_CUSTOMER', 'RESOLVED_MERCHANT', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_ACTION', 'PROCESSING', 'REQUIRES_CAPTURE', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentAuthorizationStatus" AS ENUM ('AUTHORIZED', 'CAPTURED', 'VOIDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentCaptureStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentWebhookStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'PROCESSED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY');

-- CreateEnum
CREATE TYPE "PromotionScope" AS ENUM ('PLATFORM', 'CATEGORY', 'PRODUCT', 'SELLER');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "PromotionActivation" AS ENUM ('CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PromotionApplicationSource" AS ENUM ('CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PromotionApplicationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReviewReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "FoodCartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "FoodFulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "FoodOrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'WAITING_STAFF', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportCasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportMessageKind" AS ENUM ('CUSTOMER', 'STAFF', 'AI', 'INTERNAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskSignalStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'GUEST',
    "displayName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "PasswordCredential_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "authenticatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NativeAuthorizationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL DEFAULT 'S256',
    "scope" TEXT NOT NULL DEFAULT 'openid profile',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NativeAuthorizationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NativeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'openid profile',
    "deviceId" TEXT,
    "deviceLabel" TEXT,
    "userAgent" TEXT,
    "accessTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "NativeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "organizationId" TEXT,
    "scopeKey" TEXT NOT NULL DEFAULT 'platform',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "label" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "street" TEXT,
    "building" TEXT,
    "unit" TEXT,
    "postcode" TEXT,
    "landmark" TEXT,
    "deliveryInstructions" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "placeIdentifier" TEXT,
    "contactPhone" TEXT,
    "isApproximate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "country" TEXT NOT NULL,
    "businessNumber" TEXT,
    "bTaxId" TEXT,
    "legalType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "brandUpdatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roleKey" TEXT NOT NULL DEFAULT 'MEMBER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "branchIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "fulfillmentModes" TEXT[] DEFAULT ARRAY['STANDARD']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "ownerKey" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "walletId" TEXT,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "internalReference" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "ledgerTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "legacyPaymentId" TEXT,
    "clientReference" TEXT NOT NULL,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT_METHOD',
    "paymentMethod" TEXT NOT NULL,
    "provider" TEXT,
    "providerReference" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "capturedMinor" BIGINT NOT NULL DEFAULT 0,
    "refundedMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "metadata" JSONB,
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "succeededAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "providerReference" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "nextRetryAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuthorization" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "paymentAttemptId" TEXT,
    "providerReference" TEXT,
    "status" "PaymentAuthorizationStatus" NOT NULL DEFAULT 'AUTHORIZED',
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCapture" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "paymentAttemptId" TEXT,
    "paymentAuthorizationId" TEXT,
    "providerReference" TEXT,
    "status" "PaymentCaptureStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "shoppingReturnId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "provider" TEXT,
    "providerReference" TEXT,
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFailure" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "paymentAttemptId" TEXT,
    "stage" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "PaymentWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "signatureHash" TEXT,
    "payloadHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "reportedStatus" TEXT NOT NULL,
    "reportedAmountMinor" BIGINT,
    "expectedAmountMinor" BIGINT,
    "differenceMinor" BIGINT,
    "reportedCurrency" TEXT,
    "expectedCurrency" TEXT,
    "source" TEXT NOT NULL,
    "actorUserId" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "actorId" TEXT,
    "actorScope" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "priceMinor" BIGINT NOT NULL,
    "compareAtPriceMinor" BIGINT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "attributes" JSONB,
    "priceMinor" BIGINT NOT NULL,
    "compareAtPriceMinor" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductMediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "priceMinorAtAdd" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestTokenHash" TEXT,
    "vertical" TEXT NOT NULL DEFAULT 'SHOPPING',
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "vertical" TEXT NOT NULL DEFAULT 'SHOPPING',
    "pickupStoreId" TEXT,
    "groceryDeliverySlotId" TEXT,
    "status" "ShoppingCheckoutStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL,
    "subtotalMinor" BIGINT NOT NULL,
    "serviceFeeBps" INTEGER NOT NULL DEFAULT 0,
    "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "shippingMinor" BIGINT NOT NULL DEFAULT 0,
    "deliveryPlatformShareMinor" BIGINT NOT NULL DEFAULT 0,
    "deliveryGoShareMinor" BIGINT NOT NULL DEFAULT 0,
    "taxMinor" BIGINT NOT NULL DEFAULT 0,
    "discountMinor" BIGINT NOT NULL DEFAULT 0,
    "promotionId" TEXT,
    "promotionCode" TEXT,
    "totalMinor" BIGINT NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PAY_ON_DELIVERY',
    "deliveryMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCheckoutItem" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "lineTotalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingCheckoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "paymentId" TEXT,
    "vertical" TEXT NOT NULL DEFAULT 'SHOPPING',
    "pickupStoreId" TEXT,
    "groceryDeliverySlotId" TEXT,
    "status" "ShoppingOrderStatus" NOT NULL DEFAULT 'PLACED',
    "paymentStatus" "ShoppingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL,
    "subtotalMinor" BIGINT NOT NULL,
    "serviceFeeBps" INTEGER NOT NULL DEFAULT 0,
    "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "shippingMinor" BIGINT NOT NULL DEFAULT 0,
    "deliveryPlatformShareMinor" BIGINT NOT NULL DEFAULT 0,
    "deliveryGoShareMinor" BIGINT NOT NULL DEFAULT 0,
    "taxMinor" BIGINT NOT NULL DEFAULT 0,
    "discountMinor" BIGINT NOT NULL DEFAULT 0,
    "promotionId" TEXT,
    "promotionCode" TEXT,
    "totalMinor" BIGINT NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "scheduledFor" TIMESTAMP(3),
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingSellerOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "ShoppingSellerOrderStatus" NOT NULL DEFAULT 'PLACED',
    "subtotalMinor" BIGINT NOT NULL,
    "shippingMinor" BIGINT NOT NULL DEFAULT 0,
    "totalMinor" BIGINT NOT NULL,
    "assignedToUserId" TEXT,
    "fulfillmentDueAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "pickingStartedAt" TIMESTAMP(3),
    "packedAt" TIMESTAMP(3),
    "readyToShipAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingSellerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingOrderItem" (
    "id" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "lineTotalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingReturn" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerOrderId" TEXT,
    "merchantId" TEXT,
    "status" "ShoppingReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "eligibilityExpiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "returnCarrier" TEXT,
    "returnService" TEXT,
    "returnTrackingId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "inspectedAt" TIMESTAMP(3),
    "requestedRefundMinor" BIGINT,
    "approvedRefundMinor" BIGINT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "inspectedQuantity" INTEGER,
    "inspectionOutcome" TEXT,
    "conditionNotes" TEXT,
    "refundableAmountMinor" BIGINT,
    "restockApproved" BOOLEAN,

    CONSTRAINT "ShoppingReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingReturnEvidence" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingReturnEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingReturnEvent" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" "ShoppingReturnStatus",
    "toStatus" "ShoppingReturnStatus",
    "actorUserId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingReturnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingReturnDispute" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "status" "ShoppingReturnDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "openedByUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingReturnDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCancellationRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerOrderId" TEXT,
    "status" "ShoppingCancellationRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "carrier" TEXT,
    "service" TEXT,
    "trackingIdentifier" TEXT,
    "labelUrl" TEXT,
    "estimatedDeliveryAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "location" TEXT,
    "actorUserId" TEXT,
    "externalEventId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "scope" "PromotionScope" NOT NULL DEFAULT 'PLATFORM',
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "activation" "PromotionActivation" NOT NULL DEFAULT 'CODE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "percentOff" INTEGER,
    "amountOffMinor" BIGINT,
    "maxDiscountMinor" BIGINT,
    "minimumSubtotalMinor" BIGINT NOT NULL DEFAULT 0,
    "budgetMinor" BIGINT,
    "usageLimit" INTEGER,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "customerSegments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibleCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibleRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedMerchantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowStacking" BOOLEAN NOT NULL DEFAULT false,
    "stackGroup" TEXT,
    "fraudRules" JSONB,
    "categoryId" TEXT,
    "productId" TEXT,
    "merchantId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "moderationReason" TEXT,
    "editDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "moderationReason" TEXT,
    "editDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionApplication" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "checkoutId" TEXT,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "source" "PromotionApplicationSource" NOT NULL,
    "status" "PromotionApplicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionAttempt" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT,
    "checkoutId" TEXT,
    "userId" TEXT,
    "code" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "requestFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMedia" (
    "id" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "type" "ReviewMediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMerchantResponse" (
    "id" TEXT NOT NULL,
    "productReviewId" TEXT,
    "sellerReviewId" TEXT,
    "merchantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewMerchantResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originalQuery" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "recoveredQuery" TEXT,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryCustomerPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "freshnessNotes" TEXT,
    "contactPreference" TEXT NOT NULL DEFAULT 'CHAT',
    "leaveAtDoor" BOOLEAN NOT NULL DEFAULT false,
    "maxReplacementPricePercent" INTEGER NOT NULL DEFAULT 10,
    "substitutionPolicy" TEXT NOT NULL DEFAULT 'BEST_MATCH',
    "preferredFulfillment" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryCustomerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryCartItemPreference" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "substitutionPolicy" TEXT NOT NULL DEFAULT 'BEST_MATCH',
    "replacementVariantId" TEXT,
    "pickerNote" TEXT,
    "maxPriceIncreasePercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryCartItemPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryListCollaborator" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryListCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryStoreConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "expressEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pickerChatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weightedItemsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumOrderMinor" BIGINT NOT NULL DEFAULT 0,
    "maxActiveOrders" INTEGER NOT NULL DEFAULT 40,
    "prepMinutes" INTEGER NOT NULL DEFAULT 20,
    "freeDeliveryThresholdMinor" BIGINT,
    "membershipDiscountBps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryStoreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryDeliverySlot" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryDeliverySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryRecurringBasket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryRecurringBasket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryRecurringBasketItem" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GroceryRecurringBasketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "points" INTEGER NOT NULL DEFAULT 0,
    "freeDeliveryUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryGroupCart" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "spendingLimitMinor" BIGINT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryGroupCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryGroupCartMember" (
    "id" TEXT NOT NULL,
    "groupCartId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentAllocationMinor" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryGroupCartMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryPickerSession" (
    "id" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "pickerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryPickerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryPickerItemOutcome" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedQuantity" INTEGER NOT NULL,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0,
    "actualWeightGrams" INTEGER,
    "finalUnitPriceMinor" BIGINT,
    "replacementVariantId" TEXT,
    "replacementQuantity" INTEGER,
    "customerDecision" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryPickerItemOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryPickerMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'TEXT',
    "text" TEXT,
    "mediaKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryPickerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryIssue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerOrderId" TEXT,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "details" TEXT,
    "requestedAmountMinor" BIGINT,
    "approvedAmountMinor" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryOrderPreferenceSnapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryOrderPreferenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodRestaurant" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "logoImageUrl" TEXT,
    "cuisineTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceBand" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "asapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduledEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "minOrderMinor" BIGINT NOT NULL DEFAULT 0,
    "estimatedDeliveryMin" INTEGER NOT NULL DEFAULT 25,
    "estimatedDeliveryMax" INTEGER NOT NULL DEFAULT 45,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.6,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "acceptingOrders" BOOLEAN NOT NULL DEFAULT true,
    "maxActiveOrders" INTEGER NOT NULL DEFAULT 30,
    "prepTimeBufferMin" INTEGER NOT NULL DEFAULT 0,
    "preorderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pauseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOpeningHour" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openMinute" INTEGER NOT NULL,
    "closeMinute" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FoodOpeningHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodMenuSection" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FoodMenuSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodMenuItem" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "priceMinor" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "soldOut" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prepMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodModifierGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FoodModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodModifierOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDeltaMinor" BIGINT NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FoodModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCart" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT,
    "guestTokenHash" TEXT,
    "status" "FoodCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "fulfillmentType" "FoodFulfillmentType" NOT NULL DEFAULT 'DELIVERY',
    "scheduledFor" TIMESTAMP(3),
    "cutleryRequired" BOOLEAN NOT NULL DEFAULT false,
    "contactless" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAddress" JSONB,
    "note" TEXT,
    "tipMinor" BIGINT NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "discountMinor" BIGINT NOT NULL DEFAULT 0,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "giftMessage" TEXT,
    "groupOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "configurationKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selectedModifiers" JSONB,
    "specialInstructions" TEXT,
    "unitPriceMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" "FoodOrderStatus" NOT NULL DEFAULT 'PLACED',
    "fulfillmentType" "FoodFulfillmentType" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "cutleryRequired" BOOLEAN NOT NULL DEFAULT false,
    "contactless" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAddress" JSONB,
    "note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "subtotalMinor" BIGINT NOT NULL,
    "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "tipMinor" BIGINT NOT NULL DEFAULT 0,
    "discountMinor" BIGINT NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "totalMinor" BIGINT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BAZAARA_PAY',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "giftMessage" TEXT,
    "groupOrderId" TEXT,
    "deliveryPinHash" TEXT,
    "deliveryPinVerifiedAt" TIMESTAMP(3),
    "courierUserId" TEXT,
    "courierAssignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "lineTotalMinor" BIGINT NOT NULL,
    "selectedModifiers" JSONB,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodRestaurantFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodRestaurantFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodMenuItemFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodMenuItemFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPromotion" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "minSubtotalMinor" BIGINT NOT NULL DEFAULT 0,
    "maxDiscountMinor" BIGINT,
    "fundingSource" TEXT NOT NULL DEFAULT 'MERCHANT',
    "merchantFundingBps" INTEGER NOT NULL DEFAULT 10000,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodMenuAvailabilityWindow" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'REGULAR',
    "minLeadMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 7,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FoodMenuAvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodGroupOrder" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "spendingLimitMinor" BIGINT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodGroupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodGroupOrderMember" (
    "id" TEXT NOT NULL,
    "groupOrderId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allocationMinor" BIGINT,
    "contributionStatus" TEXT NOT NULL DEFAULT 'UNALLOCATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodGroupOrderMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrderEconomics" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "serviceFeeBps" INTEGER NOT NULL,
    "serviceFeeMinimumMinor" BIGINT NOT NULL,
    "serviceFeeMaximumMinor" BIGINT NOT NULL,
    "merchantCommissionBps" INTEGER NOT NULL,
    "merchantCommissionMinor" BIGINT NOT NULL,
    "merchantFundedDiscountMinor" BIGINT NOT NULL DEFAULT 0,
    "bazaaraFundedDiscountMinor" BIGINT NOT NULL DEFAULT 0,
    "merchantNetMinor" BIGINT NOT NULL,
    "courierGrossMinor" BIGINT NOT NULL DEFAULT 0,
    "goCommissionBps" INTEGER NOT NULL,
    "goCommissionMinor" BIGINT NOT NULL DEFAULT 0,
    "courierNetMinor" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodOrderEconomics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCommissionPolicy" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "restaurantId" TEXT,
    "merchantCommissionBps" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCommissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrderTrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodOrderTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "text" TEXT,
    "mediaKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodOrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "foodRating" INTEGER,
    "deliveryRating" INTEGER,
    "text" TEXT,
    "photoKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restaurantReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSupportIssue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "details" TEXT NOT NULL,
    "requestedRefundMinor" BIGINT,
    "approvedRefundMinor" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodSupportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushDeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'EXPO',
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "templateKey" TEXT,
    "destination" TEXT,
    "provider" TEXT,
    "providerReference" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'CONSUMER',
    "region" TEXT NOT NULL DEFAULT 'NG',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "slaDueAt" TIMESTAMP(3),
    "context" JSONB,
    "orderId" TEXT,
    "foodOrderId" TEXT,
    "foodRestaurantId" TEXT,
    "productId" TEXT,
    "paymentIntentId" TEXT,
    "shipmentId" TEXT,
    "shoppingReturnId" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportCasePriority" NOT NULL DEFAULT 'NORMAL',
    "assignedToUserId" TEXT,
    "escalationReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "kind" "SupportMessageKind" NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "merchantId" TEXT,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "RiskSignalStatus" NOT NULL DEFAULT 'OPEN',
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pickup" JSONB NOT NULL,
    "dropoff" JSONB NOT NULL,
    "serviceLevel" TEXT NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "distanceMeters" INTEGER,
    "etaMinutes" INTEGER NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogisticsQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsBooking" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "scheduledFor" TIMESTAMP(3),
    "assignedCourierUserId" TEXT,
    "pickupVerificationHash" TEXT NOT NULL,
    "deliveryVerificationHash" TEXT NOT NULL,
    "proof" JSONB,
    "fundingStatus" TEXT NOT NULL DEFAULT 'UNFUNDED',
    "amountPaidMinor" BIGINT NOT NULL DEFAULT 0,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 1500,
    "platformFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "courierPayoutMinor" BIGINT NOT NULL DEFAULT 0,
    "escrowLedgerAccountId" TEXT,
    "fundingLedgerTransactionId" TEXT,
    "settlementLedgerTransactionId" TEXT,
    "refundLedgerTransactionId" TEXT,
    "cancelReason" TEXT,
    "failedReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastCourierLocation" JSONB,
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LogisticsBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsBookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogisticsBookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivePricingQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pickup" JSONB NOT NULL,
    "dropoff" JSONB NOT NULL,
    "rideClass" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "baseFareMinor" BIGINT NOT NULL,
    "distanceFareMinor" BIGINT NOT NULL,
    "timeFareMinor" BIGINT NOT NULL,
    "subtotalMinor" BIGINT NOT NULL,
    "fuelAdjustmentMinor" BIGINT NOT NULL DEFAULT 0,
    "demandAdjustmentMinor" BIGINT NOT NULL DEFAULT 0,
    "tollsMinor" BIGINT NOT NULL DEFAULT 0,
    "feesMinor" BIGINT NOT NULL DEFAULT 0,
    "discountsMinor" BIGINT NOT NULL DEFAULT 0,
    "surgeBps" INTEGER NOT NULL DEFAULT 10000,
    "fuelIndexBps" INTEGER NOT NULL DEFAULT 10000,
    "fuelPricePerLitreMinor" BIGINT,
    "fuelReferencePricePerLitreMinor" BIGINT,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 1500,
    "platformFeeMinor" BIGINT NOT NULL,
    "driverEarningsMinor" BIGINT NOT NULL,
    "totalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "pricingRuleVersion" TEXT NOT NULL DEFAULT 'drive-v2.0',
    "pricingSnapshot" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrivePricingQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveRide" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "riderUserId" TEXT NOT NULL,
    "driverUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "riderPinHash" TEXT NOT NULL,
    "driverOfferMinor" BIGINT,
    "scheduledFor" TIMESTAMP(3),
    "pickupNotes" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'WALLET',
    "fareFundingStatus" TEXT NOT NULL DEFAULT 'UNFUNDED',
    "fundedAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 1500,
    "platformChargeMinor" BIGINT NOT NULL DEFAULT 0,
    "driverEarningsMinor" BIGINT NOT NULL DEFAULT 0,
    "platformChargeSecuredAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "searchRadiusMeters" INTEGER NOT NULL DEFAULT 2000,
    "matchingAttempt" INTEGER NOT NULL DEFAULT 0,
    "callUnlockedAt" TIMESTAMP(3),
    "actualDropoffLatitude" DOUBLE PRECISION,
    "actualDropoffLongitude" DOUBLE PRECISION,
    "actualDropoffDistanceMeters" INTEGER,
    "dropoffOverrideReason" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveRide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveRideEvent" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveRideEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveDriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "availability" TEXT NOT NULL DEFAULT 'OFFLINE',
    "serviceClasses" TEXT[] DEFAULT ARRAY['GO']::TEXT[],
    "maxPickupDistanceMeters" INTEGER NOT NULL DEFAULT 5000,
    "maxPickupEtaSeconds" INTEGER NOT NULL DEFAULT 600,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "locationAccuracyMeters" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "destinationMode" JSONB,
    "preferredAreas" JSONB,
    "ratingAverage" DECIMAL(3,2),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "walletBalanceMinor" BIGINT NOT NULL DEFAULT 0,
    "platformDebtMinor" BIGINT NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveDriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveVehicle" (
    "id" TEXT NOT NULL,
    "driverProfileId" TEXT NOT NULL,
    "rideClass" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inspectionDueAt" TIMESTAMP(3),
    "insuranceDueAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveDriverDocument" (
    "id" TEXT NOT NULL,
    "driverProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assetId" TEXT,
    "documentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveDriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveDispatchOffer" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "pickupDistanceMeters" INTEGER NOT NULL,
    "pickupEtaSeconds" INTEGER NOT NULL,
    "searchRadiusMeters" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveDispatchOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFareHold" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "riderUserId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'WALLET',
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "reservationReference" TEXT NOT NULL,
    "settlement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "DriveFareHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveDriverLedgerEntry" (
    "id" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "rideId" TEXT,
    "type" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "balanceAfterMinor" BIGINT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveDriverLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveDriverPenalty" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "baseAmountMinor" BIGINT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveDriverPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFuelPrice" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'PMS',
    "priceMinorPerLitre" BIGINT NOT NULL,
    "referencePriceMinorPerLitre" BIGINT NOT NULL,
    "indexBps" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveFuelPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayTransfer" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "feeMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ledgerTransactionId" TEXT,
    "idempotencyKey" TEXT,
    "note" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayFundingIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "providerReference" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "checkoutUrl" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PayFundingIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayProfile" (
    "userId" TEXT NOT NULL,
    "payTag" TEXT NOT NULL,
    "pinHash" TEXT,
    "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "dailyTransferLimitMinor" BIGINT NOT NULL DEFAULT 50000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PayBeneficiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayMoneyRequest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterWalletId" TEXT NOT NULL,
    "payerUserId" TEXT,
    "payerWalletId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ledgerTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PayMoneyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayBankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumberLast4" TEXT NOT NULL,
    "providerRecipientCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "providerReference" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "ledgerTransactionId" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "PayWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayFixedSavings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lockUntil" TIMESTAMP(3) NOT NULL,
    "annualRateBps" INTEGER,
    "provider" TEXT,
    "providerReference" TEXT,
    "ledgerAccountId" TEXT,
    "fundingLedgerTransactionId" TEXT,
    "releaseLedgerTransactionId" TEXT,
    "pledgedLoanApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "PayFixedSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayLoanApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "termDays" INTEGER NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PARTNER',
    "pledgedSavingsId" TEXT,
    "lenderName" TEXT,
    "lenderReference" TEXT,
    "offeredPrincipalMinor" BIGINT,
    "interestBps" INTEGER,
    "feeMinor" BIGINT,
    "totalRepaymentMinor" BIGINT,
    "repaymentFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offeredAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PayLoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "BusinessVerificationDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPayoutAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumberLast4" TEXT NOT NULL,
    "providerRecipientCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWithdrawal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "payoutAccountId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "providerReference" TEXT,
    "ledgerTransactionId" TEXT,
    "failureMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "BusinessWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessBranch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessApiCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWebhookEndpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "signingKeyId" TEXT NOT NULL,
    "events" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseStatus" INTEGER,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "subtotalMinor" BIGINT NOT NULL,
    "taxMinor" BIGINT NOT NULL DEFAULT 0,
    "totalMinor" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lines" JSONB NOT NULL,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettlement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "grossMinor" BIGINT NOT NULL,
    "feeMinor" BIGINT NOT NULL DEFAULT 0,
    "netMinor" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerRef" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyProduct" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "brand" TEXT,
    "activeIngredient" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyMerchantProfile" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "regulator" TEXT NOT NULL DEFAULT 'PCN',
    "licenceNumber" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pharmacistInChargeUserId" TEXT,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "consultationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyMerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyPharmacistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "regulator" TEXT NOT NULL DEFAULT 'PCN',
    "licenceNumber" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyPharmacistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyInventoryBatch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "lotNumber" TEXT,
    "quantityOnHand" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierName" TEXT,
    "costMinor" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyInventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyPrescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "jurisdiction" TEXT NOT NULL,
    "documentAssetId" TEXT,
    "prescriber" JSONB,
    "items" JSONB,
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyPrescriptionEvent" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyPrescriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "fulfillmentType" TEXT NOT NULL DEFAULT 'DELIVERY',
    "deliveryAddress" JSONB,
    "subtotalMinor" BIGINT NOT NULL,
    "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "serviceFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "discountMinor" BIGINT NOT NULL DEFAULT 0,
    "totalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "priceConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "lineTotalMinor" BIGINT NOT NULL,
    "requiresPrescription" BOOLEAN NOT NULL,
    "substitutionForItemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacySubstitutionProposal" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "originalItemId" TEXT NOT NULL,
    "proposedProductId" TEXT NOT NULL,
    "pharmacistUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priceDeltaMinor" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerDecisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacySubstitutionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyRefillPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "prescriptionId" TEXT,
    "cadenceDays" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyRefillPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsCompetition" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsFixture" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "homeName" TEXT NOT NULL,
    "awayName" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "clock" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsFixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "organizationId" TEXT,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "variants" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "region" TEXT,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "region" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "resultAssetId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventName" TEXT NOT NULL,
    "vertical" TEXT,
    "region" TEXT,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" BIGINT NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "points" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationAggregate" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DECIMAL(3,2),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "riskBand" TEXT NOT NULL DEFAULT 'NORMAL',
    "components" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalConfig" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "rules" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegionalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_email_key" ON "UserEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_normalized_key" ON "UserEmail"("normalized");

-- CreateIndex
CREATE INDEX "UserEmail_userId_isPrimary_idx" ON "UserEmail"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserPhone_e164_key" ON "UserPhone"("e164");

-- CreateIndex
CREATE INDEX "UserPhone_userId_isPrimary_idx" ON "UserPhone"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_status_expiresAt_idx" ON "Session"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NativeAuthorizationCode_codeHash_key" ON "NativeAuthorizationCode"("codeHash");

-- CreateIndex
CREATE INDEX "NativeAuthorizationCode_userId_expiresAt_idx" ON "NativeAuthorizationCode"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "NativeAuthorizationCode_clientId_expiresAt_idx" ON "NativeAuthorizationCode"("clientId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NativeSession_accessTokenHash_key" ON "NativeSession"("accessTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "NativeSession_refreshTokenHash_key" ON "NativeSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "NativeSession_userId_status_refreshExpiresAt_idx" ON "NativeSession"("userId", "status", "refreshExpiresAt");

-- CreateIndex
CREATE INDEX "NativeSession_accessExpiresAt_idx" ON "NativeSession"("accessExpiresAt");

-- CreateIndex
CREATE INDEX "NativeSession_refreshExpiresAt_idx" ON "NativeSession"("refreshExpiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_createdAt_idx" ON "LoginAttempt"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_organizationId_userId_idx" ON "UserRole"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_scopeKey_key" ON "UserRole"("userId", "roleId", "scopeKey");

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Address_organizationId_createdAt_idx" ON "Address"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_businessNumber_key" ON "Organization"("businessNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_bTaxId_key" ON "Organization"("bTaxId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE INDEX "Merchant_organizationId_vertical_idx" ON "Merchant"("organizationId", "vertical");

-- CreateIndex
CREATE INDEX "Store_merchantId_status_idx" ON "Store"("merchantId", "status");

-- CreateIndex
CREATE INDEX "Wallet_userId_currency_idx" ON "Wallet"("userId", "currency");

-- CreateIndex
CREATE INDEX "Wallet_organizationId_currency_idx" ON "Wallet"("organizationId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_ownerKey_currency_key" ON "Wallet"("ownerKey", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_walletId_currency_idx" ON "LedgerAccount"("walletId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_reference_key" ON "LedgerTransaction"("reference");

-- CreateIndex
CREATE INDEX "LedgerTransaction_createdAt_kind_idx" ON "LedgerTransaction"("createdAt", "kind");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_internalReference_key" ON "Payment"("internalReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_ledgerTransactionId_key" ON "Payment"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_provider_providerReference_idx" ON "Payment"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_orderId_key" ON "PaymentIntent"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_legacyPaymentId_key" ON "PaymentIntent"("legacyPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_clientReference_key" ON "PaymentIntent"("clientReference");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_createdAt_idx" ON "PaymentIntent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_provider_providerReference_idx" ON "PaymentIntent"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "PaymentAttempt_provider_providerReference_idx" ON "PaymentAttempt"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_nextRetryAt_idx" ON "PaymentAttempt"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_paymentIntentId_attemptNumber_key" ON "PaymentAttempt"("paymentIntentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_paymentIntentId_idempotencyKey_key" ON "PaymentAttempt"("paymentIntentId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentAuthorization_paymentIntentId_status_authorizedAt_idx" ON "PaymentAuthorization"("paymentIntentId", "status", "authorizedAt");

-- CreateIndex
CREATE INDEX "PaymentAuthorization_providerReference_idx" ON "PaymentAuthorization"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentCapture_paymentIntentId_status_createdAt_idx" ON "PaymentCapture"("paymentIntentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentCapture_providerReference_idx" ON "PaymentCapture"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentRefund_shoppingReturnId_status_idx" ON "PaymentRefund"("shoppingReturnId", "status");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_createdAt_idx" ON "PaymentRefund"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRefund_provider_providerReference_idx" ON "PaymentRefund"("provider", "providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_paymentIntentId_idempotencyKey_key" ON "PaymentRefund"("paymentIntentId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentFailure_paymentIntentId_createdAt_idx" ON "PaymentFailure"("paymentIntentId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentFailure_code_createdAt_idx" ON "PaymentFailure"("code", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_provider_status_receivedAt_idx" ON "PaymentWebhookEvent"("provider", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_paymentIntentId_observedAt_idx" ON "PaymentReconciliation"("paymentIntentId", "observedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_provider_providerReference_observedAt_idx" ON "PaymentReconciliation"("provider", "providerReference", "observedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_resolvedAt_observedAt_idx" ON "PaymentReconciliation"("resolvedAt", "observedAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_actorId_createdAt_idx" ON "IdempotencyRecord"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_scope_key_actorScope_key" ON "IdempotencyRecord"("scope", "key", "actorScope");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_createdAt_idx" ON "OutboxEvent"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_processingStartedAt_idx" ON "OutboxEvent"("status", "processingStartedAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_createdAt_idx" ON "OutboxEvent"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_channel_key" ON "NotificationPreference"("userId", "category", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_active_sortOrder_idx" ON "Category"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_featured_createdAt_idx" ON "Product"("status", "featured", "createdAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_merchantId_status_idx" ON "Product"("merchantId", "status");

-- CreateIndex
CREATE INDEX "Product_brandId_status_idx" ON "Product"("brandId", "status");

-- CreateIndex
CREATE INDEX "Product_priceMinor_idx" ON "Product"("priceMinor");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_active_idx" ON "ProductVariant"("productId", "active");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_sortOrder_idx" ON "ProductMedia"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "InventoryItem_variantId_idx" ON "InventoryItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_storeId_variantId_key" ON "InventoryItem"("storeId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

-- CreateIndex
CREATE INDEX "WishlistItem_variantId_idx" ON "WishlistItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_key" ON "WishlistItem"("wishlistId", "productId");

-- CreateIndex
CREATE INDEX "Cart_userId_vertical_status_updatedAt_idx" ON "Cart"("userId", "vertical", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Cart_guestTokenHash_vertical_status_updatedAt_idx" ON "Cart"("guestTokenHash", "vertical", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_guestTokenHash_vertical_key" ON "Cart"("guestTokenHash", "vertical");

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "ShoppingCheckout_userId_status_createdAt_idx" ON "ShoppingCheckout"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingCheckout_cartId_status_idx" ON "ShoppingCheckout"("cartId", "status");

-- CreateIndex
CREATE INDEX "ShoppingCheckout_expiresAt_status_idx" ON "ShoppingCheckout"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "ShoppingCheckoutItem_checkoutId_merchantId_idx" ON "ShoppingCheckoutItem"("checkoutId", "merchantId");

-- CreateIndex
CREATE INDEX "ShoppingCheckoutItem_variantId_idx" ON "ShoppingCheckoutItem"("variantId");

-- CreateIndex
CREATE INDEX "InventoryReservation_checkoutId_status_idx" ON "InventoryReservation"("checkoutId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_inventoryItemId_status_expiresAt_idx" ON "InventoryReservation"("inventoryItemId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "InventoryReservation_variantId_status_idx" ON "InventoryReservation"("variantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingOrder_orderNumber_key" ON "ShoppingOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingOrder_checkoutId_key" ON "ShoppingOrder"("checkoutId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingOrder_paymentId_key" ON "ShoppingOrder"("paymentId");

-- CreateIndex
CREATE INDEX "ShoppingOrder_userId_vertical_createdAt_idx" ON "ShoppingOrder"("userId", "vertical", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingOrder_status_createdAt_idx" ON "ShoppingOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingOrder_paymentStatus_createdAt_idx" ON "ShoppingOrder"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingSellerOrder_orderId_status_idx" ON "ShoppingSellerOrder"("orderId", "status");

-- CreateIndex
CREATE INDEX "ShoppingSellerOrder_merchantId_status_createdAt_idx" ON "ShoppingSellerOrder"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingSellerOrder_storeId_status_createdAt_idx" ON "ShoppingSellerOrder"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingSellerOrder_assignedToUserId_status_idx" ON "ShoppingSellerOrder"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "ShoppingSellerOrder_fulfillmentDueAt_status_idx" ON "ShoppingSellerOrder"("fulfillmentDueAt", "status");

-- CreateIndex
CREATE INDEX "ShoppingOrderItem_sellerOrderId_idx" ON "ShoppingOrderItem"("sellerOrderId");

-- CreateIndex
CREATE INDEX "ShoppingOrderItem_productId_idx" ON "ShoppingOrderItem"("productId");

-- CreateIndex
CREATE INDEX "ShoppingOrderItem_variantId_idx" ON "ShoppingOrderItem"("variantId");

-- CreateIndex
CREATE INDEX "ShoppingReturn_orderId_status_createdAt_idx" ON "ShoppingReturn"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturn_sellerOrderId_status_createdAt_idx" ON "ShoppingReturn"("sellerOrderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturn_merchantId_status_createdAt_idx" ON "ShoppingReturn"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturn_returnTrackingId_idx" ON "ShoppingReturn"("returnTrackingId");

-- CreateIndex
CREATE INDEX "ShoppingReturnItem_orderItemId_idx" ON "ShoppingReturnItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingReturnItem_returnId_orderItemId_key" ON "ShoppingReturnItem"("returnId", "orderItemId");

-- CreateIndex
CREATE INDEX "ShoppingReturnEvidence_returnId_createdAt_idx" ON "ShoppingReturnEvidence"("returnId", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturnEvent_returnId_createdAt_idx" ON "ShoppingReturnEvent"("returnId", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturnEvent_actorUserId_createdAt_idx" ON "ShoppingReturnEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturnDispute_returnId_status_createdAt_idx" ON "ShoppingReturnDispute"("returnId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingReturnDispute_status_createdAt_idx" ON "ShoppingReturnDispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingCancellationRequest_orderId_status_createdAt_idx" ON "ShoppingCancellationRequest"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingCancellationRequest_sellerOrderId_status_createdAt_idx" ON "ShoppingCancellationRequest"("sellerOrderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Shipment_sellerOrderId_status_createdAt_idx" ON "Shipment"("sellerOrderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Shipment_carrier_trackingIdentifier_idx" ON "Shipment"("carrier", "trackingIdentifier");

-- CreateIndex
CREATE INDEX "Shipment_status_estimatedDeliveryAt_idx" ON "Shipment"("status", "estimatedDeliveryAt");

-- CreateIndex
CREATE INDEX "ShipmentItem_orderItemId_idx" ON "ShipmentItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_orderItemId_key" ON "ShipmentItem"("shipmentId", "orderItemId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_occurredAt_idx" ON "ShipmentEvent"("shipmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "ShipmentEvent_externalEventId_idx" ON "ShipmentEvent"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_status_startsAt_endsAt_idx" ON "Promotion"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Promotion_categoryId_status_idx" ON "Promotion"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Promotion_productId_status_idx" ON "Promotion"("productId", "status");

-- CreateIndex
CREATE INDEX "Promotion_merchantId_status_idx" ON "Promotion"("merchantId", "status");

-- CreateIndex
CREATE INDEX "Promotion_activation_status_priority_idx" ON "Promotion"("activation", "status", "priority");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_createdAt_idx" ON "ProductReview"("productId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReview_userId_createdAt_idx" ON "ProductReview"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_userId_productId_key" ON "ProductReview"("userId", "productId");

-- CreateIndex
CREATE INDEX "SellerReview_merchantId_status_createdAt_idx" ON "SellerReview"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SellerReview_userId_createdAt_idx" ON "SellerReview"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerReview_userId_merchantId_key" ON "SellerReview"("userId", "merchantId");

-- CreateIndex
CREATE INDEX "PromotionApplication_promotionId_status_createdAt_idx" ON "PromotionApplication"("promotionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionApplication_userId_promotionId_status_idx" ON "PromotionApplication"("userId", "promotionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionApplication_checkoutId_promotionId_key" ON "PromotionApplication"("checkoutId", "promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionApplication_orderId_promotionId_key" ON "PromotionApplication"("orderId", "promotionId");

-- CreateIndex
CREATE INDEX "PromotionAttempt_promotionId_createdAt_idx" ON "PromotionAttempt"("promotionId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionAttempt_userId_createdAt_idx" ON "PromotionAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionAttempt_requestFingerprint_createdAt_idx" ON "PromotionAttempt"("requestFingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewMedia_productReviewId_sortOrder_idx" ON "ReviewMedia"("productReviewId", "sortOrder");

-- CreateIndex
CREATE INDEX "ReviewMedia_sellerReviewId_sortOrder_idx" ON "ReviewMedia"("sellerReviewId", "sortOrder");

-- CreateIndex
CREATE INDEX "ReviewReport_status_createdAt_idx" ON "ReviewReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReport_reporterUserId_productReviewId_key" ON "ReviewReport"("reporterUserId", "productReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReport_reporterUserId_sellerReviewId_key" ON "ReviewReport"("reporterUserId", "sellerReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMerchantResponse_productReviewId_key" ON "ReviewMerchantResponse"("productReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMerchantResponse_sellerReviewId_key" ON "ReviewMerchantResponse"("sellerReviewId");

-- CreateIndex
CREATE INDEX "ReviewMerchantResponse_merchantId_createdAt_idx" ON "ReviewMerchantResponse"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQueryEvent_normalizedQuery_createdAt_idx" ON "SearchQueryEvent"("normalizedQuery", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQueryEvent_userId_createdAt_idx" ON "SearchQueryEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_storeId_createdAt_idx" ON "InventoryAdjustment"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_variantId_createdAt_idx" ON "InventoryAdjustment"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_actorUserId_createdAt_idx" ON "InventoryAdjustment"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GroceryList_userId_archived_updatedAt_idx" ON "GroceryList"("userId", "archived", "updatedAt");

-- CreateIndex
CREATE INDEX "GroceryListItem_productId_idx" ON "GroceryListItem"("productId");

-- CreateIndex
CREATE INDEX "GroceryListItem_variantId_idx" ON "GroceryListItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryListItem_listId_normalizedLabel_key" ON "GroceryListItem"("listId", "normalizedLabel");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryCustomerPreference_userId_key" ON "GroceryCustomerPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryCartItemPreference_cartItemId_key" ON "GroceryCartItemPreference"("cartItemId");

-- CreateIndex
CREATE INDEX "GroceryCartItemPreference_replacementVariantId_idx" ON "GroceryCartItemPreference"("replacementVariantId");

-- CreateIndex
CREATE INDEX "GroceryListCollaborator_userId_createdAt_idx" ON "GroceryListCollaborator"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryListCollaborator_listId_userId_key" ON "GroceryListCollaborator"("listId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryStoreConfig_storeId_key" ON "GroceryStoreConfig"("storeId");

-- CreateIndex
CREATE INDEX "GroceryDeliverySlot_storeId_active_startsAt_idx" ON "GroceryDeliverySlot"("storeId", "active", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryDeliverySlot_storeId_startsAt_endsAt_key" ON "GroceryDeliverySlot"("storeId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "GroceryRecurringBasket_userId_active_nextRunAt_idx" ON "GroceryRecurringBasket"("userId", "active", "nextRunAt");

-- CreateIndex
CREATE INDEX "GroceryRecurringBasketItem_productId_idx" ON "GroceryRecurringBasketItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryRecurringBasketItem_basketId_variantId_key" ON "GroceryRecurringBasketItem"("basketId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryMembership_userId_key" ON "GroceryMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryGroupCart_cartId_key" ON "GroceryGroupCart"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryGroupCart_shareToken_key" ON "GroceryGroupCart"("shareToken");

-- CreateIndex
CREATE INDEX "GroceryGroupCart_hostUserId_status_expiresAt_idx" ON "GroceryGroupCart"("hostUserId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "GroceryGroupCartMember_groupCartId_status_idx" ON "GroceryGroupCartMember"("groupCartId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryGroupCartMember_groupCartId_userId_key" ON "GroceryGroupCartMember"("groupCartId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryPickerSession_sellerOrderId_key" ON "GroceryPickerSession"("sellerOrderId");

-- CreateIndex
CREATE INDEX "GroceryPickerSession_pickerUserId_status_idx" ON "GroceryPickerSession"("pickerUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryPickerItemOutcome_orderItemId_key" ON "GroceryPickerItemOutcome"("orderItemId");

-- CreateIndex
CREATE INDEX "GroceryPickerItemOutcome_sessionId_status_idx" ON "GroceryPickerItemOutcome"("sessionId", "status");

-- CreateIndex
CREATE INDEX "GroceryPickerItemOutcome_replacementVariantId_idx" ON "GroceryPickerItemOutcome"("replacementVariantId");

-- CreateIndex
CREATE INDEX "GroceryPickerMessage_sessionId_createdAt_idx" ON "GroceryPickerMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "GroceryIssue_userId_status_createdAt_idx" ON "GroceryIssue"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GroceryIssue_merchantId_status_createdAt_idx" ON "GroceryIssue"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryOrderPreferenceSnapshot_orderId_key" ON "GroceryOrderPreferenceSnapshot"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodRestaurant_merchantId_key" ON "FoodRestaurant"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodRestaurant_slug_key" ON "FoodRestaurant"("slug");

-- CreateIndex
CREATE INDEX "FoodRestaurant_status_acceptingOrders_rating_idx" ON "FoodRestaurant"("status", "acceptingOrders", "rating");

-- CreateIndex
CREATE INDEX "FoodOpeningHour_restaurantId_dayOfWeek_idx" ON "FoodOpeningHour"("restaurantId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "FoodOpeningHour_restaurantId_dayOfWeek_key" ON "FoodOpeningHour"("restaurantId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "FoodMenuSection_restaurantId_active_sortOrder_idx" ON "FoodMenuSection"("restaurantId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FoodMenuSection_restaurantId_slug_key" ON "FoodMenuSection"("restaurantId", "slug");

-- CreateIndex
CREATE INDEX "FoodMenuItem_restaurantId_active_featured_idx" ON "FoodMenuItem"("restaurantId", "active", "featured");

-- CreateIndex
CREATE INDEX "FoodMenuItem_sectionId_active_sortOrder_idx" ON "FoodMenuItem"("sectionId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FoodMenuItem_restaurantId_slug_key" ON "FoodMenuItem"("restaurantId", "slug");

-- CreateIndex
CREATE INDEX "FoodModifierGroup_itemId_sortOrder_idx" ON "FoodModifierGroup"("itemId", "sortOrder");

-- CreateIndex
CREATE INDEX "FoodModifierOption_groupId_active_sortOrder_idx" ON "FoodModifierOption"("groupId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "FoodCart_restaurantId_userId_status_updatedAt_idx" ON "FoodCart"("restaurantId", "userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "FoodCart_groupOrderId_status_idx" ON "FoodCart"("groupOrderId", "status");

-- CreateIndex
CREATE INDEX "FoodCart_restaurantId_guestTokenHash_status_updatedAt_idx" ON "FoodCart"("restaurantId", "guestTokenHash", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "FoodCart_guestTokenHash_status_updatedAt_idx" ON "FoodCart"("guestTokenHash", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "FoodCartItem_menuItemId_idx" ON "FoodCartItem"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodCartItem_cartId_menuItemId_configurationKey_key" ON "FoodCartItem"("cartId", "menuItemId", "configurationKey");

-- CreateIndex
CREATE UNIQUE INDEX "FoodOrder_orderNumber_key" ON "FoodOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "FoodOrder_userId_createdAt_idx" ON "FoodOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodOrder_groupOrderId_createdAt_idx" ON "FoodOrder"("groupOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodOrder_restaurantId_status_createdAt_idx" ON "FoodOrder"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FoodOrderItem_orderId_idx" ON "FoodOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "FoodOrderItem_menuItemId_idx" ON "FoodOrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "FoodRestaurantFavorite_restaurantId_createdAt_idx" ON "FoodRestaurantFavorite"("restaurantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodRestaurantFavorite_userId_restaurantId_key" ON "FoodRestaurantFavorite"("userId", "restaurantId");

-- CreateIndex
CREATE INDEX "FoodMenuItemFavorite_menuItemId_createdAt_idx" ON "FoodMenuItemFavorite"("menuItemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodMenuItemFavorite_userId_menuItemId_key" ON "FoodMenuItemFavorite"("userId", "menuItemId");

-- CreateIndex
CREATE INDEX "FoodPromotion_restaurantId_active_startsAt_endsAt_idx" ON "FoodPromotion"("restaurantId", "active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodPromotion_restaurantId_code_key" ON "FoodPromotion"("restaurantId", "code");

-- CreateIndex
CREATE INDEX "FoodMenuAvailabilityWindow_menuItemId_active_dayOfWeek_idx" ON "FoodMenuAvailabilityWindow"("menuItemId", "active", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "FoodGroupOrder_shareToken_key" ON "FoodGroupOrder"("shareToken");

-- CreateIndex
CREATE INDEX "FoodGroupOrder_hostUserId_status_expiresAt_idx" ON "FoodGroupOrder"("hostUserId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "FoodGroupOrderMember_groupOrderId_status_idx" ON "FoodGroupOrderMember"("groupOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FoodGroupOrderMember_groupOrderId_userId_key" ON "FoodGroupOrderMember"("groupOrderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodOrderEconomics_orderId_key" ON "FoodOrderEconomics"("orderId");

-- CreateIndex
CREATE INDEX "FoodOrderEconomics_createdAt_idx" ON "FoodOrderEconomics"("createdAt");

-- CreateIndex
CREATE INDEX "FoodCommissionPolicy_region_scope_active_effectiveFrom_idx" ON "FoodCommissionPolicy"("region", "scope", "active", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FoodCommissionPolicy_restaurantId_active_effectiveFrom_idx" ON "FoodCommissionPolicy"("restaurantId", "active", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FoodCommissionPolicy_effectiveTo_idx" ON "FoodCommissionPolicy"("effectiveTo");

-- CreateIndex
CREATE INDEX "FoodOrderTrackingEvent_orderId_createdAt_idx" ON "FoodOrderTrackingEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodOrderMessage_orderId_createdAt_idx" ON "FoodOrderMessage"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodReview_orderId_key" ON "FoodReview"("orderId");

-- CreateIndex
CREATE INDEX "FoodReview_restaurantId_createdAt_idx" ON "FoodReview"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodReview_userId_createdAt_idx" ON "FoodReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodSupportIssue_userId_status_createdAt_idx" ON "FoodSupportIssue"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FoodSupportIssue_orderId_status_idx" ON "FoodSupportIssue"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PushDeviceToken_token_key" ON "PushDeviceToken"("token");

-- CreateIndex
CREATE INDEX "PushDeviceToken_userId_enabled_lastSeenAt_idx" ON "PushDeviceToken"("userId", "enabled", "lastSeenAt");

-- CreateIndex
CREATE INDEX "PushDeviceToken_provider_enabled_idx" ON "PushDeviceToken"("provider", "enabled");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_category_createdAt_idx" ON "Notification"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_resourceType_resourceId_createdAt_idx" ON "Notification"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_channel_createdAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt", "channel", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_channel_key" ON "NotificationDelivery"("notificationId", "channel");

-- CreateIndex
CREATE INDEX "SupportCase_userId_status_lastActivityAt_idx" ON "SupportCase"("userId", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "SupportCase_organizationId_status_lastActivityAt_idx" ON "SupportCase"("organizationId", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "SupportCase_channel_status_priority_idx" ON "SupportCase"("channel", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportCase_assignedToUserId_status_priority_idx" ON "SupportCase"("assignedToUserId", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportCase_orderId_createdAt_idx" ON "SupportCase"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCase_foodOrderId_createdAt_idx" ON "SupportCase"("foodOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCase_foodRestaurantId_createdAt_idx" ON "SupportCase"("foodRestaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCase_paymentIntentId_createdAt_idx" ON "SupportCase"("paymentIntentId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCase_shipmentId_createdAt_idx" ON "SupportCase"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCase_shoppingReturnId_createdAt_idx" ON "SupportCase"("shoppingReturnId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_caseId_createdAt_idx" ON "SupportMessage"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_authorUserId_createdAt_idx" ON "SupportMessage"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_status_severity_createdAt_idx" ON "RiskSignal"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_userId_createdAt_idx" ON "RiskSignal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_merchantId_createdAt_idx" ON "RiskSignal"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_orderId_createdAt_idx" ON "RiskSignal"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_type_createdAt_idx" ON "RiskSignal"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsQuote_userId_createdAt_idx" ON "LogisticsQuote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsQuote_expiresAt_idx" ON "LogisticsQuote"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBooking_publicCode_key" ON "LogisticsBooking"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBooking_trackingCode_key" ON "LogisticsBooking"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBooking_fundingLedgerTransactionId_key" ON "LogisticsBooking"("fundingLedgerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBooking_settlementLedgerTransactionId_key" ON "LogisticsBooking"("settlementLedgerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBooking_refundLedgerTransactionId_key" ON "LogisticsBooking"("refundLedgerTransactionId");

-- CreateIndex
CREATE INDEX "LogisticsBooking_userId_status_createdAt_idx" ON "LogisticsBooking"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsBooking_assignedCourierUserId_status_createdAt_idx" ON "LogisticsBooking"("assignedCourierUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsBooking_fundingStatus_status_createdAt_idx" ON "LogisticsBooking"("fundingStatus", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsBooking_quoteId_idx" ON "LogisticsBooking"("quoteId");

-- CreateIndex
CREATE INDEX "LogisticsBookingEvent_bookingId_createdAt_idx" ON "LogisticsBookingEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsBookingEvent_type_createdAt_idx" ON "LogisticsBookingEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "DrivePricingQuote_userId_createdAt_idx" ON "DrivePricingQuote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DrivePricingQuote_expiresAt_idx" ON "DrivePricingQuote"("expiresAt");

-- CreateIndex
CREATE INDEX "DrivePricingQuote_rideClass_createdAt_idx" ON "DrivePricingQuote"("rideClass", "createdAt");

-- CreateIndex
CREATE INDEX "DriveRide_riderUserId_status_createdAt_idx" ON "DriveRide"("riderUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DriveRide_driverUserId_status_createdAt_idx" ON "DriveRide"("driverUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DriveRide_quoteId_idx" ON "DriveRide"("quoteId");

-- CreateIndex
CREATE INDEX "DriveRide_status_scheduledFor_createdAt_idx" ON "DriveRide"("status", "scheduledFor", "createdAt");

-- CreateIndex
CREATE INDEX "DriveRideEvent_rideId_createdAt_idx" ON "DriveRideEvent"("rideId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveRideEvent_type_createdAt_idx" ON "DriveRideEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriveDriverProfile_userId_key" ON "DriveDriverProfile"("userId");

-- CreateIndex
CREATE INDEX "DriveDriverProfile_approvalStatus_availability_lastLocationAt_i" ON "DriveDriverProfile"("approvalStatus", "availability", "lastLocationAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriveVehicle_plateNumber_key" ON "DriveVehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "DriveVehicle_driverProfileId_status_active_idx" ON "DriveVehicle"("driverProfileId", "status", "active");

-- CreateIndex
CREATE INDEX "DriveVehicle_rideClass_status_active_idx" ON "DriveVehicle"("rideClass", "status", "active");

-- CreateIndex
CREATE INDEX "DriveDriverDocument_driverProfileId_status_type_idx" ON "DriveDriverDocument"("driverProfileId", "status", "type");

-- CreateIndex
CREATE INDEX "DriveDriverDocument_expiresAt_status_idx" ON "DriveDriverDocument"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "DriveDispatchOffer_driverUserId_status_expiresAt_idx" ON "DriveDispatchOffer"("driverUserId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "DriveDispatchOffer_rideId_status_createdAt_idx" ON "DriveDispatchOffer"("rideId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriveDispatchOffer_rideId_driverUserId_key" ON "DriveDispatchOffer"("rideId", "driverUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFareHold_rideId_key" ON "DriveFareHold"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFareHold_reservationReference_key" ON "DriveFareHold"("reservationReference");

-- CreateIndex
CREATE INDEX "DriveFareHold_riderUserId_status_createdAt_idx" ON "DriveFareHold"("riderUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DriveDriverLedgerEntry_driverUserId_createdAt_idx" ON "DriveDriverLedgerEntry"("driverUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveDriverLedgerEntry_rideId_createdAt_idx" ON "DriveDriverLedgerEntry"("rideId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveDriverPenalty_driverUserId_createdAt_idx" ON "DriveDriverPenalty"("driverUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveDriverPenalty_rideId_type_idx" ON "DriveDriverPenalty"("rideId", "type");

-- CreateIndex
CREATE INDEX "DriveFuelPrice_region_fuelType_status_effectiveFrom_idx" ON "DriveFuelPrice"("region", "fuelType", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "PayTransfer_reference_key" ON "PayTransfer"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PayTransfer_ledgerTransactionId_key" ON "PayTransfer"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "PayTransfer_actorUserId_createdAt_idx" ON "PayTransfer"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PayTransfer_fromWalletId_createdAt_idx" ON "PayTransfer"("fromWalletId", "createdAt");

-- CreateIndex
CREATE INDEX "PayTransfer_toWalletId_createdAt_idx" ON "PayTransfer"("toWalletId", "createdAt");

-- CreateIndex
CREATE INDEX "PayTransfer_status_createdAt_idx" ON "PayTransfer"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayFundingIntent_providerReference_key" ON "PayFundingIntent"("providerReference");

-- CreateIndex
CREATE INDEX "PayFundingIntent_userId_createdAt_idx" ON "PayFundingIntent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayFundingIntent_walletId_createdAt_idx" ON "PayFundingIntent"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "PayFundingIntent_status_createdAt_idx" ON "PayFundingIntent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayFundingIntent_userId_idempotencyKey_key" ON "PayFundingIntent"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayProfile_payTag_key" ON "PayProfile"("payTag");

-- CreateIndex
CREATE INDEX "PayProfile_payTag_idx" ON "PayProfile"("payTag");

-- CreateIndex
CREATE INDEX "PayBeneficiary_userId_createdAt_idx" ON "PayBeneficiary"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayBeneficiary_userId_walletId_key" ON "PayBeneficiary"("userId", "walletId");

-- CreateIndex
CREATE UNIQUE INDEX "PayMoneyRequest_code_key" ON "PayMoneyRequest"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PayMoneyRequest_ledgerTransactionId_key" ON "PayMoneyRequest"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "PayMoneyRequest_requesterUserId_createdAt_idx" ON "PayMoneyRequest"("requesterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PayMoneyRequest_payerUserId_createdAt_idx" ON "PayMoneyRequest"("payerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PayMoneyRequest_status_expiresAt_idx" ON "PayMoneyRequest"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayBankAccount_providerRecipientCode_key" ON "PayBankAccount"("providerRecipientCode");

-- CreateIndex
CREATE INDEX "PayBankAccount_userId_status_createdAt_idx" ON "PayBankAccount"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayWithdrawal_providerReference_key" ON "PayWithdrawal"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PayWithdrawal_ledgerTransactionId_key" ON "PayWithdrawal"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "PayWithdrawal_userId_createdAt_idx" ON "PayWithdrawal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayWithdrawal_walletId_createdAt_idx" ON "PayWithdrawal"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "PayWithdrawal_status_createdAt_idx" ON "PayWithdrawal"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayWithdrawal_userId_idempotencyKey_key" ON "PayWithdrawal"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayFixedSavings_ledgerAccountId_key" ON "PayFixedSavings"("ledgerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "PayFixedSavings_fundingLedgerTransactionId_key" ON "PayFixedSavings"("fundingLedgerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PayFixedSavings_releaseLedgerTransactionId_key" ON "PayFixedSavings"("releaseLedgerTransactionId");

-- CreateIndex
CREATE INDEX "PayFixedSavings_userId_status_lockUntil_idx" ON "PayFixedSavings"("userId", "status", "lockUntil");

-- CreateIndex
CREATE INDEX "PayFixedSavings_walletId_createdAt_idx" ON "PayFixedSavings"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "PayLoanApplication_userId_status_createdAt_idx" ON "PayLoanApplication"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PayLoanApplication_pledgedSavingsId_idx" ON "PayLoanApplication"("pledgedSavingsId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessVerification_organizationId_key" ON "BusinessVerification"("organizationId");

-- CreateIndex
CREATE INDEX "BusinessVerification_status_updatedAt_idx" ON "BusinessVerification"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessVerticalRegistration_merchantId_key" ON "BusinessVerticalRegistration"("merchantId");

-- CreateIndex
CREATE INDEX "BusinessVerticalRegistration_status_updatedAt_idx" ON "BusinessVerticalRegistration"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessVerticalRegistration_organizationId_vertical_key" ON "BusinessVerticalRegistration"("organizationId", "vertical");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvitation_tokenHash_key" ON "BusinessInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "BusinessInvitation_organizationId_status_createdAt_idx" ON "BusinessInvitation"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessInvitation_normalizedEmail_status_idx" ON "BusinessInvitation"("normalizedEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCatalogMeta_productId_key" ON "BusinessCatalogMeta"("productId");

-- CreateIndex
CREATE INDEX "BusinessCatalogMeta_barcode_idx" ON "BusinessCatalogMeta"("barcode");

-- CreateIndex
CREATE INDEX "BusinessVerificationDocument_organizationId_status_createdAt_id" ON "BusinessVerificationDocument"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessVerificationDocument_assetId_idx" ON "BusinessVerificationDocument"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPayoutAccount_organizationId_key" ON "BusinessPayoutAccount"("organizationId");

-- CreateIndex
CREATE INDEX "BusinessPayoutAccount_status_updatedAt_idx" ON "BusinessPayoutAccount"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWithdrawal_reference_key" ON "BusinessWithdrawal"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWithdrawal_ledgerTransactionId_key" ON "BusinessWithdrawal"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "BusinessWithdrawal_organizationId_status_createdAt_idx" ON "BusinessWithdrawal"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWithdrawal_organizationId_idempotencyKey_key" ON "BusinessWithdrawal"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "BusinessBranch_organizationId_status_idx" ON "BusinessBranch"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessBranch_organizationId_code_key" ON "BusinessBranch"("organizationId", "code");

-- CreateIndex
CREATE INDEX "BusinessApiCredential_organizationId_revokedAt_createdAt_idx" ON "BusinessApiCredential"("organizationId", "revokedAt", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessApiCredential_keyPrefix_idx" ON "BusinessApiCredential"("keyPrefix");

-- CreateIndex
CREATE INDEX "BusinessWebhookEndpoint_organizationId_status_idx" ON "BusinessWebhookEndpoint"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BusinessWebhookDelivery_status_nextAttemptAt_createdAt_idx" ON "BusinessWebhookDelivery"("status", "nextAttemptAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWebhookDelivery_endpointId_outboxEventId_key" ON "BusinessWebhookDelivery"("endpointId", "outboxEventId");

-- CreateIndex
CREATE INDEX "BusinessInvoice_organizationId_status_createdAt_idx" ON "BusinessInvoice"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvoice_organizationId_invoiceNumber_key" ON "BusinessInvoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSettlement_reference_key" ON "BusinessSettlement"("reference");

-- CreateIndex
CREATE INDEX "BusinessSettlement_organizationId_status_createdAt_idx" ON "BusinessSettlement"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyProduct_slug_key" ON "PharmacyProduct"("slug");

-- CreateIndex
CREATE INDEX "PharmacyProduct_merchantId_active_category_idx" ON "PharmacyProduct"("merchantId", "active", "category");

-- CreateIndex
CREATE INDEX "PharmacyProduct_requiresPrescription_active_idx" ON "PharmacyProduct"("requiresPrescription", "active");

-- CreateIndex
CREATE INDEX "PharmacyProduct_barcode_idx" ON "PharmacyProduct"("barcode");

-- CreateIndex
CREATE INDEX "PharmacyProduct_genericName_active_idx" ON "PharmacyProduct"("genericName", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyProduct_merchantId_sku_key" ON "PharmacyProduct"("merchantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyMerchantProfile_merchantId_key" ON "PharmacyMerchantProfile"("merchantId");

-- CreateIndex
CREATE INDEX "PharmacyMerchantProfile_verificationStatus_updatedAt_idx" ON "PharmacyMerchantProfile"("verificationStatus", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyPharmacistProfile_userId_key" ON "PharmacyPharmacistProfile"("userId");

-- CreateIndex
CREATE INDEX "PharmacyPharmacistProfile_merchantId_verificationStatus_idx" ON "PharmacyPharmacistProfile"("merchantId", "verificationStatus");

-- CreateIndex
CREATE INDEX "PharmacyPharmacistProfile_expiresAt_verificationStatus_idx" ON "PharmacyPharmacistProfile"("expiresAt", "verificationStatus");

-- CreateIndex
CREATE INDEX "PharmacyInventoryBatch_productId_expiresAt_idx" ON "PharmacyInventoryBatch"("productId", "expiresAt");

-- CreateIndex
CREATE INDEX "PharmacyInventoryBatch_expiresAt_quantityOnHand_idx" ON "PharmacyInventoryBatch"("expiresAt", "quantityOnHand");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyInventoryBatch_productId_batchNumber_key" ON "PharmacyInventoryBatch"("productId", "batchNumber");

-- CreateIndex
CREATE INDEX "PharmacyPrescription_userId_status_createdAt_idx" ON "PharmacyPrescription"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyPrescription_merchantId_status_createdAt_idx" ON "PharmacyPrescription"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyPrescriptionEvent_prescriptionId_createdAt_idx" ON "PharmacyPrescriptionEvent"("prescriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyPrescriptionEvent_type_createdAt_idx" ON "PharmacyPrescriptionEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyOrder_orderNumber_key" ON "PharmacyOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PharmacyOrder_userId_createdAt_idx" ON "PharmacyOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyOrder_merchantId_status_createdAt_idx" ON "PharmacyOrder"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyOrder_prescriptionId_idx" ON "PharmacyOrder"("prescriptionId");

-- CreateIndex
CREATE INDEX "PharmacyOrderItem_orderId_status_idx" ON "PharmacyOrderItem"("orderId", "status");

-- CreateIndex
CREATE INDEX "PharmacyOrderItem_productId_createdAt_idx" ON "PharmacyOrderItem"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacySubstitutionProposal_orderId_status_createdAt_idx" ON "PharmacySubstitutionProposal"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PharmacyRefillPlan_userId_status_nextRunAt_idx" ON "PharmacyRefillPlan"("userId", "status", "nextRunAt");

-- CreateIndex
CREATE INDEX "PharmacyRefillPlan_nextRunAt_status_idx" ON "PharmacyRefillPlan"("nextRunAt", "status");

-- CreateIndex
CREATE INDEX "SportsCompetition_sport_active_idx" ON "SportsCompetition"("sport", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SportsCompetition_provider_providerId_key" ON "SportsCompetition"("provider", "providerId");

-- CreateIndex
CREATE INDEX "SportsFixture_competitionId_startsAt_idx" ON "SportsFixture"("competitionId", "startsAt");

-- CreateIndex
CREATE INDEX "SportsFixture_status_startsAt_idx" ON "SportsFixture"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SportsFixture_provider_providerId_key" ON "SportsFixture"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerUserId_createdAt_idx" ON "MediaAsset"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_organizationId_createdAt_idx" ON "MediaAsset"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_purpose_createdAt_idx" ON "ConsentRecord"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_userId_status_createdAt_idx" ON "DataSubjectRequest"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_dueAt_idx" ON "DataSubjectRequest"("status", "dueAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_vertical_occurredAt_idx" ON "AnalyticsEvent"("vertical", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyEntry_accountId_createdAt_idx" ON "LoyaltyEntry"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyEntry_reference_idx" ON "LoyaltyEntry"("reference");

-- CreateIndex
CREATE INDEX "ReputationAggregate_riskBand_score_idx" ON "ReputationAggregate"("riskBand", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationAggregate_subjectType_subjectId_key" ON "ReputationAggregate"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "RegionalConfig_vertical_enabled_idx" ON "RegionalConfig"("vertical", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalConfig_region_vertical_key" ON "RegionalConfig"("region", "vertical");

-- AddForeignKey
ALTER TABLE "UserEmail" ADD CONSTRAINT "UserEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPhone" ADD CONSTRAINT "UserPhone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordCredential" ADD CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NativeAuthorizationCode" ADD CONSTRAINT "NativeAuthorizationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NativeSession" ADD CONSTRAINT "NativeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_legacyPaymentId_fkey" FOREIGN KEY ("legacyPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorization" ADD CONSTRAINT "PaymentAuthorization_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorization" ADD CONSTRAINT "PaymentAuthorization_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentAuthorizationId_fkey" FOREIGN KEY ("paymentAuthorizationId") REFERENCES "PaymentAuthorization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_shoppingReturnId_fkey" FOREIGN KEY ("shoppingReturnId") REFERENCES "ShoppingReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckout" ADD CONSTRAINT "ShoppingCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckout" ADD CONSTRAINT "ShoppingCheckout_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckout" ADD CONSTRAINT "ShoppingCheckout_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckoutItem" ADD CONSTRAINT "ShoppingCheckoutItem_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "ShoppingCheckout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckoutItem" ADD CONSTRAINT "ShoppingCheckoutItem_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckoutItem" ADD CONSTRAINT "ShoppingCheckoutItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCheckoutItem" ADD CONSTRAINT "ShoppingCheckoutItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "ShoppingCheckout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrder" ADD CONSTRAINT "ShoppingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrder" ADD CONSTRAINT "ShoppingOrder_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "ShoppingCheckout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrder" ADD CONSTRAINT "ShoppingOrder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrder" ADD CONSTRAINT "ShoppingOrder_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSellerOrder" ADD CONSTRAINT "ShoppingSellerOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSellerOrder" ADD CONSTRAINT "ShoppingSellerOrder_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSellerOrder" ADD CONSTRAINT "ShoppingSellerOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrderItem" ADD CONSTRAINT "ShoppingOrderItem_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrderItem" ADD CONSTRAINT "ShoppingOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingOrderItem" ADD CONSTRAINT "ShoppingOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturn" ADD CONSTRAINT "ShoppingReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturn" ADD CONSTRAINT "ShoppingReturn_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturn" ADD CONSTRAINT "ShoppingReturn_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturnItem" ADD CONSTRAINT "ShoppingReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturnItem" ADD CONSTRAINT "ShoppingReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShoppingOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturnEvidence" ADD CONSTRAINT "ShoppingReturnEvidence_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturnEvent" ADD CONSTRAINT "ShoppingReturnEvent_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingReturnDispute" ADD CONSTRAINT "ShoppingReturnDispute_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCancellationRequest" ADD CONSTRAINT "ShoppingCancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCancellationRequest" ADD CONSTRAINT "ShoppingCancellationRequest_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShoppingOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerReview" ADD CONSTRAINT "SellerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerReview" ADD CONSTRAINT "SellerReview_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "ShoppingCheckout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionApplication" ADD CONSTRAINT "PromotionApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionAttempt" ADD CONSTRAINT "PromotionAttempt_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionAttempt" ADD CONSTRAINT "PromotionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_sellerReviewId_fkey" FOREIGN KEY ("sellerReviewId") REFERENCES "SellerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMerchantResponse" ADD CONSTRAINT "ReviewMerchantResponse_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQueryEvent" ADD CONSTRAINT "SearchQueryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryCustomerPreference" ADD CONSTRAINT "GroceryCustomerPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryCartItemPreference" ADD CONSTRAINT "GroceryCartItemPreference_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryCartItemPreference" ADD CONSTRAINT "GroceryCartItemPreference_replacementVariantId_fkey" FOREIGN KEY ("replacementVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListCollaborator" ADD CONSTRAINT "GroceryListCollaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListCollaborator" ADD CONSTRAINT "GroceryListCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryStoreConfig" ADD CONSTRAINT "GroceryStoreConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryDeliverySlot" ADD CONSTRAINT "GroceryDeliverySlot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRecurringBasket" ADD CONSTRAINT "GroceryRecurringBasket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "GroceryRecurringBasket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRecurringBasketItem" ADD CONSTRAINT "GroceryRecurringBasketItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryMembership" ADD CONSTRAINT "GroceryMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryGroupCart" ADD CONSTRAINT "GroceryGroupCart_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryGroupCart" ADD CONSTRAINT "GroceryGroupCart_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryGroupCartMember" ADD CONSTRAINT "GroceryGroupCartMember_groupCartId_fkey" FOREIGN KEY ("groupCartId") REFERENCES "GroceryGroupCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryGroupCartMember" ADD CONSTRAINT "GroceryGroupCartMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerSession" ADD CONSTRAINT "GroceryPickerSession_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerSession" ADD CONSTRAINT "GroceryPickerSession_pickerUserId_fkey" FOREIGN KEY ("pickerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroceryPickerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShoppingOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerItemOutcome" ADD CONSTRAINT "GroceryPickerItemOutcome_replacementVariantId_fkey" FOREIGN KEY ("replacementVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerMessage" ADD CONSTRAINT "GroceryPickerMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroceryPickerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPickerMessage" ADD CONSTRAINT "GroceryPickerMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryIssue" ADD CONSTRAINT "GroceryIssue_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryOrderPreferenceSnapshot" ADD CONSTRAINT "GroceryOrderPreferenceSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRestaurant" ADD CONSTRAINT "FoodRestaurant_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOpeningHour" ADD CONSTRAINT "FoodOpeningHour_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuSection" ADD CONSTRAINT "FoodMenuSection_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuItem" ADD CONSTRAINT "FoodMenuItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FoodMenuSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodModifierGroup" ADD CONSTRAINT "FoodModifierGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodModifierOption" ADD CONSTRAINT "FoodModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FoodModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCartItem" ADD CONSTRAINT "FoodCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "FoodCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCartItem" ADD CONSTRAINT "FoodCartItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRestaurantFavorite" ADD CONSTRAINT "FoodRestaurantFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRestaurantFavorite" ADD CONSTRAINT "FoodRestaurantFavorite_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuItemFavorite" ADD CONSTRAINT "FoodMenuItemFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuItemFavorite" ADD CONSTRAINT "FoodMenuItemFavorite_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPromotion" ADD CONSTRAINT "FoodPromotion_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMenuAvailabilityWindow" ADD CONSTRAINT "FoodMenuAvailabilityWindow_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "FoodMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodGroupOrder" ADD CONSTRAINT "FoodGroupOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodGroupOrder" ADD CONSTRAINT "FoodGroupOrder_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodGroupOrderMember" ADD CONSTRAINT "FoodGroupOrderMember_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "FoodGroupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodGroupOrderMember" ADD CONSTRAINT "FoodGroupOrderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderEconomics" ADD CONSTRAINT "FoodOrderEconomics_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderTrackingEvent" ADD CONSTRAINT "FoodOrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderMessage" ADD CONSTRAINT "FoodOrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderMessage" ADD CONSTRAINT "FoodOrderMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodReview" ADD CONSTRAINT "FoodReview_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSupportIssue" ADD CONSTRAINT "FoodSupportIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSupportIssue" ADD CONSTRAINT "FoodSupportIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDeviceToken" ADD CONSTRAINT "PushDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_foodRestaurantId_fkey" FOREIGN KEY ("foodRestaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_shoppingReturnId_fkey" FOREIGN KEY ("shoppingReturnId") REFERENCES "ShoppingReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsBooking" ADD CONSTRAINT "LogisticsBooking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "LogisticsQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsBookingEvent" ADD CONSTRAINT "LogisticsBookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "LogisticsBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRide" ADD CONSTRAINT "DriveRide_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "DrivePricingQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveRideEvent" ADD CONSTRAINT "DriveRideEvent_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "DriveRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveVehicle" ADD CONSTRAINT "DriveVehicle_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriveDriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveDriverDocument" ADD CONSTRAINT "DriveDriverDocument_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriveDriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveDispatchOffer" ADD CONSTRAINT "DriveDispatchOffer_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "DriveRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveFareHold" ADD CONSTRAINT "DriveFareHold_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "DriveRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveDriverPenalty" ADD CONSTRAINT "DriveDriverPenalty_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "DriveRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWebhookDelivery" ADD CONSTRAINT "BusinessWebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "BusinessWebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInventoryBatch" ADD CONSTRAINT "PharmacyInventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PharmacyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyPrescriptionEvent" ADD CONSTRAINT "PharmacyPrescriptionEvent_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "PharmacyPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOrder" ADD CONSTRAINT "PharmacyOrder_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "PharmacyPrescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOrderItem" ADD CONSTRAINT "PharmacyOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PharmacyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOrderItem" ADD CONSTRAINT "PharmacyOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PharmacyProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacySubstitutionProposal" ADD CONSTRAINT "PharmacySubstitutionProposal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PharmacyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRefillPlan" ADD CONSTRAINT "PharmacyRefillPlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PharmacyProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRefillPlan" ADD CONSTRAINT "PharmacyRefillPlan_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "PharmacyPrescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsFixture" ADD CONSTRAINT "SportsFixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SportsCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEntry" ADD CONSTRAINT "LoyaltyEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

