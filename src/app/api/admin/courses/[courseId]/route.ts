import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Kurs güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { courseId } = await params
    const data = await request.json()
    
    // İndirimli fiyat hesaplama
    const discountRate = data.discountRate ? parseFloat(data.discountRate) : null
    const discountedPrice = discountRate && discountRate > 0 && discountRate <= 100 
      ? Math.round(parseFloat(data.price) * (1 - discountRate / 100))
      : null

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        discountRate,
        discountedPrice,
        imageUrl: data.imageUrl || null,
        level: data.level,
        duration: data.duration ? parseInt(data.duration) : null,
        isPublished: data.isPublished,
        instructorId: data.instructorId,
        categoryId: data.categoryId
      }
    })

    return NextResponse.json({ 
      success: true, 
      course,
      message: "Kurs başarıyla güncellendi" 
    })

  } catch (error) {
    console.error("Update course error:", error)
    return NextResponse.json(
      { error: "Kurs güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Kurs sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { courseId } = await params
    
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ 
      success: true,
      message: "Kurs başarıyla silindi" 
    })

  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json(
      { error: "Kurs silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
