import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Bu endpoint Vercel Cron veya harici bir cron servisi tarafından çağrılmalıdır
// Vercel'de cron ayarlamak için vercel.json dosyasına ekleme yapılmalıdır

export async function GET(request: NextRequest) {
    try {
        // Cron secret kontrolü (güvenlik için - ZORUNLU)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error('[Cron] CRON_SECRET is not configured!')
            return NextResponse.json(
                { error: "Server configuration error: CRON_SECRET is required" },
                { status: 500 }
            )
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Yetkisiz erişim" },
                { status: 401 }
            )
        }

        const now = new Date()

        // Süresi dolmuş abonelikleri bul ve temizle
        const expiredSubscriptions = await prisma.user.findMany({
            where: {
                subscriptionPlan: { not: null },
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

        // 2. Abonelik bilgilerini temizle
        const updatedUsers = await prisma.user.updateMany({
            where: {
                id: {
                    in: userIds
                }
            },
            data: {
                subscriptionPlan: null,
                subscriptionBillingPeriod: null,
                subscriptionStartDate: null,
                subscriptionEndDate: null,
                subscriptionCancelled: false,
                subscriptionReferenceCode: null,
            }
        })

        console.log(`[Cron] ${updatedUsers.count} abonelik temizlendi`)

        return NextResponse.json({
            success: true,
            message: "Abonelik temizliği tamamlandı",
            cleanedSubscriptionCount: updatedUsers.count
        })

    } catch (error) {
        console.error("Cron cleanup error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
