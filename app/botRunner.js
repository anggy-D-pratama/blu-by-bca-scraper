import { sendTelegram } from "../helper/index.js";
import { Scraper } from "../scraper/appiumClient.js";
import { WithdrawReconciliationService } from "../services/withdrawReconciliationService.js";
import { WithdrawService } from "../services/withdrawService.js";
import { GetStatementService } from "../services/getStatementService.js";

export class BotRunner {
    constructor(config, bankAdapter) {
        this.config = config;
        this.bankAdapter = bankAdapter;
        this.scraper = new Scraper(config, this.bankAdapter);
    }

    async start() {
        await this.startSession();
        await this.mainLoop();
    }

    async startSession() {
        await sendTelegram(
            "Launching bot, please make sure the devices are connected!!"
        );
        const client = await this.scraper.start();

        this.withdrawService = new WithdrawService(client, this.config, this.bankAdapter);
        this.withdrawReconsiliationService = new WithdrawReconciliationService(client, this.config, this.bankAdapter);
        this.getStatementService = new GetStatementService(client, this.config, this.bankAdapter);
        this.auth = new this.bankAdapter.AuthPage(client, this.config);

        await this.runAuthFlow();
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
                if (error.isSessionExpired) {
                    console.error("Session expired. Restarting bot session...");
                    await sendTelegram("Blu Session ended. Restart bot.");

                    await this.startSession();
                    continue;
                }

                console.error("❌ Error in main loop:", error);
                await sendTelegram(`⚠️ Main loop error: ${error.message}`);
            }
            console.log("=== END MAIN LOOP ===\n");
            const delayMs = Math.round(10000 + Math.random() * 20000);
            console.log(`⏳ Delaying next iteration for ${(delayMs / 1000).toFixed(1)}s...`);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    async runAuthFlow() {
        console.log("🔄 Executing Login Flow...");
        const isLogin = await this.auth.login();
        if (!isLogin) {
            throw new Error("Login failed, cannot proceed.");
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
        await this.getStatementService.syncLatestStatements();
    }
}