import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Tüm fenomenlerin listesi ve istatistikleri
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (admin?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const influencers = await prisma.user.findMany({
            where: { role: "INFLUENCER" },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                referralCode: true,
                discountPercent: true,
                createdAt: true,
                referralEarnings: {
                    select: {
                        id: true,
                        amount: true,
                        commission: true,
                        createdAt: true,
                        referredUser: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        const result = influencers.map(inf => ({
            id: inf.id,
            name: inf.name,
            email: inf.email,
            image: inf.image,
            referralCode: inf.referralCode,
            discountPercent: (inf as any).discountPercent || 10,
            createdAt: inf.createdAt,
            totalReferrals: inf.referralEarnings.length,
            totalEarnings: inf.referralEarnings.reduce((sum, r) => sum + r.commission, 0),
            totalRevenue: inf.referralEarnings.reduce((sum, r) => sum + r.amount, 0),
            recentReferrals: inf.referralEarnings.slice(0, 5)
        }))

        return NextResponse.json({ influencers: result })
    } catch (error) {
        console.error("Admin influencers GET error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// POST: Kullanıcıyı fenomen yap
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (admin?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { email, referralCode, discountPercent } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email gerekli" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "Bu email ile kayıtlı kullanıcı bulunamadı" }, { status: 404 })
        }

        if (user.role === "INFLUENCER") {
            return NextResponse.json({ error: "Bu kullanıcı zaten bir fenomen" }, { status: 400 })
        }

        // Referral kodu oluştur: custom veya otomatik
        let code = referralCode?.toUpperCase().trim()
        if (!code) {
            // Otomatik kod oluştur: ismin ilk 3 harfi + rastgele 4 karakter
            const namePrefix = (user.name || "FEN").replace(/\s+/g, "").substring(0, 3).toUpperCase()
            const random = Math.random().toString(36).substring(2, 6).toUpperCase()
            code = `${namePrefix}${random}`
        }

        // Kod benzersiz mi kontrol et
        const existing = await prisma.user.findFirst({
            where: { referralCode: code }
        })

        if (existing) {
            return NextResponse.json({ error: "Bu referral kodu zaten kullanılıyor. Farklı bir kod deneyin." }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                role: "INFLUENCER" as any,
                referralCode: code,
                discountPercent: discountPercent || 10
            },
            select: {
                id: true,
                name: true,
                email: true,
                referralCode: true,
                role: true
            }
        })

        return NextResponse.json({ success: true, influencer: updatedUser })
    } catch (error) {
        console.error("Admin influencers POST error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// PATCH: Fenomenin referral kodunu güncelle
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (admin?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { influencerId, newReferralCode, discountPercent } = await request.json()

        if (!influencerId || !newReferralCode) {
            return NextResponse.json({ error: "Fenomen ID ve yeni referral kodu gerekli" }, { status: 400 })
        }

        const code = newReferralCode.toUpperCase().trim()

        if (code.length < 3) {
            return NextResponse.json({ error: "Referral kodu en az 3 karakter olmalı" }, { status: 400 })
        }

        // Kod benzersiz mi kontrol et (kendi kodu hariç)
        const existing = await prisma.user.findFirst({
            where: {
                referralCode: code,
                id: { not: influencerId }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Bu referral kodu zaten kullanılıyor" }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: influencerId },
            data: { referralCode: code, discountPercent: discountPercent || 10 },
            select: {
                id: true,
                name: true,
                email: true,
                referralCode: true
            }
        })

        return NextResponse.json({ success: true, influencer: updatedUser })
    } catch (error) {
        console.error("Admin influencers PATCH error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
