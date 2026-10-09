# AGENT.MD — blu Automation & Scraper

## Overview & Scope
Project ini bertugas mengotomasi proses payout/withdraw dan scraping mutasi (statement) pada aplikasi blu (BCA Digital) berbasis Appium/WebDriverIO, terintegrasi dengan REST API backend dan Telegram bot.

---

## Architecture & Technology Stack
- **Runtime:** Node.js (ES Modules, `"type": "module"`).
- **Automation / Driver:** Appium + WebDriverIO (`appium-uiautomator2-driver`).
- **Local Storage:** SQLite3 via `knex` (`./local_cache.db`).
- **HTTP Client:** `axios` (retry with exponential backoff).
- **Image Processing / OCR:** `sharp`, `tesseract.js` (jika parsing bukti transaksi via gambar diperlukan).

---

## State Machine & Flow Rules

### 1. Status Lifecycle
`queue` -> `process` -> `pending` -> `success`
Transitions to `failed` or `manual` can occur from any state on unrecoverable validation/UI errors.

### 2. Main Loop Sequence
1. **`checkingProcessTransactions`**:
   - `GET /withdraw?bank_account_id={id}&status=process`
   - Ambil data dari local cache via `transaction_no`.
   - Cek keberadaan transaksi via UI Scraper mutasi/inbox:
     - Ditemukan -> update `pending` (API & local cache), dengan membawa ref_no.
     - Belum -> rollback ke `queue` (API & local cache) jika `unique_code` null.
2. **Pause (10s)**
3. **`checkingPendingTransactions`**:
   - `GET /withdraw?bank_account_id={id}&status=pending`
   - Cek dan sinkronisasikan mutasi via UI berdasarkan transaksi dengan status pending:
     - Ditemukan (Status di UI tidak mengandung kata "tidak") -> update `success`.
     - Tidak Ditemukan -> notifikasi manual (`manual`).
     - Gagal di UI (Misal: "Transaksi tidak berhasil") -> update `failed`.
     - \>1 match di UI: notifikasi duplicate dan arahkan ke konfirmasi `manual`.
4. **`getStatement` (Sync Mutasi)**:
   - Ambil transaksi terbaru via UI (Inbox / list statement), simpan/merge ke SQLite.
5. **`processQueue`**:
   - `GET /withdraw?status=queue&bank_account_id={id}`
   - Idempotency guard: cek local cache via `transaction_no` (skip jika sudah `process`, `pending`, atau `success`).
   - Cek mutasi lokal SQLite (jika ada match -> update status, skip transfer).
   - `POST /withdraw/validate` dengan `{ id, transaction_no, transaction_code }`. Stop jika gagal.
   - Cek limit harian (`GET /bank-account/daily-limit`).
   - Set status `process` di local cache & backend.
   - Jalankan UI `payoutAction`.
   - Cek balance & biaya transfer di UI pada halaman konfirmasi:
     - Jika saldo kurang -> batalkan alur (back navigasi), set `failed` + alert Telegram.
   - Jika sukses transfer: ambil reference/`unique_code`, simpan screenshot, update backend ke `pending`, simpan `ref_no` di local cache.

---

## Local Cache Schema (`sqlite3` / `knex`)

Tabel: `withdraw_requests`
- `transaction_no` (STRING, PRIMARY KEY)
- `status` (STRING) — `queue`, `process`, `pending`, `success`, `failed`, `manual`
- `remark` (STRING)
- `ref_no` (STRING, nullable)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

---

## API Endpoints Contract
- `GET /withdraw?bank_account_id={id}&status={status}`
- `POST /withdraw/validate` payload: `{ id, transaction_no, transaction_code }`
- `POST /withdraw/update` payload: `{ id, status }` | `{ id, unique_code }` | `{ id, status, notes }`
- `GET /bank-account/daily-limit?account_number={account}`

---

## Safety & Operational Guardrails
1. **Idempotency & Double-Transfer Prevention:**
   - Cek local cache sebelum memulai eksekusi UI transfer baru.
   - Validasi backend harus bernilai sukses sebelum memicu input PIN.
2. **Retry Strategy:**
   - Non-critical API: Retry 3x (delay: 2s -> 5s -> 10s).
   - Critical API update: Retry 6x with exponential backoff.
   - UI Timeout: Max 30 detik untuk target selector. Jika timeout, capture screenshot, tandai `manual`/`failed`, kirim notifikasi. Jangan auto-retry payout yang sama.
3. **Sensitive Data:**
   - Dilarang keras melakukan logging PIN blu atau token rahasia ke stdout maupun file logs.
   - Simpan kredensial hanya di `.env`.
4. **Observability Artifacts:**
   - Ambil screenshot sebelum konfirmasi transfer dan setelah transfer sukses.
   - Simpan path screenshot dan lampirkan di log / notifikasi Telegram.

---

## Coding Standards (Lazy Senior Rules)
- Gunakan native Node.js API atau dependency yang sudah terinstall di `package.json`.
- Hindari boilerplate berlebih; tulis fungsi minimal yang bekerja sesuai kontrak.
- Gunakan async/await bersih untuk operasi DB dan HTTP.
- Testing: Sertakan minimal satu runnable test mandiri menggunakan native `node:assert`.

---

## Directory Structure
```text
.
├── index.js                               # Entry point
├── package.json                           # Dependencies, scripts ("type": "module")
├── .env                                   # Secret config: ACCOUNT_NUMBER, API_BASE_URL, PIN (gitignored)
├── local_cache.db                         # SQLite file hasil generate runtime (gitignored)
├── app/
│   └── botRunner.js                       # Main loop orchestrator
├── config/
│   ├── index.js                           # Load dan validasi variable .env
│   ├── axios.js                           # Custom Axios instance
│   └── constants/                         # Selector UI & konstanta status
│       ├── elements.js
│       ├── withdrawStatus.js
│       ├── bankData.json
│       └── walletData.json
├── db/
│   ├── connection.js                      # Schema builder & SQLite connection (Knex)
│   └── cacheRepository.js                 # Query tabel withdraw_requests
├── clients/
│   ├── withdraw.js                        # Endpoint /withdraw, /validate, /update + retry logic
│   └── bankAccount.js                     # Endpoint /bank-account/daily-limit + retry logic
├── scraper/
│   ├── appiumClient.js                    # Inisialisasi Appium driver
│   ├── client.js                          # Driver session manager
│   ├── start.js                           # Script lifecycle scraper
│   └── pages/                             # Page Object Model
│       ├── BasePage.js
│       ├── bluAuth.js                     # Login & input PIN
│       ├── bluTransfer.js                 # Alur payout/transfer
│       ├── bluStatement.js                # Scraping mutasi
│       └── bluTopup.js                    # Alur e-wallet/topup
├── services/
│   ├── withdrawService.js                 # Orkestrasi processQueue
│   ├── withdrawStatusService.js           # Orkestrasi checkingProcessTransactions
│   ├── withdrawReconciliationService.js   # Orkestrasi checkingPendingTransactions
│   └── getStatementService.js             # Orkestrasi getStatement (sync mutasi)
├── helper/
│   ├── logger.js                          # Helper log console (masking data sensitif)
│   ├── appiumHelpers.js                   # UI selector & wait helpers
│   ├── retry.js                           # Retry wrapper (exponential backoff & delays)
│   └── dateDifference.js
└── test/
    ├── cache.test.js                      # Test DB mandiri (node:assert)
    └── test/config.test.js                # Test validasi config
```