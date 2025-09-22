import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Yeni ders oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const data = await request.json()
    
    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl || null,
        duration: data.duration ? parseInt(data.duration) : null,
        order: parseInt(data.order),
        isFree: data.isFree || false,
        courseId: data.courseId
      }
    })

    return NextResponse.json({ 
      success: true, 
      lesson,
      message: "Ders başarıyla oluşturuldu" 
    })

  } catch (error) {
    console.error("Create lesson error:", error)
    return NextResponse.json(
      { error: "Ders oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
