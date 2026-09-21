ALTER TABLE "OrderItem" ADD COLUMN "baseUnitPrice" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "personalizationSurcharge" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "LegalConsentSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "documentUrl" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "accepted" BOOLEAN NOT NULL,
  "acceptedAt" TIMESTAMP,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalConsentSnapshot_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LegalConsentSnapshot_orderId_consentType_key"
  ON "LegalConsentSnapshot"("orderId", "consentType");

CREATE TABLE "ShippingRuleSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "country" TEXT NOT NULL,
  "shippingScope" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "freeThreshold" INTEGER NOT NULL,
  "fee" INTEGER NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "chargeable" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingRuleSnapshot_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BoldTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "externalReference" TEXT NOT NULL UNIQUE,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "signatureHash" TEXT,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoldTransaction_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
