CREATE TABLE IF NOT EXISTS "TBProjectBookings" (
  "Booking_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "StartAt" timestamptz NOT NULL,
  "EndAt" timestamptz NOT NULL,
  "Name" varchar(160) NOT NULL,
  "Email" varchar(320) NOT NULL,
  "Notes" text,
  "Status" varchar(16) NOT NULL DEFAULT 'confirmed',
  "CreatedDate" timestamp NOT NULL DEFAULT NOW(),
  UNIQUE ("Project_ID", "StartAt")
);
CREATE INDEX IF NOT EXISTS "IX_ProjectBookings_ProjectStart" ON "TBProjectBookings" ("Project_ID", "StartAt");
