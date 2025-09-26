import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mesajları getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const instructorId = searchParams.get('instructorId')

    if (!courseId || !instructorId) {
      return NextResponse.json({ error: 'Course ID and Instructor ID are required' }, { status: 400 })
    }

    // Mesajları getir (öğrenci ve eğitmen arasındaki)
    const messages = await prisma.message.findMany({
      where: {
        courseId: courseId,
        OR: [
          { userId: session.user.id }, // Öğrencinin gönderdiği mesajlar
          { 
            course: { 
              instructorId: instructorId 
            } 
          } // Eğitmenin kursuna gelen mesajlar
        ]
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
            instructorId: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// Yeni mesaj gönder
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

    // Kursun var olduğunu ve kullanıcının erişimi olduğunu kontrol et
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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
            image: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        }
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
