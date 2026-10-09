import { ACCOUNT_NUMBER } from "../config/index.js";
import { axios } from "../config/axios.js";
import { withRetry, DELAY_NON_CRITICAL } from "../helper/retry.js";

async function get(endpoint, params) {
    return await withRetry(async () => {
        const response = await axios.get(endpoint, { params });
        return response.data;
    }, DELAY_NON_CRITICAL, `GET ${endpoint}`);
}

export async function getBankAccount() {
    const res = await get("/bank-account", { account_number: ACCOUNT_NUMBER });
    return res?.data;
}

export async function getDailyLimit() {
    const res = await get("/bank-account/daily-limit", { account_number: ACCOUNT_NUMBER });
    return res;
}