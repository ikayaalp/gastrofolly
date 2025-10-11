import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/passwordValidator'

/**
 * Şifreyi sıfırla (token ile)
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { message: 'Tüm alanlar gereklidir' },
        { status: 400 }
      )
    }

    // Güçlü şifre kontrolü
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Token kontrolü
    if (!user.resetToken || user.resetToken !== token) {
      return NextResponse.json(
        { message: 'Geçersiz sıfırlama bağlantısı' },
        { status: 400 }
      )
    }

    // Token süresi dolmuş mu?
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json(
        { message: 'Sıfırlama bağlantısı süresi dolmuş. Lütfen yeni bağlantı isteyin.' },
        { status: 400 }
      )
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Şifreyi güncelle ve token'ı sil
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json(
      { message: 'Şifreniz başarıyla değiştirildi!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

