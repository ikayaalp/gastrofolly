import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionCheckoutResult } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    return handleCallback(request)
}

export async function GET(request: NextRequest) {
    return handleCallback(request)
}

async function handleCallback(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        let token = searchParams.get('token')

        if (!token) {
            // POST body check for token
            const formData = await request.formData().catch(() => null)
            token = formData?.get('token') as string | null
        }

        if (!token) {
            console.error("Subscription callback: No token found")
            return redirectWithHtml('/subscription?error=token_missing')
        }

        return handlePayment(token)

    } catch (error) {
        console.error("Subscription callback error:", error)
        return redirectWithHtml('/subscription?error=system_error')
    }
}

async function handlePayment(token: string) {
    // 1. İyzico Subscription API v2 ile checkout sonucunu sorgula
    let subscriptionResult: any = null
    try {
        subscriptionResult = await getSubscriptionCheckoutResult(token)
        console.log('Subscription Checkout Result:', {
            token,
            status: subscriptionResult?.status,
            subscriptionStatus: subscriptionResult?.subscriptionStatus,
            referenceCode: subscriptionResult?.referenceCode,
            errorCode: subscriptionResult?.errorCode,
            errorMessage: subscriptionResult?.errorMessage
        })
    } catch (e) {
        console.error("Subscription checkout result query error:", e)
    }

    // 2. Sonuç başarısız ise
    if (!subscriptionResult || subscriptionResult.status !== "success") {
        console.error('❌ SUBSCRIPTION PAYMENT FAILED:', {
            token,
            status: subscriptionResult?.status,
            errorCode: subscriptionResult?.errorCode,
            errorMessage: subscriptionResult?.errorMessage
        })

        // PENDING ödeme kaydını FAILED olarak güncelle
        const failedPayment = await prisma.payment.findFirst({
            where: { stripePaymentId: token }
        })
        if (failedPayment && failedPayment.status === 'PENDING') {
            await prisma.payment.update({
                where: { id: failedPayment.id },
                data: { status: 'FAILED' }
            })
        }

        const errorMsg = subscriptionResult?.errorMessage || 'Abonelik ödemesi başarısız oldu'
        return redirectWithHtml(`/subscription?error=${encodeURIComponent(errorMsg)}`)
    }

    // 3. Başarılı - DB'deki ödeme kaydını bul (token ile eşleş)
    let paymentRecord = await prisma.payment.findFirst({
        where: { stripePaymentId: token }
    })

    console.log('Payment Resolution:', {
        token,
        paymentFound: !!paymentRecord,
        paymentId: paymentRecord?.id,
        subscriptionStatus: subscriptionResult.subscriptionStatus,
        subscriptionRefCode: subscriptionResult.referenceCode
    })

    if (!paymentRecord) {
        console.error("Payment record not found for token:", token)
        return redirectWithHtml('/subscription?error=payment_not_found')
    }

    // Eğer zaten COMPLETED ise tekrar işleme
    if (paymentRecord.status === 'COMPLETED') {
        return redirectWithHtml('/home?success=already_completed')
    }

    // 4. Başarılı İşlem - Ödeme kaydını güncelle
    await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
            status: 'COMPLETED',
            stripePaymentId: token
        }
    })

    // 5. Kullanıcı Aboneliğini Güncelle
    const planName = paymentRecord.subscriptionPlan
    if (planName) {
        const now = new Date()
        let endDate = new Date(now)

        if (paymentRecord.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1)
        } else if (paymentRecord.billingPeriod === '6monthly') {
            endDate.setMonth(endDate.getMonth() + 6)
        } else {
            endDate.setMonth(endDate.getMonth() + 1)
        }

        // Subscription API v2'den gelen referenceCode'u doğrudan kullan
        const subscriptionReferenceCode = subscriptionResult.referenceCode || null

        await prisma.user.update({
            where: { id: paymentRecord.userId },
            data: {
                subscriptionPlan: planName,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: endDate,
                subscriptionReferenceCode: subscriptionReferenceCode,
                subscriptionCancelled: false
            }
        })

        console.log(`✅ Subscription activated for user ${paymentRecord.userId}`, {
            plan: planName,
            endDate: endDate.toISOString(),
            subscriptionReferenceCode
        })

        // Referral komisyon kaydı oluştur
        if (paymentRecord.discountCode) {
            try {
                const influencer = await prisma.user.findFirst({
                    where: {
                        referralCode: paymentRecord.discountCode,
                        role: 'INFLUENCER' as any
                    }
                })

                if (influencer && influencer.id !== paymentRecord.userId) {
                    const commission = paymentRecord.amount * 0.10 // %10 komisyon

                    await (prisma as any).referral.create({
                        data: {
                            influencerId: influencer.id,
                            referredUserId: paymentRecord.userId,
                            paymentId: paymentRecord.id,
                            amount: paymentRecord.amount,
                            commission: commission
                        }
                    })

                    // Kullanıcının referredBy alanını güncelle
                    await prisma.user.update({
                        where: { id: paymentRecord.userId },
                        data: { referredBy: influencer.id } as any
                    })

                    console.log(`✅ Referral commission created: ₺${commission} for influencer ${influencer.id}`)
                }
            } catch (refError) {
                console.error('Referral processing error:', refError)
            }
        }
    }

    // 6. Yönlendirme
    if (paymentRecord.courseId) {
        console.log(`ℹ️ Subscription purchased via course ${paymentRecord.courseId}`)
        return redirectWithHtml(`/learn/${paymentRecord.courseId}?success=true`)
    }

    return redirectWithHtml('/home?subscription=success')
}

/**
 * HTML ile redirect helper fonksiyonu
 * İyzico callback'leri doğrudan redirect kabul etmez, HTML ile yönlendirme yapılmalıdır.
 */
function redirectWithHtml(url: string) {
    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Yönlendiriliyor...</title>
            </head>
            <body>
                <script>
                    window.location.href = '${url}';
                </script>
                <noscript>
                    <meta http-equiv="refresh" content="0; url=${url}">
                </noscript>
            </body>
        </html>
    `
    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    })
}
