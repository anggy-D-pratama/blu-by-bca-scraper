import { writeFile } from "node:fs/promises";
import { ELEMENTS } from "../../config/constants/elements.js";
import { handleElementError } from "../../helper/index.js";
import { BasePage } from "./BasePage.js";

export class BluAuth extends BasePage {
    async login() {
        try {
            await this.actions.waitForElement(
                ELEMENTS.LOGIN.BTN_LOGIN,
                30 * 1000
            );

            await this.actions.clickElement(
                ELEMENTS.LOGIN.BTN_LOGIN,
                true
            )
        } catch (err) {
            await handleElementError(err, this.client);
            return false;
        }

        return true;
    }

    async submitPin() {
        try {
            await this.actions.pause(2 * 1000);
            let pin = this.config.safe_key;
            let splitPin = pin.split("");
            if (splitPin.length !== 6) {
                throw new Error("PIN must be 6 digits long.");
            }

            console.log("🔄 Submitting PIN...");
            for (let digit of splitPin) {
                const buttonSelector = ELEMENTS.PIN_INPUT[`BTN_${digit}`];
                await this.actions.waitForElement(
                    buttonSelector,
                    5 * 1000
                );
                await this.actions.clickElement(
                    buttonSelector
                );
            }
        } catch (err) {
            await handleElementError(err, this.client);
            return false;
        }
        return true;
    }
}