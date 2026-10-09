import { db } from "./connection.js";

export async function getCache(transaction_no) {
  return db("withdraw_requests").where({ transaction_no }).first();
}

export async function upsertCache(data) {
  const payload = {
    transaction_no: data.transaction_no,
    status: data.status,
    amount: data.amount,
    remark: data.remark || null,
    ref_no: data.ref_no || null,
    updated_at: db.fn.now()
  };

  return db("withdraw_requests")
    .insert(payload)
    .onConflict("transaction_no")
    .merge();
}

export async function saveStatements(statementList) {
  if (!statementList || statementList.length === 0) return;
  
  for (const stmt of statementList) {
    const exists = await db('statements')
      .where({
        amount: stmt.amount,
        remark: stmt.remark || null,
        transaction_date: stmt.transaction_date || null
      })
      .first();
      
    if (!exists) {
      await db('statements').insert({
        ...stmt,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    }
  }
}

export async function findStatementMatch({ remark, amount, ref_no, bank_account }) {
  let query = db('statements');
  
  if (ref_no) {
    query = query.where('ref_no', ref_no);
  } else {
    if (amount) query = query.where('amount', amount);
    if (remark) query = query.where('remark', 'like', `%${remark}%`);
    if (bank_account) query = query.where('bank_account', bank_account);
  }
  
  return query.orderBy('id', 'desc').first();
}