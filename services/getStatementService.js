import { BluStatement } from "../scraper/pages/bluStatement.js";
import { saveStatements } from "../db/cacheRepository.js";
import { getDateDifference } from "../helper/dateDifference.js";

export class GetStatementService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.statement = new BluStatement(this.client, this.config);
    }

    async syncLatestStatements() {
        try {
            console.log("🔄 [Step D] Syncing latest statements to local DB...");

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            const formatDateTime = (d) =>
                d.toLocaleDateString("en-CA") + " " + d.toTimeString().slice(0, 8);

            const todayStr = formatDateTime(today);
            const yesterdayStr = formatDateTime(yesterday);

            const statementData = {
                start_at: yesterdayStr,
                end_at: todayStr
            };

            const latestStatements = await this.statement.getLatestStatements(statementData);

            if (latestStatements && latestStatements?.length > 0) {
                console.log(`📥 Menyimpan ${latestStatements.length} statement ke SQLite...`);
                await saveStatements(latestStatements);
                console.log("✅ Statements saved to local DB successfully");
            } else {
                console.log("ℹ️ No new statements found or empty statement list.");
            }
        } catch (error) {
            console.error("❌ Error syncing statements to local DB:", error);
        }
    }
}
