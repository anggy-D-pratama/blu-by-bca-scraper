import { axios } from "../config/axios.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";

async function get(endpoint, params) {
    const response = await axios.get(endpoint, { params });
    return response.data;
}

async function getWithdraws(bankAccountId, status) {
    const res = await get("/withdraw", {
        bank_account_id: bankAccountId,
        status
    });
    return res.data;
}

export async function getProcessWithdraws(bankAccountId) {
    const withdraws = await getWithdraws(bankAccountId, WD_STATUS.PROCESS);
    return Array.isArray(withdraws) ? withdraws : [];
}

export async function getQueueWithdraws(bankAccountId) {
    const withdraws = await getWithdraws(bankAccountId, WD_STATUS.QUEUE);
    return Array.isArray(withdraws) ? withdraws : [];
}

export async function setProcessWd(wd_data) {
    console.log("set wd_data status to process");
    await axios.post("/withdraw/update", {
        id: wd_data.id,
        status: WD_STATUS.PROCESS,
    });
    console.log("set wd_data status to process done");
}

export async function setFailedWd(wd_data, node = null) {
    console.log("set wd_data status to failed");
    await axios.post("/withdraw/update", {
        id: wd_data.id,
        status: WD_STATUS.FAILED,
        notes,
    });
    console.log("set wd_data status to failed done");
}

export async function validateWd(wd_data) {
    return await axios.post("/withdraw/validate", {
        id: wd_data.id,
        transaction_no: wd_data.transaction_no,
        transaction_code: wd_data.transaction_code,
    }).then(async response => {
        if (response.data.status !== "success") {
            const errMessage = response.data?.errors ?? response?.data?.data ?? response?.data ?? "Invalid Withdraw request transactions...";
            console.error("Failed to validate withdraw request:", errMessage);

            const message = `🚫Invalid Withdraw Request!!🚫\n\n` +
                `Transaction No : ${wd_data?.transaction_no}\n` +
                `Message : ${errMessage}\n\n` +
                `Be sure to check the status of this withdrawal request in BO.\n` +
                `The bot will skip this transaction and proceed to the next withdrawal request in the queue.`

            await sendTelegram(message);
        }

        return response.data.status === "success";
    });
}