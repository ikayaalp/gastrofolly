import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    
    console.log("Search query:", query)
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ courses: [], message: "En az 2 karakter girin" })
    }

    const courses = await prisma.course.findMany({
      where: {
        AND: [
          { isPublished: true },
          {
            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                instructor: {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              },
              {
                category: {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        instructor: {
          select: {
            name: true,
            image: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true
          }
        }
      },
      take: 20,
      orderBy: [
        { enrollments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ]
    })

    console.log("Found courses:", courses.length)
    console.log("Sample course:", courses[0]?.title)
    
    return NextResponse.json({ 
      courses,
      total: courses.length,
      query: query.trim()
    })

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Arama sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
}
