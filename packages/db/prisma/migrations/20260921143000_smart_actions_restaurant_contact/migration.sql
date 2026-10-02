CREATE TABLE "RestaurantContact" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OPERATIONS',
  "phone" TEXT,
  "whatsappPhone" TEXT,
  "email" TEXT,
  "preferredChannel" TEXT NOT NULL DEFAULT 'PHONE',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isEmergency" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RestaurantContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RestaurantContact_restaurantId_active_isPrimary_idx" ON "RestaurantContact"("restaurantId", "active", "isPrimary");
CREATE INDEX "RestaurantContact_restaurantId_role_active_idx" ON "RestaurantContact"("restaurantId", "role", "active");

CREATE TABLE "SupportContactAttempt" (
  "id" TEXT NOT NULL,
  "clientActionId" TEXT NOT NULL,
  "supportCaseId" TEXT NOT NULL,
  "foodRestaurantId" TEXT NOT NULL,
  "contactId" TEXT,
  "actorUserId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "destinationLabel" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'INITIATED',
  "outcome" TEXT,
  "notes" TEXT,
  "durationSeconds" INTEGER,
  "followUpAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportContactAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupportContactAttempt_clientActionId_key" ON "SupportContactAttempt"("clientActionId");
CREATE INDEX "SupportContactAttempt_supportCaseId_createdAt_idx" ON "SupportContactAttempt"("supportCaseId", "createdAt");
CREATE INDEX "SupportContactAttempt_foodRestaurantId_createdAt_idx" ON "SupportContactAttempt"("foodRestaurantId", "createdAt");
CREATE INDEX "SupportContactAttempt_actorUserId_createdAt_idx" ON "SupportContactAttempt"("actorUserId", "createdAt");
CREATE INDEX "SupportContactAttempt_status_createdAt_idx" ON "SupportContactAttempt"("status", "createdAt");

ALTER TABLE "RestaurantContact" ADD CONSTRAINT "RestaurantContact_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportContactAttempt" ADD CONSTRAINT "SupportContactAttempt_supportCaseId_fkey" FOREIGN KEY ("supportCaseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportContactAttempt" ADD CONSTRAINT "SupportContactAttempt_foodRestaurantId_fkey" FOREIGN KEY ("foodRestaurantId") REFERENCES "FoodRestaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportContactAttempt" ADD CONSTRAINT "SupportContactAttempt_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "RestaurantContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportContactAttempt" ADD CONSTRAINT "SupportContactAttempt_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
