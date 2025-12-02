import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "İndirim kodu giriniz" },
        { status: 400 }
      )
    }

    // İndirim kodunu bul
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    // Kod bulunamadı
    if (!discountCode) {
      return NextResponse.json(
        { valid: false, error: "Geçersiz indirim kodu" },
        { status: 404 }
      )
    }

    // Kod aktif değil
    if (!discountCode.isActive) {
      return NextResponse.json(
        { valid: false, error: "Bu indirim kodu artık geçerli değil" },
        { status: 400 }
      )
    }

    // Tarih kontrolü
    const now = new Date()
    if (now < discountCode.validFrom) {
      return NextResponse.json(
        { valid: false, error: "Bu indirim kodu henüz geçerli değil" },
        { status: 400 }
      )
    }

    if (now > discountCode.validUntil) {
      return NextResponse.json(
        { valid: false, error: "Bu indirim kodunun süresi dolmuş" },
        { status: 400 }
      )
    }

    // Kullanım limiti kontrolü
    if (discountCode.maxUses !== null && discountCode.usedCount >= discountCode.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Bu indirim kodu kullanım limitine ulaşmış" },
        { status: 400 }
      )
    }

    // Geçerli kod
    return NextResponse.json({
      valid: true,
      discount: {
        type: discountCode.discountType,
        value: discountCode.discountValue,
        code: discountCode.code
      }
    })

  } catch (error) {
    console.error("Discount validation error:", error)
    return NextResponse.json(
      { valid: false, error: "Bir hata oluştu" },
      { status: 500 }
    )
  }
}
