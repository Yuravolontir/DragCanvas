CREATE TABLE IF NOT EXISTS "TBPublishedVersions" (
  "Version_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "Html" text NOT NULL,
  "Files" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "PublishedUrl" text,
  "CreatedDate" timestamp NOT NULL DEFAULT NOW()
);
ALTER TABLE "TBProjects" ADD COLUMN IF NOT EXISTS "PreviewHtml" text;
ALTER TABLE "TBProjects" ADD COLUMN IF NOT EXISTS "PreviewTokenHash" char(64);
ALTER TABLE "TBProjects" ADD COLUMN IF NOT EXISTS "PreviewExpiresDate" timestamp;
