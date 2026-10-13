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
      table.decimal('amount').nullable();
      table.string('bank_account').notNullable();
      table.string('status').notNullable();
      table.string('remark').nullable();
      table.string('ref_no').nullable();
      table.timestamps(true, true);
    });
  }

  const hasStatements = await db.schema.hasTable('statements');
  if (hasStatements) {
    const hasSyncedCol = await db.schema.hasColumn('statements', 'is_synced');
    if (!hasSyncedCol) {
      await db.schema.dropTable('statements');
    }
  }

  if (!(await db.schema.hasTable('statements'))) {
    await db.schema.createTable('statements', (table) => {
      table.increments('id').primary();
      table.string('transaction_date');
      table.string('value_date');
      table.text('description');
      table.integer('amount').notNullable();
      table.integer('balance').notNullable();
      table.integer('begin_balance').notNullable();
      table.boolean('is_balance_out').defaultTo(false);
      table.string('source').defaultTo('Other');
      table.string('method_type').defaultTo('BLU');
      table.string('utr').nullable().index();
      table.string('transaction_code').nullable();
      table.integer('bank_account_id').nullable();
      table.boolean('is_synced').defaultTo(false).notNullable();
      table.timestamps(true, true);
    });
  }
}
