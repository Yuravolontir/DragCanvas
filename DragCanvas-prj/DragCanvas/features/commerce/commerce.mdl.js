import db, { withTransaction } from '../../utils/db.sql.services.js';
export default class CommerceMdl {
  static listProducts(projectId, activeOnly = true) { return db.executeQuery(`SELECT "Product_ID","Name","Description","PriceMinor","Currency","ImageUrl","SortOrder" FROM "TBProducts" WHERE "Project_ID"=$1 ${activeOnly ? 'AND "IsActive"=true' : ''} ORDER BY "SortOrder","Product_ID"`, [projectId]); }
  static async syncProducts(projectId, products) {
    return withTransaction(async query => {
      await query('DELETE FROM "TBProducts" WHERE "Project_ID"=$1', [projectId]);
      for (const [index, product] of products.entries()) await query(`INSERT INTO "TBProducts" ("Project_ID","Name","Description","PriceMinor","Currency","ImageUrl","SortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7)`, [projectId, product.name, product.description || null, product.priceMinor, product.currency, product.imageUrl || null, index]);
    });
  }
  static productsByIds(projectId, ids) { return db.executeQuery('SELECT * FROM "TBProducts" WHERE "Project_ID"=$1 AND "Product_ID"=ANY($2::bigint[]) AND "IsActive"=true', [projectId, ids]); }
  static async createOrder(projectId, items, amount, currency, stripeAccountId) { const rows = await db.executeQuery('INSERT INTO "TBOrders" ("Project_ID","Items","AmountMinor","Currency","StripeAccountId") VALUES ($1,$2,$3,$4,$5) RETURNING "Order_ID"', [projectId, JSON.stringify(items), amount, currency, stripeAccountId]); return rows[0]; }
  static setSession(orderId, sessionId) { return db.executeCommand('UPDATE "TBOrders" SET "StripeSessionId"=$2 WHERE "Order_ID"=$1', [orderId, sessionId]); }
  static async markPaid(sessionId, email, stripeAccountId) { const rows = await db.executeQuery(`UPDATE "TBOrders" SET "Status"='paid',"CustomerEmail"=$2,"PaidDate"=NOW() WHERE "StripeSessionId"=$1 AND "Status"='pending' AND ("StripeAccountId" IS NULL OR "StripeAccountId"=$3) RETURNING *`, [sessionId, email || null, stripeAccountId || null]); return rows[0] ?? null; }
  static async paymentSettings(projectId) { const rows = await db.executeQuery('SELECT "StripeAccountId","StripeLivemode","ConnectedDate" FROM "TBProjectPaymentSettings" WHERE "Project_ID"=$1', [projectId]); return rows[0] ?? null; }
  static saveOAuthState(projectId, stateHash) { return db.executeCommand(`INSERT INTO "TBProjectPaymentSettings" ("Project_ID","OAuthStateHash","OAuthStateExpiresDate") VALUES ($1,$2,NOW()+interval '15 minutes') ON CONFLICT ("Project_ID") DO UPDATE SET "OAuthStateHash"=$2,"OAuthStateExpiresDate"=NOW()+interval '15 minutes',"UpdatedDate"=NOW()`, [projectId, stateHash]); }
  static async consumeOAuthState(stateHash) { const rows = await db.executeQuery(`UPDATE "TBProjectPaymentSettings" SET "OAuthStateHash"=NULL,"OAuthStateExpiresDate"=NULL,"UpdatedDate"=NOW() WHERE "OAuthStateHash"=$1 AND "OAuthStateExpiresDate">NOW() RETURNING "Project_ID"`, [stateHash]); return rows[0]?.Project_ID ?? null; }
  static connectAccount(projectId, accountId, livemode) { return db.executeCommand(`UPDATE "TBProjectPaymentSettings" SET "StripeAccountId"=$2,"StripeLivemode"=$3,"ConnectedDate"=NOW(),"UpdatedDate"=NOW() WHERE "Project_ID"=$1`, [projectId, accountId, !!livemode]); }
  static disconnectAccount(projectId) { return db.executeCommand(`UPDATE "TBProjectPaymentSettings" SET "StripeAccountId"=NULL,"StripeLivemode"=false,"ConnectedDate"=NULL,"UpdatedDate"=NOW() WHERE "Project_ID"=$1`, [projectId]); }
}
