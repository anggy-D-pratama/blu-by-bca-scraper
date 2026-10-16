import { getUnsyncedStatements, markStatementsAsSynced, saveStatements } from "../db/cacheRepository.js";
import { getDateDifference } from "../helper/dateDifference.js";
import { bulkBankTransactions } from "../clients/bankTransaction.js";

export class GetStatementService {
    constructor(client, config, bankAdapter) {
        this.client = client;
        this.config = config;
        this.bankAdapter = bankAdapter;
        this.statement = new this.bankAdapter.StatementPage(this.client, this.config);
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

            const mapped = this.bankAdapter.mapStatements(
                statements,
                current_balance ?? 0,
                this.config?.bank_account_id ?? this.config?.bankAccountId ?? this.config?.id
            );


            if (mapped.length > 0) {
                console.log(`📥 Menyimpan ${mapped.length} statement ke SQLite...`);
                await saveStatements(mapped);
            }

            // Ambil hanya record lokal yang belum disinkronkan ke BE
            const unsynced = await getUnsyncedStatements();

            if (unsynced.length === 0) {
                console.log("ℹ️ Semua statement di local sudah synced ke BE.");
                return;
            }

            console.log(`📡 Ditemukan ${unsynced.length} statement unsynced, mengirim ke /bank-transactions/bulk...`);

            // Format hanya 12 fields kontrak API (buang id, is_synced, created_at, dll)
            const payload = unsynced.map(({
                transaction_date,
                value_date,
                description,
                amount,
                balance,
                begin_balance,
                is_balance_out,
                source,
                method_type,
                utr,
                transaction_code,
                bank_account_id
            }) => ({
                transaction_date,
                value_date,
                description,
                amount,
                balance,
                begin_balance,
                is_balance_out: Boolean(is_balance_out),
                source,
                method_type,
                utr,
                transaction_code,
                bank_account_id
            }));

            await bulkBankTransactions(payload);
            console.log("✅ Berhasil sync bank transactions ke API backend");

            // Tandai sudah synced hanya setelah request API berhasil
            const syncedIds = unsynced.map((s) => s.id);
            await markStatementsAsSynced(syncedIds);
            console.log(`✅ Berhasil update is_synced = true untuk ${syncedIds.length} statement di SQLite`);
        } catch (error) {
            if (error?.isSessionExpired) throw error;
            console.error("❌ Error syncing statements to local DB:", error);
        }
    }
}
