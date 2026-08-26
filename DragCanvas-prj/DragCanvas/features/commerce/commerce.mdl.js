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
  static async createOrder(projectId, items, amount, currency) { const rows = await db.executeQuery('INSERT INTO "TBOrders" ("Project_ID","Items","AmountMinor","Currency") VALUES ($1,$2,$3,$4) RETURNING "Order_ID"', [projectId, JSON.stringify(items), amount, currency]); return rows[0]; }
  static setSession(orderId, sessionId) { return db.executeCommand('UPDATE "TBOrders" SET "StripeSessionId"=$2 WHERE "Order_ID"=$1', [orderId, sessionId]); }
  static async markPaid(sessionId, email) { const rows = await db.executeQuery(`UPDATE "TBOrders" SET "Status"='paid',"CustomerEmail"=$2,"PaidDate"=NOW() WHERE "StripeSessionId"=$1 AND "Status"='pending' RETURNING *`, [sessionId, email || null]); return rows[0] ?? null; }
}
