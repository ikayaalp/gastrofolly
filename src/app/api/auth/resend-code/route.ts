import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, sendVerificationEmail, getCodeExpiry } from '@/lib/emailService'

/**
 * Yeni doğrulama kodu gönder
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
        { error: 'Email zaten doğrulanmış' },
        { status: 400 }
      )
    }

    // Yeni kod oluştur
    const verificationCode = generateVerificationCode()
    const codeExpiry = getCodeExpiry()

    // Kullanıcıyı güncelle
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode,
        verificationCodeExpiry: codeExpiry,
      },
    })

    // Email gönder
    const emailSent = await sendVerificationEmail(email, verificationCode, user.name || undefined)

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

