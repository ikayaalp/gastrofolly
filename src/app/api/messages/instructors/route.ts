import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Kullanıcının kayıtlı olduğu kursların eğitmenlerini getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kullanıcının kayıtlı olduğu kursları ve eğitmenleri getir
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id
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
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        }
      }
    })

    // Eğitmenleri ve kurslarını grupla
    const instructorsMap = new Map()
    
    enrollments.forEach(enrollment => {
      const instructor = enrollment.course.instructor
      const course = enrollment.course
      
      if (!instructorsMap.has(instructor.id)) {
        instructorsMap.set(instructor.id, {
          ...instructor,
          courses: []
        })
      }
      
      instructorsMap.get(instructor.id).courses.push({
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        lessonCount: course._count.lessons
      })
    })

    const instructors = Array.from(instructorsMap.values())

    return NextResponse.json({ instructors })
  } catch (error) {
    console.error('Error fetching instructors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    )
  }
}

