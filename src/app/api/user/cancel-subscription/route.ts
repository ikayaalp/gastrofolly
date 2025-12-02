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
        // 1. Sadece subscriptionPlan'i null yap (Böylece yeni kursa kayıt olamaz)
        // 2. Tarihleri KORU (Böylece süresi bitene kadar izlemeye devam edebilir)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionPlan: null,
                // subscriptionStartDate ve subscriptionEndDate'e dokunmuyoruz
                // Böylece kullanıcı süresi bitene kadar haklarını kullanabilir
            }
        })

        return NextResponse.json({
            success: true,
            message: "Abonelik iptal edildi. Süreniz bitene kadar içeriklere erişebilirsiniz."
        })

    } catch (error) {
        console.error("Cancel subscription error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
