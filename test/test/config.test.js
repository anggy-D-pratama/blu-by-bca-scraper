import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { apiClient } from "../api/axios.js";
import { getBankAccount, getDailyLimit } from "../api/bankAccount.js";

test("bank-account API methods sign every request with the HMAC headers", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const originalEnv = {
    BASE_URL: process.env.BASE_URL,
    API_KEY: process.env.API_KEY,
    SECRET_KEY: process.env.SECRET_KEY,
  };
  const requests = [];
  process.env.BASE_URL = "https://api.example.test/v1";
  process.env.API_KEY = "test-api-key";
  process.env.SECRET_KEY = "test-secret-key";
  apiClient.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      data: { status: "success", data: { limit: 10 } },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  try {
    const params = { account_number: "100200300" };
    const accountResponse = await getBankAccount(params);
    const limitResponse = await getDailyLimit(params);

    assert.deepEqual(accountResponse, { status: "success", data: { limit: 10 } });
    assert.deepEqual(limitResponse, { status: "success", data: { limit: 10 } });
    assert.equal(requests[0].url, "/bank-account");
    assert.equal(requests[1].url, "/bank-account/daily-limit");

    for (const request of requests) {
      assert.equal(request.baseURL, "https://api.example.test/v1");
      assert.deepEqual(request.params, params);
      const timestamp = request.headers.get("x-timestamp");
      assert.match(timestamp, /^\d+$/);
      assert.equal(request.headers.get("x-api-key"), "test-api-key");
      assert.equal(
        request.headers.get("x-signature"),
        crypto
          .createHmac("sha256", "test-secret-key")
          .update(`test-api-key:${timestamp}`)
          .digest("hex"),
      );
    }
  } finally {
    apiClient.defaults.adapter = originalAdapter;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
