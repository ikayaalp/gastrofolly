import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: true,
        category: true,
        reviews: true,
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error fetching featured courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}


