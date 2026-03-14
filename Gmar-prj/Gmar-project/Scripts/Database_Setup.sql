

USE master
GO


-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE DragCanvas
COLLATE Hebrew_CI_AS
GO

PRINT 'Database DragCanvas created successfully'
GO

USE DragCanvas
GO

-- ============================================
-- TABLE: TBUsers (Users table)
-- ============================================
-- Purpose: Store user authentication data
-- React sends: username, email, password → SQL validates & stores
IF OBJECT_ID('dbo.TBUsers', 'U') IS NOT NULL
    DROP TABLE dbo.TBUsers
GO

CREATE TABLE dbo.TBUsers (
    -- Primary Key
    User_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- User Information
    UserName NVARCHAR(50) NOT NULL,
    UserEmail NVARCHAR(100) NOT NULL,
    UserPassword NVARCHAR(255) NOT NULL,

    -- Status Fields
    IsActive BIT DEFAULT 1,                -- 1=Active, 0=Inactive
    IsAdmin BIT DEFAULT 0,                 -- 1=Admin, 0=Regular User

    -- Timestamps
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastLoginDate DATETIME,

    -- Constraints
    CONSTRAINT UQ_TBUsers_Email UNIQUE (UserEmail),
    CONSTRAINT UQ_TBUsers_Name UNIQUE (UserName),
    CONSTRAINT CK_TBUsers_Email CHECK (UserEmail LIKE '%@%')
)
GO

PRINT 'Table TBUsers created successfully'
GO

-- ============================================
-- TABLE: TBProjects (Projects table - METADATA ONLY)
-- ============================================
-- Purpose: Store project metadata (components stored in React state)
-- React stores: Complete component tree in frontend
-- SQL stores: Project info for listing, search, and audit
IF OBJECT_ID('dbo.TBProjects', 'U') IS NOT NULL
    DROP TABLE dbo.TBProjects
GO

CREATE TABLE dbo.TBProjects (
    -- Primary Key
    Project_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- Foreign Key to Users
    User_ID INT NOT NULL,

    -- Project Information (metadata only, NO component data)
    ProjectName NVARCHAR(100) NOT NULL,
    ProjectDescription NVARCHAR(500) NULL,

    -- Project Size (for storage tracking - calculated by React)
    ComponentCount INT DEFAULT 0,          -- Number of components
    ProjectSizeKB DECIMAL(10,2) DEFAULT 0, -- Size in KB

    -- Status Fields
    IsPublished BIT DEFAULT 0,             -- 1=Published, 0=Draft
    IsDeleted BIT DEFAULT 0,               -- Logical delete flag
    PublishedURL NVARCHAR(255) NULL,       -- URL if published

    -- Export tracking
    ExportCount INT DEFAULT 0,             -- How many times exported
    LastExportDate DATETIME NULL,          -- Last export time
    ExportFormat NVARCHAR(20) NULL,        -- html, json, etc.

    -- Timestamps
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    PublishedDate DATETIME NULL,

    -- Foreign Key Constraint
    CONSTRAINT FK_TBProjects_TBUsers FOREIGN KEY (User_ID)
        REFERENCES dbo.TBUsers(User_ID)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT CK_TBProjects_PublishedUrl CHECK (
        IsPublished = 0 OR PublishedURL IS NOT NULL
    ),
    CONSTRAINT CK_TBProjects_ComponentCount CHECK (
        ComponentCount >= 0
    )
)
GO

PRINT 'Table TBProjects created successfully'
GO

-- ============================================
-- TABLE: TBExportHistory (Export tracking)
-- ============================================
-- Purpose: Track when projects are exported
IF OBJECT_ID('dbo.TBExportHistory', 'U') IS NOT NULL
    DROP TABLE dbo.TBExportHistory
GO

CREATE TABLE dbo.TBExportHistory (
    -- Primary Key
    Export_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- Foreign Key to Projects
    Project_ID INT NOT NULL,

    -- Export Information
    ExportFormat NVARCHAR(20) NOT NULL,    -- html, css, json
    ExportPath NVARCHAR(500) NULL,         -- Where file was saved
    ExportSizeKB DECIMAL(10,2) NULL,       -- File size

    -- Timestamps
    ExportDate DATETIME DEFAULT GETDATE(),

    -- Foreign Key Constraint
    CONSTRAINT FK_TBExportHistory_TBProjects FOREIGN KEY (Project_ID)
        REFERENCES dbo.TBProjects(Project_ID)
        ON DELETE CASCADE
)
GO

PRINT 'Table TBExportHistory created successfully'
GO

-- ============================================
-- TABLE: TBAuditLog (Audit Log table)
-- ============================================
-- Purpose: Track all changes for security and accountability
-- React sends actions → SQL logs them
IF OBJECT_ID('dbo.TBAuditLog', 'U') IS NOT NULL
    DROP TABLE dbo.TBAuditLog
GO

CREATE TABLE dbo.TBAuditLog (
    -- Primary Key
    Audit_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- Who made the change
    User_ID INT NULL,

    -- What table/area was affected
    TableName NVARCHAR(50) NOT NULL,
    RecordID INT NULL,

    -- What action was performed
    ActionType NVARCHAR(20) NOT NULL,      -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, PUBLISH
    ActionCategory NVARCHAR(20) NULL,      -- AUTH, PROJECT, EXPORT, SYSTEM

    -- Details
    ActionDescription NVARCHAR(500) NULL,
    OldValue NVARCHAR(MAX) NULL,
    NewValue NVARCHAR(MAX) NULL,

    -- Additional info
    ActionDate DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(255) NULL,          -- Browser info

    -- Foreign Key Constraint
    CONSTRAINT FK_TBAuditLog_TBUsers FOREIGN KEY (User_ID)
        REFERENCES dbo.TBUsers(User_ID)
        ON DELETE SET NULL
)
GO

PRINT 'Table TBAuditLog created successfully'
GO

-- ============================================
-- TABLE: TBSettings (Application Settings table)
-- ============================================
-- Purpose: Store application-wide settings
IF OBJECT_ID('dbo.TBSettings', 'U') IS NOT NULL
    DROP TABLE dbo.TBSettings
GO

CREATE TABLE dbo.TBSettings (
    -- Primary Key
    Setting_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- Setting Information
    SettingKey NVARCHAR(50) NOT NULL,
    SettingValue NVARCHAR(500) NULL,
    SettingDescription NVARCHAR(255) NULL,
    Category NVARCHAR(50) NULL,

    -- Timestamps
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),

    -- Constraints
    CONSTRAINT UQ_TBSettings_Key UNIQUE (SettingKey)
)
GO

PRINT 'Table TBSettings created successfully'
GO

-- ============================================
-- TABLE: TBUserActivity (User activity tracking)
-- ============================================
-- Purpose: Track user sessions and activity
IF OBJECT_ID('dbo.TBUserActivity', 'U') IS NOT NULL
    DROP TABLE dbo.TBUserActivity
GO

CREATE TABLE dbo.TBUserActivity (
    -- Primary Key
    Activity_ID INT IDENTITY(1,1) PRIMARY KEY,

    -- Foreign Key to Users
    User_ID INT NOT NULL,

    -- Activity Information
    ActivityType NVARCHAR(50) NOT NULL,    -- LOGIN, LOGOUT, CREATE_PROJECT, EDIT_PROJECT, EXPORT
    ProjectID INT NULL,                    -- If activity is project-related
    ActivityDescription NVARCHAR(500) NULL,
    DurationMinutes INT NULL,               -- Session duration

    -- Timestamps
    ActivityDate DATETIME DEFAULT GETDATE(),

    -- Foreign Key Constraint
    CONSTRAINT FK_TBUserActivity_TBUsers FOREIGN KEY (User_ID)
        REFERENCES dbo.TBUsers(User_ID)
        ON DELETE CASCADE
)
GO

PRINT 'Table TBUserActivity created successfully'
GO

-- ============================================
-- CREATE INDEXES for better performance
-- ============================================

-- Index on TBUsers email for fast login lookup
CREATE INDEX IX_TBUsers_Email ON dbo.TBUsers(UserEmail)
GO

-- Index on TBProjects for user projects lookup
CREATE INDEX IX_TBProjects_User_ID ON dbo.TBProjects(User_ID)
GO

-- Index on TBProjects for active projects
CREATE INDEX IX_TBProjects_Active ON dbo.TBProjects(User_ID, IsDeleted)
GO

-- Index on TBProjects for published projects
CREATE INDEX IX_TBProjects_Published ON dbo.TBProjects(IsPublished, PublishedDate)
GO

-- Index on TBAuditLog for user activity history
CREATE INDEX IX_TBAuditLog_User_ID ON dbo.TBAuditLog(User_ID, ActionDate)
GO

-- Index on TBAuditLog for table-specific audit
CREATE INDEX IX_TBAuditLog_Table ON dbo.TBAuditLog(TableName, ActionDate)
GO

-- Index on TBAuditLog for action type
CREATE INDEX IX_TBAuditLog_ActionType ON dbo.TBAuditLog(ActionType, ActionDate)
GO

-- Index on TBExportHistory for project exports
CREATE INDEX IX_TBExportHistory_Project_ID ON dbo.TBExportHistory(Project_ID, ExportDate)
GO

-- Index on TBUserActivity for user statistics
CREATE INDEX IX_TBUserActivity_User_ID ON dbo.TBUserActivity(User_ID, ActivityDate)
GO

PRINT 'Indexes created successfully'
GO

-- ============================================
-- INSERT DEFAULT SETTINGS
-- ============================================

INSERT INTO dbo.TBSettings (SettingKey, SettingValue, SettingDescription, Category) VALUES
(N'MaxProjectsPerUser', N'10', N'Maximum number of projects per user', N'General'),
(N'MaxProjectSizeMB', N'5', N'Maximum project size in megabytes', N'General'),
(N'EnableAI', N'1', N'Enable AI assistant feature', N'AI'),
(N'DefaultExportFormat', N'html', N'Default export format for projects', N'Export'),
(N'MinPasswordLength', N'6', N'Minimum password length for users', N'Security'),
(N'MaxExportFileSize', N'10', N'Maximum export file size in MB', N'Export'),
(N'SessionTimeoutMinutes', N'60', N'user session timeout in minutes', N'Security'),
(N'EnableAnalytics', N'1', N'Enable usage analytics tracking', N'General')
GO

PRINT 'Default settings inserted successfully'
GO

-- ============================================
-- CREATE VIEWS for common queries
-- ============================================

-- View: Active projects with user information
IF OBJECT_ID('dbo.VW_ActiveProjects', 'V') IS NOT NULL
    DROP VIEW dbo.VW_ActiveProjects
GO

CREATE VIEW dbo.VW_ActiveProjects AS
SELECT
    p.Project_ID,
    p.ProjectName,
    p.ProjectDescription,
    p.ComponentCount,
    p.ProjectSizeKB,
    p.IsPublished,
    p.PublishedURL,
    p.CreatedDate,
    p.ModifiedDate,
    p.ExportCount,
    p.LastExportDate,
    u.User_ID,
    u.UserName,
    u.UserEmail
FROM dbo.TBProjects p
INNER JOIN dbo.TBUsers u ON p.User_ID = u.User_ID
WHERE p.IsDeleted = 0
GO

PRINT 'View VW_ActiveProjects created successfully'
GO

-- View: Audit log summary with usernames
IF OBJECT_ID('dbo.VW_AuditSummary', 'V') IS NOT NULL
    DROP VIEW dbo.VW_AuditSummary
GO

CREATE VIEW dbo.VW_AuditSummary AS
SELECT
    a.Audit_ID,
    a.TableName,
    a.ActionType,
    a.ActionCategory,
    a.ActionDescription,
    a.ActionDate,
    a.IPAddress,
    u.UserName,
    u.UserEmail
FROM dbo.TBAuditLog a
LEFT JOIN dbo.TBUsers u ON a.User_ID = u.User_ID
GO

PRINT 'View VW_AuditSummary created successfully'
GO

-- View: User statistics (projects, exports, activity)
IF OBJECT_ID('dbo.VW_UserStatistics', 'V') IS NOT NULL
    DROP VIEW dbo.VW_UserStatistics
GO

CREATE VIEW dbo.VW_UserStatistics AS
SELECT
    u.User_ID,
    u.UserName,
    u.UserEmail,
    u.CreatedDate AS UserSince,
    u.LastLoginDate,
    (SELECT COUNT(*) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID AND p.IsDeleted = 0) AS TotalProjects,
    (SELECT COUNT(*) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID AND p.IsDeleted = 0 AND p.IsPublished = 1) AS PublishedProjects,
    (SELECT SUM(p.ComponentCount) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID AND p.IsDeleted = 0) AS TotalComponents,
    (SELECT SUM(p.ExportCount) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID) AS TotalExports,
    (SELECT COUNT(*) FROM dbo.TBUserActivity a WHERE a.User_ID = u.User_ID) AS TotalActivities,
    (SELECT COUNT(*) FROM dbo.TBAuditLog l WHERE l.User_ID = u.User_ID) AS TotalAuditEntries
FROM dbo.TBUsers u
WHERE u.IsActive = 1
GO

PRINT 'View VW_UserStatistics created successfully'
GO

-- View: Published projects for public listing
IF OBJECT_ID('dbo.VW_PublishedProjects', 'V') IS NOT NULL
    DROP VIEW dbo.VW_PublishedProjects
GO

CREATE VIEW dbo.VW_PublishedProjects AS
SELECT
    p.Project_ID,
    p.ProjectName,
    p.ProjectDescription,
    p.PublishedURL,
    p.PublishedDate,
    p.ComponentCount,
    u.UserName AS AuthorName,
    (SELECT COUNT(*) FROM dbo.TBExportHistory e WHERE e.Project_ID = p.Project_ID) AS ExportCount
FROM dbo.TBProjects p
INNER JOIN dbo.TBUsers u ON p.User_ID = u.User_ID
WHERE p.IsPublished = 1 AND p.IsDeleted = 0
GO

PRINT 'View VW_PublishedProjects created successfully'
GO

-- View: Export statistics
IF OBJECT_ID('dbo.VW_ExportStatistics', 'V') IS NOT NULL
    DROP VIEW dbo.VW_ExportStatistics
GO

CREATE VIEW dbo.VW_ExportStatistics AS
SELECT TOP 100 PERCENT
    e.Export_ID,
    e.Project_ID,
    p.ProjectName,
    u.UserName,
    e.ExportFormat,
    e.ExportSizeKB,
    e.ExportDate
FROM dbo.TBExportHistory e
INNER JOIN dbo.TBProjects p ON e.Project_ID = p.Project_ID
INNER JOIN dbo.TBUsers u ON p.User_ID = u.User_ID
ORDER BY e.ExportDate DESC
GO

PRINT 'View VW_ExportStatistics created successfully'
GO

-- View: User permissions overview
IF OBJECT_ID('dbo.VW_UserPermissions', 'V') IS NOT NULL
    DROP VIEW dbo.VW_UserPermissions
GO

CREATE VIEW dbo.VW_UserPermissions AS
SELECT
    u.User_ID,
    u.UserName,
    u.UserEmail,
    u.IsActive,
    u.IsAdmin,
    u.CreatedDate,
    u.LastLoginDate,
    ISNULL((SELECT COUNT(*) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID AND p.IsDeleted = 0), 0) AS ProjectCount,
    ISNULL((SELECT COUNT(*) FROM dbo.TBProjects p WHERE p.User_ID = u.User_ID AND p.IsPublished = 1 AND p.IsDeleted = 0), 0) AS PublishedProjectCount,
    ISNULL((SELECT COUNT(*) FROM dbo.TBExportHistory e
     INNER JOIN dbo.TBProjects p ON e.Project_ID = p.Project_ID
     WHERE p.User_ID = u.User_ID), 0) AS ExportCount,
    (SELECT TOP 1 a.ActivityDate
     FROM dbo.TBUserActivity a
     WHERE a.User_ID = u.User_ID
     ORDER BY a.ActivityDate DESC) AS LastActivityDate
FROM dbo.TBUsers u
GO

PRINT 'View VW_UserPermissions created successfully'
GO


