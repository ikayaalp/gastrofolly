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

        // GSM Numarası formatı
        // GSM Numarasını Formatla (+90 ile başlamalı)
        let gsmNumber = user.phoneNumber || ''
        gsmNumber = gsmNumber.replace(/[^0-9]/g, '') // Sadece rakamları al
        if (gsmNumber.startsWith('90')) {
            gsmNumber = '+' + gsmNumber
        } else if (gsmNumber.startsWith('0')) {
            gsmNumber = '+90' + gsmNumber.substring(1)
        } else if (gsmNumber.length === 10) {
            gsmNumber = '+90' + gsmNumber
        } else {
            // Geçersiz veya boş numara ise varsayılan test numarası
            gsmNumber = '+905555555555'
        }

        const addressText = 'Dijital Teslimat, Turkiye'
        const city = 'Istanbul'
        const country = 'Turkey'

        // İsim Soyisim Kontrolü
        const fullName = user.name || 'Misafir Kullanici'
        const namePartsNew = fullName.trim().split(' ')
        const surnameNew = namePartsNew.length > 1 ? namePartsNew.pop() || 'Kullanici' : 'Kullanici'
        const nameNew = namePartsNew.join(' ') || fullName

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
                email: user.email,
                identityNumber: '11111111111',
                lastLoginDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
                registrationDate: (user.createdAt ? new Date(user.createdAt) : new Date()).toISOString().replace('T', ' ').substring(0, 19),
                registrationAddress: addressText,
                ip: userIp,
                city: city,
                country: country,
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: fullName,
                city: city,
                country: country,
                address: addressText,
                zipCode: '34732'
            },
            billingAddress: {
                contactName: fullName,
                city: city,
                country: country,
                address: addressText,
                zipCode: '34732'
            },
            basketItems: [
                {
                    id: planName,
                    name: `Culinora Premium ${periodLabel}`,
                    category1: 'Abonelik',
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
