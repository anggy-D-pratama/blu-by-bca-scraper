import { BluStatement } from "../scraper/pages/bluStatement.js";
import { saveStatements } from "../db/cacheRepository.js";
import { getDateDifference } from "../helper/dateDifference.js";
import { mapBLUStatements } from "./statementMapper.js";

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

            const { current_balance, statements } = latestStatements || {};

            if (!statements || statements.length === 0) {
                console.log("No new statements found.");
                return;
            }

            const mapped = mapBLUStatements(
                statements,
                current_balance ?? 0,
                this.config?.bank_account_id ?? this.config?.bankAccountId ?? this.config?.id
            );

            console.log("check data mapped statements");
            console.log(mapped);
            process.exit(1);
            if (mapped.length > 0) {
                console.log(`📥 Menyimpan ${mapped.length} statement ke SQLite...`);
                await saveStatements(mapped);
                console.log("✅ Statements saved to local DB successfully");
            } else {
                console.log("ℹ️ No new statements found or empty statement list.");
            }
        } catch (error) {
            console.error("❌ Error syncing statements to local DB:", error);
        }
    }
}
