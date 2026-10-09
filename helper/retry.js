import { logger } from "./logger.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DELAY_NON_CRITICAL = [2000, 5000, 10000];
export const DELAY_CRITICAL = [2000, 4000, 8000, 16000, 32000, 64000];

export async function withRetry(operation, delays, label = "API Request") {
  let lastError;
  for (let attempt = 1; attempt <= delays.length + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt <= delays.length) {
        const delayMs = delays[attempt - 1];
        logger.error(`[Retry] ${label} failed (Attempt ${attempt}/${delays.length + 1}). Retrying in ${delayMs}ms... Reason: ${error.message}`);
        await sleep(delayMs);
      } else {
        logger.error(`[Retry Exhausted] ${label} failed completely after ${attempt} attempts.`);
      }
    }
  }
  throw lastError;
}