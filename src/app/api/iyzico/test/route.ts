import { NextRequest, NextResponse } from "next/server"
import { createCheckoutForm } from "@/lib/iyzico"

/**
 * Iyzico bağlantı testi - GET ile çağrılabilir
 * Kullanım: https://culinora.net/api/iyzico/test
 */
export async function GET(request: NextRequest) {
    try {
        // Basit bir test isteği gönder (minimum tutar ile)
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
                identityNumber: '00000000000',
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
                category1: 'Test',
                itemType: 'VIRTUAL',
                price: '1.00'
            }]
        }

        const result = await createCheckoutForm(testRequest as any)

        return NextResponse.json({
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
