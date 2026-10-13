# BLU by BCA Mobile Scraper

Project scraper Android untuk mengambil data dari aplikasi BLU by BCA Mobile menggunakan Appium dan WebdriverIO, lalu menyinkronkan data ke backend melalui API.

## Stack

- Node.js
- Appium
- WebdriverIO
- Android UIAutomator2
- Knex + SQLite (local cache)
- Axios (HTTP client ke backend)
- @payscrap/actions (helper aksi Appium)

## Purpose

Aplikasi ini bertujuan untuk:

1. Login otomatis ke aplikasi BLU.
2. Membaca riwayat mutasi/statement terbaru.
3. Melakukan normalisasi data statement.
4. Mengirim data statement ke backend melalui `POST /bank-transactions/bulk`.
5. Menyimpan cache lokal di SQLite dengan flag `is_synced` agar hanya data unsynced yang dikirim.
6. Memproses antrean withdraw/transfer/topup dari backend.
7. Rekonsiliasi transaksi pending/process.

## Struktur Aplikasi

```text
.
├── app/
│   └── botRunner.js               # Orchestrator utama & main loop
├── clients/                       # HTTP client ke backend
│   ├── bankAccount.js
│   ├── bankTransaction.js
│   └── withdraw.js
├── config/
│   ├── axios.js                   # Axios instance & interceptor signature
│   ├── bankAdapter.js             # Loader adapter bank
│   ├── banks/
│   │   └── blu/
│   │       ├── adapter.js         # Registry class page & mapper BLU
│   │       └── elements.js        # Selector BLU
│   ├── constants/
│   │   ├── bankData.json
│   │   ├── elements.js            # Selector global (legacy, disarankan pakai per bank)
│   │   ├── statementType.js
│   │   ├── walletData.json
│   │   └── withdrawStatus.js
│   └── index.js                   # Konfigurasi dari .env / argv
├── db/
│   ├── connection.js              # Koneksi SQLite & migrasi tabel
│   └── cacheRepository.js         # Query cache statement & withdraw
├── helper/
│   ├── appiumHelpers.js
│   ├── dateDifference.js
│   ├── dateFormatter.js           # Tempat util umum (parser bank pindah ke mapper bank)
│   ├── index.js
│   ├── logger.js
│   └── retry.js
├── scraper/
│   ├── appiumClient.js            # Lifecycle Appium & aktivasi aplikasi
│   ├── client.js                  # Open session WebdriverIO
│   ├── pages/
│   │   ├── BasePage.js
│   │   ├── contracts.js           # Kontrak data page object
│   │   ├── bluAuth.js
│   │   ├── bluStatement.js
│   │   ├── bluTransfer.js
│   │   └── bluTopup.js
│   └── start.js                   # Entrypoint startup & load adapter bank
├── services/
│   ├── getStatementService.js     # Sinkron statement lokal & backend
│   ├── statementMapper.js         # Mapper statement BLU
│   ├── withdrawReconciliationService.js
│   ├── withdrawService.js
│   └── withdrawStatusService.js
├── index.js
├── package.json
└── README.md
```

## Alur Kerja

```text
start.js
  -> loadBankAdapter()
  -> BotRunner(config, bankAdapter)
    -> Appium start
    -> AuthPage login & submit PIN
    -> mainLoop:
       - check process transactions
       - check pending transactions
       - sync latest statements
       - process queue withdraw
```

## Cara Menambah Bank Baru

### 1. Buat folder adapter bank

Buat folder baru di bawah `config/banks/` sesuai kode bank.

```text
config/banks/<bankcode>/
├── adapter.js
└── elements.js
```

### 2. Buat file selector

`config/banks/<bankcode>/elements.js`

```js
export const ELEMENTS = {
  LOGIN: {
    BTN_LOGIN: `//android.widget.Button[@resource-id="id.co.bankbaru:id/btnLogin"]`,
  },
  HOMEPAGE: {
    ACCOUNT_CARD: `//android.widget.LinearLayout[@resource-id="id.co.bankbaru:id/cardAccount"]`,
  },
  PIN_INPUT: {
    BTN_1: `//android.widget.Button[@resource-id="id.co.bankbaru:id/btn1"]`,
    // ... sesuaikan
  },
  STATEMENT_PAGE: {
    ACCOUNT_BALANCE: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvBalance"]`,
    STATEMENT_ITEMS: `//android.widget.FrameLayout[@resource-id="id.co.bankbaru:id/cvContent"]`,
    DETAIL: {
      STATUS: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvStatus"]`,
      REF_NO: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvRef"]`,
      AMOUNT: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvAmount"]`,
      NOTE: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvNote"]`,
      ACCOUNT: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvAccount"]`,
      TRANSACTION_DATE: `//android.widget.TextView[@resource-id="id.co.bankbaru:id/tvDate"]`,
    },
  },
  // ... sesuaikan semua kebutuhan halaman aplikasi
};
```

### 3. Buat page object

Buat file page object di `scraper/pages/` untuk bank baru. Contoh `scraper/pages/bankLainAuth.js`, `bankLainStatement.js`, `bankLainTransfer.js`, `bankLainTopup.js`.

Page object harus mengikuti kontrak di `scraper/pages/contracts.js`.

#### Kontrak statement page

Method untuk statement bulk harus mengembalikan:

```js
{
  current_balance: "Rp 9.236,00",
  statements: [
    {
      ref_no: "",
      status: "",
      amount: "",
      bank_account: "",
      remark: "",
      transaction_date: ""
    }
  ]
}
```

#### Kontrak transfer/topup page

Method transfer/topup harus mengembalikan:

```js
{
  text: "Transaksi Berhasil",
  ref_no: "reference-no"
}
```

Flow boleh berbeda; yang penting output raw data sesuai kontrak.

### 4. Buat mapper statement bank

Buat file mapper bank, misalnya `services/statementMapperBankLain.js`.

Mapper harus mengembalikan payload standar:

```js
{
  transaction_date: "2026-10-12",
  value_date: "2026-10-12",
  description: "note | 100000 | 2026-10-12",
  amount: 100000,
  balance: 9236,
  begin_balance: 109236,
  is_balance_out: true,
  source: "Other",
  method_type: "BANK_LAIN",
  utr: "reference-no",
  transaction_code: "reference-no",
  bank_account_id: 123
}
```

Parser tanggal/nominal dibuat lokal di mapper bank, jangan menambah parser global di `helper/dateFormatter.js`.

### 5. Buat adapter bank

`config/banks/<bankcode>/adapter.js`

```js
import { BankLainAuth } from "../../../scraper/pages/bankLainAuth.js";
import { BankLainStatement } from "../../../scraper/pages/bankLainStatement.js";
import { BankLainTransfer } from "../../../scraper/pages/bankLainTransfer.js";
import { BankLainTopup } from "../../../scraper/pages/bankLainTopup.js";
import { mapBankLainStatements } from "../../../services/statementMapperBankLain.js";
import { ELEMENTS } from "./elements.js";

export default {
  appPackage: "id.co.banklain.mobile",
  appActivity: "id.co.banklain.ui.start.SplashActivity",
  AuthPage: BankLainAuth,
  StatementPage: BankLainStatement,
  TransferPage: BankLainTransfer,
  TopupPage: BankLainTopup,
  mapStatements: mapBankLainStatements,
  elements: ELEMENTS,
};
```

### 6. Jalankan dengan kode bank baru

```bash
BANKCODE=bank-lain node index.js
```

atau

```bash
node index.js <account_number> bank-lain
```

## Menjalankan Project

```bash
npm install

# sesuaikan .env
cp .env.example .env

# jalankan
node index.js
```

Pastikan:

- Appium server terinstall.
- Device Android terkoneksi dan USB debugging aktif.
- App bank target terinstall di device.
- Kredensial API backend sudah benar di `.env`.
