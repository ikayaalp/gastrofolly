import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        // Aboneliği iptal et (Planı ve tarihleri sıfırla)
        // Not: Gerçek bir abonelik sistemi (recurring payment) olsaydı,
        // burada ödeme sağlayıcısına (Iyzico) iptal isteği göndermemiz gerekirdi.
        // Şu anki sistemde 30 günlük tek seferlik ödeme olduğu için
        // sadece veritabanındaki abonelik bilgisini siliyoruz.

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionPlan: null,
                subscriptionStartDate: null,
                subscriptionEndDate: null
            }
        })

        return NextResponse.json({
            success: true,
            message: "Abonelik başarıyla iptal edildi"
        })

    } catch (error) {
        console.error("Cancel subscription error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
