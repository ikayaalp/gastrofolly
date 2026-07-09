"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
    data: { month: string; total: number }[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#737373" fontSize={12} tickLine={false} axisLine={{ stroke: "#262626" }} />
                <YAxis
                    stroke="#737373"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "#262626" }}
                    tickFormatter={(value) => `₺${Number(value).toLocaleString('tr-TR', { notation: 'compact' })}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #262626", borderRadius: "0.75rem", color: "#fff" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, "Gelir"]}
                />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
        </ResponsiveContainer>
    )
}
