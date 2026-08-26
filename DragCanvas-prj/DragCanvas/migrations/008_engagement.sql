CREATE TABLE IF NOT EXISTS "TBProjectEngagement" (
  "Entry_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "WidgetKey" varchar(100) NOT NULL,
  "Kind" varchar(16) NOT NULL CHECK ("Kind" IN ('review','reaction','poll')),
  "Author" varchar(120),
  "Content" text,
  "OptionValue" varchar(200),
  "VisitorHash" char(64),
  "Status" varchar(16) NOT NULL DEFAULT 'approved' CHECK ("Status" IN ('pending','approved','rejected')),
  "CreatedDate" timestamp NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_ProjectEngagement_VisitorVote" ON "TBProjectEngagement" ("Project_ID","WidgetKey","Kind","VisitorHash") WHERE "Kind" IN ('reaction','poll');
CREATE INDEX IF NOT EXISTS "IX_ProjectEngagement_Public" ON "TBProjectEngagement" ("Project_ID","WidgetKey","Status");
