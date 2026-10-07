const INDONESIAN_MONTHS = {
    januari: 1,
    februari: 2,
    maret: 3,
    april: 4,
    mei: 5,
    juni: 6,
    juli: 7,
    agustus: 8,
    september: 9,
    oktober: 10,
    november: 11,
    desember: 12,
};

function parseDateParts(value) {
    if (typeof value !== "string") {
        throw new TypeError("Date must be a string.");
    }

    const trimmedValue = value.trim();
    const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const indonesianMatch = trimmedValue.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);

    let year;
    let month;
    let day;

    if (isoMatch) {
        [, year, month, day] = isoMatch;
        year = Number(year);
        month = Number(month);
        day = Number(day);
    } else if (indonesianMatch) {
        day = Number(indonesianMatch[1]);
        month = INDONESIAN_MONTHS[indonesianMatch[2].toLowerCase()];
        year = Number(indonesianMatch[3]);
    } else {
        throw new Error(`Unsupported date format: "${value}"`);
    }

    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
        !month ||
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() + 1 !== month ||
        parsedDate.getUTCDate() !== day
    ) {
        throw new Error(`Invalid date: "${value}"`);
    }

    return { year, month, day };
}

function getNavigation(difference) {
    return {
        direction: difference > 0
            ? "next"
            : difference < 0
                ? "previous"
                : "same",
        steps: Math.abs(difference),
    };
}

export function getDateDifference(applicationDate, withdrawDate) {
    const current = parseDateParts(applicationDate);
    const target = parseDateParts(withdrawDate);
    const yearDifference = target.year - current.year;
    const monthDifference = target.month - current.month;
    const dayDifference = target.day - current.day;
    const totalMonthDifference = yearDifference * 12 + monthDifference;

    return {
        dayNavigation: getNavigation(dayDifference),
        monthNavigation: getNavigation(totalMonthDifference),
        yearNavigation: getNavigation(yearDifference),
    };
}
