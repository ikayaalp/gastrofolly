import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Bu endpoint Vercel Cron veya harici bir cron servisi tarafından çağrılmalıdır
// Vercel'de cron ayarlamak için vercel.json dosyasına ekleme yapılmalıdır

export async function GET(request: NextRequest) {
    try {
        // Cron secret kontrolü (güvenlik için)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Yetkisiz erişim" },
                { status: 401 }
            )
        }

        const now = new Date()

        // İptal edilmiş ve süresi dolmuş abonelikleri bul
        const expiredSubscriptions = await prisma.user.findMany({
            where: {
                subscriptionCancelled: true,
                subscriptionEndDate: {
                    lt: now
                }
            },
            select: {
                id: true,
                email: true,
                subscriptionPlan: true,
                subscriptionEndDate: true
            }
        })

        if (expiredSubscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Temizlenecek abonelik bulunamadı",
                cleanedCount: 0
            })
        }

        const userIds = expiredSubscriptions.map(user => user.id)

        // 1. İlgili kullanıcıların Progress kayıtlarını sil
        const deletedProgress = await prisma.progress.deleteMany({
            where: {
                userId: {
                    in: userIds
                }
            }
        })

        // 2. Abonelik bilgilerini temizle
        const updatedUsers = await prisma.user.updateMany({
            where: {
                id: {
                    in: userIds
                }
            },
            data: {
                subscriptionPlan: null,
                subscriptionStartDate: null,
                subscriptionEndDate: null,
                subscriptionCancelled: false
            }
        })

        console.log(`[Cron] ${updatedUsers.count} abonelik temizlendi, ${deletedProgress.count} progress kaydı silindi`)

        return NextResponse.json({
            success: true,
            message: `${updatedUsers.count} abonelik başarıyla temizlendi`,
            cleanedCount: updatedUsers.count,
            deletedProgressCount: deletedProgress.count,
            cleanedUsers: expiredSubscriptions.map(u => ({
                email: u.email,
                plan: u.subscriptionPlan,
                endDate: u.subscriptionEndDate
            }))
        })

    } catch (error) {
        console.error("Cron cleanup error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
