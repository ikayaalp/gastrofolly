import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createCheckoutForm, IyzicoPaymentRequest } from "@/lib/iyzico"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { planName, courseId, billingPeriod, discountCode } = body

        // 1. Plan Fiyatını Sunucuda Belirle (Güvenlik)
        const PLANS = {
            "Premium": { price: 299 }
        }

        const selectedPlan = PLANS[planName as keyof typeof PLANS]
        if (!selectedPlan) {
            return NextResponse.json(
                { error: "Geçersiz plan" },
                { status: 400 }
            )
        }

        let finalPrice = selectedPlan.price

        // Yıllık ise %20 indirim
        if (billingPeriod === 'yearly') {
            finalPrice = (finalPrice * 12) * 0.8
        }

        // İndirim Kodu Varsa Doğrula ve Uygula
        if (discountCode) {
            const discount = await prisma.discountCode.findUnique({
                where: { code: discountCode }
            })

            if (discount && discount.isActive &&
                new Date() >= discount.validFrom &&
                new Date() <= discount.validUntil &&
                (!discount.maxUses || discount.usedCount < discount.maxUses)) {

                if (discount.discountType === "PERCENTAGE") {
                    finalPrice = finalPrice - (finalPrice * discount.discountValue / 100)
                } else {
                    finalPrice = Math.max(0, finalPrice - discount.discountValue)
                }
            }
        }

        // Fiyat formatı (Iyzico string bekler ve 0.00 formatında sever)
        const priceStr = finalPrice.toFixed(2)

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        // 2. Ödeme kaydı oluştur (Pending)
        const payment = await prisma.payment.create({
            data: {
                amount: finalPrice,
                currency: "TRY",
                status: "PENDING",
                userId: user.id,
                subscriptionPlan: planName,
                courseId: courseId || undefined,
                billingPeriod: billingPeriod || "monthly",
                discountCode: discountCode || undefined,
            }
        })

        // 3. İyzico ödeme isteği hazırla
        const origin = request.nextUrl.origin
        const callbackUrl = `${origin}/api/iyzico/subscription-callback`

        // İsim soyisim ayrıştırma (basitçe)
        const nameParts = (user.name || "Misafir Kullanıcı").split(" ")
        const surname = nameParts.length > 1 ? nameParts.pop() || "" : ""
        const name = nameParts.join(" ") || "Misafir"

        const paymentRequest: IyzicoPaymentRequest = {
            locale: "tr",
            conversationId: payment.id,
            price: priceStr,
            paidPrice: priceStr,
            currency: "TRY",
            basketId: payment.id,
            paymentGroup: "SUBSCRIPTION",
            callbackUrl: callbackUrl,
            enabledInstallments: [1, 2, 3, 6, 9],
            buyer: {
                id: user.id,
                name: name,
                surname: surname || "Kullanıcı",
                gsmNumber: "+905555555555", // Zorunlu alan, kullanıcıdan alınmıyorsa dummy
                email: user.email,
                identityNumber: "11111111111", // Zorunlu alan
                registrationAddress: "N/A",
                ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
                city: "Istanbul",
                country: "Turkey",
            },
            shippingAddress: {
                contactName: user.name || "Misafir",
                city: "Istanbul",
                country: "Turkey",
                address: "Dijital Teslimat",
            },
            billingAddress: {
                contactName: user.name || "Misafir",
                city: "Istanbul",
                country: "Turkey",
                address: "Dijital Teslimat",
            },
            basketItems: [
                {
                    id: planName,
                    name: `${planName} Abonelik`,
                    category1: "Abonelik",
                    itemType: "VIRTUAL",
                    price: priceStr,
                }
            ]
        }

        // 3. İyzico formunu oluştur
        const result = await createCheckoutForm(paymentRequest)

        if (result.status === "success" && result.paymentPageUrl) {
            // StripePaymentId'yi payment.id olarak tut (callback'te bununla arayacağız)
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    stripePaymentId: payment.id // payment.id'yi saklayalım
                }
            })

            return NextResponse.json({
                success: true,
                paymentPageUrl: result.paymentPageUrl
            })
        } else {
            console.error("Iyzico error:", result)
            return NextResponse.json({
                success: false,
                error: result.errorMessage || "Ödeme sayfası oluşturulamadı"
            })
        }

    } catch (error) {
        console.error("Initialize subscription error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
