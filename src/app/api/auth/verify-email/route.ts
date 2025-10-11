import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCodeExpired } from '@/lib/emailService'
import { getPendingUser, deletePendingUser } from '@/lib/pendingUsers'

/**
 * Email doğrulama kodu kontrol et ve kullanıcı oluştur
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

    // Geçici storage'dan kullanıcıyı al
    const pendingUser = getPendingUser(email)

    if (!pendingUser) {
      return NextResponse.json(
        { error: 'Kayıt bulunamadı. Lütfen tekrar kayıt olun.' },
        { status: 404 }
      )
    }

    // Kod eşleşiyor mu?
    if (pendingUser.verificationCode !== code) {
      return NextResponse.json(
        { error: 'Geçersiz doğrulama kodu' },
        { status: 400 }
      )
    }

    // Kod süresi dolmuş mu?
    if (isCodeExpired(pendingUser.codeExpiry)) {
      return NextResponse.json(
        { error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // ✅ Kod doğru! Şimdi kullanıcıyı Prisma'da oluştur
    const user = await prisma.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password, // Hashlenmiş şifre
        emailVerified: new Date(), // Email doğrulandı
      }
    })

    // Geçici storage'dan sil
    deletePendingUser(email)

    return NextResponse.json(
      { 
        message: 'Email başarıyla doğrulandı! Hesabınız oluşturuldu.', 
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

