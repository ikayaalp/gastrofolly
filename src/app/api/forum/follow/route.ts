import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Kendini takip edemez
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Kendinizi takip edemezsiniz' },
        { status: 400 }
      )
    }

    // Hedef kullanıcı var mı kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Mevcut takip durumunu kontrol et
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: userId
        }
      }
    })

    if (existingFollow) {
      // Takipten çık
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      })

      return NextResponse.json({
        followed: false,
        message: 'Takipten çıkıldı'
      })
    } else {
      // Takip et
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: userId
        }
      })

      return NextResponse.json({
        followed: true,
        message: 'Takip edildi'
      })
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return NextResponse.json(
      { error: 'İşlem sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
