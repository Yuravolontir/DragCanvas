  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';



import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import cron from 'node-cron';

const { Pool } = pg;

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ---------- PostgreSQL ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function start() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL!');
    client.release();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
      const result = await pool.query(`
        SELECT *
        FROM "TBNotificationSchedules"
        WHERE "IsActive" = true
          AND "NextRunDate" IS NOT NULL
          AND "NextRunDate" <= NOW()
          AND ("LastRunDate" IS NULL OR "LastRunDate" < NOW() - interval '1 day' OR "Frequency" != 'daily' OR EXTRACT(EPOCH FROM (NOW() - COALESCE("LastRunDate", '2000-01-01'::timestamp))) / 60 >= 60)
      `);

      const schedulesToRun = result.rows;

      if (schedulesToRun.length > 0) {
        console.log(`🔔 Processing ${schedulesToRun.length} scheduled notification(s)...`);
        schedulesToRun.forEach(s => console.log(`  - ${s.ScheduleName} (NextRun was: ${s.NextRunDate ? new Date(s.NextRunDate).toLocaleString() : 'N/A'})`));

        for (const schedule of schedulesToRun) {
          await processScheduledNotification(schedule);
        }
      }
    } catch (err) {
      console.error('Schedule processor error:', err);
    }
  });
}

async function processScheduledNotification(schedule) {
  try {
    console.log(`  → Executing schedule: ${schedule.ScheduleName} (ID: ${schedule.Schedule_ID}, Type: ${schedule.NotificationType})`);

    // Get the message content
    let subject, message;
    if (schedule.MessageOverride) {
      subject = schedule.ScheduleName;
      message = schedule.MessageOverride;
    } else if (schedule.Template_ID) {
      const tplResult = await pool.query(
        'SELECT "Subject", "Message" FROM "TBNotificationTemplates" WHERE "Template_ID" = $1',
        [schedule.Template_ID]
      );
      if (tplResult.rows.length > 0) {
        subject = tplResult.rows[0].Subject;
        message = tplResult.rows[0].Message;
      }
    } else {
      console.log(`  ⚠️ No message content for schedule: ${schedule.ScheduleName}`);
      return;
    }

    // Get recipients
    let recipients;
    if (schedule.RecipientType === 'all') {
      const usersResult = await pool.query('SELECT "User_ID" FROM "TBUsers" WHERE "IsActive" = true');
      recipients = usersResult.rows || [];
    } else if (schedule.RecipientType === 'selected' && schedule.RecipientIDs) {
      const recipientIds = JSON.parse(schedule.RecipientIDs);
      const selectedResult = await pool.query(
        `SELECT "User_ID" FROM "TBUsers" WHERE "User_ID" = ANY($1::int[])`,
        [recipientIds]
      );
      recipients = selectedResult.rows || [];
    } else {
      console.log(`  ⚠️ No recipients for schedule: ${schedule.ScheduleName}`);
      return;
    }

    if (!recipients || recipients.length === 0) {
      console.log(`  ⚠️ No recipients found for schedule: ${schedule.ScheduleName}`);
      return;
    }

    // Create a personalized notification for each recipient
    for (const recipient of recipients) {
      try {
        const userResult = await pool.query(
          'SELECT "UserName", "UserEmail" FROM "TBUsers" WHERE "User_ID" = $1',
          [recipient.User_ID]
        );

        if (!userResult.rows || userResult.rows.length === 0) {
          console.log(`  ⚠️ User not found: ${recipient.User_ID}`);
          continue;
        }

        const user = userResult.rows[0];

        // Replace {username} per recipient
        let personalSubject = subject.replace(/\{username\}/gi, user.UserName);
        let personalMessage = message.replace(/\{username\}/gi, user.UserName);

        const notificationResult = await pool.query(`
          WITH ins_notif AS (
            INSERT INTO "TBNotifications" ("Subject", "Message", "NotificationType", "RecipientType", "RecipientIDs", "Status", "SentCount", "CreatedBy", "CreatedDate", "SentDate")
            VALUES ($1, $2, $3, $4, $5, 'sent', 1, $6, NOW(), NOW())
            RETURNING "Notification_ID"
          )
          INSERT INTO "TBNotificationDeliveryLog" ("Notification_ID", "User_ID", "UserName", "UserEmail", "Status", "DeliveredDate")
          SELECT "Notification_ID", $7, $8, $9, 'delivered', NOW()
          FROM ins_notif
          RETURNING "Notification_ID"
        `, [personalSubject, personalMessage, schedule.NotificationType, schedule.RecipientType,
            JSON.stringify([recipient.User_ID]), schedule.CreatedBy,
            recipient.User_ID, user.UserName, user.UserEmail]);

      } catch (err) {
        console.error(`  ⚠️ Failed to create notification for user ${recipient.User_ID}:`, err.message);
      }
    }

    // Update schedule's LastRunDate and calculate NextRunDate
    const nextRunDate = calculateNextRunDate(schedule.Frequency, schedule.ScheduleTime, schedule.ScheduleDay);

    await pool.query(
      `UPDATE "TBNotificationSchedules" SET "LastRunDate" = NOW(), "NextRunDate" = $1 WHERE "Schedule_ID" = $2`,
      [nextRunDate, schedule.Schedule_ID]
    );

    console.log(`  ✅ Sent ${recipients.length} notification(s), next run: ${nextRunDate.toLocaleString()}`);
  } catch (err) {
    console.error(`  ⚠️ Failed to process schedule ${schedule.ScheduleName}:`, err);
  }
}

function calculateNextRunDate(frequency, scheduleTime, scheduleDay) {
  const [hours, minutes] = (scheduleTime || '09:00').split(':').map(Number);
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (frequency === 'daily') {
    nextRun.setDate(nextRun.getDate() + 1);
  } else if (frequency === 'weekly') {
    const dayOfWeek = parseInt(scheduleDay) || 1;
    nextRun.setDate(nextRun.getDate() + ((dayOfWeek + 7 - nextRun.getDay()) % 7));
    if (nextRun <= new Date()) nextRun.setDate(nextRun.getDate() + 7);
  } else if (frequency === 'monthly') {
    const dayOfMonth = parseInt(scheduleDay) || 1;
    nextRun.setDate(dayOfMonth);
    if (nextRun <= new Date()) nextRun.setMonth(nextRun.getMonth() + 1);
    // Handle months where the day doesn't exist
    if (nextRun.getDate() !== dayOfMonth) {
      nextRun.setDate(0); // Last day of previous month
    }
  }

  return nextRun;
}

// ============================================
// API ROUTES
// ============================================

//  app.get('/api/users', async (req, res) => {
//     try {
//       const result = await pool.query('SELECT * FROM TBUsers');
//       res.json(result.recordset);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//  });

//   app.get('/api/users/:id', async (req, res) => {
//     try {
//       const result = await pool.query('SELECT * FROM TBUsers WHERE User_ID = $1', [req.params.id]);
//       if (result.recordset.length === 0) return res.status(404).json({ error: 'User not found' });
//       res.json(result.recordset[0]);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });

  app.post('/api/users', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const result = await pool.query(
        'INSERT INTO "TBUsers" ("UserName", "UserEmail", "UserPassword", "IsActive", "CreatedDate") VALUES($1, $2, $3, true, NOW()) RETURNING *',
        [username, email, password]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });



  // POST register - inline SQL (replaces SP_RegisterUser)
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const result = await pool.query(
        'INSERT INTO "TBUsers" ("UserName", "UserEmail", "UserPassword", "IsActive", "CreatedDate") VALUES ($1, $2, $3, true, NOW()) RETURNING "User_ID", "UserName", "UserEmail"',
        [username, email, password]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Registration failed' });
      }

      res.json({ user: result.rows[0], message: 'Registration successful' });
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('unique') || err.code === '23505') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // POST logout (replaces SP_UserLogout)
  app.post('/api/logout', async (req, res) => {
    try {
      const { userId, sessionDurationMinutes } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Insert audit log
      await pool.query(
        'INSERT INTO "TBAuditLog" ("User_ID", "TableName", "ActionType", "ActionCategory", "ActionDescription", "ActionDate") VALUES ($1, $2, $3, $4, $5, NOW())',
        [userId, 'TBUsers', 'LOGOUT', 'AUTH', 'User logged out']
      );

      // Update last activity duration if provided
      if (sessionDurationMinutes) {
        await pool.query(`
          UPDATE "TBUserActivity"
          SET "DurationMinutes" = $1
          WHERE "Activity_ID" = (
            SELECT "Activity_ID" FROM "TBUserActivity"
            WHERE "User_ID" = $2 AND "ActivityType" = 'LOGIN' AND "DurationMinutes" IS NULL
            ORDER BY "ActivityDate" DESC LIMIT 1
          )
        `, [sessionDurationMinutes, userId]);
      }

      res.json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: err.message });
    }
  });

//-------------------------------moved to c#-----------------------------------
// app.delete('/api/delete-user', async (req, res) => {
//     try {
//       const { targetID, adminID, confirmDelete } = req.body;
//       ...removed - handled by C# backend
//     }
//   });



  // POST update-status (replaces SP_UpdateUserStatus)
  app.post('/api/update-status', async (req, res) => {
    try {
      const { targetID, adminID, newStatus } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Check admin
      const adminResult = await pool.query(
        'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1 AND "IsActive" = true',
        [adminID]
      );
      if (adminResult.rows.length === 0 || (!adminResult.rows[0].IsAdmin && !adminResult.rows[0].IsSuperAdmin)) {
        return res.status(400).json({ error: 'Not authorized' });
      }

      // Check target user exists
      const targetResult = await pool.query(
        'SELECT "User_ID" FROM "TBUsers" WHERE "User_ID" = $1',
        [targetID]
      );
      if (targetResult.rows.length === 0) {
        return res.status(400).json({ error: 'Target user not found' });
      }

      await pool.query(
        'UPDATE "TBUsers" SET "IsActive" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
        [newStatus, targetID]
      );

      return res.json({ message: `User status updated to ${newStatus ? 'active' : 'inactive'}` });
    } catch (err) {
      console.error('Update user status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST reset-password (replaces SP_ResetUserPassword)
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { targetID, adminID, newPassword } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Check admin
      const adminResult = await pool.query(
        'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1 AND "IsActive" = true',
        [adminID]
      );
      if (adminResult.rows.length === 0 || (!adminResult.rows[0].IsAdmin && !adminResult.rows[0].IsSuperAdmin)) {
        return res.status(400).json({ error: 'Not authorized' });
      }

      const result = await pool.query(
        'UPDATE "TBUsers" SET "UserPassword" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
        [newPassword, targetID]
      );

      if (result.rowCount === 0) {
        return res.status(400).json({ error: 'User not found' });
      }

      return res.json({ message: 'Password reset successfully' });
    } catch (err) {
      console.error('Reset user password error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST update-role (replaces SP_UpdateUserRole)
  app.post('/api/update-role', async (req, res) => {
    try {
      const { targetID, adminID, makeAdmin } = req.body;

      if (!targetID || !adminID || makeAdmin === undefined) {
        return res.status(400).json({ error: 'targetID, adminID, and makeAdmin are required' });
      }

      // Check admin
      const adminResult = await pool.query(
        'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1 AND "IsActive" = true',
        [adminID]
      );
      if (adminResult.rows.length === 0 || (!adminResult.rows[0].IsAdmin && !adminResult.rows[0].IsSuperAdmin)) {
        return res.status(400).json({ error: 'Not authorized' });
      }

      const result = await pool.query(
        'UPDATE "TBUsers" SET "IsAdmin" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
        [makeAdmin, targetID]
      );

      if (result.rowCount === 0) {
        return res.status(400).json({ error: 'User not found' });
      }

      return res.json({ message: `User role updated to ${makeAdmin ? 'admin' : 'regular user'}` });
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

        // Check project limit for new projects
        if (!projectId) {
          const countResult = await pool.query(
            'SELECT COUNT(*) as cnt FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false',
            [userId]
          );
          if (parseInt(countResult.rows[0].cnt) >= 20) {
            return res.status(400).json({ error: 'Maximum projects limit reached' });
          }
        }

        let result;
        if (projectId) {
          // Update existing project
          result = await pool.query(`
            UPDATE "TBProjects"
            SET "ProjectName" = $1, "ProjectDescription" = $2, "ComponentCount" = $3,
                "ProjectSizeKB" = $4, "ProjectData" = $5, "ThumbnailURL" = $6, "ModifiedDate" = NOW()
            WHERE "Project_ID" = $7 AND "User_ID" = $8 AND "IsDeleted" = false
            RETURNING "Project_ID"
          `, [projectName, projectDescription || null, componentCount || 0,
              projectSizeKB || 0, projectData || null, thumbnailUrl || null,
              projectId, userId]);
        } else {
          // Insert new project
          result = await pool.query(`
            INSERT INTO "TBProjects" ("User_ID", "ProjectName", "ProjectDescription", "ComponentCount", "ProjectSizeKB", "ProjectData", "ThumbnailURL", "CreatedDate", "ModifiedDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING "Project_ID"
          `, [userId, projectName, projectDescription || null, componentCount || 0,
              projectSizeKB || 0, projectData || null, thumbnailUrl || null]);
        }

        if (result.rows.length === 0) {
          return res.status(400).json({ error: 'Failed to save project' });
        }

        const resultProjectId = result.rows[0].Project_ID;
        console.log('✅ Project saved successfully, ID:', resultProjectId);
        res.json({ projectId: resultProjectId, message: 'Project saved successfully' });
      } catch (err) {
        console.error('❌ Save project error:', err);
        res.status(500).json({ error: err.message });
      }
    });


      app.get('/api/projects/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(`
        SELECT "Project_ID", "ProjectName", "ProjectDescription",
               "ComponentCount", "ProjectSizeKB", "ThumbnailURL", "IsPublished",
               "CreatedDate", "ModifiedDate"
        FROM "TBProjects"
        WHERE "User_ID" = $1 AND "IsDeleted" = false
        ORDER BY "ModifiedDate" DESC
      `, [userId]);

      res.json(result.rows);
    } catch (err) {
      console.error('Get projects error:', err);
      res.status(500).json({ error: err.message });
    }
  });

   app.get('/api/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      console.log('Loading project:', projectId, 'for user:', userId);

      const result = await pool.query(
        'SELECT * FROM "TBProjects" WHERE "Project_ID" = $1 AND "User_ID" = $2 AND "IsDeleted" = false',
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = result.rows[0];
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

      const result = await pool.query(
        'UPDATE "TBProjects" SET "IsDeleted" = true WHERE "Project_ID" = $1 AND "User_ID" = $2',
        [projectId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
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

      const result = await pool.query(`
        SELECT
          COALESCE((SELECT COUNT(*) FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false), 0) AS "TotalProjects",
          COALESCE((SELECT COUNT(*) FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false AND "IsPublished" = true), 0) AS "PublishedProjects",
          COALESCE((SELECT SUM("ComponentCount") FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false), 0) AS "TotalComponents",
          COALESCE((SELECT SUM("ExportCount") FROM "TBProjects" WHERE "User_ID" = $1), 0) AS "TotalExports",
          COALESCE((SELECT COUNT(*) FROM "TBUserActivity" WHERE "User_ID" = $1), 0) AS "TotalActivities",
          COALESCE((SELECT COUNT(*) FROM "TBAuditLog" WHERE "User_ID" = $1), 0) AS "TotalAuditEntries"
      `, [id]);

      console.log('Stats result:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Get user stats error:', err);
      res.status(500).json({ error: err.message });
    }
  });


    // Save as Template
    app.post('/api/templates/save', async (req, res) => {
    try {
      const { templateName, category, projectData, componentCount, createdBy, thumbnailData } = req.body;

      const result = await pool.query(`
        INSERT INTO "TBTemplates" ("TemplateName", "Category", "ThumbnailURL", "TemplateData", "ComponentCount", "CreatedBy", "IsActive")
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING "Template_ID"
      `, [templateName, category, thumbnailData || null, projectData, componentCount, createdBy]);

      const templateId = result.rows[0].Template_ID;
      res.json({ templateId, message: 'Template saved successfully' });
    } catch (err) {
      console.error('Save template error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Get all templates (for Inspire Me page)
  app.get('/api/templates', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT t."Template_ID", t."TemplateName", t."Category", t."ThumbnailURL",
               t."ComponentCount", t."CreatedDate", u."UserName" AS "CreatedByName"
        FROM "TBTemplates" t
        INNER JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
        WHERE t."IsActive" = true
        ORDER BY t."CreatedDate" DESC
      `);

      res.json(result.rows);
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
      const userResult = await pool.query(
        'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];
      if (!user.IsAdmin && !user.IsSuperAdmin) {
        return res.status(403).json({ error: 'Only admins can view all templates' });
      }

      const result = await pool.query(`
        SELECT t."Template_ID", t."TemplateName", t."Category", t."ThumbnailURL",
               t."ComponentCount", t."CreatedDate", t."IsActive", u."UserName" AS "CreatedByName"
        FROM "TBTemplates" t
        INNER JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
        ORDER BY t."CreatedDate" DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error('Get all templates error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get single template data
  app.get('/api/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT "Template_ID", "TemplateName", "Category", "TemplateData", "ThumbnailURL", "ComponentCount" FROM "TBTemplates" WHERE "Template_ID" = $1 AND "IsActive" = true',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Get template error:', err);
      res.status(500).json({ error: err.message });
    }
  });


      // Delete template (admin/superadmin only) - sets IsActive = false
    app.delete('/api/templates/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.query;

        console.log('Update status template request:', id, 'by user:', userId);

        if (!userId) {
          return res.status(400).json({ error: 'userId required' });
        }

        // Check if user is admin or superadmin
        const userResult = await pool.query(
          'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        if (!user.IsAdmin && !user.IsSuperAdmin) {
          return res.status(403).json({ error: 'Only admins can update templates' });
        }

        await pool.query(
          'UPDATE "TBTemplates" SET "IsActive" = false WHERE "Template_ID" = $1',
          [id]
        );

        console.log('✅ Template deleted:', id);
        res.json({ message: 'Template deleted successfully' });

      } catch (err) {
        console.error('❌ Delete template error:', err);
        res.status(500).json({ error: err.message });
      }
    });

//---------------------------------MOVED TO C#-------------------------------------
  //    // Update template visibility
  // app.put('/api/templates/:id/visibility', async (req, res) => {
  //   ...removed - handled by C# backend
  // });


      // Get all notifications (for admin panel) - replaces SP_GetAllNotifications
    app.get('/api/notifications/all', async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // Check superadmin
      const adminResult = await pool.query(
        'SELECT "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
        [userId]
      );
      if (adminResult.rows.length === 0 || !adminResult.rows[0].IsSuperAdmin) {
        return res.status(403).json({ error: 'Only superadmins can view notifications' });
      }

      const result = await pool.query(`
        SELECT n.*, u."UserName" as "CreatedByName"
        FROM "TBNotifications" n
        LEFT JOIN "TBUsers" u ON n."CreatedBy" = u."User_ID"
        ORDER BY n."CreatedDate" DESC
      `);

      // Add OpenedCount from delivery log for each notification
      const notifications = result.rows;
      if (notifications.length > 0) {
        const ids = notifications.map(n => n.Notification_ID);
        const statsResult = await pool.query(`
          SELECT "Notification_ID",
            SUM(CASE WHEN "Status" = 'viewed' THEN 1 ELSE 0 END) as "OpenedCount",
            SUM(CASE WHEN "Status" = 'failed' THEN 1 ELSE 0 END) as "FailedCount"
          FROM "TBNotificationDeliveryLog"
          WHERE "Notification_ID" = ANY($1::int[])
          GROUP BY "Notification_ID"
        `, [ids]);
        const statsMap = {};
        statsResult.rows.forEach(s => statsMap[s.Notification_ID] = s);

        notifications.forEach(n => {
          const stats = statsMap[n.Notification_ID];
          n.OpenedCount = stats ? stats.OpenedCount : 0;
          n.FailedCount = stats ? stats.FailedCount : 0;
        });
      }

      res.json(notifications);
    } catch (err) {
      console.error('Get all notifications error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Send newsletter endpoint - replaces SP_SendNewsletter
  app.post('/api/notifications/send-newsletter', async (req, res) => {
    try {
      const { subject, message, recipientType, recipientIds, userId } = req.body;

      if (!subject || !message || !recipientType || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check superadmin
      const adminResult = await pool.query(
        'SELECT "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
        [userId]
      );
      if (adminResult.rows.length === 0 || !adminResult.rows[0].IsSuperAdmin) {
        return res.status(403).json({ error: 'Not authorized - only superadmins can send newsletters' });
      }

      // Get recipients
      let recipients;
      if (recipientType === 'all') {
        const usersResult = await pool.query('SELECT "User_ID", "UserName", "UserEmail" FROM "TBUsers" WHERE "IsActive" = true');
        recipients = usersResult.rows;
      } else if (recipientType === 'selected' && recipientIds && recipientIds.length > 0) {
        const usersResult = await pool.query(
          'SELECT "User_ID", "UserName", "UserEmail" FROM "TBUsers" WHERE "User_ID" = ANY($1::int[])',
          [recipientIds]
        );
        recipients = usersResult.rows;
      } else {
        return res.status(400).json({ error: 'No recipients specified' });
      }

      const recipientIdsString = (recipientType === 'selected' && recipientIds) ? JSON.stringify(recipientIds) : null;

      // Insert notification
      const notifResult = await pool.query(`
        INSERT INTO "TBNotifications" ("Subject", "Message", "NotificationType", "RecipientType", "RecipientIDs", "Status", "SentCount", "CreatedBy", "CreatedDate", "SentDate")
        VALUES ($1, $2, 'newsletter', $3, $4, 'sent', $5, $6, NOW(), NOW())
        RETURNING "Notification_ID"
      `, [subject, message, recipientType, recipientIdsString, recipients.length, userId]);

      const notificationId = notifResult.rows[0].Notification_ID;

      // Insert delivery log for each recipient
      for (const r of recipients) {
        await pool.query(`
          INSERT INTO "TBNotificationDeliveryLog" ("Notification_ID", "User_ID", "UserName", "UserEmail", "Status", "DeliveredDate")
          VALUES ($1, $2, $3, $4, 'delivered', NOW())
        `, [notificationId, r.User_ID, r.UserName, r.UserEmail]);
      }

      console.log(`✅ Newsletter sent: ID=${notificationId}, Recipients=${recipients.length}`);

      res.json({
        success: true,
        notificationId: notificationId,
        sentCount: recipients.length,
        message: `Newsletter sent to ${recipients.length} recipients`
      });

    } catch (err) {
      console.error('Send newsletter error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get user notifications - replaces SP_GetUserNotifications
  app.get('/api/notifications/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(`
        SELECT n.*, dl."Status" as "DeliveryStatus", dl."DeliveredDate", dl."ViewedDate"
        FROM "TBNotificationDeliveryLog" dl
        JOIN "TBNotifications" n ON dl."Notification_ID" = n."Notification_ID"
        WHERE dl."User_ID" = $1
        ORDER BY dl."DeliveredDate" DESC
      `, [userId]);

      res.json(result.rows);
    } catch (err) {
      console.error('Get user notifications error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mark notifications as viewed
  app.put('/api/notifications/mark-viewed', async (req, res) => {
    try {
      const { userId, notificationIds } = req.body;

      if (!userId || !notificationIds || !notificationIds.length) {
        return res.status(400).json({ error: 'userId and notificationIds required' });
      }

      await pool.query(`
        UPDATE "TBNotificationDeliveryLog"
        SET "Status" = 'viewed', "ViewedDate" = NOW()
        WHERE "User_ID" = $1
          AND "Notification_ID" = ANY($2::int[])
          AND "Status" = 'delivered'
      `, [userId, notificationIds]);

      res.json({ success: true });
    } catch (err) {
      console.error('Mark viewed error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Delete notification - replaces SP_DeleteNotification
  app.delete('/api/notifications/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // Check admin/superadmin
      const adminResult = await pool.query(
        'SELECT "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
        [userId]
      );
      if (adminResult.rows.length === 0 || (!adminResult.rows[0].IsAdmin && !adminResult.rows[0].IsSuperAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const result = await pool.query(
        'DELETE FROM "TBNotifications" WHERE "Notification_ID" = $1',
        [notificationId]
      );

      if (result.rowCount > 0) {
        res.json({ success: true, message: 'Notification deleted' });
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

      const result = await pool.query(`
        SELECT s.*, u."UserName" as "CreatedByName",
               (SELECT "TemplateName" FROM "TBTemplates" WHERE "Template_ID" = s."Template_ID") as "TemplateName"
        FROM "TBNotificationSchedules" s
        LEFT JOIN "TBUsers" u ON s."CreatedBy" = u."User_ID"
        ORDER BY s."CreatedDate" DESC
      `);
      res.json(result.rows);
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

      const result = await pool.query(`
        INSERT INTO "TBNotificationSchedules"
        ("ScheduleName", "NotificationType", "Frequency", "ScheduleTime", "ScheduleDay",
         "Template_ID", "RecipientType", "RecipientIDs", "MessageOverride", "CreatedBy", "NextRunDate")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING "Schedule_ID"
      `, [scheduleName, notificationType, frequency, scheduleTime, scheduleDay || null,
          templateId || null, recipientType, JSON.stringify(recipientIds || []),
          messageOverride || null, userId, nextRun]);

      res.json({ success: true, scheduleId: result.rows[0].Schedule_ID, nextRun });
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

      await pool.query(`
        UPDATE "TBNotificationSchedules"
        SET "ScheduleName" = $1, "NotificationType" = $2, "Frequency" = $3,
            "ScheduleTime" = $4, "ScheduleDay" = $5, "Template_ID" = $6,
            "RecipientType" = $7, "RecipientIDs" = $8, "MessageOverride" = $9,
            "NextRunDate" = $10
        WHERE "Schedule_ID" = $11
      `, [scheduleName, notificationType, frequency, scheduleTime, scheduleDay || null,
          templateId || null, recipientType, JSON.stringify(recipientIds || []),
          messageOverride || null, nextRun, id]);

      res.json({ success: true, nextRun });
    } catch (err) {
      console.error('Update schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete schedule
  app.delete('/api/schedules/:id', async (req, res) => {
    try {
      await pool.query(
        'DELETE FROM "TBNotificationSchedules" WHERE "Schedule_ID" = $1',
        [req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      console.error('Delete schedule error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle schedule active/inactive
  app.put('/api/schedules/:id/toggle', async (req, res) => {
    try {
      const { isActive } = req.body;
      await pool.query(
        'UPDATE "TBNotificationSchedules" SET "IsActive" = $1 WHERE "Schedule_ID" = $2',
        [isActive, req.params.id]
      );

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
      const result = await pool.query(`
        SELECT t.*, u."UserName" as "CreatedByName"
        FROM "TBNotificationTemplates" t
        LEFT JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
        ORDER BY t."CreatedDate" DESC
      `);
      res.json(result.rows);
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

      const result = await pool.query(`
        INSERT INTO "TBNotificationTemplates" ("TemplateName", "TemplateType", "Subject", "Message", "Variables", "CreatedBy")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "Template_ID"
      `, [templateName, templateType, subject, message, JSON.stringify(variables || []), userId]);

      res.json({ success: true, templateId: result.rows[0].Template_ID });
    } catch (err) {
      console.error('Create notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update notification template
  app.put('/api/notification-templates/:id', async (req, res) => {
    try {
      const { templateName, templateType, subject, message, variables } = req.body;

      await pool.query(`
        UPDATE "TBNotificationTemplates"
        SET "TemplateName" = $1, "TemplateType" = $2, "Subject" = $3,
            "Message" = $4, "Variables" = $5, "ModifiedDate" = NOW()
        WHERE "Template_ID" = $6
      `, [templateName, templateType, subject, message, JSON.stringify(variables || []), req.params.id]);

      res.json({ success: true });
    } catch (err) {
      console.error('Update notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete notification template
  app.delete('/api/notification-templates/:id', async (req, res) => {
    try {
      await pool.query(
        'DELETE FROM "TBNotificationTemplates" WHERE "Template_ID" = $1',
        [req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      console.error('Delete notification template error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle template active/inactive
  app.put('/api/notification-templates/:id/toggle', async (req, res) => {
    try {
      const { isActive } = req.body;
      await pool.query(
        'UPDATE "TBNotificationTemplates" SET "IsActive" = $1 WHERE "Template_ID" = $2',
        [isActive, req.params.id]
      );

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
      let paramIdx = 1;

      if (status) {
        whereClause += ` AND dl."Status" = $${paramIdx++}`;
        params.push(status);
      }
      if (startDate) {
        whereClause += ` AND dl."DeliveredDate" >= $${paramIdx++}`;
        params.push(new Date(startDate));
      }
      if (endDate) {
        whereClause += ` AND dl."DeliveredDate" <= $${paramIdx++}`;
        params.push(new Date(endDate));
      }
      if (search) {
        whereClause += ` AND (dl."UserName" ILIKE $${paramIdx} OR dl."UserEmail" ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      params.push(parseInt(limit));
      const limitIdx = paramIdx++;
      params.push(parseInt(offset));
      const offsetIdx = paramIdx;

      const result = await pool.query(`
        SELECT dl.*, n."Subject"
        FROM "TBNotificationDeliveryLog" dl
        LEFT JOIN "TBNotifications" n ON dl."Notification_ID" = n."Notification_ID"
        ${whereClause}
        ORDER BY dl."DeliveredDate" DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, params);

      // Get total count
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await pool.query(`
        SELECT COUNT(*) as "Total" FROM "TBNotificationDeliveryLog" dl ${whereClause}
      `, countParams);

      res.json({
        logs: result.rows,
        total: parseInt(countResult.rows[0].Total),
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
      const result = await pool.query(`
        SELECT
          COUNT(*) as "Total",
          SUM(CASE WHEN "Status" = 'delivered' THEN 1 ELSE 0 END) as "Delivered",
          SUM(CASE WHEN "Status" = 'viewed' THEN 1 ELSE 0 END) as "Viewed",
          SUM(CASE WHEN "Status" = 'failed' THEN 1 ELSE 0 END) as "Failed"
        FROM "TBNotificationDeliveryLog"
        WHERE "DeliveredDate" >= NOW() - interval '30 days'
      `);

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Get notification log stats error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get logs for specific notification
  app.get('/api/notification-logs/:notificationId', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM "TBNotificationDeliveryLog" WHERE "Notification_ID" = $1 ORDER BY "DeliveredDate" DESC',
        [req.params.notificationId]
      );

      res.json(result.rows);
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
      const result = await pool.query('SELECT * FROM "TBNotificationSettings" ORDER BY "NotificationType"');
      res.json(result.rows);
    } catch (err) {
      console.error('Get notification settings error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update notification settings
  app.put('/api/notification-settings', async (req, res) => {
    try {
      const { settings, userId } = req.body;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ error: 'Settings array required' });
      }

      for (const setting of settings) {
        const isEnabled = setting.isEnabled ? true : false;
        const result = await pool.query(`
          UPDATE "TBNotificationSettings"
          SET "IsEnabled" = $1, "ModifiedBy" = $2, "ModifiedDate" = NOW()
          WHERE "NotificationType" = $3
        `, [isEnabled, userId || null, setting.notificationType]);

        // If no row was updated, insert it
        if (result.rowCount === 0) {
          await pool.query(`
            INSERT INTO "TBNotificationSettings" ("NotificationType", "IsEnabled", "ModifiedBy", "ModifiedDate")
            VALUES ($1, $2, $3, NOW())
          `, [setting.notificationType, isEnabled, userId || null]);
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Update notification settings error:', err);
      res.status(500).json({ error: err.message });
    }
  });

// ---------- Publish site ----------
  app.post('/api/publish-site', async (req, res) => {
    try {
      const { projectId, html, domain } = req.body;
      if (!projectId || !html) return res.status(400).json({ error: 'Missing data' });

      // Check if domain already taken by another project
      if (domain) {
        const check = await pool.query(
          'SELECT "Project_ID" FROM "TBProjects" WHERE "CustomDomain" = $1 AND "Project_ID" != $2',
          [domain, projectId]
        );
        if (check.rows.length > 0) {
          return res.status(400).json({ error: 'Domain already connected to another project' });
        }
      }

      await pool.query(
        'UPDATE "TBProjects" SET "PublishedHtml" = $1, "CustomDomain" = $2, "IsPublished" = true WHERE "Project_ID" = $3',
        [html, domain || null, projectId]
      );

      res.json({
        success: true,
        domain,
        message: domain
          ? `Site published. Point your domain DNS to this server's IP with an A record: @ → your-server-ip`
          : 'Site published'
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- Serve published sites by domain ----------
  app.get('/site-by-domain/:domain', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT "PublishedHtml" FROM "TBProjects" WHERE "CustomDomain" = $1 AND "IsPublished" = true',
        [req.params.domain]
      );

      if (!result.rows.length || !result.rows[0].PublishedHtml) {
        return res.status(404).send('Site not found');
      }
      res.setHeader('Content-Type', 'text/html');
      res.send(result.rows[0].PublishedHtml);
    } catch (e) {
      res.status(500).send('Server error');
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
  s = s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");

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

// ---------- Pexels image/video search ----------
async function fetchPexelsImages(query, count = 10) {
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, {
      headers: { 'Authorization': process.env.PEXELS_API_KEY }
    });
    const data = await r.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos.map(p => ({
        src: `http://localhost:3001/api/image-proxy?url=${encodeURIComponent(p.src.landscape)}`,
        alt: p.alt || query,
        width: p.width,
        height: p.height
      }));
    }
    return [];
  } catch (e) {
    console.log('Pexels image search error:', e.message);
    return [];
  }
}

async function fetchPexelsVideos(query, count = 5) {
  try {
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, {
      headers: { 'Authorization': process.env.PEXELS_API_KEY }
    });
    const data = await r.json();
    if (data.videos && data.videos.length > 0) {
      return data.videos.map(v => {
        const hd = v.video_files.find(f => f.quality === 'hd') || v.video_files[0];
        return { videoUrl: hd?.link || '', text: query };
      });
    }
    return [];
  } catch (e) {
    console.log('Pexels video search error:', e.message);
    return [];
  }
}

function replacePlaceholdersInJson(obj, images, videos) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) replacePlaceholdersInJson(obj[i], images, videos);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Replace image placeholders
      const imgMatch = obj[key].match(/IMAGE_PLACEHOLDER_(\d+)/);
      if (imgMatch) {
        const idx = parseInt(imgMatch[1]) - 1;
        if (idx >= 0 && idx < images.length) {
          obj[key] = images[idx].src;
        }
      }
      // Replace video placeholders
      const vidMatch = obj[key].match(/VIDEO_PLACEHOLDER_(\d+)/);
      if (vidMatch) {
        const idx = parseInt(vidMatch[1]) - 1;
        if (idx >= 0 && idx < videos.length) {
          obj['videoUrl'] = videos[idx].videoUrl;
          obj['videoId'] = '';
          if (!obj['text'] || obj['text'].startsWith('VIDEO_PLACEHOLDER')) {
            obj['text'] = '';
          }
        }
      }
    } else if (typeof obj[key] === 'object') {
      replacePlaceholdersInJson(obj[key], images, videos);
    }
  }
}

// ---------- AI endpoint (ZhipuAI GLM) ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.GLM_API_KEY) {
      return res.status(500).json({ error: 'Missing GLM_API_KEY in .env' });
    }

    const systemPrompt = `You are a web designer. Output ONLY valid JSON — no markdown, no code blocks, no commentary. Schema: {"sections":[{"type":"container","props":{},"children":[]}]}

ELEMENT TYPES: Container, Text, Button, Video, Image, Link.

Container props: width,height,padding[top,right,bottom,left],margin[t,r,b,l],background{"r","g","b","a"},color{"r","g","b","a"},radius,shadow,flexDirection,alignItems,justifyContent,gap
Text props: text,fontSize,fontWeight,textAlign,color{"r","g","b","a"},margin[t,r,b,l],shadow
Button props: text,buttonStyle,background{"r","g","b","a"},color{"r","g","b","a"},margin[t,r,b,l],radius
Video props: videoId,videoUrl,text
Image props: src,radius,width,height
Link props: href,text,fontSize

IMAGES: Use IMAGE_PLACEHOLDER_1..8 as src. They auto-replace with real photos.
VIDEO: Use VIDEO_PLACEHOLDER_1 as videoUrl in hero.

Create exactly 5 sections:
1. HERO — dark bg, 500px, VIDEO_PLACEHOLDER_1, heading + button
2. ABOUT — light bg, row: IMAGE_PLACEHOLDER_1 + text
3. SERVICES — 3 cards row, each with IMAGE + title + short desc
4. GALLERY — row of 3 images
5. FOOTER — dark, short text

RULES:
- Alternate dark/light backgrounds
- Headings: 36-48px, bold. Body: 16-18px
- Short realistic text (3-8 word headings, 8-15 word descriptions)
- Every prop MUST be present
- Output ONLY the JSON object starting with { and ending with }`;

    const userMessage = `Create a website for "${prompt}". Use IMAGE_PLACEHOLDER_1..8 for images, VIDEO_PLACEHOLDER_1 for hero video. 5 sections. Output ONLY raw JSON, no markdown.`;

    const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 16000,
        temperature: 0.7,
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'GLM API error',
        status: r.status,
        body: data
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    console.log('AI Response length:', raw?.length);
    console.log('AI Response (first 500 chars):', raw?.substring(0, 500));

    if (!raw) {
      return res.status(500).json({ error: 'No content in GLM response', body: data });
    }

    // Parse with repair fallback
    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      console.log('Parse error:', e1.message);
      console.log('Attempting repair...');
      try {
        const repairR = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GLM_API_KEY}`
          },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [{ role: 'user', content: `Fix this broken JSON and return ONLY valid JSON matching this schema: {"sections":[{type,props,children}]}\n\n${raw}` }],
          })
        });
        const repairData = await repairR.json();
        const fixedRaw = repairData?.choices?.[0]?.message?.content;
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

    // Fetch real images/videos from Pexels based on user prompt
    if (process.env.PEXELS_API_KEY) {
      const searchQuery = String(prompt).trim();
      const [images, videos] = await Promise.all([
        fetchPexelsImages(searchQuery, 10),
        fetchPexelsVideos(searchQuery, 3)
      ]);
      console.log(`Pexels: found ${images.length} images, ${videos.length} videos for "${searchQuery}"`);
      if (images.length > 0 || videos.length > 0) {
        replacePlaceholdersInJson(normalized, images, videos);
      }
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

// ---------- Image proxy (avoids tainted canvas for external images) ----------
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('Missing url parameter');

    const allowedHosts = ['images.pexels.com', 'images.unsplash.com', 'player.vimeo.com', 'pexels.com'];
    const urlObj = new URL(imageUrl);
    if (!allowedHosts.some(h => urlObj.hostname.endsWith(h))) {
      return res.status(403).send('Domain not allowed');
    }

    const r = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!r.ok) return res.status(r.status).send('Upstream error');

    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
});

export default app;
