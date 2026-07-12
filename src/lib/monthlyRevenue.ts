// Server-only utility — no "use client"

/** Grafiklerde gösterilen en erken ay: Nisan 2026 */
export const CHART_DATA_START = Date.UTC(2026, 3, 1) // 1 Nisan 2026

export const TURKISH_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const TURKISH_MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

/**
 * Converts raw SQL rows (DATE_TRUNC results) into a 12-month series
 * ordered from oldest to newest, filling missing months with 0.
 */
export function buildMonthlySeries(rows: { month: Date; total: number }[]) {
    const totalsByKey = new Map<string, number>()
    for (const row of rows) {
        const d = new Date(row.month)
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
        totalsByKey.set(key, Number(row.total) || 0)
    }

    const series: { month: string; total: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
        const isBeforeStart = d.getTime() < CHART_DATA_START
        series.push({
            month: TURKISH_MONTHS[d.getUTCMonth()],
            total: isBeforeStart ? 0 : (totalsByKey.get(key) || 0),
        })
    }
    return series
}

/**
 * Parses `month` and `year` searchParams strings into validated, clamped values.
 * - month: 0-indexed (0 = Ocak, 11 = Aralık), falls back to current UTC month
 * - year: must be >= 2020, falls back to current UTC year
 * - isCurrentMonth: true when the selection matches the current UTC month+year
 */
export function parseMonthYearParams(
    monthParam: string | undefined,
    yearParam: string | undefined
): { selectedMonth: number; selectedYear: number; isCurrentMonth: boolean } {
    const now = new Date()
    const parsedMonth = monthParam !== undefined ? parseInt(monthParam, 10) : undefined
    const parsedYear = yearParam !== undefined ? parseInt(yearParam, 10) : undefined
    const selectedMonth =
        parsedMonth !== undefined && parsedMonth >= 0 && parsedMonth <= 11
            ? parsedMonth
            : now.getUTCMonth()
    const selectedYear =
        parsedYear && parsedYear >= 2020 ? parsedYear : now.getUTCFullYear()
    const isCurrentMonth =
        selectedMonth === now.getUTCMonth() && selectedYear === now.getUTCFullYear()
    return { selectedMonth, selectedYear, isCurrentMonth }
}
