import knex from 'knex';
import path from 'path';

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(process.cwd(), 'local_cache.db')
  },
  useNullAsDefault: true
});

export async function checkCacheConnection() {
  await db.raw('SELECT 1');
  
  const hasTable = await db.schema.hasTable('withdraw_requests');
  if (!hasTable) {
    await db.schema.createTable('withdraw_requests', (table) => {
      table.string('transaction_no').primary();
      table.string('status').notNullable();
      table.string('remark').nullable();
      table.string('ref_no').nullable();
      table.timestamps(true, true);
    });
  }
}
