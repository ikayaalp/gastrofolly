import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    createSubscriptionProduct,
    createSubscriptionPricingPlan,
    initializeSubscriptionCheckout,
    IyzicoSubscriptionCheckoutRequest
} from "@/lib/iyzico"

// Subscription API v2 ürün ve plan referans kodları
const PRODUCT_REF = "CULINORA_PREMIUM_V1"
const PLAN_M_REF = "PLAN_M_PREMIUM_V1"
const PLAN_6M_REF = "PLAN_6M_PREMIUM_V1"
const PLAN_Y_REF = "PLAN_Y_PREMIUM_V1"

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

        const { planName, billingPeriod, courseId, referralCode } = body

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

        // 1. İyzico'da Ürün oluştur (zaten varsa hata verir, sessizce yut)
        try {
            await createSubscriptionProduct({
                name: "Culinora Premium",
                description: "Culinora Premium abonelik - tüm kurslara sınırsız erişim",
                referenceCode: PRODUCT_REF
            })
            console.log("Subscription product created successfully")
        } catch (e) {
            console.log("Product already exists or creation skipped:", (e as Error).message?.substring(0, 100))
        }

        // 2. Billing period'a göre plan belirle
        let planRef: string
        let price: number
        let paymentInterval: "MONTHLY" | "WEEKLY" | "YEARLY"
        let paymentIntervalCount: number
        let periodLabel: string

        if (billingPeriod === 'yearly') {
            planRef = PLAN_Y_REF
            price = 2870.0 // yıllık (12 ay * 299 * 0.8 = ~2870)
            paymentInterval = "YEARLY"
            paymentIntervalCount = 1
            periodLabel = "Yıllık"
        } else if (billingPeriod === '6monthly') {
            planRef = PLAN_6M_REF
            price = 1614.6 // 6 aylık (6 * 299 * 0.9 = ~1614)
            paymentInterval = "MONTHLY"
            paymentIntervalCount = 6
            periodLabel = "6 Aylık"
        } else {
            planRef = PLAN_M_REF
            price = 299.0
            paymentInterval = "MONTHLY"
            paymentIntervalCount = 1
            periodLabel = "Aylık"
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
                    price = price * (1 - discountPercent / 100)
                }
            } catch (e) {
                console.log("Referral lookup error:", e)
            }
        }

        // 3. İyzico'da Plan oluştur (zaten varsa hata verir, sessizce yut)
        try {
            await createSubscriptionPricingPlan({
                productReferenceCode: PRODUCT_REF,
                name: `Premium ${periodLabel}`,
                price: price,
                currencyCode: "TRY",
                paymentInterval: paymentInterval,
                paymentIntervalCount: paymentIntervalCount,
                trialPeriodDays: 0,
                planPaymentType: "RECURRING",
                referenceCode: planRef
            })
            console.log("Subscription pricing plan created successfully")
        } catch (e) {
            console.log("Plan already exists or creation skipped:", (e as Error).message?.substring(0, 100))
        }

        // 4. Yerel Veritabanına Kayıt (Pending)
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

        // 5. İsim soyisim ayrıştırma
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "Kullanıcı" : "Kullanıcı"
        const name = nameParts.join(" ") || "Misafir"

        // 6. Callback URL oluştur
        const host = request.headers.get("host") || "culinora.net"
        const protocol = request.headers.get("x-forwarded-proto") || "https"
        const origin = `${protocol}://${host}`
        const callbackUrl = `${origin}/api/iyzico/subscription-callback`

        // GSM Numarası formatı düzeltme (+90 ile başlamalı)
        const rawPhone = (user.phoneNumber || "5555555555").replace(/\s+/g, '')
        let gsmNumber = rawPhone
        if (!gsmNumber.startsWith('+')) {
            if (gsmNumber.startsWith('0')) gsmNumber = gsmNumber.substring(1)
            if (!gsmNumber.startsWith('90')) gsmNumber = '90' + gsmNumber
            gsmNumber = '+' + gsmNumber
        }

        // 7. Subscription Checkout Form Başlatma İsteği (API V2)
        const subscriptionRequest: IyzicoSubscriptionCheckoutRequest = {
            locale: "tr",
            conversationId: payment.id,
            pricingPlanReferenceCode: planRef,
            subscriptionInitialStatus: "ACTIVE",
            callbackUrl: callbackUrl,
            customer: {
                name: name,
                surname: surname,
                email: user.email,
                gsmNumber: gsmNumber,
                identityNumber: "11111111111",
                billingAddress: {
                    contactName: user.name || "Misafir Kullanıcı",
                    city: "Istanbul",
                    district: "Kadikoy",
                    country: "Turkey",
                    address: "Dijital Teslimat",
                    zipCode: "34732"
                },
                shippingAddress: {
                    contactName: user.name || "Misafir Kullanıcı",
                    city: "Istanbul",
                    district: "Kadikoy",
                    country: "Turkey",
                    address: "Dijital Teslimat",
                    zipCode: "34732"
                }
            }
        }

        console.log('Initializing Subscription Checkout (V2):', {
            paymentId: payment.id,
            plan: planRef,
            price: price,
            email: user.email,
            callbackUrl: callbackUrl
        })

        const result = await initializeSubscriptionCheckout(subscriptionRequest)

        if (result && (result.status === "success" || result.status === "SUCCESS")) {
            // Token'ı payment kaydına yaz (callback'te eşleşme için)
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    stripePaymentId: result.token
                }
            })

            return NextResponse.json({
                success: true,
                checkoutFormContent: result.checkoutFormContent,
                token: result.token
            })
        } else {
            console.error("Iyzico subscription rejection:", result)
            return NextResponse.json({
                success: false,
                error: (result as any)?.errorMessage || "İyzico ödeme formunu oluşturamadı. Lütfen daha sonra tekrar deneyin."
            })
        }

    } catch (error: any) {
        console.error("Initialize subscription payment fatal error:", error)
        return NextResponse.json(
            {
                error: "Sistemde bir hata oluştu.",
                message: error?.message || "Bilinmeyen hata"
            },
            { status: 500 }
        )
    }
}
