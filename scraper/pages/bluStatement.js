import { ELEMENTS } from "../../config/constants/elements.js";
import { getDateDifference } from "../../helper/dateDifference.js";
import { handleElementError, swipeSmall } from "../../helper/index.js";
import { BasePage } from "./BasePage.js";

export class BluStatement extends BasePage {
    constructor(client, config) {
        super(client, config);
    }

    extractedDetails = [];
    details = {
        refNo: "",
        status: "",
        note: "",
        amount: 0
    };

    /**
 * Menjalankan flow otomasi untuk mengambil dan mencocokkan data mutasi (statement).
 *
 * @param {Object} wd_data - Objek data withdraw untuk filter dan pencocokan.
 * @param {string} wd_data.updated_at - Tanggal transaksi untuk filter navigasi tanggal.
 * @param {string} [wd_data.unique_code] - Kode unik/referensi transaksi (prioritas pencocokan utama).
 * @param {string} [wd_data.remark] - Catatan transaksi (fallback jika unique_code kosong).
 * @param {number|string} [wd_data.amount] - Nominal transaksi (fallback pencocokan).
 * @param {string} [wd_data.bank_account] - Nomor rekening tujuan (fallback pencocokan).
 * @returns {Promise<Array<{refNo: string, status: string, note: string, amount: string}>>} Array dari detail transaksi yang cocok.
 */
    async getStatement(wd_data) {
        this.wd_data = wd_data;
        try {
            await this.homepageFlow();
            await this.historyPageFlow();
            await this.statementPageFlow();
            await this.filterPageFlow();
            await this.mapStatementPageFlow();
        } catch (err) {
            await handleElementError(err, this.client);
            return this.extractedDetails;
        }
        return this.extractedDetails;
    }

    async homepageFlow() {
        await this.actions.waitForElement(
            ELEMENTS.HOMEPAGE.ACCOUNT_CARD,
            10 * 1000
        );

        await this.actions.pause(3 * 1000);

        await this.actions.clickElement(
            ELEMENTS.HOMEPAGE.ACCOUNT_CARD, true
        );
    }

    async historyPageFlow() {
        await this.actions.waitForElement(
            ELEMENTS.STATEMENT_PAGE.ACCOUNT_BALANCE,
            10 * 1000
        );

        await this.actions.pause(2 * 1000);

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.SHOW_ALL, true
        );
    }

    async statementPageFlow() {
        await this.actions.waitForElement(
            ELEMENTS.STATEMENT_PAGE.HISTORY_LABEL,
            30 * 1000
        );

        await this.actions.pause(2 * 1000);

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_BTN, true
        );
    }

    async filterPageFlow() {
        await this.actions.waitForElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_LABEL,
            10 * 1000
        );

        await this.actions.pause(2 * 1000);

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_DATE_BTN, true
        );

        await this.navigateDates();

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_OUTGOING_BALANCE, true
        )

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_SUBMIT_BTN, true
        )
    }

    async navigateDates() {
        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_START_DATE_BTN, true
        );

        let startDate = await this.extractCurrentDates();

        let diffDate = getDateDifference(startDate, this.wd_data.updated_at);

        await this.navigateFilterDate(1, diffDate?.dayNavigation?.steps, diffDate?.dayNavigation?.direction);
        await this.navigateFilterDate(2, diffDate?.monthNavigation?.steps, diffDate?.monthNavigation?.direction);
        await this.navigateFilterDate(3, diffDate?.yearNavigation?.steps, diffDate?.yearNavigation?.direction);

        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_DATE_SUBMIT
        );

        await this.actions.pause(3 * 1000);
        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_END_DATE_BTN, true
        );

        let endDate = await this.extractCurrentDates();
        diffDate = getDateDifference(endDate, this.wd_data.updated_at);

        await this.navigateFilterDate(1, diffDate?.dayNavigation?.steps, diffDate?.dayNavigation?.direction);
        await this.navigateFilterDate(2, diffDate?.monthNavigation?.steps, diffDate?.monthNavigation?.direction);
        await this.navigateFilterDate(3, diffDate?.yearNavigation?.steps, diffDate?.yearNavigation?.direction);
        await this.actions.clickElement(
            ELEMENTS.STATEMENT_PAGE.FILTER_DATE_SUBMIT
        );
    }

    async extractCurrentDates() {
        let date = await this.actions.getText(
            ELEMENTS.STATEMENT_PAGE.FILTER_DAY_CURRENT
        );
        let month = await this.actions.getText(
            ELEMENTS.STATEMENT_PAGE.FILTER_MONTH_CURRENT
        );
        let year = await this.actions.getText(
            ELEMENTS.STATEMENT_PAGE.FILTER_YEAR_CURRENT
        );

        return `${date} ${month} ${year}`;
    }

    async navigateFilterDate(type, diff, direction) {
        let dirc = 0;
        switch (direction) {
            case "previous":
                dirc = 0;
                break;
            case "next":
                dirc = 2;
                break;
            default:
                dirc = 1;
                break;
        }

        for (let index = 0; index < diff; index++) {
            let getNav = await this.actions.findElements(
                ELEMENTS.STATEMENT_PAGE.FILTER_SELECTION_CHILDREN(type)
            )
            await getNav[dirc]?.click();
        }
    }

    async mapStatementPageFlow() {
        // 5. statement page
        await this.actions.waitForElement(
            ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS, 10 * 1000
        );

        // 5.1 get collection of transactions
        let needSwipe = true;
        const processedIds = new Set();
        let oldLastTransactionId = {};
        while (needSwipe > 0) {
            console.log("get all transactions on screen");
            let transactions = await this.actions.findElements(
                ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS
            );

            if (transactions?.length === 0) {
                console.log("No transaction found!");
                return this.extractedDetails;
            }

            for (let [index, transaction] of transactions.entries()) {
                let currentId = transaction.elementId;

                if (processedIds.has(currentId)) {
                    continue;
                }

                console.log("check detail index : ", index);

                await transaction.click();

                await this.actions.waitForElement(
                    ELEMENTS.STATEMENT_PAGE.DETAIL.STATUS, 10 * 1000
                );

                await this.actions.pause(2 * 1000);

                let detailStatus = await this.actions.getText(
                    ELEMENTS.STATEMENT_PAGE.DETAIL.STATUS
                );

                let detailRefNo = await this.actions.getText(
                    ELEMENTS.STATEMENT_PAGE.DETAIL.REF_NO
                );

                let detailAmount = await this.actions.getText(
                    ELEMENTS.STATEMENT_PAGE.DETAIL.AMOUNT
                );

                let detailNote = "";
                if (await this.actions.checkExistingElement(ELEMENTS.STATEMENT_PAGE.DETAIL.NOTE)) {
                    detailNote = await this.actions.getText(
                        ELEMENTS.STATEMENT_PAGE.DETAIL.NOTE
                    );
                }

                processedIds.add(currentId);

                if (this.wd_data?.unique_code !== "" && this.wd_data?.unique_code === detailRefNo) {
                    // break the function and return data
                    this.details = {
                        refNo: detailRefNo,
                        status: detailStatus,
                        note: detailNote,
                        amount: detailAmount
                    }

                    this.extractedDetails.push(this.details);
                    return this.extractedDetails;
                }

                this.client.back();
            }

            oldLastTransactionId = transactions[transactions?.length - 1].elementId;
            await swipeSmall(this.client, 0, -400);
            transactions = await this.actions.findElements(
                ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS
            );
            if (oldLastTransactionId === transactions[transactions?.length - 1].elementId) {
                needSwipe = false;
            }
        }

        return this.extractedDetails;
    }
}