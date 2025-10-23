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

    // Kullanıcının mesajlarını getir (hem gönderdiği hem de aldığı)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            course: {
              instructorId: session.user.id
            }
          }
        ],
        parentId: null // Sadece ana mesajlar, yanıtlar değil
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        },
        replies: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Konuşmaları grupla (her eğitmen için bir konuşma)
    const conversationsMap = new Map()

    for (const message of messages) {
      const isInstructor = session.user.id === message.course.instructorId
      const otherUserId = isInstructor ? message.userId : message.course.instructorId
      
      if (!conversationsMap.has(otherUserId)) {
        const otherUser = isInstructor 
          ? message.user 
          : message.course.instructor

        conversationsMap.set(otherUserId, {
          otherUser,
          course: {
            id: message.course.id,
            title: message.course.title,
            imageUrl: message.course.imageUrl
          },
          lastMessage: message,
          lastMessageTime: message.replies.length > 0 
            ? message.replies[0].createdAt 
            : message.createdAt,
          unreadCount: 0 // Bu gelecekte eklenebilir
        })
      } else {
        // Daha yeni mesaj varsa güncelle
        const existing = conversationsMap.get(otherUserId)
        const existingTime = existing.lastMessageTime
        const currentTime = message.replies.length > 0 
          ? message.replies[0].createdAt 
          : message.createdAt

        if (new Date(currentTime) > new Date(existingTime)) {
          existing.lastMessage = message
          existing.lastMessageTime = currentTime
        }
      }
    }

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

