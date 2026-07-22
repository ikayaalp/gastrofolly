"use client"

import { useRouter } from "next/navigation"
import { Calendar } from "lucide-react"
import { TURKISH_MONTHS_LONG } from "@/lib/monthlyRevenue"

// Ay/yıl seçici — seçim değişince ANINDA URL'i günceller (Filtrele butonu yok).
// Native <select> option'ları koyu arka planla stillenir ki okunabilsin.
export default function PoolMonthFilter({
    selectedMonth,
    selectedYear,
    years,
}: {
    selectedMonth: number // 1-12
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
        "bg-neutral-900 text-white text-sm outline-none cursor-pointer rounded-md px-1 py-0.5"

    return (
        <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select
                value={selectedMonth}
                onChange={(e) => update("month", e.target.value)}
                className={selectClass}
                aria-label="Ay"
            >
                {TURKISH_MONTHS_LONG.map((name, i) => (
                    <option key={i + 1} value={i + 1} className="bg-neutral-900 text-white">
                        {name}
                    </option>
                ))}
            </select>
            <span className="text-gray-500 mx-2">/</span>
            <select
                value={selectedYear}
                onChange={(e) => update("year", e.target.value)}
                className={selectClass}
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
