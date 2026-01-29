
import { NextRequest, NextResponse } from "next/server"
import { validateWebhookSignature, IyzicoWebhookPayload } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get("x-iyzi-signature") || ""
        const body = await request.json()

        // 1. İmza Doğrulama (Şimdilik logluyor, false dönse de işlem yapıyor sandbox kolaylığı için)
        // Production'da if (!isValid) return NextResponse.error() yapılmalı.
        const isValid = validateWebhookSignature(signature, body)

        if (!isValid) {
            console.warn("Invalid Webhook Signature", { signature, body })
            return NextResponse.json({ error: "Invalid Signature" }, { status: 403 })
        }

        const payload = body as IyzicoWebhookPayload

        console.log("Iyzico Webhook Received:", payload)

        // 2. Olay Tipine Göre İşlem
        if (payload.iyziEventType === "SUBSCRIPTION_ORDER_SUCCESS") {
            // Başarılı ödeme (Yenileme)
            const { subscriptionReferenceCode } = payload

            if (subscriptionReferenceCode) {
                // Kullanıcıyı bul
                const user = await prisma.user.findFirst({
                    where: { subscriptionReferenceCode: subscriptionReferenceCode }
                })

                if (user) {
                    console.log(`Renewing subscription for user: ${user.email}`)

                    // Süreyi uzat
                    const currentEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : new Date()
                    // Eğer süre bitmişse şimdiden başlat, bitmemişse üstüne ekle
                    const baseDate = currentEndDate > new Date() ? currentEndDate : new Date()

                    const plan = user.subscriptionPlan || "Premium"
                    const isYearly = plan.includes("Yıllık") // Plan isminden veya DB'deki period verisinden anlaşılabilir. 
                    // Ancak burada basitçe mevcut periodu koruyoruz, ya da 1 ay ekliyoruz varsayılan olarak.
                    // En doğrusu: Plan bilgisini Iyzico'dan sorgulamak ama şimdilik "Month" varsayalım veya user'ın mevcut ödeme periyoduna bakalım.

                    // Önceki ödeme kaydını bulup periyodu anlayabiliriz
                    const lastPayment = await prisma.payment.findFirst({
                        where: { userId: user.id },
                        orderBy: { createdAt: 'desc' }
                    })

                    const isYearlyPayment = lastPayment?.billingPeriod === 'yearly'

                    if (isYearlyPayment) {
                        baseDate.setFullYear(baseDate.getFullYear() + 1)
                    } else {
                        baseDate.setMonth(baseDate.getMonth() + 1)
                    }

                    // User güncelle
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            subscriptionEndDate: baseDate,
                            subscriptionCancelled: false // Otomatik ödeme alındıysa iptal değil demektir
                        }
                    })

                    // Yeni bir ödeme kaydı oluştur (Opsiyonel ama raporlama için iyi)
                    await prisma.payment.create({
                        data: {
                            amount: lastPayment?.amount || 0,
                            currency: "TRY",
                            status: "COMPLETED",
                            userId: user.id,
                            subscriptionPlan: plan,
                            billingPeriod: isYearlyPayment ? "yearly" : "monthly",
                            stripePaymentId: payload.orderReferenceCode // Iyzico Order Referansı
                        }
                    })

                    console.log("Subscription renewed successfully until:", baseDate)
                } else {
                    console.error("User not found for subscription reference:", subscriptionReferenceCode)
                }
            }
        } else if (payload.iyziEventType === "SUBSCRIPTION_CANCELED") {
            // İptal (Iyzico panelinden iptal edilirse)
            const { subscriptionReferenceCode } = payload
            if (subscriptionReferenceCode) {
                await prisma.user.updateMany({
                    where: { subscriptionReferenceCode: subscriptionReferenceCode },
                    data: { subscriptionCancelled: true }
                })
                console.log("Subscription cancelled via Webhook")
            }
        }

        return NextResponse.json({ status: "success" })

    } catch (error) {
        console.error("Webhook processing error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
