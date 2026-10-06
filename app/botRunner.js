import { Scraper } from "../scraper/appiumClient.js";
import { BluAuth } from "../scraper/pages/bluAuth.js";
import { WithdrawService } from "../services/withdrawService.js";

export class BotRunner {
    constructor(config) {
        this.config = config;
        this.scraper = new Scraper(config);
        this.withdrawService = null;
    }

    async start() {
        console.log("🚀 Starting Bot Runner...");

        const client = await this.scraper.start();

        this.withdrawService = new WithdrawService(client, this.config);
        this.auth = new BluAuth(client, this.config);
        // this.statement = new BcaStatement(client, this.config);

        await this.runAuthFlow();
        // await this.checkingProcessTransactions();
        await this.processQueue();
    }

    async runAuthFlow() {
        console.log("🔄 Executing Login Flow...");
        const isLogin = await this.auth.login();
        if (!isLogin) {
            throw new Error("Login failed, cannot proceed.");
        }

        const isPinSubmitted = await this.auth.submitPin();
        if (!isPinSubmitted) {
            throw new Error("PIN submission failed, cannot proceed.");
        }
    }

    async checkingProcessTransactions() {
    //     const withdraws = await this.withdrawService.getProcessWithdraws(
    //         this.config.bank_account_id
    //     );

    //     if (withdraws.length === 0) {
    //         console.log("No process transactions found, skipping...");
    //         return;
    //     }

    //     console.log(`🔄 Processing ${withdraws.length} process transaction(s)...`);

    //     await this.statement.navigateToMutation();
    //     await this.statement.filterTransactionType("Uang Keluar");

    //     for (let index = 0; index < withdraws.length; index++) {
            
    //         let wd_data = withdraws[index];
    //         await this.statement.setDateRange(wd_data.updated_at);
    //         await this.statement.submitAndAuthenticate();
    //         // continue to scrap mutation data
    //     }
    }

    async processQueue(){
        await this.withdrawService.processQueue(this.config, true);
    }
}