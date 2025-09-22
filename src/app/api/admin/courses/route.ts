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
        price: parseFloat(data.price),
        discountRate,
        discountedPrice,
        imageUrl: data.imageUrl || null,
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
