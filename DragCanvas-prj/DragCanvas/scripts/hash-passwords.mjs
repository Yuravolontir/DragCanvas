/**
 * One-off migration: bcrypt-hash all plaintext passwords in TBUsers (fix-auth-flow change).
 * Idempotent — rows already starting with a bcrypt prefix ($2a$/$2b$/$2y$) are skipped.
 *
 * Run from DragCanvas-prj/DragCanvas:  node scripts/hash-passwords.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const dbUrl = envText.match(/^DATABASE_?URL=(.+)$/m)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found in .env');

const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

const { rows } = await pool.query(
  `SELECT "User_ID", "UserPassword" FROM "TBUsers"
   WHERE "UserPassword" IS NOT NULL AND "UserPassword" !~ '^\\$2[aby]\\$'`
);

console.log(`Found ${rows.length} plaintext password(s) to hash`);

for (const row of rows) {
  const hash = await bcrypt.hash(row.UserPassword, 10);
  await pool.query(
    'UPDATE "TBUsers" SET "UserPassword" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
    [hash, row.User_ID]
  );
  console.log(`  hashed User_ID ${row.User_ID}`);
}

const { rows: remaining } = await pool.query(
  `SELECT COUNT(*)::int AS cnt FROM "TBUsers"
   WHERE "UserPassword" IS NOT NULL AND "UserPassword" !~ '^\\$2[aby]\\$'`
);
console.log(`Done. Remaining plaintext rows: ${remaining[0].cnt}`);

await pool.end();
