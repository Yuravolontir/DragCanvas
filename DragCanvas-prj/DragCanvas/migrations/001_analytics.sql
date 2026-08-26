CREATE TABLE IF NOT EXISTS "TBProjectAnalyticsDaily" (
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "Day" date NOT NULL DEFAULT CURRENT_DATE,
  "Referrer" varchar(255) NOT NULL DEFAULT 'direct',
  "ScreenBucket" varchar(16) NOT NULL DEFAULT 'unknown',
  "Views" integer NOT NULL DEFAULT 0,
  "Conversions" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("Project_ID", "Day", "Referrer", "ScreenBucket")
);

CREATE INDEX IF NOT EXISTS "IX_ProjectAnalytics_ProjectDay"
  ON "TBProjectAnalyticsDaily" ("Project_ID", "Day" DESC);
