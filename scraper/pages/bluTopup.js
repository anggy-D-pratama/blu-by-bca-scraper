import { ELEMENTS } from "../../config/constants/elements.js";
import { handleElementError, screenshot, sendTelegram } from "../../helper/index.js";
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
            // 1. homepage
            // 1.1 check homepage
            await this.actions.waitForElement(
                ELEMENTS.HOMEPAGE.TRANSFER_BTN,
                10 * 1000
            );

            await this.actions.pause(3 * 1000);
            // 1.2 open ewallet 
            await this.actions.clickElement(
                ELEMENTS.HOMEPAGE.EWALLET_BTN,
                true
            )
            // 2. top-up page
            await this.processEWalletPage();
            // 3. wallet page
            await this.processSelectedEWalletPage();

            // 4. confirmation page
            await this.processConfirmationPage();

            // 4.6 submit pin
            await this.actions.pause(2 * 1000);
            await new BluAuth(this.client, this.config).submitPin();
            await this.actions.pause(3 * 1000);

            // 5. summary page
            await this.processSummaryPage();

        } catch (err) {
            await handleElementError(err, this.client);
            return this.dataResponse;
        }
        return this.dataResponse;
    }

    async processEWalletPage() {
        // 2.1 check ready ewallet page
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.TITLE_HEADER,
            10 * 1000
        );
        await this.actions.pause(3 * 1000);
        // 2.2 open ewallet selection
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_OPTION, true
        )
        // 2.3 check ready ewallet selection bottom sheet
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.BOTTOM_SHEET_EWALLET,
            10 * 1000
        );
        // 2.4 select ewallet based on name
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_OPTION_ITEM(this.walletData[0]?.walletName), true
        )
        // 2.5 input target number
        await this.actions.enterText(
            ELEMENTS.TOPUP.WALLET_DEST_NUMBER_INPUT,
            this.wd_data.bank_account,
            { withKeyboard: true }
        )
        await this.actions.clickElement(
            ELEMENTS.TOPUP.TITLE_HEADER
        );

        // 2.6 delay 2s
        await this.actions.pause(2 * 1000);
        // 2.7 click lanjut button
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_TOPUP_NEXT_BTN, true
        )
        // 2.8 check bottom sheet with keyword "cek lagi"
        let warningError = await this.actions.checkExistingElement(
            ELEMENTS.TOPUP.WALLET_DEST_CONFIRMATION
        );
        if (warningError) {
            // 2.9 if "cek lagi" exist, screenshot and send tele then back 2 times
            await screenshot(this.client);

            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
        }
    }

    async processSelectedEWalletPage() {
        // 3.1 check ready page
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.WALLET_TITLE_HEADER,
            10 * 1000
        );
        // 3.3 input ammount
        await this.actions.enterText(
            ELEMENTS.TOPUP.WALLET_INPUT_AMOUNT,
            this.wd_data?.amount,
            { withKeyboard: true }
        );
        // 3.4 delay 2s
        await this.actions.pause(2 * 1000);
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_TITLE_HEADER
        );
        await this.actions.pause(2 * 1000);
        // 3.5 check error, if any take screenshot and send tele then back 2 times
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

        // 3.6 click lanjut button
        await this.actions.clickElement(
            ELEMENTS.TOPUP.WALLET_NEXT_BTN, true
        )
    }

    async processConfirmationPage() {
        // 4.1 check page ready
        await this.actions.waitForElement(
            ELEMENTS.TOPUP.CONFIRMATION_TITLE_HEADER,
            10 * 1000
        );

        // 4.2 delay 2s
        await this.actions.pause(2 * 1000);
        // 4.3 click bayar button
        await this.actions.clickElement(
            ELEMENTS.TOPUP.CONFIRMATION_BTN, true
        );
        // 4.4 check bottom sheet with keyword "gagal"
        await this.actions.pause(2 * 1000);
        let confirmationBottomSheet = await this.actions.checkExistingElement(
            ELEMENTS.TOPUP.WALLET_DEST_CONFIRMATION
        );
        // 4.5 if "gagal" exist, take screenshot and send tele then back 3 times
        if (confirmationBottomSheet) {
            await screenshot(this.client);

            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
            await this.actions.pause(2 * 1000);
            await this.actions.back();
        }
    }

    async processSummaryPage() {
        // 5.1 check ready page
        await this.actions.waitForElement(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS,
            10 * 1000
        );
        await this.actions.pause(3 * 1000);
        // 5.2 get status transaction
        let transactionStatus = await this.actions.getText(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_STATUS
        );

        // 5.3 get refno transaction
        let transactionRefNo = await this.actions.getText(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_NO_REF
        );
        // 5.4 click kembali beranda button

        this.dataResponse.text = transactionStatus;
        this.dataResponse.ref_no = transactionRefNo;

        await this.actions.clickElement(
            ELEMENTS.TRANSACTION_SUMMARY.TRANSFER_SUMMARY_BACK_BTN, true
        );
    }
}