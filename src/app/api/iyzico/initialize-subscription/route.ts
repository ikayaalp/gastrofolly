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
                { error: "Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın." },
                { status: 401 }
            )
        }

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json(
                { error: "Geçersiz istek gövdesi. Lütfen sayfayı yenileyip tekrar deneyin." },
                { status: 400 }
            )
        }

        const { planName, billingPeriod } = body

        if (!planName) {
            return NextResponse.json(
                { error: "Plan adı belirtilmedi." },
                { status: 400 }
            )
        }

        if (planName !== "Premium") {
            return NextResponse.json(
                { error: "Şu an sadece Premium plan destekleniyor." },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı veritabanında bulunamadı." },
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

        // 1. Önce Ürün ve Planın İyzico'da var olduğundan emin ol
        try {
            await createSubscriptionProduct({
                name: "Culinora Premium",
                referenceCode: PRODUCT_REF
            })
        } catch (e) {
            console.log("Product already exists or failed to create:", e)
        }

        const isYearly = billingPeriod === 'yearly'
        const planRef = isYearly ? PLAN_Y_REF : PLAN_M_REF
        const price = isYearly ? 2870.0 : 299.0

        try {
            await createSubscriptionPricingPlan({
                productReferenceCode: PRODUCT_REF,
                name: isYearly ? "Premium Yıllık" : "Premium Aylık",
                price: price,
                currencyCode: "TRY",
                paymentInterval: isYearly ? "YEARLY" : "MONTHLY",
                paymentIntervalCount: 1,
                trialPeriodDays: 0,
                planPaymentType: "RECURRING",
                referenceCode: planRef
            })
        } catch (e) {
            console.log("Plan already exists or failed to create:", e)
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
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "" : ""
        const name = nameParts.join(" ") || "Misafir"

        // Daha güvenli origin tespiti
        const host = request.headers.get("host") || "culinora.net"
        const protocol = request.headers.get("x-forwarded-proto") || "https"
        const origin = `${protocol}://${host}`
        const callbackUrl = `${origin}/api/iyzico/subscription-callback`

        // 4. Abonelik Başlatma İsteği
        const subscriptionRequest: IyzicoSubscriptionCheckoutRequest = {
            locale: "tr",
            conversationId: payment.id,
            pricingPlanReferenceCode: planRef,
            subscriptionInitialStatus: "ACTIVE",
            callbackUrl: callbackUrl,
            customer: {
                name: name,
                surname: surname || "Kullanıcı",
                email: user.email,
                gsmNumber: user.phoneNumber || "+905555555555", // Eğer kayıtlıysa telefonunu kullan
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

        console.log("Initializing Subscription Checkout:", payment.id)

        const result = await initializeSubscriptionCheckout(subscriptionRequest)

        if (result && (result.status === "success" || result.status === "SUCCESS")) {
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
            console.error("Iyzico rejection:", result)
            return NextResponse.json({
                success: false,
                error: result?.errorMessage || "İyzico ödeme formunu oluşturamadı. Lütfen daha sonra tekrar deneyin."
            })
        }

    } catch (error: any) {
        console.error("Initialize subscription fatal error:", error)
        return NextResponse.json(
            {
                error: "Sistemde bir hata oluştu.",
                message: error?.message || "Bilinmeyen hata"
            },
            { status: 500 }
        )
    }
}
