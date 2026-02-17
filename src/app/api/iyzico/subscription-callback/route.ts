import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm, getSubscriptionCheckoutResult } from "@/lib/iyzico"
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
        const token = searchParams.get('token')

        if (!token) {
            // POST body check for token
            const formData = await request.formData().catch(() => null)
            const tokenFromForm = formData?.get('token') as string

            if (!tokenFromForm) {
                const html = `
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Redirecting...</title>
                        </head>
                        <body>
                            <script>
                                window.location.href = '/subscription?error=token_missing';
                            </script>
                            <noscript>
                                <meta http-equiv="refresh" content="0; url=/subscription?error=token_missing">
                            </noscript>
                        </body>
                    </html>
                `
                return new NextResponse(html, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                })
            }

            return handlePayment(tokenFromForm, request)
        }

        return handlePayment(token, request)

    } catch (error) {
        console.error("Subscription callback error:", error)
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting...</title>
                </head>
                <body>
                    <script>
                        window.location.href = '/subscription?error=system_error';
                    </script>
                    <noscript>
                        <meta http-equiv="refresh" content="0; url=/subscription?error=system_error">
                    </noscript>
                </body>
            </html>
        `
        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        })
    }
}

async function handlePayment(token: string, request: NextRequest) {
    // 1. Önce Token ile DB'de ödeme var mı ona bak (V2 Subscription)
    let paymentRecord = await prisma.payment.findFirst({
        where: { stripePaymentId: token }
    })

    let isV2 = !!paymentRecord
    let result: any = { status: "failure" }

    // 2. Eğer DB'de yoksa, Iyzico'dan sor (V1 - Eski Yöntem veya Standart Checkout)
    if (!paymentRecord) {
        try {
            result = await retrieveCheckoutForm(token)
            if (result.status === "success" && result.paymentStatus === "SUCCESS") {
                const basketId = result.basketId
                paymentRecord = await prisma.payment.findFirst({
                    where: {
                        OR: [
                            { id: basketId },
                            { stripePaymentId: basketId }
                        ]
                    }
                })
            }
        } catch (e) {
            console.error("Retrieve checkout form error:", e)
        }
    }

    console.log('Payment Resolution:', {
        token,
        isV2,
        paymentFound: !!paymentRecord,
        paymentId: paymentRecord?.id,
        iyzicoStatus: result?.status
    })

    if (!paymentRecord) {
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting...</title>
                </head>
                <body>
                    <script>
                        window.location.href = '/subscription?error=payment_not_found';
                    </script>
                    <noscript>
                        <meta http-equiv="refresh" content="0; url=/subscription?error=payment_not_found">
                    </noscript>
                </body>
            </html>
        `
        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        })
    }

    if (paymentRecord.status === 'COMPLETED') {
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting...</title>
                </head>
                <body>
                    <script>
                        window.location.href = '/home?success=already_completed';
                    </script>
                    <noscript>
                        <meta http-equiv="refresh" content="0; url=/home?success=already_completed">
                    </noscript>
                </body>
            </html>
        `
        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        })
    }

    // 3. Başarılı İşlem - Kayıtları Güncelle
    // V1 ise stripePaymentId'yi güncelle, V2 ise zaten tokendi.
    await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
            status: 'COMPLETED',
            stripePaymentId: token // Her zaman güncel token/id olsun
        }
    })

    // Kullanıcı Aboneliğini Güncelle
    const planName = paymentRecord.subscriptionPlan
    if (planName) {
        const now = new Date()
        let endDate = new Date(now)

        if (paymentRecord.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
            endDate.setMonth(endDate.getMonth() + 1)
        }

        // Subscription Reference Code'u al (İptal işlemi için gerekli)
        let subscriptionReferenceCode = null
        if (isV2) {
            try {
                const detail = await getSubscriptionCheckoutResult(token)
                if (detail?.referenceCode) {
                    subscriptionReferenceCode = detail.referenceCode
                    console.log("Subscription Reference Code retrieved:", subscriptionReferenceCode)
                }
            } catch (err) {
                console.error("Failed to retrieve subscription reference code:", err)
            }
        }

        await prisma.user.update({
            where: { id: paymentRecord.userId },
            data: {
                subscriptionPlan: planName,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: endDate,
                subscriptionReferenceCode: subscriptionReferenceCode,
                subscriptionCancelled: false // Yeni abonelik, iptal durumu sıfırla
            }
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

    // Yönlendirme
    if (paymentRecord.courseId) {
        console.log(`ℹ️ Subscription purchased via course ${paymentRecord.courseId}, redirecting user...`)
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting...</title>
                </head>
                <body>
                    <script>
                        window.location.href = '/learn/${paymentRecord.courseId}?success=true';
                    </script>
                    <noscript>
                        <meta http-equiv="refresh" content="0; url=/learn/${paymentRecord.courseId}?success=true">
                    </noscript>
                </body>
            </html>
        `
        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        })
    }

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Redirecting...</title>
                </head>
            <body>
                <script>
                    window.location.href = '/home?subscription=success';
                </script>
                <noscript>
                    <meta http-equiv="refresh" content="0; url=/home?subscription=success">
                </noscript>
            </body>
        </html>
    `
    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    })
}
