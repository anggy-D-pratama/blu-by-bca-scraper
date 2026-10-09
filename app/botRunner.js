import { sendTelegram } from "../helper/index.js";
import { Scraper } from "../scraper/appiumClient.js";
import { BluAuth } from "../scraper/pages/bluAuth.js";
import { WithdrawReconciliationService } from "../services/withdrawReconciliationService.js";
import { WithdrawService } from "../services/withdrawService.js";
import { GetStatementService } from "../services/getStatementService.js";

export class BotRunner {
    constructor(config) {
        this.config = config;
        this.scraper = new Scraper(config);
    }

    async start() {
        await sendTelegram(
            "Launching bot, please make sure the devices are connected!!"
        );
        const client = await this.scraper.start();
        // database connection check

        this.withdrawService = new WithdrawService(client, this.config);
        this.withdrawReconsiliationService = new WithdrawReconciliationService(client, this.config);
        this.getStatementService = new GetStatementService(client, this.config);
        this.auth = new BluAuth(client, this.config);

        await this.runAuthFlow();
        await this.mainLoop();
    }

    async mainLoop() {
        while (true) {
            console.log("\n=== STARTING MAIN LOOP ===");
            try {
                await this.checkProcessTransactions();

                console.log("⏳ Pausing 10s...");
                await new Promise(r => setTimeout(r, 10000));

                await this.checkPendingTransactions();
                await this.syncStatements();
                await this.processQueue();
            } catch (error) {
                console.error("❌ Error in main loop:", error);
                await sendTelegram(`⚠️ Main loop error: ${error.message}`);
            }
            console.log("=== END MAIN LOOP ===\n");
            await new Promise(r => setTimeout(r, 10000)); // Delay between iterations
        }
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

    async checkProcessTransactions() {
        await this.withdrawReconsiliationService.withdrawProcessStatus();
    }

    async checkPendingTransactions() {
        await this.withdrawReconsiliationService.withdrawPendingStatus();
    }

    async processQueue() {
        await this.withdrawService.processQueue(this.config, true);
    }

    async syncStatements() {
        await this.getStatementService.syncLatestStatements(20);
    }
}