import { parseBluBalance, parseBluDate } from "../helper/dateFormatter.js";

/**
 * Map raw statement dari BluStatement.getLatestStatements() → output 12 field.
 *
 * @param {Array} rawStatements - hasil scrape (format raw dari UI)
 * @param {number|string} currentBalance - saldo terkini (saldo SETELAH transaksi terbaru)
 * @param {number} bankAccountId - dari config / API
 * @returns {Array}
 */
export function mapBLUStatements(rawStatements, currentBalance, bankAccountId) {
    // running balance mundur: results[0] = transaksi terbaru
    let runningBalance = parseBluBalance(currentBalance);

    return rawStatements.map((raw) => {
        // 7. is_balance_out dari status
        const isBalanceOut = raw.status !== "Transaksi Masuk";

        // 1. & 2. date
        const txDate = parseBluDate(raw.transaction_date);
        const valueDate = txDate;

        // 4. amount (integer)
        const amount = parseBluBalance(raw.amount);

        // 3. description: note/remark + " | " + amount + " | " + transaction_date
        const description = `${raw.remark || raw.note || ""} | ${amount} | ${raw.transaction_date || ""}`;

        // 5. & 6. running balance (integer)
        const balance = runningBalance;
        const beginBalance = isBalanceOut
            ? runningBalance + amount
            : runningBalance - amount;
        runningBalance = beginBalance;

        return {
            transaction_date: txDate,
            value_date: valueDate,
            description,
            amount,
            balance,
            begin_balance: beginBalance,
            is_balance_out: isBalanceOut,
            source: "Other",
            method_type: "BLU",
            utr: raw.ref_no || null,
            transaction_code: raw.ref_no || null,
            bank_account_id: bankAccountId,
        };
    });
}