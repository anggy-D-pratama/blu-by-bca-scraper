import test from 'node:test';
import assert from 'node:assert/strict';
import { db, checkCacheConnection } from '../db/connection.js';
import { upsertCache, saveStatements, findStatementMatch } from '../db/cacheRepository.js';

test('cache connection and repository upsert works', async () => {
  await checkCacheConnection();

  await upsertCache({
    transaction_no: 'TRX-TEST-001',
    status: 'queue',
    remark: 'test remark'
  });

  const row = await db('withdraw_requests').where({ transaction_no: 'TRX-TEST-001' }).first();
  assert.equal(row.status, 'queue');

  await upsertCache({
    transaction_no: 'TRX-TEST-001',
    status: 'process'
  });

  const updatedRow = await db('withdraw_requests').where({ transaction_no: 'TRX-TEST-001' }).first();
  assert.equal(updatedRow.status, 'process');

  await db('withdraw_requests').where({ transaction_no: 'TRX-TEST-001' }).del();

  // Test save & find statement
  await saveStatements([
    {
      ref_no: 'REF-12345',
      amount: 50000,
      remark: 'WD-001-TEST',
      bank_account: '1234567890',
      status: 'BERHASIL',
      transaction_date: '2025-05-01'
    }
  ]);

  const matched = await findStatementMatch({ remark: 'WD-001-TEST', amount: 50000 });
  assert.ok(matched);
  assert.equal(matched.ref_no, 'REF-12345');

  // Cleanup
  await db('statements').where({ ref_no: 'REF-12345' }).del();
  await db.destroy();
});