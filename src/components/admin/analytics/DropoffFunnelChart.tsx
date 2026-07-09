"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DropoffFunnelChartProps {
    data: { name: string; percentage: number }[]
}

export default function DropoffFunnelChart({ data }: DropoffFunnelChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                Bu kursta yayınlanmış ders bulunmuyor.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={Math.max(280, data.length * 40)}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#737373" fontSize={12} tickLine={false} axisLine={{ stroke: "#262626" }} tickFormatter={(v) => `%${v}`} />
                <YAxis type="category" dataKey="name" stroke="#737373" fontSize={11} tickLine={false} axisLine={{ stroke: "#262626" }} width={160} />
                <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #262626", borderRadius: "0.75rem", color: "#fff" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value: any) => [`%${Number(value).toFixed(1)}`, "Tamamlanma"]}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.percentage < 40 ? "#ef4444" : entry.percentage < 70 ? "#eab308" : "#22c55e"} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
