import { Scraper } from "../scraper/appiumClient.js";
import { BluAuth } from "../scraper/pages/bluAuth.js";
import { WithdrawReconciliationService } from "../services/withdrawReconciliationService.js";
import { WithdrawService } from "../services/withdrawService.js";

export class BotRunner {
    constructor(config) {
        this.config = config;
        this.scraper = new Scraper(config);
    }

    async start() {
        console.log("🚀 Starting Bot Runner...");

        const client = await this.scraper.start();

        this.withdrawService = new WithdrawService(client, this.config);
        this.withdrawReconsiliationService = new WithdrawReconciliationService(client, this.config);
        this.auth = new BluAuth(client, this.config);

        await this.runAuthFlow();
        await this.checkProcessTransactions();
        await this.checkPendingTransactions();
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

    async checkProcessTransactions() {
        await this.withdrawReconsiliationService.withdrawProcessStatus();
    }

    async checkPendingTransactions() {
        await this.withdrawReconsiliationService.withdrawPendingStatus();
    }

    async processQueue() {
        await this.withdrawService.processQueue(this.config, true);
    }
}