import { ELEMENTS } from "../../config/constants/elements.js";
import { handleElementError, parseRupiah, screenshot, sendTelegram } from "../../helper/index.js";
import { BasePage } from "./BasePage.js";
import { BluAuth } from "./bluAuth.js";

export class BluTopup extends BasePage {
    dataResponse = {
        text: "failed",
        ref_no: "",
    }

    async processTopup(wd_data, walletData) {
        this.wd_data = wd_data;
        this.walletData = walletData;

        try {
            await this.actions.waitForElement(
                ELEMENTS.HOMEPAGE.TRANSFER_BTN,
                10 * 1000
            );

            await this.actions.pause(3 * 1000);

            await this.actions.clickElement(
                ELEMENTS.HOMEPAGE.EWALLET_BTN,
                true
            )

            await this.processEWalletPage();

            await this.processSelectedEWalletPage();

            let isConfirm = await this.processConfirmationPage();

            if (!isConfirm) {
                return this.dataResponse;
            }
            await this.actions.pause(2 * 1000);
            await new BluAuth(this.client, this.config).submitPin();
            await this.actions.pause(3 * 1000);

            await this.processSummaryPage();

        } catch (err) {
            await handleElementError(err, this.client);
            return this.dataResponse;
        }
        return this.dataResponse;
    }

    async processEWalletPage() {
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.TITLE_HEADER,
            10 * 1000
        );
        await this.actions.pause(3 * 1000);

        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_OPTION, true
        )

        await this.actions.waitForElement(
            ELEMENTS.TOPUP.BOTTOM_SHEET_EWALLET,
            10 * 1000
        );

        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_OPTION_ITEM(this.walletData[0]?.walletName), true
        )

        await this.actions.enterText(
            ELEMENTS.TOPUP.WALLET_DEST_NUMBER_INPUT,
            this.wd_data.bank_account,
            { withKeyboard: true }
        )
        await this.actions.clickElement(
            ELEMENTS.TOPUP.TITLE_HEADER
        );

        await this.actions.pause(2 * 1000);

        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_TOPUP_NEXT_BTN, true
        )

        let warningError = await this.actions.checkExistingElement(
            ELEMENTS.TOPUP.WALLET_DEST_CONFIRMATION
        );
        if (warningError) {

            await screenshot(this.client);

            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
        }
    }

    async processSelectedEWalletPage() {
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.WALLET_TITLE_HEADER,
            10 * 1000
        );

        await this.actions.enterText(
            ELEMENTS.TOPUP.WALLET_INPUT_AMOUNT,
            this.wd_data?.amount,
            { withKeyboard: true }
        );

        await this.actions.pause(2 * 1000);
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_TITLE_HEADER
        );
        await this.actions.pause(2 * 1000);

        let checkErrorMessage = await this.actions.checkExistingElement(
            ELEMENTS.TOPUP.WALLET_INPUT_AMOUT_ERR
        )

        if (checkErrorMessage) {
            await screenshot(this.client);

            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
        }

        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_NEXT_BTN, true
        )
    }

    async processConfirmationPage() {
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.CONFIRMATION_TITLE_HEADER,
            10 * 1000
        );

        await this.actions.pause(2 * 1000);

        console.log("Take evidence of confirmation page");
        await sendTelegram("Take evidence of confirmation page");
        await screenshot(this.client);

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
            await sendTelegram(`Transaction number ${this.wd_data?.transaction_no} can't be proceed
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
            return false;
        }

        await this.actions.clickElement(
            ELEMENTS.TOPUP.CONFIRMATION_BTN, true
        );

        await this.actions.pause(2 * 1000);
        let confirmationBottomSheet = await this.actions.checkExistingElement(
            ELEMENTS.TOPUP.WALLET_DEST_CONFIRMATION
        );

        if (confirmationBottomSheet) {
            await screenshot(this.client);

            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
            return false;
        }

        return true;
    }

    async processSummaryPage() {
        await this.actions.waitForElement(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS,
            10 * 1000
        );
        await this.actions.pause(3 * 1000);

        console.log("take summary screenshot");
        await screenshot(this.client);

        let transactionStatus = await this.actions.getText(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS
        );

        let transactionRefNo = await this.actions.getText(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_NO_REF
        );

        this.dataResponse.text = transactionStatus;
        this.dataResponse.ref_no = transactionRefNo;

        await this.actions.clickElement(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_BACK_BTN, true
        );
    }
}