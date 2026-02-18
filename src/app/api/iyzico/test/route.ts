import { NextRequest, NextResponse } from "next/server"
import { createCheckoutForm, retrieveCheckoutForm } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

/**
 * Iyzico bağlantı ve son ödeme testi
 * GET /api/iyzico/test → bağlantı testi
 * GET /api/iyzico/test?token=xxx → belirli ödeme sonucu
 * GET /api/iyzico/test?last=true → son PENDING/FAILED ödeme sonucu
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const checkLast = searchParams.get('last')

        // Token ile ödeme sonucu sorgula
        if (token) {
            try {
                const result = await retrieveCheckoutForm(token)
                return NextResponse.json({
                    mode: 'PAYMENT_DETAIL',
                    fullResponse: result,
                    timestamp: new Date().toISOString()
                }, { status: 200 })
            } catch (e: any) {
                return NextResponse.json({
                    mode: 'PAYMENT_DETAIL',
                    error: e.message,
                    timestamp: new Date().toISOString()
                }, { status: 500 })
            }
        }

        // Son FAILED/PENDING ödemeyi kontrol et
        if (checkLast === 'true') {
            const lastPayments = await prisma.payment.findMany({
                where: {
                    status: { in: ['PENDING', 'FAILED'] }
                },
                orderBy: { createdAt: 'desc' },
                take: 3,
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    currency: true,
                    stripePaymentId: true,
                    subscriptionPlan: true,
                    billingPeriod: true,
                    createdAt: true,
                    userId: true
                }
            })

            const results = []
            for (const p of lastPayments) {
                let iyzicoResult = null
                if (p.stripePaymentId) {
                    try {
                        iyzicoResult = await retrieveCheckoutForm(p.stripePaymentId)
                    } catch (e: any) {
                        iyzicoResult = { error: e.message }
                    }
                }
                results.push({
                    payment: p,
                    iyzicoResult: iyzicoResult
                })
            }

            return NextResponse.json({
                mode: 'LAST_PAYMENTS',
                count: lastPayments.length,
                results: results,
                timestamp: new Date().toISOString()
            }, { status: 200 })
        }

        // Bağlantı testi
        const testRequest = {
            locale: 'tr',
            conversationId: 'test_' + Date.now(),
            price: '1.00',
            paidPrice: '1.00',
            currency: 'TRY',
            basketId: 'test_basket',
            paymentGroup: 'PRODUCT',
            callbackUrl: 'https://culinora.net/api/iyzico/subscription-callback',
            enabledInstallments: [1],
            buyer: {
                id: 'test_buyer',
                name: 'Test',
                surname: 'User',
                gsmNumber: '+905555555555',
                email: 'test@culinora.net',
                identityNumber: '11111111111',
                lastLoginDate: '2026-01-01 00:00:00',
                registrationDate: '2026-01-01 00:00:00',
                registrationAddress: 'Test Address',
                ip: '85.34.78.112',
                city: 'Istanbul',
                country: 'Turkey'
            },
            shippingAddress: {
                contactName: 'Test User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Test Address'
            },
            billingAddress: {
                contactName: 'Test User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Test Address'
            },
            basketItems: [{
                id: 'test_item',
                name: 'Test Urun',
                category1: 'Koleksiyon',
                itemType: 'PHYSICAL',
                price: '1.00'
            }]
        }

        const result = await createCheckoutForm(testRequest as any)

        return NextResponse.json({
            mode: 'CONNECTION_TEST',
            iyzicoConnection: result.status === 'success' ? '✅ BAŞARILI' : '❌ BAŞARISIZ',
            status: result.status,
            errorCode: result.errorCode || null,
            errorMessage: result.errorMessage || null,
            hasCheckoutForm: !!result.checkoutFormContent,
            token: result.token || null,
            timestamp: new Date().toISOString()
        }, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({
            iyzicoConnection: '❌ HATA',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
