import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    initializeSubscriptionNon3D,
    IyzicoSubscriptionNon3DRequest
} from "@/lib/iyzico"
import { sendSubscriptionStartedEmail } from "@/lib/emailService"
import { isPremiumUser } from "@/lib/subscription"

/**
 * Iyzico NON3D Abonelik Başlatma
 * Custom kart formundan gelen verilerle doğrudan abonelik başlatır.
 * POST /v2/subscription/initialize
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: "Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın." },
                { status: 401 }
            )
        }

        if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
            console.error("CRITICAL: Iyzico API Keys are missing!")
            return NextResponse.json(
                { success: false, error: "Ödeme sistemi yapılandırma hatası." },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { planName, billingPeriod, courseId, referralCode, cardData } = body

        if (!cardData) {
            return NextResponse.json(
                { success: false, error: "Kart bilgileri eksik." },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Kullanıcı bulunamadı." },
                { status: 404 }
            )
        }

        // Zaten aktif abonelik kontrolü
        const isSubActive = isPremiumUser(user)
        if (isSubActive) {
            return NextResponse.json(
                { success: false, error: "Zaten aktif bir Premium üyeliğiniz bulunuyor." },
                { status: 400 }
            )
        }

        // Fiyat hesaplama
        const activePlan = await prisma.subscriptionPlan.findFirst({
            where: { isActive: true, interval: billingPeriod === 'yearly' ? 'yearly' : 'monthly' }
        })

        if (!activePlan || !activePlan.iyzicoPlanCode) {
            return NextResponse.json(
                { error: "Seçilen periyot için geçerli bir abonelik planı veya Iyzico Plan Kodu bulunamadı. Lütfen Admin Paneli üzerinden yapılandırın." },
                { status: 400 }
            )
        }

        let price = activePlan.price

        // Referral indirim
        if (referralCode) {
            try {
                const influencer = await prisma.user.findFirst({
                    where: {
                        referralCode: referralCode.toUpperCase(),
                        role: "INFLUENCER" as any
                    }
                })
                if (influencer) {
                    const discountPercent = (influencer as any).discountPercent || 10
                    price = Math.round(price * (1 - discountPercent / 100))
                }
            } catch (e) {
                console.log("Referral lookup error:", e)
            }
        }

        price = Math.max(1, price)

        // Payment kaydı (PENDING)
        const payment = await prisma.payment.create({
            data: {
                amount: price,
                currency: "TRY",
                status: "PENDING",
                userId: user.id,
                courseId: courseId || null,
                subscriptionPlan: planName || "Premium",
                billingPeriod: billingPeriod || "monthly",
                discountCode: referralCode?.toUpperCase() || null,
            }
        })

        // İsim soyisim ayrıştırma
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "Kullanıcı" : "Kullanıcı"
        const name = nameParts.join(" ") || "Misafir"

        // GSM numarası formatlama
        const rawPhone = (user.phoneNumber || "5555555555").replace(/\s+/g, "")
        let gsmNumber = rawPhone
        if (!gsmNumber.startsWith("+")) {
            if (gsmNumber.startsWith("0")) gsmNumber = gsmNumber.substring(1)
            if (!gsmNumber.startsWith("90")) gsmNumber = "90" + gsmNumber
            gsmNumber = "+" + gsmNumber
        }

        // Kimlik numarası üretici (kullanıcı ID'sinden deterministik)
        const generateSafeIdentityNumber = (userId: string): string => {
            let hash = 0
            for (let i = 0; i < userId.length; i++) {
                hash = ((hash << 5) - hash) + userId.charCodeAt(i)
                hash = hash & hash
            }
            hash = Math.abs(hash)
            return ((hash % 900000000 + 100000000).toString() + "1").substring(0, 11)
        }

        const pricingPlanReferenceCode = activePlan.iyzicoPlanCode

        const non3dRequest: IyzicoSubscriptionNon3DRequest = {
            locale: "tr",
            conversationId: payment.id,
            pricingPlanReferenceCode,
            subscriptionInitialStatus: "ACTIVE",
            paymentCard: {
                cardHolderName: cardData.cardHolderName,
                cardNumber: cardData.cardNumber,
                expireYear: cardData.expireYear.replace("20", ""), // iyzico 2 haneli yıl bekler (ör: "26")
                expireMonth: cardData.expireMonth,
                cvc: cardData.cvc,
                registerConsumerCard: false,
            },
            customer: {
                name,
                surname,
                identityNumber: generateSafeIdentityNumber(user.id),
                email: user.email,
                gsmNumber,
                billingAddress: {
                    contactName: user.name || "Misafir Kullanıcı",
                    city: "Istanbul",
                    country: "Turkey",
                    address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar",
                    zipCode: "34732"
                },
                shippingAddress: {
                    contactName: user.name || "Misafir Kullanıcı",
                    city: "Istanbul",
                    country: "Turkey",
                    address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar",
                    zipCode: "34732"
                }
            }
        }

        console.log("NON3D Subscription initialize:", {
            paymentId: payment.id,
            billingPeriod,
            pricingPlanReferenceCode,
            email: user.email
        })

        const result = await initializeSubscriptionNon3D(non3dRequest)

        // Iyzico V2 API başarılı sonuçları genelde 'data' objesi içinde döner.
        const subscriptionStatus = result.data?.subscriptionStatus || result.subscriptionStatus
        const referenceCode = result.data?.referenceCode || result.referenceCode

        console.log("NON3D Subscription result:", {
            status: result.status,
            subscriptionStatus: subscriptionStatus,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
        })

        if (result.status === "success" && subscriptionStatus === "ACTIVE") {
            // ✅ Başarılı abonelik

            // Payment kaydını güncelle
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "COMPLETED",
                    stripePaymentId: referenceCode || payment.id
                }
            })

            // Abonelik süresini hesapla
            const now = new Date()
            let endDate = new Date(now)
            if (billingPeriod === "yearly") {
                endDate.setFullYear(endDate.getFullYear() + 1)
            } else if (billingPeriod === "6monthly") {
                endDate.setMonth(endDate.getMonth() + 6)
            } else {
                endDate.setMonth(endDate.getMonth() + 1)
            }

            // Kullanıcı aboneliğini güncelle
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionPlan: "Premium",
                    subscriptionBillingPeriod: billingPeriod === "yearly" ? "YEARLY" : billingPeriod === "6monthly" ? "SIXMONTHLY" : "MONTHLY",
                    subscriptionStartDate: now,
                    subscriptionEndDate: endDate,
                    subscriptionReferenceCode: referenceCode,
                }
            })

            console.log(`✅ NON3D Subscription aktif: ${user.id} → ${planName} (${now.toISOString()} - ${endDate.toISOString()})`)

            // Hoşgeldin e-postası
            if (updatedUser.email) {
                try {
                    await sendSubscriptionStartedEmail(
                        updatedUser.email,
                        updatedUser.name || "Chef",
                        "Premium",
                        endDate
                    )
                } catch (emailErr) {
                    console.error("Welcome email error:", emailErr)
                }
            }

            return NextResponse.json({
                success: true,
                subscriptionStatus: subscriptionStatus,
                referenceCode: referenceCode
            })
        } else {
            // ❌ Başarısız abonelik — kart reddedildi veya başka hata

            // Payment kaydını FAILED olarak güncelle
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "FAILED" }
            }).catch(() => { }) // sessizce görmezden gel

            // Kullanıcı dostu hata mesajı
            let userFriendlyError = "Ödeme işlemi başarısız oldu. Lütfen kart bilgilerinizi kontrol edin."

            if (result.errorCode) {
                switch (result.errorCode) {
                    case "1000":
                        userFriendlyError = "Geçersiz kart bilgileri. Lütfen kart numaranızı, son kullanma tarihinizi ve CVV'nizi kontrol edin."
                        break
                    case "1001":
                        userFriendlyError = "Kart bilgileri bulunamadı. Lütfen bilgilerinizi tekrar girin."
                        break
                    case "1003":
                        userFriendlyError = "Kartınızda yeterli bakiye bulunmuyor."
                        break
                    case "1004":
                        userFriendlyError = "Kartınız bu işlem için kullanılamıyor. Bankanızla iletişime geçin."
                        break
                    case "1005":
                        userFriendlyError = "Kart işlemde reddedildi. Farklı bir kart deneyin veya bankanızı arayın."
                        break
                    case "1006":
                        userFriendlyError = "Kartınız çalınmış veya kayıp olarak işaretlenmiş."
                        break
                    case "1008":
                        userFriendlyError = "Kart son kullanma tarihi geçmiş."
                        break
                    case "1011":
                        userFriendlyError = "Bankanız bu işlemi onaylamadı. Bankanızı arayın."
                        break
                    case "10051":
                        userFriendlyError = "Kartınızda yeterli bakiye bulunmuyor."
                        break
                    case "10057":
                    case "10058":
                        userFriendlyError = "Kartınız bu işlem için yetkili değil. Bankanızla iletişime geçin."
                        break
                    default:
                        if (result.errorMessage) {
                            userFriendlyError = result.errorMessage
                        }
                }
            } else if (result.errorMessage) {
                userFriendlyError = result.errorMessage
            }

            console.error("❌ NON3D Subscription failed:", {
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                errorGroup: result.errorGroup
            })

            return NextResponse.json({
                success: false,
                error: userFriendlyError,
                errorCode: result.errorCode
            }, { status: 200 })
        }
    } catch (error: any) {
        console.error("NON3D Subscribe fatal error:", error)
        return NextResponse.json(
            { success: false, error: "Sistemde bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
            { status: 500 }
        )
    }
}
