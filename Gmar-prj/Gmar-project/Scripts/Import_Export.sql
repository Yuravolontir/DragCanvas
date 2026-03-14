
USE DragCanvas
GO

PRINT 'Starting Import/Export Script Configuration...'
GO

-- ============================================
-- SECTION 1: CSV EXPORT PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Export Users to CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportUsersToCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportUsersToCSV
GO

CREATE PROCEDURE dbo.SP_ExportUsersToCSV
    @FilePath NVARCHAR(255) = 'C:\Export\Users_Export.csv'
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    -- Create CSV export query
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''User_ID,UserName,UserEmail,IsActive,IsAdmin,CreatedDate,LastLoginDate''
UNION ALL
SELECT CAST(User_ID AS NVARCHAR) + '','' + UserName + '','' + UserEmail + '','' +
       CAST(IsActive AS NVARCHAR) + '','' + CAST(IsAdmin AS NVARCHAR) + '','' +
       CONVERT(NVARCHAR, CreatedDate, 120) + '','' +
       ISNULL(CONVERT(NVARCHAR, LastLoginDate, 120), ''NULL'')
FROM DragCanvas.dbo.TBUsers" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'Users exported to CSV: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('TBUsers', 'EXPORT', 'EXPORT', 'Users exported to CSV', @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportUsersToCSV created'
GO

-- --------------------------------------------
-- Procedure: Export Projects to CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportProjectsToCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportProjectsToCSV
GO

CREATE PROCEDURE dbo.SP_ExportProjectsToCSV
    @FilePath NVARCHAR(255) = 'C:\Export\Projects_Export.csv',
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @WhereClause NVARCHAR(MAX) = ''

    -- Add user filter if specified
    IF @UserID IS NOT NULL
        SET @WhereClause = ' WHERE User_ID = ' + CAST(@UserID AS NVARCHAR(10))

    -- Create export query using BCP
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''Project_ID,User_ID,ProjectName,ComponentCount,ProjectSizeKB,IsPublished,CreatedDate,ModifiedDate''
UNION ALL
SELECT CAST(Project_ID AS NVARCHAR) + '','' + CAST(User_ID AS NVARCHAR) + '','' + ProjectName + '','' +
       CAST(ComponentCount AS NVARCHAR) + '','' + CAST(ProjectSizeKB AS NVARCHAR) + '','' +
       CAST(IsPublished AS NVARCHAR) + '','' + CONVERT(NVARCHAR, CreatedDate, 120) + '','' +
       CONVERT(NVARCHAR, ModifiedDate, 120)
FROM DragCanvas.dbo.TBProjects' + @WhereClause + '" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'Projects exported to CSV: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (User_ID, TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES (@UserID, 'TBProjects', 'EXPORT', 'EXPORT', 'Projects metadata exported to CSV', @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportProjectsToCSV created'
GO

-- --------------------------------------------
-- Procedure: Export Audit Log to CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportAuditLogToCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportAuditLogToCSV
GO

CREATE PROCEDURE dbo.SP_ExportAuditLogToCSV
    @FilePath NVARCHAR(255) = 'C:\Export\AuditLog_Export.csv',
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    -- Create export query
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''Audit_ID,TableName,ActionType,ActionCategory,ActionDescription,ActionDate''
UNION ALL
SELECT CAST(Audit_ID AS NVARCHAR) + '','' + TableName + '','' + ActionType + '','' +
       ISNULL(ActionCategory, '''') + '','' + ISNULL(ActionDescription, '''') + '','' +
       CONVERT(NVARCHAR, ActionDate, 120)
FROM DragCanvas.dbo.TBAuditLog
WHERE ActionDate >= DATEADD(DAY, -' + CAST(@DaysBack AS NVARCHAR(10)) + ', GETDATE())
ORDER BY ActionDate DESC" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'Audit log exported to CSV: ' + @FilePath

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportAuditLogToCSV created'
GO

-- --------------------------------------------
-- Procedure: Export User Activity to CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportUserActivityToCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportUserActivityToCSV
GO

CREATE PROCEDURE dbo.SP_ExportUserActivityToCSV
    @FilePath NVARCHAR(255) = 'C:\Export\UserActivity_Export.csv',
    @UserID INT = NULL,
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @WhereClause NVARCHAR(MAX) = 'WHERE ActivityDate >= DATEADD(DAY, -' + CAST(@DaysBack AS NVARCHAR(10)) + ', GETDATE())'

    IF @UserID IS NOT NULL
        SET @WhereClause = @WhereClause + ' AND User_ID = ' + CAST(@UserID AS NVARCHAR(10))

    -- Create export query
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''Activity_ID,User_ID,ActivityType,ProjectID,ActivityDescription,ActivityDate''
UNION ALL
SELECT CAST(a.Activity_ID AS NVARCHAR) + '','' + CAST(a.User_ID AS NVARCHAR) + '','' +
       a.ActivityType + '','' + ISNULL(CAST(a.ProjectID AS NVARCHAR), '''') + '','' +
       ISNULL(a.ActivityDescription, '''') + '','' + CONVERT(NVARCHAR, a.ActivityDate, 120)
FROM DragCanvas.dbo.TBUserActivity a
' + @WhereClause + '
ORDER BY a.ActivityDate DESC" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'User activity exported to CSV: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('TBUserActivity', 'EXPORT', 'EXPORT', 'User activity exported to CSV', @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportUserActivityToCSV created'
GO

-- ============================================
-- SECTION 2: EXCEL/CSV EXPORT PROCEDURES (Statistics)
-- ============================================

-- --------------------------------------------
-- Procedure: Export User Statistics to Excel (CSV format)
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportUserStatsToExcel', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportUserStatsToExcel
GO

CREATE PROCEDURE dbo.SP_ExportUserStatsToExcel
    @FilePath NVARCHAR(255) = 'C:\Export\UserStats_Export.csv'
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    -- Export user statistics using the view
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''UserID,UserName,UserEmail,UserSince,TotalProjects,PublishedProjects,TotalComponents,TotalSizeKB,TotalExports,LastLoginDate''
UNION ALL
SELECT CAST(User_ID AS NVARCHAR) + '','' + UserName + '','' + UserEmail + '','' +
       CONVERT(NVARCHAR, UserSince, 120) + '','' + CAST(TotalProjects AS NVARCHAR) + '','' +
       CAST(PublishedProjects AS NVARCHAR) + '','' + ISNULL(CAST(TotalComponents AS NVARCHAR), ''0'') + '','' +
       ISNULL(CAST(TotalSizeKB AS NVARCHAR), ''0'') + '','' + ISNULL(CAST(TotalExports AS NVARCHAR), ''0'') + '','' +
       ISNULL(CONVERT(NVARCHAR, LastLoginDate, 120), ''NULL'')
FROM DragCanvas.dbo.VW_UserStatistics" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'User statistics exported to Excel: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('VW_UserStatistics', 'EXPORT', 'EXPORT', 'User statistics exported to Excel', @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportUserStatsToExcel created'
GO

-- --------------------------------------------
-- Procedure: Export System Report to Excel
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ExportSystemReportToExcel', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportSystemReportToExcel
GO

CREATE PROCEDURE dbo.SP_ExportSystemReportToExcel
    @FilePath NVARCHAR(255) = 'C:\Export\SystemReport_Export.csv'
AS
BEGIN
    SET NOCOUNT ON

    -- Create temp table for report
    CREATE TABLE #SystemReport (
        ReportCategory NVARCHAR(50),
        ReportItem NVARCHAR(100),
        ReportValue NVARCHAR(200),
        ReportDate DATETIME
    )

    -- Gather statistics
    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Users', 'Total Users', CAST(COUNT(*) AS NVARCHAR), GETDATE()
    FROM dbo.TBUsers WHERE IsActive = 1

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Projects', 'Total Projects', CAST(COUNT(*) AS NVARCHAR), GETDATE()
    FROM dbo.TBProjects WHERE IsDeleted = 0

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Projects', 'Published Projects', CAST(COUNT(*) AS NVARCHAR), GETDATE()
    FROM dbo.TBProjects WHERE IsPublished = 1 AND IsDeleted = 0

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Components', 'Total Components (tracked)', CAST(ISNULL(SUM(ComponentCount), 0) AS NVARCHAR), GETDATE()
    FROM dbo.TBProjects WHERE IsDeleted = 0

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Exports', 'Total Exports', CAST(ISNULL(SUM(ExportCount), 0) AS NVARCHAR), GETDATE()
    FROM dbo.TBProjects

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Audit', 'Total Audit Entries', CAST(COUNT(*) AS NVARCHAR), GETDATE()
    FROM dbo.TBAuditLog

    INSERT INTO #SystemReport (ReportCategory, ReportItem, ReportValue, ReportDate)
    SELECT 'Activity', 'Total Activities', CAST(COUNT(*) AS NVARCHAR), GETDATE()
    FROM dbo.TBUserActivity

    DECLARE @SQL NVARCHAR(MAX)

    -- Export using BCP
    SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT * FROM tempdb..#SystemReport" queryout "' + @FilePath + '" -c -t, -T -S ' + @@SERVERNAME + ''''

    BEGIN TRY
        EXEC sp_executesql @SQL
        PRINT 'System report exported to Excel: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('System', 'EXPORT', 'EXPORT', 'System report exported to Excel', @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH

    DROP TABLE #SystemReport
END
GO

PRINT 'Procedure SP_ExportSystemReportToExcel created'
GO

-- ============================================
-- SECTION 3: CSV IMPORT PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Import Users from CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ImportUsersFromCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ImportUsersFromCSV
GO

CREATE PROCEDURE dbo.SP_ImportUsersFromCSV
    @FilePath NVARCHAR(255) = 'C:\Import\Users_Import.csv',
    @ResultCode INT OUTPUT,
    @RowsImported INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    BEGIN TRY
        BEGIN TRANSACTION

        -- Create temp table for import
        CREATE TABLE #TempUsers (
            UserName NVARCHAR(50),
            UserEmail NVARCHAR(100),
            UserPassword NVARCHAR(255),
            IsAdmin BIT DEFAULT 0
        )

        -- BULK INSERT from CSV
        SET @SQL = 'BULK INSERT #TempUsers FROM ''' + @FilePath + '''
WITH (
    CODEPAGE = ''ACP'',
    FIRSTROW = 2,
    MAXERRORS = 0,
    FIELDTERMINATOR = '','',
    ROWTERMINATOR = ''\n''
)'

        EXEC sp_executesql @SQL

        -- Insert into main table (excluding duplicates)
        INSERT INTO dbo.TBUsers (UserName, UserEmail, UserPassword, IsAdmin, IsActive, CreatedDate)
        SELECT t.UserName, t.UserEmail, t.UserPassword, t.IsAdmin, 1, GETDATE()
        FROM #TempUsers t
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.TBUsers u
            WHERE u.UserEmail = t.UserEmail
        )

        SET @RowsImported = @@ROWCOUNT

        COMMIT TRANSACTION

        -- Log the import
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('TBUsers', 'IMPORT', 'IMPORT', 'Users imported from CSV: ' + CAST(@RowsImported AS NVARCHAR(10)) + ' rows',
                @FilePath, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Users imported successfully: ' + CAST(@RowsImported AS NVARCHAR(10)) + ' rows'

        DROP TABLE #TempUsers

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION

        IF OBJECT_ID('tempdb..#TempUsers') IS NOT NULL
            DROP TABLE #TempUsers

        SET @ResultCode = 0  -- Failed
        SET @RowsImported = 0
        PRINT 'Import failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ImportUsersFromCSV created'
GO

-- --------------------------------------------
-- Procedure: Import Settings from CSV
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_ImportSettingsFromCSV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ImportSettingsFromCSV
GO

CREATE PROCEDURE dbo.SP_ImportSettingsFromCSV
    @FilePath NVARCHAR(255) = 'C:\Import\Settings_Import.csv',
    @ResultCode INT OUTPUT,
    @RowsImported INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    BEGIN TRY
        BEGIN TRANSACTION

        -- Create temp table for import
        CREATE TABLE #TempSettings (
            SettingKey NVARCHAR(50),
            SettingValue NVARCHAR(500),
            SettingDescription NVARCHAR(255),
            Category NVARCHAR(50)
        )

        -- BULK INSERT from CSV
        SET @SQL = 'BULK INSERT #TempSettings FROM ''' + @FilePath + '''
WITH (
    CODEPAGE = ''ACP'',
    FIRSTROW = 2,
    MAXERRORS = 0,
    FIELDTERMINATOR = '','',
    ROWTERMINATOR = ''\n''
)'

        EXEC sp_executesql @SQL

        -- Update existing settings or insert new ones
        UPDATE dbo.TBSettings
        SET SettingValue = t.SettingValue,
            SettingDescription = t.SettingDescription,
            ModifiedDate = GETDATE()
        FROM dbo.TBSettings s
        INNER JOIN #TempSettings t ON s.SettingKey = t.SettingKey

        SET @RowsImported = @@ROWCOUNT

        -- Insert new settings
        INSERT INTO dbo.TBSettings (SettingKey, SettingValue, SettingDescription, Category, CreatedDate, ModifiedDate)
        SELECT t.SettingKey, t.SettingValue, t.SettingDescription, t.Category, GETDATE(), GETDATE()
        FROM #TempSettings t
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.TBSettings s
            WHERE s.SettingKey = t.SettingKey
        )

        SET @RowsImported = @RowsImported + @@ROWCOUNT

        COMMIT TRANSACTION

        -- Log the import
        INSERT INTO dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('TBSettings', 'IMPORT', 'SYSTEM', 'Settings imported from CSV: ' + CAST(@RowsImported AS NVARCHAR(10)) + ' rows',
                @FilePath, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Settings imported successfully: ' + CAST(@RowsImported AS NVARCHAR(10)) + ' rows'

        DROP TABLE #TempSettings

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION

        IF OBJECT_ID('tempdb..#TempSettings') IS NOT NULL
            DROP TABLE #TempSettings

        SET @ResultCode = 0  -- Failed
        SET @RowsImported = 0
        PRINT 'Import failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ImportSettingsFromCSV created'
GO

-- ============================================
-- SECTION 4: EXPORT PROJECT DATA AS JSON
-- --------------------------------------------

IF OBJECT_ID('dbo.SP_ExportProjectMetadata', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportProjectMetadata
GO

CREATE PROCEDURE dbo.SP_ExportProjectMetadata
    @ProjectID INT,
    @FilePath NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON

    -- Export project metadata as JSON (not the components, just metadata)
    -- Components are stored in React state

    DECLARE @ProjectName NVARCHAR(100)
    DECLARE @JSON NVARCHAR(MAX)

    -- Get project data
    SELECT
        @ProjectName = ProjectName,
        @JSON = '{' +
            '"project_id": ' + CAST(Project_ID AS NVARCHAR) + ',' +
            '"project_name": "' + ProjectName + '",' +
            '"component_count": ' + CAST(ComponentCount AS NVARCHAR) + ',' +
            '"project_size_kb": ' + CAST(ProjectSizeKB AS NVARCHAR) + ',' +
            '"is_published": ' + CASE WHEN IsPublished = 1 THEN 'true' ELSE 'false' END + ',' +
            '"created_date": "' + CONVERT(NVARCHAR, CreatedDate, 120) + '",' +
            '"modified_date": "' + CONVERT(NVARCHAR, ModifiedDate, 120) + '"' +
        '}'
    FROM dbo.TBProjects
    WHERE Project_ID = @ProjectID

    IF @ProjectName IS NULL
    BEGIN
        PRINT 'Project not found'
        RETURN
    END

    -- Create file path if not provided
    IF @FilePath IS NULL
        SET @FilePath = 'C:\Export\Project_' + CAST(@ProjectID AS NVARCHAR(10)) + '_Metadata.json'

    BEGIN TRY
        -- Use BCP to export the JSON string
        DECLARE @SQL NVARCHAR(MAX)
        SET @SQL = 'EXEC master.dbo.xp_cmdshell ''bcp "SELECT ''' + REPLACE(@JSON, '''', '''''') + '''" queryout "' + @FilePath + '" -c -T -S ' + @@SERVERNAME + ''''

        EXEC sp_executesql @SQL
        PRINT 'Project metadata exported to JSON: ' + @FilePath

        -- Log the export
        INSERT INTO dbo.TBAuditLog (TableName, RecordID, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('TBProjects', @ProjectID, 'EXPORT', 'EXPORT', 'Project metadata exported: ' + @ProjectName, @FilePath, GETDATE())

    END TRY
    BEGIN CATCH
        PRINT 'Export failed: ' + ERROR_MESSAGE()
    END CATCH
END
GO

PRINT 'Procedure SP_ExportProjectMetadata created'
GO

-- ============================================
-- SECTION 5: IMPORT/EXPORT UTILITY PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Create Sample CSV Files for Testing
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_CreateSampleCSVFiles', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CreateSampleCSVFiles
GO

CREATE PROCEDURE dbo.SP_CreateSampleCSVFiles
AS
BEGIN
    SET NOCOUNT ON

    -- Create sample Users CSV
    EXEC master.dbo.xp_cmdshell 'echo UserName,UserEmail,UserPassword,IsAdmin > C:\Import\Users_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo TestUser1,test1@example.com,Password123,0 >> C:\Import\Users_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo TestUser2,test2@example.com,Password123,0 >> C:\Import\Users_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo TestUser3,test3@example.com,Password123,1 >> C:\Import\Users_Import.csv'

    PRINT 'Sample Users CSV created: C:\Import\Users_Import.csv'

    -- Create sample Settings CSV
    EXEC master.dbo.xp_cmdshell 'echo SettingKey,SettingValue,SettingDescription,Category > C:\Import\Settings_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo MaxProjectsPerUser,15,Maximum projects per user,General >> C:\Import\Settings_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo EnableAI,1,Enable AI assistant features,AI >> C:\Import\Settings_Import.csv'
    EXEC master.dbo.xp_cmdshell 'echo SessionTimeoutMinutes,120,User session timeout,Security >> C:\Import\Settings_Import.csv'

    PRINT 'Sample Settings CSV created: C:\Import\Settings_Import.csv'
    PRINT 'Sample CSV files created for testing'
END
GO

PRINT 'Procedure SP_CreateSampleCSVFiles created'
GO

-- --------------------------------------------
-- Procedure: Verify Import/Export Directories
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_VerifyDirectories', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_VerifyDirectories
GO

CREATE PROCEDURE dbo.SP_VerifyDirectories
AS
BEGIN
    SET NOCOUNT ON

    -- Create directories if they don't exist
    EXEC master.dbo.xp_create_subdir 'C:\Import'
    EXEC master.dbo.xp_create_subdir 'C:\Export'
    EXEC master.dbo.xp_create_subdir 'C:\SQLBackups'
    EXEC master.dbo.xp_create_subdir 'C:\SQLBackups\DragCanvas'

    PRINT 'Directories verified/created:'
    PRINT '  - C:\Import (for CSV imports)'
    PRINT '  - C:\Export (for CSV exports)'
    PRINT '  - C:\SQLBackups\DragCanvas (for backups)'
END
GO

PRINT 'Procedure SP_VerifyDirectories created'
GO

-- ============================================
-- SECTION 6: BATCH EXPORT PROCEDURE
-- --------------------------------------------

IF OBJECT_ID('dbo.SP_ExportAllData', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ExportAllData
GO

CREATE PROCEDURE dbo.SP_ExportAllData
    @ExportPath NVARCHAR(255) = 'C:\Export\'
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @Date NVARCHAR(20)
    DECLARE @Suffix NVARCHAR(20)

    SET @Date = REPLACE(CONVERT(NVARCHAR, GETDATE(), 120), ' ', '_')
    SET @Suffix = REPLACE(@Date, ':', '-')

    PRINT 'Starting full data export...'
    PRINT '====================================='

    -- Export Users
    DECLARE @UsersFile NVARCHAR(500) = @ExportPath + 'Users_' + @Suffix + '.csv'
    PRINT 'Exporting Users...'
    EXEC dbo.SP_ExportUsersToCSV @UsersFile

    -- Export Projects
    DECLARE @ProjectsFile NVARCHAR(500) = @ExportPath + 'Projects_' + @Suffix + '.csv'
    PRINT 'Exporting Projects...'
    EXEC dbo.SP_ExportProjectsToCSV @ProjectsFile

    -- Export Audit Log
    DECLARE @AuditLogFile NVARCHAR(500) = @ExportPath + 'AuditLog_' + @Suffix + '.csv'
    PRINT 'Exporting Audit Log...'
    EXEC dbo.SP_ExportAuditLogToCSV @AuditLogFile

    -- Export User Activity
    DECLARE @ActivityFile NVARCHAR(500) = @ExportPath + 'UserActivity_' + @Suffix + '.csv'
    PRINT 'Exporting User Activity...'
    EXEC dbo.SP_ExportUserActivityToCSV @ActivityFile

    -- Export User Statistics
    DECLARE @StatsFile NVARCHAR(500) = @ExportPath + 'UserStats_' + @Suffix + '.csv'
    PRINT 'Exporting User Statistics...'
    EXEC dbo.SP_ExportUserStatsToExcel @StatsFile

    -- Export System Report
    DECLARE @ReportFile NVARCHAR(500) = @ExportPath + 'SystemReport_' + @Suffix + '.csv'
    PRINT 'Exporting System Report...'
    EXEC dbo.SP_ExportSystemReportToExcel @ReportFile

    PRINT '====================================='
    PRINT 'Full data export completed!'
    PRINT 'Export location: ' + @ExportPath
END
GO

PRINT 'Procedure SP_ExportAllData created'
GO

