-- DragCanvas PostgreSQL Migration Script for Supabase
-- Run this in Supabase SQL Editor to create all tables

CREATE TABLE IF NOT EXISTS TBUsers (
    User_ID SERIAL PRIMARY KEY,
    UserName VARCHAR(100) NOT NULL,
    UserEmail VARCHAR(255) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    IsAdmin BOOLEAN DEFAULT FALSE,
    IsSuperAdmin BOOLEAN DEFAULT FALSE,
    SessionToken VARCHAR(500),
    SessionExpiry TIMESTAMP,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    LastLoginDate TIMESTAMP,
    ModifiedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBProjects (
    Project_ID SERIAL PRIMARY KEY,
    User_ID INTEGER NOT NULL REFERENCES TBUsers(User_ID) ON DELETE CASCADE,
    ProjectName VARCHAR(255) NOT NULL,
    ProjectDescription TEXT,
    ComponentCount INTEGER DEFAULT 0,
    ExportCount INTEGER DEFAULT 0,
    ProjectSizeKB DECIMAL(10,2) DEFAULT 0,
    ProjectData TEXT,
    ThumbnailURL TEXT,
    IsPublished BOOLEAN DEFAULT FALSE,
    IsDeleted BOOLEAN DEFAULT FALSE,
    CustomDomain VARCHAR(255),
    PublishedHtml TEXT,
    PublishedURL VARCHAR(255),
    PublishedDate TIMESTAMP,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    ModifiedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBTemplates (
    Template_ID SERIAL PRIMARY KEY,
    TemplateName VARCHAR(255) NOT NULL,
    Category VARCHAR(100),
    ThumbnailURL TEXT,
    TemplateData TEXT,
    ComponentCount INTEGER DEFAULT 0,
    CreatedBy INTEGER REFERENCES TBUsers(User_ID),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    ModifiedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBNotifications (
    Notification_ID SERIAL PRIMARY KEY,
    Subject VARCHAR(500),
    Message TEXT,
    NotificationType VARCHAR(50),
    RecipientType VARCHAR(50),
    RecipientIDs TEXT,
    Status VARCHAR(50) DEFAULT 'Pending',
    SentCount INTEGER DEFAULT 0,
    CreatedBy INTEGER REFERENCES TBUsers(User_ID),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    SentDate TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TBNotificationDeliveryLog (
    Log_ID SERIAL PRIMARY KEY,
    Notification_ID INTEGER NOT NULL REFERENCES TBNotifications(Notification_ID) ON DELETE CASCADE,
    User_ID INTEGER REFERENCES TBUsers(User_ID) ON DELETE CASCADE,
    UserName VARCHAR(100),
    UserEmail VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'Pending',
    DeliveredDate TIMESTAMP DEFAULT NOW(),
    ViewedDate TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TBNotificationTemplates (
    Template_ID SERIAL PRIMARY KEY,
    TemplateName VARCHAR(255),
    TemplateType VARCHAR(50),
    Subject VARCHAR(500),
    Message TEXT,
    Variables TEXT,
    CreatedBy INTEGER REFERENCES TBUsers(User_ID),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    ModifiedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBNotificationSchedules (
    Schedule_ID SERIAL PRIMARY KEY,
    ScheduleName VARCHAR(255),
    NotificationType VARCHAR(50),
    Frequency VARCHAR(50),
    ScheduleTime VARCHAR(10),
    ScheduleDay VARCHAR(50),
    Template_ID INTEGER REFERENCES TBNotificationTemplates(Template_ID),
    RecipientType VARCHAR(50),
    RecipientIDs TEXT,
    MessageOverride TEXT,
    CreatedBy INTEGER REFERENCES TBUsers(User_ID),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    ModifiedDate TIMESTAMP DEFAULT NOW(),
    NextRunDate TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    LastRunDate TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TBNotificationSettings (
    Setting_ID SERIAL PRIMARY KEY,
    NotificationType VARCHAR(50) UNIQUE,
    IsEnabled BOOLEAN DEFAULT TRUE,
    ModifiedBy INTEGER REFERENCES TBUsers(User_ID),
    ModifiedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBUserActivity (
    Activity_ID SERIAL PRIMARY KEY,
    User_ID INTEGER REFERENCES TBUsers(User_ID) ON DELETE CASCADE,
    ActivityType VARCHAR(100),
    ProjectID INTEGER,
    ActivityDescription TEXT,
    DurationMinutes INTEGER,
    ActivityDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TBAuditLog (
    Log_ID SERIAL PRIMARY KEY,
    User_ID INTEGER REFERENCES TBUsers(User_ID),
    Action VARCHAR(100),
    ActionType VARCHAR(100),
    ActionCategory VARCHAR(100),
    ActionDescription TEXT,
    TableName VARCHAR(100),
    RecordID VARCHAR(100),
    Entity VARCHAR(100),
    EntityID VARCHAR(100),
    OldValues TEXT,
    NewValues TEXT,
    NewValue TEXT,
    IPAddress VARCHAR(50),
    ActionDate TIMESTAMP DEFAULT NOW(),
    CreatedDate TIMESTAMP DEFAULT NOW()
);
