import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendPushToAllUsers, sendPushToUserIds } from "@/lib/pushNotifications"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
        }

        const { title, message, courseId, targetScope = 'ALL' } = await request.json()

        if (!title || !message) {
            return NextResponse.json(
                { error: "Başlık ve mesaj zorunludur" },
                { status: 400 }
            )
        }

        let targetUserIds: string[] = []

        if (targetScope === 'COURSE_ENROLLED') {
            if (!courseId) {
                return NextResponse.json({ error: "Bu seçenek için kurs seçmelisiniz" }, { status: 400 })
            }
            const enrollments = await prisma.enrollment.findMany({
                where: { courseId },
                select: { userId: true }
            })
            targetUserIds = enrollments.map(e => e.userId)
        } else if (targetScope === 'PREMIUM') {
            const premiumUsers = await prisma.user.findMany({
                where: { subscriptionEndDate: { gt: new Date() } },
                select: { id: true }
            })
            targetUserIds = premiumUsers.map(u => u.id)
        } else {
            // targetScope === 'ALL'
            const allUsers = await prisma.user.findMany({
                select: { id: true }
            })
            targetUserIds = allUsers.map(u => u.id)
        }

        // In-app bildirim oluştur
        const inAppResult = await prisma.notification.createMany({
            data: targetUserIds.map(userId => ({
                type: 'SYSTEM' as const, // Veya uygun bir tip
                title,
                message,
                userId,
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

        let result
        if (targetScope === 'ALL') {
            result = await sendPushToAllUsers(title, message, data)
        } else {
            result = await sendPushToUserIds(targetUserIds, title, message, data)
        }

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
