import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jwt from 'jsonwebtoken'

// Helper to get userId from session or JWT token
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try NextAuth session first
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return session.user.id
  }

  // Try JWT token for mobile
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string }
      return decoded.userId
    } catch (e) {
      // Invalid token
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { lessonId, courseId, isCompleted } = await request.json()

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "Lesson ID and Course ID are required" },
        { status: 400 }
      )
    }

    // Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      )
    }

    // İlerleme kaydını oluştur veya güncelle
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: lessonId,
        }
      },
      update: {
        isCompleted: isCompleted,
        watchedAt: new Date(),
      },
      create: {
        userId: userId,
        lessonId: lessonId,
        courseId: courseId,
        isCompleted: isCompleted,
        watchedAt: new Date(),
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId: userId,
        courseId: courseId,
      },
      include: {
        lesson: true,
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
