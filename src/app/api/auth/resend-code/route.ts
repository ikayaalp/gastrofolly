import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode, sendVerificationEmail, getCodeExpiry } from '@/lib/emailService'
import { getPendingUser, updatePendingUserCode } from '@/lib/pendingUsers'

/**
 * Yeni doğrulama kodu gönder (pending users için)
 * POST /api/auth/resend-code
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email gereklidir' },
        { status: 400 }
      )
    }

    // Geçici storage'dan kullanıcıyı al
    const pendingUser = getPendingUser(email)

    if (!pendingUser) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı. Lütfen tekrar kayıt olun.' },
        { status: 404 }
      )
    }

    // Yeni kod oluştur
    const verificationCode = generateVerificationCode()
    const codeExpiry = getCodeExpiry()

    // Pending user'ın kodunu güncelle
    updatePendingUserCode(email, verificationCode, codeExpiry)

    // Email gönder
    const emailSent = await sendVerificationEmail(email, verificationCode, pendingUser.name)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Email gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Yeni doğrulama kodu gönderildi!', sent: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Kod gönderilemedi' },
      { status: 500 }
    )
  }
}

