import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Mevcut kullanıcıyı al (takip durumu kontrolü için)
    let currentUser = null
    try {
      currentUser = await getAuthUser(request)
    } catch (e) {
      // Giriş yapmamış kullanıcılar da profil görebilir
    }

    // Kullanıcı bilgilerini çek
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        coverImage: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            topics: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Takip durumunu kontrol et
    let isFollowing = false
    if (currentUser?.id && currentUser.id !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: userId
          }
        }
      })
      isFollowing = !!follow
    }

    // Kullanıcının gönderilerini çek
    const [topics, totalTopics] = await Promise.all([
      prisma.topic.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          _count: {
            select: {
              posts: true
            }
          }
        }
      }),
      prisma.topic.count({ where: { authorId: userId } })
    ])

    return NextResponse.json({
      user: {
        ...user,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        topicsCount: user._count.topics,
      },
      isFollowing,
      isOwnProfile: currentUser?.id === userId,
      topics,
      pagination: {
        page,
        limit,
        total: totalTopics,
        pages: Math.ceil(totalTopics / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Profil yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
