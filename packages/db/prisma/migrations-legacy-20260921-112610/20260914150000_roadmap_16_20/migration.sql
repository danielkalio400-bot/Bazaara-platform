-- Roadmaps 16-20: merchant fulfillment, operations controls, shipments, returns/refunds and payment orchestration.
-- Additive only. Existing users, catalogue, inventory, carts, orders and legacy Payment rows are preserved.

ALTER TYPE "ShoppingSellerOrderStatus" ADD VALUE IF NOT EXISTS 'PICKING';
ALTER TYPE "ShoppingSellerOrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_SHIP';
ALTER TYPE "ShoppingSellerOrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLATION_REQUESTED';

ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'RETURN_LABEL_CREATED';
ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'INSPECTING';
ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "ShoppingReturnStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

CREATE TYPE "ShoppingCancellationRequestStatus" AS ENUM ('REQUESTED','APPROVED','REJECTED','CANCELLED');
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT','LABEL_CREATED','PACKED','READY_TO_SHIP','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','REDELIVERY_SCHEDULED','RETURN_TO_SENDER','RETURNED_TO_SENDER','CANCELLED');
CREATE TYPE "ShoppingReturnDisputeStatus" AS ENUM ('OPEN','UNDER_REVIEW','RESOLVED_CUSTOMER','RESOLVED_MERCHANT','CLOSED');
CREATE TYPE "PaymentIntentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD','REQUIRES_ACTION','PROCESSING','REQUIRES_CAPTURE','SUCCEEDED','FAILED','CANCELLED','PARTIALLY_REFUNDED','REFUNDED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED','PENDING','SUCCEEDED','FAILED','CANCELLED');
CREATE TYPE "PaymentAuthorizationStatus" AS ENUM ('AUTHORIZED','CAPTURED','VOIDED','EXPIRED');
CREATE TYPE "PaymentCaptureStatus" AS ENUM ('PENDING','SUCCEEDED','FAILED','REVERSED');
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING','PROCESSING','SUCCEEDED','FAILED','CANCELLED');
CREATE TYPE "PaymentWebhookStatus" AS ENUM ('RECEIVED','VERIFIED','PROCESSED','FAILED','REJECTED');

ALTER TABLE "ShoppingSellerOrder"
  ADD COLUMN "assignedToUserId" TEXT,
  ADD COLUMN "fulfillmentDueAt" TIMESTAMP(3),
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "pickingStartedAt" TIMESTAMP(3),
  ADD COLUMN "packedAt" TIMESTAMP(3),
  ADD COLUMN "readyToShipAt" TIMESTAMP(3),
  ADD COLUMN "shippedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

UPDATE "ShoppingSellerOrder" so
SET "fulfillmentDueAt" = o."placedAt" + INTERVAL '24 hours'
FROM "ShoppingOrder" o
WHERE so."orderId" = o."id" AND so."fulfillmentDueAt" IS NULL;

CREATE INDEX "ShoppingSellerOrder_assignedToUserId_status_idx" ON "ShoppingSellerOrder"("assignedToUserId","status");
CREATE INDEX "ShoppingSellerOrder_fulfillmentDueAt_status_idx" ON "ShoppingSellerOrder"("fulfillmentDueAt","status");

ALTER TABLE "ShoppingReturn"
  ADD COLUMN "sellerOrderId" TEXT,
  ADD COLUMN "merchantId" TEXT,
  ADD COLUMN "eligibilityExpiresAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "returnCarrier" TEXT,
  ADD COLUMN "returnService" TEXT,
  ADD COLUMN "returnTrackingId" TEXT,
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "inspectedAt" TIMESTAMP(3),
  ADD COLUMN "requestedRefundMinor" BIGINT,
  ADD COLUMN "approvedRefundMinor" BIGINT;

ALTER TABLE "ShoppingReturnItem"
  ADD COLUMN "inspectedQuantity" INTEGER,
  ADD COLUMN "inspectionOutcome" TEXT,
  ADD COLUMN "conditionNotes" TEXT,
  ADD COLUMN "refundableAmountMinor" BIGINT,
  ADD COLUMN "restockApproved" BOOLEAN;

-- Safely attach legacy return cases only when every selected item belongs to exactly one seller order.
WITH return_sellers AS (
  SELECT ri."returnId", MIN(oi."sellerOrderId") AS "sellerOrderId", COUNT(DISTINCT oi."sellerOrderId") AS seller_count
  FROM "ShoppingReturnItem" ri
  JOIN "ShoppingOrderItem" oi ON oi."id" = ri."orderItemId"
  GROUP BY ri."returnId"
)
UPDATE "ShoppingReturn" r
SET "sellerOrderId" = rs."sellerOrderId",
    "merchantId" = so."merchantId"
FROM return_sellers rs
JOIN "ShoppingSellerOrder" so ON so."id" = rs."sellerOrderId"
WHERE r."id" = rs."returnId" AND rs.seller_count = 1;

CREATE INDEX "ShoppingReturn_sellerOrderId_status_createdAt_idx" ON "ShoppingReturn"("sellerOrderId","status","createdAt");
CREATE INDEX "ShoppingReturn_merchantId_status_createdAt_idx" ON "ShoppingReturn"("merchantId","status","createdAt");
CREATE INDEX "ShoppingReturn_returnTrackingId_idx" ON "ShoppingReturn"("returnTrackingId");
ALTER TABLE "ShoppingReturn" ADD CONSTRAINT "ShoppingReturn_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingReturn" ADD CONSTRAINT "ShoppingReturn_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE INDEX "ShoppingCancellationRequest_orderId_status_createdAt_idx" ON "ShoppingCancellationRequest"("orderId","status","createdAt");
CREATE INDEX "ShoppingCancellationRequest_sellerOrderId_status_createdAt_idx" ON "ShoppingCancellationRequest"("sellerOrderId","status","createdAt");
ALTER TABLE "ShoppingCancellationRequest" ADD CONSTRAINT "ShoppingCancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingCancellationRequest" ADD CONSTRAINT "ShoppingCancellationRequest_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE INDEX "Shipment_sellerOrderId_status_createdAt_idx" ON "Shipment"("sellerOrderId","status","createdAt");
CREATE INDEX "Shipment_carrier_trackingIdentifier_idx" ON "Shipment"("carrier","trackingIdentifier");
CREATE INDEX "Shipment_status_estimatedDeliveryAt_idx" ON "Shipment"("status","estimatedDeliveryAt");
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "ShoppingSellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ShipmentItem" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_orderItemId_key" ON "ShipmentItem"("shipmentId","orderItemId");
CREATE INDEX "ShipmentItem_orderItemId_idx" ON "ShipmentItem"("orderItemId");
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShoppingOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE INDEX "ShipmentEvent_shipmentId_occurredAt_idx" ON "ShipmentEvent"("shipmentId","occurredAt");
CREATE INDEX "ShipmentEvent_externalEventId_idx" ON "ShipmentEvent"("externalEventId");
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ShoppingReturnEvidence" (
  "id" TEXT NOT NULL,
  "returnId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShoppingReturnEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShoppingReturnEvidence_returnId_createdAt_idx" ON "ShoppingReturnEvidence"("returnId","createdAt");
ALTER TABLE "ShoppingReturnEvidence" ADD CONSTRAINT "ShoppingReturnEvidence_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
CREATE INDEX "ShoppingReturnEvent_returnId_createdAt_idx" ON "ShoppingReturnEvent"("returnId","createdAt");
CREATE INDEX "ShoppingReturnEvent_actorUserId_createdAt_idx" ON "ShoppingReturnEvent"("actorUserId","createdAt");
ALTER TABLE "ShoppingReturnEvent" ADD CONSTRAINT "ShoppingReturnEvent_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
CREATE INDEX "ShoppingReturnDispute_returnId_status_createdAt_idx" ON "ShoppingReturnDispute"("returnId","status","createdAt");
CREATE INDEX "ShoppingReturnDispute_status_createdAt_idx" ON "ShoppingReturnDispute"("status","createdAt");
ALTER TABLE "ShoppingReturnDispute" ADD CONSTRAINT "ShoppingReturnDispute_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ShoppingReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE UNIQUE INDEX "PaymentIntent_orderId_key" ON "PaymentIntent"("orderId");
CREATE UNIQUE INDEX "PaymentIntent_legacyPaymentId_key" ON "PaymentIntent"("legacyPaymentId");
CREATE UNIQUE INDEX "PaymentIntent_clientReference_key" ON "PaymentIntent"("clientReference");
CREATE INDEX "PaymentIntent_status_createdAt_idx" ON "PaymentIntent"("status","createdAt");
CREATE INDEX "PaymentIntent_provider_providerReference_idx" ON "PaymentIntent"("provider","providerReference");
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShoppingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_legacyPaymentId_fkey" FOREIGN KEY ("legacyPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE UNIQUE INDEX "PaymentAttempt_paymentIntentId_attemptNumber_key" ON "PaymentAttempt"("paymentIntentId","attemptNumber");
CREATE UNIQUE INDEX "PaymentAttempt_paymentIntentId_idempotencyKey_key" ON "PaymentAttempt"("paymentIntentId","idempotencyKey");
CREATE INDEX "PaymentAttempt_provider_providerReference_idx" ON "PaymentAttempt"("provider","providerReference");
CREATE INDEX "PaymentAttempt_status_nextRetryAt_idx" ON "PaymentAttempt"("status","nextRetryAt");
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE INDEX "PaymentAuthorization_paymentIntentId_status_authorizedAt_idx" ON "PaymentAuthorization"("paymentIntentId","status","authorizedAt");
CREATE INDEX "PaymentAuthorization_providerReference_idx" ON "PaymentAuthorization"("providerReference");
ALTER TABLE "PaymentAuthorization" ADD CONSTRAINT "PaymentAuthorization_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAuthorization" ADD CONSTRAINT "PaymentAuthorization_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE INDEX "PaymentCapture_paymentIntentId_status_createdAt_idx" ON "PaymentCapture"("paymentIntentId","status","createdAt");
CREATE INDEX "PaymentCapture_providerReference_idx" ON "PaymentCapture"("providerReference");
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentCapture" ADD CONSTRAINT "PaymentCapture_paymentAuthorizationId_fkey" FOREIGN KEY ("paymentAuthorizationId") REFERENCES "PaymentAuthorization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE UNIQUE INDEX "PaymentRefund_paymentIntentId_idempotencyKey_key" ON "PaymentRefund"("paymentIntentId","idempotencyKey");
CREATE INDEX "PaymentRefund_shoppingReturnId_status_idx" ON "PaymentRefund"("shoppingReturnId","status");
CREATE INDEX "PaymentRefund_status_createdAt_idx" ON "PaymentRefund"("status","createdAt");
CREATE INDEX "PaymentRefund_provider_providerReference_idx" ON "PaymentRefund"("provider","providerReference");
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_shoppingReturnId_fkey" FOREIGN KEY ("shoppingReturnId") REFERENCES "ShoppingReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE INDEX "PaymentFailure_paymentIntentId_createdAt_idx" ON "PaymentFailure"("paymentIntentId","createdAt");
CREATE INDEX "PaymentFailure_code_createdAt_idx" ON "PaymentFailure"("code","createdAt");
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider","eventId");
CREATE INDEX "PaymentWebhookEvent_provider_status_receivedAt_idx" ON "PaymentWebhookEvent"("provider","status","receivedAt");

CREATE TABLE "PaymentReconciliation" (
  "id" TEXT NOT NULL,
  "paymentIntentId" TEXT,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT,
  "reportedStatus" TEXT NOT NULL,
  "reportedAmountMinor" BIGINT,
  "expectedAmountMinor" BIGINT,
  "differenceMinor" BIGINT,
  "source" TEXT NOT NULL,
  "actorUserId" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PaymentReconciliation_paymentIntentId_observedAt_idx" ON "PaymentReconciliation"("paymentIntentId","observedAt");
CREATE INDEX "PaymentReconciliation_provider_providerReference_observedAt_idx" ON "PaymentReconciliation"("provider","providerReference","observedAt");
CREATE INDEX "PaymentReconciliation_resolvedAt_observedAt_idx" ON "PaymentReconciliation"("resolvedAt","observedAt");
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Wrap pre-existing orders with orchestration intents without replacing legacy Payment records.
INSERT INTO "PaymentIntent" (
  "id","orderId","legacyPaymentId","clientReference","status","paymentMethod","provider","providerReference",
  "amountMinor","capturedMinor","refundedMinor","currency","metadata","createdAt","updatedAt","succeededAt","cancelledAt"
)
SELECT
  'pi_' || md5(o."id"),
  o."id",
  o."paymentId",
  'PI-LEGACY-' || o."id",
  CASE
    WHEN p."status" = 'CAPTURED' THEN 'SUCCEEDED'::"PaymentIntentStatus"
    WHEN p."status" = 'AUTHORIZED' THEN 'REQUIRES_CAPTURE'::"PaymentIntentStatus"
    WHEN p."status" = 'FAILED' THEN 'FAILED'::"PaymentIntentStatus"
    WHEN p."status" = 'CANCELLED' THEN 'CANCELLED'::"PaymentIntentStatus"
    WHEN p."status" = 'REFUNDED' THEN 'REFUNDED'::"PaymentIntentStatus"
    WHEN p."status" = 'PARTIALLY_REFUNDED' THEN 'PARTIALLY_REFUNDED'::"PaymentIntentStatus"
    WHEN o."paymentMethod" = 'PAY_ON_DELIVERY' THEN 'PROCESSING'::"PaymentIntentStatus"
    ELSE 'REQUIRES_PAYMENT_METHOD'::"PaymentIntentStatus"
  END,
  o."paymentMethod",
  p."provider",
  p."providerReference",
  o."totalMinor",
  CASE WHEN p."status" IN ('CAPTURED','REFUNDED','PARTIALLY_REFUNDED') THEN o."totalMinor" ELSE 0 END,
  CASE WHEN p."status" = 'REFUNDED' THEN o."totalMinor" ELSE 0 END,
  o."currency",
  jsonb_build_object('source','roadmap-16-20-backfill'),
  o."createdAt",
  CURRENT_TIMESTAMP,
  CASE WHEN p."status" = 'CAPTURED' THEN p."updatedAt" ELSE NULL END,
  CASE WHEN p."status" = 'CANCELLED' THEN p."updatedAt" ELSE NULL END
FROM "ShoppingOrder" o
LEFT JOIN "Payment" p ON p."id" = o."paymentId"
WHERE NOT EXISTS (SELECT 1 FROM "PaymentIntent" pi WHERE pi."orderId" = o."id");
