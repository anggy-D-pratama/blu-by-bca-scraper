import { ELEMENTS } from "../../config/constants/elements.js";
import { handleElementError, screenshot, swipeSmall } from "../../helper/index.js";
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
                10 * 1000
            );

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

export function parseRupiahToMinorUnits(value) {
    const normalized = value.trim().replace(/^Rp\s*/i, "").replace(/\s/g, "");
    const match = normalized.match(/^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/);

    if (!match) {
        throw new Error(`Invalid Rupiah amount: "${value}"`);
    }

    const rupiah = Number(match[1].replace(/\./g, ""));
    const minorUnits = Number((match[2] ?? "").padEnd(2, "0"));

    const minorUnitsTotal = rupiah * 100 + minorUnits;
    if (!Number.isSafeInteger(minorUnitsTotal)) {
        throw new Error(`Rupiah amount is outside the supported range: "${value}"`);
    }

    return minorUnitsTotal;
}