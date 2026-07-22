"use client"

import { useRouter } from "next/navigation"
import { TURKISH_MONTHS_LONG } from "@/lib/monthlyRevenue"

// Ay/yıl seçici — seçim değişince ANINDA URL'i günceller (Göster butonu yok).
// month DEĞERİ 0-tabanlıdır (parseMonthYearParams 0-11 bekler).
export default function MonthYearFilter({
    selectedMonth,
    selectedYear,
    years,
}: {
    selectedMonth: number // 0-11
    selectedYear: number
    years: number[]
}) {
    const router = useRouter()

    const update = (key: "month" | "year", value: string) => {
        const month = key === "month" ? value : String(selectedMonth)
        const year = key === "year" ? value : String(selectedYear)
        router.push(`?month=${month}&year=${year}`)
    }

    const selectClass =
        "bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer appearance-none"

    return (
        <div className="flex items-center gap-2">
            <select
                value={selectedMonth}
                onChange={(e) => update("month", e.target.value)}
                className={selectClass}
                style={{ backgroundImage: "none" }}
                aria-label="Ay"
            >
                {TURKISH_MONTHS_LONG.map((name, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-white">
                        {name}
                    </option>
                ))}
            </select>
            <select
                value={selectedYear}
                onChange={(e) => update("year", e.target.value)}
                className={selectClass}
                style={{ backgroundImage: "none" }}
                aria-label="Yıl"
            >
                {years.map((y) => (
                    <option key={y} value={y} className="bg-neutral-900 text-white">
                        {y}
                    </option>
                ))}
            </select>
        </div>
    )
}
