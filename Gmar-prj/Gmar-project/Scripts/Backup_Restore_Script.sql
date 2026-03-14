

USE master
GO

PRINT 'Starting Backup and Restore Script Configuration...'
GO

-- ============================================
-- SECTION 1: CREATE BACKUP DIRECTORY
-- ============================================

-- Note: Create backup directory on server
-- EXEC master.dbo.xp_create_subdir 'C:\SQLBackups\DragCanvas'

PRINT 'Ensure backup directory exists on server: C:\SQLBackups\DragCanvas'
GO

-- ============================================
-- SECTION 2: BACKUP PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Full Database Backup
-- --------------------------------------------
USE DragCanvas
GO

IF OBJECT_ID('dbo.SP_BackupDatabase', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_BackupDatabase
GO

CREATE PROCEDURE dbo.SP_BackupDatabase
    @BackupPath NVARCHAR(255) = 'C:\SQLBackups\DragCanvas\',
    @BackupName NVARCHAR(100) = NULL,
    @ResultCode INT OUTPUT,
    @BackupFile NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @FileName NVARCHAR(255)
    DECLARE @Date NVARCHAR(20)
    DECLARE @Time NVARCHAR(10)

    -- Generate filename with date and time
    SET @Date = CONVERT(NVARCHAR, GETDATE(), 112)  -- YYYYMMDD
    SET @Time = REPLACE(CONVERT(NVARCHAR, GETDATE(), 108), ':', '')  -- HHMMSS

    IF @BackupName IS NULL
        SET @BackupName = 'DragCanvas'

    SET @FileName = @BackupPath + @BackupName + '_' + @Date + '_' + @Time + '.bak'
    SET @BackupFile = @FileName

    BEGIN TRY
        -- Set database to single user mode to ensure clean backup
        SET @SQL = 'ALTER DATABASE DragCanvas SET SINGLE_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Perform full backup
        SET @SQL = 'BACKUP DATABASE DragCanvas TO DISK = ''' + @FileName + ''' WITH FORMAT, INIT, NAME = ''' + @BackupName + ' Full Backup'', SKIP, NOREWIND, NOUNLOAD, STATS = 10'
        EXEC sp_executesql @SQL

        -- Reset to multi user mode
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Log the backup
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status)
        VALUES ('DragCanvas', 'FULL', @FileName, GETDATE(), 'SUCCESS')

        -- Also log to application audit log
        INSERT INTO DragCanvas.dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('DragCanvas', 'BACKUP', 'SYSTEM', 'Full database backup completed', @FileName, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Full backup completed: ' + @FileName

    END TRY
    BEGIN CATCH
        -- Ensure multi-user mode is restored
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        SET @ResultCode = 0  -- Failed
        PRINT 'Backup failed: ' + ERROR_MESSAGE()

        -- Log the failure
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status, ErrorMessage)
        VALUES ('DragCanvas', 'FULL', @FileName, GETDATE(), 'FAILED', ERROR_MESSAGE())
    END CATCH
END
GO

PRINT 'Procedure SP_BackupDatabase created'
GO

-- --------------------------------------------
-- Procedure: Differential Backup
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_BackupDatabaseDifferential', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_BackupDatabaseDifferential
GO

CREATE PROCEDURE dbo.SP_BackupDatabaseDifferential
    @BackupPath NVARCHAR(255) = 'C:\SQLBackups\DragCanvas\',
    @ResultCode INT OUTPUT,
    @BackupFile NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @FileName NVARCHAR(255)
    DECLARE @Date NVARCHAR(20)
    DECLARE @Time NVARCHAR(10)

    -- Generate filename
    SET @Date = CONVERT(NVARCHAR, GETDATE(), 112)
    SET @Time = REPLACE(CONVERT(NVARCHAR, GETDATE(), 108), ':', '')
    SET @FileName = @BackupPath + 'DragCanvas_Diff_' + @Date + '_' + @Time + '.bak'
    SET @BackupFile = @FileName

    BEGIN TRY
        -- Perform differential backup
        SET @SQL = 'BACKUP DATABASE DragCanvas TO DISK = ''' + @FileName + ''' WITH DIFFERENTIAL, INIT, NAME = ''DragCanvas Differential Backup'', SKIP, NOREWIND, NOUNLOAD, STATS = 10'
        EXEC sp_executesql @SQL

        -- Log the backup
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status)
        VALUES ('DragCanvas', 'DIFFERENTIAL', @FileName, GETDATE(), 'SUCCESS')

        -- Log to application audit
        INSERT INTO DragCanvas.dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('DragCanvas', 'BACKUP', 'SYSTEM', 'Differential backup completed', @FileName, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Differential backup completed: ' + @FileName

    END TRY
    BEGIN CATCH
        SET @ResultCode = 0  -- Failed
        PRINT 'Differential backup failed: ' + ERROR_MESSAGE()

        -- Log the failure
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status, ErrorMessage)
        VALUES ('DragCanvas', 'DIFFERENTIAL', @FileName, GETDATE(), 'FAILED', ERROR_MESSAGE())
    END CATCH
END
GO

PRINT 'Procedure SP_BackupDatabaseDifferential created'
GO

-- --------------------------------------------
-- Procedure: Transaction Log Backup
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_BackupDatabaseLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_BackupDatabaseLog
GO

CREATE PROCEDURE dbo.SP_BackupDatabaseLog
    @BackupPath NVARCHAR(255) = 'C:\SQLBackups\DragCanvas\',
    @ResultCode INT OUTPUT,
    @BackupFile NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @FileName NVARCHAR(255)
    DECLARE @Date NVARCHAR(20)
    DECLARE @Time NVARCHAR(10)

    -- Generate filename
    SET @Date = CONVERT(NVARCHAR, GETDATE(), 112)
    SET @Time = REPLACE(CONVERT(NVARCHAR, GETDATE(), 108), ':', '')
    SET @FileName = @BackupPath + 'DragCanvas_Log_' + @Date + '_' + @Time + '.trn'
    SET @BackupFile = @FileName

    BEGIN TRY
        -- Perform transaction log backup
        SET @SQL = 'BACKUP LOG DragCanvas TO DISK = ''' + @FileName + ''' WITH INIT, NAME = ''DragCanvas Log Backup'', SKIP, NOREWIND, NOUNLOAD, STATS = 10'
        EXEC sp_executesql @SQL

        -- Log the backup
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status)
        VALUES ('DragCanvas', 'LOG', @FileName, GETDATE(), 'SUCCESS')

        -- Log to application audit
        INSERT INTO DragCanvas.dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('DragCanvas', 'BACKUP', 'SYSTEM', 'Log backup completed', @FileName, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Log backup completed: ' + @FileName

    END TRY
    BEGIN CATCH
        SET @ResultCode = 0  -- Failed
        PRINT 'Log backup failed: ' + ERROR_MESSAGE()

        -- Log the failure
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status, ErrorMessage)
        VALUES ('DragCanvas', 'LOG', @FileName, GETDATE(), 'FAILED', ERROR_MESSAGE())
    END CATCH
END
GO

PRINT 'Procedure SP_BackupDatabaseLog created'
GO

-- ============================================
-- SECTION 3: RESTORE PROCEDURES
-- ============================================

-- --------------------------------------------
-- Procedure: Restore Database from Full Backup
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_RestoreDatabase', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RestoreDatabase
GO

CREATE PROCEDURE dbo.SP_RestoreDatabase
    @BackupFile NVARCHAR(500),
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)

    BEGIN TRY
        -- Kill existing connections
        SET @SQL = 'ALTER DATABASE DragCanvas SET SINGLE_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Restore from backup
        SET @SQL = 'RESTORE DATABASE DragCanvas FROM DISK = ''' + @BackupFile + ''' WITH REPLACE, NOREWIND, NOUNLOAD, STATS = 10'
        EXEC sp_executesql @SQL

        -- Reset to multi user mode
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Log the restore
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status)
        VALUES ('DragCanvas', 'RESTORE', @BackupFile, GETDATE(), 'SUCCESS')

        -- Log to application audit
        INSERT INTO DragCanvas.dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('DragCanvas', 'RESTORE', 'SYSTEM', 'Database restored from backup', @BackupFile, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Database restored successfully from: ' + @BackupFile

    END TRY
    BEGIN CATCH
        -- Ensure multi-user mode is restored
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        SET @ResultCode = 0  -- Failed
        PRINT 'Restore failed: ' + ERROR_MESSAGE()

        -- Log the failure
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status, ErrorMessage)
        VALUES ('DragCanvas', 'RESTORE', @BackupFile, GETDATE(), 'FAILED', ERROR_MESSAGE())
    END CATCH
END
GO

PRINT 'Procedure SP_RestoreDatabase created'
GO

-- --------------------------------------------
-- Procedure: Restore Database with Point in Time
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_RestoreDatabasePointInTime', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RestoreDatabasePointInTime
GO

CREATE PROCEDURE dbo.SP_RestoreDatabasePointInTime
    @BackupFile NVARCHAR(500),
    @PointInTime DATETIME,
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @TimeString NVARCHAR(30)

    SET @TimeString = CONVERT(NVARCHAR, @PointInTime, 121)

    BEGIN TRY
        -- Kill existing connections
        SET @SQL = 'ALTER DATABASE DragCanvas SET SINGLE_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Restore to point in time
        SET @SQL = 'RESTORE DATABASE DragCanvas FROM DISK = ''' + @BackupFile + ''' WITH REPLACE, NORECOVERY, STOPAT = ''' + @TimeString + ''', STATS = 10'
        EXEC sp_executesql @SQL

        -- Bring database online
        SET @SQL = 'RESTORE DATABASE DragCanvas WITH RECOVERY'
        EXEC sp_executesql @SQL

        -- Reset to multi user mode
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        -- Log the restore
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status)
        VALUES ('DragCanvas', 'RESTORE_POINT_IN_TIME', @BackupFile, GETDATE(), 'SUCCESS')

        -- Log to application audit
        INSERT INTO DragCanvas.dbo.TBAuditLog (TableName, ActionType, ActionCategory, ActionDescription, NewValue, ActionDate)
        VALUES ('DragCanvas', 'RESTORE', 'SYSTEM', 'Database restored to point in time: ' + @TimeString, @BackupFile, GETDATE())

        SET @ResultCode = 1  -- Success
        PRINT 'Database restored to point in time: ' + @TimeString

    END TRY
    BEGIN CATCH
        -- Ensure multi-user mode is restored
        SET @SQL = 'ALTER DATABASE DragCanvas SET MULTI_USER WITH ROLLBACK IMMEDIATE'
        EXEC sp_executesql @SQL

        SET @ResultCode = 0  -- Failed
        PRINT 'Point-in-time restore failed: ' + ERROR_MESSAGE()

        -- Log the failure
        INSERT INTO master.dbo.TBBackupLog (DatabaseName, BackupType, BackupPath, BackupDate, Status, ErrorMessage)
        VALUES ('DragCanvas', 'RESTORE_POINT_IN_TIME', @BackupFile, GETDATE(), 'FAILED', ERROR_MESSAGE())
    END CATCH
END
GO

PRINT 'Procedure SP_RestoreDatabasePointInTime created'
GO

-- ============================================
-- SECTION 4: BACKUP LOG TABLE
-- ============================================

USE master
GO

-- Create backup log table in master database
IF OBJECT_ID('dbo.TBBackupLog', 'U') IS NOT NULL
    DROP TABLE dbo.TBBackupLog
GO

CREATE TABLE dbo.TBBackupLog (
    Log_ID INT IDENTITY(1,1) PRIMARY KEY,
    DatabaseName NVARCHAR(100) NOT NULL,
    BackupType NVARCHAR(20) NOT NULL,          -- FULL, DIFFERENTIAL, LOG, RESTORE
    BackupPath NVARCHAR(500) NULL,
    BackupDate DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL,              -- SUCCESS, FAILED
    ErrorMessage NVARCHAR(1000) NULL,
    BackupSizeMB DECIMAL(10,2) NULL
)
GO

PRINT 'Table TBBackupLog created in master database'
GO

-- Create index on backup date
CREATE INDEX IX_TBBackupLog_Date ON dbo.TBBackupLog(BackupDate)
GO

PRINT 'Index IX_TBBackupLog_Date created'
GO

-- ============================================
-- SECTION 5: AUTOMATED BACKUP SCHEDULE
-- ============================================

USE DragCanvas
GO

-- --------------------------------------------
-- Procedure: Automated Full Backup (Weekly)
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_AutomatedBackupFull', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_AutomatedBackupFull
GO

CREATE PROCEDURE dbo.SP_AutomatedBackupFull
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @ResultCode INT
    DECLARE @BackupFile NVARCHAR(500)

    PRINT 'Starting automated full backup...'
    EXEC master.dbo.SP_BackupDatabase 'C:\SQLBackups\DragCanvas\', 'DragCanvas_Auto', @ResultCode OUTPUT, @BackupFile OUTPUT

    IF @ResultCode = 1
        PRINT 'Automated full backup completed: ' + @BackupFile
    ELSE
        PRINT 'Automated full backup FAILED'
END
GO

PRINT 'Procedure SP_AutomatedBackupFull created'
GO

-- --------------------------------------------
-- Procedure: Automated Differential Backup (Daily)
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_AutomatedBackupDifferential', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_AutomatedBackupDifferential
GO

CREATE PROCEDURE dbo.SP_AutomatedBackupDifferential
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @ResultCode INT
    DECLARE @BackupFile NVARCHAR(500)

    PRINT 'Starting automated differential backup...'
    EXEC master.dbo.SP_BackupDatabaseDifferential 'C:\SQLBackups\DragCanvas\', @ResultCode OUTPUT, @BackupFile OUTPUT

    IF @ResultCode = 1
        PRINT 'Automated differential backup completed: ' + @BackupFile
    ELSE
        PRINT 'Automated differential backup FAILED'
END
GO

PRINT 'Procedure SP_AutomatedBackupDifferential created'
GO

-- --------------------------------------------
-- Procedure: Automated Log Backup (Hourly)
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_AutomatedBackupLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_AutomatedBackupLog
GO

CREATE PROCEDURE dbo.SP_AutomatedBackupLog
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @ResultCode INT
    DECLARE @BackupFile NVARCHAR(500)

    PRINT 'Starting automated log backup...'
    EXEC master.dbo.SP_BackupDatabaseLog 'C:\SQLBackups\DragCanvas\', @ResultCode OUTPUT, @BackupFile OUTPUT

    IF @ResultCode = 1
        PRINT 'Automated log backup completed: ' + @BackupFile
    ELSE
        PRINT 'Automated log backup FAILED'
END
GO

PRINT 'Procedure SP_AutomatedBackupLog created'
GO

-- ============================================
-- SECTION 6: BACKUP REPORTING
-- ============================================

-- --------------------------------------------
-- Procedure: Get Backup History
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_GetBackupHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetBackupHistory
GO

CREATE PROCEDURE dbo.SP_GetBackupHistory
    @Days INT = 30
AS
BEGIN
    SET NOCOUNT ON

    -- Create temp table for report
    CREATE TABLE #BackupReport (
        ReportDate DATETIME,
        BackupType NVARCHAR(20),
        Status NVARCHAR(20),
        BackupPath NVARCHAR(500),
        DaysAgo INT
    )

    INSERT INTO #BackupReport (ReportDate, BackupType, Status, BackupPath, DaysAgo)
    SELECT
        BackupDate,
        BackupType,
        Status,
        BackupPath,
        DATEDIFF(DAY, BackupDate, GETDATE()) AS DaysAgo
    FROM master.dbo.TBBackupLog
    WHERE BackupDate >= DATEADD(DAY, -@Days, GETDATE())
    ORDER BY BackupDate DESC

    -- Summary statistics
    SELECT 'Total Backups' AS StatName, COUNT(*) AS StatValue FROM #BackupReport
    UNION ALL
    SELECT 'Successful Backups', COUNT(*) FROM #BackupReport WHERE Status = 'SUCCESS'
    UNION ALL
    SELECT 'Failed Backups', COUNT(*) FROM #BackupReport WHERE Status = 'FAILED'
    UNION ALL
    SELECT 'Full Backups', COUNT(*) FROM #BackupReport WHERE BackupType = 'FULL'
    UNION ALL
    SELECT 'Differential Backups', COUNT(*) FROM #BackupReport WHERE BackupType = 'DIFFERENTIAL'
    UNION ALL
    SELECT 'Log Backups', COUNT(*) FROM #BackupReport WHERE BackupType = 'LOG'
    UNION ALL
    SELECT 'Restores', COUNT(*) FROM #BackupReport WHERE BackupType = 'RESTORE'

    -- Recent backup history
    PRINT ''
    PRINT 'Recent Backup History (Last ' + CAST(@Days AS NVARCHAR(10)) + ' days):'
    SELECT * FROM #BackupReport

    DROP TABLE #BackupReport
END
GO

PRINT 'Procedure SP_GetBackupHistory created'
GO

-- --------------------------------------------
-- Procedure: Get Backup Status
-- --------------------------------------------
IF OBJECT_ID('dbo.SP_GetBackupStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GetBackupStatus
GO

CREATE PROCEDURE dbo.SP_GetBackupStatus
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @LastFullBackup DATETIME
    DECLARE @LastDiffBackup DATETIME
    DECLARE @LastLogBackup DATETIME
    DECLARE @HoursSinceFull INT
    DECLARE @HoursSinceDiff INT
    DECLARE @HoursSinceLog INT

    -- Get last backup times
    SELECT @LastFullBackup = MAX(BackupDate)
    FROM master.dbo.TBBackupLog
    WHERE BackupType = 'FULL' AND Status = 'SUCCESS'

    SELECT @LastDiffBackup = MAX(BackupDate)
    FROM master.dbo.TBBackupLog
    WHERE BackupType = 'DIFFERENTIAL' AND Status = 'SUCCESS'

    SELECT @LastLogBackup = MAX(BackupDate)
    FROM master.dbo.TBBackupLog
    WHERE BackupType = 'LOG' AND Status = 'SUCCESS'

    -- Calculate hours since last backup
    SET @HoursSinceFull = ISNULL(DATEDIFF(HOUR, @LastFullBackup, GETDATE()), 9999)
    SET @HoursSinceDiff = ISNULL(DATEDIFF(HOUR, @LastDiffBackup, GETDATE()), 9999)
    SET @HoursSinceLog = ISNULL(DATEDIFF(HOUR, @LastLogBackup, GETDATE()), 9999)

    -- Return status
    SELECT
        'FULL' AS BackupType,
        @LastFullBackup AS LastBackup,
        @HoursSinceFull AS HoursSinceBackup,
        CASE WHEN @HoursSinceFull > 168 THEN 'WARNING: Over 1 week since full backup' ELSE 'OK' END AS Status
    UNION ALL
    SELECT
        'DIFFERENTIAL' AS BackupType,
        @LastDiffBackup AS LastBackup,
        @HoursSinceDiff AS HoursSinceBackup,
        CASE WHEN @HoursSinceDiff > 48 THEN 'WARNING: Over 2 days since differential backup' ELSE 'OK' END AS Status
    UNION ALL
    SELECT
        'LOG' AS BackupType,
        @LastLogBackup AS LastBackup,
        @HoursSinceLog AS HoursSinceBackup,
        CASE WHEN @HoursSinceLog > 4 THEN 'WARNING: Over 4 hours since log backup' ELSE 'OK' END AS Status

    PRINT 'Backup Status Check Complete'
END
GO

PRINT 'Procedure SP_GetBackupStatus created'
GO

-- ============================================
-- SECTION 7: DISK SPACE CHECK
-- --------------------------------------------

IF OBJECT_ID('dbo.SP_CheckDiskSpace', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CheckDiskSpace
GO

CREATE PROCEDURE dbo.SP_CheckDiskSpace
    @BackupPath NVARCHAR(255) = 'C:\SQLBackups\DragCanvas\'
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @SQL NVARCHAR(MAX)
    DECLARE @FreeSpaceMB DECIMAL(10,2)

    -- This uses xp_fixeddrives to get disk space
    CREATE TABLE #FixedDrives (
        Drive CHAR(1),
        FreeSpaceMB INT
    )

    INSERT INTO #FixedDrives EXEC master.dbo.xp_fixeddrives

    -- Get free space for backup drive
    SELECT @FreeSpaceMB = FreeSpaceMB
    FROM #FixedDrives
    WHERE Drive = LEFT(@BackupPath, 1)

    -- Return status
    SELECT
        @BackupPath AS BackupPath,
        @FreeSpaceMB AS FreeSpaceMB,
        (@FreeSpaceMB / 1024) AS FreeSpaceGB,
        CASE
            WHEN @FreeSpaceMB < 1024 THEN 'CRITICAL: Less than 1GB free'
            WHEN @FreeSpaceMB < 5120 THEN 'WARNING: Less than 5GB free'
            ELSE 'OK: Sufficient disk space'
        END AS DiskStatus

    DROP TABLE #FixedDrives

    PRINT 'Disk space check complete'
END
GO

PRINT 'Procedure SP_CheckDiskSpace created'
GO

