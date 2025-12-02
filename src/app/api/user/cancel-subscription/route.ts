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

        // Aboneliği iptal et
        // Yeni Kural:
        // 1. Progress kayıtlarını SİL (Kaldığın yerden devam et gözükmesin)
        // 2. Aboneliği hemen sonlandır (My Courses ve Home'da kurslar gözükmesin)
        // 3. Enrollment kayıtlarını KORU (Kursiyer sayısı değişmesin)

        // 1. Kullanıcının tüm Progress kayıtlarını sil
        await prisma.progress.deleteMany({
            where: { userId: user.id }
        })

        // 2. Aboneliği hemen iptal et
        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionPlan: null,
                subscriptionEndDate: new Date(), // Şu an iptal (geçmiş tarih)
                subscriptionStartDate: null
            }
        })

        // NOT: Enrollment kayıtları korunur (kursiyer sayısı değişmez)

        return NextResponse.json({
            success: true,
            message: "Abonelik iptal edildi"
        })

    } catch (error) {
        console.error("Cancel subscription error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
