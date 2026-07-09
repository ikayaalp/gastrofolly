"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface EnrollmentChartProps {
    data: { month: string; total: number }[]
}

export default function EnrollmentChart({ data }: EnrollmentChartProps) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#737373" fontSize={12} tickLine={false} axisLine={{ stroke: "#262626" }} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={{ stroke: "#262626" }} allowDecimals={false} />
                <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #262626", borderRadius: "0.75rem", color: "#fff" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value: any) => [value, "Kayıt"]}
                />
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
