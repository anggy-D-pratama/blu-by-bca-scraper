import { BANKCODE } from "./index.js";

export async function loadBankAdapter() {
  const code = (BANKCODE || "blu").toLowerCase();
  const adapter = await import(`./banks/${code}/adapter.js`);
  return adapter.default;
}
