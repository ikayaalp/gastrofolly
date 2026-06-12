import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            )
        }

        const userId = session.user.id

        // Check if the user has an active subscription
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionReferenceCode: true,
                subscriptionCancelled: true,
                subscriptionPlan: true,
                subscriptionEndDate: true,
            }
        })

        if (!dbUser) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        if (!dbUser.subscriptionPlan || !dbUser.subscriptionReferenceCode) {
            return NextResponse.json(
                { error: "Aktif bir aboneliğiniz veya abonelik referans kodunuz bulunmuyor." },
                { status: 400 }
            )
        }

        if (dbUser.subscriptionCancelled) {
            return NextResponse.json(
                { error: "Aboneliğiniz zaten iptal edilmiş." },
                { status: 400 }
            )
        }

        // Call Iyzico API
        const { cancelSubscription } = await import("@/lib/iyzico")
        const iyzicoData = await cancelSubscription(dbUser.subscriptionReferenceCode)

        console.log("Iyzico iptal cevabı: ", iyzicoData)

        if (iyzicoData.status === 'success') {
            // Abonelik dönem süresi kontrol et
            const isExpired = !dbUser.subscriptionEndDate || 
                (dbUser.subscriptionEndDate && new Date(dbUser.subscriptionEndDate) <= new Date())

            if (isExpired) {
                // Süre zaten dolmuş - hemen FREE'ye çevir
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionPlan: null,
                        subscriptionStartDate: null,
                        subscriptionEndDate: null,
                        subscriptionReferenceCode: null,
                        subscriptionCancelled: false,
                    }
                })
                console.log(`[Iyzico Cancel] ✅ User ${userId} → FREE (süre zaten dolmuş)`)
            } else {
                // Süre hâlâ geçerli - dönem sonuna kadar erişim devam etsin
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionCancelled: true
                    }
                })
                console.log(`[Iyzico Cancel] ⚠️ User ${userId} → Cancelled (erişim ${dbUser.subscriptionEndDate} tarihine kadar devam eder)`)
            }

            return NextResponse.json({
                success: true,
                message: "Abonelik başarıyla iptal edildi."
            })
        } else {
            console.error("Iyzico abonelik iptali başarısız: ", iyzicoData)
            return NextResponse.json(
                { error: iyzicoData.errorMessage || "Ödeme sistemi tarafında bir hata oluştu." },
                { status: 400 }
            )
        }

    } catch (error: any) {
        console.error("Abonelik iptal hatası:", error)
        return NextResponse.json(
            { error: "İşlem sırasında beklenmeyen bir hata oluştu." },
            { status: 500 }
        )
    }
}
