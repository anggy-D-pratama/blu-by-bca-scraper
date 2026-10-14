export const STATEMENT_RAW_CONTRACT = {
  current_balance: "string",
  statements: [
    {
      ref_no: "string",
      status: "string",
      amount: "string",
      bank_account: "string",
      remark: "string",
      transaction_date: "string",
    },
  ],
};

export const TRANSACTION_RESULT_CONTRACT = {
  text: "string",
  ref_no: "string",
};
