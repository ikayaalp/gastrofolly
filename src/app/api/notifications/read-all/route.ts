import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

// PUT - Tüm bildirimleri okundu olarak işaretle
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true, message: 'Tüm bildirimler okundu olarak işaretlendi' })
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 })
    }
}
