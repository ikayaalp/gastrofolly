import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const level = searchParams.get("level")
    const categoryId = searchParams.get("categoryId")

    console.log("Search params:", { query, level, categoryId })

    // En az bir arama kriteri olmalı
    const hasQuery = query && query.trim().length >= 2;
    if (!hasQuery && !level && !categoryId) {
      return NextResponse.json({ courses: [], message: "En az bir arama kriteri girin" })
    }

    const whereClause: any = {
      isPublished: true,
    }

    // Kelime araması varsa ekle
    if (hasQuery) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { instructor: { name: { contains: query, mode: 'insensitive' } } },
        { category: { name: { contains: query, mode: 'insensitive' } } }
      ];
    }

    // Seviye filtresi varsa ekle
    if (level) {
      // Prisma Enum ile uyuşması için uppercase olması gerekebilir
      whereClause.level = level.toUpperCase();
    }

    // Kategori filtresi varsa ekle
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: { select: { name: true, image: true } },
        category: { select: { name: true, id: true } },
        reviews: { select: { rating: true } },
        _count: { select: { enrollments: true, lessons: true } }
      },
      take: 20,
      orderBy: [
        { enrollments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      courses,
      total: courses.length,
      query: query?.trim() || ""
    })

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Arama sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
}
