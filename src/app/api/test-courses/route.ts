import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true
      },
      take: 5
    })

    console.log("Total courses found:", courses.length)
    courses.forEach(course => {
      console.log(`- ${course.title} (Published: ${course.isPublished})`)
    })

    return NextResponse.json({ 
      success: true,
      total: courses.length,
      courses: courses
    })

  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      { error: "Database test failed", details: error },
      { status: 500 }
    )
  }
}
