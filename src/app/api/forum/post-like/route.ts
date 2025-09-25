import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId
          }
        }
      })

      // Update post like count
      await prisma.post.update({
        where: { id: postId },
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
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      })

      // Update post like count
      await prisma.post.update({
        where: { id: postId },
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
    console.error("Post like error:", error)
    return NextResponse.json(
      { error: "Beğeni işlemi başarısız" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if user liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      liked: !!existingLike 
    })

  } catch (error) {
    console.error("Get post like status error:", error)
    return NextResponse.json(
      { error: "Beğeni durumu alınamadı" },
      { status: 500 }
    )
  }
}
