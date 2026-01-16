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

        if (!user.subscriptionPlan) {
            return NextResponse.json(
                { error: "Aktif aboneliğiniz bulunmuyor" },
                { status: 400 }
            )
        }

        if (user.subscriptionCancelled) {
            return NextResponse.json(
                { error: "Aboneliğiniz zaten iptal edilmiş" },
                { status: 400 }
            )
        }

        // Aboneliği iptal olarak işaretle (dönem sonuna kadar erişim devam eder)
        // Yeni Kural:
        // 1. subscriptionCancelled = true yap
        // 2. subscriptionEndDate'e kadar premium erişim devam eder
        // 3. Dönem sonunda cron job ile subscription temizlenecek
        // 4. Progress kayıtları KORUNUR (dönem sonuna kadar erişim var)
        // 5. Enrollment kayıtları KORUNUR (kursiyer sayısı değişmez)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionCancelled: true
            }
        })

        // Kullanıcıya güncel bilgileri döndür
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                subscriptionPlan: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                subscriptionCancelled: true
            }
        })

        const endDate = user.subscriptionEndDate
            ? new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : null

        return NextResponse.json({
            success: true,
            message: endDate
                ? `Aboneliğiniz iptal edildi. Premium erişiminiz ${endDate} tarihine kadar devam edecek.`
                : "Aboneliğiniz iptal edildi.",
            user: updatedUser
        })

    } catch (error) {
        console.error("Cancel subscription error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
