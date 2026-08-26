CREATE TABLE IF NOT EXISTS "TBProducts" (
  "Product_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "Name" varchar(200) NOT NULL,
  "Description" text,
  "PriceMinor" integer NOT NULL CHECK ("PriceMinor" >= 0),
  "Currency" char(3) NOT NULL DEFAULT 'usd',
  "ImageUrl" text,
  "SortOrder" integer NOT NULL DEFAULT 0,
  "IsActive" boolean NOT NULL DEFAULT true,
  "CreatedDate" timestamp NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "TBOrders" (
  "Order_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "StripeSessionId" varchar(255) UNIQUE,
  "CustomerEmail" varchar(320),
  "Items" jsonb NOT NULL,
  "AmountMinor" integer NOT NULL,
  "Currency" char(3) NOT NULL,
  "Status" varchar(20) NOT NULL DEFAULT 'pending',
  "CreatedDate" timestamp NOT NULL DEFAULT NOW(),
  "PaidDate" timestamp
);
