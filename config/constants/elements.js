export const ELEMENTS = Object.freeze({
    LOGIN: {
        BTN_LOGIN: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clLoginButton"]`,
    },
    HOMEPAGE: {
        NAV_HOME: `//android.widget.FrameLayout[@resource-id="com.bcadigital.blu:id/cvNavHome"]`,
        ACCOUNT_CARD: `//androidx.cardview.widget.CardView[@resource-id="com.bcadigital.blu:id/cvInformation"]`,
        TRANSFER_BTN: `//android.widget.TextView[@text="Transfer"]`,
        EWALLET_BTN: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvAction2"]`
    },
    TRANSFER: {
        NEW_DESTINATION_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnNewTransfer"]`,
        DIFF_DESTINATION_BTN: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvMenuTitle" and @text="Transfer ke Bank Lain/Proxy"]`,
        DIFF_DESTINATION_BANK_SELECT: `//android.widget.AutoCompleteTextView[@resource-id="com.bcadigital.blu:id/etInput"]`,
        DIFF_DESTINATION_BANK_OPTION: (bankName) => `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvContent" and @text="${bankName}"]`,
        DIFF_DESTINATION_ACCOUNT_INPUT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/etAccountNumber"]//android.widget.EditText[@resource-id="com.bcadigital.blu:id/etInput"]`,
        DIFF_DESTINATION_TRANSFER_CEK_BTN: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,
        TRANSFER_AMOUNT_INPUT: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/tiedAmount"]//android.widget.EditText[@resource-id="com.bcadigital.blu:id/etInput"]`,
        TRANSFER_NAME_INPUT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/tiedRecipientName"]//android.widget.EditText[@resource-id="com.bcadigital.blu:id/etInput" and @text="Nama Penerima"]`,
        TRANSFER_NOTE_INPUT: `//android.widget.EditText[@resource-id="com.bcadigital.blu:id/etInput" and @text="Catatan (Opsional)"]`,
        TRANSFER_CONFIRM_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnNext"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,
        TRANSFER_TOTAL_INFO: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTotalTransfer"]`,
        TRANSFER_CURRENT_BALANCE_INFO: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvFromBalanceAccount"]`,
        TRANSFER_BTN: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction" and @text="Transfer Sekarang"]`
    },
    TOPUP: {
        TITLE_HEADER: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle" and @text="Top Up"]`,
        WALLET_OPTION: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clEWallet"]//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/tiedProvider"]//android.widget.AutoCompleteTextView[@resource-id="com.bcadigital.blu:id/etInput"]`,
        BOTTOM_SHEET_EWALLET: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle" and @text="Pilih E-Wallet"]`,
        WALLET_OPTION_ITEM: (walletName) => `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvNameProvider" and @text="${walletName}"]`,
        WALLET_DEST_NUMBER_INPUT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/tiedPhoneNumber"]//android.widget.AutoCompleteTextView[@resource-id="com.bcadigital.blu:id/etAutoComplete"]`,
        WALLET_TOPUP_NEXT_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnNext"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,
        WALLET_DEST_CONFIRMATION: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/llBottomSheetBehavior"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle"]`,


        WALLET_TITLE_HEADER: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle"]`,
        WALLET_INPUT_AMOUNT: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/tiedAmount"]//android.widget.EditText[@resource-id="com.bcadigital.blu:id/etInput"]`,
        WALLET_INPUT_AMOUT_ERR: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/tiedAmount"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvError"]`,
        WALLET_NEXT_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnNext"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,

        CONFIRMATION_TITLE_HEADER: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle" and @text="Konfirmasi"]`,
        CONFIRMATION_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnNext"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction" and @text="Bayar"]`

    },
    TRANSACTION_SUMMARY: {
        TRANSFER_SUMMARY_STATUS: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clContainerTop"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle"]`,
        TRANSFER_SUMMARY_NO_REF: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clRef"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvNoRef"]`,
        TRANSFER_SUMMARY_BACK_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/btnSecondary"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`
    },
    STATEMENT_PAGE: {
        ACCOUNT_BALANCE: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvAccountBalance"]`,
        SHOW_ALL: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvShowAll"]`,
        HISTORY_LABEL: `//android.widget.RelativeLayout[@resource-id="com.bcadigital.blu:id/hubTrxHistoryCollapsingConstraint"]`,
        FILTER_BTN: `//android.widget.ImageButton[@resource-id="com.bcadigital.blu:id/trxHistoryButtonFilter"]`,
        FILTER_LABEL: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/trxFilterTitle"]`,
        FILTER_DATE_BTN: `//androidx.recyclerview.widget.RecyclerView[@resource-id="com.bcadigital.blu:id/trxFilterTimeRecycler"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/itemTrxFilterText" and @text="Tanggal"]`,
        FILTER_START_DATE_BTN: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/trxFilterStartDate"]/android.view.ViewGroup/android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/tilInput"]`,
        FILTER_END_DATE_BTN: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/trxFilterEndDate"]/android.view.ViewGroup/android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/tilInput"]`,
        FILTER_DATE_BOTTOM_SHEET_TITLE: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/titleDate"]`,
        FILTER_SELECTION_CHILDREN: (index) => `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clBottomSheetBehavior"]/android.widget.NumberPicker[${index}]/*`,
        FILTER_DAY_CURRENT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clBottomSheetBehavior"]/android.widget.NumberPicker[1]//android.widget.EditText[@resource-id="android:id/numberpicker_input"]`,
        FILTER_MONTH_CURRENT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clBottomSheetBehavior"]/android.widget.NumberPicker[2]//android.widget.EditText[@resource-id="android:id/numberpicker_input"]`,
        FILTER_YEAR_CURRENT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clBottomSheetBehavior"]/android.widget.NumberPicker[3]//android.widget.EditText[@resource-id="android:id/numberpicker_input"]`,
        FILTER_DATE_SUBMIT: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clButton"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,
        FILTER_OUTGOING_BALANCE: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/itemTrxFilterText" and @text="Uang keluar"]`,
        FILTER_SUBMIT_BTN: `//android.widget.LinearLayout[@resource-id="com.bcadigital.blu:id/trxFilterButton"]//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnAction"]`,

        STATEMENT_ITEMS: `//android.widget.FrameLayout[@resource-id="com.bcadigital.blu:id/cvContent"]`,

        DETAIL: {
            STATUS: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clContainerTop"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvTitle"]`,
            REF_NO: `//android.view.ViewGroup[@resource-id="com.bcadigital.blu:id/clRef"]//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvNoRef"]`,
            AMOUNT: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvText"]`,
            NOTE: `//android.widget.TextView[@resource-id="com.bcadigital.blu:id/tvNote"]`,
        }
    },
    PIN_INPUT: {
        BTN_1: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnOne"]`,
        BTN_2: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnTwo"]`,
        BTN_3: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnThree"]`,
        BTN_4: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnFour"]`,
        BTN_5: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnFive"]`,
        BTN_6: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnSix"]`,
        BTN_7: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnSeven"]`,
        BTN_8: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnEight"]`,
        BTN_9: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnNine"]`,
        BTN_0: `//android.widget.Button[@resource-id="com.bcadigital.blu:id/btnZero"]`,
    }
});