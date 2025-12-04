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

    // Kullanıcıyı veritabanından al
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı. Lütfen tekrar kayıt olun.' },
        { status: 404 }
      )
    }

    // Zaten doğrulanmış mı?
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Bu email zaten doğrulanmış. Giriş yapabilirsiniz.' },
        { status: 400 }
      )
    }

    // Doğrulama kodu var mı?
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      return NextResponse.json(
        { error: 'Doğrulama kodu bulunamadı. Lütfen yeni kod talep edin.' },
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
    if (isCodeExpired(user.verificationCodeExpiry)) {
      return NextResponse.json(
        { error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // ✅ Kod doğru! Email'i doğrulanmış olarak işaretle
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationCode: null, // Kodu temizle
        verificationCodeExpiry: null
      }
    })

    return NextResponse.json(
      {
        message: 'Email başarıyla doğrulandı! Hesabınız aktif.',
        verified: true,
        userId: user.id
      },
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
