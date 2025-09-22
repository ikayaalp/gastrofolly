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

    const { courseId, rating, comment } = await request.json()

    if (!courseId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You must be enrolled to review this course' }, { status: 403 })
    }

    // Her zaman yeni yorum oluştur (birden fazla yorum yapabilir)
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        courseId,
        rating,
        comment
      },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
