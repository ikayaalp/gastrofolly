import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    // NextAuth.js kullanıldığı için şifre değiştirme işlemi desteklenmiyor
    // Bu özellik için OAuth provider'ları kullanılmalı
    return NextResponse.json({ 
      error: "Şifre değiştirme özelliği desteklenmiyor. Lütfen OAuth ile giriş yapın." 
    }, { status: 400 })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: "Şifre değiştirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
