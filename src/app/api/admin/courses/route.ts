import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Yeni kurs oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const data = await request.json()
    
    // İndirimli fiyat hesaplama
    const discountRate = data.discountRate ? parseFloat(data.discountRate) : null
    const discountedPrice = discountRate && discountRate > 0 && discountRate <= 100 
      ? Math.round(parseFloat(data.price) * (1 - discountRate / 100))
      : null
    
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.isFree ? 0 : parseFloat(data.price),
        isFree: Boolean(data.isFree),
        discountRate,
        discountedPrice: data.isFree ? null : discountedPrice,
        imageUrl: data.imageUrl || null,
        thumbnailImageUrl: data.thumbnailImageUrl || null,
        posterImageUrl: data.posterImageUrl || null,
        detailImageUrl: data.detailImageUrl || null,
        level: data.level,
        duration: data.duration ? parseInt(data.duration) : null,
        isPublished: data.isPublished || false,
        instructorId: data.instructorId,
        categoryId: data.categoryId
      }
    })

    return NextResponse.json({ 
      success: true, 
      course,
      message: "Kurs başarıyla oluşturuldu" 
    })

  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json(
      { error: "Kurs oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

// Kursları listele (Pagination + Arama)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""
    const statusFilter = searchParams.get("status") || "ALL"

    // 1. FİLTRELER
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { instructor: { name: { contains: search, mode: "insensitive" } } }
      ]
    }

    if (statusFilter === "PUBLISHED") {
      whereClause.isPublished = true
    } else if (statusFilter === "DRAFT") {
      whereClause.isPublished = false
    }

    // 2. VERİYİ ÇEK
    const [courses, totalFiltered] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        include: {
          instructor: { select: { id: true, name: true, email: true, image: true } },
          category: { select: { id: true, name: true } },
          lessons: { select: { id: true, title: true, videoUrl: true, pdfUrl: true, isFree: true, description: true, duration: true, order: true } },
          _count: { select: { enrollments: true, lessons: true, payments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.course.count({ where: whereClause })
    ])

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        pages: Math.ceil(totalFiltered / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
