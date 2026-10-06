import { getBankAccount } from "../clients/bankAccount.js";
import { BotRunner } from "../app/botRunner.js";
import { logger } from "../helper/logger.js";

export async function start(config) {
  config ??= await getBankAccount();
  console.log("check config : ", {
    config
  })
  await new BotRunner(config).start();

}

export function reportStartupError(error) {
  logger.error(error.stack || error.message);
  process.exitCode = 1;
}