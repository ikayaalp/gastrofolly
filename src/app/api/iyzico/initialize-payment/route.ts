import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createCheckoutForm, IyzicoPaymentRequest } from "@/lib/iyzico"

function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp
    const vercelIp = request.headers.get('x-vercel-forwarded-for')
    if (vercelIp) return vercelIp.split(',')[0].trim()
    return '85.34.78.112'
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın." },
                { status: 401 }
            )
        }

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json(
                { error: "Geçersiz istek gövdesi." },
                { status: 400 }
            )
        }

        const { planName, billingPeriod, price, courseId, referralCode } = body

        if (!planName) {
            return NextResponse.json(
                { error: "Plan adı belirtilmedi." },
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

        // Zaten aktif bir aboneliği var mı kontrol et
        const isSubActive = user.subscriptionPlan === "Premium" && (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date())
        if (isSubActive) {
            return NextResponse.json(
                { error: "Zaten aktif bir Premium üyeliğiniz bulunuyor." },
                { status: 400 }
            )
        }

        // Fiyat hesaplama
        const basePrice = 5
        let totalPrice: number
        let periodLabel: string

        if (billingPeriod === 'yearly') {
            totalPrice = basePrice * 12 * 0.8
            periodLabel = 'Yıllık'
        } else if (billingPeriod === '6monthly') {
            totalPrice = basePrice * 6 * 0.9
            periodLabel = '6 Aylık'
        } else {
            totalPrice = basePrice
            periodLabel = 'Aylık'
        }

        // Referral indirim uygula (eğer varsa)
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
                    totalPrice = totalPrice * (1 - discountPercent / 100)
                }
            } catch (e) {
                console.log("Referral lookup error:", e)
            }
        }

        // Ödeme kaydı oluştur
        const payment = await prisma.payment.create({
            data: {
                amount: totalPrice,
                currency: "TRY",
                status: "PENDING",
                userId: user.id,
                courseId: courseId || null,
                subscriptionPlan: planName,
                billingPeriod: billingPeriod || "monthly",
                discountCode: referralCode?.toUpperCase() || null,
            }
        })

        // İsim soyisim ayrıştırma
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "Kullanıcı" : "Kullanıcı"
        const firstName = nameParts.join(" ") || "Misafir"

        // Callback URL
        const host = request.headers.get("host") || "culinora.net"
        const protocol = request.headers.get("x-forwarded-proto") || "https"
        const origin = `${protocol}://${host}`
        const callbackUrl = `${origin}/api/iyzico/subscription-callback`

        const userIp = getClientIp(request)
        const conversationId = payment.id

        // GSM Numarası formatı - STANDART TEST NUMARASI KULLAN (Hata ayıklama için)
        // Gerçek numarada format hatası veya banka ret sebebi olabilir
        const gsmNumber = '+905555555555'

        const addressText = 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1'
        const city = 'Istanbul'
        const country = 'Turkey'
        const zipCode = '34732'

        // İsim Soyisim - STANDART TEST İSMİ KULLAN
        const nameNew = 'John'
        const surnameNew = 'Doe'

        // IP Kontrolü (Zorunlu)
        const validIp = userIp && (userIp.includes('.') || userIp.includes(':')) ? userIp : '127.0.0.1'

        // Ürün Adı Temizliği
        const safePlanName = planName.replace(/[^a-zA-Z0-9 ]/g, '')

        const paymentRequest: IyzicoPaymentRequest = {
            locale: 'tr',
            conversationId: payment.id,
            price: totalPrice.toFixed(2),
            paidPrice: totalPrice.toFixed(2),
            currency: 'TRY',
            basketId: 'B' + payment.id,
            paymentGroup: 'PRODUCT',
            callbackUrl: `${process.env.NEXTAUTH_URL}/api/iyzico/subscription-callback`,
            enabledInstallments: [1],
            buyer: {
                id: user.id,
                name: nameNew,
                surname: surnameNew,
                gsmNumber: gsmNumber,
                email: 'email@email.com', // Test e-maili kullan (Sandbox/Test ortamı için bazen gerekebilir)
                identityNumber: '11111111111',
                lastLoginDate: '2015-10-05 12:43:35',
                registrationDate: '2013-04-21 15:12:09',
                registrationAddress: addressText,
                ip: '85.34.78.112', // Test IP'si kullan
                city: city,
                country: country,
                zipCode: zipCode
            },
            shippingAddress: {
                contactName: nameNew + ' ' + surnameNew,
                city: city,
                country: country,
                address: addressText,
                zipCode: zipCode
            },
            billingAddress: {
                contactName: nameNew + ' ' + surnameNew,
                city: city,
                country: country,
                address: addressText,
                zipCode: zipCode
            },
            basketItems: [
                {
                    id: safePlanName,
                    name: `Culinora Premium ${periodLabel}`,
                    category1: 'Online Egitim',
                    itemType: 'VIRTUAL',
                    price: totalPrice.toFixed(2)
                }
            ]
        }

        console.log('Initializing Single Payment Checkout:', {
            plan: planName,
            price: totalPrice,
            paymentId: payment.id,
            buyer: {
                gsm: paymentRequest.buyer.gsmNumber,
                email: paymentRequest.buyer.email,
                identity: paymentRequest.buyer.identityNumber,
                address: paymentRequest.buyer.registrationAddress
            }
        })

        const result = await createCheckoutForm(paymentRequest)

        if (result.status === 'success' && result.checkoutFormContent) {
            // Başarılı - token'ı kaydet
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    stripePaymentId: result.token
                }
            })

            return NextResponse.json({
                success: true,
                paymentPageUrl: result.paymentPageUrl,
                checkoutFormContent: result.checkoutFormContent,
                token: result.token
            })
        } else {
            console.error("Iyzico rejection:", result)
            return NextResponse.json({
                success: false,
                error: result?.errorMessage || "Ödeme formu oluşturulamadı. Lütfen daha sonra tekrar deneyin."
            })
        }

    } catch (error: any) {
        console.error("Initialize payment fatal error:", error)
        return NextResponse.json(
            {
                error: "Sistemde bir hata oluştu.",
                message: error?.message || "Bilinmeyen hata"
            },
            { status: 500 }
        )
    }
}
