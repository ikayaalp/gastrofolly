import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Kurs yayın durumunu değiştir
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { courseId } = await params
    const { isPublished } = await request.json()
    
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished }
    })

    return NextResponse.json({ 
      success: true, 
      course,
      message: `Kurs ${isPublished ? 'yayınlandı' : 'taslağa alındı'}` 
    })

  } catch (error) {
    console.error("Toggle publish error:", error)
    return NextResponse.json(
      { error: "Durum değiştirilemedi" },
      { status: 500 }
    )
  }
}
