const MONTHS_ID = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06",
    Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12",
};

/**
 * Parse tanggal BLU: "12 Okt 2026 | 16:07:59 WIB" → "2026-10-12"
 * @param {string} raw
 * @returns {string|null} "YYYY-MM-DD" atau null kalau gagal
 */
export function parseBluDate(raw) {
    if (!raw) return null;

    // Ambil bagian sebelum "|" → "12 Okt 2026"
    const datePart = raw.split("|")[0].trim();
    const parts = datePart.split(" ");
    if (parts.length !== 3) return null;

    const [day, monthId, year] = parts;
    const month = MONTHS_ID[monthId];
    if (!month) return null;

    return `${year}-${month}-${day.padStart(2, "0")}`;
}

/**
 * Parse saldo: "Rp 9.236,00" → 9236
 * @param {string} raw
 * @returns {number}
 */
export function parseBluBalance(raw) {
    if (raw === 0 || raw === null || raw === undefined) return 0;

    if (typeof raw === "number") return Math.trunc(raw);

    const whole = String(raw).split(",")[0];
    const value = Number(whole.replace(/[^0-9]/g, ""));
    return Number.isFinite(value) ? Math.trunc(value) : 0;
}