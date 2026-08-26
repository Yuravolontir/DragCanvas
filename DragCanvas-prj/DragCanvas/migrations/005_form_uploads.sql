CREATE TABLE IF NOT EXISTS "TBFormUploads" (
  "Upload_ID" bigserial PRIMARY KEY,
  "Project_ID" integer NOT NULL REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "Submission_ID" integer REFERENCES "TBFormSubmissions"("Submission_ID") ON DELETE CASCADE,
  "TokenHash" char(64) NOT NULL UNIQUE,
  "Url" text NOT NULL,
  "PublicId" text NOT NULL,
  "OriginalName" varchar(255) NOT NULL,
  "MimeType" varchar(80) NOT NULL,
  "Bytes" integer NOT NULL,
  "CreatedDate" timestamp NOT NULL DEFAULT NOW(),
  "ExpiresDate" timestamp NOT NULL DEFAULT NOW() + interval '1 hour'
);
