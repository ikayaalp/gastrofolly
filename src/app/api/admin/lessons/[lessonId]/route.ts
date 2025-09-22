import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Ders güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { lessonId } = await params
    const data = await request.json()
    
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl || null,
        duration: data.duration ? parseInt(data.duration) : null,
        order: parseInt(data.order),
        isFree: data.isFree || false
      }
    })

    return NextResponse.json({ 
      success: true, 
      lesson,
      message: "Ders başarıyla güncellendi" 
    })

  } catch (error) {
    console.error("Update lesson error:", error)
    return NextResponse.json(
      { error: "Ders güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Ders sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { lessonId } = await params
    
    await prisma.lesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ 
      success: true,
      message: "Ders başarıyla silindi" 
    })

  } catch (error) {
    console.error("Delete lesson error:", error)
    return NextResponse.json(
      { error: "Ders silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
