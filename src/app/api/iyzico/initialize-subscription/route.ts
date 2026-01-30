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

const PRODUCT_REF = "CULINORA_PREMIUM_V1"
const PLAN_M_REF = "PLAN_M_PREMIUM_V1"
const PLAN_Y_REF = "PLAN_Y_PREMIUM_V1"

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
        const { planName, billingPeriod } = body

        if (planName !== "Premium") {
            return NextResponse.json(
                { error: "Şu an sadece Premium plan destekleniyor" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        // Zaten aktif bir aboneliği var mı kontrol et
        const isSubActive = user.subscriptionPlan === "Premium" && (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date())
        if (isSubActive) {
            return NextResponse.json(
                { error: "Zaten aktif bir Premium aboneliğiniz bulunuyor." },
                { status: 400 }
            )
        }

        // 1. Önce Ürün ve Planın İyzico'da var olduğundan emin ol (Idempotent)
        // Gerçek hayatta bunu bir kez yapmak yeterlidir ama garantici olmak için burada "Try Create" yapıyoruz
        try {
            await createSubscriptionProduct({
                name: "Culinora Premium",
                referenceCode: PRODUCT_REF
            })
        } catch (e) {
            // Already exists hatası gelebilir, sorun değil devam et
        }

        const isYearly = billingPeriod === 'yearly'
        const planRef = isYearly ? PLAN_Y_REF : PLAN_M_REF
        const price = isYearly ? 2870.0 : 299.0

        try {
            await createSubscriptionPricingPlan({
                productReferenceCode: PRODUCT_REF,
                name: isYearly ? "Premium Yıllık" : "Premium Aylık",
                price: price, // Yıllıkta %20 indirimli fiyat: 299 * 12 * 0.8 ~= 2870
                currencyCode: "TRY",
                paymentInterval: isYearly ? "YEARLY" : "MONTHLY",
                paymentIntervalCount: 1,
                trialPeriodDays: 0,
                planPaymentType: "RECURRING",
                referenceCode: planRef
            })
        } catch (e) {
            // Already exists hatası yoksayılır
        }

        // 2. Yerel Veritabanına Kayıt (Pending)
        const payment = await prisma.payment.create({
            data: {
                amount: price,
                currency: "TRY",
                status: "PENDING",
                userId: user.id,
                subscriptionPlan: planName,
                billingPeriod: billingPeriod || "monthly",
            }
        })

        // 3. İsim soyisim ayrıştırma
        const nameParts = (user.name || "Misafir Kullanıcı").split(" ")
        const surname = nameParts.length > 1 ? nameParts.pop() || "" : ""
        const name = nameParts.join(" ") || "Misafir"

        const origin = request.nextUrl.origin
        const callbackUrl = `${origin}/api/iyzico/subscription-callback`

        // 4. Abonelik Başlatma İsteği
        const subscriptionRequest: IyzicoSubscriptionCheckoutRequest = {
            locale: "tr",
            conversationId: payment.id,
            pricingPlanReferenceCode: planRef,
            subscriptionInitialStatus: "ACTIVE", // Ödeme alınca aktif olur
            callbackUrl: callbackUrl,
            customer: {
                name: name,
                surname: surname || "Kullanıcı",
                email: user.email,
                gsmNumber: "+905555555555",
                identityNumber: "11111111111",
                billingAddress: {
                    contactName: user.name || "Misafir",
                    city: "Istanbul",
                    country: "Turkey",
                    address: "Dijital Teslimat"
                },
                shippingAddress: {
                    contactName: user.name || "Misafir",
                    city: "Istanbul",
                    country: "Turkey",
                    address: "Dijital Teslimat"
                }
            }
        }

        console.log("Initializing Subscription Checkout with Request:", JSON.stringify(subscriptionRequest, null, 2))

        const result = await initializeSubscriptionCheckout(subscriptionRequest)

        console.log("Subscription Checkout Result:", result)

        if (result.status === "success" || result.status === "SUCCESS") {
            // Token bilgisini kaydedelim, callback'te lazım olacak
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    stripePaymentId: result.token // Token'ı buraya kaydediyoruz
                }
            })

            return NextResponse.json({
                success: true,
                // Client-side'da bu html içeriği bir sayfaya basılacak
                checkoutFormContent: result.checkoutFormContent,
                token: result.token
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.errorMessage || "Abonelik başlatılamadı"
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
