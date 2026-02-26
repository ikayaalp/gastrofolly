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
        const API_KEY = process.env.IYZICO_API_KEY
        const SECRET_KEY = process.env.IYZICO_SECRET_KEY
        const BASE_URL = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com"

        if (!API_KEY || !SECRET_KEY) {
            console.error("Iyzico API anahtarları eksik.")
            return NextResponse.json(
                { error: "Ödeme sistemi yapılandırma hatası" },
                { status: 500 }
            )
        }

        // Cancel sub from Iyzico API v2
        const iyzicoResponse = await fetch(`${BASE_URL}/v2/subscription/subscriptions/${dbUser.subscriptionReferenceCode}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString('base64')}`,
                'Content-Type': 'application/json',
            }
        })

        const iyzicoData = await iyzicoResponse.json()
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
