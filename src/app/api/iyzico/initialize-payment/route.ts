import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createCheckoutForm, IyzicoPaymentRequest } from "@/lib/iyzico"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // API Key Kontrolü
        if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
            console.error("CRITICAL: Iyzico API Keys are missing in environment variables!")
            return NextResponse.json(
                { error: "Ödeme sistemi yapılandırma hatası. (API Keys Missing)" },
                { status: 500 }
            )
        }

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

        // Billing period'a göre fiyat hesapla
        // TODO: Test sonrası basePrice'ı 299'a geri al!
        const basePrice = 299 // Üyelik fiyatı: 299 TL
        let price: number
        let periodLabel: string

        if (billingPeriod === 'yearly') {
            price = Math.round(basePrice * 12 * 0.8) // %20 indirim
            periodLabel = "Yıllık"
        } else if (billingPeriod === '6monthly') {
            price = Math.round(basePrice * 6 * 0.9) // %10 indirim
            periodLabel = "6 Aylık"
        } else {
            price = basePrice
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
                    price = Math.round(price * (1 - discountPercent / 100))
                }
            } catch (e) {
                console.log("Referral lookup error:", e)
            }
        }

        // Fiyatın minimum 1 TL olmasını sağla
        price = Math.max(1, price)

        // Yerel Veritabanına Kayıt (Pending)
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

        // İsim soyisim ayrıştırma
        const nameParts = (user.name || "Misafir Kullanıcı").trim().split(/\s+/)
        const surname = nameParts.length > 1 ? nameParts.pop() || "Kullanıcı" : "Kullanıcı"
        const name = nameParts.join(" ") || "Misafir"

        // Callback URL oluştur
        const host = request.headers.get("host") || "culinora.net"
        const protocol = request.headers.get("x-forwarded-proto") || "https"
        const origin = `${protocol}://${host}`
        const callbackUrl = `${origin}/api/iyzico/callback`

        // GSM Numarası formatı düzeltme (+90 ile başlamalı)
        const rawPhone = (user.phoneNumber || "5555555555").replace(/\s+/g, '')
        let gsmNumber = rawPhone
        if (!gsmNumber.startsWith('+')) {
            if (gsmNumber.startsWith('0')) gsmNumber = gsmNumber.substring(1)
            if (!gsmNumber.startsWith('90')) gsmNumber = '90' + gsmNumber
            gsmNumber = '+' + gsmNumber
        }

        // IP adresi
        const ip = request.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || "85.34.78.112"

        // Fiyat formatı (Iyzico SDK'sındaki formatPrice fonksiyonu ile birebir aynı)
        const formatIyzicoPrice = (p: number): string => {
            let res = p.toString();
            if (res.indexOf('.') === -1) return res + '.0';
            // Eğer .00 gibi bitiyorsa tek sıfıra indir
            return res;
        }
        const priceStr = formatIyzicoPrice(price)

        // Geçerli formatta ama TCKN algoritmasına göre geçersiz kimlik numarası oluştur
        // Böylece gerçek birine ait olamaz, ama iyzico formatı kabul eder
        const generateSafeIdentityNumber = (userId: string): string => {
            let hash = 0
            for (let i = 0; i < userId.length; i++) {
                const char = userId.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash = hash & hash
            }
            hash = Math.abs(hash)
            // 9 basamaklı bir sayı oluştur (1-9 ile başlayan)
            const base = (hash % 900000000 + 100000000).toString()
            // Son haneyi "1" (tek sayı) yaparak bitiriyoruz (TCKN sonu hep çifttir)
            return (base + '0').slice(0, 10) + '1'
        }
        const identityNumber = generateSafeIdentityNumber(user.id)

        // İyzico Checkout Form Ödeme İsteği (Tekil Ödeme)
        const paymentRequest: IyzicoPaymentRequest = {
            locale: "tr",
            conversationId: payment.id,
            price: priceStr,
            paidPrice: priceStr,
            currency: "TRY",
            basketId: `BASKET_${payment.id}`,
            paymentGroup: "PRODUCT",
            paymentChannel: "WEB",
            callbackUrl: callbackUrl,
            enabledInstallments: [1, 2, 3, 6],
            buyer: {
                id: user.id,
                name: name,
                surname: surname,
                gsmNumber: gsmNumber,
                email: user.email,
                identityNumber: identityNumber,
                registrationAddress: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar",
                lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                registrationDate: user.createdAt.toISOString().slice(0, 19).replace('T', ' '),
                ip: ip,
                city: "Istanbul",
                country: "Turkey",
                zipCode: "34732"
            },
            shippingAddress: {
                contactName: user.name || "Misafir Kullanıcı",
                city: "Istanbul",
                country: "Turkey",
                address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar",
                zipCode: "34732"
            },
            billingAddress: {
                contactName: user.name || "Misafir Kullanıcı",
                city: "Istanbul",
                country: "Turkey",
                address: "Mimar Sinan Mah. Bora Sok. No:1 Uskudar",
                zipCode: "34732"
            },
            basketItems: [
                {
                    id: `PREMIUM_${billingPeriod || 'monthly'}`,
                    name: `Culinora Premium ${periodLabel} Üyelik`,
                    category1: "Koleksiyon",
                    category2: "Eğitim",
                    itemType: "PHYSICAL",
                    price: priceStr
                }
            ]
        }

        console.log('Initializing Checkout Form (Single Payment):', {
            paymentId: payment.id,
            price: priceStr,
            billingPeriod,
            email: user.email,
            callbackUrl: callbackUrl
        })

        const result = await createCheckoutForm(paymentRequest)

        if (result && result.status === "success") {
            console.log("Checkout Form initialization successful:", {
                token: result.token,
                hasPaymentPageUrl: !!result.paymentPageUrl,
                hasCheckoutFormContent: !!result.checkoutFormContent
            })

            // Token'ı payment kaydına yaz (callback'te eşleşme için)
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    stripePaymentId: result.token || payment.id
                }
            })

            return NextResponse.json({
                success: true,
                checkoutFormContent: result.checkoutFormContent || null,
                paymentPageUrl: result.paymentPageUrl || null,
                token: result.token
            })
        } else {
            console.error("Iyzico checkout form rejection:", JSON.stringify(result, null, 2))
            return NextResponse.json({
                success: false,
                error: (result as any)?.errorMessage || "İyzico ödeme formunu oluşturamadı. Lütfen daha sonra tekrar deneyin."
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
