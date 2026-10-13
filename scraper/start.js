import { getBankAccount } from "../clients/bankAccount.js";
import { BotRunner } from "../app/botRunner.js";
import { logger } from "../helper/logger.js";
import { checkCacheConnection } from "../db/connection.js";
import { loadBankAdapter } from "../config/bankAdapter.js";

export async function start(config) {
  console.log("🔌 Checking Local Cache Connection...");
  await checkCacheConnection();

  const bankAdapter = await loadBankAdapter();
  
  config ??= await getBankAccount();
  console.log("🚀 Starting Bot Runner...");
  await new BotRunner(config, bankAdapter).start();
}

export function reportStartupError(error) {
  logger.error(error.stack || error.message);
  process.exitCode = 1;
}