import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function PUT(request: NextRequest) {
  try {
    let userId: string | null = null

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      userId = session.user.id
    } else {
      // Try JWT token (mobile)
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string }
          userId = decoded.userId
        } catch (err) {
          console.error('JWT verification failed:', err)
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Mevcut şifre ve yeni şifre gereklidir" }, { status: 400 })
    }

    // Use same validation as web registration
    const { validatePassword } = await import('@/lib/passwordValidator')
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json({
        error: "Bu hesap sosyal medya ile oluşturulmuş. Şifre değiştirilemez."
      }, { status: 400 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 })
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true, message: "Şifreniz başarıyla değiştirildi" })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: "Şifre değiştirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
