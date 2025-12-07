import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

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

    // Get all posts in this topic that the user has liked
    const likedPosts = await prisma.postLike.findMany({
      where: {
        userId: user.id,
        post: {
          topicId: topicId
        }
      },
      select: {
        postId: true
      }
    })

    // Return array of post IDs
    const postIds = likedPosts.map(like => like.postId)

    return NextResponse.json({
      success: true,
      likedPostIds: postIds
    })

  } catch (error) {
    console.error("Get liked posts error:", error)
    return NextResponse.json(
      { error: "Beğenilen yorumlar alınamadı" },
      { status: 500 }
    )
  }
}

