import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fenomenin kendi istatistikleri
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                referralCode: true,
                referralEarnings: {
                    select: {
                        id: true,
                        amount: true,
                        commission: true,
                        createdAt: true,
                        referredUser: {
                            select: {
                                name: true,
                                email: true,
                                image: true,
                            }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        })

        if (!user || user.role !== "INFLUENCER") {
            return NextResponse.json({ error: "Bu sayfa sadece fenomenler için" }, { status: 403 })
        }

        const totalReferrals = user.referralEarnings.length
        const totalEarnings = user.referralEarnings.reduce((sum, r) => sum + r.commission, 0)
        const totalRevenue = user.referralEarnings.reduce((sum, r) => sum + r.amount, 0)

        // Aylık verileri hesapla
        const monthlyData: Record<string, { referrals: number, earnings: number }> = {}
        user.referralEarnings.forEach(r => {
            const month = new Date(r.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })
            if (!monthlyData[month]) monthlyData[month] = { referrals: 0, earnings: 0 }
            monthlyData[month].referrals++
            monthlyData[month].earnings += r.commission
        })

        return NextResponse.json({
            referralCode: user.referralCode,
            totalReferrals,
            totalEarnings,
            totalRevenue,
            recentReferrals: user.referralEarnings.slice(0, 20),
            monthlyData
        })
    } catch (error) {
        console.error("Influencer stats error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
