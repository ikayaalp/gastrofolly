import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
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
          userId: session.user.id,
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
          userId: session.user.id,
          lessonId: lessonId,
        }
      },
      update: {
        isCompleted: isCompleted,
        watchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
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
        userId: session.user.id,
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

