ALTER TABLE "Payment"
ALTER COLUMN "amount" TYPE DECIMAL(12, 2)
USING ROUND("amount"::numeric, 2);
