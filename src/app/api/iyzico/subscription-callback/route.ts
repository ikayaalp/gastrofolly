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
                const url = request.nextUrl.clone()
                url.pathname = '/subscription'
                url.search = ''
                url.searchParams.set('error', 'token_missing')
                return NextResponse.redirect(url)
            }

            return handlePayment(tokenFromForm, request)
        }

        return handlePayment(token, request)

    } catch (error) {
        console.error("Subscription callback error:", error)
        const url = request.nextUrl.clone()
        url.pathname = '/subscription'
        url.search = ''
        url.searchParams.set('error', 'system_error')
        return NextResponse.redirect(url)
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
            const url = request.nextUrl.clone()
            url.pathname = '/subscription'
            url.search = ''
            url.searchParams.set('error', 'payment_not_found')
            return NextResponse.redirect(url)
        }

        if (payment.status === 'COMPLETED') {
            const url = request.nextUrl.clone()
            url.pathname = '/home'
            url.search = ''
            url.searchParams.set('success', 'already_completed')
            return NextResponse.redirect(url)
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
            const url = request.nextUrl.clone()
            url.pathname = `/learn/${payment.courseId}`
            url.search = '' // Clear existing search params
            url.searchParams.set('success', 'true')
            return NextResponse.redirect(url)
        }

        const url = request.nextUrl.clone()
        url.pathname = '/home'
        url.search = ''
        url.searchParams.set('subscription', 'success')
        return NextResponse.redirect(url)
    } else {
        const url = request.nextUrl.clone()
        url.pathname = '/subscription'
        url.search = ''
        url.searchParams.set('error', result.errorMessage || 'payment_failed')
        return NextResponse.redirect(url)
    }
}
