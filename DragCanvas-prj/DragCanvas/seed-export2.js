// seed-export2.js
// Exports data from SQL Server via JSON (sqlcmd FOR JSON) and converts to PostgreSQL seed.sql
// Usage: node seed-export2.js

import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';

const SQLCMD = '/mnt/c/Program Files/Microsoft SQL Server/Client SDK/ODBC/170/Tools/Binn/sqlcmd.exe';
const SERVER = 'YURA\\SQLEXPRESS';
const DB = 'DragCanvas';

const tables = [
  { name: 'TBUsers', serial: 'User_ID' },
  { name: 'TBProjects', serial: 'Project_ID' },
  { name: 'TBTemplates', serial: 'Template_ID' },
  { name: 'TBNotifications', serial: 'Notification_ID' },
  { name: 'TBNotificationDeliveryLog', serial: 'Log_ID' },
  { name: 'TBNotificationTemplates', serial: 'Template_ID' },
  { name: 'TBNotificationSchedules', serial: 'Schedule_ID' },
  { name: 'TBNotificationSettings', serial: 'Setting_ID' },
  { name: 'TBUserActivity', serial: 'Activity_ID' },
  { name: 'TBAuditLog', serial: 'Audit_ID' },
];

function escapeVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') {
    const escaped = val.replace(/'/g, "''");
    return `'${escaped}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function fetchTableJSON(table) {
  const sqlQuery = `SET NOCOUNT ON; SELECT (SELECT * FROM ${table.name} FOR JSON PATH)`;
  try {
    const raw = execSync_safe(SQLCMD, ['-S', SERVER, '-d', DB, '-E', '-y0', '-Q', sqlQuery]);
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']') + 1;
    if (jsonStart === -1 || jsonEnd === 0) return [];
    const jsonStr = raw.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`  Error fetching ${table.name}: ${err.message}`);
    return [];
  }
}

function execSync_safe(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf-8', timeout: 60000, maxBuffer: 50 * 1024 * 1024 }).trim();
}

let output = `-- DragCanvas Data Export for PostgreSQL (Supabase)
-- Generated: ${new Date().toISOString()}
--
-- RUN ORDER:
--   1. migrate.sql  (create tables)
--   2. seed.sql      (this file - insert data)
--

`;

for (const table of tables) {
  console.log(`Exporting ${table.name}...`);
  const rows = fetchTableJSON(table);

  output += `-- ============================================\n`;
  output += `-- ${table.name} (${rows.length} rows)\n`;
  output += `-- ============================================\n`;

  if (rows.length === 0) {
    output += `-- (empty)\n\n`;
    continue;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  for (const row of rows) {
    const values = columns.map(col => escapeVal(row[col]));
    output += `INSERT INTO "${table.name}" (${colList}) VALUES (${values.join(', ')});\n`;
  }
  output += '\n';
}

// Reset sequences
output += `-- ============================================\n`;
output += `-- Reset sequences\n`;
output += `-- ============================================\n`;
for (const table of tables) {
  output += `SELECT setval(pg_get_serial_sequence('"${table.name}"', '${table.serial}'), COALESCE((SELECT MAX("${table.serial}") FROM "${table.name}"), 0) + 1, false);\n`;
}

const outPath = '/mnt/c/Users/yurav/OneDrive/Attachments/Desktop/DragCanvas/DragCanvas-prj/DragCanvas/seed.sql';
writeFileSync(outPath, output);
console.log(`\nDone! Written ${output.split('\n').length} lines to ${outPath}`);
