CREATE TABLE "NotificationAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "providerRef" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationAttempt_idempotencyKey_key" ON "NotificationAttempt"("idempotencyKey");
CREATE INDEX "NotificationAttempt_orderId_channel_eventKey_idx" ON "NotificationAttempt"("orderId", "channel", "eventKey");
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;