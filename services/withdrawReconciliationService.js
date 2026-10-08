import { getPendingWithdraws, getProcessWithdraws, setFailedWd, setManualWd, setPendingWd, setQueueWd, setSuccessWd } from "../clients/withdraw.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";
import { LIST_CODES } from "../config/index.js";
import { getDateDifference } from "../helper/dateDifference.js";
import { sendTelegram } from "../helper/index.js";
import { BluStatement } from "../scraper/pages/bluStatement.js";
import { WithdrawStatusService } from "./withdrawStatusService.js";

export class WithdrawReconciliationService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.statement = new BluStatement(this.client, this.config);
        this.withdrawStatusService = new WithdrawStatusService();
    }

    getDateDifference(applicationDate, withdrawDate) {
        return getDateDifference(applicationDate, withdrawDate);
    }

    async withdrawProcessStatus() {
        try {
            const withdraws = await getProcessWithdraws(this.config.id);
            console.log("checking processing transaction...", withdraws);

            if (withdraws?.length > 0) {
                for (let [index, wd_data] of withdraws.entries()) {
                    await sendTelegram(
                        "⚠️⚠️Processing Transaction Found!!" +
                        "[newline]Transaction no :: " + wd_data?.transaction_no +
                        "[newline][newline]Please dont stop the bot until checking processing transaction process done!"
                    );

                    if (wd_data?.unique_code == null) {
                        await this.withdrawStatusService.resolveNextStatus(wd_data);
                    } else {
                        let state = "";
                        if (index === 0) {
                            state = "init";
                        } else if (index === withdraws?.length - 1) {
                            state = "exit";
                        }

                        let statementData = await this.statement.getStatement(wd_data, state);
                        await this.withdrawStatusService.resolveNextStatus(wd_data, statementData);
                    }
                }
            }
        } catch (err) {
            console.log("Error processing process transactions:", err);
        }
    }

    async withdrawPendingStatus() {
        try {
            const withdraws = await getPendingWithdraws(this.config.id);
            console.log("checking pending transaction...", withdraws);

            if (withdraws?.length > 0) {
                for (let [index, wd_data] of withdraws.entries()) {
                    if (!wd_data?.transaction_no) {
                        continue;
                    }

                    // check transfer or ewallet
                    const bankData = LIST_CODES?.bank?.filter((el) => el.code === wd_data?.bank_code);
                    const walletData = LIST_CODES?.wallet?.filter((el) => el.code === wd_data?.bank_code);

                    if (bankData?.length > 0) {
                        wd_data.bank_data = bankData;
                    } else if (walletData?.length > 0) {
                        wd_data.wallet_data = walletData
                    }

                    let state = "";
                    if (index === 0) {
                        state = "init";
                    } else if (index === withdraws?.length - 1) {
                        state = "exit";
                    }

                    let statementData = await this.statement.getStatement(wd_data, state);
                    console.log("check data statement : ", statementData);
                    await this.withdrawStatusService.resolveNextStatus(wd_data, statementData);
                }
            }
        } catch (err) {
            console.log("Error processing pending transactions:", err);
        }
    }
}