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
    let query = db("statements");
    if (stmt.utr) {
      query = query.where({ utr: stmt.utr });
    } else {
      query = query.where({
        transaction_date: stmt.transaction_date,
        description: stmt.description,
        amount: stmt.amount
      });
    }

    const exists = await query.first();
    if (!exists) {
      await db("statements").insert({
        transaction_date: stmt.transaction_date,
        value_date: stmt.value_date,
        description: stmt.description,
        amount: stmt.amount,
        balance: stmt.balance,
        begin_balance: stmt.begin_balance,
        is_balance_out: stmt.is_balance_out,
        source: stmt.source,
        method_type: stmt.method_type,
        utr: stmt.utr,
        transaction_code: stmt.transaction_code,
        bank_account_id: stmt.bank_account_id,
        is_synced: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    }
  }
}

export async function getUnsyncedStatements() {
  return db("statements").where({ is_synced: false });
}

export async function markStatementsAsSynced(ids) {
  if (!ids || ids.length === 0) return;
  return db("statements")
    .whereIn("id", ids)
    .update({
      is_synced: true,
      updated_at: db.fn.now()
    });
}

export async function findStatementMatch({ remark, amount, ref_no }) {
  let query = db("statements");

  if (ref_no) {
    query = query.where("utr", ref_no);
  } else {
    if (amount) query = query.where("amount", amount);
    if (remark) query = query.where("description", "like", `%${remark}%`);
  }

  return query.orderBy("id", "desc").first();
}