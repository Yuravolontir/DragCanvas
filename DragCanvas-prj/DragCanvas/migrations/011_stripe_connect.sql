CREATE TABLE IF NOT EXISTS "TBProjectPaymentSettings" (
  "Project_ID" integer PRIMARY KEY REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "StripeAccountId" varchar(255),
  "StripeLivemode" boolean NOT NULL DEFAULT false,
  "OAuthStateHash" char(64),
  "OAuthStateExpiresDate" timestamp,
  "ConnectedDate" timestamp,
  "UpdatedDate" timestamp NOT NULL DEFAULT NOW()
);

ALTER TABLE "TBOrders" ADD COLUMN IF NOT EXISTS "StripeAccountId" varchar(255);
