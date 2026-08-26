CREATE TABLE IF NOT EXISTS "TBBookingSettings" (
  "Project_ID" integer PRIMARY KEY REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "TimeZone" varchar(100) NOT NULL DEFAULT 'UTC',
  "StartHour" smallint NOT NULL DEFAULT 9 CHECK ("StartHour" BETWEEN 0 AND 23),
  "EndHour" smallint NOT NULL DEFAULT 17 CHECK ("EndHour" BETWEEN 1 AND 24),
  "Duration" smallint NOT NULL DEFAULT 60 CHECK ("Duration" BETWEEN 15 AND 240),
  "UpdatedDate" timestamp NOT NULL DEFAULT NOW(),
  CHECK ("EndHour" > "StartHour")
);
