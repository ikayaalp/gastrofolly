import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instructorId } = await params

    // Eğitmenin kurslarını getir
    const courses = await prisma.course.findMany({
      where: {
        instructorId: instructorId,
        isPublished: true
      },
      include: {
        enrollments: {
          where: {
            userId: session.user.id
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Sadece kullanıcının kayıtlı olduğu kursları filtrele
    const enrolledCourses = courses.filter(course => course.enrollments.length > 0)

    return NextResponse.json({ 
      courses: enrolledCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        imageUrl: course.imageUrl,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        _count: course._count
      }))
    })
  } catch (error) {
    console.error('Error fetching instructor courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
