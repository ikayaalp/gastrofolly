import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Belirli bir eğitmenle olan tüm mesaj thread'lerini getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const courseId = searchParams.get('courseId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Kullanıcının bu eğitmenle olan kurslarını kontrol et
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        course: {
          instructorId: instructorId
        },
        ...(courseId && { courseId: courseId })
      },
      include: {
        course: {
          include: {
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
        }
      }
    })

    if (enrollments.length === 0 && session.user.id !== instructorId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Eğer kullanıcı eğitmense, öğrencinin mesajlarını getir
    const isInstructor = session.user.id === instructorId

    let messages
    if (isInstructor) {
      // Eğitmen, tüm öğrencilerden gelen mesajları görebilir
      messages = await prisma.message.findMany({
        where: {
          course: {
            instructorId: session.user.id
          },
          parentId: null
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
              imageUrl: true
            }
          },
          replies: {
            include: {
              user: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Öğrenci, sadece kendi mesajlarını görebilir
      const courseIds = enrollments.map(e => e.courseId)
      
      messages = await prisma.message.findMany({
        where: {
          userId: session.user.id,
          courseId: courseId || { in: courseIds },
          parentId: null
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
            include: {
              user: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({ 
      messages,
      courses: enrollments.map(e => ({
        id: e.course.id,
        title: e.course.title,
        imageUrl: e.course.imageUrl,
        instructor: e.course.instructor
      }))
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

