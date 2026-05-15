let pool;

export function setPool(pgPool) {
  pool = pgPool;
}

export async function getAllUsers() {
  const result = await pool.query('SELECT "User_ID", "UserName", "UserEmail", "IsActive", "IsAdmin", "IsSuperAdmin" FROM "TBUsers"');
  return result.rows;
}

export async function getUserById(id) {
  const result = await pool.query(
    'SELECT "User_ID", "UserName", "UserEmail", "IsActive", "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = $1',
    [id]
  );
  return result.rows[0] || null;
}
