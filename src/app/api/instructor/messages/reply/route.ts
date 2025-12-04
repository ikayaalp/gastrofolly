import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece eğitmenler mesaj yanıtlayabilir
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { messageId, content } = await request.json()

    if (!messageId || !content) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 })
    }

    // Orijinal mesajı bul ve eğitmenin kursu olduğunu kontrol et
    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    })

    if (!originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Eğitmenin bu kursun sahibi olduğunu kontrol et
    if (originalMessage.course.instructorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Yanıt mesajını oluştur
    const reply = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        courseId: originalMessage.courseId,
        parentId: messageId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      }
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
