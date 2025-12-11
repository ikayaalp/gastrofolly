import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendPushToAllUsers } from "@/lib/pushNotifications"

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

    // Eğer kurs yayınlandıysa, tüm kullanıcılara bildirim gönder
    if (isPublished) {
      // In-app bildirimler oluştur
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      })

      await prisma.notification.createMany({
        data: allUsers.map(u => ({
          type: 'NEW_COURSE' as const,
          title: '🎉 Yeni Kurs Eklendi!',
          message: `"${course.title}" kursu artık yayında! Hemen keşfet.`,
          userId: u.id,
          courseId: course.id
        }))
      })

      // Push notification gönder (mobil cihazlara)
      await sendPushToAllUsers(
        '🎉 Yeni Kurs Eklendi!',
        `"${course.title}" kursu artık yayında! Hemen keşfet.`,
        { courseId: course.id, type: 'NEW_COURSE' }
      )
    }

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
