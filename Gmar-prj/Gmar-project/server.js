import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import cron from 'node-cron';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ---------- SQL ----------
const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'DragCanvasWebApp',
  password: 'WebApp@2026!',
  options: { encrypt: false, trustServerCertificate: true }
};

let pool;

async function start() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server!');
    app.listen(3001, () => console.log('Server running on port 3001'));

    // Start the scheduled notification processor
    startScheduleProcessor();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
start();

// ============================================
// SCHEDULED NOTIFICATION PROCESSOR
// ============================================
function startScheduleProcessor() {
  console.log('📅 Schedule processor started - checking every minute');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find schedules that are due to run
      const result = await pool.request().query(`
        SELECT *
        FROM TBNotificationSchedules
        WHERE IsActive = 1
          AND NextRunDate IS NOT NULL
          AND NextRunDate <= GETDATE()
      `);

      const schedulesToRun = result.recordset;

      if (schedulesToRun.length > 0) {
        console.log(`🔔 Processing ${schedulesToRun.length} scheduled notification(s)...`);
        schedulesToRun.forEach(s => console.log(`  - ${s.ScheduleName} (NextRun was: ${s.NextRunDate ? new Date(s.NextRunDate).toLocaleString() : 'N/A'})`));

        for (const schedule of schedulesToRun) {
          await processScheduledNotification(schedule, pool);
        }
      }
    } catch (err) {
      console.error('Schedule processor error:', err);
    }
  });
}

async function processScheduledNotification(schedule, pool) {
  try {
    console.log(`  → Executing schedule: ${schedule.ScheduleName} (ID: ${schedule.Schedule_ID}, Type: ${schedule.NotificationType})`);

    // Get the message content
    let subject, message;
    if (schedule.Template_ID) {
      const templateResult = await pool.request()
        .input('Template_ID', sql.Int, schedule.Template_ID)
        .query('SELECT * FROM TBNotificationTemplates WHERE Template_ID = @Template_ID');

      if (templateResult.recordset && templateResult.recordset.length > 0) {
        const template = templateResult.recordset[0];
        subject = template.Subject;
        message = template.Message;
      } else {
        // Template not found, try message override
        if (schedule.MessageOverride) {
          subject = schedule.ScheduleName;
          message = schedule.MessageOverride;
        } else {
          console.log(`  ⚠️ Template not found and no message override for schedule: ${schedule.ScheduleName}`);
          return;
        }
      }
    } else if (schedule.MessageOverride) {
      subject = schedule.ScheduleName;
      message = schedule.MessageOverride;
    } else {
      console.log(`  ⚠️ No message content for schedule: ${schedule.ScheduleName}`);
      return;
    }

    // Get recipients
    let recipients;
    if (schedule.RecipientType === 'all') {
      const usersResult = await pool.request()
        .query('SELECT User_ID FROM TBUsers WHERE IsActive = 1');
      recipients = usersResult.recordset || [];
    } else if (schedule.RecipientType === 'selected' && schedule.RecipientIDs) {
      const recipientIds = JSON.parse(schedule.RecipientIDs);
      const placeholders = recipientIds.map(() => '?').join(',');
      const selectedResult = await pool.request()
        .query(`SELECT User_ID FROM TBUsers WHERE User_ID IN (${recipientIds.join(',')})`);
      recipients = selectedResult.recordset || [];
    } else {
      console.log(`  ⚠️ No recipients for schedule: ${schedule.ScheduleName}`);
      return;
    }

    if (!recipients || recipients.length === 0) {
      console.log(`  ⚠️ No recipients found for schedule: ${schedule.ScheduleName}`);
      return;
    }

    // Create notification record
    const notificationResult = await pool.request()
      .input('Subject', sql.NVarChar, subject)
      .input('Message', sql.NVarChar, message)
      .input('NotificationType', sql.NVarChar, schedule.NotificationType)
      .input('RecipientType', sql.NVarChar, schedule.RecipientType)
      .input('RecipientIDs', sql.NVarChar, schedule.RecipientIDs)
      .input('SentCount', sql.Int, recipients.length)
      .input('CreatedBy', sql.Int, schedule.CreatedBy)
      .query(`
        DECLARE @NotificationID INT
        INSERT INTO TBNotifications (Subject, Message, NotificationType, RecipientType, RecipientIDs, Status, SentCount, CreatedBy, CreatedDate, SentDate)
        VALUES (@Subject, @Message, @NotificationType, @RecipientType, @RecipientIDs, 'sent', @SentCount, @CreatedBy, GETDATE(), GETDATE())

        SELECT @NotificationID as NotificationID
      `);

    if (!notificationResult.recordset || notificationResult.recordset.length === 0) {
      console.log(`  ❌ Failed to create notification for schedule: ${schedule.ScheduleName}`);
      return;
    }

    const notificationId = notificationResult.recordset[0].NotificationID;

    // Add delivery log entries
    for (const recipient of recipients) {
      try {
        const userResult = await pool.request()
          .input('User_ID', sql.Int, recipient.User_ID)
          .query('SELECT UserName, UserEmail FROM TBUsers WHERE User_ID = @User_ID');

        if (!userResult.recordset || userResult.recordset.length === 0) {
          console.log(`  ⚠️ User not found: ${recipient.User_ID}`);
          continue;
        }

        const user = userResult.recordset[0];

        await pool.request()
          .input('Notification_ID', sql.Int, notificationId)
          .input('User_ID', sql.Int, recipient.User_ID)
          .input('UserName', sql.NVarChar, user.UserName)
          .input('UserEmail', sql.NVarChar, user.UserEmail)
          .input('Status', sql.NVarChar, 'delivered')
          .input('DeliveredDate', sql.DateTime, new Date())
          .query(`
            INSERT INTO TBNotificationDeliveryLog (Notification_ID, User_ID, UserName, UserEmail, Status, DeliveredDate)
            VALUES (@Notification_ID, @User_ID, @UserName, @UserEmail, @Status, @DeliveredDate)
          `);
      } catch (err) {
        console.error(`  ⚠️ Failed to log delivery for user ${recipient.User_ID}:`, err.message);
      }
    }

    // Update schedule's LastRunDate and calculate NextRunDate
    const nextRunDate = calculateNextRunDate(schedule.Frequency, schedule.ScheduleTime, schedule.ScheduleDay);

    await pool.request()
      .input('Schedule_ID', sql.Int, schedule.Schedule_ID)
      .input('LastRunDate', sql.DateTime, new Date())
      .input('NextRunDate', sql.DateTime, nextRunDate)
      .query(`
        UPDATE TBNotificationSchedules
        SET LastRunDate = @LastRunDate,
            NextRunDate = @NextRunDate
        WHERE Schedule_ID = @Schedule_ID
      `);

    console.log(`  ✅ Sent ${recipients.length} notification(s), next run: ${nextRunDate.toLocaleString()}`);

  } catch (err) {
    console.error(`  ❌ Error processing schedule ${schedule.ScheduleName}:`, err.message);

    // Still update NextRunDate to prevent infinite retry loop
    try {
      const nextRunDate = calculateNextRunDate(schedule.Frequency, schedule.ScheduleTime, schedule.ScheduleDay);
      await pool.request()
        .input('Schedule_ID', sql.Int, schedule.Schedule_ID)
        .input('NextRunDate', sql.DateTime, nextRunDate)
        .query('UPDATE TBNotificationSchedules SET NextRunDate = @NextRunDate WHERE Schedule_ID = @Schedule_ID');
      console.log(`  🔄 Updated next run to: ${nextRunDate.toLocaleString()}`);
    } catch (updateErr) {
      console.error(`  ❌ Failed to update NextRunDate: ${updateErr.message}`);
    }
  }
}

function calculateNextRunDate(frequency, scheduleTime, scheduleDay) {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);

  // Start with today at the scheduled time
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  // If the scheduled time has already passed today, move to tomorrow first
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  // Then apply the frequency logic
  switch (frequency) {
    case 'daily':
      // Already handled by the check above - next run is tomorrow
      break;
    case 'weekly':
      const currentDay = nextRun.getDay();
      const targetDay = scheduleDay || 1;
      let daysUntilTarget = (targetDay + 7 - currentDay) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7; // If today is the target day, move to next week
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
    case 'monthly':
      const targetDayOfMonth = scheduleDay || 1;
      nextRun.setDate(targetDayOfMonth);
      // If we've gone past the target day this month, move to next month
      if (nextRun.getDate() !== targetDayOfMonth) {
        // This happens when the target day doesn't exist (e.g., Feb 31) or we've passed it
        nextRun.setDate(1); // Reset to 1st of next month
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDayOfMonth);
      }
      // Double-check - if still in past, move to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
    case 'yearly':
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
  }

  // Final safety check - ensure next run is in the future
  if (nextRun <= now) {
    // If still in past, add 1 day as fallback
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

 app.get('/api/users', async (req, res) => {
      try {
        const result = await pool.request().query('SELECT User_ID,UserName, UserEmail, IsActive, IsAdmin, IsSuperAdmin, CreatedDate, LastLoginDate FROM TBUsers ');
        res.json(result.recordset);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

  // GET user by id
  app.get('/api/users/:id', async (req, res) => {
    try {
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT User_ID, UserName, UserEmail, UserPassword FROM TBUsers WHERE User_ID = @id');
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create user
  app.post('/api/users', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const result = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(100), email)
        .input('password', sql.NVarChar(255), password)
        .query('INSERT INTO TBUsers (UserName, UserEmail, UserPassword, IsActive, CreatedDate) OUTPUT INSERTED.* VALUES(@username, @email, @password, 1, GETDATE())');
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST login - using Stored Procedure
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Use stored procedure for login
      const result = await pool.request()
        .input('Email', sql.NVarChar(100), email)
        .input('Password', sql.NVarChar(255), password)
        .input('IPAddress', sql.NVarChar(50), req.ip || 'unknown')
        .output('UserID', sql.Int)
        .output('UserName', sql.NVarChar(50))
        .output('IsAdmin', sql.Bit)
        .output('ResultCode', sql.Int)
        .execute('dbo.SP_UserLogin');

      // Get the output parameters
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const userID = outputs.UserID;
      const userName = outputs.UserName;
      const isAdmin = outputs.IsAdmin;

      if (resultCode !== 1 || !userID) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Fetch full user data without password
      const userResult = await pool.request()
        .input('UserID', sql.Int, userID)
          .query('SELECT User_ID, UserName, UserEmail, IsActive, IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

      if (userResult.recordset.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        user: userResult.recordset[0],
        admin: isAdmin,
        message: 'Login successful'
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST register - using Stored Procedure
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Create request
      const request = pool.request()
        .input('UserName', sql.NVarChar(50), username)
        .input('Email', sql.NVarChar(100), email)
        .input('Password', sql.NVarChar(255), password);

      // Add OUTPUT parameters
      const userID = { value: null, type: sql.Int };
      const resultCode = { value: null, type: sql.Int };

      request.output('UserID', sql.Int);
      request.output('ResultCode', sql.Int);

      // Execute stored procedure
      await request.execute('dbo.SP_RegisterUser');

      // Get output values
      const result = await pool.request()
        .input('UserName', sql.NVarChar(50), username)
        .query('SELECT User_ID, UserName, UserEmail FROM TBUsers WHERE UserName = @UserName');

      if (result.recordset.length === 0) {
        return res.status(400).json({ error: 'Registration failed' });
      }

      res.json({ user: result.recordset[0], message: 'Registration successful' });
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // POST logout - using Stored Procedure
  app.post('/api/logout', async (req, res) => {
    try {
      const { userId, sessionDurationMinutes } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Use stored procedure for logout
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('SessionDurationMinutes', sql.Int, sessionDurationMinutes || null)
        .execute('dbo.SP_UserLogout');

      res.json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: err.message });
    }
  });


app.delete('/api/delete-user', async (req, res) => {
    try {
      const { targetID, adminID, confirmDelete } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      if (confirmDelete !== true && confirmDelete !== 1) {
        return res.status(400).json({ error: 'confirmDelete must be true' });
      }
      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('ConfirmDelete', sql.Bit, confirmDelete);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_DeleteUserPermanently');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: err.message });
    }
  });



  app.post('/api/update-status', async (req, res) => {
    try {
      const { targetID, adminID, newStatus } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('NewStatus', sql.Bit, newStatus);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_UpdateUserStatus');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Update user status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { targetID, adminID, newPassword } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('NewPassword', sql.NVarChar(255), newPassword);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_ResetUserPassword');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Reset user password error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/update-role', async (req, res) => {
    try {
      const { targetID, adminID, makeAdmin } = req.body;

      if (!targetID || !adminID || makeAdmin === undefined) {
        return res.status(400).json({ error: 'targetID, adminID, and makeAdmin are required' });
      }

      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('MakeAdmin', sql.Bit, makeAdmin);

      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_UpdateUserRole');

      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: err.message });
    }
  });


      app.post('/api/projects/save', async (req, res) => {
      try {
        const {
          projectId,
          userId,
          projectName,
          projectDescription,
          componentCount,
          projectSizeKB,
          projectData,
          thumbnailUrl 
        } = req.body;

     

        const request = pool.request()
          .input('ProjectID', sql.Int, projectId || null)
          .input('UserID', sql.Int, userId)
          .input('ProjectName', sql.NVarChar(100), projectName)
          .input('ProjectDescription', sql.NVarChar(500),projectDescription || null)
          .input('ComponentCount', sql.Int, componentCount || 0)
          .input('ProjectSizeKB', sql.Decimal(10,2), projectSizeKB || 0)
          .input('ProjectData', sql.NVarChar(sql.MAX), projectData || null)
          .input('ThumbnailURL', sql.NVarChar(sql.MAX), thumbnailUrl ||
  null)
          .output('ResultProjectID', sql.Int)
          .output('ResultCode', sql.Int);

        const result = await request.execute('dbo.SP_SaveProject');


        const resultCode = result.output?.ResultCode;
        const resultProjectId = result.output?.ResultProjectID;

        if (resultCode === 1) {
          console.log('✅ Project saved successfully, ID:', resultProjectId);
          res.json({ projectId: resultProjectId, message: 'Project saved successfully' });
        } else if (resultCode === 2) {
          console.log('❌ Maximum projects limit reached');
          res.status(400).json({ error: 'Maximum projects limit reached' });
        } else {
          console.log('❌ Failed to save project, ResultCode:', resultCode);
          res.status(400).json({ error: 'Failed to save project'
  });
        }
      } catch (err) {
        console.error('❌ Save project error:', err);
        res.status(500).json({ error: err.message });
      }
    });
  

      app.get('/api/projects/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT Project_ID, ProjectName, ProjectDescription,
         ComponentCount, ProjectSizeKB, ThumbnailURL, IsPublished,
         CreatedDate, ModifiedDate
  FROM TBProjects
        WHERE User_ID = @UserID AND IsDeleted = 0
        ORDER BY ModifiedDate DESC
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error('Get projects error:', err);
      res.status(500).json({ error: err.message });
    }
  });

   app.get('/api/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.query;  // pass userId in query string for security

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      console.log('Loading project:', projectId, 'for user:',
  userId);

      const request = pool.request()
        .input('ProjectID', sql.Int, projectId)
        .input('UserID', sql.Int, userId);

      const result = await
  request.execute('dbo.SP_GetProjectDetail');

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Project not found'
  });
      }

      const project = result.recordset[0];
      console.log('✅ Project loaded:', project.ProjectName);
      res.json(project);

    } catch (err) {
      console.error('❌ Load project error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  
  // Delete a project
  app.delete('/api/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await pool.request()
        .input('ProjectID', sql.Int, projectId)
        .input('UserID', sql.Int, userId)
        .query(`
          UPDATE TBProjects
          SET IsDeleted = 1
          WHERE Project_ID = @ProjectID AND User_ID = @UserID
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Project not found'
  });
      }

      console.log('✅ Project deleted:', projectId);
      res.json({ message: 'Project deleted successfully' });

    } catch (err) {
      console.error('❌ Delete error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Get user statistics
  app.get('/api/users/:id/stats', async (req, res) => {
    try {
      const { id } = req.params;

      console.log('Fetching stats for user:', id);

      const result = await pool.request()
        .input('UserID', sql.Int, id)
        .query(`
          SELECT
            ISNULL((SELECT COUNT(*) FROM TBProjects WHERE User_ID =
   @UserID AND IsDeleted = 0), 0) AS TotalProjects,
            ISNULL((SELECT COUNT(*) FROM TBProjects WHERE User_ID =
   @UserID AND IsDeleted = 0 AND IsPublished = 1), 0) AS
  PublishedProjects,
            ISNULL((SELECT SUM(ComponentCount) FROM TBProjects
  WHERE User_ID = @UserID AND IsDeleted = 0), 0) AS
  TotalComponents,
            ISNULL((SELECT SUM(ExportCount) FROM TBProjects WHERE
  User_ID = @UserID), 0) AS TotalExports,
            ISNULL((SELECT COUNT(*) FROM TBUserActivity WHERE
  User_ID = @UserID), 0) AS TotalActivities,
            ISNULL((SELECT COUNT(*) FROM TBAuditLog WHERE User_ID =
   @UserID), 0) AS TotalAuditEntries
        `);

      console.log('Stats result:', result.recordset[0]);
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Get user stats error:', err);
      res.status(500).json({ error: err.message });
    }
  });


    // Save as Template
    app.post('/api/templates/save', async (req, res) => {
    try {
      const { templateName, category, projectData, componentCount,
  createdBy, thumbnailData } = req.body;

      const result = await pool.request()
        .input('TemplateName', sql.NVarChar(100), templateName)
        .input('Category', sql.NVarChar(50), category)
        .input('ThumbnailURL', sql.NVarChar(sql.MAX), thumbnailData ||
  null)  // Change to MAX
        .input('TemplateData', sql.NVarChar(sql.MAX), projectData)
        .input('ComponentCount', sql.Int, componentCount)
        .input('CreatedBy', sql.Int, createdBy)
        .input('IsActive', sql.Bit, 1)
        .query(`
          INSERT INTO TBTemplates (TemplateName, Category, ThumbnailURL,
  TemplateData, ComponentCount, CreatedBy, IsActive)
          VALUES (@TemplateName, @Category, @ThumbnailURL, @TemplateData,
   @ComponentCount, @CreatedBy, @IsActive)
          SELECT SCOPE_IDENTITY() AS TemplateID
        `);

      const templateId = result.recordset[0].TemplateID;
      res.json({ templateId, message: 'Template saved successfully' });
    } catch (err) {
      console.error('Save template error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Get all templates (for Inspire Me page)
  app.get('/api/templates', async (req, res) => {
    try {
      const result = await pool.request()
        .query(`
          SELECT t.Template_ID, t.TemplateName, t.Category,
  t.ThumbnailURL,
                 t.ComponentCount, t.CreatedDate, u.UserName AS
  CreatedByName
          FROM TBTemplates t
          INNER JOIN TBUsers u ON t.CreatedBy = u.User_ID
          WHERE t.IsActive = 1
          ORDER BY t.CreatedDate DESC
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error('Get templates error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get all templates (including hidden) - for admin panel
  app.get('/api/templates/all', async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // Check if user is admin or superadmin
      const userResult = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.recordset[0];
      if (!user.IsAdmin && !user.IsSuperAdmin) {
        return res.status(403).json({ error: 'Only admins can view all templates' });
      }

      const result = await pool.request()
        .query(`
          SELECT t.Template_ID, t.TemplateName, t.Category, t.ThumbnailURL,
                 t.ComponentCount, t.CreatedDate, t.IsActive, u.UserName AS CreatedByName
          FROM TBTemplates t
          INNER JOIN TBUsers u ON t.CreatedBy = u.User_ID
          ORDER BY t.CreatedDate DESC
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error('Get all templates error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get single template data
  app.get('/api/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.request()
        .input('TemplateID', sql.Int, id)
        .query(`
          SELECT Template_ID, TemplateName, Category, TemplateData,
   ThumbnailURL, ComponentCount
          FROM TBTemplates
          WHERE Template_ID = @TemplateID AND IsActive = 1
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Template not found'
  });
      }

      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Get template error:', err);
      res.status(500).json({ error: err.message });
    }
  });


   
      // Delete template (admin/superadmin only)
    app.delete('/api/templates/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.query; // Use query instead of body

        console.log('Delete template request:', id, 'by user:', userId);

        if (!userId) {
          return res.status(400).json({ error: 'userId required' });
        }

        // Check if user is admin or superadmin
        const userResult = await pool.request()
          .input('UserID', sql.Int, userId)
          .query('SELECT IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

        if (userResult.recordset.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.recordset[0];
        if (!user.IsAdmin && !user.IsSuperAdmin) {
          return res.status(403).json({ error: 'Only admins can delete templates' });
        }

        await pool.request()
          .input('TemplateID', sql.Int, id)
          .query('UPDATE TBTemplates SET IsActive = 0 WHERE Template_ID = @TemplateID');

        console.log('✅ Template deleted:', id);
        res.json({ message: 'Template deleted successfully' });

      } catch (err) {
        console.error('❌ Delete template error:', err);
        res.status(500).json({ error: err.message });
      }
    });


app.delete('/api/templates/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.query; // Use query instead of body

        console.log('Update status template request:', id, 'by user:', userId);

        if (!userId) {
          return res.status(400).json({ error: 'userId required' });
        }

        // Check if user is admin or superadmin
        const userResult = await pool.request()
          .input('UserID', sql.Int, userId)
          .query('SELECT IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

        if (userResult.recordset.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.recordset[0];
        if (!user.IsAdmin && !user.IsSuperAdmin) {
          return res.status(403).json({ error: 'Only admins can update templates' });
        }

        await pool.request()
          .input('TemplateID', sql.Int, id)
          .query('UPDATE TBTemplates SET IsActive = 0 WHERE Template_ID = @TemplateID');

        console.log('✅ Template deleted:', id);
        res.json({ message: 'Template deleted successfully' });

      } catch (err) {
        console.error('❌ Delete template error:', err);
        res.status(500).json({ error: err.message });
      }
    });


     // Update template visibility
  app.patch('/api/templates/:id/visibility', async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // Check if user is admin or superadmin
      const userResult = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.recordset[0];
      if (!user.IsAdmin && !user.IsSuperAdmin) {
        return res.status(403).json({ error: 'Only admins can update templates' });
      }

      await pool.request()
        .input('TemplateID', sql.Int, id)
        .input('IsActive', sql.Bit, isActive)
        .query('UPDATE TBTemplates SET IsActive = @IsActive WHERE Template_ID = @TemplateID');

      console.log('✅ Template visibility updated:', id, 'isActive:',
  isActive);
      res.json({ message: 'Template visibility updated' });

    } catch (err) {
      console.error('❌ Update template visibility error:', err);
      res.status(500).json({ error: err.message });
    }
  });


      // Get all notifications (for admin panel)
    app.get('/api/notifications/all', async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const request = pool.request()
        .input('AdminID', sql.Int, userId);

      const result = await
  request.execute('dbo.SP_GetAllNotifications');
      res.json(result.recordset);
    } catch (err) {
      console.error('Get all notifications error:', err);

      if (err.message.includes('Not authorized')) {
        return res.status(403).json({ error: 'Only superadmins can view notifications' });
      }

      res.status(500).json({ error: err.message });
    }
  });
  
    // Send newsletter endpoint
    
  app.post('/api/notifications/send-newsletter', async (req, res) => {
    try {
      const { subject, message, recipientType, recipientIds, userId
   } = req.body;

      if (!subject || !message || !recipientType || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Convert recipientIds array to JSON string
      const recipientIdsString = (recipientType === 'selected' &&
  recipientIds)
        ? JSON.stringify(recipientIds)
        : null;

      const request = pool.request()
        .input('Subject', sql.NVarChar(200), subject)
        .input('Message', sql.NVarChar(sql.MAX), message)
        .input('RecipientType', sql.NVarChar(50), recipientType)
        .input('RecipientIDs', sql.NVarChar(sql.MAX),
  recipientIdsString)
        .input('AdminID', sql.Int, userId)
        .output('NotificationID', sql.Int)
        .output('SentCount', sql.Int)
        .output('ResultCode', sql.Int);

      const result = await
  request.execute('dbo.SP_SendNewsletter');

      const resultCode = result.output.ResultCode;
      const notificationId = result.output.NotificationID;
      const sentCount = result.output.SentCount;

      if (resultCode === 0) {
        return res.status(403).json({ error: 'Not authorized - only superadmins can send newsletters' });
      }

      console.log(`✅ Newsletter sent: ID=${notificationId},
  Recipients=${sentCount}`);

      res.json({
        success: true,
        notificationId: notificationId,
        sentCount: sentCount,
        message: `Newsletter sent to ${sentCount} recipients`
      });

    } catch (err) {
      console.error('Send newsletter error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/notifications/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const request = pool.request()
        .input('UserID', sql.Int, userId);

      const result = await request.execute('dbo.SP_GetUserNotifications');
      res.json(result.recordset);
    } catch (err) {
      console.error('Get user notifications error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  
  // Delete notification
  app.delete('/api/notifications/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const request = pool.request()
        .input('NotificationID', sql.Int, notificationId)
        .input('UserID', sql.Int, userId)
        .output('ResultCode', sql.Int);

      const result = await
  request.execute('dbo.SP_DeleteNotification');

      const resultCode = result.output.ResultCode;

      if (resultCode === 1) {
        res.json({ success: true, message: 'Notification deleted'
  });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (err) {
      console.error('Delete notification error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // NOTIFICATION SCHEDULES ENDPOINTS
  // ============================================

  // Get all schedules
  app.get('/api/schedules', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT s.*, u.UserName as CreatedByName,
                 (SELECT TemplateName FROM TBTemplates WHERE Template_ID = s.Template_ID) as TemplateName
          FROM TBNotificationSchedules s
          LEFT JOIN TBUsers u ON s.CreatedBy = u.User_ID
          ORDER BY s.CreatedDate DESC
        `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Get schedules error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create new schedule
  app.post('/api/schedules', async (req, res) => {
    try {
      const { scheduleName, notificationType, frequency, scheduleTime, scheduleDay,
              templateId, recipientType, recipientIds, messageOverride, userId } = req.body;

      if (!scheduleName || !notificationType || !frequency || !scheduleTime || !recipientType || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Calculate next run date
      const now = new Date();
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      let nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);

      if (frequency === 'daily') {
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
      } else if (frequency === 'weekly') {
        const dayOfWeek = scheduleDay || 1;
        nextRun.setDate(nextRun.getDate() + ((dayOfWeek + 7 - nextRun.getDay()) % 7));
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 7);
      } else if (frequency === 'monthly') {
        const dayOfMonth = scheduleDay || 1;
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) nextRun.setMonth(nextRun.getMonth() + 1);
      }

      const result = await pool.request()
        .input('ScheduleName', sql.NVarChar, scheduleName)
        .input('NotificationType', sql.NVarChar, notificationType)
        .input('Frequency', sql.NVarChar, frequency)
        .input('ScheduleTime', sql.NVarChar, scheduleTime)
        .input('ScheduleDay', sql.Int, scheduleDay || null)
        .input('Template_ID', sql.Int, templateId || null)
        .input('RecipientType', sql.NVarChar, recipientType)
        .input('RecipientIDs', sql.NVarChar, JSON.stringify(recipientIds || []))
        .input('MessageOverride', sql.NVarChar, messageOverride || null)
        .input('CreatedBy', sql.Int, userId)
        .input('NextRunDate', sql.DateTime, nextRun)
        .query(`
          INSERT INTO TBNotificationSchedules
          (ScheduleName, NotificationType, Frequency, ScheduleTime, ScheduleDay,
           Template_ID, RecipientType, RecipientIDs, MessageOverride, CreatedBy, NextRunDate)
          VALUES
          (@ScheduleName, @NotificationType, @Frequency, @ScheduleTime, @ScheduleDay,
           @Template_ID, @RecipientType, @RecipientIDs, @MessageOverride, @CreatedBy, @NextRunDate)

          SELECT SCOPE_IDENTITY() as ScheduleID
        `);

      res.json({ success: true, scheduleId: result.recordset[0].ScheduleID, nextRun });
    } catch (err) {
      console.error('Create schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update schedule
  app.put('/api/schedules/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduleName, notificationType, frequency, scheduleTime, scheduleDay,
              templateId, recipientType, recipientIds, messageOverride } = req.body;

      // Calculate next run date
      const now = new Date();
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      let nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);

      if (frequency === 'daily') {
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
      } else if (frequency === 'weekly') {
        const dayOfWeek = scheduleDay || 1;
        nextRun.setDate(nextRun.getDate() + ((dayOfWeek + 7 - nextRun.getDay()) % 7));
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 7);
      } else if (frequency === 'monthly') {
        const dayOfMonth = scheduleDay || 1;
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) nextRun.setMonth(nextRun.getMonth() + 1);
      }

      await pool.request()
        .input('Schedule_ID', sql.Int, id)
        .input('ScheduleName', sql.NVarChar, scheduleName)
        .input('NotificationType', sql.NVarChar, notificationType)
        .input('Frequency', sql.NVarChar, frequency)
        .input('ScheduleTime', sql.NVarChar, scheduleTime)
        .input('ScheduleDay', sql.Int, scheduleDay || null)
        .input('Template_ID', sql.Int, templateId || null)
        .input('RecipientType', sql.NVarChar, recipientType)
        .input('RecipientIDs', sql.NVarChar, JSON.stringify(recipientIds || []))
        .input('MessageOverride', sql.NVarChar, messageOverride || null)
        .input('NextRunDate', sql.DateTime, nextRun)
        .query(`
          UPDATE TBNotificationSchedules
          SET ScheduleName = @ScheduleName,
              NotificationType = @NotificationType,
              Frequency = @Frequency,
              ScheduleTime = @ScheduleTime,
              ScheduleDay = @ScheduleDay,
              Template_ID = @Template_ID,
              RecipientType = @RecipientType,
              RecipientIDs = @RecipientIDs,
              MessageOverride = @MessageOverride,
              NextRunDate = @NextRunDate
          WHERE Schedule_ID = @Schedule_ID
        `);

      res.json({ success: true, nextRun });
    } catch (err) {
      console.error('Update schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete schedule
  app.delete('/api/schedules/:id', async (req, res) => {
    try {
      await pool.request()
        .input('Schedule_ID', sql.Int, req.params.id)
        .query('DELETE FROM TBNotificationSchedules WHERE Schedule_ID = @Schedule_ID');

      res.json({ success: true });
    } catch (err) {
      console.error('Delete schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle schedule active/inactive
  app.patch('/api/schedules/:id/toggle', async (req, res) => {
    try {
      const { isActive } = req.body;
      await pool.request()
        .input('Schedule_ID', sql.Int, req.params.id)
        .input('IsActive', sql.Bit, isActive)
        .query('UPDATE TBNotificationSchedules SET IsActive = @IsActive WHERE Schedule_ID = @Schedule_ID');

      res.json({ success: true, isActive });
    } catch (err) {
      console.error('Toggle schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // NOTIFICATION TEMPLATES ENDPOINTS
  // ============================================

  // Get all notification templates
  app.get('/api/notification-templates', async (req, res) => {
    try {
      const result = await pool.request()
        .query(`
          SELECT t.*, u.UserName as CreatedByName
          FROM TBNotificationTemplates t
          LEFT JOIN TBUsers u ON t.CreatedBy = u.User_ID
          ORDER BY t.CreatedDate DESC
        `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Get notification templates error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create notification template
  app.post('/api/notification-templates', async (req, res) => {
    try {
      const { templateName, templateType, subject, message, variables, userId } = req.body;

      if (!templateName || !templateType || !subject || !message || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.request()
        .input('TemplateName', sql.NVarChar, templateName)
        .input('TemplateType', sql.NVarChar, templateType)
        .input('Subject', sql.NVarChar, subject)
        .input('Message', sql.NVarChar, message)
        .input('Variables', sql.NVarChar, JSON.stringify(variables || []))
        .input('CreatedBy', sql.Int, userId)
        .query(`
          INSERT INTO TBNotificationTemplates (TemplateName, TemplateType, Subject, Message, Variables, CreatedBy)
          VALUES (@TemplateName, @TemplateType, @Subject, @Message, @Variables, @CreatedBy)

          SELECT SCOPE_IDENTITY() as TemplateID
        `);

      res.json({ success: true, templateId: result.recordset[0].TemplateID });
    } catch (err) {
      console.error('Create notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update notification template
  app.put('/api/notification-templates/:id', async (req, res) => {
    try {
      const { templateName, templateType, subject, message, variables } = req.body;

      await pool.request()
        .input('Template_ID', sql.Int, req.params.id)
        .input('TemplateName', sql.NVarChar, templateName)
        .input('TemplateType', sql.NVarChar, templateType)
        .input('Subject', sql.NVarChar, subject)
        .input('Message', sql.NVarChar, message)
        .input('Variables', sql.NVarChar, JSON.stringify(variables || []))
        .query(`
          UPDATE TBNotificationTemplates
          SET TemplateName = @TemplateName,
              TemplateType = @TemplateType,
              Subject = @Subject,
              Message = @Message,
              Variables = @Variables,
              ModifiedDate = GETDATE()
          WHERE Template_ID = @Template_ID
        `);

      res.json({ success: true });
    } catch (err) {
      console.error('Update notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete notification template
  app.delete('/api/notification-templates/:id', async (req, res) => {
    try {
      await pool.request()
        .input('Template_ID', sql.Int, req.params.id)
        .query('DELETE FROM TBNotificationTemplates WHERE Template_ID = @Template_ID');

      res.json({ success: true });
    } catch (err) {
      console.error('Delete notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle template active/inactive
  app.patch('/api/notification-templates/:id/toggle', async (req, res) => {
    try {
      const { isActive } = req.body;
      await pool.request()
        .input('Template_ID', sql.Int, req.params.id)
        .input('IsActive', sql.Bit, isActive)
        .query('UPDATE TBNotificationTemplates SET IsActive = @IsActive WHERE Template_ID = @Template_ID');

      res.json({ success: true, isActive });
    } catch (err) {
      console.error('Toggle notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // NOTIFICATION LOGS ENDPOINTS
  // ============================================

  // Get notification delivery logs with pagination and filters
  app.get('/api/notification-logs', async (req, res) => {
    try {
      const { page = 1, limit = 50, status, startDate, endDate, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (status) {
        whereClause += ' AND Status = @Status';
        params.push({ name: 'Status', type: sql.NVarChar, value: status });
      }
      if (startDate) {
        whereClause += ' AND DeliveredDate >= @StartDate';
        params.push({ name: 'StartDate', type: sql.DateTime, value: new Date(startDate) });
      }
      if (endDate) {
        whereClause += ' AND DeliveredDate <= @EndDate';
        params.push({ name: 'EndDate', type: sql.DateTime, value: new Date(endDate) });
      }
      if (search) {
        whereClause += ' AND (UserName LIKE @Search OR UserEmail LIKE @Search)';
        params.push({ name: 'Search', type: sql.NVarChar, value: `%${search}%` });
      }

      const request = pool.request();
      params.forEach(p => request.input(p.name, p.type, p.value));
      request.input('Limit', sql.Int, limit);
      request.input('Offset', sql.Int, offset);

      const result = await request.query(`
        SELECT *
        FROM TBNotificationDeliveryLog
        ${whereClause}
        ORDER BY DeliveredDate DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
      `);

      // Get total count
      const countRequest = pool.request();
      params.forEach(p => countRequest.input(p.name, p.type, p.value));
      const countResult = await countRequest.query(`
        SELECT COUNT(*) as Total FROM TBNotificationDeliveryLog ${whereClause}
      `);

      res.json({
        logs: result.recordset,
        total: countResult.recordset[0].Total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (err) {
      console.error('Get notification logs error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get notification log statistics
  app.get('/api/notification-logs/stats', async (req, res) => {
    try {
      const result = await pool.request()
        .query(`
          SELECT
            COUNT(*) as Total,
            SUM(CASE WHEN Status = 'delivered' THEN 1 ELSE 0 END) as Delivered,
            SUM(CASE WHEN Status = 'viewed' THEN 1 ELSE 0 END) as Viewed,
            SUM(CASE WHEN Status = 'failed' THEN 1 ELSE 0 END) as Failed
          FROM TBNotificationDeliveryLog
          WHERE DeliveredDate >= DATEADD(day, -30, GETDATE())
        `);

      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Get notification log stats error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get logs for specific notification
  app.get('/api/notification-logs/:notificationId', async (req, res) => {
    try {
      const result = await pool.request()
        .input('Notification_ID', sql.Int, req.params.notificationId)
        .query(`
          SELECT *
          FROM TBNotificationDeliveryLog
          WHERE Notification_ID = @Notification_ID
          ORDER BY DeliveredDate DESC
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error('Get notification logs by ID error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // NOTIFICATION SETTINGS ENDPOINTS
  // ============================================

  // Get notification settings
  app.get('/api/notification-settings', async (req, res) => {
    try {
      const result = await pool.request()
        .query('SELECT * FROM TBNotificationSettings ORDER BY NotificationType');

      res.json(result.recordset);
    } catch (err) {
      console.error('Get notification settings error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update notification settings
  app.patch('/api/notification-settings', async (req, res) => {
    try {
      const { settings, userId } = req.body; // settings: [{ notificationType, isEnabled }]

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ error: 'Settings array required' });
      }

      for (const setting of settings) {
        await pool.request()
          .input('NotificationType', sql.NVarChar, setting.notificationType)
          .input('IsEnabled', sql.Bit, setting.isEnabled)
          .input('ModifiedBy', sql.Int, userId || null)
          .query(`
            UPDATE TBNotificationSettings
            SET IsEnabled = @IsEnabled,
                ModifiedBy = @ModifiedBy,
                ModifiedDate = GETDATE()
            WHERE NotificationType = @NotificationType
          `);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Update notification settings error:', err);
      res.status(500).json({ error: err.message });
    }
  });


// ---------- Robust JSON extraction/parsing ----------
function extractBalancedJsonObject(text) {
  const s = String(text);
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No { found');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) return s.slice(start, i + 1);
  }

  throw new Error('JSON object not closed (unbalanced braces)');
}

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // normalize smart quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // keep only first balanced JSON object (ignore trailing text)
  s = extractBalancedJsonObject(s);

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown link form if leaked: [url](url) -> url
  s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');

  return JSON.parse(s);
}

async function repairJsonWithAI(raw, apiKey) {
  const repairRequest = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON repair tool. Return ONLY valid JSON. No markdown. No comments. Start with { and end with }. No trailing commas.'
      },
      {
        role: 'user',
        content:
          'Fix this into valid JSON (do not change meaning, only fix syntax). Return ONLY the fixed JSON:\n' +
          raw
      }
    ],
    max_tokens: 2500,
    temperature: 0.0
  };

  const rr = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(repairRequest)
  });

  const t = await rr.text();
  let d;
  try { d = JSON.parse(t); } catch { d = null; }

  if (!rr.ok) throw new Error(`Repair call failed: ${rr.status} ${t}`);

  const fixed = d?.choices?.[0]?.message?.content;
  if (!fixed) throw new Error('Repair returned empty content');
  return fixed;
}

// ---------- Normalization (fixes missing sections + missing props wrapper) ----------
function wrapToSections(parsed) {
  if (parsed && Array.isArray(parsed.sections)) return parsed;

  // If AI returned a single root node with children => treat children as sections
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.children)) return { sections: parsed.children };
    if (parsed.type) return { sections: [parsed] };
  }

  return { sections: [] };
}

function normalizeNode(node) {
  if (!node || typeof node !== 'object') return node;

  // Already correct shape
  if (node.type && node.props) {
    return {
      type: node.type,
      props: node.props || {},
      children: Array.isArray(node.children) ? node.children.map(normalizeNode) : []
    };
  }

  // Convert flat keys to props
  const { type, children, props, ...rest } = node;

  return {
    type: type || 'container',
    props: { ...(props || {}), ...(rest || {}) },
    children: Array.isArray(children) ? children.map(normalizeNode) : []
  };
}

function normalizeLayout(parsed) {
  const wrapped = wrapToSections(parsed);
  return { sections: (wrapped.sections || []).map(normalizeNode) };
}

// ---------- AI endpoint ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    const systemPrompt = `Output ONLY valid JSON: {"sections":[{type,props,children}]}

# ELEMENT PROPS (ALL must be included)
Container: width,height,padding=[t,r,b,l],margin=[t,r,b,l],background={r,g,b,a},color={r,g,b,a},radius,shadow,flexDirection,alignItems,justifyContent
Text: text,fontSize,fontWeight,textAlign,color={r,g,b,a},margin=[t,r,b,l],shadow
Button: text,buttonStyle,background={r,g,b,a},color={r,g,b,a},margin=[t,r,b,l]
Video: videoId="",videoUrl,text (ALL 3 required)
Image: src,radius,width,height
Link: href,text,fontSize

# VIDEO URLs (choose based on topic)
Tech: https://www.pexels.com/download/video/3129671/
Abstract: https://www.pexels.com/download/video/35969886/
Stars: https://www.pexels.com/download/video/3121459/
Nature: https://www.pexels.com/download/video/853800/
Ocean: https://www.pexels.com/download/video/2099384/
City: https://www.pexels.com/download/video/3252783/

# IMAGE URLs (choose based on topic)
Office: https://images.unsplash.com/photo-1497366216548-37526070297c?w=800
Tech: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800
Meeting: https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800
Team: https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800
Coding: https://images.unsplash.com/photo-1551434678-e076c223a692?w=800
Nature: https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800
Food: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800
Fitness: https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800

# EXAMPLES (VARY styling, content based on topic)
Hero:
{"type":"container","props":{"width":"100%","height":"500px","padding":[80,60,80,60],"background":{"r":20,"g":30,"b":50,"a":1},"alignItems":"center","justifyContent":"center"},"children":[
  {"type":"video","props":{"videoId":"","videoUrl":"https://www.pexels.com/download/video/3129671/","text":"Transform Your Business"}}
]}

Feature:
{"type":"container","props":{"width":"100%","padding":[40,60,40,60],"background":{"r":250,"g":250,"b":250,"a":1},"alignItems":"center"},"children":[
  {"type":"text","props":{"text":"Powerful Features","fontSize":42,"fontWeight":"700","textAlign":"center","color":{"r":30,"g":40,"b":60,"a":1},"margin":[0,0,30,0],"shadow":0}},
  {"type":"image","props":{"src":"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800","radius":16,"width":"100%","height":"300px"}}
]}

# RULES
1. VARY content based on topic - don't use same text
2. VARY colors - use different backgrounds per section
3. VARY font sizes - headings 36-56, body 16-20
4. VARY padding/margin - create spacing
5. ALWAYS include radius (8-24) for modern look
6. ALWAYS include shadow (10-40) for depth
7. Match videos/images to topic
8. Generate 4-6 sections with different content

Topic: ${prompt}`;

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create unique website for "${prompt}". VARY all content - use topic-specific headlines, descriptions. Choose DIFFERENT videos/images that match topic. Use DIFFERENT colors per section. Make it visually impressive with proper spacing and styling.` }
      ],
      max_tokens: 10000,
      temperature: 0.7
    };

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    const txt = await r.text();
    let data;
    try { data = JSON.parse(txt); } catch { data = null; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity API error',
        status: r.status,
        body: data ?? txt
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    console.log('AI Response length:', raw?.length);
    console.log('AI Response (first 500 chars):', raw?.substring(0, 500));
    console.log('AI Response (last 200 chars):', raw?.slice(-200));

    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    // Parse with repair fallback
    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      console.log('Parse error:', e1.message);
      console.log('Attempting repair...');
      try {
        const fixedRaw = await repairJsonWithAI(raw, process.env.PPLX_API_KEY);
        parsed = safeParseAIJson(fixedRaw);
      } catch (e2) {
        console.log('Repair failed:', e2.message);
        return res.status(500).json({
          error: 'Failed to parse AI response',
          parseError: e1.message,
          repairError: e2.message,
          rawLength: raw?.length,
          rawPreview: raw?.substring(0, 1000)
        });
      }
    }

    // Normalize format to {sections:[{type,props,children}]}
    const normalized = normalizeLayout(parsed);

    if (!normalized.sections || !Array.isArray(normalized.sections) || normalized.sections.length === 0) {
      return res.status(400).json({ error: 'No sections generated', parsed, normalized });
    }

    return res.json(normalized);
  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e?.message,
      stack: e?.stack
    });
  }
});

export default app;
