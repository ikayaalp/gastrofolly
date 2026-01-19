import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Kullanıcının bildirimlerini getir
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 30
        })

        // Okunmamış bildirim sayısı
        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, isRead: false }
        })

        return NextResponse.json(
            { notifications, unreadCount },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            }
        )
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Bildirimler getirilemedi' }, { status: 500 })
    }
}

// POST - Yeni bildirim oluştur (Admin veya sistem tarafından)
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })
        }

        const { type, title, message, courseId, sendToAll } = await request.json()

        if (!type || !title || !message) {
            return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
        }

        // Tüm kullanıcılara gönder
        if (sendToAll) {
            const allUsers = await prisma.user.findMany({
                select: { id: true }
            })

            const notifications = await prisma.notification.createMany({
                data: allUsers.map(u => ({
                    type,
                    title,
                    message,
                    userId: u.id,
                    courseId: courseId || null
                }))
            })

            return NextResponse.json({
                success: true,
                count: notifications.count,
                message: `${notifications.count} kullanıcıya bildirim gönderildi`
            })
        }

        return NextResponse.json({ error: 'sendToAll parametresi gerekli' }, { status: 400 })
    } catch (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json({ error: 'Bildirim oluşturulamadı' }, { status: 500 })
    }
}
// PATCH - Bildirimleri güncelle (Tümünü okundu işaretle)
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const body = await request.json()
        const { action } = body

        if (action === 'markAllRead') {
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: { isRead: true }
            })

            return NextResponse.json({ success: true, message: 'Tüm bildirimler okundu işaretlendi' })
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    } catch (error) {
        console.error('Error updating notifications:', error)
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 })
    }
}
