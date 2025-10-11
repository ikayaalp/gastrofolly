import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/emailService'

/**
 * Şifre sıfırlama bağlantısı gönder
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email gereklidir' },
        { status: 400 }
      )
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Güvenlik: Email bulunamasa bile başarılı mesaj göster (email enumeration önleme)
    if (!user) {
      return NextResponse.json(
        { message: 'Eğer bu email kayıtlıysa, sıfırlama bağlantısı gönderildi.' },
        { status: 200 }
      )
    }

    // Rastgele token oluştur (32 byte = 64 hex karakter)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // 1 saat geçerli

    // Token'ı database'e kaydet
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Reset email'i gönder
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    
    const emailSent = await sendPasswordResetEmail(email, resetUrl, user.name || undefined)

    if (!emailSent) {
      return NextResponse.json(
        { message: 'Email gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

