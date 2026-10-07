import { getProcessWithdraws, setQueueWd } from "../clients/withdraw.js";
import { getDateDifference } from "../helper/dateDifference.js";
import { sendTelegram } from "../helper/index.js";
import { BluStatement } from "../scraper/pages/bluStatement.js";

export class WithdrawReconciliationService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.statement = new BluStatement(this.client, this.config);
    }

    getDateDifference(applicationDate, withdrawDate) {
        return getDateDifference(applicationDate, withdrawDate);
    }

    async withdrawProcessStatus() {
        try {
            const withdraws = await getProcessWithdraws(this.config.id);
            console.log("checking processing transaction...", withdraws);

            if (withdraws?.length > 0) {
                for (let wd_data of withdraws) {
                    await sendTelegram(
                        "⚠️⚠️Processing Transaction Found!!" +
                        "[newline]Transaction no :: " + wd_data?.transaction_no +
                        "[newline][newline]Please dont stop the bot until checking processing transaction process done!"
                    );

                    if (wd_data?.unique_code == null) {
                        await setQueueWd(wd_data);
                    } else {
                        let statementData = await this.statement.getStatement(wd_data);
                        console.log(statementData);
                    }
                }
            }
        } catch (err) {
            console.log("Error processing process transactions:", err);
        }
    }

    async withdrawPendingStatus() {

    }
}