import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all topics that the user has liked
    const likedTopics = await prisma.topicLike.findMany({
      where: {
        userId: user.id
      },
      select: {
        topicId: true
      }
    })

    // Return array of topic IDs
    const topicIds = likedTopics.map(like => like.topicId)

    return NextResponse.json({
      success: true,
      likedTopicIds: topicIds
    })

  } catch (error) {
    console.error("Get liked topics error:", error)
    return NextResponse.json(
      { error: "Beğenilen başlıklar alınamadı" },
      { status: 500 }
    )
  }
}

