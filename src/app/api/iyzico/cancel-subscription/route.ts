
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cancelSubscription } from "@/lib/iyzico"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || !user.subscriptionReferenceCode) {
            return NextResponse.json({ error: "Aktif bir abonelik bulunamadı" }, { status: 404 })
        }

        // Iyzico üzerinden iptal et
        const result = await cancelSubscription(user.subscriptionReferenceCode)

        if (result.status !== "success") {
            console.error("Iyzico cancel error:", result)
            return NextResponse.json({
                error: result.errorMessage || "İptal işlemi başarısız oldu"
            }, { status: 400 })
        }

        // DB'de güncelle - Sadece iptal bayrağını işaretle, tarihi silme
        await prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionCancelled: true
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Cancel subscription error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
