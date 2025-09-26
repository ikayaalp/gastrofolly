import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Kullanıcının konuşmalarını getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kullanıcının katıldığı konuşmaları getir
    const conversations = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Konuşmaları grupla ve son mesajları al
    const conversationMap = new Map()
    
    conversations.forEach(message => {
      const otherUserId = message.senderId === session.user.id 
        ? message.receiverId 
        : message.senderId
      
      const otherUser = message.senderId === session.user.id 
        ? message.receiver 
        : message.sender

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUser,
          lastMessage: message,
          unreadCount: 0
        })
      }

      // Okunmamış mesaj sayısını hesapla
      if (message.receiverId === session.user.id && !message.isRead) {
        conversationMap.get(otherUserId).unreadCount++
      }
    })

    // Konuşmaları son mesaj tarihine göre sırala
    const sortedConversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())

    return NextResponse.json({ conversations: sortedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
