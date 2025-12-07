import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topicId } = await request.json()

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    // Check if user already liked this topic
    const existingLike = await prisma.topicLike.findUnique({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: topicId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.topicLike.delete({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId: topicId
          }
        }
      })

      // Update topic like count
      await prisma.topic.update({
        where: { id: topicId },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Beğeni kaldırıldı"
      })
    } else {
      // Like - add the like
      await prisma.topicLike.create({
        data: {
          userId: user.id,
          topicId: topicId
        }
      })

      // Update topic like count
      await prisma.topic.update({
        where: { id: topicId },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })

      return NextResponse.json({
        success: true,
        liked: true,
        message: "Beğenildi"
      })
    }

  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json(
      { error: "Beğeni işlemi başarısız" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    // Check if user liked this topic
    const existingLike = await prisma.topicLike.findUnique({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: topicId
        }
      }
    })

    return NextResponse.json({
      success: true,
      liked: !!existingLike
    })

  } catch (error) {
    console.error("Get like status error:", error)
    return NextResponse.json(
      { error: "Beğeni durumu alınamadı" },
      { status: 500 }
    )
  }
}

