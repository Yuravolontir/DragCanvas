CREATE TABLE IF NOT EXISTS "TBProjectSubscribers" (
  "Subscriber_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "Email" varchar(320) NOT NULL,
  "Status" varchar(16) NOT NULL DEFAULT 'pending' CHECK ("Status" IN ('pending', 'active', 'unsubscribed')),
  "ConfirmTokenHash" char(64),
  "UnsubscribeTokenHash" char(64) NOT NULL,
  "CreatedDate" timestamp NOT NULL DEFAULT NOW(),
  "ConfirmedDate" timestamp,
  "UnsubscribedDate" timestamp,
  UNIQUE ("Project_ID", "Email")
);

CREATE INDEX IF NOT EXISTS "IX_ProjectSubscribers_Tokens"
  ON "TBProjectSubscribers" ("ConfirmTokenHash", "UnsubscribeTokenHash");
