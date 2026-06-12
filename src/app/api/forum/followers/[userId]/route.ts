import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'followers' // 'followers' or 'following'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (type === 'followers') {
      // Bu kullanıcıyı takip edenler
      const [followers, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followingId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            follower: {
              select: {
                id: true,
                name: true,
                image: true,
                bio: true,
              }
            }
          }
        }),
        prisma.follow.count({ where: { followingId: userId } })
      ])

      return NextResponse.json({
        users: followers.map(f => ({
          id: f.follower.id,
          name: f.follower.name,
          image: f.follower.image,
          bio: f.follower.bio,
          followedAt: f.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } else {
      // Bu kullanıcının takip ettikleri
      const [following, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            following: {
              select: {
                id: true,
                name: true,
                image: true,
                bio: true,
              }
            }
          }
        }),
        prisma.follow.count({ where: { followerId: userId } })
      ])

      return NextResponse.json({
        users: following.map(f => ({
          id: f.following.id,
          name: f.following.name,
          image: f.following.image,
          bio: f.following.bio,
          followedAt: f.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    }
  } catch (error) {
    console.error('Error fetching follow list:', error)
    return NextResponse.json(
      { error: 'Liste yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
