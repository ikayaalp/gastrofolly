import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

// PUT - Bildirimi okundu olarak işaretle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const { id } = await params

        // Bildirimin bu kullanıcıya ait olduğunu kontrol et
        const notification = await prisma.notification.findFirst({
            where: { id, userId: user.id }
        })

        if (!notification) {
            return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 })
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 })
    }
}
