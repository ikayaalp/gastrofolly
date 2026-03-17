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
            // Update DB to mark as cancelled
            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionCancelled: true
                }
            })

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
