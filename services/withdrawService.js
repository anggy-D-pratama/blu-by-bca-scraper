import { getDailyLimit } from "../clients/bankAccount.js";
import { getQueueWithdraws, setFailedWd, setPendingWd, setProcessWd, validateWd } from "../clients/withdraw.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";
import { ACCOUNT_NUMBER, LIST_CODES } from "../config/index.js";
import { screenshot, sendTelegram } from "../helper/index.js";
import { BluTopup } from "../scraper/pages/bluTopup.js";
import { BluTransfer } from "../scraper/pages/bluTransfer.js";
import { WithdrawStatusService } from "./withdrawStatusService.js";
import { findStatementMatch, getCache } from "../db/cacheRepository.js";

export class WithdrawService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.withdrawStatusService = new WithdrawStatusService();
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

                        const matchedCache = await getCache(
                            wd_data?.transaction_no
                        );

                        if (matchedCache && [WD_STATUS.PENDING, WD_STATUS.SUCCESS, WD_STATUS.PROCESS].includes(matchedCache.status)) {
                            if (matchedCache.status === WD_STATUS.PENDING) {
                                await setPendingWd(wd_data);
                                await sendTelegram(`Data change based on local status to pending : 
                                    \nlocal cache : ${matchedCache}`);
                            } else if (matchedCache.status === WD_STATUS.PROCESS) {
                                await setProcessWd(wd_data);
                                await sendTelegram(`Data change based on local status to process : 
                                    \nlocal cache : ${matchedCache}`);
                            }
                            continue;
                        }

                        // Guard: Cek apakah transaksi sudah ada di mutasi lokal SQLite
                        const matchedStatement = await findStatementMatch({
                            remark: wd_data.remark,
                            amount: wd_data.amount,
                            bank_account: wd_data.bank_account,
                        });

                        if (matchedStatement) {
                            console.log(`🛡️ Transaksi ${wd_data.transaction_no} ditemukan di mutasi lokal! Memperbarui status tanpa transfer ulang...`);
                            await this.withdrawStatusService.resolveNextStatus(wd_data, [matchedStatement]);
                            continue;
                        }

                        // check transfer or ewallet
                        const bankData = LIST_CODES?.bank?.filter((el) => el.code === wd_data?.bank_code);
                        const walletData = LIST_CODES?.wallet?.filter((el) => el.code === wd_data?.bank_code);

                        // set process wd
                        await this.withdrawStatusService.resolveNextStatus({ ...wd_data, bankData, walletData });

                        if (bankData?.length > 0 || walletData?.length > 0) {
                            await this.processWithdraw(wd_data, bankData, walletData);
                        } else {
                            await screenshot(this.client, "screenshot/image.png");
                            await sendTelegram("⛔Invalid Bank Code⛔\n\nTransaction No: " + wd_data?.transaction_no +
                                "\nBank Code: " + wd_data?.bank_code +
                                "\nMessage: Bank code not recognized or not supported!\n\nPlease make sure bank code is supported in transfer using Mandiri Account");
                            await this.withdrawStatusService.resolveNextStatus(wd_data);
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
            await this.withdrawStatusService.resolveNextStatus(wd_data, [
                {
                    status: dataTransfer.text,
                    refNo: dataTransfer.ref_no
                }
            ]);
        } else if (walletData?.length > 0) {
            let dataTopup = await topup.processTopup(wd_data, walletData);
            console.log("check data transfer return : ", dataTopup)
            await this.withdrawStatusService.resolveNextStatus(wd_data, [
                {
                    status: dataTopup.text,
                    refNo: dataTopup.ref_no
                }
            ]);
        }

    }
}