import test from "node:test";
import assert from "node:assert/strict";
import { axios } from "../config/axios.js";
import { validateWd } from "../clients/withdraw.js";

const withdraw = {
    id: 1,
    transaction_no: "TRX-VALIDATION-TEST",
    transaction_code: "code",
};

test("validateWd reports successful backend validation", async (t) => {
    t.mock.method(axios, "post", async () => ({
        data: { status: "success" },
    }));

    assert.deepEqual(await validateWd(withdraw), {
        isValid: true,
        message: null,
    });
});

test("validateWd returns the backend rejection reason", async (t) => {
    t.mock.method(axios, "post", async () => ({
        data: { status: "error", data: "transaction code is invalid" },
    }));

    assert.deepEqual(await validateWd(withdraw), {
        isValid: false,
        message: "transaction code is invalid",
    });
});
