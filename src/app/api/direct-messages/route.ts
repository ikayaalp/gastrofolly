import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DM'leri getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 })
    }

    // İki kullanıcı arasındaki tüm mesajları getir
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: otherUserId
          },
          {
            senderId: otherUserId,
            receiverId: session.user.id
          }
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
        createdAt: 'asc'
      }
    })

    // Mesajları okundu olarak işaretle
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching direct messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch direct messages' },
      { status: 500 }
    )
  }
}

// Yeni DM gönder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, receiverId } = await request.json()

    if (!content || !receiverId) {
      return NextResponse.json({ error: 'Content and receiver ID are required' }, { status: 400 })
    }

    // Alıcının var olduğunu kontrol et
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Kendine mesaj göndermeyi engelle
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 })
    }

    // Mesajı oluştur
    const message = await prisma.directMessage.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId: receiverId
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
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating direct message:', error)
    return NextResponse.json(
      { error: 'Failed to create direct message' },
      { status: 500 }
    )
  }
}
