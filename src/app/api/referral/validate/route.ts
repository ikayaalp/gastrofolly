import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST: Referral kodunu doğrula ve indirim oranını döndür
export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code || typeof code !== "string") {
            return NextResponse.json({ valid: false, error: "Referral kodu gerekli" })
        }

        const influencer = await prisma.user.findFirst({
            where: {
                referralCode: code.toUpperCase().trim(),
                role: "INFLUENCER" as any
            },
            select: {
                id: true,
                name: true,
                referralCode: true,
                discountPercent: true
            }
        })

        if (!influencer) {
            return NextResponse.json({ valid: false, error: "Geçersiz referral kodu" })
        }

        return NextResponse.json({
            valid: true,
            influencerName: influencer.name,
            discountPercent: (influencer as any).discountPercent || 10,
            code: influencer.referralCode
        })
    } catch (error) {
        console.error("Referral validate error:", error)
        return NextResponse.json({ valid: false, error: "Bir hata oluştu" })
    }
}
