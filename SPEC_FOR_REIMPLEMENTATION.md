SPEC — Implementasi Ulang (Alur & Validasi)

Tujuan
- Dokumen ini menjelaskan spesifikasi perilaku, alur, dan aturan validasi yang harus dipenuhi oleh implementasi baru.
- Fokus: memberikan cukup detail fungsional agar developer dapat menulis kode sendiri namun tetap mempertahankan alur dan validasi asli.

Prinsip desain
- Implementasi bebas memilih bahasa, framework, dan perpustakaan, asalkan:
  - Memenuhi semua langkah operasional yang dijelaskan di bawah.
  - Mematuhi kontrak API dan aturan transisi status.
  - Menghasilkan artefak observability yang sama (logs, notifikasi, screenshot, update API).

Terminologi singkat
- Withdraw: permintaan penarikan/payout dari backend.
- Status backend: `queue`, `process`, `pending`, `success`, `failed`, `manual`.
- Local cache: penyimpanan lokal minimal untuk mencatat status withdraw (dapat berupa sqlite/json/in-memory persistent).

High-level flow (urut)
1. Start
  - Muat konfigurasi akun (account id, nomor, kredensial minimal, jalur penyimpanan artifak).
  - Inisialisasi koneksi ke device (Appium atau klien UI lain) dan HTTP client untuk backend.
  - Kirim notifikasi awal (mis. Telegram) bahwa bot mulai berjalan.

2. Main loop (berulang terus)
  - A. checkingProcessTransactions
    - Panggil backend: GET /withdraw?bank_account_id={id}&status=process
    - Untuk setiap withdraw yang dikembalikan:
      - Ambil local cache untuk `transaction_no`.
      - Jika local cache status == `process`:
        - Periksa apakah transaksi sudah muncul di statement (cari `unique_code`/trxId atau remark).
          - Jika ditemukan -> tandai `success` di backend dan local cache.
          - Jika belum -> tandai `queue` di backend dan local cache.
  - B. pause (10s)
  - C. checkingPendingTransactions
    - Panggil backend: GET /withdraw?bank_account_id={id}&status=pending
    - Untuk setiap withdraw:
      - Jika `unique_code` tersedia → panggil checkPending(unique_code)
        - Dapat dipastikan tidak akan ada data duplicate jika menggunakan unique_code sebagai acuan
        - Jika ditemukan -> set `success`.
        - Jika tidak ditemukan -> kirim notifikasi untuk verifikasi manual.
      - Jika `unique_code` tidak tersedia → ambil statement dan cocokkan remark.
        - Jika 1 match -> set `success`.
        - Jika 0 match -> kirim notifikasi untuk verifikasi manual.
        - Jika >1 match -> kirim notifikasi duplicate, jangan auto-set `success`.
  - D. ambil statement via UI (getStatement)
    - Navigasi UI, ekstrak daftar transaksi terbaru, dan simpan/merge ke local DB. `statement ada 2, inbox(bisa cek detail) dan list statement(tidak bisa cek detail )`
  - E. process queue
    - Panggil Withdraw.process(): GET /withdraw?status=queue&bank_account_id={id}
    - Jika ada record:
      - POST /withdraw/validate dengan { id, transaction_no, transaction_code }.
      - Jika validasi gagal -> set backend status sesuai pesan (biasanya `failed`) dan stop processing for   that item.
      - Jika validasi sukses -> periksa balance (dari config atau getStatement), jika insufficient -> set `failed` and notify.
      - Jika ok -> simpan local cache status `process`, POST /withdraw/update status=`process`, lalu lakukan `payoutAction`.
  - F. ulangi loop

Validasi & aturan transisi (state machine)
- Valid transitions (backend status):
  - `queue` -> `process` (bot mengambil dan mulai memproses)
  - `process` -> `pending` (setelah UI menyelesaikan transfer dan reference tersedia)
  - `pending` -> `success` (setelah konfirmasi di statement)
  - any -> `failed` / `manual` (jika validasi gagal atau UI error yang memerlukan intervensi)

Untuk tiap transisi berikut validasi minimal yang harus dilakukan:
- queue -> process
  - Backend returned object must include `id`, `transaction_no`, `amount`, `remark`, `bank_account`.
  - POST /withdraw/validate must return success prior to changing status.
- process -> pending
  - After payoutAction completes, if transaction UI returns a reference/unique_code: POST /withdraw/update with unique_code and set status `pending`.
  - Save screenshot proof and update local cache with `ref_no`.
- pending -> success
  - On next getStatement / checkPending run, the statement must contain that unique_code or matching remark and amount.
  - If found, POST /withdraw/update status=`success` and update local cache.

API contracts (specification, not implementation)
- GET /withdraw
  - Query params: `bank_account_id` (int), `status` (string)
  - Response: { data: [ withdrawObject ] }
- withdrawObject fields (required by bot):
  - `id` (int)
  - `transaction_no` (string)
  - `amount` (number)
  - `remark` (string)
  - `bank_account` (string)
  - `unique_code` (string|null)
- POST /withdraw/validate
  - Payload: { id, transaction_no, transaction_code }
  - Expected response: { status: 'success' } or { status: 'error', data: 'message' }
- POST /withdraw/update
  - Examples: { id, status } or { id, unique_code } or { id, status, notes }
- GET /bank-account/daily-limit
  - Query: account_number
  - Response: { data: { total_trx, daily_limit, is_reached } }

Pola retry & toleransi waktu
- Network (GET/POST): retry up to 3 times for non-critical operations with small delay (e.g., 2s → 5s → 10s). If still failing, send notification and escalate (restart instance).
- UpdateTrxNo / critical backend updates: retry up to 6 times with increasing backoff.
- UI interactions: use explicit waits for UI elements; if element not found within reasonable timeout (e.g., 30s), treat as UI error: capture screenshot, set withdraw to `manual` or `failed`, notify, optionally restart driver.

UI interaction requirements (abstract)
- Purpose: bot must be able to perform the following UI actions on the mobile app:
  - Open mini-app list and select the transfer/send money feature.
  - Enter destination phone/account, continue.
  - Enter amount, continue.
  - Enter note/remark.
  - Confirm and enter PIN using on-screen dial pad.
  - Detect a success indicator and (if shown) extract transaction reference.

Verification rules for UI step success
- Success criteria (one of):
  - Presence of success UI element/text AND/or
  - Extraction of a transaction reference/unique_code AND/OR
  - No error messages on the UI flow and backend later confirms `pending` → `success`.

Observability & artefak yang wajib
- Logs: step-level logs for each major operation (fetch queue, validate, start payout, UI step, result, API update, errors).
- Notifications: Telegram or similar for key events: bot start, processing item, success, failed, repeated fetch failures.
- Screenshots: capture before confirmation and after confirmation (store path must be included in logs/notifications).
- Local DB entries: record withdraw_request with fields { transaction_no, status, remark, ref_no, timestamps }.

Concurrency & idempotency
- Single-instance assumption per bank_account_id is preferred. Jika multi-instance diizinkan, backend must provide locking or the bot must check a shared queue status to ensure only one instance processes an account at a time.
- Idempotency: when retrying operations, ensure repeated POST /withdraw/update or repeated payout attempts do not cause double payments. Recommended: use backend validate endpoint and local cache status to avoid duplicate payouts.

Acceptance criteria (bagian pengujian)
- Scenario A: Successful payout
  - Given backend has one withdraw with status `queue` and valid payload,
  - When bot runs, it must change status to `process`, perform UI steps, send unique_code to backend, set `pending`, then confirm on statement and set `success`.
  - Artefak: 2 screenshots, Telegram messages (processing, success), local DB updated.
- Scenario B: Network failure
  - Given backend unreachable, bot retries 3x, then sends notification and restarts instance.
- Scenario C: UI failure (element missing)
  - Given UI element isn't found, bot captures screenshot, marks withdraw `manual` (or `failed`), sends notification, and does not perform repeat payout for that withdraw.

Security & sensitive data
- Do not log full PIN or any secret tokens. Logs should record events, not secret values.
- Store any credentials or API keys in environment variables or secure vault; do not hardcode.

Environment variables & runtime config (minimal)
- ACCOUNT_NUMBER — identifier of bank account used by bot.
- API_BASE_URL — base URL for backend API.
- HEADLESS — optional flag for browser operations.
- PROXY, PROXY_USERNAME, PROXY_PASSWORD — optional proxy configuration.