import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    const likes = await prisma.topicLike.findMany({
      where: { topicId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    const likers = likes.map(like => ({
      id: like.user.id,
      name: like.user.name,
      image: like.user.image,
      likedAt: like.createdAt
    }))

    return NextResponse.json({
      success: true,
      likers,
      total: likers.length
    })

  } catch (error) {
    console.error("Get topic likers error:", error)
    return NextResponse.json(
      { error: "Beğenenler yüklenemedi" },
      { status: 500 }
    )
  }
}
