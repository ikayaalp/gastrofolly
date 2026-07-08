import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const participants = await prisma.conversationParticipant.findMany({
            where: { userId: user.id },
            include: {
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: { select: { id: true, name: true, image: true } }
                            }
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        })

        const conversations = await Promise.all(
            participants.map(async (p) => {
                const conversation = p.conversation
                const otherParticipant = conversation.participants.find(cp => cp.userId !== user.id)
                
                // Count unread messages
                const unreadCount = await prisma.directMessage.count({
                    where: {
                        conversationId: conversation.id,
                        createdAt: { gt: p.lastReadAt ?? new Date(0) },
                        senderId: { not: user.id }
                    }
                })

                return {
                    id: conversation.id,
                    lastMessageAt: conversation.lastMessageAt,
                    createdAt: conversation.createdAt,
                    otherUser: otherParticipant?.user || null,
                    lastMessage: conversation.messages[0] || null,
                    unreadCount,
                    deletedAt: p.deletedAt
                }
            })
        )

        // Filter out conversations that have no messages yet, or are marked as deleted
        const validConversations = conversations.filter(c => c.lastMessage !== null && !c.deletedAt)

        // Sort by lastMessageAt (or createdAt if null) descending
        validConversations.sort((a, b) => {
            const dateA = a.lastMessageAt || a.createdAt
            const dateB = b.lastMessageAt || b.createdAt
            return new Date(dateB).getTime() - new Date(dateA).getTime()
        })

        return NextResponse.json({ success: true, data: validConversations })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await getAuthUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { otherUserId } = await request.json()

        if (!otherUserId) {
            return NextResponse.json({ error: 'otherUserId gerekli' }, { status: 400 })
        }

        if (otherUserId === user.id) {
            return NextResponse.json({ error: 'Kendinizle konuşma başlatamazsınız' }, { status: 400 })
        }

        const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } })
        if (!otherUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
        }

        // Check if a conversation between these two already exists
        const existingConversations = await prisma.conversation.findMany({
            where: {
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId: otherUserId } } },
                    // Ensure it only has these 2 participants (for strictly 1-on-1)
                    { participants: { every: { userId: { in: [user.id, otherUserId] } } } }
                ]
            }
        })

        if (existingConversations.length > 0) {
            return NextResponse.json({ success: true, data: { conversationId: existingConversations[0].id } })
        }

        // Create new conversation
        const newConversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: user.id },
                        { userId: otherUserId }
                    ]
                }
            }
        })

        return NextResponse.json({ success: true, data: { conversationId: newConversation.id } }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
