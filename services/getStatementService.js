import { BluStatement } from "../scraper/pages/bluStatement.js";
import { saveStatements } from "../db/cacheRepository.js";

export class GetStatementService {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.statement = new BluStatement(this.client, this.config);
    }

    /**
     * Step D: Ekstrak daftar mutasi terbaru dari UI dan simpan ke database lokal SQLite.
     * @param {number} limit - Jumlah maksimal transaksi yang ingin discrape
     */
    async syncLatestStatements(limit = 20) {
        try {
            console.log("🔄 [Step D] Syncing latest statements to local DB...");
            const latestStatements = await this.statement.getLatestStatements(limit);
            
            if (latestStatements && latestStatements.length > 0) {
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
