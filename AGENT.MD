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
   - Cek keberadaan transaksi di statement lokal/inbox:
     - Ditemukan -> update `success` (API & local cache).
     - Belum -> rollback ke `queue` (API & local cache).
2. **Pause (10s)**
3. **`checkingPendingTransactions`**:
   - `GET /withdraw?bank_account_id={id}&status=pending`
   - Jika ada `unique_code`: cek statement berdasarkan `unique_code`. Ketemu -> `success`, tidak -> notifikasi manual.
   - Jika tanpa `unique_code`: cocokkan `remark` & `amount`.
     - 1 match: update `success`.
     - 0 match: notifikasi verifikasi manual.
     - \>1 match: notifikasi duplicate (dilarang auto-success).
4. **`getStatement` (Sync Mutasi)**:
   - Ambil transaksi terbaru via UI (Inbox / list statement), simpan/merge ke SQLite.
5. **`processQueue`**:
   - `GET /withdraw?status=queue&bank_account_id={id}`
   - `POST /withdraw/validate` dengan `{ id, transaction_no, transaction_code }`. Stop jika gagal.
   - Cek balance (jika kurang -> set `failed` + notif).
   - Set status `process` di local cache & backend.
   - Jalankan UI `payoutAction`.
   - Jika sukses: ambil reference/`unique_code`, simpan screenshot, update backend ke `pending`, simpan `ref_no` di local cache.

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
├── index.js               # Entry point, menjalankan main loop (start -> loop)
├── package.json           # Dependencies, scripts ("type": "module")
├── .env                   # Secret config: ACCOUNT_NUMBER, API_BASE_URL, PIN (gitignored)
├── local_cache.db         # SQLite file hasil generate runtime (gitignored)
├── config/
│   └── index.js           # Load dan validasi variable .env
├── db/
│   └── cache.js           # Schema builder & queries tabel `withdraw_requests` (Knex)
├── clients/
│   └── api.js             # HTTP Client (Axios) untuk GET/POST ke backend + logic retry
├── scraper/
│   ├── driver.js          # Setup Appium/WebDriverIO connection & session
│   └── blu.js             # Logic interaksi UI: getStatement, payoutAction (pindah layar, input PIN)
├── services/
│   ├── loop.js            # Orkestrator alur: checkingProcess, checkingPending, processQueue
│   └── notifier.js        # Integrasi Telegram (notif start, error, success, lampiran gambar)
├── utils/
│   ├── logger.js          # Helper log console (masking data sensitif)
│   └── ocr.js             # Integrasi sharp & tesseract (opsional)
└── test/
    └── cache.test.js      # Test DB mandiri (node:assert)
```