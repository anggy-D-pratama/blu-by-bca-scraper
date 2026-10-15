import { ELEMENTS } from "../../config/constants/elements.js";
import { BasePage } from "./BasePage.js";

export class BluSessionCheck extends BasePage {
    async checkSessionExpiredClue() {
        try {
            const loginBtn = await this.actions.checkExistingElement(
                ELEMENTS.LOGIN.BTN_LOGIN
            );

            if (loginBtn) {
                return true;
            }

            const checkBtmSheet = await this.actions.checkExistingElement(
                ELEMENTS.BOTTOM_SHEET
            );

            if (!checkBtmSheet) {
                return false;
            }

            const checkBtmSheetSession = await this.actions.getText(
                ELEMENTS.BOTTOM_SHEET_TITLE
            );

            if (checkBtmSheetSession &&
                (checkBtmSheetSession.toLowerCase().includes("sesi") ||
                    checkBtmSheetSession.toLowerCase().includes("session"))) {

                // Klik tombol OK/Action untuk konfirmasi sesi berakhir
                await this.actions.clickElement(
                    `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`
                );
                return true;
            }
        } catch (error) {
            console.error("Error checking bottom sheet session:", error);
        }

        return false;
    }
}