CREATE TABLE IF NOT EXISTS "TBProjectIntegrations" (
  "Project_ID" integer PRIMARY KEY REFERENCES "TBProjects"("Project_ID") ON DELETE CASCADE,
  "WebhookUrl" text,
  "TelegramChatId" varchar(64),
  "UpdatedDate" timestamp NOT NULL DEFAULT NOW()
);
