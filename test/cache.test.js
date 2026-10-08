import test from 'node:test';
import assert from 'node:assert/strict';
import { db, checkCacheConnection } from '../db/connection.js';
import { upsertCache } from '../db/cacheRepository.js';

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
  await db.destroy();
});