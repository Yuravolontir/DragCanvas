

USE DragCanvas
GO

PRINT 'Starting Procedures and Functions Creation...'
GO

-- ============================================
-- SECTION 1: USER MANAGEMENT PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Register New User
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_RegisterUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegisterUser
GO

CREATE PROCEDURE dbo.SP_RegisterUser
    @UserName NVARCHAR(50),
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @UserID INT OUTPUT,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM dbo.TBUsers WHERE UserEmail = @Email)
    BEGIN
        SET @ResultCode = 2
        SET @UserID = 0
        PRINT 'Email already registered'
        RETURN
    END

    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM dbo.TBUsers WHERE UserName = @UserName)
    BEGIN
        SET @ResultCode = 3
        SET @UserID = 0
        PRINT 'Username already taken'
        RETURN
    END

    -- Validate email format
    IF @Email NOT LIKE '%@%.%'
    BEGIN
        SET @ResultCode = 4
        SET @UserID = 0
        PRINT 'Invalid email format'
        RETURN
    END

    -- Check password length from settings
    DECLARE @MinPasswordLength INT
    SELECT @MinPasswordLength = CAST(SettingValue AS INT)
    FROM dbo.TBSettings
    WHERE SettingKey = 'MinPasswordLength'

    IF LEN(@Password) < @MinPasswordLength
    BEGIN
        SET @ResultCode = 5
        SET @UserID = 0
        PRINT 'Password too short'
        RETURN
    END

    -- Begin transaction
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO dbo.TBUsers (UserName, UserEmail, UserPassword, IsActive, CreatedDate)
        VALUES (@UserName, @Email, @Password, 1, GETDATE())

        SET @UserID = SCOPE_IDENTITY()

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBUsers', 'INSERT', 'AUTH', 'User registered: ' + @UserName, GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'REGISTER', 'New user registration', GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'User registered successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ResultCode = 0
        SET @UserID = 0
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_RegisterUser created'
GO

-- --------------------------------------------
-- Procedure: User Login
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_UserLogin', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_UserLogin
GO

CREATE PROCEDURE dbo.SP_UserLogin
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @IPAddress NVARCHAR(50) = NULL,
    @UserID INT OUTPUT,
    @UserName NVARCHAR(50) OUTPUT,
    @IsAdmin BIT OUTPUT,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    IF EXISTS (SELECT 1 FROM dbo.TBUsers WHERE UserEmail = @Email AND UserPassword = @Password AND IsActive = 1)
    BEGIN
        SELECT
            @UserID = User_ID,
            @UserName = UserName,
            @IsAdmin = IsAdmin
        FROM dbo.TBUsers
        WHERE UserEmail = @Email AND UserPassword = @Password

        UPDATE dbo.TBUsers
        SET LastLoginDate = GETDATE()
        WHERE User_ID = @UserID

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, ActionType, ActionCategory, ActionDescription, IPAddress, ActionDate)
        VALUES (@UserID, 'TBUsers', 'LOGIN', 'AUTH', 'User logged in', @IPAddress, GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'LOGIN', 'User logged in', GETDATE())

        SET @ResultCode = 1
        PRINT 'Login successful'
    END
    ELSE
    BEGIN
        SET @UserID = 0
        SET @UserName = NULL
        SET @IsAdmin = 0
        SET @ResultCode = 0

        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, IPAddress, ActionDate)
        VALUES ('TBUsers', 'LOGIN_FAILED', 'AUTH', 'Failed login: ' + @Email, @IPAddress, GETDATE())

        PRINT 'Login failed'
    END
END
GO

PRINT 'Procedure SP_UserLogin created'
GO

-- --------------------------------------------
-- Procedure: User Logout
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_UserLogout', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_UserLogout
GO

CREATE PROCEDURE dbo.SP_UserLogout
    @UserID INT,
    @SessionDurationMinutes INT = NULL
AS

BEGIN
    SET NOCOUNT ON

    INSERT INTO dbo.TBAuditLog (User_ID, TableName, ActionType, ActionCategory, ActionDescription, ActionDate)
    VALUES (@UserID, 'TBUsers', 'LOGOUT', 'AUTH', 'User logged out', GETDATE())

    IF @SessionDurationMinutes IS NOT NULL
    BEGIN
        DECLARE @ActivityID INT

        SELECT TOP (1) @ActivityID = Activity_ID
        FROM dbo.TBUserActivity
        WHERE User_ID = @UserID
            AND ActivityType = 'LOGIN'
            AND DurationMinutes IS NULL
        ORDER BY ActivityDate DESC

        UPDATE dbo.TBUserActivity
        SET DurationMinutes = @SessionDurationMinutes
        WHERE Activity_ID = @ActivityID
    END

    PRINT 'User logged out: ' + CAST(@UserID AS NVARCHAR(10))
END
GO

PRINT 'Procedure SP_UserLogout created'
GO

-- ============================================
-- SECTION 2: PROJECT MANAGEMENT PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Create New Project
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_CreateProject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CreateProject
GO

CREATE PROCEDURE dbo.SP_CreateProject
    @UserID INT,
    @ProjectName NVARCHAR(100),
    @ProjectDescription NVARCHAR(500) = NULL,
    @ComponentCount INT = 0,
    @ProjectSizeKB DECIMAL(10,2) = 0,
    @ProjectID INT OUTPUT,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    DECLARE @MaxProjects INT
    DECLARE @CurrentProjectCount INT

    SELECT @MaxProjects = CAST(SettingValue AS INT)
    FROM dbo.TBSettings
    WHERE SettingKey = 'MaxProjectsPerUser'

    SELECT @CurrentProjectCount = COUNT(*)
    FROM dbo.TBProjects
    WHERE User_ID = @UserID AND IsDeleted = 0

    IF @CurrentProjectCount >= @MaxProjects
    BEGIN
        SET @ProjectID = 0
        SET @ResultCode = 2
        PRINT 'Maximum projects limit reached'
        RETURN
    END

    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO dbo.TBProjects (
            User_ID, ProjectName, ProjectDescription,
            ComponentCount, ProjectSizeKB,
            CreatedDate, ModifiedDate
        )
        VALUES (
            @UserID, @ProjectName, @ProjectDescription,
            @ComponentCount, @ProjectSizeKB,
            GETDATE(), GETDATE()
        )

        SET @ProjectID = SCOPE_IDENTITY()

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'INSERT', 'PROJECT', 'Project created: ' + @ProjectName, GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'CREATE_PROJECT', @ProjectID, 'Created project: ' + @ProjectName, GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'Project created successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ProjectID = 0
        SET @ResultCode = 0
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_CreateProject created'
GO

-- --------------------------------------------
-- Procedure: Update Project
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_UpdateProject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_UpdateProject
GO

CREATE PROCEDURE dbo.SP_UpdateProject
    @ProjectID INT,
    @UserID INT,
    @ProjectName NVARCHAR(100) = NULL,
    @ProjectDescription NVARCHAR(500) = NULL,
    @ComponentCount INT = NULL,
    @ProjectSizeKB DECIMAL(10,2) = NULL,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (SELECT 1 FROM dbo.TBProjects WHERE Project_ID = @ProjectID AND User_ID = @UserID AND IsDeleted = 0)
    BEGIN
        SET @ResultCode = 0
        PRINT 'Project not found or access denied'
        RETURN
    END

    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE dbo.TBProjects
        SET ProjectName = ISNULL(@ProjectName, ProjectName),
            ProjectDescription = ISNULL(@ProjectDescription, ProjectDescription),
            ComponentCount = ISNULL(@ComponentCount, ComponentCount),
            ProjectSizeKB = ISNULL(@ProjectSizeKB, ProjectSizeKB),
            ModifiedDate = GETDATE()
        WHERE Project_ID = @ProjectID

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'EDIT_PROJECT', @ProjectID, 'Updated project metadata', GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'Project updated successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ResultCode = -1
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_UpdateProject created'
GO

-- --------------------------------------------
-- Procedure: Delete Project
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_DeleteProject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_DeleteProject
GO

CREATE PROCEDURE dbo.SP_DeleteProject
    @ProjectID INT,
    @UserID INT,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (SELECT 1 FROM dbo.TBProjects WHERE Project_ID = @ProjectID AND User_ID = @UserID)
    BEGIN
        SET @ResultCode = 0
        PRINT 'Project not found or access denied'
        RETURN
    END

    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE dbo.TBProjects
        SET IsDeleted = 1,
            ModifiedDate = GETDATE()
        WHERE Project_ID = @ProjectID

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'DELETE', 'PROJECT', 'Project deleted', GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'DELETE_PROJECT', @ProjectID, 'Deleted project', GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'Project deleted successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ResultCode = -1
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_DeleteProject created'
GO

-- --------------------------------------------
-- Procedure: Get User Projects
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_GetUserProjects', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetUserProjects
GO

CREATE PROCEDURE dbo.SP_GetUserProjects
    @UserID INT
AS

BEGIN
    SET NOCOUNT ON

    SELECT
        Project_ID,
        ProjectName,
        ProjectDescription,
        ComponentCount,
        ProjectSizeKB,
        IsPublished,
        PublishedURL,
        CreatedDate,
        ModifiedDate,
        ExportCount,
        LastExportDate
    FROM dbo.TBProjects
    WHERE User_ID = @UserID AND IsDeleted = 0
    ORDER BY ModifiedDate DESC
END
GO

PRINT 'Procedure SP_GetUserProjects created'
GO

-- --------------------------------------------
-- Procedure: Publish Project
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_PublishProject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_PublishProject
GO

CREATE PROCEDURE dbo.SP_PublishProject
    @ProjectID INT,
    @UserID INT,
    @PublishedURL NVARCHAR(255),
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (SELECT 1 FROM dbo.TBProjects WHERE Project_ID = @ProjectID AND User_ID = @UserID AND IsDeleted = 0)
    BEGIN
        SET @ResultCode = 0
        PRINT 'Project not found or access denied'
        RETURN
    END

    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE dbo.TBProjects
        SET IsPublished = 1,
            PublishedURL = @PublishedURL,
            PublishedDate = GETDATE(),
            ModifiedDate = GETDATE()
        WHERE Project_ID = @ProjectID

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, NewValue, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'PUBLISH', 'PROJECT', @PublishedURL, GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'PUBLISH_PROJECT', @ProjectID, 'Published project to: ' + @PublishedURL, GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'Project published successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ResultCode = -1
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_PublishProject created'
GO

-- --------------------------------------------
-- Procedure: Log Project Export
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_LogProjectExport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_LogProjectExport
GO

CREATE PROCEDURE dbo.SP_LogProjectExport
    @ProjectID INT,
    @UserID INT,
    @ExportFormat NVARCHAR(20),
    @ExportSizeKB DECIMAL(10,2),
    @ExportPath NVARCHAR(500) = NULL,
    @ResultCode INT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    IF NOT EXISTS (SELECT 1 FROM dbo.TBProjects WHERE Project_ID = @ProjectID AND User_ID = @UserID)
    BEGIN
        SET @ResultCode = 0
        RETURN
    END

    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO dbo.TBExportHistory (Project_ID, ExportFormat, ExportSizeKB, ExportPath, ExportDate)
        VALUES (@ProjectID, @ExportFormat, @ExportSizeKB, @ExportPath, GETDATE())

        UPDATE dbo.TBProjects
        SET ExportCount = ExportCount + 1,
            LastExportDate = GETDATE()
        WHERE Project_ID = @ProjectID

        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'EXPORT', 'EXPORT', 'Exported as ' + @ExportFormat, GETDATE())

        INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
        VALUES (@UserID, 'EXPORT', @ProjectID, 'Exported project as ' + @ExportFormat, GETDATE())

        COMMIT TRANSACTION
        SET @ResultCode = 1
        PRINT 'Project export logged successfully'

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @ResultCode = -1
        PRINT 'Error: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_LogProjectExport created'
GO

-- ============================================
-- SECTION 3: SCALAR FUNCTIONS
-- ============================================

IF OBJECT_ID('dbo.FN_ValidateEmail', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_ValidateEmail
GO

CREATE FUNCTION dbo.FN_ValidateEmail (@Email NVARCHAR(100))
RETURNS BIT
AS

BEGIN
    DECLARE @IsValid BIT

    IF @Email LIKE '%_@__%.__%'
        AND @Email NOT LIKE '%@%@%'
        AND LEN(@Email) > 7
    BEGIN
        SET @IsValid = 1
    END
    ELSE
    BEGIN
        SET @IsValid = 0
    END

    RETURN @IsValid
END
GO

PRINT 'Function FN_ValidateEmail created'
GO

IF OBJECT_ID('dbo.FN_CountUserProjects', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_CountUserProjects
GO

CREATE FUNCTION dbo.FN_CountUserProjects (@UserID INT)
RETURNS INT
AS

BEGIN
    DECLARE @ProjectCount INT

    SELECT @ProjectCount = COUNT(*)
    FROM dbo.TBProjects
    WHERE User_ID = @UserID AND IsDeleted = 0

    RETURN @ProjectCount
END
GO

PRINT 'Function FN_CountUserProjects created'
GO

IF OBJECT_ID('dbo.FN_GetTotalUserComponents', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_GetTotalUserComponents
GO

CREATE FUNCTION dbo.FN_GetTotalUserComponents (@UserID INT)
RETURNS INT
AS

BEGIN
    DECLARE @TotalComponents INT

    SELECT @TotalComponents = ISNULL(SUM(ComponentCount), 0)
    FROM dbo.TBProjects
    WHERE User_ID = @UserID AND IsDeleted = 0

    RETURN @TotalComponents
END
GO

PRINT 'Function FN_GetTotalUserComponents created'
GO

IF OBJECT_ID('dbo.FN_GetTotalProjectSize', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_GetTotalProjectSize
GO

CREATE FUNCTION dbo.FN_GetTotalProjectSize (@UserID INT)
RETURNS DECIMAL(10,2)
AS

BEGIN
    DECLARE @TotalSizeKB DECIMAL(10,2)

    SELECT @TotalSizeKB = ISNULL(SUM(ProjectSizeKB), 0)
    FROM dbo.TBProjects
    WHERE User_ID = @UserID AND IsDeleted = 0

    RETURN @TotalSizeKB
END
GO

PRINT 'Function FN_GetTotalProjectSize created'
GO

IF OBJECT_ID('dbo.FN_GetSetting', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_GetSetting
GO

CREATE FUNCTION dbo.FN_GetSetting (@SettingKey NVARCHAR(50))
RETURNS NVARCHAR(500)
AS

BEGIN
    DECLARE @SettingValue NVARCHAR(500)

    SELECT @SettingValue = SettingValue
    FROM dbo.TBSettings
    WHERE SettingKey = @SettingKey

    RETURN ISNULL(@SettingValue, '')
END
GO

PRINT 'Function FN_GetSetting created'
GO

-- ============================================
-- SECTION 4: TABLE-VALUED FUNCTIONS
-- ============================================

-- Drop any existing objects with these names (handles conflicts)
IF OBJECT_ID('dbo.FN_GetUserProjects', 'TF') IS NOT NULL OR OBJECT_ID('dbo.FN_GetUserProjects', 'IF') IS NOT NULL
    EXEC('DROP FUNCTION dbo.FN_GetUserProjects')
GO

IF OBJECT_ID('dbo.FN_GetRecentActivity', 'TF') IS NOT NULL OR OBJECT_ID('dbo.FN_GetRecentActivity', 'IF') IS NOT NULL
    EXEC('DROP FUNCTION dbo.FN_GetRecentActivity')
GO

IF OBJECT_ID('dbo.FN_GetUserStatistics', 'TF') IS NOT NULL OR OBJECT_ID('dbo.FN_GetUserStatistics', 'IF') IS NOT NULL
    EXEC('DROP FUNCTION dbo.FN_GetUserStatistics')
GO
PRINT 'Cleanup of existing functions completed'
GO

CREATE FUNCTION dbo.FN_GetUserProjects (@UserID INT)
RETURNS TABLE
AS

RETURN (
    SELECT
        p.Project_ID,
        p.ProjectName,
        p.ProjectDescription,
        p.ComponentCount,
        p.ProjectSizeKB,
        p.IsPublished,
        p.PublishedURL,
        p.CreatedDate,
        p.ModifiedDate
    FROM dbo.TBProjects p
    WHERE p.User_ID = @UserID AND p.IsDeleted = 0
)
GO

PRINT 'Function FN_GetUserProjects created'
GO

CREATE FUNCTION dbo.FN_GetRecentActivity (@UserID INT, @Days INT)
RETURNS TABLE
AS

RETURN (
    SELECT
        a.Activity_ID,
        a.ActivityType,
        a.ProjectID,
        a.ActivityDescription,
        a.ActivityDate
    FROM dbo.TBUserActivity a
    WHERE a.User_ID = @UserID
        AND a.ActivityDate >= DATEADD(DAY, -@Days, GETDATE())
)
GO

PRINT 'Function FN_GetRecentActivity created'
GO

CREATE FUNCTION dbo.FN_GetUserStatistics (@UserID INT)
RETURNS @UserStats TABLE (
    UserID INT,
    UserName NVARCHAR(50),
    TotalProjects INT,
    PublishedProjects INT,
    TotalComponents INT,
    TotalSizeKB DECIMAL(10,2),
    TotalExports INT,
    LastLoginDate DATETIME,
    AccountAgeDays INT
)
AS

BEGIN
    DECLARE @UserName NVARCHAR(50)
    DECLARE @LastLogin DATETIME
    DECLARE @CreatedDate DATETIME

    SELECT
        @UserName = UserName,
        @LastLogin = LastLoginDate,
        @CreatedDate = CreatedDate
    FROM dbo.TBUsers
    WHERE User_ID = @UserID

    INSERT INTO @UserStats (UserID, UserName, TotalProjects, PublishedProjects, TotalComponents, TotalSizeKB, TotalExports, LastLoginDate, AccountAgeDays)
    SELECT
        @UserID,
        @UserName,
        (SELECT COUNT(*) FROM dbo.TBProjects WHERE User_ID = @UserID AND IsDeleted = 0),
        (SELECT COUNT(*) FROM dbo.TBProjects WHERE User_ID = @UserID AND IsDeleted = 0 AND IsPublished = 1),
        (SELECT SUM(ComponentCount) FROM dbo.TBProjects WHERE User_ID = @UserID AND IsDeleted = 0),
        (SELECT SUM(ProjectSizeKB) FROM dbo.TBProjects WHERE User_ID = @UserID AND IsDeleted = 0),
        (SELECT SUM(ExportCount) FROM dbo.TBProjects WHERE User_ID = @UserID),
        @LastLogin,
        DATEDIFF(DAY, @CreatedDate, GETDATE())

    RETURN
END
GO

PRINT 'Function FN_GetUserStatistics created'
GO

-- ============================================
-- SECTION 5: REPORTING PROCEDURES
-- ============================================

IF OBJECT_ID('dbo.SP_GetSystemStatistics', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetSystemStatistics
GO

CREATE PROCEDURE dbo.SP_GetSystemStatistics
AS

BEGIN
    SET NOCOUNT ON

    CREATE TABLE #SystemStats (
        StatName NVARCHAR(50),
        StatValue INT,
        StatDate DATETIME
    )

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalUsers', COUNT(*), GETDATE() FROM dbo.TBUsers WHERE IsActive = 1

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalProjects', COUNT(*), GETDATE() FROM dbo.TBProjects WHERE IsDeleted = 0

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'PublishedProjects', COUNT(*), GETDATE() FROM dbo.TBProjects WHERE IsPublished = 1 AND IsDeleted = 0

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalComponents', ISNULL(SUM(ComponentCount), 0), GETDATE() FROM dbo.TBProjects WHERE IsDeleted = 0

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalExports', ISNULL(SUM(ExportCount), 0), GETDATE() FROM dbo.TBProjects

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalAuditLogs', COUNT(*), GETDATE() FROM dbo.TBAuditLog

    INSERT INTO #SystemStats (StatName, StatValue, StatDate)
    SELECT 'TotalActivities', COUNT(*), GETDATE() FROM dbo.TBUserActivity

    SELECT * FROM #SystemStats

    DROP TABLE #SystemStats
END
GO

PRINT 'Procedure SP_GetSystemStatistics created'
GO

IF OBJECT_ID('dbo.SP_GetUserActivityReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetUserActivityReport
GO

CREATE PROCEDURE dbo.SP_GetUserActivityReport
    @UserID INT,
    @Days INT = 30
AS

BEGIN
    SET NOCOUNT ON

    SELECT
        ActivityType,
        COUNT(*) AS ActivityCount,
        MIN(ActivityDate) AS FirstActivity,
        MAX(ActivityDate) AS LastActivity
    FROM dbo.TBUserActivity
    WHERE User_ID = @UserID
        AND ActivityDate >= DATEADD(DAY, -@Days, GETDATE())
    GROUP BY ActivityType
    ORDER BY ActivityCount DESC

    SELECT
        ActivityType,
        ProjectID,
        ActivityDescription,
        ActivityDate
    FROM dbo.TBUserActivity
    WHERE User_ID = @UserID
        AND ActivityDate >= DATEADD(DAY, -@Days, GETDATE())
    ORDER BY ActivityDate DESC
END
GO

PRINT 'Procedure SP_GetUserActivityReport created'
GO

IF OBJECT_ID('dbo.SP_CleanOldAuditLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CleanOldAuditLogs
GO

CREATE PROCEDURE dbo.SP_CleanOldAuditLogs
    @DaysToKeep INT = 90
AS

BEGIN
    SET NOCOUNT ON

    DECLARE @CutoffDate DATETIME
    SET @CutoffDate = DATEADD(DAY, -@DaysToKeep, GETDATE())

    DECLARE @DeletedCount INT

    BEGIN TRANSACTION
    BEGIN TRY
        DELETE FROM dbo.TBAuditLog
        WHERE ActionDate < @CutoffDate
            AND ActionType NOT IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT')

        SET @DeletedCount = @@ROWCOUNT

        COMMIT TRANSACTION

        PRINT 'Deleted ' + CAST(@DeletedCount AS NVARCHAR(10)) + ' old audit logs'

        SELECT @DeletedCount AS DeletedLogs

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        PRINT 'Error: ' + ERROR_MESSAGE()
        SELECT -1 AS DeletedLogs
    END CATCH
END
GO

PRINT 'Procedure SP_CleanOldAuditLogs created'
GO

-- --------------------------------------------
-- Procedure: Check User Permission
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_CheckUserPermission', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CheckUserPermission
GO

CREATE PROCEDURE dbo.SP_CheckUserPermission
    @UserID INT,
    @PermissionType NVARCHAR(50),
    @HasPermission BIT OUTPUT
AS

BEGIN
    SET NOCOUNT ON

    DECLARE @IsAdmin BIT
    DECLARE @IsActive BIT

    SELECT @IsAdmin = IsAdmin, @IsActive = IsActive
    FROM dbo.TBUsers
    WHERE User_ID = @UserID

    IF @IsActive = 0
    BEGIN
        SET @HasPermission = 0
        RETURN
    END

    IF @IsAdmin = 1
    BEGIN
        SET @HasPermission = 1
        RETURN
    END

    DECLARE @UserRole NVARCHAR(50)

    SELECT TOP 1 @UserRole = r.name
    FROM sys.database_principals u
    INNER JOIN sys.database_role_members rm ON u.principal_id = rm.member_principal_id
    INNER JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
    WHERE u.name = 'DragCanvasWebApp'

    IF @PermissionType = 'CREATE_PROJECT'
        SET @HasPermission = 1
    ELSE IF @PermissionType = 'EDIT_PROJECT'
        SET @HasPermission = 1
    ELSE IF @PermissionType = 'DELETE_PROJECT'
        SET @HasPermission = CASE WHEN @UserRole = 'ProjectManager' THEN 1 ELSE 0 END
    ELSE IF @PermissionType = 'PUBLISH_PROJECT'
        SET @HasPermission = CASE WHEN @UserRole = 'ProjectManager' THEN 1 ELSE 0 END
    ELSE IF @PermissionType = 'EXPORT_DATA'
        SET @HasPermission = 1
    ELSE
        SET @HasPermission = 0
END
GO

PRINT 'Procedure SP_CheckUserPermission created'
GO

-- ============================================
-- SECTION 6: WHILE LOOP PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Generate Random Winners (WHILE Loop Example)
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_GenerateRandomWinners', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GenerateRandomWinners
GO

CREATE PROCEDURE dbo.SP_GenerateRandomWinners
    @WinnerCount INT = 3,
    @MinUserID INT = 1,
    @MaxUserID INT = 100
AS
BEGIN
    SET NOCOUNT ON

    -- Create temp table to store winners
    CREATE TABLE #Winners (
        WinnerID INT IDENTITY(1,1),
        UserID INT,
        Prize NVARCHAR(50),
        DrawTime DATETIME
    )

    DECLARE @Counter INT = 1
    DECLARE @RandomUserID INT
    DECLARE @Prize NVARCHAR(50)

    PRINT 'Starting winner selection with WHILE loop...'
    PRINT '==========================================='

    -- WHILE LOOP: Generate random winners
    WHILE @Counter <= @WinnerCount
    BEGIN
        -- Generate random user ID using RAND()
        SET @RandomUserID = FLOOR((RAND() * (@MaxUserID - @MinUserID + 1)) + @MinUserID)

        -- Ensure unique winner (not already selected)
        IF NOT EXISTS (SELECT 1 FROM #Winners WHERE UserID = @RandomUserID)
        BEGIN
            -- Assign prize based on position
            SET @Prize = CASE @Counter
                WHEN 1 THEN 'First Prize'
                WHEN 2 THEN 'Second Prize'
                WHEN 3 THEN 'Third Prize'
                ELSE 'Participation Prize'
            END

            INSERT INTO #Winners (UserID, Prize, DrawTime)
            VALUES (@RandomUserID, @Prize, GETDATE())

            PRINT 'Winner #' + CAST(@Counter AS NVARCHAR) + ': User ID ' + CAST(@RandomUserID AS NVARCHAR) + ' - ' + @Prize

            SET @Counter = @Counter + 1
        END
        -- If duplicate found, loop continues without incrementing counter
    END

    PRINT '==========================================='
    PRINT 'Total winners selected: ' + CAST(@WinnerCount AS NVARCHAR)

    -- Return results
    SELECT * FROM #Winners ORDER BY WinnerID

    -- Log the draw
    INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, ActionDate)
    VALUES ('WinnerDraw', 'WINNERS_SELECTED', 'LOTTERY', 'Selected ' + CAST(@WinnerCount AS NVARCHAR) + ' winners via WHILE loop', GETDATE())

    DROP TABLE #Winners
END
GO

PRINT 'Procedure SP_GenerateRandomWinners created (WHILE Loop example)'
GO

-- --------------------------------------------
-- Procedure: Batch Update with CURSOR LOOP
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_BatchUpdateInactiveProjects', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_BatchUpdateInactiveProjects
GO

CREATE PROCEDURE dbo.SP_BatchUpdateInactiveProjects
    @DaysInactive INT = 180,
    @BatchSize INT = 10
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @ProjectID INT
    DECLARE @ProjectName NVARCHAR(100)
    DECLARE @UserID INT
    DECLARE @LastModifiedDate DATETIME
    DECLARE @ProcessedCount INT = 0
    DECLARE @UpdatedCount INT = 0

    PRINT 'Starting batch update of inactive projects...'
    PRINT 'Days inactive: ' + CAST(@DaysInactive AS NVARCHAR)
    PRINT '==========================================='

    -- Create temp table for projects to process
    CREATE TABLE #InactiveProjects (
        ProjectID INT PRIMARY KEY,
        ProjectName NVARCHAR(100),
        UserID INT,
        LastModifiedDate DATETIME
    )

    -- Insert inactive projects into temp table
    INSERT INTO #InactiveProjects (ProjectID, ProjectName, UserID, LastModifiedDate)
    SELECT
        Project_ID,
        ProjectName,
        User_ID,
        ModifiedDate
    FROM dbo.TBProjects
    WHERE IsDeleted = 0
        AND ModifiedDate < DATEADD(DAY, -@DaysInactive, GETDATE())
        AND IsPublished = 0

    SET @ProcessedCount = (SELECT COUNT(*) FROM #InactiveProjects)

    PRINT 'Found ' + CAST(@ProcessedCount AS NVARCHAR) + ' inactive projects to process'
    PRINT ''

    -- CURSOR LOOP: Process each inactive project
    DECLARE project_cursor CURSOR FOR
    SELECT ProjectID, ProjectName, UserID, LastModifiedDate
    FROM #InactiveProjects

    OPEN project_cursor

    FETCH NEXT FROM project_cursor INTO @ProjectID, @ProjectName, @UserID, @LastModifiedDate

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Update project status (mark as inactive or send notification)
        UPDATE dbo.TBProjects
        SET ProjectDescription = ISNULL(ProjectDescription, '') + ' [INACTIVE - ' +
            CONVERT(NVARCHAR, GETDATE(), 120) + ']'
        WHERE Project_ID = @ProjectID

        SET @UpdatedCount = @UpdatedCount + 1

        -- Log each update
        INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
        VALUES (@UserID, 'TBProjects', @ProjectID, 'UPDATE', 'BATCH_UPDATE',
                'Marked inactive: ' + @ProjectName, GETDATE())

        PRINT 'Processed: ' + @ProjectName + ' (User ID: ' + CAST(@UserID AS NVARCHAR) + ')'

        FETCH NEXT FROM project_cursor INTO @ProjectID, @ProjectName, @UserID, @LastModifiedDate
    END

    CLOSE project_cursor
    DEALLOCATE project_cursor

    PRINT ''
    PRINT '==========================================='
    PRINT 'Batch update completed!'
    PRINT 'Projects processed: ' + CAST(@ProcessedCount AS NVARCHAR)
    PRINT 'Projects updated: ' + CAST(@UpdatedCount AS NVARCHAR)

    -- Return summary
    SELECT
        @ProcessedCount AS TotalInactiveProjects,
        @UpdatedCount AS ProjectsUpdated,
        GETDATE() AS ProcessCompleted

    DROP TABLE #InactiveProjects
END
GO

PRINT 'Procedure SP_BatchUpdateInactiveProjects created (CURSOR Loop example)'
GO

-- ============================================
-- ADD ProjectData COLUMN TO TBProjects
-- ============================================
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TBProjects')
    AND name = 'ProjectData'
)
BEGIN
    ALTER TABLE dbo.TBProjects
    ADD ProjectData NVARCHAR(MAX) NULL

    PRINT 'Column ProjectData added to TBProjects'
END
ELSE
BEGIN
    PRINT 'Column ProjectData already exists in TBProjects'
END
GO

-- ============================================
-- Procedure: Save Project (Unified Create/Update)
-- ============================================
IF OBJECT_ID('dbo.SP_SaveProject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_SaveProject
GO

CREATE PROCEDURE dbo.SP_SaveProject
    @ProjectID INT = NULL,
    @UserID INT,
    @ProjectName NVARCHAR(100),
    @ProjectDescription NVARCHAR(500) = NULL,
    @ComponentCount INT = 0,
    @ProjectSizeKB DECIMAL(10,2) = 0,
    @ProjectData NVARCHAR(MAX) = NULL,
    @ResultProjectID INT OUTPUT,
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @MaxProjects INT
    DECLARE @CurrentProjectCount INT

    -- CASE 1: CREATE NEW PROJECT (@ProjectID IS NULL)
    IF @ProjectID IS NULL OR @ProjectID = 0
    BEGIN
        -- Check max projects limit
        SELECT @MaxProjects = CAST(SettingValue AS INT)
        FROM dbo.TBSettings
        WHERE SettingKey = 'MaxProjectsPerUser'

        SELECT @CurrentProjectCount = COUNT(*)
        FROM dbo.TBProjects
        WHERE User_ID = @UserID AND IsDeleted = 0

        IF @CurrentProjectCount >= @MaxProjects
        BEGIN
            SET @ResultProjectID = 0
            SET @ResultCode = 2
            PRINT 'Maximum projects limit reached'
            RETURN
        END

        BEGIN TRANSACTION
        BEGIN TRY
            INSERT INTO dbo.TBProjects (
                User_ID, ProjectName, ProjectDescription,
                ComponentCount, ProjectSizeKB, ProjectData,
                CreatedDate, ModifiedDate
            )
            VALUES (
                @UserID, @ProjectName, @ProjectDescription,
                @ComponentCount, @ProjectSizeKB, @ProjectData,
                GETDATE(), GETDATE()
            )

            SET @ResultProjectID = SCOPE_IDENTITY()

            INSERT INTO dbo.TBAuditLog (User_ID, TableName, RecordID, ActionType, ActionCategory, ActionDescription, ActionDate)
            VALUES (@UserID, 'TBProjects', @ResultProjectID, 'INSERT', 'PROJECT', 'Project created: ' + @ProjectName, GETDATE())

            INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
            VALUES (@UserID, 'CREATE_PROJECT', @ResultProjectID, 'Created project: ' + @ProjectName, GETDATE())

            COMMIT TRANSACTION
            SET @ResultCode = 1
            PRINT 'Project created successfully'

        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION
            SET @ResultProjectID = 0
            SET @ResultCode = 0
            PRINT 'Error: ' + ERROR_MESSAGE()
        END CATCH
    END

    -- CASE 2: UPDATE EXISTING PROJECT (@ProjectID EXISTS)
    ELSE
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.TBProjects
            WHERE Project_ID = @ProjectID
            AND User_ID = @UserID
            AND IsDeleted = 0
        )
        BEGIN
            SET @ResultProjectID = 0
            SET @ResultCode = 0
            PRINT 'Project not found or access denied'
            RETURN
        END

        BEGIN TRANSACTION
        BEGIN TRY
            UPDATE dbo.TBProjects
            SET ProjectName = ISNULL(@ProjectName, ProjectName),
                ProjectDescription = ISNULL(@ProjectDescription, ProjectDescription),
                ComponentCount = ISNULL(@ComponentCount, ComponentCount),
                ProjectSizeKB = ISNULL(@ProjectSizeKB, ProjectSizeKB),
                ProjectData = ISNULL(@ProjectData, ProjectData),
                ModifiedDate = GETDATE()
            WHERE Project_ID = @ProjectID

            SET @ResultProjectID = @ProjectID

            INSERT INTO dbo.TBUserActivity (User_ID, ActivityType, ProjectID, ActivityDescription, ActivityDate)
            VALUES (@UserID, 'EDIT_PROJECT', @ProjectID, 'Updated project: ' + @ProjectName, GETDATE())

            COMMIT TRANSACTION
            SET @ResultCode = 1
            PRINT 'Project updated successfully'

        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION
            SET @ResultProjectID = 0
            SET @ResultCode = -1
            PRINT 'Error: ' + ERROR_MESSAGE()
        END CATCH
    END
END
GO

PRINT 'Procedure SP_SaveProject created'
GO

-- ============================================
-- Procedure: Get Project Detail (Load full project)
-- ============================================
IF OBJECT_ID('dbo.SP_GetProjectDetail', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetProjectDetail
GO

CREATE PROCEDURE dbo.SP_GetProjectDetail
    @ProjectID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        Project_ID,
        User_ID,
        ProjectName,
        ProjectDescription,
        ComponentCount,
        ProjectSizeKB,
        ProjectData,
        IsPublished,
        PublishedURL,
        CreatedDate,
        ModifiedDate,
        ExportCount,
        LastExportDate
    FROM dbo.TBProjects
    WHERE Project_ID = @ProjectID
    AND User_ID = @UserID
    AND IsDeleted = 0
END
GO

PRINT 'Procedure SP_GetProjectDetail created'
GO


