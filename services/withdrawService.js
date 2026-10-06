import { getDailyLimit } from "../clients/bankAccount.js";
import { getQueueWithdraws, setFailedWd, setProcessWd, validateWd } from "../clients/withdraw.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";
import { ACCOUNT_NUMBER, LIST_CODES } from "../config/index.js";
import { screenshot, sendTelegram } from "../helper/index.js";
import { BluTopup } from "../scraper/pages/bluTopup.js";
import { BluTransfer } from "../scraper/pages/bluTransfer.js";

export class WithdrawService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }

    async processQueue(config, init = false) {
        try {
            const withdraws = await getQueueWithdraws(config.bank_account_id);
            console.log("check withdraws queue:", withdraws);

            if (withdraws?.length === 0) {
                console.log("No queue transactions found, skipping...");
                return;
            }

            console.log(`🔄 Processing ${withdraws.length} queue transaction(s)...`);

            for (const wd_data of withdraws) {
                if (wd_data.bank_account === ACCOUNT_NUMBER) {
                    console.log("Skipping because self account number receiver");
                    if (init) {
                        await sendTelegram("⛔Self Account Number Receiver⛔\n\nTransaction No: " + wd_data?.transaction_no + "\n\nBot will ignore this withdraw request because cannot transfer using own account number as receiver");
                    }
                } else {
                    const isValid = await validateWd(wd_data);
                    const dailyLimit = await getDailyLimit();
                    console.log("check data is valid : ", isValid);
                    console.log("check data daily limit : ", dailyLimit);

                    if (wd_data && isValid && !dailyLimit?.is_reached) {
                        try {
                            await sendTelegram(`Processing payout with transaction no : ${wd_data.transaction_no}`);
                        } catch (error) {
                            console.error("fail send telegram processing message!", error);
                        }
                        console.log("processing payout with code : " + wd_data.transaction_no);

                        // set process wd
                        await setProcessWd(wd_data);
                        //update into cache

                        // check transfer or ewallet
                        const bankData = LIST_CODES?.bank?.filter((el) => el.code === wd_data?.bank_code);
                        const walletData = LIST_CODES?.wallet?.filter((el) => el.code === wd_data?.bank_code);

                        if (bankData?.length > 0 || walletData?.length > 0) {
                            await this.processWithdraw(wd_data, bankData, walletData);
                        } else {
                            await screenshot(this.client, "screenshot/image.png");
                            await sendTelegram("⛔Invalid Bank Code⛔\n\nTransaction No: " + wd_data?.transaction_no +
                                "\nBank Code: " + wd_data?.bank_code +
                                "\nMessage: Bank code not recognized or not supported!\n\nPlease make sure bank code is supported in transfer using Mandiri Account");
                            await setFailedWd(wd_data, "Transaction failed because of :: bank_code not supported on Auto Payout IDR Mandiri");
                        }
                    }
                }
                console.log("check wd_data:", wd_data);
            }
        } catch (err) {
            console.log("Error processing queue transactions:", err);
        }
    }

    async processWithdraw(wd_data, bankData = null, walletData = null) {
        const transfer = new BluTransfer(this.client, this.config);
        const topup = new BluTopup(this.client, this.config);
        
        if (bankData?.length > 0) {
            let dataTransfer = await transfer.processTransfer(wd_data, bankData);
            console.log("check data transfer return : ", dataTransfer);
        } else if (walletData?.length > 0) {
            let dataTopup = await topup.processTopup(wd_data, walletData);
            console.log("check data transfer return : ", dataTopup)
        }
        
    }
}