import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const getFile = (filename) => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(currentDirectory, filename), "utf8"),
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

const bank = getFile("./constants/bankData.json");
const wallet = getFile("./constants/walletData.json");

export const BANKCODE = process.argv[3] || process.env.BANKCODE;
export const ACCOUNT_NUMBER = (process.argv[2] || process.env.ACCOUNT_NUMBER)
  ?.split(":")[0];
export const DATABASE_URL = process.env.DATABASE_URL;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;
export const BASE_URL = process.env.BASE_URL;
export const MERCHANT_ID = process.env.MERCHANT_ID;
export const DATABASE_RDS = process.env.DATABASE_RDS;
export const DEVICE = process.env.DEVICE;
export const CORE_XYZ_API = process.env.CORE_XYZ_API;
export const API_KEY = process.env.API_KEY;
export const SECRET_KEY = process.env.SECRET_KEY;
export const STATEMENT_PASS = process.env.STATEMENT_PASS;
export const api_dir = `../../local-panel-scraping/banks/mandiri/${BANKCODE}`;
export const LIST_CODES = { bank, wallet };

export default {
  BANKCODE,
  APPLICATION_NAME,
  ACCOUNT_NUMBER,
  DATABASE_URL,
  BASE_URL,
  api_dir,
  MERCHANT_ID,
  SECRET_KEY,
  DATABASE_RDS,
  CORE_XYZ_API,
  API_KEY,
  STATEMENT_PASS,
  LIST_CODES,
};
