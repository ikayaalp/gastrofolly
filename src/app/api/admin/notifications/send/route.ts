import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendPushToAllUsers } from "@/lib/pushNotifications"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
        }

        const { title, message, courseId } = await request.json()

        if (!title || !message) {
            return NextResponse.json(
                { error: "Başlık ve mesaj zorunludur" },
                { status: 400 }
            )
        }

        // In-app bildirim oluştur
        const allUsers = await prisma.user.findMany({
            select: { id: true }
        })

        const inAppResult = await prisma.notification.createMany({
            data: allUsers.map(u => ({
                type: 'SYSTEM' as const, // Veya uygun bir tip
                title,
                message,
                userId: u.id,
                courseId: courseId || null
            }))
        })

        // Push notification gönder
        const data: Record<string, unknown> = {
            type: 'MANUAL_ANNOUNCEMENT'
        }

        if (courseId) {
            data.courseId = courseId
            data.screen = 'CourseDetail'
            data.params = { courseId }
        }

        const result = await sendPushToAllUsers(title, message, data)

        return NextResponse.json({
            success: true,
            inAppCount: inAppResult.count,
            result
        })

    } catch (error) {
        console.error("Send notification error:", error)
        return NextResponse.json(
            { error: "Bildirim gönderilemedi" },
            { status: 500 }
        )
    }
}
