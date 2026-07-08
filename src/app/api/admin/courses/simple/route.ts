import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Admin paneli için basit kurs listesi (id, title, imageUrl)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        instructor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("[ADMIN_COURSES_SIMPLE_GET]", error)
    return NextResponse.json(
      { error: "Kurslar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
