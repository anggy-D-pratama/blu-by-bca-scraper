import { ELEMENTS } from "../../config/constants/elements.js";
import { handleElementError, parseRupiah, screenshot, sendTelegram, swipeSmall } from "../../helper/index.js";
import { BasePage } from "./BasePage.js";
import { BluAuth } from "./bluAuth.js";

export class BluTransfer extends BasePage {
    async processTransfer(wd_data, bankData) {
        let dataResponse = {
            text: "failed",
            ref_no: "",
        }

        try {
            await this.actions.waitForElement(
                ELEMENTS.HOMEPAGE.TRANSFER_BTN,
                10 * 1000
            );

            await this.actions.clickElement(
                ELEMENTS.HOMEPAGE.TRANSFER_BTN,
                true
            )

            await this.actions.waitForElement(
                ELEMENTS.TRANSFER.NEW_DESTINATION_BTN,
                10 * 1000
            )

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.NEW_DESTINATION_BTN,
                true
            );

            await this.actions.waitForElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_BTN,
                10 * 1000
            )

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_BTN,
                true
            );

            await this.actions.waitForElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_BANK_SELECT,
                10 * 1000
            );

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_BANK_SELECT,
                true
            );

            console.log("check bankdata : ", bankData[0]);
            await this.lookForBankAndSelect(bankData[0]?.bankName);

            await this.actions.enterText(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_ACCOUNT_INPUT,
                wd_data.bank_account,
                { withKeyboard: true }
            );

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_TRANSFER_CEK_BTN,
                true
            );

            let isNameInputVisible = await this.actions.checkExistingElement(
                ELEMENTS.TRANSFER.TRANSFER_NAME_INPUT
            );

            // NOTE : when account number not found, the app will ask you to input the name of the account manually
            if (isNameInputVisible) {
                return dataResponse;
            }

            await this.actions.enterText(
                ELEMENTS.TRANSFER.TRANSFER_AMOUNT_INPUT,
                wd_data.amount,
                { withKeyboard: true }
            );


            await this.actions.pause(2 * 1000);
            await swipeSmall(this.client, 0, -250);

            await this.actions.enterText(
                ELEMENTS.TRANSFER.TRANSFER_NOTE_INPUT,
                wd_data.remark,
                { withKeyboard: true }
            );

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.TRANSFER_CONFIRM_BTN,
                true
            );

            // confirmation page
            await this.actions.waitForElement(
                ELEMENTS.TRANSFER.TRANSFER_TOTAL_INFO,
                30 * 1000
            );

            let currentBalance = await this.actions.getText(
                ELEMENTS.TRANSFER.TRANSFER_CURRENT_BALANCE_INFO
            );

            let totalTransaction = await this.actions.getText(
                ELEMENTS.TRANSFER.TRANSFER_TOTAL_INFO
            );

            let currentBalanceParsed = await parseRupiah(currentBalance);
            let totalTransactionParsed = await parseRupiah(totalTransaction);

            if (currentBalanceParsed - totalTransactionParsed < 0) {
                console.log("Balance not enough for this transaction");
                await sendTelegram(`Transaction number ${wd_data?.transaction_no} can't be proceed
                    \nReason : Not enough balance
                    \nCurrent Balance : Rp ${currentBalanceParsed}
                    \nTotal Transaction : Rp ${totalTransactionParsed}`);
                await screenshot(this.client);

                await this.actions.pause(2 * 1000);
                await this.client.back();
                await this.actions.pause(2 * 1000);
                await this.client.back();
                await this.actions.pause(2 * 1000);
                await this.client.back();
                await this.actions.pause(2 * 1000);
                await this.client.back();
                return dataResponse;
            }

            console.log("Take evidence of confirmation page");
            await sendTelegram("Take evidence of confirmation page");
            await screenshot(this.client);

            await this.actions.clickElement(
                ELEMENTS.TRANSFER.TRANSFER_BTN,
                true
            );

            // pin
            await new BluAuth(this.client, this.config).submitPin();

            await this.actions.waitForElement(
                ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS,
                10 * 1000
            );

            await this.actions.pause(3 * 1000);

            console.log("Take summary screenshot");
            await screenshot(this.client);

            let transactionStatus = await this.actions.getText(
                ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS
            );
            console.log("check status : ", transactionStatus);

            let transactionRefNo = await this.actions.getText(
                ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_NO_REF
            );

            await this.actions.clickElement(
                ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_BACK_BTN, true
            );

            dataResponse = {
                text: transactionStatus.includes("tidak") ? "failed" : "success",
                ref_no: transactionRefNo
            }
        } catch (err) {
            await handleElementError(err, this.client);
            return dataResponse;
        }

        return dataResponse;
    }

    async lookForBankAndSelect(bankName) {
        try {
            console.log("check bank name : ", bankName);
            console.log("check bank name element : ", ELEMENTS.TRANSFER.DIFF_DESTINATION_BANK_OPTION(bankName));

            let bankOptionSelecter = await this.actions.checkExistingElement(
                ELEMENTS.TRANSFER.DIFF_DESTINATION_BANK_OPTION(bankName),
            )

            if (!bankOptionSelecter) {
                // swipe to find the bank option
                await swipeSmall(this.client, 0, -250);
                this.actions.pause(2 * 1000);
                // recursive function to swipe and look for the bank option
                this.lookForBankAndSelect(bankName);
            }

            await this.actions.clickElement(ELEMENTS.TRANSFER.DIFF_DESTINATION_BANK_OPTION(bankName), true);
            return true;
        } catch (err) {
            await handleElementError(err, this.client);
            return false;
        }
    }
}