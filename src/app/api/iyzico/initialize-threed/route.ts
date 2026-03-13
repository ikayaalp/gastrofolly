import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { initializeThreedPayment, IyzicoThreedInitializeRequest } from "@/lib/iyzico"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor." },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { planName, billingPeriod, courseId, referralCode, cardData } = body

        if (!cardData) {
            return NextResponse.json(
                { error: "Kart bilgileri eksik." },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı." },
                { status: 404 }
            )
        }

        // Fiyat Hesaplama (Aynı mantık initialize-payment/route.ts'den alındı)
        const basePrice = 20 // Test için 20 TL
        let price: number

        if (billingPeriod === 'yearly') {
            price = Math.round(basePrice * 12 * 0.8)
        } else if (billingPeriod === '6monthly') {
            price = Math.round(basePrice * 6 * 0.9)
        } else {
            price = basePrice
        }

        if (referralCode) {
            try {
                const influencer = await prisma.user.findFirst({
                    where: {
                        referralCode: referralCode.toUpperCase(),
                        role: 'INFLUENCER' as any
                    }
                })
                if (influencer) {
                    const discountPercent = (influencer as any).discountPercent || 10
                    price = Math.round(price * (1 - discountPercent / 100))
                }
            } catch (e) { }
        }

        price = Math.max(1, price)
        const priceStr = price.toFixed(1)

        // Veritabanı Kaydı
        const payment = await prisma.payment.create({
            data: {
                amount: price,
                currency: "TRY",
                status: "PENDING",
                userId: user.id,
                courseId: courseId || null,
                subscriptionPlan: planName,
                billingPeriod: billingPeriod || "monthly",
                discountCode: referralCode?.toUpperCase() || null,
            }
        })

        // Buyer/Address Hazırlama (initialize-payment'tan kopyalandı)
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "Kullanıcı" : "Kullanıcı"
        const name = nameParts.join(" ") || "Misafir"

        const host = request.headers.get("host") || "culinora.net"
        const protocol = request.headers.get("x-forwarded-proto") || "https"
        const origin = `${protocol}://${host}`
        const callbackUrl = `${origin}/api/iyzico/callback`

        const rawPhone = (user.phoneNumber || "5555555555").replace(/\s+/g, '')
        let gsmNumber = rawPhone
        if (!gsmNumber.startsWith('+')) {
            if (gsmNumber.startsWith('0')) gsmNumber = gsmNumber.substring(1)
            if (!gsmNumber.startsWith('90')) gsmNumber = '90' + gsmNumber
            gsmNumber = '+' + gsmNumber
        }

        const ip = request.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "127.0.0.1"

        // Kimlik No Generator
        const generateSafeIdentityNumber = (userId: string): string => {
            let hash = 0
            for (let i = 0; i < userId.length; i++) {
                hash = ((hash << 5) - hash) + userId.charCodeAt(i)
                hash = hash & hash
            }
            hash = Math.abs(hash)
            return ((hash % 900000000 + 100000000).toString() + '1').substring(0, 11)
        }

        const threedRequest: IyzicoThreedInitializeRequest = {
            locale: "tr",
            conversationId: payment.id,
            price: priceStr,
            paidPrice: priceStr,
            currency: "TRY",
            basketId: "B" + payment.id.substring(0, 8),
            paymentGroup: "PRODUCT",
            callbackUrl: callbackUrl,
            paymentCard: {
                cardHolderName: cardData.cardHolderName,
                cardNumber: cardData.cardNumber,
                expireMonth: cardData.expireMonth,
                expireYear: cardData.expireYear,
                cvc: cardData.cvc,
                registerCard: 0
            },
            buyer: {
                id: user.id,
                name: name,
                surname: surname,
                email: user.email,
                gsmNumber: gsmNumber,
                identityNumber: generateSafeIdentityNumber(user.id),
                ip: ip,
                city: "Istanbul",
                country: "Turkey",
                registrationAddress: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar"
            },
            shippingAddress: {
                contactName: user.name || "Misafir Kullanıcı",
                city: "Istanbul",
                country: "Turkey",
                address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar"
            },
            billingAddress: {
                contactName: user.name || "Misafir Kullanıcı",
                city: "Istanbul",
                country: "Turkey",
                address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar"
            },
            basketItems: [
                {
                    id: planName,
                    name: planName + " Subscription",
                    category1: "Membership",
                    itemType: "VIRTUAL",
                    price: priceStr
                }
            ]
        }

        const result = await initializeThreedPayment(threedRequest)

        if (result && result.status === "success") {
            return NextResponse.json({
                success: true,
                threeDSHtmlContent: result.threeDSHtmlContent
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.errorMessage || "3D Secure başlatılamadı."
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error("3D Initialize error:", error)
        return NextResponse.json(
            { error: "Sunucu hatası oluştu.", message: error.message },
            { status: 500 }
        )
    }
}
