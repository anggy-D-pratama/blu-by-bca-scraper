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
        amount: 0,
        account: ""
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
    async getStatement(wd_data, state = "") {
        this.extractedDetails = [];
        this.wd_data = wd_data;
        try {
            console.log(`start checking for transaction ${wd_data.transaction_no}`);
            if (state === "init" || state === "init/exit") {
                await this.homepageFlow();
                await this.historyPageFlow();
            }
            await this.statementPageFlow();
            await this.filterPageFlow();
            await this.mapStatementPageFlow();
            if (state === "exit" || state === "init/exit") {
                await this.actions.pause(2 * 1000);
                await this.client.back()
                await this.actions.pause(2 * 1000);
                await this.client.back();
            }
        } catch (err) {
            await handleElementError(err, this.client);
            return this.extractedDetails;
        }
        return this.extractedDetails;
    }

    /**
     * Scrape transaksi terbaru di halaman mutasi tanpa filter tanggal spesifik.
     * Murni mengembalikan array data transaksi.
     * @param {number} maxTransactions
     * @returns {Promise<Array<{ref_no: string, status: string, amount: number, bank_account: string, remark: string}>>}
     */
    async getLatestStatements(maxTransactions = 20) {
        const results = [];
        try {
            console.log("Mengambil mutasi terbaru dari UI...");
            await this.homepageFlow();
            await this.historyPageFlow();

            await this.actions.waitForElement(
                ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS, 30 * 1000
            );

            let needSwipe = true;
            const processedIds = new Set();
            let oldLastTransactionId = null;

            while (needSwipe && results.length < maxTransactions) {
                const transactions = await this.actions.findElements(
                    ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS
                );

                if (!transactions || transactions.length === 0) break;

                for (const transaction of transactions) {
                    if (results.length >= maxTransactions) break;

                    const currentId = transaction.elementId;
                    if (processedIds.has(currentId)) continue;

                    await transaction.click();
                    await this.actions.waitForElement(ELEMENTS.STATEMENT_PAGE.DETAIL.STATUS, 10 * 1000);
                    await this.actions.pause(1.5 * 1000);

                    const status = await this.actions.getText(ELEMENTS.STATEMENT_PAGE.DETAIL.STATUS);
                    const ref_no = await this.actions.getText(ELEMENTS.STATEMENT_PAGE.DETAIL.REF_NO);
                    const amountStr = await this.actions.getText(ELEMENTS.STATEMENT_PAGE.DETAIL.AMOUNT);
                    const account = await this.actions.getText(ELEMENTS.STATEMENT_PAGE.DETAIL.ACCOUNT);

                    let remark = "";
                    if (await this.actions.checkExistingElement(ELEMENTS.STATEMENT_PAGE.DETAIL.NOTE)) {
                        remark = await this.actions.getText(ELEMENTS.STATEMENT_PAGE.DETAIL.NOTE);
                    }

                    results.push({
                        ref_no,
                        status,
                        amount: Number(amountStr.replace(/[^0-9]/g, "")),
                        bank_account: account.replace(/\s+/g, ""),
                        remark
                    });

                    processedIds.add(currentId);
                    await this.client.back();
                }

                if (results.length >= maxTransactions) break;

                oldLastTransactionId = transactions[transactions.length - 1].elementId;
                await swipeSmall(this.client, 0, -400);
                const nextTransactions = await this.actions.findElements(ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS);

                if (nextTransactions.length === 0 || oldLastTransactionId === nextTransactions[nextTransactions.length - 1].elementId) {
                    needSwipe = false;
                }
            }

            // Back ke homepage
            await this.actions.pause(1 * 1000);
            await this.client.back();
            await this.actions.pause(1 * 1000);
            await this.client.back();

        } catch (err) {
            await handleElementError(err, this.client);
        }
        return results;
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
            ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS,
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
        for (let index = 0; index < diff; index++) {
            let getNav = await this.actions.findElements(
                ELEMENTS.STATEMENT_PAGE.FILTER_SELECTION_CHILDREN(type)
            )
            if (direction === "previous") {
                await getNav[0]?.click();
            } else if (direction === "next") {
                await getNav[getNav?.length - 1]?.click();
            }
        }
    }

    async mapStatementPageFlow() {
        await this.actions.waitForElement(
            ELEMENTS.STATEMENT_PAGE.STATEMENT_ITEMS, 30 * 1000
        );

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

                let detailAccount = await this.actions.getText(
                    ELEMENTS.STATEMENT_PAGE.DETAIL.ACCOUNT
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
                        amount: detailAmount,
                        account: detailAccount
                    }

                    this.extractedDetails.push(this.details);

                    this.client.back();
                    return this.extractedDetails;
                } else if (this.wd_data?.unique_code === "" || this.wd_data?.unique_code === null) {
                    let remarkMatch = true;
                    if (this.wd_data?.bank_data > 0 && this.wd_data?.remark !== detailNote) {
                        remarkMatch = false;
                    }
                    if (
                        remarkMatch
                        && this.wd_data?.amount === Number(detailAmount.replace(/[^0-9]/g, ""))
                        && detailAccount.replace(/\s+/g, "").includes(this.wd_data?.bank_account)
                    ) {
                        this.details = {
                            refNo: detailRefNo,
                            status: detailStatus,
                            note: detailNote,
                            amount: detailAmount,
                            account: detailAccount
                        }
                        this.extractedDetails.push(this.details);
                    }
                }
                if (this.extractedDetails?.length > 1) {
                    this.client.back();
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