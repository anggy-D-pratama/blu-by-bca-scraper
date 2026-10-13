import { axios } from "../config/axios.js";
import { withRetry, DELAY_NON_CRITICAL } from "../helper/retry.js";

/**
 * Bulk insert bank transactions ke backend.
 * @param {Array} transactions - array of mapped statement objects
 * @returns {Promise<Object>}
 */
export async function bulkBankTransactions(transactions) {
    return await withRetry(async () => {
        const response = await axios.post("/bank-transactions/bulk", transactions);
        const data = response.data;
        if (data && (data.status === "failed" || data.success === false)) {
            throw new Error(`Bulk bank transactions failed: ${data.message || JSON.stringify(data)}`);
        }
        return data;
    }, DELAY_NON_CRITICAL, "POST /bank-transactions/bulk");
}