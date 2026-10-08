import crypto from "node:crypto";
import ax from "axios";
import dotenv from "dotenv";
import { API_KEY, CORE_XYZ_API, SECRET_KEY } from "./index.js";
import { getMockResponse } from "../dummy/bankAccountResponse.js";
import { TelegramDevInterceptor } from "../dummy/telegramDevInterence.js";

dotenv.config();

export const axios = ax.create({
  baseURL: CORE_XYZ_API
});

const isMockMode = String(process.env.USE_API_MOCK ?? "").toLowerCase() === "true";

axios.interceptors.request.use((config) => {
  const timestamp = Date.now().toString();
  const dataToSign = `${API_KEY}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(dataToSign)
    .digest("hex");

  config.headers["x-api-key"] = API_KEY;
  config.headers["x-timestamp"] = timestamp;
  config.headers["x-signature"] = signature;

  if (isMockMode && config.url && config.url.includes("/telegram")) {
    config = TelegramDevInterceptor.handle(config);
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!isMockMode) {
      return Promise.reject(error);
    }

    const requestUrl = error?.config?.url || "";
    const url = requestUrl.split("?")[0];
    const mock = getMockResponse(url, error?.config?.params || {});
    if (mock) {
      return Promise.resolve({
        data: mock.data,
        status: mock.status,
        statusText: "OK",
        headers: {},
        config: error.config,
      });
    }

    return Promise.reject(error);
  }
);