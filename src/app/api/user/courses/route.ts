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
        subscriptionEndDate: true,
        payments: {
          where: { status: 'COMPLETED', amount: { gt: 0 } },
          select: { courseId: true }
        }
      }
    })

    const isSubscriptionValid = user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()
    const purchasedCourseIds = user?.payments.map(p => p.courseId) || []

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

    // Enrollments filtreleme: Abonelik yoksa sadece satın alınan veya ücretsiz kursları göster
    const enrollments = rawEnrollments
      .filter(enrollment => {
        if (isSubscriptionValid) return true // Abonelik varsa hepsi görünür
        if (enrollment.course.price === 0) return true // Ücretsizse görünür
        if (purchasedCourseIds.includes(enrollment.courseId)) return true // Satın alınmışsa görünür
        return false // Aksi halde (sadece abonelikle erişilen ama süresi bitmiş) gizle
      })
      .map(enrollment => ({
        ...enrollment,
        hasProgress: courseIdsWithProgress.has(enrollment.courseId)
      }))

    return NextResponse.json({
      enrollments: enrollments
    })
  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
