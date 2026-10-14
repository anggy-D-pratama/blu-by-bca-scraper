// Utilitas tanggal/saldo bank-specific sebaiknya diletakkan di mapper bank masing-masing.
// File ini disediakan sebagai tempat util umum bila diperlukan.

/**
 * Parse tanggal BLU: "12 Okt 2026 | 16:07:59 WIB" → "2026-10-12"
 * @param {string} raw
 * @returns {string|null} "YYYY-MM-DD" atau null kalau gagal
 */


/**
 * Parse saldo: "Rp 9.236,00" → 9236
 * @param {string} raw
 * @returns {number}
 */
