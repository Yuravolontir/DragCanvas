

USE master
GO

PRINT 'Starting Security Configuration...'
GO

-- ============================================
-- SECTION 1: CREATE SQL SERVER LOGINS
-- ============================================

-- --------------------------------------------
-- Login: Application Admin
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'DragCanvasAdmin')
BEGIN
    DROP LOGIN DragCanvasAdmin
    PRINT 'Login DragCanvasAdmin dropped'
END
GO

CREATE LOGIN DragCanvasAdmin
WITH PASSWORD = 'Admin@2026!',
CHECK_POLICY = ON,
CHECK_EXPIRATION = OFF
GO

PRINT 'Login DragCanvasAdmin created'
GO

-- --------------------------------------------
-- Login: Application User (for web app connection)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'DragCanvasWebApp')
BEGIN
    DROP LOGIN DragCanvasWebApp
    PRINT 'Login DragCanvasWebApp dropped'
END
GO

CREATE LOGIN DragCanvasWebApp
WITH PASSWORD = 'WebApp@2026!',
CHECK_POLICY = ON,
CHECK_EXPIRATION = OFF
GO

PRINT 'Login DragCanvasWebApp created'
GO

-- --------------------------------------------
-- Login: Read-Only User (for reporting)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'DragCanvasReadOnly')
BEGIN
    DROP LOGIN DragCanvasReadOnly
    PRINT 'Login DragCanvasReadOnly dropped'
END
GO

CREATE LOGIN DragCanvasReadOnly
WITH PASSWORD = 'ReadOnly@2026!',
CHECK_POLICY = ON,
CHECK_EXPIRATION = OFF
GO

PRINT 'Login DragCanvasReadOnly created'
GO

-- ============================================
-- SECTION 2: SWITCH TO DATABASE AND CREATE USERS
-- ============================================

USE DragCanvas
GO

-- --------------------------------------------
-- Database User: Admin
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'DragCanvasAdmin')
BEGIN
    DROP USER DragCanvasAdmin
    PRINT 'User DragCanvasAdmin dropped from database'
END
GO

CREATE USER DragCanvasAdmin FOR LOGIN DragCanvasAdmin
GO

PRINT 'Database user DragCanvasAdmin created'
GO

-- --------------------------------------------
-- Database User: Web App
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'DragCanvasWebApp')
BEGIN
    DROP USER DragCanvasWebApp
    PRINT 'User DragCanvasWebApp dropped from database'
END
GO

CREATE USER DragCanvasWebApp FOR LOGIN DragCanvasWebApp
GO

PRINT 'Database user DragCanvasWebApp created'
GO

-- --------------------------------------------
-- Database User: Read Only
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'DragCanvasReadOnly')
BEGIN
    DROP USER DragCanvasReadOnly
    PRINT 'User DragCanvasReadOnly dropped from database'
END
GO

CREATE USER DragCanvasReadOnly FOR LOGIN DragCanvasReadOnly
GO

PRINT 'Database user DragCanvasReadOnly created'
GO

-- ============================================
-- SECTION 3: CREATE DATABASE ROLES
-- ============================================

-- --------------------------------------------
-- Role: Project Manager (can manage projects but not users)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ProjectManager')
BEGIN
    DROP ROLE ProjectManager
    PRINT 'Role ProjectManager dropped'
END
GO

CREATE ROLE ProjectManager
GO

PRINT 'Role ProjectManager created'
GO

-- --------------------------------------------
-- Role: Content Creator (can create and edit projects)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ContentCreator')
BEGIN
    DROP ROLE ContentCreator
    PRINT 'Role ContentCreator dropped'
END
GO

CREATE ROLE ContentCreator
GO

PRINT 'Role ContentCreator created'
GO

-- ============================================
-- SECTION 4: GRANT PERMISSIONS TO ROLES
-- ============================================

-- --------------------------------------------
-- Permissions for ProjectManager Role
-- --------------------------------------------
-- Can read and write to projects tables
GRANT SELECT, INSERT, UPDATE ON dbo.TBProjects TO ProjectManager
GRANT DELETE ON dbo.TBProjects TO ProjectManager
GRANT SELECT, INSERT ON dbo.TBExportHistory TO ProjectManager
GRANT SELECT ON dbo.TBUsers TO ProjectManager
GRANT SELECT ON dbo.TBSettings TO ProjectManager
GO

-- Can execute procedures
GRANT EXECUTE ON dbo.SP_CreateProject TO ProjectManager
GRANT EXECUTE ON dbo.SP_UpdateProject TO ProjectManager
GRANT EXECUTE ON dbo.SP_DeleteProject TO ProjectManager
GRANT EXECUTE ON dbo.SP_GetUserProjects TO ProjectManager
GRANT EXECUTE ON dbo.SP_PublishProject TO ProjectManager
GRANT EXECUTE ON dbo.SP_LogProjectExport TO ProjectManager
GO

-- Can use functions
GRANT EXECUTE ON dbo.FN_GetUserProjects TO ProjectManager
GRANT EXECUTE ON dbo.FN_CountUserProjects TO ProjectManager
GRANT EXECUTE ON dbo.FN_GetUserStatistics TO ProjectManager
GO

PRINT 'Permissions granted to ProjectManager role'
GO

-- --------------------------------------------
-- Permissions for ContentCreator Role
-- --------------------------------------------
-- Read-only on most tables, limited write on projects
GRANT SELECT ON dbo.TBProjects TO ContentCreator
GRANT SELECT ON dbo.TBExportHistory TO ContentCreator
GRANT SELECT ON dbo.TBUsers TO ContentCreator
GRANT SELECT ON dbo.TBSettings TO ContentCreator

-- Can create and update own projects
GRANT INSERT, UPDATE ON dbo.TBProjects(ProjectName, ProjectDescription, ComponentCount, ProjectSizeKB) TO ContentCreator
GRANT INSERT ON dbo.TBExportHistory TO ContentCreator
GO

GRANT EXECUTE ON dbo.SP_CreateProject TO ContentCreator
GRANT EXECUTE ON dbo.SP_UpdateProject TO ContentCreator
GRANT EXECUTE ON dbo.SP_GetUserProjects TO ContentCreator
GRANT EXECUTE ON dbo.SP_LogProjectExport TO ContentCreator
GO

PRINT 'Permissions granted to ContentCreator role'
GO

-- ============================================
-- SECTION 5: GRANT PERMISSIONS TO USERS
-- ============================================

-- --------------------------------------------
-- Permissions for Admin User (Full Access)
-- --------------------------------------------
-- Add admin to db_owner role
ALTER ROLE db_owner ADD MEMBER DragCanvasAdmin
GO

PRINT 'DragCanvasAdmin added to db_owner role'
GO

-- Grant additional permissions
GRANT VIEW DEFINITION TO DragCanvasAdmin
GRANT CREATE TABLE TO DragCanvasAdmin
GRANT CREATE VIEW TO DragCanvasAdmin
GRANT CREATE PROCEDURE TO DragCanvasAdmin
GRANT CREATE FUNCTION TO DragCanvasAdmin
GO

PRINT 'Full permissions granted to DragCanvasAdmin'
GO

-- --------------------------------------------
-- Permissions for Web App User (Application Access)
-- --------------------------------------------
-- Connect permission
GRANT CONNECT TO DragCanvasWebApp
GO

-- Table permissions for web app
GRANT SELECT, INSERT, UPDATE ON dbo.TBUsers TO DragCanvasWebApp
GRANT SELECT, INSERT, UPDATE ON dbo.TBProjects TO DragCanvasWebApp
GRANT INSERT ON dbo.TBExportHistory TO DragCanvasWebApp
GRANT SELECT ON dbo.TBExportHistory TO DragCanvasWebApp
GRANT SELECT ON dbo.TBSettings TO DragCanvasWebApp
GRANT INSERT ON dbo.TBAuditLog TO DragCanvasWebApp
GRANT INSERT ON dbo.TBUserActivity TO DragCanvasWebApp
GRANT SELECT ON dbo.TBUserActivity TO DragCanvasWebApp
GO

-- Procedure permissions for web app
GRANT EXECUTE ON dbo.SP_RegisterUser TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_UserLogin TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_UserLogout TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_CreateProject TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_UpdateProject TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_DeleteProject TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_GetUserProjects TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_PublishProject TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_LogProjectExport TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_GetSystemStatistics TO DragCanvasWebApp
GRANT EXECUTE ON dbo.SP_GetUserActivityReport TO DragCanvasWebApp
GO

-- Function permissions for web app
GRANT EXECUTE ON dbo.FN_ValidateEmail TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_CountUserProjects TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetTotalUserComponents TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetTotalProjectSize TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetSetting TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetUserProjects TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetRecentActivity TO DragCanvasWebApp
GRANT EXECUTE ON dbo.FN_GetUserStatistics TO DragCanvasWebApp
GO

-- View permissions
GRANT SELECT ON dbo.VW_ActiveProjects TO DragCanvasWebApp
GRANT SELECT ON dbo.VW_AuditSummary TO DragCanvasWebApp
GRANT SELECT ON dbo.VW_UserStatistics TO DragCanvasWebApp
GRANT SELECT ON dbo.VW_PublishedProjects TO DragCanvasWebApp
GRANT SELECT ON dbo.VW_ExportStatistics TO DragCanvasWebApp
GO

PRINT 'Permissions granted to DragCanvasWebApp'
GO

-- --------------------------------------------
-- Permissions for Read-Only User
-- --------------------------------------------
-- Connect permission
GRANT CONNECT TO DragCanvasReadOnly
GO

-- Read-only on all tables
GRANT SELECT ON dbo.TBUsers TO DragCanvasReadOnly
GRANT SELECT ON dbo.TBProjects TO DragCanvasReadOnly
GRANT SELECT ON dbo.TBExportHistory TO DragCanvasReadOnly
GRANT SELECT ON dbo.TBAuditLog TO DragCanvasReadOnly
GRANT SELECT ON dbo.TBSettings TO DragCanvasReadOnly
GRANT SELECT ON dbo.TBUserActivity TO DragCanvasReadOnly
GO

-- View permissions
GRANT SELECT ON dbo.VW_ActiveProjects TO DragCanvasReadOnly
GRANT SELECT ON dbo.VW_AuditSummary TO DragCanvasReadOnly
GRANT SELECT ON dbo.VW_UserStatistics TO DragCanvasReadOnly
GRANT SELECT ON dbo.VW_PublishedProjects TO DragCanvasReadOnly
GRANT SELECT ON dbo.VW_ExportStatistics TO DragCanvasReadOnly
GO

-- Function permissions (read-only functions)
GRANT EXECUTE ON dbo.FN_CountUserProjects TO DragCanvasReadOnly
GRANT EXECUTE ON dbo.FN_GetTotalUserComponents TO DragCanvasReadOnly
GRANT EXECUTE ON dbo.FN_GetTotalProjectSize TO DragCanvasReadOnly
GRANT EXECUTE ON dbo.FN_GetSetting TO DragCanvasReadOnly
GRANT EXECUTE ON dbo.FN_GetUserProjects TO DragCanvasReadOnly
GRANT EXECUTE ON dbo.FN_GetUserStatistics TO DragCanvasReadOnly
GO

PRINT 'Permissions granted to DragCanvasReadOnly'
GO

-- ============================================
-- SECTION 6: DENY PERMISSIONS (Security Layers)
-- ============================================

-- Prevent Web App from directly modifying audit logs
DENY INSERT, UPDATE, DELETE ON dbo.TBAuditLog TO DragCanvasWebApp
DENY UPDATE ON dbo.TBSettings TO DragCanvasWebApp
DENY UPDATE ON dbo.TBUserActivity TO DragCanvasWebApp
GO

-- Prevent Read-Only from any modifications
DENY INSERT, UPDATE, DELETE ON dbo.TBUsers TO DragCanvasReadOnly
DENY INSERT, UPDATE, DELETE ON dbo.TBProjects TO DragCanvasReadOnly
DENY INSERT, UPDATE, DELETE ON dbo.TBExportHistory TO DragCanvasReadOnly
DENY INSERT, UPDATE, DELETE ON dbo.TBSettings TO DragCanvasReadOnly
DENY INSERT, UPDATE, DELETE ON dbo.TBUserActivity TO DragCanvasReadOnly
GO

PRINT 'Restrictions (DENY) applied'
GO

-- ============================================
-- SECTION 7: ROLE MEMBERSHIP
-- ============================================

-- Add web app user to ProjectManager role
ALTER ROLE ProjectManager ADD MEMBER DragCanvasWebApp
GO

PRINT 'DragCanvasWebApp added to ProjectManager role'
GO

-- ============================================
-- SECTION 8: CREATE STORED PROCEDURE FOR USER PERMISSION CHECK
-- --------------------------------------------

IF OBJECT_ID('dbo.SP_CheckUserPermission', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CheckUserPermission
GO

CREATE PROCEDURE dbo.SP_CheckUserPermission
    @UserName NVARCHAR(100),
    @ObjectName NVARCHAR(100),
    @Permission NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON

    -- Check if user has permission
    DECLARE @HasPermission BIT

    SELECT @HasPermission =
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM sys.database_principals u
                INNER JOIN sys.database_permissions p ON u.principal_id = p.grantee_principal_id
                INNER JOIN sys.database_principals obj ON p.major_id = obj.principal_id OR p.major_id = 0
                WHERE u.name = @UserName
                    AND (obj.name = @ObjectName OR p.major_id = 0)
                    AND p.permission_name = @Permission
            ) THEN 1
            WHEN EXISTS (
                SELECT 1
                FROM sys.database_principals u
                INNER JOIN sys.database_role_members rm ON u.principal_id = rm.member_principal_id
                INNER JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
                INNER JOIN sys.database_permissions p ON r.principal_id = p.grantee_principal_id
                WHERE u.name = @UserName
                    AND (p.major_id = 0 OR @ObjectName IS NULL)
                    AND p.permission_name = @Permission
            ) THEN 1
            ELSE 0
        END

    SELECT @HasPermission AS HasPermission,
           @UserName AS UserName,
           @ObjectName AS ObjectName,
           @Permission AS Permission
END
GO

PRINT 'Procedure SP_CheckUserPermission created'
GO

-- ============================================
-- SECTION 9: AUDIT AND SECURITY REPORTING
-- ============================================

-- --------------------------------------------
-- View: User Permissions Summary
-- --------------------------------------------
IF OBJECT_ID('dbo.VW_UserPermissions', 'V') IS NOT NULL
    DROP VIEW dbo.VW_UserPermissions
GO

CREATE VIEW dbo.VW_UserPermissions AS
SELECT
    u.name AS UserName,
    u.type_desc AS UserType,
    r.name AS RoleName,
    p.class_desc AS ObjectType,
    p.permission_name AS Permission,
    OBJECT_NAME(p.major_id) AS ObjectName
FROM sys.database_principals u
LEFT JOIN sys.database_role_members rm ON u.principal_id = rm.member_principal_id
LEFT JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
LEFT JOIN sys.database_permissions p ON u.principal_id = p.grantee_principal_id
WHERE u.type IN ('S', 'U')  -- SQL user or Windows user
    AND u.name NOT IN ('dbo', 'guest', 'INFORMATION_SCHEMA', 'sys')
GO

PRINT 'View VW_UserPermissions created'
GO

-- --------------------------------------------
-- Procedure: Get Security Report
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_GetSecurityReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetSecurityReport
GO

CREATE PROCEDURE dbo.SP_GetSecurityReport
AS
BEGIN
    SET NOCOUNT ON

    -- Create temp table for report
    CREATE TABLE #SecurityReport (
        ReportSection NVARCHAR(50),
        ItemName NVARCHAR(100),
        ItemValue NVARCHAR(200),
        ItemDate DATETIME
    )

    -- Logins
    INSERT INTO #SecurityReport (ReportSection, ItemName, ItemValue, ItemDate)
    SELECT 'Server Logins', name, 'SQL Login', create_date
    FROM sys.server_principals
    WHERE type = 'S' AND name LIKE 'DragCanvas%'

    -- Database Users
    INSERT INTO #SecurityReport (ReportSection, ItemName, ItemValue, ItemDate)
    SELECT 'Database Users', name, type_desc, create_date
    FROM sys.database_principals
    WHERE type = 'S' AND name LIKE 'DragCanvas%'

    -- Roles
    INSERT INTO #SecurityReport (ReportSection, ItemName, ItemValue, ItemDate)
    SELECT 'Database Roles', name, 'Role', create_date
    FROM sys.database_principals
    WHERE type = 'R' AND name IN ('ProjectManager', 'ContentCreator', 'db_owner')

    -- Recent security events
    INSERT INTO #SecurityReport (ReportSection, ItemName, ItemValue, ItemDate)
    SELECT 'Audit Log', ActionType, ActionDescription, ActionDate
    FROM dbo.TBAuditLog
    WHERE ActionDate >= DATEADD(DAY, -7, GETDATE())
        AND ActionCategory IN ('AUTH', 'SYSTEM')
    ORDER BY ActionDate DESC

    -- Return report
    SELECT * FROM #SecurityReport ORDER BY ReportSection, ItemDate DESC

    DROP TABLE #SecurityReport
END
GO

PRINT 'Procedure SP_GetSecurityReport created'
GO

-- ============================================
-- SECTION 10: SECURITY BEST PRACTICES IMPLEMENTATION
-- ============================================

-- --------------------------------------------
-- Create procedure for user password validation
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ValidatePasswordStrength', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ValidatePasswordStrength
GO

CREATE PROCEDURE dbo.SP_ValidatePasswordStrength
    @Password NVARCHAR(255),
    @MinLength INT = 6,
    @IsValid BIT OUTPUT,
    @ValidationMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    SET @IsValid = 1
    SET @ValidationMessage = 'Password is valid'

    -- Check length
    IF LEN(@Password) < @MinLength
    BEGIN
        SET @IsValid = 0
        SET @ValidationMessage = 'Password must be at least ' + CAST(@MinLength AS NVARCHAR(10)) + ' characters'
        RETURN
    END

    -- Check for common patterns (basic validation)
    IF @Password = 'password' OR @Password = '123456'
    BEGIN
        SET @IsValid = 0
        SET @ValidationMessage = 'Password is too common'
        RETURN
    END

    -- Could add more validation rules here
END
GO

PRINT 'Procedure SP_ValidatePasswordStrength created'
GO

-- ============================================
-- SECTION 11: DYNAMIC DATA MASKING
-- ============================================

PRINT 'Starting Data Masking Configuration...'
GO

-- --------------------------------------------
-- Mask: Email Address (partial masking)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TBUsers') AND name = 'UserEmail')
BEGIN
    IF EXISTS (SELECT * FROM sys.masked_columns WHERE object_id = OBJECT_ID('TBUsers') AND name = 'UserEmail')
        ALTER TABLE dbo.TBUsers ALTER COLUMN UserEmail DROP MASKED
END

ALTER TABLE dbo.TBUsers
ALTER COLUMN UserEmail ADD MASKED WITH (FUNCTION = 'email()')
GO

PRINT 'Data mask applied: TBUsers.UserEmail (email masking)'
GO

-- --------------------------------------------
-- Mask: Password (full masking)
-- --------------------------------------------
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TBUsers') AND name = 'UserPassword')
BEGIN
    IF EXISTS (SELECT * FROM sys.masked_columns WHERE object_id = OBJECT_ID('TBUsers') AND name = 'UserPassword')
        ALTER TABLE dbo.TBUsers ALTER COLUMN UserPassword DROP MASKED
END

ALTER TABLE dbo.TBUsers
ALTER COLUMN UserPassword ADD MASKED WITH (FUNCTION = 'default()')
GO

PRINT 'Data mask applied: TBUsers.UserPassword (full masking)'
GO

-- --------------------------------------------
-- Grant UNMASK permission to Admin only
-- --------------------------------------------
GRANT UNMASK TO DragCanvasAdmin
GO

PRINT 'UNMASK permission granted to DragCanvasAdmin'
GO

-- Revoke UNMASK from other users (they see masked data)
DENY UNMASK TO DragCanvasWebApp
DENY UNMASK TO DragCanvasReadOnly
GO

PRINT 'UNMASK permission denied from non-admin users'
GO

-- --------------------------------------------
-- Procedure: Show Masked Columns
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ShowMaskedColumns', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ShowMaskedColumns
GO

CREATE PROCEDURE dbo.SP_ShowMaskedColumns
AS
BEGIN
    SET NOCOUNT ON

    SELECT
        tbl.name AS TableName,
        col.name AS ColumnName,
        mc.masking_function AS MaskFunction
    FROM sys.masked_columns mc
    INNER JOIN sys.tables tbl ON mc.object_id = tbl.object_id
    INNER JOIN sys.columns col ON mc.object_id = col.object_id AND mc.column_id = col.column_id
    ORDER BY tbl.name, col.name
END
GO

PRINT 'Procedure SP_ShowMaskedColumns created'
GO

-- --------------------------------------------
-- Procedure: Test Data Masking
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_TestDataMasking', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_TestDataMasking
GO

CREATE PROCEDURE dbo.SP_TestDataMasking
AS
BEGIN
    SET NOCOUNT ON

    PRINT '=========================================='
    PRINT '       DATA MASKING DEMONSTRATION'
    PRINT '=========================================='
    PRINT ''

    -- Show what different users see
    PRINT 'Masked Columns in Database:'
    EXEC dbo.SP_ShowMaskedColumns

    PRINT ''
    PRINT 'Sample Data (as current user sees it):'
    PRINT '=========================================='

    SELECT TOP 5
        User_ID,
        UserName,
        UserEmail AS 'Email (Masked for non-admin)',
        UserPassword AS 'Password (Always masked)',
        IsActive
    FROM dbo.TBUsers

    PRINT ''
    PRINT 'NOTE: Admin users see unmasked data.'
    PRINT '      Non-admin users see masked data.'
    PRINT '=========================================='
END
GO

PRINT 'Procedure SP_TestDataMasking created'
GO

PRINT ''
PRINT '=========================================='
PRINT 'DATA MASKING CONFIGURATION COMPLETED'
PRINT '=========================================='
PRINT ''
PRINT 'Masked Columns:'
PRINT '  - TBUsers.UserEmail (email() function)'
PRINT '  - TBUsers.UserPassword (default() function)'
PRINT ''
PRINT 'UNMASK Permissions:'
PRINT '  - DragCanvasAdmin: Granted'
PRINT '  - DragCanvasWebApp: Denied'
PRINT '  - DragCanvasReadOnly: Denied'
PRINT ''
PRINT 'Test Procedures:'
PRINT '  - SP_ShowMaskedColumns (view all masks)'
PRINT '  - SP_TestDataMasking (demonstration)'
PRINT '=========================================='
GO


