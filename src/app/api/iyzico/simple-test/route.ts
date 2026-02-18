import { NextResponse } from "next/server"
import { createCheckoutForm, IyzicoPaymentRequest } from "@/lib/iyzico"

export async function GET() {
    try {
        const conversationId = 'TEST_' + Date.now()
        const price = '1.00'

        const request: IyzicoPaymentRequest = {
            locale: 'tr',
            conversationId: conversationId,
            price: price,
            paidPrice: price,
            currency: 'TRY',
            basketId: 'B_' + conversationId,
            paymentGroup: 'PRODUCT',
            callbackUrl: 'https://culinora.net/api/iyzico/subscription-callback',
            enabledInstallments: [1],
            buyer: {
                id: 'BY789',
                name: 'John',
                surname: 'Doe',
                gsmNumber: '+905555555555',
                email: 'email@email.com',
                identityNumber: '11111111111',
                lastLoginDate: '2015-10-05 12:43:35',
                registrationDate: '2013-04-21 15:12:09',
                registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                ip: '85.34.78.112',
                city: 'Istanbul',
                country: 'Turkey',
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: 'John Doe',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                zipCode: '34732'
            },
            billingAddress: {
                contactName: 'John Doe',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                zipCode: '34732'
            },
            basketItems: [
                {
                    id: 'BI101',
                    name: 'Binocular',
                    category1: 'Collectibles',
                    itemType: 'PHYSICAL',
                    price: price
                }
            ]
        }

        console.log('Simple Test Request:', request)
        const result = await createCheckoutForm(request)
        console.log('Simple Test Result:', result)

        return NextResponse.json({
            success: result.status === 'success',
            result: result,
            request: request
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
