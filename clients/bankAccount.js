import { ACCOUNT_NUMBER } from "../config/index.js";
import { axios } from "../config/axios.js";

async function get(endpoint, params) {
    const response = await axios.get(endpoint, { params });
    return response.data;
}

export async function getBankAccount() {
    const res = await get("/bank-account", { account_number: ACCOUNT_NUMBER });

    return res.data;
}

export async function getDailyLimit() {
    const req = await get("/bank-account/daily-limit", {account_number:ACCOUNT_NUMBER});
    return req;
}