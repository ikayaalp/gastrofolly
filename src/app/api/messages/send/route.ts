import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mesaj gönder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, courseId, parentId } = await request.json()

    if (!content || !courseId) {
      return NextResponse.json({ error: 'Content and course ID are required' }, { status: 400 })
    }

    // Kursun var olduğunu kontrol et
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Kullanıcı kursa kayıtlı mı veya eğitmen mi kontrol et
    const isEnrolled = course.enrollments.length > 0
    const isInstructor = course.instructorId === session.user.id

    if (!isEnrolled && !isInstructor) {
      return NextResponse.json({ 
        error: 'Bu kursa kayıtlı olmadığınız için mesaj gönderemezsiniz.' 
      }, { status: 403 })
    }

    // Eğer bu bir yanıt ise, parent mesajın varlığını kontrol et
    if (parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId },
        include: {
          course: true
        }
      })

      if (!parentMessage || parentMessage.courseId !== courseId) {
        return NextResponse.json({ error: 'Invalid parent message' }, { status: 400 })
      }
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        courseId: courseId,
        parentId: parentId || null
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
                image: true
              }
            }
          }
        }
      }
    })

    // Eğer bu bir yanıt ise parent mesajın updatedAt'ını güncelle (konuşmayı en üste çıkarmak için)
    if (parentId) {
      await prisma.message.update({
        where: { id: parentId },
        data: { updatedAt: new Date() }
      })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

