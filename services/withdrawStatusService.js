import { setFailedWd, setPendingWd, setProcessWd, setQueueWd, setSuccessWd } from "../clients/withdraw.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";
import { upsertCache } from "../db/cacheRepository.js";

export class WithdrawStatusService {
    async resolveNextStatus(wd_data, statementDatas = []) {
        switch (wd_data?.status) {
            case WD_STATUS.PROCESS:
                await this.validateProcessAndStatusUpdate(wd_data, statementDatas);
                break;
            case WD_STATUS.QUEUE:
                await this.validateQueueAndStatusUpdate(wd_data, statementDatas);
                break;
            case WD_STATUS.PENDING:
                await this.validatePendingAndStatusUpdate(wd_data, statementDatas);
                break;
            default:
                // give error handler here!
                break;
        }
    }

    async validateProcessAndStatusUpdate(wd_data, statement_datas) {
        if (statement_datas?.length === 1) {
            // cek statement status
            if (!statement_datas[0]?.status?.toLowerCase().includes("tidak")) {
                // berhasil = pending
                await setPendingWd({ ...wd_data, unique_code: statement_datas[0]?.ref_no });
                await upsertCache({ ...wd_data, ref_no: statement_datas[0]?.ref_no, status: WD_STATUS.PENDING });
            } else {
                // gagal = failed
                await setFailedWd(wd_data);
                await upsertCache({ ...wd_data, status: WD_STATUS.FAILED });
            }
        } else {
            if (statement_datas?.length > 1) {
                await sendTelegram(`Duplicated data found with transaction no : ${wd_data?.transaction_no}\nplease proceed with manual confirmation!`);
                await setManualWd(wd_data);
                await upsertCache({ ...wd_data, status: WD_STATUS.MANUAL });
            } else if (statement_datas?.length === 0) {
                if (wd_data?.unique_code === null) {
                    await setQueueWd(wd_data);
                    await upsertCache({ ...wd_data, status: WD_STATUS.QUEUE });
                }
            }
        }
    }

    async validateQueueAndStatusUpdate(wd_data, statementDatas = []) {
        if (statementDatas?.length > 0) {
            await this.validatePendingAndStatusUpdate(wd_data, statementDatas);
            return;
        }

        if (wd_data?.bankData?.length > 0 || wd_data?.walletData?.length > 0) {
            await setProcessWd(wd_data);
            await upsertCache({ ...wd_data, status: WD_STATUS.PROCESS });
        } else {
            await setFailedWd(wd_data, "Transaction failed because of :: bank_code not supported on Auto Payout IDR Mandiri");
            await upsertCache({ ...wd_data, status: WD_STATUS.FAILED });
        }
    }

    async validatePendingAndStatusUpdate(wd_data, statement_datas) {
        if (statement_datas?.length === 1) {
            // cek statement status
            if (!statement_datas[0]?.status?.toLowerCase().includes("tidak")) {
                // berhasil = success
                console.log("check data update success : ",
                    wd_data, statement_datas
                )
                await setSuccessWd(wd_data);
                await upsertCache({ ...wd_data, status: WD_STATUS.SUCCESS });
            } else {
                // gagal = failed
                console.log("check data update failed : ",
                    wd_data, statement_datas
                )
                await setFailedWd(wd_data);
                await upsertCache({ ...wd_data, status: WD_STATUS.FAILED });
            }
        } else {
            // go to manual
            console.log("check data update manual : ",
                wd_data, statement_datas
            )
            if (statement_datas?.length > 1) {
                await sendTelegram(`Duplicated data found with transaction no : ${wd_data?.transaction_no}\nplease proceed with manual confirmation!`);
            } else {
                await sendTelegram(`Data not found with transaction no : ${wd_data?.transaction_no}\nplease proceed with manual confirmation!`);
            }
            await setManualWd(wd_data);
            await upsertCache({ ...wd_data, status: WD_STATUS.MANUAL });
        }
    }
}