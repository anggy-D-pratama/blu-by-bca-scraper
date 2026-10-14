const MONTHS_ID = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06",
    Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12",
};

/**
 * Parse tanggal BLU: "12 Okt 2026 | 16:07:59 WIB" → "2026-10-12"
 * @param {string} raw
 * @returns {string|null} "YYYY-MM-DD" atau null kalau gagal
 */
function parseBluDate(raw) {
    if (!raw) return null;

    const datePart = raw.split("|")[0].trim();
    const parts = datePart.split(" ");
    if (parts.length !== 3) return null;

    const [day, monthId, year] = parts;
    const month = MONTHS_ID[monthId];
    if (!month) return null;

    return `${year}-${month}-${day.padStart(2, "0")}`;
}

/**
 * Parse saldo: "Rp 9.236,00" → 9236
 * @param {string|number} raw
 * @returns {number}
 */
function parseBluBalance(raw) {
    if (raw === 0 || raw === null || raw === undefined) return 0;

    if (typeof raw === "number") return Math.trunc(raw);

    const whole = String(raw).split(",")[0];
    const value = Number(whole.replace(/[^0-9]/g, ""));
    return Number.isFinite(value) ? Math.trunc(value) : 0;
}

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