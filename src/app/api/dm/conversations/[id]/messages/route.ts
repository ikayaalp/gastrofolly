import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { containsProfanity } from '@/lib/profanity'
import { sendPushNotification } from '@/lib/pushNotifications'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: conversationId } = await params

        // Verify participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId: user.id } }
        })
        if (!participant) {
            return NextResponse.json({ error: 'Bu konuşmaya erişim yetkiniz yok' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const messages = await prisma.directMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' }, // Fetch newest first for pagination
            skip,
            take: limit,
            include: {
                sender: { select: { id: true, name: true, image: true } }
            }
        })

        // Reverse to send oldest-to-newest for UI
        messages.reverse()

        const totalMessages = await prisma.directMessage.count({ where: { conversationId } })
        const hasMore = skip + messages.length < totalMessages

        return NextResponse.json({
            success: true,
            data: messages,
            pagination: { page, limit, hasMore, total: totalMessages }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }



    try {
        const { id: conversationId } = await params
        const { content } = await request.json()

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 })
        }

        if (containsProfanity(content)) {
            return NextResponse.json({ error: 'Lütfen mesajınızda uygunsuz kelimeler kullanmayın.' }, { status: 400 })
        }

        // Verify participant and get other participant for push
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: { include: { user: true } } }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 })
        }

        const isParticipant = conversation.participants.some(p => p.userId === user.id)
        if (!isParticipant) {
            return NextResponse.json({ error: 'Bu konuşmaya erişim yetkiniz yok' }, { status: 403 })
        }

        const otherParticipant = conversation.participants.find(p => p.userId !== user.id)

        // Save message and update conversation
        const [message] = await prisma.$transaction([
            prisma.directMessage.create({
                data: {
                    conversationId,
                    senderId: user.id,
                    content: content.trim()
                },
                include: {
                    sender: { select: { id: true, name: true, image: true } }
                }
            }),
            prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }
            }),
            // Auto read for sender
            prisma.conversationParticipant.update({
                where: { conversationId_userId: { conversationId, userId: user.id } },
                data: { lastReadAt: new Date() }
            })
        ])

        const currentParticipant = conversation.participants.find(p => p.userId === user.id)
        const senderName = currentParticipant?.user.name || 'Kullanıcı'
        const senderImage = currentParticipant?.user.image

        // Trigger Pusher events
        try {
            await pusherServer.trigger(`private-conversation-${conversationId}`, 'new-message', message)
            if (otherParticipant) {
                await pusherServer.trigger(`private-user-${otherParticipant.userId}`, 'inbox-update', {
                    conversationId,
                    lastMessage: message.content,
                    senderName,
                    senderImage,
                    createdAt: message.createdAt
                })
            }
        } catch (pusherError) {
            console.error('Pusher event error:', pusherError)
        }

        // Send Push Notification
        if (otherParticipant && otherParticipant.user.pushToken) {
            try {
                await sendPushNotification(
                    otherParticipant.user.pushToken,
                    senderName || 'Yeni Mesaj',
                    message.content,
                    { type: 'new_dm', conversationId }
                )
            } catch (pushError) {
                console.error('Push notification error:', pushError)
                // Don't fail the request if push fails
            }
        }

        return NextResponse.json({ success: true, data: message }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
