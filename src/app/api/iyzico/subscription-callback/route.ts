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
                return NextResponse.redirect(new URL('/subscription?error=token_missing', request.url))
            }

            return handlePayment(tokenFromForm, request)
        }

        return handlePayment(token, request)

    } catch (error) {
        console.error("Subscription callback error:", error)
        return NextResponse.redirect(new URL('/subscription?error=system_error', request.url))
    }
}

async function handlePayment(token: string, request: NextRequest) {
    const result = await retrieveCheckoutForm(token)

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
        const conversationId = result.conversationId

        // Ödemeyi bul
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { id: conversationId },
                    { stripePaymentId: conversationId }
                ]
            }
        })

        if (!payment) {
            return NextResponse.redirect(new URL('/subscription?error=payment_not_found', request.url))
        }

        if (payment.status === 'COMPLETED') {
            return NextResponse.redirect(new URL('/home?success=already_completed', request.url))
        }

        // Ödemeyi güncelle
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                stripePaymentId: result.paymentId || conversationId
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
                    subscriptionEndDate: endDate
                }
            })
        }

        if (payment.courseId) {
            return NextResponse.redirect(new URL(`/learn/${payment.courseId}?success=true`, request.url))
        }

        return NextResponse.redirect(new URL('/home?subscription=success', request.url))
    } else {
        const errorMsg = result.errorMessage || 'payment_failed'
        return NextResponse.redirect(new URL(`/subscription?error=${encodeURIComponent(errorMsg)}`, request.url))
    }
}
