

USE DragCanvas
GO

PRINT 'Starting Triggers Creation...'
GO

-- ============================================
-- SECTION 1: TBUsers TABLE TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Log New User Registration
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBUsers_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBUsers_Insert
GO

CREATE TRIGGER dbo.TR_TBUsers_Insert
ON dbo.TBUsers
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @NewUserID INT
    DECLARE @NewUserName NVARCHAR(50)
    DECLARE @NewEmail NVARCHAR(100)

    -- Get new user details
    SELECT
        @NewUserID = User_ID,
        @NewUserName = UserName,
        @NewEmail = UserEmail
    FROM inserted

    -- Log the registration (additional logging)
    INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
    VALUES (@NewUserID, 'TBUsers', @NewUserID, 'INSERT', 'AUTH',
            'New user registered: ' + @NewUserName + ' (' + @NewEmail + ')',
            'User: ' + @NewUserName, GETDATE())

    PRINT 'Audit log created for new user: ' + @NewUserName
END
GO

PRINT 'Trigger TR_TBUsers_Insert created'
GO

-- --------------------------------------------
-- Trigger: Log User Updates
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBUsers_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBUsers_Update
GO

CREATE TRIGGER dbo.TR_TBUsers_Update
ON dbo.TBUsers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @UserID INT
    DECLARE @OldValue NVARCHAR(500)
    DECLARE @NewValue NVARCHAR(500)
    DECLARE @Changes NVARCHAR(1000)

    -- Check what changed
    IF UPDATE(UserName)
    BEGIN
        SELECT
            @UserID = i.User_ID,
            @OldValue = d.UserName,
            @NewValue = i.UserName
        FROM inserted i
        INNER JOIN deleted d ON i.User_ID = d.User_ID

        SET @Changes = 'UserName changed from ' + @OldValue + ' to ' + @NewValue

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, OldValue, NewValue, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBUsers', @UserID, 'UPDATE', @OldValue, @NewValue, @Changes, GETDATE())
    END

    IF UPDATE(UserEmail)
    BEGIN
        SELECT
            @UserID = i.User_ID,
            @OldValue = d.UserEmail,
            @NewValue = i.UserEmail
        FROM inserted i
        INNER JOIN deleted d ON i.User_ID = d.User_ID

        SET @Changes = 'Email changed from ' + @OldValue + ' to ' + @NewValue

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, OldValue, NewValue, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBUsers', @UserID, 'UPDATE', @OldValue, @NewValue, @Changes, GETDATE())
    END

    IF UPDATE(IsActive)
    BEGIN
        SELECT
            @UserID = i.User_ID,
            @OldValue = CAST(d.IsActive AS NVARCHAR(10)),
            @NewValue = CAST(i.IsActive AS NVARCHAR(10))
        FROM inserted i
        INNER JOIN deleted d ON i.User_ID = d.User_ID

        SET @Changes = 'User status changed to ' + CASE WHEN @NewValue = '1' THEN 'Active' ELSE 'Inactive' END

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBUsers', @UserID, 'STATUS_CHANGE', 'AUTH', @Changes, GETDATE())
    END
END
GO

PRINT 'Trigger TR_TBUsers_Update created'
GO

-- --------------------------------------------
-- Trigger: Log User Deletion (Prevent actual deletion)
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBUsers_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBUsers_Delete
GO

CREATE TRIGGER dbo.TR_TBUsers_Delete
ON dbo.TBUsers
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON

    -- Prevent deletion of users who have active projects
    IF EXISTS (
        SELECT 1 FROM deleted d
        INNER JOIN dbo.TBProjects p ON d.User_ID = p.User_ID
        WHERE p.IsDeleted = 0
    )
    BEGIN
        RAISERROR('Cannot delete user with existing projects. Use logical delete (IsActive=0) instead.', 16, 1)
        ROLLBACK TRANSACTION
        PRINT 'Deletion prevented: User has active projects'
        RETURN
    END

    -- Log the deletion
    DECLARE @DeletedUserID INT
    DECLARE @DeletedUserName NVARCHAR(50)

    SELECT
        @DeletedUserID = User_ID,
        @DeletedUserName = UserName
    FROM deleted

    INSERT INTO dbo.TBAuditLog (TableName, RecordID, ActionType, ActionCategory, ActionDescription, OldValue, ActionDate)
    VALUES ('TBUsers', @DeletedUserID, 'DELETE', 'AUTH', 'User deleted: ' + @DeletedUserName,
            'User: ' + @DeletedUserName, GETDATE())

    PRINT 'User deletion logged: ' + @DeletedUserName
END
GO

PRINT 'Trigger TR_TBUsers_Delete created'
GO

-- ============================================
-- SECTION 2: TBProjects TABLE TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Auto-update ModifiedDate on Project Update
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBProjects_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBProjects_Update
GO

CREATE TRIGGER dbo.TR_TBProjects_Update
ON dbo.TBProjects
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON

    -- Auto-update ModifiedDate if not explicitly set
    IF NOT UPDATE(ModifiedDate)
    BEGIN
        UPDATE dbo.TBProjects
        SET ModifiedDate = GETDATE()
        WHERE Project_ID IN (SELECT Project_ID FROM inserted)
    END

    -- Log important changes
    DECLARE @ProjectID INT
    DECLARE @UserID INT
    DECLARE @OldName NVARCHAR(100)
    DECLARE @NewName NVARCHAR(100)

    IF UPDATE(ProjectName)
    BEGIN
        SELECT
            @ProjectID = i.Project_ID,
            @UserID = i.User_ID,
            @OldName = d.ProjectName,
            @NewName = i.ProjectName
        FROM inserted i
        INNER JOIN deleted d ON i.Project_ID = d.Project_ID

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, OldValue, NewValue, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'UPDATE', 'PROJECT', @OldName, @NewName,
                'Project renamed', GETDATE())
    END

    IF UPDATE(IsPublished)
    BEGIN
        SELECT
            @ProjectID = i.Project_ID,
            @UserID = i.User_ID
        FROM inserted i
        INNER JOIN deleted d ON i.Project_ID = d.Project_ID
        WHERE d.IsPublished = 0 AND i.IsPublished = 1

        IF @ProjectID IS NOT NULL
        BEGIN
            INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
            VALUES (@UserID, 'TBProjects', @ProjectID, 'PUBLISH', 'PROJECT',
                    'Project published: ID ' + CAST(@ProjectID AS NVARCHAR(10)), GETDATE())
        END
    END

    IF UPDATE(ComponentCount)
    BEGIN
        DECLARE @NewComponentCount INT
        SELECT
            @ProjectID = i.Project_ID,
            @UserID = i.User_ID,
            @NewComponentCount = i.ComponentCount
        FROM inserted i
        INNER JOIN deleted d ON i.Project_ID = d.Project_ID
        WHERE d.ComponentCount <> i.ComponentCount

        IF @ProjectID IS NOT NULL
        BEGIN
            INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
            VALUES (@UserID, 'TBProjects', @ProjectID, 'UPDATE', 'PROJECT',
                    'Component count updated: ' + CAST(@NewComponentCount AS NVARCHAR(10)), GETDATE())
        END
    END
END
GO

PRINT 'Trigger TR_TBProjects_Update created'
GO

-- --------------------------------------------
-- Trigger: Log Project Deletion
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBProjects_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBProjects_Delete
GO

CREATE TRIGGER dbo.TR_TBProjects_Delete
ON dbo.TBProjects
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON

    -- Log each deleted project
    INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, OldValue, ActionDate)
    SELECT
        d.User_ID,
        'TBProjects',
        d.Project_ID,
        'DELETE',
        'PROJECT',
        d.ProjectName,
        'Project deleted: ' + d.ProjectName,
        GETDATE()
    FROM deleted d
END
GO

PRINT 'Trigger TR_TBProjects_Delete created'
GO

-- --------------------------------------------
-- Trigger: Log Project Creation (using Inserted)
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBProjects_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBProjects_Insert
GO

CREATE TRIGGER dbo.TR_TBProjects_Insert
ON dbo.TBProjects
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON

    -- Log project creation
    INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, NewValue, ActionDescription, ActionDate)
    SELECT
        i.User_ID,
        'TBProjects',
        i.Project_ID,
        'INSERT',
        'PROJECT',
        i.ProjectName,
        'Project created: ' + i.ProjectName + ' with ' + CAST(i.ComponentCount AS NVARCHAR(10)) + ' components',
        GETDATE()
    FROM inserted i
END
GO

PRINT 'Trigger TR_TBProjects_Insert created'
GO

-- ============================================
-- SECTION 3: TBExportHistory TABLE TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Log Export Events
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBExportHistory_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBExportHistory_Insert
GO

CREATE TRIGGER dbo.TR_TBExportHistory_Insert
ON dbo.TBExportHistory
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON

    -- Get project info for audit
    INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
    SELECT
        p.User_ID,
        'TBExportHistory',
        i.Export_ID,
        'EXPORT',
        'EXPORT',
        'Project exported as ' + i.ExportFormat,
        'Size: ' + CAST(ISNULL(i.ExportSizeKB, 0) AS NVARCHAR(20)) + ' KB',
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.TBProjects p ON i.Project_ID = p.Project_ID
END
GO

PRINT 'Trigger TR_TBExportHistory_Insert created'
GO

-- ============================================
-- SECTION 4: TBSettings TABLE TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Log Setting Changes
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBSettings_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBSettings_Update
GO

CREATE TRIGGER dbo.TR_TBSettings_Update
ON dbo.TBSettings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON

    -- Log setting changes
    INSERT INTO dbo.TBAuditLog (TableName, RecordID, ActionType, ActionCategory, OldValue, NewValue, ActionDescription, ActionDate)
    SELECT
        'TBSettings',
        i.Setting_ID,
        'UPDATE',
        'SYSTEM',
        d.SettingValue,
        i.SettingValue,
        'Setting changed: ' + i.SettingKey,
        GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.Setting_ID = d.Setting_ID
    WHERE i.SettingValue <> d.SettingValue  -- Only log if value actually changed
END
GO

PRINT 'Trigger TR_TBSettings_Update created'
GO

-- ============================================
-- SECTION 5: TBUserActivity TABLE TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Validate Activity Types
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBUserActivity_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBUserActivity_Insert
GO

CREATE TRIGGER dbo.TR_TBUserActivity_Insert
ON dbo.TBUserActivity
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON

    -- Validate activity type (data integrity check)
    DECLARE @InvalidTypes TABLE (ActivityType NVARCHAR(50))

    INSERT INTO @InvalidTypes
    SELECT DISTINCT ActivityType
    FROM inserted
    WHERE ActivityType NOT IN (
        'LOGIN', 'LOGOUT', 'REGISTER', 'CREATE_PROJECT',
        'EDIT_PROJECT', 'DELETE_PROJECT', 'PUBLISH_PROJECT',
        'EXPORT', 'IMPORT', 'UPDATE_PROFILE'
    )

    IF EXISTS (SELECT 1 FROM @InvalidTypes)
    BEGIN
        DECLARE @InvalidList NVARCHAR(500)
        SELECT @InvalidList = STRING_agg(ActivityType, ', ') FROM @InvalidTypes

        RAISERROR('Invalid activity type(s): %s', 10, 1, @InvalidList)
    END

    -- Log activity to audit table for critical actions
    INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
    SELECT
        i.User_ID,
        'TBUserActivity',
        i.Activity_ID,
        CASE
            WHEN i.ActivityType IN ('LOGIN', 'LOGOUT', 'REGISTER') THEN i.ActivityType
            ELSE 'ACTIVITY'
        END,
        'USER',
        i.ActivityDescription + ' (Type: ' + i.ActivityType + ')',
        GETDATE()
    FROM inserted i
    WHERE ActivityType IN ('LOGIN', 'LOGOUT', 'DELETE_PROJECT', 'PUBLISH_PROJECT')
END
GO

PRINT 'Trigger TR_TBUserActivity_Insert created'
GO

-- ============================================
-- SECTION 6: ADVANCED TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Update User Statistics on Project Changes
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBProjects_UpdateUserStats', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBProjects_UpdateUserStats
GO

CREATE TRIGGER dbo.TR_TBProjects_UpdateUserStats
ON dbo.TBProjects
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @UserID INT
    DECLARE @ProjectCount INT

    -- For INSERT and UPDATE
    IF EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT @UserID = User_ID FROM inserted

        SELECT @ProjectCount = COUNT(*)
        FROM dbo.TBProjects
        WHERE User_ID = @UserID AND IsDeleted = 0

        -- Could update a user stats table here
        -- For now, just log the stat update
        INSERT INTO dbo.TBAuditLog (User_ID, TableName, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', 'STATS_UPDATE', 'SYSTEM',
                'User project count updated to: ' + CAST(@ProjectCount AS NVARCHAR(10)),
                GETDATE())
    END
END
GO

PRINT 'Trigger TR_TBProjects_UpdateUserStats created'
GO

-- --------------------------------------------
-- Trigger: Prevent Modification of Published Projects
-- --------------------------------------------
IF OBJECT_ID('dbo.TR_TBProjects_PreventModifyPublished', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_TBProjects_PreventModifyPublished
GO

CREATE TRIGGER dbo.TR_TBProjects_PreventModifyPublished
ON dbo.TBProjects
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON

    -- Allow modification of ProjectName, ProjectDescription even when published
    -- But warn if changing core published data

    IF UPDATE(PublishedURL)
    BEGIN
        IF EXISTS (
            SELECT 1 FROM inserted i
            INNER JOIN deleted d ON i.Project_ID = d.Project_ID
            WHERE i.IsPublished = 1
                AND i.PublishedURL <> d.PublishedURL
        )
        BEGIN
            PRINT 'WARNING: Changing URL of published project'
        END
    END
END
GO

PRINT 'Trigger TR_TBProjects_PreventModifyPublished created'
GO

