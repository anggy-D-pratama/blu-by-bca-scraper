import { db } from "./connection.js";

export async function upsertCache(data) {
  return db("withdraw_requests")
    .insert({
      ...data,
      updated_at: db.fn.now()
    })
    .onConflict("transaction_no")
    .merge();
}