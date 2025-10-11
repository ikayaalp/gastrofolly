import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCodeExpired } from '@/lib/emailService'

/**
 * Email doğrulama kodu kontrol et
 * POST /api/auth/verify-email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      )
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Zaten doğrulanmış mı?
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email zaten doğrulanmış', verified: true },
        { status: 200 }
      )
    }

    // Kod yok mu?
    if (!user.verificationCode) {
      return NextResponse.json(
        { error: 'Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // Kod eşleşiyor mu?
    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: 'Geçersiz doğrulama kodu' },
        { status: 400 }
      )
    }

    // Kod süresi dolmuş mu?
    if (user.verificationCodeExpiry && isCodeExpired(user.verificationCodeExpiry)) {
      return NextResponse.json(
        { error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // ✅ Doğrulama başarılı - kullanıcıyı güncelle
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        verificationCode: null, // Kodu sil
        verificationCodeExpiry: null,
      },
    })

    return NextResponse.json(
      { message: 'Email başarıyla doğrulandı!', verified: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Doğrulama işlemi başarısız oldu' },
      { status: 500 }
    )
  }
}

