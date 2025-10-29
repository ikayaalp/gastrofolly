import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const courses = await prisma.course.findMany({
      where: { instructorId: session.user.id },
      include: {
        category: true,
        reviews: true,
        lessons: {
          orderBy: { order: 'asc' }
        },
        _count: { 
          select: { 
            enrollments: true, 
            lessons: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching instructor courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, price, categoryId, imageUrl, isPublished, isFree } = body

    if (!title || !description || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: isFree ? 0 : parseFloat(price),
        isFree: Boolean(isFree),
        categoryId,
        imageUrl: imageUrl || null,
        isPublished: isPublished || false,
        instructorId: session.user.id
      },
      include: {
        category: true,
        instructor: true
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
