import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { courseId } = await params
    const body = await request.json()
    const { isPublished } = body

    // Check if course exists and belongs to instructor
    const existingCourse = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: session.user.id 
      }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished },
      include: {
        category: true,
        instructor: true
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error toggling course publish status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
