import { NextRequest, NextResponse } from "next/server"

// Örnek indirim kodları - Gerçek uygulamada veritabanından gelecek
const DISCOUNT_CODES = {
  'WELCOME10': { percentage: 10, minAmount: 0, maxDiscount: 100 },
  'STUDENT20': { percentage: 20, minAmount: 50, maxDiscount: 200 },
  'CHEF15': { percentage: 15, minAmount: 100, maxDiscount: 300 },
  'NEWUSER': { percentage: 25, minAmount: 0, maxDiscount: 150 },
  'BULK30': { percentage: 30, minAmount: 200, maxDiscount: 500 },
  'VIP50': { percentage: 50, minAmount: 500, maxDiscount: 1000 }
}

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json()

    if (!code || !subtotal) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    const discountInfo = DISCOUNT_CODES[code as keyof typeof DISCOUNT_CODES]

    if (!discountInfo) {
      return NextResponse.json({ error: 'Geçersiz indirim kodu' }, { status: 400 })
    }

    // Minimum tutar kontrolü
    if (subtotal < discountInfo.minAmount) {
      return NextResponse.json({ 
        error: `Bu kod için minimum ₺${discountInfo.minAmount} alışveriş gerekli` 
      }, { status: 400 })
    }

    // İndirim hesaplama
    const discountAmount = Math.min(
      (subtotal * discountInfo.percentage) / 100,
      discountInfo.maxDiscount
    )

    return NextResponse.json({
      discount: {
        code,
        percentage: discountInfo.percentage,
        amount: Math.round(discountAmount)
      }
    })

  } catch (error) {
    console.error('Discount validation error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
