import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateNetRevenue, calculatePoolAmount } from "@/lib/revenueConfig"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
        }

        const data = await request.json()
        const { instructorId, month, year } = data

        if (!instructorId || !month || !year) {
            return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 })
        }

        const selectedMonth = parseInt(month)
        const selectedYear = parseInt(year)

        // 1. Calculate the pool again for security
        const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0))
        const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999))

        const payments = await prisma.payment.findMany({
            where: {
                status: 'COMPLETED',
                subscriptionPlan: { not: null },
                createdAt: { gte: startDate, lte: endDate }
            }
        })

        let totalNetRevenue = 0
        payments.forEach(payment => {
            const net = calculateNetRevenue(payment.amount, payment.platform)
            totalNetRevenue += net
        })

        const POOL_TOTAL = calculatePoolAmount(totalNetRevenue)

        // 2. Get instructor minutes
        const completedProgress = await prisma.progress.findMany({
            where: {
                isCompleted: true,
                completedAt: { gte: startDate, lte: endDate },
                lesson: {
                    isPublished: true,
                    duration: { not: null }
                }
            },
            include: { lesson: { select: { duration: true, course: { select: { instructorId: true } } } } }
        })

        const instructorMinutes: Record<string, number> = {}
        let totalMinutes = 0
        
        completedProgress.forEach(p => {
            const instId = p.lesson.course.instructorId
            const dur = p.lesson.duration || 0
            instructorMinutes[instId] = (instructorMinutes[instId] || 0) + dur
            totalMinutes += dur
        })

        const instMinutes = instructorMinutes[instructorId] || 0
        const percentage = totalMinutes > 0 ? (instMinutes / totalMinutes) : 0
        const poolShare = percentage * POOL_TOTAL

        if (poolShare <= 0) {
            return NextResponse.json({ error: "Ödenecek tutar 0" }, { status: 400 })
        }

        // Çift ödeme koruması (server otoritedir): bu eğitmen+ay için zaten PAID kayıt
        // varsa yeni FinanceRecord oluşturma, 409 dön. UI butonu gizlese de stale sayfa /
        // çift tık / direkt istek burada engellenir.
        const existingPayout = await prisma.instructorPayout.findUnique({
            where: {
                instructorId_month_year: {
                    instructorId,
                    month: selectedMonth,
                    year: selectedYear
                }
            }
        })
        if (existingPayout && existingPayout.status === 'PAID') {
            return NextResponse.json({ error: "Bu ay için ödeme zaten yapılmış" }, { status: 409 })
        }

        // 3. Upsert Payout and Create FinanceRecord in transaction
        await prisma.$transaction(async (tx) => {
            await tx.instructorPayout.upsert({
                where: {
                    instructorId_month_year: {
                        instructorId,
                        month: selectedMonth,
                        year: selectedYear
                    }
                },
                update: {
                    poolShare,
                    totalMinutes: instMinutes,
                    percentage: percentage * 100,
                    status: 'PAID'
                },
                create: {
                    instructorId,
                    month: selectedMonth,
                    year: selectedYear,
                    poolShare,
                    totalMinutes: instMinutes,
                    percentage: percentage * 100,
                    status: 'PAID'
                }
            })

            const instructor = await tx.user.findUnique({ where: { id: instructorId } })

            await tx.financeRecord.create({
                data: {
                    type: 'EXPENSE',
                    amount: poolShare,
                    title: `Eğitmen Ödemesi: ${instructor?.name || instructorId} (${selectedMonth}/${selectedYear})`,
                    category: 'INSTRUCTOR_PAYOUT',
                    date: new Date(),
                    createdById: session.user.id
                }
            })
        })

        return NextResponse.json({ success: true, message: "Ödeme kaydedildi" })
    } catch (error) {
        console.error("Payout error:", error)
        return NextResponse.json({ error: "İşlem sırasında hata oluştu" }, { status: 500 })
    }
}
