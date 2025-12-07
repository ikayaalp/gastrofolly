import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Try JWT token (mobile)
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string };
          userId = decoded.userId;
        } catch (err) {
          console.error('JWT verification failed:', err);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionEndDate: true,
        payments: {
          where: { status: 'COMPLETED', amount: { gt: 0 } },
          select: { courseId: true }
        }
      }
    })

    const isSubscriptionValid = user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()
    const purchasedCourseIds = user?.payments.map(p => p.courseId) || []

    // Abonelik seviyesini belirle
    let userSubscriptionLevel = 0 // 0: yok, 1: Commis, 2: Chef D party, 3: Executive
    if (isSubscriptionValid && user?.subscriptionPlan) {
      if (user.subscriptionPlan === 'Commis') userSubscriptionLevel = 1
      else if (user.subscriptionPlan === 'Chef D party') userSubscriptionLevel = 2
      else if (user.subscriptionPlan === 'Executive') userSubscriptionLevel = 3
    }

    const rawEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true,
            category: true,
            lessons: true,
            reviews: true,
            _count: { select: { lessons: true, enrollments: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Kullanıcının her kurs için ilerleme durumunu al
    const progressData = await prisma.progress.findMany({
      where: { userId },
      select: { courseId: true }
    })

    // Her kurs için ilerleme olup olmadığını belirle
    const courseIdsWithProgress = new Set(progressData.map(p => p.courseId))

    // Enrollments filtreleme: Abonelik seviyesine göre kursları filtrele
    const enrollments = rawEnrollments
      .filter(enrollment => {
        const course = enrollment.course

        // Ücretsiz kurslar her zaman görünür
        if (course.price === 0) return true

        // Satın alınmış kurslar her zaman görünür
        if (purchasedCourseIds.includes(enrollment.courseId)) return true

        // Abonelik yoksa, sadece ücretsiz ve satın alınmış kurslar görünür
        if (!isSubscriptionValid) return false

        // Abonelik varsa, seviyeye göre filtrele
        const courseLevelValue = course.level === 'BEGINNER' ? 1 : course.level === 'INTERMEDIATE' ? 2 : 3
        return userSubscriptionLevel >= courseLevelValue
      })
      .map(enrollment => ({
        ...enrollment,
        hasProgress: courseIdsWithProgress.has(enrollment.courseId)
      }))

    return NextResponse.json({
      courses: enrollments,
      enrollments: enrollments // backward compatibility
    })
  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
