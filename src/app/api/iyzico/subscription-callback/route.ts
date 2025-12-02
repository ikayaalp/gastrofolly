import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm } from "@/lib/iyzico"
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
    const result = await retrieveCheckoutForm(token)

    console.log('Subscription callback - Payment result:', {
        status: result.status,
        paymentStatus: result.paymentStatus,
        conversationId: result.conversationId,
        basketId: result.basketId,
        paymentId: result.paymentId
    })

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
        const basketId = result.basketId // basketId bizim payment.id'miz

        // Ödemeyi bul - basketId ile ara
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { id: basketId },
                    { stripePaymentId: basketId }
                ]
            }
        })

        console.log('Payment lookup result:', {
            basketId,
            paymentFound: !!payment,
            paymentId: payment?.id,
            paymentStatus: payment?.status
        })

        if (!payment) {
            // Debug: Tüm pending subscription payments'ları listele
            const allSubscriptionPayments = await prisma.payment.findMany({
                where: {
                    subscriptionPlan: { not: null }
                },
                select: {
                    id: true,
                    stripePaymentId: true,
                    subscriptionPlan: true,
                    status: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
            console.error('Payment not found. Recent subscription payments:', allSubscriptionPayments)
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

        if (payment.status === 'COMPLETED') {
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

        // Ödemeyi güncelle
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                stripePaymentId: result.paymentId || result.conversationId
            }
        })

        // Kullanıcı aboneliğini güncelle
        const planName = payment.subscriptionPlan
        if (planName) {
            const now = new Date()
            const endDate = new Date(now.setMonth(now.getMonth() + 1)) // 1 aylık abonelik

            await prisma.user.update({
                where: { id: payment.userId },
                data: {
                    subscriptionPlan: planName,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: endDate
                }
            })
        }

        // Eğer courseId varsa (abonelik + kurs kombinasyonu), enrollment oluştur
        if (payment.courseId) {
            const existingEnrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: payment.userId,
                    courseId: payment.courseId
                }
            })

            if (!existingEnrollment) {
                await prisma.enrollment.create({
                    data: {
                        userId: payment.userId,
                        courseId: payment.courseId
                    }
                })
                console.log(`✅ Enrollment created for course: ${payment.courseId}`)
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
                            window.location.href = '/learn/${payment.courseId}?success=true';
                        </script>
                        <noscript>
                            <meta http-equiv="refresh" content="0; url=/learn/${payment.courseId}?success=true">
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
    } else {
        const errorMsg = result.errorMessage || 'payment_failed'
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting...</title>
                </head>
                <body>
                    <script>
                        window.location.href = '/subscription?error=${encodeURIComponent(errorMsg)}';
                    </script>
                    <noscript>
                        <meta http-equiv="refresh" content="0; url=/subscription?error=${encodeURIComponent(errorMsg)}">
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
