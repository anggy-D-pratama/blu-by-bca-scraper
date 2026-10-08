import { getBankAccount } from "../clients/bankAccount.js";
import { BotRunner } from "../app/botRunner.js";
import { logger } from "../helper/logger.js";
import { checkCacheConnection } from "../db/connection.js";

export async function start(config) {
  console.log("🔌 Checking Local Cache Connection...");
  await checkCacheConnection();
  
  config ??= await getBankAccount();
  console.log("🚀 Starting Bot Runner...");
  await new BotRunner(config).start();
}

export function reportStartupError(error) {
  logger.error(error.stack || error.message);
  process.exitCode = 1;
}